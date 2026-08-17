import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Boxes,
  SlidersHorizontal,
  History,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Plus,
  ArrowRight,
  Package,
  Layers,
  BookOpen,
  FileText,
  AlertCircle,
} from "lucide-react";
import api from "../api/client.js";
import Navbar from "../components/layout/Navbar.jsx";
import MetricCard from "../components/common/MetricCard.jsx";
import Button from "../components/common/Button.jsx";
import CustomSelect from "../components/common/CustomSelect.jsx";
import Modal from "../components/common/Modal.jsx";
import { SkeletonLoader, EmptyState } from "../components/common/SkeletonLoader.jsx";

const ITEM_TYPES = [
  { value: "", label: "All Types" },
  { value: "RAW_MATERIAL", label: "Raw Materials" },
  { value: "FINISHED_GOOD", label: "Finished Goods" },
];

export function InventoryStockPage() {
  const [stockList, setStockList] = useState([]);
  const [itemsList, setItemsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("");

  // Opening Stock Modal
  const [openingModalOpen, setOpeningModalOpen] = useState(false);
  const [openingItemId, setOpeningItemId] = useState("");
  const [openingQty, setOpeningQty] = useState("");
  const [openingNotes, setOpeningNotes] = useState("");
  const [savingOpening, setSavingOpening] = useState(false);
  const [openingError, setOpeningError] = useState("");

  // Adjustment Modal
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [adjustType, setAdjustType] = useState("ADJUSTMENT_OUT");
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustNotes, setAdjustNotes] = useState("");
  const [savingAdjust, setSavingAdjust] = useState(false);
  const [adjustError, setAdjustError] = useState("");

  // Ledger Modal
  const [ledgerModalOpen, setLedgerModalOpen] = useState(false);
  const [ledgerItem, setLedgerItem] = useState(null);
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  const fetchStock = async (searchVal = search, typeVal = selectedType) => {
    try {
      setLoading(true);
      const params = {};
      if (searchVal) params.search = searchVal.trim();
      if (typeVal) params.item_type = typeVal;

      const [stockRes, itemsRes] = await Promise.all([
        api.get("/inventory/stock", { params }),
        api.get("/items?limit=500&is_active=true"),
      ]);

      setStockList(stockRes.data?.stock || []);
      setItemsList(itemsRes.data?.items || []);
    } catch (err) {
      console.error("Failed to load inventory stock:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    fetchStock(val, selectedType);
  };

  const handleTypeChange = (val) => {
    setSelectedType(val);
    fetchStock(search, val);
  };

  const handleOpeningStock = async (e) => {
    e.preventDefault();
    setSavingOpening(true);
    setOpeningError("");

    try {
      if (!openingItemId) throw new Error("Please select an item");
      const qty = parseFloat(openingQty);
      if (isNaN(qty) || qty <= 0) throw new Error("Quantity must be greater than 0");

      await api.post("/inventory/opening-stock", {
        item_id: openingItemId,
        quantity: qty,
        notes: openingNotes.trim() || "Initial stock onboarding",
      });

      setOpeningModalOpen(false);
      setOpeningItemId("");
      setOpeningQty("");
      setOpeningNotes("");
      fetchStock();
    } catch (err) {
      setOpeningError(err.response?.data?.message || err.message || "Failed to record opening stock");
    } finally {
      setSavingOpening(false);
    }
  };

  const handleAdjustStock = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;
    setSavingAdjust(true);
    setAdjustError("");

    try {
      const qty = parseFloat(adjustQty);
      if (isNaN(qty) || qty <= 0) throw new Error("Quantity must be greater than 0");
      if (!adjustNotes.trim()) throw new Error("Mandatory reason note is required for physical adjustments");

      await api.post("/inventory/adjustments", {
        item_id: selectedItem.id,
        adjustment_type: adjustType,
        quantity: qty,
        notes: adjustNotes.trim(),
      });

      setAdjustModalOpen(false);
      setSelectedItem(null);
      setAdjustQty("");
      setAdjustNotes("");
      fetchStock();
    } catch (err) {
      setAdjustError(err.response?.data?.message || err.message || "Failed to adjust stock");
    } finally {
      setSavingAdjust(false);
    }
  };

  const openLedgerModal = async (item) => {
    setLedgerItem(item);
    setLedgerModalOpen(true);
    setLedgerLoading(true);
    try {
      const res = await api.get(`/inventory/items/${item.id}/ledger`);
      setLedgerEntries(res.data?.ledger || []);
    } catch (err) {
      console.error("Failed to load item ledger:", err);
    } finally {
      setLedgerLoading(false);
    }
  };

  const totalRawStock = stockList
    .filter((s) => s.item_type === "RAW_MATERIAL")
    .reduce((sum, s) => sum + parseFloat(s.quantity_on_hand || 0), 0);

  const totalFinishedStock = stockList
    .filter((s) => s.item_type === "FINISHED_GOOD")
    .reduce((sum, s) => sum + parseFloat(s.quantity_on_hand || 0), 0);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#FAFAF8] min-h-screen">
      <Navbar title="Inventory & Stock Management" subtitle="Real physical stock-on-hand backed strictly by immutable movement ledger" />

      <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Catalog Items"
            value={stockList.length}
            icon={Boxes}
            accentColor="#2F6F5E"
          />
          <MetricCard
            title="Raw Material Quantity"
            value={totalRawStock.toLocaleString("en-IN", { maximumFractionDigits: 1 })}
            icon={TrendingUp}
            accentColor="#2B5B84"
          />
          <MetricCard
            title="Finished Goods Quantity"
            value={totalFinishedStock.toLocaleString("en-IN", { maximumFractionDigits: 1 })}
            icon={Package}
            accentColor="#D97706"
          />
          <MetricCard
            title="Zero / Low Stock"
            value={stockList.filter((s) => (parseFloat(s.quantity_on_hand) || 0) <= 0).length}
            icon={TrendingDown}
            accentColor="#C81E1E"
          />
        </div>

        {/* Action Header */}
        <div className="bg-white p-4 rounded-[10px] border border-[#E4E1D8] shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <input
              type="text"
              placeholder="Search by SKU code or Item name..."
              value={search}
              onChange={handleSearchChange}
              className="w-full md:w-64 px-3 py-1.5 text-xs bg-white border border-[#E4E1D8] rounded-[7px] text-[#14213D] placeholder-[#8C97AB] focus:outline-none focus:border-[#2F6F5E]"
            />
            <div className="w-48">
              <CustomSelect
                value={selectedType}
                onChange={handleTypeChange}
                options={ITEM_TYPES}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={() => fetchStock()}
            >
              Refresh
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={Plus}
              onClick={() => setOpeningModalOpen(true)}
            >
              Opening Stock Entry
            </Button>
            <Link to="/inventory/receipts">
              <Button variant="primary" size="sm" icon={Plus}>
                Purchase Receipt
              </Button>
            </Link>
          </div>
        </div>

        {/* Stock Ledger Table */}
        <div className="bg-white rounded-[10px] border border-[#E4E1D8] shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-[#EDEAE1] flex items-center justify-between">
            <h2 className="text-sm font-bold font-display text-[#14213D]">
              Physical Stock on Hand (Source: Movement Ledger)
            </h2>
            <span className="text-xs text-[#52607D]">
              Showing {stockList.length} items
            </span>
          </div>

          {loading ? (
            <SkeletonLoader rows={6} />
          ) : stockList.length === 0 ? (
            <EmptyState
              icon={Boxes}
              title="No Stock Records Found"
              description="Record opening stock or purchase receipts to start tracking inventory."
              actionLabel="Enter Opening Stock"
              onAction={() => setOpeningModalOpen(true)}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#EDEAE1] bg-[#FAFAF8] text-[#52607D] font-semibold">
                    <th className="py-3 px-4">SKU / Code</th>
                    <th className="py-3 px-4">Item Name</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-right">On Hand</th>
                    <th className="py-3 px-4">Unit</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDEAE1] text-[#14213D]">
                  {stockList.map((item) => {
                    const qty = parseFloat(item.quantity_on_hand) || 0;
                    return (
                      <tr key={item.id} className="hover:bg-[#FAFAF8] transition-colors">
                        <td className="py-3 px-4 font-mono text-[#52607D]">
                          {item.code || "—"}
                        </td>
                        <td className="py-3 px-4 font-semibold text-[#14213D]">
                          {item.name}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EAF3F0] text-[#2F6F5E]">
                            {item.item_type}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[#52607D]">{item.category || "—"}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold">
                          <span
                            className={
                              qty > 0
                                ? "text-[#2F6F5E]"
                                : qty === 0
                                ? "text-[#D97706]"
                                : "text-[#C81E1E]"
                            }
                          >
                            {qty.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-[#52607D]">{item.unit}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="xs"
                              icon={BookOpen}
                              onClick={() => openLedgerModal(item)}
                            >
                              Ledger
                            </Button>
                            <Button
                              variant="outline"
                              size="xs"
                              icon={SlidersHorizontal}
                              onClick={() => {
                                setSelectedItem(item);
                                setAdjustModalOpen(true);
                              }}
                            >
                              Adjust
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Opening Stock Entry Modal */}
        <Modal
          isOpen={openingModalOpen}
          onClose={() => !savingOpening && setOpeningModalOpen(false)}
          title="Onboard Initial Opening Stock"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleOpeningStock} className="space-y-4">
            {openingError && (
              <div className="p-3 bg-[#FDE8E8] border border-[#F8B4B4] rounded-[7px] text-xs text-[#C81E1E] flex items-center gap-2">
                <AlertCircle size={15} />
                <span>{openingError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#14213D] mb-1">
                Item *
              </label>
              <CustomSelect
                value={openingItemId}
                onChange={(val) => setOpeningItemId(val)}
                options={[
                  { value: "", label: "Select Catalog Item..." },
                  ...itemsList
                    .filter((i) => ["RAW_MATERIAL", "FINISHED_GOOD"].includes(i.item_type))
                    .map((i) => ({
                      value: i.id,
                      label: `${i.name} (${i.unit?.symbol || i.unit?.name || "Unit"})`,
                    })),
                ]}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#14213D] mb-1">
                Opening Quantity *
              </label>
              <input
                type="number"
                step="any"
                min="0.001"
                required
                placeholder="e.g. 10000"
                value={openingQty}
                onChange={(e) => setOpeningQty(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-[#E4E1D8] rounded-[7px] focus:outline-none focus:border-[#2F6F5E]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#14213D] mb-1">
                Notes / Verification Source
              </label>
              <input
                type="text"
                placeholder="e.g. Physical inventory count at go-live"
                value={openingNotes}
                onChange={(e) => setOpeningNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-[#E4E1D8] rounded-[7px] focus:outline-none focus:border-[#2F6F5E]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#EDEAE1]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpeningModalOpen(false)}
                disabled={savingOpening}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={savingOpening}
              >
                {savingOpening ? "Saving..." : "Commit Opening Stock"}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Manual Stock Adjustment Modal */}
        <Modal
          isOpen={adjustModalOpen}
          onClose={() => !savingAdjust && setAdjustModalOpen(false)}
          title={`Adjust Physical Stock: ${selectedItem?.name}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleAdjustStock} className="space-y-4">
            {adjustError && (
              <div className="p-3 bg-[#FDE8E8] border border-[#F8B4B4] rounded-[7px] text-xs text-[#C81E1E] flex items-center gap-2">
                <AlertCircle size={15} />
                <span>{adjustError}</span>
              </div>
            )}

            <div className="p-3 bg-[#FAFAF8] rounded-[7px] border border-[#E4E1D8] text-xs space-y-1 font-mono">
              <div className="flex justify-between text-[#52607D]">
                <span>Current Stock on Hand:</span>
                <span className="font-bold text-[#14213D]">
                  {parseFloat(selectedItem?.quantity_on_hand || 0).toFixed(2)} {selectedItem?.unit}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#14213D] mb-1">
                Adjustment Direction *
              </label>
              <CustomSelect
                value={adjustType}
                onChange={(val) => setAdjustType(val)}
                options={[
                  { value: "ADJUSTMENT_OUT", label: "Stock Reduction (-) (Loss, Damage, Correction)" },
                  { value: "ADJUSTMENT_IN", label: "Stock Addition (+) (Found stock, Count correction)" },
                ]}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#14213D] mb-1">
                Adjustment Quantity ({selectedItem?.unit}) *
              </label>
              <input
                type="number"
                step="any"
                min="0.001"
                required
                placeholder="e.g. 50"
                value={adjustQty}
                onChange={(e) => setAdjustQty(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-[#E4E1D8] rounded-[7px] focus:outline-none focus:border-[#2F6F5E]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#14213D] mb-1">
                Mandatory Reason / Audit Note *
              </label>
              <textarea
                required
                rows={2}
                placeholder="e.g. Physical stock count correction - defective end cuts"
                value={adjustNotes}
                onChange={(e) => setAdjustNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-[#E4E1D8] rounded-[7px] focus:outline-none focus:border-[#2F6F5E]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#EDEAE1]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAdjustModalOpen(false)}
                disabled={savingAdjust}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={savingAdjust}
              >
                {savingAdjust ? "Recording Movement..." : "Commit Adjustment"}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Item Ledger Modal */}
        <Modal
          isOpen={ledgerModalOpen}
          onClose={() => setLedgerModalOpen(false)}
          title={`Item Movement Ledger: ${ledgerItem?.name}`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-4">
            <div className="p-3 bg-[#FAFAF8] rounded-[8px] border border-[#E4E1D8] flex items-center justify-between text-xs font-mono">
              <div>
                <span className="text-[#52607D]">SKU:</span> <strong>{ledgerItem?.code || "—"}</strong> | <span className="text-[#52607D]">Unit:</span> <strong>{ledgerItem?.unit}</strong>
              </div>
              <div>
                <span className="text-[#52607D]">Current Stock:</span>{" "}
                <span className="font-bold text-[#2F6F5E]">
                  {parseFloat(ledgerItem?.quantity_on_hand || 0).toFixed(2)} {ledgerItem?.unit}
                </span>
              </div>
            </div>

            {ledgerLoading ? (
              <SkeletonLoader rows={5} />
            ) : ledgerEntries.length === 0 ? (
              <div className="text-center py-6 text-xs text-[#8C97AB]">
                No movement ledger entries found for this item.
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto border border-[#E4E1D8] rounded-[8px]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#EDEAE1] bg-[#FAFAF8] text-[#52607D] font-semibold">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Movement Type</th>
                      <th className="py-2.5 px-3 text-right">In (+)</th>
                      <th className="py-2.5 px-3 text-right">Out (-)</th>
                      <th className="py-2.5 px-3 text-right font-bold">Balance</th>
                      <th className="py-2.5 px-3">Notes / Ref</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDEAE1] text-[#14213D] font-mono">
                    {ledgerEntries.map((m) => (
                      <tr key={m.id} className="hover:bg-[#FAFAF8]">
                        <td className="py-2.5 px-3">{m.movement_date}</td>
                        <td className="py-2.5 px-3 font-sans">
                          <span
                            className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              m.quantity_in > 0
                                ? "bg-[#EAF3F0] text-[#2F6F5E]"
                                : "bg-[#FDE8E8] text-[#C81E1E]"
                            }`}
                          >
                            {m.movement_type}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right text-[#2F6F5E]">
                          {m.quantity_in > 0 ? `+${m.quantity_in.toFixed(2)}` : "—"}
                        </td>
                        <td className="py-2.5 px-3 text-right text-[#C81E1E]">
                          {m.quantity_out > 0 ? `-${m.quantity_out.toFixed(2)}` : "—"}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-[#14213D]">
                          {m.running_balance.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 font-sans text-[#52607D] text-[11px]">
                          {m.notes || m.reference_type || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setLedgerModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      </main>
    </div>
  );
}

export default InventoryStockPage;
