import { Router } from "express";
import validate from "../../shared/middlewares/validate.js";
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  recordAttendanceSchema,
  bulkAttendanceSchema,
  updateAttendanceSchema,
  listAttendanceSchema,
  createSalaryRecordSchema,
  updateSalaryRecordSchema,
} from "./employee.schema.js";
import * as employeeController from "./employee.controller.js";

const router = Router();

// Attendance global list, bulk entry & update
router.get("/attendance", validate(listAttendanceSchema), employeeController.listAttendance);
router.post("/attendance/bulk", validate(bulkAttendanceSchema), employeeController.recordBulkAttendance);
router.patch("/attendance/:id", validate(updateAttendanceSchema), employeeController.updateAttendance);

// Salary records
router.get("/salary", employeeController.listSalaryRecords);
router.post("/salary/bulk-pay", employeeController.bulkPaySalaries);
router.post("/salary", validate(createSalaryRecordSchema), employeeController.createSalaryRecord);
router.patch("/salary/:id", validate(updateSalaryRecordSchema), employeeController.updateSalaryRecord);

// Employee CRUD & individual attendance logging
router.get("/", employeeController.listEmployees);
router.post("/", validate(createEmployeeSchema), employeeController.createEmployee);
router.get("/:id", employeeController.getEmployeeById);
router.patch("/:id", validate(updateEmployeeSchema), employeeController.updateEmployee);
router.post(
  "/:id/attendance",
  validate(recordAttendanceSchema),
  employeeController.recordAttendanceForEmployee
);

export default router;
