import { Op } from "sequelize";
import db from "../../config/db.js";
import Employee from "./employee.model.js";
import EmployeeAttendance from "./employee-attendance.model.js";
import EmployeeSalaryRecord from "./employee-salary-record.model.js";
import AppError from "../../shared/appError.js";

// ==========================================
// 1. Employee Master
// ==========================================

export async function listEmployees({ search, is_active } = {}) {
  const where = {};
  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search.trim()}%` } },
      { designation: { [Op.iLike]: `%${search.trim()}%` } },
    ];
  }
  if (is_active !== undefined) where.is_active = is_active;

  return await Employee.findAll({
    where,
    order: [["name", "ASC"]],
  });
}

export async function getEmployeeById(id) {
  const employee = await Employee.findByPk(id);
  if (!employee) {
    throw new AppError(`Employee not found with ID ${id}`, 404);
  }
  return employee;
}

export async function createEmployee({ name, designation, salary = 0, is_active = true }) {
  return await Employee.create({
    name: name.trim(),
    designation: designation.trim(),
    salary: parseFloat(salary) || 0.0,
    is_active,
  });
}

export async function updateEmployee(id, { name, designation, salary, is_active }) {
  const employee = await Employee.findByPk(id);
  if (!employee) {
    throw new AppError(`Employee not found with ID ${id}`, 404);
  }

  const updates = {};
  if (name !== undefined) updates.name = name.trim();
  if (designation !== undefined) updates.designation = designation.trim();
  if (salary !== undefined) updates.salary = parseFloat(salary) || 0.0;
  if (is_active !== undefined) updates.is_active = is_active;

  await employee.update(updates);
  return employee;
}

// ==========================================
// 2. Attendance Tracking
// ==========================================

export async function recordAttendance({
  employee_id,
  attendance_date = new Date().toISOString().split("T")[0],
  status = "PRESENT",
  notes = null,
}) {
  const employee = await Employee.findByPk(employee_id);
  if (!employee) {
    throw new AppError(`Employee not found with ID ${employee_id}`, 404);
  }

  // Check if attendance already recorded for this employee and date
  const existing = await EmployeeAttendance.findOne({
    where: { employee_id, attendance_date },
  });
  if (existing) {
    throw new AppError(
      `Attendance for employee ${employee.name} on ${attendance_date} has already been recorded`,
      409
    );
  }

  return await EmployeeAttendance.create({
    employee_id,
    attendance_date,
    status,
    notes: notes ? notes.trim() : null,
  });
}

export async function recordBulkAttendance({
  attendance_date = new Date().toISOString().split("T")[0],
  records = [],
}) {
  return await db.transaction(async (t) => {
    const results = [];
    for (const rec of records) {
      if (!rec.employee_id) continue;
      const status = rec.status || "PRESENT";
      const notes = rec.notes ? rec.notes.trim() : null;

      const existing = await EmployeeAttendance.findOne({
        where: { employee_id: rec.employee_id, attendance_date },
        transaction: t,
      });

      if (existing) {
        await existing.update({ status, notes }, { transaction: t });
        results.push(existing);
      } else {
        const created = await EmployeeAttendance.create(
          {
            employee_id: rec.employee_id,
            attendance_date,
            status,
            notes,
          },
          { transaction: t }
        );
        results.push(created);
      }
    }
    return results;
  });
}

export async function updateAttendance(id, { status, notes }) {
  const record = await EmployeeAttendance.findByPk(id);
  if (!record) {
    throw new AppError(`Attendance record not found with ID ${id}`, 404);
  }

  const updates = {};
  if (status) updates.status = status;
  if (notes !== undefined) updates.notes = notes ? notes.trim() : null;

  await record.update(updates);
  return record;
}

export async function listAttendance({ employee_id, date, month, year } = {}) {
  const where = {};
  if (employee_id) where.employee_id = employee_id;
  if (date) where.attendance_date = date;
  if (month && year) {
    const m = String(month).padStart(2, "0");
    where.attendance_date = {
      [Op.between]: [`${year}-${m}-01`, `${year}-${m}-31`],
    };
  }

  return await EmployeeAttendance.findAll({
    where,
    include: [
      {
        model: Employee,
        as: "employee",
        attributes: ["id", "name", "designation"],
      },
    ],
    order: [["attendance_date", "DESC"], ["created_at", "DESC"]],
  });
}

// ==========================================
// 3. Salary Records
// ==========================================

export async function createSalaryRecord({
  employee_id,
  salary_month,
  salary_year,
  base_salary,
  adjustments = 0,
  deductions = 0,
  status = "PENDING",
  paid_date = null,
  notes = null,
}) {
  const employee = await Employee.findByPk(employee_id);
  if (!employee) {
    throw new AppError(`Employee not found with ID ${employee_id}`, 404);
  }

  const base = base_salary !== undefined ? parseFloat(base_salary) : parseFloat(employee.salary || 0);
  const adj = parseFloat(adjustments) || 0;
  const ded = parseFloat(deductions) || 0;
  const net = parseFloat((base + adj - ded).toFixed(2));
  const finalPaidDate = status === "PAID" ? (paid_date || new Date().toISOString().split("T")[0]) : null;

  const existing = await EmployeeSalaryRecord.findOne({
    where: {
      employee_id,
      salary_year: parseInt(salary_year, 10),
      salary_month: parseInt(salary_month, 10),
    },
  });

  if (existing) {
    await existing.update({
      base_salary: base,
      adjustments: adj,
      deductions: ded,
      net_salary: net,
      status,
      paid_date: finalPaidDate,
      notes,
    });
    return existing;
  }

  return await EmployeeSalaryRecord.create({
    employee_id,
    salary_month: parseInt(salary_month, 10),
    salary_year: parseInt(salary_year, 10),
    base_salary: base,
    adjustments: adj,
    deductions: ded,
    net_salary: net,
    status,
    paid_date: finalPaidDate,
    notes,
  });
}

export async function bulkPaySalaries({ salary_month, salary_year }) {
  const month = parseInt(salary_month, 10);
  const year = parseInt(salary_year, 10);
  const today = new Date().toISOString().split("T")[0];

  const activeEmployees = await Employee.findAll({ where: { is_active: true } });

  return await db.transaction(async (t) => {
    const results = [];
    for (const emp of activeEmployees) {
      const existing = await EmployeeSalaryRecord.findOne({
        where: { employee_id: emp.id, salary_month: month, salary_year: year },
        transaction: t,
      });

      if (existing) {
        if (existing.status !== "PAID") {
          await existing.update({ status: "PAID", paid_date: today }, { transaction: t });
        }
        results.push(existing);
      } else {
        const base = parseFloat(emp.salary || 0);
        const created = await EmployeeSalaryRecord.create(
          {
            employee_id: emp.id,
            salary_month: month,
            salary_year: year,
            base_salary: base,
            adjustments: 0,
            deductions: 0,
            net_salary: base,
            status: "PAID",
            paid_date: today,
          },
          { transaction: t }
        );
        results.push(created);
      }
    }
    return results;
  });
}

export async function listSalaryRecords({ employee_id, month, year, status } = {}) {
  const where = {};
  if (employee_id) where.employee_id = employee_id;
  if (month) where.salary_month = parseInt(month, 10);
  if (year) where.salary_year = parseInt(year, 10);
  if (status) where.status = status;

  return await EmployeeSalaryRecord.findAll({
    where,
    include: [
      {
        model: Employee,
        as: "employee",
        attributes: ["id", "name", "designation"],
      },
    ],
    order: [["salary_year", "DESC"], ["salary_month", "DESC"]],
  });
}

export async function updateSalaryRecord(id, { adjustments, deductions, status, paid_date, notes }) {
  const record = await EmployeeSalaryRecord.findByPk(id);
  if (!record) {
    throw new AppError(`Salary record not found with ID ${id}`, 404);
  }

  const updates = {};
  let base = parseFloat(record.base_salary);
  let adj = adjustments !== undefined ? parseFloat(adjustments) : parseFloat(record.adjustments);
  let ded = deductions !== undefined ? parseFloat(deductions) : parseFloat(record.deductions);

  if (adjustments !== undefined) updates.adjustments = adj;
  if (deductions !== undefined) updates.deductions = ded;
  updates.net_salary = parseFloat((base + adj - ded).toFixed(2));

  if (status !== undefined) {
    updates.status = status;
    if (status === "PAID" && !record.paid_date && !paid_date) {
      updates.paid_date = new Date().toISOString().split("T")[0];
    }
  }
  if (paid_date !== undefined) updates.paid_date = paid_date;
  if (notes !== undefined) updates.notes = notes;

  await record.update(updates);
  return record;
}
