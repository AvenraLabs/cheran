import { Router } from "express";
import * as controller from "./plast.controller.js";
import { authorize } from "../../shared/middlewares/authMiddleware.js";

const router = Router();

// Allow ADMIN, PLAST, PLAST_USER, PLAST_PAYMENTS into Plast router
router.use(authorize("ADMIN", "PLAST", "PLAST_USER", "PLAST_PAYMENTS"));

// Dashboard & Reports (ADMIN only)
router.get("/dashboard", authorize("ADMIN"), controller.getDashboardStats);
router.get("/reports", authorize("ADMIN"), controller.getReports);

// Units (Accessible to ADMIN, PLAST_USER, PLAST_PAYMENTS)
router.get("/units", controller.getUnits);
router.post("/units", authorize("ADMIN", "PLAST", "PLAST_USER", "PLAST_PAYMENTS"), controller.createUnit);
router.put("/units/:id", authorize("ADMIN", "PLAST", "PLAST_USER", "PLAST_PAYMENTS"), controller.updateUnit);
router.delete("/units/:id", authorize("ADMIN", "PLAST", "PLAST_USER", "PLAST_PAYMENTS"), controller.deleteUnit);

// Items (Read & Create/Edit accessible to ADMIN, PLAST_USER, PLAST_PAYMENTS; Delete is ADMIN only)
router.get("/items", controller.getItems);
router.get("/items/:id", controller.getItemById);
router.post("/items", authorize("ADMIN", "PLAST", "PLAST_USER", "PLAST_PAYMENTS"), controller.createItem);
router.put("/items/:id", authorize("ADMIN", "PLAST", "PLAST_USER", "PLAST_PAYMENTS"), controller.updateItem);
router.delete("/items/:id", authorize("ADMIN"), controller.deleteItem);

// Suppliers (Vendors) (ADMIN only)
router.get("/suppliers", authorize("ADMIN"), controller.getSuppliers);
router.post("/suppliers", authorize("ADMIN"), controller.createSupplier);
router.put("/suppliers/:id", authorize("ADMIN"), controller.updateSupplier);

// Customers (Accessible to ADMIN, PLAST_USER, PLAST_PAYMENTS for billing)
router.get("/customers", controller.getCustomers);
router.post("/customers", controller.createCustomer);
router.put("/customers/:id", controller.updateCustomer);

// Stock On-Hand (ADMIN only)
router.get("/inventory/stock", authorize("ADMIN"), controller.getStockOnHand);
router.post("/inventory/stock/adjust", authorize("ADMIN"), controller.adjustStock);

// Purchases (Raw Material Receipts from Vendors) (ADMIN only)
router.get("/purchases", authorize("ADMIN"), controller.getPurchases);
router.post("/purchases", authorize("ADMIN"), controller.createPurchase);

// Production (Daily Raw Material Consumption + Wastage -> Finished Goods)
// Accessible to ADMIN, PLAST_USER, PLAST_PAYMENTS for daily entries
router.get("/production", authorize("ADMIN", "PLAST", "PLAST_USER", "PLAST_PAYMENTS"), controller.getProductionEntries);
router.post("/production", authorize("ADMIN", "PLAST", "PLAST_USER", "PLAST_PAYMENTS"), controller.createProductionEntry);

// Sales & Billing (Accessible to ADMIN, PLAST_USER, PLAST_PAYMENTS)
router.get("/sales", controller.getSales);
router.get("/sales/:id", controller.getSaleById);
router.post("/sales", controller.createSale);

// Payments (Accessible to ADMIN and PLAST_PAYMENTS only)
router.get("/payments/summary", authorize("ADMIN", "PLAST_PAYMENTS"), controller.getPaymentsSummary);
router.get("/sales/:id/payments", authorize("ADMIN", "PLAST_PAYMENTS"), controller.getSalePayments);
router.post("/sales/:id/payments", authorize("ADMIN", "PLAST_PAYMENTS"), controller.recordSalePayment);

export default router;
