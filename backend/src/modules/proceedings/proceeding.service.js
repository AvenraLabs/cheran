import { Op } from "sequelize";
import db from "../../config/db.js";
import {
  ProceedingBatch,
  ProceedingBatchProject,
  GovernmentProject,
  GovernmentProjectStatusHistory,
  Dealer,
  DealerSettlement,
} from "../../models/initModels.js";
import { getEffectiveSchemeTaxSlab } from "../settings/settings.service.js";
import { calculateDaysBetween } from "../../utils/dates.js";
import { parseProceedingExcel } from "./proceeding-excel-parser.js";
import AppError from "../../shared/appError.js";

// First Fund Milestone Statuses
const FIRST_FUND_STATUSES = [
  "District First Fund Credited (UTR Updated)",
  "First Fund Credited (UTR Updated)",
  "District First Fund Proceeding Completed",
  "Iamwarm Fund Credited (UTR Updated)",
];

/**
 * Preview uploaded Government Proceeding Excel file
 * Parses Excel, resolves projects from DB, calculates total material cost from subsidy eligible amount,
 * calculates dealer commission & 5% fittings, and evaluates milestone SLA delay penalty.
 */
export async function previewProceedingExcel(
  fileBuffer,
  originalFilename = "proceeding.xls",
  includeFittingsOverride = null
) {
  const parsed = parseProceedingExcel(fileBuffer, originalFilename);
  const { detected_fund_percentage, rows, file_name, proceeding_no: extractedProcNo } = parsed;

  const appIds = rows.map((r) => r.application_id.trim().toUpperCase());
  const uniqueAppIds = [...new Set(appIds)];

  // Look up projects in DB (case-insensitive)
  const matchedProjects = await GovernmentProject.findAll({
    where: db.where(db.fn("UPPER", db.col("GovernmentProject.application_id")), {
      [Op.in]: uniqueAppIds,
    }),
    include: [
      {
        model: Dealer,
        as: "dealer",
        attributes: ["id", "name", "commission_percentage"],
      },
    ],
  });

  const projectMap = new Map();
  const matchedProjectIds = [];
  for (const proj of matchedProjects) {
    if (proj.application_id) {
      projectMap.set(proj.application_id.trim().toUpperCase(), proj);
      matchedProjectIds.push(proj.id);
    }
  }

  // Pre-load status history for matched projects to evaluate Milestone 1 & 2 SLA delay
  const histories =
    matchedProjectIds.length > 0
      ? await GovernmentProjectStatusHistory.findAll({
          where: { project_id: { [Op.in]: matchedProjectIds } },
          order: [["status_date", "ASC"]],
        })
      : [];

  const historyMap = new Map();
  for (const h of histories) {
    if (!historyMap.has(h.project_id)) {
      historyMap.set(h.project_id, []);
    }
    historyMap.get(h.project_id).push(h);
  }

  // Auto-detect whether fittings should be included (55% or 60% first fund = true, 40% or 45% second fund = false)
  const isFirstFund = detected_fund_percentage >= 50.0;
  const includeFittings =
    includeFittingsOverride !== null && includeFittingsOverride !== undefined
      ? includeFittingsOverride === true || includeFittingsOverride === "true"
      : isFirstFund;

  let totalSubsidyEligible = 0;
  let totalMaterialCostSum = 0;
  let totalNowReleasedSum = 0;
  let totalDealerCommissionSum = 0;
  let totalFittingsSum = 0;
  let totalPenaltySum = 0;
  let totalNetPayoutSum = 0;

  const processedRows = [];
  const unmatchedIds = [];

  for (const row of rows) {
    const key = row.application_id.trim().toUpperCase();
    const proj = projectMap.get(key);

    const isMatched = Boolean(proj);
    if (!isMatched) {
      unmatchedIds.push(row.application_id);
    }

    const farmerName = proj?.farmer_name || row.farmer_name || "—";
    const district = proj?.district || row.district || "—";
    const block = proj?.block || row.block || "—";
    const village = proj?.village || row.village || "—";
    const invoiceNumber = proj?.invoice_number || row.invoice_number || "—";
    const invoiceDate = proj?.invoice_date || row.invoice_date || null;
    const rawInvoiceAmount = Math.floor(parseFloat(row.invoice_amount || proj?.invoice_amount || 0));

    // Subsidy Eligible Amount (from Excel or DB)
    const subsidyEligible = Math.floor(
      row.subsidy_eligible_amount > 0
        ? row.subsidy_eligible_amount
        : parseFloat(proj?.state_restricted_amount || proj?.quotation_subsidy_amount || rawInvoiceAmount || 0)
    );

    const stateRestricted = Math.floor(parseFloat(proj?.state_restricted_amount || subsidyEligible || 0));
    const nowToBeReleased = Math.floor(row.now_to_be_released_amount || 0);
    const excelGst = Math.floor(row.excel_gst_amount || 0);

    // Resolve GST & Fittings percentage from settings based on project invoice date
    const taxDate = invoiceDate || new Date().toISOString().split("T")[0];
    const taxSlab = await getEffectiveSchemeTaxSlab(taxDate);
    const gstPct = parseFloat(taxSlab?.gst_percentage ?? 12.0);
    const fittingsPct = parseFloat(taxSlab?.fittings_percentage ?? 5.0);

    // 1. Total Project Material Cost (Calculated from Subsidy Eligible Amount 100%)
    // Sequentially back out GST percentage (/ 1 + GST%), then back out 5% fittings (/ 1 + Fittings%)
    const taxableEligible = subsidyEligible > 0 ? subsidyEligible / (1 + gstPct / 100) : 0;
    const totalMaterialCost = taxableEligible > 0 ? Math.floor(taxableEligible / (1 + fittingsPct / 100)) : 0;
    const totalFittings5pct = Math.floor(taxableEligible - totalMaterialCost);

    // Fittings Amount:
    // If includeFittings is true (First fund / checked): full 5% fittings cost calculated from 100% subsidy eligible amount
    // If includeFittings is false (Second fund / unchecked): 0
    const fittingsAmount = includeFittings ? totalFittings5pct : 0;

    // 2. Released Tranche Calculations (Main Base for Dealer Commission)
    // Net Material Base for this milestone tranche = (Total Material Cost * Fund Release %) / 100
    const fundPct = detected_fund_percentage || 55.0;
    const releasedNetMaterial = Math.floor((totalMaterialCost * fundPct) / 100.0);
    const calculatedGst = Math.floor(subsidyEligible - taxableEligible);

    // Dealer Rate
    const dealer = proj?.dealer || null;
    const dealerBaseRate =
      dealer?.commission_percentage !== undefined && dealer?.commission_percentage !== null
        ? Math.floor(parseFloat(dealer.commission_percentage))
        : 20;

    // Milestone 45-day delay penalty analysis & Milestone Dates
    let milestoneType = isFirstFund ? "FIRST_FUND" : "SECOND_FUND";
    let milestoneStartLabel = isFirstFund ? "Invoice Date" : "1st Fund Credited Date";
    let milestoneStartDate = null;
    let milestoneEndLabel = isFirstFund ? "Work Completion Date" : "Joint Verification Date";
    let milestoneEndDate = null;
    let delayDays = 0;
    let penaltyPoints = 0;

    if (proj) {
      const projHistories = historyMap.get(proj.id) || [];
      if (isFirstFund) {
        // Milestone 1: Invoice Date -> Work Completion Date
        const invoicedHistory = projHistories.find((h) => h.status?.toUpperCase() === "INVOICED");
        const invDate = invoicedHistory?.status_date || proj.invoice_date || invoiceDate;
        milestoneStartDate = invDate;

        const wcHistory = projHistories.find(
          (h) =>
            h.status?.toUpperCase() === "WORK COMPLETION APPROVED" ||
            h.status?.toUpperCase() === "WORK COMPLETED" ||
            h.status?.toUpperCase() === "JV RECOMMENDED"
        );
        const wcDate = wcHistory?.status_date || proj.work_order_date || null;
        milestoneEndDate = wcDate;

        if (invDate && wcDate) {
          delayDays = Math.max(0, calculateDaysBetween(invDate, wcDate));
          if (delayDays > 45) {
            penaltyPoints = Math.floor(delayDays / 45); // 1% per 45-day block
          }
        }
      } else {
        // Milestone 2: First Fund Date -> JV Completed Date
        const firstFundHistory = projHistories.find((h) =>
          FIRST_FUND_STATUSES.some((st) => st.toLowerCase() === h.status?.toLowerCase())
        );
        const ffDate = firstFundHistory?.status_date || proj.first_fund_utr_date || row.utr_date || null;
        milestoneStartDate = ffDate;

        const jvHistory = projHistories.find(
          (h) =>
            h.status?.toUpperCase() === "JOINT VERIFICATION COMPLETED" ||
            h.status?.toUpperCase() === "EARLIER JV COMPLETED" ||
            h.status?.toUpperCase() === "JV RECOMMENDED"
        );
        const jvDate = proj.earlier_jv_completed_date || proj.jv_recommended_date || jvHistory?.status_date || null;
        milestoneEndDate = jvDate;

        if (ffDate && jvDate) {
          delayDays = Math.max(0, calculateDaysBetween(ffDate, jvDate));
          if (delayDays > 45) {
            penaltyPoints = Math.floor(delayDays / 45); // 1% per 45-day block
          }
        }
      }
    }

    const commissionAmount = Math.floor(releasedNetMaterial * (dealerBaseRate / 100));
    const penaltyAmount = Math.floor(releasedNetMaterial * (penaltyPoints / 100));
    const netDealerPayout = Math.max(0, commissionAmount + fittingsAmount - penaltyAmount);

    totalSubsidyEligible += subsidyEligible;
    totalMaterialCostSum += totalMaterialCost;
    totalNowReleasedSum += nowToBeReleased;
    totalDealerCommissionSum += commissionAmount;
    totalFittingsSum += fittingsAmount;
    totalPenaltySum += penaltyAmount;
    totalNetPayoutSum += netDealerPayout;

    processedRows.push({
      row_index: row.row_index,
      application_id: row.application_id,
      is_matched_in_db: isMatched,
      project_id: proj?.id || null,
      dealer_id: dealer?.id || null,
      dealer_name: dealer?.name || (isMatched ? "Unassigned Dealer" : "Unassigned (Not in DB)"),
      dealer_rate_percentage: dealerBaseRate,
      farmer_name: farmerName,
      district,
      block,
      village,
      invoice_number: invoiceNumber,
      invoice_date: invoiceDate,
      subsidy_eligible_amount: subsidyEligible,
      invoice_amount: rawInvoiceAmount,
      state_restricted_amount: stateRestricted,
      total_material_cost: totalMaterialCost,
      now_to_be_released_amount: nowToBeReleased,
      excel_gst_amount: excelGst,
      calculated_gst_amount: calculatedGst,
      gst_percentage: gstPct,
      fittings_percentage: fittingsPct,
      net_material_base: releasedNetMaterial,
      milestone_type: milestoneType,
      milestone_start_label: milestoneStartLabel,
      milestone_start_date: milestoneStartDate,
      milestone_end_label: milestoneEndLabel,
      milestone_end_date: milestoneEndDate,
      delay_days: delayDays,
      penalty_percentage: penaltyPoints,
      commission_amount: commissionAmount,
      fittings_amount: fittingsAmount,
      penalty_amount: penaltyAmount,
      net_dealer_payout: netDealerPayout,
      goi_share_amount: Math.floor(row.goi_share_amount || 0),
      state_share_amount: Math.floor(row.state_share_amount || 0),
      addl_state_share_amount: Math.floor(row.addl_state_share_amount || 0),
    });
  }

  return {
    file_name,
    detected_fund_percentage,
    include_fittings: includeFittings,
    proceeding_no: extractedProcNo,
    total_rows_count: rows.length,
    matched_count: matchedProjects.length,
    unmatched_count: unmatchedIds.length,
    unmatched_ids: unmatchedIds,
    summary: {
      total_subsidy_eligible: totalSubsidyEligible,
      total_material_cost: totalMaterialCostSum,
      total_now_released: totalNowReleasedSum,
      total_dealer_commission: totalDealerCommissionSum,
      total_fittings: totalFittingsSum,
      total_penalty: totalPenaltySum,
      total_net_payout: totalNetPayoutSum,
    },
    rows: processedRows,
  };
}

