import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  Plus,
  Search,
  RefreshCw,
  Eye,
  Printer,
  DollarSign,
  TrendingUp,
  Receipt,
  FileText,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
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
import { useAuth } from "../../context/AuthContext.jsx";

export function PlastSalesPage() {
  const { user } = useAuth();
  const role = (user?.role || "USER").toUpperCase();
  const canViewLogs = role === "ADMIN" || role === "PLAST_PAYMENTS";

  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  // Filters
  const [search, setSearch] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [paymentMode, setPaymentMode] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Modal states
  const [selectedSale, setSelectedSale] = useState(null);
  const [paymentModalSale, setPaymentModalSale] = useState(null);

  const fetchSales = async (isManual = false) => {
    if (!canViewLogs) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    if (isManual) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await plastApi.getSales({
        customer_id: customerId || undefined,
        payment_status: paymentStatus || undefined,
        payment_mode: paymentMode || undefined,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
        search: search || undefined,
      });
      setSales(Array.isArray(data) ? data : data?.data || []);
    } catch (err) {
      toast.error("Failed to load sales history");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchCustomers = async () => {
    if (!canViewLogs) return;
    try {
      const data = await plastApi.getCustomers();
      setCustomers(Array.isArray(data) ? data : data?.data || []);
    } catch (err) {
      setCustomers([]);
    }
  };

  useEffect(() => {
    if (canViewLogs) {
      fetchCustomers();
    } else {
      setLoading(false);
    }
  }, [canViewLogs]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSales();
    }, 200);
    return () => clearTimeout(timer);
  }, [search, customerId, paymentStatus, paymentMode, fromDate, toDate]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(val || 0);
  };

  const safeSales = Array.isArray(sales) ? sales : [];
  const totalRevenue = safeSales.reduce((acc, s) => acc + Number(s.grand_total || 0), 0);
  const totalPaid = safeSales.reduce((acc, s) => acc + Number(s.paid_amount || 0), 0);
  const totalBalance = safeSales.reduce((acc, s) => acc + Number(s.balance_amount || 0), 0);

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = (sale) => {
    const balance = Number(sale.balance_amount || 0);
    const paid = Number(sale.paid_amount || 0);

    if (balance <= 0.01) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 size={12} />
          Paid
        </span>
      );
    }
    if (paid > 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
          <Clock size={12} />
          Partial ({formatCurrency(balance)} due)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
        <AlertCircle size={12} />
        Unpaid
      </span>
    );
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Navbar
        title={canViewLogs ? "Sales & Invoices" : "Customer Sales & Billing"}
        subtitle={
          canViewLogs
            ? "Customer sales bills, receipts, amount paid tracking, and balance status"
            : "Create customer sales bills and issue printed invoices"
        }
        actions={
          <>
            {canViewLogs && (
              <Button
                variant="secondary"
                size="sm"
                icon={RefreshCw}
                loading={refreshing}
                onClick={() => fetchSales(true)}
              >
                Refresh
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => navigate("/plast/sales/new")}
            >
              + New Sale Bill
            </Button>
          </>
        }
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 overflow-y-auto w-full">
        {!canViewLogs ? (
          <div className="max-w-xl mx-auto my-12 bg-white rounded-[12px] border border-[#E4E1D8] p-8 shadow-sm text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-[#2F6F5E]">
              <ShoppingCart size={32} />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-lg font-bold text-[#14213D]">Customer Sales & Billing</h2>
              <p className="text-xs text-[#52607D] max-w-sm mx-auto">
                Create and issue customer sales invoices, select finished goods, apply bill discounts, and generate printed receipts.
              </p>
            </div>
            <div className="pt-2">
              <Button
                variant="primary"
                size="lg"
                icon={Plus}
                onClick={() => navigate("/plast/sales/new")}
                className="px-6 py-2.5 text-sm font-bold shadow-xs inline-flex items-center gap-2"
              >
                + New Sale Bill
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* KPI Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Total Invoiced"
                value={formatCurrency(totalRevenue)}
                subtitle="Gross turnover billed"
                icon={DollarSign}
              />
              <MetricCard
                title="Amount Collected"
                value={formatCurrency(totalPaid)}
                subtitle="Total payments received"
                icon={CheckCircle2}
              />
              <MetricCard
                title="Pending Balance"
                value={formatCurrency(totalBalance)}
                subtitle="Outstanding balance due"
                icon={Clock}
              />
              <MetricCard
                title="Total Invoices"
                value={`${safeSales.length} Bills`}
                subtitle="Issued customer bills"
                icon={FileText}
              />
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-3 sm:p-4 rounded-[10px] border border-[#E4E1D8] shadow-[0_1px_2px_rgba(20,33,61,0.04)] grid grid-cols-1 sm:grid-cols-6 gap-3 items-center text-xs">
              <div className="relative sm:col-span-2">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8C97AB]" />
                <input
                  type="text"
                  placeholder="Search invoice or customer..."
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
                  value={paymentStatus}
                  onChange={(val) => setPaymentStatus(val)}
                  placeholder="All Payment Status"
                  options={[
                    { value: "", label: "All Statuses" },
                    { value: "PAID", label: "Paid in Full" },
                    { value: "PARTIAL", label: "Partially Paid" },
                    { value: "UNPAID", label: "Unpaid / Due" },
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
                    { value: "", label: "All Modes" },
                    { value: "CASH", label: "Cash" },
                    { value: "UPI", label: "UPI / GPay" },
                    { value: "BANK_TRANSFER", label: "Bank Transfer" },
                    { value: "CHEQUE", label: "Cheque" },
                  ]}
                />
              </div>

              <div className="flex gap-2">
                <input
                  type="date"
                  title="From Date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-1/2 px-2 py-1.5 bg-white border border-[#E4E1D8] rounded-[6px] text-xs text-[#14213D] focus:outline-none focus:border-[#2F6F5E]"
                />
                <input
                  type="date"
                  title="To Date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-1/2 px-2 py-1.5 bg-white border border-[#E4E1D8] rounded-[6px] text-xs text-[#14213D] focus:outline-none focus:border-[#2F6F5E]"
                />
              </div>
            </div>

            {/* Sales Invoices Table */}
            <div className="bg-white rounded-[10px] border border-[#E4E1D8] shadow-[0_1px_2px_rgba(20,33,61,0.04)] overflow-hidden">
              {loading ? (
                <div className="p-6">
                  <SkeletonLoader count={5} />
                </div>
              ) : safeSales.length === 0 ? (
                <EmptyState
                  icon={ShoppingCart}
                  title="No sales invoices found"
                  description="Click '+ New Sale Bill' above to issue a customer invoice."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F8FAFC] border-b border-[#EDEAE1] text-[#52607D] font-semibold">
                      <tr>
                        <th className="py-3 px-4">Invoice No</th>
                        <th className="py-3 px-3">Date</th>
                        <th className="py-3 px-4">Customer</th>
                        <th className="py-3 px-3 text-right">Total Bill</th>
                        <th className="py-3 px-3 text-right text-emerald-800">Amount Paid</th>
                        <th className="py-3 px-3 text-right text-rose-800">Balance Due</th>
                        <th className="py-3 px-3 text-center">Mode</th>
                        <th className="py-3 px-3 text-center">Status</th>
                        <th className="py-3 px-3 text-center">Entered By</th>
                        <th className="py-3 px-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EDEAE1]">
                      {safeSales.map((sale) => {
                        const balance = Number(sale.balance_amount || 0);
                        const paid = Number(sale.paid_amount || 0);
                        const enteredBy = sale.creator?.username || sale.created_by_name || "admin";

                        return (
                          <tr key={sale.id} className="hover:bg-[#FAFAF8] transition-colors">
                            <td className="py-3 px-4 font-mono font-bold text-[#2F6F5E]">
                              {sale.sale_number}
                            </td>
                            <td className="py-3 px-3 text-[#52607D]">{sale.sale_date}</td>
                            <td className="py-3 px-4">
                              <div className="font-bold text-[#14213D]">{sale.customer_name}</div>
                              {sale.customer_phone && (
                                <div className="text-[10px] text-[#52607D] font-mono">{sale.customer_phone}</div>
                              )}
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-[#14213D]">
                              {formatCurrency(sale.grand_total)}
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                              {formatCurrency(paid)}
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-bold">
                              <span className={balance > 0 ? "text-rose-700 font-black" : "text-slate-400"}>
                                {formatCurrency(balance)}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center font-medium text-[11px] text-[#52607D]">
                              <span className="px-2 py-0.5 bg-slate-100 rounded text-[#14213D] border border-slate-200">
                                {sale.payment_mode || "CASH"}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center">{getStatusBadge(sale)}</td>
                            <td className="py-3 px-3 text-center">
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-50 text-[#2F6F5E] border border-emerald-200"
                                title={`Sale entered by @${enteredBy}`}
                              >
                                <User size={10} className="text-[#2F6F5E]" />
                                {enteredBy}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <Button
                                  variant="ghost"
                                  size="xs"
                                  icon={Eye}
                                  onClick={() => setSelectedSale(sale)}
                                >
                                  Bill
                                </Button>
                                {balance > 0 && (
                                  <Button
                                    variant="secondary"
                                    size="xs"
                                    icon={CreditCard}
                                    className="text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border-emerald-200"
                                    onClick={() => setPaymentModalSale(sale)}
                                  >
                                    + Pay
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
            </div>
          </>
        )}
      </main>

      {/* Invoice Detail / Printable Modal */}
      <Modal
        isOpen={Boolean(selectedSale)}
        onClose={() => setSelectedSale(null)}
        title={`Invoice: ${selectedSale?.sale_number || ""}`}
        size="lg"
      >
        {selectedSale && (
          <div className="space-y-4">
            <div id="printable-bill" className="p-4 bg-white rounded border border-[#E4E1D8] space-y-4 text-xs">
              <div className="flex justify-between items-start border-b border-[#EDEAE1] pb-3">
                <div>
                  <h2 className="text-base font-bold text-[#2F6F5E]">CHERAN PLAST</h2>
                  <p className="text-[10px] text-[#52607D]">PVC & Polymer Manufacturing Division</p>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-[#14213D]">{selectedSale.sale_number}</div>
                  <div className="text-[#52607D]">Date: {selectedSale.sale_date}</div>
                  <div className="text-[10px] text-[#52607D] mt-0.5">
                    Entered By: <strong className="font-mono text-[#2F6F5E]">@{selectedSale.creator?.username || selectedSale.created_by_name || "admin"}</strong>
                  </div>
                </div>
              </div>

              <div className="bg-[#F8FAFC] p-2.5 rounded border border-[#EDEAE1] flex justify-between items-start">
                <div>
                  <div className="text-[10px] font-bold text-[#52607D] uppercase">Billed To</div>
                  <div className="text-sm font-bold text-[#14213D] mt-0.5">{selectedSale.customer_name}</div>
                  {selectedSale.customer_phone && (
                    <div className="text-xs text-[#52607D] font-mono">Phone: {selectedSale.customer_phone}</div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold text-[#52607D] uppercase">Payment Status</div>
                  <div className="mt-1">{getStatusBadge(selectedSale)}</div>
                </div>
              </div>

              {/* Items in Invoice */}
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAFAF8] border-b border-[#EDEAE1] text-[#52607D]">
                  <tr>
                    <th className="py-2 px-2">Item Name</th>
                    <th className="py-2 px-2 text-center">Qty</th>
                    <th className="py-2 px-2 text-right">Unit Price</th>
                    <th className="py-2 px-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDEAE1]">
                  {selectedSale.items?.map((it, idx) => {
                    const unitLabel = typeof it.unit === "object" 
                      ? (it.unit?.symbol || it.unit?.name || "") 
                      : (it.unit || "");
                    const lineTotal = it.line_total || it.total_amount || (Number(it.quantity || 0) * Number(it.unit_price || 0));

                    return (
                      <tr key={idx}>
                        <td className="py-2 px-2 font-medium">{it.item_name}</td>
                        <td className="py-2 px-2 text-center font-mono">
                          {it.quantity} {unitLabel}
                        </td>
                        <td className="py-2 px-2 text-right font-mono">{formatCurrency(it.unit_price)}</td>
                        <td className="py-2 px-2 text-right font-mono font-bold text-[#14213D]">
                          {formatCurrency(lineTotal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Summary Breakdown */}
              <div className="flex justify-between items-start pt-2 border-t border-[#EDEAE1]">
                {/* Payment History in Bill */}
                <div className="w-1/2 pr-4 space-y-1.5">
                  <div className="text-[11px] font-bold text-[#14213D] uppercase tracking-wider">
                    Payment Ledger
                  </div>
                  {selectedSale.payments && selectedSale.payments.length > 0 ? (
                    <div className="border border-[#EDEAE1] rounded overflow-hidden">
                      <table className="w-full text-[10px] text-left">
                        <thead className="bg-[#F8FAFC] text-[#52607D]">
                          <tr>
                            <th className="p-1.5">Date</th>
                            <th className="p-1.5">Mode</th>
                            <th className="p-1.5 text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#EDEAE1]">
                          {selectedSale.payments.map((p, pIdx) => (
                            <tr key={pIdx}>
                              <td className="p-1.5 text-[#52607D]">{p.payment_date}</td>
                              <td className="p-1.5">{p.payment_mode}</td>
                              <td className="p-1.5 text-right font-mono font-bold text-emerald-700">
                                {formatCurrency(p.amount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-[11px] text-[#8C97AB] italic">No payment transactions recorded</div>
                  )}
                </div>

                <div className="w-64 space-y-1">
                  <div className="flex justify-between text-[#52607D]">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(selectedSale.subtotal)}</span>
                  </div>
                  {Number(selectedSale.discount_amount) > 0 && (
                    <div className="flex justify-between text-amber-800 font-medium">
                      <span>
                        Bill Discount
                        {selectedSale.discount_type === "PERCENTAGE" && Number(selectedSale.discount_value) > 0
                          ? ` (${selectedSale.discount_value}%)`
                          : ""}:
                      </span>
                      <span>- {formatCurrency(selectedSale.discount_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[#52607D]">
                    <span>Taxable Amount:</span>
                    <span>{formatCurrency(selectedSale.taxable_amount)}</span>
                  </div>
                  <div className="flex justify-between text-[#52607D]">
                    <span>GST ({selectedSale.gst_rate}%):</span>
                    <span>{formatCurrency(selectedSale.gst_amount)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-[#14213D] border-t border-[#EDEAE1] pt-1.5">
                    <span>Grand Total:</span>
                    <span className="text-[#2F6F5E]">{formatCurrency(selectedSale.grand_total)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold text-emerald-700 pt-1">
                    <span>Amount Paid:</span>
                    <span className="font-mono font-bold">{formatCurrency(selectedSale.paid_amount)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold text-rose-700 border-t border-dashed border-[#EDEAE1] pt-1">
                    <span>Balance Due:</span>
                    <span className="font-mono font-bold">{formatCurrency(selectedSale.balance_amount)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" size="sm" onClick={() => setSelectedSale(null)}>
                Close
              </Button>
              {Number(selectedSale.balance_amount) > 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  icon={CreditCard}
                  className="text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200"
                  onClick={() => {
                    const toPay = selectedSale;
                    setSelectedSale(null);
                    setPaymentModalSale(toPay);
                  }}
                >
                  Record Payment
                </Button>
              )}
              <Button variant="primary" size="sm" icon={Printer} onClick={handlePrint}>
                Print Receipt
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={Boolean(paymentModalSale)}
        onClose={() => setPaymentModalSale(null)}
        sale={paymentModalSale}
        onSuccess={() => {
          fetchSales();
        }}
      />
    </div>
  );
}

export default PlastSalesPage;
