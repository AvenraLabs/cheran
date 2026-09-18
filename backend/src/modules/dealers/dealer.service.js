import { Op } from "sequelize";
import db from "../../config/db.js";
import "../../models/initModels.js";
import Dealer from "./dealer.model.js";
import DealerCommissionSlab from "./dealer-commission-slab.model.js";
import GovernmentProject from "../projects/project.model.js";
import GovernmentImportRow from "../imports/import-row.model.js";
import { normalizeDealerName } from "../../utils/normalization.js";
import AppError from "../../shared/appError.js";

export async function listDealers({ search, is_active, page = 1, limit = 20 }) {
  const where = {};
  if (is_active !== undefined) {
    where.is_active = is_active;
  }
  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { normalized_name: { [Op.iLike]: `%${normalizeDealerName(search)}%` } },
    ];
  }

  const offset = (page - 1) * limit;
  const { rows, count } = await Dealer.findAndCountAll({
    where,
    include: [
      {
        model: DealerCommissionSlab,
        as: "commission_slabs",
        required: false,
      },
    ],
    distinct: true,
    order: [["name", "ASC"]],
    limit,
    offset,
  });

  return {
    dealers: rows,
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    },
  };
}

export async function getDealerOptions() {
  const dealers = await Dealer.findAll({
    where: { is_active: true },
    attributes: ["id", "name", "commission_percentage"],
    order: [["name", "ASC"]],
  });
  return { dealers };
}

export async function getDealerById(id) {
  const dealer = await Dealer.findByPk(id, {
    include: [
      {
        model: GovernmentProject,
        as: "projects",
        attributes: ["id", "application_id", "current_status", "farmer_name", "district"],
        limit: 10,
      },
    ],
  });

  if (!dealer) {
    throw new AppError(`Dealer not found with ID ${id}`, 404);
  }

  const totalProjects = await GovernmentProject.count({
    where: { dealer_id: id },
  });

  return {
    ...dealer.toJSON(),
    totalProjects,
  };
}

export async function createDealer({
  name,
  commission_percentage,
  effective_from,
  is_active = true,
  created_by,
  updated_by,
}) {
  const normalized_name = normalizeDealerName(name);

  // Check if existing dealer with same normalized name
  const existing = await Dealer.findOne({ where: { normalized_name } });
  if (existing) {
    return existing;
  }

  const parsedPct =
    commission_percentage !== undefined &&
    commission_percentage !== null &&
    commission_percentage !== ""
      ? parseFloat(commission_percentage)
      : null;

  const dealer = await Dealer.create({
    name: name.trim(),
    normalized_name,
    commission_percentage: parsedPct,
    is_active,
    created_by: created_by || null,
    updated_by: updated_by || created_by || null,
  });

  if (parsedPct !== null && !isNaN(parsedPct)) {
    const fromDate = effective_from || "2026-06-01";
    await DealerCommissionSlab.create({
      dealer_id: dealer.id,
      effective_from: fromDate,
      effective_to: null,
      commission_percentage: parsedPct,
    });
  }

  return dealer;
}

export async function updateDealer(id, { name, commission_percentage, is_active, updated_by }) {
  const dealer = await Dealer.findByPk(id);
  if (!dealer) {
    throw new AppError(`Dealer not found with ID ${id}`, 404);
  }

  const updates = {};
  if (name !== undefined && name !== null) {
    updates.name = name.trim();
    updates.normalized_name = normalizeDealerName(name);
  }
  if (commission_percentage !== undefined) updates.commission_percentage = commission_percentage;
  if (is_active !== undefined) updates.is_active = is_active;
  if (updated_by !== undefined) updates.updated_by = updated_by;

  await dealer.update(updates);

  // If commission_percentage was updated, synchronize dealer's active ongoing slab (effective_to IS NULL)
  if (commission_percentage !== undefined && commission_percentage !== null) {
    const ongoingSlab = await DealerCommissionSlab.findOne({
      where: { dealer_id: id, effective_to: null },
      order: [["effective_from", "DESC"]],
    });
    if (ongoingSlab) {
      await ongoingSlab.update({ commission_percentage });
    }
  }

  return dealer;
}

