import React, { useState, useEffect } from "react";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Layers,
  ArrowRight,
  Database,
  Calendar,
  Check,
  Plus,
  Trash2,
  X,
  Package,
  Calculator,
  IndianRupee,
  Copy,
  ChevronRight,
  User,
  MapPin,
  History,
  Truck,
  FileText,
  Search,
  Eye,
  Info,
  ArrowDownRight,
} from "lucide-react";
import api from "../api/client.js";
import Navbar from "../components/layout/Navbar.jsx";
import MetricCard from "../components/common/MetricCard.jsx";
import Button from "../components/common/Button.jsx";
import Modal from "../components/common/Modal.jsx";
import Pagination from "../components/common/Pagination.jsx";
import { SkeletonLoader, EmptyState } from "../components/common/SkeletonLoader.jsx";
import { formatDate, formatDateTime } from "../utils/dates.js";

export function LoadOrderUploadPage() {
  const [activeTab, setActiveTab] = useState("upload"); // 'upload' or 'history'

  // ==========================================
  // 1. Upload & Preview State
  // ==========================================
  const [file, setFile] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewError, setPreviewError] = useState("");

  // Upload Input Method: 'file' or 'paste'
  const [inputMode, setInputMode] = useState("file");
  const [pastedAppIds, setPastedAppIds] = useState("");

  // Invoice / Dispatch Date
  const [dispatchDate, setDispatchDate] = useState(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date())
  );
  const [batchNotes, setBatchNotes] = useState("");

  // Projects list with user-editable / auto-incremented invoice numbers
  const [projectsList, setProjectsList] = useState([]);
  // Excluded/Ignored projects (non-Work-Order or manually removed)
  const [excludedProjects, setExcludedProjects] = useState([]);

  // Material Items: Array of { item_id, name, code, category, unit, unit_price, govt_qty, actual_qty, available_stock }
  const [batchItems, setBatchItems] = useState([]);
  const [materialSubTab, setMaterialSubTab] = useState("actual"); // 'actual' or 'govt'

  // Commit State
  const [committing, setCommitting] = useState(false);
  const [commitResult, setCommitResult] = useState(null);
  const [commitError, setCommitError] = useState("");

  // ==========================================
  // 2. Batch History State
  // ==========================================
  const [batches, setBatches] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [historyStartDate, setHistoryStartDate] = useState("");
  const [historyEndDate, setHistoryEndDate] = useState("");
  const [historyPagination, setHistoryPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 1,
  });

  // View Batch Modal
  const [selectedBatchModal, setSelectedBatchModal] = useState(null);
  const [batchModalLoading, setBatchModalLoading] = useState(false);

  // Cancellation Modal State
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [batchToCancel, setBatchToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const handleOpenCancelModal = (batch) => {
    setBatchToCancel(batch);
    setCancelReason("");
    setCancelModalOpen(true);
  };

  const handleConfirmCancelBatch = async (e) => {
    e.preventDefault();
    if (!batchToCancel) return;

    try {
      setCancelling(true);
      await api.post(`/invoices/load-order/batches/${batchToCancel.id}/cancel`, {
        reason: cancelReason.trim() || "Cancelled by user from Load Order History",
      });
      setCancelModalOpen(false);
      setBatchToCancel(null);
      if (selectedBatchModal?.id === batchToCancel.id) {
        setSelectedBatchModal(null);
      }
      loadBatchHistory(historyPagination.page);
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Failed to cancel batch");
    } finally {
      setCancelling(false);
    }
  };

  // Helper to check if status is "Issued Work Order"
  const isIssuedWorkOrder = (status) => {
    if (!status) return false;
    const s = String(status).toLowerCase().replace(/[^a-z]/g, "");
    return s.includes("issuedworkorder") || s.includes("workorderissued");
  };

  // ==========================================
  // File Upload & Preview Handler
  // ==========================================
  const handleFileUpload = async (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setPreviewError("");
    setCommitResult(null);
    setCommitError("");

    const formData = new FormData();
    formData.append("file", selected);

    try {
      setPreviewLoading(true);
      const [previewRes, stockRes] = await Promise.all([
        api.post("/invoices/load-order/preview", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        }),
        api.get("/inventory/stock").catch(() => ({ data: { stock: [] } })),
      ]);

      const data = previewRes.data || previewRes;
      setPreviewData(data);

      if (data.defaultInvoiceDate) {
        setDispatchDate(data.defaultInvoiceDate);
      }

      // Auto-filter: Only projects with 'Issued Work Order' are included by default!
      const ready = [];
      const excluded = [];

      (data.projects || []).forEach((p) => {
        const item = {
          ...p,
          invoice_number: "",
        };
        if (p.exists_in_db && isIssuedWorkOrder(p.current_status)) {
          ready.push(item);
        } else {
          excluded.push(item);
        }
      });

      setProjectsList(ready);
      setExcludedProjects(excluded);

      // Map on-hand stock for finished goods
      const stockMap = new Map();
      (stockRes.data?.stock || []).forEach((s) => {
        if (s.item_id) stockMap.set(s.item_id, parseFloat(s.available_quantity) || 0);
      });

      const goods = (data.availableFinishedGoods || []).map((fg) => ({
        item_id: fg.id,
        name: fg.name,
        code: fg.code,
        category: fg.category,
        unit: fg.unit_symbol || "NOS",
        unit_price: fg.unit_price,
        govt_qty: "",
        actual_qty: "",
        available_stock: stockMap.get(fg.id) ?? 0,
      }));
      setBatchItems(goods);
    } catch (err) {
      console.error("Load Order Preview Error:", err);
      setPreviewError(
        err.response?.data?.message || err.message || "Failed to parse Load Order spreadsheet."
      );
    } finally {
      setPreviewLoading(false);
    }
  };

  // ==========================================
  // Pasted Application IDs Preview Handler
  // ==========================================
  const handlePastedIdsPreview = async (e) => {
    e?.preventDefault();
    if (!pastedAppIds || !pastedAppIds.trim()) {
      setPreviewError("Please enter or paste at least one Government Application ID.");
      return;
    }

    setFile(null);
    setPreviewLoading(true);
    setPreviewError("");
    setCommitResult(null);
    setCommitError("");

    try {
      const [previewRes, stockRes] = await Promise.all([
        api.post("/invoices/load-order/preview", {
          application_ids_text: pastedAppIds.trim(),
          dispatch_date: dispatchDate,
        }),
        api.get("/inventory/stock").catch(() => ({ data: { stock: [] } })),
      ]);

      const data = previewRes.data?.data || previewRes.data || previewRes;
      setPreviewData(data);

      if (data.defaultInvoiceDate) {
        setDispatchDate(data.defaultInvoiceDate);
      }

      // Auto-filter: Only Issued Work Order projects go to active projectsList
      const ready = [];
      const excluded = [];

      (data.projects || []).forEach((p) => {
        const item = { ...p, invoice_number: "" };
        if (p.exists_in_db && isIssuedWorkOrder(p.current_status)) {
          ready.push(item);
        } else {
          excluded.push(item);
        }
      });

      setProjectsList(ready);
      setExcludedProjects(excluded);

      const stockMap = new Map();
      (stockRes.data?.stock || []).forEach((s) => {
        if (s.item_id) stockMap.set(s.item_id, parseFloat(s.available_quantity) || 0);
      });

      const goods = (data.availableFinishedGoods || []).map((fg) => ({
        item_id: fg.id,
        name: fg.name,
        code: fg.code,
        category: fg.category,
        unit: fg.unit_symbol || "NOS",
        unit_price: fg.unit_price,
        govt_qty: "",
        actual_qty: "",
        available_stock: stockMap.get(fg.id) ?? 0,
      }));
      setBatchItems(goods);
    } catch (err) {
      console.error("Load Order Pasted IDs Preview Error:", err);
      setPreviewError(
        err.response?.data?.message || err.message || "Failed to process application IDs."
      );
    } finally {
      setPreviewLoading(false);
    }
  };

  // ==========================================
  // Project Inclusion / Exclusion Handlers
  // ==========================================
  const handleRemoveProject = (index) => {
    const projToRemove = projectsList[index];
    setProjectsList((prev) => prev.filter((_, i) => i !== index));
    setExcludedProjects((prev) => [...prev, projToRemove]);
  };

  const handleIncludeProject = (index) => {
    const projToAdd = excludedProjects[index];
    setExcludedProjects((prev) => prev.filter((_, i) => i !== index));
    setProjectsList((prev) => [...prev, projToAdd]);
  };

  const handleIncludeAllExcluded = () => {
    setProjectsList((prev) => [...prev, ...excludedProjects]);
    setExcludedProjects([]);
  };

  // ==========================================
  // Smart Invoice Number Auto-Increment Logic
  // Pure numeric (e.g. 300 -> 301 -> 302) or alphanumeric prefix
  // ==========================================
  const handleInvoiceNumberChange = (index, value) => {
    const updated = [...projectsList];
    updated[index].invoice_number = value;

    // If typing on row 0, auto-populate all subsequent rows with pure number increment!
    if (index === 0 && value.trim() !== "") {
      const trimmed = value.trim();

      // Check if value is a pure number or ends with digits
      const match = trimmed.match(/^(.*?)(\d+)$/);
      if (match) {
        const prefix = match[1];
        const startNum = parseInt(match[2], 10);
        const numLength = match[2].length;

        for (let i = 1; i < updated.length; i++) {
          const nextNum = startNum + i;
          const paddedNum = prefix ? String(nextNum).padStart(numLength, "0") : String(nextNum);
          updated[i].invoice_number = `${prefix}${paddedNum}`;
        }
      }
    }

    setProjectsList(updated);
  };

  // Fast helper to apply starting number to all projects
  const handleApplyStartingInvoiceNo = (startVal) => {
    if (!startVal) return;
    handleInvoiceNumberChange(0, startVal);
  };

  // ==========================================
  // Quantity Handlers (Govt vs Actual)
  // ==========================================
  const handleGovtQtyChange = (itemId, val) => {
    setBatchItems((prev) =>
      prev.map((it) => (it.item_id === itemId ? { ...it, govt_qty: val } : it))
    );
  };

  const handleActualQtyChange = (itemId, val) => {
    setBatchItems((prev) =>
      prev.map((it) => (it.item_id === itemId ? { ...it, actual_qty: val } : it))
    );
  };

  // 1-Click Copy Govt Counts to Actual Counts
  const handleCopyGovtToActual = () => {
    setBatchItems((prev) =>
      prev.map((it) => ({
        ...it,
        actual_qty: it.govt_qty,
      }))
    );
  };

  // Fast Reset all counts
  const handleResetCounts = () => {
    setBatchItems((prev) =>
      prev.map((it) => ({
        ...it,
        govt_qty: "",
        actual_qty: "",
      }))
    );
  };

  // Calculations
  const totalGovtQty = batchItems.reduce((sum, it) => sum + (parseFloat(it.govt_qty) || 0), 0);
  const totalActualQty = batchItems.reduce((sum, it) => sum + (parseFloat(it.actual_qty) || 0), 0);
  const activeActualItemCount = batchItems.filter((it) => parseFloat(it.actual_qty) > 0).length;

  // ==========================================
  // Commit Batch Submission
  // ==========================================
  const handleCommitBatch = async () => {
    if (!dispatchDate) {
      setCommitError("Please select a valid dispatch / invoice date.");
      return;
    }

    if (projectsList.length === 0) {
      setCommitError("No government projects found to commit.");
      return;
    }

    setCommitting(true);
    setCommitError("");

    const payload = {
      invoice_date: dispatchDate,
      notes: batchNotes.trim() || null,
      projects: projectsList.map((p) => ({
        application_id: p.application_id,
        invoice_number: p.invoice_number ? String(p.invoice_number).trim() : null,
        farmer_name: p.farmer_name,
        block: p.block,
        village: p.village,
        area_ha: p.area_ha,
      })),
      govt_items: batchItems
        .filter((it) => parseFloat(it.govt_qty) > 0)
        .map((it) => ({
          item_id: it.item_id,
          quantity: parseFloat(it.govt_qty),
          unit_price: parseFloat(it.unit_price) || 0,
        })),
      actual_items: batchItems
        .filter((it) => parseFloat(it.actual_qty) > 0)
        .map((it) => ({
          item_id: it.item_id,
          quantity: parseFloat(it.actual_qty),
          unit_price: parseFloat(it.unit_price) || 0,
        })),
    };

    try {
      const res = await api.post("/invoices/load-order/commit", payload);
      setCommitResult(res.data?.data || res.data);
      // Reset form
      setFile(null);
      setPreviewData(null);
    } catch (err) {
      console.error("Batch Commit Error:", err);
      setCommitError(
        err.response?.data?.message || err.message || "Failed to commit Load Order batch."
      );
    } finally {
      setCommitting(false);
    }
  };

  // ==========================================
  // Batch History Fetching
  // ==========================================
  const loadBatchHistory = async (page = 1) => {
    try {
      setHistoryLoading(true);
      const params = new URLSearchParams({
        page,
        limit: historyPagination.limit,
      });
      if (historySearch) params.append("search", historySearch);
      if (historyStartDate) params.append("start_date", historyStartDate);
      if (historyEndDate) params.append("end_date", historyEndDate);

      const res = await api.get(`/invoices/load-order/batches?${params.toString()}`);
      const data = res.data?.data || res.data;
      setBatches(data.batches || []);
      if (data.pagination) {
        setHistoryPagination(data.pagination);
      }
    } catch (err) {
      console.error("Failed to load batch history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "history") {
      loadBatchHistory(1);
    }
  }, [activeTab, historyStartDate, historyEndDate]);

  const handleOpenBatchDetails = async (batchId) => {
    try {
      setBatchModalLoading(true);
      const res = await api.get(`/invoices/load-order/batches/${batchId}`);
      setSelectedBatchModal(res.data?.data?.batch || res.data?.batch);
    } catch (err) {
      console.error("Failed to load batch details:", err);
    } finally {
      setBatchModalLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Navbar
        title="Upload Load Order"
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("upload")}
              className={`px-3 py-1.5 rounded-[8px] text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "upload"
                  ? "bg-[#2F6F5E] text-white shadow-xs"
                  : "bg-white text-[#52607D] border border-[#E4E1D8] hover:bg-gray-100"
              }`}
            >
              <Upload size={14} />
              <span>Upload</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("history")}
              className={`px-3 py-1.5 rounded-[8px] text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "history"
                  ? "bg-[#2F6F5E] text-white shadow-xs"
                  : "bg-white text-[#52607D] border border-[#E4E1D8] hover:bg-gray-100"
              }`}
            >
              <History size={14} />
              <span>Batch Upload History</span>
            </button>
          </div>
        }
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 overflow-y-auto">
        {/* TAB 1: UPLOAD & PREVIEW */}
        {activeTab === "upload" && (
          <div className="space-y-6">
            {/* Top Success Banner after commit */}
            {commitResult && (
              <div className="bg-emerald-50 border border-emerald-300 rounded-[12px] p-5 shadow-xs space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
                      <Check size={20} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-emerald-950">
                        Load Order Batch #{commitResult.batch_number} Committed Successfully!
                      </h3>
                      <p className="text-xs text-emerald-800 mt-0.5">
                        {commitResult.total_projects_count} projects marked as{" "}
                        <strong>INVOICED</strong> on {formatDate(commitResult.dispatch_date)}.
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setCommitResult(null);
                      setActiveTab("history");
                    }}
                    icon={History}
                  >
                    View in Batch History
                  </Button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-emerald-200 text-xs">
                  <div className="bg-white/80 p-2.5 rounded-[8px] border border-emerald-200">
                    <span className="text-[#52607D]">Total Projects:</span>
                    <p className="font-bold text-[#14213D] text-sm">
                      {commitResult.total_projects_count}
                    </p>
                  </div>
                  <div className="bg-white/80 p-2.5 rounded-[8px] border border-emerald-200">
                    <span className="text-[#52607D]">Govt On-Paper Qty:</span>
                    <p className="font-bold text-[#14213D] text-sm">
                      {commitResult.total_govt_quantity}
                    </p>
                  </div>
                  <div className="bg-white/80 p-2.5 rounded-[8px] border border-emerald-200">
                    <span className="text-[#52607D]">Actual Deducted Qty:</span>
                    <p className="font-bold text-emerald-800 text-sm">
                      {commitResult.total_actual_quantity}
                    </p>
                  </div>
                  <div className="bg-white/80 p-2.5 rounded-[8px] border border-emerald-200">
                    <span className="text-[#52607D]">Physical Items Deducted:</span>
                    <p className="font-bold text-[#14213D] text-sm">
                      {commitResult.actual_items_deducted_count} Finished Goods
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Upload & Date Card */}
            <div className="bg-white border border-[#E4E1D8] rounded-[12px] p-4 sm:p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EDEAE1] pb-3">
                <div>
                  <h3 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
                    <Truck size={18} className="text-[#2F6F5E]" />
                    <span>Upload Load Order</span>
                  </h3>
                  <p className="text-xs text-[#52607D] mt-0.5">
                    Provide Application IDs via Excel spreadsheet upload or paste directly in group.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#52607D] mb-1">
                      Dispatch / INVOICED Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={dispatchDate}
                      onChange={(e) => setDispatchDate(e.target.value)}
                      className="px-3 py-1.5 text-xs font-mono bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
                    />
                  </div>
                </div>
              </div>

              {/* Mode Toggle Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setInputMode("file")}
                  className={`px-3 py-1.5 rounded-[8px] text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    inputMode === "file"
                      ? "bg-[#2F6F5E] text-white shadow-xs"
                      : "bg-[#FAFAF8] text-[#52607D] border border-[#E4E1D8] hover:bg-[#EDEAE1]"
                  }`}
                >
                  <FileSpreadsheet size={14} />
                  <span>Upload Excel Spreadsheet</span>
                </button>

                <button
                  type="button"
                  onClick={() => setInputMode("paste")}
                  className={`px-3 py-1.5 rounded-[8px] text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    inputMode === "paste"
                      ? "bg-[#2F6F5E] text-white shadow-xs"
                      : "bg-[#FAFAF8] text-[#52607D] border border-[#E4E1D8] hover:bg-[#EDEAE1]"
                  }`}
                >
                  <FileText size={14} />
                  <span>Paste Application IDs Directly</span>
                </button>
              </div>

              {/* Input Area */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  {inputMode === "file" ? (
                    <label
                      htmlFor="loadOrderFile"
                      className="border-2 border-dashed border-[#CCD5AE] hover:border-[#2F6F5E] bg-[#FAFAF8] rounded-[10px] p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group min-h-[120px]"
                    >
                      <Upload
                        size={24}
                        className="text-[#52607D] group-hover:text-[#2F6F5E] mb-1.5 transition-colors"
                      />
                      <span className="text-xs font-bold text-[#14213D]">
                        {file ? file.name : "Click or drag & drop Load Order file here"}
                      </span>
                      <span className="text-[11px] text-[#8C97AB] mt-0.5">
                        Accepts Excel (.xlsx, .xls) containing Government Application IDs
                      </span>
                      <input
                        id="loadOrderFile"
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  ) : (
                    <div className="space-y-2">
                      <textarea
                        rows={4}
                        value={pastedAppIds}
                        onChange={(e) => setPastedAppIds(e.target.value)}
                        placeholder={`Paste Government Application IDs here (one per line, commas, or spaces)...
e.g.
H-DPR-dpr-8808954450-2026-27
H-DPR-dpr-3389958369-2026-27
H-DPR-dpr-6428267253-2025-26`}
                        className="w-full px-3 py-2 text-xs font-mono bg-[#FAFAF8] border border-[#CCD5AE] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D] leading-relaxed"
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-[#8C97AB]">
                          {pastedAppIds.trim() ? pastedAppIds.trim().split(/[\r\n,]+/).filter(Boolean).length : 0} Application IDs entered
                        </span>
                        <Button
                          type="button"
                          onClick={handlePastedIdsPreview}
                          loading={previewLoading}
                          icon={Check}
                          size="sm"
                        >
                          Match & Preview Application IDs
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-[#14213D]">
                    Lorry / Vehicle / Batch Notes
                  </label>
                  <textarea
                    rows={4}
                    value={batchNotes}
                    onChange={(e) => setBatchNotes(e.target.value)}
                    placeholder="e.g. Lorry TN-38-AX-9999, Driver Murugan, Dharmapuri Block Dispatch"
                    className="w-full px-3 py-2 text-xs bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
                  />
                </div>
              </div>

              {previewLoading && (
                <div className="p-4 text-center">
                  <SkeletonLoader count={2} />
                  <p className="text-xs text-[#52607D] mt-2 font-medium">
                    Matching Application IDs against database and verifying Work Order status...
                  </p>
                </div>
              )}

              {previewError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-[8px] text-xs text-rose-800 flex items-center gap-2">
                  <AlertTriangle size={16} className="shrink-0" />
                  <span>{previewError}</span>
                </div>
              )}
            </div>

            {/* PREVIEW SECTIONS: Show only when previewData exists */}
            {previewData && (
              <div className="space-y-4">
                {/* SECTION 1: Parsed Government Application IDs & Smart Invoice Numbers */}
                <div className="bg-white border border-[#E4E1D8] rounded-[12px] p-4 sm:p-5 shadow-xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EDEAE1] pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
                        <FileText size={18} className="text-[#2F6F5E]" />
                        <span>Parsed Government Project IDs & Sequential Invoice Numbers</span>
                      </h3>
                      <p className="text-xs text-[#52607D] mt-0.5">
                        Found <strong>{projectsList.length} Government Applications</strong> in this
                        batch.
                      </p>
                    </div>

                    {/* Quick helper input */}
                    <div className="flex items-center gap-2 bg-[#FAFAF8] p-1.5 rounded-[8px] border border-[#E4E1D8] self-start sm:self-auto">
                      <span className="text-[11px] font-semibold text-[#52607D] pl-1">
                        Starting Number:
                      </span>
                      <input
                        type="text"
                        placeholder="e.g. 300"
                        id="quickStartNum"
                        className="w-24 px-2 py-1 text-xs font-mono font-bold bg-white border border-[#CCD5AE] rounded focus:outline-none text-[#14213D]"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleApplyStartingInvoiceNo(e.currentTarget.value);
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const val = document.getElementById("quickStartNum")?.value;
                          handleApplyStartingInvoiceNo(val);
                        }}
                        className="px-2.5 py-1 text-[11px] font-bold bg-[#2F6F5E] text-white rounded cursor-pointer hover:bg-[#275c4e]"
                      >
                        Auto-Fill All
                      </button>
                    </div>
                  </div>

                  {/* Projects Table with full mobile horizontal scroll support */}
                  <div className="border border-[#EDEAE1] rounded-[10px] overflow-x-auto max-h-[420px] overflow-y-auto w-full">
                    <table className="w-full text-left text-xs border-collapse table-auto">
                      <thead className="bg-[#FAFAF8] border-b border-[#EDEAE1] sticky top-0 z-10 text-[#52607D] uppercase font-semibold text-[10px] tracking-wider">
                        <tr>
                          <th className="py-2.5 px-3 text-center w-12 shrink-0">#</th>
                          <th className="py-2.5 px-4 w-1/4 min-w-[220px]">Application ID</th>
                          <th className="py-2.5 px-4 w-1/3 min-w-[200px]">Farmer & Location</th>
                          <th className="py-2.5 px-4 w-1/5 min-w-[170px]">DB Status</th>
                          <th className="py-2.5 px-4 w-1/5 min-w-[150px]">Invoice Number</th>
                          <th className="py-2.5 px-3 text-center w-14 shrink-0">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EDEAE1]">
                        {projectsList.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-6 text-center text-xs text-[#52607D]">
                              No projects currently in this batch. You can add projects from the excluded list below.
                            </td>
                          </tr>
                        ) : (
                          projectsList.map((proj, idx) => (
                            <tr key={proj.application_id} className="hover:bg-[#F9F8F5]">
                              <td className="py-2.5 px-3 text-center font-mono text-[#8C97AB]">
                                {idx + 1}
                              </td>
                              <td className="py-2.5 px-4 whitespace-nowrap">
                                <span className="font-mono font-bold text-[#14213D]">
                                  {proj.application_id}
                                </span>
                              </td>
                              <td className="py-2.5 px-4">
                                <div className="font-semibold text-[#14213D]">
                                  {proj.farmer_name || "—"}
                                </div>
                                <div className="text-[11px] text-[#52607D]">
                                  {[proj.village, proj.block, proj.district]
                                    .filter(Boolean)
                                    .join(", ") || "—"}
                                </div>
                              </td>
                              <td className="py-2.5 px-4 whitespace-nowrap">
                                {proj.exists_in_db ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                    <CheckCircle2 size={10} /> Linked ({proj.current_status})
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                                    + New Project
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-4">
                                <input
                                  type="text"
                                  placeholder={`e.g. ${300 + idx}`}
                                  value={proj.invoice_number}
                                  onChange={(e) => handleInvoiceNumberChange(idx, e.target.value)}
                                  className="w-full px-2.5 py-1.5 text-xs font-mono font-bold bg-white border border-[#CCD5AE] rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
                                />
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveProject(idx)}
                                  className="p-1 text-gray-400 hover:text-rose-600 rounded-[6px] hover:bg-rose-50 transition-colors cursor-pointer"
                                  title="Remove from current batch (can be re-added below)"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Excluded / Other Status Projects Accordion Card */}
                  {excludedProjects.length > 0 && (
                    <div className="mt-4 p-3.5 bg-amber-50/50 border border-amber-200/80 rounded-[10px] space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/60 pb-2.5">
                        <div>
                          <h4 className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                            <AlertTriangle size={15} className="text-amber-600" />
                            <span>
                              Excluded / Non-Work-Order Projects ({excludedProjects.length} Found)
                            </span>
                          </h4>
                          <p className="text-[11px] text-amber-800/90 mt-0.5">
                            Only projects in <strong>Issued Work Order</strong> status are included by default. You can selectively add any project below if you want to invoice it today, or leave it ignored.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={handleIncludeAllExcluded}
                          className="px-2.5 py-1 text-[11px] font-bold bg-amber-700 text-white rounded-[6px] hover:bg-amber-800 cursor-pointer self-start sm:self-auto shrink-0 transition-colors flex items-center gap-1"
                        >
                          <Plus size={12} />
                          <span>Include All ({excludedProjects.length})</span>
                        </button>
                      </div>

                      <div className="border border-amber-200/80 rounded-[8px] overflow-x-auto max-h-[260px] overflow-y-auto bg-white">
                        <table className="w-full text-left text-xs border-collapse table-auto">
                          <thead className="bg-[#FAFAF8] border-b border-[#EDEAE1] sticky top-0 z-10 text-[#52607D] uppercase font-semibold text-[10px] tracking-wider">
                            <tr>
                              <th className="py-2 px-3 text-center w-12 shrink-0">#</th>
                              <th className="py-2 px-3 min-w-[220px]">Application ID</th>
                              <th className="py-2 px-3 min-w-[200px]">Farmer & Location</th>
                              <th className="py-2 px-3 min-w-[180px]">Current DB Status</th>
                              <th className="py-2 px-3 text-center w-28 shrink-0">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#EDEAE1]">
                            {excludedProjects.map((ep, eIdx) => (
                              <tr key={ep.application_id} className="hover:bg-amber-50/20">
                                <td className="py-2 px-3 text-center font-mono text-[#8C97AB]">
                                  {eIdx + 1}
                                </td>
                                <td className="py-2 px-3 whitespace-nowrap">
                                  <span className="font-mono font-bold text-[#14213D]">
                                    {ep.application_id}
                                  </span>
                                </td>
                                <td className="py-2 px-3">
                                  <div className="font-semibold text-[#14213D]">
                                    {ep.farmer_name || "—"}
                                  </div>
                                  <div className="text-[10px] text-[#52607D]">
                                    {[ep.village, ep.block, ep.district]
                                      .filter(Boolean)
                                      .join(", ") || "—"}
                                  </div>
                                </td>
                                <td className="py-2 px-3 whitespace-nowrap">
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-full border border-amber-300">
                                    {ep.current_status || "Not in DB"}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleIncludeProject(eIdx)}
                                    className="px-2 py-1 rounded text-[10px] font-bold bg-[#EAF3F0] text-[#2F6F5E] border border-[#2F6F5E]/30 hover:bg-[#2F6F5E] hover:text-white transition-colors cursor-pointer inline-flex items-center gap-1"
                                    title="Add this project to current invoice batch"
                                  >
                                    <Plus size={10} />
                                    Add
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                {/* SECTION 2: Batch Material Counts (Govt vs Actual Tabs) */}
                <div className="bg-white border border-[#E4E1D8] rounded-[12px] p-4 sm:p-5 shadow-xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EDEAE1] pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
                        <Package size={18} className="text-[#2F6F5E]" />
                        <span>Batch Finished Goods Material Quantities</span>
                      </h3>
                      <p className="text-xs text-[#52607D] mt-0.5">
                        Enter overall batch material counts for this lorry shipment.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={handleCopyGovtToActual}
                        className="px-3 py-1.5 rounded-[8px] text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 cursor-pointer flex items-center gap-1.5 transition-colors"
                        title="Quickly copies all Govt Counts to Actual Dispatched counts"
                      >
                        <Copy size={13} />
                        <span>Copy Govt ➔ Actual</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleResetCounts}
                        className="px-2.5 py-1.5 rounded-[8px] text-xs font-medium text-[#52607D] hover:bg-gray-100 border border-[#E4E1D8] cursor-pointer"
                      >
                        Reset All
                      </button>
                    </div>
                  </div>

                  {/* Materials Table with full mobile horizontal scroll support */}
                  <div className="border border-[#EDEAE1] rounded-[10px] overflow-x-auto w-full">
                    <table className="w-full min-w-[650px] text-left text-xs border-collapse">
                      <thead className="bg-[#FAFAF8] border-b border-[#EDEAE1] text-[#52607D] uppercase font-semibold text-[10px] tracking-wider">
                        <tr>
                          <th className="py-3 px-4">Finished Good Item</th>
                          <th className="py-3 px-4">Category</th>
                          <th className="py-3 px-4 text-center">Unit</th>
                          <th className="py-3 px-4 text-center">Stock On-Hand</th>
                          <th className="py-3 px-4 text-right w-44 bg-amber-50/40 border-l border-amber-200">
                            Govt Count (On-Paper)
                          </th>
                          <th className="py-3 px-4 text-right w-48 bg-emerald-50/40 border-l border-emerald-200">
                            Actual Count (Physical) 🚚
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EDEAE1]">
                        {batchItems.map((item) => {
                          const actQty = parseFloat(item.actual_qty) || 0;
                          const hasStockWarning = actQty > 0 && actQty > item.available_stock;

                          return (
                            <tr
                              key={item.item_id}
                              className={`hover:bg-[#F9F8F5] ${
                                actQty > 0 ? "bg-emerald-50/15" : ""
                              }`}
                            >
                              <td className="py-2.5 px-4 font-bold text-[#14213D]">
                                <div>{item.name}</div>
                                <div className="text-[10px] font-mono text-[#8C97AB]">
                                  {item.code}
                                </div>
                              </td>

                              <td className="py-2.5 px-4 text-[#52607D]">{item.category || "—"}</td>

                              <td className="py-2.5 px-4 text-center font-mono font-semibold text-[#52607D]">
                                {item.unit}
                              </td>

                              <td className="py-2.5 px-4 text-center">
                                <span
                                  className={`font-mono font-bold text-xs px-2 py-0.5 rounded-full ${
                                    item.available_stock > 0
                                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                      : "bg-gray-100 text-gray-500"
                                  }`}
                                >
                                  {item.available_stock} {item.unit}
                                </span>
                              </td>

                              {/* Govt Count Input */}
                              <td className="py-2.5 px-4 text-right bg-amber-50/20 border-l border-amber-200">
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  placeholder="0"
                                  value={item.govt_qty}
                                  onChange={(e) =>
                                    handleGovtQtyChange(item.item_id, e.target.value)
                                  }
                                  className="w-full px-2.5 py-1.5 text-xs text-right font-mono font-bold bg-white border border-amber-300 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-amber-500 text-amber-950"
                                />
                              </td>

                              {/* Actual Count Input */}
                              <td className="py-2.5 px-4 text-right bg-emerald-50/20 border-l border-emerald-200">
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  placeholder="0"
                                  value={item.actual_qty}
                                  onChange={(e) =>
                                    handleActualQtyChange(item.item_id, e.target.value)
                                  }
                                  className={`w-full px-2.5 py-1.5 text-xs text-right font-mono font-bold bg-white border rounded-[6px] focus:outline-none focus:ring-2 text-emerald-950 ${
                                    hasStockWarning
                                      ? "border-rose-400 focus:ring-rose-500 bg-rose-50/40"
                                      : "border-emerald-400 focus:ring-[#2F6F5E]"
                                  }`}
                                />
                                {hasStockWarning && (
                                  <div className="text-[10px] text-rose-600 font-semibold mt-0.5 text-right">
                                    Exceeds on-hand ({item.available_stock})
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* SECTION 3: Summary & Confirmation */}
                <div className="bg-white border border-[#E4E1D8] rounded-[12px] p-4 sm:p-5 shadow-xs space-y-3">
                  <h3 className="text-sm font-bold text-[#14213D] border-b border-[#EDEAE1] pb-3">
                    Batch Dispatch Summary & Inventory Impact
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                    <div className="bg-[#FAFAF8] p-4 rounded-[10px] border border-[#E4E1D8]">
                      <div className="text-xs font-semibold text-[#52607D]">
                        Total Govt Projects
                      </div>
                      <div className="text-xl font-extrabold font-mono text-[#14213D] mt-1">
                        {projectsList.length}
                      </div>
                      <div className="text-[11px] text-[#8C97AB] mt-0.5">
                        Status: <strong>INVOICED</strong>
                      </div>
                    </div>

                    <div className="bg-amber-50/60 p-4 rounded-[10px] border border-amber-200">
                      <div className="text-xs font-semibold text-amber-900">Total Govt Qty</div>
                      <div className="text-xl font-extrabold font-mono text-amber-950 mt-1">
                        {totalGovtQty}
                      </div>
                      <div className="text-[11px] text-amber-800 mt-0.5">On-Paper Scheme Quota</div>
                    </div>

                    <div className="bg-emerald-50 p-4 rounded-[10px] border border-emerald-200">
                      <div className="text-xs font-semibold text-emerald-900">
                        Actual Dispatched Qty
                      </div>
                      <div className="text-xl font-extrabold font-mono text-emerald-950 mt-1">
                        {totalActualQty}
                      </div>
                      <div className="text-[11px] text-emerald-800 mt-0.5">
                        {activeActualItemCount} Finished Goods to Deduct
                      </div>
                    </div>

                    <div className="bg-[#2F6F5E] p-4 rounded-[10px] text-white shadow-xs">
                      <div className="text-xs font-semibold text-white/80">INVOICED Date</div>
                      <div className="text-lg font-extrabold font-mono text-white mt-1">
                        {formatDate(dispatchDate)}
                      </div>
                      <div className="text-[11px] text-white/70 mt-0.5">Scheme Status Date</div>
                    </div>
                  </div>

                  {commitError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-[8px] text-xs text-rose-800 flex items-center gap-2">
                      <AlertTriangle size={16} className="shrink-0" />
                      <span>{commitError}</span>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-[#EDEAE1]">
                    <div className="text-xs text-[#52607D]">
                      Clicking commit will link all {projectsList.length} projects to INVOICED
                      status and deduct {totalActualQty} units from physical inventory.
                    </div>

                    <Button
                      type="button"
                      onClick={handleCommitBatch}
                      loading={committing}
                      icon={Check}
                      size="lg"
                    >
                      Confirm & Commit Load Order Batch
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: BATCH UPLOAD HISTORY */}
        {activeTab === "history" && (
          <div className="bg-white border border-[#E4E1D8] rounded-[12px] p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EDEAE1] pb-4">
              <div>
                <h3 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
                  <History size={18} className="text-[#2F6F5E]" />
                  <span>Load Order Batch Dispatches History</span>
                </h3>
                <p className="text-xs text-[#52607D] mt-0.5">
                  Complete history of past Load Order uploads with linked project IDs and material
                  counts.
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8C97AB]"
                  />
                  <input
                    type="text"
                    placeholder="Search Batch #..."
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && loadBatchHistory(1)}
                    className="pl-8 pr-3 py-1.5 text-xs bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D] w-44"
                  />
                </div>

                <input
                  type="date"
                  value={historyStartDate}
                  onChange={(e) => setHistoryStartDate(e.target.value)}
                  className="px-2.5 py-1.5 text-xs font-mono bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none text-[#14213D]"
                />

                <input
                  type="date"
                  value={historyEndDate}
                  onChange={(e) => setHistoryEndDate(e.target.value)}
                  className="px-2.5 py-1.5 text-xs font-mono bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none text-[#14213D]"
                />

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => loadBatchHistory(1)}
                  icon={RefreshCw}
                >
                  Filter
                </Button>
              </div>
            </div>

            {historyLoading ? (
              <SkeletonLoader count={5} />
            ) : batches.length === 0 ? (
              <EmptyState
                title="No Load Order Batches Found"
                description="No load order dispatches have been recorded yet or matched the filter."
              />
            ) : (
              <div className="border border-[#EDEAE1] rounded-[10px] overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#FAFAF8] border-b border-[#EDEAE1] text-[#52607D] uppercase font-semibold text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Batch Number</th>
                      <th className="py-3 px-4">Dispatch Date</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-center">Projects</th>
                      <th className="py-3 px-4 text-right">Govt Qty</th>
                      <th className="py-3 px-4 text-right">Actual Qty</th>
                      <th className="py-3 px-4">Notes</th>
                      <th className="py-3 px-4 text-center w-36">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDEAE1]">
                    {batches.map((b) => (
                      <tr key={b.id} className={`hover:bg-[#F9F8F5] ${b.is_cancelled ? "opacity-60 bg-gray-50/50" : ""}`}>
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-[#14213D]">
                            {b.batch_number}
                          </span>
                          <div className="text-[10px] text-[#8C97AB]">
                            {formatDateTime(b.created_at)}
                          </div>
                        </td>

                        <td className="py-3 px-4 font-mono font-semibold text-[#14213D]">
                          {formatDate(b.dispatch_date)}
                        </td>

                        <td className="py-3 px-4 text-center">
                          {b.is_cancelled ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              ✕ Cancelled
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              ✓ Invoiced
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                            {b.total_projects_count} Projects
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right font-mono text-amber-900 font-semibold">
                          {b.total_govt_quantity}
                        </td>

                        <td className="py-3 px-4 text-right font-mono text-emerald-800 font-bold">
                          {b.total_actual_quantity}
                        </td>

                        <td className="py-3 px-4 text-[#52607D] truncate max-w-xs">
                          {b.is_cancelled && b.cancellation_reason
                            ? `Cancelled: ${b.cancellation_reason}`
                            : b.notes || "—"}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenBatchDetails(b.id)}
                              className="px-2 py-1 text-xs font-bold text-[#2F6F5E] bg-[#EAF3F0] hover:bg-[#d8ece6] rounded-[6px] transition-colors cursor-pointer inline-flex items-center gap-1"
                            >
                              <Eye size={12} />
                              <span>Details</span>
                            </button>

                            {!b.is_cancelled && (
                              <button
                                type="button"
                                onClick={() => handleOpenCancelModal(b)}
                                className="px-2 py-1 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-[6px] transition-colors cursor-pointer inline-flex items-center gap-1"
                                title="Cancel batch, reverse inventory stock & unlink invoices"
                              >
                                <Trash2 size={12} />
                                <span>Cancel</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {batches.length > 0 && (
              <Pagination
                currentPage={historyPagination.page}
                totalPages={historyPagination.totalPages}
                onPageChange={(p) => loadBatchHistory(p)}
                totalItems={historyPagination.total}
              />
            )}
          </div>
        )}
      </main>

      {/* Batch Details Modal */}
      <Modal
        isOpen={Boolean(selectedBatchModal)}
        onClose={() => setSelectedBatchModal(null)}
        title={`Load Order Batch Details (${selectedBatchModal?.batch_number || ""})`}
        maxWidth="max-w-4xl"
      >
        {selectedBatchModal && (
          <div className="space-y-5">
            {selectedBatchModal.is_cancelled && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-[8px] text-xs text-rose-800 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle size={14} className="text-rose-600" />
                  <span>This Batch was Cancelled on {formatDateTime(selectedBatchModal.cancelled_at)}</span>
                </div>
                <div>Reason: <strong>{selectedBatchModal.cancellation_reason || "Cancelled"}</strong></div>
                <div className="text-[11px] text-rose-700">All linked invoice numbers were removed from government projects and inventory stock was restored.</div>
              </div>
            )}

            {/* Top Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-[#FAFAF8] p-3 rounded-[8px] border border-[#E4E1D8]">
                <span className="text-[#52607D]">Dispatch Date:</span>
                <p className="font-bold text-[#14213D] text-sm">
                  {formatDate(selectedBatchModal.dispatch_date)}
                </p>
              </div>
              <div className="bg-[#FAFAF8] p-3 rounded-[8px] border border-[#E4E1D8]">
                <span className="text-[#52607D]">Total Projects:</span>
                <p className="font-bold text-[#14213D] text-sm">
                  {selectedBatchModal.total_projects_count}
                </p>
              </div>
              <div className="bg-amber-50 p-3 rounded-[8px] border border-amber-200">
                <span className="text-amber-900">Total Govt Qty:</span>
                <p className="font-bold text-amber-950 text-sm">
                  {selectedBatchModal.total_govt_quantity}
                </p>
              </div>
              <div className="bg-emerald-50 p-3 rounded-[8px] border border-emerald-200">
                <span className="text-emerald-900">Total Actual Qty:</span>
                <p className="font-bold text-emerald-950 text-sm">
                  {selectedBatchModal.total_actual_quantity}
                </p>
              </div>
            </div>

            {selectedBatchModal.notes && (
              <div className="p-3 bg-[#FAFAF8] rounded-[8px] border border-[#E4E1D8] text-xs text-[#14213D]">
                <span className="font-bold text-[#52607D]">Batch Notes: </span>
                {selectedBatchModal.notes}
              </div>
            )}

            {/* Section A: Linked Projects Snapshot */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-[#14213D] uppercase tracking-wider">
                Linked Government Project IDs & Invoices (
                {selectedBatchModal.projects_snapshot?.length || 0})
              </h4>
              <div className="border border-[#EDEAE1] rounded-[8px] max-h-48 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAFAF8] text-[#52607D] text-[10px] uppercase font-semibold">
                    <tr>
                      <th className="py-2 px-3">#</th>
                      <th className="py-2 px-3">Application ID</th>
                      <th className="py-2 px-3">Farmer & Location</th>
                      <th className="py-2 px-3">Invoice Number</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDEAE1]">
                    {(selectedBatchModal.projects_snapshot || []).map((p, idx) => (
                      <tr key={idx} className="hover:bg-[#F9F8F5]">
                        <td className="py-1.5 px-3 font-mono text-[#8C97AB]">{idx + 1}</td>
                        <td className="py-1.5 px-3 font-mono font-bold text-[#14213D]">
                          {p.application_id}
                        </td>
                        <td className="py-1.5 px-3 text-[#52607D]">
                          {p.farmer_name || "—"}
                          {p.village ? ` (${p.village})` : ""}
                        </td>
                        <td className="py-1.5 px-3 font-mono font-bold text-[#2F6F5E]">
                          {p.invoice_number ? `#${p.invoice_number}` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section B: Govt vs Actual Items Snapshot */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-[#14213D] uppercase tracking-wider">
                Batch Materials Breakdown (Govt vs Actual)
              </h4>
              <div className="border border-[#EDEAE1] rounded-[8px] max-h-56 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAFAF8] text-[#52607D] text-[10px] uppercase font-semibold">
                    <tr>
                      <th className="py-2 px-3">Material Item</th>
                      <th className="py-2 px-3 text-center">Unit</th>
                      <th className="py-2 px-3 text-right bg-amber-50/40">Govt Qty</th>
                      <th className="py-2 px-3 text-right bg-emerald-50/40">Actual Dispatched</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDEAE1]">
                    {/* Combine unique items from both snapshots */}
                    {(() => {
                      const itemMap = new Map();
                      (selectedBatchModal.govt_items_snapshot || []).forEach((g) => {
                        itemMap.set(g.item_id, {
                          name: g.name,
                          unit: g.unit,
                          govt_qty: g.quantity,
                          actual_qty: 0,
                        });
                      });
                      (selectedBatchModal.actual_items_snapshot || []).forEach((a) => {
                        if (itemMap.has(a.item_id)) {
                          itemMap.get(a.item_id).actual_qty = a.quantity;
                        } else {
                          itemMap.set(a.item_id, {
                            name: a.name,
                            unit: a.unit,
                            govt_qty: 0,
                            actual_qty: a.quantity,
                          });
                        }
                      });

                      return Array.from(itemMap.values()).map((row, idx) => (
                        <tr key={idx} className="hover:bg-[#F9F8F5]">
                          <td className="py-2 px-3 font-semibold text-[#14213D]">{row.name}</td>
                          <td className="py-2 px-3 text-center font-mono text-[#52607D]">
                            {row.unit}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-amber-950 font-bold bg-amber-50/20">
                            {row.govt_qty}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-emerald-950 font-bold bg-emerald-50/20">
                            {row.actual_qty}
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#EDEAE1]">
              {!selectedBatchModal.is_cancelled ? (
                <button
                  type="button"
                  onClick={() => handleOpenCancelModal(selectedBatchModal)}
                  className="px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-[8px] transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Trash2 size={14} />
                  <span>Cancel & Reverse Batch</span>
                </button>
              ) : (
                <div />
              )}

              <Button variant="secondary" onClick={() => setSelectedBatchModal(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Batch Cancellation Confirmation Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title={`Cancel Load Order Batch #${batchToCancel?.batch_number || ""}`}
      >
        <form onSubmit={handleConfirmCancelBatch} className="space-y-4">
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-[8px] text-xs text-rose-900 space-y-2">
            <div className="font-bold flex items-center gap-1.5 text-rose-950">
              <AlertTriangle size={16} className="text-rose-600 shrink-0" />
              <span>Are you sure you want to cancel this load order batch?</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-rose-800 text-[11px]">
              <li>
                <strong>Unlinks & Clears</strong> invoice numbers on all {batchToCancel?.total_projects_count} projects and reverts status to <strong>Issued Work Order</strong>.
              </li>
              <li>
                <strong>Restores & Reverses</strong> {batchToCancel?.total_actual_quantity} units of actual finished goods back to on-hand inventory stock.
              </li>
            </ul>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#14213D] mb-1">
              Reason for Cancellation (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Uploaded incorrect file / Shipment cancelled"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-rose-500 text-[#14213D]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#EDEAE1]">
            <Button variant="secondary" type="button" onClick={() => setCancelModalOpen(false)}>
              Keep Batch
            </Button>
            <button
              type="submit"
              disabled={cancelling}
              className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-[8px] transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <Trash2 size={13} />
              <span>{cancelling ? "Reversing..." : "Confirm Cancellation"}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default LoadOrderUploadPage;