/**
 * Import and save Proceeding Batch from parsed Excel buffer
 */
export async function importProceedingBatch({
  file_buffer,
  original_filename = "proceeding.xls",
  proceeding_no,
  proceeding_date,
  fund_percentage_value,
  include_fittings = null,
  skip_unmatched = false,
  payment_received_date = null,
  payment_received_ref = null,
  notes = null,
}) {
  const preview = await previewProceedingExcel(file_buffer, original_filename, include_fittings);

  const finalProcNo =
    (proceeding_no && proceeding_no.trim()) ||
    preview.proceeding_no ||
    `PROC-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}`;

  const finalProcDate = proceeding_date || new Date().toISOString().split("T")[0];
  const finalFundPct = fund_percentage_value ? parseFloat(fund_percentage_value) : preview.detected_fund_percentage;
  const finalIncludeFittings =
    include_fittings !== null && include_fittings !== undefined
      ? include_fittings === true || include_fittings === "true"
      : preview.include_fittings;

  // Filter rows if user chose to skip unmatched
  const rowsToSave = skip_unmatched
    ? preview.rows.filter((r) => r.is_matched_in_db)
    : preview.rows;

  if (rowsToSave.length === 0) {
    throw new AppError("No valid rows to import after applying filters", 400);
  }

  // Calculate totals from rowsToSave (all integer rounded)
  let totalProceedingAmount = 0;
  let totalCommissionAmount = 0;
  let totalFittingsAmount = 0;

  for (const r of rowsToSave) {
    totalProceedingAmount += Math.floor(r.now_to_be_released_amount || 0);
    totalCommissionAmount += Math.floor(r.commission_amount || 0);
    totalFittingsAmount += Math.floor(r.fittings_amount || 0);
  }

  const result = await db.transaction(async (t) => {
    // 1. Create ProceedingBatch
    const batch = await ProceedingBatch.create(
      {
        proceeding_no: finalProcNo,
        proceeding_date: finalProcDate,
        fund_percentage_id: null,
        fund_percentage_value: finalFundPct,
        include_fittings: finalIncludeFittings,
        total_proceeding_amount: totalProceedingAmount,
        payment_received_date: payment_received_date || null,
        payment_received_ref: payment_received_ref ? payment_received_ref.trim() : null,
        total_calculated_commission: totalCommissionAmount,
        total_calculated_fittings: totalFittingsAmount,
        dealer_payout_status: "UNPAID",
        file_name: original_filename,
        notes: notes ? notes.trim() : null,
      },
      { transaction: t }
    );

    // 2. Create ProceedingBatchProjects
    const batchProjectsPayload = rowsToSave.map((r) => ({
      proceeding_batch_id: batch.id,
      project_id: r.project_id || null,
      application_id: r.application_id,
      dealer_id: r.dealer_id || null,
      farmer_name: r.farmer_name,
      district: r.district,
      block: r.block,
      village: r.village,
      fund_type: `${finalFundPct}% Release`,
      invoice_number: r.invoice_number,
      invoice_date: r.invoice_date,
      invoice_amount: r.invoice_amount,
      subsidy_amount: r.subsidy_eligible_amount,
      state_restricted_amount: r.state_restricted_amount,
      total_material_cost: r.total_material_cost,
      now_to_be_released_amount: r.now_to_be_released_amount,
      excel_gst_amount: r.excel_gst_amount,
      goi_share_amount: r.goi_share_amount,
      state_share_amount: r.state_share_amount,
      addl_state_share_amount: r.addl_state_share_amount,
      fund_share_amount: r.now_to_be_released_amount,
      gst_percentage: r.gst_percentage,
      fittings_percentage: r.fittings_percentage,
      penalty_percentage: r.penalty_percentage,
      net_material_base: r.net_material_base,
      dealer_rate_percentage: r.dealer_rate_percentage,
      commission_amount: r.commission_amount,
      fittings_amount: r.fittings_amount,
      milestone_type: r.milestone_type,
      milestone_start_date: r.milestone_start_date,
      milestone_end_date: r.milestone_end_date,
      delay_days: r.delay_days,
      penalty_amount: r.penalty_amount,
      adjusted_penalty_amount: r.penalty_amount,
      is_paid_to_dealer: false,
    }));

    await ProceedingBatchProject.bulkCreate(batchProjectsPayload, { transaction: t });

    return batch;
  });

  return getProceedingBatchById(result.id);
}

