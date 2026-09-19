import React, { useEffect, useState } from "react";
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  DollarSign,
  TrendingUp,
  Boxes,
  Factory,
  RefreshCw,
  Eye,
  FileText,
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

export function PlastReportsPage() {
  const [activeTab, setActiveTab] = useState("sales"); // sales | purchases | production | stock
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reportData, setReportData] = useState(null);

  // Filters
  const [datePreset, setDatePreset] = useState("THIS_MONTH");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [supplierId, setSupplierId] = useState("");

  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  // Bill Inspection Modal
  const [selectedSale, setSelectedSale] = useState(null);
  const [exportingPdf, setExportingPdf] = useState(false);

  const handleExportPDF = async (sale) => {
    if (!sale) return;
    setExportingPdf(true);
    try {
      let fullSale = sale;
      if (!fullSale.items || fullSale.items.length === 0) {
        try {
          const res = await plastApi.getSaleById(sale.id);
          if (res && res.items) fullSale = res;
        } catch (e) {}
      }

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();

      // Top Header Band
      doc.setFillColor(47, 111, 94);
      doc.rect(0, 0, pageWidth, 28, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.text("CHERAN PLAST", 14, 11);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(210, 230, 225);
      doc.text("PVC & Polymer Pipes Manufacturing Division", 14, 17);
      doc.text("Tax Invoice / Sales Bill", 14, 23);

      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text(fullSale.sale_number || "INVOICE", pageWidth - 14, 12, { align: "right" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.text(`Date: ${fullSale.sale_date || ""}`, pageWidth - 14, 18, { align: "right" });

      // Customer Info Box
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, 32, pageWidth - 28, 18, 2, 2, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(82, 96, 125);
      doc.text("BILLED TO:", 18, 38);
      doc.setFontSize(9.5);
      doc.setTextColor(20, 33, 61);
      doc.text(fullSale.customer_name || "Customer", 18, 44);
      if (fullSale.customer_phone) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(82, 96, 125);
        doc.text(`Phone: ${fullSale.customer_phone}`, pageWidth - 20, 44, { align: "right" });
      }

      // Items Table
      const tableRows = (fullSale.items || []).map((it, idx) => {
        const unitLabel = typeof it.unit === "object" ? (it.unit?.symbol || it.unit?.name || "") : (it.unit || "");
        const unitPrice = Number(it.unit_price || 0);
        const lineTot = it.line_total || it.total_amount || (Number(it.quantity || 0) * unitPrice);
        return [
          idx + 1,
          it.item_name || "Item",
          `${it.quantity} ${unitLabel}`.trim(),
          `Rs. ${Math.round(unitPrice).toLocaleString("en-IN")}`,
          `Rs. ${Math.round(lineTot).toLocaleString("en-IN")}`,
        ];
      });

      autoTable(doc, {
        startY: 54,
        head: [["#", "Item Description", "Qty", "Unit Price", "Amount"]],
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
          0: { cellWidth: 10, halign: "center" },
          1: { cellWidth: "auto" },
          2: { cellWidth: 28, halign: "center" },
          3: { cellWidth: 32, halign: "right" },
          4: { cellWidth: 35, halign: "right", fontStyle: "bold" },
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
      const subVal = Math.round(Number(fullSale.subtotal) || 0);
      const discVal = Math.round(Number(fullSale.total_discount ?? fullSale.discount_amount) || 0);
      let discPct = Number(fullSale.discount_value) || 0;
      if (!discPct && subVal > 0 && discVal > 0) {
        discPct = Math.round((discVal / subVal) * 100);
      }
      const totalAfterDiscVal = Math.max(0, subVal - discVal);
      const gstVal = Math.round(Number(fullSale.gst_amount) || 0);
      const grandVal = Math.round(Number(fullSale.grand_total) || (totalAfterDiscVal + gstVal));

      const summaryBoxX = pageWidth - 90;
      let sY = finalY;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(82, 96, 125);
      doc.text("Subtotal:", summaryBoxX, sY);
      doc.text(`Rs. ${subVal.toLocaleString("en-IN")}`, pageWidth - 14, sY, { align: "right" });
      sY += 5;

      if (discVal > 0) {
        doc.setTextColor(180, 83, 9);
        doc.text(`Discount (${discPct}%):`, summaryBoxX, sY);
        doc.text(`-Rs. ${discVal.toLocaleString("en-IN")}`, pageWidth - 14, sY, { align: "right" });
        sY += 5;
      }

      doc.setFont("helvetica", "bold");
      doc.setTextColor(47, 111, 94);
      doc.text(discVal > 0 ? "Total after Discount:" : "Total:", summaryBoxX, sY);
      doc.text(`Rs. ${totalAfterDiscVal.toLocaleString("en-IN")}`, pageWidth - 14, sY, { align: "right" });
      sY += 5;

      if (gstVal > 0) {
        doc.setFont("helvetica", "normal");
        doc.setTextColor(82, 96, 125);
        doc.text(`GST (${fullSale.gst_rate}%):`, summaryBoxX, sY);
        doc.text(`+Rs. ${gstVal.toLocaleString("en-IN")}`, pageWidth - 14, sY, { align: "right" });
        sY += 5;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.setTextColor(47, 111, 94);
        doc.text("Grand Total:", summaryBoxX, sY);
        doc.text(`Rs. ${grandVal.toLocaleString("en-IN")}`, pageWidth - 14, sY, { align: "right" });
      }

      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(140, 151, 171);
      doc.text("Thank you for your business! · Cheran Plast", pageWidth / 2, 285, { align: "center" });

      const safeNumber = (fullSale.sale_number || "Bill").replace(/[/\\?%*:|"<> ]/g, "_");
      doc.save(`Cheran_Plast_Invoice_${safeNumber}.pdf`);
      toast.success("PDF invoice downloaded successfully");
    } catch (err) {
      console.error("PDF export error:", err);
      toast.error("Failed to export PDF invoice");
    } finally {
      setExportingPdf(false);
    }
  };

  // Set date ranges automatically on preset change
  useEffect(() => {
    const today = new Date();
    const formatDate = (d) => d.toISOString().split("T")[0];

    if (datePreset === "TODAY") {
      setFromDate(formatDate(today));
      setToDate(formatDate(today));
    } else if (datePreset === "THIS_WEEK") {
      const firstDay = new Date(today.setDate(today.getDate() - today.getDay()));
      const lastDay = new Date(today.setDate(today.getDate() - today.getDay() + 6));
      setFromDate(formatDate(firstDay));
      setToDate(formatDate(lastDay));
    } else if (datePreset === "THIS_MONTH") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      setFromDate(formatDate(firstDay));
      setToDate(formatDate(lastDay));
    } else if (datePreset === "ALL") {
      setFromDate("");
      setToDate("");
    }
  }, [datePreset]);

  const loadFilterOptions = async () => {
    try {
      const [custs, sups] = await Promise.all([
        plastApi.getCustomers(),
        plastApi.getSuppliers(),
      ]);
      setCustomers(Array.isArray(custs) ? custs : custs?.data || []);
      setSuppliers(Array.isArray(sups) ? sups : sups?.data || []);
    } catch (err) {
      setCustomers([]);
      setSuppliers([]);
    }
  };

  const fetchReport = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await plastApi.getReports(activeTab, {
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
        customer_id: customerId || undefined,
        supplier_id: supplierId || undefined,
      });
      const resolved = res?.summary ? res : res?.data || res || {};
      setReportData(resolved);
    } catch (err) {
      toast.error("Failed to load report data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadFilterOptions();
  }, []);

  useEffect(() => {
    fetchReport();
  }, [activeTab, fromDate, toDate, customerId, supplierId]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(Math.round(Number(val) || 0));
  };

  const exportToCSV = () => {
    const list = Array.isArray(reportData?.data) ? reportData.data : [];
    if (list.length === 0) {
      toast.error("No data to export");
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";

    if (activeTab === "sales") {
      csvContent += "Invoice No,Date,Customer,Phone,Items Count,Subtotal,Discount,Taxable,GST Rate,GST Amount,Grand Total\n";
      list.forEach((s) => {
        csvContent += `"${s.sale_number}","${s.sale_date}","${s.customer_name}","${s.customer_phone || ""}","${s.items?.length || s.items_count || 0}","${s.subtotal}","${s.total_discount}","${s.taxable_amount}","${s.gst_rate}%","${s.gst_amount}","${s.grand_total}"\n`;
      });
    } else if (activeTab === "purchases") {
      csvContent += "Receipt Date,Supplier,Reference,Items Count,Total Amount\n";
      list.forEach((p) => {
        csvContent += `"${p.receipt_date}","${p.supplier_name || p.supplier?.name || ""}","${p.reference_number || ""}","${p.items_count || 0}","${p.total_amount}"\n`;
      });
    } else if (activeTab === "production") {
      csvContent += "Date,Batch Reference,Raw Materials Consumed,Total Raw Qty (Kg),Common Wastage (Kg),Finished Outputs,Total Finished Qty,Notes\n";
      list.forEach((e) => {
        const rawDesc = (e.materials || []).map((m) => `${m.item?.name || "Raw"}: ${m.quantity_used} ${m.unit?.symbol || "Kg"}`).join("; ");
        const totalRaw = (e.materials || []).reduce((acc, m) => acc + Number(m.quantity_used || 0), 0);
        const wasteQty = Number(e.wastage_quantity || 0);
        const outDesc = (e.outputs || []).map((o) => `${o.item?.name || "Fin"}: ${o.quantity_produced} ${o.unit?.symbol || "Nos"}`).join("; ");
        const totalOut = (e.outputs || []).reduce((acc, o) => acc + Number(o.quantity_produced || 0), 0);
        csvContent += `"${e.production_date}","${e.reference_number || ""}","${rawDesc}","${totalRaw}","${wasteQty}","${outDesc}","${totalOut}","${(e.notes || "").replace(/"/g, '""')}"\n`;
      });
    } else if (activeTab === "stock") {
      csvContent += "Item Name,Type,Category,Unit Price,Quantity On Hand,Stock Value\n";
      list.forEach((st) => {
        csvContent += `"${st.name}","${st.item_type}","${st.category || ""}","${st.unit_price}","${st.quantity_on_hand}","${st.stock_value}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `cheran_plast_${activeTab}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV export downloaded");
  };

  const safeDataList = Array.isArray(reportData?.data) ? reportData.data : [];
  const summary = reportData?.summary || {};
  const safeCustomers = Array.isArray(customers) ? customers : [];
  const safeSuppliers = Array.isArray(suppliers) ? suppliers : [];

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Navbar
        title="Reports & Analytics"
        subtitle="Financial reports, production summaries, and inventory valuation"
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              loading={refreshing}
              onClick={() => fetchReport(true)}
            >
              Refresh
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={Printer}
              onClick={() => window.print()}
            >
              Print
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Download}
              onClick={exportToCSV}
            >
              Export CSV
            </Button>
          </>
        }
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 overflow-y-auto w-full">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-[#FAFAF8] p-1 rounded-[8px] border border-[#E4E1D8] overflow-x-auto">
          {[
            { id: "sales", label: "Sales Report" },
            { id: "purchases", label: "Raw Purchases Report" },
            { id: "production", label: "Production & Wastage" },
            { id: "stock", label: "Stock Valuation" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "bg-white text-[#2F6F5E] shadow-xs font-bold border border-[#E4E1D8]"
                  : "text-[#52607D] hover:text-[#14213D]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filter Bar (Date Presets & Dropdowns) */}
        <div className="bg-white p-3 sm:p-4 rounded-[10px] border border-[#E4E1D8] shadow-[0_1px_2px_rgba(20,33,61,0.04)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1 bg-[#FAFAF8] p-1 rounded-[6px] border border-[#E4E1D8]">
            {["TODAY", "THIS_WEEK", "THIS_MONTH", "ALL", "CUSTOM"].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setDatePreset(p)}
                className={`px-2.5 py-1 rounded-[5px] text-[11px] font-semibold transition-all cursor-pointer ${
                  datePreset === p
                    ? "bg-white text-[#2F6F5E] shadow-xs font-bold border border-[#E4E1D8]"
                    : "text-[#52607D] hover:text-[#14213D]"
                }`}
              >
                {p.replace("_", " ")}
              </button>
            ))}
          </div>

          {datePreset === "CUSTOM" && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="px-2.5 py-1 bg-white border border-[#E4E1D8] rounded-[6px] text-xs text-[#14213D] focus:outline-none focus:border-[#2F6F5E]"
              />
              <span className="text-[#52607D]">to</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="px-2.5 py-1 bg-white border border-[#E4E1D8] rounded-[6px] text-xs text-[#14213D] focus:outline-none focus:border-[#2F6F5E]"
              />
            </div>
          )}

          {activeTab === "sales" && (
            <div className="w-48">
              <CustomSelect
                theme="blue"
                size="sm"
                value={customerId}
                onChange={(val) => setCustomerId(val)}
                placeholder="All Customers"
                options={[
                  { value: "", label: "All Customers" },
                  ...safeCustomers.map((c) => ({
                    value: c.id,
                    label: c.name,
                  })),
                ]}
              />
            </div>
          )}

          {activeTab === "purchases" && (
            <div className="w-48">
              <CustomSelect
                theme="blue"
                size="sm"
                value={supplierId}
                onChange={(val) => setSupplierId(val)}
                placeholder="All Suppliers"
                options={[
                  { value: "", label: "All Suppliers" },
                  ...safeSuppliers.map((s) => ({
                    value: s.id,
                    label: s.name,
                  })),
                ]}
              />
            </div>
          )}
        </div>

        {/* Summary Metric Cards for Active Tab */}
        {activeTab === "sales" && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <MetricCard
              title="Total Invoices"
              value={`${summary.total_invoices || 0} Bills`}
              subtitle="Filtered sales period"
              icon={BarChart3}
            />
            <MetricCard
              title="Gross Sales"
              value={formatCurrency(summary.total_gross_sales || 0)}
              subtitle="Total invoice amount"
              icon={DollarSign}
            />
            <MetricCard
              title="Total Net Turnover"
              value={formatCurrency(summary.total_taxable_sales || 0)}
              subtitle="Turnover after discount"
              icon={TrendingUp}
            />
            <MetricCard
              title="GST Collected"
              value={formatCurrency(summary.total_gst_collected || 0)}
              subtitle="Output GST tax"
              icon={DollarSign}
            />
          </div>
        )}

        {activeTab === "purchases" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <MetricCard
              title="Total Inward Spend"
              value={formatCurrency(summary.total_purchase_amount || 0)}
              subtitle="Raw material purchases"
              icon={DollarSign}
            />
            <MetricCard
              title="Purchase Receipts"
              value={`${summary.total_receipts || 0} Invoices`}
              subtitle="Supplier inward records"
              icon={Boxes}
            />
          </div>
        )}

        {activeTab === "production" && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <MetricCard
              title="Production Runs"
              value={`${summary.total_production_runs || summary.total_entries || 0} Batches`}
              subtitle="Completed production entries"
              icon={Factory}
            />
            <MetricCard
              title="Raw Consumed"
              value={`${(summary.total_raw_used || 0).toLocaleString()} Kg`}
              subtitle="Inventory deducted (Quantity Used)"
              icon={Boxes}
            />
            <MetricCard
              title="Common Wastage"
              value={`${(summary.total_wastage || 0).toLocaleString()} Kg`}
              subtitle="Batch scrap (No extra stock deduction)"
              icon={TrendingUp}
            />
            <MetricCard
              title="Finished Produced"
              value={`${(summary.total_produced || 0).toLocaleString()} Units`}
              subtitle="Inventory added (Finished output)"
              icon={TrendingUp}
            />
          </div>
        )}

        {activeTab === "stock" && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricCard
              title="Total Stock Value"
              value={formatCurrency(summary.total_stock_value || 0)}
              subtitle="Live on-hand valuation"
              icon={DollarSign}
            />
            <MetricCard
              title="Raw Material Valuation"
              value={formatCurrency(summary.raw_material_valuation || 0)}
              subtitle="Purchased materials"
              icon={Boxes}
            />
            <MetricCard
              title="Finished Goods Valuation"
              value={formatCurrency(summary.finished_goods_valuation || 0)}
              subtitle="Manufactured goods"
              icon={TrendingUp}
            />
          </div>
        )}

        {/* Data Table */}
        <div className="bg-white rounded-[10px] border border-[#E4E1D8] shadow-[0_1px_2px_rgba(20,33,61,0.04)] overflow-hidden">
          {loading ? (
            <div className="p-6">
              <SkeletonLoader count={5} />
            </div>
          ) : safeDataList.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              title="No report records found"
              description="Try adjusting your date range or filter options to view historical records."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                {activeTab === "sales" && (
                  <>
                    <thead className="bg-[#F8FAFC] border-b border-[#EDEAE1] text-[#52607D] font-semibold">
                      <tr>
                        <th className="py-3 px-4">Invoice No</th>
                        <th className="py-3 px-3">Date</th>
                        <th className="py-3 px-4">Customer</th>
                        <th className="py-3 px-3 text-right">Subtotal</th>
                        <th className="py-3 px-3 text-right">Discount</th>
                        <th className="py-3 px-3 text-right">Total</th>
                        <th className="py-3 px-3 text-right">GST</th>
                        <th className="py-3 px-4 text-right">Grand Total</th>
                        <th className="py-3 px-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EDEAE1]">
                      {safeDataList.map((s) => (
                        <tr key={s.id} className="hover:bg-[#FAFAF8] transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-[#2F6F5E]">{s.sale_number}</td>
                          <td className="py-3 px-3 text-[#52607D]">{s.sale_date}</td>
                          <td className="py-3 px-4 font-bold text-[#14213D]">{s.customer_name}</td>
                          <td className="py-3 px-3 text-right text-[#52607D]">{formatCurrency(s.subtotal)}</td>
                          <td className="py-3 px-3 text-right text-emerald-700 font-mono">
                            {Number(s.total_discount) > 0 ? `-${formatCurrency(s.total_discount)}` : "—"}
                          </td>
                          <td className="py-3 px-3 text-right font-medium text-[#14213D]">{formatCurrency(s.taxable_amount)}</td>
                          <td className="py-3 px-3 text-right text-[#52607D]">{formatCurrency(s.gst_amount)}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-[#14213D]">{formatCurrency(s.grand_total)}</td>
                          <td className="py-3 px-3 text-center">
                            <Button
                              variant="ghost"
                              size="xs"
                              icon={Eye}
                              onClick={() => setSelectedSale(s)}
                            >
                              Bill
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}

                {activeTab === "purchases" && (
                  <>
                    <thead className="bg-[#F8FAFC] border-b border-[#EDEAE1] text-[#52607D] font-semibold">
                      <tr>
                        <th className="py-3 px-4">Receipt Date</th>
                        <th className="py-3 px-4">Supplier</th>
                        <th className="py-3 px-3">Reference No</th>
                        <th className="py-3 px-3 text-center">Items Count</th>
                        <th className="py-3 px-4 text-right">Total Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EDEAE1]">
                      {safeDataList.map((p) => (
                        <tr key={p.id} className="hover:bg-[#FAFAF8] transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-[#14213D]">{p.receipt_date}</td>
                          <td className="py-3 px-4 font-medium text-[#14213D]">{p.supplier_name || p.supplier?.name || "Direct"}</td>
                          <td className="py-3 px-3 text-[#52607D] font-mono">{p.reference_number || "—"}</td>
                          <td className="py-3 px-3 text-center text-[#52607D]">{p.items?.length || 0}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-[#14213D]">{formatCurrency(p.total_amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}

                {activeTab === "production" && (
                  <>
                    <thead className="bg-[#F8FAFC] border-b border-[#EDEAE1] text-[#52607D] font-semibold">
                      <tr>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-3">Batch / Ref</th>
                        <th className="py-3 px-4">Raw Materials Consumed</th>
                        <th className="py-3 px-3">Common Wastage</th>
                        <th className="py-3 px-4">Finished Outputs</th>
                        <th className="py-3 px-3">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EDEAE1]">
                      {safeDataList.map((e) => {
                        const wasteQty = Number(e.wastage_quantity || 0);
                        return (
                          <tr key={e.id} className="hover:bg-[#FAFAF8] transition-colors">
                            <td className="py-3 px-4 font-mono font-bold text-[#2F6F5E]">{e.production_date}</td>
                            <td className="py-3 px-3 text-[#52607D] font-mono">{e.reference_number || "—"}</td>
                            <td className="py-3 px-4 text-[#52607D]">
                              {(e.materials || []).map((m) => `${m.item?.name || "Raw"}: ${m.quantity_used} ${m.unit?.symbol || "Kg"}`).join(", ") || "None"}
                            </td>
                            <td className="py-3 px-3">
                              {wasteQty > 0 ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                  {wasteQty} Kg
                                </span>
                              ) : (
                                <span className="text-[#52607D]">0 Kg</span>
                              )}
                            </td>
                            <td className="py-3 px-4 font-bold text-[#14213D]">
                              {(e.outputs || []).map((o) => `${o.item?.name || "Fin"}: +${o.quantity_produced} ${o.unit?.symbol || "Nos"}`).join(", ") || "None"}
                            </td>
                            <td className="py-3 px-3 text-[#52607D] italic">{e.notes || "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </>
                )}

                {activeTab === "stock" && (
                  <>
                    <thead className="bg-[#F8FAFC] border-b border-[#EDEAE1] text-[#52607D] font-semibold">
                      <tr>
                        <th className="py-3 px-4">Item Name</th>
                        <th className="py-3 px-3">Type</th>
                        <th className="py-3 px-3">Category</th>
                        <th className="py-3 px-3 text-right">Unit Price</th>
                        <th className="py-3 px-4 text-right">On-Hand Qty</th>
                        <th className="py-3 px-4 text-right">Stock Valuation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EDEAE1]">
                      {safeDataList.map((st) => (
                        <tr key={st.id} className="hover:bg-[#FAFAF8] transition-colors">
                          <td className="py-3 px-4 font-bold text-[#14213D]">{st.name}</td>
                          <td className="py-3 px-3">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                st.item_type === "RAW_MATERIAL"
                                  ? "bg-amber-100 text-amber-900 border border-amber-200"
                                  : "bg-[#EAF3F0] text-[#2F6F5E] border border-[#D3E6E0]"
                              }`}
                            >
                              {st.item_type === "RAW_MATERIAL" ? "Raw Material" : "Finished Good"}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-[#52607D]">{st.category || "—"}</td>
                          <td className="py-3 px-3 text-right font-mono text-[#14213D]">{formatCurrency(st.unit_price)}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-[#14213D]">
                            {st.quantity_on_hand} {st.unit?.symbol || ""}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-[#2F6F5E]">
                            {formatCurrency(st.stock_value)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}
              </table>
            </div>
          )}
        </div>
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
                variant="secondary"
                size="sm"
                icon={FileText}
                loading={exportingPdf}
                onClick={() => handleExportPDF(selectedSale)}
              >
                Download PDF
              </Button>
              <Button variant="primary" size="sm" icon={Printer} onClick={() => window.print()}>
                Print Bill
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default PlastReportsPage;
