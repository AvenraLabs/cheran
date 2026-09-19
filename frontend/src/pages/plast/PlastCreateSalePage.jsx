import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  Plus,
  Trash2,
  Printer,
  ArrowLeft,
  UserCheck,
  CheckCircle,
} from "lucide-react";
import { plastApi } from "../../api/plastApi.js";
import Navbar from "../../components/layout/Navbar.jsx";
import Button from "../../components/common/Button.jsx";
import Modal from "../../components/common/Modal.jsx";
import CustomSelect from "../../components/common/CustomSelect.jsx";
import { toast } from "sonner";

const GST_OPTIONS = [
  { rate: 0, label: "0% (Nil / Exempt)" },
  { rate: 5, label: "5% (Standard GST)" },
  { rate: 18, label: "18% (Regular GST)" },
];

export function PlastCreateSalePage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [itemsList, setItemsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split("T")[0]);
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");

  const [gstRate, setGstRate] = useState(0);
  const [paymentMode, setPaymentMode] = useState("CASH");
  const [paidAmountInput, setPaidAmountInput] = useState("");
  const [notes, setNotes] = useState("");

  // Common Bill Discount State
  const [discountType, setDiscountType] = useState("PERCENTAGE"); // "PERCENTAGE" (default) or "AMOUNT"
  const [discountValue, setDiscountValue] = useState("");

  const [saleItems, setSaleItems] = useState([
    {
      item_id: "",
      quantity: "1",
      unit_price: "",
    },
  ]);

  // Success Modal
  const [createdSale, setCreatedSale] = useState(null);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [customersRes, itemsRes] = await Promise.all([
        plastApi.getCustomers(),
        plastApi.getItems({ is_active: true }),
      ]);
      const validCustomers = Array.isArray(customersRes) ? customersRes : customersRes?.data || [];
      const validItems = Array.isArray(itemsRes) ? itemsRes : itemsRes?.data || [];

      setCustomers(validCustomers);
      setItemsList(validItems);

      if (validItems.length > 0 && (!saleItems[0] || !saleItems[0].item_id)) {
        setSaleItems([
          {
            item_id: validItems[0].id,
            quantity: "1",
            unit_price: String(validItems[0].unit_price || "0"),
          },
        ]);
      }
    } catch (err) {
      toast.error("Failed to load items or customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleCustomerSelect = (id) => {
    setCustomerId(id);
    if (!id) return;
    const selected = customers.find((c) => c.id === id);
    if (selected) {
      setCustomerName(selected.name);
      setCustomerPhone(selected.phone || "");
      setCustomerAddress(selected.address || "");
    }
  };

  const addItemRow = () => {
    setSaleItems((prev) => [
      ...prev,
      {
        item_id: itemsList[0]?.id || "",
        quantity: "1",
        unit_price: String(itemsList[0]?.unit_price || "0"),
      },
    ]);
  };

  const removeItemRow = (idx) => {
    if (saleItems.length <= 1) return;
    setSaleItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateItemRow = (idx, field, val) => {
    setSaleItems((prev) => {
      const next = [...prev];
      if (field === "item_id") {
        const itemObj = itemsList.find((i) => i.id === val);
        next[idx] = {
          ...next[idx],
          item_id: val,
          unit_price: String(itemObj?.unit_price || "0"),
        };
      } else {
        next[idx] = { ...next[idx], [field]: val };
      }
      return next;
    });
  };

  // Calculations
  const calculateRowTotal = (row) => {
    const qty = parseFloat(row.quantity) || 0;
    const price = parseFloat(row.unit_price) || 0;
    return Math.max(0, qty * price);
  };

  const subtotal = saleItems.reduce((acc, row) => {
    const qty = parseFloat(row.quantity) || 0;
    const price = parseFloat(row.unit_price) || 0;
    return acc + qty * price;
  }, 0);

  // Common Bill Discount Calculation
  const rawDiscVal = parseFloat(discountValue) || 0;
  const billDiscountAmt = discountType === "PERCENTAGE" ? (subtotal * rawDiscVal) / 100 : rawDiscVal;
  const totalDiscount = Math.min(subtotal, Math.max(0, billDiscountAmt));
  const taxableAmount = Math.max(0, subtotal - totalDiscount);
  const gstAmount = (taxableAmount * gstRate) / 100;
  const grandTotal = Math.round(taxableAmount + gstAmount);

  // If not entered or blank, defaults to 0 paid (Unpaid)
  const numPaid = parseFloat(paidAmountInput) || 0;
  const effectivePaidAmount = Math.max(0, Math.min(grandTotal, numPaid));
  const balanceAmount = Math.max(0, grandTotal - effectivePaidAmount);

  // Pure calculation: bill value - paid value
  const isFullyPaid = balanceAmount <= 0.01 && grandTotal > 0;
  const isPartial = effectivePaidAmount > 0 && balanceAmount > 0.01;
  const isUnpaid = effectivePaidAmount === 0;
  const calculatedPaymentStatus = isFullyPaid ? "PAID" : isPartial ? "PARTIAL" : "UNPAID";

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(val || 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!customerName.trim()) {
      toast.error("Please enter a customer name");
      return;
    }

    const validItems = saleItems.filter(
      (r) => r.item_id && parseFloat(r.quantity) > 0
    );
    if (validItems.length === 0) {
      toast.error("Please add at least 1 item with quantity > 0");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        customer_id: customerId || undefined,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim() || undefined,
        customer_address: customerAddress.trim() || undefined,
        sale_date: saleDate,
        gst_rate: gstRate,
        payment_mode: paymentMode,
        payment_status: calculatedPaymentStatus,
        paid_amount: effectivePaidAmount,
        discount_type: discountType,
        discount_value: rawDiscVal,
        bill_discount: billDiscountAmt,
        notes: notes.trim() || undefined,
        items: validItems.map((r) => ({
          item_id: r.item_id,
          quantity: parseFloat(r.quantity),
          unit_price: parseFloat(r.unit_price) || 0,
          discount_percent: 0,
        })),
      };

      const res = await plastApi.createSale(payload);
      toast.success("Sales Invoice created & stock deducted!");
      setCreatedSale(res?.data || res);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to create sales invoice");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Navbar
        title="Create Sales Invoice"
        subtitle="Issue customer sales bill with total bill discount and GST"
        actions={
          <Button
            variant="secondary"
            size="sm"
            icon={ArrowLeft}
            onClick={() => navigate("/plast/sales")}
          >
            Back to Sales
          </Button>
        }
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 overflow-y-auto w-full">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Customer & Line Items (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Customer Details Card */}
            <div className="bg-white rounded-[10px] border border-[#E4E1D8] shadow-[0_1px_2px_rgba(20,33,61,0.04)] p-4 sm:p-5 space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#14213D] border-b border-[#EDEAE1] pb-2">
                Customer & Invoice Date
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <CustomSelect
                    label="Choose Registered Customer"
                    value={customerId}
                    onChange={handleCustomerSelect}
                    options={[
                      { value: "", label: "— Walk-in / Cash Customer —" },
                      ...customers.map((c) => ({
                        value: c.id,
                        label: `${c.name}${c.phone ? ` (${c.phone})` : ""}`,
                      })),
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#14213D] mb-1">
                    Invoice Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={saleDate}
                    onChange={(e) => setSaleDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#E4E1D8] rounded-[6px] text-xs text-[#14213D] focus:outline-none focus:border-[#2F6F5E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#14213D] mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar / Sri Agro"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#E4E1D8] rounded-[6px] text-xs text-[#14213D] focus:outline-none focus:border-[#2F6F5E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#14213D] mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#E4E1D8] rounded-[6px] text-xs text-[#14213D] focus:outline-none focus:border-[#2F6F5E]"
                  />
                </div>
              </div>
            </div>

            {/* Sale Items Card */}
            <div className="bg-white rounded-[10px] border border-[#E4E1D8] shadow-[0_1px_2px_rgba(20,33,61,0.04)] p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#EDEAE1] pb-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#14213D]">
                  Billed Products & Items
                </h2>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  icon={Plus}
                  onClick={addItemRow}
                >
                  + Add Item
                </Button>
              </div>

              <div className="space-y-3">
                {saleItems.map((row, idx) => {
                  return (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 items-center p-2.5 bg-[#FAFAF8] rounded-[8px] border border-[#EDEAE1]"
                    >
                      {/* Item Select */}
                      <div className="col-span-12 sm:col-span-6">
                        <CustomSelect
                          label={`Item #${idx + 1}`}
                          size="sm"
                          value={row.item_id}
                          onChange={(val) => updateItemRow(idx, "item_id", val)}
                          options={(Array.isArray(itemsList) ? itemsList : []).map((it) => ({
                            value: it.id,
                            label: `${it.name} (${it.item_type === "RAW_MATERIAL" ? "Raw" : "Fin"}) - ₹${it.unit_price}`,
                          }))}
                        />
                      </div>

                      {/* Quantity */}
                      <div className="col-span-5 sm:col-span-2">
                        <label className="block text-[10px] font-semibold text-[#52607D] mb-0.5">
                          Qty
                        </label>
                        <input
                          type="number"
                          step="any"
                          min="0.01"
                          placeholder="Qty"
                          value={row.quantity}
                          onChange={(e) => updateItemRow(idx, "quantity", e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-[#E4E1D8] rounded-[6px] text-xs text-[#14213D] font-mono font-bold focus:outline-none focus:border-[#2F6F5E]"
                        />
                      </div>

                      {/* Unit Price */}
                      <div className="col-span-5 sm:col-span-3">
                        <label className="block text-[10px] font-semibold text-[#52607D] mb-0.5">
                          Price (₹)
                        </label>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          placeholder="Price"
                          value={row.unit_price}
                          onChange={(e) => updateItemRow(idx, "unit_price", e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-[#E4E1D8] rounded-[6px] text-xs text-[#14213D] font-mono focus:outline-none focus:border-[#2F6F5E]"
                        />
                      </div>

                      {/* Remove Button */}
                      <div className="col-span-2 sm:col-span-1 text-right flex items-end justify-end pb-1">
                        {saleItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItemRow(idx)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                            title="Remove item"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>

                      <div className="col-span-12 text-right text-[11px] text-[#52607D]">
                        Row Total: <strong className="text-[#14213D]">{formatCurrency(calculateRowTotal(row))}</strong>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Tax & Invoice Summary (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-[10px] border border-[#E4E1D8] shadow-[0_1px_2px_rgba(20,33,61,0.04)] p-4 sm:p-5 space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#14213D] border-b border-[#EDEAE1] pb-2">
                Tax & Payment Summary
              </h2>

              {/* GST Tax Slabs */}
              <div>
                <label className="block text-xs font-semibold text-[#14213D] mb-1.5">
                  Select GST Tax Rate
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {GST_OPTIONS.map((g) => (
                    <button
                      key={g.rate}
                      type="button"
                      onClick={() => setGstRate(g.rate)}
                      className={`py-2 px-2 rounded-[6px] text-xs font-bold text-center border transition-all cursor-pointer ${
                        gstRate === g.rate
                          ? "bg-[#EAF3F0] text-[#2F6F5E] border-[#2F6F5E] shadow-xs"
                          : "bg-white text-[#52607D] border-[#E4E1D8] hover:bg-[#FAFAF8]"
                      }`}
                    >
                      {g.rate}% GST
                    </button>
                  ))}
                </div>
              </div>

              {/* Common Bill Discount on Total Bill */}
              <div className="p-3 bg-amber-50/50 rounded-[8px] border border-amber-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-900">
                    Total Bill Discount
                  </label>
                  <div className="flex items-center bg-white rounded-[6px] border border-[#E4E1D8] p-0.5">
                    <button
                      type="button"
                      onClick={() => setDiscountType("AMOUNT")}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded cursor-pointer transition-all ${
                        discountType === "AMOUNT"
                          ? "bg-[#2F6F5E] text-white"
                          : "text-[#52607D] hover:text-[#14213D]"
                      }`}
                    >
                      ₹ Flat
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiscountType("PERCENTAGE")}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded cursor-pointer transition-all ${
                        discountType === "PERCENTAGE"
                          ? "bg-[#2F6F5E] text-white"
                          : "text-[#52607D] hover:text-[#14213D]"
                      }`}
                    >
                      % Percent
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    max={discountType === "PERCENTAGE" ? 100 : undefined}
                    placeholder={discountType === "PERCENTAGE" ? "e.g. 5 for 5% off bill" : "e.g. 150"}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-[6px] text-xs font-mono font-bold text-[#14213D] focus:outline-none focus:border-[#2F6F5E]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8C97AB] font-bold">
                    {discountType === "AMOUNT" ? "₹" : "%"}
                  </span>
                </div>
                <div className="text-[10px] text-[#52607D]">
                  Applies directly to invoice subtotal before GST calculation.
                </div>
              </div>

              {/* Payment Mode & Amount Received */}
              <div className="space-y-3">
                <div>
                  <CustomSelect
                    label="Payment Mode"
                    size="sm"
                    value={paymentMode}
                    onChange={(val) => setPaymentMode(val)}
                    options={[
                      { value: "CASH", label: "Cash" },
                      { value: "UPI", label: "UPI / GPay / PhonePe" },
                      { value: "BANK_TRANSFER", label: "Bank Transfer / NEFT" },
                      { value: "CHEQUE", label: "Cheque" },
                    ]}
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-[#14213D]">
                      Amount Received (₹)
                    </label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPaidAmountInput(String(grandTotal))}
                        className="text-[10px] font-semibold text-[#2F6F5E] hover:underline bg-[#E8F3EE] px-2 py-0.5 rounded-[4px] transition-colors"
                      >
                        Full Paid (₹{grandTotal})
                      </button>
                      {paidAmountInput && (
                        <button
                          type="button"
                          onClick={() => setPaidAmountInput("")}
                          className="text-[10px] font-semibold text-[#8C97AB] hover:underline bg-slate-100 px-1.5 py-0.5 rounded-[4px] transition-colors"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#8C97AB] font-bold">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      max={grandTotal}
                      placeholder="0.00 (Unpaid if not entered)"
                      value={paidAmountInput}
                      onChange={(e) => setPaidAmountInput(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 bg-white border border-[#E4E1D8] rounded-[6px] text-xs font-mono font-bold text-[#14213D] focus:outline-none focus:border-[#2F6F5E]"
                    />
                  </div>

                  {/* Dynamic Status / Balance Preview Badge */}
                  <div className="flex items-center justify-between text-[11px] px-0.5 pt-0.5">
                    <span className="text-[#52607D]">
                      {isFullyPaid
                        ? "Payment Status:"
                        : isPartial
                        ? "Partial Payment:"
                        : "Balance Due:"}
                    </span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded-[4px] ${
                        isFullyPaid
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : isPartial
                          ? "bg-amber-50 text-amber-800 border border-amber-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}
                    >
                      {isFullyPaid && "✓ Fully Paid"}
                      {isPartial && `Pending: ${formatCurrency(balanceAmount)}`}
                      {isUnpaid && `Pending: ${formatCurrency(grandTotal)} (Unpaid)`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="bg-[#F8FAFC] p-3.5 rounded-[8px] border border-[#EDEAE1] space-y-2 text-xs">
                <div className="flex justify-between text-[#52607D]">
                  <span>Subtotal:</span>
                  <span className="font-mono font-medium">{formatCurrency(subtotal)}</span>
                </div>

                {billDiscountAmt > 0 && (
                  <div className="flex justify-between text-amber-800 font-medium">
                    <span>
                      Bill Discount {discountType === "PERCENTAGE" ? `(${rawDiscVal}%)` : ""}:
                    </span>
                    <span className="font-mono">-{formatCurrency(billDiscountAmt)}</span>
                  </div>
                )}

                <div className="flex justify-between text-[#52607D] border-t border-[#EDEAE1] pt-1.5">
                  <span>Taxable Value:</span>
                  <span className="font-mono font-semibold text-[#14213D]">{formatCurrency(taxableAmount)}</span>
                </div>

                <div className="flex justify-between text-[#52607D]">
                  <span>GST Amount ({gstRate}%):</span>
                  <span className="font-mono">+{formatCurrency(gstAmount)}</span>
                </div>

                <div className="flex justify-between text-sm font-bold text-[#14213D] border-t border-[#EDEAE1] pt-2">
                  <span>Grand Total:</span>
                  <span className="text-[#2F6F5E] font-mono text-base font-black">
                    {formatCurrency(grandTotal)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs font-semibold text-emerald-800 pt-1">
                  <span>Amount Paid:</span>
                  <span className="font-mono font-bold">
                    {formatCurrency(effectivePaidAmount)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs font-semibold border-t border-dashed border-[#EDEAE1] pt-1.5">
                  <span className={balanceAmount > 0 ? "text-rose-700" : "text-emerald-700"}>
                    {balanceAmount > 0 ? "Balance Pending:" : "Status:"}
                  </span>
                  <span
                    className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                      balanceAmount > 0
                        ? "bg-rose-100 text-rose-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {balanceAmount > 0 ? formatCurrency(balanceAmount) : "Fully Paid"}
                  </span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-[#14213D] mb-1">
                  Optional Invoice Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Delivered via vehicle..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E4E1D8] rounded-[6px] text-[#14213D] focus:outline-none focus:border-[#2F6F5E]"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full"
                loading={saving}
              >
                Issue Bill & Deduct Stock
              </Button>
            </div>
          </div>
        </form>
      </main>

      {/* Success Modal */}
      <Modal
        isOpen={Boolean(createdSale)}
        onClose={() => {
          setCreatedSale(null);
          navigate("/plast/sales");
        }}
        title="Invoice Created Successfully"
        size="md"
      >
        {createdSale && (
          <div className="text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle size={28} />
            </div>

            <div>
              <div className="text-xs text-[#52607D]">Invoice Number</div>
              <div className="text-base font-mono font-bold text-[#2F6F5E]">{createdSale.sale_number}</div>
              <div className="text-sm font-bold text-[#14213D] mt-1">{createdSale.customer_name}</div>
              <div className="text-xl font-mono font-black text-[#14213D] mt-2">
                {formatCurrency(createdSale.grand_total)}
              </div>
            </div>

            <div className="bg-[#FAFAF8] p-3 rounded-[8px] border border-[#EDEAE1] text-xs text-left space-y-1.5">
              <div className="flex justify-between text-[#52607D]">
                <span>Subtotal:</span>
                <span className="font-mono">{formatCurrency(createdSale.subtotal)}</span>
              </div>
              {Number(createdSale.discount_amount) > 0 && (
                <div className="flex justify-between text-amber-800 font-medium">
                  <span>Discount Applied:</span>
                  <span className="font-mono">-{formatCurrency(createdSale.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-[#52607D]">
                <span>Taxable Amount:</span>
                <span className="font-mono">{formatCurrency(createdSale.taxable_amount)}</span>
              </div>
              <div className="flex justify-between text-[#52607D]">
                <span>GST ({createdSale.gst_rate}%):</span>
                <span className="font-mono">+{formatCurrency(createdSale.gst_amount)}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-semibold border-t border-[#EDEAE1] pt-1">
                <span>Amount Paid:</span>
                <span className="font-mono">{formatCurrency(createdSale.paid_amount)}</span>
              </div>
              {Number(createdSale.balance_amount) > 0 && (
                <div className="flex justify-between text-rose-700 font-semibold">
                  <span>Balance Due:</span>
                  <span className="font-mono">{formatCurrency(createdSale.balance_amount)}</span>
                </div>
              )}
            </div>

            <div className="flex justify-center gap-2 pt-2 border-t border-[#EDEAE1]">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setCreatedSale(null);
                  navigate("/plast/sales");
                }}
              >
                Go to Sales Invoices
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={Printer}
                onClick={() => window.print()}
              >
                Print Slip
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default PlastCreateSalePage;