/**
 * List proceeding batches with filtering and pagination
 */
export async function listProceedingBatches(query = {}) {
  const {
    page = 1,
    limit = 20,
    search,
    start_date,
    end_date,
    fund_percentage_value,
    payment_status,
    payout_status,
    dealer_id,
  } = query;

  const where = {};

  if (start_date && end_date) {
    where.proceeding_date = { [Op.between]: [start_date, end_date] };
  } else if (start_date) {
    where.proceeding_date = { [Op.gte]: start_date };
  } else if (end_date) {
    where.proceeding_date = { [Op.lte]: end_date };
  }

  if (fund_percentage_value) {
    where.fund_percentage_value = parseFloat(fund_percentage_value);
  }

  if (payment_status === "RECEIVED") {
    where.payment_received_date = { [Op.ne]: null };
  } else if (payment_status === "PENDING") {
    where.payment_received_date = null;
  }

  if (payout_status) {
    where.dealer_payout_status = payout_status;
  }

  if (search && search.trim()) {
    where[Op.or] = [
      { proceeding_no: { [Op.iLike]: `%${search.trim()}%` } },
      { file_name: { [Op.iLike]: `%${search.trim()}%` } },
      { payment_received_ref: { [Op.iLike]: `%${search.trim()}%` } },
    ];
  }

  const projectIncludeWhere = {};
  if (dealer_id) {
    projectIncludeWhere.dealer_id = dealer_id;
  }

  const offset = (page - 1) * limit;

  const { rows, count } = await ProceedingBatch.findAndCountAll({
    where,
    include: [
      {
        model: ProceedingBatchProject,
        as: "projects",
        where: Object.keys(projectIncludeWhere).length > 0 ? projectIncludeWhere : undefined,
        required: Object.keys(projectIncludeWhere).length > 0,
        include: [
          {
            model: Dealer,
            as: "dealer",
            attributes: ["id", "name"],
          },
        ],
      },
    ],
    order: [["proceeding_date", "DESC"], ["created_at", "DESC"]],
    limit,
    offset,
    distinct: true,
  });

  const allMatching = await ProceedingBatch.findAll({
    where,
    attributes: [
      "id",
      "total_proceeding_amount",
      "total_calculated_commission",
      "total_calculated_fittings",
      "payment_received_date",
    ],
  });

  let totalProceedingValue = 0;
  let totalDealerCommission = 0;
  let totalFittingsValue = 0;
  let totalBankReceivedValue = 0;
  let totalPendingBankValue = 0;

  for (const b of allMatching) {
    const val = Math.floor(parseFloat(b.total_proceeding_amount || 0));
    const comm = Math.floor(parseFloat(b.total_calculated_commission || 0));
    const fit = Math.floor(parseFloat(b.total_calculated_fittings || 0));

    totalProceedingValue += val;
    totalDealerCommission += comm;
    totalFittingsValue += fit;

    if (b.payment_received_date) {
      totalBankReceivedValue += val;
    } else {
      totalPendingBankValue += val;
    }
  }

  return {
    batches: rows,
    pagination: {
      total: count,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      totalPages: Math.ceil(count / limit) || 1,
    },
    summary: {
      total_batches_count: count,
      total_proceeding_value: totalProceedingValue,
      total_dealer_commission: totalDealerCommission,
      total_fittings_value: totalFittingsValue,
      total_bank_received_value: totalBankReceivedValue,
      total_pending_bank_value: totalPendingBankValue,
    },
  };
}

