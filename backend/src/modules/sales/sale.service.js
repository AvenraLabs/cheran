import { Op } from "sequelize";
import db from "../../config/db.js";
import Sale from "./sale.model.js";
import SaleItem from "./sale-item.model.js";
import CustomerPayment from "./customer-payment.model.js";
import Customer from "../customers/customer.model.js";
import Item from "../items/item.model.js";
import Unit from "../units/unit.model.js";
import InventoryMovement from "../inventory/inventory-movement.model.js";
import { recalculateItemStock } from "../inventory/inventory.service.js";
import { getSettingValue } from "../settings/setting.service.js";
import AppError from "../../shared/appError.js";

/**
 * Create a Manual Direct Sale with 5% Fittings rule and atomic Inventory OUT movement
 */
export async function createSale({
  customer_id,
  project_id = null,
  invoice_number = null,
  sale_date = new Date().toISOString().split("T")[0],
  fittings_percentage = null,
  gst_percentage = null,
  notes = null,
  items,
}) {
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new AppError("At least one sale item is required", 400);
  }

  const customer = await Customer.findByPk(customer_id);
  if (!customer) {
    throw new AppError(`Customer not found with ID ${customer_id}`, 404);
  }

  // Load configured fittings & tax percentages if not overridden
  const defaultFittingsPct = await getSettingValue("FITTINGS_PERCENTAGE", 5.0);
  const defaultGstPct = await getSettingValue("DEFAULT_GST_PERCENTAGE", 18.0);

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

    for (const line of items) {
      const itemRecord = await Item.findByPk(line.item_id, { transaction });
      if (!itemRecord) {
        throw new AppError(`Item not found with ID ${line.item_id}`, 404);
      }

      const qty = parseFloat(line.quantity);
      if (isNaN(qty) || qty <= 0) {
        throw new AppError(`Invalid quantity for item ${itemRecord.name}`, 400);
      }

      const unitPrice = parseFloat(line.unit_price || 0);
      const lineTotal = parseFloat((qty * unitPrice).toFixed(2));
      netItemTotal += lineTotal;

      validatedItems.push({
        item_id: itemRecord.id,
        unit_id: line.unit_id || itemRecord.unit_id,
        quantity: qty,
        unit_price: unitPrice,
        total_amount: lineTotal,
      });
    }

    // Business calculations
    const netItemAmount = parseFloat(netItemTotal.toFixed(2));
    const fittingsAmount = parseFloat(((netItemAmount * effectiveFittingsPct) / 100).toFixed(2));
    const taxableAmount = parseFloat((netItemAmount + fittingsAmount).toFixed(2));
    const gstAmount = parseFloat(((taxableAmount * effectiveGstPct) / 100).toFixed(2));
    const grandTotal = parseFloat((taxableAmount + gstAmount).toFixed(2));

    // 1. Create Sale Record
    const sale = await Sale.create(
      {
        customer_id,
        project_id: project_id || null,
        invoice_number: invoice_number ? invoice_number.trim() : null,
        sale_date,
        net_item_amount: netItemAmount,
        fittings_percentage: effectiveFittingsPct,
        fittings_amount: fittingsAmount,
        taxable_amount: taxableAmount,
        gst_percentage: effectiveGstPct,
        gst_amount: gstAmount,
        total_amount: grandTotal,
        status: "CONFIRMED",
        notes: notes ? notes.trim() : null,
      },
      { transaction }
    );

    // 2. Create Sale Items & Inventory Movements OUT
    for (const itemLine of validatedItems) {
      await SaleItem.create(
        {
          sale_id: sale.id,
          item_id: itemLine.item_id,
          unit_id: itemLine.unit_id,
          quantity: itemLine.quantity,
          unit_price: itemLine.unit_price,
          total_amount: itemLine.total_amount,
        },
        { transaction }
      );

      // Create Inventory Movement OUT
      await InventoryMovement.create(
        {
          item_id: itemLine.item_id,
          movement_type: "SALE",
          quantity: itemLine.quantity,
          unit_id: itemLine.unit_id,
          reference_type: "SALE",
          reference_id: sale.id,
          movement_date: sale_date,
          unit_cost: itemLine.unit_price,
          notes: notes || `Direct Sale ref ${invoice_number || sale.id.slice(0, 8)}`,
        },
        { transaction }
      );

      // Recalculate stock
      await recalculateItemStock(itemLine.item_id, transaction);
    }

    return sale;
  });
}

