import asyncHandler from "../../shared/asyncHandler.js";
import * as supplierService from "./supplier.service.js";

export const listSuppliers = asyncHandler(async (req, res) => {
  const result = await supplierService.listSuppliers(req.query);
  res.status(200).json({
    status: "success",
    data: result,
  });
});

export const getSupplierOptions = asyncHandler(async (req, res) => {
  const result = await supplierService.getSupplierOptions();
  res.status(200).json({
    status: "success",
    data: result,
  });
});

export const getSupplierById = asyncHandler(async (req, res) => {
  const supplier = await supplierService.getSupplierById(req.params.id);
  res.status(200).json({
    status: "success",
    data: { supplier },
  });
});

export const createSupplier = asyncHandler(async (req, res) => {
  const supplier = await supplierService.createSupplier(req.body);
  res.status(201).json({
    status: "success",
    data: { supplier },
  });
});

export const updateSupplier = asyncHandler(async (req, res) => {
  const supplier = await supplierService.updateSupplier(req.params.id, req.body);
  res.status(200).json({
    status: "success",
    data: { supplier },
  });
});
