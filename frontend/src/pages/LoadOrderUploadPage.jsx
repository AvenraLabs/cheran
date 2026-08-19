import React, { useState } from "react";
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
} from "lucide-react";
import api from "../api/client.js";
import Navbar from "../components/layout/Navbar.jsx";
import MetricCard from "../components/common/MetricCard.jsx";
import Button from "../components/common/Button.jsx";
import { formatDate } from "../utils/dates.js";

export function LoadOrderUploadPage() {
  const [file, setFile] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewError, setPreviewError] = useState("");

  // Invoice Date (defaults to today's date in Asia/Kolkata)
  const [invoiceDate, setInvoiceDate] = useState(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date())
  );

  // Available finished goods master catalog
  const [availableCatalog, setAvailableCatalog] = useState([]);
  const [selectedCatalogId, setSelectedCatalogId] = useState("");

  // Per-project items map: { [applicationId]: [ { item_id, name, category, unit_symbol, unit_price, quantity, line_total } ] }
  const [projectItemsMap, setProjectItemsMap] = useState({});
  const [activeAppId, setActiveAppId] = useState(null);

  const [committing, setCommitting] = useState(false);
  const [commitResult, setCommitResult] = useState(null);
  const [commitError, setCommitError] = useState("");
  const [notes, setNotes] = useState("");

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
      const res = await api.post("/invoices/load-order/preview", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const data = res.data || res;
      setPreviewData(data);
      if (data.defaultInvoiceDate) {
        setInvoiceDate(data.defaultInvoiceDate);
      }

      const goods = data.availableFinishedGoods || [];
      setAvailableCatalog(goods);

      // Initialize each project with its own full list of finished goods
      const initialMap = {};
      (data.projects || []).forEach((proj) => {
        initialMap[proj.application_id] = goods.map((g) => ({
          item_id: g.id,
          name: g.name,
          category: g.category,
          unit_symbol: g.unit_symbol,
          unit_price: g.unit_price,
          quantity: 0,
          line_total: 0,
        }));
      });

      setProjectItemsMap(initialMap);
      if (data.projects && data.projects.length > 0) {
        setActiveAppId(data.projects[0].application_id);
      }
    } catch (err) {
      console.error("Preview load order error:", err);
      setPreviewError(err.response?.data?.message || err.message || "Failed to parse Load Order Excel.");
      setPreviewData(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const activeItems = activeAppId ? projectItemsMap[activeAppId] || [] : [];

  const handleQuantityChange = (itemId, val) => {
    if (!activeAppId) return;
    const qty = parseFloat(val) || 0;

    setProjectItemsMap((prev) => {
      const currentList = prev[activeAppId] || [];
      const updatedList = currentList.map((item) => {
        if (item.item_id === itemId) {
          const lineTotal = Math.round(qty * (item.unit_price || 0) * 100) / 100;
          return { ...item, quantity: val, line_total: lineTotal };
        }
        return item;
      });
      return { ...prev, [activeAppId]: updatedList };
    });
  };

  const handleRemoveItem = (itemId) => {
    if (!activeAppId) return;
    setProjectItemsMap((prev) => {
      const currentList = prev[activeAppId] || [];
      return {
        ...prev,
        [activeAppId]: currentList.filter((it) => it.item_id !== itemId),
      };
    });
  };

  const handleAddCatalogItem = () => {
    if (!activeAppId || !selectedCatalogId) return;
    const catItem = availableCatalog.find((c) => c.id === selectedCatalogId);
    if (!catItem) return;

    setProjectItemsMap((prev) => {
      const currentList = prev[activeAppId] || [];
      if (currentList.some((it) => it.item_id === catItem.id)) return prev;

      return {
        ...prev,
        [activeAppId]: [
          ...currentList,
          {
            item_id: catItem.id,
            name: catItem.name,
            category: catItem.category,
            unit_symbol: catItem.unit_symbol,
            unit_price: catItem.unit_price,
            quantity: 0,
            line_total: 0,
          },
        ],
      };
    });
    setSelectedCatalogId("");
  };

  // Copy current active project items/quantities to all other projects
  const handleCopyItemsToAll = () => {
    if (!activeAppId) return;
    const templateItems = projectItemsMap[activeAppId] || [];

    setProjectItemsMap((prev) => {
      const updatedMap = { ...prev };
      Object.keys(updatedMap).forEach((appId) => {
        updatedMap[appId] = templateItems.map((it) => ({ ...it }));
      });
      return updatedMap;
    });
  };

  // Helper to calculate totals for any item array
  const calculateProjectTotals = (itemList) => {
    const net = Math.round(
      (itemList || []).reduce((sum, it) => sum + (parseFloat(it.line_total) || 0), 0) * 100
    ) / 100;
    const fittings = Math.round(((net * 5.0) / 100.0) * 100) / 100;
    const subtotal = Math.round((net + fittings) * 100) / 100;
    const gst = Math.round(((subtotal * 5.0) / 100.0) * 100) / 100;
    const grand = Math.round((subtotal + gst) * 100) / 100;
    const activeCount = (itemList || []).filter((it) => parseFloat(it.quantity) > 0).length;

    return { net, fittings, subtotal, gst, grand, activeCount };
  };

  const activeTotals = calculateProjectTotals(activeItems);

  // Overall batch grand totals across all projects
  const allProjects = previewData?.projects || [];
  const batchSummary = allProjects.reduce(
    (acc, proj) => {
      const pItems = projectItemsMap[proj.application_id] || [];
      const pTot = calculateProjectTotals(pItems);
      acc.totalNet += pTot.net;
      acc.totalFittings += pTot.fittings;
      acc.totalGst += pTot.gst;
      acc.grandTotal += pTot.grand;
      return acc;
    },
    { totalNet: 0, totalFittings: 0, totalGst: 0, grandTotal: 0 }
  );

  const handleCommit = async () => {
    if (!previewData?.projects || previewData.projects.length === 0) return;

    try {
      setCommitting(true);
      setCommitError("");

      const payloadProjects = previewData.projects.map((p) => {
        const pItems = projectItemsMap[p.application_id] || [];
        return {
          application_id: p.application_id,
          farmer_name: p.farmer_name,
          block: p.block,
          village: p.village,
          area_ha: p.area_ha,
          items: pItems.map((it) => ({
            item_id: it.item_id,
            quantity: parseFloat(it.quantity) || 0,
            unit_price: it.unit_price,
          })),
        };
      });

      const payload = {
        invoice_date: invoiceDate,
        projects: payloadProjects,
        fittings_percentage: 5.0,
        gst_percentage: 5.0,
        notes: notes.trim() || `Daily Load Order Dispatch (${invoiceDate})`,
      };

      const res = await api.post("/invoices/load-order/commit", payload);
      setCommitResult(res.data || res);
    } catch (err) {
      console.error("Load order commit error:", err);
      setCommitError(err.response?.data?.message || err.message || "Failed to commit Load Order.");
    } finally {
      setCommitting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreviewData(null);
    setPreviewError("");
    setCommitResult(null);
    setCommitError("");
    setProjectItemsMap({});
    setActiveAppId(null);
  };

  const activeProject = allProjects.find((p) => p.application_id === activeAppId);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Navbar
        title="Load Order Upload"
        actions={
          previewData && (
            <Button variant="secondary" icon={RefreshCw} onClick={handleReset}>
              Reset
            </Button>
          )
        }
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 overflow-y-auto">
        {/* Upload & Date Control Card */}
        <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-6 shadow-[0_1px_2px_rgba(20,33,61,0.04)] space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EDEAE1] pb-4">
            <div className="flex items-center gap-2">
              <FileSpreadsheet size={18} className="text-[#2F6F5E]" />
              <h2 className="text-sm font-bold font-display text-[#14213D]">
                Daily Load Order File (`.xls`, `.xlsx`)
              </h2>
            </div>

            {/* Editable Invoice / INVOICED Date */}
            <div className="flex items-center gap-2 self-start sm:self-auto bg-[#FAFAF8] p-2 rounded-[8px] border border-[#E4E1D8]">
              <Calendar size={16} className="text-[#2F6F5E]" />
              <span className="text-xs font-semibold text-[#14213D]">Invoice Date:</span>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="text-xs font-mono font-bold bg-white border border-[#CCD0DC] rounded px-2 py-1 text-[#14213D] focus:outline-none focus:ring-1 focus:ring-[#2F6F5E]"
              />
            </div>
          </div>

          {!previewData && (
            <div className="border-2 border-dashed border-[#CCD0DC] hover:border-[#2F6F5E] bg-[#FAFAF8] rounded-[8px] p-6 sm:p-8 text-center transition-colors">
              <input
                type="file"
                id="load-order-file"
                accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={handleFileUpload}
                className="hidden"
              />
              <label
                htmlFor="load-order-file"
                className="cursor-pointer flex flex-col items-center justify-center space-y-3"
              >
                <div className="w-12 h-12 rounded-full bg-[#EAF3F0] flex items-center justify-center text-[#2F6F5E]">
                  <Upload size={24} />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold text-[#14213D] hover:underline">
                    {previewLoading ? "Parsing Load Order Sheet..." : "Click to select or drag & drop Load Order XLS"}
                  </span>
                  <p className="text-[11px] text-[#52607D]">
                    Auto-detects all Government Application IDs in the sheet
                  </p>
                </div>
              </label>
            </div>
          )}

          {previewError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-[8px] text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle size={16} />
              <span>{previewError}</span>
            </div>
          )}

          {commitError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-[8px] text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle size={16} />
              <span>{commitError}</span>
            </div>
          )}
        </div>

        {/* Commit Success Banner */}
        {commitResult && (
          <div className="bg-white border border-[#2F6F5E]/30 rounded-[10px] p-6 shadow-sm space-y-5 bg-[#FAFAF8]/50">
            <div className="flex items-center gap-2.5 text-[#2F6F5E]">
              <CheckCircle2 size={22} />
              <div>
                <h3 className="text-sm font-bold text-[#14213D]">
                  Load Order Invoices Committed Successfully!
                </h3>
                <p className="text-xs text-[#52607D]">
                  All {commitResult.data?.totalProjectsProcessed || allProjects.length} projects updated to INVOICED on <strong className="text-[#14213D]">{formatDate(invoiceDate)}</strong> with individualized materials and 5% + 5% breakdown.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <MetricCard
                title="Projects Processed"
                value={commitResult.data?.totalProjectsProcessed || allProjects.length}
                subtitle="Application IDs"
                icon={FileSpreadsheet}
              />
              <MetricCard
                title="New Projects Created"
                value={commitResult.data?.newProjectsCreated || 0}
                subtitle="Status = INVOICED"
                icon={Layers}
              />
              <MetricCard
                title="Invoices Generated"
                value={commitResult.data?.invoicesCreated || allProjects.length}
                subtitle="Posted to projects"
                icon={Database}
              />
              <MetricCard
                title="Total Dispatch Batch"
                value={`₹${(commitResult.data?.totalBatchInvoiceAmount || batchSummary.grandTotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
                subtitle="All projects combined"
                icon={IndianRupee}
              />
            </div>
          </div>
        )}

        {/* Interactive Per-Project Configuration */}
        {previewData && !commitResult && (
          <div className="space-y-6">
            {/* Batch Summary Top Card */}
            <div className="bg-[#FAFAF8] border border-[#E4E1D8] rounded-[10px] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-mono">
                <div>
                  <span className="text-[#52607D] font-sans">Projects:</span>{" "}
                  <strong className="text-[#14213D] text-sm">{allProjects.length}</strong>
                </div>
                <div>
                  <span className="text-[#52607D] font-sans">Total Net:</span>{" "}
                  <strong className="text-[#14213D]">₹{batchSummary.totalNet.toLocaleString("en-IN")}</strong>
                </div>
                <div>
                  <span className="text-[#52607D] font-sans">Fittings (5%):</span>{" "}
                  <strong className="text-[#D97706]">+₹{batchSummary.totalFittings.toLocaleString("en-IN")}</strong>
                </div>
                <div>
                  <span className="text-[#52607D] font-sans">GST (5%):</span>{" "}
                  <strong className="text-[#2563EB]">+₹{batchSummary.totalGst.toLocaleString("en-IN")}</strong>
                </div>
                <div className="bg-[#EAF3F0] px-2.5 py-1 rounded border border-[#2F6F5E]/20">
                  <span className="text-[#2F6F5E] font-sans font-bold">Batch Total:</span>{" "}
                  <strong className="text-[#2F6F5E] text-sm font-bold">
                    ₹{batchSummary.grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </strong>
                </div>
              </div>

              <Button
                variant="primary"
                size="md"
                icon={committing ? RefreshCw : ArrowRight}
                loading={committing}
                onClick={handleCommit}
              >
                Commit {allProjects.length} Projects
              </Button>
            </div>

            {/* Main Split Layout: Left Project Selector, Right Project Items Configuration */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: List of Projects (4 cols) */}
              <div className="lg:col-span-4 bg-white border border-[#E4E1D8] rounded-[10px] p-4 shadow-[0_1px_2px_rgba(20,33,61,0.04)] space-y-3">
                <div className="flex items-center justify-between border-b border-[#EDEAE1] pb-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#14213D]">
                    Government Projects ({allProjects.length})
                  </h3>
                  <span className="text-[10px] text-[#52607D]">Select to edit items</span>
                </div>

                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                  {allProjects.map((p, idx) => {
                    const pTotals = calculateProjectTotals(projectItemsMap[p.application_id]);
                    const isActive = p.application_id === activeAppId;

                    return (
                      <div
                        key={p.application_id}
                        onClick={() => setActiveAppId(p.application_id)}
                        className={`p-3 rounded-[8px] border transition-all cursor-pointer text-xs space-y-1.5 ${
                          isActive
                            ? "bg-[#EAF3F0]/60 border-[#2F6F5E] shadow-xs"
                            : "bg-[#FAFAF8] border-[#EDEAE1] hover:border-[#CCD0DC]"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-mono font-bold text-[#14213D] truncate text-[11px]">
                            {idx + 1}. {p.application_id}
                          </span>
                          <ChevronRight
                            size={14}
                            className={isActive ? "text-[#2F6F5E]" : "text-[#8C97AB]"}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-[#52607D]">
                          <span className="truncate">{p.farmer_name || "Beneficiary"}</span>
                          <span className="font-mono font-bold text-[#2F6F5E]">
                            ₹{pTotals.grand.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-[#EDEAE1]/60 text-[10px]">
                          <span className="text-[#8C97AB]">
                            {pTotals.activeCount > 0
                              ? `${pTotals.activeCount} items added`
                              : "0 items (₹0.00)"}
                          </span>
                          {p.exists_in_db ? (
                            <span className="text-[#2F6F5E] font-medium">DB: {p.current_status}</span>
                          ) : (
                            <span className="text-amber-700 font-medium">New Project</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Items Configuration for Selected Project (8 cols) */}
              <div className="lg:col-span-8 bg-white border border-[#E4E1D8] rounded-[10px] p-6 shadow-[0_1px_2px_rgba(20,33,61,0.04)] space-y-5">
                {activeProject ? (
                  <>
                    {/* Project Header Info */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EDEAE1] pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-[#14213D] text-white font-mono font-bold text-[11px]">
                            {activeProject.application_id}
                          </span>
                          {activeProject.exists_in_db ? (
                            <span className="px-2 py-0.5 rounded bg-[#EAF3F0] text-[#2F6F5E] font-bold text-[10px]">
                              EXISTS IN DB
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-bold text-[10px]">
                              NEW PROJECT
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-[#52607D] mt-1.5">
                          <span className="flex items-center gap-1">
                            <User size={13} />
                            <strong>{activeProject.farmer_name || "Farmer"}</strong>
                          </span>
                          {(activeProject.village || activeProject.block) && (
                            <span className="flex items-center gap-1">
                              <MapPin size={13} />
                              {[activeProject.village, activeProject.block].filter(Boolean).join(", ")}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action buttons: Copy to all */}
                      <div className="flex items-center gap-2">
                        <Button
                          size="xs"
                          variant="outline"
                          icon={Copy}
                          onClick={handleCopyItemsToAll}
                          title="Copy this project's item counts to all other 12 projects"
                        >
                          Copy
                        </Button>
                      </div>
                    </div>

                    {/* Add Component Dropdown if some items removed */}
                    {availableCatalog.length > activeItems.length && (
                      <div className="flex items-center justify-between gap-2 p-2.5 bg-[#FAFAF8] rounded-[8px] border border-[#EDEAE1]">
                        <span className="text-xs font-semibold text-[#14213D]">
                          Add Component to this Project:
                        </span>
                        <div className="flex items-center gap-2">
                          <select
                            value={selectedCatalogId}
                            onChange={(e) => setSelectedCatalogId(e.target.value)}
                            className="text-xs bg-white border border-[#CCD0DC] rounded px-2.5 py-1 text-[#14213D]"
                          >
                            <option value="">-- Select Finished Good --</option>
                            {availableCatalog
                              .filter((c) => !activeItems.some((it) => it.item_id === c.id))
                              .map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name} (₹{c.unit_price}/{c.unit_symbol})
                                </option>
                              ))}
                          </select>
                          <Button
                            size="xs"
                            variant="secondary"
                            icon={Plus}
                            onClick={handleAddCatalogItem}
                            disabled={!selectedCatalogId}
                          >
                            Add
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Finished Goods Items Table for this Project */}
                    <div className="border border-[#EDEAE1] rounded-[8px] overflow-hidden">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead className="bg-[#FAFAF8] border-b border-[#EDEAE1] text-[#52607D] font-semibold">
                          <tr>
                            <th className="py-2 px-3 w-8">#</th>
                            <th className="py-2 px-3">Finished Good Component</th>
                            <th className="py-2 px-3 w-16">Unit</th>
                            <th className="py-2 px-3 text-right w-24">Base Price</th>
                            <th className="py-2 px-3 text-right w-28">Quantity</th>
                            <th className="py-2 px-3 text-right w-28">Line Total</th>
                            <th className="py-2 px-3 text-center w-10"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#EDEAE1]">
                          {activeItems.map((it, idx) => (
                            <tr key={it.item_id || idx} className="hover:bg-[#FAFAF8]">
                              <td className="py-2 px-3 text-[#8C97AB] font-mono">{idx + 1}</td>
                              <td className="py-2 px-3">
                                <span className="font-semibold text-[#14213D]">{it.name}</span>
                                {it.category && (
                                  <span className="ml-1.5 text-[10px] text-[#8C97AB]">({it.category})</span>
                                )}
                              </td>
                              <td className="py-2 px-3 font-mono text-[#52607D]">{it.unit_symbol}</td>
                              <td className="py-2 px-3 text-right font-mono text-[#14213D]">
                                ₹{(it.unit_price || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              </td>
                              <td className="py-2 px-3 text-right">
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={it.quantity}
                                  onChange={(e) => handleQuantityChange(it.item_id, e.target.value)}
                                  className="w-20 text-right px-2 py-1 font-mono font-bold text-xs bg-white border border-[#CCD0DC] rounded focus:outline-none focus:ring-1 focus:ring-[#2F6F5E] text-[#14213D]"
                                />
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-[#2F6F5E]">
                                ₹{(it.line_total || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              </td>
                              <td className="py-2 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(it.item_id)}
                                  className="text-[#8C97AB] hover:text-rose-600 transition-colors p-1"
                                  title="Remove item"
                                >
                                  <X size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Per-Project Live Financial Calculation Breakdown Card */}
                    <div className="bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-[#EDEAE1] pb-2">
                        <div className="flex items-center gap-2">
                          <Calculator size={16} className="text-[#2F6F5E]" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-[#14213D]">
                            Project Invoice Breakdown (Net Items + 5% Fittings + 5% GST)
                          </h4>
                        </div>
                        <span className="font-mono text-xs font-bold text-[#14213D]">
                          Project: {activeProject.application_id}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                        <div className="p-2.5 bg-white border border-[#EDEAE1] rounded-[6px]">
                          <div className="text-[10px] text-[#52607D] font-sans">Net Items Total</div>
                          <div className="text-sm font-bold text-[#14213D] mt-0.5">
                            ₹{activeTotals.net.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </div>
                          <div className="text-[9px] text-[#8C97AB] font-sans">Sum of components</div>
                        </div>

                        <div className="p-2.5 bg-white border border-[#EDEAE1] rounded-[6px]">
                          <div className="text-[10px] text-[#52607D] font-sans">Fittings Cost (5%)</div>
                          <div className="text-sm font-bold text-[#D97706] mt-0.5">
                            +₹{activeTotals.fittings.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </div>
                          <div className="text-[9px] text-[#8C97AB] font-sans">5% of Net Items</div>
                        </div>

                        <div className="p-2.5 bg-white border border-[#EDEAE1] rounded-[6px]">
                          <div className="text-[10px] text-[#52607D] font-sans">GST (5%)</div>
                          <div className="text-sm font-bold text-[#2563EB] mt-0.5">
                            +₹{activeTotals.gst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </div>
                          <div className="text-[9px] text-[#8C97AB] font-sans">5% on Items + Fittings</div>
                        </div>

                        <div className="p-2.5 bg-[#EAF3F0] border border-[#2F6F5E]/20 rounded-[6px]">
                          <div className="text-[10px] text-[#2F6F5E] font-sans font-bold">Total Invoice Amount</div>
                          <div className="text-sm font-extrabold text-[#2F6F5E] mt-0.5">
                            ₹{activeTotals.grand.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </div>
                          <div className="text-[9px] text-[#2F6F5E] font-sans">Items + Fittings + GST</div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-8 text-center text-xs text-[#52607D]">
                    Select a project from the left list to configure finished goods items.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default LoadOrderUploadPage;
