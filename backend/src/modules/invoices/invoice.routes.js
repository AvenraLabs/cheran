import { Router } from "express";
import validate from "../../shared/middlewares/validate.js";
import {
  createInvoiceSchema,
  cancelInvoiceSchema,
  listInvoiceSchema,
} from "./invoice.schema.js";
import * as invoiceController from "./invoice.controller.js";

const router = Router();

router.route("/")
  .get(validate(listInvoiceSchema), invoiceController.listInvoices)
  .post(validate(createInvoiceSchema), invoiceController.createInvoice);

router.route("/:id")
  .get(invoiceController.getInvoiceById);

router.post("/:id/cancel", validate(cancelInvoiceSchema), invoiceController.cancelInvoice);

export default router;
