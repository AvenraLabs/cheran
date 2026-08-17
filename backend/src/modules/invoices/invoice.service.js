import { Op } from "sequelize";
import db from "../../config/db.js";
import Invoice from "./invoice.model.js";
import InvoiceItem from "./invoice-item.model.js";
import InventoryMovement from "../inventory/inventory-movement.model.js";
import InventoryStock from "../inventory/inventory-stock.model.js";
import Item from "../items/item.model.js";
import Unit from "../units/unit.model.js";
import Customer from "../customers/customer.model.js";
import GovernmentProject from "../projects/project.model.js";
import Dealer from "../dealers/dealer.model.js";
import DealerCommission from "../dealers/dealer-commission.model.js";
import { recalculateItemStock } from "../inventory/inventory.service.js";
import { getSettingValue } from "../settings/setting.service.js";
import AppError from "../../shared/appError.js";

/**
 * Create and Post a Manual Invoice/Dispatch with atomic inventory deductions
 */
export async function createInvoice({
  invoice_number,
  invoice_date = new Date().toISOString().split("T")[0],
  invoice_type = "DIRECT_SALE", // "GOVERNMENT" | "DIRECT_SALE"
  application_id = null,
  customer_id = null,
  customer_name = null,
  dealer_id = null,
  fittings_percentage = null,
  gst_percentage = null,
  notes = null,
  items,
}) {
  if (!invoice_number || !invoice_number.trim()) {
    throw new AppError("Invoice number is required", 400);
  }
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new AppError("At least one invoice item is required", 400);
  }

  const cleanInvoiceNo = invoice_number.trim();

  // 1. Check duplicate invoice number for invoice type
  const existing = await Invoice.findOne({
    where: {
      invoice_number: cleanInvoiceNo,
      invoice_type,
    },
  });
  if (existing) {
    throw new AppError(
      `Invoice with number '${cleanInvoiceNo}' already exists for invoice type '${invoice_type}'.`,
      409
    );
  }

  // 2. Government Project Linking by Application ID
  let resolvedProjectId = null;
  let resolvedDealerId = dealer_id || null;
  let resolvedCustomerName = customer_name ? customer_name.trim() : null;

  if (invoice_type === "GOVERNMENT" || application_id) {
    if (!application_id || !application_id.trim()) {
      throw new AppError("Application ID is required for Government invoices.", 400);
    }

    const cleanAppId = application_id.trim();
    const project = await GovernmentProject.findOne({
      where: { application_id: cleanAppId },
    });

    if (!project) {
      throw new AppError("Government project not found for Application ID.", 404);
    }

    resolvedProjectId = project.id;
    if (!resolvedCustomerName) {
      resolvedCustomerName = project.farmer_name || `Govt Project ${cleanAppId}`;
    }
    if (!resolvedDealerId && project.dealer_id) {
      resolvedDealerId = project.dealer_id;
    }
  } else if (customer_id) {
    const customer = await Customer.findByPk(customer_id);
    if (!customer) {
      throw new AppError(`Customer not found with ID ${customer_id}`, 404);
    }
    if (!resolvedCustomerName) {
      resolvedCustomerName = customer.name;
    }
  }

  // 3. Retrieve system settings for calculations
  const allowNegativeStockSetting = await getSettingValue("ALLOW_NEGATIVE_STOCK", false);
  const defaultFittingsPct = await getSettingValue("FITTINGS_PERCENTAGE", 5.0);
  const defaultGstPct = await getSettingValue("DEFAULT_GST_PERCENTAGE", 5.0);

  const effectiveFittingsPct =
    fittings_percentage !== null && fittings_percentage !== undefined
      ? parseFloat(fittings_percentage)
      : parseFloat(defaultFittingsPct);

  const effectiveGstPct =
    gst_percentage !== null && gst_percentage !== undefined
      ? parseFloat(gst_percentage)
      : parseFloat(defaultGstPct);

  return await db.transaction(async (transaction) => {
    let netItemTotal = 0;
    const validatedItems = [];

    // 4. Validate items, snapshots, and check for stock availability
    for (const line of items) {
      const itemRecord = await Item.findByPk(line.item_id, {
        include: [{ model: Unit, as: "unit" }],
        transaction,
      });

      if (!itemRecord) {
        throw new AppError(`Item not found with ID ${line.item_id}`, 404);
      }

      const qty = parseFloat(line.quantity);
      if (isNaN(qty) || qty <= 0) {
        throw new AppError(`Invalid quantity for item '${itemRecord.name}'`, 400);
      }

      const unitPrice = parseFloat(line.unit_price || 0);
      if (isNaN(unitPrice) || unitPrice < 0) {
        throw new AppError(`Invalid unit price for item '${itemRecord.name}'`, 400);
      }

      // Check stock availability
      if (!allowNegativeStockSetting) {
        const stockRecord = await InventoryStock.findOne({
          where: { item_id: itemRecord.id },
          transaction,
        });

        const availableStock = stockRecord ? parseFloat(stockRecord.quantity_on_hand) : 0.0;
        if (availableStock < qty) {
          throw new AppError(
            `Insufficient stock for ${itemRecord.name}. Available: ${availableStock} ${itemRecord.unit?.symbol || "units"}, Requested: ${qty} ${itemRecord.unit?.symbol || "units"}`,
            400
          );
        }
      }

      const lineTotal = parseFloat((qty * unitPrice).toFixed(2));
      netItemTotal += lineTotal;

      const unitRecord = line.unit_id ? await Unit.findByPk(line.unit_id, { transaction }) : itemRecord.unit;

      validatedItems.push({
        item_id: itemRecord.id,
        item_name_snapshot: itemRecord.name,
        unit_id: unitRecord ? unitRecord.id : itemRecord.unit_id,
        unit_snapshot: unitRecord ? unitRecord.symbol : "NOS",
        quantity: qty,
        unit_price: unitPrice,
        line_total: lineTotal,
      });
    }

    // Recalculate totals backend-side
    const netItemAmount = parseFloat(netItemTotal.toFixed(2));
    const fittingsAmount = parseFloat(((netItemAmount * effectiveFittingsPct) / 100).toFixed(2));
    const taxableAmount = parseFloat((netItemAmount + fittingsAmount).toFixed(2));
    const gstAmount = parseFloat(((taxableAmount * effectiveGstPct) / 100).toFixed(2));
    const grandTotal = parseFloat((taxableAmount + gstAmount).toFixed(2));

    // 5. Create Invoice record
    const invoice = await Invoice.create(
      {
        invoice_number: cleanInvoiceNo,
        invoice_date,
        customer_name: resolvedCustomerName,
        customer_id: customer_id || null,
        government_project_id: resolvedProjectId || null,
        dealer_id: resolvedDealerId || null,
        net_item_amount: netItemAmount,
        fittings_percentage: effectiveFittingsPct,
        fittings_amount: fittingsAmount,
        taxable_amount: taxableAmount,
        gst_amount: gstAmount,
        total_amount: grandTotal,
        invoice_type,
        status: "POSTED",
        notes: notes ? notes.trim() : null,
      },
      { transaction }
    );

    // 6. Create Invoice Items and Inventory Movement OUT (DISPATCH)
    for (const itemLine of validatedItems) {
      await InvoiceItem.create(
        {
          invoice_id: invoice.id,
          item_id: itemLine.item_id,
          item_name_snapshot: itemLine.item_name_snapshot,
          unit_id: itemLine.unit_id,
          unit_snapshot: itemLine.unit_snapshot,
          quantity: itemLine.quantity,
          unit_price: itemLine.unit_price,
          line_total: itemLine.line_total,
        },
        { transaction }
      );

      // Create Inventory Movement OUT (DISPATCH)
      await InventoryMovement.create(
        {
          item_id: itemLine.item_id,
          movement_type: "DISPATCH",
          quantity: itemLine.quantity,
          unit_id: itemLine.unit_id,
          reference_type: "INVOICE",
          reference_id: invoice.id,
          movement_date: invoice_date,
          unit_cost: itemLine.unit_price,
          notes: `Invoice #${cleanInvoiceNo} (${invoice_type})`,
        },
        { transaction }
      );

      // Update cached on-hand stock
      await recalculateItemStock(itemLine.item_id, transaction);
    }

    // 7. Calculate Dealer Commission on NET ITEM TOTAL if dealer present
    if (resolvedDealerId) {
      const dealer = await Dealer.findByPk(resolvedDealerId, { transaction });
      if (dealer && parseFloat(dealer.commission_percentage || 0) > 0) {
        const commRate = parseFloat(dealer.commission_percentage);
        const commAmount = parseFloat(((netItemAmount * commRate) / 100).toFixed(2));

        await DealerCommission.create(
          {
            dealer_id: dealer.id,
            project_id: resolvedProjectId || null,
            commission_percentage: commRate,
            base_amount: netItemAmount,
            commission_amount: commAmount,
            status: "PENDING",
            notes: `Auto-generated from Invoice #${cleanInvoiceNo}`,
          },
          { transaction }
        );
      }
    }

    return invoice;
  });
}

