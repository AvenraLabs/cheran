import asyncHandler from "../../shared/asyncHandler.js";
import * as unitService from "./unit.service.js";

export const listUnits = asyncHandler(async (req, res) => {
  const units = await unitService.listUnits(req.query);
  res.status(200).json({
    status: "success",
    data: { units },
  });
});

export const getUnitById = asyncHandler(async (req, res) => {
  const unit = await unitService.getUnitById(req.params.id);
  res.status(200).json({
    status: "success",
    data: { unit },
  });
});

export const createUnit = asyncHandler(async (req, res) => {
  const unit = await unitService.createUnit(req.body);
  res.status(201).json({
    status: "success",
    data: { unit },
  });
});

export const updateUnit = asyncHandler(async (req, res) => {
  const unit = await unitService.updateUnit(req.params.id, req.body);
  res.status(200).json({
    status: "success",
    data: { unit },
  });
});
