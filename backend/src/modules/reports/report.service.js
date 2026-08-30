import { Op, QueryTypes } from "sequelize";
import db from "../../config/db.js";
import "../../models/initModels.js";
import GovernmentProject from "../projects/project.model.js";
import Dealer from "../dealers/dealer.model.js";
import StockReceipt from "../inventory/stock-receipt.model.js";
import StockReceiptItem from "../inventory/stock-receipt-item.model.js";
import Supplier from "../suppliers/supplier.model.js";
import Item from "../items/item.model.js";
import Unit from "../units/unit.model.js";
import Expense from "../expenses/expense.model.js";
import ExpenseCategory from "../expenses/expense-category.model.js";
import Employee from "../employees/employee.model.js";
import EmployeeSalaryRecord from "../employees/employee-salary-record.model.js";

// ==========================================
// 1. Raw Materials Purchase & Procurement Report (SQL Aggregated)
// ==========================================
export async function getProcurementReport({ startDate, endDate } = {}) {
  let dateFilter = "";
  const replacements = {};
  if (startDate && endDate) {
    dateFilter = " WHERE sr.receipt_date BETWEEN :startDate AND :endDate";
    replacements.startDate = startDate;
    replacements.endDate = endDate;
  } else if (startDate) {
    dateFilter = " WHERE sr.receipt_date >= :startDate";
    replacements.startDate = startDate;
  } else if (endDate) {
    dateFilter = " WHERE sr.receipt_date <= :endDate";
    replacements.endDate = endDate;
  }

  // 1. Overall totals
  const [totalRes] = await db.query(
    `SELECT 
       COALESCE(SUM(sr.total_amount), 0)::float AS total_spend,
       COUNT(*)::integer AS receipts_count
     FROM stock_receipts sr ${dateFilter}`,
    { replacements, type: QueryTypes.SELECT }
  );

  // 2. By Supplier
  const bySupplier = await db.query(
    `SELECT 
       COALESCE(s.name, sr.supplier_name, 'Direct / Unspecified Vendor') AS name,
       COUNT(*)::integer AS count,
       COALESCE(SUM(sr.total_amount), 0)::float AS total_spend
     FROM stock_receipts sr
     LEFT JOIN suppliers s ON sr.supplier_id = s.id
     ${dateFilter}
     GROUP BY COALESCE(s.name, sr.supplier_name, 'Direct / Unspecified Vendor')
     ORDER BY total_spend DESC
     LIMIT 50`,
    { replacements, type: QueryTypes.SELECT }
  );

  // 3. By Item
  const byItem = await db.query(
    `SELECT 
       i.name,
       i.category,
       u.symbol AS unit,
       COALESCE(SUM(sri.quantity), 0)::float AS total_quantity,
       COALESCE(SUM(COALESCE(sri.total_amount, sri.quantity * sri.unit_price)), 0)::float AS total_spend
     FROM stock_receipt_items sri
     JOIN stock_receipts sr ON sri.stock_receipt_id = sr.id
     JOIN items i ON sri.item_id = i.id
     LEFT JOIN units u ON i.unit_id = u.id
     ${dateFilter}
     GROUP BY i.id, i.name, i.category, u.symbol
     ORDER BY total_spend DESC
     LIMIT 50`,
    { replacements, type: QueryTypes.SELECT }
  );

  // 4. Recent Receipts (Bounded to 50)
  const whereReceipt = {};
  if (startDate && endDate) whereReceipt.receipt_date = { [Op.between]: [startDate, endDate] };
  else if (startDate) whereReceipt.receipt_date = { [Op.gte]: startDate };
  else if (endDate) whereReceipt.receipt_date = { [Op.lte]: endDate };

  const recentReceipts = await StockReceipt.findAll({
    where: whereReceipt,
    include: [
      { model: Supplier, as: "supplier", attributes: ["id", "name", "phone"] },
      {
        model: StockReceiptItem,
        as: "items",
        include: [
          {
            model: Item,
            as: "item",
            attributes: ["id", "name", "code", "item_type", "category"],
            include: [{ model: Unit, as: "unit", attributes: ["name", "symbol"] }],
          },
        ],
      },
    ],
    order: [["receipt_date", "DESC"], ["created_at", "DESC"]],
    limit: 50,
  });

  const formattedReceipts = recentReceipts.map((r) => ({
    id: r.id,
    receipt_date: r.receipt_date,
    reference_number: r.reference_number || "—",
    supplier_name: r.supplier?.name || r.supplier_name || "Direct / Unspecified Vendor",
    total_amount: parseFloat(r.total_amount) || 0,
    notes: r.notes || null,
    items_count: (r.items || []).length,
    items: (r.items || []).map((it) => ({
      item_id: it.item_id,
      name: it.item?.name || "Raw Material",
      category: it.item?.category || "Material",
      unit: it.item?.unit?.symbol || "KG",
      quantity: parseFloat(it.quantity) || 0,
      unit_price: parseFloat(it.unit_price) || 0,
      total_amount: parseFloat(it.total_amount) || 0,
    })),
  }));

  return {
    totalProcurementSpend: totalRes?.total_spend || 0,
    receiptsCount: totalRes?.receipts_count || 0,
    bySupplier,
    byItem,
    receipts: formattedReceipts,
  };
}