/**
 * Get Invoice by ID with full item details and project/dealer associations
 */
export async function getInvoiceById(id) {
  const invoice = await Invoice.findByPk(id, {
    include: [
      {
        model: InvoiceItem,
        as: "items",
        include: [
          { model: Item, as: "item", attributes: ["id", "code", "name", "item_type"] },
          { model: Unit, as: "unit", attributes: ["id", "name", "symbol"] },
        ],
      },
      {
        model: GovernmentProject,
        as: "government_project",
        attributes: ["id", "application_id", "farmer_name", "district", "block", "current_status"],
      },
      {
        model: Dealer,
        as: "dealer",
        attributes: ["id", "name", "commission_percentage"],
      },
      {
        model: Customer,
        as: "customer",
        attributes: ["id", "name", "phone", "email", "gst_number"],
      },
    ],
  });

  if (!invoice) {
    throw new AppError(`Invoice not found with ID ${id}`, 404);
  }

  return invoice;
}

/**
 * List Invoices with pagination and multi-dimensional filters
 */
export async function listInvoices({
  search,
  invoice_type,
  status,
  government_project_id,
  dealer_id,
  customer_id,
  start_date,
  end_date,
  page = 1,
  limit = 50,
} = {}) {
  const where = {};
  if (invoice_type) where.invoice_type = invoice_type;
  if (status) where.status = status;
  if (government_project_id) where.government_project_id = government_project_id;
  if (dealer_id) where.dealer_id = dealer_id;
  if (customer_id) where.customer_id = customer_id;

  if (start_date && end_date) {
    where.invoice_date = { [Op.between]: [start_date, end_date] };
  } else if (start_date) {
    where.invoice_date = { [Op.gte]: start_date };
  } else if (end_date) {
    where.invoice_date = { [Op.lte]: end_date };
  }

  if (search) {
    where[Op.or] = [
      { invoice_number: { [Op.iLike]: `%${search.trim()}%` } },
      { customer_name: { [Op.iLike]: `%${search.trim()}%` } },
      { notes: { [Op.iLike]: `%${search.trim()}%` } },
    ];
  }

  const offset = (page - 1) * limit;

  const { rows, count } = await Invoice.findAndCountAll({
    where,
    include: [
      {
        model: InvoiceItem,
        as: "items",
        attributes: ["id", "item_name_snapshot", "unit_snapshot", "quantity", "unit_price", "line_total"],
      },
      {
        model: GovernmentProject,
        as: "government_project",
        attributes: ["id", "application_id", "farmer_name", "district"],
      },
      {
        model: Dealer,
        as: "dealer",
        attributes: ["id", "name"],
      },
    ],
    order: [["invoice_date", "DESC"], ["created_at", "DESC"]],
    limit,
    offset,
  });

  return {
    invoices: rows,
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    },
  };
}

