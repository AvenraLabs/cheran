import React, { useEffect, useState } from "react";
import {
  BarChart3,
  Users,
  Receipt,
  RefreshCw,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Truck,
  Layers,
  ArrowRight,
  LandPlot,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Package,
  Calendar,
  Building,
  CreditCard,
  PieChart,
} from "lucide-react";
import api from "../api/client.js";
import Navbar from "../components/layout/Navbar.jsx";
import MetricCard from "../components/common/MetricCard.jsx";
import Button from "../components/common/Button.jsx";
import { SkeletonLoader, EmptyState } from "../components/common/SkeletonLoader.jsx";
import { formatDate } from "../utils/dates.js";

export function ReportsPage() {
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'govt_funds' | 'procurement' | 'dealers' | 'expenses_payroll'

  // Data States
  const [financialOverview, setFinancialOverview] = useState(null);
  const [procurementReport, setProcurementReport] = useState(null);
  const [govtFundsReport, setGovtFundsReport] = useState(null);
  const [dealerReport, setDealerReport] = useState([]);
  const [expenseReport, setExpenseReport] = useState({ totalExpenses: 0, byCategory: [] });
  const [employeeReport, setEmployeeReport] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters for Procurement & Dealers
  const [procStartDate, setProcStartDate] = useState("");
  const [procEndDate, setProcEndDate] = useState("");
  const [dealerStartDate, setDealerStartDate] = useState("");
  const [dealerEndDate, setDealerEndDate] = useState("");

  const fetchReports = async () => {
    try {
      setLoading(true);
      const procParams = {};
      if (procStartDate) procParams.startDate = procStartDate;
      if (procEndDate) procParams.endDate = procEndDate;

      const dealerParams = {};
      if (dealerStartDate) dealerParams.start_date = dealerStartDate;
      if (dealerEndDate) dealerParams.end_date = dealerEndDate;

      const [finRes, procRes, govtRes, dealersRes, expensesRes, employeesRes] =
        await Promise.allSettled([
          api.get("/reports/financial-overview", { params: procParams }),
          api.get("/reports/procurement", { params: procParams }),
          api.get("/reports/govt-funds"),
          api.get("/reports/dealers", { params: dealerParams }),
          api.get("/reports/expenses"),
          api.get("/reports/employees"),
        ]);

      if (finRes.status === "fulfilled") {
        setFinancialOverview(finRes.value?.data || finRes.value || null);
      }
      if (procRes.status === "fulfilled") {
        setProcurementReport(procRes.value?.data || procRes.value || null);
      }
      if (govtRes.status === "fulfilled") {
        setGovtFundsReport(govtRes.value?.data || govtRes.value || null);
      }
      if (dealersRes.status === "fulfilled") {
        setDealerReport(dealersRes.value?.data?.dealers || dealersRes.value?.dealers || []);
      }
      if (expensesRes.status === "fulfilled") {
        setExpenseReport(expensesRes.value?.data || expensesRes.value || { totalExpenses: 0, byCategory: [] });
      }
      if (employeesRes.status === "fulfilled") {
        setEmployeeReport(employeesRes.value?.data?.employees || employeesRes.value?.employees || []);
      }
    } catch (err) {
      console.error("Failed to load analytics reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [procStartDate, procEndDate, dealerStartDate, dealerEndDate]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#F4F2EB] min-h-screen">
      <Navbar
        title="Financial Intelligence & Business Reports"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" icon={RefreshCw} onClick={fetchReports}>
              Refresh Data
            </Button>
          </div>
        }
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 overflow-y-auto max-w-7xl mx-auto w-full">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[#E4E1D8] pb-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-[8px] transition-all cursor-pointer ${
              activeTab === "overview"
                ? "bg-[#2F6F5E] text-white shadow-xs"
                : "bg-white text-[#52607D] border border-[#E4E1D8] hover:bg-gray-100"
            }`}
          >
            <TrendingUp size={14} /> Executive P&L Overview
          </button>

          <button
            onClick={() => setActiveTab("govt_funds")}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-[8px] transition-all cursor-pointer ${
              activeTab === "govt_funds"
                ? "bg-[#2F6F5E] text-white shadow-xs"
                : "bg-white text-[#52607D] border border-[#E4E1D8] hover:bg-gray-100"
            }`}
          >
            <LandPlot size={14} /> Govt 55% / 45% Milestones
          </button>

          <button
            onClick={() => setActiveTab("procurement")}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-[8px] transition-all cursor-pointer ${
              activeTab === "procurement"
                ? "bg-[#2F6F5E] text-white shadow-xs"
                : "bg-white text-[#52607D] border border-[#E4E1D8] hover:bg-gray-100"
            }`}
          >
            <Truck size={14} /> Raw Material Purchases
          </button>

          <button
            onClick={() => setActiveTab("dealers")}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-[8px] transition-all cursor-pointer ${
              activeTab === "dealers"
                ? "bg-[#2F6F5E] text-white shadow-xs"
                : "bg-white text-[#52607D] border border-[#E4E1D8] hover:bg-gray-100"
            }`}
          >
            <Users size={14} /> Dealer Commissions
          </button>

          <button
            onClick={() => setActiveTab("expenses_payroll")}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-[8px] transition-all cursor-pointer ${
              activeTab === "expenses_payroll"
                ? "bg-[#2F6F5E] text-white shadow-xs"
                : "bg-white text-[#52607D] border border-[#E4E1D8] hover:bg-gray-100"
            }`}
          >
            <Receipt size={14} /> Opex & Staff Payroll
          </button>
        </div>

        {loading ? (
          <div className="bg-white border border-[#E4E1D8] rounded-[12px] p-6">
            <SkeletonLoader count={6} />
          </div>
        ) : (
          <>
            {/* ========================================== */}
            {/* TAB 1: EXECUTIVE P&L OVERVIEW */}
            {/* ========================================== */}
            {activeTab === "overview" && financialOverview && (
              <div className="space-y-6">
                {/* Net Cash Position Hero Card */}
                <div className="bg-white border border-[#E4E1D8] rounded-[12px] p-6 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EDEAE1] pb-4">
                    <div>
                      <h3 className="text-base font-bold text-[#14213D] flex items-center gap-2">
                        <TrendingUp size={20} className="text-[#2F6F5E]" />
                        <span>Company Net Operating Cash Position</span>
                      </h3>
                      <p className="text-xs text-[#52607D] mt-0.5">
                        Consolidated Inflow (Govt 55%+45% Funds + Direct Sales) vs Company Cost Outflows
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-semibold text-[#52607D]">Net Cash Balance</div>
                      <div
                        className={`text-2xl font-extrabold font-mono mt-0.5 ${
                          financialOverview.is_positive ? "text-[#2F6F5E]" : "text-rose-600"
                        }`}
                      >
                        ₹{financialOverview.net_operating_cash_position.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 text-center">
                    <div className="bg-emerald-50 p-4 rounded-[10px] border border-emerald-200">
                      <div className="text-xs font-semibold text-emerald-900">Total Cash Inflow</div>
                      <div className="text-xl font-extrabold font-mono text-emerald-950 mt-1">
                        ₹{financialOverview.inflows.grand_total_cash_inflow.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[11px] text-emerald-800 mt-0.5">Govt Funds + Direct Sales</div>
                    </div>

                    <div className="bg-rose-50 p-4 rounded-[10px] border border-rose-200">
                      <div className="text-xs font-semibold text-rose-900">Total Cash Outflow</div>
                      <div className="text-xl font-extrabold font-mono text-rose-950 mt-1">
                        ₹{financialOverview.outflows.grand_total_cash_outflow.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[11px] text-rose-800 mt-0.5">Materials + Opex + Salaries</div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-[10px] border border-blue-200">
                      <div className="text-xs font-semibold text-blue-900">Govt Fund Inflow</div>
                      <div className="text-xl font-extrabold font-mono text-blue-950 mt-1">
                        ₹{financialOverview.inflows.total_govt_fund_received.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[11px] text-blue-800 mt-0.5">
                        55% (₹{financialOverview.inflows.govt_first_fund_55_pct.toLocaleString("en-IN")}) + 45% (₹{financialOverview.inflows.govt_second_fund_45_pct.toLocaleString("en-IN")})
                      </div>
                    </div>

                    <div className="bg-amber-50 p-4 rounded-[10px] border border-amber-200">
                      <div className="text-xs font-semibold text-amber-900">Pending Govt Receivables</div>
                      <div className="text-xl font-extrabold font-mono text-amber-950 mt-1">
                        ₹{financialOverview.inflows.govt_pending_receivable.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[11px] text-amber-800 mt-0.5">From ₹{financialOverview.inflows.govt_total_invoiced.toLocaleString("en-IN")} Invoiced</div>
                    </div>
                  </div>
                </div>

                {/* Side by Side Detailed Inflows vs Outflows Tables */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Inflow Streams */}
                  <div className="bg-white border border-[#E4E1D8] rounded-[12px] p-6 shadow-xs space-y-4">
                    <h4 className="text-sm font-bold text-[#14213D] border-b border-[#EDEAE1] pb-3 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <TrendingUp size={16} className="text-emerald-600" /> Cash Inflows (Revenue)
                      </span>
                      <span className="font-mono font-bold text-emerald-800">
                        ₹{financialOverview.inflows.grand_total_cash_inflow.toLocaleString("en-IN")}
                      </span>
                    </h4>

                    <div className="space-y-3 text-xs">
                      <div className="flex items-center justify-between p-3 bg-[#FAFAF8] rounded-[8px] border border-[#EDEAE1]">
                        <div>
                          <div className="font-bold text-[#14213D]">Government 1st Fund (55% Milestone)</div>
                          <div className="text-[#52607D] text-[11px]">Received on 1st Fund UTR Credited</div>
                        </div>
                        <div className="font-mono font-bold text-emerald-700 text-sm">
                          ₹{financialOverview.inflows.govt_first_fund_55_pct.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-[#FAFAF8] rounded-[8px] border border-[#EDEAE1]">
                        <div>
                          <div className="font-bold text-[#14213D]">Government Final Fund (45% Milestone)</div>
                          <div className="text-[#52607D] text-[11px]">Received on Final Fund UTR Credited</div>
                        </div>
                        <div className="font-mono font-bold text-emerald-700 text-sm">
                          ₹{financialOverview.inflows.govt_second_fund_45_pct.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-[#FAFAF8] rounded-[8px] border border-[#EDEAE1]">
                        <div>
                          <div className="font-bold text-[#14213D]">Direct Commercial Sales Collections</div>
                          <div className="text-[#52607D] text-[11px]">
                            ₹{financialOverview.inflows.direct_sales_invoiced.toLocaleString("en-IN")} Billed
                          </div>
                        </div>
                        <div className="font-mono font-bold text-emerald-700 text-sm">
                          ₹{financialOverview.inflows.direct_sales_received.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Outflow Streams */}
                  <div className="bg-white border border-[#E4E1D8] rounded-[12px] p-6 shadow-xs space-y-4">
                    <h4 className="text-sm font-bold text-[#14213D] border-b border-[#EDEAE1] pb-3 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <TrendingDown size={16} className="text-rose-600" /> Cash Outflows (Costs & Spends)
                      </span>
                      <span className="font-mono font-bold text-rose-800">
                        ₹{financialOverview.outflows.grand_total_cash_outflow.toLocaleString("en-IN")}
                      </span>
                    </h4>

                    <div className="space-y-3 text-xs">
                      <div className="flex items-center justify-between p-3 bg-[#FAFAF8] rounded-[8px] border border-[#EDEAE1]">
                        <div>
                          <div className="font-bold text-[#14213D]">Raw Material Procurement Purchases</div>
                          <div className="text-[#52607D] text-[11px]">Stock Receipts & Supplier Invoices</div>
                        </div>
                        <div className="font-mono font-bold text-rose-700 text-sm">
                          ₹{financialOverview.outflows.raw_materials_procurement.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-[#FAFAF8] rounded-[8px] border border-[#EDEAE1]">
                        <div>
                          <div className="font-bold text-[#14213D]">Operating Expenses (Opex)</div>
                          <div className="text-[#52607D] text-[11px]">Utilities, Rent, Transport & Maintenance</div>
                        </div>
                        <div className="font-mono font-bold text-rose-700 text-sm">
                          ₹{financialOverview.outflows.operating_expenses.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-[#FAFAF8] rounded-[8px] border border-[#EDEAE1]">
                        <div>
                          <div className="font-bold text-[#14213D]">Employee Salaries & Wages</div>
                          <div className="text-[#52607D] text-[11px]">Staff Payroll Paid</div>
                        </div>
                        <div className="font-mono font-bold text-rose-700 text-sm">
                          ₹{financialOverview.outflows.staff_salaries_paid.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-[#FAFAF8] rounded-[8px] border border-[#EDEAE1]">
                        <div>
                          <div className="font-bold text-[#14213D]">Dealer Commission Payouts</div>
                          <div className="text-[#52607D] text-[11px]">
                            ₹{(financialOverview.outflows.dealer_commissions_pending || 0).toLocaleString("en-IN")} Pending
                          </div>
                        </div>
                        <div className="font-mono font-bold text-rose-700 text-sm">
                          ₹{(financialOverview.outflows.dealer_commissions_paid || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-[#FAFAF8] rounded-[8px] border border-[#EDEAE1]">
                        <div>
                          <div className="font-bold text-[#14213D]">Dealer Fittings Cost Payouts</div>
                          <div className="text-[#52607D] text-[11px]">
                            ₹{(financialOverview.outflows.fittings_cost_pending || 0).toLocaleString("en-IN")} Pending
                          </div>
                        </div>
                        <div className="font-mono font-bold text-rose-700 text-sm">
                          ₹{(financialOverview.outflows.fittings_cost_paid || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================== */}
            {/* TAB 2: GOVERNMENT 55% / 45% MILESTONES */}
            {/* ========================================== */}
            {activeTab === "govt_funds" && govtFundsReport && (
              <div className="space-y-6">
                {/* Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-[12px] border border-[#E4E1D8] shadow-xs text-center">
                    <div className="text-xs font-semibold text-[#52607D]">Total Invoiced (100%)</div>
                    <div className="text-xl font-extrabold font-mono text-[#14213D] mt-1">
                      ₹{govtFundsReport.totalInvoicedAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[11px] text-[#8C97AB] mt-0.5">{govtFundsReport.totalProjectsCount} Total Projects</div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-[12px] border border-blue-200 text-center">
                    <div className="text-xs font-semibold text-blue-900">1st Fund (55% Milestone)</div>
                    <div className="text-xl font-extrabold font-mono text-blue-950 mt-1">
                      ₹{govtFundsReport.totalFirstFundReceived.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[11px] text-blue-800 mt-0.5">{govtFundsReport.firstFundProjectsCount} Projects Credited</div>
                  </div>

                  <div className="bg-indigo-50 p-4 rounded-[12px] border border-indigo-200 text-center">
                    <div className="text-xs font-semibold text-indigo-900">Final Fund (45% Milestone)</div>
                    <div className="text-xl font-extrabold font-mono text-indigo-950 mt-1">
                      ₹{govtFundsReport.totalSecondFundReceived.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[11px] text-indigo-800 mt-0.5">{govtFundsReport.finalFundProjectsCount} Projects Completed</div>
                  </div>

                  <div className="bg-emerald-50 p-4 rounded-[12px] border border-emerald-200 text-center">
                    <div className="text-xs font-semibold text-emerald-900">Total Funds Inflow</div>
                    <div className="text-xl font-extrabold font-mono text-emerald-950 mt-1">
                      ₹{govtFundsReport.totalReleasedAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[11px] text-emerald-800 mt-0.5 font-bold">
                      {govtFundsReport.recoveryPercentage}% Recovery Rate
                    </div>
                  </div>
                </div>

                {/* Government Projects Fund Tracking Table */}
                <div className="bg-white border border-[#E4E1D8] rounded-[12px] p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-[#EDEAE1] pb-3">
                    <div>
                      <h4 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
                        <LandPlot size={18} className="text-[#2F6F5E]" />
                        <span>Government Projects Milestone Inflows (55% & 45%)</span>
                      </h4>
                      <p className="text-xs text-[#52607D] mt-0.5">
                        Automatic 55% milestone credited on 1st Fund UTR and 45% on Final Fund UTR
                      </p>
                    </div>
                  </div>

                  <div className="border border-[#EDEAE1] rounded-[10px] overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-[#FAFAF8] border-b border-[#EDEAE1] text-[#52607D] uppercase font-semibold text-[10px] tracking-wider">
                        <tr>
                          <th className="py-3 px-4">Application ID</th>
                          <th className="py-3 px-4">Farmer & Location</th>
                          <th className="py-3 px-4">Current Status</th>
                          <th className="py-3 px-4 text-right">Invoiced (100%)</th>
                          <th className="py-3 px-4 text-right bg-blue-50/40">1st Fund (55%)</th>
                          <th className="py-3 px-4 text-right bg-indigo-50/40">Final Fund (45%)</th>
                          <th className="py-3 px-4 text-right bg-emerald-50/40">Total Inflow</th>
                          <th className="py-3 px-4 text-right">Pending Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EDEAE1]">
                        {govtFundsReport.projects.map((p) => (
                          <tr key={p.id} className="hover:bg-[#F9F8F5]">
                            <td className="py-3 px-4 font-mono font-bold text-[#14213D]">
                              {p.application_id}
                            </td>
                            <td className="py-3 px-4 text-[#52607D]">
                              <div className="font-semibold text-[#14213D]">{p.farmer_name}</div>
                              <div className="text-[11px]">{[p.village, p.district].filter(Boolean).join(", ")}</div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-[11px] font-semibold text-[#14213D] bg-gray-100 px-2 py-0.5 rounded">
                                {p.current_status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-[#14213D]">
                              ₹{p.invoiced_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-blue-900 bg-blue-50/20">
                              ₹{p.first_fund_received.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              {p.first_fund_utr && (
                                <div className="text-[9px] text-blue-700 font-normal">UTR: {p.first_fund_utr}</div>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-indigo-900 bg-indigo-50/20">
                              ₹{p.second_fund_received.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              {p.final_fund_utr && (
                                <div className="text-[9px] text-indigo-700 font-normal">UTR: {p.final_fund_utr}</div>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-emerald-800 bg-emerald-50/20">
                              ₹{p.total_released.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-amber-900 font-semibold">
                              ₹{p.pending_receivable.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================== */}
            {/* TAB 3: RAW MATERIAL PURCHASES & PROCUREMENT */}
            {/* ========================================== */}
            {activeTab === "procurement" && procurementReport && (
              <div className="space-y-6">
                {/* Header & Date Filters */}
                <div className="bg-white border border-[#E4E1D8] rounded-[12px] p-6 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EDEAE1] pb-4">
                    <div>
                      <h4 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
                        <Truck size={18} className="text-[#2F6F5E]" />
                        <span>Raw Material Purchases & Procurement Cost Outflow</span>
                      </h4>
                      <p className="text-xs text-[#52607D] mt-0.5">
                        Track raw material purchases (polymers, masterbatch, components) from supplier stock receipts
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={procStartDate}
                        onChange={(e) => setProcStartDate(e.target.value)}
                        className="px-2.5 py-1.5 text-xs font-mono bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none text-[#14213D]"
                      />
                      <span className="text-xs text-[#52607D]">to</span>
                      <input
                        type="date"
                        value={procEndDate}
                        onChange={(e) => setProcEndDate(e.target.value)}
                        className="px-2.5 py-1.5 text-xs font-mono bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none text-[#14213D]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                    <div className="bg-rose-50 p-4 rounded-[10px] border border-rose-200">
                      <div className="text-xs font-semibold text-rose-900">Total Procurement Cost</div>
                      <div className="text-2xl font-extrabold font-mono text-rose-950 mt-1">
                        ₹{procurementReport.totalProcurementSpend.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[11px] text-rose-800 mt-0.5">Direct Raw Materials Outflow</div>
                    </div>

                    <div className="bg-[#FAFAF8] p-4 rounded-[10px] border border-[#E4E1D8]">
                      <div className="text-xs font-semibold text-[#52607D]">Total Purchase Bills</div>
                      <div className="text-2xl font-extrabold font-mono text-[#14213D] mt-1">
                        {procurementReport.receiptsCount}
                      </div>
                      <div className="text-[11px] text-[#8C97AB] mt-0.5">Stock Receipts Recorded</div>
                    </div>

                    <div className="bg-[#FAFAF8] p-4 rounded-[10px] border border-[#E4E1D8]">
                      <div className="text-xs font-semibold text-[#52607D]">Suppliers Engaged</div>
                      <div className="text-2xl font-extrabold font-mono text-[#14213D] mt-1">
                        {procurementReport.bySupplier.length}
                      </div>
                      <div className="text-[11px] text-[#8C97AB] mt-0.5">Active Vendors</div>
                    </div>
                  </div>
                </div>

                {/* Purchase Receipts Ledger */}
                <div className="bg-white border border-[#E4E1D8] rounded-[12px] p-6 shadow-xs space-y-4">
                  <h4 className="text-sm font-bold text-[#14213D] border-b border-[#EDEAE1] pb-3">
                    Purchase Receipts & Invoices Ledger
                  </h4>

                  {procurementReport.receipts.length === 0 ? (
                    <EmptyState
                      title="No Stock Receipts Recorded"
                      description="Record raw material purchases under Inventory & Materials -> Purchase Receipts."
                    />
                  ) : (
                    <div className="border border-[#EDEAE1] rounded-[10px] overflow-hidden">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-[#FAFAF8] border-b border-[#EDEAE1] text-[#52607D] uppercase font-semibold text-[10px] tracking-wider">
                          <tr>
                            <th className="py-3 px-4">Receipt Date</th>
                            <th className="py-3 px-4">Supplier / Vendor</th>
                            <th className="py-3 px-4">Reference Bill #</th>
                            <th className="py-3 px-4">Materials Purchased</th>
                            <th className="py-3 px-4 text-right">Total Invoice Cost (₹)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#EDEAE1]">
                          {procurementReport.receipts.map((r) => (
                            <tr key={r.id} className="hover:bg-[#F9F8F5]">
                              <td className="py-3 px-4 font-mono font-semibold text-[#14213D]">
                                {formatDate(r.receipt_date)}
                              </td>
                              <td className="py-3 px-4 font-bold text-[#14213D]">
                                {r.supplier_name}
                              </td>
                              <td className="py-3 px-4 font-mono text-[#52607D]">
                                {r.reference_number}
                              </td>
                              <td className="py-3 px-4 text-[#52607D]">
                                {r.items.map((it) => `${it.name} (${it.quantity} ${it.unit})`).join(", ") || "Raw Materials"}
                              </td>
                              <td className="py-3 px-4 text-right font-mono font-bold text-rose-800 text-sm">
                                ₹{r.total_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ========================================== */}
            {/* TAB 4: DEALER PERFORMANCE & COMMISSIONS */}
            {/* ========================================== */}
            {activeTab === "dealers" && (
              <div className="bg-white border border-[#E4E1D8] rounded-[12px] p-6 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EDEAE1] pb-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
                      <Users size={18} className="text-[#2F6F5E]" />
                      <span>Dealer Performance, Commission & Fittings Settlement</span>
                    </h4>
                    <p className="text-xs text-[#52607D]">
                      Track commission accruals, fittings reimbursements, and settlement payouts per dealer.
                    </p>
                  </div>

                  {/* Date Filters */}
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={dealerStartDate}
                      onChange={(e) => setDealerStartDate(e.target.value)}
                      className="px-2.5 py-1.5 text-xs bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] text-[#14213D] focus:outline-none focus:ring-1 focus:ring-[#2F6F5E]"
                    />
                    <span className="text-xs text-[#52607D]">to</span>
                    <input
                      type="date"
                      value={dealerEndDate}
                      onChange={(e) => setDealerEndDate(e.target.value)}
                      className="px-2.5 py-1.5 text-xs bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] text-[#14213D] focus:outline-none focus:ring-1 focus:ring-[#2F6F5E]"
                    />
                    {(dealerStartDate || dealerEndDate) && (
                      <Button
                        size="xs"
                        variant="secondary"
                        onClick={() => {
                          setDealerStartDate("");
                          setDealerEndDate("");
                        }}
                      >
                        Reset
                      </Button>
                    )}
                  </div>
                </div>

                <div className="border border-[#EDEAE1] rounded-[10px] overflow-hidden overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse min-w-[900px]">
                    <thead className="bg-[#FAFAF8] border-b border-[#EDEAE1] text-[#52607D] uppercase font-semibold text-[10px] tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Dealer Name</th>
                        <th className="py-3 px-4 text-center">Comm. Rate</th>
                        <th className="py-3 px-4 text-center">Projects</th>
                        <th className="py-3 px-4 text-right">Subsidy Value</th>
                        <th className="py-3 px-4 text-right">Comm. Paid</th>
                        <th className="py-3 px-4 text-right">Comm. Pending</th>
                        <th className="py-3 px-4 text-right">Fittings Paid</th>
                        <th className="py-3 px-4 text-right">Fittings Pending</th>
                        <th className="py-3 px-4 text-right bg-[#EAF3F0]/50 font-bold text-[#2F6F5E]">Total Paid</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EDEAE1]">
                      {dealerReport.map((d) => (
                        <tr key={d.dealer_id} className="hover:bg-[#F9F8F5]">
                          <td className="py-3 px-4 font-bold text-[#14213D]">{d.dealer_name}</td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-[#2F6F5E]">
                            {d.commission_percentage}%
                          </td>
                          <td className="py-3 px-4 text-center font-mono">{d.total_projects}</td>
                          <td className="py-3 px-4 text-right font-mono font-semibold text-[#14213D]">
                            ₹{d.total_subsidy_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                            ₹{d.commission_paid.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-amber-800">
                            ₹{d.commission_pending.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-purple-700">
                            ₹{(d.fittings_paid || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-purple-900/60">
                            ₹{(d.fittings_pending || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-[#2F6F5E] bg-[#EAF3F0]/30">
                            ₹{(d.total_payout_paid || (d.commission_paid + (d.fittings_paid || 0))).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                      {dealerReport.length === 0 && (
                        <tr>
                          <td colSpan={9} className="py-6 text-center text-xs text-[#52607D]">
                            No dealer commission records found for the selected period.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ========================================== */}
            {/* TAB 5: OPEX & STAFF PAYROLL */}
            {/* ========================================== */}
            {activeTab === "expenses_payroll" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Operating Expenses Breakdown */}
                <div className="bg-white border border-[#E4E1D8] rounded-[12px] p-6 shadow-xs space-y-4">
                  <h4 className="text-sm font-bold text-[#14213D] border-b border-[#EDEAE1] pb-3 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Receipt size={16} className="text-[#2F6F5E]" /> Operating Expenses (Opex)
                    </span>
                    <span className="font-mono font-bold text-rose-800">
                      ₹{expenseReport.totalExpenses.toLocaleString("en-IN")}
                    </span>
                  </h4>

                  <div className="space-y-3">
                    {expenseReport.byCategory.map((cat, idx) => (
                      <div key={idx} className="p-3 bg-[#FAFAF8] rounded-[8px] border border-[#EDEAE1] flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#14213D]">{cat.category}</span>
                        <span className="font-mono font-bold text-[#14213D]">
                          ₹{cat.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })} ({cat.percentage}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Staff Salaries */}
                <div className="bg-white border border-[#E4E1D8] rounded-[12px] p-6 shadow-xs space-y-4">
                  <h4 className="text-sm font-bold text-[#14213D] border-b border-[#EDEAE1] pb-3 flex items-center gap-2">
                    <DollarSign size={16} className="text-[#2F6F5E]" /> Staff & Employee Payroll Summary
                  </h4>

                  <div className="border border-[#EDEAE1] rounded-[8px] overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-[#FAFAF8] border-b border-[#EDEAE1] text-[#52607D] text-[10px] uppercase font-semibold">
                        <tr>
                          <th className="py-2.5 px-3">Employee</th>
                          <th className="py-2.5 px-3">Designation</th>
                          <th className="py-2.5 px-3 text-right">Net Salary</th>
                          <th className="py-2.5 px-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EDEAE1]">
                        {employeeReport.map((emp) => (
                          <tr key={emp.employee_id} className="hover:bg-[#F9F8F5]">
                            <td className="py-2.5 px-3 font-bold text-[#14213D]">{emp.name}</td>
                            <td className="py-2.5 px-3 text-[#52607D]">{emp.designation}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-[#14213D]">
                              ₹{emp.net_salary.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  emp.salary_status === "PAID"
                                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                    : "bg-amber-50 text-amber-800 border border-amber-200"
                                }`}
                              >
                                {emp.salary_status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default ReportsPage;
