import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Calendar,
  IndianRupee,
  Users,
  Download,
  Printer,
  RefreshCw,
  Search,
  Building2,
  Receipt,
  Layers,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import Navbar from "../components/layout/Navbar.jsx";
import Button from "../components/common/Button.jsx";
import CustomSelect from "../components/common/CustomSelect.jsx";
import { SkeletonLoader } from "../components/common/SkeletonLoader.jsx";
import { toast } from "sonner";
import { formatDate } from "../utils/dates.js";

const MONTHS = [
  { value: 1, label: "January", short: "Jan" },
  { value: 2, label: "February", short: "Feb" },
  { value: 3, label: "March", short: "Mar" },
  { value: 4, label: "April", short: "Apr" },
  { value: 5, label: "May", short: "May" },
  { value: 6, label: "June", short: "Jun" },
  { value: 7, label: "July", short: "Jul" },
  { value: 8, label: "August", short: "Aug" },
  { value: 9, label: "September", short: "Sep" },
  { value: 10, label: "October", short: "Oct" },
  { value: 11, label: "November", short: "Nov" },
  { value: 12, label: "December", short: "Dec" },
];

export function CommissionReportsPage() {
  const { user } = useAuth();
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState({
    dealers: [],
    totals: {
      total_dealers_count: 0,
      total_projects_count: 0,
      fund_55: { material_cost: 0, fittings_cost: 0, commission: 0 },
      fund_45: { material_cost: 0, commission: 0 },
      fund_40: { material_cost: 0, commission: 0 },
      total_penalty: 0,
      total_net_commission: 0,
    },
    start_date: "",
    end_date: "",
  });
  const [exportingPDF, setExportingPDF] = useState(false);

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let y = currentYear - 3; y <= currentYear + 2; y++) {
      years.push({ value: String(y), label: String(y) });
    }
    return years;
  }, []);

  const fetchMonthlyReport = async () => {
    try {
      setLoading(true);
      const res = await api.get("/proceedings/monthly-report", {
        params: {
          year: selectedYear,
          month: selectedMonth,
        },
      });

      const report = res?.report || res?.data?.report || {};
      setReportData({
        dealers: report.dealers || [],
        totals: report.totals || {
          total_dealers_count: 0,
          total_projects_count: 0,
          fund_55: { material_cost: 0, fittings_cost: 0, commission: 0 },
          fund_45: { material_cost: 0, commission: 0 },
          fund_40: { material_cost: 0, commission: 0 },
          total_penalty: 0,
          total_net_commission: 0,
        },
        start_date: report.start_date || "",
        end_date: report.end_date || "",
      });
    } catch (err) {
      console.error("Failed to load monthly commission report:", err);
      toast.error(err?.response?.data?.message || err?.message || "Failed to load monthly commission report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthlyReport();
  }, [selectedYear, selectedMonth]);

  const monthObj = MONTHS.find((m) => m.value === Number(selectedMonth)) || MONTHS[0];
  const monthName = monthObj.label;

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((prev) => prev - 1);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((prev) => prev + 1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
  };

  // Filter dealers by search input
  const filteredDealers = useMemo(() => {
    if (!reportData.dealers) return [];
    if (!search.trim()) return reportData.dealers;
    const term = search.toLowerCase().trim();
    return reportData.dealers.filter(
      (d) =>
        d.dealer_name?.toLowerCase().includes(term) ||
        d.dealer_district?.toLowerCase().includes(term) ||
        d.dealer_code?.toLowerCase().includes(term)
    );
  }, [reportData.dealers, search]);

  // Recalculate filtered totals when search is active
  const displayedTotals = useMemo(() => {
    if (!search.trim()) return reportData.totals;
    return {
      total_dealers_count: filteredDealers.length,
      total_projects_count: filteredDealers.reduce((acc, d) => acc + (d.projects_count || 0), 0),
      fund_55: {
        material_cost: filteredDealers.reduce((acc, d) => acc + (d.fund_55?.material_cost || 0), 0),
        fittings_cost: filteredDealers.reduce((acc, d) => acc + (d.fund_55?.fittings_cost || 0), 0),
        commission: filteredDealers.reduce((acc, d) => acc + (d.fund_55?.commission || 0), 0),
      },
      fund_45: {
        material_cost: filteredDealers.reduce((acc, d) => acc + (d.fund_45?.material_cost || 0), 0),
        commission: filteredDealers.reduce((acc, d) => acc + (d.fund_45?.commission || 0), 0),
      },
      fund_40: {
        material_cost: filteredDealers.reduce((acc, d) => acc + (d.fund_40?.material_cost || 0), 0),
        commission: filteredDealers.reduce((acc, d) => acc + (d.fund_40?.commission || 0), 0),
      },
      total_penalty: filteredDealers.reduce((acc, d) => acc + (d.total_penalty || 0), 0),
      total_net_commission: filteredDealers.reduce((acc, d) => acc + (d.net_commission || 0), 0),
    };
  }, [filteredDealers, search, reportData.totals]);

  const formatRupees = (val) => {
    const num = Math.floor(parseFloat(val || 0));
    return `₹${num.toLocaleString("en-IN")}`;
  };

  const formatNum = (val) => {
    const num = Math.floor(parseFloat(val || 0));
    return num.toLocaleString("en-IN");
  };

  // PDF Export
  const handleExportPDF = () => {
    try {
      setExportingPDF(true);

      const doc = new jsPDF({
        orientation: "landscape",
        unit: "pt",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Brand Header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(20, 33, 61);
      doc.text("CHERAN IRRIGATION", 30, 36);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(82, 96, 125);
      doc.text("MONTHLY DEALER COMMISSION STATEMENT", 30, 50);

      // Report Meta Information
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(20, 33, 61);
      doc.text(`Month: ${monthName} ${selectedYear}`, 30, 68);
      doc.text(
        `Payment Received Period: ${formatDate(reportData.start_date)} to ${formatDate(reportData.end_date)}`,
        200,
        68
      );
      doc.text(`Dealers with Commission: ${displayedTotals.total_dealers_count}`, 490, 68);
      doc.text(`Total Net Commission: ${formatRupees(displayedTotals.total_net_commission)}`, 640, 68);

      // Two-tier header structure
      const headers = [
        [
          { content: "S.No", rowSpan: 2, styles: { valign: "middle", halign: "center" } },
          { content: "Dealer Name", rowSpan: 2, styles: { valign: "middle" } },
          { content: "55% Release", colSpan: 3, styles: { halign: "center" } },
          { content: "45% Release", colSpan: 2, styles: { halign: "center" } },
          { content: "40% Release", colSpan: 2, styles: { halign: "center" } },
          { content: "Net Commission", rowSpan: 2, styles: { valign: "middle", halign: "right" } },
        ],
        [
          { content: "Material Cost", styles: { halign: "right" } },
          { content: "Fittings Cost", styles: { halign: "right" } },
          { content: "Commission", styles: { halign: "right" } },
          { content: "Material Cost", styles: { halign: "right" } },
          { content: "Commission", styles: { halign: "right" } },
          { content: "Material Cost", styles: { halign: "right" } },
          { content: "Commission", styles: { halign: "right" } },
        ],
      ];

      const rows = filteredDealers.map((d, index) => [
        String(index + 1),
        d.dealer_name,
        formatNum(d.fund_55?.material_cost),
        formatNum(d.fund_55?.fittings_cost),
        formatNum(d.fund_55?.commission),
        formatNum(d.fund_45?.material_cost),
        formatNum(d.fund_45?.commission),
        formatNum(d.fund_40?.material_cost),
        formatNum(d.fund_40?.commission),
        formatNum(d.net_commission),
      ]);

      const footers = [
        [
          { content: "TOTAL", colSpan: 2, styles: { fontStyle: "bold", halign: "right" } },
          formatNum(displayedTotals.fund_55?.material_cost),
          formatNum(displayedTotals.fund_55?.fittings_cost),
          formatNum(displayedTotals.fund_55?.commission),
          formatNum(displayedTotals.fund_45?.material_cost),
          formatNum(displayedTotals.fund_45?.commission),
          formatNum(displayedTotals.fund_40?.material_cost),
          formatNum(displayedTotals.fund_40?.commission),
          formatNum(displayedTotals.total_net_commission),
        ],
      ];

      autoTable(doc, {
        head: headers,
        body: rows,
        foot: footers,
        startY: 82,
        margin: { left: 24, right: 24 },
        theme: "grid",
        styles: {
          fontSize: 7.5,
          cellPadding: { top: 4, bottom: 4, left: 3, right: 3 },
          textColor: [20, 33, 61],
          lineColor: [228, 225, 216],
          lineWidth: 0.5,
          overflow: "linebreak",
        },
        headStyles: {
          fillColor: [245, 245, 243],
          textColor: [50, 60, 80],
          fontStyle: "bold",
          fontSize: 7.5,
        },
        footStyles: {
          fillColor: [238, 246, 242],
          textColor: [47, 111, 94],
          fontStyle: "bold",
          fontSize: 7.8,
        },
        columnStyles: {
          0: { cellWidth: 26, halign: "center" },
          1: { cellWidth: 150 },
          2: { cellWidth: 65, halign: "right" },
          3: { cellWidth: 65, halign: "right" },
          4: { cellWidth: 65, halign: "right", fontStyle: "bold", textColor: [47, 111, 94] },
          5: { cellWidth: 65, halign: "right" },
          6: { cellWidth: 65, halign: "right", fontStyle: "bold", textColor: [47, 111, 94] },
          7: { cellWidth: 65, halign: "right" },
          8: { cellWidth: 65, halign: "right", fontStyle: "bold", textColor: [47, 111, 94] },
          9: { cellWidth: 80, halign: "right", fontStyle: "bold", textColor: [20, 33, 61] },
        },
        didDrawPage: (data) => {
          const pageCount = doc.internal.getNumberOfPages();
          doc.setFontSize(7.5);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(140, 151, 171);
          doc.text(
            `Cheran Irrigation · Monthly Commission Report · ${monthName} ${selectedYear} · Exported on ${formatDate(
              new Date()
            )} · Page ${data.pageNumber} of ${pageCount}`,
            pageWidth / 2,
            pageHeight - 12,
            { align: "center" }
          );
        },
      });

      doc.save(`Commission_Report_${monthName}_${selectedYear}.pdf`);
      toast.success("PDF exported successfully");
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.error("Failed to generate PDF: " + (err?.message || "Unknown error"));
    } finally {
      setExportingPDF(false);
    }
  };

  // Browser Print handler
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#14213D] pb-16">
      {/* Top Navbar */}
      <div className="print:hidden">
        <Navbar />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Printable Only Report Header */}
        <div className="hidden print:block pb-4 border-b border-[#E4E1D8]">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl font-bold text-[#14213D]">CHERAN IRRIGATION</h1>
              <p className="text-xs text-[#52607D]">MONTHLY DEALER COMMISSION REPORT</p>
            </div>
            <div className="text-right text-xs text-[#52607D]">
              <p className="font-bold text-[#14213D]">
                {monthName} {selectedYear}
              </p>
              <p>
                Period: {formatDate(reportData.start_date)} to {formatDate(reportData.end_date)}
              </p>
              <p>Generated: {formatDate(new Date())}</p>
            </div>
          </div>
        </div>

        {/* Page Header (Screen) */}
        <div className="print:hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#52607D] mb-1">
              <Link to="/commissions" className="hover:text-[#2F6F5E] transition-colors">
                Commissions
              </Link>
              <span>/</span>
              <span className="text-[#14213D] font-semibold">Commission Reports</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#14213D] flex items-center gap-2">
              <Receipt size={24} className="text-[#2F6F5E]" />
              Monthly Commission Report
            </h1>
            <p className="text-xs text-[#52607D] mt-0.5">
              Net dealer commission aggregated across 55%, 45%, and 40% releases based strictly on bank payment date.
            </p>
          </div>

          {/* Action Buttons: PDF & Print */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              disabled={loading || filteredDealers.length === 0}
              className="flex items-center gap-1.5 cursor-pointer text-xs"
              title="Print Monthly Commission Report"
            >
              <Printer size={14} />
              Print
            </Button>
            <Button
              size="sm"
              onClick={handleExportPDF}
              disabled={loading || filteredDealers.length === 0 || exportingPDF}
              className="flex items-center gap-1.5 cursor-pointer bg-[#2F6F5E] hover:bg-[#25584A] text-white text-xs"
              title="Download PDF format"
            >
              <Download size={14} />
              {exportingPDF ? "Generating PDF..." : "Export PDF"}
            </Button>
          </div>
        </div>

        {/* Filter Bar (Month & Year Selector) */}
        <div className="print:hidden bg-white border border-[#E4E1D8] rounded-[10px] p-4 shadow-[0_1px_2px_rgba(20,33,61,0.03)] space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Month Navigator & Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 text-[#52607D] hover:text-[#14213D] hover:bg-[#FAFAF8] rounded-[6px] border border-[#E4E1D8] cursor-pointer transition-colors shrink-0"
                title="Previous Month"
              >
                <ChevronLeft size={16} />
              </button>

              <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
                {MONTHS.map((m) => {
                  const isSelected = m.value === Number(selectedMonth);
                  return (
                    <button
                      key={m.value}
                      onClick={() => setSelectedMonth(m.value)}
                      className={`px-2.5 py-1 text-xs rounded-[6px] font-medium transition-all shrink-0 cursor-pointer ${
                        isSelected
                          ? "bg-[#2F6F5E] text-white shadow-xs font-semibold"
                          : "bg-[#FAFAF8] text-[#52607D] hover:bg-[#EBEAE5] hover:text-[#14213D] border border-[#E4E1D8]"
                      }`}
                    >
                      {m.short}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handleNextMonth}
                className="p-1.5 text-[#52607D] hover:text-[#14213D] hover:bg-[#FAFAF8] rounded-[6px] border border-[#E4E1D8] cursor-pointer transition-colors shrink-0"
                title="Next Month"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Year Selector & Refresh */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-28">
                <CustomSelect
                  options={yearOptions}
                  value={String(selectedYear)}
                  onChange={(val) => setSelectedYear(parseInt(val, 10))}
                  placeholder="Year"
                  size="sm"
                />
              </div>

              <button
                onClick={fetchMonthlyReport}
                disabled={loading}
                className="p-2 text-[#52607D] hover:text-[#2F6F5E] hover:bg-[#FAFAF8] rounded-[8px] border border-[#E4E1D8] cursor-pointer transition-colors"
                title="Refresh Report Data"
              >
                <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              </button>
            </div>
          </div>

          {/* Subheader info & Dealer Filter */}
          <div className="pt-3 border-t border-[#EDEAE1] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#52607D]">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#14213D]">{monthName} {selectedYear}</span>
              <span>·</span>
              <span>
                Payment Dates: <strong className="font-mono text-[#14213D]">{formatDate(reportData.start_date)}</strong> to{" "}
                <strong className="font-mono text-[#14213D]">{formatDate(reportData.end_date)}</strong>
              </span>
              <span>·</span>
              <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-medium text-[11px]">
                {displayedTotals.total_dealers_count} Dealers Credited
              </span>
            </div>

            {/* Search Filter for Dealers */}
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C97AB]" />
              <input
                type="text"
                placeholder="Search dealer by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#FAFAF8] border border-[#E4E1D8] rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
              />
            </div>
          </div>
        </div>

        {/* Metric Cards (Top Summary) */}
        <div className="print:hidden grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-4 shadow-[0_1px_2px_rgba(20,33,61,0.03)]">
            <span className="text-[11px] uppercase font-semibold text-[#52607D] tracking-wider block mb-1">
              Net Commission
            </span>
            <div className="text-xl font-bold font-mono text-[#2F6F5E]">
              {formatRupees(displayedTotals.total_net_commission)}
            </div>
            <div className="text-[11px] text-[#8C97AB] mt-1">Across all releases in month</div>
          </div>

          <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-4 shadow-[0_1px_2px_rgba(20,33,61,0.03)]">
            <span className="text-[11px] uppercase font-semibold text-[#52607D] tracking-wider block mb-1">
              55% Release Net
            </span>
            <div className="text-xl font-bold font-mono text-[#14213D]">
              {formatRupees(
                (displayedTotals.fund_55?.commission || 0) + (displayedTotals.fund_55?.fittings_cost || 0)
              )}
            </div>
            <div className="text-[11px] text-[#8C97AB] mt-1">
              Comm: {formatRupees(displayedTotals.fund_55?.commission)} | Fit: {formatRupees(displayedTotals.fund_55?.fittings_cost)}
            </div>
          </div>

          <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-4 shadow-[0_1px_2px_rgba(20,33,61,0.03)]">
            <span className="text-[11px] uppercase font-semibold text-[#52607D] tracking-wider block mb-1">
              45% Release Comm
            </span>
            <div className="text-xl font-bold font-mono text-[#14213D]">
              {formatRupees(displayedTotals.fund_45?.commission)}
            </div>
            <div className="text-[11px] text-[#8C97AB] mt-1">
              Mat Cost: {formatRupees(displayedTotals.fund_45?.material_cost)}
            </div>
          </div>

          <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-4 shadow-[0_1px_2px_rgba(20,33,61,0.03)]">
            <span className="text-[11px] uppercase font-semibold text-[#52607D] tracking-wider block mb-1">
              40% Release Comm
            </span>
            <div className="text-xl font-bold font-mono text-[#14213D]">
              {formatRupees(displayedTotals.fund_40?.commission)}
            </div>
            <div className="text-[11px] text-[#8C97AB] mt-1">
              Mat Cost: {formatRupees(displayedTotals.fund_40?.material_cost)}
            </div>
          </div>
        </div>

        {/* Main Monthly Report Table */}
        <div className="bg-white border border-[#E4E1D8] rounded-[10px] shadow-[0_1px_2px_rgba(20,33,61,0.04)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                {/* Top Tier Headers */}
                <tr className="bg-[#FAFAF8] border-b border-[#E4E1D8] text-[#52607D] uppercase font-semibold text-[11px]">
                  <th rowSpan={2} className="py-3 px-3 w-12 text-center border-r border-[#E4E1D8]">
                    S.No
                  </th>
                  <th rowSpan={2} className="py-3 px-4 min-w-[200px] border-r border-[#E4E1D8]">
                    Dealer Name
                  </th>
                  <th colSpan={3} className="py-2.5 px-3 text-center border-r border-[#E4E1D8] bg-[#F4F9F7] text-[#2F6F5E] font-bold">
                    55% Release
                  </th>
                  <th colSpan={2} className="py-2.5 px-3 text-center border-r border-[#E4E1D8] bg-[#F7F9FC] text-[#3B66A3] font-bold">
                    45% Release
                  </th>
                  <th colSpan={2} className="py-2.5 px-3 text-center border-r border-[#E4E1D8] bg-[#F9F6FC] text-[#6D28D9] font-bold">
                    40% Release
                  </th>
                  <th rowSpan={2} className="py-3 px-4 text-right font-bold text-[#14213D] bg-[#F0F7F4] min-w-[130px]">
                    Net Commission
                  </th>
                </tr>

                {/* Sub Tier Headers */}
                <tr className="bg-[#FAFAF8] border-b border-[#E4E1D8] text-[#52607D] uppercase font-semibold text-[10px]">
                  {/* 55% Sub-columns */}
                  <th className="py-2 px-3 text-right bg-[#F4F9F7]/70 border-r border-[#EDEAE1]">Material Cost</th>
                  <th className="py-2 px-3 text-right bg-[#F4F9F7]/70 border-r border-[#EDEAE1]">Fittings Cost</th>
                  <th className="py-2 px-3 text-right bg-[#F4F9F7] text-[#2F6F5E] font-bold border-r border-[#E4E1D8]">
                    Commission
                  </th>

                  {/* 45% Sub-columns */}
                  <th className="py-2 px-3 text-right bg-[#F7F9FC]/70 border-r border-[#EDEAE1]">Material Cost</th>
                  <th className="py-2 px-3 text-right bg-[#F7F9FC] text-[#3B66A3] font-bold border-r border-[#E4E1D8]">
                    Commission
                  </th>

                  {/* 40% Sub-columns */}
                  <th className="py-2 px-3 text-right bg-[#F9F6FC]/70 border-r border-[#EDEAE1]">Material Cost</th>
                  <th className="py-2 px-3 text-right bg-[#F9F6FC] text-[#6D28D9] font-bold border-r border-[#E4E1D8]">
                    Commission
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#EDEAE1]">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="w-8 h-8 border-3 border-[#2F6F5E] border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs text-[#52607D]">Loading {monthName} {selectedYear} commission data...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredDealers.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-16 text-center">
                      <div className="max-w-md mx-auto flex flex-col items-center justify-center gap-2">
                        <AlertCircle size={36} className="text-[#8C97AB]" />
                        <h4 className="text-sm font-semibold text-[#14213D]">
                          No Commission Received in {monthName} {selectedYear}
                        </h4>
                        <p className="text-xs text-[#52607D]">
                          No proceeding batches with bank payment received dates fall within this month. Note that commission is strictly credited after bank payment receipt.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredDealers.map((d, index) => (
                    <tr
                      key={d.dealer_id || `unassigned-${index}`}
                      className="hover:bg-[#FAFAF8] transition-colors"
                    >
                      {/* S.No */}
                      <td className="py-3 px-3 text-center text-[#52607D] font-mono border-r border-[#EDEAE1]">
                        {index + 1}
                      </td>

                      {/* Dealer Name */}
                      <td className="py-3 px-4 font-semibold text-[#14213D] border-r border-[#EDEAE1]">
                        <div className="flex items-center gap-1.5">
                          <span>{d.dealer_name}</span>
                        </div>
                        {d.dealer_district && d.dealer_district !== "—" && (
                          <div className="text-[10px] text-[#8C97AB] font-normal">{d.dealer_district}</div>
                        )}
                      </td>

                      {/* 55% Release */}
                      <td className="py-3 px-3 text-right font-mono text-[#52607D] border-r border-[#EDEAE1]">
                        {d.fund_55?.material_cost > 0 ? formatRupees(d.fund_55.material_cost) : "—"}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-[#52607D] border-r border-[#EDEAE1]">
                        {d.fund_55?.fittings_cost > 0 ? formatRupees(d.fund_55.fittings_cost) : "—"}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-[#2F6F5E] bg-[#F4F9F7]/30 border-r border-[#E4E1D8]">
                        {d.fund_55?.commission > 0 ? formatRupees(d.fund_55.commission) : "—"}
                      </td>

                      {/* 45% Release */}
                      <td className="py-3 px-3 text-right font-mono text-[#52607D] border-r border-[#EDEAE1]">
                        {d.fund_45?.material_cost > 0 ? formatRupees(d.fund_45.material_cost) : "—"}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-[#3B66A3] bg-[#F7F9FC]/30 border-r border-[#E4E1D8]">
                        {d.fund_45?.commission > 0 ? formatRupees(d.fund_45.commission) : "—"}
                      </td>

                      {/* 40% Release */}
                      <td className="py-3 px-3 text-right font-mono text-[#52607D] border-r border-[#EDEAE1]">
                        {d.fund_40?.material_cost > 0 ? formatRupees(d.fund_40.material_cost) : "—"}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-[#6D28D9] bg-[#F9F6FC]/30 border-r border-[#E4E1D8]">
                        {d.fund_40?.commission > 0 ? formatRupees(d.fund_40.commission) : "—"}
                      </td>

                      {/* Net Dealer Commission */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-[#14213D] bg-[#F0F7F4]/50">
                        {formatRupees(d.net_commission)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>

              {/* Table Footer - TOTAL */}
              {filteredDealers.length > 0 && (
                <tfoot>
                  <tr className="bg-[#EDF5F2] border-t-2 border-[#2F6F5E] text-[#14213D] font-bold text-xs">
                    <td colSpan={2} className="py-3.5 px-4 text-right uppercase tracking-wider border-r border-[#E4E1D8]">
                      Total ({displayedTotals.total_dealers_count} Dealers)
                    </td>

                    {/* 55% Totals */}
                    <td className="py-3.5 px-3 text-right font-mono border-r border-[#EDEAE1]">
                      {formatRupees(displayedTotals.fund_55?.material_cost)}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono border-r border-[#EDEAE1]">
                      {formatRupees(displayedTotals.fund_55?.fittings_cost)}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-[#2F6F5E] border-r border-[#E4E1D8]">
                      {formatRupees(displayedTotals.fund_55?.commission)}
                    </td>

                    {/* 45% Totals */}
                    <td className="py-3.5 px-3 text-right font-mono border-r border-[#EDEAE1]">
                      {formatRupees(displayedTotals.fund_45?.material_cost)}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-[#3B66A3] border-r border-[#E4E1D8]">
                      {formatRupees(displayedTotals.fund_45?.commission)}
                    </td>

                    {/* 40% Totals */}
                    <td className="py-3.5 px-3 text-right font-mono border-r border-[#EDEAE1]">
                      {formatRupees(displayedTotals.fund_40?.material_cost)}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-[#6D28D9] border-r border-[#E4E1D8]">
                      {formatRupees(displayedTotals.fund_40?.commission)}
                    </td>

                    {/* Grand Total Net Commission */}
                    <td className="py-3.5 px-4 text-right font-mono text-sm text-[#2F6F5E] bg-[#E2EFEA]">
                      {formatRupees(displayedTotals.total_net_commission)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CommissionReportsPage;
