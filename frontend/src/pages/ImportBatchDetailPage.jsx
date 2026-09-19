import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  Search,
  FileSpreadsheet,
  Clock,
  ExternalLink,
  RefreshCw,
  User,
  MapPin,
  Sparkles,
  ArrowRight,
  TrendingUp,
  FileText,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import api from "../api/client.js";
import Navbar from "../components/layout/Navbar.jsx";
import Button from "../components/common/Button.jsx";
import StatusBadge from "../components/common/StatusBadge.jsx";
import Pagination from "../components/common/Pagination.jsx";
import { SkeletonLoader } from "../components/common/SkeletonLoader.jsx";

export function ImportBatchDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Tab: "NEW_PROJECT" or "STATUS_CHANGE"
  const rawTab = searchParams.get("type") || searchParams.get("tab") || "NEW_PROJECT";
  const activeTab =
    rawTab === "status-changes" || rawTab === "STATUS_CHANGE"
      ? "STATUS_CHANGE"
      : "NEW_PROJECT";

  const [batch, setBatch] = useState(null);
  const [loadingBatch, setLoadingBatch] = useState(true);

  // Rows & Pagination
  const [rows, setRows] = useState([]);
  const [loadingRows, setLoadingRows] = useState(true);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 1,
  });

  const [exportingPdf, setExportingPdf] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Fetch Batch Details
  const fetchBatchInfo = async () => {
    try {
      setLoadingBatch(true);
      const res = await api.get(`/government/imports/${id}`);
      setBatch(res.data?.import || res.data || null);
    } catch (err) {
      console.error("Failed to load batch info:", err);
      toast.error(err.message || "Failed to load import batch details");
    } finally {
      setLoadingBatch(false);
    }
  };

  // Fetch Rows for Active Tab
  const fetchRows = async (tab = activeTab, page = 1, limit = 25, searchTerm = search) => {
    try {
      setLoadingRows(true);
      const res = await api.get(`/government/imports/${id}/rows`, {
        params: {
          action: tab,
          page,
          limit,
          search: searchTerm?.trim() || undefined,
        },
      });
      setRows(res.data?.rows || []);
      setPagination(
        res.data?.pagination || { page, limit, total: 0, totalPages: 1 }
      );
    } catch (err) {
      console.error("Failed to load rows:", err);
      toast.error(err.message || "Failed to load project records");
    } finally {
      setLoadingRows(false);
    }
  };

  useEffect(() => {
    fetchBatchInfo();
  }, [id]);

  useEffect(() => {
    fetchRows(activeTab, 1, pagination.limit, search);
  }, [id, activeTab]);

  const handleTabChange = (newTab) => {
    setSearchParams({ type: newTab });
    setSearch("");
    fetchRows(newTab, 1, pagination.limit, "");
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    fetchRows(activeTab, 1, pagination.limit, search);
  };

  const handleCopyId = (appId) => {
    if (!appId) return;
    navigator.clipboard.writeText(appId);
    setCopiedId(appId);
    toast.success(`Copied Application ID: ${appId}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Download PDF with full dataset
  const handleDownloadPdf = async () => {
    if (!id || !batch) return;

    try {
      setExportingPdf(true);
      toast.info("Fetching full dataset for PDF generation...");

      // Fetch ALL rows without pagination limits
      const res = await api.get(`/government/imports/${id}/rows`, {
        params: { action: activeTab, all: "true" },
      });

      const allRows = res.data?.rows || [];
      if (allRows.length === 0) {
        toast.warning("No records found to export.");
        return;
      }

      const isNew = activeTab === "NEW_PROJECT";
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "pt",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();

      // Header Branding
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(20, 33, 61); // #14213D
      doc.text("CHERAN IRRIGATION", 30, 36);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(82, 96, 125); // #52607D
      doc.text(
        isNew
          ? "Government Excel Import Batch — New Projects Detailed Report"
          : "Government Excel Import Batch — Project Status Changes (Transitions)",
        30,
        50
      );

      // Meta Information
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(20, 33, 61);
      doc.text(`File: ${batch.file_name || "—"}`, 30, 68);
      doc.text(`Uploaded By: ${batch.uploaded_by || "Administrator"}`, 260, 68);
      doc.text(
        `Uploaded At: ${batch.uploaded_at ? new Date(batch.uploaded_at).toLocaleString("en-IN") : "—"}`,
        440,
        68
      );
      doc.text(`Total Records: ${allRows.length.toLocaleString()}`, 660, 68);

      const tableHeaders = isNew
        ? [
            [
              "#",
              "Application ID",
              "Farmer Name",
              "Mobile",
              "District",
              "Village / Block",
              "Dealer",
              "Initial Status",
              "Area (ha)",
              "Subsidy (Rs.)",
            ],
          ]
        : [
            [
              "#",
              "Application ID",
              "Farmer Name",
              "District",
              "Village",
              "Dealer",
              "Previous Status (From)",
              "New Status (To)",
              "Status Date",
            ],
          ];

      const tableData = allRows.map((r, index) => {
        const raw = r.raw_data || {};
        if (isNew) {
          const loc = [raw.village, raw.block].filter(Boolean).join(" / ") || "—";
          const subsidyAmt = raw.quotation_subsidy_amount
            ? Math.round(parseFloat(raw.quotation_subsidy_amount)).toLocaleString("en-IN")
            : "—";
          return [
            index + 1,
            r.application_id || "—",
            raw.farmer_name || "—",
            raw.mobile || "—",
            raw.district || "—",
            loc,
            r.dealer_name || raw.dealer_name || "—",
            r.imported_status || raw.current_status || "—",
            raw.total_area_ha || raw.applied_area_ha || "—",
            subsidyAmt,
          ];
        } else {
          return [
            index + 1,
            r.application_id || "—",
            raw.farmer_name || "—",
            raw.district || "—",
            raw.village || "—",
            r.dealer_name || raw.dealer_name || "—",
            r.previous_status || "Initial / Prior",
            r.imported_status || raw.current_status || "—",
            r.imported_status_date || raw.current_status_date || "—",
          ];
        }
      });

      autoTable(doc, {
        head: tableHeaders,
        body: tableData,
        startY: 80,
        margin: { top: 30, left: 30, right: 30, bottom: 40 },
        headStyles: {
          fillColor: isNew ? [47, 111, 94] : [184, 134, 11], // #2F6F5E or #B8860B
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 8,
          halign: "left",
        },
        alternateRowStyles: {
          fillColor: [250, 250, 248],
        },
        styles: {
          font: "helvetica",
          fontSize: 7.5,
          cellPadding: 4,
          textColor: [20, 33, 61],
          overflow: "linebreak",
        },
        columnStyles: isNew
          ? {
              0: { cellWidth: 25, halign: "center" },
              1: { cellWidth: 120, fontStyle: "bold" },
              2: { cellWidth: 110 },
              3: { cellWidth: 70 },
              4: { cellWidth: 75 },
              5: { cellWidth: 100 },
              6: { cellWidth: 80 },
              7: { cellWidth: 100 },
              8: { cellWidth: 45, halign: "right" },
              9: { cellWidth: 55, halign: "right" },
            }
          : {
              0: { cellWidth: 25, halign: "center" },
              1: { cellWidth: 140, fontStyle: "bold" },
              2: { cellWidth: 120 },
              3: { cellWidth: 80 },
              4: { cellWidth: 85 },
              5: { cellWidth: 85 },
              6: { cellWidth: 115, fontStyle: "bold", textColor: [184, 134, 11] },
              7: { cellWidth: 115, fontStyle: "bold", textColor: [47, 111, 94] },
              8: { cellWidth: 65, halign: "center" },
            },
        didDrawPage: (data) => {
          doc.setFontSize(7.5);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(140, 151, 171);
          doc.text(
            `Generated on ${new Date().toLocaleString("en-IN")} • Cheran Irrigation ERP System`,
            30,
            doc.internal.pageSize.getHeight() - 20
          );
          doc.text(
            `Page ${data.pageNumber}`,
            pageWidth - 60,
            doc.internal.pageSize.getHeight() - 20
          );
        },
      });

      const cleanFileName = (batch.file_name || "batch")
        .replace(/\.[^/.]+$/, "")
        .replace(/[^a-zA-Z0-9_-]/g, "_");
      const pdfFileName = `Cheran_${isNew ? "New_Projects" : "Status_Changes"}_${cleanFileName}.pdf`;
      doc.save(pdfFileName);
      toast.success(`Exported complete report with ${allRows.length} records to PDF!`);
    } catch (err) {
      console.error("Failed to generate PDF:", err);
      toast.error("Failed to download PDF: " + (err.message || "Unknown error"));
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <Navbar title="Excel Import Batch Inspector" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            to="/imports"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#52607D] hover:text-[#14213D] transition-colors"
          >
            <ArrowLeft size={14} /> Back to Excel Imports
          </Link>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={() => {
                fetchBatchInfo();
                fetchRows(activeTab, pagination.page, pagination.limit, search);
              }}
              className="text-xs"
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Download}
              loading={exportingPdf}
              onClick={handleDownloadPdf}
              className="text-xs font-semibold shadow-xs"
              title="Download all records of this view as a styled PDF report"
            >
              {exportingPdf ? "Generating PDF..." : "Download Full PDF"}
            </Button>
          </div>
        </div>

        {/* Batch Overview Banner */}
        <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-6 shadow-[0_1px_2px_rgba(20,33,61,0.04)]">
          {loadingBatch ? (
            <SkeletonLoader rows={2} />
          ) : batch ? (
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <div className="p-2 bg-[#EAF3F0] text-[#2F6F5E] rounded-[8px]">
                    <FileSpreadsheet size={20} />
                  </div>
                  <h1 className="text-xl font-bold font-display text-[#14213D]">
                    {batch.file_name}
                  </h1>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                      batch.status === "COMPLETED"
                        ? "bg-[#EAF3F0] text-[#2F6F5E]"
                        : batch.status === "FAILED"
                        ? "bg-[#FDF2F1] text-[#B0403A]"
                        : "bg-[#FDF8EC] text-[#B8860B]"
                    }`}
                  >
                    {batch.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-[#52607D] flex-wrap pt-1">
                  <span>
                    Uploaded:{" "}
                    <strong className="text-[#14213D]">
                      {batch.uploaded_at ? new Date(batch.uploaded_at).toLocaleString("en-IN") : "—"}
                    </strong>
                  </span>
                  <span>•</span>
                  <span>
                    Imported By:{" "}
                    <strong className="text-[#14213D]">{batch.uploaded_by || "Administrator"}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Total File Rows:{" "}
                    <strong className="text-[#14213D]">
                      {(batch.total_rows || 0).toLocaleString()}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Action Tabs Bar */}
              <div className="flex items-center gap-2 bg-[#FAFAF8] p-1.5 rounded-[8px] border border-[#EDEAE1] shrink-0">
                <button
                  type="button"
                  onClick={() => handleTabChange("NEW_PROJECT")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-[6px] text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "NEW_PROJECT"
                      ? "bg-white text-[#2F6F5E] shadow-xs border border-[#E4E1D8]"
                      : "text-[#52607D] hover:text-[#14213D]"
                  }`}
                >
                  <Sparkles size={14} className="text-[#2F6F5E]" />
                  <span>New Projects</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#EAF3F0] text-[#2F6F5E]">
                    {(batch.new_projects_count || 0).toLocaleString()}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange("STATUS_CHANGE")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-[6px] text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "STATUS_CHANGE"
                      ? "bg-white text-[#B8860B] shadow-xs border border-[#E4E1D8]"
                      : "text-[#52607D] hover:text-[#14213D]"
                  }`}
                >
                  <TrendingUp size={14} className="text-[#B8860B]" />
                  <span>Status Changes</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#FDF8EC] text-[#B8860B]">
                    {(batch.status_changes_count || 0).toLocaleString()}
                  </span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-xs text-[#B0403A]">Batch record not found.</div>
          )}
        </div>

        {/* Table & Filtering Section */}
        <div className="bg-white border border-[#E4E1D8] rounded-[10px] shadow-[0_1px_2px_rgba(20,33,61,0.04)] overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-[#EDEAE1] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAFAF8]">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold font-display text-[#14213D]">
                {activeTab === "NEW_PROJECT" ? "New Projects List" : "Status Changes (Transitions)"}
              </h2>
              <span className="text-xs text-[#8C97AB]">
                ({pagination.total.toLocaleString()} total)
              </span>
            </div>

            {/* Real-time Search */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C97AB]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSearchSubmit();
                  }
                }}
                placeholder="Search Application ID, farmer, village, or dealer..."
                className="w-full text-xs pl-8 pr-16 py-2 border border-[#E4E1D8] rounded-[6px] bg-white focus:outline-none focus:border-[#2F6F5E]"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-[#EAF3F0] hover:bg-[#D4E8E1] text-[#2F6F5E] rounded text-[11px] font-semibold cursor-pointer transition-colors"
              >
                Search
              </button>
            </form>
          </div>

          {loadingRows ? (
            <div className="p-6">
              <SkeletonLoader rows={6} />
            </div>
          ) : rows.length === 0 ? (
            <div className="py-16 text-center text-xs text-[#8C97AB]">
              <FileSpreadsheet size={36} className="mx-auto mb-2 opacity-30" />
              <p className="font-semibold text-sm text-[#14213D] mb-1">No matching projects found</p>
              <p>
                {search
                  ? `No records found matching "${search}". Try clearing the search filter.`
                  : activeTab === "NEW_PROJECT"
                  ? "This import batch did not create any new projects."
                  : "This import batch did not contain any status changes."}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAFAF8] border-b border-[#E4E1D8] text-[#52607D] font-semibold uppercase text-[10px] tracking-wider">
                    {activeTab === "STATUS_CHANGE" ? (
                      <tr>
                        <th className="py-3 px-4">#</th>
                        <th className="py-3 px-4">Application ID</th>
                        <th className="py-3 px-4">Farmer Name</th>
                        <th className="py-3 px-4">District / Village</th>
                        <th className="py-3 px-4">Dealer</th>
                        <th className="py-3 px-4">Status Change (From ➔ To)</th>
                        <th className="py-3 px-4 text-center">Status Date</th>
                      </tr>
                    ) : (
                      <tr>
                        <th className="py-3 px-4">#</th>
                        <th className="py-3 px-4">Application ID</th>
                        <th className="py-3 px-4">Farmer Name</th>
                        <th className="py-3 px-4">Mobile</th>
                        <th className="py-3 px-4">District</th>
                        <th className="py-3 px-4">Village / Block</th>
                        <th className="py-3 px-4">Dealer</th>
                        <th className="py-3 px-4">Initial Status</th>
                        <th className="py-3 px-4 text-right">Area (Ha)</th>
                        <th className="py-3 px-4 text-right">Subsidy (₹)</th>
                      </tr>
                    )}
                  </thead>
                  <tbody className="divide-y divide-[#EDEAE1]">
                    {rows.map((r, idx) => {
                      const raw = r.raw_data || {};
                      const rowNum = (pagination.page - 1) * pagination.limit + idx + 1;

                      if (activeTab === "STATUS_CHANGE") {
                        return (
                          <tr key={r.id || idx} className="hover:bg-[#FAFAF8] transition-colors">
                            <td className="py-3 px-4 font-mono text-[#8C97AB]">{rowNum}</td>
                            <td className="py-3 px-4 font-mono font-bold text-[#14213D]">
                              <div className="flex items-center gap-1.5">
                                <span className="select-all">{r.application_id || "—"}</span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyId(r.application_id)}
                                  className="text-[#8C97AB] hover:text-[#14213D] cursor-pointer p-0.5"
                                  title="Copy Application ID"
                                >
                                  {copiedId === r.application_id ? (
                                    <Check size={12} className="text-[#2F6F5E]" />
                                  ) : (
                                    <Copy size={12} />
                                  )}
                                </button>
                              </div>
                            </td>
                            <td className="py-3 px-4 font-medium text-[#14213D]">
                              {raw.farmer_name || "—"}
                              {raw.father_name && (
                                <span className="block text-[10px] text-[#8C97AB] font-normal">
                                  S/O {raw.father_name}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-[#52607D]">
                              <span>{raw.district || "—"}</span>
                              {raw.village && (
                                <span className="block text-[10px] text-[#8C97AB]">{raw.village}</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-[#52607D]">
                              {r.dealer_name || raw.dealer_name || "—"}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-semibold bg-[#FDF8EC] text-[#B8860B] border border-[#B8860B]/20">
                                  {r.previous_status || "Initial / Prior"}
                                </span>
                                <ArrowRight size={13} className="text-[#8C97AB] shrink-0" />
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#EAF3F0] text-[#2F6F5E] border border-[#2F6F5E]/20">
                                  {r.imported_status || raw.current_status || "—"}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center text-[#52607D] font-mono text-[11px]">
                              {r.imported_status_date || raw.current_status_date || "—"}
                            </td>
                          </tr>
                        );
                      }

                      // NEW_PROJECT row
                      return (
                        <tr key={r.id || idx} className="hover:bg-[#FAFAF8] transition-colors">
                          <td className="py-3 px-4 font-mono text-[#8C97AB]">{rowNum}</td>
                          <td className="py-3 px-4 font-mono font-bold text-[#14213D]">
                            <div className="flex items-center gap-1.5">
                              <span className="select-all">{r.application_id || "—"}</span>
                              <button
                                type="button"
                                onClick={() => handleCopyId(r.application_id)}
                                className="text-[#8C97AB] hover:text-[#14213D] cursor-pointer p-0.5"
                                title="Copy Application ID"
                              >
                                {copiedId === r.application_id ? (
                                  <Check size={12} className="text-[#2F6F5E]" />
                                ) : (
                                  <Copy size={12} />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-medium text-[#14213D]">
                            {raw.farmer_name || "—"}
                            {raw.father_name && (
                              <span className="block text-[10px] text-[#8C97AB] font-normal">
                                S/O {raw.father_name}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-[#52607D] font-mono">{raw.mobile || "—"}</td>
                          <td className="py-3 px-4 text-[#52607D]">{raw.district || "—"}</td>
                          <td className="py-3 px-4 text-[#52607D]">
                            {[raw.village, raw.block].filter(Boolean).join(" / ") || "—"}
                          </td>
                          <td className="py-3 px-4 text-[#52607D]">
                            {r.dealer_name || raw.dealer_name || "—"}
                          </td>
                          <td className="py-3 px-4">
                            <StatusBadge status={r.imported_status || raw.current_status} size="sm" />
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-[#14213D]">
                            {raw.total_area_ha || raw.applied_area_ha || "—"}
                          </td>
                          <td className="py-3 px-4 text-right font-medium text-[#2F6F5E]">
                            {raw.quotation_subsidy_amount
                              ? `₹${Math.round(parseFloat(raw.quotation_subsidy_amount)).toLocaleString("en-IN")}`
                              : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Server Pagination */}
              <div className="p-4 bg-white border-t border-[#EDEAE1]">
                <Pagination
                  page={pagination.page}
                  totalPages={pagination.totalPages}
                  totalItems={pagination.total}
                  limit={pagination.limit}
                  limitOptions={[10, 25, 50, 100]}
                  onPageChange={(newPage) =>
                    fetchRows(activeTab, newPage, pagination.limit, search)
                  }
                  onLimitChange={(newLimit) =>
                    fetchRows(activeTab, 1, newLimit, search)
                  }
                />
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default ImportBatchDetailPage;
