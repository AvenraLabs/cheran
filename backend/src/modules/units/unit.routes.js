import { Router } from "express";
import validate from "../../shared/middlewares/validate.js";
import { createUnitSchema, updateUnitSchema, listUnitSchema } from "./unit.schema.js";
import * as unitController from "./unit.controller.js";

const router = Router();

router.get("/", validate(listUnitSchema), unitController.listUnits);
router.post("/", validate(createUnitSchema), unitController.createUnit);
router.get("/:id", unitController.getUnitById);
router.patch("/:id", validate(updateUnitSchema), unitController.updateUnit);
router.delete("/:id", unitController.deleteUnit);

export default router;
