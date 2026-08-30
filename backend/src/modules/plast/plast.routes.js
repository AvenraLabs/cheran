import { Router } from "express";
import * as controller from "./plast.controller.js";
import { authorize } from "../../shared/middlewares/authMiddleware.js";

const router = Router();

// Only ADMIN can access Plast module
router.use(authorize("ADMIN"));

// Dashboard & Reports
router.get("/dashboard", controller.getDashboardStats);
router.get("/reports", controller.getReports);

// Units
router.get("/units", controller.getUnits);
router.post("/units", controller.createUnit);

// Items
router.get("/items", controller.getItems);
router.get("/items/:id", controller.getItemById);
router.post("/items", controller.createItem);
router.put("/items/:id", controller.updateItem);
router.delete("/items/:id", controller.deleteItem);

// Suppliers (Vendors)
router.get("/suppliers", controller.getSuppliers);
router.post("/suppliers", controller.createSupplier);
router.put("/suppliers/:id", controller.updateSupplier);

// Customers
router.get("/customers", controller.getCustomers);
router.post("/customers", controller.createCustomer);
router.put("/customers/:id", controller.updateCustomer);

// Stock On-Hand
router.get("/inventory/stock", controller.getStockOnHand);

// Purchases (Raw Material Receipts from Vendors)
router.get("/purchases", controller.getPurchases);
router.post("/purchases", controller.createPurchase);

// Production (Daily Raw Material Consumption + Wastage -> Finished Goods)
router.get("/production", controller.getProductionEntries);
router.post("/production", controller.createProductionEntry);

// Sales & Billing (Per-item discount & 0/5/18 GST)
router.get("/sales", controller.getSales);
router.get("/sales/:id", controller.getSaleById);
router.post("/sales", controller.createSale);

export default router;
