import { Op } from "sequelize";
import db from "../../config/db.js";
import "../../models/initModels.js";
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
import { recalculateItemStock, applyStockMovement } from "../inventory/inventory.service.js";
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

    const cleanAppId = application_id.trim().toUpperCase();
    let project = await GovernmentProject.findOne({
      where: db.where(db.fn("UPPER", db.col("application_id")), cleanAppId),
    });

    if (!project) {
      // Auto-create new Government Project with status INVOICED
      const farmerTitle = resolvedCustomerName || `Farmer (${cleanAppId})`;
      project = await GovernmentProject.create({
        application_id: cleanAppId,
        farmer_name: farmerTitle,
        current_status: "INVOICED",
        current_status_date: invoice_date,
        invoice_date: invoice_date,
        invoice_number: cleanInvoiceNo,
        invoice_amount: 0, // will be updated below once grandTotal is calculated
        dealer_id: resolvedDealerId || null,
      });

      // Record baseline INVOICED status history
      const { default: GovernmentProjectStatusHistory } = await import("../projects/project-history.model.js");
      await GovernmentProjectStatusHistory.create({
        project_id: project.id,
        status: "INVOICED",
        status_date: invoice_date,
        remarks: `Manually created from invoice #${cleanInvoiceNo}`,
      });
    } else {
      // Enforce Rule 23: ONE Government Project = ONE Invoice
      const existingGovInvoice = await Invoice.findOne({
        where: {
          government_project_id: project.id,
          status: { [Op.ne]: "CANCELLED" },
        },
      });

      if (existingGovInvoice) {
        throw new AppError(
          `Government Project '${cleanAppId}' already has an active invoice (#${existingGovInvoice.invoice_number}). One Government Project allows only one invoice.`,
          400
        );
      }

      // Ensure INVOICED status history exists for baseline
      const { default: GovernmentProjectStatusHistory } = await import("../projects/project-history.model.js");
      const existingInvoicedHistory = await GovernmentProjectStatusHistory.findOne({
        where: {
          project_id: project.id,
          status: "INVOICED",
        },
      });

      if (!existingInvoicedHistory) {
        await GovernmentProjectStatusHistory.create({
          project_id: project.id,
          status: "INVOICED",
          status_date: invoice_date,
          remarks: `Initial invoice stage linked from manual invoice #${cleanInvoiceNo}`,
        });
      } else if (!existingInvoicedHistory.status_date || new Date(invoice_date) < new Date(existingInvoicedHistory.status_date)) {
        await existingInvoicedHistory.update({ status_date: invoice_date });
      }

      if (!project.invoice_date || new Date(invoice_date) < new Date(project.invoice_date)) {
        await project.update({ invoice_date });
      }
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

  // 3. Calculation parameters
  const allowNegativeStockSetting = false;
  const effectiveFittingsPct =
    fittings_percentage !== null && fittings_percentage !== undefined
      ? parseFloat(fittings_percentage)
      : 5.0;

  const effectiveGstPct =
    gst_percentage !== null && gst_percentage !== undefined
      ? parseFloat(gst_percentage)
      : 5.0;

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

      // Check stock availability with exclusive row lock to prevent concurrent race condition overselling
      if (!allowNegativeStockSetting) {
        const stockRecord = await InventoryStock.findOne({
          where: { item_id: itemRecord.id },
          lock: transaction.LOCK.UPDATE,
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

      // Atomic O(1) Inventory Movement OUT (DISPATCH)
      await applyStockMovement({
        itemId: itemLine.item_id,
        movementType: "DISPATCH",
        quantity: itemLine.quantity,
        unitId: itemLine.unit_id,
        referenceType: "INVOICE",
        referenceId: invoice.id,
        movementDate: invoice_date,
        unitCost: itemLine.unit_price,
        notes: `Invoice #${cleanInvoiceNo} (${invoice_type})`,
        transaction,
      });
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

    if (resolvedProjectId) {
      await GovernmentProject.update(
        {
          invoice_amount: grandTotal,
          invoice_date: invoice_date,
          invoice_number: cleanInvoiceNo,
        },
        { where: { id: resolvedProjectId }, transaction }
      );
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
  payment_status,
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
  if (payment_status && payment_status !== "ALL") {
    if (payment_status === "PENDING") {
      where.payment_status = { [Op.in]: ["UNPAID", "PARTIALLY_PAID"] };
    } else {
      where.payment_status = payment_status;
    }
  }
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
      { payment_reference: { [Op.iLike]: `%${search.trim()}%` } },
      { notes: { [Op.iLike]: `%${search.trim()}%` } },
    ];
  }

  const offset = (page - 1) * limit;

  const { rows, count } = await Invoice.findAndCountAll({
    where,
    distinct: true,
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
      await applyStockMovement({
        itemId: line.item_id,
        movementType: "REVERSAL",
        quantity: line.quantity,
        unitId: line.unit_id,
        referenceType: "INVOICE_CANCELLATION",
        referenceId: invoice.id,
        movementDate: new Date().toISOString().split("T")[0],
        notes: `Reversal of Invoice #${invoice.invoice_number} cancellation: ${reason || "User cancelled"}`,
        transaction,
      });
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

/**
 * Record a payment / collection installment against a commercial or government invoice
 */
export async function recordInvoicePayment(id, { amount, payment_date, payment_reference, notes }) {
  const invoice = await Invoice.findByPk(id);
  if (!invoice) {
    throw new AppError(`Invoice not found with ID ${id}`, 404);
  }
  if (invoice.status === "CANCELLED") {
    throw new AppError("Cannot record payment for a cancelled invoice", 400);
  }

  const paymentAmount = parseFloat(amount);
  if (isNaN(paymentAmount) || paymentAmount <= 0) {
    throw new AppError("Payment amount must be greater than 0", 400);
  }

  const currentPaid = parseFloat(invoice.paid_amount || 0);
  const totalAmount = parseFloat(invoice.total_amount || 0);
  const newPaidAmount = parseFloat((currentPaid + paymentAmount).toFixed(2));

  const paymentDate = payment_date || new Date().toISOString().split("T")[0];
  const paymentRef = payment_reference ? payment_reference.trim() : "Direct Payment";

  let newPaymentStatus = "UNPAID";
  if (newPaidAmount >= totalAmount) {
    newPaymentStatus = "PAID";
  } else if (newPaidAmount > 0) {
    newPaymentStatus = "PARTIALLY_PAID";
  }

  const currentHistory = Array.isArray(invoice.payment_history) ? invoice.payment_history : [];
  const updatedHistory = [
    ...currentHistory,
    {
      amount: paymentAmount,
      payment_date: paymentDate,
      payment_reference: paymentRef,
      notes: notes ? notes.trim() : null,
      recorded_at: new Date().toISOString(),
    },
  ];

  await invoice.update({
    paid_amount: newPaidAmount,
    payment_status: newPaymentStatus,
    payment_date: paymentDate,
    payment_reference: paymentRef,
    payment_history: updatedHistory,
  });

  return await getInvoiceById(invoice.id);
}
