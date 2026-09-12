import { Router } from "express";
import validate from "../../shared/middlewares/validate.js";
import {
  createDealerSchema,
  updateDealerSchema,
  mergeDealersSchema,
  getDealerSchema,
  listDealerSchema,
  setUniversalCommissionSchema,
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

// Set universal commission percentage for all dealers
router.post(
  "/universal-commission",
  validate(setUniversalCommissionSchema),
  dealerController.setUniversalCommission
);

// Universal commission policy rule (date-effective)
router.post("/universal-policy", dealerController.applyUniversalCommissionPolicy);

// Merge duplicate dealers into a target dealer
router.post("/merge", validate(mergeDealersSchema), dealerController.mergeDealers);

// Dealer Commission Slabs
router.get("/:id/slabs", dealerController.getDealerCommissionSlabs);
router.post("/:id/slabs", dealerController.createDealerCommissionSlab);
router.put("/slabs/:slabId", dealerController.updateDealerCommissionSlab);
router.delete("/slabs/:slabId", dealerController.deleteDealerCommissionSlab);

router
  .route("/:id")
  .get(validate(getDealerSchema), dealerController.getDealer)
  .patch(validate(updateDealerSchema), dealerController.updateDealer)
  .delete(validate(getDealerSchema), dealerController.deleteDealer);

export default router;
