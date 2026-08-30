import React, { useEffect, useState } from "react";
import {
  Factory,
  Plus,
  Trash2,
  RefreshCw,
  Clock,
  ArrowDownRight,
  ArrowUpRight,
  Layers,
} from "lucide-react";
import { plastApi } from "../../api/plastApi.js";
import Navbar from "../../components/layout/Navbar.jsx";
import MetricCard from "../../components/common/MetricCard.jsx";
import Button from "../../components/common/Button.jsx";
import CustomSelect from "../../components/common/CustomSelect.jsx";
import { SkeletonLoader, EmptyState } from "../../components/common/SkeletonLoader.jsx";
import { toast } from "sonner";

export function PlastProductionPage() {
  const [entries, setEntries] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [finishedGoods, setFinishedGoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Form states
  const [productionDate, setProductionDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");

  const [materials, setMaterials] = useState([
    { item_id: "", quantity_used: "", wastage_quantity: "0" },
  ]);
  const [outputs, setOutputs] = useState([
    { item_id: "", quantity_produced: "" },
  ]);

  const loadData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    try {
      const [entriesRes, itemsRes] = await Promise.all([
        plastApi.getProductionEntries(),
        plastApi.getItems(),
      ]);
      const validEntries = Array.isArray(entriesRes) ? entriesRes : entriesRes?.data || [];
      const validItems = Array.isArray(itemsRes) ? itemsRes : itemsRes?.data || [];

      setEntries(validEntries);

      const raw = validItems.filter((i) => i.item_type === "RAW_MATERIAL");
      const fin = validItems.filter((i) => i.item_type === "FINISHED_GOOD");
      setRawMaterials(raw);
      setFinishedGoods(fin);

      if (raw.length > 0 && (!materials[0] || !materials[0].item_id)) {
        setMaterials([{ item_id: raw[0].id, quantity_used: "", wastage_quantity: "0" }]);
      }
      if (fin.length > 0 && (!outputs[0] || !outputs[0].item_id)) {
        setOutputs([{ item_id: fin[0].id, quantity_produced: "" }]);
      }
    } catch (err) {
      toast.error("Failed to load production records");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const addMaterialRow = () => {
    setMaterials((prev) => [
      ...prev,
      { item_id: rawMaterials[0]?.id || "", quantity_used: "", wastage_quantity: "0" },
    ]);
  };

  const removeMaterialRow = (idx) => {
    if (materials.length <= 1) return;
    setMaterials((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateMaterial = (idx, field, val) => {
    setMaterials((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: val };
      return next;
    });
  };

  const addOutputRow = () => {
    setOutputs((prev) => [
      ...prev,
      { item_id: finishedGoods[0]?.id || "", quantity_produced: "" },
    ]);
  };

  const removeOutputRow = (idx) => {
    if (outputs.length <= 1) return;
    setOutputs((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateOutput = (idx, field, val) => {
    setOutputs((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: val };
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validMaterials = materials.filter(
      (m) => m.item_id && parseFloat(m.quantity_used) > 0
    );
    if (validMaterials.length === 0) {
      toast.error("Please add at least 1 raw material consumed with valid quantity");
      return;
    }

    const validOutputs = outputs.filter(
      (o) => o.item_id && parseFloat(o.quantity_produced) > 0
    );
    if (validOutputs.length === 0) {
      toast.error("Please add at least 1 finished good output with valid quantity");
      return;
    }

    setSaving(true);
    try {
      await plastApi.createProductionEntry({
        production_date: productionDate,
        reference_number: referenceNumber.trim() || undefined,
        notes: notes.trim() || undefined,
        materials: validMaterials.map((m) => ({
          item_id: m.item_id,
          quantity_used: parseFloat(m.quantity_used),
          wastage_quantity: parseFloat(m.wastage_quantity) || 0,
        })),
        outputs: validOutputs.map((o) => ({
          item_id: o.item_id,
          quantity_produced: parseFloat(o.quantity_produced),
        })),
      });

      toast.success("Production entry recorded & inventory stock updated");
      setReferenceNumber("");
      setNotes("");
      setMaterials([
        { item_id: rawMaterials[0]?.id || "", quantity_used: "", wastage_quantity: "0" },
      ]);
      setOutputs([
        { item_id: finishedGoods[0]?.id || "", quantity_produced: "" },
      ]);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to record production");
    } finally {
      setSaving(false);
    }
  };

  const safeEntries = Array.isArray(entries) ? entries : [];
  const safeRawMaterials = Array.isArray(rawMaterials) ? rawMaterials : [];
  const safeFinishedGoods = Array.isArray(finishedGoods) ? finishedGoods : [];

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Navbar
        title="Daily Production & Wastage"
        subtitle="Log daily raw material consumption, wastage, and finished goods output"
        actions={
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            loading={refreshing}
            onClick={() => loadData(true)}
          >
            Refresh
          </Button>
        }
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 overflow-y-auto w-full">
        {/* Record Production Form Card */}
        <div className="bg-white rounded-[10px] border border-[#E4E1D8] shadow-[0_1px_2px_rgba(20,33,61,0.04)] overflow-hidden">
          <div className="p-4 border-b border-[#EDEAE1] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Factory size={16} className="text-[#2F6F5E]" />
              <h2 className="text-sm font-bold font-display text-[#14213D]">
                Record Production Log
              </h2>
            </div>
            <span className="text-[11px] text-[#52607D]">
              Atomic Raw Material Deduction & Finished Good Addition
            </span>
          </div>

          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5">
            {/* Header info: Date & Ref */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#14213D] mb-1">
                  Production Date *
                </label>
                <input
                  type="date"
                  required
                  value={productionDate}
                  onChange={(e) => setProductionDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-[#E4E1D8] rounded-[7px] text-[#14213D] focus:outline-none focus:border-[#2F6F5E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#14213D] mb-1">
                  Batch / Reference Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. BATCH-2026-08"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-[#E4E1D8] rounded-[7px] text-[#14213D] placeholder-[#8C97AB] focus:outline-none focus:border-[#2F6F5E]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#14213D] mb-1">
                  Notes / Operator Name
                </label>
                <input
                  type="text"
                  placeholder="Optional shift notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-[#E4E1D8] rounded-[7px] text-[#14213D] placeholder-[#8C97AB] focus:outline-none focus:border-[#2F6F5E]"
                />
              </div>
            </div>

            {/* Two-Column Raw Mat Usage vs Finished Good Output */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2 border-t border-[#EDEAE1]">
              {/* Left Column: Raw Material Consumed */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                    <ArrowDownRight size={14} className="text-amber-600" />
                    <span>Raw Materials Consumed (-)</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    icon={Plus}
                    onClick={addMaterialRow}
                  >
                    Add Material
                  </Button>
                </div>

                {safeRawMaterials.length === 0 ? (
                  <div className="p-4 bg-amber-50 rounded-[7px] text-xs text-amber-800 border border-amber-200">
                    No raw materials found. Please create raw materials in Item Master first.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {materials.map((mat, idx) => {
                      const selectedItem = safeRawMaterials.find((r) => r.id === mat.item_id);
                      return (
                        <div
                          key={idx}
                          className="p-3 bg-[#FAFAF8] rounded-[8px] border border-[#E4E1D8] space-y-2"
                        >
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <CustomSelect
                                size="sm"
                                value={mat.item_id}
                                onChange={(val) => updateMaterial(idx, "item_id", val)}
                                options={safeRawMaterials.map((r) => ({
                                  value: r.id,
                                  label: `${r.name} (Stock: ${r.stock?.quantity_on_hand || 0} ${r.unit?.symbol || ""})`,
                                }))}
                              />
                            </div>
                            {materials.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeMaterialRow(idx)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded cursor-pointer shrink-0"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-[10px] font-semibold text-[#52607D]">
                                Used Qty ({selectedItem?.unit?.symbol || "Kg"}) *
                              </span>
                              <input
                                type="number"
                                step="any"
                                min="0.01"
                                placeholder="Used"
                                value={mat.quantity_used}
                                onChange={(e) => updateMaterial(idx, "quantity_used", e.target.value)}
                                className="w-full mt-0.5 px-2.5 py-1 bg-white border border-[#E4E1D8] rounded-[6px] text-xs text-[#14213D] font-mono focus:outline-none focus:border-[#2F6F5E]"
                              />
                            </div>
                            <div>
                              <span className="text-[10px] font-semibold text-rose-700">
                                Wastage Qty ({selectedItem?.unit?.symbol || "Kg"})
                              </span>
                              <input
                                type="number"
                                step="any"
                                min="0"
                                placeholder="Wastage"
                                value={mat.wastage_quantity}
                                onChange={(e) => updateMaterial(idx, "wastage_quantity", e.target.value)}
                                className="w-full mt-0.5 px-2.5 py-1 bg-white border border-[#E4E1D8] rounded-[6px] text-xs text-[#14213D] font-mono focus:outline-none focus:border-[#2F6F5E]"
                              />
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
                  <div className="text-xs font-bold text-[#1E4D40] uppercase tracking-wider flex items-center gap-1.5">
                    <ArrowUpRight size={14} className="text-[#2F6F5E]" />
                    <span>Finished Goods Output (+)</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    icon={Plus}
                    onClick={addOutputRow}
                  >
                    Add Output
                  </Button>
                </div>

                {safeFinishedGoods.length === 0 ? (
                  <div className="p-4 bg-emerald-50 rounded-[7px] text-xs text-[#1E4D40] border border-emerald-200">
                    No finished goods found. Please create finished goods in Item Master first.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {outputs.map((out, idx) => {
                      const selectedItem = safeFinishedGoods.find((f) => f.id === out.item_id);
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
                                onChange={(val) => updateOutput(idx, "item_id", val)}
                                options={safeFinishedGoods.map((f) => ({
                                  value: f.id,
                                  label: `${f.name} (Current: ${f.stock?.quantity_on_hand || 0} ${f.unit?.symbol || ""})`,
                                }))}
                              />
                            </div>
                            {outputs.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeOutputRow(idx)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded cursor-pointer shrink-0"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>

                          <div>
                            <span className="text-[10px] font-semibold text-[#52607D]">
                              Output Produced ({selectedItem?.unit?.symbol || "Nos"}) *
                            </span>
                            <input
                              type="number"
                              step="any"
                              min="0.01"
                              placeholder="Produced quantity"
                              value={out.quantity_produced}
                              onChange={(e) => updateOutput(idx, "quantity_produced", e.target.value)}
                              className="w-full mt-0.5 px-2.5 py-1 bg-white border border-[#E4E1D8] rounded-[6px] text-xs text-[#14213D] font-mono font-bold focus:outline-none focus:border-[#2F6F5E]"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-[#EDEAE1]">
              <Button type="submit" variant="primary" size="md" loading={saving}>
                Submit Daily Production Log
              </Button>
            </div>
          </form>
        </div>

        {/* History Table */}
        <div className="bg-white rounded-[10px] border border-[#E4E1D8] shadow-[0_1px_2px_rgba(20,33,61,0.04)] overflow-hidden">
          <div className="p-4 border-b border-[#EDEAE1] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-[#52607D]" />
              <h2 className="text-sm font-bold font-display text-[#14213D]">
                Production Log History
              </h2>
            </div>
            <span className="text-xs text-[#52607D] font-mono">
              {safeEntries.length} Total Logs
            </span>
          </div>

          {loading ? (
            <div className="p-6">
              <SkeletonLoader count={3} />
            </div>
          ) : safeEntries.length === 0 ? (
            <EmptyState
              icon={Factory}
              title="No production entries recorded"
              description="Use the form above to record daily raw material usage and manufactured outputs."
            />
          ) : (
            <div className="divide-y divide-[#EDEAE1]">
              {safeEntries.map((entry) => (
                <div key={entry.id} className="p-4 hover:bg-[#FAFAF8] transition-colors space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-[#EAF3F0] text-[#2F6F5E] font-mono text-xs font-bold border border-[#D3E6E0]">
                        {entry.production_date}
                      </span>
                      {entry.reference_number && (
                        <span className="text-xs font-bold text-[#14213D]">
                          Ref: {entry.reference_number}
                        </span>
                      )}
                    </div>
                    {entry.notes && (
                      <div className="text-[11px] text-[#52607D] italic">"{entry.notes}"</div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {/* Consumed */}
                    <div className="p-2.5 rounded-[7px] bg-amber-50/60 border border-amber-200/70 space-y-1">
                      <div className="text-[10px] font-bold uppercase text-amber-900 flex items-center gap-1">
                        <ArrowDownRight size={12} />
                        <span>Consumed Raw Materials</span>
                      </div>
                      {(entry.materials || []).map((m) => (
                        <div key={m.id} className="flex justify-between text-[11px]">
                          <span className="text-[#14213D] font-medium">{m.item?.name || "Raw Mat"}</span>
                          <span className="text-[#52607D]">
                            <strong>{m.quantity_used}</strong> {m.unit?.symbol || "Kg"}{" "}
                            {Number(m.wastage_quantity) > 0 && (
                              <span className="text-rose-600 font-bold">
                                (+{m.wastage_quantity} waste)
                              </span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Output */}
                    <div className="p-2.5 rounded-[7px] bg-[#EAF3F0]/60 border border-[#D3E6E0]/70 space-y-1">
                      <div className="text-[10px] font-bold uppercase text-[#1E4D40] flex items-center gap-1">
                        <ArrowUpRight size={12} />
                        <span>Manufactured Finished Goods</span>
                      </div>
                      {(entry.outputs || []).map((o) => (
                        <div key={o.id} className="flex justify-between text-[11px]">
                          <span className="text-[#14213D] font-medium">{o.item?.name || "Finished Good"}</span>
                          <span className="text-[#2F6F5E] font-bold">
                            +{o.quantity_produced} {o.unit?.symbol || "Nos"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default PlastProductionPage;
