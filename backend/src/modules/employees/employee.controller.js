import asyncHandler from "../../shared/asyncHandler.js";
import * as employeeService from "./employee.service.js";

// Employees
export const listEmployees = asyncHandler(async (req, res) => {
  const employees = await employeeService.listEmployees(req.query);
  res.status(200).json({
    status: "success",
    data: { employees },
  });
});

export const getEmployeeById = asyncHandler(async (req, res) => {
  const employee = await employeeService.getEmployeeById(req.params.id);
  res.status(200).json({
    status: "success",
    data: { employee },
  });
});

export const createEmployee = asyncHandler(async (req, res) => {
  const employee = await employeeService.createEmployee(req.body);
  res.status(201).json({
    status: "success",
    data: { employee },
  });
});

export const updateEmployee = asyncHandler(async (req, res) => {
  const employee = await employeeService.updateEmployee(req.params.id, req.body);
  res.status(200).json({
    status: "success",
    data: { employee },
  });
});

// Attendance
export const recordBulkAttendance = asyncHandler(async (req, res) => {
  const records = await employeeService.recordBulkAttendance(req.body);
  res.status(200).json({
    status: "success",
    data: { count: records.length, records },
  });
});

export const recordAttendanceForEmployee = asyncHandler(async (req, res) => {
  const attendance = await employeeService.recordAttendance({
    employee_id: req.params.id,
    ...req.body,
  });
  res.status(201).json({
    status: "success",
    data: { attendance },
  });
});

export const listAttendance = asyncHandler(async (req, res) => {
  const attendance = await employeeService.listAttendance(req.query);
  res.status(200).json({
    status: "success",
    data: { attendance },
  });
});

export const updateAttendance = asyncHandler(async (req, res) => {
  const attendance = await employeeService.updateAttendance(req.params.id, req.body);
  res.status(200).json({
    status: "success",
    data: { attendance },
  });
});

// Salary
export const listSalaryRecords = asyncHandler(async (req, res) => {
  const records = await employeeService.listSalaryRecords(req.query);
  res.status(200).json({
    status: "success",
    data: { records },
  });
});

export const bulkPaySalaries = asyncHandler(async (req, res) => {
  const records = await employeeService.bulkPaySalaries(req.body);
  res.status(200).json({
    status: "success",
    data: { count: records.length, records },
  });
});

export const createSalaryRecord = asyncHandler(async (req, res) => {
  const record = await employeeService.createSalaryRecord(req.body);
  res.status(201).json({
    status: "success",
    data: { record },
  });
});

export const updateSalaryRecord = asyncHandler(async (req, res) => {
  const record = await employeeService.updateSalaryRecord(req.params.id, req.body);
  res.status(200).json({
    status: "success",
    data: { record },
  });
});
