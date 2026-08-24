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
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectId);
  const include = [
    {
      model: Dealer,
      as: "dealer",
    },
    {
      model: Invoice,
      as: "invoices",
    },
  ];

  let project = null;
  if (isUuid) {
    project = await GovernmentProject.findByPk(projectId, { include });
  }
  if (!project) {
    project = await GovernmentProject.findOne({
      where: db.where(db.fn("UPPER", db.col("application_id")), String(projectId).trim().toUpperCase()),
      include,
    });
  }

  if (!project) {
    throw new AppError(`Government Project not found with ID ${projectId}`, 404);
  }

  // If project has dealer_id but dealer association didn't populate, load dealer directly
  let dealer = project.dealer;
  if (!dealer && project.dealer_id) {
    dealer = await Dealer.findByPk(project.dealer_id);
  }

  const invoices = project.invoices || [];

  // Determine Project Date for Scheme GST Tax Slab lookup strictly from invoice_date (or status date)
  const projectDate = project.invoice_date || project.current_status_date || null;
  const effectiveSlab = await getEffectiveSchemeTaxSlab(projectDate);
  const applicableGstPct = parseFloat(effectiveSlab.gst_percentage ?? 12.0);
  const applicableFittingsPct = parseFloat(effectiveSlab.fittings_percentage ?? 5.0);

  // Financial values directly from Government Project (Always use State Restricted Amount)
  const rawStateRestricted = parseFloat(project.state_restricted_amount) || 0;
  const rawInvoiceAmount = parseFloat(project.invoice_amount) || 0;
  const rawQuotationSubsidy = parseFloat(project.quotation_subsidy_amount) || 0;
  const rawFarmerContribution = parseFloat(project.farmer_contribution) || 0;

  // Base Net Amount and Fittings Cost (Sequential Back-Out using State Restricted Amount)
  // If state_restricted_amount is 0/null, fallback to invoice_amount
  const calculationBaseGross = rawStateRestricted > 0 ? rawStateRestricted : rawInvoiceAmount;
  let baseAmount = 0;
  let fittingsAmount = 0;

  if (calculationBaseGross > 0) {
    const taxable = calculationBaseGross / (1 + applicableGstPct / 100);
    baseAmount = Math.floor(taxable / (1 + applicableFittingsPct / 100));
    fittingsAmount = Math.floor(taxable - baseAmount);
  }

  const govDeduction = Math.max(0, rawInvoiceAmount - (rawStateRestricted || rawInvoiceAmount));

  // If no dealer is assigned to this project, return clear NO_DEALER response
  if (!dealer) {
    return {
      dealer: null,
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
      base_percentage: null,
      penalty_percentage: 0,
      effective_percentage: null,
      total_commission_amount: 0,
      status: "NO_DEALER",
      part1: null,
      part2: null,
      fittings: null,
    };
  }

  // Base Commission Percentage strictly from dealer record
  const basePercentage =
    dealer.commission_percentage !== null && dealer.commission_percentage !== undefined
      ? parseFloat(dealer.commission_percentage)
      : 20.0;

  // Fetch status history in chronological order
  const histories = await GovernmentProjectStatusHistory.findAll({
    where: { project_id: project.id },
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
  let phase1PenaltyPoints = 0;

  if (invoiceDate && workCompletionDate) {
    phase1DelayDays = Math.max(0, calculateDaysBetween(invoiceDate, workCompletionDate));
    if (phase1DelayDays > 45) {
      phase1Cycles = Math.floor(phase1DelayDays / 45);
      phase1PenaltyPoints = phase1Cycles * 1.0; // 1% point penalty per 45-day cycle
    }
  }

  // 2. Phase 2: First Fund Credited (UTR Updated) -> Joint Verification Completed
  const firstFundHistory = histories.find((h) =>
    FIRST_FUND_STATUSES.some((st) => st.toLowerCase() === h.status?.toLowerCase())
  );
  const firstFundDate = firstFundHistory?.status_date || project.first_fund_utr_date || null;

  const jvHistory = histories.find(
    (h) => h.status?.toUpperCase() === "JOINT VERIFICATION COMPLETED"
  );
  const jvCompletedDate = jvHistory?.status_date || null;

  let phase2DelayDays = 0;
  let phase2Cycles = 0;
  let phase2PenaltyPoints = 0;

  if (firstFundDate && jvCompletedDate) {
    phase2DelayDays = Math.max(0, calculateDaysBetween(firstFundDate, jvCompletedDate));
    if (phase2DelayDays > 45) {
      phase2Cycles = Math.floor(phase2DelayDays / 45);
      phase2PenaltyPoints = phase2Cycles * 1.0; // 1% point penalty per 45-day cycle
    }
  }

  // Milestone 1 Eligibility
  const isFirstFundReached =
    Boolean(firstFundHistory) ||
    Boolean(project.first_fund_utr_no) ||
    parseFloat(project.first_fund_amount || 0) > 0 ||
    FIRST_FUND_STATUSES.some((st) => st.toLowerCase() === project.current_status?.toLowerCase());

  // Milestone 2 Eligibility (Final Fund Release)
  const finalFundHistory = histories.find((h) =>
    FINAL_FUND_STATUSES.some((st) => st.toLowerCase() === h.status?.toLowerCase())
  );
  const isFinalFundReached =
    Boolean(finalFundHistory) ||
    Boolean(project.final_fund_utr_no) ||
    parseFloat(project.second_fund_amount || project.final_fund_amount || 0) > 0 ||
    FINAL_FUND_STATUSES.some((st) => st.toLowerCase() === project.current_status?.toLowerCase());

  const fundType = (project.fund_type || "Regular").trim();
  const normalizedFundType = fundType.toUpperCase();
  const is6040 = normalizedFundType === "40%-SPARSH" || normalizedFundType === "SPARSH";
  const fund1SplitPct = is6040 ? 60 : 55;
  const fund2SplitPct = is6040 ? 40 : 45;

  // Base split of net material for each milestone
  const fund1NetMaterial = Math.floor((baseAmount * fund1SplitPct) / 100.0);
  const fund2NetMaterial = Math.floor(baseAmount - fund1NetMaterial);

  // Effective rates for each milestone (Dealer Base Rate - Milestone SLA Penalty Points)
  const effectivePart1Rate = Math.max(0, basePercentage - phase1PenaltyPoints);
  const effectivePart2Rate = Math.max(0, basePercentage - phase2PenaltyPoints);

  const part1Amount = Math.floor((fund1NetMaterial * effectivePart1Rate) / 100.0);
  const part2Amount = Math.floor((fund2NetMaterial * effectivePart2Rate) / 100.0);

  const originalPart1Commission = Math.floor((fund1NetMaterial * basePercentage) / 100.0);
  const originalPart2Commission = Math.floor((fund2NetMaterial * basePercentage) / 100.0);
  const originalTotalCommission = originalPart1Commission + originalPart2Commission;

  const phase1TotalPenalty = originalPart1Commission - part1Amount;
  const phase2TotalPenalty = originalPart2Commission - part2Amount;
  const totalPenaltyAmount = phase1TotalPenalty + phase2TotalPenalty;
  const totalPenaltyPoints = phase1PenaltyPoints + phase2PenaltyPoints;
  const totalCommissionAmount = part1Amount + part2Amount;

  // Effective percentage representation for display
  const effectivePercentage =
    baseAmount > 0
      ? parseFloat(((totalCommissionAmount / baseAmount) * 100.0).toFixed(2))
      : basePercentage;

  // Find or Create Dealer Commission Record for Tracking
  let commissionRecord = await DealerCommission.findOne({
    where: { project_id: project.id },
  });

  const breakdownJson = {
    originalTotalCommission,
    invoiceDate,
    workCompletionDate,
    phase1DelayDays,
    phase1Cycles,
    phase1PenaltyPoints,
    phase1TotalPenalty,
    firstFundDate,
    jvCompletedDate,
    phase2DelayDays,
    phase2Cycles,
    phase2PenaltyPoints,
    phase2TotalPenalty,
    totalPenaltyAmount,
    fittingsAmount,
    isFirstFundReached,
    isFinalFundReached,
    finalFundDate: finalFundHistory?.status_date || null,
    invoicesCount: invoices.length,
    fundType,
    fund1SplitPct,
    fund2SplitPct,
  };

  if (!commissionRecord) {
    commissionRecord = await DealerCommission.create({
      dealer_id: dealer.id,
      project_id: project.id,
      commission_percentage: basePercentage,
      penalty_percentage: totalPenaltyPoints,
      effective_percentage: effectivePercentage,
      base_amount: baseAmount,
      commission_amount: totalCommissionAmount,
      part1_percentage: fund1SplitPct,
      part1_amount: part1Amount,
      part1_status: isFirstFundReached ? "UNPAID" : "LOCKED",
      part2_percentage: fund2SplitPct,
      part2_amount: part2Amount,
      part2_status: isFinalFundReached ? "UNPAID" : "LOCKED",
      fittings_amount: fittingsAmount,
      fittings_status: "PENDING",
      breakdown_json: breakdownJson,
      status: "PENDING",
    });
  } else {
    // Keep amounts and calculations up to date
    await commissionRecord.update({
      dealer_id: dealer.id,
      commission_percentage: basePercentage,
      penalty_percentage: totalPenaltyPoints,
      effective_percentage: effectivePercentage,
      base_amount: baseAmount,
      commission_amount: totalCommissionAmount,
      part1_percentage: fund1SplitPct,
      part1_amount: part1Amount,
      part1_status: commissionRecord.part1_status === "PAID" ? "PAID" : isFirstFundReached ? "UNPAID" : "LOCKED",
      part2_percentage: fund2SplitPct,
      part2_amount: part2Amount,
      part2_status: commissionRecord.part2_status === "PAID" ? "PAID" : isFinalFundReached ? "UNPAID" : "LOCKED",
      fittings_amount: fittingsAmount,
      breakdown_json: breakdownJson,
    });
  }

  return {
    commission_record_id: commissionRecord.id,
    dealer: {
      id: dealer.id,
      name: dealer.name,
      commission_percentage: basePercentage,
    },
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
    fixed_penalty_per_cycle: 1.0,
    penalty_percentage: totalPenaltyPoints,
    penalty_amount: totalPenaltyAmount,
    effective_percentage: effectivePercentage,
    total_commission_amount: totalCommissionAmount,
    part1: {
      percentage: fund1SplitPct,
      amount: part1Amount,
      is_eligible: isFirstFundReached,
      status: commissionRecord.part1_status,
      paid_date: commissionRecord.part1_paid_date,
      paid_ref: commissionRecord.part1_paid_ref,
    },
    part2: {
      percentage: fund2SplitPct,
      amount: part2Amount,
      is_eligible: isFinalFundReached,
      status: commissionRecord.part2_status,
      paid_date: commissionRecord.part2_paid_date,
      paid_ref: commissionRecord.part2_paid_ref,
    },
    fittings: {
      percentage: applicableFittingsPct,
      amount: fittingsAmount,
      status: commissionRecord.fittings_status,
      paid_date: commissionRecord.fittings_paid_date,
      paid_ref: commissionRecord.fittings_paid_ref,
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