/**
 * Get proceeding batch details by ID with dealer-wise aggregation
 */
export async function getProceedingBatchById(id) {
  const batch = await ProceedingBatch.findByPk(id, {
    include: [
      {
        model: ProceedingBatchProject,
        as: "projects",
        include: [
          {
            model: Dealer,
            as: "dealer",
            attributes: ["id", "name", "commission_percentage"],
          },
          {
            model: GovernmentProject,
            as: "project",
            attributes: ["id", "application_id", "current_status", "farmer_name"],
          },
        ],
      },
    ],
    order: [
      [{ model: ProceedingBatchProject, as: "projects" }, "farmer_name", "ASC"],
    ],
  });

  if (!batch) {
    throw new AppError("Proceeding batch not found", 404);
  }

  const dealerMap = new Map();
  let unmatchedInDbCount = 0;

  for (const item of batch.projects || []) {
    if (!item.project_id) {
      unmatchedInDbCount++;
    }

    const dKey = item.dealer_id || "unassigned";
    if (!dealerMap.has(dKey)) {
      dealerMap.set(dKey, {
        dealer_id: item.dealer_id || null,
        dealer_name: item.dealer?.name || (item.project_id ? "Unassigned Dealer" : "Unassigned (Not in DB)"),
        dealer_phone: "—",
        dealer_district: item.district || "—",
        projects_count: 0,
        total_invoice_amount: 0,
        total_subsidy_amount: 0,
        total_material_cost: 0,
        total_now_to_be_released: 0,
        total_net_material_base: 0,
        total_commission_amount: 0,
        total_fittings_amount: 0,
        total_penalty_amount: 0,
        total_net_payable: 0,
        is_paid: true,
        paid_date: null,
        paid_ref: null,
        project_ids: [],
      });
    }

    const d = dealerMap.get(dKey);
    d.projects_count += 1;
    d.total_invoice_amount += Math.floor(parseFloat(item.invoice_amount || 0));
    d.total_subsidy_amount += Math.floor(parseFloat(item.subsidy_amount || item.state_restricted_amount || 0));
    d.total_material_cost += Math.floor(parseFloat(item.total_material_cost || 0));
    d.total_now_to_be_released += Math.floor(parseFloat(item.now_to_be_released_amount || item.fund_share_amount || 0));
    d.total_net_material_base += Math.floor(parseFloat(item.net_material_base || 0));
    d.total_commission_amount += Math.floor(parseFloat(item.commission_amount || 0));
    d.total_fittings_amount += Math.floor(parseFloat(item.fittings_amount || 0));

    const itemPenalty = Math.floor(
      item.adjusted_penalty_amount !== undefined && item.adjusted_penalty_amount !== null
        ? parseFloat(item.adjusted_penalty_amount)
        : parseFloat(item.penalty_amount || 0)
    );
    d.total_penalty_amount += itemPenalty;

    const itemNet = Math.max(
      0,
      Math.floor(parseFloat(item.commission_amount || 0)) +
        Math.floor(parseFloat(item.fittings_amount || 0)) -
        itemPenalty
    );
    d.total_net_payable += itemNet;

    if (!item.is_paid_to_dealer) {
      d.is_paid = false;
    } else {
      if (item.dealer_paid_date) d.paid_date = item.dealer_paid_date;
      if (item.dealer_paid_ref) d.paid_ref = item.dealer_paid_ref;
    }
    d.project_ids.push(item.id);
  }

  const dealerSummaries = Array.from(dealerMap.values()).sort((a, b) =>
    a.dealer_name.localeCompare(b.dealer_name)
  );

  return {
    batch,
    dealer_summaries: dealerSummaries,
    unmatched_in_db_count: unmatchedInDbCount,
  };
}

