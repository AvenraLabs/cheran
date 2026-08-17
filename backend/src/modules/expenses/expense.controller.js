import asyncHandler from "../../shared/asyncHandler.js";
import * as expenseService from "./expense.service.js";

// Categories
export const listCategories = asyncHandler(async (req, res) => {
  const categories = await expenseService.listExpenseCategories();
  res.status(200).json({
    status: "success",
    data: { categories },
  });
});

export const createCategory = asyncHandler(async (req, res) => {
  const category = await expenseService.createExpenseCategory(req.body);
  res.status(201).json({
    status: "success",
    data: { category },
  });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const category = await expenseService.updateExpenseCategory(req.params.id, req.body);
  res.status(200).json({
    status: "success",
    data: { category },
  });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  await expenseService.deleteExpenseCategory(req.params.id);
  res.status(200).json({
    status: "success",
    message: "Expense category deleted successfully",
  });
});

// Expenses
export const listExpenses = asyncHandler(async (req, res) => {
  const result = await expenseService.listExpenses(req.query);
  res.status(200).json({
    status: "success",
    data: result,
  });
});

export const getExpenseById = asyncHandler(async (req, res) => {
  const expense = await expenseService.getExpenseById(req.params.id);
  res.status(200).json({
    status: "success",
    data: { expense },
  });
});

export const createExpense = asyncHandler(async (req, res) => {
  const expense = await expenseService.createExpense(req.body);
  res.status(201).json({
    status: "success",
    data: { expense },
  });
});
