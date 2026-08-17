import React, { useEffect, useState } from "react";
import {
  Users,
  Plus,
  Edit2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  DollarSign,
  UserCheck,
  Check,
  AlertCircle,
} from "lucide-react";
import api from "../api/client.js";
import Navbar from "../components/layout/Navbar.jsx";
import MetricCard from "../components/common/MetricCard.jsx";
import Button from "../components/common/Button.jsx";
import Modal from "../components/common/Modal.jsx";
import { SkeletonLoader, EmptyState } from "../components/common/SkeletonLoader.jsx";

export function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("employees"); // 'employees' | 'attendance'

  // Employee Modal
  const [empModalOpen, setEmpModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState(null);
  const [name, setName] = useState("");
  const [designation, setDesignation] = useState("");
  const [salary, setSalary] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [savingEmp, setSavingEmp] = useState(false);
  const [empError, setEmpError] = useState("");

  // Daily Bulk Attendance Sheet Modal
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkDate, setBulkDate] = useState(new Date().toISOString().split("T")[0]);
  const [bulkRows, setBulkRows] = useState([]);
  const [savingBulk, setSavingBulk] = useState(false);
  const [bulkError, setBulkError] = useState("");
  const [bulkSuccess, setBulkSuccess] = useState("");

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const params = search ? { search: search.trim() } : {};
      const [empRes, attRes] = await Promise.all([
        api.get("/employees", { params }),
        api.get("/employees/attendance"),
      ]);
      setEmployees(empRes.data?.employees || []);
      setAttendances(attRes.data?.attendance || []);
    } catch (err) {
      console.error("Failed to load employee data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEmployees();
    }, 280);
    return () => clearTimeout(timer);
  }, [search]);

  const handleOpenAddEmp = () => {
    setEditingEmp(null);
    setName("");
    setDesignation("");
    setSalary("");
    setIsActive(true);
    setEmpError("");
    setEmpModalOpen(true);
  };

  const handleOpenEditEmp = (emp) => {
    setEditingEmp(emp);
    setName(emp.name);
    setDesignation(emp.designation);
    setSalary(emp.salary !== undefined && emp.salary !== null ? String(emp.salary) : "");
    setIsActive(emp.is_active);
    setEmpError("");
    setEmpModalOpen(true);
  };

  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    if (!name.trim() || !designation.trim()) {
      setEmpError("Name and designation are required.");
      return;
    }

    try {
      setSavingEmp(true);
      setEmpError("");

      const payload = {
        name: name.trim(),
        designation: designation.trim(),
        salary: salary !== "" ? parseFloat(salary) : 0,
        is_active: isActive,
      };

      if (editingEmp) {
        await api.patch(`/employees/${editingEmp.id}`, payload);
      } else {
        await api.post("/employees", payload);
      }

      setEmpModalOpen(false);
      fetchEmployees();
    } catch (err) {
      setEmpError(err.response?.data?.message || err.message || "Failed to save employee.");
    } finally {
      setSavingEmp(false);
    }
  };

  // Open Daily Attendance Sheet
  const handleOpenDailySheet = (customDate = bulkDate) => {
    const activeStaff = employees.filter((e) => e.is_active);
    const existingDateAtt = attendances.filter((a) => a.attendance_date === customDate);

    const rows = activeStaff.map((emp) => {
      const existing = existingDateAtt.find((a) => a.employee_id === emp.id);
      return {
        employee_id: emp.id,
        name: emp.name,
        designation: emp.designation,
        status: existing ? existing.status : "PRESENT",
        notes: existing ? existing.notes || "" : "",
      };
    });

    setBulkRows(rows);
    setBulkDate(customDate);
    setBulkError("");
    setBulkSuccess("");
    setBulkModalOpen(true);
  };

  // Update Single Employee Status in Bulk Sheet
  const updateBulkStatus = (employeeId, status) => {
    setBulkRows((prev) =>
      prev.map((row) => (row.employee_id === employeeId ? { ...row, status } : row))
    );
  };

  // Update Single Employee Note in Bulk Sheet
  const updateBulkNote = (employeeId, notes) => {
    setBulkRows((prev) =>
      prev.map((row) => (row.employee_id === employeeId ? { ...row, notes } : row))
    );
  };

  // Quick Action: Mark All Present
  const markAllAs = (status) => {
    setBulkRows((prev) => prev.map((row) => ({ ...row, status })));
  };

  // Save Daily Bulk Attendance
  const handleSaveBulkAttendance = async (e) => {
    e.preventDefault();
    if (bulkRows.length === 0) {
      setBulkError("No active employees found to mark attendance.");
      return;
    }

    try {
      setSavingBulk(true);
      setBulkError("");

      const payload = {
        attendance_date: bulkDate,
        records: bulkRows.map((r) => ({
          employee_id: r.employee_id,
          status: r.status,
          notes: r.notes ? r.notes.trim() : null,
        })),
      };

      await api.post("/employees/attendance/bulk", payload);

      setBulkSuccess(`Successfully saved attendance for ${bulkRows.length} staff!`);
      setTimeout(() => {
        setBulkModalOpen(false);
        fetchEmployees();
      }, 700);
    } catch (err) {
      setBulkError(err.response?.data?.message || err.message || "Failed to save bulk attendance.");
    } finally {
      setSavingBulk(false);
    }
  };

  // Count summaries in modal
  const countPresent = bulkRows.filter((r) => r.status === "PRESENT").length;
  const countAbsent = bulkRows.filter((r) => r.status === "ABSENT").length;
  const countHalfDay = bulkRows.filter((r) => r.status === "HALF_DAY").length;
  const countLeave = bulkRows.filter((r) => r.status === "LEAVE").length;

  const totalMonthlyPayroll = employees
    .filter((e) => e.is_active)
    .reduce((acc, curr) => acc + (parseFloat(curr.salary) || 0), 0);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#FAFAF8] min-h-screen">
      <Navbar
        title="Staff & Daily Attendance"
        subtitle="Manage factory staff, operators, and daily 1-click attendance sheet"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              onClick={fetchEmployees}
              loading={loading}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={UserCheck}
              onClick={() => handleOpenDailySheet()}
            >
              Mark Daily Attendance
            </Button>
            <Button size="sm" icon={Plus} onClick={handleOpenAddEmp}>
              New Employee
            </Button>
          </div>
        }
      />

      <main className="p-8 space-y-6 flex-1 overflow-y-auto">
        {/* KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricCard
            title="Total Active Staff"
            value={employees.filter((e) => e.is_active).length}
            subtitle={`${employees.length} registered total`}
            icon={Users}
          />
          <MetricCard
            title="Monthly Payroll Commitment"
            value={`₹${totalMonthlyPayroll.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
            subtitle="Combined base salaries"
            icon={DollarSign}
          />
          <MetricCard
            title="Attendance Logs"
            value={attendances.length}
            subtitle="Recorded entries"
            icon={Calendar}
          />
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center justify-between border-b border-[#E4E1D8] pb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("employees")}
              className={`px-3 py-1.5 text-xs font-bold rounded-[6px] transition-colors cursor-pointer ${
                activeTab === "employees"
                  ? "bg-[#2F6F5E] text-white"
                  : "text-[#52607D] hover:bg-[#FAFAF8]"
              }`}
            >
              Staff Directory ({employees.length})
            </button>
            <button
              onClick={() => setActiveTab("attendance")}
              className={`px-3 py-1.5 text-xs font-bold rounded-[6px] transition-colors cursor-pointer ${
                activeTab === "attendance"
                  ? "bg-[#2F6F5E] text-white"
                  : "text-[#52607D] hover:bg-[#FAFAF8]"
              }`}
            >
              Attendance History ({attendances.length})
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            icon={UserCheck}
            onClick={() => handleOpenDailySheet()}
            className="text-[#2F6F5E] border-[#2F6F5E]/30 hover:bg-[#EAF3F0]"
          >
            Open Daily Attendance Sheet
          </Button>
        </div>

        {activeTab === "employees" ? (
          /* Employees Table */
          <div className="bg-white border border-[#E4E1D8] rounded-[10px] shadow-[0_1px_2px_rgba(20,33,61,0.04)] overflow-hidden">
            {loading ? (
              <div className="p-6">
                <SkeletonLoader rows={6} />
              </div>
            ) : employees.length === 0 ? (
              <EmptyState
                title="No employees registered"
                description="Add machine operators, supervisors, and administrative team members."
                action={
                  <Button size="sm" icon={Plus} onClick={handleOpenAddEmp}>
                    Add Employee
                  </Button>
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAFAF8] border-b border-[#E4E1D8] text-[#52607D] uppercase font-semibold">
                    <tr>
                      <th className="py-3 px-4">Employee Name</th>
                      <th className="py-3 px-4">Designation / Role</th>
                      <th className="py-3 px-4 text-right">Salary (₹)</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDEAE1]">
                    {employees.map((emp) => (
                      <tr key={emp.id} className="hover:bg-[#FAFAF8] transition-colors">
                        <td className="py-3 px-4 font-semibold text-[#14213D] flex items-center gap-2">
                          <Users size={14} className="text-[#2F6F5E]" />
                          {emp.name}
                        </td>
                        <td className="py-3 px-4 text-[#52607D]">
                          {emp.designation}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-sm text-[#14213D]">
                          ₹{parseFloat(emp.salary).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4">
                          {emp.is_active ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                              <CheckCircle2 size={12} /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                              <XCircle size={12} /> Inactive
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <Button
                            variant="secondary"
                            size="xs"
                            icon={Edit2}
                            onClick={() => handleOpenEditEmp(emp)}
                          >
                            Edit
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          /* Attendance Logs Table */
          <div className="bg-white border border-[#E4E1D8] rounded-[10px] shadow-[0_1px_2px_rgba(20,33,61,0.04)] overflow-hidden">
            {attendances.length === 0 ? (
              <EmptyState
                title="No attendance logged"
                description="Click 'Mark Daily Attendance' to record daily staff check-ins."
                action={
                  <Button size="sm" icon={UserCheck} onClick={() => handleOpenDailySheet()}>
                    Mark Daily Attendance
                  </Button>
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAFAF8] border-b border-[#E4E1D8] text-[#52607D] uppercase font-semibold">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Employee</th>
                      <th className="py-3 px-4">Designation</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDEAE1]">
                    {attendances.map((att) => (
                      <tr key={att.id} className="hover:bg-[#FAFAF8] transition-colors">
                        <td className="py-3 px-4 font-mono text-[#52607D] flex items-center gap-1.5">
                          <Calendar size={12} className="text-[#2F6F5E]" />
                          {att.attendance_date}
                        </td>
                        <td className="py-3 px-4 font-semibold text-[#14213D]">
                          {att.employee?.name || "Staff"}
                        </td>
                        <td className="py-3 px-4 text-[#52607D]">
                          {att.employee?.designation || "—"}
                        </td>
                        <td className="py-3 px-4">
                          {att.status === "PRESENT" && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                              <CheckCircle2 size={12} /> Present
                            </span>
                          )}
                          {att.status === "ABSENT" && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                              <XCircle size={12} /> Absent
                            </span>
                          )}
                          {att.status === "HALF_DAY" && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                              <Clock size={12} /> Half Day
                            </span>
                          )}
                          {att.status === "LEAVE" && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                              <Calendar size={12} /> Leave
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-[#52607D] font-mono">
                          {att.notes || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Add / Edit Employee Modal */}
      <Modal
        isOpen={empModalOpen}
        onClose={() => setEmpModalOpen(false)}
        title={editingEmp ? "Edit Employee Details" : "Register New Employee"}
      >
        <form onSubmit={handleSaveEmployee} className="space-y-4">
          {empError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-[8px]">
              {empError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#14213D] mb-1">
              Employee Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Ramesh Kumar, Murugan S"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#14213D] mb-1">
              Designation / Role <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Extruder Operator, Quality Inspector, Accountant"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#14213D] mb-1">
              Salary (₹)
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="e.g. 25000"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono font-bold bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="empActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="accent-[#2F6F5E] rounded"
            />
            <label htmlFor="empActive" className="text-xs text-[#14213D] font-medium cursor-pointer">
              Active employee
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-[#EDEAE1]">
            <Button variant="secondary" type="button" onClick={() => setEmpModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={savingEmp}>
              {editingEmp ? "Save Changes" : "Create Employee"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Daily Bulk Attendance Sheet Modal */}
      <Modal
        isOpen={bulkModalOpen}
        onClose={() => !savingBulk && setBulkModalOpen(false)}
        title="Daily Staff Attendance Sheet"
        maxWidth="max-w-4xl"
      >
        <form onSubmit={handleSaveBulkAttendance} className="space-y-4">
          {bulkError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-[8px] flex items-center gap-2">
              <AlertCircle size={15} />
              <span>{bulkError}</span>
            </div>
          )}

          {bulkSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-[8px] flex items-center gap-2">
              <Check size={15} />
              <span>{bulkSuccess}</span>
            </div>
          )}

          {/* Top Control Bar: Date & Status Summary */}
          <div className="bg-[#FAFAF8] p-3.5 rounded-[10px] border border-[#E4E1D8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-[#14213D] whitespace-nowrap">
                Attendance Date:
              </label>
              <input
                type="date"
                value={bulkDate}
                onChange={(e) => handleOpenDailySheet(e.target.value)}
                className="px-3 py-1.5 text-xs font-mono font-medium bg-white border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
                required
              />
            </div>

            {/* Attendance Status Counts Badges */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-full bg-[#EAF3F0] text-[#2F6F5E] font-bold">
                Present: {countPresent}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-[#FDF2F1] text-[#B0403A] font-bold">
                Absent: {countAbsent}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-[#FDF8EC] text-[#B8860B] font-bold">
                Half Day: {countHalfDay}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-bold">
                Leave: {countLeave}
              </span>
            </div>
          </div>

          {/* Bulk Staff Attendance List */}
          <div className="border border-[#E4E1D8] rounded-[10px] overflow-hidden max-h-[420px] overflow-y-auto">
            {bulkRows.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#52607D]">
                No active staff found in directory.
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#FAFAF8] border-b border-[#E4E1D8] text-[#52607D] font-semibold sticky top-0 z-10">
                  <tr>
                    <th className="py-2.5 px-4 w-10">#</th>
                    <th className="py-2.5 px-4">Staff Name & Designation</th>
                    <th className="py-2.5 px-4 text-center">Attendance Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDEAE1]">
                  {bulkRows.map((row, idx) => (
                    <tr key={row.employee_id} className="hover:bg-[#FAFAF8] transition-colors">
                      <td className="py-3 px-4 font-mono text-[#52607D]">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#14213D]">{row.name}</div>
                        <div className="text-[11px] text-[#52607D]">{row.designation}</div>
                      </td>
                      <td className="py-3 px-4">
                        {/* 4 Status Choice Pills */}
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => updateBulkStatus(row.employee_id, "PRESENT")}
                            className={`px-3 py-1.5 rounded-[6px] text-xs font-bold transition-all cursor-pointer ${
                              row.status === "PRESENT"
                                ? "bg-[#2F6F5E] text-white shadow-sm"
                                : "bg-white border border-[#E4E1D8] text-[#52607D] hover:bg-[#EAF3F0] hover:text-[#2F6F5E]"
                            }`}
                          >
                            Present
                          </button>
                          <button
                            type="button"
                            onClick={() => updateBulkStatus(row.employee_id, "ABSENT")}
                            className={`px-3 py-1.5 rounded-[6px] text-xs font-bold transition-all cursor-pointer ${
                              row.status === "ABSENT"
                                ? "bg-[#B0403A] text-white shadow-sm"
                                : "bg-white border border-[#E4E1D8] text-[#52607D] hover:bg-[#FDF2F1] hover:text-[#B0403A]"
                            }`}
                          >
                            Absent
                          </button>
                          <button
                            type="button"
                            onClick={() => updateBulkStatus(row.employee_id, "HALF_DAY")}
                            className={`px-3 py-1.5 rounded-[6px] text-xs font-bold transition-all cursor-pointer ${
                              row.status === "HALF_DAY"
                                ? "bg-[#B8860B] text-white shadow-sm"
                                : "bg-white border border-[#E4E1D8] text-[#52607D] hover:bg-[#FDF8EC] hover:text-[#B8860B]"
                            }`}
                          >
                            Half Day
                          </button>
                          <button
                            type="button"
                            onClick={() => updateBulkStatus(row.employee_id, "LEAVE")}
                            className={`px-3 py-1.5 rounded-[6px] text-xs font-bold transition-all cursor-pointer ${
                              row.status === "LEAVE"
                                ? "bg-blue-700 text-white shadow-sm"
                                : "bg-white border border-[#E4E1D8] text-[#52607D] hover:bg-blue-50 hover:text-blue-700"
                            }`}
                          >
                            Leave
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#EDEAE1]">
            <div className="text-xs text-[#52607D]">
              Recording for <strong className="text-[#14213D]">{bulkRows.length} active staff</strong> on {bulkDate}
            </div>
            <div className="flex items-center gap-2 justify-end">
              <Button
                variant="secondary"
                type="button"
                onClick={() => setBulkModalOpen(false)}
                disabled={savingBulk}
              >
                Cancel
              </Button>
              <Button type="submit" loading={savingBulk}>
                Save Daily Attendance ({bulkRows.length} Staff)
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default EmployeesPage;
