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

  // Base Net Amount and Fittings Cost:
  // Derived from Quotation Subsidy after reducing GST and Fittings sequentially
  let baseAmount = 0;
  let fittingsAmount = 0;
  let subsidyBreakdown = null;

  if (project.quotation_subsidy_amount && parseFloat(project.quotation_subsidy_amount) > 0) {
    subsidyBreakdown = calculateCommissionAndFittingsBreakdown(
      project.quotation_subsidy_amount,
      applicableGstPct,
      applicableFittingsPct
    );
    baseAmount = subsidyBreakdown.base_amount;
    fittingsAmount = subsidyBreakdown.fittings_amount;
  } else {
    const netInvoicedAmount = invoices.reduce((sum, inv) => {
      return sum + (parseFloat(inv.net_item_amount) || 0);
    }, 0);
    if (netInvoicedAmount > 0) {
      baseAmount = netInvoicedAmount;
      fittingsAmount = invoices.reduce((sum, inv) => {
        return sum + (parseFloat(inv.fittings_amount) || 0);
      }, 0);
    } else if (project.invoice_amount && parseFloat(project.invoice_amount) > 0) {
      subsidyBreakdown = calculateCommissionAndFittingsBreakdown(
        project.invoice_amount,
        applicableGstPct,
        applicableFittingsPct
      );
      baseAmount = subsidyBreakdown.base_amount;
      fittingsAmount = subsidyBreakdown.fittings_amount;
    }
  }

  // If no dealer is assigned to this project, do not calculate or hardcode any commission!
  if (!dealer) {
    return {
      dealer: null,
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

  // Original Total Commission before penalties
  const originalTotalCommission = parseFloat(((baseAmount * basePercentage) / 100.0).toFixed(2));
  // Fixed penalty amount per 45-day cycle: 1% of ORIGINAL TOTAL COMMISSION
  const fixedPenaltyPerCycle = parseFloat(((originalTotalCommission * 1.0) / 100.0).toFixed(2));

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
      phase1TotalPenalty = parseFloat((phase1Cycles * fixedPenaltyPerCycle).toFixed(2));
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
      phase2TotalPenalty = parseFloat((phase2Cycles * fixedPenaltyPerCycle).toFixed(2));
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

  // 55% First Fund Commission and 45% Final Fund Commission base splits
  const fund1BaseAmount = parseFloat(((originalTotalCommission * 55.0) / 100.0).toFixed(2));
  const fund2BaseAmount = parseFloat((originalTotalCommission - fund1BaseAmount).toFixed(2));

  // Deduct Phase 1 penalty from First Fund (55%) and Phase 2 penalty from Final Fund (45%)
  const part1Amount = Math.max(0, parseFloat((fund1BaseAmount - phase1TotalPenalty).toFixed(2)));
  const part2Amount = Math.max(0, parseFloat((fund2BaseAmount - phase2TotalPenalty).toFixed(2)));
  const totalCommissionAmount = parseFloat((part1Amount + part2Amount).toFixed(2));
  const totalPenaltyAmount = parseFloat((phase1TotalPenalty + phase2TotalPenalty).toFixed(2));
  const totalCycles = phase1Cycles + phase2Cycles;
  const penaltyPercentage = Math.min(100.0, parseFloat((totalCycles * 1.0).toFixed(2)));

  // Effective percentage representation for display
  const effectivePercentage =
    baseAmount > 0
      ? parseFloat(((totalCommissionAmount / baseAmount) * 100.0).toFixed(2))
      : basePercentage;

  // Load existing commission record if already created to preserve payment states
  let commissionRecord = await DealerCommission.findOne({
    where: { project_id: projectId },
  });

  const part1Status = commissionRecord?.part1_status === "PAID"
    ? "PAID"
    : "PENDING";

  const part2Status = commissionRecord?.part2_status === "PAID"
    ? "PAID"
    : "PENDING";

  const fittingsStatus = commissionRecord?.fittings_status === "PAID"
    ? "PAID"
    : "PENDING";

  const overallStatus =
    part1Status === "PAID" && part2Status === "PAID"
      ? "PAID"
      : part1Status === "PAID" || part2Status === "PAID"
      ? "APPROVED"
      : "PENDING";

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
  };

  // Upsert Dealer Commission Record
  if (dealer) {
    if (!commissionRecord) {
      commissionRecord = await DealerCommission.create({
        dealer_id: dealer.id,
        project_id: project.id,
        commission_percentage: basePercentage,
        penalty_percentage: penaltyPercentage,
        effective_percentage: effectivePercentage,
        base_amount: baseAmount,
        commission_amount: totalCommissionAmount,
        status: overallStatus,
        part1_percentage: 55.0,
        part1_amount: part1Amount,
        part1_status: part1Status,
        part2_percentage: 45.0,
        part2_amount: part2Amount,
        part2_status: part2Status,
        fittings_amount: fittingsAmount,
        fittings_status: fittingsStatus,
        breakdown_json: breakdownJson,
      });
    } else {
      await commissionRecord.update({
        dealer_id: dealer.id,
        commission_percentage: basePercentage,
        penalty_percentage: penaltyPercentage,
        effective_percentage: effectivePercentage,
        base_amount: baseAmount,
        commission_amount: totalCommissionAmount,
        status: overallStatus,
        part1_percentage: 55.0,
        part1_amount: part1Amount,
        part1_status: part1Status,
        part2_percentage: 45.0,
        part2_amount: part2Amount,
        part2_status: part2Status,
        fittings_amount: fittingsAmount,
        breakdown_json: breakdownJson,
      });
    }
  }

  return {
    dealer: dealer
      ? {
          id: dealer.id,
          name: dealer.name,
          commission_percentage: basePercentage,
        }
      : null,
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
    status: overallStatus,
    part1: {
      percentage: 55.0,
      amount: part1Amount,
      status: part1Status,
      is_eligible: isFirstFundReached,
      paid_date: commissionRecord?.part1_paid_date || null,
      paid_ref: commissionRecord?.part1_paid_ref || null,
      notes: commissionRecord?.part1_notes || null,
    },
    part2: {
      percentage: 45.0,
      amount: part2Amount,
      status: part2Status,
      is_eligible: isFinalFundReached,
      paid_date: commissionRecord?.part2_paid_date || null,
      paid_ref: commissionRecord?.part2_paid_ref || null,
      notes: commissionRecord?.part2_notes || null,
    },
    fittings: {
      percentage: applicableFittingsPct,
      amount: fittingsAmount,
      status: commissionRecord?.fittings_status || "PENDING",
      paid_date: commissionRecord?.fittings_paid_date || null,
      paid_ref: commissionRecord?.fittings_paid_ref || null,
      notes: commissionRecord?.fittings_notes || null,
    },
    breakdown: breakdownJson,
    commission_record_id: commissionRecord?.id || null,
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
