import { Op } from "sequelize";
import db from "../../config/db.js";
import "../../models/initModels.js";
import GovernmentProject from "../projects/project.model.js";
import GovernmentProjectStatusHistory from "../projects/project-history.model.js";
import LoadOrderBatch from "./load-order-batch.model.js";
import Item from "../items/item.model.js";
import Unit from "../units/unit.model.js";
import InventoryMovement from "../inventory/inventory-movement.model.js";
import { recalculateItemStock } from "../inventory/inventory.service.js";
import { normalizeApplicationId } from "../../utils/normalization.js";
import AppError from "../../shared/appError.js";

/**
 * Transactional Commit for Batch-Level Daily Load Order Upload
 * - Creates LoadOrderBatch record with Govt vs Actual items snapshots
 * - Deducts physical inventory ONLY for Actual items count
 * - Links Government Projects and sets status INVOICED and per-project invoice_number
 */
export async function commitLoadOrder({
  invoice_date,
  projects = [],
  govt_items = [],
  actual_items = [],
  notes = null,
}) {
  if (!invoice_date) {
    throw new AppError("Dispatch / Invoice Date is required.", 400);
  }

  if (!projects || !Array.isArray(projects) || projects.length === 0) {
    throw new AppError("At least one Government Project / Application ID is required.", 400);
  }

  const cleanInvoiceDate = String(invoice_date).trim().slice(0, 10);

  // Pre-fetch all active finished goods to validate
  const allItems = await Item.findAll({
    where: { is_active: true },
    include: [{ model: Unit, as: "unit", attributes: ["id", "name", "symbol"] }],
  });
  const itemCache = new Map();
  allItems.forEach((it) => itemCache.set(it.id, it));

  // Sanitize Govt Items
  const sanitizedGovtItems = [];
  let totalGovtQty = 0;
  for (const line of govt_items || []) {
    const qty = parseFloat(line.quantity || 0) || 0;
    if (line.item_id && itemCache.has(line.item_id) && qty > 0) {
      const itemRecord = itemCache.get(line.item_id);
      sanitizedGovtItems.push({
        item_id: itemRecord.id,
        name: itemRecord.name,
        code: itemRecord.code,
        category: itemRecord.category,
        unit: itemRecord.unit?.symbol || "NOS",
        unit_price: parseFloat(line.unit_price || itemRecord.unit_price) || 0,
        quantity: qty,
      });
      totalGovtQty += qty;
    }
  }

  // Sanitize Actual Items (Items to be physically deducted)
  const sanitizedActualItems = [];
  let totalActualQty = 0;
  for (const line of actual_items || []) {
    const qty = parseFloat(line.quantity || 0) || 0;
    if (line.item_id && itemCache.has(line.item_id) && qty > 0) {
      const itemRecord = itemCache.get(line.item_id);
      sanitizedActualItems.push({
        item_id: itemRecord.id,
        name: itemRecord.name,
        code: itemRecord.code,
        category: itemRecord.category,
        unit: itemRecord.unit?.symbol || "NOS",
        unit_price: parseFloat(line.unit_price || itemRecord.unit_price) || 0,
        quantity: qty,
      });
      totalActualQty += qty;
    }
  }

  // Generate unique batch number: LOB-YYYYMMDD-XXXX
  const dateTag = cleanInvoiceDate.replace(/-/g, "");
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const batchNumber = `LOB-${dateTag}-${randomSuffix}`;

  const transaction = await db.transaction();
  let newProjectsCreated = 0;
  let existingProjectsUpdated = 0;
  const processedProjects = [];

  try {
    // 1. Create LoadOrderBatch record
    const batch = await LoadOrderBatch.create(
      {
        batch_number: batchNumber,
        dispatch_date: cleanInvoiceDate,
        total_projects_count: projects.length,
        total_govt_quantity: totalGovtQty,
        total_actual_quantity: totalActualQty,
        projects_snapshot: projects,
        govt_items_snapshot: sanitizedGovtItems,
        actual_items_snapshot: sanitizedActualItems,
        notes: notes ? notes.trim() : null,
      },
      { transaction }
    );

    // 2. Deduct physical inventory ONLY for Actual Items
    for (const item of sanitizedActualItems) {
      if (item.quantity > 0) {
        const itemRecord = itemCache.get(item.item_id);
        await InventoryMovement.create(
          {
            item_id: item.item_id,
            movement_type: "ISSUE",
            quantity: item.quantity,
            unit_id: itemRecord?.unit_id || null,
            reference_type: "LOAD_ORDER_BATCH",
            reference_id: batch.id,
            movement_date: cleanInvoiceDate,
            unit_cost: item.unit_price,
            notes: `Load Order Batch #${batchNumber} dispatch`,
          },
          { transaction }
        );

        // Recalculate on-hand inventory stock
        await recalculateItemStock(item.item_id, transaction);
      }
    }

    // 3. Link or Create Government Projects and mark INVOICED
    for (const projItem of projects) {
      const rawAppId = typeof projItem === "string" ? projItem : projItem?.application_id;
      const appId = normalizeApplicationId(rawAppId);
      if (!appId) continue;

      const invoiceNo =
        projItem?.invoice_number && String(projItem.invoice_number).trim()
          ? String(projItem.invoice_number).trim()
          : null;

      const farmerName = typeof projItem === "object" ? projItem.farmer_name : null;
      const block = typeof projItem === "object" ? projItem.block : null;
      const village = typeof projItem === "object" ? projItem.village : null;
      const areaHa = typeof projItem === "object" ? projItem.area_ha : null;

      // Find project (case-insensitive)
      let project = await GovernmentProject.findOne({
        where: db.where(db.fn("UPPER", db.col("application_id")), appId),
        transaction,
      });

      let isNew = false;
      if (!project) {
        // Create new project with status INVOICED
        project = await GovernmentProject.create(
          {
            application_id: appId,
            farmer_name: farmerName || `Farmer (${appId})`,
            block: block || null,
            village: village || null,
            applied_area_ha: areaHa || null,
            current_status: "INVOICED",
            current_status_date: cleanInvoiceDate,
            invoice_date: cleanInvoiceDate,
            invoice_number: invoiceNo,
          },
          { transaction }
        );

        // Record status history
        await GovernmentProjectStatusHistory.create(
          {
            project_id: project.id,
            status: "INVOICED",
            status_date: cleanInvoiceDate,
            remarks: `Created from Load Order Batch #${batchNumber}${invoiceNo ? ` (Invoice #${invoiceNo})` : ""}`,
            observed_at: new Date(),
          },
          { transaction }
        );

        newProjectsCreated++;
        isNew = true;
      } else {
        // Update existing project without losing forward progress
        const updatePayload = {
          invoice_date: cleanInvoiceDate,
        };

        if (invoiceNo) {
          updatePayload.invoice_number = invoiceNo;
        }

        if (project.current_status === "INVOICED") {
          updatePayload.current_status_date = cleanInvoiceDate;
        }

        await project.update(updatePayload, { transaction });

        // Ensure INVOICED status history exists
        const existingInvoicedHistory = await GovernmentProjectStatusHistory.findOne({
          where: {
            project_id: project.id,
            status: "INVOICED",
          },
          transaction,
        });

        if (!existingInvoicedHistory) {
          await GovernmentProjectStatusHistory.create(
            {
              project_id: project.id,
              status: "INVOICED",
              status_date: cleanInvoiceDate,
              remarks: `Linked from Load Order Batch #${batchNumber}${invoiceNo ? ` (Invoice #${invoiceNo})` : ""}`,
              observed_at: new Date(),
            },
            { transaction }
          );
        }

        existingProjectsUpdated++;
      }

      processedProjects.push({
        project_id: project.id,
        application_id: appId,
        invoice_number: invoiceNo,
        is_new: isNew,
      });
    }

    await transaction.commit();

    return {
      batch_id: batch.id,
      batch_number: batchNumber,
      dispatch_date: cleanInvoiceDate,
      total_projects_count: projects.length,
      new_projects_created: newProjectsCreated,
      existing_projects_updated: existingProjectsUpdated,
      total_govt_quantity: totalGovtQty,
      total_actual_quantity: totalActualQty,
      actual_items_deducted_count: sanitizedActualItems.length,
      processed_projects: processedProjects,
    };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

/**
 * List all Load Order Batches with pagination and date filter
 */
export async function listLoadOrderBatches({
  page = 1,
  limit = 20,
  search = "",
  start_date,
  end_date,
} = {}) {
  const where = {};

  if (search && search.trim()) {
    where.batch_number = { [Op.iLike]: `%${search.trim()}%` };
  }

  if (start_date && end_date) {
    where.dispatch_date = { [Op.between]: [start_date, end_date] };
  } else if (start_date) {
    where.dispatch_date = { [Op.gte]: start_date };
  } else if (end_date) {
    where.dispatch_date = { [Op.lte]: end_date };
  }

  const offset = (page - 1) * limit;

  const { count, rows } = await LoadOrderBatch.findAndCountAll({
    where,
    order: [["created_at", "DESC"]],
    limit: parseInt(limit, 10),
    offset: parseInt(offset, 10),
  });

  return {
    batches: rows,
    pagination: {
      total: count,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      totalPages: Math.ceil(count / limit),
    },
  };
}

/**
 * Get single Load Order Batch details
 */
export async function getLoadOrderBatchById(id) {
  const batch = await LoadOrderBatch.findByPk(id);
  if (!batch) {
    throw new AppError(`Load Order Batch #${id} not found`, 404);
  }
  return batch;
}
