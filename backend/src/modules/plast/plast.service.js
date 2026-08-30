import { Op } from "sequelize";
import db from "../../config/db.js";
import PlastUnit from "./plast-unit.model.js";
import PlastItem from "./plast-item.model.js";
import PlastSupplier from "./plast-supplier.model.js";
import PlastCustomer from "./plast-customer.model.js";
import PlastInventoryStock from "./plast-inventory-stock.model.js";
import PlastStockReceipt from "./plast-stock-receipt.model.js";
import PlastStockReceiptItem from "./plast-stock-receipt-item.model.js";
import {
  PlastProductionEntry,
  PlastProductionMaterial,
  PlastProductionOutput,
} from "./plast-production.model.js";
import PlastSale from "./plast-sale.model.js";
import PlastSaleItem from "./plast-sale-item.model.js";
import AppError from "../../shared/appError.js";

/**
 * Seed default Plast Units if none exist
 */
export const ensurePlastDefaultUnits = async () => {
  const count = await PlastUnit.count();
  if (count === 0) {
    await PlastUnit.bulkCreate([
      { name: "Kilograms", symbol: "Kg", is_active: true },
      { name: "Numbers / Pieces", symbol: "Nos", is_active: true },
      { name: "Meters", symbol: "Mtr", is_active: true },
      { name: "Bags", symbol: "Bag", is_active: true },
      { name: "Rolls", symbol: "Roll", is_active: true },
      { name: "Bundles", symbol: "Bndl", is_active: true },
    ]);
  }
};

// =========================================================================
// 1. UNITS & ITEMS
// =========================================================================

export const getUnits = async () => {
  await ensurePlastDefaultUnits();
  return await PlastUnit.findAll({ order: [["name", "ASC"]] });
};

export const createUnit = async (data) => {
  return await PlastUnit.create(data);
};

export const getItems = async (filters = {}) => {
  const where = {};
  if (filters.item_type) {
    where.item_type = filters.item_type;
  }
  if (filters.category) {
    where.category = filters.category;
  }
  if (filters.search) {
    where.name = { [Op.iLike]: `%${filters.search}%` };
  }
  if (filters.is_active !== undefined) {
    where.is_active = filters.is_active === "true" || filters.is_active === true;
  }

  const items = await PlastItem.findAll({
    where,
    include: [
      { model: PlastUnit, as: "unit", attributes: ["id", "name", "symbol"] },
      { model: PlastInventoryStock, as: "stock", attributes: ["quantity_on_hand"] },
    ],
    order: [["name", "ASC"]],
  });

  return items;
};

export const getItemById = async (id) => {
  const item = await PlastItem.findByPk(id, {
    include: [
      { model: PlastUnit, as: "unit" },
      { model: PlastInventoryStock, as: "stock" },
    ],
  });
  if (!item) throw new AppError("Item not found", 404);
  return item;
};

export const createItem = async (data) => {
  return await db.transaction(async (t) => {
    const item = await PlastItem.create(data, { transaction: t });
    // Initialize stock row at 0.00
    await PlastInventoryStock.create(
      {
        item_id: item.id,
        quantity_on_hand: data.initial_stock || 0.0,
      },
      { transaction: t }
    );
    return item;
  });
};

export const updateItem = async (id, data) => {
  const item = await PlastItem.findByPk(id);
  if (!item) throw new AppError("Item not found", 404);
  return await item.update(data);
};

export const deleteItem = async (id) => {
  const item = await PlastItem.findByPk(id);
  if (!item) throw new AppError("Item not found", 404);
  return await item.update({ is_active: false });
};

// =========================================================================
// 2. SUPPLIERS (VENDORS) & CUSTOMERS
// =========================================================================

export const getSuppliers = async (search = "") => {
  const where = { is_active: true };
  if (search) {
    where.name = { [Op.iLike]: `%${search}%` };
  }
  return await PlastSupplier.findAll({ where, order: [["name", "ASC"]] });
};

export const createSupplier = async (data) => {
  return await PlastSupplier.create(data);
};

