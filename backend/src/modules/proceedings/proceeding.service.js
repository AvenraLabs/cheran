import { Op } from "sequelize";
import db from "../../config/db.js";
import {
  ProceedingBatch,
  ProceedingBatchProject,
  FundPercentageMaster,
  GovernmentProject,
  GovernmentProjectStatusHistory,
  Dealer,
  DealerSettlement,
  SchemeTaxSlab,
} from "../../models/initModels.js";
import { getEffectiveSchemeTaxSlab } from "../settings/settings.service.js";
import { calculateDaysBetween } from "../../utils/dates.js";
import AppError from "../../shared/appError.js";

// First Fund Milestone Statuses
const FIRST_FUND_STATUSES = [
  "District First Fund Credited (UTR Updated)",
  "First Fund Credited (UTR Updated)",
  "District First Fund Proceeding Completed",
  "Iamwarm Fund Credited (UTR Updated)",
];

/**
 * Ensure default fund percentage slabs exist (55%, 45%, 60%, 40%, 100%)
 */
export async function seedDefaultFundPercentages() {
  const defaultSlabs = [
    { percentage: 55, label: "55% (First Fund Standard)", is_active: true },
    { percentage: 45, label: "45% (Final Fund Standard)", is_active: true },
    { percentage: 60, label: "60% (40%-SPARSH First Fund)", is_active: true },
    { percentage: 40, label: "40% (40%-SPARSH Final Fund)", is_active: true },
    { percentage: 100, label: "100% (Full Release)", is_active: true },
  ];

  for (const slab of defaultSlabs) {
    const exists = await FundPercentageMaster.findOne({ where: { percentage: slab.percentage } });
    if (!exists) {
      await FundPercentageMaster.create(slab);
    }
  }
}

/**
 * List all active fund percentage slabs
 */
export async function listFundPercentages() {
  await seedDefaultFundPercentages();
  return FundPercentageMaster.findAll({
    where: { is_active: true },
    order: [["percentage", "ASC"]],
  });
}

/**
 * Create a new fund percentage master slab
 */
export async function createFundPercentage({ percentage, label }) {
  const numericPct = parseFloat(percentage);
  if (isNaN(numericPct) || numericPct <= 0 || numericPct > 100) {
    throw new AppError("Percentage must be a valid number between 0 and 100", 400);
  }

  const existing = await FundPercentageMaster.findOne({ where: { percentage: numericPct } });
  if (existing) {
    existing.is_active = true;
    existing.label = label || `${numericPct}%`;
    await existing.save();
    return existing;
  }

  return FundPercentageMaster.create({
    percentage: numericPct,
    label: label || `${numericPct}%`,
    is_active: true,
  });
}

/**
 * Deactivate a fund percentage slab
 */
export async function deleteFundPercentage(id) {
  const slab = await FundPercentageMaster.findByPk(id);
  if (!slab) {
    throw new AppError("Fund percentage slab not found", 404);
  }
  slab.is_active = false;
  await slab.save();
  return { success: true };
}

/**
 * Preview and validate Application IDs from DB before creating batch
 * Strictly checks for:
 * 1. Missing application IDs (unmatched)
 * 2. Missing State Restricted Amounts
 * 3. Missing Invoice Dates
 */
