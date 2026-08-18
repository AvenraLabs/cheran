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
} from "lucide-react";
import api from "../api/client.js";
import Navbar from "../components/layout/Navbar.jsx";
import MetricCard from "../components/common/MetricCard.jsx";
import Button from "../components/common/Button.jsx";
import CustomSelect from "../components/common/CustomSelect.jsx";
import Modal from "../components/common/Modal.jsx";
import Pagination from "../components/common/Pagination.jsx";
import { SkeletonLoader, EmptyState } from "../components/common/SkeletonLoader.jsx";

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

  // New Production Entry Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [prodDate, setProdDate] = useState(new Date().toISOString().split("T")[0]);
  const [refNumber, setRefNumber] = useState("");
  const [materials, setMaterials] = useState([
    { item_id: "", quantity_used: "", wastage_quantity: "0", unit_symbol: "" },
  ]);
  const [outputs, setOutputs] = useState([
    { item_id: "", quantity_produced: "", unit_symbol: "" },
  ]);
  const [saving, setSaving] = useState(false);
  const [createError, setCreateError] = useState("");

  // View Details Modal
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  const fetchDependencies = async () => {
    try {
      const [itemsRes, stockRes] = await Promise.all([
        api.get("/items?limit=500&is_active=true"),
        api.get("/inventory/stock"),
      ]);

      const allItems = itemsRes.data?.items || [];
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
    } catch (err) {
      console.error("Failed to load production dependencies:", err);
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

  const handleOpenCreateModal = () => {
    const defaultRm = rawMaterials.length > 0 ? rawMaterials[0] : null;
    const defaultFg = finishedGoods.length > 0 ? finishedGoods[0] : null;

    setProdDate(new Date().toISOString().split("T")[0]);
    setRefNumber("");
    setMaterials([
      {
        item_id: defaultRm ? defaultRm.id : "",
        quantity_used: "",
        wastage_quantity: "0",
        unit_symbol: defaultRm ? (defaultRm.unit?.symbol || "NOS") : "",
      },
    ]);
    setOutputs([
      {
        item_id: defaultFg ? defaultFg.id : "",
        quantity_produced: "",
        unit_symbol: defaultFg ? (defaultFg.unit?.symbol || "NOS") : "",
      },
    ]);
    setCreateError("");
    setCreateModalOpen(true);
  };

  // Section A: Materials Handlers
  const handleAddMaterial = () => {
    const defaultRm = rawMaterials.length > 0 ? rawMaterials[0] : null;
    setMaterials([
      ...materials,
      {
        item_id: defaultRm ? defaultRm.id : "",
        quantity_used: "",
        wastage_quantity: "0",
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

  const handleMaterialQtyChange = (idx, field, val) => {
    const updated = [...materials];
    updated[idx][field] = val;
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
    setCreateError("");

    for (const m of materials) {
      if (!m.item_id) {
        setCreateError("Please select a raw material for all input lines.");
        return;
      }
      const used = parseFloat(m.quantity_used);
      if (isNaN(used) || used <= 0) {
        setCreateError("Quantity used must be greater than 0 for all raw materials.");
        return;
      }
      const waste = parseFloat(m.wastage_quantity || 0);
      if (isNaN(waste) || waste < 0) {
        setCreateError("Wastage quantity cannot be negative.");
        return;
      }

      const available = stocksMap[m.item_id] ?? 0;
      if (used + waste > available) {
        const itemObj = rawMaterials.find((r) => r.id === m.item_id);
        setCreateError(
          `Insufficient stock for "${itemObj?.name || "Raw Material"}". Required: ${(used + waste).toFixed(2)} ${m.unit_symbol}, Available on hand: ${available.toFixed(2)} ${m.unit_symbol}`
        );
        return;
      }
    }

    for (const o of outputs) {
      if (!o.item_id) {
        setCreateError("Please select a finished good for all output lines.");
        return;
      }
      const prod = parseFloat(o.quantity_produced);
      if (isNaN(prod) || prod <= 0) {
        setCreateError("Quantity produced must be greater than 0 for all finished goods.");
        return;
      }
    }

    try {
      setSaving(true);

      const payload = {
        production_date: prodDate,
        reference_number: refNumber.trim() || null,
        materials: materials.map((m) => ({
          item_id: m.item_id,
          quantity_used: parseFloat(m.quantity_used),
          wastage_quantity: parseFloat(m.wastage_quantity || 0),
        })),
        outputs: outputs.map((o) => ({
          item_id: o.item_id,
          quantity_produced: parseFloat(o.quantity_produced),
        })),
      };

      await api.post("/inventory/production", payload);

      setCreateModalOpen(false);
      fetchDependencies();
      fetchProductionEntries(1, pagination.limit);
    } catch (err) {
      setCreateError(err.response?.data?.message || "Failed to record production run.");
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
    (sum, m) => sum + (parseFloat(m.quantity_used) || 0) + (parseFloat(m.wastage_quantity) || 0),
    0
  );

  const totalOutputQty = outputs.reduce(
    (sum, o) => sum + (parseFloat(o.quantity_produced) || 0),
    0
  );

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#FAFAF8] min-h-screen">
      <Navbar
        title="Manufacturing & Daily Production"
        subtitle={`Daily manufacturing runs consuming raw materials and producing finished goods (${pagination.total.toLocaleString()} logged)`}
        actions={
          <div className="flex items-center gap-2">
            <Link to="/inventory">
              <Button variant="secondary" icon={ArrowLeft}>
                Stock On-Hand
              </Button>
            </Link>
            <Button
              variant="secondary"
              icon={RefreshCw}
              onClick={() => fetchProductionEntries(pagination.page, pagination.limit)}
            >
              Refresh
            </Button>
            <Button icon={Plus} onClick={handleOpenCreateModal}>
              New Production Run
            </Button>
          </div>
        }
      />

      <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Production Runs"
            value={summary.totalEntries}
            icon={Factory}
            accentColor="#2F6F5E"
            description="Runs in filtered period"
          />
          <MetricCard
            title="Raw Material Consumed"
            value={`${summary.totalMaterialsUsed.toLocaleString("en-IN", { maximumFractionDigits: 1 })} Units`}
            icon={Boxes}
            accentColor="#2B5B84"
            description="Net materials utilized"
          />
          <MetricCard
            title="Production Wastage"
            value={`${summary.totalWastage.toLocaleString("en-IN", { maximumFractionDigits: 1 })} Units`}
            icon={AlertTriangle}
            accentColor="#D97706"
            description="Material scrap & trim"
          />
          <MetricCard
            title="Finished Goods Output"
            value={`${summary.totalFinishedProduced.toLocaleString("en-IN", { maximumFractionDigits: 1 })} Units`}
            icon={PackageCheck}
            accentColor="#10B981"
            description="Total finished stock produced"
          />
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

        {/* Production Runs Table */}
        <div className="bg-white border border-[#E4E1D8] rounded-[10px] shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-[#EDEAE1] flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#14213D] font-display">
                Production Execution Log
              </h2>
              <p className="text-xs text-[#52607D]">
                Showing {entries.length} production runs recorded in the selected period
              </p>
            </div>
            <Button size="sm" icon={Plus} onClick={handleOpenCreateModal}>
              New Production Run
            </Button>
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
                  : "Record your daily manufacturing run to deduct raw materials and credit finished goods."
              }
              action={
                <Button size="sm" icon={Plus} onClick={handleOpenCreateModal}>
                  Record Production Run
                </Button>
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
                      <th className="py-3 px-4">Wastage</th>
                      <th className="py-3 px-4">Finished Goods Produced</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDEAE1] text-[#14213D]">
                    {entries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-[#FAFAF8] transition-colors">
                        <td className="py-3 px-4 font-medium text-[#14213D] whitespace-nowrap">
                          <div className="flex items-center gap-1.5 font-mono">
                            <Calendar size={13} className="text-[#2F6F5E]" />
                            <span>{entry.production_date}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-[#52607D]">
                          {entry.reference_number || "—"}
                        </td>
                        <td className="py-3 px-4 text-[#52607D] space-y-1">
                          {(entry.materials || []).map((m, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 font-mono text-[11px]">
                              <span className="font-semibold text-[#14213D]">{m.item?.name}</span>:
                              <span className="text-rose-600 font-bold">
                                -{parseFloat(m.quantity_used).toLocaleString()} {m.unit?.symbol || "NOS"}
                              </span>
                            </div>
                          ))}
                        </td>
                        <td className="py-3 px-4 text-[#52607D] space-y-1">
                          {(entry.materials || []).filter((m) => parseFloat(m.wastage_quantity) > 0).length === 0 ? (
                            <span className="text-[#8C97AB] font-mono">0</span>
                          ) : (
                            (entry.materials || [])
                              .filter((m) => parseFloat(m.wastage_quantity) > 0)
                              .map((m, idx) => (
                                <div key={idx} className="flex items-center gap-1.5 font-mono text-[11px] text-amber-700">
                                  <span>{m.item?.name}:</span>
                                  <span className="font-bold">
                                    -{parseFloat(m.wastage_quantity).toLocaleString()} {m.unit?.symbol || "NOS"}
                                  </span>
                                </div>
                              ))
                          )}
                        </td>
                        <td className="py-3 px-4 text-[#52607D] space-y-1">
                          {(entry.outputs || []).map((o, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 font-mono text-[11px]">
                              <span className="font-semibold text-[#14213D]">{o.item?.name}</span>:
                              <span className="text-[#2F6F5E] font-bold">
                                +{parseFloat(o.quantity_produced).toLocaleString()} {o.unit?.symbol || "NOS"}
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
                    ))}
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

      {/* Record Production Run Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Record Daily Manufacturing Run"
        size="lg"
      >
        <form onSubmit={handleSaveProduction} className="space-y-4">
          {createError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-[8px]">
              {createError}
            </div>
          )}

          {/* Run Header */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#FAFAF8] p-3 rounded-[8px] border border-[#EDEAE1]">
            <div>
              <label className="block text-xs font-semibold text-[#14213D] mb-1">
                Production Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={prodDate}
                onChange={(e) => setProdDate(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-[#E4E1D8] rounded-[6px] focus:outline-none focus:ring-1 focus:ring-[#2F6F5E]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#14213D] mb-1">
                Batch / Reference No. <span className="text-[#8C97AB] font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. BATCH-2026-0818"
                value={refNumber}
                onChange={(e) => setRefNumber(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-[#E4E1D8] rounded-[6px] focus:outline-none focus:ring-1 focus:ring-[#2F6F5E]"
              />
            </div>
          </div>

          {/* Section A: Raw Materials Used */}
          <div className="pt-2 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[#B0403A] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#B0403A]" />
                Raw Materials Used
              </label>
              <button
                type="button"
                onClick={handleAddMaterial}
                className="text-xs font-semibold text-[#2F6F5E] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus size={13} /> Add
              </button>
            </div>

            {/* Column Headers */}
            <div className="flex items-center gap-2 px-2 text-[11px] font-semibold text-[#52607D]">
              <div className="flex-1">Raw Material</div>
              <div className="w-28 text-right">Qty Used</div>
              <div className="w-24 text-right">Wastage</div>
              <div className="w-24 text-right font-mono">Available</div>
              {materials.length > 1 && <div className="w-6"></div>}
            </div>

            <div className="space-y-2">
              {materials.map((line, idx) => {
                const available = stocksMap[line.item_id] ?? 0;
                const used = parseFloat(line.quantity_used) || 0;
                const waste = parseFloat(line.wastage_quantity) || 0;
                const isExceeding = used + waste > available;

                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-2 p-2 rounded-[8px] border transition-colors ${
                      isExceeding ? "bg-rose-50 border-rose-200" : "bg-[#FAFAF8] border-[#EDEAE1]"
                    }`}
                  >
                    <div className="flex-1">
                      <CustomSelect
                        value={line.item_id}
                        onChange={(val) => handleMaterialItemChange(idx, val)}
                        placeholder="Select Raw Material"
                        options={rawMaterialOptions}
                        size="sm"
                      />
                    </div>

                    <div className="w-28">
                      <input
                        type="number"
                        step="0.001"
                        min="0"
                        placeholder="Qty Used"
                        value={line.quantity_used}
                        onChange={(e) => handleMaterialQtyChange(idx, "quantity_used", e.target.value)}
                        className="w-full px-2 py-1 text-xs font-mono text-right bg-white border border-[#E4E1D8] rounded-[6px] focus:outline-none focus:ring-1 focus:ring-[#2F6F5E]"
                        required
                      />
                    </div>

                    <div className="w-24">
                      <input
                        type="number"
                        step="0.001"
                        min="0"
                        placeholder="Wastage"
                        value={line.wastage_quantity}
                        onChange={(e) => handleMaterialQtyChange(idx, "wastage_quantity", e.target.value)}
                        className="w-full px-2 py-1 text-xs font-mono text-right bg-white border border-[#E4E1D8] rounded-[6px] focus:outline-none focus:ring-1 focus:ring-[#2F6F5E]"
                      />
                    </div>

                    <div className="w-24 text-right font-mono text-[11px]">
                      <span className={isExceeding ? "text-rose-600 font-bold" : "text-[#52607D]"}>
                        {available.toLocaleString()} {line.unit_symbol}
                      </span>
                    </div>

                    {materials.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMaterial(idx)}
                        className="p-1 text-[#B0403A] hover:bg-[#FDF2F1] rounded cursor-pointer transition-colors"
                        title="Remove Line"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section B: Finished Goods Produced */}
          <div className="pt-2 border-t border-[#EDEAE1] space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[#2F6F5E] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#2F6F5E]" />
                Finished Goods Produced
              </label>
              <button
                type="button"
                onClick={handleAddOutput}
                className="text-xs font-semibold text-[#2F6F5E] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus size={13} /> Add
              </button>
            </div>

            {/* Column Headers */}
            <div className="flex items-center gap-2 px-2 text-[11px] font-semibold text-[#52607D]">
              <div className="flex-1">Finished Good Item</div>
              <div className="w-36 text-right">Quantity Produced</div>
              {outputs.length > 1 && <div className="w-6"></div>}
            </div>

            <div className="space-y-2">
              {outputs.map((line, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-[#FAFAF8] p-2 rounded-[8px] border border-[#EDEAE1]">
                  <div className="flex-1">
                    <CustomSelect
                      value={line.item_id}
                      onChange={(val) => handleOutputItemChange(idx, val)}
                      placeholder="Select Finished Good"
                      options={finishedGoodOptions}
                      size="sm"
                    />
                  </div>

                  <div className="w-36">
                    <input
                      type="number"
                      step="0.001"
                      min="0.001"
                      placeholder="Produced Qty"
                      value={line.quantity_produced}
                      onChange={(e) => handleOutputQtyChange(idx, e.target.value)}
                      className="w-full px-2.5 py-1 text-xs font-mono text-right bg-white border border-[#E4E1D8] rounded-[6px] focus:outline-none focus:ring-1 focus:ring-[#2F6F5E]"
                      required
                    />
                  </div>

                  {outputs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOutput(idx)}
                      className="p-1 text-[#B0403A] hover:bg-[#FDF2F1] rounded cursor-pointer transition-colors"
                      title="Remove Line"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Quick Summary Bar */}
          <div className="p-3 bg-[#FAFAF8] border border-[#EDEAE1] rounded-[8px] flex items-center justify-between text-xs font-mono">
            <span className="text-[#52607D]">
              Total Raw Material Deducted: <strong className="text-rose-700">{totalRawConsumed.toFixed(2)} Units</strong>
            </span>
            <span className="text-[#52607D]">
              Total Finished Goods Produced: <strong className="text-[#2F6F5E]">{totalOutputQty.toFixed(2)} Units</strong>
            </span>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-3 border-t border-[#EDEAE1]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCreateModalOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={saving}
            >
              Confirm
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Production Details Modal */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title={`Production Run Details: ${selectedEntry?.reference_number || selectedEntry?.id?.slice(0, 8) || ""}`}
        size="md"
      >
        {selectedEntry && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-2 bg-[#FAFAF8] p-3 rounded-[8px] border border-[#EDEAE1]">
              <div>
                <span className="text-[#52607D]">Production Date:</span>{" "}
                <strong className="text-[#14213D]">{selectedEntry.production_date}</strong>
              </div>
              <div>
                <span className="text-[#52607D]">Reference / Batch:</span>{" "}
                <strong className="text-[#14213D] font-mono">{selectedEntry.reference_number || "—"}</strong>
              </div>
            </div>

            {/* Materials */}
            <div>
              <div className="font-bold text-[#B0403A] uppercase tracking-wider mb-2">
                Raw Materials Used
              </div>
              <table className="w-full text-left">
                <thead className="bg-[#FAFAF8] border-b border-[#EDEAE1] text-[#52607D]">
                  <tr>
                    <th className="py-2 px-3">Raw Material</th>
                    <th className="py-2 px-3 text-right">Qty Used</th>
                    <th className="py-2 px-3 text-right">Wastage</th>
                    <th className="py-2 px-3 text-right font-bold text-[#14213D]">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDEAE1]">
                  {(selectedEntry.materials || []).map((m, idx) => {
                    const used = parseFloat(m.quantity_used || 0);
                    const waste = parseFloat(m.wastage_quantity || 0);
                    return (
                      <tr key={idx}>
                        <td className="py-2 px-3 font-semibold text-[#14213D]">{m.item?.name}</td>
                        <td className="py-2 px-3 text-right font-mono text-rose-600">
                          -{used.toLocaleString()} {m.unit?.symbol || "NOS"}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-amber-700">
                          -{waste.toLocaleString()} {m.unit?.symbol || "NOS"}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-rose-700">
                          -{(used + waste).toLocaleString()} {m.unit?.symbol || "NOS"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Outputs */}
            <div>
              <div className="font-bold text-[#2F6F5E] uppercase tracking-wider mb-2">
                Finished Goods Produced
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
                        +{parseFloat(o.quantity_produced).toLocaleString()} {o.unit?.symbol || "NOS"}
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
