import { Router } from "express";
import * as reportController from "./report.controller.js";

const router = Router();

router.get("/dealers", reportController.getDealerReport);
router.get("/expenses", reportController.getExpenseReport);
router.get("/employees", reportController.getEmployeeReport);

export default router;
