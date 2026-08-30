import * as plastService from "./plast.service.js";

// ==========================================
// Units & Items
// ==========================================
export const getUnits = async (req, res, next) => {
  try {
    const data = await plastService.getUnits();
    res.status(200).json({ status: "success", data });
  } catch (err) {
    next(err);
  }
};

export const createUnit = async (req, res, next) => {
  try {
    const data = await plastService.createUnit(req.body);
    res.status(201).json({ status: "success", message: "Unit created successfully", data });
  } catch (err) {
    next(err);
  }
};

export const getItems = async (req, res, next) => {
  try {
    const data = await plastService.getItems(req.query);
    res.status(200).json({ status: "success", count: data.length, data });
  } catch (err) {
    next(err);
  }
};

export const getItemById = async (req, res, next) => {
  try {
    const data = await plastService.getItemById(req.params.id);
    res.status(200).json({ status: "success", data });
  } catch (err) {
    next(err);
  }
};

export const createItem = async (req, res, next) => {
  try {
    const data = await plastService.createItem(req.body);
    res.status(201).json({ status: "success", message: "Item created successfully", data });
  } catch (err) {
    next(err);
  }
};

export const updateItem = async (req, res, next) => {
  try {
    const data = await plastService.updateItem(req.params.id, req.body);
    res.status(200).json({ status: "success", message: "Item updated successfully", data });
  } catch (err) {
    next(err);
  }
};

export const deleteItem = async (req, res, next) => {
  try {
    await plastService.deleteItem(req.params.id);
    res.status(200).json({ status: "success", message: "Item deactivated successfully" });
  } catch (err) {
    next(err);
  }
};

// ==========================================
// Suppliers & Customers
// ==========================================
export const getSuppliers = async (req, res, next) => {
  try {
    const data = await plastService.getSuppliers(req.query.search);
    res.status(200).json({ status: "success", data });
  } catch (err) {
    next(err);
  }
};

export const createSupplier = async (req, res, next) => {
  try {
    const data = await plastService.createSupplier(req.body);
    res.status(201).json({ status: "success", message: "Supplier saved successfully", data });
  } catch (err) {
    next(err);
  }
};

export const updateSupplier = async (req, res, next) => {
  try {
    const data = await plastService.updateSupplier(req.params.id, req.body);
    res.status(200).json({ status: "success", message: "Supplier updated successfully", data });
  } catch (err) {
    next(err);
  }
};

export const getCustomers = async (req, res, next) => {
  try {
    const data = await plastService.getCustomers(req.query.search);
    res.status(200).json({ status: "success", data });
  } catch (err) {
    next(err);
  }
};

export const createCustomer = async (req, res, next) => {
  try {
    const data = await plastService.createCustomer(req.body);
    res.status(201).json({ status: "success", message: "Customer added successfully", data });
  } catch (err) {
    next(err);
  }
};

export const updateCustomer = async (req, res, next) => {
  try {
    const data = await plastService.updateCustomer(req.params.id, req.body);
    res.status(200).json({ status: "success", message: "Customer updated successfully", data });
  } catch (err) {
    next(err);
  }
};

// ==========================================
// Stock On-Hand
// ==========================================
export const getStockOnHand = async (req, res, next) => {
  try {
    const data = await plastService.getStockOnHand(req.query);
    res.status(200).json({ status: "success", count: data.length, data });
  } catch (err) {
    next(err);
  }
};

// ==========================================
// Purchases (Raw Material Receipts)
// ==========================================
export const getPurchases = async (req, res, next) => {
  try {
    const data = await plastService.getPurchases(req.query);
    res.status(200).json({ status: "success", count: data.length, data });
  } catch (err) {
    next(err);
  }
};

export const createPurchase = async (req, res, next) => {
  try {
    const data = await plastService.createPurchase(req.body);
    res.status(201).json({ status: "success", message: "Purchase receipt recorded and stock updated.", data });
  } catch (err) {
    next(err);
  }
};

// ==========================================
// Daily Production
// ==========================================
export const getProductionEntries = async (req, res, next) => {
  try {
    const data = await plastService.getProductionEntries(req.query);
    res.status(200).json({ status: "success", count: data.length, data });
  } catch (err) {
    next(err);
  }
};

export const createProductionEntry = async (req, res, next) => {
  try {
    const data = await plastService.createProductionEntry(req.body);
    res.status(201).json({ status: "success", message: "Production entry recorded and inventory adjusted.", data });
  } catch (err) {
    next(err);
  }
};

// ==========================================
// Sales & Billing
// ==========================================
export const getSales = async (req, res, next) => {
  try {
    const data = await plastService.getSales(req.query);
    res.status(200).json({ status: "success", count: data.length, data });
  } catch (err) {
    next(err);
  }
};

export const getSaleById = async (req, res, next) => {
  try {
    const data = await plastService.getSaleById(req.params.id);
    res.status(200).json({ status: "success", data });
  } catch (err) {
    next(err);
  }
};

export const createSale = async (req, res, next) => {
  try {
    const data = await plastService.createSale(req.body);
    res.status(201).json({ status: "success", message: "Sale invoice created and stock updated.", data });
  } catch (err) {
    next(err);
  }
};

// ==========================================
// Reports & Dashboard
// ==========================================
export const getReports = async (req, res, next) => {
  try {
    const { type = "sales", ...filters } = req.query;
    const data = await plastService.getReports(type, filters);
    res.status(200).json({ status: "success", data });
  } catch (err) {
    next(err);
  }
};

export const getDashboardStats = async (req, res, next) => {
  try {
    const data = await plastService.getDashboardStats();
    res.status(200).json({ status: "success", data });
  } catch (err) {
    next(err);
  }
};
