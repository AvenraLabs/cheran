import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  Plus,
  Search,
  RefreshCw,
  Eye,
  Printer,
  DollarSign,
  FileText,
  User,
  Share2,
} from "lucide-react";
import { plastApi } from "../../api/plastApi.js";
import Navbar from "../../components/layout/Navbar.jsx";
import MetricCard from "../../components/common/MetricCard.jsx";
import Button from "../../components/common/Button.jsx";
import Modal from "../../components/common/Modal.jsx";
import CustomSelect from "../../components/common/CustomSelect.jsx";
import { SkeletonLoader, EmptyState } from "../../components/common/SkeletonLoader.jsx";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext.jsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function PlastSalesPage() {
  const { user } = useAuth();
  const role = (user?.role || "USER").toUpperCase();
  const canViewLogs = role === "ADMIN" || role === "PLAST_PAYMENTS";

  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const navigate = useNavigate();

  // Filters
  const [search, setSearch] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Modal states
  const [selectedSale, setSelectedSale] = useState(null);

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
  }, [search, customerId, fromDate, toDate]);

  // Format currency with NO decimals (.00 removed)
  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(Math.round(Number(val) || 0));
  };

  const safeSales = Array.isArray(sales) ? sales : [];
  const totalRevenue = safeSales.reduce((acc, s) => acc + Number(s.grand_total || 0), 0);
  const avgBillValue = safeSales.length > 0 ? Math.round(totalRevenue / safeSales.length) : 0;

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async (sale) => {
    if (!sale) return;
    try {
      setExportingPdf(true);
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header Branding
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(47, 111, 94); // #2F6F5E
      doc.text("CHERAN PLAST", 14, 18);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(82, 96, 125);
      doc.text("PVC & Polymer Manufacturing Division", 14, 23);

      // Invoice info top-right
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(20, 33, 61);
      doc.text(`INVOICE: ${sale.sale_number || ""}`, pageWidth - 14, 16, { align: "right" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(82, 96, 125);
      doc.text(`Date: ${sale.sale_date || ""}`, pageWidth - 14, 21, { align: "right" });
      const enteredBy = sale.creator?.username || sale.created_by_name || "admin";
      doc.text(`Entered By: @${enteredBy}`, pageWidth - 14, 26, { align: "right" });

      // Divider line
      doc.setDrawColor(228, 225, 216);
      doc.setLineWidth(0.5);
      doc.line(14, 30, pageWidth - 14, 30);

      let targetSale = sale;
      if (!targetSale.items || targetSale.items.length === 0) {
        try {
          const fetched = await plastApi.getSaleById(sale.id);
          if (fetched && fetched.items && fetched.items.length > 0) {
            targetSale = fetched;
          }
        } catch (e) {
          console.error(e);
        }
      }

      // Customer / Billed To box
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, 34, pageWidth - 28, 20, 2, 2, "F");
      doc.setDrawColor(237, 234, 225);
      doc.roundedRect(14, 34, pageWidth - 28, 20, 2, 2, "D");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(82, 96, 125);
      doc.text("BILLED TO", 18, 39);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(20, 33, 61);
      doc.text(targetSale.customer_name || "Cash Customer", 18, 45);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(82, 96, 125);
      if (targetSale.customer_phone) {
        doc.text(`Phone: ${targetSale.customer_phone}`, 18, 50);
      }

      // Line Items Table
      const tableRows = (targetSale.items || []).map((it, idx) => {
        const itemName = it.item_name || it.item?.name || it.name || "Item";
        const unitLabel = typeof it.unit === "object" ? (it.unit?.symbol || it.unit?.name || "") : (it.unit || "");
        const qtyNum = Number(it.quantity) || 0;
        const qtyFormatted = Number.isInteger(qtyNum) ? String(qtyNum) : qtyNum.toFixed(2);
        const qtyStr = unitLabel ? `${qtyFormatted} ${unitLabel}` : `${qtyFormatted}`;
        const priceNum = Math.round(Number(it.unit_price) || 0);
        const lineTotalNum = Math.round(Number(it.line_total || it.total_amount || (qtyNum * priceNum)));
        return [
          idx + 1,
          itemName,
          qtyStr,
          `Rs. ${priceNum.toLocaleString("en-IN")}`,
          `Rs. ${lineTotalNum.toLocaleString("en-IN")}`,
        ];
      });

      autoTable(doc, {
        startY: 58,
        head: [["#", "Item Description", "Qty", "Unit Price", "Total"]],
        body: tableRows,
        theme: "striped",
        headStyles: {
          fillColor: [47, 111, 94],
          textColor: 255,
          fontStyle: "bold",
          fontSize: 9,
          cellPadding: 3,
        },
        columnStyles: {
          0: { cellWidth: 10, halign: "center" },
          1: { cellWidth: "auto" },
          2: { cellWidth: 25, halign: "center" },
          3: { cellWidth: 32, halign: "right" },
          4: { cellWidth: 35, halign: "right", fontStyle: "bold" },
        },
        styles: {
          fontSize: 8.5,
          cellPadding: 2.8,
          textColor: [20, 33, 61],
        },
        alternateRowStyles: {
          fillColor: [250, 250, 248],
        },
      });

      const finalY = doc.lastAutoTable.finalY + 6;

      // Summary Breakdown Block (Right side)
      const subVal = Math.round(Number(sale.subtotal) || 0);
      const discVal = Math.round(Number(sale.total_discount ?? sale.discount_amount) || 0);
      let discPct = Number(sale.discount_value) || 0;
      if (!discPct && subVal > 0 && discVal > 0) {
        discPct = Math.round((discVal / subVal) * 100);
      }
      const totalAfterDiscVal = Math.max(0, subVal - discVal);
      const gstVal = Math.round(Number(sale.gst_amount) || 0);
      const grandVal = Math.round(Number(sale.grand_total) || (totalAfterDiscVal + gstVal));
      const paidVal = Math.round(Number(sale.paid_amount) || 0);
      const balVal = Math.round(Number(sale.balance_amount) || Math.max(0, grandVal - paidVal));

      const summaryLines = [
        { label: "Subtotal:", value: `Rs. ${subVal.toLocaleString("en-IN")}` },
      ];
      if (discVal > 0) {
        summaryLines.push({
          label: `Discount (${discPct}%):`,
          value: `-Rs. ${discVal.toLocaleString("en-IN")}`,
          isDiscount: true,
        });
      }
      summaryLines.push({
        label: discVal > 0 ? "Total after Discount:" : "Total:",
        value: `Rs. ${totalAfterDiscVal.toLocaleString("en-IN")}`,
        isTotal: true,
      });
      if (gstVal > 0) {
        summaryLines.push({
          label: `GST (${sale.gst_rate}%):`,
          value: `+Rs. ${gstVal.toLocaleString("en-IN")}`,
        });
        summaryLines.push({
          label: "Grand Total:",
          value: `Rs. ${grandVal.toLocaleString("en-IN")}`,
          isGrand: true,
        });
      }

      // Render summary on right side
      const summaryBoxX = pageWidth - 90;
      let sY = finalY;
      summaryLines.forEach((line) => {
        doc.setFont("helvetica", line.isTotal || line.isGrand ? "bold" : "normal");
        doc.setFontSize(line.isTotal || line.isGrand ? 9.5 : 8.5);
        if (line.isDiscount) doc.setTextColor(180, 83, 9);
        else if (line.isTotal || line.isGrand) doc.setTextColor(47, 111, 94);
        else doc.setTextColor(82, 96, 125);

        doc.text(line.label, summaryBoxX, sY);
        doc.text(line.value, pageWidth - 14, sY, { align: "right" });
        sY += 5.5;
      });

      // Bottom footer note
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(140, 151, 171);
      doc.text("Thank you for your business! · Cheran Plast", pageWidth / 2, 285, { align: "center" });

      const safeNumber = (sale.sale_number || "Bill").replace(/[/\\?%*:|"<> ]/g, "_");
      doc.save(`Cheran_Plast_Invoice_${safeNumber}.pdf`);
      toast.success("PDF invoice downloaded successfully");
    } catch (err) {
      console.error("PDF export error:", err);
      toast.error("Failed to export PDF invoice");
    } finally {
      setExportingPdf(false);
    }
  };

  const shareOnWhatsApp = async (sale) => {
    if (!sale) return;
    let targetSale = sale;
    if (!targetSale.items || targetSale.items.length === 0) {
      try {
        const fetched = await plastApi.getSaleById(sale.id);
        if (fetched && fetched.items && fetched.items.length > 0) {
          targetSale = fetched;
        }
      } catch (e) {
        console.error(e);
      }
    }

    const phone = targetSale.customer_phone || "";
    const cleanPhone = phone.replace(/\D/g, "").replace(/^0+/, "");
    const targetPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    const subVal = Math.round(Number(targetSale.subtotal) || 0);
    const discVal = Math.round(Number(targetSale.total_discount ?? targetSale.discount_amount) || 0);
    let discPct = Number(targetSale.discount_value) || 0;
    if (!discPct && subVal > 0 && discVal > 0) {
      discPct = Math.round((discVal / subVal) * 100);
    }
    const totalAfterDisc = Math.max(0, subVal - discVal);
    const gstVal = Math.round(Number(targetSale.gst_amount) || 0);
    const grandVal = Math.round(Number(targetSale.grand_total) || (totalAfterDisc + gstVal));
    const paidVal = Math.round(Number(targetSale.paid_amount) || 0);
    const balVal = Math.round(Number(targetSale.balance_amount) || Math.max(0, grandVal - paidVal));

    const itemsList = targetSale.items && targetSale.items.length > 0
      ? targetSale.items.map((it) => {
          const name = it.item_name || it.item?.name || it.name || "Item";
          const unit = typeof it.unit === "object" ? (it.unit?.symbol || it.unit?.name || "") : (it.unit || "");
          const qtyNum = Number(it.quantity) || 0;
          const qtyFormatted = Number.isInteger(qtyNum) ? String(qtyNum) : qtyNum.toFixed(2);
          const qtyStr = unit ? `${qtyFormatted} ${unit}` : `${qtyFormatted}`;
          const total = Math.round(Number(it.line_total || it.total_amount || (qtyNum * Number(it.unit_price || 0))));
          return `• ${name} × ${qtyStr} = ₹${total.toLocaleString("en-IN")}`;
        }).join("\n")
      : "";

    let msg = `🧾 *CHERAN PLAST - INVOICE*\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `*Invoice No:* #${targetSale.sale_number}\n` +
      `*Date:* ${targetSale.sale_date}\n` +
      `*Customer:* ${targetSale.customer_name || "Valued Customer"}\n\n`;

    if (itemsList) {
      msg += `*Items:*\n${itemsList}\n\n`;
    }

    msg += `━━━━━━━━━━━━━━━━━━\n` +
      `*Subtotal:* ₹${subVal.toLocaleString("en-IN")}\n`;

    if (discVal > 0) {
      msg += `*Discount (${discPct}%):* -₹${discVal.toLocaleString("en-IN")}\n`;
    }

    msg += `*Total:* ₹${totalAfterDisc.toLocaleString("en-IN")}\n`;

    if (gstVal > 0) {
      msg += `*GST (${targetSale.gst_rate}%):* +₹${gstVal.toLocaleString("en-IN")}\n`;
      msg += `*Grand Total:* ₹${grandVal.toLocaleString("en-IN")}\n`;
    }

    msg += `━━━━━━━━━━━━━━━━━━\n` +
      `Thank you for your business! 🙏\nCheran Plast`;

    const url = targetPhone
      ? `https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;

    window.open(url, "_blank");
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <MetricCard
                title="Total Invoiced"
                value={formatCurrency(totalRevenue)}
                subtitle="Gross turnover billed"
                icon={DollarSign}
              />
              <MetricCard
                title="Average Bill Value"
                value={formatCurrency(avgBillValue)}
                subtitle="Per customer invoice"
                icon={ShoppingCart}
              />
              <MetricCard
                title="Total Invoices"
                value={`${safeSales.length} Bills`}
                subtitle="Issued customer bills"
                icon={FileText}
              />
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-3 sm:p-4 rounded-[10px] border border-[#E4E1D8] shadow-[0_1px_2px_rgba(20,33,61,0.04)] grid grid-cols-1 sm:grid-cols-4 gap-3 items-center text-xs">
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
                        <th className="py-3 px-3 text-center">Entered By</th>
                        <th className="py-3 px-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EDEAE1]">
                      {safeSales.map((sale) => {
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
                                  variant="whatsapp"
                                  size="xs"
                                  icon={Share2}
                                  title="Share Invoice on WhatsApp"
                                  onClick={() => shareOnWhatsApp(sale)}
                                >
                                  WA
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="xs"
                                  icon={Eye}
                                  onClick={() => setSelectedSale(sale)}
                                >
                                  Bill
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

              <div className="bg-[#F8FAFC] p-2.5 rounded border border-[#EDEAE1]">
                <div>
                  <div className="text-[10px] font-bold text-[#52607D] uppercase">Billed To</div>
                  <div className="text-sm font-bold text-[#14213D] mt-0.5">{selectedSale.customer_name}</div>
                  {selectedSale.customer_phone && (
                    <div className="text-xs text-[#52607D] font-mono">Phone: {selectedSale.customer_phone}</div>
                  )}
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
              <div className="flex justify-end pt-2 border-t border-[#EDEAE1]">
                {(() => {
                  const subVal = Math.round(Number(selectedSale.subtotal) || 0);
                  const discVal = Math.round(Number(selectedSale.total_discount ?? selectedSale.discount_amount) || 0);
                  let discPct = Number(selectedSale.discount_value) || 0;
                  if (!discPct && subVal > 0 && discVal > 0) {
                    discPct = Math.round((discVal / subVal) * 100);
                  }
                  const totalAfterDiscVal = Math.max(0, subVal - discVal);
                  const gstVal = Math.round(Number(selectedSale.gst_amount) || 0);
                  const grandVal = Math.round(Number(selectedSale.grand_total) || (totalAfterDiscVal + gstVal));

                  return (
                    <div className="w-64 space-y-1">
                      <div className="flex justify-between text-[#52607D]">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(subVal)}</span>
                      </div>
                      {discVal > 0 && (
                        <div className="flex justify-between text-amber-800 font-medium">
                          <span>Discount ({discPct}%):</span>
                          <span>-{formatCurrency(discVal)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-[#14213D] font-bold border-t border-[#EDEAE1] pt-1">
                        <span>{discVal > 0 ? "Total after Discount:" : "Total:"}</span>
                        <span className="font-mono">{formatCurrency(totalAfterDiscVal)}</span>
                      </div>
                      {gstVal > 0 && (
                        <>
                          <div className="flex justify-between text-[#52607D]">
                            <span>GST ({selectedSale.gst_rate}%):</span>
                            <span>+{formatCurrency(gstVal)}</span>
                          </div>
                          <div className="flex justify-between font-bold text-sm text-[#14213D] border-t border-[#EDEAE1] pt-1.5">
                            <span>Grand Total:</span>
                            <span className="text-[#2F6F5E]">{formatCurrency(grandVal)}</span>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" size="sm" onClick={() => setSelectedSale(null)}>
                Close
              </Button>
              <Button
                type="button"
                variant="whatsapp"
                size="sm"
                icon={Share2}
                onClick={() => shareOnWhatsApp(selectedSale)}
              >
                Share on WhatsApp
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={FileText}
                loading={exportingPdf}
                onClick={() => handleExportPDF(selectedSale)}
              >
                Download PDF
              </Button>
              <Button variant="primary" size="sm" icon={Printer} onClick={handlePrint}>
                Print Receipt
              </Button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}

export default PlastSalesPage;
