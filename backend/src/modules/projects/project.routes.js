import { Router } from "express";
import validate from "../../shared/middlewares/validate.js";
import { listProjectsSchema, getProjectSchema } from "./project.schema.js";
import * as projectController from "./project.controller.js";

const router = Router();

// Stats endpoints before parameterized paths
router.get("/stats/status-summary", projectController.getStatusSummaryStats);
router.get("/stats/stage-durations", projectController.getStageDurationStats);

router.route("/").get(validate(listProjectsSchema), projectController.listProjects);

router.route("/:id").get(validate(getProjectSchema), projectController.getProject);

router
  .route("/:id/status-history")
  .get(validate(getProjectSchema), projectController.getProjectStatusHistory);

export default router;
