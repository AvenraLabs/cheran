import { Router } from "express";
import validate from "../../shared/middlewares/validate.js";
import {
  createDealerSchema,
  updateDealerSchema,
  mergeDealersSchema,
  getDealerSchema,
  listDealerSchema,
} from "./dealer.schema.js";
import * as dealerController from "./dealer.controller.js";

const router = Router();

router
  .route("/")
  .get(validate(listDealerSchema), dealerController.listDealers)
  .post(validate(createDealerSchema), dealerController.createDealer);

// Merge duplicate dealers into a target dealer
router.post("/merge", validate(mergeDealersSchema), dealerController.mergeDealers);

router
  .route("/:id")
  .get(validate(getDealerSchema), dealerController.getDealer)
  .patch(validate(updateDealerSchema), dealerController.updateDealer)
  .delete(validate(getDealerSchema), dealerController.deleteDealer);

export default router;
