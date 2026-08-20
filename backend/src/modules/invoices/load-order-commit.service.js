import db from "../../config/db.js";
import "../../models/initModels.js";
import GovernmentProject from "../projects/project.model.js";
import GovernmentProjectStatusHistory from "../projects/project-history.model.js";
import Invoice from "./invoice.model.js";
import InvoiceItem from "./invoice-item.model.js";
import Item from "../items/item.model.js";
import Unit from "../units/unit.model.js";
import { calculateInvoiceTotals } from "../../utils/finance.js";
import AppError from "../../shared/appError.js";

/**
 * Transactional Commit for Daily Load Order Upload (supports per-project items and counts)
 */
export async function commitLoadOrder({
  invoice_date,
  projects = [],
  global_items = [],
  fittings_percentage = 5.0,
  gst_percentage = 5.0,
  notes = null,
}) {
  if (!invoice_date) {
    throw new AppError("Invoice / INVOICED Date is required.", 400);
  }

  if (!projects || !Array.isArray(projects) || projects.length === 0) {
    throw new AppError("At least one Government Project / Application ID is required.", 400);
  }

  const cleanInvoiceDate = String(invoice_date).trim().slice(0, 10);

  // Pre-fetch all active items to avoid repeated DB queries during validation
  const allItems = await Item.findAll({
    include: [{ model: Unit, as: "unit" }],
  });
  const itemCache = new Map();
  allItems.forEach((it) => itemCache.set(it.id, it));

  const validateProjectItems = (rawItems) => {
    const validated = [];
    for (const line of rawItems || []) {
      const qty = parseFloat(line.quantity || 0) || 0;
      if (qty < 0) {
        throw new AppError(`Invalid quantity for item ${line.name || line.item_id}`, 400);
      }

      if (line.item_id && itemCache.has(line.item_id)) {
        const itemRecord = itemCache.get(line.item_id);
        const unitPrice =
          parseFloat(line.unit_price !== undefined ? line.unit_price : itemRecord.unit_price) || 0.0;
        validated.push({
          item_id: itemRecord.id,
          item_name_snapshot: itemRecord.name,
          unit_id: itemRecord.unit_id,
          unit_snapshot: itemRecord.unit?.symbol || "NOS",
          quantity: qty,
          unit_price: unitPrice,
          line_total: Math.round(qty * unitPrice * 100) / 100,
        });
      }
    }
    return validated;
  };

  const transaction = await db.transaction();
  let newProjectsCreated = 0;
  let existingProjectsUpdated = 0;
  let invoicesCreated = 0;
  let totalBatchInvoiceAmount = 0;
  const processedProjects = [];

  try {
    for (const projItem of projects) {
      const rawAppId = typeof projItem === "string" ? projItem : projItem?.application_id;
      const appId = rawAppId ? String(rawAppId).trim().toUpperCase() : null;
      if (!appId) continue;

      const farmerName = typeof projItem === "object" ? projItem.farmer_name : null;
      const block = typeof projItem === "object" ? projItem.block : null;
      const village = typeof projItem === "object" ? projItem.village : null;
      const areaHa = typeof projItem === "object" ? projItem.area_ha : null;

      // 1. Calculate project-specific invoice totals
      const rawProjectItems =
        typeof projItem === "object" && Array.isArray(projItem.items) && projItem.items.length > 0
          ? projItem.items
          : global_items;

      const validatedItems = validateProjectItems(rawProjectItems);
      const projectInvoiceTotals = calculateInvoiceTotals(
        validatedItems,
        fittings_percentage,
        gst_percentage
      );

      totalBatchInvoiceAmount += projectInvoiceTotals.grand_total;

      // 2. Find or Create Government Project (case-insensitive)
      let project = await GovernmentProject.findOne({
        where: db.where(db.fn("UPPER", db.col("application_id")), appId),
        transaction,
      });

      let isNew = false;
      if (!project) {
        // Create new project with baseline INVOICED status
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
            invoice_amount: projectInvoiceTotals.grand_total,
          },
          { transaction }
        );

        // Record initial status history
        await GovernmentProjectStatusHistory.create(
          {
            project_id: project.id,
            status: "INVOICED",
            status_date: cleanInvoiceDate,
            remarks: notes || "Created from Daily Load Order upload",
            observed_at: new Date(),
          },
          { transaction }
        );

        newProjectsCreated++;
        isNew = true;
      } else {
        // Project exists: update invoice_date & invoice_amount without overwriting progressed lifecycle status!
        const updatePayload = {
          invoice_date: cleanInvoiceDate,
          invoice_amount: projectInvoiceTotals.grand_total,
        };

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
              remarks: notes || "Linked from Daily Load Order upload",
              observed_at: new Date(),
            },
            { transaction }
          );
        } else {
          await existingInvoicedHistory.update(
            { status_date: cleanInvoiceDate },
            { transaction }
          );
        }

        existingProjectsUpdated++;
      }

      // 3. Create or update Invoice record for this project
      const dateTag = cleanInvoiceDate.replace(/-/g, "");
      const shortAppId = appId.replace(/[^A-Za-z0-9]/g, "").slice(-8);
      const generatedInvoiceNo = `LO-${dateTag}-${shortAppId}`;

      let invoice = await Invoice.findOne({
        where: {
          government_project_id: project.id,
          source: "LOAD_ORDER",
        },
        transaction,
      });

      if (!invoice) {
        invoice = await Invoice.create(
          {
            invoice_number: generatedInvoiceNo,
            invoice_date: cleanInvoiceDate,
            customer_name: project.farmer_name || "Government Project Farmer",
            government_project_id: project.id,
            dealer_id: project.dealer_id || null,
            net_item_amount: projectInvoiceTotals.item_net_total,
            fittings_percentage: projectInvoiceTotals.fittings_percentage,
            fittings_amount: projectInvoiceTotals.fittings_amount,
            taxable_amount: projectInvoiceTotals.subtotal_before_gst,
            gst_amount: projectInvoiceTotals.gst_amount,
            total_amount: projectInvoiceTotals.grand_total,
            invoice_type: "GOVERNMENT",
            status: "POSTED",
            source: "LOAD_ORDER",
            notes: notes ? notes.trim() : `Daily Load Order Dispatch (${cleanInvoiceDate})`,
          },
          { transaction }
        );
        invoicesCreated++;
      } else {
        await invoice.update(
          {
            invoice_date: cleanInvoiceDate,
            net_item_amount: projectInvoiceTotals.item_net_total,
            fittings_percentage: projectInvoiceTotals.fittings_percentage,
            fittings_amount: projectInvoiceTotals.fittings_amount,
            taxable_amount: projectInvoiceTotals.subtotal_before_gst,
            gst_amount: projectInvoiceTotals.gst_amount,
            total_amount: projectInvoiceTotals.grand_total,
            notes: notes ? notes.trim() : invoice.notes,
          },
          { transaction }
        );

        // Delete existing items for clean replacement
        await InvoiceItem.destroy({
          where: { invoice_id: invoice.id },
          transaction,
        });
      }

      // 4. Create Invoice Items for items with quantity > 0
      for (const line of projectInvoiceTotals.items) {
        if (line.quantity > 0) {
          await InvoiceItem.create(
            {
              invoice_id: invoice.id,
              item_id: line.item_id,
              item_name_snapshot: line.item_name_snapshot,
              unit_id: line.unit_id,
              unit_snapshot: line.unit_snapshot,
              quantity: line.quantity,
              unit_price: line.unit_price,
              rate: line.unit_price,
              line_total: line.line_total,
            },
            { transaction }
          );
        }
      }

      processedProjects.push({
        application_id: appId,
        is_new_project: isNew,
        invoice_number: invoice.invoice_number,
        invoice_date: cleanInvoiceDate,
        total_amount: projectInvoiceTotals.grand_total,
        financialSummary: projectInvoiceTotals,
      });
    }

    await transaction.commit();

    return {
      message: `Successfully processed ${processedProjects.length} Load Order projects`,
      totalProjectsProcessed: processedProjects.length,
      newProjectsCreated,
      existingProjectsUpdated,
      invoicesCreated,
      invoice_date: cleanInvoiceDate,
      totalBatchInvoiceAmount: Math.round(totalBatchInvoiceAmount * 100) / 100,
      projects: processedProjects,
    };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}
