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
  CreditCard,
  AlertCircle,
  Building2,
  RefreshCw,
  FileSpreadsheet,
  TrendingUp,
  Wrench,
  Pencil,
  AlertTriangle,
  Layers,
  Download,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import api from "../api/client.js";
import Navbar from "../components/layout/Navbar.jsx";
import Button from "../components/common/Button.jsx";
import Modal from "../components/common/Modal.jsx";
import { SkeletonLoader } from "../components/common/SkeletonLoader.jsx";
import Pagination from "../components/common/Pagination.jsx";

export function CommissionBatchDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [batch, setBatch] = useState(null);
  const [dealerSummaries, setDealerSummaries] = useState([]);
  const [unmatchedCount, setUnmatchedCount] = useState(0);
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
      const unCount = res?.unmatched_in_db_count ?? res?.data?.unmatched_in_db_count ?? 0;
      if (!batchData) {
        setError("Proceeding batch not found");
        return;
      }
      setBatch(batchData);
      setDealerSummaries(summaries);
      setUnmatchedCount(unCount);
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
        p.dealer?.name?.toLowerCase().includes(q) ||
        p.invoice_number?.toLowerCase().includes(q)
    );
  }, [batch?.projects, projectSearch]);

  // Client-side pagination for long lists
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  useEffect(() => {
    setCurrentPage(1);
  }, [projectSearch]);

  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProjects.slice(start, start + pageSize);
  }, [filteredProjects, currentPage, pageSize]);

  const hasFittings = Boolean(
    batch?.include_fittings ||
      parseFloat(batch?.total_calculated_fittings || 0) > 0
  );

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

  // Handle Mark Dealer Paid
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
        adjusted_penalty_amount: Math.floor(parseFloat(dealerPayPenalty || 0)),
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
      Math.floor(
        projectRecord.adjusted_penalty_amount !== undefined && projectRecord.adjusted_penalty_amount !== null
          ? projectRecord.adjusted_penalty_amount
          : projectRecord.penalty_amount || 0
      )
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
          adjusted_penalty_amount: Math.floor(Math.max(0, parseFloat(manualPenaltyAmount || 0))),
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

  // Export Proceeding Line Items Table to PDF
  const handleExportPDF = () => {
    if (!batch || !filteredProjects || filteredProjects.length === 0) return;

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();

    // Brand Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(20, 33, 61);
    doc.text("CHERAN IRRIGATION", 30, 36);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(82, 96, 125);
    doc.text("Government Proceeding Batch - Project Line Items Report", 30, 50);

    // Meta Header Information
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(20, 33, 61);
    doc.text(`Batch No: #${batch.proceeding_no || "—"}`, 30, 68);
    doc.text(`Proceeding Date: ${formatDate(batch.proceeding_date)}`, 200, 68);
    doc.text(`Release Tranche: ${batch.fund_percentage_value}% Fund Release`, 380, 68);
    doc.text(`5% Fittings Cost: ${hasFittings ? "Included" : "Excluded"}`, 560, 68);

    // Table Headers
    const headers = [
      [
        "#",
        "Application ID & Inv",
        "Farmer & Location",
        "Dealer",
        "Inv Amt (Rs.)",
        "Subsidy (Rs.)",
        "Material Cost (Rs.)",
        "Now Released (Rs.)",
        "Delay",
        "Commission (Rs.)",
        ...(hasFittings ? ["Fittings 5% (Rs.)"] : []),
        "Penalty (Rs.)",
        "Net Payable (Rs.)",
      ],
    ];

    let totalInv = 0;
    let totalSub = 0;
    let totalMat = 0;
    let totalRel = 0;
    let totalComm = 0;
    let totalFit = 0;
    let totalPen = 0;
    let totalNet = 0;

    const isFirstFund = batch.fund_percentage_value >= 50.0;
    const startLabel = isFirstFund ? "Inv Date" : "1st Fund";
    const endLabel = isFirstFund ? "Work Comp" : "Joint Verif";

    const rows = filteredProjects.map((p, index) => {
      const invAmt = Math.floor(parseFloat(p.invoice_amount || 0));
      const subAmt = Math.floor(parseFloat(p.subsidy_amount || p.state_restricted_amount || 0));
      const matCost = Math.floor(parseFloat(p.total_material_cost || 0));
      const nowRel = Math.floor(parseFloat(p.now_to_be_released_amount || p.fund_share_amount || 0));
      const commAmt = Math.floor(parseFloat(p.commission_amount || 0));
      const fitAmt = Math.floor(parseFloat(p.fittings_amount || 0));
      const penalty = Math.floor(
        parseFloat(
          p.adjusted_penalty_amount !== undefined && p.adjusted_penalty_amount !== null
            ? p.adjusted_penalty_amount
            : p.penalty_amount || 0
        )
      );
      const netPayable = Math.max(0, commAmt + fitAmt - penalty);

      totalInv += invAmt;
      totalSub += subAmt;
      totalMat += matCost;
      totalRel += nowRel;
      totalComm += commAmt;
      totalFit += fitAmt;
      totalPen += penalty;
      totalNet += netPayable;

      const datesText = `${startLabel}: ${formatDate(p.milestone_start_date)}\n${endLabel}: ${formatDate(p.milestone_end_date)}${
        p.delay_days > 45 ? `\nDelay: ${p.delay_days}d (${p.penalty_percentage || 0}%)` : ""
      }`;

      const invNoText = p.invoice_number && p.invoice_number !== "—" ? `\nInv: #${p.invoice_number}` : "";
      const locText = [p.village, p.district].filter(Boolean).join(", ") || "";

      return [
        String(index + 1),
        `${p.application_id}${invNoText}`,
        `${p.farmer_name || "—"}\n${locText}`,
        p.dealer?.name || (p.project_id ? "Unassigned Dealer" : "Unassigned"),
        invAmt ? invAmt.toLocaleString("en-IN") : "—",
        subAmt ? subAmt.toLocaleString("en-IN") : "—",
        matCost ? `${matCost.toLocaleString("en-IN")}\n(GST ${p.gst_percentage || 12}%)` : "—",
        nowRel ? `${nowRel.toLocaleString("en-IN")}\n(GST ${p.gst_percentage || 12}%)` : "—",
        datesText,
        commAmt ? commAmt.toLocaleString("en-IN") : "0",
        ...(hasFittings ? [fitAmt ? fitAmt.toLocaleString("en-IN") : "0"] : []),
        penalty > 0 ? `-${penalty.toLocaleString("en-IN")}` : "0",
        netPayable.toLocaleString("en-IN"),
      ];
    });

    // Summary Footer Row
    const footers = [
      [
        "Total",
        `${filteredProjects.length} Projects`,
        "—",
        "—",
        totalInv.toLocaleString("en-IN"),
        totalSub.toLocaleString("en-IN"),
        totalMat.toLocaleString("en-IN"),
        totalRel.toLocaleString("en-IN"),
        "—",
        totalComm.toLocaleString("en-IN"),
        ...(hasFittings ? [totalFit.toLocaleString("en-IN")] : []),
        totalPen > 0 ? `-${totalPen.toLocaleString("en-IN")}` : "0",
        totalNet.toLocaleString("en-IN"),
      ],
    ];

    const columnStylesConfig = hasFittings
      ? {
          0: { cellWidth: 20, halign: "center" },
          1: { cellWidth: 85 },
          2: { cellWidth: 85 },
          3: { cellWidth: 68 },
          4: { cellWidth: 52, halign: "right" },
          5: { cellWidth: 52, halign: "right" },
          6: { cellWidth: 52, halign: "right" },
          7: { cellWidth: 52, halign: "right", fontStyle: "bold", textColor: [47, 111, 94] },
          8: { cellWidth: 90 },
          9: { cellWidth: 52, halign: "right", fontStyle: "bold", textColor: [47, 111, 94] },
          10: { cellWidth: 52, halign: "right", textColor: [124, 58, 237] },
          11: { cellWidth: 50, halign: "right", textColor: [225, 29, 72] },
          12: { cellWidth: 62, halign: "right", fontStyle: "bold", textColor: [6, 95, 70] },
        }
      : {
          0: { cellWidth: 22, halign: "center" },
          1: { cellWidth: 92 },
          2: { cellWidth: 90 },
          3: { cellWidth: 72 },
          4: { cellWidth: 55, halign: "right" },
          5: { cellWidth: 55, halign: "right" },
          6: { cellWidth: 55, halign: "right" },
          7: { cellWidth: 55, halign: "right", fontStyle: "bold", textColor: [47, 111, 94] },
          8: { cellWidth: 95 },
          9: { cellWidth: 60, halign: "right", fontStyle: "bold", textColor: [47, 111, 94] },
          10: { cellWidth: 55, halign: "right", textColor: [225, 29, 72] },
          11: { cellWidth: 65, halign: "right", fontStyle: "bold", textColor: [6, 95, 70] },
        };

    autoTable(doc, {
      head: headers,
      body: rows,
      foot: footers,
      startY: 80,
      margin: { left: 28, right: 28 },
      theme: "grid",
      styles: {
        fontSize: 7.2,
        cellPadding: { top: 3.5, bottom: 3.5, left: 2.5, right: 2.5 },
        textColor: [20, 33, 61],
        lineColor: [230, 227, 218],
        lineWidth: 0.5,
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: [245, 245, 243],
        textColor: [50, 60, 80],
        fontStyle: "bold",
        fontSize: 7.2,
      },
      footStyles: {
        fillColor: [240, 244, 243],
        textColor: [20, 33, 61],
        fontStyle: "bold",
        fontSize: 7.2,
      },
      columnStyles: columnStylesConfig,
      didDrawPage: (data) => {
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(140, 151, 171);
        doc.text(
          `Cheran Irrigation · Exported on ${new Date().toLocaleDateString("en-IN")} · Page ${data.pageNumber} of ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 12,
          { align: "center" }
        );
      },
    });

    const safeProcNo = (batch.proceeding_no || "Batch").replace(/[/\\?%*:|"<>]/g, "_");
    doc.save(`Proceeding_Line_Items_${safeProcNo}.pdf`);
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
        subtitle={`Proceeding Batch #${batch.proceeding_no} (${batch.fund_percentage_value}% Fund Release)`}
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
              title="Recalculate all formulas with latest tax slabs and milestone status updates"
            >
              Recalculate
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
                #{batch.proceeding_no}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-[#14213D] flex items-center gap-2">
                <FileSpreadsheet size={20} className="text-[#2F6F5E]" />
                <span>Batch #{batch.proceeding_no}</span>
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-full font-bold font-mono text-xs ${
                  batch.fund_percentage_value === 40
                    ? "bg-indigo-50 text-indigo-800 border border-indigo-200"
                    : batch.fund_percentage_value === 45
                    ? "bg-blue-50 text-blue-800 border border-blue-200"
                    : "bg-emerald-50 text-[#2F6F5E] border border-emerald-200"
                }`}
              >
                {batch.fund_percentage_value}% Fund Release
              </span>
              {hasFittings && (
                <span className="px-2 py-0.5 rounded-full font-bold font-mono text-[11px] bg-purple-50 text-purple-800 border border-purple-200">
                  + 5% Fittings Included
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Unmatched / Unlinked In DB Alert Banner */}
        {unmatchedCount > 0 && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-[10px] flex items-start gap-3">
            <AlertTriangle size={18} className="text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <div className="font-bold text-amber-900">
                {unmatchedCount} Application ID(s) in this batch are not linked to DB Projects
              </div>
              <p className="text-amber-800">
                Financial calculations from the government Excel have been recorded accurately. You can map or view these records below tagged with the "Unlinked" badge.
              </p>
            </div>
          </div>
        )}

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
            <span className="text-[10px] text-[#52607D] uppercase font-semibold block">Release Tranche</span>
            <div className="font-bold text-[#2F6F5E] text-sm mt-0.5 font-mono">
              {batch.fund_percentage_value}% Fund Release
            </div>
          </div>

          <div>
            <span className="text-[10px] text-[#52607D] uppercase font-semibold block">Payment Received</span>
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
                  Record Received
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
              <span className="font-semibold uppercase tracking-wider">Now Released</span>
              <FileSpreadsheet size={16} className="text-[#2F6F5E]" />
            </div>
            <div className="text-xl font-bold font-mono text-[#14213D] mt-2">
              {formatRupees(batch.total_proceeding_amount)}
            </div>
            <div className="text-[11px] text-[#52607D] mt-0.5">
              {batch.projects?.length || 0} proceeding records
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
              Calculated on {batch.fund_percentage_value}% released tranche
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
              {hasFittings ? "5% on Total Subsidy Amount (1st Fund)" : "No fittings for this fund release"}
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
              Commission {hasFittings ? "+ Fittings" : ""} - Delay Penalties
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
                  <th className="py-2.5 px-3 text-right">Subsidy / Eligible</th>
                  <th className="py-2.5 px-3 text-right">Total Material Cost</th>
                  <th className="py-2.5 px-3 text-right font-bold text-[#2F6F5E]">Now Released</th>
                  <th className="py-2.5 px-3 text-right">Commission</th>
                  {hasFittings && <th className="py-2.5 px-3 text-right text-[#7C3AED]">Fittings (5%)</th>}
                  <th className="py-2.5 px-3 text-right">Penalty</th>
                  <th className="py-2.5 px-3 text-right font-bold text-emerald-800">Total Payout</th>
                  <th className="py-2.5 px-3 text-center">Payout Status</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDEAE1]">
                {dealerSummaries.length === 0 ? (
                  <tr>
                    <td colSpan={hasFittings ? 11 : 10} className="py-6 text-center text-xs text-[#8C97AB]">
                      No dealers found in this batch.
                    </td>
                  </tr>
                ) : (
                  dealerSummaries.map((d) => (
                    <tr key={d.dealer_id || "unassigned"} className="hover:bg-[#FAFAF8]">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-[#14213D] text-xs">{d.dealer_name}</div>
                        {d.dealer_district && d.dealer_district !== "—" && (
                          <div className="text-[10px] text-[#52607D]">{d.dealer_district}</div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-[#14213D]">
                        {d.projects_count}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-[#52607D]">
                        {formatRupees(d.total_subsidy_amount || d.total_state_restricted)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-[#14213D] font-medium">
                        {formatRupees(d.total_material_cost)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-[#2F6F5E]">
                        {formatRupees(d.total_now_to_be_released)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-[#2F6F5E]">
                        {formatRupees(d.total_commission_amount)}
                      </td>
                      {hasFittings && (
                        <td className="py-3 px-3 text-right font-mono text-[#7C3AED] font-semibold">
                          {formatRupees(d.total_fittings_amount)}
                        </td>
                      )}
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
              Proceeding Project Line Items ({filteredProjects.length})
            </h3>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <div className="relative w-full sm:w-72">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#52607D]" />
                <input
                  type="text"
                  placeholder="Search Application ID, Farmer, Dealer, Inv..."
                  value={projectSearch}
                  onChange={(e) => setProjectSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
                />
              </div>

              <Button
                variant="secondary"
                size="sm"
                icon={Download}
                onClick={handleExportPDF}
                title="Download Project Line Items as PDF"
                className="shrink-0 text-xs font-semibold"
              >
                Download PDF
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[1250px]">
              <thead className="bg-[#FAFAF8] border-b border-[#E4E1D8] text-[#52607D] uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Application ID & Invoice</th>
                  <th className="py-2.5 px-3">Farmer & Location</th>
                  <th className="py-2.5 px-3">Dealer</th>
                  <th className="py-2.5 px-3 text-right">Invoice Amount</th>
                  <th className="py-2.5 px-3 text-right">Subsidy Eligible</th>
                  <th className="py-2.5 px-3 text-right">Total Material Cost</th>
                  <th className="py-2.5 px-3 text-right font-bold text-[#2F6F5E]">Now Released</th>
                  <th className="py-2.5 px-3">Delay</th>
                  <th className="py-2.5 px-3 text-right font-bold text-[#2F6F5E]">Commission</th>
                  {hasFittings && <th className="py-2.5 px-3 text-right text-[#7C3AED]">Fittings (5%)</th>}
                  <th className="py-2.5 px-3 text-right text-rose-600">Penalty</th>
                  <th className="py-2.5 px-3 text-right font-bold text-emerald-800">Net Payable</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDEAE1]">
                {paginatedProjects.length === 0 ? (
                  <tr>
                    <td colSpan={hasFittings ? 13 : 12} className="py-8 text-center text-xs text-[#8C97AB]">
                      No matching projects found in this batch.
                    </td>
                  </tr>
                ) : (
                  paginatedProjects.map((p, idx) => {
                    const penalty = Math.floor(
                      parseFloat(
                        p.adjusted_penalty_amount !== undefined && p.adjusted_penalty_amount !== null
                          ? p.adjusted_penalty_amount
                          : p.penalty_amount || 0
                      )
                    );
                    const comm = Math.floor(parseFloat(p.commission_amount || 0));
                    const fit = Math.floor(parseFloat(p.fittings_amount || 0));
                    const netPayable = Math.max(0, comm + fit - penalty);

                    const isFirstFund = batch.fund_percentage_value >= 50.0;
                    const startLabel = isFirstFund ? "Invoice Date" : "1st Fund Credited";
                    const endLabel = isFirstFund ? "Work Completion" : "Joint Verification";

                    return (
                      <tr key={p.id || idx} className="hover:bg-[#FAFAF8]">
                        <td className="py-2.5 px-3">
                          <div className="font-mono font-bold text-[#14213D] text-xs">
                            {p.application_id}
                          </div>
                          <div className="mt-1 flex items-center gap-1.5">
                            <span className="text-[10px] text-[#52607D] font-medium">Inv No:</span>
                            {p.invoice_number && p.invoice_number !== "—" ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono font-bold text-[10px]">
                                #{p.invoice_number}
                              </span>
                            ) : (
                              <span className="text-[10px] text-[#8C97AB] italic">—</span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-[#14213D]">{p.farmer_name || "—"}</div>
                          <div className="text-[10px] text-[#52607D]">
                            {[p.village, p.block, p.district].filter(Boolean).join(", ") || "—"}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-[#14213D] font-medium">
                          {p.dealer?.name || (p.project_id ? "Unassigned Dealer" : "Unassigned")}
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono text-[#52607D]">
                          {formatRupees(p.invoice_amount)}
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono text-[#52607D]">
                          {formatRupees(p.subsidy_amount || p.state_restricted_amount)}
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono text-[#14213D] font-medium">
                          <div>{formatRupees(p.total_material_cost)}</div>
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono font-bold text-[#2F6F5E]">
                          <div>{formatRupees(p.now_to_be_released_amount || p.fund_share_amount)}</div>
                          <div className="text-[10px] text-[#2F6F5E]/70 font-sans font-medium">
                            GST: {p.gst_percentage || 12}%
                          </div>
                        </td>

                        {/* Delay */}
                        <td className="py-2.5 px-3 text-[11px] space-y-0.5 min-w-[170px]">
                          {p.milestone_start_date && (
                            <div className="text-[10px] text-[#52607D]">
                              <span className="font-semibold">{startLabel}:</span> {formatDate(p.milestone_start_date)}
                            </div>
                          )}
                          {p.milestone_end_date && (
                            <div className="text-[10px] text-[#52607D]">
                              <span className="font-semibold">{endLabel}:</span> {formatDate(p.milestone_end_date)}
                            </div>
                          )}
                          {p.delay_days > 45 ? (
                            <div className="text-[10px] font-bold text-amber-700 font-mono">
                              ⚠️ {p.delay_days} days ({p.penalty_percentage || 0}% penalty)
                            </div>
                          ) : (
                            <div className="text-[10px] text-emerald-700 font-medium">✓ Within 45d SLA</div>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono font-bold text-[#2F6F5E]">
                          {formatRupees(p.commission_amount)}
                        </td>

                        {hasFittings && (
                          <td className="py-2.5 px-3 text-right font-mono text-[#7C3AED] font-semibold">
                            {formatRupees(p.fittings_amount)}
                          </td>
                        )}

                        <td className="py-2.5 px-3 text-right font-mono whitespace-nowrap min-w-[110px]">
                          <div className="inline-flex items-center justify-end gap-1.5 whitespace-nowrap">
                            {penalty > 0 ? (
                              <span className="text-rose-600 font-bold font-mono whitespace-nowrap">
                                -{formatRupees(penalty)}
                              </span>
                            ) : (
                              <span className="text-[#8C97AB] whitespace-nowrap">₹0</span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleOpenPenaltyModal(p)}
                              className="p-1 text-[#52607D] hover:text-[#2F6F5E] hover:bg-gray-100 rounded transition-colors cursor-pointer shrink-0 inline-flex items-center justify-center"
                              title="Edit delay penalty amount"
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

          {filteredProjects.length > pageSize && (
            <div className="p-4 border-t border-[#E4E1D8]">
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(filteredProjects.length / pageSize)}
                onPageChange={setCurrentPage}
                totalItems={filteredProjects.length}
              />
            </div>
          )}
        </div>
      </main>

      {/* Modal 1: Record Payment Receipt Date */}
      <Modal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        title="Record Payment Received Date"
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
              Confirm Payment Received
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Record Dealer Payout */}
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
              <span className="text-[#52607D]">Total Commission:</span>
              <strong className="font-mono text-[#2F6F5E]">
                {formatRupees(activeDealerForPay?.total_commission_amount)}
              </strong>
            </div>
            {hasFittings && (
              <div className="flex justify-between">
                <span className="text-[#52607D]">Fittings Cost (5%):</span>
                <strong className="font-mono text-[#7C3AED]">
                  {formatRupees(activeDealerForPay?.total_fittings_amount)}
                </strong>
              </div>
            )}
            <div className="flex justify-between border-t border-[#EDEAE1] pt-1.5">
              <span className="font-bold text-[#14213D]">Net Disbursable Payout:</span>
              <strong className="font-mono text-emerald-800 text-sm font-extrabold">
                {formatRupees(
                  Math.max(
                    0,
                    (activeDealerForPay?.total_commission_amount || 0) +
                      (activeDealerForPay?.total_fittings_amount || 0) -
                      parseFloat(dealerPayPenalty || 0)
                  )
                )}
              </strong>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#14213D] mb-1">
              Adjusted Penalty Amount (Deducted from Commission, ₹ Whole Number)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-xs text-[#52607D]">₹</span>
              <input
                type="number"
                step="1"
                min="0"
                value={dealerPayPenalty}
                onChange={(e) => setDealerPayPenalty(e.target.value)}
                className="w-full pl-7 pr-3 py-2 text-xs font-mono font-bold bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#14213D] mb-1">
              Disbursement / Payout Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={dealerPayDate}
              onChange={(e) => setDealerPayDate(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#14213D] mb-1">
              Bank Payment Ref / UTR / Cheque No.
            </label>
            <input
              type="text"
              placeholder="e.g. UTR-2026-9812903"
              value={dealerPayRef}
              onChange={(e) => setDealerPayRef(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-[#EDEAE1]">
            <Button variant="secondary" type="button" onClick={() => setDealerPayModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={markingDealerPaid} icon={CheckCircle2}>
              Confirm Dealer Payout
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 3: Manual Project Penalty Override */}
      <Modal
        isOpen={penaltyModalOpen}
        onClose={() => setPenaltyModalOpen(false)}
        title="Adjust Project Delay Penalty"
      >
        <form onSubmit={handleSaveManualPenalty} className="space-y-4">
          {penaltyError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-[8px] text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle size={15} className="text-rose-600 shrink-0" />
              <span>{penaltyError}</span>
            </div>
          )}

          <div className="p-3 bg-[#FAFAF8] rounded-[8px] border border-[#EDEAE1] space-y-1.5 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-[#52607D]">Application ID:</span>
              <strong className="text-[#14213D]">{activeProjectForPenalty?.application_id}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#52607D]">Farmer:</span>
              <strong className="text-[#14213D]">{activeProjectForPenalty?.farmer_name}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#52607D]">Commission Amount:</span>
              <strong className="text-[#2F6F5E]">{formatRupees(activeProjectForPenalty?.commission_amount)}</strong>
            </div>
            {hasFittings && (
              <div className="flex justify-between">
                <span className="text-[#52607D]">Fittings Amount:</span>
                <strong className="text-[#7C3AED]">{formatRupees(activeProjectForPenalty?.fittings_amount)}</strong>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#14213D] mb-1">
              Penalty Amount to Deduct (₹ Whole Number)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-xs text-[#52607D]">₹</span>
              <input
                type="number"
                step="1"
                min="0"
                value={manualPenaltyAmount}
                onChange={(e) => setManualPenaltyAmount(e.target.value)}
                className="w-full pl-7 pr-3 py-2 text-xs font-mono font-bold bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-[#EDEAE1]">
            <Button variant="secondary" type="button" onClick={() => setPenaltyModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={savingPenalty} icon={CheckCircle2}>
              Save Penalty
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default CommissionBatchDetailPage;
