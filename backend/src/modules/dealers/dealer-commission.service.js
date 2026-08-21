import db from "../../config/db.js";
import "../../models/initModels.js";
import GovernmentProject from "../projects/project.model.js";
import GovernmentProjectStatusHistory from "../projects/project-history.model.js";
import Dealer from "./dealer.model.js";
import DealerCommission from "./dealer-commission.model.js";
import Invoice from "../invoices/invoice.model.js";
import AppError from "../../shared/appError.js";
import { calculateDaysBetween } from "../../utils/dates.js";
import { calculateCommissionBase } from "../../utils/finance.js";
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
 * Calculate full dealer commission breakdown, 45-day aging penalties, and 2-part milestone eligibility
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

  // Base Net Amount:
  // Dynamically uses effective GST rate (e.g. 12% for pre-22-Sep-2025, 5% for post-22-Sep-2025)
  let baseAmount = 0;
  if (project.quotation_subsidy_amount && parseFloat(project.quotation_subsidy_amount) > 0) {
    baseAmount = calculateCommissionBase(
      project.quotation_subsidy_amount,
      applicableGstPct,
      applicableFittingsPct
    );
  } else {
    const netInvoicedAmount = invoices.reduce((sum, inv) => {
      return sum + (parseFloat(inv.net_item_amount) || 0);
    }, 0);
    if (netInvoicedAmount > 0) {
      baseAmount = netInvoicedAmount;
    } else if (project.invoice_amount && parseFloat(project.invoice_amount) > 0) {
      baseAmount = calculateCommissionBase(
        project.invoice_amount,
        applicableGstPct,
        applicableFittingsPct
      );
    }
  }

  // If no dealer is assigned to this project, do not calculate or hardcode any commission!
  if (!dealer) {
    return {
      dealer: null,
      base_amount: baseAmount,
      base_percentage: null,
      penalty_percentage: 0,
      effective_percentage: null,
      total_commission_amount: 0,
      status: "NO_DEALER",
      part1: null,
      part2: null,
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

  const todayStr = new Date().toISOString().split("T")[0];
  const invoiceDateStr = project.invoice_date || project.current_status_date || todayStr;

  // Find INVOICED status date
  const invoicedHistory = histories.find((h) => h.status === "INVOICED");
  const baselineInvoiceDate = invoicedHistory?.status_date || invoiceDateStr;

  // Collect all possible post-invoice dates from history and project milestone fields to find the earliest/lowest progression date
  const candidateDates = [];

  for (const h of histories) {
    if (h.status !== "INVOICED" && h.status_date) {
      candidateDates.push(h.status_date);
    }
  }

  // Include project milestone date fields if populated
  if (project.work_order_date) candidateDates.push(project.work_order_date);
  if (project.supply_date) candidateDates.push(project.supply_date);
  if (project.current_status !== "INVOICED" && project.current_status_date) {
    candidateDates.push(project.current_status_date);
  }

  // Filter for dates occurring on or after baseline invoice date and sort ascending to find lowest date
  const validNextDates = candidateDates
    .filter((d) => d && typeof d === "string" && d.trim() !== "" && d >= baselineInvoiceDate)
    .sort();

  // Phase 1 Stagnation Days Calculation (From INVOICED date to lowest/earliest next status date)
  let phase1DelayDays = 0;
  let phase1EndDate = todayStr;

  if (validNextDates.length > 0) {
    // Pick the lowest / earliest next status date possible
    phase1EndDate = validNextDates[0];
    phase1DelayDays = Math.max(0, calculateDaysBetween(baselineInvoiceDate, phase1EndDate));
  } else {
    // Project is still stagnated at INVOICED
    phase1EndDate = todayStr;
    phase1DelayDays = Math.max(0, calculateDaysBetween(baselineInvoiceDate, todayStr));
  }

  // Phase 1 penalty: fixedPenaltyPerCycle (1% of original total) per 45-day block
  const phase1Cycles = Math.floor(phase1DelayDays / 45);
  const phase1TotalPenalty = parseFloat((phase1Cycles * fixedPenaltyPerCycle).toFixed(2));

  // Commission after Phase 1 penalty split 55% / 45%
  const totalAfterPhase1 = Math.max(0, parseFloat((originalTotalCommission - phase1TotalPenalty).toFixed(2)));
  const fund1BaseAmount = parseFloat(((totalAfterPhase1 * 55.0) / 100.0).toFixed(2));
  const fund2BaseAmount = parseFloat((totalAfterPhase1 - fund1BaseAmount).toFixed(2));

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

  // Milestone 2 (Final Fund Release)
  const finalFundHistory = histories.find((h) =>
    FINAL_FUND_STATUSES.some((st) => st.toLowerCase() === h.status?.toLowerCase())
  );
  const isFinalFundReached =
    Boolean(finalFundHistory) ||
    Boolean(project.final_fund_utr_no) ||
    parseFloat(project.final_fund_amount || 0) > 0 ||
    FINAL_FUND_STATUSES.some((st) => st.toLowerCase() === project.current_status?.toLowerCase());

  // Phase 2 Stagnation Days Calculation (From First Fund date to Final Fund or Today)
  let phase2DelayDays = 0;
  let phase2Cycles = 0;
  let phase2TotalPenalty = 0;

  if (isFirstFundReached) {
    const firstFundDate = firstFundHistory?.status_date || project.current_status_date || todayStr;
    const finalFundDate = finalFundHistory?.status_date;

    if (finalFundDate) {
      phase2DelayDays = Math.max(0, calculateDaysBetween(firstFundDate, finalFundDate));
    } else {
      phase2DelayDays = Math.max(0, calculateDaysBetween(firstFundDate, todayStr));
    }

    phase2Cycles = Math.floor(phase2DelayDays / 45);
    phase2TotalPenalty = parseFloat((phase2Cycles * fixedPenaltyPerCycle).toFixed(2));
  }

  // Part 1 (55%) and Part 2 (45%) strictly deducting Phase 2 penalty from remaining unpaid commission (Fund 2)
  const part1Amount = fund1BaseAmount;
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

  const overallStatus =
    part1Status === "PAID" && part2Status === "PAID"
      ? "PAID"
      : part1Status === "PAID" || part2Status === "PAID"
      ? "APPROVED"
      : "PENDING";

  const breakdownJson = {
    originalTotalCommission,
    fixedPenaltyPerCycle,
    baselineInvoiceDate,
    phase1EndDate,
    phase1DelayDays,
    phase1Cycles,
    phase1TotalPenalty,
    phase2DelayDays,
    phase2Cycles,
    phase2TotalPenalty,
    totalPenaltyAmount,
    penaltyPercentage,
    isFirstFundReached,
    firstFundDate: firstFundHistory?.status_date || null,
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
    breakdown: breakdownJson,
    commission_record_id: commissionRecord?.id || null,
  };
}

/**
 * Record payment for Part 1 (55%) or Part 2 (45%) milestone
 */
export async function recordCommissionMilestonePayment(projectId, { milestone, paid_date, paid_ref, notes }) {
  if (!milestone || !["PART1", "PART2"].includes(milestone.toUpperCase())) {
    throw new AppError("Invalid milestone. Must be PART1 or PART2.", 400);
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
  }

  // If both parts paid, mark parent status as PAID
  if (
    (cleanMilestone === "PART1" && commissionRecord.part2_status === "PAID") ||
    (cleanMilestone === "PART2" && commissionRecord.part1_status === "PAID")
  ) {
    await commissionRecord.update({
      status: "PAID",
      paid_date: paymentDate,
    });
  } else {
    await commissionRecord.update({
      status: "APPROVED",
    });
  }

  return await calculateProjectDealerCommission(projectId);
}
