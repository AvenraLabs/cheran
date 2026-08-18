import React, { useEffect, useState } from "react";
import {
  ShoppingCart,
  Plus,
  Trash2,
  RefreshCw,
  Search,
  CheckCircle,
  Check,
  CreditCard,
  Clock,
  User,
  Calendar,
  AlertCircle,
  FileSpreadsheet,
  XCircle,
} from "lucide-react";
import api from "../api/client.js";
import Navbar from "../components/layout/Navbar.jsx";
import MetricCard from "../components/common/MetricCard.jsx";
import Button from "../components/common/Button.jsx";
import CustomSelect from "../components/common/CustomSelect.jsx";
import Modal from "../components/common/Modal.jsx";
import Pagination from "../components/common/Pagination.jsx";
import { SkeletonLoader, EmptyState } from "../components/common/SkeletonLoader.jsx";

export function DirectSalesPage() {
  const [invoices, setInvoices] = useState([]);
  const [itemsList, setItemsList] = useState([]);
  const [customersList, setCustomersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("ALL");

  // Create Invoice Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [invoiceType, setInvoiceType] = useState("GOVERNMENT"); // GOVERNMENT | DIRECT_SALE
  const [applicationId, setApplicationId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [fittingsPct, setFittingsPct] = useState(5.0);
  const [gstPct, setGstPct] = useState(5.0);
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState([
    { item_id: "", quantity: "", unit_price: "", unit_symbol: "" },
  ]);
  const [savingInvoice, setSavingInvoice] = useState(false);
  const [createError, setCreateError] = useState("");

  // Cancel Modal State
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [savingCancel, setSavingCancel] = useState(false);
  const [cancelError, setCancelError] = useState("");

  // Payment Collection Modal State
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payingInvoice, setPayingInvoice] = useState(null);
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(new Date().toISOString().split("T")[0]);
  const [payReference, setPayReference] = useState("");
  const [payNotes, setPayNotes] = useState("");
  const [savingPayment, setSavingPayment] = useState(false);
  const [payError, setPayError] = useState("");

  const fetchDependencies = async () => {
    try {
      const [itemsRes, custRes, settingsRes] = await Promise.all([
        api.get("/items?limit=500&is_active=true"),
        api.get("/customers?limit=500&is_active=true"),
        api.get("/settings").catch(() => ({ data: { settings: [] } })),
      ]);

      setItemsList(itemsRes.data?.items || []);
      setCustomersList(custRes.data?.customers || []);

      const settings = settingsRes.data?.settings || [];
      const fitSetting = settings.find((s) => s.key === "FITTINGS_PERCENTAGE");
      const gstSetting = settings.find((s) => s.key === "DEFAULT_GST_PERCENTAGE");
      if (fitSetting) setFittingsPct(parseFloat(fitSetting.value));
      if (gstSetting) setGstPct(parseFloat(gstSetting.value));
    } catch (err) {
      console.error("Failed to fetch dependencies:", err);
    }
  };

  const fetchInvoices = async (
    page = 1,
    searchQuery = search,
    type = typeFilter,
    payStatus = paymentStatusFilter
  ) => {
    setLoading(true);
    try {
      let url = `/invoices?page=${page}&limit=50`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
      if (type !== "ALL") url += `&invoice_type=${type}`;
      if (payStatus !== "ALL") url += `&payment_status=${payStatus}`;

      const res = await api.get(url);
      setInvoices(res.data?.invoices || []);
      setPagination(res.data?.pagination || { page, limit: 50, total: 0, totalPages: 1 });
    } catch (err) {
      console.error("Failed to load invoices:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDependencies();
    fetchInvoices(1);
  }, []);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    fetchInvoices(1, val, typeFilter, paymentStatusFilter);
  };

  const handleTypeFilterChange = (val) => {
    setTypeFilter(val);
    fetchInvoices(1, search, val, paymentStatusFilter);
  };

  const handlePaymentStatusFilterChange = (val) => {
    setPaymentStatusFilter(val);
    fetchInvoices(1, search, typeFilter, val);
  };

  const handleOpenPaymentModal = (inv) => {
    setPayingInvoice(inv);
    const total = parseFloat(inv.total_amount || 0);
    const paid = parseFloat(inv.paid_amount || 0);
    const remaining = Math.max(0, total - paid);
    setPayAmount(remaining.toFixed(2));
    setPayDate(new Date().toISOString().split("T")[0]);
    setPayReference("Cash / Direct Bank Transfer");
    setPayNotes("");
    setPayError("");
    setPayModalOpen(true);
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!payingInvoice) return;
    setSavingPayment(true);
    setPayError("");

    try {
      const amt = parseFloat(payAmount);
      if (isNaN(amt) || amt <= 0) {
        throw new Error("Please enter a valid payment amount greater than 0");
      }

      await api.post(`/invoices/${payingInvoice.id}/payment`, {
        amount: amt,
        payment_date: payDate,
        payment_reference: payReference.trim() || "Direct Payment",
        notes: payNotes.trim() || null,
      });

      setPayModalOpen(false);
      fetchInvoices(pagination.page);
    } catch (err) {
      setPayError(err.response?.data?.message || err.message || "Failed to record payment");
    } finally {
      setSavingPayment(false);
    }
  };

  // Line calculations
  const addLine = () => {
    setLines([...lines, { item_id: "", quantity: "", unit_price: "", unit_symbol: "" }]);
  };

  const removeLine = (idx) => {
    if (lines.length === 1) return;
    setLines(lines.filter((_, i) => i !== idx));
  };

  const updateLine = (idx, field, value) => {
    const next = [...lines];
    next[idx][field] = value;

    if (field === "item_id") {
      const found = itemsList.find((it) => it.id === value);
      if (found) {
        next[idx].unit_symbol = found.unit?.name || found.unit?.symbol || "Unit";
        if (found.unit_price !== undefined && found.unit_price !== null && parseFloat(found.unit_price) > 0) {
          next[idx].unit_price = found.unit_price;
        }
      }
    }
    setLines(next);
  };

  // Live Totals calculation
  const netItemTotal = lines.reduce((sum, l) => {
    const qty = parseFloat(l.quantity) || 0;
    const price = parseFloat(l.unit_price) || 0;
    return sum + qty * price;
  }, 0);

  const fittingsAmount = (netItemTotal * (parseFloat(fittingsPct) || 0)) / 100;
  const taxableAmount = netItemTotal + fittingsAmount;
  const gstAmount = (taxableAmount * (parseFloat(gstPct) || 0)) / 100;
  const grandTotal = taxableAmount + gstAmount;

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    setSavingInvoice(true);
    setCreateError("");

    try {
      if (!invoiceNumber.trim()) {
        throw new Error("Invoice number is required");
      }

      if (invoiceType === "GOVERNMENT" && !applicationId.trim()) {
        throw new Error("Government Application ID is required for Government invoices.");
      }

      const validLines = lines
        .filter((l) => l.item_id && parseFloat(l.quantity) > 0)
        .map((l) => ({
          item_id: l.item_id,
          quantity: parseFloat(l.quantity),
          unit_price: parseFloat(l.unit_price) || 0,
        }));

      if (validLines.length === 0) {
        throw new Error("Please add at least one valid invoice item with quantity > 0");
      }

      await api.post("/invoices", {
        invoice_number: invoiceNumber.trim(),
        invoice_date: invoiceDate,
        invoice_type: invoiceType,
        application_id: invoiceType === "GOVERNMENT" ? applicationId.trim() : null,
        customer_id: invoiceType === "DIRECT_SALE" && customerId ? customerId : null,
        fittings_percentage: fittingsPct,
        gst_percentage: gstPct,
        notes,
        items: validLines,
      });

      setCreateModalOpen(false);
      setInvoiceNumber("");
      setApplicationId("");
      setCustomerId("");
      setNotes("");
      setLines([{ item_id: "", quantity: "", unit_price: "", unit_symbol: "" }]);
      fetchInvoices(1);
    } catch (err) {
      setCreateError(err.response?.data?.message || err.message || "Failed to create invoice");
    } finally {
      setSavingInvoice(false);
    }
  };

  const handleCancelInvoice = async (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    setSavingCancel(true);
    setCancelError("");

    try {
      await api.post(`/invoices/${selectedInvoice.id}/cancel`, {
        reason: cancelReason.trim(),
      });
      setCancelModalOpen(false);
      setSelectedInvoice(null);
      setCancelReason("");
      fetchInvoices(pagination.page);
    } catch (err) {
      setCancelError(err.response?.data?.message || err.message || "Failed to cancel invoice");
    } finally {
      setSavingCancel(false);
    }
  };

  const totalInvoiced = invoices.reduce((s, inv) => s + (inv.status === "POSTED" ? parseFloat(inv.total_amount || 0) : 0), 0);
  const totalFittings = invoices.reduce((s, inv) => s + (inv.status === "POSTED" ? parseFloat(inv.fittings_amount || 0) : 0), 0);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#FAFAF8] min-h-screen">
      <Navbar title="Invoices & Material Dispatch" subtitle="Manual 10/day invoice entry, Government project linking & physical inventory deduction" />

      <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Invoices"
            value={pagination.total.toLocaleString("en-IN")}
            icon={ShoppingCart}
            accentColor="#2F6F5E"
          />
          <MetricCard
            title="Total Invoiced (Page)"
            value={`₹${totalInvoiced.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
            icon={CheckCircle}
            accentColor="#2B5B84"
          />
          <MetricCard
            title="5% Fittings Total"
            value={`₹${totalFittings.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
            icon={FileSpreadsheet}
            accentColor="#D97706"
          />
          <MetricCard
            title="Catalog Items Available"
            value={itemsList.length}
            icon={Clock}
            accentColor="#7C3AED"
          />
        </div>

        {/* Action Header */}
        <div className="bg-white p-4 rounded-[10px] border border-[#E4E1D8] shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto flex-1">
            <div className="relative flex-1 min-w-[200px] md:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C97AB]" size={15} />
              <input
                type="text"
                placeholder="Search invoice #, customer, UTR..."
                value={search}
                onChange={handleSearchChange}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-[#E4E1D8] rounded-[7px] text-[#14213D] placeholder-[#8C97AB] focus:outline-none focus:border-[#2F6F5E]"
              />
            </div>
            <div className="w-44">
              <CustomSelect
                value={typeFilter}
                onChange={handleTypeFilterChange}
                options={[
                  { value: "ALL", label: "All Invoice Types" },
                  { value: "GOVERNMENT", label: "Government Project" },
                  { value: "DIRECT_SALE", label: "Direct Sale" },
                ]}
              />
            </div>
            <div className="w-56">
              <CustomSelect
                value={paymentStatusFilter}
                onChange={handlePaymentStatusFilterChange}
                options={[
                  { value: "ALL", label: "All Payment States" },
                  { value: "PENDING", label: "Pending (Has Balance Due)" },
                  { value: "UNPAID", label: "Unpaid (0% Paid)" },
                  { value: "PARTIALLY_PAID", label: "Partially Paid" },
                  { value: "PAID", label: "Fully Paid" },
                ]}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={() => fetchInvoices(pagination.page)}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => setCreateModalOpen(true)}
            >
              New Invoice / Dispatch
            </Button>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="bg-white rounded-[10px] border border-[#E4E1D8] shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-[#EDEAE1] flex items-center justify-between">
            <h2 className="text-sm font-bold font-display text-[#14213D]">
              Dispatched Invoices & Physical Stock Deductions
            </h2>
            <span className="text-xs text-[#52607D]">
              Showing {invoices.length} of {pagination.total} records
            </span>
          </div>

          {loading ? (
            <SkeletonLoader rows={6} />
          ) : invoices.length === 0 ? (
            <EmptyState
              icon={ShoppingCart}
              title="No Invoices Recorded"
              description="Click 'New Invoice / Dispatch' to enter an invoice and deduct physical materials from stock."
              actionLabel="Create Invoice"
              onAction={() => setCreateModalOpen(true)}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#EDEAE1] bg-[#FAFAF8] text-[#52607D] font-semibold">
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Customer / Application ID</th>
                    <th className="py-3 px-4 text-right">Net Items</th>
                    <th className="py-3 px-4 text-right">Grand Total</th>
                    <th className="py-3 px-4">Payment / Collections</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDEAE1] text-[#14213D]">
                  {invoices.map((inv) => {
                    const totalAmt = parseFloat(inv.total_amount || 0);
                    const paidAmt = parseFloat(inv.paid_amount || 0);
                    const isFullyPaid = inv.payment_status === "PAID" || paidAmt >= totalAmt;
                    const isPartial = !isFullyPaid && paidAmt > 0;
                    const dueAmt = Math.max(0, totalAmt - paidAmt);

                    return (
                      <tr key={inv.id} className="hover:bg-[#FAFAF8] transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-[#2F6F5E]">
                          #{inv.invoice_number}
                        </td>
                        <td className="py-3 px-4">{inv.invoice_date}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              inv.invoice_type === "GOVERNMENT"
                                ? "bg-[#EAF3F0] text-[#2F6F5E]"
                                : "bg-[#EFF6FF] text-[#2563EB]"
                            }`}
                          >
                            {inv.invoice_type === "GOVERNMENT" ? "Government" : "Direct Sale"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold">{inv.customer_name || "—"}</div>
                          {inv.government_project && (
                            <div className="text-[10px] text-[#52607D] font-mono">
                              App ID: {inv.government_project.application_id}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-mono">
                          ₹{parseFloat(inv.net_item_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-[#14213D]">
                          ₹{totalAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4">
                          {inv.invoice_type === "GOVERNMENT" ? (
                            <span className="text-[11px] text-[#8C97AB]">Govt Subsidy</span>
                          ) : isFullyPaid ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EAF3F0] text-[#2F6F5E] border border-[#2F6F5E]/20">
                              <Check size={11} /> Paid (₹{totalAmt.toLocaleString("en-IN")})
                            </span>
                          ) : isPartial ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                Partial: ₹{paidAmt.toLocaleString("en-IN")}
                              </span>
                              <div className="text-[10px] text-rose-600 font-mono font-semibold">
                                Due: ₹{dueAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              </div>
                            </div>
                          ) : (
                            <span className="inline-flex text-[10px] font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                              Unpaid (₹{totalAmt.toLocaleString("en-IN")} Due)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              inv.status === "POSTED"
                                ? "bg-[#EAF3F0] text-[#2F6F5E]"
                                : "bg-[#FDE8E8] text-[#C81E1E]"
                            }`}
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            {inv.invoice_type === "DIRECT_SALE" && inv.status === "POSTED" && !isFullyPaid && (
                              <Button
                                variant="primary"
                                size="xs"
                                icon={CreditCard}
                                onClick={() => handleOpenPaymentModal(inv)}
                              >
                                Pay
                              </Button>
                            )}
                            {inv.status === "POSTED" && (
                              <Button
                                variant="secondary"
                                size="xs"
                                onClick={() => {
                                  setSelectedInvoice(inv);
                                  setCancelModalOpen(true);
                                }}
                                className="text-[#B0403A] hover:bg-[#FDF2F1] hover:text-[#8F332E] border-[#E4E1D8] hover:border-[#F8B4B4]"
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="p-4 border-t border-[#EDEAE1]">
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={(p) => fetchInvoices(p)}
            />
          </div>
        </div>

        {/* Create Invoice Modal */}
        <Modal
          isOpen={createModalOpen}
          onClose={() => !savingInvoice && setCreateModalOpen(false)}
          title="Create Manual Invoice & Material Dispatch"
          maxWidth="max-w-3xl"
        >
          <form onSubmit={handleCreateInvoice} className="space-y-4">
            {createError && (
              <div className="p-3 bg-[#FDE8E8] border border-[#F8B4B4] rounded-[7px] text-xs text-[#C81E1E] flex items-center gap-2">
                <AlertCircle size={15} />
                <span>{createError}</span>
              </div>
            )}

            {/* Type selector */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#14213D] mb-1">
                  Invoice Type *
                </label>
                <CustomSelect
                  value={invoiceType}
                  onChange={(val) => setInvoiceType(val)}
                  options={[
                    { value: "GOVERNMENT", label: "Government Project" },
                    { value: "DIRECT_SALE", label: "Direct Commercial Sale" },
                  ]}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#14213D] mb-1">
                  Invoice Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 320"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#E4E1D8] rounded-[7px] focus:outline-none focus:border-[#2F6F5E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#14213D] mb-1">
                  Invoice Date *
                </label>
                <input
                  type="date"
                  required
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#E4E1D8] rounded-[7px] focus:outline-none focus:border-[#2F6F5E]"
                />
              </div>
            </div>

            {/* Conditional Linking Input */}
            {invoiceType === "GOVERNMENT" ? (
              <div className="p-3 bg-[#FAFAF8] rounded-[7px] border border-[#E4E1D8]">
                <label className="block text-xs font-semibold text-[#14213D] mb-1">
                  Government Application ID / MI Reference *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. H-KGI-tly-7101434801-2026-27"
                  value={applicationId}
                  onChange={(e) => setApplicationId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono border border-[#E4E1D8] rounded-[7px] focus:outline-none focus:border-[#2F6F5E]"
                />
                <p className="text-[10px] text-[#52607D] mt-1">
                  Links to existing project. If not found, a new Government Project will be automatically created with status <strong>INVOICED</strong>.
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-[#14213D] mb-1">
                  Customer
                </label>
                <CustomSelect
                  value={customerId}
                  onChange={(val) => setCustomerId(val)}
                  options={[
                    { value: "", label: "Select Customer..." },
                    ...customersList.map((c) => ({ value: c.id, label: c.name })),
                  ]}
                />
              </div>
            )}

            {/* Tax and Percentage Rate Controls (Editable on-the-fly, prefilled from settings) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-[#FAFAF8] rounded-[8px] border border-[#E4E1D8]">
              <div>
                <label className="block text-xs font-semibold text-[#14213D] mb-1">
                  GST Rate (%):
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={gstPct}
                    onChange={(e) => setGstPct(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono font-bold bg-white border border-[#E4E1D8] rounded-[7px] focus:outline-none focus:border-[#2F6F5E] text-[#14213D]"
                    placeholder="e.g. 5 or 18"
                  />
                  <div className="flex gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setGstPct(5.0)}
                      className={`px-2 py-1 text-[10px] font-bold rounded-[6px] border cursor-pointer transition-colors ${
                        gstPct === 5.0 ? "bg-[#2F6F5E] text-white border-[#2F6F5E]" : "bg-white text-[#52607D] border-[#E4E1D8]"
                      }`}
                    >
                      5%
                    </button>
                    <button
                      type="button"
                      onClick={() => setGstPct(12.0)}
                      className={`px-2 py-1 text-[10px] font-bold rounded-[6px] border cursor-pointer transition-colors ${
                        gstPct === 12.0 ? "bg-[#2F6F5E] text-white border-[#2F6F5E]" : "bg-white text-[#52607D] border-[#E4E1D8]"
                      }`}
                    >
                      12%
                    </button>
                    <button
                      type="button"
                      onClick={() => setGstPct(18.0)}
                      className={`px-2 py-1 text-[10px] font-bold rounded-[6px] border cursor-pointer transition-colors ${
                        gstPct === 18.0 ? "bg-[#2F6F5E] text-white border-[#2F6F5E]" : "bg-white text-[#52607D] border-[#E4E1D8]"
                      }`}
                    >
                      18%
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#14213D] mb-1">
                  Fittings Cost Rate (%):
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={fittingsPct}
                    onChange={(e) => setFittingsPct(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono font-bold bg-white border border-[#E4E1D8] rounded-[7px] focus:outline-none focus:border-[#2F6F5E] text-[#14213D]"
                    placeholder="e.g. 5"
                  />
                  <div className="flex gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setFittingsPct(5.0)}
                      className={`px-2 py-1 text-[10px] font-bold rounded-[6px] border cursor-pointer transition-colors ${
                        fittingsPct === 5.0 ? "bg-[#2F6F5E] text-white border-[#2F6F5E]" : "bg-white text-[#52607D] border-[#E4E1D8]"
                      }`}
                    >
                      5%
                    </button>
                    <button
                      type="button"
                      onClick={() => setFittingsPct(0.0)}
                      className={`px-2 py-1 text-[10px] font-bold rounded-[6px] border cursor-pointer transition-colors ${
                        fittingsPct === 0.0 ? "bg-[#2F6F5E] text-white border-[#2F6F5E]" : "bg-white text-[#52607D] border-[#E4E1D8]"
                      }`}
                    >
                      0%
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="border border-[#E4E1D8] rounded-[8px] relative bg-white">
              <div className="bg-[#FAFAF8] px-3 py-2 border-b border-[#E4E1D8] flex items-center justify-between rounded-t-[8px]">
                <span className="text-xs font-bold text-[#14213D]">Dispatched Items (Deducted from Inventory)</span>
                <Button type="button" variant="outline" size="xs" icon={Plus} onClick={addLine}>
                  Add Line
                </Button>
              </div>

              {/* Column Headers for Quantity and Rate */}
              <div className="flex items-center gap-2 px-3 pt-2.5 text-[11px] font-semibold text-[#52607D]">
                <div className="flex-1">Material / Catalog Item</div>
                <div className="w-24 text-right">Quantity</div>
                <div className="w-28 text-right">Unit Price (₹)</div>
                <div className="w-28 text-right">Line Total (₹)</div>
                {lines.length > 1 && <div className="w-6"></div>}
              </div>

              <div className="p-3 space-y-3">
                {lines.map((line, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 text-xs relative"
                    style={{ zIndex: 40 - idx }}
                  >
                    <div className="flex-1 min-w-0">
                      <CustomSelect
                        value={line.item_id}
                        onChange={(val) => updateLine(idx, "item_id", val)}
                        placeholder="Select Finished Good or Material..."
                        options={itemsList
                          .filter((i) => ["FINISHED_GOOD", "RAW_MATERIAL"].includes(i.item_type))
                          .map((i) => ({
                            value: i.id,
                            label: `${i.name} (${i.unit?.symbol || i.unit?.name || "Unit"})`,
                            badge: i.item_type === "FINISHED_GOOD" ? "Finished Good" : "Material",
                          }))}
                        size="sm"
                      />
                    </div>

                    <div className="w-24">
                      <input
                        type="number"
                        step="any"
                        min="0.001"
                        placeholder="Qty"
                        value={line.quantity}
                        onChange={(e) => updateLine(idx, "quantity", e.target.value)}
                        className="w-full px-2 py-1.5 border border-[#E4E1D8] rounded-[6px] text-right font-mono focus:outline-none focus:border-[#2F6F5E] focus:ring-1 focus:ring-[#2F6F5E]"
                      />
                    </div>

                    <div className="w-28">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Rate ₹"
                        value={line.unit_price}
                        onChange={(e) => updateLine(idx, "unit_price", e.target.value)}
                        className="w-full px-2 py-1.5 border border-[#E4E1D8] rounded-[6px] text-right font-mono focus:outline-none focus:border-[#2F6F5E] focus:ring-1 focus:ring-[#2F6F5E]"
                      />
                    </div>

                    <div className="w-28 text-right font-mono font-bold text-[#14213D]">
                      ₹{((parseFloat(line.quantity) || 0) * (parseFloat(line.unit_price) || 0)).toFixed(2)}
                    </div>

                    {lines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLine(idx)}
                        className="text-[#C81E1E] hover:text-[#9B1C1C] p-1 cursor-pointer transition-colors"
                        title="Remove Line"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Calculations Summary */}
            <div className="bg-[#FAFAF8] p-3 rounded-[8px] border border-[#E4E1D8] space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-[#52607D]">
                <span>Net Items Total:</span>
                <span>₹{netItemTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[#D97706]">
                <span>+ {fittingsPct}% Fittings Cost:</span>
                <span>₹{fittingsAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[#52607D]">
                <span>Taxable Amount (Net + Fittings):</span>
                <span>₹{taxableAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[#52607D]">
                <span>
                  + {gstPct}% GST (SGST {(gstPct / 2).toFixed(1)}% + CGST {(gstPct / 2).toFixed(1)}%):
                </span>
                <span>₹{gstAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-[#14213D] pt-1.5 border-t border-[#EDEAE1]">
                <span>Grand Total:</span>
                <span className="text-[#2F6F5E]">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#EDEAE1]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCreateModalOpen(false)}
                disabled={savingInvoice}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={savingInvoice}
              >
                {savingInvoice ? "Posting & Deducting Stock..." : "Post Invoice & Deduct Stock"}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Cancel Invoice Confirmation Modal */}
        <Modal
          isOpen={cancelModalOpen}
          onClose={() => !savingCancel && setCancelModalOpen(false)}
          title={`Cancel Invoice #${selectedInvoice?.invoice_number}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleCancelInvoice} className="space-y-4">
            {cancelError && (
              <div className="p-3 bg-[#FDE8E8] border border-[#F8B4B4] rounded-[7px] text-xs text-[#C81E1E]">
                {cancelError}
              </div>
            )}

            <p className="text-xs text-[#52607D]">
              Cancelling this invoice will create <strong className="text-[#14213D]">REVERSAL</strong> inventory movements and restore the physical stock on hand.
            </p>

              <div>
                <label className="block text-xs font-semibold text-[#14213D] mb-1">
                  Cancellation Reason *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Order returned by farmer / Duplicate entry"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#E4E1D8] rounded-[7px] focus:outline-none focus:border-[#2F6F5E]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#EDEAE1]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCancelModalOpen(false)}
                  disabled={savingCancel}
                >
                  Keep Active
                </Button>
                <Button
                  type="submit"
                  variant="danger"
                  size="sm"
                  disabled={savingCancel}
                >
                  {savingCancel ? "Cancelling..." : "Cancel Invoice"}
                </Button>
              </div>
            </form>
          </Modal>

        {/* Record Payment Modal */}
        <Modal
          isOpen={payModalOpen}
          onClose={() => !savingPayment && setPayModalOpen(false)}
          title={`Record Payment for Invoice #${payingInvoice?.invoice_number || ""}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleRecordPayment} className="space-y-4">
            {payError && (
              <div className="p-3 bg-[#FDE8E8] border border-[#F8B4B4] rounded-[7px] text-xs text-[#C81E1E] flex items-center gap-2">
                <AlertCircle size={15} />
                <span>{payError}</span>
              </div>
            )}

            <div className="p-3 bg-[#FAFAF8] rounded-[8px] border border-[#E4E1D8] space-y-1 text-xs font-mono">
              <div className="flex justify-between text-[#52607D]">
                <span>Customer / Farmer:</span>
                <strong className="text-[#14213D] font-sans">{payingInvoice?.customer_name || "—"}</strong>
              </div>
              <div className="flex justify-between text-[#52607D]">
                <span>Total Invoice Amount:</span>
                <span>₹{parseFloat(payingInvoice?.total_amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-[#2F6F5E]">
                <span>Already Collected / Paid:</span>
                <span className="font-bold">₹{parseFloat(payingInvoice?.paid_amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-rose-600 font-bold pt-1 border-t border-[#EDEAE1]">
                <span>Remaining Balance Due:</span>
                <span>
                  ₹{Math.max(
                    0,
                    parseFloat(payingInvoice?.total_amount || 0) - parseFloat(payingInvoice?.paid_amount || 0)
                  ).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#14213D] mb-1">
                Payment Amount to Collect (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono font-bold bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#14213D] mb-1">
                Payment Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={payDate}
                onChange={(e) => setPayDate(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#14213D] mb-1">
                Payment Mode & Reference (UTR / Cheque / Cash) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Cash, GPay, NEFT-819201, Cheque #20912"
                value={payReference}
                onChange={(e) => setPayReference(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#14213D] mb-1">
                Payment Notes
              </label>
              <textarea
                rows={2}
                placeholder="Optional notes or remarks..."
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#EDEAE1]">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setPayModalOpen(false)}
                disabled={savingPayment}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={savingPayment}
                icon={Check}
              >
                Confirm Payment
              </Button>
            </div>
          </form>
        </Modal>
      </main>
    </div>
  );
}

export default DirectSalesPage;
