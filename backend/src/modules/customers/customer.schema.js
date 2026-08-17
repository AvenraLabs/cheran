import { z } from "zod";

export const createCustomerSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Customer name is required").max(255),
    phone: z.string().max(50).optional().nullable(),
    email: z.string().email("Invalid email format").max(255).optional().nullable().or(z.literal("")),
    address: z.string().optional().nullable(),
    gst_number: z.string().max(50).optional().nullable(),
    is_active: z.boolean().optional(),
  }),
});

export const updateCustomerSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid customer ID format"),
  }),
  body: z.object({
    name: z.string().min(1).max(255).optional(),
    phone: z.string().max(50).optional().nullable(),
    email: z.string().email("Invalid email format").max(255).optional().nullable().or(z.literal("")),
    address: z.string().optional().nullable(),
    gst_number: z.string().max(50).optional().nullable(),
    is_active: z.boolean().optional(),
  }),
});

export const listCustomerSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
    limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 50)),
  }),
});
