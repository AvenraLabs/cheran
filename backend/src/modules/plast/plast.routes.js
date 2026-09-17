import { Router } from "express";
import * as controller from "./plast.controller.js";
import { authorize } from "../../shared/middlewares/authMiddleware.js";

const router = Router();

// Allow ADMIN and PLAST into Plast router
router.use(authorize("ADMIN", "PLAST"));

// Dashboard & Reports (ADMIN only)
router.get("/dashboard", authorize("ADMIN"), controller.getDashboardStats);
router.get("/reports", authorize("ADMIN"), controller.getReports);

// Units (Read accessible to PLAST for sales dropdowns; Write is ADMIN only)
router.get("/units", controller.getUnits);
router.post("/units", authorize("ADMIN"), controller.createUnit);
router.put("/units/:id", authorize("ADMIN"), controller.updateUnit);
router.delete("/units/:id", authorize("ADMIN"), controller.deleteUnit);

// Items (Read accessible to PLAST for sales dropdowns; Write is ADMIN only)
router.get("/items", controller.getItems);
router.get("/items/:id", controller.getItemById);
router.post("/items", authorize("ADMIN"), controller.createItem);
router.put("/items/:id", authorize("ADMIN"), controller.updateItem);
router.delete("/items/:id", authorize("ADMIN"), controller.deleteItem);

// Suppliers (Vendors) (ADMIN only)
router.get("/suppliers", authorize("ADMIN"), controller.getSuppliers);
router.post("/suppliers", authorize("ADMIN"), controller.createSupplier);
router.put("/suppliers/:id", authorize("ADMIN"), controller.updateSupplier);

// Customers (Accessible to both ADMIN and PLAST for billing)
router.get("/customers", controller.getCustomers);
router.post("/customers", controller.createCustomer);
router.put("/customers/:id", controller.updateCustomer);

// Stock On-Hand (ADMIN only)
router.get("/inventory/stock", authorize("ADMIN"), controller.getStockOnHand);
router.post("/inventory/stock/adjust", authorize("ADMIN"), controller.adjustStock);

// Purchases (Raw Material Receipts from Vendors) (ADMIN only)
router.get("/purchases", authorize("ADMIN"), controller.getPurchases);
router.post("/purchases", authorize("ADMIN"), controller.createPurchase);

// Production (Daily Raw Material Consumption + Wastage -> Finished Goods) (ADMIN only)
router.get("/production", authorize("ADMIN"), controller.getProductionEntries);
router.post("/production", authorize("ADMIN"), controller.createProductionEntry);

// Sales & Billing (Accessible to both ADMIN and PLAST)
router.get("/sales", controller.getSales);
router.get("/sales/:id", controller.getSaleById);
router.post("/sales", controller.createSale);

// Payments (Accessible to both ADMIN and PLAST)
router.get("/payments/summary", controller.getPaymentsSummary);
router.get("/sales/:id/payments", controller.getSalePayments);
router.post("/sales/:id/payments", controller.recordSalePayment);

export default router;
