import asyncHandler from "../../shared/asyncHandler.js";
import * as invoiceService from "./invoice.service.js";

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
