import asyncHandler from "../../shared/asyncHandler.js";
import AppError from "../../shared/appError.js";
import { processImportPreview } from "./import-preview.service.js";
import { commitImport } from "./import-commit.service.js";
import * as importService from "./import.service.js";

export const previewImport = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError("No Excel file uploaded. Please provide a valid .xls or .xlsx file under 'file' field.", 400);
  }

  const result = await processImportPreview({
    fileBuffer: req.file.buffer,
    fileName: req.file.originalname,
    uploadedBy: req.body.uploaded_by || "Staff",
  });

  res.status(200).json({
    status: "success",
    message: "Excel import preview generated successfully",
    data: result,
  });
});

export const listImports = asyncHandler(async (req, res) => {
  const result = await importService.listImports(req.query);
  res.status(200).json({
    status: "success",
    data: result,
  });
});

export const getImport = asyncHandler(async (req, res) => {
  const result = await importService.getImportById(req.params.id);
  res.status(200).json({
    status: "success",
    data: result,
  });
});

export const getImportRows = asyncHandler(async (req, res) => {
  const result = await importService.getImportRows(req.params.id, req.query);
  res.status(200).json({
    status: "success",
    data: result,
  });
});

export const getUnresolvedDealers = asyncHandler(async (req, res) => {
  const result = await importService.getUnresolvedDealersSummary(req.params.id);
  res.status(200).json({
    status: "success",
    data: result,
  });
});

export const resolveDealer = asyncHandler(async (req, res) => {
  const result = await importService.resolveImportDealer(req.params.id, req.body);
  res.status(200).json({
    status: "success",
    message: "Dealer mapping resolved successfully",
    data: result,
  });
});

export const autoCreateDealers = asyncHandler(async (req, res) => {
  const result = await importService.autoCreateAllUnresolvedDealers(req.params.id);
  res.status(200).json({
    status: "success",
    message: result.message,
    data: result,
  });
});

export const commit = asyncHandler(async (req, res) => {
  const result = await commitImport(req.params.id);
  res.status(200).json({
    status: "success",
    message: "Import committed successfully into production project database",
    data: result,
  });
});