/**
 * Get Sale by ID with full item and payment breakdown
 */
export async function getSaleById(id) {
  const sale = await Sale.findByPk(id, {
    include: [
      {
        model: Customer,
        as: "customer",
        attributes: ["id", "name", "phone", "email", "gst_number"],
      },
      {
        model: SaleItem,
        as: "items",
        include: [
          {
            model: Item,
            as: "item",
            attributes: ["id", "name", "code", "item_type"],
          },
          {
            model: Unit,
            as: "unit",
            attributes: ["id", "name", "symbol"],
          },
        ],
      },
      {
        model: CustomerPayment,
        as: "payments",
      },
    ],
  });

  if (!sale) {
    throw new AppError(`Sale not found with ID ${id}`, 404);
  }

  const totalPaid = (sale.payments || []).reduce(
    (acc, curr) => acc + (parseFloat(curr.amount) || 0),
    0
  );
  const balanceDue = parseFloat((parseFloat(sale.total_amount) - totalPaid).toFixed(2));

  return {
    ...sale.toJSON(),
    totalPaid: parseFloat(totalPaid.toFixed(2)),
    balanceDue: balanceDue > 0 ? balanceDue : 0.0,
  };
}

/**
 * List Sales with pagination and filters
 */
export async function listSales({ customer_id, start_date, end_date, search, page = 1, limit = 50 } = {}) {
  const where = {};
  if (customer_id) where.customer_id = customer_id;
  if (start_date && end_date) {
    where.sale_date = { [Op.between]: [start_date, end_date] };
  } else if (start_date) {
    where.sale_date = { [Op.gte]: start_date };
  } else if (end_date) {
    where.sale_date = { [Op.lte]: end_date };
  }
  if (search) {
    where[Op.or] = [
      { invoice_number: { [Op.iLike]: `%${search.trim()}%` } },
      { notes: { [Op.iLike]: `%${search.trim()}%` } },
    ];
  }

  const offset = (page - 1) * limit;

  const { rows, count } = await Sale.findAndCountAll({
    where,
    include: [
      {
        model: Customer,
        as: "customer",
        attributes: ["id", "name", "phone"],
      },
      {
        model: CustomerPayment,
        as: "payments",
        attributes: ["id", "amount", "payment_date", "payment_method"],
      },
    ],
    order: [["sale_date", "DESC"], ["created_at", "DESC"]],
    limit,
    offset,
  });

  const formattedSales = rows.map((s) => {
    const totalPaid = (s.payments || []).reduce(
      (acc, curr) => acc + (parseFloat(curr.amount) || 0),
      0
    );
    const balanceDue = parseFloat((parseFloat(s.total_amount) - totalPaid).toFixed(2));
    return {
      ...s.toJSON(),
      totalPaid: parseFloat(totalPaid.toFixed(2)),
      balanceDue: balanceDue > 0 ? balanceDue : 0.0,
    };
  });

  return {
    sales: formattedSales,
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    },
  };
}

/**
 * Record payment for a sale
 */
export async function recordCustomerPayment({
  sale_id,
  customer_id = null,
  amount,
  payment_date = new Date().toISOString().split("T")[0],
  payment_method = "CASH",
  reference = null,
  notes = null,
}) {
  const sale = await Sale.findByPk(sale_id);
  if (!sale) {
    throw new AppError(`Sale not found with ID ${sale_id}`, 404);
  }

  const amt = parseFloat(amount);
  if (isNaN(amt) || amt <= 0) {
    throw new AppError("Payment amount must be positive", 400);
  }

  const payment = await CustomerPayment.create({
    sale_id: sale.id,
    customer_id: customer_id || sale.customer_id,
    amount: amt,
    payment_date,
    payment_method,
    reference: reference ? reference.trim() : null,
    notes: notes ? notes.trim() : null,
  });

  return payment;
}