// ==========================================
// 2. Government Fund Milestone Inflows (SQL Aggregated)
// ==========================================
export async function getGovernmentFundsReport({ year, district } = {}) {
  let whereClause = "";
  const replacements = {};
  const conditions = [];
  if (year) {
    conditions.push("year = :year");
    replacements.year = year;
  }
  if (district) {
    conditions.push("district ILIKE :district");
    replacements.district = `%${district}%`;
  }
  if (conditions.length > 0) {
    whereClause = " WHERE " + conditions.join(" AND ");
  }

  // 1. Aggregate Totals
  const [totals] = await db.query(
    `SELECT 
       COUNT(*)::integer AS total_projects_count,
       COALESCE(SUM(COALESCE(invoice_amount, quotation_subsidy_amount, 0)), 0)::float AS total_invoiced_amount,
       COALESCE(SUM(COALESCE(first_fund_amount, 0)), 0)::float AS total_first_fund_received,
       COALESCE(SUM(COALESCE(second_fund_amount, 0)), 0)::float AS total_second_fund_received,
       COALESCE(SUM(COALESCE(total_fund_released, 0)), 0)::float AS total_released_amount,
       COUNT(CASE WHEN first_fund_amount > 0 OR first_fund_utr_no IS NOT NULL THEN 1 END)::integer AS first_fund_projects_count,
       COUNT(CASE WHEN second_fund_amount > 0 OR final_fund_utr_no IS NOT NULL THEN 1 END)::integer AS final_fund_projects_count
     FROM government_projects ${whereClause}`,
    { replacements, type: QueryTypes.SELECT }
  );

  // 2. By Status
  const byStatus = await db.query(
    `SELECT 
       COALESCE(current_status, 'Unknown') AS status,
       COUNT(*)::integer AS count,
       COALESCE(SUM(COALESCE(invoice_amount, quotation_subsidy_amount, 0)), 0)::float AS total_invoiced,
       COALESCE(SUM(COALESCE(total_fund_released, 0)), 0)::float AS total_received
     FROM government_projects
     ${whereClause}
     GROUP BY current_status
     ORDER BY count DESC`,
    { replacements, type: QueryTypes.SELECT }
  );

  // 3. By District
  const districtWhereClause = conditions.length > 0 
    ? `WHERE ${conditions.join(" AND ")} AND district IS NOT NULL AND TRIM(district) != ''` 
    : `WHERE district IS NOT NULL AND TRIM(district) != ''`;

  const byDistrict = await db.query(
    `SELECT 
       TRIM(district) AS district,
       COUNT(*)::integer AS count,
       COALESCE(SUM(COALESCE(invoice_amount, quotation_subsidy_amount, 0)), 0)::float AS total_invoiced,
       COALESCE(SUM(COALESCE(total_fund_released, 0)), 0)::float AS total_received
     FROM government_projects
     ${districtWhereClause}
     GROUP BY district
     ORDER BY total_received DESC
     LIMIT 50`,
    { replacements, type: QueryTypes.SELECT }
  );

  const totalInvoiced = totals?.total_invoiced_amount || 0;
  const totalReleased = totals?.total_released_amount || 0;
  const pendingReceivable = Math.max(0, totalInvoiced - totalReleased);

  // 4. Recent Projects (Bounded to 50)
  const whereObj = {};
  if (year) whereObj.year = year;
  if (district) whereObj.district = { [Op.iLike]: `%${district}%` };

  const recentProjects = await GovernmentProject.findAll({
    where: whereObj,
    attributes: [
      "id",
      "application_id",
      "farmer_name",
      "district",
      "block",
      "village",
      "current_status",
      "current_status_date",
      "invoice_amount",
      "quotation_subsidy_amount",
      "first_fund_amount",
      "first_fund_utr_no",
      "second_fund_amount",
      "final_fund_utr_no",
      "total_fund_released",
    ],
    order: [["created_at", "DESC"]],
    limit: 50,
  });

  const formattedProjects = recentProjects.map((p) => {
    const rawInv = parseFloat(p.invoice_amount) || parseFloat(p.quotation_subsidy_amount) || 0;
    const rel = parseFloat(p.total_fund_released) || (parseFloat(p.first_fund_amount) || 0) + (parseFloat(p.second_fund_amount) || 0);
    return {
      id: p.id,
      application_id: p.application_id,
      farmer_name: p.farmer_name,
      district: p.district,
      block: p.block,
      village: p.village,
      current_status: p.current_status,
      current_status_date: p.current_status_date,
      invoiced_amount: rawInv,
      first_fund_received: parseFloat(p.first_fund_amount) || 0,
      first_fund_utr: p.first_fund_utr_no,
      second_fund_received: parseFloat(p.second_fund_amount) || 0,
      final_fund_utr: p.final_fund_utr_no,
      total_released: rel,
      pending_receivable: parseFloat(Math.max(0, rawInv - rel).toFixed(2)),
    };
  });

  return {
    totalProjectsCount: totals?.total_projects_count || 0,
    totalInvoicedAmount: totalInvoiced,
    totalFirstFundReceived: totals?.total_first_fund_received || 0,
    firstFundProjectsCount: totals?.first_fund_projects_count || 0,
    totalSecondFundReceived: totals?.total_second_fund_received || 0,
    finalFundProjectsCount: totals?.final_fund_projects_count || 0,
    totalReleasedAmount: totalReleased,
    totalPendingReceivable: parseFloat(pendingReceivable.toFixed(2)),
    recoveryPercentage: totalInvoiced > 0 ? parseFloat(((totalReleased / totalInvoiced) * 100).toFixed(2)) : 0,
    byStatus,
    byDistrict,
    projects: formattedProjects,
  };
}

