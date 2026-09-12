import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Factory,
  Plus,
  Trash2,
  RefreshCw,
  ArrowLeft,
  Calendar,
  Layers,
  Filter,
  TrendingUp,
  Boxes,
  Eye,
  X,
  PackageCheck,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Download,
} from "lucide-react";
import api from "../api/client.js";
import Navbar from "../components/layout/Navbar.jsx";
import MetricCard from "../components/common/MetricCard.jsx";
import Button from "../components/common/Button.jsx";
import CustomSelect from "../components/common/CustomSelect.jsx";
import Modal from "../components/common/Modal.jsx";
import Pagination from "../components/common/Pagination.jsx";
import { SkeletonLoader, EmptyState } from "../components/common/SkeletonLoader.jsx";
import { formatDate } from "../utils/dates.js";
import { toast } from "sonner";

export function ProductionPage() {
  // Master dependencies
  const [itemsList, setItemsList] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [finishedGoods, setFinishedGoods] = useState([]);
  const [stocksMap, setStocksMap] = useState({});

  // Production runs table state
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState({
    totalEntries: 0,
    totalMaterialsUsed: 0,
    totalWastage: 0,
    totalFinishedProduced: 0,
  });
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 1 });

  // Filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filterRawMaterial, setFilterRawMaterial] = useState("");
  const [filterFinishedGood, setFilterFinishedGood] = useState("");

  // Inline Production Entry Form States
  const [prodDate, setProdDate] = useState(new Date().toISOString().split("T")[0]);
  const [refNumber, setRefNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [wastageQuantity, setWastageQuantity] = useState("0");
  const [materials, setMaterials] = useState([
    { item_id: "", quantity_used: "", unit_symbol: "" },
  ]);
  const [outputs, setOutputs] = useState([
    { item_id: "", quantity_produced: "", unit_symbol: "" },
  ]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // View Details Modal
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  const fetchDependencies = async () => {
    try {
      const [itemsRes, stockRes] = await Promise.all([
        api.get("/items/options"),
        api.get("/inventory/stock"),
      ]);

      const allItems = itemsRes.data?.items || itemsRes.items || [];
      setItemsList(allItems);

      const rms = allItems.filter((i) => i.item_type === "RAW_MATERIAL");
      const fgs = allItems.filter((i) => i.item_type === "FINISHED_GOOD");
      setRawMaterials(rms);
      setFinishedGoods(fgs);

      const sMap = {};
      (stockRes.data?.stock || []).forEach((s) => {
        sMap[s.id] = parseFloat(s.quantity_on_hand || 0);
      });
      setStocksMap(sMap);

      // Pre-populate first material and output if empty
      if (rms.length > 0) {
        setMaterials((prev) => {
          if (!prev[0] || !prev[0].item_id) {
            return [{ item_id: rms[0].id, quantity_used: "", unit_symbol: rms[0].unit?.symbol || "NOS" }];
          }
          return prev;
        });
      }
      if (fgs.length > 0) {
        setOutputs((prev) => {
          if (!prev[0] || !prev[0].item_id) {
            return [{ item_id: fgs[0].id, quantity_produced: "", unit_symbol: fgs[0].unit?.symbol || "NOS" }];
          }
          return prev;
        });
      }
    } catch (err) {
      console.error("Failed to load production dependencies:", err);
      toast.error("Failed to load items and inventory stock");
    }
  };

  const fetchProductionEntries = async (page = 1, limit = pagination.limit) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
        ...(startDate ? { start_date: startDate } : {}),
        ...(endDate ? { end_date: endDate } : {}),
        ...(filterRawMaterial ? { raw_material_id: filterRawMaterial } : {}),
        ...(filterFinishedGood ? { finished_good_id: filterFinishedGood } : {}),
      };

      const res = await api.get("/inventory/production", { params });
      setEntries(res.data?.entries || []);
      setSummary(
        res.data?.summary || {
          totalEntries: 0,
          totalMaterialsUsed: 0,
          totalWastage: 0,
          totalFinishedProduced: 0,
        }
      );
      setPagination(res.data?.pagination || { page, limit, total: 0, totalPages: 1 });
    } catch (err) {
      console.error("Failed to load production entries:", err);
      toast.error("Failed to load production logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDependencies();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProductionEntries(1, pagination.limit);
    }, 200);
    return () => clearTimeout(timer);
  }, [startDate, endDate, filterRawMaterial, filterFinishedGood]);

  // Section A: Materials Handlers
  const handleAddMaterial = () => {
    const defaultRm = rawMaterials.length > 0 ? rawMaterials[0] : null;
    setMaterials([
      ...materials,
      {
        item_id: defaultRm ? defaultRm.id : "",
        quantity_used: "",
        unit_symbol: defaultRm ? (defaultRm.unit?.symbol || "NOS") : "",
      },
    ]);
  };

  const handleRemoveMaterial = (idx) => {
    if (materials.length === 1) return;
    setMaterials(materials.filter((_, i) => i !== idx));
  };

  const handleMaterialItemChange = (idx, itemId) => {
    const selected = rawMaterials.find((r) => r.id === itemId);
    const updated = [...materials];
    updated[idx].item_id = itemId;
    updated[idx].unit_symbol = selected?.unit?.symbol || "NOS";
    setMaterials(updated);
  };

  const handleMaterialQtyChange = (idx, val) => {
    const updated = [...materials];
    updated[idx].quantity_used = val;
    setMaterials(updated);
  };

  // Section B: Outputs Handlers
  const handleAddOutput = () => {
    const defaultFg = finishedGoods.length > 0 ? finishedGoods[0] : null;
    setOutputs([
      ...outputs,
      {
        item_id: defaultFg ? defaultFg.id : "",
        quantity_produced: "",
        unit_symbol: defaultFg ? (defaultFg.unit?.symbol || "NOS") : "",
      },
    ]);
  };

  const handleRemoveOutput = (idx) => {
    if (outputs.length === 1) return;
    setOutputs(outputs.filter((_, i) => i !== idx));
  };

  const handleOutputItemChange = (idx, itemId) => {
    const selected = finishedGoods.find((f) => f.id === itemId);
    const updated = [...outputs];
    updated[idx].item_id = itemId;
    updated[idx].unit_symbol = selected?.unit?.symbol || "NOS";
    setOutputs(updated);
  };

  const handleOutputQtyChange = (idx, val) => {
    const updated = [...outputs];
    updated[idx].quantity_produced = val;
    setOutputs(updated);
  };

  const handleSaveProduction = async (e) => {
    e.preventDefault();
    setFormError("");

    for (const m of materials) {
      if (!m.item_id) {
        setFormError("Please select a raw material for all input lines.");
        return;
      }
      const used = parseFloat(m.quantity_used);
      if (isNaN(used) || used <= 0) {
        setFormError("Quantity used must be greater than 0 for all raw materials.");
        return;
      }

      // Validate stock availability against quantity_used only (wastage is not double-deducted)
      const available = stocksMap[m.item_id] ?? 0;
      if (used > available) {
        const itemObj = rawMaterials.find((r) => r.id === m.item_id);
        setFormError(
          `Insufficient stock for "${itemObj?.name || "Raw Material"}". Required: ${used.toFixed(2)} ${m.unit_symbol}, Available on hand: ${available.toFixed(2)} ${m.unit_symbol}`
        );
        return;
      }
    }

    const parsedWastage = parseFloat(wastageQuantity || 0);
    if (isNaN(parsedWastage) || parsedWastage < 0) {
      setFormError("Wastage quantity cannot be negative.");
      return;
    }

    for (const o of outputs) {
      if (!o.item_id) {
        setFormError("Please select a finished good for all output lines.");
        return;
      }
      const prod = parseFloat(o.quantity_produced);
      if (isNaN(prod) || prod <= 0) {
        setFormError("Quantity produced must be greater than 0 for all finished goods.");
        return;
      }
    }

    try {
      setSaving(true);

      const payload = {
        production_date: prodDate,
        reference_number: refNumber.trim() || null,
        notes: notes.trim() || null,
        wastage_quantity: parsedWastage,
        materials: materials.map((m) => ({
          item_id: m.item_id,
          quantity_used: parseFloat(m.quantity_used),
        })),
        outputs: outputs.map((o) => ({
          item_id: o.item_id,
          quantity_produced: parseFloat(o.quantity_produced),
        })),
      };

      await api.post("/inventory/production", payload);
      toast.success("Production run recorded and inventory stock updated!");

      // Reset form fields
      setRefNumber("");
      setNotes("");
      setWastageQuantity("0");
      setMaterials([
        {
          item_id: rawMaterials[0]?.id || "",
          quantity_used: "",
          unit_symbol: rawMaterials[0]?.unit?.symbol || "NOS",
        },
      ]);
      setOutputs([
        {
          item_id: finishedGoods[0]?.id || "",
          quantity_produced: "",
          unit_symbol: finishedGoods[0]?.unit?.symbol || "NOS",
        },
      ]);

      fetchDependencies();
      fetchProductionEntries(1, pagination.limit);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to record production run.";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleResetFilter = () => {
    setStartDate("");
    setEndDate("");
    setFilterRawMaterial("");
    setFilterFinishedGood("");
  };

  const rawMaterialOptions = rawMaterials.map((r) => ({
    value: r.id,
    label: `${r.name} (${r.unit?.symbol || "NOS"})`,
  }));

  const finishedGoodOptions = finishedGoods.map((f) => ({
    value: f.id,
    label: `${f.name} (${f.unit?.symbol || "NOS"})`,
  }));

  const totalRawConsumed = materials.reduce(
    (sum, m) => sum + (parseFloat(m.quantity_used) || 0),
    0
  );

  const totalOutputQty = outputs.reduce(
    (sum, o) => sum + (parseFloat(o.quantity_produced) || 0),
    0
  );

  const exportToCSV = () => {
    if (!entries || entries.length === 0) {
      toast.error("No production records to export");
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Production Date,Batch Reference,Raw Materials Used,Total Raw Qty,Batch Wastage,Finished Goods Produced,Total Finished Qty,Notes\n";

    entries.forEach((e) => {
      const rawDesc = (e.materials || []).map((m) => `${m.item?.name || "Raw"}: ${m.quantity_used} ${m.unit?.symbol || "NOS"}`).join("; ");
      const totalRaw = (e.materials || []).reduce((acc, m) => acc + (parseFloat(m.quantity_used) || 0), 0);
      const entryWaste = parseFloat(e.wastage_quantity || 0);
      const legacyWaste = (e.materials || []).reduce((sum, m) => sum + (parseFloat(m.wastage_quantity) || 0), 0);
      const displayWaste = entryWaste > 0 ? entryWaste : legacyWaste;
      const outDesc = (e.outputs || []).map((o) => `${o.item?.name || "Fin"}: ${o.quantity_produced} ${o.unit?.symbol || "NOS"}`).join("; ");
      const totalOut = (e.outputs || []).reduce((acc, o) => acc + (parseFloat(o.quantity_produced) || 0), 0);
      csvContent += `"${e.production_date}","${e.reference_number || ""}","${rawDesc}","${totalRaw}","${displayWaste}","${outDesc}","${totalOut}","${(e.notes || "").replace(/"/g, '""')}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `cheran_irrigation_production_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Production report CSV downloaded");
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Navbar
        title="Manufacturing & Daily Production"
        subtitle="Record daily raw material consumption, batch scrap/wastage, and finished goods output"
        actions={
          <div className="flex items-center gap-2">
            <Link to="/inventory">
              <Button variant="secondary" size="sm" icon={ArrowLeft}>
                Stock Overview
              </Button>
            </Link>
            <Button
              variant="secondary"
              size="sm"
              icon={Download}
              onClick={exportToCSV}
            >
              Export CSV
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              onClick={() => {
                fetchDependencies();
                fetchProductionEntries(pagination.page, pagination.limit);
              }}
            >
              Refresh
            </Button>
          </div>
        }
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 overflow-y-auto w-full">
        {/* KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Production Runs"
            value={summary?.totalEntries || 0}
            icon={Factory}
            accentColor="#2F6F5E"
            description="Runs in filtered period"
          />
          <MetricCard
            title="Raw Material Consumed"
            value={`${(summary?.totalMaterialsUsed || 0).toLocaleString("en-IN", { maximumFractionDigits: 1 })} Units`}
            icon={Boxes}
            accentColor="#2B5B84"
            description="Net raw materials utilized"
          />
          <MetricCard
            title="Production Wastage"
            value={`${(summary?.totalWastage || 0).toLocaleString("en-IN", { maximumFractionDigits: 1 })} Units`}
            icon={AlertTriangle}
            accentColor="#D97706"
            description="Batch scrap & purge mixture"
          />
          <MetricCard
            title="Finished Goods Output"
            value={`${(summary?.totalFinishedProduced || 0).toLocaleString("en-IN", { maximumFractionDigits: 1 })} Units`}
            icon={PackageCheck}
            accentColor="#10B981"
            description="Total finished stock produced"
          />
        </div>

        {/* INLINE FORM CARD: Record Daily Production Run (Just like Plast version) */}
        <div className="bg-white rounded-[10px] border border-[#E4E1D8] shadow-[0_1px_2px_rgba(20,33,61,0.04)] overflow-hidden">
          <div className="p-4 border-b border-[#EDEAE1] flex items-center justify-between bg-[#FAFAF8]">
            <div className="flex items-center gap-2">
              <Factory size={16} className="text-[#2F6F5E]" />
              <h2 className="text-sm font-bold font-display text-[#14213D]">
                Record Production Log
              </h2>
            </div>
            <span className="text-[11px] text-[#52607D]">
              Atomic Raw Material Stock Deduction & Finished Good Addition
            </span>
          </div>

          <form onSubmit={handleSaveProduction} className="p-4 sm:p-6 space-y-5">
            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-[8px] flex items-center gap-2">
                <AlertTriangle size={15} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Run Header: Date, Ref, Batch Wastage, Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#14213D] mb-1">
                  Production Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={prodDate}
                  onChange={(e) => setProdDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-mono bg-white border border-[#E4E1D8] rounded-[7px] text-[#14213D] focus:outline-none focus:border-[#2F6F5E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#14213D] mb-1">
                  Batch / Reference No.
                </label>
                <input
                  type="text"
                  placeholder="e.g. BATCH-2026-0818"
                  value={refNumber}
                  onChange={(e) => setRefNumber(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-mono bg-white border border-[#E4E1D8] rounded-[7px] text-[#14213D] placeholder-[#8C97AB] focus:outline-none focus:border-[#2F6F5E]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-amber-900">
                    Common Batch Wastage
                  </label>
                  <span className="text-[10px] text-[#8C97AB] font-normal">Scrap/Purge mix</span>
                </div>
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0.00"
                  value={wastageQuantity}
                  onChange={(e) => setWastageQuantity(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-mono bg-amber-50/40 border border-amber-300 rounded-[7px] text-[#14213D] focus:outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#14213D] mb-1">
                  Notes / Operator Name
                </label>
                <input
                  type="text"
                  placeholder="Optional shift / operator notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-[#E4E1D8] rounded-[7px] text-[#14213D] placeholder-[#8C97AB] focus:outline-none focus:border-[#2F6F5E]"
                />
              </div>
            </div>

            {/* Two-Column: Raw Materials Consumed vs Finished Goods Produced */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-3 border-t border-[#EDEAE1]">
              {/* Left Column: Raw Materials Consumed */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-[#B0403A] uppercase tracking-wider flex items-center gap-1.5">
                    <ArrowDownRight size={14} className="text-[#B0403A]" />
                    <span>Raw Materials Consumed (-)</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    icon={Plus}
                    onClick={handleAddMaterial}
                  >
                    Add Material
                  </Button>
                </div>

                {rawMaterials.length === 0 ? (
                  <div className="p-4 bg-amber-50 rounded-[7px] text-xs text-amber-800 border border-amber-200">
                    No raw materials found. Please create raw materials in Item Master first.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {materials.map((mat, idx) => {
                      const selectedItem = rawMaterials.find((r) => r.id === mat.item_id);
                      const available = stocksMap[mat.item_id] ?? 0;
                      const used = parseFloat(mat.quantity_used) || 0;
                      const isExceeding = used > available;

                      return (
                        <div
                          key={idx}
                          className={`p-3 rounded-[8px] border transition-colors space-y-2 ${
                            isExceeding ? "bg-rose-50 border-rose-200" : "bg-[#FAFAF8] border-[#E4E1D8]"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <CustomSelect
                                size="sm"
                                value={mat.item_id}
                                onChange={(val) => handleMaterialItemChange(idx, val)}
                                options={rawMaterials.map((r) => ({
                                  value: r.id,
                                  label: `${r.name} (Stock: ${(stocksMap[r.id] ?? 0).toLocaleString()} ${r.unit?.symbol || "NOS"})`,
                                }))}
                              />
                            </div>
                            {materials.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveMaterial(idx)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded cursor-pointer shrink-0"
                                title="Remove line"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>

                          <div className="flex items-center justify-between gap-3">
                            <div className="flex-1">
                              <span className="text-[10px] font-semibold text-[#52607D]">
                                Used Qty ({selectedItem?.unit?.symbol || "NOS"}) *
                              </span>
                              <input
                                type="number"
                                step="any"
                                min="0.001"
                                placeholder="Quantity used"
                                value={mat.quantity_used}
                                onChange={(e) => handleMaterialQtyChange(idx, e.target.value)}
                                className="w-full mt-0.5 px-2.5 py-1 bg-white border border-[#E4E1D8] rounded-[6px] text-xs text-[#14213D] font-mono focus:outline-none focus:border-[#2F6F5E]"
                                required
                              />
                            </div>
                            <div className="text-right pt-2.5">
                              <span className="text-[10px] text-[#52607D] block">Available:</span>
                              <span
                                className={`text-xs font-mono font-bold ${
                                  isExceeding ? "text-rose-600" : "text-[#14213D]"
                                }`}
                              >
                                {available.toLocaleString()} {mat.unit_symbol}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right Column: Finished Goods Produced */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-[#2F6F5E] uppercase tracking-wider flex items-center gap-1.5">
                    <ArrowUpRight size={14} className="text-[#2F6F5E]" />
                    <span>Finished Goods Output (+)</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    icon={Plus}
                    onClick={handleAddOutput}
                  >
                    Add Output
                  </Button>
                </div>

                {finishedGoods.length === 0 ? (
                  <div className="p-4 bg-emerald-50 rounded-[7px] text-xs text-[#1E4D40] border border-emerald-200">
                    No finished goods found. Please create finished goods in Item Master first.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {outputs.map((out, idx) => {
                      const selectedItem = finishedGoods.find((f) => f.id === out.item_id);
                      return (
                        <div
                          key={idx}
                          className="p-3 bg-[#FAFAF8] rounded-[8px] border border-[#E4E1D8] space-y-2"
                        >
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <CustomSelect
                                size="sm"
                                value={out.item_id}
                                onChange={(val) => handleOutputItemChange(idx, val)}
                                options={finishedGoods.map((f) => ({
                                  value: f.id,
                                  label: `${f.name} (Current Stock: ${(stocksMap[f.id] ?? 0).toLocaleString()} ${f.unit?.symbol || "NOS"})`,
                                }))}
                              />
                            </div>
                            {outputs.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveOutput(idx)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded cursor-pointer shrink-0"
                                title="Remove line"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>

                          <div>
                            <span className="text-[10px] font-semibold text-[#52607D]">
                              Quantity Produced ({selectedItem?.unit?.symbol || "NOS"}) *
                            </span>
                            <input
                              type="number"
                              step="any"
                              min="0.001"
                              placeholder="Quantity produced"
                              value={out.quantity_produced}
                              onChange={(e) => handleOutputQtyChange(idx, e.target.value)}
                              className="w-full mt-0.5 px-2.5 py-1 bg-white border border-[#E4E1D8] rounded-[6px] text-xs text-[#14213D] font-mono font-bold focus:outline-none focus:border-[#2F6F5E]"
                              required
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Summary & Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#EDEAE1]">
              <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
                <span className="text-[#52607D]">
                  Raw Material Consumed: <strong className="text-rose-700">{totalRawConsumed.toFixed(2)} Units</strong>
                </span>
                <span className="text-[#52607D]">
                  Common Wastage: <strong className="text-amber-800">{(parseFloat(wastageQuantity) || 0).toFixed(2)} Units</strong>
                </span>
                <span className="text-[#52607D]">
                  Finished Goods Output: <strong className="text-[#2F6F5E]">+{totalOutputQty.toFixed(2)} Units</strong>
                </span>
              </div>

              <Button type="submit" variant="primary" size="md" loading={saving}>
                Submit Production Log
              </Button>
            </div>
          </form>
        </div>

        {/* Action Header & Filter Bar */}
        <div className="bg-white p-4 rounded-[10px] border border-[#E4E1D8] shadow-xs flex flex-wrap items-end gap-3">
          <div className="w-40">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#52607D] mb-1">
              From Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs font-mono bg-[#FAFAF8] border border-[#E4E1D8] rounded-[6px] focus:outline-none focus:ring-1 focus:ring-[#2F6F5E]"
            />
          </div>

          <div className="w-40">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#52607D] mb-1">
              To Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs font-mono bg-[#FAFAF8] border border-[#E4E1D8] rounded-[6px] focus:outline-none focus:ring-1 focus:ring-[#2F6F5E]"
            />
          </div>

          <div className="w-52">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#52607D] mb-1">
              Raw Material
            </label>
            <CustomSelect
              options={[{ value: "", label: "All Raw Materials" }, ...rawMaterialOptions]}
              value={filterRawMaterial}
              onChange={(val) => setFilterRawMaterial(val)}
              size="sm"
            />
          </div>

          <div className="w-52">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#52607D] mb-1">
              Finished Good
            </label>
            <CustomSelect
              options={[{ value: "", label: "All Finished Goods" }, ...finishedGoodOptions]}
              value={filterFinishedGood}
              onChange={(val) => setFilterFinishedGood(val)}
              size="sm"
            />
          </div>

          {(startDate || endDate || filterRawMaterial || filterFinishedGood) && (
            <div className="flex items-center pt-1">
              <Button size="sm" variant="secondary" icon={X} onClick={handleResetFilter}>
                Clear
              </Button>
            </div>
          )}
        </div>

        {/* Production Runs History Table */}
        <div className="bg-white border border-[#E4E1D8] rounded-[10px] shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-[#EDEAE1] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-[#52607D]" />
              <h2 className="text-sm font-bold text-[#14213D] font-display">
                Production Execution Log History
              </h2>
            </div>
            <span className="text-xs text-[#52607D] font-mono">
              {pagination.total} Total Logs
            </span>
          </div>

          {loading ? (
            <div className="p-6">
              <SkeletonLoader rows={8} />
            </div>
          ) : entries.length === 0 ? (
            <EmptyState
              icon={Factory}
              title="No production runs found"
              description={
                startDate || endDate || filterRawMaterial || filterFinishedGood
                  ? "No runs match the selected filters. Try broadening your date range or clearing filters."
                  : "Use the form above to record daily manufacturing runs and update stock balances."
              }
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#EDEAE1] bg-[#FAFAF8] text-[#52607D] font-semibold">
                      <th className="py-3 px-4">Production Date</th>
                      <th className="py-3 px-4">Batch / Ref</th>
                      <th className="py-3 px-4">Raw Materials Used</th>
                      <th className="py-3 px-4">Batch Wastage</th>
                      <th className="py-3 px-4">Finished Goods Produced</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDEAE1] text-[#14213D]">
                    {entries.map((entry) => {
                      // Support both entry-level wastage and legacy material-level fallback
                      const entryWastage = parseFloat(entry.wastage_quantity || 0);
                      const legacyWastage = (entry.materials || []).reduce(
                        (sum, m) => sum + (parseFloat(m.wastage_quantity) || 0),
                        0
                      );
                      const displayWastage = entryWastage > 0 ? entryWastage : legacyWastage;

                      return (
                        <tr key={entry.id} className="hover:bg-[#FAFAF8] transition-colors">
                          <td className="py-3 px-4 font-medium text-[#14213D] whitespace-nowrap">
                            <div className="flex items-center gap-1.5 font-mono">
                              <Calendar size={13} className="text-[#2F6F5E]" />
                              <span>{formatDate(entry.production_date)}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono font-semibold text-[#52607D]">
                            <div>{entry.reference_number || "—"}</div>
                            {entry.notes && (
                              <div className="text-[11px] text-[#8C97AB] font-sans italic font-normal truncate max-w-xs">
                                {entry.notes}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-[#52607D] space-y-1">
                            {(entry.materials || []).map((m, idx) => (
                              <div key={idx} className="flex items-center gap-1.5 font-mono text-[11px]">
                                <span className="font-semibold text-[#14213D]">{m.item?.name}</span>:
                                <span className="text-rose-600 font-bold">
                                  -{(parseFloat(m.quantity_used) || 0).toLocaleString()} {m.unit?.symbol || "NOS"}
                                </span>
                              </div>
                            ))}
                          </td>
                          <td className="py-3 px-4">
                            {displayWastage > 0 ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                {displayWastage.toLocaleString()} Units
                              </span>
                            ) : (
                              <span className="text-[#8C97AB] font-mono">0</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-[#52607D] space-y-1">
                            {(entry.outputs || []).map((o, idx) => (
                              <div key={idx} className="flex items-center gap-1.5 font-mono text-[11px]">
                                <span className="font-semibold text-[#14213D]">{o.item?.name}</span>:
                                <span className="text-[#2F6F5E] font-bold">
                                  +{(parseFloat(o.quantity_produced) || 0).toLocaleString()} {o.unit?.symbol || "NOS"}
                                </span>
                              </div>
                            ))}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Button
                              variant="outline"
                              size="xs"
                              icon={Eye}
                              onClick={() => {
                                setSelectedEntry(entry);
                                setViewModalOpen(true);
                              }}
                            >
                              Details
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                limit={pagination.limit}
                onPageChange={(p) => fetchProductionEntries(p, pagination.limit)}
                onLimitChange={(l) => fetchProductionEntries(1, l)}
              />
            </>
          )}
        </div>
      </main>

      {/* View Production Details Modal */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title={`Production Run Details: ${selectedEntry?.reference_number || selectedEntry?.id?.slice(0, 8) || ""}`}
        size="md"
      >
        {selectedEntry && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-[#FAFAF8] p-3 rounded-[8px] border border-[#EDEAE1]">
              <div>
                <span className="text-[#52607D] block text-[11px]">Production Date:</span>
                <strong className="text-[#14213D] font-mono">{formatDate(selectedEntry.production_date)}</strong>
              </div>
              <div>
                <span className="text-[#52607D] block text-[11px]">Batch / Reference:</span>
                <strong className="text-[#14213D] font-mono">{selectedEntry.reference_number || "—"}</strong>
              </div>
              <div>
                <span className="text-[#52607D] block text-[11px]">Batch Wastage:</span>
                <strong className="text-amber-800 font-mono">
                  {parseFloat(selectedEntry.wastage_quantity || 0).toLocaleString()} Units
                </strong>
              </div>
              {selectedEntry.notes && (
                <div className="col-span-2 sm:col-span-3 pt-1 border-t border-[#EDEAE1] text-[11px] text-[#52607D]">
                  <span className="font-semibold">Notes:</span> {selectedEntry.notes}
                </div>
              )}
            </div>

            {/* Consumed Raw Materials */}
            <div>
              <div className="font-bold text-[#B0403A] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ArrowDownRight size={13} />
                <span>Raw Materials Consumed</span>
              </div>
              <table className="w-full text-left">
                <thead className="bg-[#FAFAF8] border-b border-[#EDEAE1] text-[#52607D]">
                  <tr>
                    <th className="py-2 px-3">Raw Material</th>
                    <th className="py-2 px-3 text-right">Quantity Consumed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDEAE1]">
                  {(selectedEntry.materials || []).map((m, idx) => {
                    const used = parseFloat(m.quantity_used || 0);
                    return (
                      <tr key={idx}>
                        <td className="py-2 px-3 font-semibold text-[#14213D]">{m.item?.name}</td>
                        <td className="py-2 px-3 text-right font-mono text-rose-600 font-bold">
                          -{(used || 0).toLocaleString()} {m.unit?.symbol || "NOS"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Finished Goods Produced */}
            <div>
              <div className="font-bold text-[#2F6F5E] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ArrowUpRight size={13} />
                <span>Finished Goods Produced</span>
              </div>
              <table className="w-full text-left">
                <thead className="bg-[#FAFAF8] border-b border-[#EDEAE1] text-[#52607D]">
                  <tr>
                    <th className="py-2 px-3">Finished Good</th>
                    <th className="py-2 px-3 text-right">Quantity Produced</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDEAE1]">
                  {(selectedEntry.outputs || []).map((o, idx) => (
                    <tr key={idx}>
                      <td className="py-2 px-3 font-semibold text-[#14213D]">{o.item?.name}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-[#2F6F5E]">
                        +{(parseFloat(o.quantity_produced) || 0).toLocaleString()} {o.unit?.symbol || "NOS"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-3 border-t border-[#EDEAE1]">
              <Button variant="outline" size="sm" onClick={() => setViewModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default ProductionPage;
