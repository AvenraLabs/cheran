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

// Follow-ups
export const listFollowups = asyncHandler(async (req, res) => {
  const followups = await (await import("./project-followup.service.js")).listProjectFollowups(req.params.id);
  res.status(200).json({
    status: "success",
    data: { followups },
  });
});

export const createFollowup = asyncHandler(async (req, res) => {
  const followup = await (await import("./project-followup.service.js")).createFollowup(req.params.id, req.body);
  res.status(201).json({
    status: "success",
    data: { followup },
  });
});

// Documents
export const listDocuments = asyncHandler(async (req, res) => {
  const documents = await (await import("./project-document.service.js")).listProjectDocuments(req.params.id);
  res.status(200).json({
    status: "success",
    data: { documents },
  });
});

export const addDocument = asyncHandler(async (req, res) => {
  const document = await (await import("./project-document.service.js")).addProjectDocument(req.params.id, req.body);
  res.status(201).json({
    status: "success",
    data: { document },
  });
});

export const deleteDocument = asyncHandler(async (req, res) => {
  const result = await (await import("./project-document.service.js")).deleteProjectDocument(req.params.docId);
  res.status(200).json({
    status: "success",
    data: result,
  });
});
