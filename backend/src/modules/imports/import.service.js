import { Op } from "sequelize";
import db from "../../config/db.js";
import GovernmentImport from "./import.model.js";
import GovernmentImportRow from "./import-row.model.js";
import Dealer from "../dealers/dealer.model.js";
import GovernmentProject from "../projects/project.model.js";
import { createDealer } from "../dealers/dealer.service.js";
import { normalizeDealerName } from "../../utils/normalization.js";
import AppError from "../../shared/appError.js";

export async function listImports({ page = 1, limit = 20, status } = {}) {
  const where = {};
  if (status) where.status = status;

  const offset = (page - 1) * limit;
  const { rows, count } = await GovernmentImport.findAndCountAll({
    where,
    order: [["uploaded_at", "DESC"]],
    limit,
    offset,
  });

  return {
    imports: rows,
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    },
  };
}

export async function getImportById(id) {
  const importRecord = await GovernmentImport.findByPk(id);
  if (!importRecord) {
    throw new AppError(`Import with ID ${id} not found`, 404);
  }

  // Count breakdown by action
  const actionCounts = await GovernmentImportRow.findAll({
    where: { import_id: id },
    attributes: ["action", "resolution_status", [db.fn("COUNT", db.col("id")), "count"]],
    group: ["action", "resolution_status"],
    raw: true,
  });

  return {
    import: importRecord,
    actionBreakdown: actionCounts,
  };
}

export async function getImportRows(importId, { page = 1, limit = 50, action, resolution_status } = {}) {
  const importRecord = await GovernmentImport.findByPk(importId);
  if (!importRecord) {
    throw new AppError(`Import with ID ${importId} not found`, 404);
  }

  const where = { import_id: importId };
  if (action && action !== "ALL") where.action = action;
  if (resolution_status) where.resolution_status = resolution_status;

  const offset = (page - 1) * limit;
  const { rows, count } = await GovernmentImportRow.findAndCountAll({
    where,
    include: [
      {
        model: Dealer,
        as: "matched_dealer",
        attributes: ["id", "name", "normalized_name"],
      },
    ],
    order: [["row_number", "ASC"]],
    limit,
    offset,
  });

  return {
    importId,
    rows,
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    },
  };
}

export async function getUnresolvedDealersSummary(importId) {
  const importRecord = await GovernmentImport.findByPk(importId);
  if (!importRecord) {
    throw new AppError(`Import with ID ${importId} not found`, 404);
  }

  const summary = await GovernmentImportRow.findAll({
    where: {
      import_id: importId,
      action: "DEALER_RESOLUTION_REQUIRED",
      resolution_status: "PENDING",
    },
    attributes: [
      "dealer_name",
      [db.fn("COUNT", db.col("id")), "count"],
      [db.fn("MIN", db.col("row_number")), "first_row_number"],
    ],
    group: ["dealer_name"],
    order: [[db.literal("count"), "DESC"]],
    raw: true,
  });

  return {
    importId,
    totalUnresolvedDealers: summary.length,
    unresolvedDealers: summary.map((s) => ({
      dealer_name: s.dealer_name || "Unknown",
      count: parseInt(s.count, 10),
      first_row_number: s.first_row_number,
    })),
  };
}