export const updateSupplier = async (id, data) => {
  const supplier = await PlastSupplier.findByPk(id);
  if (!supplier) throw new AppError("Supplier not found", 404);
  return await supplier.update(data);
};

export const getCustomers = async (search = "") => {
  const where = { is_active: true };
  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { phone: { [Op.iLike]: `%${search}%` } },
    ];
  }
  return await PlastCustomer.findAll({ where, order: [["name", "ASC"]] });
};

export const createCustomer = async (data) => {
  return await PlastCustomer.create(data);
};

export const updateCustomer = async (id, data) => {
  const customer = await PlastCustomer.findByPk(id);
  if (!customer) throw new AppError("Customer not found", 404);
  return await customer.update(data);
};

// =========================================================================
// 3. STOCK & INVENTORY
// =========================================================================

export const getStockOnHand = async (filters = {}) => {
  const itemWhere = { is_active: true };
  if (filters.item_type) {
    itemWhere.item_type = filters.item_type;
  }
  if (filters.search) {
    itemWhere.name = { [Op.iLike]: `%${filters.search}%` };
  }

  const items = await PlastItem.findAll({
    where: itemWhere,
    include: [
      { model: PlastUnit, as: "unit" },
      { model: PlastInventoryStock, as: "stock" },
    ],
    order: [
      ["item_type", "ASC"],
      ["name", "ASC"],
    ],
  });

  return items.map((item) => ({
    id: item.id,
    name: item.name,
    code: item.code,
    category: item.category,
    item_type: item.item_type,
    unit_price: Number(item.unit_price || 0),
    unit: item.unit?.symbol || item.unit?.name || "Units",
    quantity_on_hand: Number(item.stock?.quantity_on_hand || 0),
    stock_value: Number(item.unit_price || 0) * Number(item.stock?.quantity_on_hand || 0),
  }));
};

/**
 * Helper to adjust stock
 */
const adjustStock = async (itemId, deltaQuantity, transaction) => {
  let stock = await PlastInventoryStock.findOne({
    where: { item_id: itemId },
    transaction,
  });

  if (!stock) {
    stock = await PlastInventoryStock.create(
      { item_id: itemId, quantity_on_hand: 0 },
      { transaction }
    );
  }

  const newQty = Number(stock.quantity_on_hand) + Number(deltaQuantity);
  await stock.update({ quantity_on_hand: newQty }, { transaction });
  return newQty;
};

// =========================================================================
// 4. RAW MATERIAL PURCHASES (Stock Receipts)
// =========================================================================

export const getPurchases = async (filters = {}) => {
  const where = {};
  if (filters.from_date && filters.to_date) {
    where.receipt_date = { [Op.between]: [filters.from_date, filters.to_date] };
  } else if (filters.from_date) {
    where.receipt_date = { [Op.gte]: filters.from_date };
  } else if (filters.to_date) {
    where.receipt_date = { [Op.lte]: filters.to_date };
  }

  if (filters.supplier_id) {
    where.supplier_id = filters.supplier_id;
  }

  return await PlastStockReceipt.findAll({
    where,
    include: [
      { model: PlastSupplier, as: "supplier" },
      {
        model: PlastStockReceiptItem,
        as: "items",
        include: [
          { model: PlastItem, as: "item" },
          { model: PlastUnit, as: "unit" },
        ],
      },
    ],
    order: [["receipt_date", "DESC"], ["created_at", "DESC"]],
  });
};

