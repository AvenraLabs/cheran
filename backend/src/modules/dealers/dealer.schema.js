import { z } from "zod";

export const createDealerSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Dealer name is required").max(255),
    commission_percentage: z.number().min(0).max(100).optional().nullable(),
    commission_basis: z.string().max(50).optional().nullable(),
    is_active: z.boolean().optional(),
  }),
});

export const updateDealerSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid dealer ID format"),
  }),
  body: z.object({
    name: z.string().min(1).max(255).optional(),
    commission_percentage: z.number().min(0).max(100).optional().nullable(),
    commission_basis: z.string().max(50).optional().nullable(),
    is_active: z.boolean().optional(),
  }),
});

export const getDealerSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid dealer ID format"),
  }),
});

export const listDealerSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    is_active: z
      .string()
      .optional()
      .transform((val) => (val === "true" ? true : val === "false" ? false : undefined)),
    page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
    limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 20)),
  }),
});
