import React, { useEffect, useState } from "react";
import {
  Users,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Phone,
  DollarSign,
  FileText,
  CreditCard,
  Share2,
  TrendingUp,
  Receipt,
  Download,
  AlertCircle,
  CheckCircle2,
  Clock,
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


export function PlastCustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    opening_balance: "0",
    opening_balance_date: new Date().toISOString().split("T")[0],
  });
  const [saving, setSaving] = useState(false);

  // Quick Payment Modal
  const [paymentCustomer, setPaymentCustomer] = useState(null);
  const [paymentData, setPaymentData] = useState({
    amount: "",
    payment_date: new Date().toISOString().split("T")[0],
  });
  const [recordingPayment, setRecordingPayment] = useState(false);

  // Statement / Ledger Modal
  const [ledgerCustomer, setLedgerCustomer] = useState(null);
  const [ledgerData, setLedgerData] = useState(null);
  const [loadingLedger, setLoadingLedger] = useState(false);
  const [exportingLedgerPdf, setExportingLedgerPdf] = useState(false);

  const fetchCustomers = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await plastApi.getCustomers(search);
      setCustomers(Array.isArray(data) ? data : data?.data || []);
    } catch (err) {
      toast.error("Failed to load customer accounts");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers();
    }, 200);
    return () => clearTimeout(timer);
  }, [search]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(Math.round(Number(val) || 0));
  };

  const openAddModal = () => {
    setEditingCustomer(null);
    setFormData({
      name: "",
      phone: "",
      address: "",
      opening_balance: "0",
      opening_balance_date: new Date().toISOString().split("T")[0],
    });
    setIsModalOpen(true);
  };

  const openEditModal = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone || "",
      address: customer.address || "",
      opening_balance: String(customer.opening_balance || "0"),
      opening_balance_date:
        customer.opening_balance_date || new Date().toISOString().split("T")[0],
    });
    setIsModalOpen(true);
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Customer name is required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim() || undefined,
        address: formData.address.trim() || undefined,
        opening_balance: Number(formData.opening_balance) || 0,
        opening_balance_date: formData.opening_balance_date || undefined,
      };

      if (editingCustomer) {
        await plastApi.updateCustomer(editingCustomer.id, payload);
        toast.success("Customer account updated successfully");
      } else {
        await plastApi.createCustomer(payload);
        toast.success("Customer account created successfully");
      }
      setIsModalOpen(false);
      fetchCustomers();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to save customer");
    } finally {
      setSaving(false);
    }
  };

  // Open Quick Payment Modal
  const openPaymentModal = (customer) => {
    setPaymentCustomer(customer);
    setPaymentData({
      amount: customer.current_balance > 0 ? String(Math.round(customer.current_balance)) : "",
      payment_date: new Date().toISOString().split("T")[0],
    });
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!paymentCustomer) return;

    const amt = parseFloat(paymentData.amount);
    if (!amt || amt <= 0) {
      toast.error("Please enter a valid payment amount greater than 0");
      return;
    }

    setRecordingPayment(true);
    try {
      await plastApi.recordCustomerPayment(paymentCustomer.id, {
        amount: amt,
        payment_date: paymentData.payment_date,
      });

      toast.success(
        `Payment of ${formatCurrency(amt)} recorded for ${paymentCustomer.name}!`
      );
      setPaymentCustomer(null);
      fetchCustomers();

      // If ledger is open for this customer, refresh it
      if (ledgerCustomer && ledgerCustomer.id === paymentCustomer.id) {
        openLedgerModal(paymentCustomer);
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || err.message || "Failed to record payment"
      );
    } finally {
      setRecordingPayment(false);
    }
  };

  // Open Statement / Ledger Modal
  const openLedgerModal = async (customer) => {
    setLedgerCustomer(customer);
    setLoadingLedger(true);
    try {
      const data = await plastApi.getCustomerLedger(customer.id);
      setLedgerData(data);
    } catch (err) {
      toast.error("Failed to load customer statement");
      setLedgerCustomer(null);
    } finally {
      setLoadingLedger(false);
    }
  };

  // Export Customer Statement PDF
  const handleExportStatementPdf = (ledger) => {
    if (!ledger) return;
    setExportingLedgerPdf(true);
    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();

      // Brand Header
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

      // Customer Info & Ledger Summary Box
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(20, 33, 61);
      doc.text(`Customer: ${ledger.customer.name}`, 14, 36);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(82, 96, 125);
      if (ledger.customer.phone) {
        doc.text(`Phone: ${ledger.customer.phone}`, 14, 41);
      }
      if (ledger.customer.address) {
        doc.text(`Address: ${ledger.customer.address}`, 14, 46);
      }

      // Summary Card on Right side
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
      if (ledger.summary.current_balance > 0) {
        doc.setTextColor(190, 24, 93);
      } else {
        doc.setTextColor(22, 101, 52);
      }
      doc.text(`Rs. ${Math.round(ledger.summary.current_balance).toLocaleString("en-IN")}`, pageWidth - 16, 52, { align: "right" });

      // Ledger Table
      const tableRows = (ledger.entries || []).map((entry, idx) => {
        const debitStr = entry.debit > 0 ? `Rs. ${Math.round(entry.debit).toLocaleString("en-IN")}` : "—";
        const creditStr = entry.credit > 0 ? `Rs. ${Math.round(entry.credit).toLocaleString("en-IN")}` : "—";
        const balStr = `Rs. ${Math.round(entry.running_balance).toLocaleString("en-IN")}`;
        return [
          entry.date || "",
          entry.type || "",
          entry.description || "",
          debitStr,
          creditStr,
          balStr,
        ];
      });

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
        styles: {
          fontSize: 8,
          cellPadding: 2.2,
          textColor: [20, 33, 61],
        },
        alternateRowStyles: {
          fillColor: [250, 250, 248],
        },
      });

      const finalY = doc.lastAutoTable.finalY + 6;
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(140, 151, 171);
      doc.text(
        "This is a computer generated customer statement of account. Cheran Plast",
        pageWidth / 2,
        285,
        { align: "center" }
      );

      const safeName = (ledger.customer.name || "Customer").replace(/[/\\?%*:|"<> ]/g, "_");
      doc.save(`Cheran_Plast_Statement_${safeName}.pdf`);
      toast.success("Statement PDF downloaded successfully");
    } catch (err) {
      console.error("Statement PDF error:", err);
      toast.error("Failed to export statement PDF");
    } finally {
      setExportingLedgerPdf(false);
    }
  };

  // Share Statement on WhatsApp
  const shareStatementOnWhatsApp = (customer, summary) => {
    if (!customer) return;
    const phone = customer.phone || "";
    const cleanPhone = phone.replace(/\D/g, "").replace(/^0+/, "");
    const targetPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    const opening = Math.round(Number(summary?.opening_balance ?? customer.opening_balance) || 0);
    const billed = Math.round(Number(summary?.total_billed ?? customer.total_billed) || 0);
    const paid = Math.round(Number(summary?.total_paid ?? customer.total_paid) || 0);
    const pending = Math.round(Number(summary?.current_balance ?? customer.current_balance) || 0);

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

  const safeCustomers = Array.isArray(customers) ? customers : [];
  const totalOpening = safeCustomers.reduce((acc, c) => acc + Number(c.opening_balance || 0), 0);
  const totalBilled = safeCustomers.reduce((acc, c) => acc + Number(c.total_billed || 0), 0);
  const totalPaid = safeCustomers.reduce((acc, c) => acc + Number(c.total_paid || 0), 0);
  const totalPending = safeCustomers.reduce((acc, c) => acc + Number(c.current_balance || 0), 0);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Navbar
        title="Customer Accounts & Ledger"
        subtitle="Customer running balances, opening pending amounts, sales ledger & receipts"
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              loading={refreshing}
              onClick={() => fetchCustomers(true)}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={openAddModal}
            >
              + Add Customer
            </Button>
          </>
        }
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 overflow-y-auto w-full">
        {/* KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <MetricCard
            title="Total Customers"
            value={safeCustomers.length}
            subtitle="Active registered buyers"
            icon={Users}
          />
          <MetricCard
            title="Opening Balances"
            value={formatCurrency(totalOpening)}
            subtitle="Pre-app pending balances"
            icon={Clock}
          />
          <MetricCard
            title="Total Billed"
            value={formatCurrency(totalBilled)}
            subtitle="Gross turnover across bills"
            icon={DollarSign}
          />
          <MetricCard
            title="Total Collected"
            value={formatCurrency(totalPaid)}
            subtitle="All receipts received"
            icon={TrendingUp}
          />
          <MetricCard
            title="Net Pending Balance"
            value={formatCurrency(totalPending)}
            subtitle="Total outstanding to collect"
            icon={Receipt}
          />
        </div>

        {/* Search Bar */}
        <div className="bg-white p-3 sm:p-4 rounded-[10px] border border-[#E4E1D8] shadow-[0_1px_2px_rgba(20,33,61,0.04)]">
          <div className="relative max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C97AB]" />
            <input
              type="text"
              placeholder="Search by customer name or phone number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-[#E4E1D8] rounded-[7px] text-[#14213D] placeholder-[#8C97AB] focus:outline-none focus:border-[#2F6F5E]"
            />
          </div>
        </div>

        {/* Customer Table */}
        <div className="bg-white rounded-[10px] border border-[#E4E1D8] shadow-[0_1px_2px_rgba(20,33,61,0.04)] overflow-hidden">
          {loading ? (
            <div className="p-6">
              <SkeletonLoader count={4} />
            </div>
          ) : safeCustomers.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No customers found"
              description="Add customers with their existing opening pending balance to begin tracking their running ledger."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] border-b border-[#EDEAE1] text-[#52607D] font-semibold">
                  <tr>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4 text-right">Opening Balance</th>
                    <th className="py-3 px-4 text-right">Total Billed</th>
                    <th className="py-3 px-4 text-right">Total Paid</th>
                    <th className="py-3 px-4 text-right">Current Pending</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDEAE1]">
                  {safeCustomers.map((cust) => {
                    const balance = Number(cust.current_balance || 0);
                    return (
                      <tr key={cust.id} className="hover:bg-[#FAFAF8] transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-[#14213D]">{cust.name}</div>
                          {cust.address && (
                            <div className="text-[10px] text-[#8C97AB]">{cust.address}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono font-medium text-[#2F6F5E]">
                          {cust.phone ? (
                            <a href={`tel:${cust.phone}`} className="hover:underline flex items-center gap-1">
                              <Phone size={11} />
                              <span>{cust.phone}</span>
                            </a>
                          ) : (
                            <span className="text-[#8C97AB]">No phone</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-[#52607D]">
                          {formatCurrency(cust.opening_balance)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-medium text-[#14213D]">
                          {formatCurrency(cust.total_billed)}
                          <div className="text-[9px] text-[#8C97AB]">
                            {cust.invoice_count || 0} bill{cust.invoice_count === 1 ? "" : "s"}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-medium text-emerald-700">
                          {formatCurrency(cust.total_paid)}
                          <div className="text-[9px] text-[#8C97AB]">
                            {cust.payment_count || 0} receipt{cust.payment_count === 1 ? "" : "s"}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold">
                          <span
                            className={
                              balance > 0
                                ? "text-rose-700"
                                : balance < 0
                                ? "text-blue-700"
                                : "text-emerald-700"
                            }
                          >
                            {formatCurrency(balance)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {balance > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <AlertCircle size={10} />
                              Pending
                            </span>
                          ) : balance < 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              Advance
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 size={10} />
                              Settled
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="secondary"
                              size="xs"
                              icon={CreditCard}
                              className="text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200"
                              onClick={() => openPaymentModal(cust)}
                              title="Record payment / collection"
                            >
                              + Pay
                            </Button>
                            <Button
                              variant="ghost"
                              size="xs"
                              icon={FileText}
                              onClick={() => openLedgerModal(cust)}
                              title="View Statement / Ledger"
                            >
                              Ledger
                            </Button>
                            <Button
                              variant="whatsapp"
                              size="xs"
                              icon={Share2}
                              onClick={() => shareStatementOnWhatsApp(cust)}
                              title="Share Outstanding on WhatsApp"
                            >
                              WA
                            </Button>
                            <button
                              type="button"
                              onClick={() => openEditModal(cust)}
                              className="p-1 text-[#52607D] hover:text-[#2F6F5E] hover:bg-gray-100 rounded transition-colors cursor-pointer"
                              title="Edit Customer & Opening Balance"
                            >
                              <Edit2 size={13} />
                            </button>
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

      {/* Add / Edit Customer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCustomer ? "Edit Customer & Opening Balance" : "Add Customer & Opening Balance"}
        size="sm"
      >
        <form onSubmit={handleSaveCustomer} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-[#14213D] mb-1">
              Customer / Business Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Ramesh Kumar / Senthil Traders"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E4E1D8] rounded-[6px] text-[#14213D] focus:outline-none focus:border-[#2F6F5E]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#14213D] mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              placeholder="10-digit mobile number"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E4E1D8] rounded-[6px] text-[#14213D] font-mono focus:outline-none focus:border-[#2F6F5E]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 bg-[#F8FAFC] p-2.5 rounded-[6px] border border-[#E4E1D8]">
            <div>
              <label className="block text-[11px] font-semibold text-[#14213D] mb-0.5">
                Opening Pending (₹)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="0"
                value={formData.opening_balance}
                onChange={(e) => setFormData({ ...formData, opening_balance: e.target.value })}
                className="w-full px-2 py-1 text-xs bg-white border border-[#E4E1D8] rounded-[5px] text-[#14213D] font-mono font-bold focus:outline-none focus:border-[#2F6F5E]"
              />
              <span className="text-[10px] text-[#8C97AB]">Old balance owed</span>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#14213D] mb-0.5">
                Opening Date
              </label>
              <input
                type="date"
                value={formData.opening_balance_date}
                onChange={(e) => setFormData({ ...formData, opening_balance_date: e.target.value })}
                className="w-full px-2 py-1 text-xs bg-white border border-[#E4E1D8] rounded-[5px] text-[#14213D] font-mono focus:outline-none focus:border-[#2F6F5E]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#14213D] mb-1">
              Address / Town
            </label>
            <textarea
              rows={2}
              placeholder="Town, District"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E4E1D8] rounded-[6px] text-[#14213D] focus:outline-none focus:border-[#2F6F5E]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#EDEAE1]">
            <Button type="button" variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={saving}>
              {editingCustomer ? "Update Customer" : "Save Customer"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Quick Record Payment Modal */}
      <Modal
        isOpen={Boolean(paymentCustomer)}
        onClose={() => setPaymentCustomer(null)}
        title={paymentCustomer ? `Record Payment: ${paymentCustomer.name}` : "Record Payment"}
        size="sm"
      >
        {paymentCustomer && (
          <form onSubmit={handleRecordPayment} className="space-y-3">
            <div className="bg-[#F8FAFC] p-3 rounded-[6px] border border-[#E4E1D8] flex justify-between items-center text-xs">
              <div>
                <span className="text-[#52607D]">Current Outstanding:</span>
                <div className="font-bold text-sm text-rose-700 font-mono">
                  {formatCurrency(paymentCustomer.current_balance)}
                </div>
              </div>
              <div className="text-right text-[11px] text-[#8C97AB]">
                <div>Opening: {formatCurrency(paymentCustomer.opening_balance)}</div>
                <div>Billed: {formatCurrency(paymentCustomer.total_billed)}</div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#14213D] mb-1">
                Amount Received (₹) *
              </label>
              <input
                type="number"
                step="any"
                min="0.01"
                required
                placeholder="Enter amount paid"
                value={paymentData.amount}
                onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                className="w-full px-2.5 py-1.5 text-sm bg-white border border-[#E4E1D8] rounded-[6px] text-[#14213D] font-mono font-bold focus:outline-none focus:border-[#2F6F5E]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#14213D] mb-1">
                Payment Date
              </label>
              <input
                type="date"
                value={paymentData.payment_date}
                onChange={(e) => setPaymentData({ ...paymentData, payment_date: e.target.value })}
                className="w-full px-2 py-1.5 text-xs bg-white border border-[#E4E1D8] rounded-[6px] text-[#14213D] font-mono focus:outline-none focus:border-[#2F6F5E]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#EDEAE1]">
              <Button type="button" variant="secondary" size="sm" onClick={() => setPaymentCustomer(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" loading={recordingPayment}>
                Record Payment
              </Button>
            </div>
          </form>
        )}
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
            <div className="flex justify-between items-center pt-2">
              <Button
                variant="secondary"
                size="sm"
                icon={CreditCard}
                className="text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200"
                onClick={() => openPaymentModal(ledgerCustomer)}
              >
                + Record Payment
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="whatsapp"
                  size="sm"
                  icon={Share2}
                  onClick={() => shareStatementOnWhatsApp(ledgerCustomer, ledgerData.summary)}
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
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

export default PlastCustomersPage;