export const createPurchase = async (data) => {
  const { supplier_id, supplier_name, receipt_date, reference_number, notes, items = [] } = data;

  if (!items.length) {
    throw new AppError("Purchase must contain at least one item.", 400);
  }

  return await db.transaction(async (t) => {
    let resolvedSupplierName = supplier_name;
    if (supplier_id && !resolvedSupplierName) {
      const supplier = await PlastSupplier.findByPk(supplier_id, { transaction: t });
      if (supplier) resolvedSupplierName = supplier.name;
    }

    let total_amount = 0;
    items.forEach((it) => {
      const qty = Number(it.quantity || 0);
      const price = Number(it.unit_price || 0);
      const lineTotal = it.total_amount !== undefined ? Number(it.total_amount) : qty * price;
      total_amount += lineTotal;
    });

    const receipt = await PlastStockReceipt.create(
      {
        supplier_id: supplier_id || null,
        supplier_name: resolvedSupplierName || "Direct Vendor",
        receipt_date: receipt_date || new Date().toISOString().split("T")[0],
        reference_number: reference_number || null,
        notes: notes || null,
        total_amount,
      },
      { transaction: t }
    );

    for (const it of items) {
      const qty = Number(it.quantity || 0);
      const price = Number(it.unit_price || 0);
      const lineTotal = it.total_amount !== undefined ? Number(it.total_amount) : qty * price;

      await PlastStockReceiptItem.create(
        {
          stock_receipt_id: receipt.id,
          item_id: it.item_id,
          unit_id: it.unit_id || null,
          quantity: qty,
          unit_price: price,
          total_amount: lineTotal,
        },
        { transaction: t }
      );

      // Increase Raw Material Stock
      await adjustStock(it.item_id, qty, t);
    }

    return receipt;
  });
};

// =========================================================================
// 5. DAILY PRODUCTION (Raw Materials Consumed + Wastage -> Finished Goods)
// =========================================================================

export const getProductionEntries = async (filters = {}) => {
  const where = {};
  if (filters.from_date && filters.to_date) {
    where.production_date = { [Op.between]: [filters.from_date, filters.to_date] };
  } else if (filters.from_date) {
    where.production_date = { [Op.gte]: filters.from_date };
  } else if (filters.to_date) {
    where.production_date = { [Op.lte]: filters.to_date };
  }

  return await PlastProductionEntry.findAll({
    where,
    include: [
      {
        model: PlastProductionMaterial,
        as: "materials",
        include: [
          { model: PlastItem, as: "item" },
          { model: PlastUnit, as: "unit" },
        ],
      },
      {
        model: PlastProductionOutput,
        as: "outputs",
        include: [
          { model: PlastItem, as: "item" },
          { model: PlastUnit, as: "unit" },
        ],
      },
    ],
    order: [["production_date", "DESC"], ["created_at", "DESC"]],
  });
};

export const createProductionEntry = async (data) => {
  const { production_date, reference_number, notes, materials = [], outputs = [] } = data;

  if (!materials.length && !outputs.length) {
    throw new AppError("Production entry must have materials or finished outputs.", 400);
  }

  return await db.transaction(async (t) => {
    const entry = await PlastProductionEntry.create(
      {
        production_date: production_date || new Date().toISOString().split("T")[0],
        reference_number: reference_number || null,
        notes: notes || null,
      },
      { transaction: t }
    );

    // 1. Process Materials Consumed + Wastage (DECREASE RAW STOCK)
    for (const mat of materials) {
      const qtyUsed = Number(mat.quantity_used || 0);
      const wastage = Number(mat.wastage_quantity || 0);
      const totalDeduction = qtyUsed + wastage;

      await PlastProductionMaterial.create(
        {
          production_entry_id: entry.id,
          item_id: mat.item_id,
          unit_id: mat.unit_id || null,
          quantity_used: qtyUsed,
          wastage_quantity: wastage,
        },
        { transaction: t }
      );

      if (totalDeduction > 0) {
        await adjustStock(mat.item_id, -totalDeduction, t);
      }
    }

    // 2. Process Finished Outputs (INCREASE FINISHED GOODS STOCK)
    for (const out of outputs) {
      const qtyProduced = Number(out.quantity_produced || 0);

      await PlastProductionOutput.create(
        {
          production_entry_id: entry.id,
          item_id: out.item_id,
          unit_id: out.unit_id || null,
          quantity_produced: qtyProduced,
        },
        { transaction: t }
      );

      if (qtyProduced > 0) {
        await adjustStock(out.item_id, qtyProduced, t);
      }
    }

    return entry;
  });
};

// =========================================================================
// 6. SALES & BILLING (with per-item discount % and 0/5/18 GST)
// =========================================================================

