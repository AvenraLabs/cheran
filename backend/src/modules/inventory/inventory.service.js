import { Op } from "sequelize";
import db from "../../config/db.js";
import StockReceipt from "./stock-receipt.model.js";
import StockReceiptItem from "./stock-receipt-item.model.js";
import InventoryMovement from "./inventory-movement.model.js";
import InventoryStock from "./inventory-stock.model.js";
import Item from "../items/item.model.js";
import Unit from "../units/unit.model.js";
import Supplier from "../suppliers/supplier.model.js";
import AppError from "../../shared/appError.js";

export const IN_MOVEMENT_TYPES = ["OPENING", "PURCHASE", "ADJUSTMENT_IN", "PRODUCTION_IN", "REVERSAL"];
export const OUT_MOVEMENT_TYPES = ["ADJUSTMENT_OUT", "SALE", "DISPATCH", "PRODUCTION_OUT"];

/**
 * Recalculate true on-hand quantity from inventory_movements source of truth
 */
export async function recalculateItemStock(itemId, transaction = null) {
  const movements = await InventoryMovement.findAll({
    where: { item_id: itemId },
    transaction,
  });

  let totalIn = 0;
  let totalOut = 0;

  for (const m of movements) {
    const qty = parseFloat(m.quantity) || 0;
    if (IN_MOVEMENT_TYPES.includes(m.movement_type)) {
      totalIn += qty;
    } else if (OUT_MOVEMENT_TYPES.includes(m.movement_type)) {
      totalOut += qty;
    }
  }

  const netQuantity = parseFloat((totalIn - totalOut).toFixed(3));

  const [stockRecord] = await InventoryStock.findOrCreate({
    where: { item_id: itemId },
    defaults: { item_id: itemId, quantity_on_hand: netQuantity },
    transaction,
  });

  await stockRecord.update({ quantity_on_hand: netQuantity }, { transaction });
  return netQuantity;
}

/**
 * Explicit Opening Stock entry
 */
export async function createOpeningStock({
  item_id,
  quantity,
  unit_id = null,
  movement_date = new Date().toISOString().split("T")[0],
  notes = null,
}) {
  const qty = parseFloat(quantity);
  if (isNaN(qty) || qty <= 0) {
    throw new AppError("Opening stock quantity must be a positive number", 400);
  }

  const item = await Item.findByPk(item_id);
  if (!item) {
    throw new AppError(`Item not found with ID ${item_id}`, 404);
  }

  return await db.transaction(async (transaction) => {
    const movement = await InventoryMovement.create(
      {
        item_id: item.id,
        movement_type: "OPENING",
        quantity: qty,
        unit_id: unit_id || item.unit_id,
        reference_type: "OPENING_STOCK",
        movement_date,
        notes: notes ? notes.trim() : "Initial stock onboarding",
      },
      { transaction }
    );

    const newStock = await recalculateItemStock(item.id, transaction);

    return {
      movement,
      current_stock: newStock,
    };
  });
}

/**
 * Manual Stock Purchase / Receipt with atomic inventory IN movement
 */
export async function createStockReceipt({
  supplier_id,
  supplier_name,
  receipt_date = new Date().toISOString().split("T")[0],
  reference_number,
  notes,
  items,
}) {
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new AppError("At least one item is required for a stock receipt", 400);
  }

  return await db.transaction(async (transaction) => {
    let resolvedSupplierName = supplier_name;
    if (supplier_id) {
      const supplier = await Supplier.findByPk(supplier_id, { transaction });
      if (supplier) {
        resolvedSupplierName = supplier.name;
      }
    }

    // Calculate item amounts
    let receiptTotal = 0;
    const validatedItems = [];

    for (const itemInput of items) {
      const itemRecord = await Item.findByPk(itemInput.item_id, { transaction });
      if (!itemRecord) {
        throw new AppError(`Item not found with ID ${itemInput.item_id}`, 404);
      }

      const qty = parseFloat(itemInput.quantity);
      if (isNaN(qty) || qty <= 0) {
        throw new AppError(`Invalid quantity for item ${itemRecord.name}`, 400);
      }

      const unitPrice = parseFloat(itemInput.unit_price || 0);
      const lineTotal = parseFloat((qty * unitPrice).toFixed(2));
      receiptTotal += lineTotal;

      validatedItems.push({
        item_id: itemRecord.id,
        unit_id: itemInput.unit_id || itemRecord.unit_id,
        quantity: qty,
        unit_price: unitPrice,
        total_amount: lineTotal,
      });
    }

    // 1. Create Stock Receipt
    const receipt = await StockReceipt.create(
      {
        supplier_id: supplier_id || null,
        supplier_name: resolvedSupplierName || null,
        receipt_date,
        reference_number: reference_number ? reference_number.trim() : null,
        notes: notes ? notes.trim() : null,
        total_amount: parseFloat(receiptTotal.toFixed(2)),
      },
      { transaction }
    );

    // 2. Create Stock Receipt Items & Inventory Movements IN
    for (const line of validatedItems) {
      await StockReceiptItem.create(
        {
          stock_receipt_id: receipt.id,
          item_id: line.item_id,
          unit_id: line.unit_id,
          quantity: line.quantity,
          unit_price: line.unit_price,
          total_amount: line.total_amount,
        },
        { transaction }
      );

      // Create Movement IN
      await InventoryMovement.create(
        {
          item_id: line.item_id,
          movement_type: "PURCHASE",
          quantity: line.quantity,
          unit_id: line.unit_id,
          reference_type: "STOCK_RECEIPT",
          reference_id: receipt.id,
          movement_date: receipt_date,
          unit_cost: line.unit_price,
          notes: notes || `Stock Receipt ref ${reference_number || receipt.id.slice(0, 8)}`,
        },
        { transaction }
      );

      // Update cached on hand
      await recalculateItemStock(line.item_id, transaction);
    }

    return receipt;
  });
}

