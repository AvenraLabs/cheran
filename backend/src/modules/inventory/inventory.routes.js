import { Router } from "express";
import validate from "../../shared/middlewares/validate.js";
import {
  createOpeningStockSchema,
  createStockReceiptSchema,
  listStockReceiptsSchema,
  createProductionEntrySchema,
  listProductionSchema,
  getProductionByIdSchema,
  createAdjustmentSchema,
  stockSummarySchema,
  itemLedgerSchema,
  movementHistorySchema,
} from "./inventory.schema.js";
import * as inventoryController from "./inventory.controller.js";

const router = Router();

// Dashboard Summary KPIs & Recent Movements
router.get("/summary", inventoryController.getInventorySummary);
router.get("/recent-movements", inventoryController.getRecentMovements);

// Current stock on-hand report
router.get("/stock", validate(stockSummarySchema), inventoryController.getStockSummary);

// Item Ledger with running balance & opening balance
router.get("/items/:itemId/ledger", validate(itemLedgerSchema), inventoryController.getItemLedger);

// Explicit Opening Stock
router.post("/opening-stock", validate(createOpeningStockSchema), inventoryController.createOpeningStock);

// Stock movement log & audit trail
router.get("/movements", validate(movementHistorySchema), inventoryController.getMovementHistory);

// Raw Material Purchase Receipts & Purchase History
router.post("/receipts", validate(createStockReceiptSchema), inventoryController.createStockReceipt);
router.get("/receipts", validate(listStockReceiptsSchema), inventoryController.listStockReceipts);
router.get("/receipts/:id", inventoryController.getStockReceiptById);

// Daily Production Entry & Production History
router.post("/production", validate(createProductionEntrySchema), inventoryController.createProductionEntry);
router.get("/production", validate(listProductionSchema), inventoryController.listProductionEntries);
router.get("/production/:id", validate(getProductionByIdSchema), inventoryController.getProductionEntryById);

// Manual stock adjustment (+/-)
router.post("/adjustments", validate(createAdjustmentSchema), inventoryController.createStockAdjustment);

export default router;
