import { z } from "zod";

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1, "Category name is required").max(100),
    is_active: z.boolean().optional(),
  }),
});

export const updateCategorySchema = z.object({
  params: z.object({
    id: z.string().min(1, "Invalid category ID format"),
  }),
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    is_active: z.boolean().optional(),
  }),
});

export const createExpenseSchema = z.object({
  body: z.object({
    category_id: z.string().min(1, "Invalid category ID format"),
    expense_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD").optional(),
    amount: z.number().positive("Amount must be positive"),
    description: z.string().max(255).optional().nullable(),
    payment_method: z.string().max(50).optional().nullable(),
    reference: z.string().max(100).optional().nullable(),
    notes: z.string().optional().nullable(),
  }),
});

export const listExpenseSchema = z.object({
  query: z.object({
    category_id: z.string().optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    search: z.string().optional(),
    page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
    limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 50)),
  }),
});