export async function deleteDealer(id) {
  const dealer = await Dealer.findByPk(id);
  if (!dealer) {
    throw new AppError(`Dealer not found with ID ${id}`, 404);
  }

  const linkedProjectsCount = await GovernmentProject.count({
    where: { dealer_id: id },
  });

  // Disassociate linked projects safely
  if (linkedProjectsCount > 0) {
    await GovernmentProject.update(
      { dealer_id: null },
      { where: { dealer_id: id } }
    );
  }

  await dealer.destroy();

  return {
    id,
    deleted: true,
    disassociatedProjectsCount: linkedProjectsCount,
  };
}

export async function mergeDealers({ targetDealerId, sourceDealerIds }) {
  if (!targetDealerId) {
    throw new AppError("target_dealer_id is required", 400);
  }
  if (!Array.isArray(sourceDealerIds) || sourceDealerIds.length === 0) {
    throw new AppError("source_dealer_ids must be a non-empty array of dealer IDs", 400);
  }

  // Ensure target is not inside sources
  const cleanedSourceIds = sourceDealerIds.filter((id) => id !== targetDealerId);
  if (cleanedSourceIds.length === 0) {
    throw new AppError("Target dealer cannot be merged into itself", 400);
  }

  const targetDealer = await Dealer.findByPk(targetDealerId);
  if (!targetDealer) {
    throw new AppError(`Target dealer with ID ${targetDealerId} not found`, 404);
  }

  // Run atomic transaction
  return await db.transaction(async (t) => {
    // 1. Reassign all government projects
    const [reassignedProjectsCount] = await GovernmentProject.update(
      { dealer_id: targetDealerId },
      {
        where: {
          dealer_id: {
            [Op.in]: cleanedSourceIds,
          },
        },
        transaction: t,
      }
    );

    // 2. Reassign all historical staged import rows
    const [reassignedImportRowsCount] = await GovernmentImportRow.update(
      { matched_dealer_id: targetDealerId },
      {
        where: {
          matched_dealer_id: {
            [Op.in]: cleanedSourceIds,
          },
        },
        transaction: t,
      }
    );

    // 3. Delete merged source dealer records
    const deletedCount = await Dealer.destroy({
      where: {
        id: {
          [Op.in]: cleanedSourceIds,
        },
      },
      transaction: t,
    });

    return {
      targetDealer: targetDealer.toJSON(),
      reassignedProjectsCount,
      reassignedImportRowsCount,
      mergedDealersCount: deletedCount,
    };
  });
}

export async function setUniversalCommission({ commission_percentage, overwrite_existing = true }) {
  if (commission_percentage === undefined || commission_percentage === null || isNaN(parseFloat(commission_percentage))) {
    throw new AppError("A valid commission_percentage number is required", 400);
  }

  const parsedPct = parseFloat(commission_percentage);
  if (parsedPct < 0 || parsedPct > 100) {
    throw new AppError("Commission percentage must be between 0 and 100", 400);
  }

  const where = { is_active: true };
  if (!overwrite_existing) {
    where.commission_percentage = null;
  }

  const [affectedCount] = await Dealer.update(
    { commission_percentage: parsedPct },
    { where }
  );

  return {
    updated_dealers_count: affectedCount,
    commission_percentage: parsedPct,
  };
}

// ==========================================
// DATE-EFFECTIVE DEALER COMMISSION SLABS
// ==========================================

/**
 * Get all commission slabs for a dealer
 */
export async function getDealerCommissionSlabs(dealerId) {
  const dealer = await Dealer.findByPk(dealerId);
  if (!dealer) {
    throw new AppError("Dealer not found", 404);
  }

  const slabs = await DealerCommissionSlab.findAll({
    where: { dealer_id: dealerId },
    order: [["effective_from", "DESC"]],
  });

  return {
    dealer: {
      id: dealer.id,
      name: dealer.name,
      base_commission_percentage: dealer.commission_percentage,
    },
    slabs,
  };
}