export async function previewProceedingIds({ application_ids_text, fund_percentage_value = 55.0 }) {
  if (!application_ids_text || !application_ids_text.trim()) {
    return {
      matched_count: 0,
      unmatched_count: 0,
      missing_state_restricted_count: 0,
      missing_invoice_date_count: 0,
      total_state_restricted: 0,
      total_fund_share: 0,
      total_net_material_base: 0,
      total_commission: 0,
      total_fittings: 0,
      matched_projects: [],
      unmatched_ids: [],
      missing_state_restricted_ids: [],
      missing_invoice_date_ids: [],
    };
  }

  const rawIds = application_ids_text
    .split(/[\r\n,;\s]+/)
    .map((id) => id.trim())
    .filter((id) => id.length > 0);

  const uniqueAppIds = [...new Set(rawIds)];
  const upperAppIds = uniqueAppIds.map((id) => id.toUpperCase());

  const matchedProjects = await GovernmentProject.findAll({
    where: db.where(db.fn("UPPER", db.col("GovernmentProject.application_id")), {
      [Op.in]: upperAppIds,
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
  for (const proj of matchedProjects) {
    if (proj.application_id) {
      projectMap.set(proj.application_id.trim().toUpperCase(), proj);
    }
  }

  const fundPct = parseFloat(fund_percentage_value) || 55.0;
  let totalStateRestricted = 0;
  let totalFundShare = 0;
  let totalNetMaterialBase = 0;
  let totalCommission = 0;
  let totalFittings = 0;

  const matchedList = [];
  const unmatchedList = [];
  const missingStateRestrictedIds = [];
  const missingInvoiceDateIds = [];

  for (const rawId of uniqueAppIds) {
    const key = rawId.trim().toUpperCase();
    const proj = projectMap.get(key);

    if (proj) {
      const stateRestricted = parseFloat(proj.state_restricted_amount || 0);
      const invoiceDate = proj.invoice_date || null;

      if (!stateRestricted || stateRestricted <= 0) {
        missingStateRestrictedIds.push(proj.application_id);
      }

      if (!invoiceDate) {
        missingInvoiceDateIds.push(proj.application_id);
      }

      // Query dynamic GST from DB settings using project's invoice date
      const taxSlab = await getEffectiveSchemeTaxSlab(invoiceDate);
      const gstPct = parseFloat(taxSlab?.gst_percentage ?? 12.0);
      const fittingsPct = parseFloat(taxSlab?.fittings_percentage ?? 5.0);

      // Calculations (sequential back-out)
      const fundShare = Math.floor(stateRestricted * (fundPct / 100));
      const taxableShare = fundShare / (1 + gstPct / 100);
      const netMaterialBase = Math.floor(taxableShare / (1 + fittingsPct / 100));
      const fittingsAmount = Math.floor(netMaterialBase * (fittingsPct / 100));

      const dealerRate =
        proj.dealer?.commission_percentage !== undefined && proj.dealer?.commission_percentage !== null
          ? parseFloat(proj.dealer.commission_percentage)
          : 20.0;

      const commissionAmount = Math.floor(netMaterialBase * (dealerRate / 100));

      totalStateRestricted += stateRestricted;
      totalFundShare += fundShare;
      totalNetMaterialBase += netMaterialBase;
      totalCommission += commissionAmount;
      totalFittings += fittingsAmount;

      matchedList.push({
        id: proj.id,
        application_id: proj.application_id,
        farmer_name: proj.farmer_name,
        dealer_name: proj.dealer?.name || "Unassigned",
        dealer_rate_percentage: dealerRate,
        invoice_date: invoiceDate,
        state_restricted_amount: stateRestricted,
        fund_share_amount: fundShare,
        gst_percentage: gstPct,
        fittings_percentage: fittingsPct,
        net_material_base: netMaterialBase,
        commission_amount: commissionAmount,
        fittings_amount: fittingsAmount,
        has_state_restricted: stateRestricted > 0,
        has_invoice_date: Boolean(invoiceDate),
      });
    } else {
      unmatchedList.push(rawId);
    }
  }

  return {
    matched_count: matchedList.length,
    unmatched_count: unmatchedList.length,
    missing_state_restricted_count: missingStateRestrictedIds.length,
    missing_invoice_date_count: missingInvoiceDateIds.length,
    total_state_restricted: Math.floor(totalStateRestricted),
    total_fund_share: Math.floor(totalFundShare),
    total_net_material_base: Math.floor(totalNetMaterialBase),
    total_commission: Math.floor(totalCommission),
    total_fittings: Math.floor(totalFittings),
    matched_projects: matchedList,
    unmatched_ids: unmatchedList,
    missing_state_restricted_ids: missingStateRestrictedIds,
    missing_invoice_date_ids: missingInvoiceDateIds,
  };
}

/**
 * Create a new Proceeding Batch with linked project application IDs
 * Enforces strict financial guardrails:
 * - Rejects batch if ANY application ID is unmatched
 * - Rejects batch if ANY project has missing state_restricted_amount
 * - Rejects batch if ANY project has missing invoice_date
 * - Calculates Milestone 1 vs Milestone 2 45-day cycle penalties
 */
export async function createProceedingBatch({
  proceeding_no,
  proceeding_date,
  fund_percentage_id,
  fund_percentage_value = 55.0,
  total_proceeding_amount = 0,
  payment_received_date = null,
  payment_received_ref = null,
  notes,
  application_ids_text,
}) {
  if (!proceeding_date) {
    throw new AppError("Proceeding Date is required", 400);
  }
  if (!application_ids_text || !application_ids_text.trim()) {
    throw new AppError("Please provide at least one Government Project Application ID", 400);
  }

  // Auto-generate batch reference if omitted
  let finalProceedingNo = proceeding_no && proceeding_no.trim() ? proceeding_no.trim() : null;
  if (!finalProceedingNo) {
    const dateTag = String(proceeding_date).replace(/-/g, "").slice(0, 8);
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    finalProceedingNo = `PROC-${dateTag}-${rand}`;
  }

  // Determine fund percentage value
  let finalFundPct = parseFloat(fund_percentage_value);
  if (fund_percentage_id) {
    const slab = await FundPercentageMaster.findByPk(fund_percentage_id);
    if (slab) {
      finalFundPct = slab.percentage;
    }
  }
  if (isNaN(finalFundPct) || finalFundPct <= 0) {
    finalFundPct = 55.0; // fallback default
  }

  // Parse application IDs
  const rawIds = application_ids_text
    .split(/[\r\n,;\s]+/)
    .map((id) => id.trim())
    .filter((id) => id.length > 0);

  const uniqueAppIds = [...new Set(rawIds)];
  if (uniqueAppIds.length === 0) {
    throw new AppError("No valid Application IDs found in input", 400);
  }

  const upperAppIds = uniqueAppIds.map((id) => id.toUpperCase());

  // Query matching government projects with their assigned dealer
  const matchedProjects = await GovernmentProject.findAll({
    where: db.where(db.fn("UPPER", db.col("GovernmentProject.application_id")), {
      [Op.in]: upperAppIds,
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

  // ----------------------------------------------------
  // STRICT GUARDRAIL 1: ZERO PHANTOM / UNMATCHED PROJECTS
  // ----------------------------------------------------
  const unmatchedIds = uniqueAppIds.filter((id) => !projectMap.has(id.trim().toUpperCase()));
  if (unmatchedIds.length > 0) {
    throw new AppError(
      `Cannot create proceeding batch: The following ${unmatchedIds.length} Application ID(s) do not exist in the database:\n${unmatchedIds.join(
        ", "
      )}\nPlease verify and fix these Application IDs before submitting.`,
      400
    );
  }

  // ----------------------------------------------------
  // STRICT GUARDRAIL 2 & 3: MISSING STATE RESTRICTED / INVOICE DATE
  // ----------------------------------------------------
  const missingStateRestricted = [];
  const missingInvoiceDates = [];

  for (const proj of matchedProjects) {
    const sRestricted = parseFloat(proj.state_restricted_amount || 0);
    if (isNaN(sRestricted) || sRestricted <= 0) {
      missingStateRestricted.push(proj.application_id);
    }
    if (!proj.invoice_date) {
      missingInvoiceDates.push(proj.application_id);
    }
  }

  if (missingStateRestricted.length > 0) {
    throw new AppError(
      `Cannot create proceeding batch: The following ${missingStateRestricted.length} project(s) are missing State Restricted Amount:\n${missingStateRestricted.join(
        ", "
      )}\nState Restricted Amount is mandatory for money calculations. Please enter it first.`,
      400
    );
  }

  if (missingInvoiceDates.length > 0) {
    throw new AppError(
      `Cannot create proceeding batch: The following ${missingInvoiceDates.length} project(s) are missing Invoice Date:\n${missingInvoiceDates.join(
        ", "
      )}\nInvoice Date is mandatory to determine the applicable GST slab. Please set the Invoice Date first.`,
      400
    );
  }

  // Pre-load chronological status histories for SLA penalty analysis
  const histories = await GovernmentProjectStatusHistory.findAll({
    where: { project_id: { [Op.in]: matchedProjectIds } },
    order: [["status_date", "ASC"]],
  });

  const historyMap = new Map();
  for (const h of histories) {
    if (!historyMap.has(h.project_id)) {
      historyMap.set(h.project_id, []);
    }
    historyMap.get(h.project_id).push(h);
  }

  const computedTotalStateRestricted = matchedProjects.reduce(
    (sum, p) => sum + parseFloat(p.state_restricted_amount || 0),
    0
  );

  const defaultTotalFundShare = Math.floor(computedTotalStateRestricted * (finalFundPct / 100));
  const userEnteredProceedingAmt = parseFloat(total_proceeding_amount || 0);
  const finalProceedingAmount = userEnteredProceedingAmt > 0 ? userEnteredProceedingAmt : defaultTotalFundShare;

  // Effective fund share ratio across all projects in this batch
  const effectiveFundRatio =
    computedTotalStateRestricted > 0
      ? finalProceedingAmount / computedTotalStateRestricted
      : finalFundPct / 100;

  const isFirstFundMilestone = finalFundPct >= 50.0;
  const batchProjectRows = [];
  let totalCalcCommission = 0;
  let totalCalcFittings = 0;

  for (const rawId of uniqueAppIds) {
    const key = rawId.trim().toUpperCase();
    const proj = projectMap.get(key);

    const invoiceAmt = parseFloat(proj.invoice_amount || 0);
    const subsidyAmt = parseFloat(proj.quotation_subsidy_amount || 0);
    const stateRestricted = parseFloat(proj.state_restricted_amount);

    // Resolve GST rate dynamically from DB using project's invoice_date
    const activeTaxSlab = await getEffectiveSchemeTaxSlab(proj.invoice_date);
    const gstPct = parseFloat(activeTaxSlab?.gst_percentage ?? 12.0);
    const fittingsPct = parseFloat(activeTaxSlab?.fittings_percentage ?? 5.0);

    // Sequential Back-Calculation based on effective fund share
    const fundShare = Math.floor(stateRestricted * effectiveFundRatio);
    const taxableShare = fundShare / (1 + gstPct / 100);
    const netMaterialBase = Math.floor(taxableShare / (1 + fittingsPct / 100));
    const fittingsAmount = Math.floor(netMaterialBase * (fittingsPct / 100));

    // Dealer Base Rate
    const dealerBaseRate =
      proj.dealer?.commission_percentage !== undefined && proj.dealer?.commission_percentage !== null
        ? parseFloat(proj.dealer.commission_percentage)
        : 20.0;

    // ----------------------------------------------------
    // MILESTONE-AWARE 45-DAY CYCLE SLA DELAY PENALTY
    // ----------------------------------------------------
    const projHistories = historyMap.get(proj.id) || [];
    let delayDays = 0;
    let delayCycles = 0;
    let penaltyPoints = 0;

    if (isFirstFundMilestone) {
      // Milestone 1: INVOICED date -> WORK COMPLETION APPROVED date
      const invoicedHistory = projHistories.find((h) => h.status?.toUpperCase() === "INVOICED");
      const invoiceDate = invoicedHistory?.status_date || proj.invoice_date;

      const workCompletionHistory = projHistories.find(
        (h) => h.status?.toUpperCase() === "WORK COMPLETION APPROVED" || h.status?.toUpperCase() === "WORK COMPLETED"
      );
      const workCompletionDate = workCompletionHistory?.status_date || null;

      if (invoiceDate && workCompletionDate) {
        delayDays = Math.max(0, calculateDaysBetween(invoiceDate, workCompletionDate));
        if (delayDays > 45) {
          delayCycles = Math.floor(delayDays / 45);
          penaltyPoints = delayCycles * 1.0; // 1 percentage point per 45-day cycle
        }
      }
    } else {
      // Milestone 2: FIRST FUND CREDITED (UTR UPDATED) date -> JOINT VERIFICATION COMPLETED date
      const firstFundHistory = projHistories.find((h) =>
        FIRST_FUND_STATUSES.some((st) => st.toLowerCase() === h.status?.toLowerCase())
      );
      const firstFundDate = firstFundHistory?.status_date || proj.first_fund_utr_date || null;

      const jvHistory = projHistories.find(
        (h) =>
          h.status?.toUpperCase() === "JOINT VERIFICATION COMPLETED" ||
          h.status?.toUpperCase() === "EARLIER JV COMPLETED"
      );
      const jvCompletedDate = proj.earlier_jv_completed_date || jvHistory?.status_date || null;

      if (firstFundDate && jvCompletedDate) {
        delayDays = Math.max(0, calculateDaysBetween(firstFundDate, jvCompletedDate));
        if (delayDays > 45) {
          delayCycles = Math.floor(delayDays / 45);
          penaltyPoints = delayCycles * 1.0; // 1 percentage point per 45-day cycle
        }
      }
    }

    const commissionAmount = Math.floor(netMaterialBase * (dealerBaseRate / 100));
    const penaltyAmount = Math.floor(netMaterialBase * (penaltyPoints / 100));

    totalCalcCommission += commissionAmount;
    totalCalcFittings += fittingsAmount;

    batchProjectRows.push({
      project_id: proj.id,
      application_id: proj.application_id,
      dealer_id: proj.dealer_id || null,
      farmer_name: proj.farmer_name || null,
      district: proj.district || null,
      fund_type: proj.fund_type || "Regular",
      invoice_amount: invoiceAmt,
      subsidy_amount: subsidyAmt,
      state_restricted_amount: stateRestricted,
      fund_share_amount: fundShare,
      gst_percentage: gstPct,
      fittings_percentage: fittingsPct,
      net_material_base: netMaterialBase,
      dealer_rate_percentage: dealerBaseRate,
      penalty_percentage: penaltyPoints,
      commission_amount: commissionAmount,
      fittings_amount: fittingsAmount,
      delay_days: delayDays,
      penalty_amount: penaltyAmount,
      adjusted_penalty_amount: penaltyAmount,
      is_paid_to_dealer: false,
    });
  }

  // Create batch and project rows in a transaction
  return db.transaction(async (t) => {
    const batch = await ProceedingBatch.create(
      {
        proceeding_no: finalProceedingNo,
        proceeding_date,
        fund_percentage_id: fund_percentage_id || null,
        fund_percentage_value: finalFundPct,
        total_proceeding_amount: finalProceedingAmount,
        payment_received_date: payment_received_date || null,
        payment_received_ref: payment_received_ref ? payment_received_ref.trim() : null,
        total_calculated_commission: totalCalcCommission,
        total_calculated_fittings: totalCalcFittings,
        dealer_payout_status: "UNPAID",
        notes: notes ? notes.trim() : null,
      },
      { transaction: t }
    );

    const projectRecords = batchProjectRows.map((r) => ({
      ...r,
      proceeding_batch_id: batch.id,
    }));

    await ProceedingBatchProject.bulkCreate(projectRecords, { transaction: t });

    return batch;
  });
}

/**
 * List Proceeding Batches with filters & summary totals
 */
export async function listProceedingBatches({
  page = 1,
  limit = 20,
  start_date,
  end_date,
  dealer_id,
  payment_status,
  payout_status,
  search,
}) {
  const where = {};

  if (start_date && end_date) {
    where.proceeding_date = { [Op.between]: [start_date, end_date] };
  } else if (start_date) {
    where.proceeding_date = { [Op.gte]: start_date };
  } else if (end_date) {
    where.proceeding_date = { [Op.lte]: end_date };
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
        model: FundPercentageMaster,
        as: "fund_percentage",
      },
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
      "dealer_payout_status",
    ],
  });

  let totalProceedingValue = 0;
  let totalDealerCommission = 0;
  let totalFittingsValue = 0;
  let totalBankReceivedValue = 0;
  let totalPendingBankValue = 0;

  for (const b of allMatching) {
    const amt = parseFloat(b.total_proceeding_amount || 0);
    const comm = parseFloat(b.total_calculated_commission || 0);
    const fit = parseFloat(b.total_calculated_fittings || 0);

    totalProceedingValue += amt;
    totalDealerCommission += comm;
    totalFittingsValue += fit;

    if (b.payment_received_date) {
      totalBankReceivedValue += amt;
    } else {
      totalPendingBankValue += amt;
    }
  }

  return {
    batches: rows,
    pagination: {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total: count,
      totalPages: Math.ceil(count / limit) || 1,
    },
    summary: {
      total_batches_count: count,
      total_proceeding_value: Math.floor(totalProceedingValue),
      total_dealer_commission: Math.floor(totalDealerCommission),
      total_fittings_value: Math.floor(totalFittingsValue),
      total_bank_received_value: Math.floor(totalBankReceivedValue),
      total_pending_bank_value: Math.floor(totalPendingBankValue),
    },
  };
}

/**
 * Get detailed batch with dealer-wise aggregation and individual project rows
 */
export async function getProceedingBatchById(id) {
  const batch = await ProceedingBatch.findByPk(id, {
    include: [
      {
        model: FundPercentageMaster,
        as: "fund_percentage",
      },
      {
        model: ProceedingBatchProject,
        as: "projects",
        include: [
          {
            model: Dealer,
            as: "dealer",
          },
          {
            model: GovernmentProject,
            as: "project",
          },
        ],
      },
    ],
    order: [[{ model: ProceedingBatchProject, as: "projects" }, "created_at", "ASC"]],
  });

  if (!batch) {
    throw new AppError("Proceeding batch not found", 404);
  }

  // Fetch status histories for all projects in this batch for SLA milestone dates
  const projectIds = batch.projects.map((p) => p.project_id).filter(Boolean);
  const histories =
    projectIds.length > 0
      ? await GovernmentProjectStatusHistory.findAll({
          where: { project_id: { [Op.in]: projectIds } },
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

  // Aggregate Dealer-Wise Breakdown and attach milestone dates to each project
  const dealerMap = new Map();

  for (const item of batch.projects) {
    const projHistories = historyMap.get(item.project_id) || [];

    // Milestone 1 dates (INVOICED -> WORK COMPLETION APPROVED)
    const invoicedHistory = projHistories.find((h) => h.status?.toUpperCase() === "INVOICED");
    const invoiceDate = item.project?.invoice_date || invoicedHistory?.status_date || null;

    const workCompletionHistory = projHistories.find(
      (h) =>
        h.status?.toUpperCase() === "WORK COMPLETION APPROVED" ||
        h.status?.toUpperCase() === "WORK COMPLETED"
    );
    const workCompletionDate = workCompletionHistory?.status_date || null;
    const m1DelayDays =
      invoiceDate && workCompletionDate
        ? Math.max(0, calculateDaysBetween(invoiceDate, workCompletionDate))
        : null;

    // Milestone 2 dates (FIRST FUND CREDITED -> JOINT VERIFICATION COMPLETED)
    const firstFundHistory = projHistories.find((h) =>
      FIRST_FUND_STATUSES.some((st) => st.toLowerCase() === h.status?.toLowerCase())
    );
    const firstFundDate =
      item.project?.first_fund_utr_date || firstFundHistory?.status_date || null;

    const jvHistory = projHistories.find(
      (h) =>
        h.status?.toUpperCase() === "JOINT VERIFICATION COMPLETED" ||
        h.status?.toUpperCase() === "EARLIER JV COMPLETED"
    );
    const jvCompletedDate =
      item.project?.earlier_jv_completed_date || jvHistory?.status_date || null;
    const m2DelayDays =
      firstFundDate && jvCompletedDate
        ? Math.max(0, calculateDaysBetween(firstFundDate, jvCompletedDate))
        : null;

    item.setDataValue("invoice_date", invoiceDate);
    item.setDataValue("work_completion_date", workCompletionDate);
    item.setDataValue("m1_delay_days", m1DelayDays);
    item.setDataValue("first_fund_date", firstFundDate);
    item.setDataValue("jv_completed_date", jvCompletedDate);
    item.setDataValue("m2_delay_days", m2DelayDays);

    const dealerId = item.dealer_id || "UNASSIGNED";
    const dealerName = item.dealer?.name || "Unassigned Dealer";
    const dealerPhone = item.dealer?.phone || "—";
    const dealerDistrict = item.dealer?.district || "—";

    if (!dealerMap.has(dealerId)) {
      dealerMap.set(dealerId, {
        dealer_id: item.dealer_id,
        dealer_name: dealerName,
        dealer_phone: dealerPhone,
        dealer_district: dealerDistrict,
        projects_count: 0,
        total_invoice_amount: 0,
        total_subsidy_amount: 0,
        total_state_restricted: 0,
        total_fund_share: 0,
        total_net_material_base: 0,
        total_commission_amount: 0,
        total_fittings_amount: 0,
        total_penalty_amount: 0,
        total_net_payable: 0,
        is_paid: true,
        paid_date: item.dealer_paid_date || null,
        paid_ref: item.dealer_paid_ref || null,
        project_ids: [],
      });
    }

    const d = dealerMap.get(dealerId);
    const comm = Math.floor(parseFloat(item.commission_amount || 0));
    const fit = Math.floor(parseFloat(item.fittings_amount || 0));
    const pen = Math.floor(parseFloat(item.adjusted_penalty_amount ?? item.penalty_amount ?? 0));

    d.projects_count += 1;
    d.total_invoice_amount += Math.floor(parseFloat(item.invoice_amount || 0));
    d.total_subsidy_amount += Math.floor(parseFloat(item.subsidy_amount || 0));
    d.total_state_restricted += Math.floor(parseFloat(item.state_restricted_amount || 0));
    d.total_fund_share += Math.floor(parseFloat(item.fund_share_amount || 0));
    d.total_net_material_base += Math.floor(parseFloat(item.net_material_base || 0));
    d.total_commission_amount += comm;
    d.total_fittings_amount += fit;
    d.total_penalty_amount += pen;
    d.total_net_payable += Math.max(0, comm + fit - pen);
    d.project_ids.push(item.id);

    if (!item.is_paid_to_dealer) {
      d.is_paid = false;
    }
  }

  const dealerSummaries = Array.from(dealerMap.values()).sort((a, b) =>
    b.total_net_payable - a.total_net_payable
  );

  return {
    batch,
    dealer_summaries: dealerSummaries,
  };
}

/**
 * Manually update/override penalty for an individual project in a proceeding batch
 */
export async function updateProjectPenalty(batchId, projectRecordId, { adjusted_penalty_amount }) {
  const projectRecord = await ProceedingBatchProject.findOne({
    where: {
      id: projectRecordId,
      proceeding_batch_id: batchId,
    },
  });

  if (!projectRecord) {
    throw new AppError("Batch project record not found", 404);
  }

  const newPenalty = Math.max(0, parseFloat(adjusted_penalty_amount) || 0);
  projectRecord.adjusted_penalty_amount = newPenalty;
  await projectRecord.save();

  return getProceedingBatchById(batchId);
}

/**
 * Recalculate all formulas on an existing proceeding batch
 */
export async function recalculateProceedingBatch(id) {
  const batch = await ProceedingBatch.findByPk(id, {
    include: [{ model: ProceedingBatchProject, as: "projects" }],
  });
  if (!batch) throw new AppError("Proceeding batch not found", 404);

  const appIds = batch.projects.map((p) => p.application_id.trim().toUpperCase());
  const matchedProjects = await GovernmentProject.findAll({
    where: db.where(db.fn("UPPER", db.col("GovernmentProject.application_id")), {
      [Op.in]: appIds,
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
  const matchedIds = [];
  for (const proj of matchedProjects) {
    if (proj.application_id) {
      projectMap.set(proj.application_id.trim().toUpperCase(), proj);
      matchedIds.push(proj.id);
    }
  }

  const histories =
    matchedIds.length > 0
      ? await GovernmentProjectStatusHistory.findAll({
          where: { project_id: { [Op.in]: matchedIds } },
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

  const isFirstFundMilestone = batch.fund_percentage_value >= 50.0;
  let totalCalcCommission = 0;
  let totalCalcFittings = 0;

  await db.transaction(async (t) => {
    for (const item of batch.projects) {
      const key = item.application_id.trim().toUpperCase();
      const proj = projectMap.get(key);
      if (proj && proj.state_restricted_amount && proj.invoice_date) {
        const stateRestricted = parseFloat(proj.state_restricted_amount);
        const invoiceAmt = parseFloat(proj.invoice_amount || 0);
        const subsidyAmt = parseFloat(proj.quotation_subsidy_amount || 0);

        const activeTaxSlab = await getEffectiveSchemeTaxSlab(proj.invoice_date);
        const gstPct = parseFloat(activeTaxSlab?.gst_percentage ?? 12.0);
        const fittingsPct = parseFloat(activeTaxSlab?.fittings_percentage ?? 5.0);

        const fundShare = Math.floor(stateRestricted * (batch.fund_percentage_value / 100));
        const taxableShare = fundShare / (1 + gstPct / 100);
        const netMaterialBase = Math.floor(taxableShare / (1 + fittingsPct / 100));
        const fittingsAmount = Math.floor(netMaterialBase * (fittingsPct / 100));

        const dealerBaseRate =
          proj.dealer?.commission_percentage !== undefined && proj.dealer?.commission_percentage !== null
            ? parseFloat(proj.dealer.commission_percentage)
            : 20.0;

        const projHistories = historyMap.get(proj.id) || [];
        let delayDays = 0;
        let delayCycles = 0;
        let penaltyPoints = 0;

        if (isFirstFundMilestone) {
          const invoicedHistory = projHistories.find((h) => h.status?.toUpperCase() === "INVOICED");
          const invoiceDate = invoicedHistory?.status_date || proj.invoice_date;

          const workCompletionHistory = projHistories.find(
            (h) => h.status?.toUpperCase() === "WORK COMPLETION APPROVED" || h.status?.toUpperCase() === "WORK COMPLETED"
          );
          const workCompletionDate = workCompletionHistory?.status_date || null;

          if (invoiceDate && workCompletionDate) {
            delayDays = Math.max(0, calculateDaysBetween(invoiceDate, workCompletionDate));
            if (delayDays > 45) {
              delayCycles = Math.floor(delayDays / 45);
              penaltyPoints = delayCycles * 1.0;
            }
          }
        } else {
          const firstFundHistory = projHistories.find((h) =>
            FIRST_FUND_STATUSES.some((st) => st.toLowerCase() === h.status?.toLowerCase())
          );
          const firstFundDate = firstFundHistory?.status_date || proj.first_fund_utr_date || null;

          const jvHistory = projHistories.find(
            (h) =>
              h.status?.toUpperCase() === "JOINT VERIFICATION COMPLETED" ||
              h.status?.toUpperCase() === "EARLIER JV COMPLETED"
          );
          const jvCompletedDate = proj.earlier_jv_completed_date || jvHistory?.status_date || null;

          if (firstFundDate && jvCompletedDate) {
            delayDays = Math.max(0, calculateDaysBetween(firstFundDate, jvCompletedDate));
            if (delayDays > 45) {
              delayCycles = Math.floor(delayDays / 45);
              penaltyPoints = delayCycles * 1.0;
            }
          }
        }

        const commissionAmount = Math.floor(netMaterialBase * (dealerBaseRate / 100));
        const penaltyAmount = Math.floor(netMaterialBase * (penaltyPoints / 100));

        totalCalcCommission += commissionAmount;
        totalCalcFittings += fittingsAmount;

        await item.update(
          {
            project_id: proj.id,
            application_id: proj.application_id,
            dealer_id: proj.dealer_id || null,
            farmer_name: proj.farmer_name || null,
            district: proj.district || null,
            fund_type: proj.fund_type || "Regular",
            invoice_amount: invoiceAmt,
            subsidy_amount: subsidyAmt,
            state_restricted_amount: stateRestricted,
            fund_share_amount: fundShare,
            gst_percentage: gstPct,
            fittings_percentage: fittingsPct,
            net_material_base: netMaterialBase,
            dealer_rate_percentage: dealerBaseRate,
            penalty_percentage: penaltyPoints,
            commission_amount: commissionAmount,
            fittings_amount: fittingsAmount,
            delay_days: delayDays,
            penalty_amount: penaltyAmount,
            adjusted_penalty_amount: penaltyAmount,
          },
          { transaction: t }
        );
      }
    }

    await batch.update(
      {
        total_calculated_commission: totalCalcCommission,
        total_calculated_fittings: totalCalcFittings,
      },
      { transaction: t }
    );
  });

  return getProceedingBatchById(id);
}

/**
 * Update Bank Payment Received Date & Reference on a Proceeding Batch
 */
export async function updateBankPaymentReceipt(id, { payment_received_date, payment_received_ref }) {
  const batch = await ProceedingBatch.findByPk(id);
  if (!batch) throw new AppError("Proceeding batch not found", 404);

  batch.payment_received_date = payment_received_date || null;
  batch.payment_received_ref = payment_received_ref ? payment_received_ref.trim() : null;
  await batch.save();

  return batch;
}

/**
 * Mark all project commission lines for a specific dealer in a batch as PAID
 * Creates permanent, immutable DealerSettlement financial records
 */
export async function markDealerPayout(batch_id, { dealer_id, paid_date, paid_ref, notes }) {
  const batch = await ProceedingBatch.findByPk(batch_id);
  if (!batch) throw new AppError("Proceeding batch not found", 404);

  const whereClause = { proceeding_batch_id: batch_id };
  if (dealer_id === "UNASSIGNED" || dealer_id === null) {
    whereClause.dealer_id = null;
  } else {
    whereClause.dealer_id = dealer_id;
  }

  const finalPaidDate = paid_date || new Date().toISOString().split("T")[0];
  const finalPaidRef = paid_ref ? paid_ref.trim() : "Direct Bank Transfer / NEFT";

  await db.transaction(async (t) => {
    // Fetch all project records for this dealer in this batch
    const projectsInBatch = await ProceedingBatchProject.findAll({
      where: whereClause,
      transaction: t,
    });

    if (projectsInBatch.length === 0) {
      throw new AppError("No projects found for this dealer in the proceeding batch", 404);
    }

    // 1. Update status on ProceedingBatchProject
    await ProceedingBatchProject.update(
      {
        is_paid_to_dealer: true,
        dealer_paid_date: finalPaidDate,
        dealer_paid_ref: finalPaidRef,
      },
      { where: whereClause, transaction: t }
    );

    // 2. Create immutable DealerSettlement audit accounting entries
    for (const item of projectsInBatch) {
      const commAmt = parseFloat(item.commission_amount || 0);
      const fitAmt = parseFloat(item.fittings_amount || 0);
      const totalPaid = parseFloat((commAmt + fitAmt).toFixed(2));

      await DealerSettlement.create(
        {
          dealer_id: item.dealer_id,
          project_id: item.project_id,
          proceeding_batch_id: batch_id,
          proceeding_batch_project_id: item.id,
          application_id: item.application_id,
          fund_percentage: batch.fund_percentage_value,
          state_restricted_amount: item.state_restricted_amount,
          fund_release_amount: item.fund_share_amount,
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

    // 3. Update overall batch payout status
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
