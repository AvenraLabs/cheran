import { Router } from "express";
import validate from "../../shared/middlewares/validate.js";
import { listProjectsSchema, getProjectSchema } from "./project.schema.js";
import * as projectController from "./project.controller.js";

const router = Router();

// Stats endpoints before parameterized paths
router.get("/stats/status-summary", projectController.getStatusSummaryStats);
router.get("/stats/stage-durations", projectController.getStageDurationStats);
router.get("/search", projectController.searchProjects);

router.route("/").get(validate(listProjectsSchema), projectController.listProjects);

router.route("/:id").get(validate(getProjectSchema), projectController.getProject);

router
  .route("/:id/status-history")
  .get(validate(getProjectSchema), projectController.getProjectStatusHistory);

// Correct / Rename or Merge Mistyped Project
router.post("/:id/merge", validate(getProjectSchema), projectController.renameOrMergeProject);
router.post("/:id/rename-or-merge", validate(getProjectSchema), projectController.renameOrMergeProject);

// Project Invoices & Dispatched Materials
router.get("/:id/invoices", validate(getProjectSchema), async (req, res, next) => {
  const { getProjectInvoices } = await import("../invoices/invoice.service.js");
  try {
    const result = await getProjectInvoices(req.params.id);
    res.status(200).json({ status: "success", data: result });
  } catch (err) {
    next(err);
  }
});

// Dealer Commission & Milestone Payouts
router.get("/:id/commission", validate(getProjectSchema), projectController.getProjectCommission);
router.post("/:id/commission/payout", validate(getProjectSchema), projectController.recordCommissionPayment);

export default router;
