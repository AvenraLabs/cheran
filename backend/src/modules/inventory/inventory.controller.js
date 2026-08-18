import asyncHandler from "../../shared/asyncHandler.js";
import * as inventoryService from "./inventory.service.js";

export const createOpeningStock = asyncHandler(async (req, res) => {
  const result = await inventoryService.createOpeningStock(req.body);
  res.status(201).json({
    status: "success",
    data: result,
  });
});

export const createStockReceipt = asyncHandler(async (req, res) => {
  const receipt = await inventoryService.createStockReceipt(req.body);
  res.status(201).json({
    status: "success",
    data: { receipt },
  });
});

export const listStockReceipts = asyncHandler(async (req, res) => {
  const result = await inventoryService.listStockReceipts(req.query);
  res.status(200).json({
    status: "success",
    data: result,
  });
});

export const getStockReceiptById = asyncHandler(async (req, res) => {
  const receipt = await inventoryService.getStockReceiptById(req.params.id);
  res.status(200).json({
    status: "success",
    data: { receipt },
  });
});

export const createProductionEntry = asyncHandler(async (req, res) => {
  const entry = await inventoryService.createProductionEntry(req.body);
  res.status(201).json({
    status: "success",
    data: { entry },
  });
});

export const listProductionEntries = asyncHandler(async (req, res) => {
  const result = await inventoryService.listProductionEntries(req.query);
  res.status(200).json({
    status: "success",
    data: result,
  });
});

export const getProductionEntryById = asyncHandler(async (req, res) => {
  const entry = await inventoryService.getProductionEntryById(req.params.id);
  res.status(200).json({
    status: "success",
    data: { entry },
  });
});

export const createStockAdjustment = asyncHandler(async (req, res) => {
  const result = await inventoryService.createStockAdjustment(req.body);
  res.status(201).json({
    status: "success",
    data: result,
  });
});

export const getStockSummary = asyncHandler(async (req, res) => {
  const stock = await inventoryService.getStockSummary(req.query);
  res.status(200).json({
    status: "success",
    data: { stock },
  });
});

export const getItemLedger = asyncHandler(async (req, res) => {
  const result = await inventoryService.getItemLedger(req.params.itemId, req.query);
  res.status(200).json({
    status: "success",
    data: result,
  });
});

export const getInventorySummary = asyncHandler(async (req, res) => {
  const summary = await inventoryService.getInventorySummary();
  res.status(200).json({
    status: "success",
    data: { summary },
  });
});

export const getRecentMovements = asyncHandler(async (req, res) => {
  const movements = await inventoryService.getRecentMovements(req.query);
  res.status(200).json({
    status: "success",
    data: { movements },
  });
});

export const getMovementHistory = asyncHandler(async (req, res) => {
  const result = await inventoryService.getMovementHistory(req.query);
  res.status(200).json({
    status: "success",
    data: result,
  });
});
