import asyncHandler from "../../shared/asyncHandler.js";
import * as projectService from "./project.service.js";

export const listProjects = asyncHandler(async (req, res) => {
  const result = await projectService.listProjects(req.query);
  res.status(200).json({
    status: "success",
    data: result,
  });
});

export const getProject = asyncHandler(async (req, res) => {
  const project = await projectService.getProjectById(req.params.id);
  res.status(200).json({
    status: "success",
    data: { project },
  });
});

export const getProjectStatusHistory = asyncHandler(async (req, res) => {
  const result = await projectService.getProjectStatusHistory(req.params.id);
  res.status(200).json({
    status: "success",
    data: result,
  });
});

export const getStatusSummaryStats = asyncHandler(async (req, res) => {
  const result = await projectService.getStatusSummaryStats();
  res.status(200).json({
    status: "success",
    data: result,
  });
});

export const getStageDurationStats = asyncHandler(async (req, res) => {
  const result = await projectService.getStageDurationStats();
  res.status(200).json({
    status: "success",
    data: result,
  });
});

export const getProjectCommission = asyncHandler(async (req, res) => {
  const { calculateProjectDealerCommission } = await import("../dealers/dealer-commission.service.js");
  const result = await calculateProjectDealerCommission(req.params.id);
  res.status(200).json({
    status: "success",
    data: result,
  });
});

export const searchProjects = asyncHandler(async (req, res) => {
  const result = await projectService.searchProjects(req.query.q || req.query.query, req.query.limit || 10);
  res.status(200).json({
    status: "success",
    data: result,
  });
});

export const renameOrMergeProject = asyncHandler(async (req, res) => {
  const result = await projectService.renameOrMergeProject(req.params.id, req.body.target_application_id || req.body.application_id);
  res.status(200).json({
    status: "success",
    message: result.message,
    data: result,
  });
});

