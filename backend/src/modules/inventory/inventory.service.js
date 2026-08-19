import { Op } from "sequelize";
import db from "../../config/db.js";
import StockReceipt from "./stock-receipt.model.js";
import StockReceiptItem from "./stock-receipt-item.model.js";
import InventoryMovement from "./inventory-movement.model.js";
import InventoryStock from "./inventory-stock.model.js";
import ProductionEntry from "./production-entry.model.js";
import ProductionMaterial from "./production-material.model.js";
import ProductionOutput from "./production-output.model.js";
import Item from "../items/item.model.js";
import Unit from "../units/unit.model.js";
import Supplier from "../suppliers/supplier.model.js";
import AppError from "../../shared/appError.js";

export const IN_MOVEMENT_TYPES = ["OPENING", "PURCHASE", "PRODUCTION_IN", "ADJUSTMENT_IN", "REVERSAL"];
export const OUT_MOVEMENT_TYPES = ["PRODUCTION_OUT", "PRODUCTION_WASTAGE", "DISPATCH", "SALE", "ADJUSTMENT_OUT"];

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
 * Explicit Opening Stock entry (Initial Onboarding)
 */
export async function createOpeningStock({
  item_id,
  quantity,
  unit_id = null,
  movement_date = new Date().toISOString().split("T")[0],
}) {
  const qty = parseFloat(quantity);
  if (isNaN(qty) || qty <= 0) {
    throw new AppError("Opening stock quantity must be a positive number", 400);
  }

  const item = await Item.findByPk(item_id);
  if (!item) {
    throw new AppError(`Item not found with ID ${item_id}`, 404);
  }

  // Prevent unit mismatch
  if (unit_id && unit_id !== item.unit_id) {
    throw new AppError(
      `Unit mismatch for "${item.name}". Movements must match the item's inventory base unit.`,
      400
    );
  }

  // Prevent accidental duplicate opening stock for the same item
  const existingOpening = await InventoryMovement.findOne({
    where: {
      item_id: item.id,
      movement_type: "OPENING",
    },
  });

  if (existingOpening) {
    throw new AppError(
      `Opening stock has already been recorded for "${item.name}". Repeated opening entries are not permitted.`,
      400
    );
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
 * Stock Purchase / Receipt - ONLY RAW MATERIALS
 */
export async function createStockReceipt({
  supplier_id,
  supplier_name,
  receipt_date = new Date().toISOString().split("T")[0],
  reference_number,
  items,
}) {
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new AppError("At least one item is required for a purchase receipt", 400);
  }

  return await db.transaction(async (transaction) => {
    let resolvedSupplierName = supplier_name;
    if (supplier_id) {
      const supplier = await Supplier.findByPk(supplier_id, { transaction });
      if (supplier) {
        resolvedSupplierName = supplier.name;
      }
    }

    // Validate all items are RAW_MATERIAL and have positive quantity
    let receiptTotal = 0;
    const validatedItems = [];

    for (const itemInput of items) {
      const itemRecord = await Item.findByPk(itemInput.item_id, { transaction });
      if (!itemRecord) {
        throw new AppError(`Item not found with ID ${itemInput.item_id}`, 404);
      }

      if (itemRecord.item_type !== "RAW_MATERIAL") {
        throw new AppError(
          `Item "${itemRecord.name}" is a Finished Good and cannot be purchased. Finished goods enter inventory only through production.`,
          400
        );
      }

      // Prevent unit mismatch from corrupting inventory
      if (itemInput.unit_id && itemInput.unit_id !== itemRecord.unit_id) {
        throw new AppError(
          `Unit mismatch for "${itemRecord.name}". Purchase receipts must match the item's inventory base unit.`,
          400
        );
      }

      const qty = parseFloat(itemInput.quantity);
      if (isNaN(qty) || qty <= 0) {
        throw new AppError(`Invalid quantity for raw material ${itemRecord.name}`, 400);
      }

      const unitPrice = parseFloat(itemInput.unit_price || 0);
      if (isNaN(unitPrice) || unitPrice < 0) {
        throw new AppError(`Invalid unit price for raw material ${itemRecord.name}`, 400);
      }

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

      // Create Movement IN (PURCHASE)
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
        },
        { transaction }
      );

      // Update cached on-hand stock
      await recalculateItemStock(line.item_id, transaction);
    }

    return receipt;
  });
}

/**
 * List Stock Receipts / Purchase History with date, item & supplier filtering
 */
