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
  const [paymentStatus, setPaymentStatus] = useState("PAID");
  const [notes, setNotes] = useState("");

  const [saleItems, setSaleItems] = useState([
    {
      item_id: "",
      quantity: "1",
      unit_price: "",
      discount_percent: "0",
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
            discount_percent: "0",
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
        discount_percent: "0",
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
    const disc = parseFloat(row.discount_percent) || 0;
    const rowSub = qty * price;
    const rowDisc = (rowSub * disc) / 100;
    return Math.max(0, rowSub - rowDisc);
  };

  const subtotal = saleItems.reduce((acc, row) => {
    const qty = parseFloat(row.quantity) || 0;
    const price = parseFloat(row.unit_price) || 0;
    return acc + qty * price;
  }, 0);

  const totalDiscount = saleItems.reduce((acc, row) => {
    const qty = parseFloat(row.quantity) || 0;
    const price = parseFloat(row.unit_price) || 0;
    const disc = parseFloat(row.discount_percent) || 0;
    return acc + (qty * price * disc) / 100;
  }, 0);

  const taxableAmount = Math.max(0, subtotal - totalDiscount);
  const gstAmount = (taxableAmount * gstRate) / 100;
  const grandTotal = taxableAmount + gstAmount;

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
        payment_status: paymentStatus,
        notes: notes.trim() || undefined,
        items: validItems.map((r) => ({
          item_id: r.item_id,
          quantity: parseFloat(r.quantity),
          unit_price: parseFloat(r.unit_price) || 0,
          discount_percent: parseFloat(r.discount_percent) || 0,
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
        subtitle="Issue direct customer bill with per-item discounts and GST"
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
          {/* Left Column: Customer & Items (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Customer Details Card */}
            <div className="bg-white rounded-[10px] border border-[#E4E1D8] shadow-[0_1px_2px_rgba(20,33,61,0.04)] p-4 sm:p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-[#EDEAE1] pb-3">
                <UserCheck size={16} className="text-[#2F6F5E]" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#14213D]">
                  Customer & Invoice Information
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <CustomSelect
                    label="Select Customer"
                    value={customerId}
                    onChange={(val) => handleCustomerSelect(val)}
                    placeholder="-- New / Walk-in Customer --"
                    options={[
                      { value: "", label: "-- New / Walk-in Customer --" },
                      ...(Array.isArray(customers) ? customers : []).map((c) => ({
                        value: c.id,
                        label: `${c.name} ${c.phone ? `(${c.phone})` : ""}`,
                      })),
                    ]}
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold text-[#14213D] mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Customer / Shop Name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E4E1D8] rounded-[6px] text-[#14213D] focus:outline-none focus:border-[#2F6F5E]"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold text-[#14213D] mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="Mobile number"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E4E1D8] rounded-[6px] text-[#14213D] font-mono focus:outline-none focus:border-[#2F6F5E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-[#14213D] mb-1">
                    Invoice Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={saleDate}
                    onChange={(e) => setSaleDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E4E1D8] rounded-[6px] text-[#14213D] focus:outline-none focus:border-[#2F6F5E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#14213D] mb-1">
                    Customer Address / City
                  </label>
                  <input
                    type="text"
                    placeholder="City, District"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E4E1D8] rounded-[6px] text-[#14213D] focus:outline-none focus:border-[#2F6F5E]"
                  />
                </div>
              </div>
            </div>

            {/* Billing Items Card */}
            <div className="bg-white rounded-[10px] border border-[#E4E1D8] shadow-[0_1px_2px_rgba(20,33,61,0.04)] p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#EDEAE1] pb-3">
                <div className="flex items-center gap-2">
                  <ShoppingCart size={16} className="text-[#2F6F5E]" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[#14213D]">
                    Bill Items & Per-Item Discount
                  </h2>
                </div>
                <Button type="button" variant="outline" size="xs" icon={Plus} onClick={addItemRow}>
                  Add Item
                </Button>
              </div>

              <div className="space-y-2.5">
                {saleItems.map((row, idx) => {
                  const selectedItem = itemsList.find((i) => i.id === row.item_id);
                  const stockOnHand = Number(selectedItem?.stock?.quantity_on_hand || 0);

                  return (
                    <div
                      key={idx}
                      className="p-3 bg-[#FAFAF8] rounded-[8px] border border-[#E4E1D8] grid grid-cols-12 gap-2.5 items-center text-xs"
                    >
                      {/* Item Dropdown */}
                      <div className="col-span-12 sm:col-span-5">
                        <label className="block text-[10px] font-semibold text-[#52607D] mb-0.5">
                          Product SKU (Stock: {stockOnHand} {selectedItem?.unit?.symbol || "Nos"})
                        </label>
                        <CustomSelect
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
                      <div className="col-span-4 sm:col-span-2">
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
                      <div className="col-span-4 sm:col-span-2">
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

                      {/* Discount % */}
                      <div className="col-span-3 sm:col-span-2">
                        <label className="block text-[10px] font-semibold text-emerald-800 mb-0.5">
                          Disc %
                        </label>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          max="100"
                          placeholder="0"
                          value={row.discount_percent}
                          onChange={(e) => updateItemRow(idx, "discount_percent", e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded-[6px] text-xs text-emerald-900 font-mono font-bold focus:outline-none focus:border-emerald-600"
                        />
                      </div>

                      {/* Remove Button */}
                      <div className="col-span-1 text-right">
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

              {/* Payment Mode */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <CustomSelect
                    label="Payment Mode"
                    size="sm"
                    value={paymentMode}
                    onChange={(val) => setPaymentMode(val)}
                    options={[
                      { value: "CASH", label: "Cash" },
                      { value: "UPI", label: "UPI / GPay" },
                      { value: "BANK_TRANSFER", label: "Bank NEFT" },
                      { value: "CREDIT", label: "Credit / Due" },
                    ]}
                  />
                </div>
                <div>
                  <CustomSelect
                    label="Payment Status"
                    size="sm"
                    value={paymentStatus}
                    onChange={(val) => setPaymentStatus(val)}
                    options={[
                      { value: "PAID", label: "Paid" },
                      { value: "PENDING", label: "Pending" },
                    ]}
                  />
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="bg-[#F8FAFC] p-3 rounded-[8px] border border-[#EDEAE1] space-y-2 text-xs">
                <div className="flex justify-between text-[#52607D]">
                  <span>Subtotal:</span>
                  <span className="font-mono">{formatCurrency(subtotal)}</span>
                </div>
                {totalDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount Saved:</span>
                    <span className="font-mono">-{formatCurrency(totalDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#52607D]">
                  <span>Taxable Value:</span>
                  <span className="font-mono">{formatCurrency(taxableAmount)}</span>
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
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-[#14213D] mb-1">
                  Optional Invoice Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Delivered via auto..."
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
              <div className="text-lg font-mono font-black text-[#14213D] mt-1">
                {formatCurrency(createdSale.grand_total)}
              </div>
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
