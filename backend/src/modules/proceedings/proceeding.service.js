import { Op } from "sequelize";
import db from "../../config/db.js";
import {
  ProceedingBatch,
  ProceedingBatchProject,
  FundPercentageMaster,
  GovernmentProject,
  Dealer,
  SchemeTaxSlab,
} from "../../models/initModels.js";
import GovernmentProjectStatusHistory from "../projects/project-history.model.js";
import { getEffectiveSchemeTaxSlab } from "../settings/settings.service.js";
import { calculateDaysBetween } from "../../utils/dates.js";
import AppError from "../../shared/appError.js";

/**
 * Ensure default fund percentage slabs exist (55%, 45%, 60%, 40%, 100%)
 */
export async function seedDefaultFundPercentages() {
  const defaultSlabs = [
    { percentage: 55, label: "55%", is_active: true },
    { percentage: 45, label: "45%", is_active: true },
    { percentage: 60, label: "60%", is_active: true },
    { percentage: 40, label: "40%", is_active: true },
    { percentage: 100, label: "100%", is_active: true },
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
 * Auto-calculates sum of state_restricted_amount, invoice_amount, subsidy_amount, and fund share
 */
export async function previewProceedingIds({ application_ids_text, fund_percentage_value = 55.0 }) {
  if (!application_ids_text || !application_ids_text.trim()) {
    return {
      matched_count: 0,
      unmatched_count: 0,
      total_state_restricted: 0,
      total_invoice_amount: 0,
      total_subsidy_amount: 0,
      total_fund_share: 0,
      matched_projects: [],
      unmatched_ids: [],
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
  let totalInvoiceAmount = 0;
  let totalSubsidyAmount = 0;
  let totalFundShare = 0;
  const matchedList = [];
  const unmatchedList = [];

  for (const rawId of uniqueAppIds) {
    const key = rawId.trim().toUpperCase();
    const proj = projectMap.get(key);
    if (proj) {
      const invAmt = parseFloat(proj.invoice_amount || 0);
      const subAmt = parseFloat(proj.quotation_subsidy_amount || proj.invoice_amount || 0);
      const stateRestricted = parseFloat(proj.state_restricted_amount || proj.invoice_amount || 0);
      const fundShare = Math.floor(stateRestricted * (fundPct / 100));

      totalStateRestricted += stateRestricted;
      totalInvoiceAmount += invAmt;
      totalSubsidyAmount += subAmt;
      totalFundShare += fundShare;

      matchedList.push({
        id: proj.id,
        application_id: proj.application_id,
        farmer_name: proj.farmer_name,
        dealer_name: proj.dealer?.name || "Unassigned",
        invoice_amount: invAmt,
        subsidy_amount: subAmt,
        state_restricted_amount: stateRestricted,
        fund_share_amount: fundShare,
      });
    } else {
      unmatchedList.push(rawId);
    }
  }

  return {
    matched_count: matchedList.length,
    unmatched_count: unmatchedList.length,
    total_state_restricted: Math.floor(totalStateRestricted),
    total_invoice_amount: Math.floor(totalInvoiceAmount),
    total_subsidy_amount: Math.floor(totalSubsidyAmount),
    total_fund_share: Math.floor(totalFundShare),
    matched_projects: matchedList,
    unmatched_ids: unmatchedList,
  };
}

/**
 * Create a new Proceeding Batch with linked project application IDs
 * Calculates Dealer Commission, Fittings & 45-day delay Penalty for each project
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

  // Query matching government projects with their assigned dealer (case-insensitive)
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

  // Pre-load status histories to calculate 45-day delay penalties
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

  // Fetch active scheme tax slab for GST and fittings deductions
  const activeTaxSlab = await getEffectiveSchemeTaxSlab(proceeding_date);
  const gstPct = parseFloat(activeTaxSlab?.gst_percentage ?? 12.0);
  const fittingsPct = parseFloat(activeTaxSlab?.fittings_percentage ?? 5.0);

  const batchProjectRows = [];
  let totalCalcCommission = 0;
  let totalCalcFittings = 0;
  let computedTotalStateRestricted = 0;

  for (const rawId of uniqueAppIds) {
    const key = rawId.trim().toUpperCase();
    const proj = projectMap.get(key);

    if (proj) {
      const invoiceAmt = parseFloat(proj.invoice_amount || 0);
      const subsidyAmt = parseFloat(proj.quotation_subsidy_amount || proj.invoice_amount || 0);
      const stateRestricted = parseFloat(proj.state_restricted_amount || proj.invoice_amount || 0);
      computedTotalStateRestricted += stateRestricted;

      // 1. Fund Share for this release (e.g. 55% or 45% of State Restricted)
      const fundShare = Math.floor(stateRestricted * (finalFundPct / 100));

      // 2. Net Material Cost after removing GST and Fittings from the released fund share
      // Formula: Fund Share / (1 + GST%) / (1 + Fittings%)
      const netMaterialBase = Math.floor(fundShare / (1 + gstPct / 100) / (1 + fittingsPct / 100));

      // 3. Dealer Commission %
      const dealerRate =
        proj.dealer?.commission_percentage !== undefined && proj.dealer?.commission_percentage !== null
          ? parseFloat(proj.dealer.commission_percentage)
          : (proj.dealer?.base_commission_percentage !== undefined && proj.dealer?.base_commission_percentage !== null
              ? parseFloat(proj.dealer.base_commission_percentage)
              : 20.0);

      // 4. Dealer Commission Amount
      const commissionAmount = Math.floor(netMaterialBase * (dealerRate / 100));

      // 5. Fittings Cost for this fund share
      // Formula: State Restricted * (Fund% / 100) * (Fittings% / 100)
      const fittingsAmount = Math.floor(stateRestricted * (finalFundPct / 100) * (fittingsPct / 100));

      // 6. SLA Delay Penalty Calculation (45 days from INVOICED to WORK COMPLETION APPROVED)
      const projHistories = historyMap.get(proj.id) || [];
      const invoicedHistory = projHistories.find((h) => h.status?.toUpperCase() === "INVOICED");
      const invoiceDate = invoicedHistory?.status_date || proj.invoice_date || null;
      const workCompletionHistory = projHistories.find(
        (h) => h.status?.toUpperCase() === "WORK COMPLETION APPROVED" || h.status?.toUpperCase() === "WORK COMPLETED"
      );
      const workCompletionDate = workCompletionHistory?.status_date || null;

      let delayDays = 0;
      let penaltyAmount = 0;

      if (invoiceDate && workCompletionDate) {
        delayDays = Math.max(0, calculateDaysBetween(invoiceDate, workCompletionDate));
        if (delayDays > 45) {
          const delayCycles = Math.floor(delayDays / 45);
          penaltyAmount = Math.floor(delayCycles * (commissionAmount * 0.01)); // 1% of commission per 45 days
        }
      }

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
        dealer_rate_percentage: dealerRate,
        commission_amount: commissionAmount,
        fittings_amount: fittingsAmount,
        delay_days: delayDays,
        penalty_amount: penaltyAmount,
        adjusted_penalty_amount: penaltyAmount,
        is_paid_to_dealer: false,
      });
    } else {
      // Unmatched application ID
      batchProjectRows.push({
        project_id: null,
        application_id: rawId,
        dealer_id: null,
        farmer_name: "Unmatched Project ID",
        district: null,
        fund_type: "Regular",
        invoice_amount: 0,
        subsidy_amount: 0,
        state_restricted_amount: 0,
        fund_share_amount: 0,
        gst_percentage: gstPct,
        fittings_percentage: fittingsPct,
        net_material_base: 0,
        dealer_rate_percentage: 0,
        commission_amount: 0,
        fittings_amount: 0,
        delay_days: 0,
        penalty_amount: 0,
        adjusted_penalty_amount: 0,
        is_paid_to_dealer: false,
      });
    }
  }

  const finalProceedingAmount =
    parseFloat(total_proceeding_amount || 0) > 0
      ? parseFloat(total_proceeding_amount)
      : computedTotalStateRestricted;

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

  // Date range filter on proceeding_date
  if (start_date && end_date) {
    where.proceeding_date = { [Op.between]: [start_date, end_date] };
  } else if (start_date) {
    where.proceeding_date = { [Op.gte]: start_date };
  } else if (end_date) {
    where.proceeding_date = { [Op.lte]: end_date };
  }

  // Payment Received in Bank status filter
  if (payment_status === "RECEIVED") {
    where.payment_received_date = { [Op.ne]: null };
  } else if (payment_status === "PENDING") {
    where.payment_received_date = null;
  }

  // Dealer payout status filter
  if (payout_status) {
    where.dealer_payout_status = payout_status;
  }

  // Search filter
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

  // Calculate high-level summary totals across all matching batches
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

  // Aggregate Dealer-Wise Breakdown
  const dealerMap = new Map();

  for (const item of batch.projects) {
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
        is_paid: true, // will be flipped to false if any project is unpaid
        paid_date: item.dealer_paid_date || null,
        paid_ref: item.dealer_paid_ref || null,
        project_ids: [],
      });
    }

    const d = dealerMap.get(dealerId);
    const comm = Math.floor(parseFloat(item.commission_amount || 0));
    const fit = Math.floor(parseFloat(item.fittings_amount || 0));
    const pen = Math.floor(parseFloat(item.adjusted_penalty_amount || item.penalty_amount || 0));

    d.projects_count += 1;
    d.total_invoice_amount += Math.floor(parseFloat(item.invoice_amount || 0));
    d.total_subsidy_amount += Math.floor(parseFloat(item.subsidy_amount || item.invoice_amount || 0));
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

  const activeTaxSlab = await getEffectiveSchemeTaxSlab(batch.proceeding_date);
  const gstPct = parseFloat(activeTaxSlab?.gst_percentage ?? 12.0);
  const fittingsPct = parseFloat(activeTaxSlab?.fittings_percentage ?? 5.0);

  let totalCalcCommission = 0;
  let totalCalcFittings = 0;

  await db.transaction(async (t) => {
    for (const item of batch.projects) {
      const key = item.application_id.trim().toUpperCase();
      const proj = projectMap.get(key);
      if (proj) {
        const invoiceAmt = parseFloat(proj.invoice_amount || 0);
        const subsidyAmt = parseFloat(proj.quotation_subsidy_amount || proj.invoice_amount || 0);
        const stateRestricted = parseFloat(proj.state_restricted_amount || proj.invoice_amount || 0);
        const fundShare = Math.floor(stateRestricted * (batch.fund_percentage_value / 100));
        const netMaterialBase = Math.floor(fundShare / (1 + gstPct / 100) / (1 + fittingsPct / 100));
        const dealerRate =
          proj.dealer?.commission_percentage !== undefined && proj.dealer?.commission_percentage !== null
            ? parseFloat(proj.dealer.commission_percentage)
            : (proj.dealer?.base_commission_percentage !== undefined && proj.dealer?.base_commission_percentage !== null
                ? parseFloat(proj.dealer.base_commission_percentage)
                : 20.0);

        const commissionAmount = Math.floor(netMaterialBase * (dealerRate / 100));
        const fittingsAmount = Math.floor(stateRestricted * (batch.fund_percentage_value / 100) * (fittingsPct / 100));

        const projHistories = historyMap.get(proj.id) || [];
        const invoicedHistory = projHistories.find((h) => h.status?.toUpperCase() === "INVOICED");
        const invoiceDate = invoicedHistory?.status_date || proj.invoice_date || null;
        const workCompletionHistory = projHistories.find(
          (h) => h.status?.toUpperCase() === "WORK COMPLETION APPROVED" || h.status?.toUpperCase() === "WORK COMPLETED"
        );
        const workCompletionDate = workCompletionHistory?.status_date || null;

        let delayDays = 0;
        let penaltyAmount = 0;

        if (invoiceDate && workCompletionDate) {
          delayDays = Math.max(0, calculateDaysBetween(invoiceDate, workCompletionDate));
          if (delayDays > 45) {
            const delayCycles = Math.floor(delayDays / 45);
            penaltyAmount = Math.floor(delayCycles * (commissionAmount * 0.01));
          }
        }

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
            dealer_rate_percentage: dealerRate,
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
 * Allows recording custom adjusted penalty deduction
 */
export async function markDealerPayout(batch_id, { dealer_id, paid_date, paid_ref, adjusted_penalty_amount }) {
  const batch = await ProceedingBatch.findByPk(batch_id);
  if (!batch) throw new AppError("Proceeding batch not found", 404);

  const whereClause = { proceeding_batch_id: batch_id };
  if (dealer_id === "UNASSIGNED" || dealer_id === null) {
    whereClause.dealer_id = null;
  } else {
    whereClause.dealer_id = dealer_id;
  }

  const updateData = {
    is_paid_to_dealer: true,
    dealer_paid_date: paid_date || new Date().toISOString().split("T")[0],
    dealer_paid_ref: paid_ref ? paid_ref.trim() : "Direct Bank Transfer",
  };

  if (adjusted_penalty_amount !== undefined && adjusted_penalty_amount !== null && !isNaN(parseFloat(adjusted_penalty_amount))) {
    updateData.adjusted_penalty_amount = parseFloat(adjusted_penalty_amount);
  }

  await ProceedingBatchProject.update(updateData, { where: whereClause });

  // Recalculate batch payout status
  const allProjects = await ProceedingBatchProject.findAll({
    where: { proceeding_batch_id: batch_id },
  });

  const paidCount = allProjects.filter((p) => p.is_paid_to_dealer).length;
  if (paidCount === allProjects.length && allProjects.length > 0) {
    batch.dealer_payout_status = "PAID";
  } else if (paidCount > 0) {
    batch.dealer_payout_status = "PARTIAL";
  } else {
    batch.dealer_payout_status = "UNPAID";
  }
  await batch.save();

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
