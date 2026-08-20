import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ShoppingCart,
  ArrowLeft,
  Package,
  Plus,
  Trash2,
  X,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Boxes,
  RotateCcw,
  Save,
  User,
  Calendar,
} from "lucide-react";
import api from "../api/client.js";
import Navbar from "../components/layout/Navbar.jsx";
import Button from "../components/common/Button.jsx";
import CustomSelect from "../components/common/CustomSelect.jsx";
import { SkeletonLoader } from "../components/common/SkeletonLoader.jsx";

export function CreateDirectSalePage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Customer & Invoice Metadata
  const [customers, setCustomers] = useState([]);
  const [allFinishedGoods, setAllFinishedGoods] = useState([]);
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-DS-${Date.now().toString().slice(-6)}`);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [walkinCustomerName, setWalkinCustomerName] = useState("");
  const [notes, setNotes] = useState("");

  // Commercial Pricing & Rates
  const [fittingsPct] = useState(5.0); // 5% Standard
  const [gstRate, setGstRate] = useState(5); // 5 or 18

  // Item Lines in Form: Array of { item_id, name, code, unit, unit_price, available_stock, quantity }
  const [items, setItems] = useState([]);

  // Immediate Payment Option
  const [isImmediatePayment, setIsImmediatePayment] = useState(false);
  const [initialPaymentAmount, setInitialPaymentAmount] = useState("");
  const [initialPaymentMode, setInitialPaymentMode] = useState("Cash");
  const [initialPaymentRefNo, setInitialPaymentRefNo] = useState("");

  // Load Customers and Finished Goods Stock on Mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [custRes, stockRes] = await Promise.all([
          api.get("/customers?limit=200"),
          api.get("/inventory/stock"),
        ]);

        setCustomers(custRes.data?.customers || []);

        const rawStockList = stockRes.data?.stock || [];
        let fgList = rawStockList
          .filter((s) => s.item?.item_type === "FINISHED_GOOD")
          .map((s) => ({
            id: s.item.id,
            name: s.item.name,
            code: s.item.code,
            unit: s.item.unit?.symbol || "NOS",
            unit_price: parseFloat(s.item.unit_price) || 0,
            available_stock: parseFloat(s.available_quantity) || 0,
          }));

        if (fgList.length === 0) {
          const itemsRes = await api.get("/items?item_type=FINISHED_GOOD&limit=200");
          fgList = (itemsRes.data?.items || []).map((it) => ({
            id: it.id,
            name: it.name,
            code: it.code,
            unit: it.unit?.symbol || "NOS",
            unit_price: parseFloat(it.unit_price) || 0,
            available_stock: 0,
          }));
        }

        setAllFinishedGoods(fgList);

        // Auto-fill ALL finished goods items by default for fast UX
        const initialLines = fgList.map((fg) => ({
          item_id: fg.id,
          name: fg.name,
          code: fg.code,
          unit: fg.unit,
          unit_price: fg.unit_price,
          available_stock: fg.available_stock,
          quantity: "",
        }));

        setItems(initialLines);
      } catch (err) {
        console.error("Failed to load finished goods data:", err);
        setErrorMsg("Failed to load catalog and customer list.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ==========================================
  // Quantity & Price Change Handlers
  // ==========================================
  const handleQuantityChange = (itemId, val) => {
    setItems((prev) =>
      prev.map((it) => (it.item_id === itemId ? { ...it, quantity: val } : it))
    );
  };

  const handlePriceChange = (itemId, val) => {
    setItems((prev) =>
      prev.map((it) => (it.item_id === itemId ? { ...it, unit_price: val } : it))
    );
  };

  const handleRemoveItem = (itemId) => {
    setItems((prev) => prev.filter((it) => it.item_id !== itemId));
  };

  const handleResetAllItems = () => {
    const resetLines = allFinishedGoods.map((fg) => ({
      item_id: fg.id,
      name: fg.name,
      code: fg.code,
      unit: fg.unit,
      unit_price: fg.unit_price,
      available_stock: fg.available_stock,
      quantity: "",
    }));
    setItems(resetLines);
  };

  const handleAddBackItem = (itemId) => {
    if (!itemId) return;
    const fg = allFinishedGoods.find((f) => f.id === itemId);
    if (fg && !items.some((it) => it.item_id === itemId)) {
      setItems((prev) => [
        ...prev,
        {
          item_id: fg.id,
          name: fg.name,
          code: fg.code,
          unit: fg.unit,
          unit_price: fg.unit_price,
          available_stock: fg.available_stock,
          quantity: "",
        },
      ]);
    }
  };

  // ==========================================
  // Real-Time Commercial Calculations
  // ==========================================
  let netItemsTotal = 0;
  let activeItemCount = 0;
  for (const it of items) {
    const qty = parseFloat(it.quantity) || 0;
    const price = parseFloat(it.unit_price) || 0;
    if (qty > 0) {
      netItemsTotal += qty * price;
      activeItemCount++;
    }
  }
  netItemsTotal = Math.round(netItemsTotal * 100) / 100;
  const fittingsAmount = Math.round(((netItemsTotal * fittingsPct) / 100.0) * 100) / 100;
  const taxableAmount = Math.round((netItemsTotal + fittingsAmount) * 100) / 100;
  const gstAmount = Math.round(((taxableAmount * gstRate) / 100.0) * 100) / 100;
  const grandTotal = Math.round((taxableAmount + gstAmount) * 100) / 100;

  // Unselected items that can be added back
  const unselectedItems = allFinishedGoods.filter(
    (fg) => !items.some((it) => it.item_id === fg.id)
  );

  // ==========================================
  // Form Submission
  // ==========================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    const custName = selectedCustomerId
      ? customers.find((c) => c.id === selectedCustomerId)?.name
      : walkinCustomerName.trim();

    if (!custName) {
      setErrorMsg("Please select an existing customer or enter a customer name.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const validItems = items
      .filter((it) => parseFloat(it.quantity) > 0)
      .map((it) => ({
        item_id: it.item_id,
        quantity: parseFloat(it.quantity),
        unit_price: parseFloat(it.unit_price),
      }));

    if (validItems.length === 0) {
      setErrorMsg("Please enter quantity for at least one item.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    try {
      setSaving(true);

      const payload = {
        invoice_number: invoiceNumber.trim(),
        invoice_date: invoiceDate,
        invoice_type: "DIRECT_SALE",
        customer_id: selectedCustomerId || null,
        customer_name: custName,
        fittings_percentage: fittingsPct,
        gst_percentage: gstRate,
        notes: notes.trim() || null,
        items: validItems,
      };

      const res = await api.post("/invoices", payload);
      const createdInvoice = res.data?.data?.invoice || res.data?.invoice;

      // If immediate payment is checked
      if (isImmediatePayment && createdInvoice?.id && parseFloat(initialPaymentAmount) > 0) {
        const fullPaymentRef = initialPaymentRefNo.trim()
          ? `${initialPaymentMode} - Ref: ${initialPaymentRefNo.trim()}`
          : initialPaymentMode;

        await api.post(`/invoices/${createdInvoice.id}/payment`, {
          amount: parseFloat(initialPaymentAmount),
          payment_date: invoiceDate,
          payment_reference: fullPaymentRef,
          notes: "Initial payment recorded at direct sale creation",
        });
      }

      navigate("/sales", { replace: true });
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || "Failed to create direct sale invoice.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Navbar
        title="Create Direct Commercial Sale"
        subtitle="Full-page finished goods dispatch and commercial invoice generation"
        actions={
          <div className="flex items-center gap-2">
            <Link to="/sales">
              <Button variant="secondary" icon={ArrowLeft}>
                Back to Direct Sales
              </Button>
            </Link>
            <Button
              variant="primary"
              icon={Save}
              loading={saving}
              onClick={handleSubmit}
              disabled={loading || saving}
            >
              Post & Deduct Inventory
            </Button>
          </div>
        }
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 overflow-y-auto max-w-7xl mx-auto w-full">
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-[8px] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg("")} className="text-rose-600 hover:text-rose-900">
              <X size={14} />
            </button>
          </div>
        )}

        {loading ? (
          <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-6">
            <SkeletonLoader rows={10} />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section 1: Customer & Invoice Details */}
            <div className="bg-white border border-[#E4E1D8] rounded-[12px] p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#EDEAE1] pb-3">
                <h3 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
                  <User size={16} className="text-[#2F6F5E]" /> Customer & Dispatch Information
                </h3>
                <span className="text-[11px] text-[#52607D]">
                  Standard 5% Fittings & Selectable GST
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#14213D] mb-1">
                    Invoice Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] font-mono font-bold text-[#14213D] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#14213D] mb-1">
                    Invoice Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] text-[#14213D] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#14213D] mb-1">
                    Select Registered Customer
                  </label>
                  <CustomSelect
                    options={[
                      { value: "", label: "— Walk-in / New Customer —" },
                      ...customers.map((c) => ({
                        value: c.id,
                        label: `${c.name} (${c.phone || "No phone"})`,
                      })),
                    ]}
                    value={selectedCustomerId}
                    onChange={(val) => setSelectedCustomerId(val)}
                    placeholder="Choose customer"
                  />
                </div>

                {!selectedCustomerId ? (
                  <div>
                    <label className="block text-xs font-bold text-[#14213D] mb-1">
                      Walk-in Customer Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Agro Farms"
                      value={walkinCustomerName}
                      onChange={(e) => setWalkinCustomerName(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] text-[#14213D] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E]"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-[#14213D] mb-1">
                      Dispatch Notes
                    </label>
                    <input
                      type="text"
                      placeholder="Vehicle #, PO reference"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] text-[#14213D] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E]"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Section 2: Finished Goods Items Table */}
            <div className="bg-white border border-[#E4E1D8] rounded-[12px] shadow-xs overflow-hidden">
              <div className="p-4 bg-[#FAFAF8] border-b border-[#E4E1D8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
                    <Package size={16} className="text-[#2F6F5E]" /> Finished Goods Catalog & Quantities
                  </h3>
                  <p className="text-xs text-[#52607D] mt-0.5">
                    Type the dispatch quantity for items being sold. Click the <strong className="text-rose-600">✕</strong> button to remove any item not in this sale.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {unselectedItems.length > 0 && (
                    <div className="w-48">
                      <CustomSelect
                        options={[
                          { value: "", label: "+ Add Removed Item" },
                          ...unselectedItems.map((fg) => ({ value: fg.id, label: fg.name })),
                        ]}
                        value=""
                        onChange={handleAddBackItem}
                        placeholder="+ Add Item"
                      />
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleResetAllItems}
                    className="p-1.5 px-2.5 text-xs text-[#52607D] hover:text-[#14213D] hover:bg-white border border-[#E4E1D8] rounded-[8px] flex items-center gap-1 font-semibold transition-colors cursor-pointer"
                    title="Reload all finished goods"
                  >
                    <RotateCcw size={13} /> Reset All
                  </button>
                </div>
              </div>

              {items.length === 0 ? (
                <div className="p-8 text-center space-y-3">
                  <p className="text-xs text-[#52607D]">All items were removed.</p>
                  <Button variant="secondary" icon={RotateCcw} onClick={handleResetAllItems}>
                    Reload All Finished Goods
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#FAF9F5] border-b border-[#E4E1D8] text-[#52607D] font-bold">
                        <th className="py-3 px-4 w-10 text-center">#</th>
                        <th className="py-3 px-4">Item Description</th>
                        <th className="py-3 px-4 text-center">Current Stock</th>
                        <th className="py-3 px-4 text-right">Unit Price (₹)</th>
                        <th className="py-3 px-4 text-right w-36">Dispatch Quantity</th>
                        <th className="py-3 px-4 text-right">Line Total (₹)</th>
                        <th className="py-3 px-4 w-12 text-center">Remove</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EDEAE1]">
                      {items.map((item, idx) => {
                        const qty = parseFloat(item.quantity) || 0;
                        const price = parseFloat(item.unit_price) || 0;
                        const lineTotal = Math.round(qty * price * 100) / 100;
                        const isEntered = qty > 0;

                        return (
                          <tr
                            key={item.item_id}
                            className={`hover:bg-[#FAF9F5] transition-colors ${
                              isEntered ? "bg-[#EAF3F0]/40 font-medium" : ""
                            }`}
                          >
                            <td className="py-3 px-4 text-center font-mono text-[#8C97AB]">
                              {idx + 1}
                            </td>

                            <td className="py-3 px-4">
                              <div className="font-bold text-[#14213D] text-xs sm:text-sm">
                                {item.name}
                              </div>
                              <div className="text-[10px] text-[#52607D] font-mono mt-0.5">
                                Code: {item.code} • Unit: {item.unit}
                              </div>
                            </td>

                            <td className="py-3 px-4 text-center">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] text-[11px] font-mono font-bold ${
                                  item.available_stock > 0
                                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                    : "bg-rose-50 text-rose-800 border border-rose-200"
                                }`}
                              >
                                <Boxes size={12} /> {item.available_stock} {item.unit}
                              </span>
                            </td>

                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <span className="text-[#8C97AB]">₹</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={item.unit_price}
                                  onChange={(e) => handlePriceChange(item.item_id, e.target.value)}
                                  className="w-28 px-2.5 py-1.5 text-right text-xs bg-white border border-[#E4E1D8] rounded-[6px] font-mono font-semibold focus:outline-none focus:ring-1 focus:ring-[#2F6F5E]"
                                />
                              </div>
                            </td>

                            <td className="py-3 px-4 text-right">
                              <input
                                type="number"
                                step="any"
                                min="0"
                                placeholder="0"
                                value={item.quantity}
                                onChange={(e) => handleQuantityChange(item.item_id, e.target.value)}
                                className={`w-28 px-3 py-1.5 text-right text-xs sm:text-sm border rounded-[8px] font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] transition-all ${
                                  isEntered
                                    ? "bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs"
                                    : "bg-[#FAFAF8] border-[#E4E1D8] text-[#14213D]"
                                }`}
                              />
                            </td>

                            <td className="py-3 px-4 text-right font-mono font-bold text-xs sm:text-sm text-[#14213D]">
                              ₹{lineTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </td>

                            <td className="py-3 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(item.item_id)}
                                className="p-1.5 text-[#8C97AB] hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors cursor-pointer"
                                title="Remove item from sale"
                              >
                                <X size={16} />
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

            {/* Section 3: Commercial Calculation Summary & GST Selector */}
            <div className="bg-white border border-[#E4E1D8] rounded-[12px] p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EDEAE1] pb-4">
                <div>
                  <h4 className="text-sm font-bold text-[#14213D] block">
                    Tax & GST Rate Applicable
                  </h4>
                  <p className="text-xs text-[#52607D] mt-0.5">
                    Select GST rate applicable for this commercial invoice
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setGstRate(5)}
                    className={`px-4 py-2 rounded-[8px] text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                      gstRate === 5
                        ? "bg-[#2F6F5E] text-white shadow-xs"
                        : "bg-[#FAFAF8] border border-[#E4E1D8] text-[#52607D] hover:bg-gray-100"
                    }`}
                  >
                    <span>5% GST</span>
                    <span className="text-[10px] font-normal opacity-90">(Drip & Agriculture)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGstRate(18)}
                    className={`px-4 py-2 rounded-[8px] text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                      gstRate === 18
                        ? "bg-[#2F6F5E] text-white shadow-xs"
                        : "bg-[#FAFAF8] border border-[#E4E1D8] text-[#52607D] hover:bg-gray-100"
                    }`}
                  >
                    <span>18% GST</span>
                    <span className="text-[10px] font-normal opacity-90">(Commercial Pipes)</span>
                  </button>
                </div>
              </div>

              {/* Financial Calculation Formula Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 text-center">
                <div className="bg-[#FAFAF8] p-3.5 rounded-[10px] border border-[#E4E1D8]">
                  <div className="text-[11px] font-semibold text-[#52607D]">Items Net Total</div>
                  <div className="text-sm sm:text-base font-extrabold font-mono text-[#14213D] mt-1">
                    ₹{netItemsTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] text-[#8C97AB] mt-0.5">{activeItemCount} items selected</div>
                </div>

                <div className="bg-[#FAFAF8] p-3.5 rounded-[10px] border border-[#E4E1D8]">
                  <div className="text-[11px] font-semibold text-[#D97706]">Fittings (5%)</div>
                  <div className="text-sm sm:text-base font-extrabold font-mono text-[#D97706] mt-1">
                    +₹{fittingsAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] text-[#8C97AB] mt-0.5">5% of Net Total</div>
                </div>

                <div className="bg-[#FAFAF8] p-3.5 rounded-[10px] border border-[#E4E1D8]">
                  <div className="text-[11px] font-semibold text-[#14213D]">Taxable Subtotal</div>
                  <div className="text-sm sm:text-base font-extrabold font-mono text-[#14213D] mt-1">
                    ₹{taxableAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] text-[#8C97AB] mt-0.5">Items + Fittings</div>
                </div>

                <div className="bg-[#FAFAF8] p-3.5 rounded-[10px] border border-[#E4E1D8]">
                  <div className="text-[11px] font-semibold text-blue-700">GST ({gstRate}%)</div>
                  <div className="text-sm sm:text-base font-extrabold font-mono text-blue-700 mt-1">
                    +₹{gstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] text-[#8C97AB] mt-0.5">{gstRate}% on Taxable</div>
                </div>

                <div className="bg-[#2F6F5E] p-3.5 rounded-[10px] text-white shadow-xs col-span-2 sm:col-span-1">
                  <div className="text-[11px] font-semibold text-white/80">Grand Total Amount</div>
                  <div className="text-base sm:text-lg font-black font-mono text-white mt-1">
                    ₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] text-[#A4E0D1] mt-0.5">All Inclusive</div>
                </div>
              </div>
            </div>

            {/* Section 4: Immediate Customer Payment Collection (Optional) */}
            <div className="bg-white border border-[#E4E1D8] rounded-[12px] p-5 shadow-xs space-y-4">
              <label className="flex items-center gap-2.5 text-xs font-bold text-[#14213D] cursor-pointer">
                <input
                  type="checkbox"
                  checked={isImmediatePayment}
                  onChange={(e) => {
                    setIsImmediatePayment(e.target.checked);
                    if (e.target.checked) setInitialPaymentAmount(grandTotal.toString());
                  }}
                  className="w-4 h-4 text-[#2F6F5E] rounded focus:ring-[#2F6F5E]"
                />
                <span>Customer is making a payment now (Immediate Collection)</span>
              </label>

              {isImmediatePayment && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-[#EDEAE1] bg-[#FAFAF8] p-4 rounded-[10px]">
                  <div>
                    <label className="block text-xs font-semibold text-[#14213D] mb-1">
                      Collected Amount (₹) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={grandTotal}
                      value={initialPaymentAmount}
                      onChange={(e) => setInitialPaymentAmount(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-[#E4E1D8] rounded-[8px] font-mono font-bold text-emerald-800"
                      placeholder={`Max ₹${grandTotal}`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#14213D] mb-1">
                      Payment Mode <span className="text-rose-500">*</span>
                    </label>
                    <CustomSelect
                      options={[
                        { value: "Cash", label: "Cash" },
                        { value: "UPI (GPay / PhonePe / Paytm)", label: "UPI (GPay / PhonePe / Paytm)" },
                        { value: "Bank Transfer (NEFT / RTGS / IMPS)", label: "Bank Transfer (NEFT / RTGS / IMPS)" },
                        { value: "Cheque", label: "Cheque" },
                        { value: "Card (Debit / Credit)", label: "Card (Debit / Credit)" },
                      ]}
                      value={initialPaymentMode}
                      onChange={(val) => setInitialPaymentMode(val)}
                      placeholder="Select payment mode"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#14213D] mb-1">
                      Transaction / UTR / Cheque # (Optional)
                    </label>
                    <input
                      type="text"
                      value={initialPaymentRefNo}
                      onChange={(e) => setInitialPaymentRefNo(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-[#E4E1D8] rounded-[8px] font-mono"
                      placeholder="e.g. UTR12345678, CHQ-987"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-2">
              <Link to="/sales">
                <Button variant="secondary" icon={ArrowLeft}>
                  Cancel
                </Button>
              </Link>

              <Button
                variant="primary"
                type="submit"
                loading={saving}
                icon={ShoppingCart}
                disabled={activeItemCount === 0 || saving}
                className="px-6 py-2.5 text-sm font-bold shadow-md"
              >
                Post Invoice & Deduct Stock (₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })})
              </Button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}

export default CreateDirectSalePage;
