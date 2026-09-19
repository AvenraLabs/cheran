import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  Plus,
  Trash2,
  Printer,
  FileText,
  ArrowLeft,
  UserCheck,
  CheckCircle,
  Share2,
} from "lucide-react";
import { plastApi } from "../../api/plastApi.js";
import Navbar from "../../components/layout/Navbar.jsx";
import Button from "../../components/common/Button.jsx";
import Modal from "../../components/common/Modal.jsx";
import CustomSelect from "../../components/common/CustomSelect.jsx";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
  const [exportingPdf, setExportingPdf] = useState(false);

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

  // Format currency with NO decimals (.00 removed)
  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(Math.round(Number(val) || 0));
  };

  const handleExportPDF = (sale) => {
    if (!sale) return;
    try {
      setExportingPdf(true);
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header Branding
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(47, 111, 94); // #2F6F5E
      doc.text("CHERAN PLAST", 14, 18);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(82, 96, 125);
      doc.text("PVC & Polymer Manufacturing Division", 14, 23);

      // Invoice info top-right
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(20, 33, 61);
      doc.text(`INVOICE: ${sale.sale_number || ""}`, pageWidth - 14, 16, { align: "right" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(82, 96, 125);
      doc.text(`Date: ${sale.sale_date || ""}`, pageWidth - 14, 21, { align: "right" });
      const enteredBy = sale.creator?.username || sale.created_by_name || "admin";
      doc.text(`Entered By: @${enteredBy}`, pageWidth - 14, 26, { align: "right" });

      // Divider line
      doc.setDrawColor(228, 225, 216);
      doc.setLineWidth(0.5);
      doc.line(14, 30, pageWidth - 14, 30);

      // Customer / Billed To box
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, 34, pageWidth - 28, 20, 2, 2, "F");
      doc.setDrawColor(237, 234, 225);
      doc.roundedRect(14, 34, pageWidth - 28, 20, 2, 2, "D");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(82, 96, 125);
      doc.text("BILLED TO", 18, 39);
      doc.text("PAYMENT STATUS", pageWidth - 18, 39, { align: "right" });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(20, 33, 61);
      doc.text(sale.customer_name || "Cash Customer", 18, 45);

      const bal = Math.round(Number(sale.balance_amount) || 0);
      const isPaid = bal <= 0;
      doc.setTextColor(isPaid ? 16 : 180, isPaid ? 130 : 60, isPaid ? 80 : 50);
      doc.text(isPaid ? "PAID" : `BALANCE: Rs. ${bal.toLocaleString("en-IN")}`, pageWidth - 18, 45, { align: "right" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(82, 96, 125);
      if (sale.customer_phone) {
        doc.text(`Phone: ${sale.customer_phone}`, 18, 50);
      }

      // Line Items Table
      const tableRows = (sale.items || []).map((it, idx) => {
        const unitLabel = typeof it.unit === "object" ? (it.unit?.symbol || it.unit?.name || "") : (it.unit || "");
        const qtyStr = `${Math.round(Number(it.quantity) || 0)} ${unitLabel}`.trim();
        const priceNum = Math.round(Number(it.unit_price) || 0);
        const lineTotalNum = Math.round(Number(it.line_total || it.total_amount || (Number(it.quantity || 0) * Number(it.unit_price || 0))));
        return [
          idx + 1,
          it.item_name || "",
          qtyStr,
          `Rs. ${priceNum.toLocaleString("en-IN")}`,
          `Rs. ${lineTotalNum.toLocaleString("en-IN")}`,
        ];
      });

      autoTable(doc, {
        startY: 58,
        head: [["#", "Item Description", "Qty", "Unit Price", "Total"]],
        body: tableRows,
        theme: "striped",
        headStyles: {
          fillColor: [47, 111, 94],
          textColor: 255,
          fontStyle: "bold",
          fontSize: 9,
          cellPadding: 3,
        },
        columnStyles: {
          0: { cellWidth: 10, halign: "center" },
          1: { cellWidth: "auto" },
          2: { cellWidth: 25, halign: "center" },
          3: { cellWidth: 32, halign: "right" },
          4: { cellWidth: 35, halign: "right", fontStyle: "bold" },
        },
        styles: {
          fontSize: 8.5,
          cellPadding: 2.8,
          textColor: [20, 33, 61],
        },
        alternateRowStyles: {
          fillColor: [250, 250, 248],
        },
      });

      const finalY = doc.lastAutoTable.finalY + 6;

      // Summary Breakdown Block (Right side)
      const subVal = Math.round(Number(sale.subtotal) || 0);
      const discVal = Math.round(Number(sale.total_discount ?? sale.discount_amount) || 0);
      let discPct = Number(sale.discount_value) || 0;
      if (!discPct && subVal > 0 && discVal > 0) {
        discPct = Math.round((discVal / subVal) * 100);
      }
      const totalAfterDiscVal = Math.max(0, subVal - discVal);
      const gstVal = Math.round(Number(sale.gst_amount) || 0);
      const grandVal = Math.round(Number(sale.grand_total) || (totalAfterDiscVal + gstVal));
      const paidVal = Math.round(Number(sale.paid_amount) || 0);
      const balVal = Math.round(Number(sale.balance_amount) || Math.max(0, grandVal - paidVal));

      const summaryLines = [
        { label: "Subtotal:", value: `Rs. ${subVal.toLocaleString("en-IN")}` },
      ];
      if (discVal > 0) {
        summaryLines.push({
          label: `Discount (${discPct}%):`,
          value: `-Rs. ${discVal.toLocaleString("en-IN")}`,
          isDiscount: true,
        });
      }
      summaryLines.push({
        label: discVal > 0 ? "Total after Discount:" : "Total:",
        value: `Rs. ${totalAfterDiscVal.toLocaleString("en-IN")}`,
        isTotal: true,
      });
      if (gstVal > 0) {
        summaryLines.push({
          label: `GST (${sale.gst_rate}%):`,
          value: `+Rs. ${gstVal.toLocaleString("en-IN")}`,
        });
        summaryLines.push({
          label: "Grand Total:",
          value: `Rs. ${grandVal.toLocaleString("en-IN")}`,
          isGrand: true,
        });
      }
      summaryLines.push({
        label: "Amount Paid:",
        value: `Rs. ${paidVal.toLocaleString("en-IN")}`,
        isPaid: true,
      });
      summaryLines.push({
        label: "Balance Due:",
        value: `Rs. ${balVal.toLocaleString("en-IN")}`,
        isBal: true,
      });

      // Render summary on right side
      const summaryBoxX = pageWidth - 90;
      let sY = finalY;
      summaryLines.forEach((line) => {
        doc.setFont("helvetica", line.isTotal || line.isGrand ? "bold" : "normal");
        doc.setFontSize(line.isTotal || line.isGrand ? 9.5 : 8.5);
        if (line.isDiscount) doc.setTextColor(180, 83, 9);
        else if (line.isPaid) doc.setTextColor(22, 101, 52);
        else if (line.isBal && balVal > 0) doc.setTextColor(190, 24, 93);
        else if (line.isTotal || line.isGrand) doc.setTextColor(47, 111, 94);
        else doc.setTextColor(82, 96, 125);

        doc.text(line.label, summaryBoxX, sY);
        doc.text(line.value, pageWidth - 14, sY, { align: "right" });
        sY += 5.5;
      });

      // Bottom footer note
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(140, 151, 171);
      doc.text("Thank you for your business! · Cheran Plast", pageWidth / 2, 285, { align: "center" });

      const safeNumber = (sale.sale_number || "Bill").replace(/[/\\?%*:|"<> ]/g, "_");
      doc.save(`Cheran_Plast_Invoice_${safeNumber}.pdf`);
      toast.success("PDF invoice downloaded successfully");
    } catch (err) {
      console.error("PDF export error:", err);
      toast.error("Failed to export PDF invoice");
    } finally {
      setExportingPdf(false);
    }
  };

  const shareOnWhatsApp = (sale) => {
    if (!sale) return;
    const phone = sale.customer_phone || "";
    const cleanPhone = phone.replace(/\D/g, "").replace(/^0+/, "");
    const targetPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    const subVal = Math.round(Number(sale.subtotal) || 0);
    const discVal = Math.round(Number(sale.total_discount ?? sale.discount_amount) || 0);
    let discPct = Number(sale.discount_value) || 0;
    if (!discPct && subVal > 0 && discVal > 0) {
      discPct = Math.round((discVal / subVal) * 100);
    }
    const totalAfterDisc = Math.max(0, subVal - discVal);
    const gstVal = Math.round(Number(sale.gst_amount) || 0);
    const grandVal = Math.round(Number(sale.grand_total) || (totalAfterDisc + gstVal));
    const paidVal = Math.round(Number(sale.paid_amount) || 0);
    const balVal = Math.round(Number(sale.balance_amount) || Math.max(0, grandVal - paidVal));

    const itemsList = sale.items && sale.items.length > 0
      ? sale.items.map(it => `• ${it.item_name} × ${it.quantity} = ₹${Math.round(Number(it.line_total || it.total_amount || (Number(it.quantity || 0) * Number(it.unit_price || 0)))).toLocaleString("en-IN")}`).join("\n")
      : "";

    let msg = `🧾 *CHERAN PLAST - INVOICE*\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `*Invoice No:* #${sale.sale_number}\n` +
      `*Date:* ${sale.sale_date}\n` +
      `*Customer:* ${sale.customer_name || "Valued Customer"}\n\n`;

    if (itemsList) {
      msg += `*Items:*\n${itemsList}\n\n`;
    }

    msg += `━━━━━━━━━━━━━━━━━━\n` +
      `*Subtotal:* ₹${subVal.toLocaleString("en-IN")}\n`;

    if (discVal > 0) {
      msg += `*Discount (${discPct}%):* -₹${discVal.toLocaleString("en-IN")}\n`;
    }

    msg += `*Total:* ₹${totalAfterDisc.toLocaleString("en-IN")}\n`;

    if (gstVal > 0) {
      msg += `*GST (${sale.gst_rate}%):* +₹${gstVal.toLocaleString("en-IN")}\n`;
      msg += `*Grand Total:* ₹${grandVal.toLocaleString("en-IN")}\n`;
    }

    msg += `*Paid Amount:* ₹${paidVal.toLocaleString("en-IN")}\n` +
      `*Balance Due:* ₹${balVal.toLocaleString("en-IN")}\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `Thank you for your business! 🙏\nCheran Plast`;

    const url = targetPhone
      ? `https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;

    window.open(url, "_blank");
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
                      Discount ({discountType === "PERCENTAGE" && rawDiscVal > 0 ? Math.round(rawDiscVal) : (subtotal > 0 ? Math.round((billDiscountAmt / subtotal) * 100) : 0)}%):
                    </span>
                    <span className="font-mono">-{formatCurrency(billDiscountAmt)}</span>
                  </div>
                )}

                <div className="flex justify-between text-[#14213D] font-bold border-t border-[#EDEAE1] pt-1.5">
                  <span>{billDiscountAmt > 0 ? "Total after Discount:" : "Total:"}</span>
                  <span className="font-mono">{formatCurrency(taxableAmount)}</span>
                </div>

                {gstRate > 0 && (
                  <>
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
                  </>
                )}

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
                    {balanceAmount > 0 ? formatCurrency(balanceAmount) : "Paid"}
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

      {/* Success Bill Modal */}
      <Modal
        isOpen={Boolean(createdSale)}
        onClose={() => {
          setCreatedSale(null);
          navigate("/plast/sales");
        }}
        title={`Invoice Created: ${createdSale?.sale_number || ""}`}
        size="lg"
      >
        {createdSale && (
          <div className="space-y-4">
            <div id="printable-bill" className="p-4 bg-white rounded border border-[#E4E1D8] space-y-4 text-xs">
              <div className="flex justify-between items-start border-b border-[#EDEAE1] pb-3">
                <div>
                  <h2 className="text-base font-bold text-[#2F6F5E]">CHERAN PLAST</h2>
                  <p className="text-[10px] text-[#52607D]">PVC & Polymer Manufacturing Division</p>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-[#14213D]">{createdSale.sale_number}</div>
                  <div className="text-[#52607D]">Date: {createdSale.sale_date}</div>
                  <div className="text-[10px] text-[#52607D] mt-0.5">
                    Entered By: <strong className="font-mono text-[#2F6F5E]">@{createdSale.creator?.username || createdSale.created_by_name || "admin"}</strong>
                  </div>
                </div>
              </div>

              <div className="bg-[#F8FAFC] p-2.5 rounded border border-[#EDEAE1] flex justify-between items-start">
                <div>
                  <div className="text-[10px] font-bold text-[#52607D] uppercase">Billed To</div>
                  <div className="text-sm font-bold text-[#14213D] mt-0.5">{createdSale.customer_name}</div>
                  {createdSale.customer_phone && (
                    <div className="text-xs text-[#52607D] font-mono">Phone: {createdSale.customer_phone}</div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold text-[#52607D] uppercase">Payment Status</div>
                  <div className="mt-1 font-bold text-xs">
                    {Number(createdSale.balance_amount || 0) <= 0.01 ? (
                      <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">Paid</span>
                    ) : (
                      <span className="text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                        Pending: {formatCurrency(createdSale.balance_amount)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Items in Invoice */}
              {createdSale.items && createdSale.items.length > 0 && (
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAFAF8] border-b border-[#EDEAE1] text-[#52607D]">
                    <tr>
                      <th className="py-2 px-2">Item Name</th>
                      <th className="py-2 px-2 text-center">Qty</th>
                      <th className="py-2 px-2 text-right">Unit Price</th>
                      <th className="py-2 px-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDEAE1]">
                    {createdSale.items.map((it, idx) => {
                      const unitLabel = typeof it.unit === "object"
                        ? (it.unit?.symbol || it.unit?.name || "")
                        : (it.unit || "");
                      const lineTotal = it.line_total || it.total_amount || (Number(it.quantity || 0) * Number(it.unit_price || 0));

                      return (
                        <tr key={idx}>
                          <td className="py-2 px-2 font-medium">{it.item_name}</td>
                          <td className="py-2 px-2 text-center font-mono">
                            {it.quantity} {unitLabel}
                          </td>
                          <td className="py-2 px-2 text-right font-mono">{formatCurrency(it.unit_price)}</td>
                          <td className="py-2 px-2 text-right font-mono font-bold text-[#14213D]">
                            {formatCurrency(lineTotal)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              {/* Summary Breakdown */}
              <div className="flex justify-end pt-2 border-t border-[#EDEAE1]">
                {(() => {
                  const subVal = Math.round(Number(createdSale.subtotal) || 0);
                  const discVal = Math.round(Number(createdSale.total_discount ?? createdSale.discount_amount) || 0);
                  let discPct = Number(createdSale.discount_value) || 0;
                  if (!discPct && subVal > 0 && discVal > 0) {
                    discPct = Math.round((discVal / subVal) * 100);
                  }
                  const totalAfterDiscVal = Math.max(0, subVal - discVal);
                  const gstVal = Math.round(Number(createdSale.gst_amount) || 0);
                  const grandVal = Math.round(Number(createdSale.grand_total) || (totalAfterDiscVal + gstVal));

                  return (
                    <div className="w-64 space-y-1 text-xs">
                      <div className="flex justify-between text-[#52607D]">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(subVal)}</span>
                      </div>
                      {discVal > 0 && (
                        <div className="flex justify-between text-amber-800 font-medium">
                          <span>Discount ({discPct}%):</span>
                          <span>-{formatCurrency(discVal)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-[#14213D] font-bold border-t border-[#EDEAE1] pt-1">
                        <span>{discVal > 0 ? "Total after Discount:" : "Total:"}</span>
                        <span className="font-mono">{formatCurrency(totalAfterDiscVal)}</span>
                      </div>
                      {gstVal > 0 && (
                        <>
                          <div className="flex justify-between text-[#52607D]">
                            <span>GST ({createdSale.gst_rate}%):</span>
                            <span>+{formatCurrency(gstVal)}</span>
                          </div>
                          <div className="flex justify-between font-bold text-sm text-[#14213D] border-t border-[#EDEAE1] pt-1.5">
                            <span>Grand Total:</span>
                            <span className="text-[#2F6F5E]">{formatCurrency(grandVal)}</span>
                          </div>
                        </>
                      )}
                      <div className="flex justify-between text-xs font-semibold text-emerald-700 pt-1">
                        <span>Amount Paid:</span>
                        <span className="font-mono font-bold">{formatCurrency(createdSale.paid_amount)}</span>
                      </div>
                      <div className="flex justify-between text-xs font-semibold text-rose-700 border-t border-dashed border-[#EDEAE1] pt-1">
                        <span>Balance Due:</span>
                        <span className="font-mono font-bold">{formatCurrency(createdSale.balance_amount)}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
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
                type="button"
                variant="secondary"
                size="sm"
                icon={Share2}
                className="bg-emerald-600 hover:bg-emerald-700 text-white border-transparent"
                onClick={() => shareOnWhatsApp(createdSale)}
              >
                Share on WhatsApp
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={FileText}
                loading={exportingPdf}
                onClick={() => handleExportPDF(createdSale)}
              >
                Download PDF
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={Printer}
                onClick={() => window.print()}
              >
                Print Receipt
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default PlastCreateSalePage;
