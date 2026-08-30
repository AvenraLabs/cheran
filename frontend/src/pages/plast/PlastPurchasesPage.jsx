import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Truck,
  Plus,
  Trash2,
  RefreshCw,
  Search,
  DollarSign,
  Package,
} from "lucide-react";
import { plastApi } from "../../api/plastApi.js";
import Navbar from "../../components/layout/Navbar.jsx";
import MetricCard from "../../components/common/MetricCard.jsx";
import Button from "../../components/common/Button.jsx";
import Modal from "../../components/common/Modal.jsx";
import CustomSelect from "../../components/common/CustomSelect.jsx";
import { SkeletonLoader, EmptyState } from "../../components/common/SkeletonLoader.jsx";
import { toast } from "sonner";

export function PlastPurchasesPage() {
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  // Modal states
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [receiptDate, setReceiptDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([
    { item_id: "", quantity: "", unit_price: "" },
  ]);
  const [saving, setSaving] = useState(false);

  const loadData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    try {
      const [purchasesRes, suppliersRes, itemsRes] = await Promise.all([
        plastApi.getPurchases(),
        plastApi.getSuppliers(),
        plastApi.getItems({ item_type: "RAW_MATERIAL" }),
      ]);
      const validPurchases = Array.isArray(purchasesRes) ? purchasesRes : purchasesRes?.data || [];
      const validSuppliers = Array.isArray(suppliersRes) ? suppliersRes : suppliersRes?.data || [];
      const validItems = Array.isArray(itemsRes) ? itemsRes : itemsRes?.data || [];

      setPurchases(validPurchases);
      setSuppliers(validSuppliers);
      setRawMaterials(validItems);

      if (validSuppliers.length > 0 && !supplierId) {
        setSupplierId(validSuppliers[0].id);
      }
      if (validItems.length > 0 && (!items[0] || !items[0].item_id)) {
        setItems([
          {
            item_id: validItems[0].id,
            quantity: "",
            unit_price: String(validItems[0].unit_price || ""),
          },
        ]);
      }
    } catch (err) {
      toast.error("Failed to load purchase records");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(val || 0);
  };

  const addItemRow = () => {
    setItems((prev) => [
      ...prev,
      {
        item_id: rawMaterials[0]?.id || "",
        quantity: "",
        unit_price: String(rawMaterials[0]?.unit_price || ""),
      },
    ]);
  };

  const removeItemRow = (idx) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateItem = (idx, field, val) => {
    setItems((prev) => {
      const next = [...prev];
      if (field === "item_id") {
        const itemObj = rawMaterials.find((r) => r.id === val);
        next[idx] = {
          ...next[idx],
          item_id: val,
          unit_price: String(itemObj?.unit_price || ""),
        };
      } else {
        next[idx] = { ...next[idx], [field]: val };
      }
      return next;
    });
  };

  const calculateTotal = () => {
    return items.reduce((acc, it) => {
      const qty = parseFloat(it.quantity) || 0;
      const price = parseFloat(it.unit_price) || 0;
      return acc + qty * price;
    }, 0);
  };

  const handleSavePurchase = async (e) => {
    e.preventDefault();

    const validItems = items.filter(
      (it) => it.item_id && parseFloat(it.quantity) > 0
    );

    if (validItems.length === 0) {
      toast.error("Please add at least 1 raw material with quantity > 0");
      return;
    }

    setSaving(true);
    try {
      await plastApi.createPurchase({
        supplier_id: supplierId || undefined,
        receipt_date: receiptDate,
        reference_number: referenceNumber.trim() || undefined,
        notes: notes.trim() || undefined,
        items: validItems.map((it) => ({
          item_id: it.item_id,
          quantity: parseFloat(it.quantity),
          unit_price: parseFloat(it.unit_price) || 0,
        })),
      });

      toast.success("Purchase recorded & raw stock increased successfully");
      setIsPurchaseModalOpen(false);
      // Reset
      setReferenceNumber("");
      setNotes("");
      setItems([
        {
          item_id: rawMaterials[0]?.id || "",
          quantity: "",
          unit_price: String(rawMaterials[0]?.unit_price || ""),
        },
      ]);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to save purchase");
    } finally {
      setSaving(false);
    }
  };

  const safePurchases = Array.isArray(purchases) ? purchases : [];
  const safeSuppliers = Array.isArray(suppliers) ? suppliers : [];
  const safeRawMaterials = Array.isArray(rawMaterials) ? rawMaterials : [];

  const filteredPurchases = safePurchases.filter((p) => {
    if (!search) return true;
    const term = search.toLowerCase();
    const supName = (p.supplier_name || p.supplier?.name || "").toLowerCase();
    const ref = (p.reference_number || "").toLowerCase();
    return supName.includes(term) || ref.includes(term);
  });

  const totalSpent = safePurchases.reduce((acc, p) => acc + Number(p.total_amount || 0), 0);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Navbar
        title="Raw Material Purchases"
        subtitle="Inward vendor receipts and raw stock additions"
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              loading={refreshing}
              onClick={() => loadData(true)}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => setIsPurchaseModalOpen(true)}
            >
              + Record Purchase
            </Button>
          </>
        }
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 overflow-y-auto w-full">
        {/* KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricCard
            title="Total Purchases Spend"
            value={formatCurrency(totalSpent)}
            subtitle={`${safePurchases.length} Total Receipts Logged`}
            icon={DollarSign}
          />
          <MetricCard
            title="Active Raw Materials"
            value={`${safeRawMaterials.length} SKUs`}
            subtitle="Purchased polymer & raw inventory"
            icon={Package}
          />
          <MetricCard
            title="Registered Suppliers"
            value={`${safeSuppliers.length} Suppliers`}
            subtitle="Raw material supplier network"
            icon={Truck}
          />
        </div>

        {/* Search Bar */}
        <div className="bg-white p-3 sm:p-4 rounded-[10px] border border-[#E4E1D8] shadow-[0_1px_2px_rgba(20,33,61,0.04)] flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C97AB]" />
            <input
              type="text"
              placeholder="Search purchases by supplier or reference..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-[#E4E1D8] rounded-[7px] text-[#14213D] placeholder-[#8C97AB] focus:outline-none focus:border-[#2F6F5E]"
            />
          </div>

          <Link to="/plast/suppliers">
            <Button variant="secondary" size="sm" icon={Truck}>
              Suppliers &rarr;
            </Button>
          </Link>
        </div>

        {/* Purchases Table */}
        <div className="bg-white rounded-[10px] border border-[#E4E1D8] shadow-[0_1px_2px_rgba(20,33,61,0.04)] overflow-hidden">
          {loading ? (
            <div className="p-6">
              <SkeletonLoader count={4} />
            </div>
          ) : filteredPurchases.length === 0 ? (
            <EmptyState
              icon={Truck}
              title="No raw material purchases found"
              description="Click '+ Record Purchase' above to add raw material inward bills from suppliers."
            />
          ) : (
            <div className="divide-y divide-[#EDEAE1]">
              {filteredPurchases.map((p) => (
                <div key={p.id} className="p-4 hover:bg-[#FAFAF8] transition-colors space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200 font-mono text-xs font-bold">
                        {p.receipt_date}
                      </span>
                      <span className="text-xs font-bold text-[#14213D]">
                        {p.supplier_name || p.supplier?.name || "Direct Supplier"}
                      </span>
                      {p.reference_number && (
                        <span className="text-[11px] text-[#52607D] font-mono">
                          (Ref: {p.reference_number})
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-bold text-[#2F6F5E]">
                      Total: {formatCurrency(p.total_amount)}
                    </div>
                  </div>

                  <div className="space-y-1">
                    {(p.items || []).map((it) => (
                      <div
                        key={it.id}
                        className="flex items-center justify-between text-xs bg-[#F8FAFC] p-2 rounded border border-[#EDEAE1]"
                      >
                        <span className="font-medium text-[#14213D]">{it.item?.name || "Raw Mat"}</span>
                        <span className="text-[#52607D]">
                          <strong>{it.quantity}</strong> {it.unit?.symbol || "Kg"} @ {formatCurrency(it.unit_price)} ={" "}
                          <strong className="text-[#14213D]">{formatCurrency(it.total_amount)}</strong>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Record Purchase Modal */}
      <Modal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        title="Record Inward Raw Material Purchase"
        size="lg"
      >
        <form onSubmit={handleSavePurchase} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#14213D] mb-1">
                Supplier *
              </label>
              <CustomSelect
                size="sm"
                value={supplierId}
                onChange={(val) => setSupplierId(val)}
                placeholder="Select Supplier"
                options={safeSuppliers.map((s) => ({
                  value: s.id,
                  label: `${s.name} ${s.phone ? `(${s.phone})` : ""}`,
                }))}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#14213D] mb-1">
                Purchase / Receipt Date *
              </label>
              <input
                type="date"
                required
                value={receiptDate}
                onChange={(e) => setReceiptDate(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E4E1D8] rounded-[6px] text-[#14213D] focus:outline-none focus:border-[#2F6F5E]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#14213D] mb-1">
                Invoice / Challan Reference No
              </label>
              <input
                type="text"
                placeholder="e.g. INV-9876"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E4E1D8] rounded-[6px] text-[#14213D] focus:outline-none focus:border-[#2F6F5E]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#14213D] mb-1">
                Notes
              </label>
              <input
                type="text"
                placeholder="Optional comments..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E4E1D8] rounded-[6px] text-[#14213D] focus:outline-none focus:border-[#2F6F5E]"
              />
            </div>
          </div>

          {/* Raw Material Inward Items */}
          <div className="space-y-2 pt-2 border-t border-[#EDEAE1]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#14213D] uppercase">
                Raw Materials Inward
              </span>
              <Button type="button" variant="outline" size="xs" icon={Plus} onClick={addItemRow}>
                Add Item
              </Button>
            </div>

            <div className="space-y-2">
              {items.map((it, idx) => (
                <div
                  key={idx}
                  className="p-2.5 bg-[#FAFAF8] rounded-[7px] border border-[#E4E1D8] grid grid-cols-12 gap-2 items-center text-xs"
                >
                  <div className="col-span-5">
                    <CustomSelect
                      size="sm"
                      value={it.item_id}
                      onChange={(val) => updateItem(idx, "item_id", val)}
                      options={safeRawMaterials.map((r) => ({
                        value: r.id,
                        label: `${r.name} (${r.unit?.symbol || "Kg"})`,
                      }))}
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      placeholder="Qty"
                      value={it.quantity}
                      onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-[#E4E1D8] rounded-[5px] text-xs text-[#14213D] font-mono focus:outline-none focus:border-[#2F6F5E]"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="Price/Unit"
                      value={it.unit_price}
                      onChange={(e) => updateItem(idx, "unit_price", e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-[#E4E1D8] rounded-[5px] text-xs text-[#14213D] font-mono focus:outline-none focus:border-[#2F6F5E]"
                    />
                  </div>
                  <div className="col-span-1 text-right">
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItemRow(idx)}
                        className="p-1 text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-[#EDEAE1]">
            <div className="text-xs font-bold text-[#14213D]">
              Grand Total: <span className="text-[#2F6F5E] text-sm">{formatCurrency(calculateTotal())}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => setIsPurchaseModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" loading={saving}>
                Confirm & Add to Stock
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default PlastPurchasesPage;
