import asyncHandler from "../../shared/asyncHandler.js";
import * as invoiceService from "./invoice.service.js";
import { importHistoricalInvoiceJson as importJsonService } from "./invoice-json-import.service.js";
import { parseLoadOrderBuffer, parseLoadOrderAppIdsText } from "./load-order-parser.service.js";
import {
  commitLoadOrder as commitLoadOrderService,
  listLoadOrderBatches as listLoadOrderBatchesService,
  getLoadOrderBatchById as getLoadOrderBatchByIdService,
  cancelLoadOrderBatch as cancelLoadOrderBatchService,
} from "./load-order-commit.service.js";
import AppError from "../../shared/appError.js";

export const createInvoice = asyncHandler(async (req, res) => {
  const invoice = await invoiceService.createInvoice(req.body);
  res.status(201).json({
    status: "success",
    data: { invoice },
  });
});

export const listInvoices = asyncHandler(async (req, res) => {
  const result = await invoiceService.listInvoices(req.query);
  res.status(200).json({
    status: "success",
    data: result,
  });
});

export const getInvoiceById = asyncHandler(async (req, res) => {
  const invoice = await invoiceService.getInvoiceById(req.params.id);
  res.status(200).json({
    status: "success",
    data: { invoice },
  });
});

export const cancelInvoice = asyncHandler(async (req, res) => {
  const invoice = await invoiceService.cancelInvoice(req.params.id, req.body.reason);
  res.status(200).json({
    status: "success",
    data: { invoice },
  });
});

export const getProjectInvoices = asyncHandler(async (req, res) => {
  const result = await invoiceService.getProjectInvoices(req.params.projectId);
  res.status(200).json({
    status: "success",
    data: result,
  });
});

export const recordInvoicePayment = asyncHandler(async (req, res) => {
  const invoice = await invoiceService.recordInvoicePayment(req.params.id, req.body);
  res.status(200).json({
    status: "success",
    message: "Invoice payment recorded successfully",
    data: { invoice },
  });
});

export const getDirectSalesAnalytics = asyncHandler(async (req, res) => {
  const analytics = await invoiceService.getDirectSalesAnalytics(req.query);
  res.status(200).json({
    status: "success",
    data: analytics,
  });
});

/**
 * Historical Invoice JSON Bulk Import Controller
 * Supports both JSON body payload and multipart file upload.
 */
export const importHistoricalInvoiceJson = asyncHandler(async (req, res) => {
  let jsonData = req.body;

  if (req.file) {
    try {
      jsonData = JSON.parse(req.file.buffer.toString("utf8"));
    } catch (err) {
      throw new AppError("Invalid JSON file format. Could not parse JSON content.", 400);
    }
  }

  const result = await importJsonService(jsonData);
  res.status(200).json({
    status: "success",
    message: `Successfully processed ${result.totalRecords} historical invoice records`,
    data: result,
  });
});

/**
 * Load Order Upload & Preview Controller
 * Accepts either:
 * 1. Multipart Excel file upload (.xlsx, .xls)
 * 2. JSON body with pasted application_ids_text (multi-line / comma-separated)
 */
export const previewLoadOrder = asyncHandler(async (req, res) => {
  let result;
  if (req.file) {
    result = await parseLoadOrderBuffer(req.file.buffer);
  } else if (req.body && (req.body.application_ids_text || req.body.application_ids)) {
    const text =
      req.body.application_ids_text ||
      (Array.isArray(req.body.application_ids)
        ? req.body.application_ids.join("\n")
        : req.body.application_ids);
    result = await parseLoadOrderAppIdsText(text, req.body.dispatch_date || null);
  } else {
    throw new AppError("Please upload a Load Order Excel file or paste Government Application IDs", 400);
  }

  res.status(200).json({
    status: "success",
    data: result,
  });
});

/**
 * Load Order Commit Controller
 */
export const commitLoadOrder = asyncHandler(async (req, res) => {
  const result = await commitLoadOrderService(req.body);
  res.status(200).json({
    status: "success",
    message: "Load Order batch committed successfully",
    data: result,
  });
});

export const listLoadOrderBatches = asyncHandler(async (req, res) => {
  const result = await listLoadOrderBatchesService(req.query);
  res.status(200).json({
    status: "success",
    data: result,
  });
});

export const getLoadOrderBatchById = asyncHandler(async (req, res) => {
  const batch = await getLoadOrderBatchByIdService(req.params.id);
  res.status(200).json({
    status: "success",
    data: { batch },
  });
});

export const cancelLoadOrderBatch = asyncHandler(async (req, res) => {
  const result = await cancelLoadOrderBatchService(req.params.id, req.body);
  res.status(200).json({
    status: "success",
    message: "Load Order batch cancelled and all inventory and invoice links reversed successfully",
    data: result,
  });
});
