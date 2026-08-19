import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Trash2,
  RefreshCw,
  ArrowLeft,
  Calendar,
  Layers,
  Filter,
  ShoppingBag,
  TrendingUp,
  Boxes,
  Eye,
  X,
} from "lucide-react";
import api from "../api/client.js";
import Navbar from "../components/layout/Navbar.jsx";
import MetricCard from "../components/common/MetricCard.jsx";
import Button from "../components/common/Button.jsx";
import CustomSelect from "../components/common/CustomSelect.jsx";
import Modal from "../components/common/Modal.jsx";
import Pagination from "../components/common/Pagination.jsx";
import { SkeletonLoader, EmptyState } from "../components/common/SkeletonLoader.jsx";

export function StockReceiptsPage() {
  const [receipts, setReceipts] = useState([]);
  const [summary, setSummary] = useState({ totalReceipts: 0, totalPurchasedQuantity: 0, totalPurchasedValue: 0 });
  const [itemsList, setItemsList] = useState([]);
  const [suppliersList, setSuppliersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 1 });

  // Filters for Purchase History
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filterSupplier, setFilterSupplier] = useState("");
  const [filterItem, setFilterItem] = useState("");

  // Create Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split("T")[0]);
  const [refNumber, setRefNumber] = useState("");
  const [lines, setLines] = useState([
    { item_id: "", quantity: "", unit_price: "", unit_symbol: "" },
  ]);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // View Details Modal
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  const fetchDependencies = async () => {
    try {
      const [itemsRes, supsRes] = await Promise.all([
        api.get("/items?limit=500&is_active=true"),
        api.get("/suppliers?limit=500&is_active=true"),
      ]);
      // Only RAW_MATERIAL can be purchased
      setItemsList(itemsRes.data?.items || []);
      setSuppliersList(supsRes.data?.suppliers || []);
    } catch (err) {
      console.error("Failed to load dependency masters:", err);
    }
  };

  const fetchReceipts = async (page = 1, limit = pagination.limit) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
        ...(startDate ? { start_date: startDate } : {}),
        ...(endDate ? { end_date: endDate } : {}),
        ...(filterSupplier ? { supplier_id: filterSupplier } : {}),
        ...(filterItem ? { item_id: filterItem } : {}),
      };

      const res = await api.get("/inventory/receipts", { params });
      setReceipts(res.data?.receipts || []);
      setSummary(res.data?.summary || { totalReceipts: 0, totalPurchasedQuantity: 0, totalPurchasedValue: 0 });
      setPagination(res.data?.pagination || { page, limit, total: 0, totalPages: 1 });
    } catch (err) {
      console.error("Failed to load receipts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDependencies();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReceipts(1, pagination.limit);
    }, 200);
    return () => clearTimeout(timer);
  }, [startDate, endDate, filterSupplier, filterItem]);

  const handleResetFilter = () => {
    setStartDate("");
    setEndDate("");
    setFilterSupplier("");
    setFilterItem("");
  };

  const rawMaterialsList = itemsList.filter((it) => it.item_type === "RAW_MATERIAL");

  const handleOpenAdd = () => {
    setSupplierId(suppliersList.length > 0 ? suppliersList[0].id : "");
    setSupplierName("");
    setReceiptDate(new Date().toISOString().split("T")[0]);
    setRefNumber("");
    setLines([
      {
        item_id: rawMaterialsList.length > 0 ? rawMaterialsList[0].id : "",
        quantity: "",
        unit_price: rawMaterialsList.length > 0 ? (rawMaterialsList[0].unit_price || "") : "",
        unit_symbol: rawMaterialsList.length > 0 ? (rawMaterialsList[0].unit?.symbol || "NOS") : "",
      },
    ]);
    setErrorMsg("");
    setModalOpen(true);
  };

  const handleAddLine = () => {
    const defaultItem = rawMaterialsList.length > 0 ? rawMaterialsList[0] : null;
    setLines([
      ...lines,
      {
        item_id: defaultItem ? defaultItem.id : "",
        quantity: "",
        unit_price: defaultItem ? (defaultItem.unit_price || "") : "",
        unit_symbol: defaultItem ? (defaultItem.unit?.symbol || "NOS") : "",
      },
    ]);
  };

  const handleRemoveLine = (idx) => {
    if (lines.length === 1) return;
    setLines(lines.filter((_, i) => i !== idx));
  };

  const handleLineItemChange = (idx, itemId) => {
    const selected = rawMaterialsList.find((it) => it.id === itemId);
    const updated = [...lines];
    updated[idx].item_id = itemId;
    updated[idx].unit_symbol = selected?.unit?.symbol || selected?.unit?.name || "NOS";
    if (selected && selected.unit_price !== undefined && selected.unit_price !== null && parseFloat(selected.unit_price) > 0) {
      updated[idx].unit_price = selected.unit_price;
    }
    setLines(updated);
  };

  const handleLineQtyChange = (idx, val) => {
    const updated = [...lines];
    updated[idx].quantity = val;
    setLines(updated);
  };

  const handleLinePriceChange = (idx, val) => {
    const updated = [...lines];
    updated[idx].unit_price = val;
    setLines(updated);
  };

  const calculateReceiptTotal = () => {
    return lines.reduce(
      (acc, curr) => acc + ((parseFloat(curr.quantity) || 0) * (parseFloat(curr.unit_price) || 0)),
      0
    );
  };

  const handleSaveReceipt = async (e) => {
    e.preventDefault();
    if (lines.some((l) => !l.item_id || (parseFloat(l.quantity) || 0) <= 0)) {
      setErrorMsg("All line items must have a selected raw material and positive quantity.");
      return;
    }

    try {
      setSaving(true);
      setErrorMsg("");

      const payload = {
        supplier_id: supplierId || null,
        supplier_name: supplierName || null,
        receipt_date: receiptDate,
        reference_number: refNumber.trim() || null,
        items: lines.map((l) => ({
          item_id: l.item_id,
          quantity: parseFloat(l.quantity),
          unit_price: parseFloat(l.unit_price) || 0,
        })),
      };

      await api.post("/inventory/receipts", payload);

      setModalOpen(false);
      fetchReceipts(1, pagination.limit);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to record raw material purchase receipt.");
    } finally {
      setSaving(false);
    }
  };

  const handleViewReceipt = (rec) => {
    setSelectedReceipt(rec);
    setViewModalOpen(true);
  };

  const supplierOptions = [
    { value: "", label: "Other / Direct Supplier" },
    ...suppliersList.map((s) => ({ value: s.id, label: s.name })),
  ];

  const rawMaterialOptions = rawMaterialsList.map((it) => ({
    value: it.id,
    label: `${it.name} (${it.unit?.symbol || "NOS"})`,
  }));

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Navbar
        title="Raw Material Purchases & Receipts"
        subtitle="Purchase receipts exclusively for Raw Materials with date-filtered history"
        actions={
          <div className="flex items-center gap-2">
            <Link to="/inventory">
              <Button variant="secondary" icon={ArrowLeft}>
                Stock
              </Button>
            </Link>
            <Button variant="secondary" icon={RefreshCw} onClick={() => fetchReceipts(pagination.page, pagination.limit)}>
              Refresh
            </Button>
            <Button icon={Plus} onClick={handleOpenAdd}>
              Add
            </Button>
          </div>
        }
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 overflow-y-auto">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricCard
            title="Total Purchases"
            value={summary?.totalReceipts || 0}
            icon={ShoppingBag}
            accentColor="#2F6F5E"
            description="Purchases in filtered range"
          />
          <MetricCard
            title="Total Raw Material Quantity"
            value={`${(summary?.totalPurchasedQuantity || 0).toLocaleString()} Units`}
            icon={Boxes}
            accentColor="#4361EE"
            description="Cumulative volume purchased"
          />
          <MetricCard
            title="Total Purchase Value"
            value={`₹${(summary?.totalPurchasedValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon={TrendingUp}
            accentColor="#D97706"
            description="Total procurement spend"
          />
        </div>

        {/* Filter Bar */}
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

          <div className="w-48">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#52607D] mb-1">
              Raw Material
            </label>
            <CustomSelect
              options={[{ value: "", label: "All Raw Materials" }, ...rawMaterialOptions]}
              value={filterItem}
              onChange={(val) => setFilterItem(val)}
              size="sm"
            />
          </div>

          <div className="w-48">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#52607D] mb-1">
              Supplier
            </label>
            <CustomSelect
              options={[{ value: "", label: "All Suppliers" }, ...suppliersList.map((s) => ({ value: s.id, label: s.name }))]}
              value={filterSupplier}
              onChange={(val) => setFilterSupplier(val)}
              size="sm"
            />
          </div>

          {(startDate || endDate || filterSupplier || filterItem) && (
            <div className="flex items-center pt-1">
              <Button size="sm" variant="secondary" icon={X} onClick={handleResetFilter}>
                Clear
              </Button>
            </div>
          )}
        </div>

        {/* Purchase History Table */}
        <div className="bg-white border border-[#E4E1D8] rounded-[10px] shadow-[0_1px_2px_rgba(20,33,61,0.04)] overflow-hidden">
          {loading ? (
            <div className="p-6">
              <SkeletonLoader rows={8} />
            </div>
          ) : receipts.length === 0 ? (
            <EmptyState
              title="No raw material purchases found"
              description={
                startDate || endDate || filterSupplier || filterItem
                  ? "No purchases match the selected filters. Try broadening your date range or clearing filters."
                  : "Record your first raw material vendor purchase to credit inventory."
              }
              action={
                <Button size="sm" icon={Plus} onClick={handleOpenAdd}>
                  Add
                </Button>
              }
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAFAF8] border-b border-[#E4E1D8] text-[#52607D] uppercase font-semibold">
                    <tr>
                      <th className="py-3 px-4">Receipt Date</th>
                      <th className="py-3 px-4">Supplier / Vendor</th>
                      <th className="py-3 px-4">Ref Number</th>
                      <th className="py-3 px-4">Raw Materials Purchased</th>
                      <th className="py-3 px-4 text-right">Total Amount</th>
                      <th className="py-3 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDEAE1]">
                    {receipts.map((rec) => (
                      <tr key={rec.id} className="hover:bg-[#FAFAF8] transition-colors">
                        <td className="py-3 px-4 font-medium text-[#14213D] whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={13} className="text-[#2F6F5E]" />
                            <span>{rec.receipt_date}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-semibold text-[#14213D]">
                          {rec.supplier?.name || rec.supplier_name || "Direct Supplier"}
                        </td>
                        <td className="py-3 px-4 font-mono text-[#52607D]">
                          {rec.reference_number || "—"}
                        </td>
                        <td className="py-3 px-4 text-[#52607D] space-y-1">
                          {(rec.items || []).map((line, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 font-mono text-[11px]">
                              <span className="font-semibold text-[#14213D]">{line.item?.name}</span>:
                              <span>{(parseFloat(line.quantity) || 0).toLocaleString()} {line.unit?.symbol || "NOS"}</span>
                              {parseFloat(line.unit_price) > 0 && (
                                <span className="text-[#8C97AB]">(@ ₹{parseFloat(line.unit_price)})</span>
                              )}
                            </div>
                          ))}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-sm text-[#2F6F5E] whitespace-nowrap">
                          ₹{parseFloat(rec.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleViewReceipt(rec)}
                            className="p-1.5 text-[#52607D] hover:text-[#2F6F5E] hover:bg-[#EAF3F0] rounded cursor-pointer transition-colors"
                            title="View Receipt Details"
                          >
                            <Eye size={14} />
                          </button>
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
                onPageChange={(p) => fetchReceipts(p, pagination.limit)}
                onLimitChange={(l) => fetchReceipts(1, l)}
              />
            </>
          )}
        </div>
      </main>

      {/* New Purchase Receipt Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Record Raw Material Purchase Receipt"
        size="lg"
      >
        <form onSubmit={handleSaveReceipt} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-[8px]">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#14213D] mb-1">
                Supplier / Vendor
              </label>
              <CustomSelect
                options={supplierOptions}
                value={supplierId}
                onChange={(val) => setSupplierId(val)}
                placeholder="Select Vendor"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#14213D] mb-1">
                Receipt Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={receiptDate}
                onChange={(e) => setReceiptDate(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#14213D] mb-1">
                Invoice / Ref Number
              </label>
              <input
                type="text"
                placeholder="e.g. INV-2026-089"
                value={refNumber}
                onChange={(e) => setRefNumber(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
              />
            </div>
          </div>

          {/* Dynamic Line Items - Raw Material Only */}
          <div className="pt-3 border-t border-[#EDEAE1] space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[#52607D]">
                Raw Materials Purchased
              </label>
              <button
                type="button"
                onClick={handleAddLine}
                className="text-xs font-semibold text-[#2F6F5E] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus size={13} /> Add
              </button>
            </div>

            {/* Column Headers */}
            <div className="flex items-center gap-2 px-2 text-[11px] font-semibold text-[#52607D]">
              <div className="flex-1">Raw Material</div>
              <div className="w-28 text-right">Quantity</div>
              <div className="w-28 text-right">Price / Rate (₹)</div>
              <div className="w-24 text-right">Line Total (₹)</div>
              {lines.length > 1 && <div className="w-6"></div>}
            </div>

            <div className="space-y-2 overflow-visible pr-1">
              {lines.map((line, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-[#FAFAF8] p-2 rounded-[8px] border border-[#EDEAE1]">
                  <div className="flex-1">
                    <CustomSelect
                      value={line.item_id}
                      onChange={(val) => handleLineItemChange(idx, val)}
                      placeholder="Select Raw Material"
                      options={rawMaterialsList.map((i) => ({
                        value: i.id,
                        label: `${i.name} (${i.unit?.symbol || "NOS"})`,
                      }))}
                      size="sm"
                    />
                  </div>

                  <div className="w-28">
                    <input
                      type="number"
                      step="0.001"
                      placeholder="Qty"
                      value={line.quantity}
                      onChange={(e) => handleLineQtyChange(idx, e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs font-mono text-right bg-white border border-[#E4E1D8] rounded-[6px] focus:outline-none focus:border-[#2F6F5E] focus:ring-1 focus:ring-[#2F6F5E]"
                      required
                    />
                  </div>

                  <div className="w-28">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Rate ₹"
                      value={line.unit_price}
                      onChange={(e) => handleLinePriceChange(idx, e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs font-mono text-right bg-white border border-[#E4E1D8] rounded-[6px] focus:outline-none focus:border-[#2F6F5E] focus:ring-1 focus:ring-[#2F6F5E]"
                    />
                  </div>

                  <div className="w-24 text-right font-mono text-xs font-bold text-[#14213D]">
                    ₹{(parseFloat(line.quantity || 0) * parseFloat(line.unit_price || 0)).toFixed(2)}
                  </div>

                  {lines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveLine(idx)}
                      className="p-1 text-[#B0403A] hover:bg-[#FDF2F1] rounded cursor-pointer transition-colors"
                      title="Remove Line"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="p-3 bg-[#FAFAF8] border border-[#EDEAE1] rounded-[8px] flex items-center justify-between text-xs">
              <span className="font-semibold text-[#52607D]">Total Purchase Value:</span>
              <strong className="font-mono text-base font-bold text-[#2F6F5E]">
                ₹{calculateReceiptTotal().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </strong>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-[#EDEAE1]">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Confirm
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Receipt Modal */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title={`Purchase Receipt Details: ${selectedReceipt?.reference_number || selectedReceipt?.id?.slice(0, 8) || ""}`}
        size="md"
      >
        {selectedReceipt && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-2 bg-[#FAFAF8] p-3 rounded-[8px] border border-[#EDEAE1]">
              <div>
                <span className="text-[#52607D]">Receipt Date:</span>{" "}
                <strong className="text-[#14213D]">{selectedReceipt.receipt_date}</strong>
              </div>
              <div>
                <span className="text-[#52607D]">Supplier:</span>{" "}
                <strong className="text-[#14213D]">{selectedReceipt.supplier?.name || selectedReceipt.supplier_name || "Direct Supplier"}</strong>
              </div>
              <div>
                <span className="text-[#52607D]">Ref Number:</span>{" "}
                <strong className="text-[#14213D] font-mono">{selectedReceipt.reference_number || "—"}</strong>
              </div>
              <div>
                <span className="text-[#52607D]">Total Spend:</span>{" "}
                <strong className="text-[#2F6F5E] font-mono font-bold">₹{parseFloat(selectedReceipt.total_amount || 0).toLocaleString()}</strong>
              </div>
            </div>

            <div>
              <div className="font-bold text-[#52607D] uppercase tracking-wider mb-2">Purchased Line Items</div>
              <table className="w-full text-left">
                <thead className="bg-[#FAFAF8] border-b border-[#EDEAE1] text-[#52607D]">
                  <tr>
                    <th className="py-2 px-3">Raw Material</th>
                    <th className="py-2 px-3 text-right">Quantity</th>
                    <th className="py-2 px-3 text-right">Unit Price</th>
                    <th className="py-2 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDEAE1]">
                  {(selectedReceipt.items || []).map((line, idx) => (
                    <tr key={idx}>
                      <td className="py-2 px-3 font-semibold text-[#14213D]">{line.item?.name}</td>
                      <td className="py-2 px-3 text-right font-mono">{(parseFloat(line.quantity) || 0).toLocaleString()} {line.unit?.symbol || "NOS"}</td>
                      <td className="py-2 px-3 text-right font-mono">₹{parseFloat(line.unit_price || 0).toFixed(2)}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-[#2F6F5E]">₹{parseFloat(line.total_amount || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-3 border-t border-[#EDEAE1]">
              <Button variant="secondary" size="sm" onClick={() => setViewModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default StockReceiptsPage;
