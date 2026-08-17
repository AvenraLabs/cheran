import { Op } from "sequelize";
import db from "../../config/db.js";
import Expense from "./expense.model.js";
import ExpenseCategory from "./expense-category.model.js";
import AppError from "../../shared/appError.js";

// Categories CRUD
export async function listExpenseCategories() {
  return await ExpenseCategory.findAll({
    order: [["name", "ASC"]],
  });
}

export async function createExpenseCategory({ name, is_active = true }) {
  const cleanName = name.trim();
  const existing = await ExpenseCategory.findOne({ where: { name: cleanName } });
  if (existing) {
    throw new AppError(`Category '${cleanName}' already exists`, 409);
  }
  return await ExpenseCategory.create({ name: cleanName, is_active });
}

export async function updateExpenseCategory(id, { name, is_active }) {
  const category = await ExpenseCategory.findByPk(id);
  if (!category) {
    throw new AppError(`Expense category not found with ID ${id}`, 404);
  }

  const updates = {};
  if (name !== undefined) {
    const cleanName = name.trim();
    const existing = await ExpenseCategory.findOne({
      where: { name: cleanName, id: { [Op.ne]: id } },
    });
    if (existing) {
      throw new AppError(`Category '${cleanName}' already exists`, 409);
    }
    updates.name = cleanName;
  }
  if (is_active !== undefined) updates.is_active = is_active;

  await category.update(updates);
  return category;
}

export async function deleteExpenseCategory(id) {
  const category = await ExpenseCategory.findByPk(id);
  if (!category) {
    throw new AppError(`Expense category not found with ID ${id}`, 404);
  }

  const count = await Expense.count({ where: { category_id: id } });
  if (count > 0) {
    throw new AppError(
      `Cannot delete category '${category.name}' because it has ${count} associated expense records.`,
      400
    );
  }

  await category.destroy();
  return { success: true };
}

// Expenses CRUD
export async function createExpense({
  category_id,
  expense_date = new Date().toISOString().split("T")[0],
  amount,
  description,
  payment_method,
  reference,
  notes,
}) {
  const category = await ExpenseCategory.findByPk(category_id);
  if (!category) {
    throw new AppError(`Expense category not found with ID ${category_id}`, 404);
  }

  const amt = parseFloat(amount);
  if (isNaN(amt) || amt <= 0) {
    throw new AppError("Expense amount must be a positive number", 400);
  }

  const expense = await Expense.create({
    category_id,
    expense_date,
    amount: amt,
    description: description.trim(),
    payment_method: payment_method || null,
    reference: reference ? reference.trim() : null,
    notes: notes ? notes.trim() : null,
  });

  return getExpenseById(expense.id);
}

export async function getExpenseById(id) {
  const expense = await Expense.findByPk(id, {
    include: [
      {
        model: ExpenseCategory,
        as: "category",
        attributes: ["id", "name"],
      },
    ],
  });
  if (!expense) {
    throw new AppError(`Expense not found with ID ${id}`, 404);
  }
  return expense;
}

export async function listExpenses({
  category_id,
  start_date,
  end_date,
  search,
  page = 1,
  limit = 50,
} = {}) {
  const where = {};
  if (category_id) where.category_id = category_id;
  if (start_date && end_date) {
    where.expense_date = { [Op.between]: [start_date, end_date] };
  } else if (start_date) {
    where.expense_date = { [Op.gte]: start_date };
  } else if (end_date) {
    where.expense_date = { [Op.lte]: end_date };
  }
  if (search) {
    where[Op.or] = [
      { description: { [Op.iLike]: `%${search.trim()}%` } },
      { reference: { [Op.iLike]: `%${search.trim()}%` } },
    ];
  }

  const offset = (page - 1) * limit;

  const { rows, count } = await Expense.findAndCountAll({
    where,
    include: [
      {
        model: ExpenseCategory,
        as: "category",
        attributes: ["id", "name"],
      },
    ],
    order: [["expense_date", "DESC"], ["created_at", "DESC"]],
    limit,
    offset,
  });

  // Calculate totals
  const allExpenses = await Expense.findAll({
    where,
    attributes: ["amount"],
  });
  const totalExpenseAmount = allExpenses.reduce(
    (acc, curr) => acc + (parseFloat(curr.amount) || 0),
    0
  );

  return {
    expenses: rows,
    totalExpenseAmount: parseFloat(totalExpenseAmount.toFixed(2)),
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    },
  };
}
