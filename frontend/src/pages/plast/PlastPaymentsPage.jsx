import React, { useEffect, useState } from "react";
import {
  CreditCard,
  Search,
  RefreshCw,
  DollarSign,
  TrendingUp,
  Receipt,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  History,
  ArrowRight,
  Eye,
  Check,
  Building2,
} from "lucide-react";
import { plastApi } from "../../api/plastApi.js";
import Navbar from "../../components/layout/Navbar.jsx";
import MetricCard from "../../components/common/MetricCard.jsx";
import Button from "../../components/common/Button.jsx";
import Modal from "../../components/common/Modal.jsx";
import CustomSelect from "../../components/common/CustomSelect.jsx";
import { SkeletonLoader, EmptyState } from "../../components/common/SkeletonLoader.jsx";
import RecordPaymentModal from "../../components/plast/RecordPaymentModal.jsx";
import { toast } from "sonner";

export function PlastPaymentsPage() {
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [paymentMode, setPaymentMode] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [activeTab, setActiveTab] = useState("ALL"); // "ALL", "UNPAID", "PARTIAL", "PAID"

  // Modals
  const [activePaymentSale, setActivePaymentSale] = useState(null);
  const [historySale, setHistorySale] = useState(null);
  const [inlineSubmittingId, setInlineSubmittingId] = useState(null);
  const [inlineAmounts, setInlineAmounts] = useState({});

  const fetchSales = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await plastApi.getSales({
        customer_id: customerId || undefined,
        payment_mode: paymentMode || undefined,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
        search: search || undefined,
      });

      const list = Array.isArray(data) ? data : data?.data || [];
      setSales(list);
    } catch (err) {
      toast.error("Failed to load customer sales and payments");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const data = await plastApi.getCustomers();
      setCustomers(Array.isArray(data) ? data : data?.data || []);
    } catch (err) {
      setCustomers([]);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSales();
    }, 200);
    return () => clearTimeout(timer);
  }, [search, customerId, paymentMode, fromDate, toDate]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(val || 0);
  };

  const safeSales = Array.isArray(sales) ? sales : [];

  const unpaidCount = safeSales.filter((s) => Number(s.paid_amount || 0) === 0).length;
  const partialCount = safeSales.filter(
    (s) => Number(s.paid_amount || 0) > 0 && Number(s.balance_amount || 0) > 0.01
  ).length;
  const paidCount = safeSales.filter((s) => Number(s.balance_amount || 0) <= 0.01).length;
  const pendingCount = unpaidCount + partialCount;

  // Filter client-side by activeTab
  const displayedSales = safeSales.filter((s) => {
    if (activeTab === "UNPAID") return Number(s.paid_amount || 0) === 0;
    if (activeTab === "PARTIAL") {
      return Number(s.paid_amount || 0) > 0 && Number(s.balance_amount || 0) > 0.01;
    }
    if (activeTab === "PAID") return Number(s.balance_amount || 0) <= 0.01;
    return true; // "ALL"
  });

  const totalBilled = safeSales.reduce((acc, s) => acc + Number(s.grand_total || 0), 0);
  const totalPaid = safeSales.reduce((acc, s) => acc + Number(s.paid_amount || 0), 0);
  const totalBalance = safeSales.reduce((acc, s) => acc + Number(s.balance_amount || 0), 0);

  const handleInlinePaymentSubmit = async (sale) => {
    const rawVal = inlineAmounts[sale.id];
    const amountToPay = parseFloat(rawVal);
    const balance = Number(sale.balance_amount || 0);

    if (!amountToPay || amountToPay <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (amountToPay > balance + 0.05) {
      toast.error(`Amount cannot exceed remaining balance of ${formatCurrency(balance)}`);
      return;
    }

    setInlineSubmittingId(sale.id);
    try {
      await plastApi.recordPayment(sale.id, {
        amount: amountToPay,
        payment_date: new Date().toISOString().split("T")[0],
        payment_mode: sale.payment_mode || "CASH",
        notes: "Quick payment entered via Payments table",
      });

      toast.success(
        `Payment of ${formatCurrency(amountToPay)} added to invoice ${sale.sale_number}!`
      );
      setInlineAmounts((prev) => ({ ...prev, [sale.id]: "" }));
      fetchSales();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to record payment");
    } finally {
      setInlineSubmittingId(null);
    }
  };

  const getStatusBadge = (sale) => {
    const balance = Number(sale.balance_amount || 0);
    const paid = Number(sale.paid_amount || 0);

    if (balance <= 0.01) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 size={12} />
          Paid in Full
        </span>
      );
    }
    if (paid > 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
          <Clock size={12} />
          Partially Paid
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
        <AlertCircle size={12} />
        Unpaid / Due
      </span>
    );
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Navbar
        title="Payments & Collections"
        subtitle="Track sales invoices, amount collected, pending balances, and record payments"
        actions={
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            loading={refreshing}
            onClick={() => fetchSales(true)}
          >
            Refresh
          </Button>
        }
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 overflow-y-auto w-full">
        {/* KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Billed"
            value={formatCurrency(totalBilled)}
            subtitle="Gross invoice value"
            icon={DollarSign}
          />
          <MetricCard
            title="Total Collected"
            value={formatCurrency(totalPaid)}
            subtitle="Amount paid across invoices"
            icon={CheckCircle2}
          />
          <MetricCard
            title="Balance Pending"
            value={formatCurrency(totalBalance)}
            subtitle={`${pendingCount} invoices awaiting payment`}
            icon={Clock}
          />
          <MetricCard
            title="Pending Invoices"
            value={`${pendingCount} Bills`}
            subtitle="With outstanding balance"
            icon={CreditCard}
          />
        </div>

        {/* Quick Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-[#EDEAE1]">
          <button
            type="button"
            onClick={() => setActiveTab("ALL")}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "ALL"
                ? "bg-[#2F6F5E] text-white shadow-sm"
                : "text-[#52607D] hover:bg-slate-100"
            }`}
          >
            <FileText size={14} />
            All Sales Bills ({safeSales.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("UNPAID")}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "UNPAID"
                ? "bg-rose-700 text-white shadow-sm"
                : "text-[#52607D] hover:bg-slate-100"
            }`}
          >
            <AlertCircle size={14} />
            Unpaid ({unpaidCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("PARTIAL")}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "PARTIAL"
                ? "bg-amber-600 text-white shadow-sm"
                : "text-[#52607D] hover:bg-slate-100"
            }`}
          >
            <Clock size={14} />
            Partially Paid ({partialCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("PAID")}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "PAID"
                ? "bg-emerald-700 text-white shadow-sm"
                : "text-[#52607D] hover:bg-slate-100"
            }`}
          >
            <CheckCircle2 size={14} />
            Fully Paid ({paidCount})
          </button>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-3 sm:p-4 rounded-[10px] border border-[#E4E1D8] shadow-[0_1px_2px_rgba(20,33,61,0.04)] grid grid-cols-1 sm:grid-cols-6 gap-3 items-center text-xs">
          <div className="relative sm:col-span-2">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8C97AB]" />
            <input
              type="text"
              placeholder="Search invoice number, customer name, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-[#E4E1D8] rounded-[6px] text-xs text-[#14213D] placeholder-[#8C97AB] focus:outline-none focus:border-[#2F6F5E]"
            />
          </div>

          <div>
            <CustomSelect
              size="sm"
              value={customerId}
              onChange={(val) => setCustomerId(val)}
              placeholder="All Customers"
              options={[
                { value: "", label: "All Customers" },
                ...(Array.isArray(customers) ? customers : []).map((c) => ({
                  value: c.id,
                  label: `${c.name} ${c.phone ? `(${c.phone})` : ""}`,
                })),
              ]}
            />
          </div>

          <div>
            <CustomSelect
              size="sm"
              value={paymentMode}
              onChange={(val) => setPaymentMode(val)}
              placeholder="All Payment Modes"
              options={[
                { value: "", label: "All Payment Modes" },
                { value: "CASH", label: "Cash" },
                { value: "UPI", label: "UPI / GPay" },
                { value: "BANK_TRANSFER", label: "Bank Transfer" },
                { value: "CHEQUE", label: "Cheque" },
              ]}
            />
          </div>

          <div className="flex gap-2 sm:col-span-2">
            <input
              type="date"
              title="From Date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-1/2 px-2.5 py-1.5 bg-white border border-[#E4E1D8] rounded-[6px] text-xs text-[#14213D] focus:outline-none focus:border-[#2F6F5E]"
            />
            <input
              type="date"
              title="To Date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-1/2 px-2.5 py-1.5 bg-white border border-[#E4E1D8] rounded-[6px] text-xs text-[#14213D] focus:outline-none focus:border-[#2F6F5E]"
            />
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white rounded-[10px] border border-[#E4E1D8] shadow-[0_1px_2px_rgba(20,33,61,0.04)] overflow-hidden">
          {loading ? (
            <div className="p-6">
              <SkeletonLoader count={5} />
            </div>
          ) : displayedSales.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              title="No bills found for selected filter"
              description="Switch filters or change the search query to see other sales records."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] border-b border-[#EDEAE1] text-[#52607D] font-semibold">
                  <tr>
                    <th className="py-3 px-4">Invoice No</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-3 text-right">Grand Total</th>
                    <th className="py-3 px-3 text-right text-emerald-800">Amount Paid</th>
                    <th className="py-3 px-3 text-right text-rose-800">Pending Balance</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Quick Payment Entry</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDEAE1]">
                  {displayedSales.map((sale) => {
                    const balance = Number(sale.balance_amount || 0);
                    const paid = Number(sale.paid_amount || 0);
                    const grand = Number(sale.grand_total || 0);
                    const percentPaid = grand > 0 ? Math.min(100, Math.round((paid / grand) * 100)) : 100;
                    const isSubmitting = inlineSubmittingId === sale.id;

                    return (
                      <tr key={sale.id} className="hover:bg-[#FAFAF8] transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-mono font-bold text-[#2F6F5E]">{sale.sale_number}</div>
                          <div className="text-[10px] text-[#8C97AB] font-mono">
                            Mode: {sale.payment_mode || "CASH"}
                          </div>
                        </td>

                        <td className="py-3 px-3 text-[#52607D] whitespace-nowrap">
                          {sale.sale_date}
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-bold text-[#14213D]">{sale.customer_name}</div>
                          {sale.customer_phone && (
                            <div className="text-[10px] text-[#52607D] font-mono">
                              {sale.customer_phone}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-3 text-right font-mono font-bold text-[#14213D]">
                          {formatCurrency(grand)}
                        </td>

                        <td className="py-3 px-3 text-right font-mono">
                          <div className="font-bold text-emerald-700">{formatCurrency(paid)}</div>
                          <div className="text-[10px] text-[#8C97AB]">{percentPaid}% collected</div>
                        </td>

                        <td className="py-3 px-3 text-right font-mono">
                          <div
                            className={`font-black text-sm ${
                              balance > 0.01 ? "text-rose-700" : "text-emerald-700 font-bold"
                            }`}
                          >
                            {formatCurrency(balance)}
                          </div>
                          {balance > 0.01 && (
                            <div className="text-[10px] text-rose-600 font-medium">To be collected</div>
                          )}
                        </td>

                        <td className="py-3 px-3 text-center">{getStatusBadge(sale)}</td>

                        {/* Quick Payment Entry Column */}
                        <td className="py-3 px-4">
                          {balance > 0.01 ? (
                            <div className="flex items-center gap-1.5 justify-center">
                              <div className="relative w-28">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[11px] text-[#8C97AB] font-bold">
                                  ₹
                                </span>
                                <input
                                  type="number"
                                  step="any"
                                  min="1"
                                  max={balance}
                                  placeholder={String(Math.round(balance))}
                                  value={inlineAmounts[sale.id] ?? ""}
                                  onChange={(e) =>
                                    setInlineAmounts((prev) => ({
                                      ...prev,
                                      [sale.id]: e.target.value,
                                    }))
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleInlinePaymentSubmit(sale);
                                  }}
                                  className="w-full pl-5 pr-1.5 py-1 text-xs font-mono font-bold bg-white border border-[#E4E1D8] rounded-[5px] text-[#14213D] focus:outline-none focus:border-[#2F6F5E]"
                                />
                              </div>

                              <button
                                type="button"
                                title="Add payment to this bill"
                                disabled={isSubmitting || !inlineAmounts[sale.id]}
                                onClick={() => handleInlinePaymentSubmit(sale)}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-[5px] font-bold text-xs flex items-center gap-0.5 transition-colors shadow-sm"
                              >
                                {isSubmitting ? (
                                  <RefreshCw size={12} className="animate-spin" />
                                ) : (
                                  <Check size={13} />
                                )}
                                Add
                              </button>
                            </div>
                          ) : (
                            <div className="text-center text-[11px] font-semibold text-emerald-700 flex items-center justify-center gap-1">
                              <CheckCircle2 size={13} />
                              Zero Balance
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {balance > 0.01 && (
                              <Button
                                variant="secondary"
                                size="xs"
                                icon={CreditCard}
                                className="text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200"
                                onClick={() => setActivePaymentSale(sale)}
                              >
                                Record
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="xs"
                              icon={History}
                              title="View Payment Ledger"
                              onClick={() => setHistorySale(sale)}
                            >
                              Ledger
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Record Payment Full Modal */}
      <RecordPaymentModal
        isOpen={Boolean(activePaymentSale)}
        onClose={() => setActivePaymentSale(null)}
        sale={activePaymentSale}
        onSuccess={() => {
          fetchSales();
        }}
      />

      {/* Payment Ledger / History Modal */}
      <Modal
        isOpen={Boolean(historySale)}
        onClose={() => setHistorySale(null)}
        title={`Payment History - ${historySale?.sale_number || ""}`}
        size="md"
      >
        {historySale && (
          <div className="space-y-4 text-xs">
            <div className="bg-[#F8FAFC] p-3 rounded border border-[#EDEAE1] flex justify-between items-center">
              <div>
                <div className="text-[10px] font-bold text-[#52607D] uppercase">Customer</div>
                <div className="text-sm font-bold text-[#14213D]">{historySale.customer_name}</div>
                <div className="font-mono text-[11px] text-[#52607D]">
                  Billed: {formatCurrency(historySale.grand_total)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-bold text-[#52607D] uppercase">Remaining Due</div>
                <div className="text-base font-mono font-black text-rose-700">
                  {formatCurrency(historySale.balance_amount)}
                </div>
                <div className="text-[11px] font-bold text-emerald-700">
                  Paid: {formatCurrency(historySale.paid_amount)}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="font-bold text-[#14213D]">Transactions Received</div>
              {historySale.payments && historySale.payments.length > 0 ? (
                <div className="border border-[#EDEAE1] rounded-[8px] overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F8FAFC] text-[#52607D] font-semibold border-b border-[#EDEAE1]">
                      <tr>
                        <th className="p-2.5">Date</th>
                        <th className="p-2.5">Mode</th>
                        <th className="p-2.5">Reference / Notes</th>
                        <th className="p-2.5 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EDEAE1]">
                      {historySale.payments.map((p, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2.5 font-mono text-[#52607D]">{p.payment_date}</td>
                          <td className="p-2.5 font-medium">
                            <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-bold">
                              {p.payment_mode}
                            </span>
                          </td>
                          <td className="p-2.5 text-[#52607D]">
                            <div>{p.reference_number || "—"}</div>
                            {p.notes && <div className="text-[10px] text-[#8C97AB]">{p.notes}</div>}
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-emerald-700">
                            {formatCurrency(p.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400 italic">
                  No payment transactions recorded yet.
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-[#EDEAE1]">
              {Number(historySale.balance_amount) > 0.01 ? (
                <Button
                  variant="primary"
                  size="sm"
                  icon={CreditCard}
                  onClick={() => {
                    const toPay = historySale;
                    setHistorySale(null);
                    setActivePaymentSale(toPay);
                  }}
                >
                  Record Payment Now
                </Button>
              ) : (
                <div className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 size={14} />
                  Fully Cleared
                </div>
              )}
              <Button variant="secondary" size="sm" onClick={() => setHistorySale(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default PlastPaymentsPage;