/**
 * Cancel a POSTED invoice with complete atomic inventory and commission reversal
 */
export async function cancelInvoice(id, reason = null) {
  const invoice = await Invoice.findByPk(id, {
    include: [{ model: InvoiceItem, as: "items" }],
  });

  if (!invoice) {
    throw new AppError(`Invoice not found with ID ${id}`, 404);
  }

  if (invoice.status === "CANCELLED") {
    throw new AppError("Invoice is already cancelled", 400);
  }

  return await db.transaction(async (transaction) => {
    // 1. Create reversal movements for all invoice items
    for (const line of invoice.items || []) {
      await InventoryMovement.create(
        {
          item_id: line.item_id,
          movement_type: "REVERSAL",
          quantity: line.quantity,
          unit_id: line.unit_id,
          reference_type: "INVOICE_CANCELLATION",
          reference_id: invoice.id,
          movement_date: new Date().toISOString().split("T")[0],
          notes: `Reversal of Invoice #${invoice.invoice_number} cancellation: ${reason || "User cancelled"}`,
        },
        { transaction }
      );

      // Restore inventory stock
      await recalculateItemStock(line.item_id, transaction);
    }

    // 2. Cancel linked dealer commission if project was linked
    if (invoice.government_project_id) {
      await DealerCommission.update(
        { status: "CANCELLED", notes: `Cancelled due to Invoice #${invoice.invoice_number} cancellation` },
        { where: { project_id: invoice.government_project_id }, transaction }
      );
    }

    // 3. Mark invoice as CANCELLED
    await invoice.update(
      {
        status: "CANCELLED",
        notes: [invoice.notes, `CANCELLED: ${reason || "User cancelled"}`].filter(Boolean).join(" | "),
      },
      { transaction }
    );

    return invoice;
  });
}

/**
 * Get all invoices and dispatched materials for a specific government project
 */
export async function getProjectInvoices(projectId) {
  const project = await GovernmentProject.findByPk(projectId);
  if (!project) {
    throw new AppError(`Government project not found with ID ${projectId}`, 404);
  }

  const invoices = await Invoice.findAll({
    where: { government_project_id: projectId },
    include: [
      {
        model: InvoiceItem,
        as: "items",
      },
      {
        model: Dealer,
        as: "dealer",
        attributes: ["id", "name"],
      },
    ],
    order: [["invoice_date", "DESC"]],
  });

  // Calculate dispatched materials summary across all project invoices
  const materialSummary = {};
  for (const inv of invoices) {
    if (inv.status === "POSTED") {
      for (const line of inv.items || []) {
        const key = `${line.item_name_snapshot}_${line.unit_snapshot}`;
        if (!materialSummary[key]) {
          materialSummary[key] = {
            item_name: line.item_name_snapshot,
            unit: line.unit_snapshot,
            total_quantity: 0,
            total_amount: 0,
          };
        }
        materialSummary[key].total_quantity += parseFloat(line.quantity) || 0;
        materialSummary[key].total_amount += parseFloat(line.line_total) || 0;
      }
    }
  }

  return {
    project: {
      id: project.id,
      application_id: project.application_id,
      farmer_name: project.farmer_name,
      current_status: project.current_status,
    },
    invoices,
    dispatchedMaterials: Object.values(materialSummary),
  };
}
