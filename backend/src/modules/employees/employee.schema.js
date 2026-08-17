import { z } from "zod";

export const createEmployeeSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Employee name is required").max(255),
    designation: z.string().min(1, "Designation is required").max(100),
    salary: z.number().min(0).optional(),
    is_active: z.boolean().optional(),
  }),
});

export const updateEmployeeSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Invalid employee ID format"),
  }),
  body: z.object({
    name: z.string().min(1).max(255).optional(),
    designation: z.string().min(1).max(100).optional(),
    salary: z.number().min(0).optional(),
    is_active: z.boolean().optional(),
  }),
});

export const recordAttendanceSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Invalid employee ID format"),
  }),
  body: z.object({
    attendance_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD").optional(),
    status: z.enum(["PRESENT", "ABSENT", "HALF_DAY", "LEAVE"]),
    notes: z.string().optional().nullable(),
  }),
});

export const bulkAttendanceSchema = z.object({
  body: z.object({
    attendance_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD").optional(),
    records: z
      .array(
        z.object({
          employee_id: z.string().min(1, "Employee ID is required"),
          status: z.enum(["PRESENT", "ABSENT", "HALF_DAY", "LEAVE"]),
          notes: z.string().optional().nullable(),
        })
      )
      .min(1, "At least one employee attendance record is required"),
  }),
});

export const updateAttendanceSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Invalid attendance ID format"),
  }),
  body: z.object({
    status: z.enum(["PRESENT", "ABSENT", "HALF_DAY", "LEAVE"]).optional(),
    notes: z.string().optional().nullable(),
  }),
});

export const listAttendanceSchema = z.object({
  query: z.object({
    employee_id: z.string().optional(),
    date: z.string().optional(),
    month: z.string().optional(),
    year: z.string().optional(),
  }),
});

export const createSalaryRecordSchema = z.object({
  body: z.object({
    employee_id: z.string().min(1, "Invalid employee ID format"),
    salary_month: z.number().int().min(1).max(12),
    salary_year: z.number().int().min(2020).max(2100),
    base_salary: z.number().min(0).optional(),
    adjustments: z.number().optional(),
    deductions: z.number().optional(),
    status: z.enum(["PENDING", "PAID"]).optional(),
    paid_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
    notes: z.string().optional().nullable(),
  }),
});

export const updateSalaryRecordSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Invalid salary record ID format"),
  }),
  body: z.object({
    adjustments: z.number().optional(),
    deductions: z.number().optional(),
    status: z.enum(["PENDING", "PAID"]).optional(),
    paid_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
    notes: z.string().optional().nullable(),
  }),
});
