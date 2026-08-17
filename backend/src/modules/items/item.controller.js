import asyncHandler from "../../shared/asyncHandler.js";
import * as itemService from "./item.service.js";

export const listItems = asyncHandler(async (req, res) => {
  const result = await itemService.listItems(req.query);
  res.status(200).json({
    status: "success",
    data: result,
  });
});

export const getItemById = asyncHandler(async (req, res) => {
  const item = await itemService.getItemById(req.params.id);
  res.status(200).json({
    status: "success",
    data: { item },
  });
});

export const createItem = asyncHandler(async (req, res) => {
  const item = await itemService.createItem(req.body);
  res.status(201).json({
    status: "success",
    data: { item },
  });
});

export const updateItem = asyncHandler(async (req, res) => {
  const item = await itemService.updateItem(req.params.id, req.body);
  res.status(200).json({
    status: "success",
    data: { item },
  });
});