/**
 * List Stock Receipts with pagination
 */
export async function listStockReceipts({ page = 1, limit = 50 } = {}) {
  const offset = (page - 1) * limit;

  const { rows, count } = await StockReceipt.findAndCountAll({
    include: [
      {
        model: Supplier,
        as: "supplier",
        attributes: ["id", "name", "phone"],
      },
      {
        model: StockReceiptItem,
        as: "items",
        include: [
          {
            model: Item,
            as: "item",
            attributes: ["id", "name", "code"],
          },
          {
            model: Unit,
            as: "unit",
            attributes: ["id", "name", "symbol"],
          },
        ],
      },
    ],
    order: [["receipt_date", "DESC"], ["created_at", "DESC"]],
    limit,
    offset,
  });

  return {
    receipts: rows,
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    },
  };
}

export async function getStockReceiptById(id) {
  const receipt = await StockReceipt.findByPk(id, {
    include: [
      {
        model: Supplier,
        as: "supplier",
        attributes: ["id", "name", "phone", "email", "gst_number"],
      },
      {
        model: StockReceiptItem,
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
    ],
  });

  if (!receipt) {
    throw new AppError(`Stock receipt not found with ID ${id}`, 404);
  }
  return receipt;
}

/**
 * Manual Stock Adjustment (ADJUSTMENT_IN or ADJUSTMENT_OUT) with mandatory reason notes
 */
export async function createStockAdjustment({
  item_id,
  adjustment_type,
  quantity,
  notes,
  movement_date = new Date().toISOString().split("T")[0],
}) {
  if (!["ADJUSTMENT_IN", "ADJUSTMENT_OUT"].includes(adjustment_type)) {
    throw new AppError("adjustment_type must be either ADJUSTMENT_IN or ADJUSTMENT_OUT", 400);
  }

  const qty = parseFloat(quantity);
  if (isNaN(qty) || qty <= 0) {
    throw new AppError("Quantity must be a positive number", 400);
  }

  if (!notes || !notes.trim()) {
    throw new AppError("Mandatory notes/reason required for stock adjustments", 400);
  }

  const item = await Item.findByPk(item_id);
  if (!item) {
    throw new AppError(`Item not found with ID ${item_id}`, 404);
  }

  return await db.transaction(async (transaction) => {
    const movement = await InventoryMovement.create(
      {
        item_id: item.id,
        movement_type: adjustment_type,
        quantity: qty,
        unit_id: item.unit_id,
        reference_type: "MANUAL_ADJUSTMENT",
        movement_date,
        notes: notes.trim(),
      },
      { transaction }
    );

    const newStock = await recalculateItemStock(item.id, transaction);

    return {
      movement,
      current_stock: newStock,
    };
  });
}

/**
 * Current Stock Summary Report
 */
export async function getStockSummary({ search, item_type, category } = {}) {
  const where = { is_active: true };
  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search.trim()}%` } },
      { code: { [Op.iLike]: `%${search.trim()}%` } },
    ];
  }
  if (item_type) where.item_type = item_type;
  if (category) where.category = { [Op.iLike]: `%${category.trim()}%` };

  const items = await Item.findAll({
    where,
    include: [
      {
        model: Unit,
        as: "unit",
        attributes: ["id", "name", "symbol"],
      },
      {
        model: InventoryStock,
        as: "stock",
        attributes: ["quantity_on_hand", "updated_at"],
      },
    ],
    order: [["item_type", "ASC"], ["name", "ASC"]],
  });

  return items.map((item) => ({
    id: item.id,
    code: item.code,
    name: item.name,
    item_type: item.item_type,
    category: item.category,
    unit: item.unit?.symbol || "NOS",
    quantity_on_hand: item.stock ? parseFloat(item.stock.quantity_on_hand) : 0.0,
    updated_at: item.stock?.updated_at || item.updated_at,
  }));
}

/**
 * Detailed Item Ledger with running balance
 */
export async function getItemLedger(itemId, { start_date, end_date } = {}) {
  const item = await Item.findByPk(itemId, {
    include: [
      { model: Unit, as: "unit", attributes: ["id", "name", "symbol"] },
      { model: InventoryStock, as: "stock", attributes: ["quantity_on_hand"] },
    ],
  });

  if (!item) {
    throw new AppError(`Item not found with ID ${itemId}`, 404);
  }

  const where = { item_id: itemId };
  if (start_date && end_date) {
    where.movement_date = { [Op.between]: [start_date, end_date] };
  } else if (start_date) {
    where.movement_date = { [Op.gte]: start_date };
  } else if (end_date) {
    where.movement_date = { [Op.lte]: end_date };
  }

  const movements = await InventoryMovement.findAll({
    where,
    include: [
      { model: Unit, as: "unit", attributes: ["id", "name", "symbol"] },
    ],
    order: [["movement_date", "ASC"], ["created_at", "ASC"]],
  });

  let runningBalance = 0;
  const ledgerEntries = movements.map((m) => {
    const qty = parseFloat(m.quantity) || 0;
    const isCredit = IN_MOVEMENT_TYPES.includes(m.movement_type);
    if (isCredit) {
      runningBalance += qty;
    } else {
      runningBalance -= qty;
    }

    return {
      id: m.id,
      movement_date: m.movement_date,
      movement_type: m.movement_type,
      reference_type: m.reference_type,
      reference_id: m.reference_id,
      quantity_in: isCredit ? qty : 0,
      quantity_out: !isCredit ? qty : 0,
      running_balance: parseFloat(runningBalance.toFixed(3)),
      unit: m.unit?.symbol || item.unit?.symbol || "NOS",
      unit_cost: m.unit_cost ? parseFloat(m.unit_cost) : null,
      notes: m.notes,
    };
  });

  return {
    item: {
      id: item.id,
      code: item.code,
      name: item.name,
      item_type: item.item_type,
      unit: item.unit?.symbol || "NOS",
      current_stock: item.stock ? parseFloat(item.stock.quantity_on_hand) : 0.0,
    },
    ledger: ledgerEntries,
  };
}

/**
 * Summary KPI Metrics for Inventory Dashboard
 */
export async function getInventorySummary() {
  const items = await Item.findAll({
    where: { is_active: true },
    include: [{ model: InventoryStock, as: "stock", attributes: ["quantity_on_hand"] }],
  });

  let rawMaterialItems = 0;
  let finishedGoods = 0;
  let lowStockItems = 0;

  for (const item of items) {
    if (item.item_type === "RAW_MATERIAL") rawMaterialItems++;
    if (item.item_type === "FINISHED_GOOD") finishedGoods++;
    const qty = item.stock ? parseFloat(item.stock.quantity_on_hand) : 0;
    if (qty <= 0) lowStockItems++;
  }

  const today = new Date().toISOString().split("T")[0];
  const todayMovements = await InventoryMovement.findAll({
    where: { movement_date: today },
    attributes: ["movement_type", "quantity"],
  });

  let todayIn = 0;
  let todayOut = 0;
  for (const m of todayMovements) {
    const qty = parseFloat(m.quantity) || 0;
    if (IN_MOVEMENT_TYPES.includes(m.movement_type)) todayIn += qty;
    else if (OUT_MOVEMENT_TYPES.includes(m.movement_type)) todayOut += qty;
  }

  return {
    totalItems: items.length,
    rawMaterialItems,
    finishedGoods,
    totalStockItems: items.length,
    lowStockItems,
    todayIn: parseFloat(todayIn.toFixed(2)),
    todayOut: parseFloat(todayOut.toFixed(2)),
  };
}

/**
 * Recent movements log
 */
export async function getRecentMovements({ limit = 20 } = {}) {
  return await InventoryMovement.findAll({
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
    order: [["created_at", "DESC"]],
    limit,
  });
}

/**
 * Detailed movement history for audit trail
 */
export async function getMovementHistory({
  item_id,
  movement_type,
  start_date,
  end_date,
  page = 1,
  limit = 50,
} = {}) {
  const where = {};
  if (item_id) where.item_id = item_id;
  if (movement_type) where.movement_type = movement_type;
  if (start_date && end_date) {
    where.movement_date = { [Op.between]: [start_date, end_date] };
  } else if (start_date) {
    where.movement_date = { [Op.gte]: start_date };
  } else if (end_date) {
    where.movement_date = { [Op.lte]: end_date };
  }

  const offset = (page - 1) * limit;

  const { rows, count } = await InventoryMovement.findAndCountAll({
    where,
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
    order: [["movement_date", "DESC"], ["created_at", "DESC"]],
    limit,
    offset,
  });

  return {
    movements: rows,
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    },
  };
}
