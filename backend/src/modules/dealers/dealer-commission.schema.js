import { z } from "zod";

export const createCommissionSchema = z.object({
  body: z.object({
    dealer_id: z.string().min(1, "Invalid dealer ID"),
    project_id: z.string().optional().nullable(),
    sale_id: z.string().optional().nullable(),
    base_amount: z.number().positive("Base amount must be positive"),
    commission_percentage: z.number().min(0).max(100).optional().nullable(),
    status: z.enum(["PENDING", "APPROVED", "PAID"]).optional(),
    notes: z.string().optional().nullable(),
  }),
});

export const updateCommissionStatusSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Invalid commission ID"),
  }),
  body: z.object({
    status: z.enum(["PENDING", "APPROVED", "PAID"]).optional(),
    paid_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
    notes: z.string().optional().nullable(),
  }),
});

export const listCommissionsSchema = z.object({
  query: z.object({
    dealer_id: z.string().optional(),
    status: z.enum(["PENDING", "APPROVED", "PAID"]).optional(),
    project_id: z.string().optional(),
    page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
    limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 50)),
  }),
});