/**
 * Create a commission slab for a dealer
 */
export async function createDealerCommissionSlab(dealerId, data) {
  const dealer = await Dealer.findByPk(dealerId);
  if (!dealer) {
    throw new AppError("Dealer not found", 404);
  }

  const { effective_from, effective_to, commission_percentage, notes } = data;
  if (!effective_from) {
    throw new AppError("effective_from date is required (YYYY-MM-DD)", 400);
  }

  const parsedPct = parseFloat(commission_percentage);
  if (isNaN(parsedPct) || parsedPct < 0 || parsedPct > 100) {
    throw new AppError("commission_percentage must be a number between 0 and 100", 400);
  }

  if (effective_to && effective_to < effective_from) {
    throw new AppError("effective_to date cannot be earlier than effective_from date", 400);
  }

  const slab = await DealerCommissionSlab.create({
    dealer_id: dealerId,
    effective_from,
    effective_to: effective_to || null,
    commission_percentage: parsedPct,
    notes: notes || null,
  });

  // If ongoing slab is added (effective_to is null), sync dealer's base commission
  if (!effective_to) {
    await dealer.update({ commission_percentage: parsedPct });
  }

  return slab;
}

/**
 * Update a commission slab
 */
export async function updateDealerCommissionSlab(slabId, data) {
  const slab = await DealerCommissionSlab.findByPk(slabId);
  if (!slab) {
    throw new AppError("Commission slab not found", 404);
  }

  const { effective_from, effective_to, commission_percentage, notes } = data;

  const updates = {};
  if (effective_from !== undefined) updates.effective_from = effective_from;
  if (effective_to !== undefined) updates.effective_to = effective_to || null;
  if (notes !== undefined) updates.notes = notes || null;

  if (commission_percentage !== undefined) {
    const parsedPct = parseFloat(commission_percentage);
    if (isNaN(parsedPct) || parsedPct < 0 || parsedPct > 100) {
      throw new AppError("commission_percentage must be between 0 and 100", 400);
    }
    updates.commission_percentage = parsedPct;
  }

  const finalFrom = updates.effective_from || slab.effective_from;
  const finalTo = updates.effective_to !== undefined ? updates.effective_to : slab.effective_to;
  if (finalTo && finalTo < finalFrom) {
    throw new AppError("effective_to date cannot be earlier than effective_from date", 400);
  }

  await slab.update(updates);

  // If this slab is ongoing, sync dealer base commission
  if (!finalTo && updates.commission_percentage !== undefined) {
    await Dealer.update(
      { commission_percentage: updates.commission_percentage },
      { where: { id: slab.dealer_id } }
    );
  }

  return slab;
}

/**
 * Delete a commission slab
 */
export async function deleteDealerCommissionSlab(slabId) {
  const slab = await DealerCommissionSlab.findByPk(slabId);
  if (!slab) {
    throw new AppError("Commission slab not found", 404);
  }

  const dealerId = slab.dealer_id;
  await slab.destroy();

  // Sync dealer base commission to latest remaining ongoing slab if any
  const latestOngoingSlab = await DealerCommissionSlab.findOne({
    where: { dealer_id: dealerId, effective_to: null },
    order: [["effective_from", "DESC"]],
  });
  if (latestOngoingSlab) {
    await Dealer.update(
      { commission_percentage: latestOngoingSlab.commission_percentage },
      { where: { id: dealerId } }
    );
  }

  return { success: true, message: "Commission slab deleted" };
}

/**
 * 1-Click Universal Commission Policy Application
 * Applies a new commission slab starting at `effective_from` to all active dealers,
 * while automatically archiving prior dates with the dealer's existing rate.
 */
