import React, { useEffect, useState, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Eye,
  RefreshCw,
  X,
  Clock,
  Calendar,
  History,
  ArrowRight,
  ExternalLink,
  MapPin,
  User,
  Phone,
  GitMerge,
  Edit3,
  Trash2,
  AlertTriangle,
  FileText,
  FileSpreadsheet,
  Download,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { toast } from "sonner";
import Navbar from "../components/layout/Navbar.jsx";
import StatusBadge from "../components/common/StatusBadge.jsx";
import Button from "../components/common/Button.jsx";
import CustomSelect from "../components/common/CustomSelect.jsx";
import Modal from "../components/common/Modal.jsx";
import Pagination from "../components/common/Pagination.jsx";
import { SkeletonLoader, EmptyState } from "../components/common/SkeletonLoader.jsx";
import { formatDate } from "../utils/dates.js";
import MergeProjectModal from "../components/projects/MergeProjectModal.jsx";

export function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  // Filter state
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedDealer, setSelectedDealer] = useState("");
  const [district, setDistrict] = useState("");
  const [minStatusDays, setMinStatusDays] = useState("");

  // History modal state
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Merge / Correct ID modal state
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [mergeSourceProject, setMergeSourceProject] = useState(null);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { user } = useAuth();
  const isAdmin = (user?.role || "USER").toUpperCase() === "ADMIN";

  const debounceTimerRef = useRef(null);

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    try {
      setDeleting(true);
      await api.delete(`/government/projects/${projectToDelete.id}`);
      toast.success(`Project ${projectToDelete.application_id} and all associated data were deleted successfully`);
      setDeleteModalOpen(false);
      setProjectToDelete(null);
      fetchProjects(pagination.page);
    } catch (err) {
      console.error("Failed to delete project:", err);
      toast.error(err?.message || "Failed to delete project");
    } finally {
      setDeleting(false);
    }
  };

  const fetchProjects = async (page = 1, limit = pagination.limit) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
        ...(search ? { search: search.trim() } : {}),
        ...(selectedStatus ? { status: selectedStatus } : {}),
        ...(selectedDealer ? { dealer_id: selectedDealer } : {}),
        ...(district ? { district: district.trim() } : {}),
        ...(minStatusDays !== "" && !isNaN(parseInt(minStatusDays, 10))
          ? { min_status_days: parseInt(minStatusDays, 10) }
          : {}),
      };

      const res = await api.get("/government/projects", { params });
      setProjects(res.data?.projects || []);
      setPagination(res.data?.pagination || { page, limit, total: 0, totalPages: 1 });
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    } finally {
      setLoading(false);
    }
  };

  // Load Metadata (statuses, dealers) on mount
  useEffect(() => {
    async function fetchMetadata() {
      try {
        const [statRes, dealRes] = await Promise.all([
          api.get("/government/statuses"),
          api.get("/dealers/options"),
        ]);
        setStatuses(statRes.data?.statuses || statRes.statuses || []);
        setDealers(dealRes.data?.dealers || dealRes.dealers || []);
      } catch (err) {
        console.error("Error loading filter options:", err);
      }
    }
    fetchMetadata();
  }, []);

  // Live dynamic filtering with debounce
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchProjects(1, pagination.limit);
    }, 250);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [search, selectedStatus, selectedDealer, district, minStatusDays]);

  const hasActiveFilters = Boolean(
    search || selectedStatus || selectedDealer || district || minStatusDays !== ""
  );

  const handleResetFilters = () => {
    setSearch("");
    setSelectedStatus("");
    setSelectedDealer("");
    setDistrict("");
    setMinStatusDays("");
  };

  // Indian Rupee currency formatter (e.g. ₹1,60,729)
  const formatRupees = (val) => {
    if (val === null || val === undefined || val === "") return "—";
    const num = typeof val === "number" ? val : parseFloat(val);
    if (isNaN(num)) return "—";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Reusable fetch for all projects matching current active filters (across all pages)
  const fetchFilteredProjects = async () => {
    const params = {
      all: true,
      ...(search ? { search: search.trim() } : {}),
      ...(selectedStatus ? { status: selectedStatus } : {}),
      ...(selectedDealer ? { dealer_id: selectedDealer } : {}),
      ...(district ? { district: district.trim() } : {}),
      ...(minStatusDays !== "" && !isNaN(parseInt(minStatusDays, 10))
        ? { min_status_days: parseInt(minStatusDays, 10) }
        : {}),
    };

    const res = await api.get("/government/projects", { params });
    return res?.data?.projects || res?.projects || [];
  };

  // Safe ASCII currency for PDF export (jsPDF standard fonts lack Unicode ₹ symbol)
  const formatPdfMoney = (val) => {
    if (val === null || val === undefined || val === "") return "—";
    const num = typeof val === "number" ? val : parseFloat(val);
    if (isNaN(num)) return "—";
    return `Rs. ${Math.round(num).toLocaleString("en-IN")}`;
  };

  // Export all pages matching current active filters to PDF
  const handleExportPDF = async () => {
    try {
      setExportingPdf(true);
      toast.info("Generating PDF for all filtered projects...");

      const exportList = await fetchFilteredProjects();

      if (exportList.length === 0) {
        toast.warning("No projects found to export");
        return;
      }

      const totalHa = exportList.reduce((sum, p) => sum + (parseFloat(p.applied_area_ha) || 0), 0);
      const totalSubsidy = exportList.reduce((sum, p) => sum + (parseFloat(p.quotation_subsidy_amount) || 0), 0);

      const doc = new jsPDF({
        orientation: "landscape",
        unit: "pt",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();

      // Brand Header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(20, 33, 61);
      doc.text("CHERAN IRRIGATION", 30, 36);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(82, 96, 125);
      doc.text("Government Projects Registry Report", 30, 50);

      // Meta Info
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(20, 33, 61);
      doc.text(`Status: ${selectedStatus || "All"}`, 30, 68);
      const curDealerName =
        dealers.find((d) => String(d.id) === String(selectedDealer))?.name ||
        (selectedDealer === "UNASSIGNED" ? "Unassigned" : "All Dealers");
      doc.text(`Dealer: ${curDealerName}`, 170, 68);
      doc.text(`District: ${district || "All"}`, 340, 68);
      doc.text(`Min Days: ${minStatusDays ? `>= ${minStatusDays}d` : "All"}`, 480, 68);
      doc.text(`Total Records: ${exportList.length} (All Pages)`, 590, 68);
      doc.text(`Generated: ${formatDate(new Date())}`, 720, 68);

      const tableData = exportList.map((p, idx) => {
        const invText = p.invoice_number
          ? `#${p.invoice_number}${p.invoice_date ? `\n${formatDate(p.invoice_date)}` : ""}`
          : p.invoice_date
          ? formatDate(p.invoice_date)
          : "Not Invoiced";

        const farmerDistrictText = [p.farmer_name, p.district].filter(Boolean).join("\n") || "—";
        const areaText =
          p.applied_area_ha !== null && p.applied_area_ha !== undefined && p.applied_area_ha !== ""
            ? `${parseFloat(p.applied_area_ha).toFixed(2)} Ha`
            : "—";
        const subsidyText = formatPdfMoney(p.quotation_subsidy_amount);
        const dealerText = p.dealer?.name || p.dealer_name || "—";
        const statusDateText = p.current_status_date ? formatDate(p.current_status_date) : "—";

        return [
          idx + 1,
          p.application_id || "—",
          invText,
          farmerDistrictText,
          areaText,
          subsidyText,
          p.current_status || "—",
          statusDateText,
          dealerText,
        ];
      });

      autoTable(doc, {
        head: [
          [
            "#",
            "Application ID",
            "Invoice",
            "Farmer / District",
            "Area (Ha)",
            "Quotation Subsidy",
            "Current Status",
            "Status Date",
            "Dealer",
          ],
        ],
        body: tableData,
        foot: [
          [
            { content: `Total (${exportList.length} Records)`, colSpan: 4, styles: { halign: "right", fontStyle: "bold" } },
            { content: `${totalHa.toFixed(2)} Ha`, styles: { halign: "right", fontStyle: "bold" } },
            { content: `Rs. ${Math.round(totalSubsidy).toLocaleString("en-IN")}`, styles: { halign: "right", fontStyle: "bold" } },
            { content: "", colSpan: 3 },
          ],
        ],
        footStyles: {
          fillColor: [240, 244, 248],
          textColor: [20, 33, 61],
          fontStyle: "bold",
          fontSize: 8,
          lineColor: [200, 205, 215],
          lineWidth: 0.5,
        },
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
          0: { cellWidth: 22, halign: "center" },
          1: { cellWidth: 125, fontStyle: "bold" },
          2: { cellWidth: 80 },
          3: { cellWidth: 110 },
          4: { cellWidth: 50, halign: "right", fontStyle: "bold" },
          5: { cellWidth: 85, halign: "right", fontStyle: "bold" },
          6: { cellWidth: 130 },
          7: { cellWidth: 65, halign: "center" },
          8: { cellWidth: 110 },
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

      doc.save(`cheran_govt_projects_${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success(`PDF exported successfully (${exportList.length} records across all pages)`);
    } catch (err) {
      console.error("PDF export error:", err);
      toast.error("Failed to generate PDF export");
    } finally {
      setExportingPdf(false);
    }
  };

  // Export all pages matching current active filters to Excel (.xlsx) with totals
  const handleExportExcel = async () => {
    try {
      setExportingExcel(true);
      toast.info("Generating Excel for all filtered projects...");

      const exportList = await fetchFilteredProjects();

      if (exportList.length === 0) {
        toast.warning("No projects found to export");
        return;
      }

      const totalHa = exportList.reduce((sum, p) => sum + (parseFloat(p.applied_area_ha) || 0), 0);
      const totalSubsidy = exportList.reduce((sum, p) => sum + (parseFloat(p.quotation_subsidy_amount) || 0), 0);

      const rows = exportList.map((p, idx) => ({
        "S.No": idx + 1,
        "Application ID": p.application_id || "—",
        "Invoice Number": p.invoice_number || (p.invoice_date ? "Invoiced" : "Not Invoiced"),
        "Invoice Date": p.invoice_date ? formatDate(p.invoice_date) : "—",
        "Farmer Name": p.farmer_name || "—",
        "District": p.district || "—",
        "Area (Ha)": p.applied_area_ha !== null && p.applied_area_ha !== undefined && p.applied_area_ha !== ""
          ? parseFloat(parseFloat(p.applied_area_ha).toFixed(2))
          : 0,
        "Quotation Subsidy (Rs)": p.quotation_subsidy_amount !== null && p.quotation_subsidy_amount !== undefined
          ? Math.round(parseFloat(p.quotation_subsidy_amount) || 0)
          : 0,
        "Current Status": p.current_status || "—",
        "Status Date": p.current_status_date ? formatDate(p.current_status_date) : "—",
        "Dealer": p.dealer?.name || p.dealer_name || "—",
      }));

      // Append Total Row at the bottom
      rows.push({
        "S.No": "Total",
        "Application ID": `${exportList.length} Records`,
        "Invoice Number": "",
        "Invoice Date": "",
        "Farmer Name": "",
        "District": "",
        "Area (Ha)": parseFloat(totalHa.toFixed(2)),
        "Quotation Subsidy (Rs)": Math.round(totalSubsidy),
        "Current Status": "",
        "Status Date": "",
        "Dealer": "",
      });

      const worksheet = XLSX.utils.json_to_sheet(rows);

      // Auto column widths
      worksheet["!cols"] = [
        { wch: 8 },  // S.No
        { wch: 28 }, // Application ID
        { wch: 16 }, // Invoice Number
        { wch: 14 }, // Invoice Date
        { wch: 26 }, // Farmer Name
        { wch: 16 }, // District
        { wch: 12 }, // Area (Ha)
        { wch: 22 }, // Quotation Subsidy (Rs)
        { wch: 32 }, // Current Status
        { wch: 14 }, // Status Date
        { wch: 24 }, // Dealer
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Government Projects");

      const datePart = new Date().toISOString().split("T")[0];
      XLSX.writeFile(workbook, `cheran_govt_projects_${datePart}.xlsx`);

      toast.success(`Excel exported successfully (${exportList.length} records across all pages)`);
    } catch (err) {
      console.error("Excel export error:", err);
      toast.error(err?.response?.data?.message || err.message || "Failed to export Excel");
    } finally {
      setExportingExcel(false);
    }
  };

  // Calculate days elapsed for project in current status
  const calculateDaysForProject = (proj) => {
    if (!proj?.current_status_date) return null;

    const isWOStage =
      proj.current_status === "Issued Work Order" ||
      proj.current_status === "Issue Work Order (Auto Quotation)" ||
      proj.current_status === "Quotation Prepared by Block (Auto Quotation)" ||
      proj.current_status === "Auto Quotation Prepared";

    // If in Work Order stage and project has been invoiced, show exact days from Work Order date to Invoice date
    if (isWOStage && proj.invoice_date) {
      const woDate = new Date(proj.current_status_date);
      const invDate = new Date(proj.invoice_date);
      const diffTime = invDate.setHours(0, 0, 0, 0) - woDate.setHours(0, 0, 0, 0);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 ? diffDays : 0;
    }

    // Otherwise calculate days from current status date to today
    const sDate = new Date(proj.current_status_date);
    const today = new Date();
    const diffTime = today.setHours(0, 0, 0, 0) - sDate.setHours(0, 0, 0, 0);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 ? diffDays : 0;
  };

  const handleViewProject = async (proj) => {
    setSelectedProject(proj);
    setHistoryModalOpen(true);
    setHistoryLoading(true);
    try {
      const res = await api.get(`/government/projects/${proj.id}/status-history`);
      setHistoryData(res.data?.history || []);
    } catch (err) {
      console.error("Failed to load status history:", err);
      setHistoryData([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Prepare status timeline for modal, matching ProjectDetailPage lifecycle logic exactly
  const modalStages = useMemo(() => {
    if (!selectedProject) return [];

    const MILESTONE_MAP = [
      { field: "application_received_date", status: "Application Received" },
      { field: "quotation_date", status: "Quotation Prepared by MI Company" },
      { field: "work_order_date", status: "Issued Work Order" },
      { field: "earlier_jv_completed_date", status: "Earlier JV Completed" },
      { field: "first_fund_utr_date", status: "First Fund Credited (UTR Updated)" },
      { field: "treasury_fund_utr_date", status: "Iamwarm Fund Credited (UTR Updated)" },
      { field: "final_fund_utr_date", status: "Final Fund Credited (UTR Updated)" },
    ];

    const historyMap = new Map();

    // 1. Seed milestones from project date columns
    MILESTONE_MAP.forEach(({ field, status }) => {
      if (selectedProject[field]) {
        historyMap.set(status.trim().toUpperCase(), {
          status,
          status_date: selectedProject[field],
        });
      }
    });

    // 2. Overlay explicit history records from database audit logs
    (historyData || []).forEach((h) => {
      if (h.status) {
        historyMap.set(h.status.trim().toUpperCase(), h);
      }
    });

    // 3. Current active status from Govt Excel takes priority
    if (selectedProject.current_status) {
      const key = selectedProject.current_status.trim().toUpperCase();
      const existing = historyMap.get(key);
      historyMap.set(key, {
        status: selectedProject.current_status,
        status_date: selectedProject.current_status_date || existing?.status_date || null,
      });
    }

    // Sort chronologically by status_date
    const stages = Array.from(historyMap.values()).sort((a, b) => {
      const dateA = a.status_date ? new Date(a.status_date).getTime() : 0;
      const dateB = b.status_date ? new Date(b.status_date).getTime() : 0;
      if (dateA && dateB && dateA !== dateB) return dateA - dateB;
      if (dateA && !dateB) return -1;
      if (!dateA && dateB) return 1;
      return 0;
    });

    // Calculate elapsed duration for each stage:
    // - If next recorded stage exists: diff between this stage date and next stage date (+X days)
    // - If latest stage / current active: diff between this stage date and today (or invoice date if WO) (X days active)
    return stages.map((step, idx) => {
      let daysElapsed = null;
      let isCurrentActive = false;

      if (step.status_date) {
        const currentDate = new Date(step.status_date);
        const nextStage = stages.slice(idx + 1).find((s) => s.status_date);

        if (nextStage && nextStage.status_date) {
          const nextDate = new Date(nextStage.status_date);
          const diffTime = nextDate.getTime() - currentDate.getTime();
          daysElapsed = Math.max(0, Math.round(diffTime / (1000 * 60 * 60 * 24)));
        } else {
          isCurrentActive = true;
          const isWOStage =
            step.status === "Issued Work Order" ||
            step.status === "Issue Work Order (Auto Quotation)" ||
            step.status === "Quotation Prepared by Block (Auto Quotation)" ||
            step.status === "Auto Quotation Prepared";

          if (isWOStage && selectedProject.invoice_date) {
            const invDate = new Date(selectedProject.invoice_date);
            const diffTime = invDate.getTime() - currentDate.getTime();
            daysElapsed = Math.max(0, Math.round(diffTime / (1000 * 60 * 60 * 24)));
          } else {
            const today = new Date();
            const diffTime = today.getTime() - currentDate.getTime();
            daysElapsed = Math.max(0, Math.round(diffTime / (1000 * 60 * 60 * 24)));
          }
        }
      }

      const isCurrent =
        Boolean(selectedProject?.current_status) &&
        selectedProject.current_status.trim().toUpperCase() === step.status?.trim().toUpperCase();

      return {
        ...step,
        days_in_stage: daysElapsed !== null ? daysElapsed : step.days_in_stage ?? null,
        is_current: isCurrent || isCurrentActive,
      };
    });
  }, [selectedProject, historyData]);

  const hasInvoicedInStatuses = statuses.some((s) => s.name === "INVOICED");
  const statusOptions = [
    { value: "", label: "All Statuses" },
    ...(hasInvoicedInStatuses ? [] : [{ value: "INVOICED", label: "INVOICED" }]),
    ...statuses.map((s) => ({ value: s.name, label: s.name })),
  ];

  const dealerOptions = [
    { value: "", label: "All Dealers" },
    { value: "UNASSIGNED", label: "Unassigned Projects" },
    ...dealers.map((d) => ({ value: d.id, label: d.name })),
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Navbar
        title="Government Projects Registry"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              icon={FileSpreadsheet}
              loading={exportingExcel}
              onClick={handleExportExcel}
              title="Download Excel of all matching projects across all pages"
            >
              Export Excel
            </Button>
            <Button
              variant="secondary"
              icon={FileText}
              loading={exportingPdf}
              onClick={handleExportPDF}
              title="Download PDF of all matching projects across all pages"
            >
              Export PDF
            </Button>
            <Button
              variant="secondary"
              icon={RefreshCw}
              loading={loading}
              onClick={() => fetchProjects(pagination.page, pagination.limit)}
            >
              Refresh
            </Button>
          </div>
        }
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 overflow-y-auto w-full">
        {/* Dynamic Live Filter Bar */}
        <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-4 shadow-[0_1px_2px_rgba(20,33,61,0.04)]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
            {/* Search Input */}
            <div className="relative lg:col-span-4">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#52607D]" />
              <input
                type="text"
                placeholder="Search App ID, Invoice, Farmer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D] placeholder:text-[#8C97AB]"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8C97AB] hover:text-[#14213D] p-0.5 cursor-pointer"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Custom Status Dropdown */}
            <div className="lg:col-span-3">
              <CustomSelect
                options={statusOptions}
                value={selectedStatus}
                onChange={(val) => setSelectedStatus(val)}
                placeholder="All Statuses"
                searchable={true}
                size="sm"
              />
            </div>

            {/* Custom Dealer Dropdown */}
            <div className="lg:col-span-2">
              <CustomSelect
                options={dealerOptions}
                value={selectedDealer}
                onChange={(val) => setSelectedDealer(val)}
                placeholder="All Dealers"
                searchable={true}
                size="sm"
              />
            </div>

            {/* Min Days in Current Status Filter */}
            <div className="relative lg:col-span-1">
              <div className="relative flex items-center">
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Min Days"
                  value={minStatusDays}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "" || parseInt(val, 10) >= 0) {
                      setMinStatusDays(val);
                    }
                  }}
                  className="w-full px-2.5 py-2 text-xs font-mono bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D] placeholder:text-[#8C97AB]"
                  title="Filter projects whose current status date is at least N days old"
                />
                {minStatusDays !== "" && (
                  <button
                    onClick={() => setMinStatusDays("")}
                    className="absolute right-2 text-[#8C97AB] hover:text-[#14213D] p-0.5 cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* District Filter & Clear */}
            <div className="relative lg:col-span-2 flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="District..."
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D] placeholder:text-[#8C97AB]"
                />
                {district && (
                  <button
                    onClick={() => setDistrict("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8C97AB] hover:text-[#14213D] p-0.5 cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {hasActiveFilters && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleResetFilters}
                  className="px-2.5 shrink-0"
                  title="Clear all active filters"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Active Filter Summary Indicator */}
        {minStatusDays !== "" && (
          <div className="flex items-center gap-2 text-xs text-[#52607D] bg-white border border-[#E4E1D8] px-3 py-2 rounded-[8px]">
            <Clock size={14} className="text-[#2F6F5E]" />
            <span>
              Filtering projects in current status for <strong>≥ {minStatusDays} days</strong> (Status Date on or before{" "}
              {formatDate(new Date(Date.now() - parseInt(minStatusDays, 10) * 86400000))})
            </span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[#14213D]">
              Government Projects
            </span>
            <span className="text-xs bg-[#EAF3F0] text-[#2F6F5E] font-mono font-semibold px-2 py-0.5 rounded-full">
              {pagination.total} Records
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="secondary"
              size="sm"
              icon={FileSpreadsheet}
              loading={exportingExcel}
              onClick={handleExportExcel}
              title="Download Excel of all matching projects across all pages"
            >
              Export Excel ({pagination.total})
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={FileText}
              loading={exportingPdf}
              onClick={handleExportPDF}
              title="Download PDF of all matching projects across all pages"
            >
              Export PDF ({pagination.total})
            </Button>
          </div>
        </div>

        {/* Data Table Container */}
        <div className="bg-white border border-[#E4E1D8] rounded-[10px] shadow-[0_1px_2px_rgba(20,33,61,0.04)] overflow-hidden">
          {loading ? (
            <div className="p-6">
              <SkeletonLoader rows={8} />
            </div>
          ) : projects.length === 0 ? (
            <EmptyState
              title="No matching government projects found"
              description={
                hasActiveFilters
                  ? "Try clearing or relaxing your search filters."
                  : "No projects recorded yet. Upload an Excel import to get started."
              }
              action={
                hasActiveFilters ? (
                  <Button size="sm" variant="secondary" onClick={handleResetFilters}>
                    Clear Filters
                  </Button>
                ) : null
              }
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAFAF8] border-b border-[#E4E1D8] text-[#52607D] uppercase font-semibold">
                    <tr>
                      <th className="py-3 px-4">Application ID</th>
                      <th className="py-3 px-4">Invoice</th>
                      <th className="py-3 px-4">Farmer / District</th>
                      <th className="py-3 px-4 text-right">Area (Ha)</th>
                      <th className="py-3 px-4 text-right">Quotation Subsidy</th>
                      <th className="py-3 px-4">Current Status</th>
                      <th className="py-3 px-4">Status Date</th>
                      <th className="py-3 px-4">Dealer</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDEAE1]">
                    {projects.map((proj) => {
                      const isInvoiced = Boolean(proj.invoice_number || proj.invoice_date);
                      const isWOStage =
                        proj.current_status === "Issued Work Order" ||
                        proj.current_status === "Issue Work Order (Auto Quotation)" ||
                        proj.current_status === "Quotation Prepared by Block (Auto Quotation)" ||
                        proj.current_status === "Auto Quotation Prepared";
                      const daysInStatus = calculateDaysForProject(proj);
                      const isCompletedTransition = isWOStage && Boolean(proj.invoice_date);

                      return (
                        <tr key={proj.id} className="hover:bg-[#FAFAF8] transition-colors">
                          <td className="py-3 px-4 font-mono font-medium text-[#14213D] whitespace-nowrap">
                            <Link
                              to={`/projects/${proj.id}`}
                              className="text-[#2F6F5E] hover:underline font-bold"
                              title="View Project Details"
                            >
                              {proj.application_id}
                            </Link>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            {isInvoiced ? (
                              <div>
                                <div className="font-mono font-bold text-[#2F6F5E] text-xs">
                                  {proj.invoice_number ? `#${proj.invoice_number}` : "Invoiced"}
                                </div>
                                {proj.invoice_date && (
                                  <div className="text-[11px] font-mono text-[#52607D]">
                                    {formatDate(proj.invoice_date)}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-[#8C97AB] italic text-[11px]">Not Invoiced</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-[#14213D]">{proj.farmer_name || "—"}</div>
                            {proj.district && (
                              <div className="text-[11px] text-[#52607D]">{proj.district}</div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <span className="font-mono font-bold text-[#14213D] text-xs">
                              {proj.applied_area_ha !== null && proj.applied_area_ha !== undefined && proj.applied_area_ha !== ""
                                ? `${parseFloat(proj.applied_area_ha).toFixed(2)} Ha`
                                : "—"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <span className="font-mono font-bold text-[#2F6F5E] text-xs">
                              {formatRupees(proj.quotation_subsidy_amount)}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <StatusBadge status={proj.current_status} size="sm" />
                          </td>
                          <td className="py-3 px-4 text-[#52607D]">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono">{formatDate(proj.current_status_date)}</span>
                              {daysInStatus !== null && (
                                <span
                                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                                    daysInStatus >= 30
                                      ? "bg-rose-50 text-rose-700 border border-rose-200"
                                      : daysInStatus >= 15
                                      ? "bg-amber-50 text-amber-800 border border-amber-200"
                                      : "bg-[#EAF3F0] text-[#2F6F5E]"
                                  }`}
                                  title={
                                    isCompletedTransition
                                      ? `${daysInStatus} days from Work Order (${formatDate(proj.current_status_date)}) to Invoiced (${formatDate(proj.invoice_date)})`
                                      : `${daysInStatus} days in current status`
                                  }
                                >
                                  {daysInStatus}d
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-[#52607D]">
                            {proj.dealer?.name || "—"}
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMergeSourceProject(proj);
                                    setMergeModalOpen(true);
                                  }}
                                  className="w-7 h-7 rounded-[6px] bg-slate-100 hover:bg-slate-800 text-slate-700 hover:text-white border border-slate-300 flex items-center justify-center transition-all shadow-2xs cursor-pointer"
                                  title="Edit / Correct ID"
                                >
                                  <Edit3 size={13} strokeWidth={2.2} />
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleViewProject(proj)}
                                className="w-7 h-7 rounded-[6px] bg-emerald-100 hover:bg-[#2F6F5E] text-[#2F6F5E] hover:text-white border border-emerald-300 flex items-center justify-center transition-all shadow-2xs cursor-pointer"
                                title="View Status History"
                              >
                                <Eye size={13} strokeWidth={2.2} />
                              </button>

                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setProjectToDelete(proj);
                                    setDeleteModalOpen(true);
                                  }}
                                  className="w-7 h-7 rounded-[6px] bg-rose-100 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-300 flex items-center justify-center transition-all shadow-2xs cursor-pointer"
                                  title="Delete Project & Associated Data"
                                >
                                  <Trash2 size={13} strokeWidth={2.2} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-[#F8FAFC] border-t-2 border-[#D1D5DB] font-semibold text-[#14213D]">
                    <tr>
                      <td colSpan={3} className="py-3 px-4 text-right font-bold text-xs uppercase tracking-wider text-[#52607D]">
                        Page Total ({projects.length} records):
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-xs text-[#14213D] whitespace-nowrap">
                        {projects.reduce((sum, p) => sum + (parseFloat(p.applied_area_ha) || 0), 0).toFixed(2)} Ha
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-xs text-[#2F6F5E] whitespace-nowrap">
                        {formatRupees(projects.reduce((sum, p) => sum + (parseFloat(p.quotation_subsidy_amount) || 0), 0))}
                      </td>
                      <td colSpan={4}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Reusable Pagination Component */}
              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                limit={pagination.limit}
                limitOptions={[20, 50, 100, 250]}
                onPageChange={(newPage) => fetchProjects(newPage, pagination.limit)}
                onLimitChange={(newLimit) => fetchProjects(1, newLimit)}
              />
            </>
          )}
        </div>
      </main>

      {/* Project Status Change History Modal */}
      <Modal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        title={`Status History: ${selectedProject?.application_id || ""}`}
        size="xl"
      >
        {selectedProject && (
          <div className="space-y-4 text-xs">
            {/* Project Summary Card */}
            <div className="p-3.5 bg-[#FAFAF8] border border-[#EDEAE1] rounded-[8px] grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
              <div className="flex items-start gap-2 min-w-0">
                <User size={14} className="text-[#52607D] shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="text-[10px] text-[#52607D] uppercase font-bold">Farmer</div>
                  <div className="font-semibold text-[#14213D] truncate">{selectedProject.farmer_name || "—"}</div>
                </div>
              </div>

              <div className="flex items-start gap-2 min-w-0">
                <MapPin size={14} className="text-[#52607D] shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="text-[10px] text-[#52607D] uppercase font-bold">Location</div>
                  <div className="font-semibold text-[#14213D] truncate">
                    {[selectedProject.village, selectedProject.district].filter(Boolean).join(", ") || "—"}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2 min-w-0">
                <Clock size={14} className="text-[#52607D] shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="text-[10px] text-[#52607D] uppercase font-bold">Current Status</div>
                  <div className="mt-0.5">
                    <StatusBadge status={selectedProject.current_status} size="sm" />
                  </div>
                </div>
              </div>
            </div>

            {/* Status Change History Timeline */}
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#14213D] mb-3 uppercase tracking-wider">
                <History size={14} className="text-[#2F6F5E]" />
                <span>Observed Status Change History & Dates</span>
              </div>

              {historyLoading ? (
                <div className="py-4">
                  <SkeletonLoader rows={4} />
                </div>
              ) : modalStages.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#52607D] bg-[#FAFAF8] rounded-[8px] border border-[#EDEAE1]">
                  No status transition history recorded for this project yet.
                </div>
              ) : (
                <div className="border border-[#EDEAE1] rounded-[8px] overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAFAF8] border-b border-[#EDEAE1] text-[#52607D] font-semibold">
                      <tr>
                        <th className="py-2.5 px-3 w-10">#</th>
                        <th className="py-2.5 px-3 min-w-[220px]">Status</th>
                        <th className="py-2.5 px-3 w-36 whitespace-nowrap">Status Date</th>
                        <th className="py-2.5 px-3 w-44 whitespace-nowrap">Stage Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EDEAE1] text-[#14213D]">
                      {modalStages.map((item, idx) => (
                        <tr key={item.id || idx} className="hover:bg-[#FAFAF8] transition-colors">
                          <td className="py-2.5 px-3 font-mono text-[#8C97AB]">{idx + 1}</td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              <StatusBadge status={item.status} size="sm" />
                              {item.is_current && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-500 text-white uppercase tracking-wider">
                                  Current
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 font-mono font-medium">
                            <div className="flex items-center gap-1.5">
                              <Calendar size={12} className="text-[#2F6F5E]" />
                              <span>{formatDate(item.status_date)}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            {item.days_in_stage !== null && item.days_in_stage !== undefined ? (
                              item.is_current ? (
                                <span className="font-mono font-semibold text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full text-[11px]">
                                  {item.days_in_stage} days active
                                </span>
                              ) : (
                                <span className="font-mono font-semibold text-[#14213D] bg-white border border-[#E4E1D8] px-2 py-0.5 rounded-full text-[11px]">
                                  +{item.days_in_stage} days
                                </span>
                              )
                            ) : (
                              <span className="text-[#8C97AB] font-mono">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-[#EDEAE1]">
              <Link to={`/projects/${selectedProject.id}`}>
                <Button variant="secondary" size="sm" icon={ExternalLink}>
                  Details
                </Button>
              </Link>

              <Button variant="outline" size="sm" onClick={() => setHistoryModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Correct / Merge Application ID Modal */}
      <MergeProjectModal
        isOpen={mergeModalOpen}
        onClose={() => {
          setMergeModalOpen(false);
          setMergeSourceProject(null);
        }}
        sourceProject={mergeSourceProject}
        onSuccess={() => {
          fetchProjects(pagination.page, pagination.limit);
        }}
      />

      {/* Delete Project Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          if (!deleting) {
            setDeleteModalOpen(false);
            setProjectToDelete(null);
          }
        }}
        title="Delete Government Project"
      >
        <div className="space-y-4">
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-[8px] flex items-start gap-3">
            <AlertTriangle size={20} className="text-red-600 shrink-0 mt-0.5" />
            <div className="text-xs text-red-800 space-y-1">
              <p className="font-bold text-red-900">Permanent Deletion Warning</p>
              <p>
                This will permanently delete project{" "}
                <strong className="font-mono text-red-950">{projectToDelete?.application_id}</strong>
                {projectToDelete?.farmer_name && (
                  <span> ({projectToDelete.farmer_name})</span>
                )}
                , along with all associated data including invoices, invoice line items, payments, status milestones history, dealer commissions, and proceeding references.
              </p>
            </div>
          </div>

          <p className="text-xs text-[#52607D]">
            Are you sure you want to delete this entire project? This action cannot be undone.
          </p>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#EDEAE1]">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDeleteModalOpen(false);
                setProjectToDelete(null);
              }}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              icon={Trash2}
              onClick={handleDeleteProject}
              loading={deleting}
            >
              Delete Entire Project
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default ProjectsPage;

