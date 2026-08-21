import db from "../../config/db.js";
import "../../models/initModels.js";
import GovernmentProject from "../projects/project.model.js";
import GovernmentProjectStatusHistory from "../projects/project-history.model.js";
import Dealer from "./dealer.model.js";
import DealerCommission from "./dealer-commission.model.js";
import Invoice from "../invoices/invoice.model.js";
import AppError from "../../shared/appError.js";
import { calculateDaysBetween } from "../../utils/dates.js";
import { calculateCommissionAndFittingsBreakdown } from "../../utils/finance.js";
import { getEffectiveSchemeTaxSlab } from "../settings/settings.service.js";

const FIRST_FUND_STATUSES = [
  "District First Fund Credited (UTR Updated)",
  "First Fund Credited (UTR Updated)",
  "District First Fund Proceeding Completed",
  "Iamwarm Fund Credited (UTR Updated)",
];

const FINAL_FUND_STATUSES = [
  "Final Fund Credited (UTR Updated)",
  "Final Fund Release Recommended by District Office",
];

/**
 * Calculate full dealer commission breakdown, fittings cost, 45-day aging penalties, and 2-part milestone eligibility
 */
export async function calculateProjectDealerCommission(projectId) {
  const project = await GovernmentProject.findByPk(projectId, {
    include: [
      {
        model: Dealer,
        as: "dealer",
      },
      {
        model: Invoice,
        as: "invoices",
      },
    ],
  });

  if (!project) {
    throw new AppError(`Government Project not found with ID ${projectId}`, 404);
  }

  const dealer = project.dealer;
  const invoices = project.invoices || [];

  // Determine Project Date for Scheme GST Tax Slab lookup
  const projectDate =
    project.invoice_date ||
    project.current_status_date ||
    (project.created_at ? new Date(project.created_at).toISOString().split("T")[0] : null);

  const effectiveSlab = await getEffectiveSchemeTaxSlab(projectDate);
  const applicableGstPct = effectiveSlab.gst_percentage;
  const applicableFittingsPct = effectiveSlab.fittings_percentage;

  // Financial values directly from Government Project (prioritize State Restricted Amount as actual payable amount)
  const rawStateRestricted = parseFloat(project.state_restricted_amount) || 0;
  const rawInvoiceAmount = parseFloat(project.invoice_amount) || 0;
  const rawQuotationSubsidy = parseFloat(project.quotation_subsidy_amount) || 0;
  const rawFarmerContribution = parseFloat(project.farmer_contribution) || 0;

  // Base government subsidy used for commission calculation (Strictly State Restricted Amount)
  const grossGovAmount = rawStateRestricted > 0
    ? rawStateRestricted
    : rawInvoiceAmount > 0
    ? rawInvoiceAmount
    : rawQuotationSubsidy;

  // Government Deduction / Penalty (Invoice Amount - State Restricted Amount)
  const govDeduction = Math.max(0, Math.floor(rawInvoiceAmount - rawStateRestricted));

  // Determine Fund Type and Split Percentages:
  // 40%-SPARSH and SPARSH get 60% / 40% split.
  // Regular and First Fund SNA SPARSH (and others) get 55% / 45% split.
  const fundType = (project.fund_type || "Regular").trim();
  const normalizedFundType = fundType.toUpperCase();
  const is6040 = normalizedFundType === "40%-SPARSH" || normalizedFundType === "SPARSH";
  const fund1SplitPct = is6040 ? 60 : 55;
  const fund2SplitPct = is6040 ? 40 : 45;

  // Base Net Amount and Fittings Cost:
  // Derived after reducing GST and Fittings sequentially, truncated to whole rupees (no decimal paise)
  let baseAmount = 0;
  let fittingsAmount = 0;
  let subsidyBreakdown = null;

  if (grossGovAmount > 0) {
    subsidyBreakdown = calculateCommissionAndFittingsBreakdown(
      grossGovAmount,
      applicableGstPct,
      applicableFittingsPct
    );
    baseAmount = Math.floor(subsidyBreakdown.base_amount);
    fittingsAmount = Math.floor(subsidyBreakdown.fittings_amount);
  } else {
    const netInvoicedAmount = invoices.reduce((sum, inv) => {
      return sum + (parseFloat(inv.net_item_amount) || 0);
    }, 0);
    if (netInvoicedAmount > 0) {
      baseAmount = Math.floor(netInvoicedAmount);
      fittingsAmount = Math.floor(invoices.reduce((sum, inv) => {
        return sum + (parseFloat(inv.fittings_amount) || 0);
      }, 0));
    }
  }

  // If no dealer is assigned to this project, do not calculate or hardcode any commission!
  if (!dealer) {
    return {
      dealer: null,
      fund_type: fundType,
      fund1_split_pct: fund1SplitPct,
      fund2_split_pct: fund2SplitPct,
      financials: {
        quotation_subsidy_amount: Math.floor(rawQuotationSubsidy),
        farmer_contribution: Math.floor(rawFarmerContribution),
        invoice_amount: Math.floor(rawInvoiceAmount),
        state_restricted_amount: Math.floor(rawStateRestricted),
        gov_deduction: govDeduction,
      },
      base_amount: baseAmount,
      fittings_amount: fittingsAmount,
      base_percentage: null,
      penalty_percentage: 0,
      effective_percentage: null,
      total_commission_amount: 0,
      status: "NO_DEALER",
      part1: null,
      part2: null,
      fittings: null,
      breakdown: null,
      commission_record_id: null,
    };
  }

  // Base Commission Percentage strictly from dealer record
  const basePercentage =
    dealer.commission_percentage !== null && dealer.commission_percentage !== undefined
      ? parseFloat(dealer.commission_percentage)
      : 0.0;

  // Original Total Commission before penalties (truncated paise)
  const originalTotalCommission = Math.floor((baseAmount * basePercentage) / 100.0);
  // Fixed penalty amount per 45-day cycle: 1% of ORIGINAL TOTAL COMMISSION
  const fixedPenaltyPerCycle = Math.floor((originalTotalCommission * 1.0) / 100.0);

  // Fetch status history in chronological order
  const histories = await GovernmentProjectStatusHistory.findAll({
    where: { project_id: projectId },
    order: [
      ["status_date", "ASC"],
      ["observed_at", "ASC"],
    ],
  });

  // 1. Phase 1: INVOICED date -> Work Completion Approved date
  const invoicedHistory = histories.find((h) => h.status?.toUpperCase() === "INVOICED");
  const invoiceDate = invoicedHistory?.status_date || project.invoice_date || null;

  const workCompletionHistory = histories.find(
    (h) => h.status?.toUpperCase() === "WORK COMPLETION APPROVED" || h.status?.toUpperCase() === "WORK COMPLETED"
  );
  const workCompletionDate = workCompletionHistory?.status_date || null;

  let phase1DelayDays = 0;
  let phase1Cycles = 0;
  let phase1TotalPenalty = 0;

  // ONLY calculate Phase 1 penalty if BOTH Invoiced date AND Work Completion Approved date are present in history
  if (invoiceDate && workCompletionDate) {
    phase1DelayDays = Math.max(0, calculateDaysBetween(invoiceDate, workCompletionDate));
    if (phase1DelayDays > 45) {
      phase1Cycles = Math.floor(phase1DelayDays / 45);
      phase1TotalPenalty = Math.floor(phase1Cycles * fixedPenaltyPerCycle);
    }
  }

  // Check Milestone Eligibility
  // Milestone 1 (First Fund Release)
  const firstFundHistory = histories.find((h) =>
    FIRST_FUND_STATUSES.some((st) => st.toLowerCase() === h.status?.toLowerCase())
  );
  const isFirstFundReached =
    Boolean(firstFundHistory) ||
    Boolean(project.first_fund_utr_no) ||
    parseFloat(project.first_fund_amount || 0) > 0 ||
    FIRST_FUND_STATUSES.some((st) => st.toLowerCase() === project.current_status?.toLowerCase());

  // 2. Phase 2: First Fund Credited (UTR Updated) -> Joint Verification Completed
  const firstFundDate = firstFundHistory?.status_date || project.first_fund_utr_date || null;

  const jvHistory = histories.find(
    (h) => h.status?.toUpperCase() === "JOINT VERIFICATION COMPLETED"
  );
  const jvCompletedDate = jvHistory?.status_date || null;

  let phase2DelayDays = 0;
  let phase2Cycles = 0;
  let phase2TotalPenalty = 0;

  // ONLY calculate Phase 2 penalty if BOTH First Fund Credited date AND Joint Verification Completed date are present in history
  if (firstFundDate && jvCompletedDate) {
    phase2DelayDays = Math.max(0, calculateDaysBetween(firstFundDate, jvCompletedDate));
    if (phase2DelayDays > 45) {
      phase2Cycles = Math.floor(phase2DelayDays / 45);
      phase2TotalPenalty = Math.floor(phase2Cycles * fixedPenaltyPerCycle);
    }
  }

  // Milestone 2 (Final Fund Release)
  const finalFundHistory = histories.find((h) =>
    FINAL_FUND_STATUSES.some((st) => st.toLowerCase() === h.status?.toLowerCase())
  );
  const isFinalFundReached =
    Boolean(finalFundHistory) ||
    Boolean(project.final_fund_utr_no) ||
    parseFloat(project.final_fund_amount || 0) > 0 ||
    FINAL_FUND_STATUSES.some((st) => st.toLowerCase() === project.current_status?.toLowerCase());

  // Dynamic milestone splits based on Fund Type (60%/40% for SPARSH, 55%/45% for Regular)
  const fund1BaseAmount = Math.floor((originalTotalCommission * fund1SplitPct) / 100.0);
  const fund2BaseAmount = Math.floor(originalTotalCommission - fund1BaseAmount);

  // Deduct Phase 1 penalty from First Fund and Phase 2 penalty from Final Fund
  const part1Amount = Math.max(0, Math.floor(fund1BaseAmount - phase1TotalPenalty));
  const part2Amount = Math.max(0, Math.floor(fund2BaseAmount - phase2TotalPenalty));
  const totalCommissionAmount = Math.floor(part1Amount + part2Amount);
  const totalPenaltyAmount = Math.floor(phase1TotalPenalty + phase2TotalPenalty);
  const totalCycles = phase1Cycles + phase2Cycles;
  const penaltyPercentage = Math.min(100.0, parseFloat((totalCycles * 1.0).toFixed(2)));

  // Effective percentage representation for display
  const effectivePercentage =
    baseAmount > 0
      ? parseFloat(((totalCommissionAmount / baseAmount) * 100.0).toFixed(2))
      : basePercentage;

  const breakdownJson = {
    originalTotalCommission,
    fixedPenaltyPerCycle,
    invoiceDate,
    workCompletionDate,
    phase1DelayDays,
    phase1Cycles,
    phase1TotalPenalty,
    firstFundDate,
    jvCompletedDate,
    phase2DelayDays,
    phase2Cycles,
    phase2TotalPenalty,
    totalPenaltyAmount,
    penaltyPercentage,
    fittingsAmount,
    isFirstFundReached,
    isFinalFundReached,
    finalFundDate: finalFundHistory?.status_date || null,
    invoicesCount: invoices.length,
    fundType,
    fund1SplitPct,
    fund2SplitPct,
    govDeduction,
  };

  return {
    dealer: dealer
      ? {
          id: dealer.id,
          name: dealer.name,
          commission_percentage: basePercentage,
        }
      : null,
    fund_type: fundType,
    fund1_split_pct: fund1SplitPct,
    fund2_split_pct: fund2SplitPct,
    financials: {
      quotation_subsidy_amount: Math.floor(rawQuotationSubsidy),
      farmer_contribution: Math.floor(rawFarmerContribution),
      invoice_amount: Math.floor(rawInvoiceAmount),
      state_restricted_amount: Math.floor(rawStateRestricted),
      gov_deduction: govDeduction,
    },
    applicable_tax_slab: {
      gst_percentage: applicableGstPct,
      fittings_percentage: applicableFittingsPct,
      description: effectiveSlab.description,
      project_date_used: projectDate,
    },
    base_amount: baseAmount,
    fittings_amount: fittingsAmount,
    base_percentage: basePercentage,
    original_commission_amount: originalTotalCommission,
    fixed_penalty_per_cycle: fixedPenaltyPerCycle,
    penalty_percentage: penaltyPercentage,
    penalty_amount: totalPenaltyAmount,
    effective_percentage: effectivePercentage,
    total_commission_amount: totalCommissionAmount,
    part1: {
      percentage: fund1SplitPct,
      amount: part1Amount,
      is_eligible: isFirstFundReached,
    },
    part2: {
      percentage: fund2SplitPct,
      amount: part2Amount,
      is_eligible: isFinalFundReached,
    },
    fittings: {
      percentage: applicableFittingsPct,
      amount: fittingsAmount,
    },
    breakdown: breakdownJson,
  };
}