/**
 * Recalculate financial amounts for a saved batch
 */
export async function recalculateProceedingBatch(id) {
  const batch = await ProceedingBatch.findByPk(id, {
    include: [{ model: ProceedingBatchProject, as: "projects" }],
  });
  if (!batch) throw new AppError("Proceeding batch not found", 404);

  const matchedProjectIds = batch.projects.map((p) => p.project_id).filter(Boolean);
  const matchedProjects = await GovernmentProject.findAll({
    where: { id: { [Op.in]: matchedProjectIds } },
    include: [
      {
        model: Dealer,
        as: "dealer",
        attributes: ["id", "name", "commission_percentage"],
      },
    ],
  });

  const projectMap = new Map(matchedProjects.map((p) => [p.id, p]));

  const histories =
    matchedProjectIds.length > 0
      ? await GovernmentProjectStatusHistory.findAll({
          where: { project_id: { [Op.in]: matchedProjectIds } },
          order: [["status_date", "ASC"]],
        })
      : [];

  const historyMap = new Map();
  for (const h of histories) {
    if (!historyMap.has(h.project_id)) historyMap.set(h.project_id, []);
    historyMap.get(h.project_id).push(h);
  }

  const isFirstFund = batch.fund_percentage_value >= 50.0;
  const includeFittings = batch.include_fittings;

  let totalProceedingAmount = 0;
  let totalCommissionAmount = 0;
  let totalFittingsAmount = 0;

  await db.transaction(async (t) => {
    for (const item of batch.projects) {
      const proj = item.project_id ? projectMap.get(item.project_id) : null;
      const dealer = proj?.dealer || null;
      const dealerBaseRate =
        dealer?.commission_percentage !== undefined && dealer?.commission_percentage !== null
          ? Math.floor(parseFloat(dealer.commission_percentage))
          : Math.floor(parseFloat(item.dealer_rate_percentage || 20));

      const invoiceDate = proj?.invoice_date || item.invoice_date || null;
      const taxDate = invoiceDate || new Date().toISOString().split("T")[0];
      const taxSlab = await getEffectiveSchemeTaxSlab(taxDate);
      const gstPct = parseFloat(taxSlab?.gst_percentage ?? 12.0);
      const fittingsPct = parseFloat(taxSlab?.fittings_percentage ?? 5.0);

      const subsidyEligible = Math.floor(
        parseFloat(item.subsidy_amount || item.state_restricted_amount || proj?.state_restricted_amount || 0)
      );
      const nowToBeReleased = Math.floor(parseFloat(item.now_to_be_released_amount || item.fund_share_amount || 0));

      const fundPct = batch.fund_percentage_value || 55.0;

      // 1. Total Project Material Cost
      // Sequentially back out GST percentage (/ 1 + GST%), then back out 5% fittings (/ 1 + Fittings%)
      const taxableEligible = subsidyEligible > 0 ? subsidyEligible / (1 + gstPct / 100) : 0;
      const totalMaterialCost = taxableEligible > 0 ? Math.floor(taxableEligible / (1 + fittingsPct / 100)) : 0;
      const totalFittings5pct = Math.floor(taxableEligible - totalMaterialCost);
      const fittingsAmt = includeFittings ? totalFittings5pct : 0;

      // 2. Released Tranche Calculations (Main Base for Dealer Commission)
      const releasedNetMaterial = Math.floor((totalMaterialCost * fundPct) / 100.0);

      let delayDays = 0;
      let penaltyPoints = 0;
      let milestoneStartDate = item.milestone_start_date;
      let milestoneEndDate = item.milestone_end_date;
      let milestoneType = item.milestone_type || (isFirstFund ? "FIRST_FUND" : "SECOND_FUND");

      if (proj) {
        const projHistories = historyMap.get(proj.id) || [];
        if (isFirstFund) {
          const invoicedHistory = projHistories.find((h) => h.status?.toUpperCase() === "INVOICED");
          const invDate = invoicedHistory?.status_date || proj.invoice_date || invoiceDate;
          milestoneStartDate = invDate;

          const wcHistory = projHistories.find(
            (h) =>
              h.status?.toUpperCase() === "WORK COMPLETION APPROVED" ||
              h.status?.toUpperCase() === "WORK COMPLETED" ||
              h.status?.toUpperCase() === "JV RECOMMENDED"
          );
          const wcDate = wcHistory?.status_date || proj.work_order_date || null;
          milestoneEndDate = wcDate;

          if (invDate && wcDate) {
            delayDays = Math.max(0, calculateDaysBetween(invDate, wcDate));
            if (delayDays > 45) {
              penaltyPoints = Math.floor(delayDays / 45);
            }
          }
        } else {
          const firstFundHistory = projHistories.find((h) =>
            FIRST_FUND_STATUSES.some((st) => st.toLowerCase() === h.status?.toLowerCase())
          );
          const ffDate = firstFundHistory?.status_date || proj.first_fund_utr_date || null;
          milestoneStartDate = ffDate;

          const jvHistory = projHistories.find(
            (h) =>
              h.status?.toUpperCase() === "JOINT VERIFICATION COMPLETED" ||
              h.status?.toUpperCase() === "EARLIER JV COMPLETED" ||
              h.status?.toUpperCase() === "JV RECOMMENDED"
          );
          const jvDate = proj.earlier_jv_completed_date || proj.jv_recommended_date || jvHistory?.status_date || null;
          milestoneEndDate = jvDate;

          if (ffDate && jvDate) {
            delayDays = Math.max(0, calculateDaysBetween(ffDate, jvDate));
            if (delayDays > 45) {
              penaltyPoints = Math.floor(delayDays / 45);
            }
          }
        }
      }

      const commissionAmt = Math.floor(releasedNetMaterial * (dealerBaseRate / 100));
      const penaltyAmt = Math.floor(releasedNetMaterial * (penaltyPoints / 100));

      item.total_material_cost = totalMaterialCost;
      item.gst_percentage = gstPct;
      item.fittings_percentage = fittingsPct;
      item.net_material_base = releasedNetMaterial;
      item.dealer_rate_percentage = dealerBaseRate;
      item.commission_amount = commissionAmt;
      item.fittings_amount = fittingsAmt;
      item.milestone_type = milestoneType;
      item.milestone_start_date = milestoneStartDate;
      item.milestone_end_date = milestoneEndDate;
      item.delay_days = delayDays;
      item.penalty_percentage = penaltyPoints;
      item.penalty_amount = penaltyAmt;
      item.adjusted_penalty_amount = penaltyAmt;

      await item.save({ transaction: t });

      totalProceedingAmount += nowToBeReleased;
      totalCommissionAmount += commissionAmt;
      totalFittingsAmount += fittingsAmt;
    }

    batch.total_proceeding_amount = totalProceedingAmount;
    batch.total_calculated_commission = totalCommissionAmount;
    batch.total_calculated_fittings = totalFittingsAmount;
    await batch.save({ transaction: t });
  });

  return getProceedingBatchById(id);
}