export async function listStockReceipts({
  page = 1,
  limit = 50,
  start_date,
  end_date,
  supplier_id,
  item_id,
} = {}) {
  const where = {};
  if (start_date && end_date) {
    where.receipt_date = { [Op.between]: [start_date, end_date] };
  } else if (start_date) {
    where.receipt_date = { [Op.gte]: start_date };
  } else if (end_date) {
    where.receipt_date = { [Op.lte]: end_date };
  }

  if (supplier_id) {
    where.supplier_id = supplier_id;
  }

  const itemIncludeWhere = item_id ? { item_id } : undefined;
  const offset = (page - 1) * limit;

  const { rows, count } = await StockReceipt.findAndCountAll({
    where,
    include: [
      {
        model: Supplier,
        as: "supplier",
        attributes: ["id", "name", "phone"],
      },
      {
        model: StockReceiptItem,
        as: "items",
        where: itemIncludeWhere,
        required: !!item_id,
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
    order: [["receipt_date", "DESC"], ["created_at", "DESC"]],
    limit,
    offset,
    distinct: true,
  });

  // Calculate global aggregate purchase value across unpaginated filtered dataset
  const globalSummary = await StockReceipt.findOne({
    where,
    attributes: [
      [db.fn("COALESCE", db.fn("SUM", db.col("total_amount")), 0), "totalPurchasedValue"],
    ],
    raw: true,
  });

  const totalPurchasedValue = parseFloat(globalSummary?.totalPurchasedValue || 0);

  return {
    receipts: rows,
    summary: {
      totalReceipts: count,
      totalPurchasedValue: parseFloat(totalPurchasedValue.toFixed(2)),
    },
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
 * PRODUCTION ENTRY: Atomic manufacturing transaction
 * Consumes RAW_MATERIAL (Used + Wastage) and produces FINISHED_GOOD
 */
export async function createProductionEntry({
  production_date = new Date().toISOString().split("T")[0],
  reference_number = null,
  materials = [],
  outputs = [],
}) {
  if (!materials || !Array.isArray(materials) || materials.length === 0) {
    throw new AppError("At least one raw material input is required for production", 400);
  }

  if (!outputs || !Array.isArray(outputs) || outputs.length === 0) {
    throw new AppError("At least one finished good output is required for production", 400);
  }

  return await db.transaction(async (transaction) => {
    // 1. Validate and lock stock for all Raw Materials
    const validatedMaterials = [];
    for (const mat of materials) {
      const item = await Item.findByPk(mat.item_id, {
        include: [{ model: Unit, as: "unit", attributes: ["id", "name", "symbol"] }],
        transaction,
      });

      if (!item) {
        throw new AppError(`Raw material not found with ID ${mat.item_id}`, 404);
      }

      if (item.item_type !== "RAW_MATERIAL") {
        throw new AppError(
          `Item "${item.name}" is a ${item.item_type} and cannot be used as a raw material input. Production inputs must be RAW_MATERIAL only.`,
          400
        );
      }

      // Enforce strict unit matching to prevent stock calculation corruption (Point 9)
      if (mat.unit_id && mat.unit_id !== item.unit_id) {
        throw new AppError(
          `Unit mismatch for raw material "${item.name}". Production input must match the item's base unit.`,
          400
        );
      }

      const qtyUsed = parseFloat(mat.quantity_used);
      if (isNaN(qtyUsed) || qtyUsed <= 0) {
        throw new AppError(`Quantity used must be greater than 0 for raw material "${item.name}"`, 400);
      }

      const qtyWastage = parseFloat(mat.wastage_quantity || 0);
      if (isNaN(qtyWastage) || qtyWastage < 0) {
        throw new AppError(`Wastage quantity cannot be negative for raw material "${item.name}"`, 400);
      }

      const totalRequired = parseFloat((qtyUsed + qtyWastage).toFixed(3));

      // Acquire exclusive row lock on InventoryStock to prevent concurrent over-consumption race condition (Point 8)
      const stockRecord = await InventoryStock.findOne({
        where: { item_id: item.id },
        lock: transaction.LOCK.UPDATE,
        transaction,
      });

      const availableStock = stockRecord ? parseFloat(stockRecord.quantity_on_hand) : 0.0;

      if (totalRequired > availableStock) {
        throw new AppError(
          `Insufficient stock for raw material "${item.name}". Required: ${totalRequired} ${item.unit?.symbol || "NOS"} (Used: ${qtyUsed} + Wastage: ${qtyWastage}), Available on hand: ${availableStock} ${item.unit?.symbol || "NOS"}`,
          400
        );
      }

      validatedMaterials.push({
        item,
        quantity_used: qtyUsed,
        wastage_quantity: qtyWastage,
        total_required: totalRequired,
        unit_id: item.unit_id,
      });
    }

    // 2. Validate all Finished Goods outputs
    const validatedOutputs = [];
    for (const out of outputs) {
      const item = await Item.findByPk(out.item_id, {
        include: [{ model: Unit, as: "unit", attributes: ["id", "name", "symbol"] }],
        transaction,
      });

      if (!item) {
        throw new AppError(`Finished good not found with ID ${out.item_id}`, 404);
      }

      if (item.item_type !== "FINISHED_GOOD") {
        throw new AppError(
          `Item "${item.name}" is a ${item.item_type} and cannot be produced as a finished good output. Production outputs must be FINISHED_GOOD only.`,
          400
        );
      }

      // Enforce strict unit matching for outputs
      if (out.unit_id && out.unit_id !== item.unit_id) {
        throw new AppError(
          `Unit mismatch for finished good "${item.name}". Production output must match the item's base unit.`,
          400
        );
      }

      const qtyProduced = parseFloat(out.quantity_produced);
      if (isNaN(qtyProduced) || qtyProduced <= 0) {
        throw new AppError(`Produced quantity must be greater than 0 for finished good "${item.name}"`, 400);
      }

      validatedOutputs.push({
        item,
        quantity_produced: qtyProduced,
        unit_id: item.unit_id,
      });
    }

    // 3. Create Production Entry record
    const productionEntry = await ProductionEntry.create(
      {
        production_date,
        reference_number: reference_number ? reference_number.trim() : null,
      },
      { transaction }
    );

    // 4. Create ProductionMaterial records & Movements (PRODUCTION_OUT & PRODUCTION_WASTAGE)
    for (const mat of validatedMaterials) {
      await ProductionMaterial.create(
        {
          production_entry_id: productionEntry.id,
          item_id: mat.item.id,
          unit_id: mat.unit_id,
          quantity_used: mat.quantity_used,
          wastage_quantity: mat.wastage_quantity,
        },
        { transaction }
      );

      // Movement for actual consumption
      await InventoryMovement.create(
        {
          item_id: mat.item.id,
          movement_type: "PRODUCTION_OUT",
          quantity: mat.quantity_used,
          unit_id: mat.unit_id,
          reference_type: "PRODUCTION_ENTRY",
          reference_id: productionEntry.id,
          movement_date: production_date,
        },
        { transaction }
      );

      // Movement for wastage (if any)
      if (mat.wastage_quantity > 0) {
        await InventoryMovement.create(
          {
            item_id: mat.item.id,
            movement_type: "PRODUCTION_WASTAGE",
            quantity: mat.wastage_quantity,
            unit_id: mat.unit_id,
            reference_type: "PRODUCTION_ENTRY",
            reference_id: productionEntry.id,
            movement_date: production_date,
          },
          { transaction }
        );
      }

      // Recalculate material stock
      await recalculateItemStock(mat.item.id, transaction);
    }

    // 5. Create ProductionOutput records & Movement (PRODUCTION_IN)
    for (const out of validatedOutputs) {
      await ProductionOutput.create(
        {
          production_entry_id: productionEntry.id,
          item_id: out.item.id,
          unit_id: out.unit_id,
          quantity_produced: out.quantity_produced,
        },
        { transaction }
      );

      // Movement for finished good production IN
      await InventoryMovement.create(
        {
          item_id: out.item.id,
          movement_type: "PRODUCTION_IN",
          quantity: out.quantity_produced,
          unit_id: out.unit_id,
          reference_type: "PRODUCTION_ENTRY",
          reference_id: productionEntry.id,
          movement_date: production_date,
        },
        { transaction }
      );

      // Recalculate finished good stock
      await recalculateItemStock(out.item.id, transaction);
    }

    return productionEntry;
  });
}

/**
 * List Production Entries / Production History with date and item filtering
 */
export async function listProductionEntries({
  page = 1,
  limit = 50,
  start_date,
  end_date,
  raw_material_id,
  finished_good_id,
} = {}) {
  const where = {};
  if (start_date && end_date) {
    where.production_date = { [Op.between]: [start_date, end_date] };
  } else if (start_date) {
    where.production_date = { [Op.gte]: start_date };
  } else if (end_date) {
    where.production_date = { [Op.lte]: end_date };
  }

  const offset = (page - 1) * limit;

  const matWhere = raw_material_id ? { item_id: raw_material_id } : undefined;
  const outWhere = finished_good_id ? { item_id: finished_good_id } : undefined;

  const { rows, count } = await ProductionEntry.findAndCountAll({
    where,
    include: [
      {
        model: ProductionMaterial,
        as: "materials",
        where: matWhere,
        required: !!raw_material_id,
        include: [
          { model: Item, as: "item", attributes: ["id", "name", "code", "item_type"] },
          { model: Unit, as: "unit", attributes: ["id", "name", "symbol"] },
        ],
      },
      {
        model: ProductionOutput,
        as: "outputs",
        where: outWhere,
        required: !!finished_good_id,
        include: [
          { model: Item, as: "item", attributes: ["id", "name", "code", "item_type"] },
          { model: Unit, as: "unit", attributes: ["id", "name", "symbol"] },
        ],
      },
    ],
    order: [["production_date", "DESC"], ["created_at", "DESC"]],
    limit,
    offset,
    distinct: true,
  });

  // Calculate summary metrics for the filtered set
  let totalMaterialsUsed = 0;
  let totalWastage = 0;
  let totalFinishedProduced = 0;

  for (const entry of rows) {
    for (const m of entry.materials || []) {
      totalMaterialsUsed += parseFloat(m.quantity_used || 0);
      totalWastage += parseFloat(m.wastage_quantity || 0);
    }
    for (const o of entry.outputs || []) {
      totalFinishedProduced += parseFloat(o.quantity_produced || 0);
    }
  }

  return {
    entries: rows,
    summary: {
      totalEntries: count,
      totalMaterialsUsed: parseFloat(totalMaterialsUsed.toFixed(2)),
      totalWastage: parseFloat(totalWastage.toFixed(2)),
      totalFinishedProduced: parseFloat(totalFinishedProduced.toFixed(2)),
    },
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    },
  };
}

/**
 * Get Production Entry by ID with full details
 */
export async function getProductionEntryById(id) {
  const entry = await ProductionEntry.findByPk(id, {
    include: [
      {
        model: ProductionMaterial,
        as: "materials",
        include: [
          { model: Item, as: "item", attributes: ["id", "name", "code", "item_type"] },
          { model: Unit, as: "unit", attributes: ["id", "name", "symbol"] },
        ],
      },
      {
        model: ProductionOutput,
        as: "outputs",
        include: [
          { model: Item, as: "item", attributes: ["id", "name", "code", "item_type"] },
          { model: Unit, as: "unit", attributes: ["id", "name", "symbol"] },
        ],
      },
    ],
  });

  if (!entry) {
    throw new AppError(`Production entry not found with ID ${id}`, 404);
  }
  return entry;
}

/**
 * Manual Stock Adjustment (ADJUSTMENT_IN or ADJUSTMENT_OUT)
 */
export async function createStockAdjustment({
  item_id,
  adjustment_type,
  quantity,
  movement_date = new Date().toISOString().split("T")[0],
}) {
  if (!["ADJUSTMENT_IN", "ADJUSTMENT_OUT"].includes(adjustment_type)) {
    throw new AppError("adjustment_type must be either ADJUSTMENT_IN or ADJUSTMENT_OUT", 400);
  }

  const qty = parseFloat(quantity);
  if (isNaN(qty) || qty <= 0) {
    throw new AppError("Quantity must be a positive number", 400);
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
 * Detailed Item Ledger with accurate Opening Balance for date filtering
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

  // 1. If start_date is supplied, calculate opening balance from all movements strictly prior to start_date
  let openingBalance = 0;
  if (start_date) {
    const priorMovements = await InventoryMovement.findAll({
      where: {
        item_id: itemId,
        movement_date: { [Op.lt]: start_date },
      },
      attributes: ["movement_type", "quantity"],
    });

    for (const m of priorMovements) {
      const qty = parseFloat(m.quantity) || 0;
      if (IN_MOVEMENT_TYPES.includes(m.movement_type)) {
        openingBalance += qty;
      } else if (OUT_MOVEMENT_TYPES.includes(m.movement_type)) {
        openingBalance -= qty;
      }
    }
  }

  // 2. Query movements within the requested date window
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

  let runningBalance = openingBalance;
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
    opening_balance: parseFloat(openingBalance.toFixed(3)),
    closing_balance: parseFloat(runningBalance.toFixed(3)),
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
