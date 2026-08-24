import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  IndianRupee,
  FileText,
  CheckCircle2,
  Clock,
  Search,
  X,
  CreditCard,
  AlertCircle,
  Building2,
  Users,
  Percent,
  RefreshCw,
  FileSpreadsheet,
  TrendingUp,
  Wrench,
  Pencil,
} from "lucide-react";
import api from "../api/client.js";
import Navbar from "../components/layout/Navbar.jsx";
import Button from "../components/common/Button.jsx";
import Modal from "../components/common/Modal.jsx";
import { SkeletonLoader } from "../components/common/SkeletonLoader.jsx";

export function CommissionBatchDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [batch, setBatch] = useState(null);
  const [dealerSummaries, setDealerSummaries] = useState([]);
  const [error, setError] = useState("");

  // Search filter for individual projects table
  const [projectSearch, setProjectSearch] = useState("");

  // Modal: Record Payment Date
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentRef, setPaymentRef] = useState("");
  const [savingPayment, setSavingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  // Modal: Record Dealer Payout
  const [dealerPayModalOpen, setDealerPayModalOpen] = useState(false);
  const [activeDealerForPay, setActiveDealerForPay] = useState(null);
  const [dealerPayDate, setDealerPayDate] = useState(new Date().toISOString().split("T")[0]);
  const [dealerPayRef, setDealerPayRef] = useState("Direct Bank Transfer / NEFT");
  const [dealerPayPenalty, setDealerPayPenalty] = useState(0);
  const [markingDealerPaid, setMarkingDealerPaid] = useState(false);
  const [dealerPayError, setDealerPayError] = useState("");

  // Modal: Manual Project Penalty Override
  const [penaltyModalOpen, setPenaltyModalOpen] = useState(false);
  const [activeProjectForPenalty, setActiveProjectForPenalty] = useState(null);
  const [manualPenaltyAmount, setManualPenaltyAmount] = useState(0);
  const [savingPenalty, setSavingPenalty] = useState(false);
  const [penaltyError, setPenaltyError] = useState("");

  const fetchBatchDetail = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get(`/proceedings/${id}`);
      const batchData = res?.batch || res?.data?.batch;
      const summaries = res?.dealer_summaries || res?.data?.dealer_summaries || [];
      if (!batchData) {
        setError("Proceeding batch not found");
        return;
      }
      setBatch(batchData);
      setDealerSummaries(summaries);
    } catch (err) {
      console.error("Error fetching proceeding batch detail:", err);
      setError(err?.message || err?.response?.data?.message || "Failed to load proceeding batch");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatchDetail();
  }, [id]);

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

  // Filter individual projects in this batch
  const filteredProjects = useMemo(() => {
    if (!batch?.projects) return [];
    if (!projectSearch.trim()) return batch.projects;
    const q = projectSearch.toLowerCase().trim();
    return batch.projects.filter(
      (p) =>
        p.application_id?.toLowerCase().includes(q) ||
        p.farmer_name?.toLowerCase().includes(q) ||
        p.district?.toLowerCase().includes(q) ||
        p.dealer?.name?.toLowerCase().includes(q)
    );
  }, [batch?.projects, projectSearch]);

  // Handle Save Payment Received Date
  const handleSavePaymentReceipt = async (e) => {
    e.preventDefault();
    setPaymentError("");
    try {
      setSavingPayment(true);
      await api.patch(`/proceedings/${id}/bank-receipt`, {
        payment_received_date: paymentDate || null,
        payment_received_ref: paymentRef ? paymentRef.trim() : null,
      });
      setPaymentModalOpen(false);
      fetchBatchDetail();
    } catch (err) {
      setPaymentError(err?.message || err?.response?.data?.message || "Failed to update payment receipt date");
    } finally {
      setSavingPayment(false);
    }
  };

  // Handle Mark Dealer Paid with customizable penalty deduction
  const handleMarkDealerPaid = async (e) => {
    e.preventDefault();
    if (!activeDealerForPay) return;
    setDealerPayError("");
    try {
      setMarkingDealerPaid(true);
      const res = await api.post(`/proceedings/${id}/mark-dealer-paid`, {
        dealer_id: activeDealerForPay.dealer_id,
        paid_date: dealerPayDate,
        paid_ref: dealerPayRef,
        adjusted_penalty_amount: parseFloat(dealerPayPenalty || 0),
      });
      setBatch(res?.batch || res?.data?.batch);
      setDealerSummaries(res?.dealer_summaries || res?.data?.dealer_summaries || []);
      setDealerPayModalOpen(false);
    } catch (err) {
      setDealerPayError(err?.message || err?.response?.data?.message || "Failed to mark dealer payout");
    } finally {
      setMarkingDealerPaid(false);
    }
  };

  // Handle Open Manual Penalty Modal
  const handleOpenPenaltyModal = (projectRecord) => {
    setActiveProjectForPenalty(projectRecord);
    setManualPenaltyAmount(
      projectRecord.adjusted_penalty_amount !== undefined && projectRecord.adjusted_penalty_amount !== null
        ? projectRecord.adjusted_penalty_amount
        : projectRecord.penalty_amount || 0
    );
    setPenaltyError("");
    setPenaltyModalOpen(true);
  };

  // Handle Save Manual Penalty
  const handleSaveManualPenalty = async (e) => {
    e.preventDefault();
    if (!activeProjectForPenalty) return;
    setPenaltyError("");
    try {
      setSavingPenalty(true);
      const res = await api.patch(
        `/proceedings/${id}/projects/${activeProjectForPenalty.id}/penalty`,
        {
          adjusted_penalty_amount: parseFloat(manualPenaltyAmount || 0),
        }
      );
      setBatch(res?.batch || res?.data?.batch || batch);
      setDealerSummaries(res?.dealer_summaries || res?.data?.dealer_summaries || dealerSummaries);
      setPenaltyModalOpen(false);
    } catch (err) {
      setPenaltyError(err?.message || err?.response?.data?.message || "Failed to update penalty");
    } finally {
      setSavingPenalty(false);
    }
  };

  const [recalculating, setRecalculating] = useState(false);
  const handleRecalculateBatch = async () => {
    try {
      setRecalculating(true);
      const res = await api.post(`/proceedings/${id}/recalculate`);
      setBatch(res?.batch || res?.data?.batch || batch);
      setDealerSummaries(res?.dealer_summaries || res?.data?.dealer_summaries || dealerSummaries);
    } catch (err) {
      console.error("Error recalculating batch:", err);
    } finally {
      setRecalculating(false);
    }
  };

  if (loading && !batch) {
    return (
      <div className="flex-1 flex flex-col min-h-0">
        <Navbar title="Commission Proceedings" subtitle="Proceeding Batch Details & Dealer Disbursements" />
        <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 overflow-y-auto">
          <SkeletonLoader rows={10} />
        </main>
      </div>
    );
  }

  if (error || !batch) {
    return (
      <div className="flex-1 flex flex-col min-h-0">
        <Navbar title="Commission Proceedings" subtitle="Proceeding Batch Details & Dealer Disbursements" />
        <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 overflow-y-auto">
          <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-8 text-center space-y-3">
            <AlertCircle size={28} className="text-rose-500 mx-auto" />
            <h2 className="text-base font-bold text-[#14213D]">Unable to Load Proceeding Batch</h2>
            <p className="text-xs text-[#52607D] max-w-md mx-auto">{error || "Batch not found"}</p>
            <Button size="sm" variant="secondary" icon={ArrowLeft} onClick={() => navigate("/commissions")}>
              Back to Commission Proceedings
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Navbar
        title="Commission Proceedings"
        subtitle={`Proceeding Batch – ${formatDate(batch.proceeding_date)} (${batch.fund_percentage_value}% Fund Release)`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={ArrowLeft}
              onClick={() => navigate("/commissions")}
            >
              Back to Batches
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              loading={recalculating}
              onClick={handleRecalculateBatch}
              title="Recalculate all delay penalties & commissions with latest scheme tax slabs and project milestones"
            >
              Recalculate Penalties
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={fetchBatchDetail}
              title="Refresh Batch Details"
            >
              Refresh
            </Button>
          </div>
        }
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 overflow-y-auto">
        {/* Top Breadcrumb & Status Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-[#52607D]">
              <Link to="/commissions" className="hover:text-[#2F6F5E] transition-colors">
                Commission Proceedings
              </Link>
              <span>/</span>
              <span className="font-semibold text-[#14213D]">
                Batch #{batch.proceeding_no || formatDate(batch.proceeding_date)}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-[#14213D] flex items-center gap-2">
                <Calendar size={20} className="text-[#2F6F5E]" />
                <span>Proceeding Batch #{batch.proceeding_no}</span>
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-[#EAF3F0] text-[#2F6F5E] border border-[#2F6F5E]/30 font-bold font-mono text-xs">
                {batch.fund_percentage_value}% Fund Release
              </span>
            </div>
          </div>
        </div>

        {/* Top Details & Payment Status Card */}
        <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-5 shadow-[0_1px_2px_rgba(20,33,61,0.04)] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-[10px] text-[#52607D] uppercase font-semibold block">Proceeding Date</span>
            <div className="font-bold text-[#14213D] text-sm mt-0.5 flex items-center gap-1.5">
              <Calendar size={13} className="text-[#2F6F5E]" />
              <span>{formatDate(batch.proceeding_date)}</span>
            </div>
          </div>

          <div>
            <span className="text-[10px] text-[#52607D] uppercase font-semibold block">Fund Release Slab</span>
            <div className="font-bold text-[#2F6F5E] text-sm mt-0.5 font-mono">
              {batch.fund_percentage_value}% Release
            </div>
          </div>

          <div>
            <span className="text-[10px] text-[#52607D] uppercase font-semibold block">Payment Status</span>
            <div className="mt-1 flex items-center gap-2">
              {batch.payment_received_date ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold font-mono">
                  ✓ Received ({formatDate(batch.payment_received_date)})
                </span>
              ) : (
                <Button
                  size="xs"
                  variant="primary"
                  icon={Clock}
                  onClick={() => {
                    setPaymentDate(new Date().toISOString().split("T")[0]);
                    setPaymentRef("");
                    setPaymentError("");
                    setPaymentModalOpen(true);
                  }}
                >
                  Record Payment
                </Button>
              )}
            </div>
          </div>

          <div>
            <span className="text-[10px] text-[#52607D] uppercase font-semibold block">Dealer Payout Status</span>
            <div className="mt-1">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold font-mono ${
                  batch.dealer_payout_status === "PAID"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : batch.dealer_payout_status === "PARTIAL"
                    ? "bg-blue-50 text-blue-800 border border-blue-200"
                    : "bg-gray-100 text-gray-700 border border-gray-200"
                }`}
              >
                {batch.dealer_payout_status}
              </span>
            </div>
          </div>
        </div>

        {/* KPI Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-4 shadow-[0_1px_2px_rgba(20,33,61,0.04)]">
            <div className="flex items-center justify-between text-xs text-[#52607D]">
              <span className="font-semibold uppercase tracking-wider">Total Proceeding</span>
              <FileSpreadsheet size={16} className="text-[#2F6F5E]" />
            </div>
            <div className="text-xl font-bold font-mono text-[#14213D] mt-2">
              {formatRupees(batch.total_proceeding_amount)}
            </div>
            <div className="text-[11px] text-[#52607D] mt-0.5">
              {batch.projects?.length || 0} linked projects
            </div>
          </div>

          <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-4 shadow-[0_1px_2px_rgba(20,33,61,0.04)]">
            <div className="flex items-center justify-between text-xs text-[#52607D]">
              <span className="font-semibold uppercase tracking-wider">Dealer Commission</span>
              <TrendingUp size={16} className="text-[#2F6F5E]" />
            </div>
            <div className="text-xl font-bold font-mono text-[#2F6F5E] mt-2">
              {formatRupees(batch.total_calculated_commission)}
            </div>
            <div className="text-[11px] text-[#52607D] mt-0.5">
              Calculated on net material at {batch.fund_percentage_value}% fund
            </div>
          </div>

          <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-4 shadow-[0_1px_2px_rgba(20,33,61,0.04)]">
            <div className="flex items-center justify-between text-xs text-[#52607D]">
              <span className="font-semibold uppercase tracking-wider">Fittings Cost (5%)</span>
              <Wrench size={16} className="text-[#7C3AED]" />
            </div>
            <div className="text-xl font-bold font-mono text-[#7C3AED] mt-2">
              {formatRupees(batch.total_calculated_fittings)}
            </div>
            <div className="text-[11px] text-[#52607D] mt-0.5">
              5% fittings on {batch.fund_percentage_value}% fund release
            </div>
          </div>

          <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-4 shadow-[0_1px_2px_rgba(20,33,61,0.04)]">
            <div className="flex items-center justify-between text-xs text-[#52607D]">
              <span className="font-semibold uppercase tracking-wider">Net Dealer Payout</span>
              <CreditCard size={16} className="text-emerald-700" />
            </div>
            <div className="text-xl font-bold font-mono text-emerald-800 mt-2">
              {formatRupees(
                dealerSummaries.reduce((sum, d) => sum + (d.total_net_payable || 0), 0)
              )}
            </div>
            <div className="text-[11px] text-emerald-600 font-medium">
              Commission + Fittings - Delay Penalties
            </div>
          </div>
        </div>

        {/* Section 1: Dealer Breakdown & Payout Disbursement */}
        <div className="bg-white border border-[#E4E1D8] rounded-[10px] shadow-[0_1px_2px_rgba(20,33,61,0.04)] overflow-hidden space-y-3 p-5">
          <div className="flex items-center justify-between border-b border-[#EDEAE1] pb-3">
            <h3 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
              <Building2 size={16} className="text-[#2F6F5E]" />
              Dealer-Wise Commission & Payout Summary
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAFAF8] border-b border-[#E4E1D8] text-[#52607D] uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Dealer Name</th>
                  <th className="py-2.5 px-3 text-center">Projects</th>
                  <th className="py-2.5 px-3 text-right">Invoice Amount</th>
                  <th className="py-2.5 px-3 text-right">Subsidy Amount</th>
                  <th className="py-2.5 px-3 text-right">State Restricted</th>
                  <th className="py-2.5 px-3 text-right">Material Cost</th>
                  <th className="py-2.5 px-3 text-right">Commission</th>
                  <th className="py-2.5 px-3 text-right">Fittings</th>
                  <th className="py-2.5 px-3 text-right">Penalty</th>
                  <th className="py-2.5 px-3 text-right font-bold text-[#14213D]">Total Payout</th>
                  <th className="py-2.5 px-3 text-center">Payout Status</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDEAE1]">
                {dealerSummaries.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-6 text-center text-xs text-[#8C97AB]">
                      No dealers found in this batch.
                    </td>
                  </tr>
                ) : (
                  dealerSummaries.map((d) => (
                    <tr key={d.dealer_id || "unassigned"} className="hover:bg-[#FAFAF8]">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-[#14213D] text-xs">{d.dealer_name}</div>
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-[#14213D]">
                        {d.projects_count}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-[#52607D]">
                        {formatRupees(d.total_invoice_amount)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-[#52607D]">
                        {formatRupees(d.total_subsidy_amount)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-[#52607D]">
                        {formatRupees(d.total_state_restricted)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-[#52607D]">
                        {formatRupees(d.total_net_material_base)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-[#2F6F5E]">
                        {formatRupees(d.total_commission_amount)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-[#7C3AED] font-semibold">
                        {formatRupees(d.total_fittings_amount)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono">
                        {d.total_penalty_amount > 0 ? (
                          <span className="text-rose-600 font-bold font-mono">
                            -{formatRupees(d.total_penalty_amount)}
                          </span>
                        ) : (
                          <span className="text-[#8C97AB]">₹0</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-800 text-sm">
                        {formatRupees(d.total_net_payable)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {d.is_paid ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                            ✓ Paid
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200 text-[10px] font-bold">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {d.is_paid ? (
                          <span className="text-[11px] text-emerald-600 font-medium">Completed</span>
                        ) : (
                          <Button
                            variant="primary"
                            size="xs"
                            icon={CreditCard}
                            onClick={() => {
                              setActiveDealerForPay(d);
                              setDealerPayDate(new Date().toISOString().split("T")[0]);
                              setDealerPayRef("Direct Bank Transfer / NEFT");
                              setDealerPayPenalty(d.total_penalty_amount || 0);
                              setDealerPayError("");
                              setDealerPayModalOpen(true);
                            }}
                          >
                            Record Payout
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 2: Individual Linked Government Projects */}
        <div className="bg-white border border-[#E4E1D8] rounded-[10px] shadow-[0_1px_2px_rgba(20,33,61,0.04)] overflow-hidden space-y-3 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EDEAE1] pb-3">
            <h3 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
              <FileText size={16} className="text-[#2F6F5E]" />
              Linked Government Projects ({filteredProjects.length})
            </h3>

            <div className="relative w-full sm:w-72">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#52607D]" />
              <input
                type="text"
                placeholder="Search Application ID, Farmer, Dealer..."
                value={projectSearch}
                onChange={(e) => setProjectSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAFAF8] border-b border-[#E4E1D8] text-[#52607D] uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Application ID</th>
                  <th className="py-2.5 px-3">Farmer & District</th>
                  <th className="py-2.5 px-3">Dealer</th>
                  <th className="py-2.5 px-3">F1: Invoice → Work Completed</th>
                  <th className="py-2.5 px-3">F2: 1st Fund → JV Completed</th>
                  <th className="py-2.5 px-3 text-right">State Restricted</th>
                  <th className="py-2.5 px-3 text-right">Fund Share</th>
                  <th className="py-2.5 px-3 text-right">Material Cost</th>
                  <th className="py-2.5 px-3 text-right">Commission</th>
                  <th className="py-2.5 px-3 text-right">Fittings</th>
                  <th className="py-2.5 px-3 text-right">Penalty</th>
                  <th className="py-2.5 px-3 text-right font-bold text-[#14213D]">Net Payable</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDEAE1]">
                {filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="py-8 text-center text-xs text-[#8C97AB]">
                      No matching projects found in this batch.
                    </td>
                  </tr>
                ) : (
                  filteredProjects.map((p, idx) => {
                    const penalty = parseFloat(
                      p.adjusted_penalty_amount !== undefined && p.adjusted_penalty_amount !== null
                        ? p.adjusted_penalty_amount
                        : p.penalty_amount || 0
                    );
                    const comm = parseFloat(p.commission_amount || 0);
                    const fit = parseFloat(p.fittings_amount || 0);
                    const netPayable = Math.max(0, comm + fit - penalty);

                    return (
                      <tr key={p.id || idx} className="hover:bg-[#FAFAF8]">
                        <td className="py-2.5 px-3 font-mono font-bold text-[#14213D]">
                          {p.application_id}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-[#14213D]">{p.farmer_name || "—"}</div>
                          <div className="text-[10px] text-[#52607D]">{p.district || "—"}</div>
                        </td>
                        <td className="py-2.5 px-3 text-[#14213D] font-medium">
                          {p.dealer?.name || "Unassigned"}
                        </td>

                        {/* Milestone 1 SLA: Invoice -> Work Completion Approved */}
                        <td className="py-2.5 px-3">
                          <div className="text-[11px] text-[#14213D] font-mono">
                            <span className="text-[#8C97AB]">Inv:</span> {formatDate(p.invoice_date)}
                          </div>
                          <div className="text-[11px] text-[#14213D] font-mono">
                            <span className="text-[#8C97AB]">WC:</span> {formatDate(p.work_completion_date)}
                          </div>
                          <div className="mt-0.5">
                            {p.m1_delay_days !== null ? (
                              <span
                                className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold font-mono ${
                                  p.m1_delay_days > 45
                                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                                    : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                }`}
                              >
                                {p.m1_delay_days} days
                              </span>
                            ) : (
                              <span className="text-gray-400 text-[10px] italic">—</span>
                            )}
                          </div>
                        </td>

                        {/* Milestone 2 SLA: 1st Fund UTR -> JV Completed */}
                        <td className="py-2.5 px-3">
                          <div className="text-[11px] text-[#14213D] font-mono">
                            <span className="text-[#8C97AB]">1st:</span> {formatDate(p.first_fund_date)}
                          </div>
                          <div className="text-[11px] text-[#14213D] font-mono">
                            <span className="text-[#8C97AB]">JV:</span> {formatDate(p.jv_completed_date)}
                          </div>
                          <div className="mt-0.5">
                            {p.m2_delay_days !== null ? (
                              <span
                                className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold font-mono ${
                                  p.m2_delay_days > 45
                                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                                    : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                }`}
                              >
                                {p.m2_delay_days} days
                              </span>
                            ) : (
                              <span className="text-gray-400 text-[10px] italic">—</span>
                            )}
                          </div>
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono text-[#52607D]">
                          {formatRupees(p.state_restricted_amount)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-[#2F6F5E] font-semibold">
                          {formatRupees(p.fund_share_amount)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-[#52607D]">
                          {formatRupees(p.net_material_base)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-[#2F6F5E]">
                          {formatRupees(p.commission_amount)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-[#7C3AED] font-semibold">
                          {formatRupees(p.fittings_amount)}
                        </td>

                        {/* Penalty with Manual Override Action */}
                        <td className="py-2.5 px-3 text-right font-mono">
                          <div className="flex items-center justify-end gap-1.5">
                            {penalty > 0 ? (
                              <span className="text-rose-600 font-bold font-mono">
                                -{formatRupees(penalty)}
                              </span>
                            ) : (
                              <span className="text-[#8C97AB]">₹0</span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleOpenPenaltyModal(p)}
                              className="p-1 text-[#52607D] hover:text-[#2F6F5E] hover:bg-gray-100 rounded transition-colors cursor-pointer"
                              title="Add / Edit Manual Penalty"
                            >
                              <Pencil size={12} />
                            </button>
                          </div>
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800">
                          {formatRupees(netPayable)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                              p.is_paid_to_dealer
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : "bg-gray-100 text-gray-700 border border-gray-200"
                            }`}
                          >
                            {p.is_paid_to_dealer ? "PAID" : "UNPAID"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal 1: Record Payment Receipt Date */}
      <Modal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        title="Record Payment Receipt Date"
      >
        <form onSubmit={handleSavePaymentReceipt} className="space-y-4">
          {paymentError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-[8px] text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle size={15} className="text-rose-600 shrink-0" />
              <span>{paymentError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#14213D] mb-1">
              Payment Received Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#14213D] mb-1">
              Payment Reference / UTR
            </label>
            <input
              type="text"
              placeholder="e.g. NEFT-UTR-89123891"
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-[#EDEAE1]">
            <Button variant="secondary" type="button" onClick={() => setPaymentModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={savingPayment} icon={CheckCircle2}>
              Save Payment Date
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Record Dealer Payout with Editable Penalty */}
      <Modal
        isOpen={dealerPayModalOpen}
        onClose={() => setDealerPayModalOpen(false)}
        title={`Record Payout for Dealer: ${activeDealerForPay?.dealer_name || "Dealer"}`}
      >
        <form onSubmit={handleMarkDealerPaid} className="space-y-4">
          {dealerPayError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-[8px] text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle size={15} className="text-rose-600 shrink-0" />
              <span>{dealerPayError}</span>
            </div>
          )}

          <div className="p-3 bg-[#FAFAF8] rounded-[8px] border border-[#EDEAE1] space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-[#52607D]">Dealer Name:</span>
              <strong className="text-[#14213D]">{activeDealerForPay?.dealer_name}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#52607D]">Included Projects:</span>
              <strong className="font-mono text-[#14213D]">{activeDealerForPay?.projects_count} projects</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#52607D]">Total Commission Amount:</span>
              <strong className="font-mono text-[#2F6F5E]">
                {formatRupees(activeDealerForPay?.total_commission_amount)}
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#52607D]">Fittings Cost:</span>
              <strong className="font-mono text-[#7C3AED]">
                {formatRupees(activeDealerForPay?.total_fittings_amount)}
              </strong>
            </div>
            <div className="flex justify-between border-t border-[#EDEAE1] pt-1.5">
              <span className="font-bold text-[#14213D]">Net Disbursable Payout:</span>
              <strong className="font-mono text-emerald-800 text-sm font-extrabold">
                {formatRupees(
                  Math.max(
                    0,
                    (activeDealerForPay?.total_commission_amount || 0) +
                      (activeDealerForPay?.total_fittings_amount || 0) -
                      (parseFloat(dealerPayPenalty) || 0)
                  )
                )}
              </strong>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#14213D] mb-1">
                Deductible Penalty (₹)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={dealerPayPenalty}
                onChange={(e) => setDealerPayPenalty(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
              />
              <span className="text-[10px] text-[#52607D]">Admin can adjust or waive delay penalty</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#14213D] mb-1">
                Payout Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={dealerPayDate}
                onChange={(e) => setDealerPayDate(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#14213D] mb-1">
              Payment Mode & UTR / Cheque Ref <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. NEFT-UTR-89123891, Cheque #49102"
              value={dealerPayRef}
              onChange={(e) => setDealerPayRef(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-[#EDEAE1]">
            <Button variant="secondary" type="button" onClick={() => setDealerPayModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={markingDealerPaid} icon={CheckCircle2}>
              Confirm Payout
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 3: Manual Project Penalty Override Modal */}
      <Modal
        isOpen={penaltyModalOpen}
        onClose={() => setPenaltyModalOpen(false)}
        title={`Adjust Penalty: ${activeProjectForPenalty?.application_id || "Project"}`}
      >
        <form onSubmit={handleSaveManualPenalty} className="space-y-4">
          {penaltyError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-[8px] text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle size={15} className="text-rose-600 shrink-0" />
              <span>{penaltyError}</span>
            </div>
          )}

          <div className="p-3 bg-[#FAFAF8] rounded-[8px] border border-[#EDEAE1] space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-[#52607D]">Application ID:</span>
              <strong className="font-mono text-[#14213D]">{activeProjectForPenalty?.application_id}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#52607D]">Farmer / District:</span>
              <strong className="text-[#14213D]">
                {activeProjectForPenalty?.farmer_name || "—"} ({activeProjectForPenalty?.district || "—"})
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#52607D]">Assigned Dealer:</span>
              <strong className="text-[#14213D]">{activeProjectForPenalty?.dealer?.name || "Unassigned"}</strong>
            </div>
            <div className="flex justify-between border-t border-[#EDEAE1] pt-1.5">
              <span className="text-[#52607D]">Calculated Commission:</span>
              <strong className="font-mono text-[#2F6F5E]">
                {formatRupees(activeProjectForPenalty?.commission_amount)}
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#52607D]">Fittings Reimbursement:</span>
              <strong className="font-mono text-[#7C3AED]">
                {formatRupees(activeProjectForPenalty?.fittings_amount)}
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#52607D]">SLA Delay Observed:</span>
              <strong className="font-mono text-amber-800">
                {activeProjectForPenalty?.delay_days || 0} days
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#52607D]">System Calculated Penalty:</span>
              <strong className="font-mono text-rose-700">
                {formatRupees(activeProjectForPenalty?.penalty_amount || 0)}
              </strong>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#14213D] mb-1">
              Adjusted / Manual Penalty Amount (₹) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="any"
              min="0"
              placeholder="0"
              value={manualPenaltyAmount}
              onChange={(e) => setManualPenaltyAmount(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono font-bold bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
              required
              autoFocus
            />
            <span className="text-[10px] text-[#52607D] mt-0.5 block">
              Enter 0 to waive all penalties, or enter a custom deduction amount.
            </span>
          </div>

          {/* Live Preview of Resulting Net Payable */}
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-[6px] flex items-center justify-between text-xs">
            <span className="font-semibold text-emerald-900">Resulting Net Payable to Dealer:</span>
            <strong className="font-mono text-emerald-800 text-sm font-extrabold">
              {formatRupees(
                Math.max(
                  0,
                  parseFloat(activeProjectForPenalty?.commission_amount || 0) +
                    parseFloat(activeProjectForPenalty?.fittings_amount || 0) -
                    (parseFloat(manualPenaltyAmount) || 0)
                )
              )}
            </strong>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-[#EDEAE1]">
            <Button variant="secondary" type="button" onClick={() => setPenaltyModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={savingPenalty} icon={CheckCircle2}>
              Save Adjusted Penalty
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default CommissionBatchDetailPage;
