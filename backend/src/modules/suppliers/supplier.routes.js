import { Router } from "express";
import validate from "../../shared/middlewares/validate.js";
import { createSupplierSchema, updateSupplierSchema, listSupplierSchema } from "./supplier.schema.js";
import * as supplierController from "./supplier.controller.js";

const router = Router();

router.get("/", validate(listSupplierSchema), supplierController.listSuppliers);
router.get("/options", supplierController.getSupplierOptions);
router.post("/", validate(createSupplierSchema), supplierController.createSupplier);
router.get("/:id", supplierController.getSupplierById);
router.patch("/:id", validate(updateSupplierSchema), supplierController.updateSupplier);

export default router;
