import React, { useEffect, useState } from "react";
import {
  DollarSign,
  RefreshCw,
  CheckCircle,
  Clock,
  User,
  Check,
  SlidersHorizontal,
} from "lucide-react";
import api from "../api/client.js";
import Navbar from "../components/layout/Navbar.jsx";
import MetricCard from "../components/common/MetricCard.jsx";
import Button from "../components/common/Button.jsx";
import CustomSelect from "../components/common/CustomSelect.jsx";
import Modal from "../components/common/Modal.jsx";
import { SkeletonLoader, EmptyState } from "../components/common/SkeletonLoader.jsx";
import { formatDate } from "../utils/dates.js";

const MONTH_NAMES = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const YEAR_OPTIONS = [2024, 2025, 2026, 2027, 2028].map((y) => ({
  value: y,
  label: String(y),
}));

export function SalaryPage() {
  const [salaryRecords, setSalaryRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingBulk, setPayingBulk] = useState(false);

  // Filters
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Adjust / Edit Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [baseSalary, setBaseSalary] = useState("");
  const [adjustments, setAdjustments] = useState("");
  const [deductions, setDeductions] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const selectedMonthObj = MONTH_NAMES.find((m) => m.value === selectedMonth);
  const monthName = selectedMonthObj ? selectedMonthObj.label : `Month ${selectedMonth}`;

  const fetchPayrollData = async () => {
    try {
      setLoading(true);
      const [empRes, salRes] = await Promise.all([
        api.get("/employees?is_active=true"),
        api.get("/employees/salary", {
          params: { month: selectedMonth, year: selectedYear },
        }),
      ]);
      setEmployees(empRes.data?.employees || []);
      setSalaryRecords(salRes.data?.records || []);
    } catch (err) {
      console.error("Failed to load payroll data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrollData();
  }, [selectedMonth, selectedYear]);

  // Combine Active Employees with existing salary records for the selected month
  const activeStaff = employees.filter((e) => e.is_active);
  const payrollRows = activeStaff.map((emp) => {
    const existingRecord = salaryRecords.find((s) => s.employee_id === emp.id);
    if (existingRecord) {
      return {
        employee: emp,
        record: existingRecord,
        base_salary: parseFloat(existingRecord.base_salary || 0),
        adjustments: parseFloat(existingRecord.adjustments || 0),
        deductions: parseFloat(existingRecord.deductions || 0),
        net_salary: parseFloat(existingRecord.net_salary || 0),
        status: existingRecord.status,
        paid_date: existingRecord.paid_date,
      };
    }
    const defaultSalary = parseFloat(emp.salary || 0);
    return {
      employee: emp,
      record: null,
      base_salary: defaultSalary,
      adjustments: 0,
      deductions: 0,
      net_salary: defaultSalary,
      status: "UNPAID",
      paid_date: null,
    };
  });

  const unpaidRows = payrollRows.filter((r) => r.status !== "PAID");
  const paidRows = payrollRows.filter((r) => r.status === "PAID");

  const totalPayrollMonth = payrollRows.reduce((acc, curr) => acc + curr.net_salary, 0);
  const totalPaidMonth = paidRows.reduce((acc, curr) => acc + curr.net_salary, 0);
  const totalPendingMonth = totalPayrollMonth - totalPaidMonth;

  // Mark Individual Employee as Paid
  const handleMarkPaid = async (row) => {
    try {
      if (row.record) {
        await api.patch(`/employees/salary/${row.record.id}`, {
          status: "PAID",
          paid_date: new Date().toISOString().split("T")[0],
        });
      } else {
        await api.post("/employees/salary", {
          employee_id: row.employee.id,
          salary_month: selectedMonth,
          salary_year: selectedYear,
          base_salary: row.base_salary,
          adjustments: 0,
          deductions: 0,
          status: "PAID",
          paid_date: new Date().toISOString().split("T")[0],
        });
      }
      fetchPayrollData();
    } catch (err) {
      console.error("Failed to mark employee paid:", err);
    }
  };

  // Bulk Pay All Unpaid Staff for Selected Month
  const handlePayAll = async () => {
    if (unpaidRows.length === 0) return;
    try {
      setPayingBulk(true);
      await api.post("/employees/salary/bulk-pay", {
        salary_month: selectedMonth,
        salary_year: selectedYear,
      });
      fetchPayrollData();
    } catch (err) {
      console.error("Failed to bulk pay salaries:", err);
    } finally {
      setPayingBulk(false);
    }
  };

  // Open Pay Modal for a specific employee
  const handleOpenPayModal = (row) => {
    setSelectedEmp(row);
    setBaseSalary(String(row.base_salary || ""));
    setAdjustments(row.adjustments !== 0 ? String(row.adjustments) : "");
    setDeductions(row.deductions !== 0 ? String(row.deductions) : "");
    setErrorMsg("");
    setModalOpen(true);
  };

  const netSalaryPreview =
    (parseFloat(baseSalary) || 0) + (parseFloat(adjustments) || 0) - (parseFloat(deductions) || 0);

  const handleConfirmPaySalary = async (e) => {
    e.preventDefault();
    if (!selectedEmp) return;

    try {
      setSaving(true);
      setErrorMsg("");

      await api.post("/employees/salary", {
        employee_id: selectedEmp.employee.id,
        salary_month: selectedMonth,
        salary_year: selectedYear,
        base_salary: parseFloat(baseSalary) || 0,
        adjustments: parseFloat(adjustments) || 0,
        deductions: parseFloat(deductions) || 0,
        status: "PAID",
        paid_date: new Date().toISOString().split("T")[0],
      });

      setModalOpen(false);
      fetchPayrollData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to process salary payment.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#FAFAF8] min-h-screen">
      <Navbar
        title="Payroll & Salary Records"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              onClick={fetchPayrollData}
              loading={loading}
            >
              Refresh
            </Button>
            {unpaidRows.length > 0 && (
              <Button
                variant="primary"
                size="sm"
                icon={Check}
                onClick={handlePayAll}
                loading={payingBulk}
              >
                Disburse
              </Button>
            )}
          </div>
        }
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 overflow-y-auto">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <MetricCard
            title="Total Payroll Amount"
            value={`₹${(Number(totalPayrollMonth) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
            subtitle={`Net wages for ${monthName} ${selectedYear}`}
            icon={DollarSign}
          />
          <MetricCard
            title="Disbursed / Paid"
            value={`₹${(Number(totalPaidMonth) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
            subtitle={`${paidRows.length} staff completed`}
            icon={CheckCircle}
          />
          <MetricCard
            title="Pending / Unpaid"
            value={`₹${(Number(totalPendingMonth) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
            subtitle={`${unpaidRows.length} staff pending`}
            icon={Clock}
          />
        </div>

        {/* Filter Strip */}
        <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-4 shadow-[0_1px_2px_rgba(20,33,61,0.04)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="text-xs font-bold text-[#14213D] whitespace-nowrap">Month / Year:</div>
            <div className="w-36">
              <CustomSelect
                options={MONTH_NAMES}
                value={selectedMonth}
                onChange={(val) => setSelectedMonth(Number(val))}
                placeholder="Select Month"
                size="sm"
              />
            </div>
            <div className="w-28">
              <CustomSelect
                options={YEAR_OPTIONS}
                value={selectedYear}
                onChange={(val) => setSelectedYear(Number(val))}
                placeholder="Select Year"
                size="sm"
              />
            </div>
          </div>

          <div className="text-xs text-[#52607D]">
            Total Active Staff: <strong className="text-[#14213D]">{payrollRows.length}</strong> | Paid: <strong className="text-emerald-700">{paidRows.length}</strong> | Unpaid: <strong className="text-amber-700">{unpaidRows.length}</strong>
          </div>
        </div>

        {/* Salary Records Table */}
        <div className="bg-white border border-[#E4E1D8] rounded-[10px] shadow-[0_1px_2px_rgba(20,33,61,0.04)] overflow-hidden">
          {loading ? (
            <div className="p-6">
              <SkeletonLoader rows={6} />
            </div>
          ) : payrollRows.length === 0 ? (
            <EmptyState
              title="No active staff found"
              description="Register active employees in Staff Directory to generate payroll."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAFAF8] border-b border-[#E4E1D8] text-[#52607D] uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Designation</th>
                    <th className="py-3 px-4 text-right">Salary (₹)</th>
                    <th className="py-3 px-4 text-right">Adjustments / OT</th>
                    <th className="py-3 px-4 text-right">Deductions</th>
                    <th className="py-3 px-4 text-right">Net Payable</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDEAE1]">
                  {payrollRows.map((row) => (
                    <tr key={row.employee.id} className="hover:bg-[#FAFAF8] transition-colors">
                      <td className="py-3 px-4 font-semibold text-[#14213D] flex items-center gap-2">
                        <User size={13} className="text-[#2F6F5E]" />
                        {row.employee.name}
                      </td>
                      <td className="py-3 px-4 text-[#52607D]">
                        {row.employee.designation || "—"}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[#14213D] font-medium">
                        ₹{(Number(row.base_salary) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-700">
                        {row.adjustments > 0
                          ? `+₹${(Number(row.adjustments) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                          : "—"}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-rose-700">
                        {row.deductions > 0
                          ? `-₹${(Number(row.deductions) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                          : "—"}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-sm text-[#2F6F5E]">
                        ₹{(Number(row.net_salary) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4">
                        {row.status === "PAID" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-mono">
                            <CheckCircle size={12} /> Paid ({row.paid_date ? formatDate(row.paid_date) : "Yes"})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                            <Clock size={12} /> Unpaid
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {row.status !== "PAID" ? (
                          <Button
                            variant="primary"
                            size="sm"
                            icon={Check}
                            onClick={() => handleOpenPayModal(row)}
                          >
                            Pay
                          </Button>
                        ) : (
                          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-[6px]">
                            Disbursed
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Pay Salary Modal with Adjustments */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Pay Salary: ${selectedEmp?.employee.name} (${monthName} ${selectedYear})`}
      >
        <form onSubmit={handleConfirmPaySalary} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-[8px]">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#14213D] mb-1">
                Salary (₹)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="e.g. 25000"
                value={baseSalary}
                onChange={(e) => setBaseSalary(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#14213D] mb-1">
                Adjustments / OT (₹)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={adjustments}
                onChange={(e) => setAdjustments(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono text-emerald-700 bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#14213D] mb-1">
                Deductions (₹)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={deductions}
                onChange={(e) => setDeductions(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono text-rose-700 bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E]"
              />
            </div>
          </div>

          <div className="p-3 bg-[#FAFAF8] border border-[#EDEAE1] rounded-[8px] flex items-center justify-between text-xs">
            <span className="font-semibold text-[#52607D]">Total Net Payable:</span>
            <strong className="font-mono text-base font-bold text-[#2F6F5E]">
              ₹{(Number(netSalaryPreview) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </strong>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-[#EDEAE1]">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Confirm
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default SalaryPage;
