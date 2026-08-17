import { Router } from "express";
import validate from "../../shared/middlewares/validate.js";
import {
  createCategorySchema,
  updateCategorySchema,
  createExpenseSchema,
  listExpenseSchema,
} from "./expense.schema.js";
import * as expenseController from "./expense.controller.js";

const router = Router();

// Categories
router.get("/categories", expenseController.listCategories);
router.post("/categories", validate(createCategorySchema), expenseController.createCategory);
router.patch("/categories/:id", validate(updateCategorySchema), expenseController.updateCategory);
router.delete("/categories/:id", expenseController.deleteCategory);

// Expenses
router.get("/", validate(listExpenseSchema), expenseController.listExpenses);
router.post("/", validate(createExpenseSchema), expenseController.createExpense);
router.get("/:id", expenseController.getExpenseById);

export default router;
