import { Router } from "express";
import * as controller from "./proceeding.controller.js";
import { uploadExcel } from "../../shared/middlewares/upload.js";

const router = Router();

// Excel Proceeding Import
router.post("/preview-excel", uploadExcel.single("file"), controller.previewProceedingExcel);
router.post("/import-excel", uploadExcel.single("file"), controller.importProceedingExcel);

// Proceeding Batches History & Details
router.get("/", controller.listProceedingBatches);
router.get("/dealer-statement", controller.getDealerCommissionStatement);
router.get("/:id", controller.getProceedingBatchById);
router.post("/:id/recalculate", controller.recalculateProceedingBatch);
router.patch("/:id/bank-receipt", controller.updateBankPaymentReceipt);
router.post("/:id/mark-dealer-paid", controller.markDealerPayout);
router.patch("/:id/projects/:projectRecordId/penalty", controller.updateProjectPenalty);
router.delete("/:id", controller.deleteProceedingBatch);

export default router;