export async function resolveImportDealer(importId, { row_id, dealer_name, resolution_type, dealer_id, new_dealer }) {
  const importRecord = await GovernmentImport.findByPk(importId);
  if (!importRecord) {
    throw new AppError(`Import with ID ${importId} not found`, 404);
  }

  if (importRecord.status !== "PREVIEW") {
    throw new AppError(`Cannot resolve dealers for an import in '${importRecord.status}' state`, 400);
  }

  // Determine target dealer_name
  let targetDealerName = dealer_name;
  if (!targetDealerName && row_id) {
    const row = await GovernmentImportRow.findByPk(row_id);
    if (row && row.dealer_name) {
      targetDealerName = row.dealer_name;
    }
  }

  let resolvedDealerId = null;

  if (resolution_type === "SELECT_EXISTING") {
    if (!dealer_id) {
      throw new AppError("dealer_id is required when selecting an existing dealer", 400);
    }
    const dealer = await Dealer.findByPk(dealer_id);
    if (!dealer) {
      throw new AppError(`Dealer with ID ${dealer_id} not found`, 404);
    }
    resolvedDealerId = dealer.id;
  } else if (resolution_type === "CREATE_NEW") {
    const dealerNameToCreate = new_dealer?.name || targetDealerName;
    if (!dealerNameToCreate) {
      throw new AppError("Dealer name is required when creating a new dealer", 400);
    }
    const created = await createDealer({
      name: dealerNameToCreate,
      commission_percentage: new_dealer?.commission_percentage,
    });
    resolvedDealerId = created.id;
  } else {
    throw new AppError("resolution_type must be either SELECT_EXISTING or CREATE_NEW", 400);
  }

  // Find all matching rows in this import (by row_id or matching dealer_name case-insensitively)
  let rowsToResolve = [];
  if (targetDealerName) {
    rowsToResolve = await GovernmentImportRow.findAll({
      where: {
        import_id: importId,
        dealer_name: {
          [Op.iLike]: targetDealerName.trim(),
        },
      },
    });
  } else if (row_id) {
    const row = await GovernmentImportRow.findByPk(row_id);
    if (row) rowsToResolve = [row];
  }

  if (rowsToResolve.length === 0) {
    throw new AppError("No matching staged rows found for resolution", 404);
  }

  // Bulk update matching rows to resolve ALL of them at once
  for (const row of rowsToResolve) {
    let newAction = "NEW_PROJECT";
    if (row.matched_project_id) {
      const proj = await GovernmentProject.findByPk(row.matched_project_id);
      if (proj && proj.current_status !== row.imported_status) {
        newAction = "STATUS_CHANGE";
      } else {
        newAction = "UNCHANGED";
      }
    }

    await row.update({
      matched_dealer_id: resolvedDealerId,
      resolution_status: "RESOLVED",
      action: newAction,
      error_message: null,
    });
  }

  // Recalculate remaining dealer resolutions needed
  const remainingCount = await GovernmentImportRow.count({
    where: {
      import_id: importId,
      action: "DEALER_RESOLUTION_REQUIRED",
      resolution_status: "PENDING",
    },
  });

  await importRecord.update({
    dealer_resolutions_count: remainingCount,
  });

  return {
    resolvedRowsCount: rowsToResolve.length,
    resolvedDealerName: targetDealerName,
    resolvedDealerId,
    remainingPendingResolutions: remainingCount,
  };
}

export async function autoCreateAllUnresolvedDealers(importId) {
  const importRecord = await GovernmentImport.findByPk(importId);
  if (!importRecord) {
    throw new AppError(`Import with ID ${importId} not found`, 404);
  }

  if (importRecord.status !== "PREVIEW") {
    throw new AppError(`Cannot resolve dealers for an import in '${importRecord.status}' state`, 400);
  }

  // Find all pending rows
  const pendingRows = await GovernmentImportRow.findAll({
    where: {
      import_id: importId,
      action: "DEALER_RESOLUTION_REQUIRED",
      resolution_status: "PENDING",
    },
  });

  if (pendingRows.length === 0) {
    return {
      message: "No pending dealer resolutions found",
      createdDealersCount: 0,
      resolvedRowsCount: 0,
    };
  }

  // Group by dealer_name
  const dealerGroups = new Map();
  pendingRows.forEach((row) => {
    const rawName = row.dealer_name ? row.dealer_name.trim() : "Default Dealer";
    const norm = normalizeDealerName(rawName);
    if (!dealerGroups.has(norm)) {
      dealerGroups.set(norm, { name: rawName, rows: [] });
    }
    dealerGroups.get(norm).rows.push(row);
  });

  let createdDealersCount = 0;
  let totalResolvedRows = 0;

  for (const [norm, group] of dealerGroups.entries()) {
    // Check or create dealer
    let dealer = await Dealer.findOne({ where: { normalized_name: norm } });
    if (!dealer) {
      dealer = await Dealer.create({
        name: group.name,
        normalized_name: norm,
        is_active: true,
      });
      createdDealersCount++;
    }

    // Resolve all rows in this group
    for (const row of group.rows) {
      let newAction = "NEW_PROJECT";
      if (row.matched_project_id) {
        const proj = await GovernmentProject.findByPk(row.matched_project_id);
        if (proj && proj.current_status !== row.imported_status) {
          newAction = "STATUS_CHANGE";
        } else {
          newAction = "UNCHANGED";
        }
      }

      await row.update({
        matched_dealer_id: dealer.id,
        resolution_status: "RESOLVED",
        action: newAction,
        error_message: null,
      });
      totalResolvedRows++;
    }
  }

  // Update import record
  await importRecord.update({
    dealer_resolutions_count: 0,
  });

  return {
    message: `Successfully resolved ${totalResolvedRows} rows across ${dealerGroups.size} unique dealers`,
    createdDealersCount,
    resolvedRowsCount: totalResolvedRows,
    remainingPendingResolutions: 0,
  };
}
