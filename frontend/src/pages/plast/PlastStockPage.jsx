import React, { useEffect, useState } from "react";
import {
  Boxes,
  RefreshCw,
  Search,
  TrendingUp,
  Package,
  AlertTriangle,
  Sliders,
} from "lucide-react";
import { plastApi } from "../../api/plastApi.js";
import Navbar from "../../components/layout/Navbar.jsx";
import MetricCard from "../../components/common/MetricCard.jsx";
import Button from "../../components/common/Button.jsx";
import Modal from "../../components/common/Modal.jsx";
import CustomSelect from "../../components/common/CustomSelect.jsx";
import { SkeletonLoader, EmptyState } from "../../components/common/SkeletonLoader.jsx";
import { toast } from "sonner";

const TYPE_OPTIONS = [
  { value: "", label: "All Item Types" },
  { value: "RAW_MATERIAL", label: "Raw Materials" },
  { value: "FINISHED_GOOD", label: "Finished Goods" },
];

export function PlastStockPage() {
  const [stockList, setStockList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState("");
  const [search, setSearch] = useState("");

  // Adjustment Modal State
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedItemForAdjust, setSelectedItemForAdjust] = useState(null);
  const [newQuantity, setNewQuantity] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [adjusting, setAdjusting] = useState(false);

  const fetchStock = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await plastApi.getStockOnHand({
        item_type: filterType || undefined,
        search: search || undefined,
      });
      setStockList(Array.isArray(data) ? data : data?.data || []);
    } catch (err) {
      toast.error("Failed to load inventory stock");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStock();
    }, 200);
    return () => clearTimeout(timer);
  }, [filterType, search]);

  const openAdjustModal = (item = null) => {
    const targetItem = item || safeStockList[0] || null;
    setSelectedItemForAdjust(targetItem);
    setNewQuantity(targetItem ? String(targetItem.quantity_on_hand ?? "") : "");
    setAdjustReason(targetItem && Number(targetItem.quantity_on_hand || 0) === 0 ? "Opening stock entry" : "");
    setIsAdjustModalOpen(true);
  };

  const handleSaveAdjustment = async (e) => {
    e.preventDefault();
    if (!selectedItemForAdjust) {
      toast.error("Please select an item to adjust");
      return;
    }

    const parsed = parseFloat(newQuantity);
    if (isNaN(parsed) || parsed < 0) {
      toast.error("Please enter a valid non-negative stock quantity");
      return;
    }

    setAdjusting(true);
    try {
      await plastApi.adjustStock({
        item_id: selectedItemForAdjust.id,
        new_quantity: parsed,
        reason: adjustReason.trim() || undefined,
      });
      toast.success(
        `Stock for "${selectedItemForAdjust.name}" set to ${parsed} ${selectedItemForAdjust.unit || "Units"}`
      );
      setIsAdjustModalOpen(false);
      fetchStock();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to adjust stock");
    } finally {
      setAdjusting(false);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(val || 0);
  };

  const safeStockList = Array.isArray(stockList) ? stockList : [];
  const rawStock = safeStockList.filter((s) => s.item_type === "RAW_MATERIAL");
  const finishedStock = safeStockList.filter((s) => s.item_type === "FINISHED_GOOD");
  const lowStockCount = safeStockList.filter((s) => Number(s.quantity_on_hand || 0) <= 5).length;
  const totalValue = safeStockList.reduce((acc, s) => acc + Number(s.stock_value || 0), 0);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Navbar
        title="Stock On-Hand"
        subtitle="Live inventory balances, valuations, and stock level tracking"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              loading={refreshing}
              onClick={() => fetchStock(true)}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Sliders}
              onClick={() => openAdjustModal(null)}
            >
              + Adjust Stock
            </Button>
          </div>
        }
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 overflow-y-auto w-full">
        {/* KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Stock Value"
            value={formatCurrency(totalValue)}
            subtitle={`${safeStockList.length} Total Inventory SKUs`}
            icon={Boxes}
          />
          <MetricCard
            title="Raw Materials"
            value={`${rawStock.length} Items`}
            subtitle={`Valuation: ${formatCurrency(rawStock.reduce((acc, s) => acc + Number(s.stock_value || 0), 0))}`}
            icon={TrendingUp}
          />
          <MetricCard
            title="Finished Goods"
            value={`${finishedStock.length} Items`}
            subtitle={`Valuation: ${formatCurrency(finishedStock.reduce((acc, s) => acc + Number(s.stock_value || 0), 0))}`}
            icon={Package}
          />
          <MetricCard
            title="Low / Zero Stock"
            value={`${lowStockCount} Items`}
            subtitle="Stock on-hand &le; 5 units"
            icon={AlertTriangle}
          />
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-3 sm:p-4 rounded-[10px] border border-[#E4E1D8] shadow-[0_1px_2px_rgba(20,33,61,0.04)] flex flex-col sm:flex-row items-center gap-3 justify-between">
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C97AB]" />
            <input
              type="text"
              placeholder="Search stock by item name or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-[#E4E1D8] rounded-[7px] text-[#14213D] placeholder-[#8C97AB] focus:outline-none focus:border-[#2F6F5E]"
            />
          </div>

          <div className="w-full sm:w-56 shrink-0">
            <CustomSelect
              value={filterType}
              onChange={(val) => setFilterType(val)}
              options={TYPE_OPTIONS}
            />
          </div>
        </div>

        {/* Stock Data Table */}
        <div className="bg-white rounded-[10px] border border-[#E4E1D8] shadow-[0_1px_2px_rgba(20,33,61,0.04)] overflow-hidden">
          {loading ? (
            <div className="p-6">
              <SkeletonLoader count={5} />
            </div>
          ) : safeStockList.length === 0 ? (
            <EmptyState
              icon={Boxes}
              title="No inventory stock found"
              description="Add purchases or record production entries to update inventory levels."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] border-b border-[#EDEAE1] text-[#52607D] font-semibold">
                  <tr>
                    <th className="py-3 px-4">Item Name</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3 text-right">Unit Price</th>
                    <th className="py-3 px-4 text-right">Available Qty</th>
                    <th className="py-3 px-4 text-right">Stock Value</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDEAE1]">
                  {safeStockList.map((item) => {
                    const isRaw = item.item_type === "RAW_MATERIAL";
                    const isLow = Number(item.quantity_on_hand || 0) <= 5;

                    return (
                      <tr key={item.id} className="hover:bg-[#FAFAF8] transition-colors">
                        <td className="py-3 px-4 font-bold text-[#14213D]">{item.name}</td>
                        <td className="py-3 px-3">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              isRaw
                                ? "bg-amber-100 text-amber-900 border border-amber-200"
                                : "bg-blue-100 text-blue-900 border border-blue-200"
                            }`}
                          >
                            {isRaw ? "Raw Material" : "Finished Good"}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-[#52607D]">{item.category || "—"}</td>
                        <td className="py-3 px-3 text-right font-medium text-[#14213D]">
                          {formatCurrency(item.unit_price)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-sm">
                          <span className={isLow ? "text-rose-600" : "text-emerald-700"}>
                            {item.quantity_on_hand || 0}
                          </span>{" "}
                          <span className="text-[10px] text-[#52607D] font-normal">
                            {typeof item.unit === "object" ? (item.unit?.symbol || item.unit?.name || "Units") : (item.unit || "Units")}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-[#14213D]">
                          {formatCurrency(item.stock_value)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isLow ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-700">
                              <AlertTriangle size={10} />
                              <span>Low Stock</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                              Normal
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => openAdjustModal(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-[6px] text-[#2F6F5E] bg-[#EAF3F0] hover:bg-[#D3E6E0] border border-[#D3E6E0] transition-colors cursor-pointer"
                            title="Adjust Stock Balance"
                          >
                            <Sliders size={12} />
                            <span>Adjust</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Stock Adjustment Modal */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => {
          if (!adjusting) setIsAdjustModalOpen(false);
        }}
        title="Adjust Stock Balance"
        size="md"
      >
        <form onSubmit={handleSaveAdjustment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#14213D] mb-1">
              Select Item *
            </label>
            <CustomSelect
              value={selectedItemForAdjust?.id || ""}
              onChange={(val) => {
                const found = safeStockList.find((it) => it.id === val);
                if (found) {
                  setSelectedItemForAdjust(found);
                  setNewQuantity(String(found.quantity_on_hand ?? ""));
                }
              }}
              options={safeStockList.map((it) => ({
                value: it.id,
                label: `${it.name} (${it.item_type === "RAW_MATERIAL" ? "Raw Material" : "Finished Good"} - Current: ${it.quantity_on_hand} ${it.unit || "Units"})`,
              }))}
            />
          </div>

          {selectedItemForAdjust && (
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] p-3 text-xs space-y-1">
              <div className="flex justify-between text-[#52607D]">
                <span>Category:</span>
                <span className="font-medium text-[#14213D]">{selectedItemForAdjust.category || "—"}</span>
              </div>
              <div className="flex justify-between text-[#52607D]">
                <span>Current Stock On-Hand:</span>
                <span className="font-bold text-[#14213D]">
                  {selectedItemForAdjust.quantity_on_hand} {selectedItemForAdjust.unit || "Units"}
                </span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#14213D] mb-1">
              New Stock Balance ({selectedItemForAdjust?.unit || "Units"}) *
            </label>
            <input
              type="number"
              step="any"
              min="0"
              required
              placeholder="e.g. 150 or 0"
              value={newQuantity}
              onChange={(e) => setNewQuantity(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-[#E4E1D8] rounded-[6px] text-[#14213D] font-mono font-bold focus:outline-none focus:border-[#2F6F5E]"
            />
            {selectedItemForAdjust && newQuantity !== "" && !isNaN(parseFloat(newQuantity)) && (
              <p className="mt-1 text-[11px] text-[#52607D]">
                {parseFloat(newQuantity) === Number(selectedItemForAdjust.quantity_on_hand || 0) ? (
                  <span>No change to existing balance</span>
                ) : parseFloat(newQuantity) > Number(selectedItemForAdjust.quantity_on_hand || 0) ? (
                  <span className="text-emerald-700 font-semibold">
                    Stock increase of +{(parseFloat(newQuantity) - Number(selectedItemForAdjust.quantity_on_hand || 0)).toFixed(2)} {selectedItemForAdjust.unit || "Units"}
                  </span>
                ) : (
                  <span className="text-amber-700 font-semibold">
                    Stock decrease of -{(Number(selectedItemForAdjust.quantity_on_hand || 0) - parseFloat(newQuantity)).toFixed(2)} {selectedItemForAdjust.unit || "Units"}
                  </span>
                )}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#14213D] mb-1">
              Adjustment Reason / Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Opening stock entry, physical audit correction, damaged stock deduction"
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E4E1D8] rounded-[6px] text-[#14213D] focus:outline-none focus:border-[#2F6F5E]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#EDEAE1]">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={adjusting}
              onClick={() => setIsAdjustModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={adjusting}
            >
              Save Stock Balance
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default PlastStockPage;
