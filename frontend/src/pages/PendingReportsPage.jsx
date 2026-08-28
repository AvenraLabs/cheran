import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ClipboardCheck,
  RefreshCw,
  Download,
  Search,
  Filter,
  Layers,
  Clock,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Building,
  Calendar,
  Users,
  ChevronRight,
  TrendingDown,
  ArrowRight,
  ExternalLink,
  Sprout,
  Apple,
  Boxes,
  HelpCircle,
  X,
  FileText,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import api from "../api/client.js";
import Navbar from "../components/layout/Navbar.jsx";
import MetricCard from "../components/common/MetricCard.jsx";
import Button from "../components/common/Button.jsx";
import CustomSelect from "../components/common/CustomSelect.jsx";
import Pagination from "../components/common/Pagination.jsx";
import { SkeletonLoader, EmptyState } from "../components/common/SkeletonLoader.jsx";
import { formatDate } from "../utils/dates.js";
import { toast } from "sonner";

const CATEGORY_OPTIONS = [
  { value: "ALL", label: "All Categories" },
  { value: "Agriculture", label: "Agriculture (A)" },
  { value: "Horticulture", label: "Horticulture (H)" },
  { value: "Cluster", label: "Cluster (AK / HK)" },
  { value: "Others", label: "Others" },
];