// ==========================================
// 3. Executive Financial Overview & Company Cash Position (High-Performance SQL Aggregations)
// ==========================================
export async function getFinancialOverviewReport({ startDate, endDate } = {}) {
  // 1. Direct Commercial Sales Inflows
  const [salesResult] = await db.query(
    `SELECT 
       COALESCE(SUM(total_amount), 0) AS direct_sales_invoiced,
       COALESCE(SUM(paid_amount), 0) AS direct_sales_received
     FROM invoices
     WHERE status != 'CANCELLED'`,
    { type: QueryTypes.SELECT }
  );
  const directSalesInvoiced = parseFloat(salesResult?.direct_sales_invoiced || 0);
  const directSalesReceived = parseFloat(salesResult?.direct_sales_received || 0);

  // 2. Government Fund Milestone Inflows
  const [govtResult] = await db.query(
    `SELECT 
       COALESCE(SUM(COALESCE(invoice_amount, quotation_subsidy_amount, 0)), 0) AS total_invoiced,
       COALESCE(SUM(COALESCE(first_fund_amount, 0)), 0) AS total_first_fund,
       COALESCE(SUM(COALESCE(second_fund_amount, 0)), 0) AS total_second_fund,
       COALESCE(SUM(COALESCE(total_fund_released, 0)), 0) AS total_released
     FROM government_projects`,
    { type: QueryTypes.SELECT }
  );
  const govtTotalInvoiced = parseFloat(govtResult?.total_invoiced || 0);
  const govtFirstFund = parseFloat(govtResult?.total_first_fund || 0);
  const govtSecondFund = parseFloat(govtResult?.total_second_fund || 0);
  const govtTotalReleased = parseFloat(govtResult?.total_released || 0);
  const govtPendingReceivable = Math.max(0, govtTotalInvoiced - govtTotalReleased);

  // 3. Raw Materials Procurement Spend Outflow
  const [procResult] = await db.query(
    `SELECT COALESCE(SUM(total_amount), 0) AS total_procurement FROM stock_receipts`,
    { type: QueryTypes.SELECT }
  );
  const totalProcurementSpend = parseFloat(procResult?.total_procurement || 0);

  // 4. Operating Expenses Outflow
  let expenseQuery = `SELECT COALESCE(SUM(amount), 0) AS total_expenses FROM expenses`;
  const expenseReplacements = {};
  if (startDate && endDate) {
    expenseQuery += ` WHERE expense_date BETWEEN :startDate AND :endDate`;
    expenseReplacements.startDate = startDate;
    expenseReplacements.endDate = endDate;
  }
  const [expResult] = await db.query(expenseQuery, {
    replacements: expenseReplacements,
    type: QueryTypes.SELECT,
  });
  const totalExpenses = parseFloat(expResult?.total_expenses || 0);

  // 5. Staff Salaries Outflow
  const [salaryResult] = await db.query(
    `SELECT COALESCE(SUM(net_salary), 0) AS total_salaries FROM employee_salary_records WHERE status = 'PAID'`,
    { type: QueryTypes.SELECT }
  );
  const totalSalariesPaid = parseFloat(salaryResult?.total_salaries || 0);

  // 6. Dealer Commissions & Fittings Outflows
  const [proceedingResult] = await db.query(
    `SELECT 
       COALESCE(SUM(CASE WHEN is_paid_to_dealer = true THEN commission_amount ELSE 0 END), 0) AS total_commissions_paid,
       COALESCE(SUM(CASE WHEN is_paid_to_dealer = false THEN commission_amount ELSE 0 END), 0) AS total_commissions_pending,
       COALESCE(SUM(CASE WHEN is_paid_to_dealer = true THEN fittings_amount ELSE 0 END), 0) AS total_fittings_paid,
       COALESCE(SUM(CASE WHEN is_paid_to_dealer = false THEN fittings_amount ELSE 0 END), 0) AS total_fittings_pending
     FROM proceeding_batch_projects`,
    { type: QueryTypes.SELECT }
  );
  const totalCommissionsPaid = parseFloat(proceedingResult?.total_commissions_paid || 0);
  const totalCommissionsPending = parseFloat(proceedingResult?.total_commissions_pending || 0);
  const totalFittingsPaid = parseFloat(proceedingResult?.total_fittings_paid || 0);
  const totalFittingsPending = parseFloat(proceedingResult?.total_fittings_pending || 0);

  // 7. Net Cash Inflows & Outflows
  const totalInflows = govtTotalReleased + directSalesReceived;
  const totalDealerOutflowsPaid = totalCommissionsPaid + totalFittingsPaid;
  const totalOutflows =
    totalProcurementSpend + totalExpenses + totalSalariesPaid + totalDealerOutflowsPaid;
  const netCashPosition = totalInflows - totalOutflows;

  return {
    inflows: {
      govt_first_fund_55_pct: parseFloat(govtFirstFund.toFixed(2)),
      govt_second_fund_45_pct: parseFloat(govtSecondFund.toFixed(2)),
      total_govt_fund_received: parseFloat(govtTotalReleased.toFixed(2)),
      govt_total_invoiced: parseFloat(govtTotalInvoiced.toFixed(2)),
      govt_pending_receivable: parseFloat(govtPendingReceivable.toFixed(2)),
      direct_sales_invoiced: parseFloat(directSalesInvoiced.toFixed(2)),
      direct_sales_received: parseFloat(directSalesReceived.toFixed(2)),
      grand_total_cash_inflow: parseFloat(totalInflows.toFixed(2)),
    },
    outflows: {
      raw_materials_procurement: parseFloat(totalProcurementSpend.toFixed(2)),
      operating_expenses: parseFloat(totalExpenses.toFixed(2)),
      staff_salaries_paid: parseFloat(totalSalariesPaid.toFixed(2)),
      dealer_commissions_paid: parseFloat(totalCommissionsPaid.toFixed(2)),
      dealer_commissions_pending: parseFloat(totalCommissionsPending.toFixed(2)),
      fittings_cost_paid: parseFloat(totalFittingsPaid.toFixed(2)),
      fittings_cost_pending: parseFloat(totalFittingsPending.toFixed(2)),
      total_dealer_payouts_paid: parseFloat(totalDealerOutflowsPaid.toFixed(2)),
      grand_total_cash_outflow: parseFloat(totalOutflows.toFixed(2)),
    },
    net_operating_cash_position: parseFloat(netCashPosition.toFixed(2)),
    is_positive: netCashPosition >= 0,
  };
}

