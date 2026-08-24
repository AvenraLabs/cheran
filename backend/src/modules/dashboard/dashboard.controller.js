import asyncHandler from "../../shared/asyncHandler.js";
import * as dashboardService from "./dashboard.service.js";

export const getGovernmentSummary = asyncHandler(async (req, res) => {
  const result = await dashboardService.getGovernmentSummary(req.query);
  res.status(200).json({
    status: "success",
    data: result,
  });
});

export const getStatusDistribution = asyncHandler(async (req, res) => {
  const result = await dashboardService.getStatusDistribution(req.query);
  res.status(200).json({
    status: "success",
    data: result,
  });
});

export const getDealerDistribution = asyncHandler(async (req, res) => {
  const result = await dashboardService.getDealerDistribution(req.query);
  res.status(200).json({
    status: "success",
    data: result,
  });
});

export const getDistrictDistribution = asyncHandler(async (req, res) => {
  const result = await dashboardService.getDistrictDistribution(req.query);
  res.status(200).json({
    status: "success",
    data: result,
  });
});

export const getStageDurations = asyncHandler(async (req, res) => {
  const result = await dashboardService.getStageDurations(req.query);
  res.status(200).json({
    status: "success",
    data: result,
  });
});
