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
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import Navbar from "../components/layout/Navbar.jsx";
import Button from "../components/common/Button.jsx";
import Modal from "../components/common/Modal.jsx";
import { SkeletonLoader } from "../components/common/SkeletonLoader.jsx";
import Pagination from "../components/common/Pagination.jsx";
import { formatDate } from "../utils/dates.js";

export function CommissionBatchDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = (user?.role || "USER").toUpperCase();
  const isAdmin = role === "ADMIN";

  const [loading, setLoading] = useState(true);
  const [batch, setBatch] = useState(null);
  const [dealerSummaries, setDealerSummaries] = useState([]);
  const [unmatchedCount, setUnmatchedCount] = useState(0);
  const [error, setError] = useState("");

  const [editDateModalOpen, setEditDateModalOpen] = useState(false);
  const [editProceedingDate, setEditProceedingDate] = useState("");
  const [savingDate, setSavingDate] = useState(false);
  const [editDateError, setEditDateError] = useState("");

  // Accordion state for expandable dealer rows
  const [expandedDealers, setExpandedDealers] = useState({});

  const toggleDealerExpand = (dealerKey) => {
    setExpandedDealers((prev) => ({
      ...prev,
      [dealerKey]: !prev[dealerKey],
    }));
  };

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

  // Open Edit Proceeding Date Modal
  const handleOpenEditDate = () => {
    if (!batch) return;
    setEditProceedingDate(
      batch.proceeding_date ? batch.proceeding_date.split("T")[0] : ""
    );
    setEditDateError("");
    setEditDateModalOpen(true);
  };

  // Save Proceeding Date
  const handleSaveProceedingDate = async (e) => {
    e.preventDefault();
    if (!editProceedingDate) return;
    setEditDateError("");
    try {
      setSavingDate(true);
      const res = await api.patch(`/proceedings/${id}/proceeding-date`, {
        proceeding_date: editProceedingDate,
      });
      setBatch(res?.batch || { ...batch, proceeding_date: editProceedingDate });
      setEditDateModalOpen(false);
    } catch (err) {
      setEditDateError(
        err?.message ||
          err?.response?.data?.message ||
          "Failed to update proceeding date"
      );
    } finally {
      setSavingDate(false);
    }
  };

  // Export Proceeding Line Items Table to PDF (Full Batch or Dealer-Specific)
  const handleExportPDF = (targetProjects = null, targetDealerName = null) => {
    try {
      const projectsToExport = Array.isArray(targetProjects)
        ? targetProjects
        : filteredProjects;
      const dealerName = typeof targetDealerName === "string" ? targetDealerName : null;
      if (!batch || !projectsToExport || projectsToExport.length === 0) return;

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
      doc.text(
        dealerName
          ? `Government Proceeding Batch - Dealer Statement: ${dealerName}`
          : "Government Proceeding Batch - Project Line Items Report",
        30,
        50
      );

      // Meta Header Information
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(20, 33, 61);
      doc.text(`Batch No: #${batch.proceeding_no || "—"}`, 30, 68);
      doc.text(`Proceeding Date: ${formatDate(batch.proceeding_date)}`, 200, 68);
      doc.text(`Fund Type: ${batch.fund_percentage_value}% Fund Release`, 380, 68);
      doc.text(`5% Fittings Cost: ${hasFittings ? "Included" : "Excluded"}`, 560, 68);

      if (dealerName) {
        doc.text(`Dealer: ${dealerName}`, 30, 82);
        doc.text(`Dealer Projects Count: ${projectsToExport.length}`, 380, 82);
      }

    // Table Headers (Subsidy Eligible, Now Released, and Net Payable excluded from PDF export)
    const headers = [
      [
        "#",
        "Application ID",
        "Invoice No & Date",
        "Farmer Name",
        "Inv Amt (Rs.)",
        "Material Cost (Rs.)",
        "Commission (Rs.)",
        "Penalty (Rs.)",
        "Net Comm. (Rs.)",
        ...(hasFittings ? ["Fittings 5% (Rs.)"] : []),
        "Dealer",
      ],
    ];

    let totalInv = 0;
    let totalMat = 0;
    let totalComm = 0;
    let totalPen = 0;
    let totalNetComm = 0;
    let totalFit = 0;

    const rows = projectsToExport.map((p, index) => {
      const invAmt = Math.floor(parseFloat(p.invoice_amount || 0));
      const matCost = Math.floor(parseFloat(p.total_material_cost || 0));
      const commAmt = Math.floor(parseFloat(p.commission_amount || 0));
      const fitAmt = Math.floor(parseFloat(p.fittings_amount || 0));
      const penalty = Math.floor(
        parseFloat(
          p.adjusted_penalty_amount !== undefined && p.adjusted_penalty_amount !== null
            ? p.adjusted_penalty_amount
            : p.penalty_amount || 0
        )
      );
      const netComm = Math.max(0, commAmt - penalty);

      totalInv += invAmt;
      totalMat += matCost;
      totalComm += commAmt;
      totalPen += penalty;
      totalNetComm += netComm;
      totalFit += fitAmt;

      const invNoDateText = `${p.invoice_number && p.invoice_number !== "—" ? `#${p.invoice_number}` : "—"}\n${formatDate(p.invoice_date)}`;

      return [
        String(index + 1),
        p.application_id || "—",
        invNoDateText,
        p.farmer_name || "—",
        invAmt
          ? `${invAmt.toLocaleString("en-IN")}${parseFloat(p.farmer_contribution || 0) > 0 ? `\n(FC: ${Math.floor(parseFloat(p.farmer_contribution)).toLocaleString("en-IN")})` : ""}`
          : "—",
        matCost ? `${matCost.toLocaleString("en-IN")}\n(GST ${p.gst_percentage || 12}%)` : "—",
        commAmt ? commAmt.toLocaleString("en-IN") : "0",
        penalty > 0 ? `-${penalty.toLocaleString("en-IN")}` : "0",
        netComm.toLocaleString("en-IN"),
        ...(hasFittings ? [fitAmt ? fitAmt.toLocaleString("en-IN") : "0"] : []),
        p.dealer?.name || (p.project_id ? "Unassigned Dealer" : "Unassigned"),
      ];
    });

    // Summary Footer Row
    const footers = [
      [
        "Total",
        `${projectsToExport.length} Projects`,
        "—",
        "—",
        totalInv.toLocaleString("en-IN"),
        totalMat.toLocaleString("en-IN"),
        totalComm.toLocaleString("en-IN"),
        totalPen > 0 ? `-${totalPen.toLocaleString("en-IN")}` : "0",
        totalNetComm.toLocaleString("en-IN"),
        ...(hasFittings ? [totalFit.toLocaleString("en-IN")] : []),
        "—",
      ],
    ];

    const columnStylesConfig = hasFittings
      ? {
          0: { cellWidth: 20, halign: "center" },
          1: { cellWidth: 105 },
          2: { cellWidth: 75 },
          3: { cellWidth: 95 },
          4: { cellWidth: 65, halign: "right" },
          5: { cellWidth: 70, halign: "right", fontStyle: "bold", textColor: [47, 111, 94] },
          6: { cellWidth: 65, halign: "right", fontStyle: "bold", textColor: [47, 111, 94] },
          7: { cellWidth: 55, halign: "right", textColor: [225, 29, 72] },
          8: { cellWidth: 65, halign: "right", fontStyle: "bold", textColor: [20, 33, 61] },
          9: { cellWidth: 60, halign: "right", textColor: [124, 58, 237] },
          10: { cellWidth: 110 },
        }
      : {
          0: { cellWidth: 20, halign: "center" },
          1: { cellWidth: 115 },
          2: { cellWidth: 80 },
          3: { cellWidth: 105 },
          4: { cellWidth: 70, halign: "right" },
          5: { cellWidth: 75, halign: "right", fontStyle: "bold", textColor: [47, 111, 94] },
          6: { cellWidth: 70, halign: "right", fontStyle: "bold", textColor: [47, 111, 94] },
          7: { cellWidth: 55, halign: "right", textColor: [225, 29, 72] },
          8: { cellWidth: 75, halign: "right", fontStyle: "bold", textColor: [20, 33, 61] },
          9: { cellWidth: 120 },
        };

      autoTable(doc, {
        head: headers,
        body: rows,
        foot: footers,
        startY: dealerName ? 96 : 80,
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
            `Cheran Irrigation · Exported on ${formatDate(new Date())} · Page ${data.pageNumber} of ${pageCount}`,
            pageWidth / 2,
            doc.internal.pageSize.getHeight() - 12,
            { align: "center" }
          );
        },
      });

      const safeProcNo = (batch.proceeding_no || "Batch").replace(/[/\\?%*:|"<>]/g, "_");
      const safeDealer = dealerName
        ? `_${dealerName.replace(/[/\\?%*:|"<>]/g, "_").replace(/\s+/g, "_")}`
        : "";
      doc.save(`Proceeding_Line_Items_${safeProcNo}${safeDealer}.pdf`);
    } catch (err) {
      console.error("Error generating Proceeding Line Items PDF:", err);
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
              {(isAdmin || role === "USER") && (
                <button
                  type="button"
                  onClick={handleOpenEditDate}
                  className="p-1 text-[#52607D] hover:text-[#2F6F5E] hover:bg-gray-100 rounded transition-colors cursor-pointer ml-1 inline-flex items-center justify-center"
                  title="Edit proceeding date"
                >
                  <Pencil size={12} />
                </button>
              )}
            </div>
          </div>

          <div>
            <span className="text-[10px] text-[#52607D] uppercase font-semibold block">Fund Type</span>
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
                  <th className="py-2.5 px-3 text-right font-bold text-[#2F6F5E]">Total Material Cost</th>
                  <th className="py-2.5 px-3 text-right font-bold text-[#2F6F5E]">Now Released</th>
                  <th className="py-2.5 px-3 text-right font-bold text-[#2F6F5E]">Commission</th>
                  <th className="py-2.5 px-3 text-right">Penalty</th>
                  <th className="py-2.5 px-3 text-right font-bold text-[#14213D]">Net Comm.</th>
                  {hasFittings && <th className="py-2.5 px-3 text-right text-[#7C3AED]">Fittings (5%)</th>}
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
                  dealerSummaries.map((d) => {
                    const dKey = d.dealer_id || "unassigned";
                    const isExpanded = Boolean(expandedDealers[dKey]);
                    const comm = d.total_commission_amount || 0;
                    const pen = d.total_penalty_amount || 0;
                    const netComm = Math.max(0, comm - pen);
                    const dealerProjects = (batch?.projects || []).filter((p) =>
                      d.dealer_id ? p.dealer_id === d.dealer_id : !p.dealer_id
                    );

                    return (
                      <React.Fragment key={dKey}>
                        <tr
                          onClick={() => toggleDealerExpand(dKey)}
                          className={`cursor-pointer transition-colors ${
                            isExpanded ? "bg-[#F0F7F4] border-l-4 border-l-[#2F6F5E]" : "hover:bg-[#FAFAF8]"
                          }`}
                          title={`Click to ${isExpanded ? "hide" : "view"} ${dealerProjects.length} projects`}
                        >
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <span className="p-1 rounded hover:bg-black/5 text-[#2F6F5E] transition-colors">
                                {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                              </span>
                              <div>
                                <div className="font-semibold text-[#14213D] text-xs flex items-center gap-1.5">
                                  {d.dealer_name}
                                </div>
                                {d.dealer_district && d.dealer_district !== "—" && (
                                  <div className="text-[10px] text-[#52607D]">{d.dealer_district}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono font-bold text-xs">
                              {d.projects_count}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-[#52607D]">
                            {formatRupees(d.total_subsidy_amount || d.total_state_restricted)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-[#2F6F5E]">
                            {formatRupees(d.total_material_cost)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-[#2F6F5E]">
                            {formatRupees(d.total_now_to_be_released)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-[#2F6F5E]">
                            {formatRupees(d.total_commission_amount)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono">
                            {pen > 0 ? (
                              <span className="text-rose-600 font-bold font-mono">
                                -{formatRupees(pen)}
                              </span>
                            ) : (
                              <span className="text-[#8C97AB]">₹0</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-[#14213D]">
                            {formatRupees(netComm)}
                          </td>
                          {hasFittings && (
                            <td className="py-3 px-3 text-right font-mono text-[#7C3AED] font-semibold">
                              {formatRupees(d.total_fittings_amount)}
                            </td>
                          )}
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
                          <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleExportPDF(dealerProjects, d.dealer_name);
                                }}
                                className="p-1.5 text-[#52607D] hover:text-emerald-800 hover:bg-emerald-50 rounded border border-[#EDEAE1] transition-colors"
                                title={`Download PDF for ${d.dealer_name}`}
                              >
                                <Download size={13} />
                              </button>
                              {d.is_paid ? (
                                <div className="text-[10px] text-[#52607D]">
                                  {d.paid_date ? formatDate(d.paid_date) : "Settled"}
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => {
                                    setActiveDealerForPay(d);
                                    setDealerPayDate(new Date().toISOString().split("T")[0]);
                                    setDealerPayRef("Direct Bank Transfer / NEFT");
                                    setDealerPayPenalty(d.total_penalty_amount || 0);
                                    setDealerPayError("");
                                    setDealerPayModalOpen(true);
                                  }}
                                  className="text-[11px] py-1 px-2.5 text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                                >
                                  Record Payout
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Expanded Projects Sub-Table */}
                        {isExpanded && (
                          <tr className="bg-[#F8FAF9] border-y border-[#E4E1D8]">
                            <td colSpan={hasFittings ? 11 : 10} className="p-4 pl-6 pr-6">
                              <div className="space-y-3 bg-white border border-[#EDEAE1] rounded-[10px] p-4 shadow-sm">
                                {/* Header banner */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EDEAE1] pb-3">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-sm text-[#14213D] flex items-center gap-1.5">
                                      <Building2 size={16} className="text-[#2F6F5E]" />
                                      {d.dealer_name}
                                    </span>
                                    <span className="text-xs text-[#52607D] font-medium">
                                      ({dealerProjects.length} Projects)
                                    </span>
                                    <span className="text-[11px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-semibold">
                                      Net Payout: {formatRupees(d.total_net_payable)}
                                    </span>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    icon={Download}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleExportPDF(dealerProjects, d.dealer_name);
                                    }}
                                    className="text-xs font-semibold bg-white hover:bg-emerald-50 text-emerald-800 border-emerald-300 shadow-xs shrink-0"
                                  >
                                    Download {d.dealer_name} PDF
                                  </Button>
                                </div>

                                {/* Table of projects */}
                                <div className="overflow-x-auto">
                                  <table className="w-full text-left text-xs min-w-[1200px]">
                                    <thead className="bg-[#FAFAF8] border-b border-[#E4E1D8] text-[#52607D] uppercase font-semibold">
                                      <tr>
                                        <th className="py-2 px-2.5 text-center">#</th>
                                        <th className="py-2 px-2.5">Application ID & Invoice</th>
                                        <th className="py-2 px-2.5">Farmer & Location</th>
                                        <th className="py-2 px-2.5 text-right">Invoice Amount</th>
                                        <th className="py-2 px-2.5 text-right">Subsidy Eligible</th>
                                        <th className="py-2 px-2.5 text-right font-bold text-[#2F6F5E]">Total Material Cost</th>
                                        <th className="py-2 px-2.5 text-right font-bold text-[#2F6F5E]">Now Released</th>
                                        <th className="py-2 px-2.5">Delay</th>
                                        <th className="py-2 px-2.5 text-right font-bold text-[#2F6F5E]">Commission</th>
                                        <th className="py-2 px-2.5 text-right text-rose-600">Penalty</th>
                                        <th className="py-2 px-2.5 text-right font-bold text-[#14213D]">Net Commission</th>
                                        {hasFittings && <th className="py-2 px-2.5 text-right text-[#7C3AED]">Fittings (5%)</th>}
                                        <th className="py-2 px-2.5 text-center">Status</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#EDEAE1]">
                                      {dealerProjects.length === 0 ? (
                                        <tr>
                                          <td colSpan={hasFittings ? 13 : 12} className="py-6 text-center text-xs text-[#8C97AB]">
                                            No projects found for this dealer in this batch.
                                          </td>
                                        </tr>
                                      ) : (
                                        dealerProjects.map((p, pIdx) => {
                                          const penalty = Math.floor(
                                            parseFloat(
                                              p.adjusted_penalty_amount !== undefined && p.adjusted_penalty_amount !== null
                                                ? p.adjusted_penalty_amount
                                                : p.penalty_amount || 0
                                            )
                                          );
                                          const commAmt = Math.floor(parseFloat(p.commission_amount || 0));
                                          const fitAmt = Math.floor(parseFloat(p.fittings_amount || 0));
                                          const itemNetComm = Math.max(0, commAmt - penalty);

                                          const isFirstFund = batch.fund_percentage_value >= 50.0;
                                          const startLabel = isFirstFund ? "Invoice Date" : "1st Fund Credited";
                                          const endLabel = isFirstFund ? "Work Completion" : "Joint Verification";

                                          return (
                                            <tr key={p.id || pIdx} className="hover:bg-[#FAFAF8]">
                                              <td className="py-2.5 px-2.5 text-center font-mono text-[#8C97AB]">
                                                {pIdx + 1}
                                              </td>
                                              <td className="py-2.5 px-2.5">
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
                                              <td className="py-2.5 px-2.5">
                                                <div className="font-semibold text-[#14213D]">{p.farmer_name || "—"}</div>
                                                <div className="text-[10px] text-[#52607D]">
                                                  {[p.village, p.block, p.district].filter(Boolean).join(", ") || "—"}
                                                </div>
                                              </td>
                                              <td className="py-2.5 px-2.5 text-right font-mono text-[#52607D]">
                                                <div>{formatRupees(p.invoice_amount)}</div>
                                                {parseFloat(p.farmer_contribution || 0) > 0 && (
                                                  <div className="text-[10px] text-amber-700 font-medium font-sans">
                                                    (incl. FC: {formatRupees(p.farmer_contribution)})
                                                  </div>
                                                )}
                                              </td>
                                              <td className="py-2.5 px-2.5 text-right font-mono text-[#52607D]">
                                                {formatRupees(p.subsidy_amount || p.state_restricted_amount)}
                                              </td>
                                              <td className="py-2.5 px-2.5 text-right font-mono font-bold text-[#2F6F5E]">
                                                <div>{formatRupees(p.total_material_cost)}</div>
                                              </td>
                                              <td className="py-2.5 px-2.5 text-right font-mono font-bold text-[#2F6F5E]">
                                                <div>{formatRupees(p.now_to_be_released_amount || p.fund_share_amount)}</div>
                                                <div className="text-[10px] text-[#2F6F5E]/70 font-sans font-medium">
                                                  GST: {p.gst_percentage || 12}%
                                                </div>
                                              </td>
                                              <td className="py-2.5 px-2.5 text-[11px] space-y-0.5 min-w-[160px]">
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
                                                  <div className="text-[10px] font-bold text-rose-600 font-mono">
                                                    {p.delay_days}d ({p.penalty_percentage || 0}% penalty)
                                                  </div>
                                                ) : (
                                                  <div className="text-[10px] font-bold text-emerald-700 font-mono">
                                                    {p.delay_days || 0}d
                                                  </div>
                                                )}
                                              </td>
                                              <td className="py-2.5 px-2.5 text-right font-mono font-bold text-[#2F6F5E]">
                                                <div>{formatRupees(p.commission_amount)}</div>
                                                {p.dealer_rate_percentage > 0 && (
                                                  <span className="text-[9px] text-[#52607D] font-sans">
                                                    @{p.dealer_rate_percentage}%
                                                  </span>
                                                )}
                                              </td>
                                              <td className="py-2.5 px-2.5 text-right font-mono whitespace-nowrap min-w-[100px]">
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
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleOpenPenaltyModal(p);
                                                    }}
                                                    className="p-1 text-[#52607D] hover:text-[#2F6F5E] hover:bg-gray-100 rounded transition-colors cursor-pointer shrink-0 inline-flex items-center justify-center"
                                                    title="Edit delay penalty amount"
                                                  >
                                                    <Pencil size={12} />
                                                  </button>
                                                </div>
                                              </td>
                                              <td className="py-2.5 px-2.5 text-right font-mono font-bold text-[#14213D]">
                                                {formatRupees(itemNetComm)}
                                              </td>
                                              {hasFittings && (
                                                <td className="py-2.5 px-2.5 text-right font-mono text-[#7C3AED] font-semibold">
                                                  {formatRupees(p.fittings_amount)}
                                                </td>
                                              )}
                                              <td className="py-2.5 px-2.5 text-center">
                                                <span
                                                  className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                                                    p.is_paid_to_dealer
                                                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                                      : "bg-gray-100 text-gray-700 border border-gray-200"
                                                  }`}
                                                >
                                                  {p.is_paid_to_dealer ? "Paid" : "Unpaid"}
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
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 2: Individual Linked Government Projects */}
        <div className="bg-white border border-[#E4E1D8] rounded-[10px] shadow-[0_1px_2px_rgba(20,33,61,0.04)] overflow-hidden space-y-3 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EDEAE1] pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
                <FileText size={16} className="text-[#2F6F5E]" />
                Proceeding Line Items ({filteredProjects.length})
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8C97AB]" />
                <input
                  type="text"
                  placeholder="Search farmer, ID, inv..."
                  value={projectSearch}
                  onChange={(e) => {
                    setProjectSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-8 pr-3 py-1.5 text-xs bg-[#FAFAF8] border border-[#E4E1D8] rounded-[6px] focus:outline-none focus:ring-1 focus:ring-[#2F6F5E] w-48 sm:w-56"
                />
              </div>

              <Button
                variant="secondary"
                icon={Download}
                onClick={() => handleExportPDF()}
                size="sm"
                className="shrink-0 text-xs font-semibold cursor-pointer"
              >
                Download PDF
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[1300px]">
              <thead className="bg-[#FAFAF8] border-b border-[#E4E1D8] text-[#52607D] uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Application ID & Invoice</th>
                  <th className="py-2.5 px-3">Farmer & Location</th>
                  <th className="py-2.5 px-3">Dealer</th>
                  <th className="py-2.5 px-3 text-right">Invoice Amount</th>
                  <th className="py-2.5 px-3 text-right">Subsidy Eligible</th>
                  <th className="py-2.5 px-3 text-right font-bold text-[#2F6F5E]">Total Material Cost</th>
                  <th className="py-2.5 px-3 text-right font-bold text-[#2F6F5E]">Now Released</th>
                  <th className="py-2.5 px-3">Delay</th>
                  <th className="py-2.5 px-3 text-right font-bold text-[#2F6F5E]">Commission</th>
                  <th className="py-2.5 px-3 text-right text-rose-600">Penalty</th>
                  <th className="py-2.5 px-3 text-right font-bold text-[#14213D]">Net Commission</th>
                  {hasFittings && <th className="py-2.5 px-3 text-right text-[#7C3AED]">Fittings (5%)</th>}
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
                    const netComm = Math.max(0, comm - penalty);

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
                          <div>{p.dealer?.name || (p.project_id ? "Unassigned Dealer" : "Unassigned")}</div>
                          {p.dealer_rate_percentage > 0 && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <span
                                className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                                  p.dealer_rate_percentage >= 19
                                    ? "bg-amber-100 text-amber-900 border border-amber-200"
                                    : "bg-emerald-100 text-[#2F6F5E] border border-emerald-200"
                                }`}
                              >
                                {p.dealer_rate_percentage}% Rate
                              </span>
                              {p.invoice_date && (
                                <span className="text-[10px] text-[#52607D]">
                                  ({formatDate(p.invoice_date)})
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono text-[#52607D]">
                          <div>{formatRupees(p.invoice_amount)}</div>
                          {parseFloat(p.farmer_contribution || 0) > 0 && (
                            <div className="text-[10px] text-amber-700 font-medium font-sans">
                              (incl. FC: {formatRupees(p.farmer_contribution)})
                            </div>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono text-[#52607D]">
                          {formatRupees(p.subsidy_amount || p.state_restricted_amount)}
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono font-bold text-[#2F6F5E]">
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
                            <div className="text-[10px] font-bold text-rose-600 font-mono">
                              {p.delay_days}d ({p.penalty_percentage || 0}% penalty)
                            </div>
                          ) : (
                            <div className="text-[10px] font-bold text-emerald-700 font-mono">
                              {p.delay_days || 0}d
                            </div>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono font-bold text-[#2F6F5E]">
                          {formatRupees(p.commission_amount)}
                        </td>

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

                        <td className="py-2.5 px-3 text-right font-mono font-bold text-[#14213D]">
                          {formatRupees(netComm)}
                        </td>

                        {hasFittings && (
                          <td className="py-2.5 px-3 text-right font-mono text-[#7C3AED] font-semibold">
                            {formatRupees(p.fittings_amount)}
                          </td>
                        )}

                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                              p.is_paid_to_dealer
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : "bg-gray-100 text-gray-700 border border-gray-200"
                            }`}
                          >
                            {p.is_paid_to_dealer ? "Paid" : "Unpaid"}
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
      {/* Modal 2: Record Dealer Payout */}
      <Modal
        isOpen={dealerPayModalOpen}
        onClose={() => setDealerPayModalOpen(false)}
        title={`Record Payout: ${activeDealerForPay?.dealer_name || "Dealer"}`}
      >
        <form onSubmit={handleMarkDealerPaid} className="space-y-4">
          {dealerPayError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-[8px] text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle size={15} className="text-rose-600 shrink-0" />
              <span>{dealerPayError}</span>
            </div>
          )}

          <div className="p-3 bg-[#FAFAF8] rounded-[8px] border border-[#EDEAE1] space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-[#52607D]">Dealer Name:</span>
              <strong className="text-[#14213D] font-bold">{activeDealerForPay?.dealer_name}</strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#52607D]">Total Commission:</span>
              <strong className="font-mono font-bold text-[#2F6F5E]">
                {formatRupees(activeDealerForPay?.total_commission_amount)}
              </strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#52607D]">Penalty:</span>
              <strong
                className={`font-mono font-bold ${
                  parseFloat(dealerPayPenalty || 0) > 0 ? "text-rose-600" : "text-[#8C97AB]"
                }`}
              >
                {parseFloat(dealerPayPenalty || 0) > 0 ? `-${formatRupees(dealerPayPenalty)}` : "₹0"}
              </strong>
            </div>
            {hasFittings && (
              <div className="flex justify-between items-center">
                <span className="text-[#52607D]">Fittings Cost (5%):</span>
                <strong className="font-mono text-[#7C3AED]">
                  {formatRupees(activeDealerForPay?.total_fittings_amount)}
                </strong>
              </div>
            )}
            <div className="flex justify-between items-center border-t border-[#EDEAE1] pt-2">
              <span className="font-bold text-[#14213D]">Net Payout:</span>
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
              Adjusted Penalty Amount (₹ Whole Number)
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

      {/* Modal: Edit Proceeding Date */}
      <Modal
        isOpen={editDateModalOpen}
        onClose={() => setEditDateModalOpen(false)}
        title="Edit Proceeding Date"
      >
        <form onSubmit={handleSaveProceedingDate} className="space-y-4">
          {editDateError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-[8px] text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle size={15} className="text-rose-600 shrink-0" />
              <span>{editDateError}</span>
            </div>
          )}

          <div className="p-3 bg-[#FAFAF8] rounded-[8px] border border-[#EDEAE1] space-y-1 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-[#52607D]">Proceeding No:</span>
              <strong className="text-[#14213D]">#{batch?.proceeding_no}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#52607D]">Current Date:</span>
              <strong className="text-[#2F6F5E]">
                {formatDate(batch?.proceeding_date)}
              </strong>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#14213D] mb-1">
              New Proceeding Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={editProceedingDate}
              onChange={(e) => setEditProceedingDate(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-[#EDEAE1]">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setEditDateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={savingDate} icon={CheckCircle2}>
              Save Proceeding Date
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default CommissionBatchDetailPage;
