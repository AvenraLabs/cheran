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
  Plus,
  Share2,
  Calendar,
  Building2,
  Download,
} from "lucide-react";
import { plastApi } from "../../api/plastApi.js";
import Navbar from "../../components/layout/Navbar.jsx";
import MetricCard from "../../components/common/MetricCard.jsx";
import Button from "../../components/common/Button.jsx";
import Modal from "../../components/common/Modal.jsx";
import CustomSelect from "../../components/common/CustomSelect.jsx";
import { SkeletonLoader, EmptyState } from "../../components/common/SkeletonLoader.jsx";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function PlastPaymentsPage() {
  const [activeTab, setActiveTab] = useState("COLLECTIONS"); // "COLLECTIONS" or "BALANCES"
  const [payments, setPayments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Record Payment Modal
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [recordForm, setRecordForm] = useState({
    customer_id: "",
    amount: "",
    payment_date: new Date().toISOString().split("T")[0],
  });
  const [recording, setRecording] = useState(false);

  // Statement / Ledger Modal
  const [ledgerCustomer, setLedgerCustomer] = useState(null);
  const [ledgerData, setLedgerData] = useState(null);
  const [loadingLedger, setLoadingLedger] = useState(false);
  const [exportingLedgerPdf, setExportingLedgerPdf] = useState(false);

  const fetchSummary = async () => {
    try {
      const data = await plastApi.getPaymentsSummary({
        customer_id: customerId || undefined,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
      });
      setSummary(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPayments = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    try {
      const [paymentsRes, customersRes] = await Promise.all([
        plastApi.getPayments({
          customer_id: customerId || undefined,
          from_date: fromDate || undefined,
          to_date: toDate || undefined,
          search: search || undefined,
        }),
        plastApi.getCustomers(),
        fetchSummary(),
      ]);

      setPayments(Array.isArray(paymentsRes) ? paymentsRes : paymentsRes?.data || []);
      setCustomers(Array.isArray(customersRes) ? customersRes : customersRes?.data || []);
    } catch (err) {
      toast.error("Failed to load payment records");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPayments();
    }, 200);
    return () => clearTimeout(timer);
  }, [search, customerId, fromDate, toDate]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(Math.round(Number(val) || 0));
  };

  const openRecordModal = (prefillCustomer = null) => {
    setRecordForm({
      customer_id: prefillCustomer?.id || "",
      amount: prefillCustomer?.current_balance > 0 ? String(Math.round(prefillCustomer.current_balance)) : "",
      payment_date: new Date().toISOString().split("T")[0],
    });
    setIsRecordModalOpen(true);
  };

  const handleRecordSubmit = async (e) => {
    e.preventDefault();
    if (!recordForm.customer_id) {
      toast.error("Please select a customer");
      return;
    }

    const amt = parseFloat(recordForm.amount);
    if (!amt || amt <= 0) {
      toast.error("Please enter a valid amount greater than 0");
      return;
    }

    setRecording(true);
    try {
      await plastApi.recordCustomerPayment(recordForm.customer_id, {
        amount: amt,
        payment_date: recordForm.payment_date,
      });

      toast.success(`Payment of ${formatCurrency(amt)} recorded successfully!`);
      setIsRecordModalOpen(false);
      fetchPayments();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to record payment");
    } finally {
      setRecording(false);
    }
  };

  // Open Statement / Ledger Modal
  const openLedgerModal = async (cust) => {
    setLedgerCustomer(cust);
    setLoadingLedger(true);
    try {
      const data = await plastApi.getCustomerLedger(cust.id);
      setLedgerData(data);
    } catch (err) {
      toast.error("Failed to load customer statement");
      setLedgerCustomer(null);
    } finally {
      setLoadingLedger(false);
    }
  };

  const handleExportStatementPdf = (ledger) => {
    if (!ledger) return;
    setExportingLedgerPdf(true);
    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFillColor(47, 111, 94);
      doc.rect(0, 0, pageWidth, 28, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.text("CHERAN PLAST", 14, 12);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(220, 235, 230);
      doc.text("PVC & Polymer Pipes Manufacturing Division", 14, 18);
      doc.text("Customer Account Ledger / Statement of Account", 14, 23);

      const todayStr = new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text(`Date: ${todayStr}`, pageWidth - 14, 12, { align: "right" });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(20, 33, 61);
      doc.text(`Customer: ${ledger.customer.name}`, 14, 36);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(82, 96, 125);
      if (ledger.customer.phone) doc.text(`Phone: ${ledger.customer.phone}`, 14, 41);
      if (ledger.customer.address) doc.text(`Address: ${ledger.customer.address}`, 14, 46);

      const summaryBoxX = pageWidth - 90;
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(summaryBoxX - 4, 31, 80, 26, 2, 2, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(82, 96, 125);
      doc.text("Opening Balance:", summaryBoxX, 36);
      doc.text("Total Billed:", summaryBoxX, 41);
      doc.text("Total Paid:", summaryBoxX, 46);
      doc.text("Net Outstanding:", summaryBoxX, 52);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(20, 33, 61);
      doc.text(`Rs. ${Math.round(ledger.summary.opening_balance).toLocaleString("en-IN")}`, pageWidth - 16, 36, { align: "right" });
      doc.text(`Rs. ${Math.round(ledger.summary.total_billed).toLocaleString("en-IN")}`, pageWidth - 16, 41, { align: "right" });
      doc.setTextColor(22, 101, 52);
      doc.text(`Rs. ${Math.round(ledger.summary.total_paid).toLocaleString("en-IN")}`, pageWidth - 16, 46, { align: "right" });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      if (ledger.summary.current_balance > 0) doc.setTextColor(190, 24, 93);
      else doc.setTextColor(22, 101, 52);
      doc.text(`Rs. ${Math.round(ledger.summary.current_balance).toLocaleString("en-IN")}`, pageWidth - 16, 52, { align: "right" });

      const tableRows = (ledger.entries || []).map((entry) => [
        entry.date || "",
        entry.type || "",
        entry.description || "",
        entry.debit > 0 ? `Rs. ${Math.round(entry.debit).toLocaleString("en-IN")}` : "—",
        entry.credit > 0 ? `Rs. ${Math.round(entry.credit).toLocaleString("en-IN")}` : "—",
        `Rs. ${Math.round(entry.running_balance).toLocaleString("en-IN")}`,
      ]);

      autoTable(doc, {
        startY: 61,
        head: [["Date", "Type", "Particulars / Description", "Debit (+)", "Credit (-)", "Balance"]],
        body: tableRows,
        theme: "striped",
        headStyles: {
          fillColor: [47, 111, 94],
          textColor: 255,
          fontStyle: "bold",
          fontSize: 8.5,
          cellPadding: 2.5,
        },
        columnStyles: {
          0: { cellWidth: 22 },
          1: { cellWidth: 22 },
          2: { cellWidth: "auto" },
          3: { cellWidth: 26, halign: "right", fontStyle: "bold" },
          4: { cellWidth: 26, halign: "right", fontStyle: "bold" },
          5: { cellWidth: 28, halign: "right", fontStyle: "bold" },
        },
        styles: { fontSize: 8, cellPadding: 2.2, textColor: [20, 33, 61] },
        alternateRowStyles: { fillColor: [250, 250, 248] },
      });

      const safeName = (ledger.customer.name || "Customer").replace(/[/\\?%*:|"<> ]/g, "_");
      doc.save(`Cheran_Plast_Statement_${safeName}.pdf`);
      toast.success("Statement PDF downloaded successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export statement PDF");
    } finally {
      setExportingLedgerPdf(false);
    }
  };

  const shareStatementOnWhatsApp = (customer) => {
    if (!customer) return;
    const phone = customer.phone || "";
    const cleanPhone = phone.replace(/\D/g, "").replace(/^0+/, "");
    const targetPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    const opening = Math.round(Number(customer.opening_balance) || 0);
    const billed = Math.round(Number(customer.total_billed) || 0);
    const paid = Math.round(Number(customer.total_paid) || 0);
    const pending = Math.round(Number(customer.current_balance) || 0);

    const msg = `📋 *CHERAN PLAST - STATEMENT OF ACCOUNT*\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `*Customer:* ${customer.name}\n` +
      `*Statement Date:* ${new Date().toISOString().split("T")[0]}\n\n` +
      `*Opening Pending Balance:* ₹${opening.toLocaleString("en-IN")}\n` +
      `*Total Invoices Billed:* ₹${billed.toLocaleString("en-IN")}\n` +
      `*Total Payments Received:* ₹${paid.toLocaleString("en-IN")}\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `*CURRENT PENDING AMOUNT:* ₹${pending.toLocaleString("en-IN")}\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `Kindly arrange payment for the pending balance. If already paid, please ignore.\n\n` +
      `Thank you for your business! 🙏\nCheran Plast`;

    const url = targetPhone
      ? `https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;

    window.open(url, "_blank");
  };

  const customerSelectOptions = [
    { value: "", label: "Select a customer..." },
    ...customers.map((c) => ({
      value: c.id,
      label: `${c.name} ${c.current_balance > 0 ? `(₹${Math.round(c.current_balance).toLocaleString("en-IN")} pending)` : ""}`.trim(),
    })),
  ];

  const filterCustomerOptions = [
    { value: "", label: "All Customers" },
    ...customers.map((c) => ({
      value: c.id,
      label: c.name,
    })),
  ];

  const totalCollectedMetric = summary?.total_collected ?? customers.reduce((s, c) => s + Number(c.total_paid || 0), 0);
  const totalOutstandingMetric = summary?.total_ledger_outstanding ?? customers.reduce((s, c) => s + Number(c.current_balance || 0), 0);
  const totalOpeningMetric = summary?.total_opening_balance ?? customers.reduce((s, c) => s + Number(c.opening_balance || 0), 0);
  const totalBilledMetric = summary?.total_billed ?? customers.reduce((s, c) => s + Number(c.total_billed || 0), 0);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Navbar
        title="Collections & Receipts"
        subtitle="Manage customer payments, opening balances, account statements & running ledger"
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              loading={refreshing}
              onClick={() => fetchPayments(true)}
            >
              Refresh
            </Button>
          </>
        }
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 overflow-y-auto w-full">
        {/* KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Collections"
            value={formatCurrency(totalCollectedMetric)}
            subtitle="Total customer receipts recorded"
            icon={TrendingUp}
          />
          <MetricCard
            title="Net Customer Outstanding"
            value={formatCurrency(totalOutstandingMetric)}
            subtitle="Balance pending to collect"
            icon={Receipt}
          />
          <MetricCard
            title="Total Billed"
            value={formatCurrency(totalBilledMetric)}
            subtitle="Gross invoice volume"
            icon={DollarSign}
          />
          <MetricCard
            title="Opening Balances"
            value={formatCurrency(totalOpeningMetric)}
            subtitle="Pre-app pending amounts"
            icon={Clock}
          />
        </div>


        {/* Filters */}
        <div className="bg-white p-3 sm:p-4 rounded-[10px] border border-[#E4E1D8] shadow-[0_1px_2px_rgba(20,33,61,0.04)] space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C97AB]" />
              <input
                type="text"
                placeholder="Search customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-[#E4E1D8] rounded-[7px] text-[#14213D] placeholder-[#8C97AB] focus:outline-none focus:border-[#2F6F5E]"
              />
            </div>

            <CustomSelect
              options={filterCustomerOptions}
              value={customerId}
              onChange={setCustomerId}
              placeholder="Filter by Customer"
            />

            <div className="flex items-center gap-2">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-2 py-1 text-xs bg-white border border-[#E4E1D8] rounded-[7px] text-[#14213D] focus:outline-none focus:border-[#2F6F5E]"
                title="From Date"
              />
              <span className="text-[#8C97AB] text-xs">to</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-2 py-1 text-xs bg-white border border-[#E4E1D8] rounded-[7px] text-[#14213D] focus:outline-none focus:border-[#2F6F5E]"
                title="To Date"
              />
            </div>
          </div>
        </div>

        {/* Collections Log */}
        <div className="bg-white rounded-[10px] border border-[#E4E1D8] shadow-[0_1px_2px_rgba(20,33,61,0.04)] overflow-hidden">
            {loading ? (
              <div className="p-6">
                <SkeletonLoader count={5} />
              </div>
            ) : payments.length === 0 ? (
              <EmptyState
                icon={CreditCard}
                title="No collection records found"
                description="Use '+ Record Payment' above to record collections from customers."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAFC] border-b border-[#EDEAE1] text-[#52607D] font-semibold">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Receipt / Ref #</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Linked To</th>
                      <th className="py-3 px-4 text-right">Amount Received</th>
                      <th className="py-3 px-4">Recorded By</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDEAE1]">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-[#FAFAF8] transition-colors">
                        <td className="py-3 px-4 font-mono text-[#52607D] whitespace-nowrap">
                          {p.payment_date}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-[#14213D]">
                          {p.reference_number || `REC-${p.id.slice(0, 8).toUpperCase()}`}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-[#14213D]">
                            {p.customer?.name || "Customer"}
                          </div>
                          {p.customer?.phone && (
                            <div className="text-[10px] text-[#8C97AB]">{p.customer.phone}</div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {p.sale?.sale_number ? (
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-50 text-blue-700 border border-blue-200">
                              Bill #{p.sale.sale_number}
                            </span>
                          ) : (
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Account Balance
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 text-sm">
                          {formatCurrency(p.amount)}
                        </td>
                        <td className="py-3 px-4 text-[#8C97AB] font-mono text-[11px]">
                          @{p.created_by_name || "admin"}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {p.customer && (
                            <Button
                              variant="ghost"
                              size="xs"
                              icon={FileText}
                              onClick={() => openLedgerModal(p.customer)}
                            >
                              Statement
                            </Button>
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

      {/* Record Customer Payment Modal */}
      <Modal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        title="Record Customer Payment"
        size="sm"
      >
        <form onSubmit={handleRecordSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-[#14213D] mb-1">
              Select Customer *
            </label>
            <CustomSelect
              options={customerSelectOptions}
              value={recordForm.customer_id}
              onChange={(val) => {
                const sel = customers.find((c) => c.id === val);
                setRecordForm({
                  ...recordForm,
                  customer_id: val,
                  amount: sel && sel.current_balance > 0 ? String(Math.round(sel.current_balance)) : recordForm.amount,
                });
              }}
              placeholder="Select customer"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#14213D] mb-1">
              Payment Amount (₹) *
            </label>
            <input
              type="number"
              step="any"
              min="0.01"
              required
              placeholder="Enter amount paid"
              value={recordForm.amount}
              onChange={(e) => setRecordForm({ ...recordForm, amount: e.target.value })}
              className="w-full px-2.5 py-1.5 text-sm bg-white border border-[#E4E1D8] rounded-[6px] text-[#14213D] font-mono font-bold focus:outline-none focus:border-[#2F6F5E]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-[#14213D] mb-1">
                Payment Date
              </label>
              <input
                type="date"
                value={recordForm.payment_date}
                onChange={(e) => setRecordForm({ ...recordForm, payment_date: e.target.value })}
                className="w-full px-2 py-1.5 text-xs bg-white border border-[#E4E1D8] rounded-[6px] text-[#14213D] font-mono focus:outline-none focus:border-[#2F6F5E]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#EDEAE1]">
            <Button type="button" variant="secondary" size="sm" onClick={() => setIsRecordModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={recording}>
              Record Payment
            </Button>
          </div>
        </form>
      </Modal>

      {/* Customer Statement / Account Ledger Modal */}
      <Modal
        isOpen={Boolean(ledgerCustomer)}
        onClose={() => {
          setLedgerCustomer(null);
          setLedgerData(null);
        }}
        title={`Statement of Account: ${ledgerCustomer?.name || ""}`}
        size="lg"
      >
        {loadingLedger ? (
          <div className="p-6">
            <SkeletonLoader count={4} />
          </div>
        ) : ledgerData ? (
          <div className="space-y-4">
            {/* Account Summary Banner */}
            <div className="bg-[#F8FAFC] p-3 rounded-[8px] border border-[#E4E1D8] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[#8C97AB] block text-[10px] uppercase font-bold">Opening Pending</span>
                <span className="font-mono font-bold text-[#14213D]">
                  {formatCurrency(ledgerData.summary.opening_balance)}
                </span>
              </div>
              <div>
                <span className="text-[#8C97AB] block text-[10px] uppercase font-bold">Total Invoiced</span>
                <span className="font-mono font-bold text-[#14213D]">
                  {formatCurrency(ledgerData.summary.total_billed)}
                </span>
                <span className="text-[10px] text-[#8C97AB] ml-1">({ledgerData.summary.total_invoices} bills)</span>
              </div>
              <div>
                <span className="text-[#8C97AB] block text-[10px] uppercase font-bold">Total Paid</span>
                <span className="font-mono font-bold text-emerald-700">
                  {formatCurrency(ledgerData.summary.total_paid)}
                </span>
                <span className="text-[10px] text-[#8C97AB] ml-1">({ledgerData.summary.total_payments} receipts)</span>
              </div>
              <div>
                <span className="text-[#8C97AB] block text-[10px] uppercase font-bold">Current Outstanding</span>
                <span
                  className={`font-mono font-bold text-sm ${
                    ledgerData.summary.current_balance > 0
                      ? "text-rose-700"
                      : "text-emerald-700"
                  }`}
                >
                  {formatCurrency(ledgerData.summary.current_balance)}
                </span>
              </div>
            </div>

            {/* Ledger Transactions Table */}
            <div className="max-h-[380px] overflow-y-auto border border-[#E4E1D8] rounded-[8px]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] border-b border-[#EDEAE1] text-[#52607D] font-semibold sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3 text-right">Debit (+)</th>
                    <th className="py-2.5 px-3 text-right">Credit (-)</th>
                    <th className="py-2.5 px-3 text-right">Running Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDEAE1]">
                  {ledgerData.entries.map((row, idx) => (
                    <tr
                      key={idx}
                      className={
                        row.type === "OPENING"
                          ? "bg-amber-50/50 font-medium"
                          : "hover:bg-[#FAFAF8] transition-colors"
                      }
                    >
                      <td className="py-2 px-3 font-mono text-[#52607D]">{row.date}</td>
                      <td className="py-2 px-3">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            row.type === "INVOICE"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : row.type === "PAYMENT"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-amber-50 text-amber-800 border border-amber-200"
                          }`}
                        >
                          {row.type}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-[#14213D]">
                        {row.description}
                        {row.metadata?.reference_number && (
                          <span className="text-[10px] font-mono text-[#8C97AB] ml-1">
                            (Ref: {row.metadata.reference_number})
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-medium text-[#14213D]">
                        {row.debit > 0 ? formatCurrency(row.debit) : "—"}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">
                        {row.credit > 0 ? formatCurrency(row.credit) : "—"}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-[#14213D]">
                        {formatCurrency(row.running_balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="whatsapp"
                size="sm"
                icon={Share2}
                onClick={() => shareStatementOnWhatsApp(ledgerCustomer)}
              >
                Share WhatsApp
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={Download}
                loading={exportingLedgerPdf}
                onClick={() => handleExportStatementPdf(ledgerData)}
              >
                Download Statement PDF
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setLedgerCustomer(null);
                  setLedgerData(null);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

export default PlastPaymentsPage;
