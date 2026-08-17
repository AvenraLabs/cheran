import { Router } from "express";
import validate from "../../shared/middlewares/validate.js";
import { createSaleSchema, recordPaymentSchema, listSaleSchema } from "./sale.schema.js";
import * as saleController from "./sale.controller.js";

const router = Router();

router.get("/", validate(listSaleSchema), saleController.listSales);
router.post("/", validate(createSaleSchema), saleController.createSale);
router.post("/payments", validate(recordPaymentSchema), saleController.recordPayment);
router.get("/:id", saleController.getSaleById);

export default router;
