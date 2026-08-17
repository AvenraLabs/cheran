import asyncHandler from "../../shared/asyncHandler.js";
import * as reportService from "./report.service.js";

export const getDealerReport = asyncHandler(async (req, res) => {
  const result = await reportService.getDealerReport();
  res.status(200).json({
    status: "success",
    data: { dealers: result },
  });
});

export const getSalesReport = asyncHandler(async (req, res) => {
  const result = await reportService.getSalesReport(req.query);
  res.status(200).json({
    status: "success",
    data: result,
  });
});

export const getExpenseReport = asyncHandler(async (req, res) => {
  const result = await reportService.getExpenseReport(req.query);
  res.status(200).json({
    status: "success",
    data: result,
  });
});

export const getEmployeeReport = asyncHandler(async (req, res) => {
  const result = await reportService.getEmployeeReport(req.query);
  res.status(200).json({
    status: "success",
    data: { employees: result },
  });
});
