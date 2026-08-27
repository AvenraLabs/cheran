import { z } from "zod";

export const dashboardFilterSchema = z.object({
  query: z.object({
    year: z.string().optional(),
    month: z.string().optional(),
    district: z.string().optional(),
    dealer_id: z.string().uuid().optional(),
  }),
});
