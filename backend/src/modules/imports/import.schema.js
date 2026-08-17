import { z } from "zod";

export const getImportSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid import ID format"),
  }),
});

export const getImportRowsSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid import ID format"),
  }),
  query: z.object({
    page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
    limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 50)),
    action: z.string().optional(),
    resolution_status: z.string().optional(),
  }),
});

export const resolveDealerSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid import ID format"),
  }),
  body: z.object({
    row_id: z.string().uuid().optional(),
    dealer_name: z.string().optional(),
    resolution_type: z.enum(["SELECT_EXISTING", "CREATE_NEW"]),
    dealer_id: z.string().uuid().optional(),
    new_dealer: z
      .object({
        name: z.string().min(1, "Dealer name is required"),
        commission_percentage: z.number().optional().nullable(),
      })
      .optional(),
  }),
});

export const commitImportSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid import ID format"),
  }),
});
