import { Op, QueryTypes } from "sequelize";
import db from "../../config/db.js";
import "../../models/initModels.js";
import GovernmentProject from "../projects/project.model.js";
import Dealer from "../dealers/dealer.model.js";
import DealerCommission from "../dealers/dealer-commission.model.js";
import StockReceipt from "../inventory/stock-receipt.model.js";
import StockReceiptItem from "../inventory/stock-receipt-item.model.js";
import Supplier from "../suppliers/supplier.model.js";
import Item from "../items/item.model.js";
import Unit from "../units/unit.model.js";
import Expense from "../expenses/expense.model.js";
import ExpenseCategory from "../expenses/expense-category.model.js";
import Employee from "../employees/employee.model.js";
import EmployeeSalaryRecord from "../employees/employee-salary-record.model.js";
import Invoice from "../invoices/invoice.model.js";

// First Fund Milestone Statuses
const FIRST_FUND_STATUSES = [
  "District First Fund Credited (UTR Updated)",
  "First Fund Credited (UTR Updated)",
  "District First Fund Proceeding Completed",
  "Iamwarm Fund Credited (UTR Updated)",
];

// Final Fund Milestone Statuses
const FINAL_FUND_STATUSES = [
  "Final Fund Credited (UTR Updated)",
  "Final Fund Release Recommended by District Office",
  "Iamwarm Fund Credited (UTR Updated)",
];

