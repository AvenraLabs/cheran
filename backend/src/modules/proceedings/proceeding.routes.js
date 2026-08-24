import { Router } from "express";
import * as controller from "./proceeding.controller.js";

const router = Router();

// Fund Percentage Master Slabs
router.get("/fund-percentages", controller.getFundPercentages);
router.post("/fund-percentages", controller.createFundPercentage);
router.delete("/fund-percentages/:id", controller.deleteFundPercentage);

// Proceeding Batches
router.get("/", controller.listProceedingBatches);
router.post("/preview-ids", controller.previewProceedingIds);
router.post("/", controller.createProceedingBatch);
router.get("/:id", controller.getProceedingBatchById);
router.patch("/:id/projects/:projectRecordId/penalty", controller.updateProjectPenalty);
router.post("/:id/recalculate", controller.recalculateProceedingBatch);
router.patch("/:id/bank-receipt", controller.updateBankPaymentReceipt);
router.post("/:id/mark-dealer-paid", controller.markDealerPayout);
router.delete("/:id", controller.deleteProceedingBatch);

export default router;
