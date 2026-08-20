import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingCart,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  DollarSign,
  Receipt,
  Printer,
  CreditCard,
  Calendar,
  X,
  Trash2,
  Boxes,
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

const PAYMENT_STATUS_OPTIONS = [
  { value: "", label: "All Payment Statuses" },
  { value: "PAID", label: "Fully Paid" },
  { value: "PARTIALLY_PAID", label: "Partially Paid" },
  { value: "UNPAID", label: "Unpaid / Pending" },
];

export function DirectSalesPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });

  // Filters
  const [search, setSearch] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Record Payment Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [activeInvoiceForPayment, setActiveInvoiceForPayment] = useState(null);
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(new Date().toISOString().split("T")[0]);
  const [payMode, setPayMode] = useState("Cash");
  const [payRefNo, setPayRefNo] = useState("");
  const [payNotes, setPayNotes] = useState("");
  const [recordingPayment, setRecordingPayment] = useState(false);

  // View Invoice Modal State
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewInvoiceData, setViewInvoiceData] = useState(null);

  // Cancel Confirmation Modal State
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [invoiceToCancel, setInvoiceToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // ==========================================
  // Data Fetching
  // ==========================================
  const fetchInvoices = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: pagination.limit,
        invoice_type: "DIRECT_SALE",
        search: search.trim() || undefined,
        payment_status: paymentStatusFilter || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      };

      const res = await api.get("/invoices", { params });
      setInvoices(res.data?.invoices || []);
      setPagination(
        res.data?.pagination || { page: 1, limit: 20, total: res.data?.invoices?.length || 0, totalPages: 1 }
      );
    } catch (err) {
      console.error("Failed to load direct sales invoices:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices(1);
  }, [search, paymentStatusFilter, startDate, endDate]);

  // Metric Summaries across Direct Sales
  const activeInvoices = invoices.filter((i) => i.status === "POSTED");
  const totalDirectSalesAmount = activeInvoices.reduce(
    (sum, i) => sum + (parseFloat(i.total_amount) || 0),
    0
  );
  const totalCollectedAmount = activeInvoices.reduce(
    (sum, i) => sum + (parseFloat(i.paid_amount) || 0),
    0
  );
  const totalPendingReceivables = Math.max(0, totalDirectSalesAmount - totalCollectedAmount);

  // ==========================================
  // Record Payment
  // ==========================================
  const handleOpenPaymentModal = (invoice) => {
    setActiveInvoiceForPayment(invoice);
    const pending = Math.max(
      0,
      parseFloat(invoice.total_amount || 0) - parseFloat(invoice.paid_amount || 0)
    );
    setPayAmount(pending.toFixed(2));
    setPayDate(new Date().toISOString().split("T")[0]);
    setPayMode("Cash");
    setPayRefNo("");
    setPayNotes("");
    setErrorMsg("");
    setPaymentModalOpen(true);
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!activeInvoiceForPayment) return;

    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) {
      setErrorMsg("Payment amount must be greater than zero.");
      return;
    }

    try {
      setRecordingPayment(true);
      setErrorMsg("");

      const fullRef = payRefNo.trim()
        ? `${payMode} - Ref: ${payRefNo.trim()}`
        : payMode;

      await api.post(`/invoices/${activeInvoiceForPayment.id}/payment`, {
        amount: amt,
        payment_date: payDate,
        payment_reference: fullRef,
        notes: payNotes,
      });

      setPaymentModalOpen(false);
      setSuccessMsg(`Payment of ₹${amt.toLocaleString("en-IN")} recorded for #${activeInvoiceForPayment.invoice_number}!`);
      fetchInvoices(pagination.page);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to record payment.");
    } finally {
      setRecordingPayment(false);
    }
  };

  // ==========================================
  // Cancel Invoice
  // ==========================================
  const handleOpenCancelModal = (inv) => {
    setInvoiceToCancel(inv);
    setCancelReason("");
    setCancelModalOpen(true);
  };

  const handleCancelInvoice = async () => {
    if (!invoiceToCancel) return;
    try {
      setCancelling(true);
      await api.post(`/invoices/${invoiceToCancel.id}/cancel`, {
        reason: cancelReason || "Cancelled by user from Direct Sales portal",
      });
      setCancelModalOpen(false);
      setSuccessMsg(`Invoice #${invoiceToCancel.invoice_number} cancelled and items restored to inventory.`);
      fetchInvoices(pagination.page);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to cancel invoice.");
    } finally {
      setCancelling(false);
    }
  };

  // ==========================================
  // View Invoice Slip
  // ==========================================
  const handleViewInvoice = async (inv) => {
    try {
      const res = await api.get(`/invoices/${inv.id}`);
      setViewInvoiceData(res.data?.data?.invoice || res.data?.invoice || inv);
      setViewModalOpen(true);
    } catch (err) {
      console.error("Failed to load invoice details:", err);
      setViewInvoiceData(inv);
      setViewModalOpen(true);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Navbar
        title="Direct Commercial Sales & Dispatches"
        subtitle="Manage private commercial billing, finished goods inventory deductions, and customer payment collections."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" icon={RefreshCw} onClick={() => fetchInvoices(pagination.page)}>
              Refresh
            </Button>
            <Link to="/sales/new">
              <Button variant="primary" icon={Plus}>
                New Direct Sale
              </Button>
            </Link>
          </div>
        }
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 overflow-y-auto">
        {/* Success / Error Feedback */}
        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-[8px] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg("")} className="text-emerald-600 hover:text-emerald-900">
              <X size={14} />
            </button>
          </div>
        )}

        {errorMsg && !paymentModalOpen && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-[8px] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg("")} className="text-rose-600 hover:text-rose-900">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Metric Cards Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Direct Sales"
            value={`₹${totalDirectSalesAmount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
            subtitle="All active commercial invoices"
            icon={ShoppingCart}
            color="emerald"
          />
          <MetricCard
            title="Collected Payments"
            value={`₹${totalCollectedAmount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
            subtitle="Cash / UPI / Bank in-hand"
            icon={DollarSign}
            color="teal"
          />
          <MetricCard
            title="Pending Receivables"
            value={`₹${totalPendingReceivables.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
            subtitle="Customer unpaid balance"
            icon={Clock}
            color="amber"
          />
          <MetricCard
            title="Total Dispatches"
            value={activeInvoices.length}
            subtitle="Posted sales invoices"
            icon={Receipt}
            color="blue"
          />
        </div>

        {/* Filters & Search */}
        <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 shadow-xs">
          <div className="relative w-full lg:w-72">
            <Search className="absolute left-3 top-2.5 text-[#8C97AB]" size={16} />
            <input
              type="text"
              placeholder="Search by invoice # or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Date Range Inputs */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 bg-[#FAFAF8] border border-[#E4E1D8] px-2.5 py-1.5 rounded-[8px] text-xs">
                <Calendar size={14} className="text-[#8C97AB]" />
                <span className="text-[11px] text-[#52607D] font-medium">From:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent text-xs text-[#14213D] focus:outline-none cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-1.5 bg-[#FAFAF8] border border-[#E4E1D8] px-2.5 py-1.5 rounded-[8px] text-xs">
                <Calendar size={14} className="text-[#8C97AB]" />
                <span className="text-[11px] text-[#52607D] font-medium">To:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent text-xs text-[#14213D] focus:outline-none cursor-pointer"
                />
              </div>

              {(startDate || endDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                  }}
                  className="p-1.5 px-2 text-xs text-rose-600 hover:bg-rose-50 rounded-[6px] border border-rose-200 flex items-center gap-1 font-semibold transition-colors cursor-pointer"
                  title="Clear date range"
                >
                  <X size={13} /> Reset Dates
                </button>
              )}
            </div>

            {/* Payment Status Dropdown */}
            <div className="w-full sm:w-48">
              <CustomSelect
                options={PAYMENT_STATUS_OPTIONS}
                value={paymentStatusFilter}
                onChange={(val) => setPaymentStatusFilter(val)}
                placeholder="Filter by payment"
              />
            </div>
          </div>
        </div>

        {/* Direct Sales Data Table */}
        <div className="bg-white border border-[#E4E1D8] rounded-[10px] shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-6">
              <SkeletonLoader rows={6} />
            </div>
          ) : invoices.length === 0 ? (
            <EmptyState
              icon={ShoppingCart}
              title="No direct sales invoices found"
              description="Create a new direct sale to record commercial finished goods dispatch and customer payments."
              action={
                <Link to="/sales/new">
                  <Button variant="primary" icon={Plus}>
                    Create Direct Sale
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#FAFAF8] border-b border-[#E4E1D8] text-[#52607D] font-bold">
                    <th className="py-3 px-4">Invoice # & Date</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4 text-center">Items Dispatched</th>
                    <th className="py-3 px-4 text-right">Fittings (5%)</th>
                    <th className="py-3 px-4 text-right">GST Rate</th>
                    <th className="py-3 px-4 text-right">Grand Total</th>
                    <th className="py-3 px-4 text-right">Paid / Pending</th>
                    <th className="py-3 px-4 text-center">Payment Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDEAE1]">
                  {invoices.map((inv) => {
                    const total = parseFloat(inv.total_amount) || 0;
                    const paid = parseFloat(inv.paid_amount) || 0;
                    const pending = Math.max(0, total - paid);
                    const isPaid = inv.payment_status === "PAID";
                    const isPartial = inv.payment_status === "PARTIALLY_PAID";
                    const isCancelled = inv.status === "CANCELLED";

                    return (
                      <tr
                        key={inv.id}
                        className={`hover:bg-[#FAF9F5] transition-colors ${
                          isCancelled ? "opacity-60 bg-gray-50" : ""
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="font-bold text-[#14213D] font-mono">{inv.invoice_number}</div>
                          <div className="text-[10px] text-[#52607D]">{formatDate(inv.invoice_date)}</div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-semibold text-[#14213D]">
                            {inv.customer_name || inv.customer?.name || "Walk-in Customer"}
                          </div>
                          {inv.notes && (
                            <div className="text-[10px] text-[#8C97AB] truncate max-w-xs">{inv.notes}</div>
                          )}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#EAF3F0] text-[#1E4D40] font-bold text-[10px]">
                            <Boxes size={11} /> {(inv.items || []).length} items
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right font-mono text-[#D97706]">
                          +₹{(parseFloat(inv.fittings_amount) || 0).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            {inv.gst_amount > 0 ? "5% / 18%" : "0%"} GST
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-bold text-[#14213D]">
                          ₹{total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>

                        <td className="py-3 px-4 text-right font-mono">
                          <div className="text-emerald-700 font-semibold">
                            ₹{paid.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </div>
                          {pending > 0 && (
                            <div className="text-[10px] text-amber-700">
                              Bal: ₹{pending.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4 text-center">
                          {isCancelled ? (
                            <span className="px-2 py-0.5 rounded-full bg-gray-200 text-gray-700 text-[10px] font-bold">
                              CANCELLED
                            </span>
                          ) : isPaid ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                              PAID
                            </span>
                          ) : isPartial ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                              PARTIAL
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                              UNPAID
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {!isCancelled && pending > 0 && (
                              <button
                                onClick={() => handleOpenPaymentModal(inv)}
                                className="p-1 text-emerald-700 hover:bg-emerald-50 rounded text-[11px] font-bold flex items-center gap-1 border border-emerald-300 px-2 transition-colors cursor-pointer"
                                title="Record payment installment"
                              >
                                <CreditCard size={12} /> Pay
                              </button>
                            )}

                            <button
                              onClick={() => handleViewInvoice(inv)}
                              className="p-1.5 text-[#52607D] hover:text-[#14213D] hover:bg-[#FAFAF8] rounded transition-colors cursor-pointer"
                              title="View and Print Invoice Slip"
                            >
                              <Printer size={15} />
                            </button>

                            {!isCancelled && (
                              <button
                                onClick={() => handleOpenCancelModal(inv)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                title="Cancel invoice and restore inventory"
                              >
                                <Trash2 size={14} />
                              </button>
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

          {pagination.totalPages > 1 && (
            <div className="p-4 border-t border-[#E4E1D8]">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={(p) => fetchInvoices(p)}
              />
            </div>
          )}
        </div>
      </main>

      {/* ========================================== */}
      {/* 1. RECORD PAYMENT MODAL */}
      {/* ========================================== */}
      <Modal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        title="Record Customer Payment"
        maxWidth="max-w-md"
      >
        {activeInvoiceForPayment && (
          <form onSubmit={handleRecordPayment} className="space-y-4">
            {errorMsg && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded flex items-center gap-2">
                <AlertCircle size={14} /> {errorMsg}
              </div>
            )}

            <div className="bg-[#FAFAF8] p-3 rounded-[8px] border border-[#E4E1D8] space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[#52607D]">Invoice Number:</span>
                <strong className="font-mono">{activeInvoiceForPayment.invoice_number}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#52607D]">Customer:</span>
                <strong>{activeInvoiceForPayment.customer_name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#52607D]">Total Billed:</span>
                <strong className="font-mono">
                  ₹{(parseFloat(activeInvoiceForPayment.total_amount) || 0).toLocaleString("en-IN")}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#52607D]">Already Collected:</span>
                <strong className="font-mono text-emerald-700">
                  ₹{(parseFloat(activeInvoiceForPayment.paid_amount) || 0).toLocaleString("en-IN")}
                </strong>
              </div>
              <div className="flex justify-between border-t border-[#EDEAE1] pt-1.5">
                <span className="text-[#14213D] font-bold">Pending Balance:</span>
                <strong className="font-mono text-amber-700 font-bold">
                  ₹
                  {Math.max(
                    0,
                    parseFloat(activeInvoiceForPayment.total_amount || 0) -
                      parseFloat(activeInvoiceForPayment.paid_amount || 0)
                  ).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </strong>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#14213D] mb-1">
                Installment Amount (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#2F6F5E]"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#14213D] mb-1">Payment Date</label>
                <input
                  type="date"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#14213D] mb-1">
                  Payment Mode <span className="text-rose-500">*</span>
                </label>
                <CustomSelect
                  options={[
                    { value: "Cash", label: "Cash" },
                    { value: "UPI (GPay / PhonePe / Paytm)", label: "UPI (GPay / PhonePe / Paytm)" },
                    { value: "Bank Transfer (NEFT / RTGS / IMPS)", label: "Bank Transfer (NEFT / RTGS / IMPS)" },
                    { value: "Cheque", label: "Cheque" },
                    { value: "Card (Debit / Credit)", label: "Card (Debit / Credit)" },
                  ]}
                  value={payMode}
                  onChange={(val) => setPayMode(val)}
                  placeholder="Select payment mode"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#14213D] mb-1">
                Transaction / UTR / Cheque # (Optional)
              </label>
              <input
                type="text"
                value={payRefNo}
                onChange={(e) => setPayRefNo(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] font-mono"
                placeholder="e.g. UTR-987654321, CHQ-10492"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#14213D] mb-1">
                Payment Remarks (Optional)
              </label>
              <input
                type="text"
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px]"
                placeholder="e.g. Part payment received from Ramesh"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#EDEAE1]">
              <Button variant="secondary" type="button" onClick={() => setPaymentModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" loading={recordingPayment} icon={CheckCircle2}>
                Save Payment
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* ========================================== */}
      {/* 2. VIEW & PRINT INVOICE MODAL */}
      {/* ========================================== */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title={`Commercial Invoice #${viewInvoiceData?.invoice_number || ""}`}
        maxWidth="max-w-2xl"
      >
        {viewInvoiceData && (
          <div className="space-y-5 text-xs text-[#14213D]">
            {/* Header Slip */}
            <div className="flex items-center justify-between border-b border-[#EDEAE1] pb-4">
              <div>
                <h3 className="text-base font-extrabold text-[#2F6F5E]">CHERAN IRRIGATION</h3>
                <p className="text-[11px] text-[#52607D]">Commercial Sales & Dispatch Slip</p>
              </div>
              <div className="text-right">
                <div className="font-mono font-bold">{viewInvoiceData.invoice_number}</div>
                <div className="text-[11px] text-[#52607D]">{formatDate(viewInvoiceData.invoice_date)}</div>
              </div>
            </div>

            {/* Customer Details */}
            <div className="bg-[#FAFAF8] p-3 rounded-[8px] border border-[#E4E1D8] flex justify-between">
              <div>
                <span className="text-[10px] text-[#52607D] block">Billed To:</span>
                <strong className="text-sm font-bold">{viewInvoiceData.customer_name}</strong>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-[#52607D] block">Status:</span>
                <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-emerald-100 text-emerald-800">
                  {viewInvoiceData.payment_status}
                </span>
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full border border-[#E4E1D8] text-xs">
              <thead className="bg-[#FAFAF8] border-b border-[#E4E1D8]">
                <tr>
                  <th className="p-2 text-left">Item Name</th>
                  <th className="p-2 text-center">Unit</th>
                  <th className="p-2 text-right">Qty</th>
                  <th className="p-2 text-right">Unit Price</th>
                  <th className="p-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDEAE1]">
                {(viewInvoiceData.items || []).map((it, idx) => (
                  <tr key={idx}>
                    <td className="p-2 font-medium">{it.item_name_snapshot || it.item?.name || "Item"}</td>
                    <td className="p-2 text-center text-[#52607D]">{it.unit_snapshot || "NOS"}</td>
                    <td className="p-2 text-right font-mono font-bold">{it.quantity}</td>
                    <td className="p-2 text-right font-mono">₹{parseFloat(it.unit_price || 0).toFixed(2)}</td>
                    <td className="p-2 text-right font-mono font-bold">
                      ₹{parseFloat(it.line_total || it.quantity * it.unit_price || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Commercial Breakdown */}
            <div className="bg-[#FAFAF8] p-3 rounded-[8px] border border-[#E4E1D8] space-y-1.5 text-right font-mono">
              <div className="flex justify-between text-xs">
                <span className="text-[#52607D]">Net Items Total:</span>
                <span>₹{(parseFloat(viewInvoiceData.net_item_amount) || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-[#D97706]">
                <span>Fittings ({viewInvoiceData.fittings_percentage || 5}%):</span>
                <span>+₹{(parseFloat(viewInvoiceData.fittings_amount) || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-[#14213D] border-t border-[#EDEAE1] pt-1">
                <span>Taxable Amount:</span>
                <span>₹{(parseFloat(viewInvoiceData.taxable_amount) || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-blue-700">
                <span>GST:</span>
                <span>+₹{(parseFloat(viewInvoiceData.gst_amount) || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-[#2F6F5E] border-t border-[#EDEAE1] pt-1.5">
                <span>Grand Total:</span>
                <span>₹{(parseFloat(viewInvoiceData.total_amount) || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-emerald-800 font-bold">
                <span>Amount Paid:</span>
                <span>₹{(parseFloat(viewInvoiceData.paid_amount) || 0).toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Transactions Log */}
            {Array.isArray(viewInvoiceData.payment_history) && viewInvoiceData.payment_history.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-[#14213D] block">Payment Collections History</span>
                <div className="border border-[#E4E1D8] rounded-[8px] p-2.5 bg-[#FAFAF8] space-y-1 text-[11px]">
                  {viewInvoiceData.payment_history.map((p, pIdx) => (
                    <div key={pIdx} className="flex justify-between text-[#52607D]">
                      <span>
                        {formatDate(p.payment_date)} • {p.payment_reference || "Direct"}
                      </span>
                      <strong className="font-mono text-emerald-700">+₹{parseFloat(p.amount).toFixed(2)}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-[#EDEAE1]">
              <Button variant="secondary" onClick={() => setViewModalOpen(false)}>
                Close
              </Button>
              <Button variant="primary" icon={Printer} onClick={() => window.print()}>
                Print Slip
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================== */}
      {/* 3. CANCEL INVOICE CONFIRMATION MODAL */}
      {/* ========================================== */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel Direct Sale Invoice"
        maxWidth="max-w-md"
      >
        {invoiceToCancel && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-[8px] space-y-1">
              <strong>Warning:</strong> Cancelling invoice{" "}
              <span className="font-mono font-bold">#{invoiceToCancel.invoice_number}</span> will automatically
              restore all dispatched finished goods items back into inventory stock.
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#14213D] mb-1">
                Cancellation Reason (Optional)
              </label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Customer cancelled order"
                className="w-full px-3 py-2 text-xs bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#EDEAE1]">
              <Button variant="secondary" onClick={() => setCancelModalOpen(false)}>
                Keep Invoice
              </Button>
              <Button
                variant="primary"
                loading={cancelling}
                onClick={handleCancelInvoice}
                className="bg-rose-600 hover:bg-rose-700"
              >
                Yes, Cancel & Restore Stock
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default DirectSalesPage;