// ==========================================
// 1. Raw Materials Purchase & Procurement Report
// ==========================================
export async function getProcurementReport({ startDate, endDate } = {}) {
  const where = {};
  if (startDate && endDate) {
    where.receipt_date = { [Op.between]: [startDate, endDate] };
  } else if (startDate) {
    where.receipt_date = { [Op.gte]: startDate };
  } else if (endDate) {
    where.receipt_date = { [Op.lte]: endDate };
  }

  const receipts = await StockReceipt.findAll({
    where,
    include: [
      {
        model: Supplier,
        as: "supplier",
        attributes: ["id", "name", "phone"],
      },
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
  });

  let grandTotalProcurement = 0;
  const supplierSpendMap = new Map();
  const itemSpendMap = new Map();

  const formattedReceipts = receipts.map((r) => {
    const totalAmt = parseFloat(r.total_amount) || 0;
    grandTotalProcurement += totalAmt;

    const supName = r.supplier?.name || r.supplier_name || "Direct / Unspecified Vendor";
    const existingSup = supplierSpendMap.get(supName) || { name: supName, count: 0, total_spend: 0 };
    existingSup.count += 1;
    existingSup.total_spend += totalAmt;
    supplierSpendMap.set(supName, existingSup);

    const itemsSummary = (r.items || []).map((it) => {
      const itName = it.item?.name || "Raw Material";
      const itCategory = it.item?.category || "Material";
      const itUnit = it.item?.unit?.symbol || "KG";
      const qty = parseFloat(it.quantity) || 0;
      const unitPrice = parseFloat(it.unit_price) || 0;
      const itTotal = parseFloat(it.total_amount) || qty * unitPrice;

      const existingItem = itemSpendMap.get(itName) || {
        name: itName,
        category: itCategory,
        unit: itUnit,
        total_quantity: 0,
        total_spend: 0,
      };
      existingItem.total_quantity += qty;
      existingItem.total_spend += itTotal;
      itemSpendMap.set(itName, existingItem);

      return {
        item_id: it.item_id,
        name: itName,
        category: itCategory,
        unit: itUnit,
        quantity: qty,
        unit_price: unitPrice,
        total_amount: itTotal,
      };
    });

    return {
      id: r.id,
      receipt_date: r.receipt_date,
      reference_number: r.reference_number || "—",
      supplier_name: supName,
      total_amount: totalAmt,
      notes: r.notes || null,
      items_count: itemsSummary.length,
      items: itemsSummary,
    };
  });

  return {
    totalProcurementSpend: parseFloat(grandTotalProcurement.toFixed(2)),
    receiptsCount: receipts.length,
    bySupplier: Array.from(supplierSpendMap.values()).sort((a, b) => b.total_spend - a.total_spend),
    byItem: Array.from(itemSpendMap.values()).sort((a, b) => b.total_spend - a.total_spend),
    receipts: formattedReceipts,
  };
}

// ==========================================
// 2. Government Fund Milestone Inflows (55% & 45%)
// ==========================================
export async function getGovernmentFundsReport({ year, district } = {}) {
  const where = {};
  if (year) where.year = year;
  if (district) where.district = { [Op.iLike]: `%${district}%` };

  const projects = await GovernmentProject.findAll({
    where,
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
      "first_fund_utr_date",
      "second_fund_amount",
      "final_fund_utr_no",
      "final_fund_utr_date",
      "total_fund_released",
    ],
    order: [["created_at", "DESC"]],
  });

  let totalInvoicedAmount = 0;
  let totalFirstFundReceived = 0;
  let totalSecondFundReceived = 0;
  let totalReleasedAmount = 0;
  let firstFundProjectsCount = 0;
  let finalFundProjectsCount = 0;

  const byStatusMap = new Map();
  const byDistrictMap = new Map();

  const formattedProjects = projects.map((p) => {
    const rawInvoice =
      parseFloat(p.invoice_amount) || parseFloat(p.quotation_subsidy_amount) || 0;
    totalInvoicedAmount += rawInvoice;

    const status = p.current_status || "UNKNOWN";

    // Check Milestone 1 (55%)
    let firstFundReceived = 0;
    const isFirstFundEligible =
      FIRST_FUND_STATUSES.includes(status) ||
      FINAL_FUND_STATUSES.includes(status) ||
      Boolean(p.first_fund_utr_no) ||
      parseFloat(p.first_fund_amount) > 0;

    if (isFirstFundEligible) {
      firstFundReceived =
        parseFloat(p.first_fund_amount) > 0
          ? parseFloat(p.first_fund_amount)
          : parseFloat((rawInvoice * 0.55).toFixed(2));
      totalFirstFundReceived += firstFundReceived;
      firstFundProjectsCount++;
    }

    // Check Milestone 2 (45%)
    let secondFundReceived = 0;
    const isFinalFundEligible =
      FINAL_FUND_STATUSES.includes(status) ||
      Boolean(p.final_fund_utr_no) ||
      parseFloat(p.second_fund_amount) > 0;

    if (isFinalFundEligible) {
      secondFundReceived =
        parseFloat(p.second_fund_amount) > 0
          ? parseFloat(p.second_fund_amount)
          : parseFloat((rawInvoice * 0.45).toFixed(2));
      totalSecondFundReceived += secondFundReceived;
      finalFundProjectsCount++;
    }

    const projectTotalReleased =
      parseFloat(p.total_fund_released) > 0
        ? parseFloat(p.total_fund_released)
        : firstFundReceived + secondFundReceived;
    totalReleasedAmount += projectTotalReleased;

    const pendingReceivable = Math.max(0, rawInvoice - projectTotalReleased);

    // Grouping by Status
    const statusGroup = byStatusMap.get(status) || {
      status,
      count: 0,
      total_invoiced: 0,
      total_received: 0,
    };
    statusGroup.count++;
    statusGroup.total_invoiced += rawInvoice;
    statusGroup.total_received += projectTotalReleased;
    byStatusMap.set(status, statusGroup);

    // Grouping by District
    const dist = p.district || "Unassigned District";
    const distGroup = byDistrictMap.get(dist) || {
      district: dist,
      count: 0,
      total_invoiced: 0,
      total_received: 0,
    };
    distGroup.count++;
    distGroup.total_invoiced += rawInvoice;
    distGroup.total_received += projectTotalReleased;
    byDistrictMap.set(dist, distGroup);

    return {
      id: p.id,
      application_id: p.application_id,
      farmer_name: p.farmer_name,
      district: p.district,
      block: p.block,
      village: p.village,
      current_status: status,
      current_status_date: p.current_status_date,
      invoiced_amount: rawInvoice,
      first_fund_received: firstFundReceived,
      first_fund_utr: p.first_fund_utr_no,
      second_fund_received: secondFundReceived,
      final_fund_utr: p.final_fund_utr_no,
      total_released: projectTotalReleased,
      pending_receivable: parseFloat(pendingReceivable.toFixed(2)),
    };
  });

  return {
    totalProjectsCount: projects.length,
    totalInvoicedAmount: parseFloat(totalInvoicedAmount.toFixed(2)),
    totalFirstFundReceived: parseFloat(totalFirstFundReceived.toFixed(2)),
    firstFundProjectsCount,
    totalSecondFundReceived: parseFloat(totalSecondFundReceived.toFixed(2)),
    finalFundProjectsCount,
    totalReleasedAmount: parseFloat(totalReleasedAmount.toFixed(2)),
    totalPendingReceivable: parseFloat(Math.max(0, totalInvoicedAmount - totalReleasedAmount).toFixed(2)),
    recoveryPercentage:
      totalInvoicedAmount > 0
        ? parseFloat(((totalReleasedAmount / totalInvoicedAmount) * 100).toFixed(2))
        : 0,
    byStatus: Array.from(byStatusMap.values()).sort((a, b) => b.count - a.count),
    byDistrict: Array.from(byDistrictMap.values()).sort((a, b) => b.total_received - a.total_received),
    projects: formattedProjects.slice(0, 100), // Top 100 recent rows
  };
}

