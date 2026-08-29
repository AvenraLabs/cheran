import asyncHandler from "../../shared/asyncHandler.js";
import * as reportService from "./report.service.js";
import * as pendingReportService from "./pending-report.service.js";

export const getFinancialOverviewReport = asyncHandler(async (req, res) => {
  const result = await reportService.getFinancialOverviewReport(req.query);
  res.status(200).json({
    status: "success",
    data: result,
  });
});

export const getProcurementReport = asyncHandler(async (req, res) => {
  const result = await reportService.getProcurementReport(req.query);
  res.status(200).json({
    status: "success",
    data: result,
  });
});

export const getGovernmentFundsReport = asyncHandler(async (req, res) => {
  const result = await reportService.getGovernmentFundsReport(req.query);
  res.status(200).json({
    status: "success",
    data: result,
  });
});

export const getDealerReport = asyncHandler(async (req, res) => {
  const result = await reportService.getDealerReport(req.query);
  res.status(200).json({
    status: "success",
    data: { dealers: result },
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

export const getPendingFunnelSummary = asyncHandler(async (req, res) => {
  const result = await pendingReportService.getPendingFunnelSummary(req.query);
  res.status(200).json({
    status: "success",
    data: result,
  });
});

export const getPendingProjectsList = asyncHandler(async (req, res) => {
  const result = await pendingReportService.getPendingProjectsList(req.query);
  res.status(200).json({
    status: "success",
    data: result,
  });
});

export const upsertMaterialSupplied = asyncHandler(async (req, res) => {
  const { category, financial_year, supplied_ha, supplied_count, remarks } = req.body;
  const result = await pendingReportService.upsertMaterialSuppliedOverride({
    category,
    financial_year,
    supplied_ha,
    supplied_count,
    remarks,
  });
  res.status(200).json({
    status: "success",
    message: "Material supplied data updated successfully",
    data: result,
  });
});

export const getMaterialSuppliedList = asyncHandler(async (req, res) => {
  const result = await pendingReportService.getMaterialSuppliedOverrides();
  res.status(200).json({
    status: "success",
    data: result,
  });
});