export const getSales = async (filters = {}) => {
  const where = {};
  if (filters.from_date && filters.to_date) {
    where.sale_date = { [Op.between]: [filters.from_date, filters.to_date] };
  } else if (filters.from_date) {
    where.sale_date = { [Op.gte]: filters.from_date };
  } else if (filters.to_date) {
    where.sale_date = { [Op.lte]: filters.to_date };
  }

  if (filters.customer_id) {
    where.customer_id = filters.customer_id;
  }
  if (filters.payment_status) {
    where.payment_status = filters.payment_status;
  }
  if (filters.search) {
    where[Op.or] = [
      { sale_number: { [Op.iLike]: `%${filters.search}%` } },
      { customer_name: { [Op.iLike]: `%${filters.search}%` } },
      { customer_phone: { [Op.iLike]: `%${filters.search}%` } },
    ];
  }

  return await PlastSale.findAll({
    where,
    include: [
      { model: PlastCustomer, as: "customer" },
      {
        model: PlastSaleItem,
        as: "items",
        include: [
          { model: PlastItem, as: "item" },
          { model: PlastUnit, as: "unit" },
        ],
      },
    ],
    order: [["sale_date", "DESC"], ["created_at", "DESC"]],
  });
};

export const getSaleById = async (id) => {
  const sale = await PlastSale.findByPk(id, {
    include: [
      { model: PlastCustomer, as: "customer" },
      {
        model: PlastSaleItem,
        as: "items",
        include: [
          { model: PlastItem, as: "item" },
          { model: PlastUnit, as: "unit" },
        ],
      },
    ],
  });
  if (!sale) throw new AppError("Sale invoice not found", 404);
  return sale;
};

/**
 * Generate Next Sale Number
 */
const generateNextSaleNumber = async (transaction) => {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const prefix = `CP-${yearMonth}-`;

  const lastSale = await PlastSale.findOne({
    where: {
      sale_number: { [Op.like]: `${prefix}%` },
    },
    order: [["created_at", "DESC"]],
    transaction,
  });

  let seq = 1;
  if (lastSale && lastSale.sale_number) {
    const parts = lastSale.sale_number.split("-");
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastSeq)) seq = lastSeq + 1;
  }

  return `${prefix}${String(seq).padStart(4, "0")}`;
};

export const createSale = async (data) => {
  const {
    sale_date,
    customer_id,
    customer_name,
    customer_phone,
    gst_rate = 0, // 0, 5, or 18
    payment_status = "PAID",
    payment_mode = "CASH",
    notes,
    items = [],
  } = data;

  if (!items.length) {
    throw new AppError("Sale must contain at least one item.", 400);
  }

  return await db.transaction(async (t) => {
    let resolvedCustomerName = customer_name;
    let resolvedCustomerPhone = customer_phone;

    if (customer_id) {
      const cust = await PlastCustomer.findByPk(customer_id, { transaction: t });
      if (cust) {
        if (!resolvedCustomerName) resolvedCustomerName = cust.name;
        if (!resolvedCustomerPhone) resolvedCustomerPhone = cust.phone;
      }
    } else if (customer_name) {
      // Auto-save new customer if phone provided
      const existingCust = await PlastCustomer.findOne({
        where: { name: customer_name },
        transaction: t,
      });
      if (!existingCust) {
        await PlastCustomer.create(
          { name: customer_name, phone: customer_phone || null },
          { transaction: t }
        );
      }
    }

    // Calculations
    let subtotal = 0;
    let totalDiscount = 0;

    const processedItems = [];

    for (const it of items) {
      const itemMaster = await PlastItem.findByPk(it.item_id, {
        include: [{ model: PlastUnit, as: "unit" }],
        transaction: t,
      });

      const itemName = it.item_name || itemMaster?.name || "Item";
      const unitId = it.unit_id || itemMaster?.unit_id || null;
      const qty = Number(it.quantity || 1);
      const unitPrice = Number(it.unit_price || itemMaster?.unit_price || 0);
      const discountPercent = Number(it.discount_percent || 0);

      const gross = qty * unitPrice;
      const discountAmt = gross * (discountPercent / 100);
      const lineTotal = gross - discountAmt;

      subtotal += gross;
      totalDiscount += discountAmt;

      processedItems.push({
        item_id: it.item_id,
        item_name: itemName,
        unit_id: unitId,
        quantity: qty,
        unit_price: unitPrice,
        discount_percent: discountPercent,
        discount_amount: discountAmt,
        line_total: lineTotal,
      });
    }

    const taxableAmount = subtotal - totalDiscount;
    const gstPct = Number(gst_rate || 0);
    const gstAmount = taxableAmount * (gstPct / 100);
    const grandTotal = Math.round(taxableAmount + gstAmount);

    const saleNumber = await generateNextSaleNumber(t);

    const sale = await PlastSale.create(
      {
        sale_number: saleNumber,
        sale_date: sale_date || new Date().toISOString().split("T")[0],
        customer_id: customer_id || null,
        customer_name: resolvedCustomerName || "Cash Customer",
        customer_phone: resolvedCustomerPhone || null,
        subtotal,
        total_discount: totalDiscount,
        taxable_amount: taxableAmount,
        gst_rate: gstPct,
        gst_amount: gstAmount,
        grand_total: grandTotal,
        payment_status: payment_status || "PAID",
        payment_mode: payment_mode || "CASH",
        notes: notes || null,
      },
      { transaction: t }
    );

    for (const it of processedItems) {
      await PlastSaleItem.create(
        {
          sale_id: sale.id,
          ...it,
        },
        { transaction: t }
      );

      // Deduct Finished Good stock on sale
      await adjustStock(it.item_id, -it.quantity, t);
    }

    return sale;
  });
};

