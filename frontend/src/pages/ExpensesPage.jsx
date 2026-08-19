import React, { useEffect, useState } from "react";
import {
  Receipt,
  Plus,
  RefreshCw,
  Tag,
  CreditCard,
  Calendar,
  Layers,
  ArrowUpRight,
  Trash2,
} from "lucide-react";
import api from "../api/client.js";
import Navbar from "../components/layout/Navbar.jsx";
import MetricCard from "../components/common/MetricCard.jsx";
import Button from "../components/common/Button.jsx";
import CustomSelect from "../components/common/CustomSelect.jsx";
import Modal from "../components/common/Modal.jsx";
import Pagination from "../components/common/Pagination.jsx";
import { SkeletonLoader, EmptyState } from "../components/common/SkeletonLoader.jsx";
import { formatDate } from "../utils/dates.js";

export function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 1 });

  // Filters
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  // Add Expense Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0]);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("BANK_TRANSFER");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Categories Modal
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [savingCat, setSavingCat] = useState(false);
  const [catError, setCatError] = useState("");

  const fetchCategories = async () => {
    try {
      const res = await api.get("/expenses/categories");
      setCategories(res.data?.categories || []);
      if (!categoryId && res.data?.categories?.length > 0) {
        setCategoryId(res.data.categories[0].id);
      }
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  };

  const fetchExpenses = async (page = 1, limit = pagination.limit) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
        ...(search ? { search: search.trim() } : {}),
        ...(selectedCategory ? { category_id: selectedCategory } : {}),
      };
      const res = await api.get("/expenses", { params });
      setExpenses(res.data?.expenses || []);
      setTotalAmount(res.data?.totalExpenseAmount || 0);
      setPagination(res.data?.pagination || { page, limit, total: 0, totalPages: 1 });
    } catch (err) {
      console.error("Failed to load expenses:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchExpenses(1, pagination.limit);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchExpenses(1, pagination.limit);
    }, 280);
    return () => clearTimeout(timer);
  }, [search, selectedCategory]);

  const handleOpenAdd = () => {
    setCategoryId(categories.length > 0 ? categories[0].id : "");
    setExpenseDate(new Date().toISOString().split("T")[0]);
    setAmount("");
    setDescription("");
    setPaymentMethod("BANK_TRANSFER");
    setReference("");
    setNotes("");
    setErrorMsg("");
    setModalOpen(true);
  };

  const handleSaveExpense = async (e) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      setErrorMsg("Please enter a valid expense amount.");
      return;
    }

    try {
      setSaving(true);
      setErrorMsg("");

      await api.post("/expenses", {
        category_id: categoryId,
        expense_date: expenseDate,
        amount: amt,
        description: description.trim() || null,
        payment_method: paymentMethod,
        reference: reference.trim() || null,
        notes: notes.trim() || null,
      });

      setModalOpen(false);
      fetchExpenses(1, pagination.limit);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to log expense.");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      setCatError("Category name is required.");
      return;
    }

    try {
      setSavingCat(true);
      setCatError("");
      const res = await api.post("/expenses/categories", { name: newCatName.trim() });
      setNewCatName("");
      await fetchCategories();
      if (res.data?.data?.category?.id) {
        setCategoryId(res.data.data.category.id);
      }
    } catch (err) {
      setCatError(err.response?.data?.message || "Failed to create category.");
    } finally {
      setSavingCat(false);
    }
  };

  const handleDeleteCategory = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete category "${name}"?`)) {
      return;
    }
    try {
      setCatError("");
      await api.delete(`/expenses/categories/${id}`);
      if (categoryId === id) setCategoryId("");
      if (selectedCategory === id) setSelectedCategory("");
      fetchCategories();
    } catch (err) {
      setCatError(err.response?.data?.message || "Failed to delete category.");
    }
  };

  const categoryFilterOptions = [
    { value: "", label: "All Categories" },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ];

  const categorySelectOptions = categories.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Navbar
        title="Operating Expenses"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" icon={Tag} onClick={() => setCatModalOpen(true)}>
              Categories
            </Button>
            <Button variant="secondary" icon={RefreshCw} onClick={() => fetchExpenses(pagination.page, pagination.limit)}>
              Refresh
            </Button>
            <Button icon={Plus} onClick={handleOpenAdd}>
              Add
            </Button>
          </div>
        }
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 overflow-y-auto">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <MetricCard
            title="Total Expenses Logged"
            value={`₹${(Number(totalAmount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            subtitle="Matching current filters"
            icon={Receipt}
          />
          <MetricCard
            title="Expense Categories"
            value={categories.length}
            subtitle="Active expense heads"
            icon={Tag}
          />
          <MetricCard
            title="Transactions"
            value={pagination.total}
            subtitle="Total expense records"
            icon={Layers}
          />
        </div>

        {/* Filter Strip */}
        <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-4 shadow-[0_1px_2px_rgba(20,33,61,0.04)] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search expenses by description, ref..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-80 px-3 py-2 text-xs bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
            />

            <div className="w-48">
              <CustomSelect
                options={categoryFilterOptions}
                value={selectedCategory}
                onChange={(val) => setSelectedCategory(val)}
                placeholder="All Categories"
              />
            </div>
          </div>

          <div className="text-xs text-[#52607D]">
            Total: <strong className="text-[#14213D]">{pagination.total}</strong> records
          </div>
        </div>

        {/* Expenses Table */}
        <div className="bg-white border border-[#E4E1D8] rounded-[10px] shadow-[0_1px_2px_rgba(20,33,61,0.04)] overflow-hidden">
          {loading ? (
            <div className="p-6">
              <SkeletonLoader rows={8} />
            </div>
          ) : expenses.length === 0 ? (
            <EmptyState
              title="No expenses recorded"
              description="Log factory bills, electricity, logistics, or maintenance expenses."
              action={
                <Button size="sm" icon={Plus} onClick={handleOpenAdd}>
                  Log Expense
                </Button>
              }
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAFAF8] border-b border-[#E4E1D8] text-[#52607D] uppercase font-semibold">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4">Payment Method</th>
                      <th className="py-3 px-4">Reference</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDEAE1]">
                    {expenses.map((e) => (
                      <tr key={e.id} className="hover:bg-[#FAFAF8] transition-colors">
                        <td className="py-3 px-4 font-mono text-[#52607D] flex items-center gap-1.5">
                          <Calendar size={12} className="text-[#2F6F5E]" />
                          {formatDate(e.expense_date)}
                        </td>
                        <td className="py-3 px-4 font-semibold text-[#14213D]">
                          <span className="px-2 py-0.5 rounded-full text-[11px] bg-[#EAF3F0] text-[#2F6F5E]">
                            {e.category?.name || "General"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[#14213D] max-w-sm font-medium">
                          {e.description}
                        </td>
                        <td className="py-3 px-4 text-[#52607D]">
                          {e.payment_method || "—"}
                        </td>
                        <td className="py-3 px-4 font-mono text-[#52607D]">
                          {e.reference || "—"}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-sm text-[#14213D]">
                          ₹{(parseFloat(e.amount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                limit={pagination.limit}
                onPageChange={(p) => fetchExpenses(p, pagination.limit)}
                onLimitChange={(l) => fetchExpenses(1, l)}
              />
            </>
          )}
        </div>
      </main>

      {/* Add Expense Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Log Operating Expense"
      >
        <form onSubmit={handleSaveExpense} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-[8px]">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-[#14213D]">
                  Category <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setCatModalOpen(true)}
                  className="text-[11px] text-[#2F6F5E] hover:underline font-medium flex items-center gap-0.5"
                >
                  <Plus size={12} /> Add Category
                </button>
              </div>
              <CustomSelect
                options={categorySelectOptions}
                value={categoryId}
                onChange={(val) => setCategoryId(val)}
                placeholder={categories.length === 0 ? "No categories (click Add Category)" : "Select Category"}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#14213D] mb-1">
                Expense Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#14213D] mb-1">
              Amount (₹) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="e.g. 18500"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono font-bold bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#14213D] mb-1">
              Description (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Factory EB Bill for July, Diesel generator fuel..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#14213D] mb-1">
                Payment Method
              </label>
              <CustomSelect
                options={[
                  { value: "BANK_TRANSFER", label: "Bank Transfer" },
                  { value: "CASH", label: "Cash" },
                  { value: "UPI", label: "UPI" },
                  { value: "CHEQUE", label: "Cheque" },
                ]}
                value={paymentMethod}
                onChange={(val) => setPaymentMethod(val)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#14213D] mb-1">
                Reference / Bill No.
              </label>
              <input
                type="text"
                placeholder="e.g. EB-1029384, UTR-4993"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-[#EDEAE1]">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Save
            </Button>
          </div>
        </form>
      </Modal>

      {/* Categories Management Modal */}
      <Modal
        isOpen={catModalOpen}
        onClose={() => setCatModalOpen(false)}
        title="Manage Expense Categories"
      >
        <div className="space-y-4">
          {catError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-[8px]">
              {catError}
            </div>
          )}

          <form onSubmit={handleCreateCategory} className="flex gap-2">
            <input
              type="text"
              placeholder="New category name (e.g. Generator Fuel, Rent, Office Supplies)"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="flex-1 px-3 py-2 text-xs bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
            />
            <Button type="submit" loading={savingCat} icon={Plus}>
              Create
            </Button>
          </form>

          <div className="border border-[#EDEAE1] rounded-[8px] divide-y divide-[#EDEAE1] max-h-56 overflow-y-auto">
            {categories.length === 0 ? (
              <div className="p-4 text-center text-xs text-[#52607D]">
                No expense categories created yet. Create one above.
              </div>
            ) : (
              categories.map((c) => (
                <div key={c.id} className="p-2.5 text-xs flex items-center justify-between hover:bg-[#FAFAF8]">
                  <span className="font-semibold text-[#14213D]">{c.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-emerald-700 font-mono bg-emerald-50 px-2 py-0.5 rounded">
                      Active
                    </span>
                    <button
                      type="button"
                      title="Delete category"
                      onClick={() => handleDeleteCategory(c.id, c.name)}
                      className="p-1 text-gray-400 hover:text-rose-600 rounded transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex justify-end pt-2 border-t border-[#EDEAE1]">
            <Button variant="secondary" onClick={() => setCatModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default ExpensesPage;