/**
 * Update project-level penalty amount
 */
export async function updateProjectPenalty(batch_id, projectRecordId, { adjusted_penalty_amount }) {
  const item = await ProceedingBatchProject.findOne({
    where: { id: projectRecordId, proceeding_batch_id: batch_id },
  });

  if (!item) {
    throw new AppError("Proceeding batch project item not found", 404);
  }

  item.adjusted_penalty_amount = Math.floor(Math.max(0, parseFloat(adjusted_penalty_amount || 0)));
  await item.save();

  return getProceedingBatchById(batch_id);
}

/**
 * Update payment received date on a batch
 */
export async function updateBankPaymentReceipt(batch_id, { payment_received_date, payment_received_ref }) {
  const batch = await ProceedingBatch.findByPk(batch_id);
  if (!batch) throw new AppError("Proceeding batch not found", 404);

  batch.payment_received_date = payment_received_date || null;
  batch.payment_received_ref = payment_received_ref ? payment_received_ref.trim() : null;
  await batch.save();

  return batch;
}

/**
 * Record payout disbursement to a dealer
 */
export async function markDealerPayout(batch_id, { dealer_id, paid_date, paid_ref, adjusted_penalty_amount, notes }) {
  const batch = await ProceedingBatch.findByPk(batch_id);
  if (!batch) throw new AppError("Proceeding batch not found", 404);

  const whereClause = { proceeding_batch_id: batch_id };
  if (dealer_id) {
    whereClause.dealer_id = dealer_id;
  } else {
    whereClause.dealer_id = null;
  }

  const projectsInBatch = await ProceedingBatchProject.findAll({ where: whereClause });
  if (projectsInBatch.length === 0) {
    throw new AppError("No projects found in this batch for the specified dealer", 404);
  }

  const finalPaidDate = paid_date || new Date().toISOString().split("T")[0];
  const finalPaidRef = paid_ref ? paid_ref.trim() : "Direct Bank Transfer / NEFT";

  await db.transaction(async (t) => {
    await ProceedingBatchProject.update(
      {
        is_paid_to_dealer: true,
        dealer_paid_date: finalPaidDate,
        dealer_paid_ref: finalPaidRef,
      },
      { where: whereClause, transaction: t }
    );

    for (const item of projectsInBatch) {
      const commAmt = Math.floor(parseFloat(item.commission_amount || 0));
      const fitAmt = Math.floor(parseFloat(item.fittings_amount || 0));
      const penAmt = Math.floor(parseFloat(item.adjusted_penalty_amount || item.penalty_amount || 0));
      const totalPaid = Math.max(0, commAmt + fitAmt - penAmt);

      await DealerSettlement.create(
        {
          dealer_id: item.dealer_id || "00000000-0000-0000-0000-000000000000",
          project_id: item.project_id,
          proceeding_batch_id: batch_id,
          proceeding_batch_project_id: item.id,
          application_id: item.application_id,
          fund_percentage: batch.fund_percentage_value,
          state_restricted_amount: item.state_restricted_amount || item.subsidy_amount || 0,
          fund_release_amount: item.now_to_be_released_amount || item.fund_share_amount || 0,
          gst_percentage: item.gst_percentage,
          fittings_percentage: item.fittings_percentage,
          dealer_base_rate: item.dealer_rate_percentage,
          penalty_percentage: item.penalty_percentage || 0,
          effective_rate: Math.max(0, (item.dealer_rate_percentage || 0) - (item.penalty_percentage || 0)),
          net_material_base: item.net_material_base,
          commission_amount: commAmt,
          fittings_amount: fitAmt,
          total_paid: totalPaid,
          payment_date: finalPaidDate,
          utr_reference: finalPaidRef,
          notes: notes ? notes.trim() : `Settled from Proceeding Batch #${batch.proceeding_no}`,
        },
        { transaction: t }
      );
    }

    const allProjects = await ProceedingBatchProject.findAll({
      where: { proceeding_batch_id: batch_id },
      transaction: t,
    });

    const paidCount = allProjects.filter((p) => p.is_paid_to_dealer).length;
    if (paidCount === allProjects.length && allProjects.length > 0) {
      batch.dealer_payout_status = "PAID";
    } else if (paidCount > 0) {
      batch.dealer_payout_status = "PARTIAL";
    } else {
      batch.dealer_payout_status = "UNPAID";
    }
    await batch.save({ transaction: t });
  });

  return getProceedingBatchById(batch_id);
}

