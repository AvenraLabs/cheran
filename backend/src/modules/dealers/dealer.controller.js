import asyncHandler from "../../shared/asyncHandler.js";
import * as dealerService from "./dealer.service.js";

export const listDealers = asyncHandler(async (req, res) => {
  const result = await dealerService.listDealers(req.query);
  res.status(200).json({
    status: "success",
    data: result,
  });
});

export const getDealer = asyncHandler(async (req, res) => {
  const dealer = await dealerService.getDealerById(req.params.id);
  res.status(200).json({
    status: "success",
    data: { dealer },
  });
});

export const createDealer = asyncHandler(async (req, res) => {
  const dealer = await dealerService.createDealer(req.body);
  res.status(201).json({
    status: "success",
    message: "Dealer created successfully",
    data: { dealer },
  });
});

export const updateDealer = asyncHandler(async (req, res) => {
  const dealer = await dealerService.updateDealer(req.params.id, req.body);
  res.status(200).json({
    status: "success",
    message: "Dealer updated successfully",
    data: { dealer },
  });
});

export const deleteDealer = asyncHandler(async (req, res) => {
  const result = await dealerService.deleteDealer(req.params.id);
  res.status(200).json({
    status: "success",
    message: "Dealer deleted successfully",
    data: result,
  });
});

export const mergeDealers = asyncHandler(async (req, res) => {
  const result = await dealerService.mergeDealers({
    targetDealerId: req.body.target_dealer_id,
    sourceDealerIds: req.body.source_dealer_ids,
  });

  res.status(200).json({
    status: "success",
    message: `Successfully merged into '${result.targetDealer.name}'. Reassigned ${result.reassignedProjectsCount} projects.`,
    data: result,
  });
});
