import React, { useState, useEffect } from "react";
import { CheckCircle } from "lucide-react";
import Modal from "../common/Modal.jsx";
import Button from "../common/Button.jsx";
import { plastApi } from "../../api/plastApi.js";
import { toast } from "sonner";
import { formatDate } from "../../utils/dates.js";

export default function RecordPaymentModal({ isOpen, onClose, sale, onSuccess }) {
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [saving, setSaving] = useState(false);

  const balance = Math.max(0, Number(sale?.balance_amount || 0));

  useEffect(() => {
    if (isOpen && sale) {
      setAmount(balance > 0 ? String(balance) : "");
      setPaymentDate(new Date().toISOString().split("T")[0]);
    }
  }, [isOpen, sale, balance]);

  const numAmount = parseFloat(amount) || 0;
  const newBalance = Math.max(0, balance - numAmount);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(Math.round(Number(val) || 0));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!sale?.id) return;
    if (numAmount <= 0) {
      toast.error("Please enter a payment amount greater than 0");
      return;
    }
    if (numAmount > balance + 0.05) {
      toast.error(`Amount cannot exceed remaining balance of ${formatCurrency(balance)}`);
      return;
    }

    setSaving(true);
    try {
      const res = await plastApi.recordPayment(sale.id, {
        amount: numAmount,
        payment_date: paymentDate,
      });

      toast.success(
        `Payment of ${formatCurrency(numAmount)} recorded for invoice ${sale.sale_number}!`
      );
      if (onSuccess) {
        onSuccess(res?.data || res);
      }
      onClose();
    } catch (err) {
      toast.error(
        err.response?.data?.message || err.message || "Failed to record payment"
      );
    } finally {
      setSaving(false);
    }
  };

  if (!sale) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Record Payment - ${sale.sale_number}`}
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Invoice Summary Banner */}
        <div className="bg-[#F8FAFC] p-3.5 rounded-[8px] border border-[#E4E1D8] space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-[#52607D] uppercase tracking-wider">
                Customer
              </span>
              <div className="text-sm font-bold text-[#14213D]">{sale.customer_name}</div>
              {sale.customer_phone && (
                <div className="text-[11px] text-[#52607D] font-mono">{sale.customer_phone}</div>
              )}
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-[#52607D] uppercase tracking-wider">
                Invoice Date
              </span>
              <div className="font-mono text-[#14213D]">{formatDate(sale.sale_date)}</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#EDEAE1] text-center">
            <div>
              <div className="text-[10px] text-[#52607D]">Total Billed</div>
              <div className="font-mono font-bold text-[#14213D]">
                {formatCurrency(sale.grand_total)}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-emerald-700">Already Paid</div>
              <div className="font-mono font-bold text-emerald-700">
                {formatCurrency(sale.paid_amount)}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-rose-700 font-bold">Balance Due</div>
              <div className="font-mono font-bold text-rose-700">
                {formatCurrency(balance)}
              </div>
            </div>
          </div>
        </div>

        {/* Payment Amount Input */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="font-bold text-[#14213D]">Amount Received (₹) *</label>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setAmount(String(balance))}
                className="text-[10px] font-semibold text-[#2F6F5E] hover:underline bg-[#E8F3EE] px-1.5 py-0.5 rounded"
              >
                Full Due ({formatCurrency(balance)})
              </button>
              {balance > 100 && (
                <button
                  type="button"
                  onClick={() => setAmount(String(Math.round(balance / 2)))}
                  className="text-[10px] font-semibold text-slate-600 hover:underline bg-slate-100 px-1.5 py-0.5 rounded"
                >
                  50%
                </button>
              )}
            </div>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#8C97AB] font-bold">
              ₹
            </span>
            <input
              type="number"
              step="any"
              min="0.01"
              max={balance}
              required
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full pl-7 pr-3 py-2 bg-white border border-[#E4E1D8] rounded-[6px] text-sm font-mono font-bold text-[#14213D] focus:outline-none focus:border-[#2F6F5E]"
            />
          </div>

          {/* Balance Preview */}
          <div className="flex justify-between items-center mt-1.5 px-1 text-[11px]">
            <span className="text-[#52607D]">New Balance Remaining:</span>
            <span
              className={`font-mono font-bold ${
                newBalance === 0 ? "text-emerald-700" : "text-rose-700"
              }`}
            >
              {newBalance === 0 ? "₹0 (Fully Cleared)" : formatCurrency(newBalance)}
            </span>
          </div>
        </div>

        {/* Payment Date */}
        <div>
          <label className="block font-semibold text-[#14213D] mb-1">Payment Date *</label>
          <input
            type="date"
            required
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-white border border-[#E4E1D8] rounded-[6px] text-xs text-[#14213D] focus:outline-none focus:border-[#2F6F5E]"
          />
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end gap-2 pt-3 border-t border-[#EDEAE1]">
          <Button variant="secondary" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            loading={saving}
            icon={CheckCircle}
          >
            Record Payment ({formatCurrency(numAmount)})
          </Button>
        </div>
      </form>
    </Modal>
  );
}