/**
 * Record payment for Part 1 (55%), Part 2 (45%), or Fittings milestone
 */
export async function recordCommissionMilestonePayment(projectId, { milestone, paid_date, paid_ref, notes }) {
  if (!milestone || !["PART1", "PART2", "FITTINGS"].includes(milestone.toUpperCase())) {
    throw new AppError("Invalid milestone. Must be PART1, PART2, or FITTINGS.", 400);
  }

  const cleanMilestone = milestone.toUpperCase();
  const paymentDate = paid_date || new Date().toISOString().split("T")[0];

  // Refresh calculation first to ensure record exists
  const calculated = await calculateProjectDealerCommission(projectId);
  if (!calculated.commission_record_id) {
    throw new AppError("No dealer assigned to this project or commission record could not be established.", 400);
  }

  const commissionRecord = await DealerCommission.findByPk(calculated.commission_record_id);
  if (!commissionRecord) {
    throw new AppError("Commission record not found.", 404);
  }

  if (cleanMilestone === "PART1") {
    await commissionRecord.update({
      part1_status: "PAID",
      part1_paid_date: paymentDate,
      part1_paid_ref: paid_ref || "Direct Bank Transfer / NEFT",
      part1_notes: notes || null,
    });
  } else if (cleanMilestone === "PART2") {
    await commissionRecord.update({
      part2_status: "PAID",
      part2_paid_date: paymentDate,
      part2_paid_ref: paid_ref || "Direct Bank Transfer / NEFT",
      part2_notes: notes || null,
    });
  } else if (cleanMilestone === "FITTINGS") {
    await commissionRecord.update({
      fittings_status: "PAID",
      fittings_paid_date: paymentDate,
      fittings_paid_ref: paid_ref || "Direct Bank Transfer / NEFT",
      fittings_notes: notes || null,
    });
  }

  // If both commission parts paid, mark parent status as PAID
  if (
    (cleanMilestone === "PART1" && commissionRecord.part2_status === "PAID") ||
    (cleanMilestone === "PART2" && commissionRecord.part1_status === "PAID")
  ) {
    await commissionRecord.update({
      status: "PAID",
      paid_date: paymentDate,
    });
  } else if (cleanMilestone === "PART1" || cleanMilestone === "PART2") {
    await commissionRecord.update({
      status: "APPROVED",
    });
  }

  return await calculateProjectDealerCommission(projectId);
}
