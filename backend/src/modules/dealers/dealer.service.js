import { Op } from "sequelize";
import db from "../../config/db.js";
import Dealer from "./dealer.model.js";
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

export async function createDealer({ name, commission_percentage, is_active = true, created_by, updated_by }) {
  const normalized_name = normalizeDealerName(name);

  // Check if existing dealer with same normalized name
  const existing = await Dealer.findOne({ where: { normalized_name } });
  if (existing) {
    return existing;
  }

  const dealer = await Dealer.create({
    name: name.trim(),
    normalized_name,
    commission_percentage: commission_percentage || null,
    is_active,
    created_by: created_by || null,
    updated_by: updated_by || created_by || null,
  });

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
