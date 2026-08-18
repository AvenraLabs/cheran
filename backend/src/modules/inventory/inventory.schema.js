import { z } from "zod";

export const createOpeningStockSchema = z.object({
  body: z.object({
    item_id: z.string().min(1, "Invalid item ID"),
    quantity: z.number().positive("Opening quantity must be positive"),
    unit_id: z.string().min(1, "Invalid unit ID").optional(),
    movement_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD").optional(),
  }),
});

export const createStockReceiptSchema = z.object({
  body: z.object({
    supplier_id: z.string().min(1, "Invalid supplier ID").optional().nullable(),
    supplier_name: z.string().optional().nullable(),
    receipt_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD").optional(),
    reference_number: z.string().max(100).optional().nullable(),
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

export const listStockReceiptsSchema = z.object({
  query: z.object({
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    supplier_id: z.string().optional(),
    item_id: z.string().optional(),
    page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
    limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 50)),
  }),
});

export const createProductionEntrySchema = z.object({
  body: z.object({
    production_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD").optional(),
    reference_number: z.string().max(100).optional().nullable(),
    materials: z
      .array(
        z.object({
          item_id: z.string().min(1, "Invalid raw material ID"),
          unit_id: z.string().min(1, "Invalid unit ID").optional(),
          quantity_used: z.number().positive("Quantity used must be greater than 0"),
          wastage_quantity: z.number().min(0, "Wastage quantity cannot be negative").optional().default(0),
        })
      )
      .min(1, "At least one raw material input is required"),
    outputs: z
      .array(
        z.object({
          item_id: z.string().min(1, "Invalid finished good ID"),
          unit_id: z.string().min(1, "Invalid unit ID").optional(),
          quantity_produced: z.number().positive("Quantity produced must be greater than 0"),
        })
      )
      .min(1, "At least one finished good output is required"),
  }),
});

export const listProductionSchema = z.object({
  query: z.object({
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    raw_material_id: z.string().optional(),
    finished_good_id: z.string().optional(),
    page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
    limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 50)),
  }),
});

export const getProductionByIdSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Invalid production entry ID"),
  }),
});

export const createAdjustmentSchema = z.object({
  body: z.object({
    item_id: z.string().min(1, "Invalid item ID"),
    adjustment_type: z.enum(["ADJUSTMENT_IN", "ADJUSTMENT_OUT"]),
    quantity: z.number().positive("Quantity must be positive"),
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
        "PRODUCTION_WASTAGE",
        "REVERSAL",
      ])
      .optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
    limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 50)),
  }),
});