export async function applyUniversalCommissionPolicy({
  effective_from = "2026-06-01",
  commission_percentage = 15.0,
  notes = "Govt revised 15% rate policy from June 2026",
}) {
  const parsedPct = parseFloat(commission_percentage);
  if (isNaN(parsedPct) || parsedPct < 0 || parsedPct > 100) {
    throw new AppError("Commission percentage must be between 0 and 100", 400);
  }
  if (!effective_from) {
    throw new AppError("effective_from date is required (YYYY-MM-DD)", 400);
  }

  // Calculate day prior to effective_from
  const fromDateObj = new Date(effective_from);
  fromDateObj.setDate(fromDateObj.getDate() - 1);
  const dayBeforeEffective = fromDateObj.toISOString().split("T")[0];

  return await db.transaction(async (t) => {
    const activeDealers = await Dealer.findAll({
      where: { is_active: true },
      include: [{ model: DealerCommissionSlab, as: "commission_slabs" }],
      transaction: t,
    });

    let processedCount = 0;

    for (const dealer of activeDealers) {
      const existingSlabs = dealer.commission_slabs || [];
      const currentRate = dealer.commission_percentage !== null && dealer.commission_percentage !== undefined
        ? parseFloat(dealer.commission_percentage)
        : 20.0;

      // 1. Cap any open-ended slab that starts before effective_from
      for (const slab of existingSlabs) {
        if (slab.effective_from < effective_from) {
          if (!slab.effective_to || slab.effective_to >= effective_from) {
            await slab.update({ effective_to: dayBeforeEffective }, { transaction: t });
          }
        }
      }

      // 2. If dealer has NO historical slab covering pre-effective period, create one for their prior rate
      const hasPriorSlab = existingSlabs.some((s) => s.effective_from < effective_from);
      if (!hasPriorSlab) {
        await DealerCommissionSlab.create(
          {
            dealer_id: dealer.id,
            effective_from: "2000-01-01",
            effective_to: dayBeforeEffective,
            commission_percentage: currentRate,
            notes: `Archived historical rate (${currentRate}%) prior to ${effective_from}`,
          },
          { transaction: t }
        );
      }

      // 3. Upsert the new slab starting at effective_from
      const existingNewSlab = existingSlabs.find((s) => s.effective_from === effective_from);
      if (existingNewSlab) {
        await existingNewSlab.update(
          {
            effective_to: null,
            commission_percentage: parsedPct,
            notes,
          },
          { transaction: t }
        );
      } else {
        await DealerCommissionSlab.create(
          {
            dealer_id: dealer.id,
            effective_from,
            effective_to: null,
            commission_percentage: parsedPct,
            notes,
          },
          { transaction: t }
        );
      }

      // 4. Update the dealer base commission_percentage field to current active rate
      await dealer.update({ commission_percentage: parsedPct }, { transaction: t });
      processedCount++;
    }

    return {
      success: true,
      dealers_updated: processedCount,
      effective_from,
      commission_percentage: parsedPct,
      notes,
    };
  });
}

/**
 * In-Memory Helper to Resolve Effective Commission Rate for a Project's Invoice Date
 */
export function resolveEffectiveDealerCommission(dealer, invoiceDate, dealerSlabs = []) {
  if (!dealer) return 20.0;

  const targetDate = invoiceDate
    ? String(invoiceDate).trim().slice(0, 10)
    : null;

  // Match slab where effective_from <= targetDate and (effective_to is null or effective_to >= targetDate)
  if (targetDate && dealerSlabs && dealerSlabs.length > 0) {
    const matchedSlab = dealerSlabs.find((s) => {
      const from = s.effective_from;
      const to = s.effective_to;
      return from <= targetDate && (!to || to >= targetDate);
    });

    if (matchedSlab) {
      return {
        rate: parseFloat(matchedSlab.commission_percentage),
        source: "SLAB",
        slab_id: matchedSlab.id,
        matched_date: targetDate,
      };
    }
  }

  // Fallback to dealer base commission percentage
  const baseRate = dealer.commission_percentage !== null && dealer.commission_percentage !== undefined
    ? parseFloat(dealer.commission_percentage)
    : 20.0;

  return {
    rate: baseRate,
    source: "DEALER_BASE",
    slab_id: null,
    matched_date: targetDate,
  };
}
