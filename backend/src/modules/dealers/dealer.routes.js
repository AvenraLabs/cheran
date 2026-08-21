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
import * as commissionController from "./dealer-commission.controller.js";
import {
  createCommissionSchema,
  updateCommissionStatusSchema,
  listCommissionsSchema,
} from "./dealer-commission.schema.js";

const router = Router();

// Commission endpoints
router
  .route("/commissions")
  .get(validate(listCommissionsSchema), commissionController.listCommissions)
  .post(validate(createCommissionSchema), commissionController.createCommission);

router.patch(
  "/commissions/:id",
  validate(updateCommissionStatusSchema),
  commissionController.updateCommissionStatus
);

router
  .route("/")
  .get(validate(listDealerSchema), dealerController.listDealers)
  .post(validate(createDealerSchema), dealerController.createDealer);

// Lightweight options for dropdown selects
router.get("/options", dealerController.getDealerOptions);

// Merge duplicate dealers into a target dealer
router.post("/merge", validate(mergeDealersSchema), dealerController.mergeDealers);

router
  .route("/:id")
  .get(validate(getDealerSchema), dealerController.getDealer)
  .patch(validate(updateDealerSchema), dealerController.updateDealer)
  .delete(validate(getDealerSchema), dealerController.deleteDealer);

export default router;
