import { z } from "zod";

export const createUnitSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Unit name is required").max(100),
    symbol: z.string().max(50).optional().nullable(),
    is_active: z.boolean().optional(),
  }),
});

export const updateUnitSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Invalid unit ID format"),
  }),
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    symbol: z.string().max(50).optional().nullable(),
    is_active: z.boolean().optional(),
  }),
});

export const listUnitSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    is_active: z
      .string()
      .optional()
      .transform((val) => (val === "true" ? true : val === "false" ? false : undefined)),
  }),
});
