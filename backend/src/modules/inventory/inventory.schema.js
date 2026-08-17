import { z } from "zod";

export const createOpeningStockSchema = z.object({
  body: z.object({
    item_id: z.string().min(1, "Invalid item ID"),
    quantity: z.number().positive("Opening quantity must be positive"),
    unit_id: z.string().min(1, "Invalid unit ID").optional(),
    movement_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD").optional(),
    notes: z.string().optional().nullable(),
  }),
});

export const createStockReceiptSchema = z.object({
  body: z.object({
    supplier_id: z.string().min(1, "Invalid supplier ID").optional().nullable(),
    supplier_name: z.string().optional().nullable(),
    receipt_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD").optional(),
    reference_number: z.string().max(100).optional().nullable(),
    notes: z.string().optional().nullable(),
    items: z
      .array(
        z.object({
          item_id: z.string().min(1, "Invalid item ID"),
          unit_id: z.string().min(1, "Invalid unit ID").optional(),
          quantity: z.number().positive("Quantity must be positive"),
          unit_price: z.number().min(0, "Unit price cannot be negative").optional(),
        })
      )
      .min(1, "At least one item is required in stock receipt"),
  }),
});

export const createAdjustmentSchema = z.object({
  body: z.object({
    item_id: z.string().min(1, "Invalid item ID"),
    adjustment_type: z.enum(["ADJUSTMENT_IN", "ADJUSTMENT_OUT"]),
    quantity: z.number().positive("Quantity must be positive"),
    notes: z.string().min(1, "Mandatory reason notes required for adjustment"),
    movement_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD").optional(),
  }),
});

export const stockSummarySchema = z.object({
  query: z.object({
    search: z.string().optional(),
    item_type: z.enum(["RAW_MATERIAL", "FINISHED_GOOD", "TRADING_ITEM", "ACCESSORY"]).optional(),
    category: z.string().optional(),
  }),
});

export const itemLedgerSchema = z.object({
  params: z.object({
    itemId: z.string().min(1, "Invalid item ID"),
  }),
  query: z.object({
    start_date: z.string().optional(),
    end_date: z.string().optional(),
  }),
});

export const movementHistorySchema = z.object({
  query: z.object({
    item_id: z.string().optional(),
    movement_type: z
      .enum([
        "OPENING",
        "PURCHASE",
        "ADJUSTMENT_IN",
        "ADJUSTMENT_OUT",
        "SALE",
        "DISPATCH",
        "PRODUCTION_IN",
        "PRODUCTION_OUT",
        "REVERSAL",
      ])
      .optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
    limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 50)),
  }),
});