export function PendingReportsPage() {
  // Funnel & Master Data States
  const [funnelData, setFunnelData] = useState(null);
  const [dealers, setDealers] = useState([]);
  const [loadingSummary, setLoadingSummary] = useState(true);

  // Active Category View Tab: 'Agriculture' | 'Horticulture' | 'Cluster' | 'Others' | 'ALL'
  const [selectedCategoryTab, setSelectedCategoryTab] = useState("Agriculture");

  // Global Filters for Summary & Drill-Down
  const [selectedYear, setSelectedYear] = useState("ALL");
  const [selectedDealer, setSelectedDealer] = useState("ALL");
  const [selectedDistrict, setSelectedDistrict] = useState("ALL");

  // Drill-Down States
  const [pendencyType, setPendencyType] = useState("PENDING_WORK_COMPLETION"); // 'PENDING_WORK_COMPLETION' | 'PENDING_MATERIAL_SUPPLY' | 'PENDING_JVR_COMPLETION' | 'ALL_PENDING'
  const [drillCategory, setDrillCategory] = useState("Agriculture");
  const [drillYear, setDrillYear] = useState("ALL");
  const [minDaysPending, setMinDaysPending] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [projects, setProjects] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 25, totalPages: 1 });
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  // Dynamically compute Financial Year options strictly from backend available_years
  const yearOptions = useMemo(() => {
    const yearsList = funnelData?.available_years || [];
    return [
      { value: "ALL", label: "All Financial Years" },
      ...yearsList.map((y) => ({ value: y, label: y })),
    ];
  }, [funnelData?.available_years]);

  // Memoize Dealer options for CustomSelect
  const dealerOptions = useMemo(() => {
    return [
      { value: "ALL", label: "All Dealers" },
      { value: "UNASSIGNED", label: "Unassigned Dealers" },
      ...(dealers || []).map((d) => ({ value: d.id, label: d.name })),
    ];
  }, [dealers]);

  // Debounce search query input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load Dealers options on mount
  useEffect(() => {
    api
      .get("/dealers/options")
      .then((res) => {
        const list =
          res?.data?.dealers ||
          res?.dealers ||
          (Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []);
        setDealers(Array.isArray(list) ? list : []);
      })
      .catch((err) => {
        console.error("Failed to load dealers:", err);
        setDealers([]);
      });
  }, []);

  // Fetch Funnel Summary
  const fetchFunnelSummary = async () => {
    try {
      setLoadingSummary(true);
      const params = {};
      if (selectedYear !== "ALL") params.year = selectedYear;
      if (selectedDealer !== "ALL") params.dealer_id = selectedDealer;
      if (selectedDistrict !== "ALL") params.district = selectedDistrict;

      const res = await api.get("/reports/pending-funnel", { params });
      setFunnelData(res?.data || res || null);
    } catch (err) {
      console.error("Failed to load pending funnel summary:", err);
      toast.error("Failed to load pending funnel data");
    } finally {
      setLoadingSummary(false);
    }
  };

  useEffect(() => {
    fetchFunnelSummary();
  }, [selectedYear, selectedDealer, selectedDistrict]);

  // Fetch Granular Drill-Down Projects
  const fetchPendingProjects = async () => {
    try {
      setLoadingProjects(true);
      const params = {
        pendency_type: pendencyType,
        page: pagination.page,
        limit: pagination.limit,
      };

      if (drillCategory !== "ALL") params.category = drillCategory;
      if (drillYear !== "ALL") params.year = drillYear;
      if (selectedDealer !== "ALL") params.dealer_id = selectedDealer;
      if (selectedDistrict !== "ALL") params.district = selectedDistrict;
      if (minDaysPending) params.min_days_pending = minDaysPending;
      if (debouncedSearch) params.search = debouncedSearch;

      const res = await api.get("/reports/pending-projects", { params });
      const data = res?.data || res || {};
      setProjects(data.projects || []);
      if (data.pagination) {
        setPagination((prev) => ({
          ...prev,
          total: data.pagination.total || 0,
          totalPages: data.pagination.totalPages || 1,
        }));
      }
    } catch (err) {
      console.error("Failed to load pending projects drill-down:", err);
      toast.error("Failed to load pending projects");
    } finally {
      setLoadingProjects(false);
    }
  };

  useEffect(() => {
    fetchPendingProjects();
  }, [
    pendencyType,
    drillCategory,
    drillYear,
    selectedDealer,
    selectedDistrict,
    minDaysPending,
    debouncedSearch,
    pagination.page,
    pagination.limit,
  ]);

  // Keep drillCategory aligned when user clicks top category tab
  const handleCategoryTabChange = (catKey) => {
    setSelectedCategoryTab(catKey);
    setDrillCategory(catKey);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Quick filter drill-down from funnel row click
  const handleQuickFilterDrillDown = (catName, yr, type) => {
    setDrillCategory(catName);
    setSelectedCategoryTab(catName);
    setDrillYear(yr === "Unknown" ? "ALL" : yr);
    if (type) setPendencyType(type);
    setPagination((prev) => ({ ...prev, page: 1 }));

    // Smooth scroll down to drill down table
    const el = document.getElementById("drill-down-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  // CSV Export for pending projects
  const handleExportCsv = async () => {
    try {
      setExportingCsv(true);
      toast.info("Generating CSV export...");

      const params = {
        pendency_type: pendencyType,
        page: 1,
        limit: 10000,
      };
      if (drillCategory !== "ALL") params.category = drillCategory;
      if (drillYear !== "ALL") params.year = drillYear;
      if (selectedDealer !== "ALL") params.dealer_id = selectedDealer;
      if (selectedDistrict !== "ALL") params.district = selectedDistrict;
      if (minDaysPending) params.min_days_pending = minDaysPending;
      if (debouncedSearch) params.search = debouncedSearch;

      const res = await api.get("/reports/pending-projects", { params });
      const exportList = res?.data?.projects || res?.projects || [];

      if (exportList.length === 0) {
        toast.warning("No records found to export");
        return;
      }

      // Format CSV rows
      const isJvrView = pendencyType === "PENDING_JVR_COMPLETION";

      const headers = [
        "Application ID",
        "Farmer Name",
        "Dealer Assigned",
        isJvrView ? "1st Fund Date" : "WO Date",
        "Invoice Number",
        "Invoice Date",
        "Current Status",
        "Days Pending",
      ];

      const csvRows = [
        headers.join(","),
        ...exportList.map((p) =>
          [
            `"${p.application_id || ""}"`,
            `"${(p.farmer_name || "").replace(/"/g, '""')}"`,
            `"${(p.dealer_name || "Unassigned").replace(/"/g, '""')}"`,
            isJvrView
              ? `"${p.first_fund_utr_date || ""}"`
              : `"${p.work_order_date || ""}"`,
            `"${p.invoice_number || ""}"`,
            `"${p.invoice_date || ""}"`,
            `"${p.current_status || ""}"`,
            p.days_pending || 0,
          ].join(",")
        ),
      ];

      const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `cheran_pendency_report_${drillCategory.toLowerCase()}_${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Exported ${exportList.length} records to CSV`);
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Failed to generate CSV export");
    } finally {
      setExportingCsv(false);
    }
  };

  // PDF Export for pending projects
  const handleExportPDF = async () => {
    try {
      setExportingPdf(true);
      toast.info("Generating PDF report...");

      const params = {
        pendency_type: pendencyType,
        page: 1,
        limit: 10000,
      };
      if (drillCategory !== "ALL") params.category = drillCategory;
      if (drillYear !== "ALL") params.year = drillYear;
      if (selectedDealer !== "ALL") params.dealer_id = selectedDealer;
      if (selectedDistrict !== "ALL") params.district = selectedDistrict;
      if (minDaysPending) params.min_days_pending = minDaysPending;
      if (debouncedSearch) params.search = debouncedSearch;

      const res = await api.get("/reports/pending-projects", { params });
      const exportList = res?.data?.projects || res?.projects || [];

      if (exportList.length === 0) {
        toast.warning("No records found to export to PDF");
        return;
      }

      const doc = new jsPDF({
        orientation: "landscape",
        unit: "pt",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();

      const stageTitle =
        pendencyType === "PENDING_WORK_COMPLETION"
          ? "Pending Dealer Work Completion (Post-Invoicing)"
          : pendencyType === "PENDING_MATERIAL_SUPPLY"
          ? "Pending Material Supply (Awaiting Invoicing)"
          : pendencyType === "PENDING_JVR_COMPLETION"
          ? "Pending Joint Verification (Post-1st Fund Credited)"
          : "All Government Project Pendencies";

      // Brand Header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(20, 33, 61);
      doc.text("CHERAN PLAST & IRRIGATION", 30, 36);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(82, 96, 125);
      doc.text(`Government Scheme Pendency Report — ${stageTitle}`, 30, 50);

      // Meta Info
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(20, 33, 61);
      doc.text(`Category: ${drillCategory}`, 30, 68);
      doc.text(`Financial Year: ${drillYear}`, 160, 68);
      const curDealerName = dealers.find((d) => d.id === selectedDealer)?.name || "All Dealers";
      doc.text(`Dealer: ${curDealerName}`, 320, 68);
      doc.text(`Min Days: ${minDaysPending ? `>= ${minDaysPending}d` : "All"}`, 500, 68);
      doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")}`, 660, 68);

      const isJvrView = pendencyType === "PENDING_JVR_COMPLETION";

      const tableData = exportList.map((p, idx) => [
        idx + 1,
        p.application_id,
        p.farmer_name || "—",
        p.dealer_name || "Unassigned",
        isJvrView
          ? (p.first_fund_utr_date ? formatDate(p.first_fund_utr_date) : "—")
          : (p.work_order_date ? formatDate(p.work_order_date) : "—"),
        p.invoice_date ? `${p.invoice_number ? `#${p.invoice_number} ` : ""}${formatDate(p.invoice_date)}` : "Not Invoiced",
        p.current_status || "—",
        `${p.days_pending || 0}d`,
      ]);

      autoTable(doc, {
        head: [
          [
            "#",
            "Application ID",
            "Farmer Name",
            "Dealer Assigned",
            isJvrView ? "1st Fund Date" : "WO Date",
            "Invoice Details",
            "Current Status",
            "Days Pending",
          ],
        ],
        body: tableData,
        startY: 78,
        styles: {
          fontSize: 7.5,
          font: "helvetica",
          cellPadding: 4,
          textColor: [20, 33, 61],
          lineColor: [228, 225, 216],
          lineWidth: 0.5,
          valign: "middle",
        },
        headStyles: {
          fillColor: [20, 33, 61],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 8,
          halign: "left",
        },
        alternateRowStyles: {
          fillColor: [250, 250, 248],
        },
        columnStyles: {
          0: { cellWidth: 25, halign: "center" },
          1: { cellWidth: 130, fontStyle: "bold" },
          2: { cellWidth: 140 },
          3: { cellWidth: 110 },
          4: { cellWidth: 65, halign: "center" },
          5: { cellWidth: 95 },
          6: { cellWidth: 130 },
          7: { cellWidth: 65, halign: "center", fontStyle: "bold" },
        },
        didDrawPage: (data) => {
          doc.setFontSize(8);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(140, 151, 171);
          doc.text(
            `Total Records: ${exportList.length}  |  Page ${data.pageNumber} of ${doc.internal.getNumberOfPages()}`,
            pageWidth - 30,
            doc.internal.pageSize.getHeight() - 15,
            { align: "right" }
          );
        },
      });

      doc.save(
        `cheran_pending_${pendencyType.toLowerCase()}_${drillCategory.toLowerCase()}_${new Date().toISOString().split("T")[0]}.pdf`
      );
      toast.success(`PDF exported successfully (${exportList.length} records)`);
    } catch (err) {
      console.error("PDF export error:", err);
      toast.error("Failed to generate PDF export");
    } finally {
      setExportingPdf(false);
    }
  };

  const grand = funnelData?.grandTotals || {};
  const categories = funnelData?.categories || {};

  // Compute active category data
  const activeCategoryData = useMemo(() => {
    if (!funnelData?.categories) return null;
    if (selectedCategoryTab === "ALL") {
      return null;
    }
    return funnelData.categories[selectedCategoryTab] || null;
  }, [funnelData, selectedCategoryTab]);

  // Consolidated year rows across all categories for "ALL" tab (single combined row per financial year)
  const consolidatedAllYears = useMemo(() => {
    if (!funnelData?.categories) return [];
    const yearMap = new Map();

    Object.entries(funnelData.categories).forEach(([catName, catData]) => {
      (catData.years || []).forEach((row) => {
        const yKey = row.year || "Unknown";
        if (!yearMap.has(yKey)) {
          yearMap.set(yKey, {
            year: yKey,
            wo_count: 0,
            wo_ha: 0,
            invoiced_count: 0,
            invoiced_ha: 0,
            mat_pendency_count: 0,
            mat_pendency_ha: 0,
            wc_count: 0,
            wc_ha: 0,
            wc_pendency_count: 0,
            wc_pendency_ha: 0,
            fund1_count: 0,
            fund1_ha: 0,
            jv_count: 0,
            jv_ha: 0,
            jvr_pendency_count: 0,
            jvr_pendency_ha: 0,
          });
        }
        const cur = yearMap.get(yKey);
        cur.wo_count += row.wo_count || 0;
        cur.wo_ha += row.wo_ha || 0;
        cur.invoiced_count += row.invoiced_count || 0;
        cur.invoiced_ha += row.invoiced_ha || 0;
        cur.mat_pendency_count += row.mat_pendency_count || 0;
        cur.mat_pendency_ha += row.mat_pendency_ha || 0;
        cur.wc_count += row.wc_count || 0;
        cur.wc_ha += row.wc_ha || 0;
        cur.wc_pendency_count += row.wc_pendency_count || 0;
        cur.wc_pendency_ha += row.wc_pendency_ha || 0;
        cur.fund1_count += row.fund1_count || 0;
        cur.fund1_ha += row.fund1_ha || 0;
        cur.jv_count += row.jv_count || 0;
        cur.jv_ha += row.jv_ha || 0;
        cur.jvr_pendency_count += row.jvr_pendency_count || 0;
        cur.jvr_pendency_ha += row.jvr_pendency_ha || 0;
      });
    });

    return Array.from(yearMap.values()).sort((a, b) => {
      if (a.year === "Unknown") return 1;
      if (b.year === "Unknown") return -1;
      return a.year.localeCompare(b.year);
    });
  }, [funnelData]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#FAFAF8] overflow-y-auto">
      {/* Top Navbar */}
      <Navbar
        title="Pendency Report & Work Completion Funnel"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              icon={RefreshCw}
              onClick={() => {
                fetchFunnelSummary();
                fetchPendingProjects();
              }}
              loading={loadingSummary || loadingProjects}
            >
              Refresh Data
            </Button>
          </div>
        }
      />

      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Executive Summary Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
          <MetricCard
            title="Work Orders Issued"
            value={`${(grand.wo_ha || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })} Ha`}
            subtitle={`${(grand.wo_count || 0).toLocaleString("en-IN")} Total Projects`}
            icon={FileSpreadsheet}
          />
          <MetricCard
            title="Material Supplied (Invoiced)"
            value={`${(grand.invoiced_ha || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })} Ha`}
            subtitle={`${(grand.invoiced_count || 0).toLocaleString("en-IN")} Invoiced Projects`}
            icon={Boxes}
          />
          <div className="bg-[#FFFDF7] border border-[#E9DCA3] rounded-[10px] p-4 shadow-[0_1px_2px_rgba(20,33,61,0.04)] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8A6D1C]">
                Material Supply Pendency
              </span>
              <div className="w-7 h-7 rounded-[6px] bg-[#FEF3C7] text-[#D97706] flex items-center justify-center">
                <Clock size={14} />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-xl font-bold font-display text-[#B45309]">
                {(grand.mat_pendency_ha || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })} Ha
              </div>
              <div className="mt-0.5 text-[11px] text-[#92400E] font-medium">
                {grand.mat_pendency_count || 0} Projects awaiting Inv
              </div>
            </div>
          </div>

          <MetricCard
            title="Work Completed"
            value={`${(grand.wc_ha || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })} Ha`}
            subtitle={`${(grand.wc_count || 0).toLocaleString("en-IN")} Field Work Done`}
            icon={CheckCircle2}
          />

          <div className="bg-[#FEF2F2] border border-[#FCA5A5] rounded-[10px] p-4 shadow-[0_1px_2px_rgba(20,33,61,0.04)] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#991B1B]">
                Dealer Work Pendency
              </span>
              <div className="w-7 h-7 rounded-[6px] bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center">
                <AlertTriangle size={14} />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-xl font-bold font-display text-[#B91C1C]">
                {(grand.wc_pendency_ha || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })} Ha
              </div>
              <div className="mt-0.5 text-[11px] text-[#991B1B] font-semibold">
                {grand.wc_pendency_count || 0} Invoiced Pending Work
              </div>
            </div>
          </div>

          <div className="bg-[#EEF2FF] border border-[#C7D2FE] rounded-[10px] p-4 shadow-[0_1px_2px_rgba(20,33,61,0.04)] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#3730A3]">
                Joint Verification (JVR) Pendency
              </span>
              <div className="w-7 h-7 rounded-[6px] bg-[#E0E7FF] text-[#4F46E5] flex items-center justify-center">
                <ClipboardCheck size={14} />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-xl font-bold font-display text-[#3730A3]">
                {(grand.jvr_pendency_ha || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })} Ha
              </div>
              <div className="mt-0.5 text-[11px] text-[#4338CA] font-semibold">
                {grand.jvr_pendency_count || 0} 1st Fund Pending JV
              </div>
            </div>
          </div>
        </div>

        {/* Global Summary Filters Bar */}
        <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-bold text-[#14213D] uppercase tracking-wide">
            <Filter size={15} className="text-[#2F6F5E]" />
            <span>Summary Filters</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Year Selector */}
            <div className="flex items-center gap-1.5 text-xs text-[#52607D]">
              <Calendar size={14} />
              <span>Year:</span>
              <div className="w-48">
                <CustomSelect
                  options={yearOptions}
                  value={selectedYear}
                  onChange={(val) => setSelectedYear(val || "ALL")}
                  size="sm"
                  searchable={false}
                  placeholder="All Financial Years"
                />
              </div>
            </div>

            {/* Dealer Selector */}
            <div className="flex items-center gap-1.5 text-xs text-[#52607D]">
              <Users size={14} />
              <span>Dealer:</span>
              <div className="w-56">
                <CustomSelect
                  options={dealerOptions}
                  value={selectedDealer}
                  onChange={(val) => setSelectedDealer(val || "ALL")}
                  size="sm"
                  searchable={true}
                  placeholder="All Dealers"
                />
              </div>
            </div>

            {(selectedYear !== "ALL" || selectedDealer !== "ALL") && (
              <button
                type="button"
                onClick={() => {
                  setSelectedYear("ALL");
                  setSelectedDealer("ALL");
                  setSelectedDistrict("ALL");
                }}
                className="text-xs text-[#B0403A] hover:underline font-medium cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* 4 Main Category Headings / Navigation Tabs */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 border-b border-[#E4E1D8] pb-1">
            <button
              type="button"
              onClick={() => handleCategoryTabChange("Agriculture")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-[8px] text-xs font-bold transition-all cursor-pointer border-b-2 ${
                selectedCategoryTab === "Agriculture"
                  ? "bg-white text-[#2F6F5E] border-[#2F6F5E] shadow-xs"
                  : "text-[#52607D] border-transparent hover:text-[#14213D] hover:bg-white/50"
              }`}
            >
              <Sprout size={16} className="text-emerald-600" />
              <span>Agriculture</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                A
              </span>
              <span className="text-[11px] font-semibold text-[#8C97AB]">
                ({categories.Agriculture?.totals?.total_projects || 0})
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleCategoryTabChange("Horticulture")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-[8px] text-xs font-bold transition-all cursor-pointer border-b-2 ${
                selectedCategoryTab === "Horticulture"
                  ? "bg-white text-[#2F6F5E] border-[#2F6F5E] shadow-xs"
                  : "text-[#52607D] border-transparent hover:text-[#14213D] hover:bg-white/50"
              }`}
            >
              <Apple size={16} className="text-orange-500" />
              <span>Horticulture</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                H
              </span>
              <span className="text-[11px] font-semibold text-[#8C97AB]">
                ({categories.Horticulture?.totals?.total_projects || 0})
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleCategoryTabChange("Cluster")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-[8px] text-xs font-bold transition-all cursor-pointer border-b-2 ${
                selectedCategoryTab === "Cluster"
                  ? "bg-white text-[#2F6F5E] border-[#2F6F5E] shadow-xs"
                  : "text-[#52607D] border-transparent hover:text-[#14213D] hover:bg-white/50"
              }`}
            >
              <Boxes size={16} className="text-purple-600" />
              <span>Cluster</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                AK / HK
              </span>
              <span className="text-[11px] font-semibold text-[#8C97AB]">
                ({categories.Cluster?.totals?.total_projects || 0})
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleCategoryTabChange("Others")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-[8px] text-xs font-bold transition-all cursor-pointer border-b-2 ${
                selectedCategoryTab === "Others"
                  ? "bg-white text-[#2F6F5E] border-[#2F6F5E] shadow-xs"
                  : "text-[#52607D] border-transparent hover:text-[#14213D] hover:bg-white/50"
              }`}
            >
              <HelpCircle size={16} className="text-slate-500" />
              <span>Others</span>
              <span className="text-[11px] font-semibold text-[#8C97AB]">
                ({categories.Others?.totals?.total_projects || 0})
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleCategoryTabChange("ALL")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-[8px] text-xs font-bold transition-all cursor-pointer border-b-2 ${
                selectedCategoryTab === "ALL"
                  ? "bg-white text-[#2F6F5E] border-[#2F6F5E] shadow-xs"
                  : "text-[#52607D] border-transparent hover:text-[#14213D] hover:bg-white/50"
              }`}
            >
              <Layers size={16} className="text-blue-600" />
              <span>All Categories Combined</span>
            </button>
          </div>

          {/* Funnel Summary Table Card */}
          <div className="bg-white border border-[#E4E1D8] rounded-[10px] shadow-[0_1px_2px_rgba(20,33,61,0.02)] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E4E1D8] flex flex-wrap items-center justify-between gap-3 bg-[#FDFCFA]">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-[#EAF3F0] text-[#2F6F5E] flex items-center justify-center font-bold">
                  {selectedCategoryTab === "Agriculture" && <Sprout size={16} />}
                  {selectedCategoryTab === "Horticulture" && <Apple size={16} />}
                  {selectedCategoryTab === "Cluster" && <Boxes size={16} />}
                  {selectedCategoryTab === "Others" && <HelpCircle size={16} />}
                  {selectedCategoryTab === "ALL" && <Layers size={16} />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#14213D]">
                    {selectedCategoryTab === "ALL"
                      ? "All Categories Execution Funnel & Pendency"
                      : `${selectedCategoryTab} Execution Funnel & Pendency`}
                  </h3>
                </div>
              </div>

              <div className="text-xs text-[#52607D] flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]" />
                  <span>Material Pendency (WO - Invoiced)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626]" />
                  <span>Work Pendency (Invoiced - Completed)</span>
                </div>
              </div>
            </div>

            {loadingSummary ? (
              <div className="p-8">
                <SkeletonLoader count={5} />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#F8F7F4] text-[#52607D] font-bold text-[11px] uppercase tracking-wider border-b border-[#E4E1D8]">
                      <th className="py-3 px-4">Financial Year</th>
                      <th className="py-3 px-4 text-right">
                        Work Order Issued
                        <span className="block text-[9px] text-[#8C97AB] font-normal font-sans">
                          (Area Ha / Count)
                        </span>
                      </th>
                      <th className="py-3 px-4 text-right">
                        Material Supplied (Invoiced)
                        <span className="block text-[9px] text-[#8C97AB] font-normal font-sans">
                          (Area Ha / Count)
                        </span>
                      </th>
                      <th className="py-3 px-4 text-right text-[#B45309] bg-[#FFFDF7]">
                        Material Supply Pendency
                        <span className="block text-[9px] text-[#B45309]/80 font-normal font-sans">
                          (WO - Invoiced)
                        </span>
                      </th>
                      <th className="py-3 px-4 text-right">
                        Work Completed
                        <span className="block text-[9px] text-[#8C97AB] font-normal font-sans">
                          (Area Ha / Count)
                        </span>
                      </th>
                      <th className="py-3 px-4 text-right text-[#B91C1C] bg-[#FEF2F2]">
                        Work Completion Pendency
                        <span className="block text-[9px] text-[#B91C1C]/80 font-normal font-sans">
                          (Invoiced - Work Completed)
                        </span>
                      </th>
                      <th className="py-3 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDEAE1]">
                    {selectedCategoryTab !== "ALL" ? (
                      // Single Category Rows
                      <>
                        {(activeCategoryData?.years || []).length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-xs text-[#8C97AB]">
                              No project data found for this category with current filters.
                            </td>
                          </tr>
                        ) : (
                          activeCategoryData.years.map((row, idx) => (
                            <tr
                              key={idx}
                              className="hover:bg-[#F4F8F6] transition-colors group cursor-pointer"
                              onClick={() => handleQuickFilterDrillDown(selectedCategoryTab, row.year)}
                            >
                              <td className="py-3 px-4 font-bold font-mono text-[#14213D]">
                                {row.year === "Unknown" ? "Unspecified Year" : row.year}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <span className="font-bold text-[#14213D]">
                                  {row.wo_ha.toFixed(2)} Ha
                                </span>
                                <span className="ml-1.5 text-[10px] text-[#52607D] font-mono bg-[#EAE8E1]/60 px-1.5 py-0.5 rounded">
                                  {row.wo_count}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <span className="font-bold text-[#2F6F5E]">
                                  {row.invoiced_ha.toFixed(2)} Ha
                                </span>
                                <span className="ml-1.5 text-[10px] text-[#2F6F5E] font-mono bg-[#EAF3F0] px-1.5 py-0.5 rounded">
                                  {row.invoiced_count}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right bg-[#FFFDF7]">
                                <span
                                  className={`font-bold font-mono ${
                                    row.mat_pendency_ha > 0 ? "text-[#D97706]" : "text-[#8C97AB]"
                                  }`}
                                >
                                  {row.mat_pendency_ha.toFixed(2)} Ha
                                </span>
                                <span
                                  className={`ml-1.5 text-[10px] font-mono px-1.5 py-0.5 rounded ${
                                    row.mat_pendency_count > 0
                                      ? "bg-[#FEF3C7] text-[#92400E] font-bold"
                                      : "bg-gray-100 text-gray-400"
                                  }`}
                                >
                                  {row.mat_pendency_count}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <span className="font-bold text-[#14213D]">
                                  {row.wc_ha.toFixed(2)} Ha
                                </span>
                                <span className="ml-1.5 text-[10px] text-[#52607D] font-mono bg-[#EAE8E1]/60 px-1.5 py-0.5 rounded">
                                  {row.wc_count}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right bg-[#FEF2F2]">
                                <span
                                  className={`font-bold font-mono ${
                                    row.wc_pendency_ha > 0 ? "text-[#DC2626]" : "text-[#8C97AB]"
                                  }`}
                                >
                                  {row.wc_pendency_ha.toFixed(2)} Ha
                                </span>
                                <span
                                  className={`ml-1.5 text-[10px] font-mono px-1.5 py-0.5 rounded ${
                                    row.wc_pendency_count > 0
                                      ? "bg-[#FEE2E2] text-[#991B1B] font-bold"
                                      : "bg-gray-100 text-gray-400"
                                  }`}
                                >
                                  {row.wc_pendency_count}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-center">
                                <button
                                  type="button"
                                  title="View drill down"
                                  className="p-1 rounded text-[#52607D] hover:text-[#2F6F5E] hover:bg-[#EAF3F0] transition-colors"
                                >
                                  <ChevronRight size={15} />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}

                        {/* Category Subtotal Row */}
                        {activeCategoryData?.totals && (
                          <tr className="bg-[#EAE8E1]/40 font-bold border-t-2 border-[#DCD7CA]">
                            <td className="py-3.5 px-4 font-bold text-[#14213D] uppercase text-[11px] tracking-wider">
                              Total {selectedCategoryTab}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <span className="font-bold text-[#14213D]">
                                {activeCategoryData.totals.wo_ha.toFixed(2)} Ha
                              </span>
                              <span className="ml-1.5 text-[10px] text-[#14213D] font-mono bg-white px-1.5 py-0.5 rounded border border-[#DCD7CA]">
                                {activeCategoryData.totals.wo_count}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <span className="font-bold text-[#2F6F5E]">
                                {activeCategoryData.totals.invoiced_ha.toFixed(2)} Ha
                              </span>
                              <span className="ml-1.5 text-[10px] text-[#2F6F5E] font-mono bg-[#EAF3F0] px-1.5 py-0.5 rounded border border-[#BDE0D5]">
                                {activeCategoryData.totals.invoiced_count}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right bg-[#FEF9E7]">
                              <span className="font-bold text-[#D97706] font-mono">
                                {activeCategoryData.totals.mat_pendency_ha.toFixed(2)} Ha
                              </span>
                              <span className="ml-1.5 text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                                {activeCategoryData.totals.mat_pendency_count}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <span className="font-bold text-[#14213D]">
                                {activeCategoryData.totals.wc_ha.toFixed(2)} Ha
                              </span>
                              <span className="ml-1.5 text-[10px] text-[#14213D] font-mono bg-white px-1.5 py-0.5 rounded border border-[#DCD7CA]">
                                {activeCategoryData.totals.wc_count}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right bg-[#FDE8E8]">
                              <span className="font-bold text-[#DC2626] font-mono">
                                {activeCategoryData.totals.wc_pendency_ha.toFixed(2)} Ha
                              </span>
                              <span className="ml-1.5 text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#FEE2E2] text-[#991B1B] border border-[#FECACA]">
                                {activeCategoryData.totals.wc_pendency_count}
                              </span>
                            </td>
                            <td className="py-3.5 px-3 text-center" />
                          </tr>
                        )}
                      </>
                    ) : (
                      // All Categories Consolidated (Combined by Financial Year)
                      <>
                        {consolidatedAllYears.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-xs text-[#8C97AB]">
                              No project data found with current filters.
                            </td>
                          </tr>
                        ) : (
                          consolidatedAllYears.map((row, idx) => (
                            <tr
                              key={idx}
                              className="hover:bg-[#F4F8F6] transition-colors group cursor-pointer"
                              onClick={() => handleQuickFilterDrillDown("ALL", row.year)}
                            >
                              <td className="py-3 px-4 font-bold font-mono text-[#14213D]">
                                {row.year === "Unknown" ? "Unspecified Year" : row.year}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <span className="font-bold text-[#14213D]">
                                  {row.wo_ha.toFixed(2)} Ha
                                </span>
                                <span className="ml-1.5 text-[10px] text-[#52607D] font-mono bg-[#EAE8E1]/60 px-1.5 py-0.5 rounded">
                                  {row.wo_count}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <span className="font-bold text-[#2F6F5E]">
                                  {row.invoiced_ha.toFixed(2)} Ha
                                </span>
                                <span className="ml-1.5 text-[10px] text-[#2F6F5E] font-mono bg-[#EAF3F0] px-1.5 py-0.5 rounded">
                                  {row.invoiced_count}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right bg-[#FFFDF7]">
                                <span
                                  className={`font-bold font-mono ${
                                    row.mat_pendency_ha > 0 ? "text-[#D97706]" : "text-[#8C97AB]"
                                  }`}
                                >
                                  {row.mat_pendency_ha.toFixed(2)} Ha
                                </span>
                                <span
                                  className={`ml-1.5 text-[10px] font-mono px-1.5 py-0.5 rounded ${
                                    row.mat_pendency_count > 0
                                      ? "bg-[#FEF3C7] text-[#92400E] font-bold"
                                      : "bg-gray-100 text-gray-400"
                                  }`}
                                >
                                  {row.mat_pendency_count}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <span className="font-bold text-[#14213D]">
                                  {row.wc_ha.toFixed(2)} Ha
                                </span>
                                <span className="ml-1.5 text-[10px] text-[#52607D] font-mono bg-[#EAE8E1]/60 px-1.5 py-0.5 rounded">
                                  {row.wc_count}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right bg-[#FEF2F2]">
                                <span
                                  className={`font-bold font-mono ${
                                    row.wc_pendency_ha > 0 ? "text-[#DC2626]" : "text-[#8C97AB]"
                                  }`}
                                >
                                  {row.wc_pendency_ha.toFixed(2)} Ha
                                </span>
                                <span
                                  className={`ml-1.5 text-[10px] font-mono px-1.5 py-0.5 rounded ${
                                    row.wc_pendency_count > 0
                                      ? "bg-[#FEE2E2] text-[#991B1B] font-bold"
                                      : "bg-gray-100 text-gray-400"
                                  }`}
                                >
                                  {row.wc_pendency_count}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-center">
                                <button
                                  type="button"
                                  title="View drill down"
                                  className="p-1 rounded text-[#52607D] hover:text-[#2F6F5E] hover:bg-[#EAF3F0] transition-colors"
                                >
                                  <ChevronRight size={15} />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}

                        {/* Grand Total Row */}
                        <tr className="bg-[#EAE8E1]/60 font-bold border-t-2 border-[#DCD7CA]">
                          <td className="py-4 px-4 font-bold text-[#14213D] uppercase text-xs">
                            Company Grand Total
                          </td>
                          <td className="py-4 px-4 text-right">
                            <span className="font-bold text-[#14213D]">
                              {(grand.wo_ha || 0).toFixed(2)} Ha
                            </span>
                            <span className="ml-1.5 text-[10px] text-[#14213D] font-mono bg-white px-1.5 py-0.5 rounded border border-[#DCD7CA]">
                              {grand.wo_count || 0}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <span className="font-bold text-[#2F6F5E]">
                              {(grand.invoiced_ha || 0).toFixed(2)} Ha
                            </span>
                            <span className="ml-1.5 text-[10px] text-[#2F6F5E] font-mono bg-[#EAF3F0] px-1.5 py-0.5 rounded border border-[#BDE0D5]">
                              {grand.invoiced_count || 0}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right bg-[#FEF9E7]">
                            <span className="font-bold text-[#D97706] font-mono">
                              {(grand.mat_pendency_ha || 0).toFixed(2)} Ha
                            </span>
                            <span className="ml-1.5 text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                              {grand.mat_pendency_count || 0}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <span className="font-bold text-[#14213D]">
                              {(grand.wc_ha || 0).toFixed(2)} Ha
                            </span>
                            <span className="ml-1.5 text-[10px] text-[#14213D] font-mono bg-white px-1.5 py-0.5 rounded border border-[#DCD7CA]">
                              {grand.wc_count || 0}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right bg-[#FDE8E8]">
                            <span className="font-bold text-[#DC2626] font-mono">
                              {(grand.wc_pendency_ha || 0).toFixed(2)} Ha
                            </span>
                            <span className="ml-1.5 text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#FEE2E2] text-[#991B1B] border border-[#FECACA]">
                              {grand.wc_pendency_count || 0}
                            </span>
                          </td>
                          <td className="py-4 px-3" />
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Detailed Pending Reports Section */}
        <div id="drill-down-section" className="space-y-4 pt-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-bold text-[#14213D] flex items-center gap-2">
                <span>Detailed Pending Reports</span>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-[#2F6F5E]/10 text-[#2F6F5E]">
                  {pagination.total} Records
                </span>
              </h2>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="xs"
                  icon={FileText}
                  onClick={handleExportPDF}
                  loading={exportingPdf}
                >
                  Export PDF
                </Button>
                <Button
                  variant="outline"
                  size="xs"
                  icon={Download}
                  onClick={handleExportCsv}
                  loading={exportingCsv}
                >
                  Export CSV
                </Button>
              </div>
            </div>

            {/* Pendency Stage Switcher Tabs */}
            <div className="inline-flex flex-wrap rounded-[8px] bg-[#EAE8E1]/50 p-1 border border-[#E4E1D8] text-xs font-semibold gap-1">
              <button
                type="button"
                onClick={() => {
                  setPendencyType("PENDING_WORK_COMPLETION");
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                className={`px-3 py-1.5 rounded-[6px] transition-all cursor-pointer flex items-center gap-1.5 ${
                  pendencyType === "PENDING_WORK_COMPLETION"
                    ? "bg-white text-[#B91C1C] font-bold shadow-xs"
                    : "text-[#52607D] hover:text-[#14213D]"
                }`}
              >
                <AlertTriangle size={13} className="text-[#DC2626]" />
                <span>Pending Work Completion</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPendencyType("PENDING_MATERIAL_SUPPLY");
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                className={`px-3 py-1.5 rounded-[6px] transition-all cursor-pointer flex items-center gap-1.5 ${
                  pendencyType === "PENDING_MATERIAL_SUPPLY"
                    ? "bg-white text-[#B45309] font-bold shadow-xs"
                    : "text-[#52607D] hover:text-[#14213D]"
                }`}
              >
                <Clock size={13} className="text-[#D97706]" />
                <span>Pending Material Supply</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPendencyType("PENDING_JVR_COMPLETION");
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                className={`px-3 py-1.5 rounded-[6px] transition-all cursor-pointer flex items-center gap-1.5 ${
                  pendencyType === "PENDING_JVR_COMPLETION"
                    ? "bg-white text-[#3730A3] font-bold shadow-xs"
                    : "text-[#52607D] hover:text-[#14213D]"
                }`}
              >
                <ClipboardCheck size={13} className="text-[#4F46E5]" />
                <span>Pending JVR</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPendencyType("ALL_PENDING");
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                className={`px-3 py-1.5 rounded-[6px] transition-all cursor-pointer ${
                  pendencyType === "ALL_PENDING"
                    ? "bg-white text-[#14213D] font-bold shadow-xs"
                    : "text-[#52607D] hover:text-[#14213D]"
                }`}
              >
                All
              </button>
            </div>
          </div>

          {/* Drill-down Filters & Search Controls */}
          <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
              {/* Search Bar */}
              <div className="md:col-span-2 relative">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C97AB]"
                />
                <input
                  type="text"
                  placeholder="Search Farmer, App ID, Village, Mobile, Invoice #..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] pl-9 pr-3 py-2 text-xs text-[#14213D] placeholder-[#8C97AB] focus:outline-none focus:border-[#2F6F5E]"
                />
              </div>

              {/* Category Filter */}
              <div>
                <CustomSelect
                  options={CATEGORY_OPTIONS}
                  value={drillCategory}
                  onChange={(val) => {
                    setDrillCategory(val || "ALL");
                    setPagination((p) => ({ ...p, page: 1 }));
                  }}
                  size="sm"
                  searchable={false}
                />
              </div>

              {/* Financial Year Filter */}
              <div>
                <CustomSelect
                  options={yearOptions}
                  value={drillYear}
                  onChange={(val) => {
                    setDrillYear(val || "ALL");
                    setPagination((p) => ({ ...p, page: 1 }));
                  }}
                  size="sm"
                  searchable={false}
                />
              </div>

              {/* Min Days Pending Text Input */}
              <div className="relative">
                <div className="relative flex items-center">
                  <Clock
                    size={14}
                    className="absolute left-3 text-[#8C97AB] pointer-events-none"
                  />
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Min Days (e.g. 10)"
                    value={minDaysPending}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "" || parseInt(val, 10) >= 0) {
                        setMinDaysPending(val);
                        setPagination((p) => ({ ...p, page: 1 }));
                      }
                    }}
                    className="w-full bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] pl-9 pr-7 py-2 text-xs font-mono text-[#14213D] placeholder-[#8C97AB] focus:outline-none focus:border-[#2F6F5E]"
                    title="Minimum days pending (leave blank for all records)"
                  />
                  {minDaysPending !== "" && (
                    <button
                      type="button"
                      onClick={() => {
                        setMinDaysPending("");
                        setPagination((p) => ({ ...p, page: 1 }));
                      }}
                      className="absolute right-2 text-[#8C97AB] hover:text-[#14213D] p-0.5 cursor-pointer"
                      title="Clear min days filter"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Drill-down Projects Table */}
          <div className="bg-white border border-[#E4E1D8] rounded-[10px] shadow-[0_1px_2px_rgba(20,33,61,0.02)] overflow-hidden">
            {loadingProjects ? (
              <div className="p-8">
                <SkeletonLoader count={8} />
              </div>
            ) : projects.length === 0 ? (
              <div className="p-12 text-center">
                <EmptyState
                  title="No Pending Projects Found"
                  description="No projects match the selected filters or search parameters."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#F8F7F4] text-[#52607D] font-bold text-[11px] uppercase tracking-wider border-b border-[#E4E1D8]">
                      <th className="py-3 px-4">Application ID</th>
                      <th className="py-3 px-4">Farmer Name</th>
                      <th className="py-3 px-4">Dealer Assigned</th>
                      <th className="py-3 px-4">
                        {pendencyType === "PENDING_JVR_COMPLETION" ? "1st Fund Date" : "WO Date"}
                      </th>
                      <th className="py-3 px-4">Invoice Details</th>
                      <th className="py-3 px-4">Current Status</th>
                      <th className="py-3 px-4 text-center">Days Pending</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDEAE1]">
                    {projects.map((p) => {
                      const days = p.days_pending || 0;
                      let daysBadgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-200";
                      if (days > 60) {
                        daysBadgeStyle = "bg-red-50 text-red-700 border-red-200 font-bold animate-pulse";
                      } else if (days > 30) {
                        daysBadgeStyle = "bg-amber-50 text-amber-700 border-amber-200 font-semibold";
                      }

                      return (
                        <tr key={p.id} className="hover:bg-[#F9F8F5] transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-[#14213D] whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Link
                                to={`/projects/${p.id}`}
                                className="text-[#2F6F5E] hover:underline"
                                title="View Project Details"
                              >
                                {p.application_id}
                              </Link>
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span
                                className={`text-[9px] font-sans px-1.5 py-0.2 rounded ${
                                  p.category === "Agriculture"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : p.category === "Horticulture"
                                    ? "bg-orange-50 text-orange-700"
                                    : p.category === "Cluster"
                                    ? "bg-purple-50 text-purple-700"
                                    : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {p.category}
                              </span>
                              {(p.financial_year || p.year) && (
                                <span className="text-[9px] font-mono text-[#8C97AB]">
                                  {p.financial_year || p.year}
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-bold text-[#14213D] truncate block max-w-[200px]">
                              {p.farmer_name || <span className="text-[#8C97AB] italic font-normal">No farmer record</span>}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            {p.dealer_name ? (
                              <span className="font-semibold text-[#14213D] truncate block max-w-[150px]">
                                {p.dealer_name}
                              </span>
                            ) : (
                              <span className="text-[10px] text-[#B0403A] font-medium bg-[#FDF2F1] px-1.5 py-0.5 rounded border border-[#F9D2CE]">
                                Unassigned
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-[11px]">
                            {pendencyType === "PENDING_JVR_COMPLETION" ? (
                              p.first_fund_utr_date ? (
                                <span className="font-mono text-[#14213D] whitespace-nowrap">
                                  📅 {formatDate(p.first_fund_utr_date)}
                                </span>
                              ) : (
                                <span className="text-[#8C97AB] italic text-[11px]">—</span>
                              )
                            ) : p.work_order_date ? (
                              <span className="font-mono text-[#14213D] whitespace-nowrap">
                                📅 {formatDate(p.work_order_date)}
                              </span>
                            ) : (
                              <span className="text-[#8C97AB] italic text-[11px]">No WO Date</span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-[11px]">
                            {p.invoice_date || p.invoice_number ? (
                              <>
                                <div className="font-mono font-bold text-[#2F6F5E]">
                                  Inv #{p.invoice_number || "—"}
                                </div>
                                <div className="text-[10px] text-[#52607D] font-mono">
                                  {formatDate(p.invoice_date)}
                                </div>
                              </>
                            ) : (
                              <span className="text-[#B45309] font-medium bg-[#FEF3C7]/60 px-1.5 py-0.5 rounded text-[10px]">
                                Not Invoiced Yet
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            <span className="inline-block max-w-[160px] truncate text-[11px] font-medium text-[#14213D] bg-[#FAFAF8] px-2 py-0.5 rounded border border-[#E4E1D8]">
                              {p.current_status || "—"}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-[6px] font-mono text-xs font-bold border ${daysBadgeStyle}`}
                              title={
                                p.pendency_stage === "PENDING_JVR_COMPLETION"
                                  ? `${days} days since 1st Fund Credited on ${formatDate(p.first_fund_utr_date || p.current_status_date)}`
                                  : p.pendency_stage === "PENDING_WORK_COMPLETION"
                                  ? `${days} days since Invoiced on ${formatDate(p.invoice_date)}`
                                  : `${days} days since Work Order on ${formatDate(p.work_order_date)}`
                              }
                            >
                              {days}d
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Reusable Pagination Component */}
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              limit={pagination.limit}
              onPageChange={(p) => setPagination((prev) => ({ ...prev, page: p }))}
              onLimitChange={(l) => setPagination((prev) => ({ ...prev, page: 1, limit: l }))}
              limitOptions={[25, 50, 100, 200]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default PendingReportsPage;
