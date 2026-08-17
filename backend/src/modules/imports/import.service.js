import { Op } from "sequelize";
import db from "../../config/db.js";
import GovernmentImport from "./import.model.js";
import GovernmentImportRow from "./import-row.model.js";
import Dealer from "../dealers/dealer.model.js";
import GovernmentProject from "../projects/project.model.js";
import { createDealer } from "../dealers/dealer.service.js";
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
  if (action) where.action = action;
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

export async function resolveImportDealer(importId, { row_id, dealer_name, resolution_type, dealer_id, new_dealer }) {
  const importRecord = await GovernmentImport.findByPk(importId);
  if (!importRecord) {
    throw new AppError(`Import with ID ${importId} not found`, 404);
  }

  if (importRecord.status !== "PREVIEW") {
    throw new AppError(`Cannot resolve dealers for an import in '${importRecord.status}' state`, 400);
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
    if (!new_dealer || !new_dealer.name) {
      throw new AppError("new_dealer with name is required when creating a new dealer", 400);
    }
    const created = await createDealer({
      name: new_dealer.name,
      commission_percentage: new_dealer.commission_percentage,
      commission_basis: new_dealer.commission_basis,
    });
    resolvedDealerId = created.id;
  } else {
    throw new AppError("resolution_type must be either SELECT_EXISTING or CREATE_NEW", 400);
  }

  // Find target rows to update
  const where = { import_id: importId };
  if (row_id) {
    where.id = row_id;
  } else if (dealer_name) {
    where.dealer_name = dealer_name;
  } else {
    throw new AppError("Either row_id or dealer_name must be specified to resolve dealer", 400);
  }

  const rowsToResolve = await GovernmentImportRow.findAll({ where });
  if (rowsToResolve.length === 0) {
    throw new AppError("No matching staged rows found for resolution", 404);
  }

  // Update rows
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
    resolvedDealerId,
    remainingPendingResolutions: remainingCount,
  };
}