// ==========================================
// 4. Dealer Performance & Commission Report (SQL Aggregated)
// ==========================================
export async function getDealerReport({ start_date, end_date, year, dealer_id } = {}) {
  let whereDealer = "";
  const replacements = {};
  if (dealer_id) {
    whereDealer = " WHERE d.id = :dealerId";
    replacements.dealerId = dealer_id;
  }

  const dealers = await db.query(
    `SELECT 
       d.id AS dealer_id,
       d.name AS dealer_name,
       COALESCE(d.commission_percentage, 0)::float AS commission_percentage,
       COUNT(DISTINCT gp.id)::integer AS total_projects,
       COALESCE(SUM(gp.quotation_subsidy_amount), 0)::float AS total_subsidy_amount,
       COALESCE(SUM(gp.total_fund_released), 0)::float AS total_fund_released,
       COALESCE(SUM(CASE WHEN pbp.is_paid_to_dealer = true THEN pbp.commission_amount ELSE 0 END), 0)::float AS commission_paid,
       COALESCE(SUM(CASE WHEN pbp.is_paid_to_dealer = false THEN pbp.commission_amount ELSE 0 END), 0)::float AS commission_pending,
       COALESCE(SUM(CASE WHEN pbp.is_paid_to_dealer = true THEN pbp.fittings_amount ELSE 0 END), 0)::float AS fittings_paid,
       COALESCE(SUM(CASE WHEN pbp.is_paid_to_dealer = false THEN pbp.fittings_amount ELSE 0 END), 0)::float AS fittings_pending,
       COALESCE(SUM(pbp.adjusted_penalty_amount), 0)::float AS total_penalties
     FROM dealers d
     LEFT JOIN government_projects gp ON gp.dealer_id = d.id
     LEFT JOIN proceeding_batch_projects pbp ON pbp.dealer_id = d.id
     ${whereDealer}
     GROUP BY d.id, d.name, d.commission_percentage
     ORDER BY d.name ASC`,
    { replacements, type: QueryTypes.SELECT }
  );

  return dealers.map((d) => {
    const commPaid = parseFloat(d.commission_paid || 0);
    const fitPaid = parseFloat(d.fittings_paid || 0);
    const commPend = parseFloat(d.commission_pending || 0);
    const fitPend = parseFloat(d.fittings_pending || 0);
    const totalPaid = commPaid + fitPaid;
    const totalPending = commPend + fitPend;

    return {
      dealer_id: d.dealer_id,
      dealer_name: d.dealer_name,
      commission_percentage: d.commission_percentage,
      total_projects: d.total_projects,
      total_subsidy_amount: d.total_subsidy_amount,
      total_fund_released: d.total_fund_released,
      commission_paid: commPaid,
      commission_pending: commPend,
      fittings_paid: fitPaid,
      fittings_pending: fitPend,
      total_penalties: d.total_penalties,
      total_payout_paid: parseFloat(totalPaid.toFixed(2)),
      total_payout_pending: parseFloat(totalPending.toFixed(2)),
      total_payout_amount: parseFloat((totalPaid + totalPending).toFixed(2)),
    };
  });
}

