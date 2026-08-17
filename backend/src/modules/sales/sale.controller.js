import asyncHandler from "../../shared/asyncHandler.js";
import * as saleService from "./sale.service.js";

export const listSales = asyncHandler(async (req, res) => {
  const result = await saleService.listSales(req.query);
  res.status(200).json({
    status: "success",
    data: result,
  });
});

export const getSaleById = asyncHandler(async (req, res) => {
  const sale = await saleService.getSaleById(req.params.id);
  res.status(200).json({
    status: "success",
    data: { sale },
  });
});

export const createSale = asyncHandler(async (req, res) => {
  const sale = await saleService.createSale(req.body);
  res.status(201).json({
    status: "success",
    data: { sale },
  });
});

export const recordPayment = asyncHandler(async (req, res) => {
  const payment = await saleService.recordCustomerPayment(req.body);
  res.status(201).json({
    status: "success",
    data: { payment },
  });
});
