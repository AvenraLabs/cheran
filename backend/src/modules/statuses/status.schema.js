import { z } from "zod";

export const listStatusSchema = z.object({
  query: z.object({
    is_active: z
      .string()
      .optional()
      .transform((val) => (val === "true" ? true : val === "false" ? false : undefined)),
  }),
});

export const createStatusSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Status name is required").max(255),
    is_active: z.boolean().optional(),
  }),
});
