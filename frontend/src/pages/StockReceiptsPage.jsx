import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Plus,
  Trash2,
  RefreshCw,
  Truck,
  ArrowLeft,
  Calendar,
  Layers,
} from "lucide-react";
import api from "../api/client.js";
import Navbar from "../components/layout/Navbar.jsx";
import Button from "../components/common/Button.jsx";
import CustomSelect from "../components/common/CustomSelect.jsx";
import Modal from "../components/common/Modal.jsx";
import Pagination from "../components/common/Pagination.jsx";
import { SkeletonLoader, EmptyState } from "../components/common/SkeletonLoader.jsx";

export function StockReceiptsPage() {
  const [receipts, setReceipts] = useState([]);
  const [itemsList, setItemsList] = useState([]);
  const [suppliersList, setSuppliersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 1 });

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split("T")[0]);
  const [refNumber, setRefNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState([
    { item_id: "", quantity: "", unit_price: "", unit_symbol: "" },
  ]);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchDependencies = async () => {
    try {
      const [itemsRes, supsRes] = await Promise.all([
        api.get("/items?limit=500&is_active=true"),
        api.get("/suppliers?limit=500&is_active=true"),
      ]);
      setItemsList(itemsRes.data?.items || []);
      setSuppliersList(supsRes.data?.suppliers || []);
    } catch (err) {
      console.error("Failed to load dependency masters:", err);
    }
  };

  const fetchReceipts = async (page = 1, limit = pagination.limit) => {
    try {
      setLoading(true);
      const res = await api.get("/inventory/receipts", { params: { page, limit } });
      setReceipts(res.data?.receipts || []);
      setPagination(res.data?.pagination || { page, limit, total: 0, totalPages: 1 });
    } catch (err) {
      console.error("Failed to load receipts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDependencies();
    fetchReceipts(1, pagination.limit);
  }, []);

  const handleOpenAdd = () => {
    setSupplierId(suppliersList.length > 0 ? suppliersList[0].id : "");
    setSupplierName("");
    setReceiptDate(new Date().toISOString().split("T")[0]);
    setRefNumber("");
    setNotes("");
    setLines([
      {
        item_id: "",
        quantity: "",
        unit_price: "",
        unit_symbol: "",
      },
    ]);
    setErrorMsg("");
    setModalOpen(true);
  };

  const handleAddLine = () => {
    setLines([
      ...lines,
      {
        item_id: "",
        quantity: "",
        unit_price: "",
        unit_symbol: "",
      },
    ]);
  };

  const handleRemoveLine = (idx) => {
    if (lines.length === 1) return;
    setLines(lines.filter((_, i) => i !== idx));
  };

  const handleLineItemChange = (idx, itemId) => {
    const selected = itemsList.find((it) => it.id === itemId);
    const updated = [...lines];
    updated[idx].item_id = itemId;
    updated[idx].unit_symbol = selected?.unit?.name || selected?.unit?.symbol || "";
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
      setErrorMsg("All line items must have a selected item and positive quantity.");
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
        notes: notes.trim() || null,
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
      setErrorMsg(err.response?.data?.message || "Failed to record purchase receipt.");
    } finally {
      setSaving(false);
    }
  };

  const supplierOptions = [
    { value: "", label: "Other / Unregistered Supplier" },
    ...suppliersList.map((s) => ({ value: s.id, label: s.name })),
  ];

  const itemOptions = itemsList.map((it) => ({
    value: it.id,
    label: `${it.name} (${it.unit?.symbol || "NOS"})`,
  }));

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Navbar
        title="Stock Purchase Receipts"
        subtitle={`Raw material and vendor purchase receipts (${pagination.total.toLocaleString()} recorded)`}
        actions={
          <div className="flex items-center gap-2">
            <Link to="/inventory">
              <Button variant="secondary" icon={ArrowLeft}>
                Stock On-Hand
              </Button>
            </Link>
            <Button variant="secondary" icon={RefreshCw} onClick={() => fetchReceipts(pagination.page, pagination.limit)}>
              Refresh
            </Button>
            <Button icon={Plus} onClick={handleOpenAdd}>
              New Purchase Receipt
            </Button>
          </div>
        }
      />

      <main className="p-8 space-y-6 flex-1 overflow-y-auto">
        <div className="bg-white border border-[#E4E1D8] rounded-[10px] shadow-[0_1px_2px_rgba(20,33,61,0.04)] overflow-hidden">
          {loading ? (
            <div className="p-6">
              <SkeletonLoader rows={8} />
            </div>
          ) : receipts.length === 0 ? (
            <EmptyState
              title="No purchase receipts logged"
              description="Record your first vendor material purchase to automatically credit inventory."
              action={
                <Button size="sm" icon={Plus} onClick={handleOpenAdd}>
                  New Purchase Receipt
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
                      <th className="py-3 px-4">Items Received</th>
                      <th className="py-3 px-4 text-right">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDEAE1]">
                    {receipts.map((rec) => (
                      <tr key={rec.id} className="hover:bg-[#FAFAF8] transition-colors">
                        <td className="py-3 px-4 font-medium text-[#14213D] flex items-center gap-2">
                          <Calendar size={13} className="text-[#2F6F5E]" />
                          {rec.receipt_date}
                        </td>
                        <td className="py-3 px-4 font-semibold text-[#14213D]">
                          {rec.supplier?.name || rec.supplier_name || "Direct Vendor"}
                        </td>
                        <td className="py-3 px-4 font-mono text-[#52607D]">
                          {rec.reference_number || "—"}
                        </td>
                        <td className="py-3 px-4 text-[#52607D] space-y-1">
                          {(rec.items || []).map((line, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 font-mono text-[11px]">
                              <span className="font-semibold text-[#14213D]">{line.item?.name}</span>:
                              <span>{parseFloat(line.quantity).toLocaleString()} {line.unit?.symbol}</span>
                              {parseFloat(line.unit_price) > 0 && (
                                <span className="text-[#8C97AB]">(@ ₹{parseFloat(line.unit_price)})</span>
                              )}
                            </div>
                          ))}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-sm text-[#2F6F5E]">
                          ₹{parseFloat(rec.total_amount || 0).toLocaleString()}
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
        title="Record Stock Purchase Receipt"
        size="lg"
      >
        <form onSubmit={handleSaveReceipt} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-[8px]">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#14213D] mb-1">
                Vendor Bill / Reference No.
              </label>
              <input
                type="text"
                placeholder="e.g. BILL-2026-089"
                value={refNumber}
                onChange={(e) => setRefNumber(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#14213D] mb-1">
                Notes
              </label>
              <input
                type="text"
                placeholder="Remarks, vehicle number, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
              />
            </div>
          </div>

          {/* Dynamic Line Items */}
          <div className="pt-3 border-t border-[#EDEAE1] space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[#52607D]">
                Purchase Line Items
              </label>
              <button
                type="button"
                onClick={handleAddLine}
                className="text-xs font-semibold text-[#2F6F5E] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus size={13} /> Add Item Line
              </button>
            </div>

            {/* Column Headers for Quantity and Rate */}
            <div className="flex items-center gap-2 px-2 text-[11px] font-semibold text-[#52607D]">
              <div className="flex-1">Material / Item</div>
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
                      placeholder="Select Material / Item"
                      options={itemsList
                        .filter((i) => ["RAW_MATERIAL", "FINISHED_GOOD"].includes(i.item_type))
                        .map((i) => ({
                          value: i.id,
                          label: `${i.name} (${i.unit?.symbol || i.unit?.name || "Unit"})`,
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
              <span className="font-semibold text-[#52607D]">Calculated Total Amount:</span>
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
              Record & Credit Stock
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default StockReceiptsPage;