// =========================================================================
// 7. REPORTS & ANALYTICS
// =========================================================================

export const getReports = async (type = "sales", filters = {}) => {
  const dateWhere = {};
  if (filters.from_date && filters.to_date) {
    dateWhere[Op.between] = [filters.from_date, filters.to_date];
  } else if (filters.from_date) {
    dateWhere[Op.gte] = filters.from_date;
  } else if (filters.to_date) {
    dateWhere[Op.lte] = filters.to_date;
  }

  if (type === "sales") {
    const where = {};
    if (Object.keys(dateWhere).length > 0) {
      where.sale_date = dateWhere;
    }
    if (filters.customer_id) {
      where.customer_id = filters.customer_id;
    }

    const sales = await PlastSale.findAll({
      where,
      include: [
        {
          model: PlastSaleItem,
          as: "items",
          include: [{ model: PlastItem, as: "item" }],
        },
      ],
      order: [["sale_date", "DESC"]],
    });

    const summary = {
      total_sales_count: sales.length,
      total_taxable: sales.reduce((acc, s) => acc + Number(s.taxable_amount || 0), 0),
      total_gst: sales.reduce((acc, s) => acc + Number(s.gst_amount || 0), 0),
      total_discount: sales.reduce((acc, s) => acc + Number(s.total_discount || 0), 0),
      grand_total: sales.reduce((acc, s) => acc + Number(s.grand_total || 0), 0),
    };

    return { type: "sales", summary, data: sales };
  }

  if (type === "purchases") {
    const where = {};
    if (Object.keys(dateWhere).length > 0) {
      where.receipt_date = dateWhere;
    }
    if (filters.supplier_id) {
      where.supplier_id = filters.supplier_id;
    }

    const purchases = await PlastStockReceipt.findAll({
      where,
      include: [
        { model: PlastSupplier, as: "supplier" },
        {
          model: PlastStockReceiptItem,
          as: "items",
          include: [{ model: PlastItem, as: "item" }],
        },
      ],
      order: [["receipt_date", "DESC"]],
    });

    const summary = {
      total_purchases_count: purchases.length,
      grand_total: purchases.reduce((acc, p) => acc + Number(p.total_amount || 0), 0),
    };

    return { type: "purchases", summary, data: purchases };
  }

  if (type === "production") {
    const where = {};
    if (Object.keys(dateWhere).length > 0) {
      where.production_date = dateWhere;
    }

    const entries = await PlastProductionEntry.findAll({
      where,
      include: [
        {
          model: PlastProductionMaterial,
          as: "materials",
          include: [{ model: PlastItem, as: "item" }, { model: PlastUnit, as: "unit" }],
        },
        {
          model: PlastProductionOutput,
          as: "outputs",
          include: [{ model: PlastItem, as: "item" }, { model: PlastUnit, as: "unit" }],
        },
      ],
      order: [["production_date", "DESC"]],
    });

    let totalRawUsed = 0;
    let totalWastage = 0;
    let totalProduced = 0;

    entries.forEach((e) => {
      e.materials?.forEach((m) => {
        totalRawUsed += Number(m.quantity_used || 0);
        totalWastage += Number(m.wastage_quantity || 0);
      });
      e.outputs?.forEach((o) => {
        totalProduced += Number(o.quantity_produced || 0);
      });
    });

    const summary = {
      total_entries: entries.length,
      total_raw_used: totalRawUsed,
      total_wastage: totalWastage,
      total_produced: totalProduced,
    };

    return { type: "production", summary, data: entries };
  }

  if (type === "stock") {
    const stockList = await getStockOnHand(filters);
    const summary = {
      total_items: stockList.length,
      raw_materials_count: stockList.filter((s) => s.item_type === "RAW_MATERIAL").length,
      finished_goods_count: stockList.filter((s) => s.item_type === "FINISHED_GOOD").length,
      total_stock_value: stockList.reduce((acc, s) => acc + s.stock_value, 0),
    };
    return { type: "stock", summary, data: stockList };
  }

  throw new AppError("Invalid report type. Supported: sales, purchases, production, stock", 400);
};