/**
 * Delete a proceeding batch
 */
export async function deleteProceedingBatch(id) {
  const batch = await ProceedingBatch.findByPk(id);
  if (!batch) throw new AppError("Proceeding batch not found", 404);
  await batch.destroy();
  return { success: true };
}

/**
 * Get Dealer-Wise Commission Payouts & Project Line Items across batches & dates
 */
export async function getDealerCommissionStatement(query = {}) {
  const {
    page = 1,
    limit = 50,
    dealer_id,
    start_date,
    end_date,
    payout_status,
    search,
  } = query;

  const projectWhere = {};
  const batchWhere = {};

  if (dealer_id && dealer_id !== "all") {
    projectWhere.dealer_id = dealer_id;
  }

  if (payout_status === "PAID") {
    projectWhere.is_paid_to_dealer = true;
  } else if (payout_status === "PENDING" || payout_status === "UNPAID") {
    projectWhere.is_paid_to_dealer = false;
  }

  if (start_date && end_date) {
    batchWhere.proceeding_date = { [Op.between]: [start_date, end_date] };
  } else if (start_date) {
    batchWhere.proceeding_date = { [Op.gte]: start_date };
  } else if (end_date) {
    batchWhere.proceeding_date = { [Op.lte]: end_date };
  }

  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    projectWhere[Op.or] = [
      { application_id: { [Op.iLike]: term } },
      { farmer_name: { [Op.iLike]: term } },
      { invoice_number: { [Op.iLike]: term } },
      { village: { [Op.iLike]: term } },
      { district: { [Op.iLike]: term } },
      { block: { [Op.iLike]: term } },
    ];
  }

  const offset = (page - 1) * limit;

  const { rows, count } = await ProceedingBatchProject.findAndCountAll({
    where: projectWhere,
    include: [
      {
        model: ProceedingBatch,
        as: "batch",
        where: Object.keys(batchWhere).length > 0 ? batchWhere : undefined,
        required: true,
      },
      {
        model: Dealer,
        as: "dealer",
        attributes: ["id", "name", "commission_percentage"],
      },
    ],
    order: [
      [{ model: ProceedingBatch, as: "batch" }, "proceeding_date", "DESC"],
      ["created_at", "DESC"],
    ],
    limit: parseInt(limit, 10),
    offset: parseInt(offset, 10),
    distinct: true,
  });

  // Calculate summary totals across all matching projects
  const allMatching = await ProceedingBatchProject.findAll({
    where: projectWhere,
    include: [
      {
        model: ProceedingBatch,
        as: "batch",
        where: Object.keys(batchWhere).length > 0 ? batchWhere : undefined,
        required: true,
        attributes: ["id", "proceeding_no", "proceeding_date", "fund_percentage_value", "include_fittings"],
      },
      {
        model: Dealer,
        as: "dealer",
        attributes: ["id", "name", "commission_percentage"],
      },
    ],
  });

  let total_projects = allMatching.length;
  let total_invoice_amount = 0;
  let total_subsidy_amount = 0;
  let total_material_cost = 0;
  let total_now_released = 0;
  let total_commission = 0;
  let total_fittings = 0;
  let total_penalty = 0;
  let total_net_payable = 0;
  let total_paid_amount = 0;
  let total_pending_amount = 0;

  for (const item of allMatching) {
    const invAmt = Math.floor(parseFloat(item.invoice_amount || 0));
    const subAmt = Math.floor(parseFloat(item.subsidy_amount || item.state_restricted_amount || 0));
    const matCost = Math.floor(parseFloat(item.total_material_cost || 0));
    const nowRel = Math.floor(parseFloat(item.now_to_be_released_amount || item.fund_share_amount || 0));
    const commAmt = Math.floor(parseFloat(item.commission_amount || 0));
    const fitAmt = Math.floor(parseFloat(item.fittings_amount || 0));
    const penAmt = Math.floor(
      parseFloat(
        item.adjusted_penalty_amount !== undefined && item.adjusted_penalty_amount !== null
          ? item.adjusted_penalty_amount
          : item.penalty_amount || 0
      )
    );
    const netPayout = Math.max(0, commAmt + fitAmt - penAmt);

    total_invoice_amount += invAmt;
    total_subsidy_amount += subAmt;
    total_material_cost += matCost;
    total_now_released += nowRel;
    total_commission += commAmt;
    total_fittings += fitAmt;
    total_penalty += penAmt;
    total_net_payable += netPayout;

    if (item.is_paid_to_dealer) {
      total_paid_amount += netPayout;
    } else {
      total_pending_amount += netPayout;
    }
  }

  let selectedDealerInfo = null;
  if (dealer_id && dealer_id !== "all") {
    selectedDealerInfo = await Dealer.findByPk(dealer_id, {
      attributes: ["id", "name", "commission_percentage"],
    });
  }

  return {
    projects: rows,
    summary: {
      total_projects,
      total_invoice_amount,
      total_subsidy_amount,
      total_material_cost,
      total_now_released,
      total_commission,
      total_fittings,
      total_penalty,
      total_net_payable,
      total_paid_amount,
      total_pending_amount,
    },
    selectedDealer: selectedDealerInfo,
    pagination: {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total: count,
      totalPages: Math.ceil(count / limit) || 1,
    },
  };
}
