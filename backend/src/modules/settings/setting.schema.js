import { z } from "zod";

export const updateSettingSchema = z.object({
  params: z.object({
    key: z.string().min(1),
  }),
  body: z.object({
    value: z.union([z.string(), z.number()]),
    description: z.string().optional().nullable(),
  }),
});
