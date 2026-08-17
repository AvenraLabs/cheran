import { Router } from "express";
import validate from "../../shared/middlewares/validate.js";
import { dashboardFilterSchema } from "./dashboard.schema.js";
import * as dashboardController from "./dashboard.controller.js";

const router = Router();

// Project summary & counts (Dynamic statuses, districts, dealers, and pending projects)
router.get(
  "/government/summary",
  validate(dashboardFilterSchema),
  dashboardController.getGovernmentSummary
);

// Status distribution (status, count, percentage)
router.get(
  "/government/status-distribution",
  validate(dashboardFilterSchema),
  dashboardController.getStatusDistribution
);

// Dealer distribution (dealer, count, percentage, subsidy)
router.get(
  "/government/dealer-distribution",
  validate(dashboardFilterSchema),
  dashboardController.getDealerDistribution
);

// District distribution (district, count, percentage, area)
router.get(
  "/government/district-distribution",
  validate(dashboardFilterSchema),
  dashboardController.getDistrictDistribution
);

// Average stage durations from observed status history (min, max, average, count)
router.get("/government/stage-durations", dashboardController.getStageDurations);

export default router;