// ==========================================
// 3. Executive Financial Overview & Company Cash Position
// ==========================================
export async function getFinancialOverviewReport({ startDate, endDate } = {}) {
  const [procurementData, govtFundsData] = await Promise.all([
    getProcurementReport({ startDate, endDate }),
    getGovernmentFundsReport(),
  ]);

  // Direct Commercial Sales Inflow
  const salesInvoices = await Invoice.findAll({
    attributes: [
      "id",
      "total_amount",
      "paid_amount",
      "payment_status",
      "invoice_type",
    ],
  });

  let directSalesInvoiced = 0;
  let directSalesReceived = 0;
  for (const inv of salesInvoices) {
    directSalesInvoiced += parseFloat(inv.total_amount) || 0;
    directSalesReceived += parseFloat(inv.paid_amount) || 0;
  }

  // Operating Expenses Outflow
  const expenseWhere = {};
  if (startDate && endDate) {
    expenseWhere.expense_date = { [Op.between]: [startDate, endDate] };
  }
  const expenses = await Expense.findAll({ where: expenseWhere });
  const totalExpenses = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

  // Staff Salary Outflow
  const salaryRecords = await EmployeeSalaryRecord.findAll();
  let totalSalariesPaid = 0;
  for (const s of salaryRecords) {
    if (s.status === "PAID") {
      totalSalariesPaid += parseFloat(s.net_salary) || 0;
    }
  }

  // Dealer Commissions & Fittings Outflow
  const commissions = await DealerCommission.findAll();
  let totalCommissionsPaid = 0;
  let totalCommissionsPending = 0;
  let totalFittingsPaid = 0;
  let totalFittingsPending = 0;

  for (const c of commissions) {
    const amt = parseFloat(c.commission_amount) || 0;
    const fitAmt = parseFloat(c.fittings_amount) || 0;

    if (c.status === "PAID") totalCommissionsPaid += amt;
    else totalCommissionsPending += amt;

    if (c.fittings_status === "PAID") totalFittingsPaid += fitAmt;
    else totalFittingsPending += fitAmt;
  }

  // Total Inflows & Outflows
  const totalInflows = govtFundsData.totalReleasedAmount + directSalesReceived;
  const totalDealerOutflowsPaid = totalCommissionsPaid + totalFittingsPaid;
  const totalOutflows =
    procurementData.totalProcurementSpend + totalExpenses + totalSalariesPaid + totalDealerOutflowsPaid;
  const netCashPosition = totalInflows - totalOutflows;

  return {
    inflows: {
      govt_first_fund_55_pct: govtFundsData.totalFirstFundReceived,
      govt_second_fund_45_pct: govtFundsData.totalSecondFundReceived,
      total_govt_fund_received: govtFundsData.totalReleasedAmount,
      govt_total_invoiced: govtFundsData.totalInvoicedAmount,
      govt_pending_receivable: govtFundsData.totalPendingReceivable,
      direct_sales_invoiced: parseFloat(directSalesInvoiced.toFixed(2)),
      direct_sales_received: parseFloat(directSalesReceived.toFixed(2)),
      grand_total_cash_inflow: parseFloat(totalInflows.toFixed(2)),
    },
    outflows: {
      raw_materials_procurement: procurementData.totalProcurementSpend,
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
// 4. Dealer Performance & Commission Report
// ==========================================
export async function getDealerReport({ start_date, end_date, year, dealer_id } = {}) {
  const whereDealer = {};
  if (dealer_id) {
    whereDealer.id = dealer_id;
  }

  const projectWhere = {};
  if (start_date && end_date) {
    projectWhere.created_at = {
      [Op.between]: [new Date(`${start_date}T00:00:00.000Z`), new Date(`${end_date}T23:59:59.999Z`)],
    };
  } else if (year) {
    projectWhere.created_at = {
      [Op.between]: [new Date(`${year}-01-01T00:00:00.000Z`), new Date(`${year}-12-31T23:59:59.999Z`)],
    };
  }

  const dealers = await Dealer.findAll({
    where: whereDealer,
    attributes: ["id", "name", "commission_percentage"],
    include: [
      {
        model: GovernmentProject,
        as: "projects",
        where: Object.keys(projectWhere).length > 0 ? projectWhere : undefined,
        required: false,
        attributes: ["id", "quotation_subsidy_amount", "total_fund_released", "current_status", "created_at"],
      },
      {
        model: DealerCommission,
        as: "commissions",
        required: false,
        attributes: [
          "id",
          "commission_amount",
          "fittings_amount",
          "status",
          "fittings_status",
          "part1_status",
          "part2_status",
          "part1_amount",
          "part2_amount",
          "created_at",
        ],
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
    let fittingsPending = 0;
    let fittingsPaid = 0;

    for (const c of d.commissions || []) {
      const commAmt = parseFloat(c.commission_amount) || 0;
      const fitAmt = parseFloat(c.fittings_amount) || 0;

      if (c.status === "PAID") commissionPaid += commAmt;
      else commissionPending += commAmt;

      if (c.fittings_status === "PAID") fittingsPaid += fitAmt;
      else fittingsPending += fitAmt;
    }

    const totalPayoutPaid = parseFloat((commissionPaid + fittingsPaid).toFixed(2));
    const totalPayoutPending = parseFloat((commissionPending + fittingsPending).toFixed(2));

    return {
      dealer_id: d.id,
      dealer_name: d.name,
      commission_percentage: d.commission_percentage ? parseFloat(d.commission_percentage) : 0,
      total_projects: totalProjects,
      total_subsidy_amount: parseFloat(totalSubsidy.toFixed(2)),
      total_fund_released: parseFloat(totalReleased.toFixed(2)),
      commission_paid: parseFloat(commissionPaid.toFixed(2)),
      commission_pending: parseFloat(commissionPending.toFixed(2)),
      fittings_paid: parseFloat(fittingsPaid.toFixed(2)),
      fittings_pending: parseFloat(fittingsPending.toFixed(2)),
      total_payout_paid: totalPayoutPaid,
      total_payout_pending: totalPayoutPending,
      total_payout_amount: parseFloat((totalPayoutPaid + totalPayoutPending).toFixed(2)),
    };
  });
}

// ==========================================
// 5. Operating Expense Report
// ==========================================
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
