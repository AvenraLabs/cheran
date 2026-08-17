import asyncHandler from "../../shared/asyncHandler.js";
import * as customerService from "./customer.service.js";

export const listCustomers = asyncHandler(async (req, res) => {
  const result = await customerService.listCustomers(req.query);
  res.status(200).json({
    status: "success",
    data: result,
  });
});

export const getCustomerById = asyncHandler(async (req, res) => {
  const customer = await customerService.getCustomerById(req.params.id);
  res.status(200).json({
    status: "success",
    data: { customer },
  });
});

export const createCustomer = asyncHandler(async (req, res) => {
  const customer = await customerService.createCustomer(req.body);
  res.status(201).json({
    status: "success",
    data: { customer },
  });
});

export const updateCustomer = asyncHandler(async (req, res) => {
  const customer = await customerService.updateCustomer(req.params.id, req.body);
  res.status(200).json({
    status: "success",
    data: { customer },
  });
});
