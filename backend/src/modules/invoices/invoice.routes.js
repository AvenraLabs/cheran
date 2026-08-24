import { Router } from "express";
import validate from "../../shared/middlewares/validate.js";
import { uploadExcel, uploadJson } from "../../shared/middlewares/upload.js";
import {
  createInvoiceSchema,
  cancelInvoiceSchema,
  listInvoiceSchema,
} from "./invoice.schema.js";
import * as invoiceController from "./invoice.controller.js";

const router = Router();

// 1. Bulk Upload & Load Order Routes
router.post(
  "/historical-json",
  uploadJson.single("file"),
  invoiceController.importHistoricalInvoiceJson
);

router.post(
  "/load-order/preview",
  (req, res, next) => {
    if (req.is("json")) {
      return next();
    }
    uploadExcel.single("file")(req, res, next);
  },
  invoiceController.previewLoadOrder
);

router.post(
  "/load-order/commit",
  invoiceController.commitLoadOrder
);

router.get("/load-order/batches", invoiceController.listLoadOrderBatches);
router.get("/load-order/batches/:id", invoiceController.getLoadOrderBatchById);
router.post("/load-order/batches/:id/cancel", invoiceController.cancelLoadOrderBatch);

// 2. Standard Invoice CRUD & Analytics
router.get("/direct-sales/analytics", invoiceController.getDirectSalesAnalytics);

router
  .route("/")
  .get(validate(listInvoiceSchema), invoiceController.listInvoices)
  .post(validate(createInvoiceSchema), invoiceController.createInvoice);

router.route("/:id").get(invoiceController.getInvoiceById);

router.post("/:id/cancel", validate(cancelInvoiceSchema), invoiceController.cancelInvoice);
router.post("/:id/payment", invoiceController.recordInvoicePayment);

export default router;
