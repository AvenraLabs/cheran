import { z } from "zod";

export const createSaleSchema = z.object({
  body: z.object({
    customer_id: z.string().uuid("Invalid customer ID format"),
    project_id: z.string().uuid("Invalid project ID format").optional().nullable(),
    invoice_number: z.string().max(100).optional().nullable(),
    sale_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD").optional(),
    fittings_percentage: z.number().min(0).max(100).optional().nullable(),
    gst_percentage: z.number().min(0).max(100).optional().nullable(),
    notes: z.string().optional().nullable(),
    items: z
      .array(
        z.object({
          item_id: z.string().uuid("Invalid item ID format"),
          unit_id: z.string().uuid("Invalid unit ID format").optional(),
          quantity: z.number().positive("Quantity must be positive"),
          unit_price: z.number().min(0, "Unit price cannot be negative"),
        })
      )
      .min(1, "At least one item is required in a sale"),
  }),
});

export const recordPaymentSchema = z.object({
  body: z.object({
    sale_id: z.string().uuid("Invalid sale ID format"),
    customer_id: z.string().uuid("Invalid customer ID format").optional().nullable(),
    amount: z.number().positive("Payment amount must be positive"),
    payment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    payment_method: z.enum(["CASH", "BANK_TRANSFER", "UPI", "CHEQUE", "OTHER"]).optional(),
    reference: z.string().max(100).optional().nullable(),
    notes: z.string().optional().nullable(),
  }),
});

export const listSaleSchema = z.object({
  query: z.object({
    customer_id: z.string().uuid().optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    search: z.string().optional(),
    page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
    limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 50)),
  }),
});
