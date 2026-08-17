import { z } from "zod";

export const listProjectsSchema = z.object({
  query: z.object({
    status: z.string().optional(),
    district: z.string().optional(),
    block: z.string().optional(),
    village: z.string().optional(),
    dealer_id: z.string().optional(),
    year: z.string().optional(),
    farmer_name: z.string().optional(),
    application_id: z.string().optional(),
    search: z.string().optional(),
    page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
    limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 20)),
    sort_by: z.string().optional().default("created_at"),
    sort_order: z.enum(["ASC", "DESC", "asc", "desc"]).optional().default("DESC"),
  }),
});

export const getProjectSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Invalid project ID format"),
  }),
});
