import { Op, QueryTypes } from "sequelize";
import db from "../../config/db.js";
import GovernmentProject from "../projects/project.model.js";
import Dealer from "../dealers/dealer.model.js";
import DealerCommission from "../dealers/dealer-commission.model.js";
import Item from "../items/item.model.js";
import Unit from "../units/unit.model.js";
import InventoryStock from "../inventory/inventory-stock.model.js";
import InventoryMovement from "../inventory/inventory-movement.model.js";
import Expense from "../expenses/expense.model.js";
import ExpenseCategory from "../expenses/expense-category.model.js";
import Employee from "../employees/employee.model.js";
import EmployeeAttendance from "../employees/employee-attendance.model.js";
import EmployeeSalaryRecord from "../employees/employee-salary-record.model.js";

// ==========================================
// 1. Dealer Performance & Commission Report
// ==========================================
export async function getDealerReport() {
  const dealers = await Dealer.findAll({
    attributes: ["id", "name", "commission_percentage"],
    include: [
      {
        model: GovernmentProject,
        as: "projects",
        attributes: ["id", "quotation_subsidy_amount", "total_fund_released", "current_status"],
      },
      {
        model: DealerCommission,
        as: "commissions",
        attributes: ["commission_amount", "status"],
      },
    ],
    order: [["name", "ASC"]],
  });

  return dealers.map((d) => {
    const totalProjects = (d.projects || []).length;
    const totalSubsidy = (d.projects || []).reduce(
      (acc, p) => acc + (parseFloat(p.quotation_subsidy_amount) || 0),
      0
    );
    const totalReleased = (d.projects || []).reduce(
      (acc, p) => acc + (parseFloat(p.total_fund_released) || 0),
      0
    );

    let commissionPending = 0;
    let commissionPaid = 0;
    for (const c of d.commissions || []) {
      const amt = parseFloat(c.commission_amount) || 0;
      if (c.status === "PAID") commissionPaid += amt;
      else commissionPending += amt;
    }

    return {
      dealer_id: d.id,
      dealer_name: d.name,
      commission_percentage: d.commission_percentage ? parseFloat(d.commission_percentage) : 0,
      total_projects: totalProjects,
      total_subsidy_amount: parseFloat(totalSubsidy.toFixed(2)),
      total_fund_released: parseFloat(totalReleased.toFixed(2)),
      commission_pending: parseFloat(commissionPending.toFixed(2)),
      commission_paid: parseFloat(commissionPaid.toFixed(2)),
    };
  });
}

export async function getExpenseReport({ year } = {}) {
  const where = {};
  if (year) {
    where.expense_date = {
      [Op.between]: [`${year}-01-01`, `${year}-12-31`],
    };
  }

  const expenses = await Expense.findAll({
    where,
    include: [{ model: ExpenseCategory, as: "category", attributes: ["name"] }],
  });

  const byCategory = {};
  let grandTotal = 0;

  for (const e of expenses) {
    const catName = e.category?.name || "Miscellaneous";
    const amt = parseFloat(e.amount) || 0;
    byCategory[catName] = (byCategory[catName] || 0) + amt;
    grandTotal += amt;
  }

  return {
    totalExpenses: parseFloat(grandTotal.toFixed(2)),
    byCategory: Object.entries(byCategory).map(([category, amount]) => ({
      category,
      amount: parseFloat(amount.toFixed(2)),
      percentage: grandTotal > 0 ? parseFloat(((amount / grandTotal) * 100).toFixed(2)) : 0,
    })),
  };
}

// ==========================================
// 4. Employee Attendance & Payroll Summary
// ==========================================
export async function getEmployeeReport({ month, year } = {}) {
  const employees = await Employee.findAll({
    where: { is_active: true },
    include: [
      {
        model: EmployeeSalaryRecord,
        as: "salary_records",
        ...(month && year ? { where: { salary_month: month, salary_year: year } } : {}),
        required: false,
      },
    ],
    order: [["name", "ASC"]],
  });

  return employees.map((emp) => {
    const salaryRec = (emp.salary_records || [])[0];
    return {
      employee_id: emp.id,
      name: emp.name,
      designation: emp.designation,
      base_salary: parseFloat(emp.salary),
      salary_status: salaryRec ? salaryRec.status : "NOT_GENERATED",
      net_salary: salaryRec ? parseFloat(salaryRec.net_salary) : parseFloat(emp.salary),
      paid_date: salaryRec?.paid_date || null,
    };
  });
}
