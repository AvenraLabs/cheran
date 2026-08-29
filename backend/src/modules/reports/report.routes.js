import { Router } from "express";
import * as reportController from "./report.controller.js";

const router = Router();

router.get("/financial-overview", reportController.getFinancialOverviewReport);
router.get("/procurement", reportController.getProcurementReport);
router.get("/govt-funds", reportController.getGovernmentFundsReport);
router.get("/dealers", reportController.getDealerReport);
router.get("/expenses", reportController.getExpenseReport);
router.get("/employees", reportController.getEmployeeReport);
router.get("/pending-funnel", reportController.getPendingFunnelSummary);
router.get("/pending-projects", reportController.getPendingProjectsList);
router.get("/material-supplied", reportController.getMaterialSuppliedList);
router.put("/material-supplied", reportController.upsertMaterialSupplied);

export default router;

