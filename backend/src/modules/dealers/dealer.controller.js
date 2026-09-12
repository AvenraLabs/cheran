import asyncHandler from "../../shared/asyncHandler.js";
import * as dealerService from "./dealer.service.js";

export const listDealers = asyncHandler(async (req, res) => {
  const result = await dealerService.listDealers(req.query);
  res.status(200).json({
    status: "success",
    data: result,
  });
});

export const getDealerOptions = asyncHandler(async (req, res) => {
  const result = await dealerService.getDealerOptions();
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
  const userName = req.user?.name || req.user?.username || "Staff";
  const dealer = await dealerService.createDealer({
    ...req.body,
    created_by: userName,
    updated_by: userName,
  });
  res.status(201).json({
    status: "success",
    message: "Dealer created successfully",
    data: { dealer },
  });
});

export const updateDealer = asyncHandler(async (req, res) => {
  const userName = req.user?.name || req.user?.username || "Staff";
  const dealer = await dealerService.updateDealer(req.params.id, {
    ...req.body,
    updated_by: userName,
  });
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

export const setUniversalCommission = asyncHandler(async (req, res) => {
  const { commission_percentage, overwrite_existing } = req.body;
  const result = await dealerService.setUniversalCommission({
    commission_percentage,
    overwrite_existing,
  });

  res.status(200).json({
    status: "success",
    message: `Commission percentage set to ${result.commission_percentage}% for ${result.updated_dealers_count} dealers.`,
    data: result,
  });
});

export const getDealerCommissionSlabs = asyncHandler(async (req, res) => {
  const result = await dealerService.getDealerCommissionSlabs(req.params.id);
  res.status(200).json({
    status: "success",
    data: result,
  });
});

export const createDealerCommissionSlab = asyncHandler(async (req, res) => {
  const result = await dealerService.createDealerCommissionSlab(req.params.id, req.body);
  res.status(201).json({
    status: "success",
    message: "Commission slab created successfully",
    data: result,
  });
});

export const updateDealerCommissionSlab = asyncHandler(async (req, res) => {
  const result = await dealerService.updateDealerCommissionSlab(req.params.slabId, req.body);
  res.status(200).json({
    status: "success",
    message: "Commission slab updated successfully",
    data: result,
  });
});

export const deleteDealerCommissionSlab = asyncHandler(async (req, res) => {
  const result = await dealerService.deleteDealerCommissionSlab(req.params.slabId);
  res.status(200).json({
    status: "success",
    message: "Commission slab removed",
    data: result,
  });
});

export const applyUniversalCommissionPolicy = asyncHandler(async (req, res) => {
  const result = await dealerService.applyUniversalCommissionPolicy(req.body);
  res.status(200).json({
    status: "success",
    message: `Universal policy applied! Updated ${result.dealers_updated} dealers to ${result.commission_percentage}% starting ${result.effective_from}.`,
    data: result,
  });
});
