import asyncHandler from "../../shared/asyncHandler.js";
import * as commissionService from "./dealer-commission.service.js";

export const listCommissions = asyncHandler(async (req, res) => {
  const result = await commissionService.listDealerCommissions(req.query);
  res.status(200).json({
    status: "success",
    data: result,
  });
});

export const createCommission = asyncHandler(async (req, res) => {
  const commission = await commissionService.createDealerCommission(req.body);
  res.status(201).json({
    status: "success",
    data: { commission },
  });
});

export const updateCommissionStatus = asyncHandler(async (req, res) => {
  const commission = await commissionService.updateCommissionStatus(req.params.id, req.body);
  res.status(200).json({
    status: "success",
    data: { commission },
  });
});
