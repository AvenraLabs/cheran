import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FileSpreadsheet,
  Plus,
  Search,
  Calendar,
  IndianRupee,
  Layers,
  CheckCircle2,
  Clock,
  Building2,
  Trash2,
  Eye,
  CreditCard,
  Percent,
  X,
  FileText,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Filter,
} from "lucide-react";
import api from "../api/client.js";
import Navbar from "../components/layout/Navbar.jsx";
import Button from "../components/common/Button.jsx";
import Modal from "../components/common/Modal.jsx";
import CustomSelect from "../components/common/CustomSelect.jsx";
import { SkeletonLoader, EmptyState } from "../components/common/SkeletonLoader.jsx";
import Pagination from "../components/common/Pagination.jsx";

export function CommissionProceedingsPage() {
  const navigate = useNavigate();

  const [batches, setBatches] = useState([]);
  const [summary, setSummary] = useState({
    total_batches_count: 0,
    total_proceeding_value: 0,
    total_dealer_commission: 0,
    total_fittings_value: 0,
    total_bank_received_value: 0,
    total_pending_bank_value: 0,
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Filter state
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [payoutStatus, setPayoutStatus] = useState("");
  const [selectedDealer, setSelectedDealer] = useState("");

  // Master Data
  const [dealers, setDealers] = useState([]);
  const [fundPercentages, setFundPercentages] = useState([]);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [manageSlabsModalOpen, setManageSlabsModalOpen] = useState(false);
  const [bankReceiptModalOpen, setBankReceiptModalOpen] = useState(false);

  // Delete modal state
  const [batchToDelete, setBatchToDelete] = useState(null);
  const [deletingBatch, setDeletingBatch] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Form State: Add Proceeding Batch
  const [formData, setFormData] = useState({
    proceeding_no: "",
    proceeding_date: new Date().toISOString().split("T")[0],
    fund_percentage_id: "",
    fund_percentage_value: 55.0,
    total_proceeding_amount: "",
    payment_received_date: "",
    payment_received_ref: "",
    notes: "",
    application_ids_text: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Form State: Manage Fund % Slabs
  const [newSlabPct, setNewSlabPct] = useState("");
  const [addingSlab, setAddingSlab] = useState(false);
  const [slabError, setSlabError] = useState("");
  const [slabSuccess, setSlabSuccess] = useState("");

  // Form State: Bank Payment Receipt
  const [activeBatchForBank, setActiveBatchForBank] = useState(null);
  const [bankReceiptDate, setBankReceiptDate] = useState("");
  const [bankReceiptRef, setBankReceiptRef] = useState("");
  const [savingBankReceipt, setSavingBankReceipt] = useState(false);

  // Application ID Live Preview & Auto-Calculation
  const [idPreview, setIdPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const debounceTimerRef = useRef(null);

  // Debounced auto-preview & calculation when application IDs change
  useEffect(() => {
    if (!createModalOpen) {
      setIdPreview(null);
      return;
    }
    const text = formData.application_ids_text?.trim();
    if (!text) {
      setIdPreview(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setPreviewLoading(true);
        const res = await api.post("/proceedings/preview-ids", {
          application_ids_text: text,
          fund_percentage_value: formData.fund_percentage_value,
        });
        const prev = res?.preview || res?.data?.preview || null;
        setIdPreview(prev);
        if (prev && prev.total_fund_share > 0) {
          setFormData((prevForm) => ({
            ...prevForm,
            total_proceeding_amount: prev.total_fund_share,
          }));
        }
      } catch (err) {
        console.error("Preview failed:", err);
      } finally {
        setPreviewLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [formData.application_ids_text, formData.fund_percentage_value, createModalOpen]);

  // Fetch Batches
  const fetchBatches = async (page = 1, limit = pagination.limit) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
        ...(search ? { search: search.trim() } : {}),
        ...(startDate ? { start_date: startDate } : {}),
        ...(endDate ? { end_date: endDate } : {}),
        ...(paymentStatus ? { payment_status: paymentStatus } : {}),
        ...(payoutStatus ? { payout_status: payoutStatus } : {}),
        ...(selectedDealer ? { dealer_id: selectedDealer } : {}),
      };

      const res = await api.get("/proceedings", { params });
      setBatches(res?.batches || res?.data?.batches || []);
      setSummary(res?.summary || res?.data?.summary || {});
      setPagination(res?.pagination || res?.data?.pagination || { page, limit, total: 0, totalPages: 1 });
    } catch (err) {
      console.error("Failed to fetch proceeding batches:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Master Data (Dealers and Fund Percentage Slabs)
  const fetchMasterData = async () => {
    try {
      const [dealerRes, fundRes] = await Promise.all([
        api.get("/dealers/options").catch(() => ({ dealers: [] })),
        api.get("/proceedings/fund-percentages").catch(() => ({ fund_percentages: [] })),
      ]);
      const dealersList = dealerRes?.dealers || dealerRes?.data?.dealers || [];
      const slabs = fundRes?.fund_percentages || fundRes?.data?.fund_percentages || [];
      setDealers(dealersList);
      setFundPercentages(slabs);

      if (slabs.length > 0 && !formData.fund_percentage_id) {
        setFormData((prev) => ({
          ...prev,
          fund_percentage_id: slabs[0].id,
          fund_percentage_value: slabs[0].percentage,
        }));
      }
    } catch (err) {
      console.error("Error loading master data:", err);
    }
  };

  useEffect(() => {
    fetchMasterData();
  }, []);

  // Debounced filter effect
  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      fetchBatches(1, pagination.limit);
    }, 250);
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [search, startDate, endDate, paymentStatus, payoutStatus, selectedDealer]);

  const hasActiveFilters = Boolean(
    search || startDate || endDate || paymentStatus || payoutStatus || selectedDealer
  );

  const handleResetFilters = () => {
    setSearch("");
    setStartDate("");
    setEndDate("");
    setPaymentStatus("");
    setPayoutStatus("");
    setSelectedDealer("");
  };

  // Create batch submission
  const handleCreateBatch = async (e) => {
    e.preventDefault();
    setFormError("");
    try {
      setSubmitting(true);
      await api.post("/proceedings", formData);
      setCreateModalOpen(false);
      setFormData({
        proceeding_no: "",
        proceeding_date: new Date().toISOString().split("T")[0],
        fund_percentage_id: fundPercentages[0]?.id || "",
        fund_percentage_value: fundPercentages[0]?.percentage || 55.0,
        total_proceeding_amount: "",
        payment_received_date: "",
        payment_received_ref: "",
        notes: "",
        application_ids_text: "",
      });
      fetchBatches(1);
    } catch (err) {
      setFormError(err?.message || err?.response?.data?.message || "Failed to create proceeding batch");
    } finally {
      setSubmitting(false);
    }
  };

  // Add new Slab
  const handleAddSlab = async (e) => {
    e.preventDefault();
    setSlabError("");
    setSlabSuccess("");
    const val = parseFloat(newSlabPct);
    if (isNaN(val) || val <= 0 || val > 100) {
      setSlabError("Please enter a valid fund percentage between 1 and 100");
      return;
    }
    try {
      setAddingSlab(true);
      await api.post("/proceedings/fund-percentages", {
        percentage: val,
        label: `${val}%`,
      });
      setNewSlabPct("");
      setSlabSuccess(`Fund percentage ${val}% saved successfully.`);
      await fetchMasterData();
    } catch (err) {
      setSlabError(err?.message || err?.response?.data?.message || "Failed to save fund percentage");
    } finally {
      setAddingSlab(false);
    }
  };

  // Delete Slab
  const handleDeleteSlab = async (slabId) => {
    setSlabError("");
    setSlabSuccess("");
    try {
      await api.delete(`/proceedings/fund-percentages/${slabId}`);
      setSlabSuccess("Fund percentage removed successfully.");
      await fetchMasterData();
    } catch (err) {
      setSlabError(err?.message || err?.response?.data?.message || "Failed to remove slab");
    }
  };

  // Save Payment Receipt Date
  const handleSaveBankReceipt = async (e) => {
    e.preventDefault();
    if (!activeBatchForBank) return;
    try {
      setSavingBankReceipt(true);
      await api.patch(`/proceedings/${activeBatchForBank.id}/bank-receipt`, {
        payment_received_date: bankReceiptDate || null,
        payment_received_ref: bankReceiptRef ? bankReceiptRef.trim() : null,
      });
      setBankReceiptModalOpen(false);
      fetchBatches(pagination.page);
    } catch (err) {
      alert(err?.message || err?.response?.data?.message || "Failed to update payment receipt date");
    } finally {
      setSavingBankReceipt(false);
    }
  };

  // Confirm Delete Batch in Themed Modal
  const handleConfirmDelete = async () => {
    if (!batchToDelete) return;
    setDeleteError("");
    try {
      setDeletingBatch(true);
      await api.delete(`/proceedings/${batchToDelete.id}`);
      setBatchToDelete(null);
      fetchBatches(pagination.page);
    } catch (err) {
      setDeleteError(err?.message || err?.response?.data?.message || "Failed to delete proceeding batch");
    } finally {
      setDeletingBatch(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? "—"
      : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const formatRupees = (val) => {
    const num = Math.floor(parseFloat(val || 0));
    return `₹${num.toLocaleString("en-IN")}`;
  };

  const dealerOptions = [
    { value: "", label: "All Dealers" },
    ...dealers.map((d) => ({ value: d.id, label: d.name })),
  ];

  const fundSlabOptions = fundPercentages.map((slab) => ({
    value: slab.id,
    label: `${slab.percentage}%`,
  }));

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Navbar
        title="Commission Proceedings"
        subtitle="Government scheme proceedings & dealer commission payouts"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={Percent}
              onClick={() => {
                setNewSlabPct("");
                setManageSlabsModalOpen(true);
              }}
            >
              Add Fund %
            </Button>

            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => setCreateModalOpen(true)}
            >
              Add Proceeding Batch
            </Button>
          </div>
        }
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 overflow-y-auto">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Proceedings Value */}
          <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-5 shadow-[0_1px_2px_rgba(20,33,61,0.04)] space-y-1">
            <div className="flex items-center justify-between text-[#52607D] text-xs font-semibold">
              <span>Total Proceeding Amount</span>
              <FileText size={16} className="text-[#2F6F5E]" />
            </div>
            <div className="text-xl font-bold text-[#14213D] font-mono mt-1">
              {formatRupees(summary.total_proceeding_value)}
            </div>
            <div className="text-[11px] text-[#52607D]">
              Across {summary.total_batches_count || 0} batches recorded
            </div>
          </div>

          {/* Card 2: Total Dealer Commission Payable */}
          <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-5 shadow-[0_1px_2px_rgba(20,33,61,0.04)] space-y-1">
            <div className="flex items-center justify-between text-[#52607D] text-xs font-semibold">
              <span>Calculated Dealer Commission</span>
              <IndianRupee size={16} className="text-[#2F6F5E]" />
            </div>
            <div className="text-xl font-bold text-[#2F6F5E] font-mono mt-1">
              {formatRupees(summary.total_dealer_commission)}
            </div>
            <div className="text-[11px] text-[#52607D]">
              + {formatRupees(summary.total_fittings_value)} Fittings Cost
            </div>
          </div>

          {/* Card 3: Payment Received */}
          <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-5 shadow-[0_1px_2px_rgba(20,33,61,0.04)] space-y-1">
            <div className="flex items-center justify-between text-[#52607D] text-xs font-semibold">
              <span>Payment Received</span>
              <CheckCircle2 size={16} className="text-emerald-600" />
            </div>
            <div className="text-xl font-bold text-emerald-800 font-mono mt-1">
              {formatRupees(summary.total_bank_received_value)}
            </div>
            <div className="text-[11px] text-emerald-600 font-medium">
              Verified Payment Received
            </div>
          </div>

          {/* Card 4: Pending Payment */}
          <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-5 shadow-[0_1px_2px_rgba(20,33,61,0.04)] space-y-1">
            <div className="flex items-center justify-between text-[#52607D] text-xs font-semibold">
              <span>Pending Payment</span>
              <Clock size={16} className="text-amber-600" />
            </div>
            <div className="text-xl font-bold text-amber-800 font-mono mt-1">
              {formatRupees(summary.total_pending_bank_value)}
            </div>
            <div className="text-[11px] text-amber-700 font-medium">
              Awaiting Payment Receipt
            </div>
          </div>
        </div>

        {/* Dynamic Filter Bar */}
        <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-4 shadow-[0_1px_2px_rgba(20,33,61,0.04)] space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
            {/* Search */}
            <div className="relative lg:col-span-3">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#52607D]" />
              <input
                type="text"
                placeholder="Search Proceeding No / Ref..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8C97AB] hover:text-[#14213D] p-0.5 cursor-pointer"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Date Range: From Date */}
            <div className="relative lg:col-span-2">
              <div className="relative flex items-center">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
                  title="Filter by Proceeding From Date"
                />
              </div>
            </div>

            {/* Date Range: To Date */}
            <div className="relative lg:col-span-2">
              <div className="relative flex items-center">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
                  title="Filter by Proceeding To Date"
                />
              </div>
            </div>

            {/* Payment Status Filter */}
            <div className="lg:col-span-2">
              <CustomSelect
                options={[
                  { value: "", label: "All Payment Status" },
                  { value: "RECEIVED", label: "Payment Received" },
                  { value: "PENDING", label: "Payment Pending" },
                ]}
                value={paymentStatus}
                onChange={(val) => setPaymentStatus(val)}
                placeholder="Payment Status"
                size="sm"
              />
            </div>

            {/* Dealer Dropdown Filter */}
            <div className="lg:col-span-2">
              <CustomSelect
                options={dealerOptions}
                value={selectedDealer}
                onChange={(val) => setSelectedDealer(val)}
                placeholder="All Dealers"
                searchable={true}
                size="sm"
              />
            </div>

            {/* Clear Filters */}
            <div className="lg:col-span-1 flex justify-end">
              {hasActiveFilters && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleResetFilters}
                  className="w-full text-xs"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Proceedings Table Container */}
        <div className="bg-white border border-[#E4E1D8] rounded-[10px] shadow-[0_1px_2px_rgba(20,33,61,0.04)] overflow-hidden">
          {loading ? (
            <div className="p-6">
              <SkeletonLoader rows={6} />
            </div>
          ) : batches.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#FAFAF8] border border-[#E4E1D8] flex items-center justify-center mx-auto text-[#52607D]">
                <FileSpreadsheet size={24} />
              </div>
              <h3 className="text-sm font-bold text-[#14213D]">No Proceeding Batches Found</h3>
              <p className="text-xs text-[#52607D] max-w-sm mx-auto">
                {hasActiveFilters
                  ? "Try adjusting or clearing your date and search filters."
                  : "Click 'Add Proceeding Batch' to paste government application IDs and calculate dealer commission."}
              </p>
              {hasActiveFilters ? (
                <Button size="sm" variant="secondary" onClick={handleResetFilters}>
                  Clear Filters
                </Button>
              ) : (
                <Button size="sm" variant="primary" icon={Plus} onClick={() => setCreateModalOpen(true)}>
                  Add First Proceeding
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAFAF8] border-b border-[#E4E1D8] text-[#52607D] uppercase font-semibold">
                    <tr>
                      <th className="py-3 px-4">Proceeding Date</th>
                      <th className="py-3 px-4">Fund Slab</th>
                      <th className="py-3 px-4">Projects</th>
                      <th className="py-3 px-4">Proceeding Amount</th>
                      <th className="py-3 px-4">Dealer Commission</th>
                      <th className="py-3 px-4">Fittings Cost</th>
                      <th className="py-3 px-4">Payment Status</th>
                      <th className="py-3 px-4">Dealer Payout</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDEAE1]">
                    {batches.map((b) => (
                      <tr key={b.id} className="hover:bg-[#FAFAF8] transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 font-semibold text-[#14213D]">
                            <Calendar size={13} className="text-[#2F6F5E]" />
                            <span>{formatDate(b.proceeding_date)}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-xs text-[#2F6F5E]">
                            {b.fund_percentage_value}%
                          </span>
                        </td>

                        <td className="py-3 px-4 font-medium text-[#14213D]">
                          <span className="font-mono">{b.projects?.length || 0}</span> projects
                        </td>

                        <td className="py-3 px-4 font-mono font-bold text-[#14213D]">
                          {formatRupees(b.total_proceeding_amount)}
                        </td>

                        <td className="py-3 px-4 font-mono font-bold text-[#2F6F5E]">
                          {formatRupees(b.total_calculated_commission)}
                        </td>

                        <td className="py-3 px-4 font-mono text-[#7C3AED] font-semibold">
                          {formatRupees(b.total_calculated_fittings)}
                        </td>

                        <td className="py-3 px-4">
                          {b.payment_received_date ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
                                ✓ Received
                              </span>
                              <div className="text-[10px] text-[#52607D] font-mono">
                                {formatDate(b.payment_received_date)}
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveBatchForBank(b);
                                setBankReceiptDate(new Date().toISOString().split("T")[0]);
                                setBankReceiptRef("");
                                setBankReceiptModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-medium hover:bg-amber-100 transition-colors cursor-pointer"
                              title="Click to record payment date"
                            >
                              <Clock size={11} />
                              Record Payment
                            </button>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                              b.dealer_payout_status === "PAID"
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : b.dealer_payout_status === "PARTIAL"
                                ? "bg-blue-50 text-blue-800 border border-blue-200"
                                : "bg-gray-100 text-gray-700 border border-gray-200"
                            }`}
                          >
                            {b.dealer_payout_status}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              variant="outline"
                              size="xs"
                              icon={Eye}
                              onClick={() => navigate(`/commissions/${b.id}`)}
                              title="View dealer-wise breakdown & payout"
                            >
                              Breakdown
                            </Button>

                            <button
                              type="button"
                              onClick={() => {
                                setBatchToDelete(b);
                                setDeleteError("");
                              }}
                              className="text-gray-400 hover:text-rose-600 p-1.5 rounded-[6px] hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete proceeding batch"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {batches.length > 0 && (
                <div className="p-4 border-t border-[#E4E1D8]">
                  <Pagination
                    currentPage={pagination.page}
                    totalPages={pagination.totalPages}
                    onPageChange={(p) => fetchBatches(p)}
                    totalItems={pagination.total}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Modal 1: Add Proceeding Batch */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Add Government Proceeding Batch"
      >
        <form onSubmit={handleCreateBatch} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-[8px] text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-[#FAFAF8] p-3.5 rounded-[10px] border border-[#EDEAE1]">
            <div>
              <label className="block text-xs font-semibold text-[#14213D] mb-1">
                Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={formData.proceeding_date}
                onChange={(e) => setFormData({ ...formData, proceeding_date: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono bg-white border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#14213D] mb-1">
                Fund % <span className="text-rose-500">*</span>
              </label>
              <CustomSelect
                options={fundSlabOptions}
                value={formData.fund_percentage_id}
                onChange={(val) => {
                  const sel = fundPercentages.find((s) => s.id === val);
                  const newPct = sel ? sel.percentage : 55.0;
                  setFormData({
                    ...formData,
                    fund_percentage_id: val,
                    fund_percentage_value: newPct,
                    total_proceeding_amount: idPreview?.total_state_restricted
                      ? Math.floor(idPreview.total_state_restricted * (newPct / 100))
                      : formData.total_proceeding_amount,
                  });
                }}
                placeholder="Select Fund %"
                searchable={false}
                size="md"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#14213D] mb-1">
                State Restricted
              </label>
              <div className="w-full px-3 py-2 text-xs font-mono font-bold bg-white border border-[#E4E1D8] rounded-[8px] text-[#14213D] flex items-center justify-between">
                <span>{idPreview && idPreview.total_state_restricted > 0 ? formatRupees(idPreview.total_state_restricted) : "₹0"}</span>
                <span className="text-[10px] text-[#52607D] font-normal">100% Value</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2F6F5E] mb-1">
                Proceeding <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                placeholder="e.g. 540000"
                value={formData.total_proceeding_amount}
                onChange={(e) => setFormData({ ...formData, total_proceeding_amount: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono font-bold bg-white border border-[#2F6F5E]/40 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#2F6F5E]"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-[#14213D]">
                Paste Government Application IDs <span className="text-rose-500">*</span>
              </label>
              {previewLoading && (
                <span className="text-[10px] text-[#2F6F5E] animate-pulse font-medium">
                  Checking IDs in database...
                </span>
              )}
            </div>
            <textarea
              rows={5}
              placeholder={`Paste Application IDs (one per line or separated by comma/spaces):\n\nH-DPR-pgm-7142245468-2024-25\nH-DPR-pgm-3620941269-2023-24\nH-DPR-npy-5938730338-2023-24`}
              value={formData.application_ids_text}
              onChange={(e) => setFormData({ ...formData, application_ids_text: e.target.value })}
              className="w-full px-3 py-2 text-xs font-mono bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
              required
            />

            {/* Live Calculation Preview Banner */}
            {idPreview && (
              <div className="mt-2 p-3.5 bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] text-xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-[#EDEAE1]">
                  <div className="flex items-center gap-2">
                    {idPreview.unmatched_count === 0 && idPreview.missing_state_restricted_count === 0 && idPreview.missing_invoice_date_count === 0 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold font-mono">
                        <CheckCircle2 size={13} className="text-emerald-700" />
                        {idPreview.matched_count} Valid Projects Ready
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold font-mono">
                        <AlertCircle size={13} className="text-amber-700" />
                        {idPreview.matched_count} Found ({idPreview.unmatched_count + idPreview.missing_state_restricted_count + idPreview.missing_invoice_date_count} issues)
                      </span>
                    )}
                  </div>

                  {/* Show both State Restricted and Selected % Proceeding Amount */}
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <div className="text-right">
                      <span className="text-[10px] text-[#52607D] uppercase font-semibold block">
                        State Restricted
                      </span>
                      <strong className="text-[#14213D] text-sm">
                        {formatRupees(idPreview.total_state_restricted)}
                      </strong>
                    </div>

                    <div className="text-right pl-3 border-l border-[#EDEAE1]">
                      <span className="text-[10px] text-[#2F6F5E] uppercase font-bold block">
                        Proceeding Amount ({formData.fund_percentage_value}%)
                      </span>
                      <strong className="text-[#2F6F5E] text-sm font-extrabold">
                        {formatRupees(idPreview.total_fund_share)}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono text-[#52607D] bg-white p-2.5 rounded-[6px] border border-[#EDEAE1]">
                  <div>
                    <span className="text-[9px] uppercase block text-[#8C97AB]">Fund Share ({formData.fund_percentage_value}%)</span>
                    <span className="font-bold text-[#14213D]">{formatRupees(idPreview.total_fund_share)}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase block text-[#8C97AB]">Net Material Base</span>
                    <span className="font-bold text-[#14213D]">{formatRupees(idPreview.total_net_material_base)}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase block text-[#8C97AB]">Dealer Commission</span>
                    <span className="font-bold text-[#2F6F5E]">{formatRupees(idPreview.total_commission)}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase block text-[#8C97AB]">Fittings (5%)</span>
                    <span className="font-bold text-blue-700">{formatRupees(idPreview.total_fittings)}</span>
                  </div>
                </div>

                {/* Validation Warnings (Strict Guardrails) */}
                {idPreview.unmatched_count > 0 && (
                  <div className="p-2 bg-rose-50 border border-rose-200 rounded-[6px] text-[11px] text-rose-800">
                    <strong>❌ {idPreview.unmatched_count} Unmatched Application ID(s):</strong> {idPreview.unmatched_ids.join(", ")}
                    <div className="text-[10px] text-rose-600 mt-0.5">Please fix or remove these IDs before submitting.</div>
                  </div>
                )}

                {idPreview.missing_state_restricted_count > 0 && (
                  <div className="p-2 bg-amber-50 border border-amber-200 rounded-[6px] text-[11px] text-amber-800">
                    <strong>⚠️ {idPreview.missing_state_restricted_count} Missing State Restricted Amount:</strong> {idPreview.missing_state_restricted_ids.join(", ")}
                    <div className="text-[10px] text-amber-700 mt-0.5">State Restricted Amount is required for money calculations.</div>
                  </div>
                )}

                {idPreview.missing_invoice_date_count > 0 && (
                  <div className="p-2 bg-amber-50 border border-amber-200 rounded-[6px] text-[11px] text-amber-800">
                    <strong>⚠️ {idPreview.missing_invoice_date_count} Missing Invoice Date:</strong> {idPreview.missing_invoice_date_ids.join(", ")}
                    <div className="text-[10px] text-amber-700 mt-0.5">Invoice date is required to look up the applicable GST rate.</div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#EDEAE1]">
            <div>
              <label className="block text-xs font-semibold text-[#14213D] mb-1">
                Payment Received Date (Optional)
              </label>
              <input
                type="date"
                value={formData.payment_received_date}
                onChange={(e) => setFormData({ ...formData, payment_received_date: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#14213D] mb-1">
                Payment Ref / UTR (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. UTR-9821873192"
                value={formData.payment_received_ref}
                onChange={(e) => setFormData({ ...formData, payment_received_ref: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#14213D] mb-1">
              Remarks / Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="Optional remarks regarding this proceeding batch..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-[#EDEAE1]">
            <Button variant="secondary" type="button" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={submitting}
              icon={Plus}
              disabled={
                Boolean(
                  idPreview &&
                  (idPreview.unmatched_count > 0 ||
                    idPreview.missing_state_restricted_count > 0 ||
                    idPreview.missing_invoice_date_count > 0)
                )
              }
            >
              Calculate & Create Batch
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Manage Master Fund % Slabs */}
      <Modal
        isOpen={manageSlabsModalOpen}
        onClose={() => {
          setManageSlabsModalOpen(false);
          setSlabError("");
          setSlabSuccess("");
        }}
        title="Fund Percentage Slabs"
      >
        <div className="space-y-4">
          {slabError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-[8px] text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle size={15} className="text-rose-600 shrink-0" />
              <span>{slabError}</span>
            </div>
          )}

          {slabSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-[8px] text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
              <span>{slabSuccess}</span>
            </div>
          )}

          <form onSubmit={handleAddSlab} className="flex gap-2 items-center bg-[#FAFAF8] p-3.5 rounded-[8px] border border-[#EDEAE1]">
            <div className="flex-1">
              <label className="block text-[11px] font-semibold text-[#14213D] mb-1">
                Add New Fund Percentage (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="1"
                  max="100"
                  placeholder="e.g. 45 or 55 or 60 or 100"
                  value={newSlabPct}
                  onChange={(e) => {
                    setNewSlabPct(e.target.value);
                    if (slabError) setSlabError("");
                    if (slabSuccess) setSlabSuccess("");
                  }}
                  className="w-full pl-3 pr-8 py-2 text-xs font-mono font-bold bg-white border border-[#CCD5AE] rounded-[6px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
                  required
                  autoFocus
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-xs text-[#52607D]">
                  %
                </span>
              </div>
            </div>
            <Button type="submit" size="md" loading={addingSlab} icon={Plus} className="shrink-0 mt-5">
              Save %
            </Button>
          </form>

          <div className="border border-[#EDEAE1] rounded-[8px] overflow-hidden">
            <div className="p-2 bg-[#FAFAF8] border-b border-[#EDEAE1] flex items-center justify-between text-xs font-semibold text-[#52607D]">
              <span>Active Slabs ({fundPercentages.length})</span>
              <span className="text-[10px] text-[#8C97AB]">Available in proceeding batch dropdown</span>
            </div>

            {fundPercentages.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#8C97AB]">
                No percentage slabs configured. Add one above.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAFAF8] border-b border-[#EDEAE1] text-[#52607D] font-semibold">
                  <tr>
                    <th className="py-2.5 px-3 w-12 text-center">#</th>
                    <th className="py-2.5 px-3">Fund Percentage</th>
                    <th className="py-2.5 px-3 text-right w-20">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDEAE1]">
                  {fundPercentages.map((slab, idx) => (
                    <tr key={slab.id} className="hover:bg-[#FAFAF8]">
                      <td className="py-2.5 px-3 text-center font-mono text-[#8C97AB]">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-[#14213D] text-sm">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-[#2F6F5E] border border-emerald-200">
                          {slab.percentage}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteSlab(slab.id)}
                          className="text-gray-400 hover:text-rose-600 p-1.5 rounded-[6px] hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete percentage slab"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </Modal>

      {/* Modal 3: Record Payment Receipt Date */}
      <Modal
        isOpen={bankReceiptModalOpen}
        onClose={() => setBankReceiptModalOpen(false)}
        title="Record Payment Receipt Date"
      >
        <form onSubmit={handleSaveBankReceipt} className="space-y-4">
          <div className="p-3 bg-[#EAF3F0] rounded-[8px] text-xs text-[#2F6F5E] flex items-center justify-between">
            <span>Proceeding Batch Date:</span>
            <strong className="text-sm font-bold text-[#14213D]">
              {formatDate(activeBatchForBank?.proceeding_date)}
            </strong>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#14213D] mb-1">
              Payment Received Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={bankReceiptDate}
              onChange={(e) => setBankReceiptDate(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#14213D] mb-1">
              Payment Reference / UTR (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. NEFT-UTR-89123891"
              value={bankReceiptRef}
              onChange={(e) => setBankReceiptRef(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-[#EDEAE1]">
            <Button variant="secondary" type="button" onClick={() => setBankReceiptModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={savingBankReceipt} icon={CheckCircle2}>
              Save Payment Date
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 4: Delete Proceeding Confirmation */}
      <Modal
        isOpen={Boolean(batchToDelete)}
        onClose={() => setBatchToDelete(null)}
        title="Delete Proceeding Batch"
      >
        <div className="space-y-4">
          {deleteError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-[8px] text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle size={15} className="text-rose-600 shrink-0" />
              <span>{deleteError}</span>
            </div>
          )}

          <p className="text-xs text-[#52607D]">
            Are you sure you want to delete the proceeding batch for{" "}
            <strong className="text-[#14213D]">{formatDate(batchToDelete?.proceeding_date)}</strong>? This will remove all calculated dealer commissions and linked project records for this batch.
          </p>

          <div className="flex justify-end gap-2 pt-4 border-t border-[#EDEAE1]">
            <Button variant="secondary" type="button" onClick={() => setBatchToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              type="button"
              loading={deletingBatch}
              icon={Trash2}
              onClick={handleConfirmDelete}
            >
              Delete Batch
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default CommissionProceedingsPage;
