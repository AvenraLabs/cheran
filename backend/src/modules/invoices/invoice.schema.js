import { z } from "zod";

export const createInvoiceSchema = z.object({
  body: z.object({
    invoice_number: z.string().min(1, "Invoice number is required").max(100),
    invoice_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD").optional(),
    invoice_type: z.enum(["GOVERNMENT", "DIRECT_SALE"]),
    application_id: z.string().optional().nullable(),
    customer_id: z.string().min(1, "Invalid customer ID").optional().nullable(),
    customer_name: z.string().optional().nullable(),
    dealer_id: z.string().min(1, "Invalid dealer ID").optional().nullable(),
    fittings_percentage: z.number().min(0).max(100).optional().nullable(),
    gst_percentage: z.number().min(0).max(100).optional().nullable(),
    notes: z.string().optional().nullable(),
    items: z
      .array(
        z.object({
          item_id: z.string().min(1, "Invalid item ID"),
          unit_id: z.string().min(1, "Invalid unit ID").optional().nullable(),
          quantity: z.number().positive("Quantity must be positive"),
          unit_price: z.number().min(0, "Unit price cannot be negative"),
        })
      )
      .min(1, "At least one item is required in an invoice"),
  }),
});

export const cancelInvoiceSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Invalid invoice ID format"),
  }),
  body: z.object({
    reason: z.string().optional().nullable(),
  }),
});

export const listInvoiceSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    invoice_type: z.enum(["GOVERNMENT", "DIRECT_SALE"]).optional(),
    status: z.enum(["DRAFT", "POSTED", "CANCELLED"]).optional(),
    government_project_id: z.string().optional(),
    dealer_id: z.string().optional(),
    customer_id: z.string().optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
    limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 50)),
  }),
});