// ==========================================
// 5. Operating Expense Report (SQL Aggregated)
// ==========================================
export async function getExpenseReport({ year, company } = {}) {
  const conditions = [];
  const replacements = {};
  if (year) {
    conditions.push("e.expense_date BETWEEN :startDate AND :endDate");
    replacements.startDate = `${year}-01-01`;
    replacements.endDate = `${year}-12-31`;
  }
  if (company && company.toUpperCase() !== "ALL" && company.trim() !== "") {
    conditions.push("e.company = :company");
    replacements.company = company.toLowerCase().trim();
  }

  const whereClause = conditions.length > 0 ? " WHERE " + conditions.join(" AND ") : "";

  const [totalRes] = await db.query(
    `SELECT COALESCE(SUM(amount), 0)::float AS grand_total FROM expenses e ${whereClause}`,
    { replacements, type: QueryTypes.SELECT }
  );
  const grandTotal = parseFloat(totalRes?.grand_total || 0);

  const categories = await db.query(
    `SELECT 
       COALESCE(ec.name, 'Miscellaneous') AS category,
       COALESCE(SUM(e.amount), 0)::float AS amount
     FROM expenses e
     LEFT JOIN expense_categories ec ON e.category_id = ec.id
     ${whereClause}
     GROUP BY ec.name
     ORDER BY amount DESC`,
    { replacements, type: QueryTypes.SELECT }
  );

  return {
    totalExpenses: grandTotal,
    byCategory: categories.map((c) => ({
      category: c.category,
      amount: c.amount,
      percentage: grandTotal > 0 ? parseFloat(((c.amount / grandTotal) * 100).toFixed(2)) : 0,
    })),
  };
}

// ==========================================
// 6. Employee Attendance & Payroll Summary
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
