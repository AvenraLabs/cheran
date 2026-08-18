import db from "../../config/db.js";
import "../../models/initModels.js";
import GovernmentProject from "../projects/project.model.js";
import GovernmentProjectStatusHistory from "../projects/project-history.model.js";
import Dealer from "./dealer.model.js";
import DealerCommission from "./dealer-commission.model.js";
import Invoice from "../invoices/invoice.model.js";
import AppError from "../../shared/appError.js";
import { calculateDaysBetween } from "../../utils/dates.js";

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

  // Base Net Amount from linked invoices (sum of net_item_amount)
  const netInvoicedAmount = invoices.reduce((sum, inv) => {
    return sum + (parseFloat(inv.net_item_amount) || 0);
  }, 0);

  // Fallback to project invoice_amount if no detailed invoice records attached
  const baseAmount = netInvoicedAmount > 0 ? netInvoicedAmount : parseFloat(project.invoice_amount) || 0;

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

  // Find first status transition that occurred AFTER INVOICED
  const postInvoiceHistories = histories.filter(
    (h) => h.status !== "INVOICED" && h.status_date >= baselineInvoiceDate
  );

  // Phase 1 Stagnation Days Calculation (From INVOICED date)
  let phase1DelayDays = 0;
  let phase1EndDate = todayStr;

  if (postInvoiceHistories.length > 0) {
    // Project moved to next status: delay is time between invoice date and first post-invoice status date
    phase1EndDate = postInvoiceHistories[0].status_date;
    phase1DelayDays = Math.max(0, calculateDaysBetween(baselineInvoiceDate, phase1EndDate));
  } else {
    // Project is still stagnated at INVOICED
    phase1EndDate = todayStr;
    phase1DelayDays = Math.max(0, calculateDaysBetween(baselineInvoiceDate, todayStr));
  }

  // 1% penalty for every 45-day block of stagnation from INVOICED date
  const phase1PenaltyPercentage = Math.floor(phase1DelayDays / 45) * 1.0;
  const effectivePercentage = Math.max(0, basePercentage - phase1PenaltyPercentage);

  // Total Commission Value
  const totalCommissionAmount = (baseAmount * effectivePercentage) / 100.0;

  // Part 1 (55%) and Part 2 (45%) allocations
  const part1Percentage = 55.0;
  let part1Amount = (totalCommissionAmount * 55.0) / 100.0;

  const part2Percentage = 45.0;
  let part2Amount = (totalCommissionAmount * 45.0) / 100.0;

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
  let phase2PenaltyPercentage = 0;

  if (isFirstFundReached) {
    const firstFundDate = firstFundHistory?.status_date || project.current_status_date || todayStr;
    const finalFundDate = finalFundHistory?.status_date;

    if (finalFundDate) {
      phase2DelayDays = Math.max(0, calculateDaysBetween(firstFundDate, finalFundDate));
    } else {
      phase2DelayDays = Math.max(0, calculateDaysBetween(firstFundDate, todayStr));
    }

    if (phase2DelayDays >= 45) {
      phase2PenaltyPercentage = Math.floor(phase2DelayDays / 45) * 1.0;
      // Deduct 1% per 45 days from part 2 remaining amount
      const part2Deduction = (baseAmount * (phase2PenaltyPercentage / 100.0) * 45.0) / 100.0;
      part2Amount = Math.max(0, part2Amount - part2Deduction);
    }
  }

  // Load existing commission record if already created to preserve payment states
  let commissionRecord = await DealerCommission.findOne({
    where: { project_id: projectId },
  });

  const part1Status = commissionRecord?.part1_status === "PAID"
    ? "PAID"
    : isFirstFundReached
    ? "ELIGIBLE"
    : "LOCKED";

  const part2Status = commissionRecord?.part2_status === "PAID"
    ? "PAID"
    : isFinalFundReached
    ? "ELIGIBLE"
    : "LOCKED";

  const overallStatus =
    part1Status === "PAID" && part2Status === "PAID"
      ? "PAID"
      : part1Status === "PAID" || part2Status === "PAID"
      ? "APPROVED"
      : "PENDING";

  const breakdownJson = {
    baselineInvoiceDate,
    phase1EndDate,
    phase1DelayDays,
    phase1PenaltyPercentage,
    phase2DelayDays,
    phase2PenaltyPercentage,
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
        penalty_percentage: phase1PenaltyPercentage + phase2PenaltyPercentage,
        effective_percentage: effectivePercentage,
        base_amount: baseAmount,
        commission_amount: totalCommissionAmount,
        status: overallStatus,
        part1_percentage: part1Percentage,
        part1_amount: part1Amount,
        part1_status: part1Status,
        part2_percentage: part2Percentage,
        part2_amount: part2Amount,
        part2_status: part2Status,
        breakdown_json: breakdownJson,
      });
    } else {
      await commissionRecord.update({
        dealer_id: dealer.id,
        commission_percentage: basePercentage,
        penalty_percentage: phase1PenaltyPercentage + phase2PenaltyPercentage,
        effective_percentage: effectivePercentage,
        base_amount: baseAmount,
        commission_amount: totalCommissionAmount,
        status: overallStatus,
        part1_percentage: part1Percentage,
        part1_amount: part1Amount,
        part1_status: part1Status,
        part2_percentage: part2Percentage,
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
    base_amount: baseAmount,
    base_percentage: basePercentage,
    penalty_percentage: phase1PenaltyPercentage + phase2PenaltyPercentage,
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
