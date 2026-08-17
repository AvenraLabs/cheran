import asyncHandler from "../../shared/asyncHandler.js";
import * as statusService from "./status.service.js";

export const listStatuses = asyncHandler(async (req, res) => {
  const statuses = await statusService.listStatuses(req.query);
  res.status(200).json({
    status: "success",
    data: { statuses },
  });
});

export const createStatus = asyncHandler(async (req, res) => {
  const status = await statusService.createStatus(req.body);
  res.status(201).json({
    status: "success",
    message: "Status created successfully",
    data: { status },
  });
});
