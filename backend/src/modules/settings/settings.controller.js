import asyncHandler from "../../shared/asyncHandler.js";
import * as settingsService from "./settings.service.js";

export const listTaxSlabs = asyncHandler(async (req, res) => {
  const slabs = await settingsService.listTaxSlabs();
  res.status(200).json({
    status: "success",
    data: { slabs },
  });
});

export const getEffectiveTaxSlab = asyncHandler(async (req, res) => {
  const effectiveSlab = await settingsService.getEffectiveSchemeTaxSlab(req.query.date);
  res.status(200).json({
    status: "success",
    data: { effectiveSlab },
  });
});

export const createTaxSlab = asyncHandler(async (req, res) => {
  const slab = await settingsService.createTaxSlab(req.body);
  res.status(201).json({
    status: "success",
    message: "Scheme tax slab created successfully",
    data: { slab },
  });
});

export const updateTaxSlab = asyncHandler(async (req, res) => {
  const slab = await settingsService.updateTaxSlab(req.params.id, req.body);
  res.status(200).json({
    status: "success",
    message: "Scheme tax slab updated successfully",
    data: { slab },
  });
});

export const deleteTaxSlab = asyncHandler(async (req, res) => {
  const result = await settingsService.deleteTaxSlab(req.params.id);
  res.status(200).json({
    status: "success",
    message: result.message,
  });
});
