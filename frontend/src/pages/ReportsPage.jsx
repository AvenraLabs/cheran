import React, { useEffect, useState } from "react";
import {
  BarChart3,
  Users,
  ShoppingCart,
  Receipt,
  Download,
  RefreshCw,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import api from "../api/client.js";
import Navbar from "../components/layout/Navbar.jsx";
import MetricCard from "../components/common/MetricCard.jsx";
import Button from "../components/common/Button.jsx";
import { SkeletonLoader, EmptyState } from "../components/common/SkeletonLoader.jsx";

export function ReportsPage() {
  const [activeTab, setActiveTab] = useState("dealers"); // 'dealers' | 'sales' | 'expenses' | 'employees'
  const [dealerReport, setDealerReport] = useState([]);
  const [salesReport, setSalesReport] = useState({ summary: {}, sales: [] });
  const [expenseReport, setExpenseReport] = useState({ totalExpenses: 0, byCategory: [] });
  const [employeeReport, setEmployeeReport] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const [dealersRes, salesRes, expensesRes, employeesRes] = await Promise.all([
        api.get("/reports/dealers"),
        api.get("/reports/sales"),
        api.get("/reports/expenses"),
        api.get("/reports/employees"),
      ]);

      setDealerReport(dealersRes.data?.dealers || []);
      setSalesReport(salesRes.data || { summary: {}, sales: [] });
      setExpenseReport(expensesRes.data || { totalExpenses: 0, byCategory: [] });
      setEmployeeReport(employeesRes.data?.employees || []);
    } catch (err) {
      console.error("Failed to load analytics reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Navbar
        title="Reports & Financial Intelligence"
        subtitle="Consolidated cross-module reporting for dealers, sales, operations, and payroll"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" icon={RefreshCw} onClick={fetchReports}>
              Refresh
            </Button>
          </div>
        }
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 overflow-y-auto">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[#E4E1D8] pb-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab("dealers")}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-[6px] transition-colors cursor-pointer ${
              activeTab === "dealers"
                ? "bg-[#2F6F5E] text-white"
                : "text-[#52607D] hover:bg-[#FAFAF8]"
            }`}
          >
            <Users size={14} /> Dealer Performance & Commissions
          </button>

          <button
            onClick={() => setActiveTab("sales")}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-[6px] transition-colors cursor-pointer ${
              activeTab === "sales"
                ? "bg-[#2F6F5E] text-white"
                : "text-[#52607D] hover:bg-[#FAFAF8]"
            }`}
          >
            <ShoppingCart size={14} /> Direct Sales & Collections
          </button>

          <button
            onClick={() => setActiveTab("expenses")}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-[6px] transition-colors cursor-pointer ${
              activeTab === "expenses"
                ? "bg-[#2F6F5E] text-white"
                : "text-[#52607D] hover:bg-[#FAFAF8]"
            }`}
          >
            <Receipt size={14} /> Operating Expenses
          </button>

          <button
            onClick={() => setActiveTab("employees")}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-[6px] transition-colors cursor-pointer ${
              activeTab === "employees"
                ? "bg-[#2F6F5E] text-white"
                : "text-[#52607D] hover:bg-[#FAFAF8]"
            }`}
          >
            <DollarSign size={14} /> Staff Payroll Summary
          </button>
        </div>

        {loading ? (
          <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-6">
            <SkeletonLoader rows={8} />
          </div>
        ) : (
          <>
            {/* DEALERS TAB */}
            {activeTab === "dealers" && (
              <div className="bg-white border border-[#E4E1D8] rounded-[10px] shadow-[0_1px_2px_rgba(20,33,61,0.04)] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAFAF8] border-b border-[#E4E1D8] text-[#52607D] uppercase font-semibold">
                      <tr>
                        <th className="py-3 px-4">Dealer Name</th>
                        <th className="py-3 px-4 text-right">Commission Rate</th>
                        <th className="py-3 px-4 text-right">Total Projects</th>
                        <th className="py-3 px-4 text-right">Total Subsidy</th>
                        <th className="py-3 px-4 text-right">Fund Released</th>
                        <th className="py-3 px-4 text-right">Pending Commission</th>
                        <th className="py-3 px-4 text-right">Paid Commission</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EDEAE1]">
                      {dealerReport.map((d) => (
                        <tr key={d.dealer_id} className="hover:bg-[#FAFAF8] transition-colors">
                          <td className="py-3 px-4 font-semibold text-[#14213D]">
                            {d.dealer_name}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-medium text-[#2F6F5E]">
                            {d.commission_percentage}%
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-[#14213D]">
                            {d.total_projects}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-[#52607D]">
                            ₹{(Number(d.total_subsidy_amount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-emerald-700">
                            ₹{(Number(d.total_fund_released) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-amber-700">
                            ₹{(Number(d.commission_pending) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                            ₹{(Number(d.commission_paid) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SALES TAB */}
            {activeTab === "sales" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <MetricCard
                    title="Total Sales Value"
                    value={`₹${(salesReport.summary?.totalSalesValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                    subtitle="Gross invoices"
                    icon={ShoppingCart}
                  />
                  <MetricCard
                    title="Total Collected"
                    value={`₹${(salesReport.summary?.totalReceived || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                    subtitle="Received payments"
                    icon={TrendingUp}
                  />
                  <MetricCard
                    title="Total Pending Balance"
                    value={`₹${(salesReport.summary?.totalPendingBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                    subtitle="Outstanding receivables"
                    icon={DollarSign}
                  />
                </div>

                <div className="bg-white border border-[#E4E1D8] rounded-[10px] shadow-[0_1px_2px_rgba(20,33,61,0.04)] overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#FAFAF8] border-b border-[#E4E1D8] text-[#52607D] uppercase font-semibold">
                        <tr>
                          <th className="py-3 px-4">Invoice / Date</th>
                          <th className="py-3 px-4">Customer</th>
                          <th className="py-3 px-4 text-right">Net Items</th>
                          <th className="py-3 px-4 text-right">Fittings</th>
                          <th className="py-3 px-4 text-right">Taxable</th>
                          <th className="py-3 px-4 text-right">Total Invoice</th>
                          <th className="py-3 px-4 text-right">Paid</th>
                          <th className="py-3 px-4 text-right">Balance Due</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EDEAE1]">
                        {(salesReport.sales || []).map((s) => (
                          <tr key={s.sale_id} className="hover:bg-[#FAFAF8] transition-colors">
                            <td className="py-3 px-4 font-mono font-medium text-[#14213D]">
                              {s.invoice_number || "—"} ({s.sale_date})
                            </td>
                            <td className="py-3 px-4 font-semibold text-[#14213D]">
                              {s.customer_name}
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-[#52607D]">
                              ₹{(Number(s.net_item_amount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-[#52607D]">
                              ₹{(Number(s.fittings_amount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-[#52607D]">
                              ₹{(Number(s.taxable_amount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-sm text-[#14213D]">
                              ₹{(Number(s.total_amount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-emerald-700">
                              ₹{(Number(s.paid_amount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-rose-700">
                              ₹{(Number(s.balance_due) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* EXPENSES TAB */}
            {activeTab === "expenses" && (
              <div className="space-y-6">
                <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-6 shadow-[0_1px_2px_rgba(20,33,61,0.04)]">
                  <div className="text-xs text-[#52607D]">Total Operating Expenses:</div>
                  <div className="font-mono text-2xl font-bold text-[#14213D] mt-1">
                    ₹{(Number(expenseReport?.totalExpenses) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="bg-white border border-[#E4E1D8] rounded-[10px] shadow-[0_1px_2px_rgba(20,33,61,0.04)] overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAFAF8] border-b border-[#E4E1D8] text-[#52607D] uppercase font-semibold">
                      <tr>
                        <th className="py-3 px-4">Expense Head / Category</th>
                        <th className="py-3 px-4 text-right">Amount (₹)</th>
                        <th className="py-3 px-4 text-right">Percentage Share</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EDEAE1]">
                      {(expenseReport?.byCategory || []).map((cat, idx) => (
                        <tr key={idx} className="hover:bg-[#FAFAF8]">
                          <td className="py-3 px-4 font-semibold text-[#14213D]">{cat.category}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-[#14213D]">
                            ₹{(Number(cat.amount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-semibold text-[#2F6F5E]">
                            {cat.percentage}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* EMPLOYEES TAB */}
            {activeTab === "employees" && (
              <div className="bg-white border border-[#E4E1D8] rounded-[10px] shadow-[0_1px_2px_rgba(20,33,61,0.04)] overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAFAF8] border-b border-[#E4E1D8] text-[#52607D] uppercase font-semibold">
                    <tr>
                      <th className="py-3 px-4">Employee Name</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4 text-right">Base Salary</th>
                      <th className="py-3 px-4 text-right">Net Payable</th>
                      <th className="py-3 px-4">Salary Status</th>
                      <th className="py-3 px-4">Paid Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDEAE1]">
                    {employeeReport.map((emp) => (
                      <tr key={emp.employee_id} className="hover:bg-[#FAFAF8]">
                        <td className="py-3 px-4 font-semibold text-[#14213D]">{emp.name}</td>
                        <td className="py-3 px-4 text-[#52607D]">{emp.designation}</td>
                        <td className="py-3 px-4 text-right font-mono text-[#52607D]">
                          ₹{(Number(emp.base_salary) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-[#14213D]">
                          ₹{(Number(emp.net_salary) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              emp.salary_status === "PAID"
                                ? "bg-emerald-50 text-emerald-800"
                                : "bg-amber-50 text-amber-800"
                            }`}
                          >
                            {emp.salary_status}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[#52607D]">{emp.paid_date || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default ReportsPage;
