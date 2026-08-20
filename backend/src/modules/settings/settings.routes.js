import { Router } from "express";
import * as settingsController from "./settings.controller.js";

const router = Router();

router
  .route("/tax-slabs")
  .get(settingsController.listTaxSlabs)
  .post(settingsController.createTaxSlab);

router.get("/tax-slabs/effective", settingsController.getEffectiveTaxSlab);

router
  .route("/tax-slabs/:id")
  .put(settingsController.updateTaxSlab)
  .delete(settingsController.deleteTaxSlab);

export default router;
