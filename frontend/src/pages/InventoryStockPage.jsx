import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Boxes,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Plus,
  ArrowRight,
  Package,
  Layers,
  BookOpen,
  Calendar,
  Filter,
  SlidersHorizontal,
  Factory,
  CheckCircle2,
  AlertCircle,
  X,
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
  const [openingDate, setOpeningDate] = useState(new Date().toISOString().split("T")[0]);
  const [savingOpening, setSavingOpening] = useState(false);
  const [openingError, setOpeningError] = useState("");

  // Adjustment Modal
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [adjustType, setAdjustType] = useState("ADJUSTMENT_OUT");
  const [adjustQty, setAdjustQty] = useState("");
  const [savingAdjust, setSavingAdjust] = useState(false);
  const [adjustError, setAdjustError] = useState("");

  // Ledger Modal with Date Filter Fix
  const [ledgerModalOpen, setLedgerModalOpen] = useState(false);
  const [ledgerItem, setLedgerItem] = useState(null);
  const [ledgerStartDate, setLedgerStartDate] = useState("");
  const [ledgerEndDate, setLedgerEndDate] = useState("");
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [closingBalance, setClosingBalance] = useState(0);
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
        movement_date: openingDate,
      });

      setOpeningModalOpen(false);
      setOpeningItemId("");
      setOpeningQty("");
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

      await api.post("/inventory/adjustments", {
        item_id: selectedItem.id,
        adjustment_type: adjustType,
        quantity: qty,
      });

      setAdjustModalOpen(false);
      setSelectedItem(null);
      setAdjustQty("");
      fetchStock();
    } catch (err) {
      setAdjustError(err.response?.data?.message || err.message || "Failed to adjust stock");
    } finally {
      setSavingAdjust(false);
    }
  };

  const fetchLedger = async (item, sDate = ledgerStartDate, eDate = ledgerEndDate) => {
    if (!item) return;
    setLedgerLoading(true);
    try {
      const params = {};
      if (sDate) params.start_date = sDate;
      if (eDate) params.end_date = eDate;

      const res = await api.get(`/inventory/items/${item.id}/ledger`, { params });
      setLedgerEntries(res.data?.ledger || []);
      setOpeningBalance(parseFloat(res.data?.opening_balance ?? 0));
      setClosingBalance(parseFloat(res.data?.closing_balance ?? 0));
    } catch (err) {
      console.error("Failed to load item ledger:", err);
    } finally {
      setLedgerLoading(false);
    }
  };

  useEffect(() => {
    if (ledgerModalOpen && ledgerItem) {
      const timer = setTimeout(() => {
        fetchLedger(ledgerItem, ledgerStartDate, ledgerEndDate);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [ledgerStartDate, ledgerEndDate, ledgerModalOpen]);

  const openLedgerModal = (item) => {
    setLedgerItem(item);
    setLedgerStartDate("");
    setLedgerEndDate("");
    setLedgerModalOpen(true);
  };

  const handleResetLedgerFilter = () => {
    setLedgerStartDate("");
    setLedgerEndDate("");
  };

  const totalRawStock = stockList
    .filter((s) => s.item_type === "RAW_MATERIAL")
    .reduce((sum, s) => sum + parseFloat(s.quantity_on_hand || 0), 0);

  const totalFinishedStock = stockList
    .filter((s) => s.item_type === "FINISHED_GOOD")
    .reduce((sum, s) => sum + parseFloat(s.quantity_on_hand || 0), 0);

  const getMovementBadgeStyle = (type) => {
    switch (type) {
      case "OPENING":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "PURCHASE":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "PRODUCTION_IN":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "PRODUCTION_OUT":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "PRODUCTION_WASTAGE":
        return "bg-amber-100 text-amber-900 border-amber-300";
      case "DISPATCH":
      case "SALE":
        return "bg-rose-100 text-rose-800 border-rose-200";
      case "REVERSAL":
        return "bg-teal-100 text-teal-800 border-teal-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#FAFAF8] min-h-screen">
      <Navbar
        title="Inventory & Stock Management"
        subtitle="Real physical stock-on-hand backed strictly by immutable movement ledger"
      />

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
            title="Raw Material Stock"
            value={`${totalRawStock.toLocaleString("en-IN", { maximumFractionDigits: 1 })} Units`}
            icon={TrendingUp}
            accentColor="#2B5B84"
            description="Purchased raw materials"
          />
          <MetricCard
            title="Finished Goods Stock"
            value={`${totalFinishedStock.toLocaleString("en-IN", { maximumFractionDigits: 1 })} Units`}
            icon={Package}
            accentColor="#D97706"
            description="Manufactured from production"
          />
          <MetricCard
            title="Zero / Low Stock"
            value={stockList.filter((s) => (parseFloat(s.quantity_on_hand) || 0) <= 0).length}
            icon={TrendingDown}
            accentColor="#C81E1E"
            description="Items with 0 or low stock"
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
              <Button variant="outline" size="sm" icon={Plus}>
                Purchase Receipt
              </Button>
            </Link>
            <Link to="/inventory/production">
              <Button variant="primary" size="sm" icon={Factory}>
                Daily Production
              </Button>
            </Link>
          </div>
        </div>

        {/* Stock Ledger Table */}
        <div className="bg-white border border-[#E4E1D8] rounded-[10px] shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-[#EDEAE1] flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#14213D] font-display">
                Physical Stock on Hand (Source: Movement Ledger)
              </h2>
              <p className="text-xs text-[#52607D]">
                Showing {stockList.length} items recorded across all categories
              </p>
            </div>
          </div>

          {loading ? (
            <div className="p-6">
              <SkeletonLoader rows={8} />
            </div>
          ) : stockList.length === 0 ? (
            <EmptyState
              icon={Boxes}
              title="No items found in stock"
              description="No active items match your filter criteria or search query."
              action={
                <Button
                  size="sm"
                  onClick={() => {
                    setSearch("");
                    setSelectedType("");
                    fetchStock("", "");
                  }}
                >
                  Clear Filters
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#EDEAE1] bg-[#FAFAF8] text-[#52607D] font-semibold">
                    <th className="py-3 px-4">Item SKU / Code</th>
                    <th className="py-3 px-4">Item Name</th>
                    <th className="py-3 px-4">Item Type</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Unit</th>
                    <th className="py-3 px-4 text-right">Physical On-Hand</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDEAE1] text-[#14213D]">
                  {stockList.map((item) => {
                    const qty = parseFloat(item.quantity_on_hand) || 0;
                    const isRaw = item.item_type === "RAW_MATERIAL";
                    return (
                      <tr key={item.id} className="hover:bg-[#FAFAF8] transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-[#52607D]">
                          {item.code || "—"}
                        </td>
                        <td className="py-3 px-4 font-semibold text-[#14213D]">
                          {item.name}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isRaw
                                ? "bg-[#EBF3FB] text-[#2B5B84]"
                                : "bg-[#FDF3E7] text-[#D97706]"
                            }`}
                          >
                            {isRaw ? "RAW MATERIAL" : "FINISHED GOOD"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[#52607D]">
                          {item.category || "General"}
                        </td>
                        <td className="py-3 px-4 font-mono font-medium">
                          {item.unit}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-sm">
                          <span
                            className={
                              qty > 0
                                ? "text-[#2F6F5E]"
                                : qty === 0
                                ? "text-[#8C97AB]"
                                : "text-[#C81E1E]"
                            }
                          >
                            {qty.toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() => openLedgerModal(item)}
                            >
                              Ledger
                            </Button>
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => {
                                setSelectedItem(item);
                                setAdjustType("ADJUSTMENT_OUT");
                                setAdjustQty("");
                                setAdjustError("");
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

        {/* Opening Stock Modal */}
        <Modal
          isOpen={openingModalOpen}
          onClose={() => setOpeningModalOpen(false)}
          title="Initial Opening Stock Onboarding"
        >
          <form onSubmit={handleOpeningStock} className="space-y-4">
            <p className="text-xs text-[#52607D]">
              Record initial physical stock available when installing Cheran. Supports both Raw Materials and Finished Goods.
            </p>

            {openingError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-[8px]">
                {openingError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#14213D] mb-1">
                Select Item <span className="text-rose-500">*</span>
              </label>
              <CustomSelect
                value={openingItemId}
                onChange={(val) => setOpeningItemId(val)}
                placeholder="Choose Raw Material or Finished Good"
                options={itemsList.map((i) => ({
                  value: i.id,
                  label: `${i.name} [${i.item_type}] (${i.unit?.symbol || "NOS"})`,
                }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#14213D] mb-1">
                  Opening Quantity <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  placeholder="e.g. 1000"
                  value={openingQty}
                  onChange={(e) => setOpeningQty(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono border border-[#E4E1D8] rounded-[7px] focus:outline-none focus:border-[#2F6F5E]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#14213D] mb-1">
                  Opening Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={openingDate}
                  onChange={(e) => setOpeningDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono border border-[#E4E1D8] rounded-[7px] focus:outline-none focus:border-[#2F6F5E]"
                  required
                />
              </div>
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
                loading={savingOpening}
              >
                Confirm
              </Button>
            </div>
          </form>
        </Modal>

        {/* Stock Adjustment Modal */}
        <Modal
          isOpen={adjustModalOpen}
          onClose={() => setAdjustModalOpen(false)}
          title={`Stock Adjustment: ${selectedItem?.name}`}
        >
          <form onSubmit={handleAdjustStock} className="space-y-4">
            {adjustError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-[8px]">
                {adjustError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#14213D] mb-1">
                Adjustment Direction
              </label>
              <CustomSelect
                value={adjustType}
                onChange={(val) => setAdjustType(val)}
                options={[
                  { value: "ADJUSTMENT_IN", label: "Stock Increase (+)" },
                  { value: "ADJUSTMENT_OUT", label: "Stock Reduction (-)" },
                ]}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#14213D] mb-1">
                Adjustment Quantity ({selectedItem?.unit}) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.001"
                min="0.001"
                placeholder="Quantity"
                value={adjustQty}
                onChange={(e) => setAdjustQty(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono border border-[#E4E1D8] rounded-[7px] focus:outline-none focus:border-[#2F6F5E]"
                required
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
                loading={savingAdjust}
              >
                Confirm
              </Button>
            </div>
          </form>
        </Modal>

        {/* Item Ledger Modal (With Date Filter & Opening Balance Fix) */}
        <Modal
          isOpen={ledgerModalOpen}
          onClose={() => setLedgerModalOpen(false)}
          title={`Stock Movement Ledger: ${ledgerItem?.name}`}
          size="lg"
        >
          <div className="space-y-4">
            {/* Header info */}
            <div className="p-3 bg-[#FAFAF8] rounded-[8px] border border-[#E4E1D8] flex items-center justify-between text-xs font-mono">
              <div>
                <span className="text-[#52607D]">SKU:</span> <strong>{ledgerItem?.code || "—"}</strong> | <span className="text-[#52607D]">Type:</span> <strong>{ledgerItem?.item_type}</strong> | <span className="text-[#52607D]">Unit:</span> <strong>{ledgerItem?.unit}</strong>
              </div>
              <div>
                <span className="text-[#52607D]">Current Stock:</span>{" "}
                <span className="font-bold text-[#2F6F5E]">
                  {parseFloat(ledgerItem?.quantity_on_hand || 0).toFixed(2)} {ledgerItem?.unit}
                </span>
              </div>
            </div>

            {/* Date Filter Bar */}
            <div className="flex flex-wrap items-center gap-2 bg-white p-2.5 rounded-[8px] border border-[#E4E1D8]">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-[#52607D] font-semibold">From:</span>
                <input
                  type="date"
                  value={ledgerStartDate}
                  onChange={(e) => setLedgerStartDate(e.target.value)}
                  className="px-2 py-1 text-xs font-mono bg-[#FAFAF8] border border-[#E4E1D8] rounded-[6px] focus:outline-none focus:ring-1 focus:ring-[#2F6F5E]"
                />
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-[#52607D] font-semibold">To:</span>
                <input
                  type="date"
                  value={ledgerEndDate}
                  onChange={(e) => setLedgerEndDate(e.target.value)}
                  className="px-2 py-1 text-xs font-mono bg-[#FAFAF8] border border-[#E4E1D8] rounded-[6px] focus:outline-none focus:ring-1 focus:ring-[#2F6F5E]"
                />
              </div>

              {(ledgerStartDate || ledgerEndDate) && (
                <Button size="xs" variant="secondary" icon={X} onClick={handleResetLedgerFilter}>
                  Reset
                </Button>
              )}
            </div>

            {/* Opening Balance Banner when date filtering is active */}
            {ledgerStartDate && (
              <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-[8px] flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  <span>
                    Opening Balance before <strong>{ledgerStartDate}</strong>:
                  </span>
                </div>
                <strong className="text-sm font-bold text-blue-900">
                  {openingBalance.toFixed(2)} {ledgerItem?.unit}
                </strong>
              </div>
            )}

            {ledgerLoading ? (
              <SkeletonLoader rows={5} />
            ) : ledgerEntries.length === 0 ? (
              <div className="text-center py-6 text-xs text-[#8C97AB]">
                No stock movements found for this item in the selected period.
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto border border-[#E4E1D8] rounded-[8px]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 bg-[#FAFAF8] border-b border-[#EDEAE1] text-[#52607D] font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Movement Type</th>
                      <th className="py-2.5 px-3 text-right">In (+)</th>
                      <th className="py-2.5 px-3 text-right">Out (-)</th>
                      <th className="py-2.5 px-3 text-right font-bold">Running Balance</th>
                      <th className="py-2.5 px-3">Ref / Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDEAE1] text-[#14213D] font-mono">
                    {/* Explicit Opening row if start_date filtered */}
                    {ledgerStartDate && (
                      <tr className="bg-blue-50/50 font-bold">
                        <td className="py-2 px-3 text-[#52607D]">{ledgerStartDate}</td>
                        <td className="py-2 px-3 font-sans">
                          <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                            OPENING (B/F)
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right text-[#52607D]">—</td>
                        <td className="py-2 px-3 text-right text-[#52607D]">—</td>
                        <td className="py-2 px-3 text-right font-bold text-blue-900">
                          {openingBalance.toFixed(2)}
                        </td>
                        <td className="py-2 px-3 font-sans text-[#52607D] text-[11px]">
                          Balance brought forward
                        </td>
                      </tr>
                    )}

                    {ledgerEntries.map((m) => (
                      <tr key={m.id} className="hover:bg-[#FAFAF8]">
                        <td className="py-2.5 px-3">{m.movement_date}</td>
                        <td className="py-2.5 px-3 font-sans">
                          <span
                            className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold border ${getMovementBadgeStyle(m.movement_type)}`}
                          >
                            {m.movement_type}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right text-[#2F6F5E] font-semibold">
                          {m.quantity_in > 0 ? `+${m.quantity_in.toFixed(2)}` : "—"}
                        </td>
                        <td className="py-2.5 px-3 text-right text-[#C81E1E] font-semibold">
                          {m.quantity_out > 0 ? `-${m.quantity_out.toFixed(2)}` : "—"}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-[#14213D]">
                          {m.running_balance.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 font-sans text-[#52607D] text-[11px]">
                          {m.reference_type || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-[#EDEAE1]">
              <div className="text-xs font-mono text-[#52607D]">
                Closing Period Balance: <strong className="text-[#14213D]">{closingBalance.toFixed(2)} {ledgerItem?.unit}</strong>
              </div>
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