// =========================================================================
// 8. DASHBOARD STATS
// =========================================================================

export const getDashboardStats = async () => {
  const today = new Date().toISOString().split("T")[0];
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .split("T")[0];

  // 1. Today's Sales
  const todaySales = await PlastSale.findAll({
    where: { sale_date: today },
  });
  const todaySalesAmount = todaySales.reduce((acc, s) => acc + Number(s.grand_total || 0), 0);

  // 2. Month Sales
  const monthSales = await PlastSale.findAll({
    where: { sale_date: { [Op.gte]: firstDayOfMonth } },
  });
  const monthSalesAmount = monthSales.reduce((acc, s) => acc + Number(s.grand_total || 0), 0);

  // 3. Stock Summary
  const stockList = await getStockOnHand();
  const rawCount = stockList.filter((s) => s.item_type === "RAW_MATERIAL").length;
  const finishedCount = stockList.filter((s) => s.item_type === "FINISHED_GOOD").length;
  const lowStockItems = stockList.filter((s) => s.quantity_on_hand <= 5);

  // 4. Today's Production
  const todayProduction = await PlastProductionEntry.findAll({
    where: { production_date: today },
    include: [
      { model: PlastProductionOutput, as: "outputs" },
      { model: PlastProductionMaterial, as: "materials" },
    ],
  });

  let todayProducedUnits = 0;
  let todayWastageUnits = 0;
  todayProduction.forEach((p) => {
    p.outputs?.forEach((o) => (todayProducedUnits += Number(o.quantity_produced || 0)));
    p.materials?.forEach((m) => (todayWastageUnits += Number(m.wastage_quantity || 0)));
  });

  // 5. Recent Sales
  const recentSales = await PlastSale.findAll({
    limit: 5,
    order: [["created_at", "DESC"]],
  });

  return {
    today_sales_count: todaySales.length,
    today_sales_amount: todaySalesAmount,
    month_sales_amount: monthSalesAmount,
    raw_materials_count: rawCount,
    finished_goods_count: finishedCount,
    low_stock_count: lowStockItems.length,
    low_stock_items: lowStockItems.slice(0, 5),
    today_produced_units: todayProducedUnits,
    today_wastage_units: todayWastageUnits,
    recent_sales: recentSales,
  };
};

export default {
  ensurePlastDefaultUnits,
  getUnits,
  createUnit,
  getItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  getSuppliers,
  createSupplier,
  updateSupplier,
  getCustomers,
  createCustomer,
  updateCustomer,
  getStockOnHand,
  getPurchases,
  createPurchase,
  getProductionEntries,
  createProductionEntry,
  getSales,
  getSaleById,
  createSale,
  getReports,
  getDashboardStats,
};
