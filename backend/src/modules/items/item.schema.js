import { z } from "zod";

export const createItemSchema = z.object({
  body: z.object({
    code: z.string().max(100).optional().nullable(),
    name: z.string().min(1, "Item name is required").max(255),
    item_type: z.enum(["RAW_MATERIAL", "FINISHED_GOOD", "TRADING_ITEM", "ACCESSORY"]).optional(),
    unit_id: z.string().min(1, "Invalid unit ID format"),
    category: z.string().max(100).optional().nullable(),
    unit_price: z.number().min(0).optional().nullable(),
    is_active: z.boolean().optional(),
  }),
});

export const updateItemSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Invalid item ID format"),
  }),
  body: z.object({
    code: z.string().max(100).optional().nullable(),
    name: z.string().min(1).max(255).optional(),
    item_type: z.enum(["RAW_MATERIAL", "FINISHED_GOOD", "TRADING_ITEM", "ACCESSORY"]).optional(),
    unit_id: z.string().min(1, "Invalid unit ID format").optional(),
    category: z.string().max(100).optional().nullable(),
    unit_price: z.number().min(0).optional().nullable(),
    is_active: z.boolean().optional(),
  }),
});

export const listItemSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    item_type: z.enum(["RAW_MATERIAL", "FINISHED_GOOD", "TRADING_ITEM", "ACCESSORY"]).optional(),
    category: z.string().optional(),
    is_active: z
      .string()
      .optional()
      .transform((val) => (val === "true" ? true : val === "false" ? false : undefined)),
    page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
    limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 50)),
  }),
});
