import React, { useState, useEffect } from "react";
import {
  UploadCloud,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Users,
  Play,
  RotateCcw,
  Clock,
  Sparkles,
  Search,
  Trash2,
  ArrowRight,
  Eye,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import api from "../api/client.js";
import Navbar from "../components/layout/Navbar.jsx";
import Button from "../components/common/Button.jsx";
import Modal from "../components/common/Modal.jsx";
import StatusBadge from "../components/common/StatusBadge.jsx";
import CustomSelect from "../components/common/CustomSelect.jsx";
import Pagination from "../components/common/Pagination.jsx";
import { SkeletonLoader, EmptyState } from "../components/common/SkeletonLoader.jsx";

export function ImportsPage() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  // Staged Rows & Server Pagination
  const [stagedRows, setStagedRows] = useState([]);
  const [loadingRows, setLoadingRows] = useState(false);
  const [rowActionFilter, setRowActionFilter] = useState("ALL");
  const [stagedPagination, setStagedPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 1,
  });

  // Unresolved Dealers Summary
  const [unresolvedDealers, setUnresolvedDealers] = useState([]);
  const [loadingUnresolved, setLoadingUnresolved] = useState(false);
  const [autoCreatingAll, setAutoCreatingAll] = useState(false);

  // Commit State
  const [committing, setCommitting] = useState(false);

  // Past Imports History & Pagination
  const [pastImports, setPastImports] = useState([]);
  const [historyPagination, setHistoryPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Dealer Resolution Modal State
  const [resolutionModalOpen, setResolutionModalOpen] = useState(false);
  const [targetDealerNameToResolve, setTargetDealerNameToResolve] = useState("");
  const [targetDealerRowCount, setTargetDealerRowCount] = useState(0);
  const [dealersList, setDealersList] = useState([]);
  const [resolutionMode, setResolutionMode] = useState("SELECT_EXISTING"); // or CREATE_NEW
  const [selectedExistingDealerId, setSelectedExistingDealerId] = useState("");
  const [newDealerName, setNewDealerName] = useState("");
  const [newDealerCommission, setNewDealerCommission] = useState("");
  const [resolving, setResolving] = useState(false);

  const fetchPastImports = async (page = 1, limit = 10) => {
    try {
      setLoadingHistory(true);
      const res = await api.get("/government/imports", { params: { page, limit } });
      setPastImports(res.data?.imports || []);
      setHistoryPagination(
        res.data?.pagination || { page: 1, limit, total: 0, totalPages: 1 }
      );
    } catch (err) {
      console.error("Error fetching past imports:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchDealers = async () => {
    try {
      const res = await api.get("/dealers?limit=250");
      setDealersList(res.data?.dealers || []);
    } catch (err) {
      console.error("Failed to load dealers:", err);
    }
  };

  const fetchStagedRows = async (importId, page = 1, limit = 50, action = "ALL") => {
    if (!importId) return;
    try {
      setLoadingRows(true);
      const params = { page, limit };
      if (action && action !== "ALL") params.action = action;

      const res = await api.get(`/government/imports/${importId}/rows`, { params });
      setStagedRows(res.data?.rows || []);
      setStagedPagination(
        res.data?.pagination || { page: 1, limit, total: 0, totalPages: 1 }
      );
    } catch (err) {
      console.error("Error fetching staged rows:", err);
    } finally {
      setLoadingRows(false);
    }
  };

  const fetchUnresolvedDealersSummary = async (importId) => {
    if (!importId) return;
    try {
      setLoadingUnresolved(true);
      const res = await api.get(`/government/imports/${importId}/unresolved-dealers`);
      setUnresolvedDealers(res.data?.unresolvedDealers || []);
    } catch (err) {
      console.error("Failed to load unresolved dealers summary:", err);
    } finally {
      setLoadingUnresolved(false);
    }
  };

  useEffect(() => {
    fetchPastImports(1, 10);
    fetchDealers();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUploadPreview = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error("Please select an Excel (.xls, .xlsx) file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("uploaded_by", "Staff");

    try {
      setUploading(true);
      const res = await api.post("/government/imports/preview", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setPreviewData(res.data);
      toast.success("Excel parsed and preview staged successfully!");

      fetchStagedRows(res.data.importId, 1, stagedPagination.limit, "ALL");
      fetchUnresolvedDealersSummary(res.data.importId);
      fetchPastImports(1, historyPagination.limit);
    } catch (err) {
      toast.error(err.message || "Failed to parse and preview Excel file");
    } finally {
      setUploading(false);
    }
  };

  const openDealerResolutionForName = (dealerName, count = 1) => {
    setTargetDealerNameToResolve(dealerName || "");
    setTargetDealerRowCount(count);
    setNewDealerName(dealerName || "");
    setSelectedExistingDealerId("");
    setNewDealerCommission("");
    setResolutionMode("SELECT_EXISTING");
    setResolutionModalOpen(true);
  };

  const handleResolveDealerSubmit = async (e) => {
    e.preventDefault();
    if (!targetDealerNameToResolve || !previewData?.importId) return;

    try {
      setResolving(true);
      const payload = {
        dealer_name: targetDealerNameToResolve,
        resolution_type: resolutionMode,
        ...(resolutionMode === "SELECT_EXISTING"
          ? { dealer_id: selectedExistingDealerId }
          : {
              new_dealer: {
                name: newDealerName,
                commission_percentage: newDealerCommission ? parseFloat(newDealerCommission) : null,
              },
            }),
      };

      const res = await api.post(
        `/government/imports/${previewData.importId}/resolve-dealer`,
        payload
      );

      toast.success(
        `Resolved all ${res.data?.resolvedRowsCount} rows matching dealer '${targetDealerNameToResolve}'!`
      );
      setResolutionModalOpen(false);

      // Refresh data
      fetchStagedRows(previewData.importId, stagedPagination.page, stagedPagination.limit, rowActionFilter);
      fetchUnresolvedDealersSummary(previewData.importId);

      // Update remaining counter in preview summary
      setPreviewData((prev) => ({
        ...prev,
        summary: {
          ...prev.summary,
          dealerResolutionsRequired: res.data?.remainingPendingResolutions ?? 0,
        },
      }));

      fetchDealers();
    } catch (err) {
      toast.error(err.message || "Failed to resolve dealer");
    } finally {
      setResolving(false);
    }
  };

  const handleAutoCreateAllDealers = async () => {
    if (!previewData?.importId) return;

    try {
      setAutoCreatingAll(true);
      const res = await api.post(`/government/imports/${previewData.importId}/auto-create-dealers`);
      toast.success(res.data?.message || "All unmatched dealers created and resolved!");

      // Refresh data
      fetchStagedRows(previewData.importId, 1, stagedPagination.limit, rowActionFilter);
      fetchUnresolvedDealersSummary(previewData.importId);

      setPreviewData((prev) => ({
        ...prev,
        summary: {
          ...prev.summary,
          dealerResolutionsRequired: 0,
        },
      }));

      fetchDealers();
    } catch (err) {
      toast.error(err.message || "Failed to auto-create dealers");
    } finally {
      setAutoCreatingAll(false);
    }
  };

  const handleCommitImport = async () => {
    if (!previewData?.importId) return;

    if (previewData.summary?.dealerResolutionsRequired > 0) {
      toast.error("Please resolve all dealer mappings before committing.");
      return;
    }

    try {
      setCommitting(true);
      const res = await api.post(`/government/imports/${previewData.importId}/commit`);
      toast.success(
        `Import committed! Created ${res.data?.summary?.newProjectsCreated} new, updated ${res.data?.summary?.existingProjectsUpdated} projects.`
      );
      setPreviewData(null);
      setFile(null);
      setStagedRows([]);
      setUnresolvedDealers([]);
      fetchPastImports(1, historyPagination.limit);
    } catch (err) {
      toast.error(err.message || "Failed to commit import to production database");
    } finally {
      setCommitting(false);
    }
  };

  const loadImportPreview = (imp) => {
    setPreviewData({
      importId: imp.id,
      fileName: imp.file_name,
      fileHash: imp.file_hash || "",
      uploadedBy: imp.uploaded_by,
      summary: {
        totalRows: imp.total_rows || 0,
        newProjects: imp.new_projects_count || 0,
        existingProjects: imp.updated_projects_count || 0,
        updatedProjects: imp.updated_projects_count || 0,
        statusChanges: imp.status_changes_count || 0,
        unchanged: imp.unchanged_count || 0,
        duplicateRows: imp.duplicate_rows_count || 0,
        errorRows: imp.error_rows_count || 0,
        dealerResolutionsRequired: imp.dealer_resolutions_count || 0,
      },
    });

    fetchStagedRows(imp.id, 1, stagedPagination.limit, "ALL");
    fetchUnresolvedDealersSummary(imp.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast.info(`Loaded preview batch for '${imp.file_name}'`);
  };

  const handleDeleteImport = async (importId, fileName) => {
    if (!window.confirm(`Are you sure you want to discard and delete import batch '${fileName}'?`)) {
      return;
    }

    try {
      await api.delete(`/government/imports/${importId}`);
      toast.success(`Import batch '${fileName}' discarded successfully`);
      if (previewData?.importId === importId) {
        setPreviewData(null);
        setFile(null);
        setStagedRows([]);
        setUnresolvedDealers([]);
      }
      fetchPastImports(historyPagination.page, historyPagination.limit);
    } catch (err) {
      toast.error(err.message || "Failed to delete import batch");
    }
  };

  const handleFilterChange = (newAction) => {
    setRowActionFilter(newAction);
    if (previewData?.importId) {
      fetchStagedRows(previewData.importId, 1, stagedPagination.limit, newAction);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Navbar
        title="Government Excel Imports"
        subtitle="Safe, two-step idempotent Excel import with high-performance pagination and bulk dealer resolution"
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 flex-1 overflow-y-auto">
        {/* Pending Preview Alert Banner */}
        {!previewData && pastImports.some((imp) => imp.status === "PREVIEW") && (
          <div className="bg-[#EAF3F0] border border-[#2F6F5E]/30 rounded-[10px] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#2F6F5E] text-white flex items-center justify-center shrink-0">
                <Clock size={18} />
              </div>
              <div>
                <div className="text-xs font-bold text-[#14213D]">
                  Staged Preview Pending Review:{" "}
                  <span className="font-mono text-[#2F6F5E]">
                    {pastImports.find((imp) => imp.status === "PREVIEW")?.file_name}
                  </span>{" "}
                  ({pastImports.find((imp) => imp.status === "PREVIEW")?.total_rows?.toLocaleString()} rows)
                </div>
                <div className="text-[11px] text-[#52607D]">
                  Imported by{" "}
                  <strong>{pastImports.find((imp) => imp.status === "PREVIEW")?.uploaded_by || "Staff"}</strong>{" "}
                  on{" "}
                  {new Date(
                    pastImports.find((imp) => imp.status === "PREVIEW")?.uploaded_at
                  ).toLocaleString("en-IN")}
                  . You can review mappings and commit without re-uploading the file.
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="secondary"
                size="sm"
                icon={Trash2}
                onClick={() => {
                  const p = pastImports.find((imp) => imp.status === "PREVIEW");
                  if (p) handleDeleteImport(p.id, p.file_name);
                }}
              >
                Discard
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={Play}
                onClick={() => {
                  const p = pastImports.find((imp) => imp.status === "PREVIEW");
                  if (p) loadImportPreview(p);
                }}
              >
                Resume
              </Button>
            </div>
          </div>
        )}

        {/* Upload Card */}
        <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-6 shadow-[0_1px_2px_rgba(20,33,61,0.04)]">
          <h2 className="text-base font-bold font-display text-[#14213D] mb-2">
            Upload Tamil Nadu Government Excel Export
          </h2>
          <p className="text-xs text-[#52607D] mb-6">
            Supports both <code>.xls</code> and <code>.xlsx</code> formats. Application IDs are mapped deterministically.
          </p>

          <form onSubmit={handleUploadPreview} className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1 w-full">
              <input
                type="file"
                accept=".xls,.xlsx"
                onChange={handleFileChange}
                className="w-full text-xs text-[#52607D] file:mr-4 file:py-2 file:px-4 file:rounded-[8px] file:border-0 file:text-xs file:font-semibold file:bg-[#EAF3F0] file:text-[#2F6F5E] hover:file:bg-[#D3E6E0] cursor-pointer"
              />
            </div>

            <Button type="submit" loading={uploading} disabled={!file} icon={UploadCloud}>
              Preview
            </Button>
          </form>
        </div>

        {/* Live Staged Preview Section */}
        {previewData && (
          <div className="space-y-6">
            {/* Summary Card */}
            <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-6 shadow-[0_1px_2px_rgba(20,33,61,0.04)] space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EDEAE1] pb-4">
                <div>
                  <h3 className="text-base font-bold font-display text-[#14213D]">
                    Staged Import Preview ({previewData.fileName})
                  </h3>
                  <p className="text-xs text-[#52607D]">
                    SHA-256: <code className="font-mono text-[10px]">{previewData.fileHash ? `${previewData.fileHash.slice(0, 16)}...` : "Staged Batch"}</code>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setPreviewData(null);
                      setStagedRows([]);
                      setUnresolvedDealers([]);
                    }}
                    icon={RotateCcw}
                  >
                    Discard
                  </Button>

                  <Button
                    size="sm"
                    loading={committing}
                    disabled={previewData.summary?.dealerResolutionsRequired > 0}
                    onClick={handleCommitImport}
                    icon={Play}
                  >
                    Commit
                  </Button>
                </div>
              </div>

              {/* Preview Metric Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-center">
                <div className="p-3 bg-[#FAFAF8] border border-[#EDEAE1] rounded-[8px]">
                  <span className="text-[10px] uppercase font-bold text-[#52607D]">Total Rows</span>
                  <div className="text-lg font-bold font-display text-[#14213D]">
                    {(previewData.summary?.totalRows || 0).toLocaleString()}
                  </div>
                </div>
                <div className="p-3 bg-[#EAF3F0] border border-[#D3E6E0] rounded-[8px]">
                  <span className="text-[10px] uppercase font-bold text-[#2F6F5E]">New Projects</span>
                  <div className="text-lg font-bold font-display text-[#2F6F5E]">
                    {(previewData.summary?.newProjects || 0).toLocaleString()}
                  </div>
                </div>
                <div className="p-3 bg-[#FAFAF8] border border-[#EDEAE1] rounded-[8px]">
                  <span className="text-[10px] uppercase font-bold text-[#14213D]">Existing</span>
                  <div className="text-lg font-bold font-display text-[#14213D]">
                    {(previewData.summary?.existingProjects ?? previewData.summary?.updatedProjects ?? 0).toLocaleString()}
                  </div>
                </div>
                <div className="p-3 bg-[#FDF8EC] border border-[#F7E7C4] rounded-[8px]">
                  <span className="text-[10px] uppercase font-bold text-[#B8860B]">Status Changes</span>
                  <div className="text-lg font-bold font-display text-[#B8860B]">
                    {(previewData.summary?.statusChanges || 0).toLocaleString()}
                  </div>
                </div>
                <div className="p-3 bg-[#FAFAF8] border border-[#EDEAE1] rounded-[8px]">
                  <span className="text-[10px] uppercase font-bold text-[#52607D]">Unchanged</span>
                  <div className="text-lg font-bold font-display text-[#52607D]">
                    {(previewData.summary?.unchanged || 0).toLocaleString()}
                  </div>
                </div>
                <div className="p-3 bg-[#FDF2F1] border border-[#F8D7D5] rounded-[8px]">
                  <span className="text-[10px] uppercase font-bold text-[#B0403A]">Duplicates</span>
                  <div className="text-lg font-bold font-display text-[#B0403A]">
                    {(previewData.summary?.duplicateRows || 0).toLocaleString()}
                  </div>
                </div>
                <div className="p-3 bg-[#FDF8EC] border border-[#F7E7C4] rounded-[8px]">
                  <span className="text-[10px] uppercase font-bold text-[#B8860B]">Dealer Needs Action</span>
                  <div className="text-lg font-bold font-display text-[#B8860B]">
                    {(previewData.summary?.dealerResolutionsRequired || 0).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* UNRESOLVED DEALERS SUMMARY & BULK RESOLUTION CARD */}
            {unresolvedDealers.length > 0 && (
              <div className="bg-white border-2 border-[#F7E7C4] rounded-[10px] p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EDEAE1] pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Users size={18} className="text-[#B8860B]" />
                      <h3 className="text-base font-bold font-display text-[#14213D]">
                        Unmatched Dealer Names ({unresolvedDealers.length} Unique Dealers Across{" "}
                        {previewData.summary.dealerResolutionsRequired} Rows)
                      </h3>
                    </div>
                    <p className="text-xs text-[#52607D] mt-0.5">
                      Resolving a dealer name once will automatically map and resolve all matching rows across the entire import file.
                    </p>
                  </div>

                  <Button
                    size="sm"
                    loading={autoCreatingAll}
                    onClick={handleAutoCreateAllDealers}
                    icon={Sparkles}
                    className="bg-[#2F6F5E] text-white shrink-0"
                  >
                    Auto-Resolve
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {unresolvedDealers.map((d) => (
                    <div
                      key={d.dealer_name}
                      className="p-3 bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-xs text-[#14213D] truncate" title={d.dealer_name}>
                          {d.dealer_name}
                        </div>
                        <div className="text-[11px] text-[#52607D]">
                          <strong className="text-[#B8860B]">{d.count}</strong> rows in file
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => openDealerResolutionForName(d.dealer_name, d.count)}
                        className="text-xs px-2.5 py-1 shrink-0"
                      >
                        Resolve
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STAGED ROWS TABLE WITH FILTER & PAGINATION */}
            <div className="bg-white border border-[#E4E1D8] rounded-[10px] shadow-[0_1px_2px_rgba(20,33,61,0.04)] overflow-hidden">
              <div className="p-4 border-b border-[#EDEAE1] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                  <span className="text-xs font-semibold text-[#52607D] mr-2">Filter Staged Rows:</span>
                  {[
                    { id: "ALL", label: "All Rows" },
                    { id: "DEALER_RESOLUTION_REQUIRED", label: "Dealer Needs Action" },
                    { id: "NEW_PROJECT", label: "New Projects" },
                    { id: "STATUS_CHANGE", label: "Status Changes" },
                    { id: "UNCHANGED", label: "Unchanged" },
                    { id: "ERROR", label: "Errors" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => handleFilterChange(tab.id)}
                      className={`text-xs px-3 py-1.5 rounded-[6px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                        rowActionFilter === tab.id
                          ? "bg-[#2F6F5E] text-white shadow-xs"
                          : "bg-[#FAFAF8] text-[#52607D] hover:bg-[#EDEAE1]"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {loadingRows ? (
                <div className="p-6">
                  <SkeletonLoader rows={8} />
                </div>
              ) : stagedRows.length === 0 ? (
                <EmptyState
                  title="No staged rows match this filter"
                  description="Try selecting a different action filter above."
                />
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#FAFAF8] border-b border-[#E4E1D8] text-[#52607D] uppercase font-semibold">
                        <tr>
                          <th className="py-2.5 px-3">Row #</th>
                          <th className="py-2.5 px-3">Application ID</th>
                          <th className="py-2.5 px-3">Imported Status</th>
                          <th className="py-2.5 px-3">Imported Dealer</th>
                          <th className="py-2.5 px-3">Staged Action</th>
                          <th className="py-2.5 px-3 text-right">Action Required</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EDEAE1]">
                        {stagedRows.map((r) => (
                          <tr key={r.id} className="hover:bg-[#FAFAF8]">
                            <td className="py-2.5 px-3 font-mono text-[#52607D]">{r.row_number}</td>
                            <td className="py-2.5 px-3 font-mono font-medium text-[#14213D]">
                              {r.application_id || "—"}
                            </td>
                            <td className="py-2.5 px-3">
                              <StatusBadge status={r.imported_status} size="sm" />
                            </td>
                            <td className="py-2.5 px-3 text-[#14213D]">
                              {r.dealer_name || "—"}
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  r.action === "NEW_PROJECT"
                                    ? "bg-[#EAF3F0] text-[#2F6F5E]"
                                    : r.action === "STATUS_CHANGE"
                                    ? "bg-[#FDF8EC] text-[#B8860B]"
                                    : r.action === "DEALER_RESOLUTION_REQUIRED"
                                    ? "bg-[#FDF8EC] text-[#B8860B] border border-[#F7E7C4]"
                                    : r.action === "UNCHANGED"
                                    ? "bg-[#FAFAF8] text-[#52607D]"
                                    : "bg-[#FDF2F1] text-[#B0403A]"
                                }`}
                              >
                                {r.action.replace(/_/g, " ")}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              {r.action === "DEALER_RESOLUTION_REQUIRED" && (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => openDealerResolutionForName(r.dealer_name, 1)}
                                  icon={Users}
                                >
                                  Resolve
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Reusable Pagination for Staged Rows */}
                  <Pagination
                    page={stagedPagination.page}
                    totalPages={stagedPagination.totalPages}
                    totalItems={stagedPagination.total}
                    limit={stagedPagination.limit}
                    limitOptions={[50, 100, 250, 500]}
                    onPageChange={(newPage) =>
                      fetchStagedRows(previewData.importId, newPage, stagedPagination.limit, rowActionFilter)
                    }
                    onLimitChange={(newLimit) =>
                      fetchStagedRows(previewData.importId, 1, newLimit, rowActionFilter)
                    }
                  />
                </>
              )}
            </div>
          </div>
        )}

        {/* Past Imports Batch History & Pagination */}
        <div className="bg-white border border-[#E4E1D8] rounded-[10px] shadow-[0_1px_2px_rgba(20,33,61,0.04)] overflow-hidden">
          <div className="p-6 border-b border-[#EDEAE1]">
            <h2 className="text-base font-bold font-display text-[#14213D]">
              Recent Import Batches
            </h2>
          </div>

          {loadingHistory ? (
            <div className="p-6">
              <SkeletonLoader rows={4} />
            </div>
          ) : pastImports.length === 0 ? (
            <div className="text-xs text-[#52607D] py-8 text-center">
              No historical imports recorded yet.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAFAF8] border-b border-[#E4E1D8] text-[#52607D] uppercase font-semibold">
                    <tr>
                      <th className="py-2.5 px-4">File Name</th>
                      <th className="py-2.5 px-4">Imported By</th>
                      <th className="py-2.5 px-4">Uploaded At</th>
                      <th className="py-2.5 px-4 text-right">Total Rows</th>
                      <th className="py-2.5 px-4 text-right">New Projects</th>
                      <th className="py-2.5 px-4 text-right">Status Changes</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDEAE1]">
                    {pastImports.map((imp) => (
                      <tr key={imp.id} className="hover:bg-[#FAFAF8]">
                        <td className="py-3 px-4 font-semibold text-[#14213D]">{imp.file_name}</td>
                        <td className="py-3 px-4 text-[#14213D]">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#FAFAF8] text-[#52607D] border border-[#E4E1D8]">
                            {imp.uploaded_by || "—"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[#52607D]">
                          {new Date(imp.uploaded_at).toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-[#14213D]">
                          {(imp.total_rows || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right text-[#2F6F5E] font-medium">
                          {(imp.new_projects_count || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right text-[#B8860B] font-medium">
                          {(imp.status_changes_count || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              imp.status === "COMPLETED"
                                ? "bg-[#EAF3F0] text-[#2F6F5E]"
                                : imp.status === "FAILED"
                                ? "bg-[#FDF2F1] text-[#B0403A]"
                                : "bg-[#FDF8EC] text-[#B8860B]"
                            }`}
                          >
                            {imp.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {imp.status === "PREVIEW" && (
                              <>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  icon={Play}
                                  onClick={() => loadImportPreview(imp)}
                                  className="px-2.5 py-1 text-[11px]"
                                  title="Resume and review staged preview"
                                >
                                  Resume
                                </Button>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  icon={Trash2}
                                  onClick={() => handleDeleteImport(imp.id, imp.file_name)}
                                  className="px-2 py-1 text-[11px]"
                                  title="Discard staged preview batch"
                                >
                                  Discard
                                </Button>
                              </>
                            )}
                            {imp.status === "FAILED" && (
                              <Button
                                variant="danger"
                                size="sm"
                                icon={Trash2}
                                onClick={() => handleDeleteImport(imp.id, imp.file_name)}
                                className="px-2 py-1 text-[11px]"
                                title="Delete failed import log"
                              >
                                Delete
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Pagination
                page={historyPagination.page}
                totalPages={historyPagination.totalPages}
                totalItems={historyPagination.total}
                limit={historyPagination.limit}
                limitOptions={[10, 25, 50]}
                onPageChange={(newPage) => fetchPastImports(newPage, historyPagination.limit)}
                onLimitChange={(newLimit) => fetchPastImports(1, newLimit)}
              />
            </>
          )}
        </div>
      </main>

      {/* Bulk / Single Dealer Resolution Modal */}
      <Modal
        isOpen={resolutionModalOpen}
        onClose={() => setResolutionModalOpen(false)}
        title={`Resolve Dealer: ${targetDealerNameToResolve}`}
      >
        <form onSubmit={handleResolveDealerSubmit} className="space-y-4 text-xs">
          <div className="p-3 bg-[#FAFAF8] border border-[#EDEAE1] rounded-[8px]">
            <span className="text-[#52607D]">Imported Dealer Name:</span>
            <p className="text-sm font-bold text-[#14213D] mt-0.5">
              {targetDealerNameToResolve}
            </p>
            {targetDealerRowCount > 1 && (
              <p className="text-[11px] text-[#2F6F5E] font-semibold mt-1">
                ⚡ Action will automatically update and resolve all {targetDealerRowCount} matching rows in this import.
              </p>
            )}
          </div>

          <div className="flex border-b border-[#EDEAE1] gap-4">
            <button
              type="button"
              onClick={() => setResolutionMode("SELECT_EXISTING")}
              className={`pb-2 font-semibold border-b-2 cursor-pointer ${
                resolutionMode === "SELECT_EXISTING"
                  ? "border-[#2F6F5E] text-[#2F6F5E]"
                  : "border-transparent text-[#52607D]"
              }`}
            >
              Map to Existing Dealer
            </button>
            <button
              type="button"
              onClick={() => setResolutionMode("CREATE_NEW")}
              className={`pb-2 font-semibold border-b-2 cursor-pointer ${
                resolutionMode === "CREATE_NEW"
                  ? "border-[#2F6F5E] text-[#2F6F5E]"
                  : "border-transparent text-[#52607D]"
              }`}
            >
              Create New Dealer
            </button>
          </div>

          {resolutionMode === "SELECT_EXISTING" ? (
            <div className="space-y-2">
              <label className="font-semibold text-[#14213D]">Select Existing Registered Dealer:</label>
              <CustomSelect
                options={dealersList.map((d) => ({
                  value: d.id,
                  label: d.name,
                  badge: d.commission_percentage ? `${d.commission_percentage}%` : null,
                }))}
                value={selectedExistingDealerId}
                onChange={(val) => setSelectedExistingDealerId(val)}
                placeholder="-- Choose a Registered Dealer --"
                searchable={true}
              />
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="font-semibold text-[#14213D]">Dealer Name *</label>
                <input
                  type="text"
                  value={newDealerName}
                  onChange={(e) => setNewDealerName(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:ring-2 focus:ring-[#2F6F5E] mt-1"
                />
              </div>
              <div>
                <label className="font-semibold text-[#14213D]">Commission % (Optional)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 10.0"
                  value={newDealerCommission}
                  onChange={(e) => setNewDealerCommission(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:ring-2 focus:ring-[#2F6F5E] mt-1"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-[#EDEAE1]">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setResolutionModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={resolving}>
              Confirm
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default ImportsPage;
