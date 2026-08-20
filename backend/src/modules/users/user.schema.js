import { z } from "zod";

export const listUsersSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    role: z.enum(["ADMIN", "USER", "DEALER", "admin", "user", "dealer"]).optional(),
    is_active: z.enum(["true", "false"]).optional(),
    page: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 1)),
    limit: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 25)),
  }),
});

export const createUserSchema = z.object({
  body: z.object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(100, "Username must not exceed 100 characters")
      .regex(/^[a-zA-Z0-9._-]+$/, "Username can only contain letters, numbers, dots, underscores, and hyphens"),
    password: z.string().min(6, "Password must be at least 6 characters").max(100),
    name: z.string().min(1, "Name is required").max(255),
    role: z.enum(["ADMIN", "USER", "DEALER", "admin", "user", "dealer"]).default("USER"),
    is_active: z.boolean().default(true),
  }),
});

export const updateUserSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid user ID format"),
  }),
  body: z.object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(100)
      .regex(/^[a-zA-Z0-9._-]+$/, "Username can only contain letters, numbers, dots, underscores, and hyphens")
      .optional(),
    password: z.string().min(6, "Password must be at least 6 characters").max(100).optional(),
    name: z.string().min(1, "Name is required").max(255).optional(),
    role: z.enum(["ADMIN", "USER", "DEALER", "admin", "user", "dealer"]).optional(),
    is_active: z.boolean().optional(),
  }),
});

export const userIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid user ID format"),
  }),
});
