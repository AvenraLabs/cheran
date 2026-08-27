import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FileSpreadsheet,
  UploadCloud,
  Search,
  Calendar,
  IndianRupee,
  CheckCircle2,
  Clock,
  Building2,
  Trash2,
  Eye,
  CreditCard,
  X,
  FileText,
  AlertCircle,
  TrendingUp,
  Wrench,
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  Layers,
  ArrowRight,
  Pencil,
  Download,
  Users,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import api from "../api/client.js";
import Navbar from "../components/layout/Navbar.jsx";
import Button from "../components/common/Button.jsx";
import Modal from "../components/common/Modal.jsx";
import CustomSelect from "../components/common/CustomSelect.jsx";
import { SkeletonLoader } from "../components/common/SkeletonLoader.jsx";
import Pagination from "../components/common/Pagination.jsx";

export function CommissionProceedingsPage() {
  const navigate = useNavigate();

  // Active View Tab: 'batches' | 'dealer_statements'
  const [activeTab, setActiveTab] = useState("batches");

  // Batches State
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

  // Dealer Statement State
  const [statementProjects, setStatementProjects] = useState([]);
  const [statementSummary, setStatementSummary] = useState({
    total_projects: 0,
    total_invoice_amount: 0,
    total_subsidy_amount: 0,
    total_material_cost: 0,
    total_now_released: 0,
    total_commission: 0,
    total_fittings: 0,
    total_penalty: 0,
    total_net_payable: 0,
    total_paid_amount: 0,
    total_pending_amount: 0,
  });
  const [statementSelectedDealer, setStatementSelectedDealer] = useState(null);
  const [statementPagination, setStatementPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 1 });
  const [statementLoading, setStatementLoading] = useState(false);

  // Filter state
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedFundPct, setSelectedFundPct] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [payoutStatus, setPayoutStatus] = useState("");
  const [selectedDealer, setSelectedDealer] = useState("");

  // Master Data
  const [dealers, setDealers] = useState([]);

  // Modals state
  const [bankReceiptModalOpen, setBankReceiptModalOpen] = useState(false);

  // Delete modal state
  const [batchToDelete, setBatchToDelete] = useState(null);
  const [deletingBatch, setDeletingBatch] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // In-Page Upload & Live Preview State
  const [isUploadMode, setIsUploadMode] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewError, setPreviewError] = useState("");

  // Batch Form State inside Upload Mode
  const [formData, setFormData] = useState({
    proceeding_no: "",
    proceeding_date: new Date().toISOString().split("T")[0],
    fund_percentage_value: 55.0,
    include_fittings: true,
    skip_unmatched: false,
    payment_received_date: "",
    payment_received_ref: "",
  });
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");

  // Table search inside in-page preview
  const [previewTableSearch, setPreviewTableSearch] = useState("");

  // Manual Penalty Override in Preview Modal
  const [previewPenaltyModalOpen, setPreviewPenaltyModalOpen] = useState(false);
  const [previewPenaltyRow, setPreviewPenaltyRow] = useState(null);
  const [previewPenaltyInput, setPreviewPenaltyInput] = useState(0);

  // Form State: Bank Payment Receipt
  const [activeBatchForBank, setActiveBatchForBank] = useState(null);
  const [bankReceiptDate, setBankReceiptDate] = useState("");
  const [bankReceiptRef, setBankReceiptRef] = useState("");
  const [savingBankReceipt, setSavingBankReceipt] = useState(false);

  const fileInputRef = useRef(null);
  const debounceTimerRef = useRef(null);

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
        ...(selectedFundPct ? { fund_percentage_value: selectedFundPct } : {}),
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

  // Fetch Dealer Statement
  const fetchDealerStatement = async (page = 1, limit = statementPagination.limit) => {
    try {
      setStatementLoading(true);
      const params = {
        page,
        limit,
        ...(search ? { search: search.trim() } : {}),
        ...(startDate ? { start_date: startDate } : {}),
        ...(endDate ? { end_date: endDate } : {}),
        ...(selectedDealer ? { dealer_id: selectedDealer } : {}),
        ...(payoutStatus ? { payout_status: payoutStatus } : {}),
      };

      const res = await api.get("/proceedings/dealer-statement", { params });
      setStatementProjects(res?.projects || res?.data?.projects || []);
      setStatementSummary(res?.summary || res?.data?.summary || {});
      setStatementSelectedDealer(res?.selectedDealer || res?.data?.selectedDealer || null);
      setStatementPagination(res?.pagination || res?.data?.pagination || { page, limit, total: 0, totalPages: 1 });
    } catch (err) {
      console.error("Failed to fetch dealer statement:", err);
    } finally {
      setStatementLoading(false);
    }
  };

  // Fetch Dealers
  const fetchDealers = async () => {
    try {
      const res = await api.get("/dealers/options").catch(() => ({ dealers: [] }));
      setDealers(res?.dealers || res?.data?.dealers || []);
    } catch (err) {
      console.error("Error loading dealers:", err);
    }
  };

  useEffect(() => {
    fetchDealers();
  }, []);

  // Debounced filter effect
  useEffect(() => {
    if (isUploadMode) return;
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      if (activeTab === "batches") {
        fetchBatches(1, pagination.limit);
      } else {
        fetchDealerStatement(1, statementPagination.limit);
      }
    }, 250);
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [
    activeTab,
    search,
    startDate,
    endDate,
    selectedFundPct,
    paymentStatus,
    payoutStatus,
    selectedDealer,
    isUploadMode,
  ]);

  const hasActiveFilters = Boolean(
    search || startDate || endDate || selectedFundPct || paymentStatus || payoutStatus || selectedDealer
  );

  const handleResetFilters = () => {
    setSearch("");
    setStartDate("");
    setEndDate("");
    setSelectedFundPct("");
    setPaymentStatus("");
    setPayoutStatus("");
    setSelectedDealer("");
  };

  // Export Dealer Statement PDF
  const handleExportDealerPDF = () => {
    if (!statementProjects || statementProjects.length === 0) return;

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();

    const currentDealerName =
      dealers.find((d) => d.id === selectedDealer)?.name ||
      statementSelectedDealer?.name ||
      "All Dealers";

    const periodText =
      startDate && endDate
        ? `${formatDate(startDate)} to ${formatDate(endDate)}`
        : startDate
        ? `From ${formatDate(startDate)}`
        : endDate
        ? `Until ${formatDate(endDate)}`
        : "All Historical Proceedings";

    // Brand Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(20, 33, 61);
    doc.text("CHERAN IRRIGATION", 30, 36);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(82, 96, 125);
    doc.text("Dealer Commission & Payout Statement", 30, 50);

    // Meta Header Information
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(20, 33, 61);
    doc.text(`Dealer: ${currentDealerName}`, 30, 68);
    doc.text(`Period: ${periodText}`, 220, 68);
    doc.text(`Status: ${payoutStatus || "ALL PAYOUTS"}`, 440, 68);
    doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")}`, 640, 68);

    // Table Headers
    const headers = [
      [
        "#",
        "Proceeding & Date",
        "Application ID & Inv",
        "Farmer & Location",
        "Dealer",
        "Inv Amt (Rs.)",
        "Subsidy (Rs.)",
        "Material Cost (Rs.)",
        "Now Released (Rs.)",
        "Delay",
        "Commission (Rs.)",
        "Penalty (Rs.)",
        "Net Comm. (Rs.)",
        "Fittings 5% (Rs.)",
        "Net Payout (Rs.)",
        "Payout Status",
      ],
    ];

    let totalInv = 0;
    let totalSub = 0;
    let totalMat = 0;
    let totalRel = 0;
    let totalComm = 0;
    let totalPen = 0;
    let totalNetComm = 0;
    let totalFit = 0;
    let totalNet = 0;

    const rows = statementProjects.map((p, index) => {
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
      const netComm = Math.max(0, commAmt - penalty);
      const netPayable = Math.max(0, netComm + fitAmt);

      totalInv += invAmt;
      totalSub += subAmt;
      totalMat += matCost;
      totalRel += nowRel;
      totalComm += commAmt;
      totalPen += penalty;
      totalNetComm += netComm;
      totalFit += fitAmt;
      totalNet += netPayable;

      const isFirstFund = (p.batch?.fund_percentage_value || 55) >= 50.0;
      const startLabel = isFirstFund ? "Inv Date" : "1st Fund";
      const endLabel = isFirstFund ? "Work Comp" : "Joint Verif";

      const datesText = `${startLabel}: ${formatDate(p.milestone_start_date)}\n${endLabel}: ${formatDate(p.milestone_end_date)}\nDelay: ${p.delay_days || 0}d${
        p.delay_days > 45 ? ` (${p.penalty_percentage || 0}%)` : ""
      }`;

      const invNoText = p.invoice_number && p.invoice_number !== "—" ? `\nInv: #${p.invoice_number}` : "";
      const locText = [p.village, p.district].filter(Boolean).join(", ") || "";
      const procInfo = `#${p.batch?.proceeding_no || "—"}\n${formatDate(p.batch?.proceeding_date)} (${p.batch?.fund_percentage_value || "—"}%)`;
      const payoutStatusText = p.is_paid_to_dealer
        ? `Paid (${formatDate(p.dealer_paid_date)})`
        : "Pending";

      return [
        String(index + 1),
        procInfo,
        `${p.application_id}${invNoText}`,
        `${p.farmer_name || "—"}\n${locText}`,
        p.dealer?.name || "Unassigned",
        invAmt ? invAmt.toLocaleString("en-IN") : "—",
        subAmt ? subAmt.toLocaleString("en-IN") : "—",
        matCost ? `${matCost.toLocaleString("en-IN")}\n(GST ${p.gst_percentage || 12}%)` : "—",
        nowRel ? `${nowRel.toLocaleString("en-IN")}\n(GST ${p.gst_percentage || 12}%)` : "—",
        datesText,
        commAmt ? commAmt.toLocaleString("en-IN") : "0",
        penalty > 0 ? `-${penalty.toLocaleString("en-IN")}` : "0",
        netComm.toLocaleString("en-IN"),
        fitAmt ? fitAmt.toLocaleString("en-IN") : "0",
        netPayable.toLocaleString("en-IN"),
        payoutStatusText,
      ];
    });

    // Summary Footer Row
    const footers = [
      [
        "Total",
        `${statementProjects.length} Items`,
        "—",
        "—",
        "—",
        totalInv.toLocaleString("en-IN"),
        totalSub.toLocaleString("en-IN"),
        totalMat.toLocaleString("en-IN"),
        totalRel.toLocaleString("en-IN"),
        "—",
        totalComm.toLocaleString("en-IN"),
        totalPen > 0 ? `-${totalPen.toLocaleString("en-IN")}` : "0",
        totalNetComm.toLocaleString("en-IN"),
        totalFit.toLocaleString("en-IN"),
        totalNet.toLocaleString("en-IN"),
        "—",
      ],
    ];

    autoTable(doc, {
      head: headers,
      body: rows,
      foot: footers,
      startY: 80,
      margin: { left: 20, right: 20 },
      theme: "grid",
      styles: {
        fontSize: 6.8,
        cellPadding: { top: 3.5, bottom: 3.5, left: 2, right: 2 },
        textColor: [20, 33, 61],
        lineColor: [230, 227, 218],
        lineWidth: 0.5,
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: [245, 245, 243],
        textColor: [50, 60, 80],
        fontStyle: "bold",
        fontSize: 6.8,
      },
      footStyles: {
        fillColor: [240, 244, 243],
        textColor: [20, 33, 61],
        fontStyle: "bold",
        fontSize: 6.8,
      },
      columnStyles: {
        0: { cellWidth: 15, halign: "center" },
        1: { cellWidth: 65 },
        2: { cellWidth: 70 },
        3: { cellWidth: 70 },
        4: { cellWidth: 55 },
        5: { cellWidth: 44, halign: "right" },
        6: { cellWidth: 44, halign: "right" },
        7: { cellWidth: 44, halign: "right" },
        8: { cellWidth: 44, halign: "right", fontStyle: "bold", textColor: [47, 111, 94] },
        9: { cellWidth: 70 },
        10: { cellWidth: 44, halign: "right", fontStyle: "bold", textColor: [47, 111, 94] },
        11: { cellWidth: 42, halign: "right", textColor: [225, 29, 72] },
        12: { cellWidth: 44, halign: "right", fontStyle: "bold", textColor: [20, 33, 61] },
        13: { cellWidth: 42, halign: "right", textColor: [124, 58, 237] },
        14: { cellWidth: 50, halign: "right", fontStyle: "bold", textColor: [6, 95, 70] },
        15: { cellWidth: 46, halign: "center" },
      },
      didDrawPage: (data) => {
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(140, 151, 171);
        doc.text(
          `Cheran Irrigation · Dealer Commission Statement · Page ${data.pageNumber} of ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 12,
          { align: "center" }
        );
      },
    });

    const safeDealerName = (currentDealerName || "Statement").replace(/[/\\?%*:|"<> ]/g, "_");
    doc.save(`Dealer_Statement_${safeDealerName}_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  // Handle File Select & Preview
  const handleFileChange = async (file, overrideFittings = null) => {
    if (!file) return;
    setSelectedFile(file);
    setPreviewError("");
    setImportError("");
    setPreviewData(null);
    setIsUploadMode(true);

    const data = new FormData();
    data.append("file", file);
    if (overrideFittings !== null) {
      data.append("include_fittings", overrideFittings);
    }

    try {
      setPreviewLoading(true);
      const res = await api.post("/proceedings/preview-excel", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const prev = res?.preview || res?.data?.preview;
      if (!prev) {
        throw new Error("Invalid response received from server");
      }
      setPreviewData(prev);
      setFormData((f) => ({
        ...f,
        proceeding_no: prev.proceeding_no || `PROC-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}`,
        fund_percentage_value: prev.detected_fund_percentage || 55.0,
        include_fittings: prev.include_fittings,
      }));
    } catch (err) {
      console.error("Excel preview failed:", err);
      setPreviewError(err?.message || err?.response?.data?.message || "Failed to parse government Excel file");
    } finally {
      setPreviewLoading(false);
    }
  };

  // Handle Toggle Fittings Checkbox in Preview Form
  const handleToggleFittings = (checked) => {
    setFormData((f) => ({ ...f, include_fittings: checked }));
    if (!previewData) return;

    let newTotalFittings = 0;
    let newTotalNetPayout = 0;

    const updatedRows = previewData.rows.map((r) => {
      const gstPct = parseFloat(r.gst_percentage ?? 12.0);
      const fitPct = parseFloat(r.fittings_percentage ?? 5.0);
      const taxableEligible = r.subsidy_eligible_amount > 0 ? r.subsidy_eligible_amount / (1 + gstPct / 100) : 0;
      const totalMatCost = taxableEligible > 0 ? Math.floor(taxableEligible / (1 + fitPct / 100)) : 0;
      const totalFit5pct = Math.floor(taxableEligible - totalMatCost);

      const fitAmt = checked ? totalFit5pct : 0;
      const netPayout = Math.max(0, r.commission_amount + fitAmt - (r.penalty_amount || 0));

      newTotalFittings += fitAmt;
      newTotalNetPayout += netPayout;

      return {
        ...r,
        fittings_amount: fitAmt,
        net_dealer_payout: netPayout,
      };
    });

    setPreviewData({
      ...previewData,
      include_fittings: checked,
      rows: updatedRows,
      summary: {
        ...previewData.summary,
        total_fittings: newTotalFittings,
        total_net_payout: newTotalNetPayout,
      },
    });
  };

  // Open Preview Penalty Override Modal
  const handleOpenPreviewPenalty = (row) => {
    setPreviewPenaltyRow(row);
    setPreviewPenaltyInput(row.penalty_amount || 0);
    setPreviewPenaltyModalOpen(true);
  };

  // Save Preview Penalty Override
  const handleSavePreviewPenalty = (e) => {
    e.preventDefault();
    if (!previewPenaltyRow || !previewData) return;
    const penVal = Math.floor(Math.max(0, parseFloat(previewPenaltyInput || 0)));

    let newTotalPenalty = 0;
    let newTotalNetPayout = 0;

    const updatedRows = previewData.rows.map((r) => {
      if (r.application_id === previewPenaltyRow.application_id) {
        const netPayout = Math.max(0, r.commission_amount + r.fittings_amount - penVal);
        newTotalPenalty += penVal;
        newTotalNetPayout += netPayout;
        return {
          ...r,
          penalty_amount: penVal,
          net_dealer_payout: netPayout,
        };
      }
      newTotalPenalty += r.penalty_amount || 0;
      newTotalNetPayout += r.net_dealer_payout || 0;
      return r;
    });

    setPreviewData({
      ...previewData,
      rows: updatedRows,
      summary: {
        ...previewData.summary,
        total_penalty: newTotalPenalty,
        total_net_payout: newTotalNetPayout,
      },
    });

    setPreviewPenaltyModalOpen(false);
  };

  // Handle Import Submit
  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setImportError("Please select a valid Excel file first.");
      return;
    }
    setImportError("");

    const data = new FormData();
    data.append("file", selectedFile);
    data.append("proceeding_no", formData.proceeding_no);
    data.append("proceeding_date", formData.proceeding_date);
    data.append("fund_percentage_value", formData.fund_percentage_value);
    data.append("include_fittings", formData.include_fittings);
    data.append("skip_unmatched", formData.skip_unmatched);
    if (formData.payment_received_date) data.append("payment_received_date", formData.payment_received_date);
    if (formData.payment_received_ref) data.append("payment_received_ref", formData.payment_received_ref);

    try {
      setImporting(true);
      const res = await api.post("/proceedings/import-excel", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const createdBatch = res?.batch || res?.data?.batch;
      setIsUploadMode(false);
      setSelectedFile(null);
      setPreviewData(null);
      if (createdBatch?.id) {
        navigate(`/commissions/${createdBatch.id}`);
      } else {
        fetchBatches(1);
      }
    } catch (err) {
      console.error("Import failed:", err);
      setImportError(err?.message || err?.response?.data?.message || "Failed to import proceeding batch");
    } finally {
      setImporting(false);
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

  // Confirm Delete Batch
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

  // Filtered rows inside in-page preview
  const filteredPreviewRows = previewData?.rows?.filter((r) => {
    if (!previewTableSearch.trim()) return true;
    const q = previewTableSearch.toLowerCase().trim();
    return (
      r.application_id?.toLowerCase().includes(q) ||
      r.farmer_name?.toLowerCase().includes(q) ||
      r.district?.toLowerCase().includes(q) ||
      r.dealer_name?.toLowerCase().includes(q) ||
      r.invoice_number?.toLowerCase().includes(q)
    );
  }) || [];

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Navbar
        title="Commission Proceedings"
        subtitle={
          isUploadMode
            ? "Live in-page preview of government proceeding sheet and commission calculations"
            : "Upload government proceeding Excel files (.xls / .xlsx) to calculate dealer commissions and track disbursements"
        }
        actions={
          <div className="flex items-center gap-2">
            {isUploadMode ? (
              <Button
                variant="secondary"
                size="sm"
                icon={ArrowLeft}
                onClick={() => {
                  setIsUploadMode(false);
                  setSelectedFile(null);
                  setPreviewData(null);
                  setPreviewError("");
                  setImportError("");
                }}
              >
                Back to History
              </Button>
            ) : (
              <>
                {activeTab === "dealer_statements" && (
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={Download}
                    onClick={handleExportDealerPDF}
                    disabled={statementProjects.length === 0}
                    title="Download Dealer Commission Statement PDF"
                  >
                    Download PDF
                  </Button>
                )}
                <Button
                  variant="primary"
                  size="sm"
                  icon={UploadCloud}
                  onClick={() => {
                    setIsUploadMode(true);
                    setSelectedFile(null);
                    setPreviewData(null);
                    setPreviewError("");
                    setImportError("");
                    setFormData({
                      proceeding_no: "",
                      proceeding_date: new Date().toISOString().split("T")[0],
                      fund_percentage_value: 55.0,
                      include_fittings: true,
                      skip_unmatched: false,
                      payment_received_date: "",
                      payment_received_ref: "",
                    });
                  }}
                >
                  Upload Proceeding Excel
                </Button>
              </>
            )}
          </div>
        }
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 overflow-y-auto">
        {/* ========================================================================= */}
        {/* VIEW 1: IN-PAGE UPLOAD & FULL-WIDTH INTERACTIVE LIVE PREVIEW WORKSPACE    */}
        {/* ========================================================================= */}
        {isUploadMode ? (
          <div className="space-y-6">
            {/* Upload Selector Card */}
            <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-6 shadow-[0_1px_2px_rgba(20,33,61,0.04)] space-y-4">
              <div className="flex items-center justify-between border-b border-[#EDEAE1] pb-3">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet size={20} className="text-[#2F6F5E]" />
                  <h2 className="text-sm font-bold font-display text-[#14213D]">
                    Select Government Proceeding Excel (.xls, .xlsx)
                  </h2>
                </div>
                {previewData && (
                  <Button
                    variant="outline"
                    size="xs"
                    icon={RefreshCw}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Change File
                  </Button>
                )}
              </div>

              <input
                type="file"
                ref={fileInputRef}
                accept=".xls,.xlsx"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
                className="hidden"
              />

              {!previewData && !previewLoading && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#CCD5AE] hover:border-[#2F6F5E] bg-[#FAFAF8] rounded-[10px] p-8 text-center cursor-pointer transition-colors space-y-3"
                >
                  <div className="w-12 h-12 rounded-full bg-[#EAF3F0] text-[#2F6F5E] flex items-center justify-center mx-auto shadow-sm">
                    <UploadCloud size={24} />
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-[#14213D]">
                      {selectedFile ? selectedFile.name : "Click to browse or drag and drop Proceeding Excel"}
                    </div>
                    <p className="text-xs text-[#52607D]">
                      Supports Government 40%, 45%, and 55% proceeding sheets
                    </p>
                  </div>
                </div>
              )}

              {previewLoading && (
                <div className="p-8 bg-[#FAFAF8] rounded-[10px] border border-[#E4E1D8] text-center space-y-3">
                  <div className="w-8 h-8 border-3 border-[#2F6F5E] border-t-transparent rounded-full animate-spin mx-auto" />
                  <div className="text-sm font-bold text-[#14213D]">
                    Analyzing Proceeding Sheet & Linking Database Projects...
                  </div>
                  <p className="text-xs text-[#52607D]">
                    Extracting released tranches, calculating material cost from subsidy eligible amount, and resolving dealer commissions.
                  </p>
                </div>
              )}

              {previewError && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-[8px] text-xs text-rose-800 flex items-start gap-2.5">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <div>
                    <strong>Error parsing Excel:</strong> {previewError}
                  </div>
                </div>
              )}
            </div>

            {/* PREVIEW CONTENT (RENDERED FULL WIDTH DIRECTLY IN PAGE) */}
            {previewData && (
              <form onSubmit={handleImportSubmit} className="space-y-6">
                {importError && (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-[8px] text-xs text-rose-800 flex items-start gap-2.5">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <span>{importError}</span>
                  </div>
                )}

                {/* Top Status & Detected Tranche Banner */}
                <div className="bg-white border border-[#2F6F5E]/40 rounded-[10px] p-4 shadow-[0_1px_2px_rgba(20,33,61,0.04)] bg-gradient-to-r from-[#EAF3F0]/60 to-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1.5 rounded-full font-extrabold font-mono text-sm shadow-sm ${
                        previewData.detected_fund_percentage === 40
                          ? "bg-indigo-700 text-white"
                          : previewData.detected_fund_percentage === 45
                          ? "bg-blue-700 text-white"
                          : "bg-[#2F6F5E] text-white"
                      }`}
                    >
                      {previewData.detected_fund_percentage}% Fund Release
                    </span>
                    <div className="text-xs text-[#52607D] font-mono">
                      File: <strong className="text-[#14213D]">{previewData.file_name}</strong> ({previewData.total_rows_count} records)
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-[8px] border border-[#E4E1D8] text-xs font-mono">
                      <span className="font-semibold text-[#14213D]">{previewData.total_rows_count} Total</span>
                      <span className="text-[#8C97AB]">|</span>
                      <span className="text-emerald-700 font-bold">{previewData.matched_count} in DB</span>
                      {previewData.unmatched_count > 0 && (
                        <>
                          <span className="text-[#8C97AB]">|</span>
                          <span className="text-amber-700 font-bold">{previewData.unmatched_count} Unlinked</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* KPI Summary Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-5 shadow-[0_1px_2px_rgba(20,33,61,0.04)]">
                    <span className="text-[10px] text-[#52607D] uppercase font-semibold block">
                      Total Subsidy Eligible (100%)
                    </span>
                    <div className="text-xl font-bold font-mono text-[#14213D] mt-1">
                      {formatRupees(previewData.summary.total_subsidy_eligible)}
                    </div>
                    <div className="text-[11px] text-[#52607D] mt-0.5">
                      Govt proceeding gross subsidy
                    </div>
                  </div>

                  <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-5 shadow-[0_1px_2px_rgba(20,33,61,0.04)]">
                    <span className="text-[10px] text-[#52607D] uppercase font-semibold block">
                      Total Material Cost
                    </span>
                    <div className="text-xl font-bold font-mono text-[#14213D] mt-1">
                      {formatRupees(previewData.summary.total_material_cost)}
                    </div>
                    <div className="text-[11px] text-[#52607D] mt-0.5">
                      After GST & 5% fittings deduction
                    </div>
                  </div>

                  <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-5 shadow-[0_1px_2px_rgba(20,33,61,0.04)]">
                    <span className="text-[10px] text-[#2F6F5E] uppercase font-bold block">
                      Now to be Released ({previewData.detected_fund_percentage}%)
                    </span>
                    <div className="text-xl font-bold font-mono text-[#2F6F5E] mt-1">
                      {formatRupees(previewData.summary.total_now_released)}
                    </div>
                    <div className="text-[11px] text-[#52607D] mt-0.5">
                      Total tranche release value
                    </div>
                  </div>

                  <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-5 shadow-[0_1px_2px_rgba(20,33,61,0.04)]">
                    <span className="text-[10px] text-emerald-700 uppercase font-bold block">
                      Net Dealer Payout
                    </span>
                    <div className="text-xl font-bold font-mono text-emerald-800 mt-1">
                      {formatRupees(previewData.summary.total_net_payout)}
                    </div>
                    <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
                      Commission ({formatRupees(previewData.summary.total_dealer_commission)})
                      {formData.include_fittings && (
                        <span> + Fittings ({formatRupees(previewData.summary.total_fittings)})</span>
                      )}
                      {previewData.summary.total_penalty > 0 && (
                        <span> - Penalty ({formatRupees(previewData.summary.total_penalty)})</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Batch Information Form Card with Fittings Checkbox */}
                <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-5 shadow-[0_1px_2px_rgba(20,33,61,0.04)] space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EDEAE1] pb-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#14213D] flex items-center gap-2">
                      <FileText size={15} className="text-[#2F6F5E]" />
                      Proceeding Batch Information & Settings
                    </h3>

                    {/* Fittings Checkbox Control */}
                    <label className="flex items-center gap-2 cursor-pointer bg-[#FAFAF8] px-3 py-1.5 rounded-[8px] border border-[#E4E1D8] hover:border-[#2F6F5E] transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.include_fittings}
                        onChange={(e) => handleToggleFittings(e.target.checked)}
                        className="w-4 h-4 text-[#2F6F5E] rounded focus:ring-[#2F6F5E]"
                      />
                      <div className="text-xs">
                        <span className="font-bold text-[#14213D]">Include 5% Fittings Cost</span>
                        <span className="text-[10px] text-[#52607D] ml-1.5 font-mono">
                          {formData.include_fittings ? "(5% on Total Subsidy Amount)" : "(No Fittings)"}
                        </span>
                      </div>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#14213D] mb-1">
                        Proceeding Date <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={formData.proceeding_date}
                        onChange={(e) => setFormData({ ...formData, proceeding_date: e.target.value })}
                        className="w-full px-3 py-2 text-xs font-mono bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#14213D] mb-1">
                        Proceeding Reference No. <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.proceeding_no}
                        onChange={(e) => setFormData({ ...formData, proceeding_no: e.target.value })}
                        placeholder="e.g. B2/2345/2026(11)"
                        className="w-full px-3 py-2 text-xs font-mono bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
                        required
                      />
                    </div>

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
                        Payment Reference / UTR (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. NEFT-UTR-90182390"
                        value={formData.payment_received_ref}
                        onChange={(e) => setFormData({ ...formData, payment_received_ref: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
                      />
                    </div>
                  </div>
                </div>

                {/* FULL-WIDTH SCROLLABLE DATA ROWS PREVIEW TABLE */}
                <div className="bg-white border border-[#E4E1D8] rounded-[10px] shadow-[0_1px_2px_rgba(20,33,61,0.04)] overflow-hidden space-y-3 p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EDEAE1] pb-3">
                    <h3 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
                      <FileSpreadsheet size={16} className="text-[#2F6F5E]" />
                      Proceeding Line Items Preview ({filteredPreviewRows.length} of {previewData.rows.length})
                    </h3>

                    <div className="relative w-full sm:w-72">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#52607D]" />
                      <input
                        type="text"
                        placeholder="Search ID, Farmer, District, Dealer, Inv..."
                        value={previewTableSearch}
                        onChange={(e) => setPreviewTableSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
                      />
                    </div>
                  </div>

                  {/* Horizontal Scrollable Table Wrapper */}
                  <div className="overflow-x-auto border border-[#EDEAE1] rounded-[8px]">
                    <table className="w-full text-left text-xs min-w-[1350px]">
                      <thead className="bg-[#FAFAF8] border-b border-[#EDEAE1] text-[#52607D] uppercase font-semibold">
                        <tr>
                          <th className="py-3 px-3 w-12 text-center">#</th>
                          <th className="py-3 px-3">Application ID & Invoice</th>
                          <th className="py-3 px-3">Farmer & Location</th>
                          <th className="py-3 px-3">Assigned Dealer</th>
                          <th className="py-3 px-3 text-right">Invoice Amount</th>
                          <th className="py-3 px-3 text-right">Subsidy Eligible</th>
                          <th className="py-3 px-3 text-right">Material Cost</th>
                          <th className="py-3 px-3 text-right font-bold text-[#2F6F5E]">Now Released</th>
                          <th className="py-3 px-3">Delay</th>
                          <th className="py-3 px-3 text-right font-bold text-[#2F6F5E]">Dealer Comm.</th>
                          <th className="py-3 px-3 text-right text-rose-600">Penalty</th>
                          <th className="py-3 px-3 text-right font-bold text-[#14213D]">Net Comm.</th>
                          {formData.include_fittings && (
                            <th className="py-3 px-3 text-right text-[#7C3AED]">Fittings (5%)</th>
                          )}
                          <th className="py-3 px-3 text-right font-bold text-emerald-800">Net Payout</th>
                          <th className="py-3 px-3 text-center">DB Match</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EDEAE1]">
                        {filteredPreviewRows.length === 0 ? (
                          <tr>
                            <td colSpan={formData.include_fittings ? 15 : 14} className="py-8 text-center text-xs text-[#8C97AB]">
                              No matching records found.
                            </td>
                          </tr>
                        ) : (
                          filteredPreviewRows.map((r, i) => {
                            const commAmt = r.commission_amount || 0;
                            const penAmt = r.penalty_amount || 0;
                            const netComm = Math.max(0, commAmt - penAmt);

                            return (
                            <tr key={r.application_id || i} className="hover:bg-[#FAFAF8] transition-colors">
                              <td className="py-2.5 px-3 text-center font-mono text-[#8C97AB]">{r.row_index}</td>
                              <td className="py-2.5 px-3">
                                <div className="font-mono font-bold text-[#14213D] text-xs">
                                  {r.application_id}
                                </div>
                                <div className="mt-1 flex items-center gap-1.5">
                                  <span className="text-[10px] text-[#52607D] font-medium">Inv No:</span>
                                  {r.invoice_number && r.invoice_number !== "—" ? (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono font-bold text-[10px]">
                                      #{r.invoice_number}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-[#8C97AB] italic">—</span>
                                  )}
                                </div>
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="font-semibold text-[#14213D]">{r.farmer_name}</div>
                                <div className="text-[10px] text-[#52607D]">
                                  {[r.village, r.block, r.district].filter(Boolean).join(", ") || "—"}
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-[#14213D] font-medium">
                                <div>{r.dealer_name}</div>
                                {r.dealer_rate_percentage > 0 && (
                                  <div className="text-[10px] font-mono text-[#2F6F5E]">
                                    Base: {r.dealer_rate_percentage}%
                                  </div>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-[#52607D]">
                                {formatRupees(r.invoice_amount)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-[#52607D]">
                                {formatRupees(r.subsidy_eligible_amount)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-medium text-[#14213D]">
                                <div>{formatRupees(r.total_material_cost)}</div>
                                <div className="text-[10px] text-[#8C97AB] font-sans font-medium">
                                  GST: {r.gst_percentage || 12}%
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-[#2F6F5E] bg-emerald-50/50">
                                <div>{formatRupees(r.now_to_be_released_amount)}</div>
                                <div className="text-[10px] text-[#2F6F5E]/70 font-sans font-medium">
                                  GST: {r.gst_percentage || 12}%
                                </div>
                              </td>

                              {/* Penalty Dates */}
                              <td className="py-2.5 px-3 text-[11px] font-mono whitespace-nowrap min-w-[170px]">
                                <div className="space-y-1">
                                  <div>
                                    <div className="text-[10px] text-[#52607D] font-medium leading-tight">
                                      {r.milestone_start_label}:
                                    </div>
                                    <div className="font-semibold text-[#14213D] leading-tight">
                                      {formatDate(r.milestone_start_date)}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-[10px] text-[#52607D] font-medium leading-tight">
                                      {r.milestone_end_label}:
                                    </div>
                                    <div className="font-semibold text-[#14213D] leading-tight">
                                      {formatDate(r.milestone_end_date)}
                                    </div>
                                  </div>
                                  {r.delay_days > 45 ? (
                                    <div className="text-rose-600 font-bold text-[10px] pt-0.5">
                                      {r.delay_days}d ({r.penalty_percentage}% penalty)
                                    </div>
                                  ) : (
                                    <div className="text-emerald-700 font-bold text-[10px] pt-0.5">
                                      {r.delay_days || 0}d
                                    </div>
                                  )}
                                </div>
                              </td>

                              <td className="py-2.5 px-3 text-right font-mono font-bold text-[#2F6F5E]">
                                {formatRupees(r.commission_amount)}
                              </td>

                              {/* Penalty with manual edit button - strictly single line */}
                              <td className="py-2.5 px-3 text-right font-mono whitespace-nowrap min-w-[110px]">
                                <div className="inline-flex items-center justify-end gap-1.5 whitespace-nowrap">
                                  {r.penalty_amount > 0 ? (
                                    <span className="text-rose-600 font-bold whitespace-nowrap">
                                      -{formatRupees(r.penalty_amount)}
                                    </span>
                                  ) : (
                                    <span className="text-[#8C97AB] whitespace-nowrap">₹0</span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleOpenPreviewPenalty(r)}
                                    className="p-1 text-[#52607D] hover:text-[#2F6F5E] hover:bg-gray-100 rounded transition-colors cursor-pointer shrink-0 inline-flex items-center justify-center"
                                    title="Edit delay penalty amount"
                                  >
                                    <Pencil size={11} />
                                  </button>
                                </div>
                              </td>

                              <td className="py-2.5 px-3 text-right font-mono font-bold text-[#14213D]">
                                {formatRupees(netComm)}
                              </td>

                              {formData.include_fittings && (
                                <td className="py-2.5 px-3 text-right font-mono text-[#7C3AED] font-semibold">
                                  {formatRupees(r.fittings_amount)}
                                </td>
                              )}

                              <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800 text-sm">
                                {formatRupees(r.net_dealer_payout)}
                              </td>

                              <td className="py-2.5 px-3 text-center">
                                {r.is_matched_in_db ? (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                                    ✓ Linked
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                                    Unlinked
                                  </span>
                                )}
                              </td>
                            </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-4 shadow-[0_1px_2px_rgba(20,33,61,0.04)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="text-xs text-[#52607D]">
                    Ready to save Proceeding Batch with{" "}
                    <strong className="text-[#14213D]">
                      {formData.skip_unmatched ? previewData.matched_count : previewData.total_rows_count}
                    </strong>{" "}
                    records.
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      variant="secondary"
                      type="button"
                      onClick={() => {
                        setIsUploadMode(false);
                        setSelectedFile(null);
                        setPreviewData(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      loading={importing}
                      icon={CheckCircle2}
                      size="md"
                    >
                      Confirm & Save Proceeding Batch
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* View Mode Switcher Tabs */}
            <div className="flex items-center justify-between border-b border-[#E4E1D8] pb-3 gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("batches")}
                  className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-[8px] transition-all cursor-pointer ${
                    activeTab === "batches"
                      ? "bg-[#2F6F5E] text-white shadow-xs"
                      : "bg-white text-[#52607D] border border-[#E4E1D8] hover:bg-gray-100"
                  }`}
                >
                  <FileSpreadsheet size={15} />
                  <span>Proceeding Batches ({pagination.total || batches.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("dealer_statements")}
                  className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-[8px] transition-all cursor-pointer ${
                    activeTab === "dealer_statements"
                      ? "bg-[#2F6F5E] text-white shadow-xs"
                      : "bg-white text-[#52607D] border border-[#E4E1D8] hover:bg-gray-100"
                  }`}
                >
                  <Users size={15} />
                  <span>Dealer Statements & Payouts</span>
                </button>
              </div>

              {activeTab === "dealer_statements" && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={Download}
                    onClick={handleExportDealerPDF}
                    disabled={statementProjects.length === 0}
                    title="Download Dealer Commission Statement PDF"
                    className="text-xs font-semibold"
                  >
                    Download PDF Statement
                  </Button>
                </div>
              )}
            </div>

            {activeTab === "batches" ? (
              /* ========================================================================= */
              /* VIEW 2A: PROCEEDING BATCHES LIST                                         */
              /* ========================================================================= */
              <div className="space-y-6">
                {/* KPI Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-5 shadow-[0_1px_2px_rgba(20,33,61,0.04)] space-y-1">
                    <div className="flex items-center justify-between text-[#52607D] text-xs font-semibold">
                      <span>Total Proceeding Released</span>
                      <FileSpreadsheet size={16} className="text-[#2F6F5E]" />
                    </div>
                    <div className="text-xl font-bold text-[#14213D] font-mono mt-1">
                      {formatRupees(summary.total_proceeding_value)}
                    </div>
                    <div className="text-[11px] text-[#52607D]">
                      Across {summary.total_batches_count || 0} batches recorded
                    </div>
                  </div>

                  <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-5 shadow-[0_1px_2px_rgba(20,33,61,0.04)] space-y-1">
                    <div className="flex items-center justify-between text-[#52607D] text-xs font-semibold">
                      <span>Calculated Dealer Commission</span>
                      <IndianRupee size={16} className="text-[#2F6F5E]" />
                    </div>
                    <div className="text-xl font-bold text-[#2F6F5E] font-mono mt-1">
                      {formatRupees(summary.total_dealer_commission)}
                    </div>
                    <div className="text-[11px] text-[#52607D]">
                      + {formatRupees(summary.total_fittings_value)} Fittings Cost (5%)
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
                      Verified Received
                    </div>
                  </div>

                  {/* Card 4: Pending Payment */}
                  <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-5 shadow-[0_1px_2px_rgba(20,33,61,0.04)] space-y-1">
                    <div className="flex items-center justify-between text-[#52607D] text-xs font-semibold">
                      <span>Payment Pending</span>
                      <Clock size={16} className="text-amber-600" />
                    </div>
                    <div className="text-xl font-bold text-amber-800 font-mono mt-1">
                      {formatRupees(summary.total_pending_bank_value)}
                    </div>
                    <div className="text-[11px] text-amber-700 font-medium">
                      Awaiting Payment Verification
                    </div>
                  </div>
                </div>

                {/* Filter Bar */}
                <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-4 shadow-[0_1px_2px_rgba(20,33,61,0.04)] space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
                    {/* Search */}
                    <div className="relative lg:col-span-3">
                      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#52607D]" />
                      <input
                        type="text"
                        placeholder="Search Proceeding / File / Ref..."
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

                    {/* Date Range: From */}
                    <div className="relative lg:col-span-2">
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-mono bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
                        title="Filter by Proceeding From Date"
                      />
                    </div>

                    {/* Date Range: To */}
                    <div className="relative lg:col-span-2">
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-mono bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
                        title="Filter by Proceeding To Date"
                      />
                    </div>

                    {/* Fund Release % Filter */}
                    <div className="lg:col-span-2">
                      <CustomSelect
                        options={[
                          { value: "", label: "All Release %" },
                          { value: "40", label: "40% Release" },
                          { value: "45", label: "45% Release" },
                          { value: "55", label: "55% Release" },
                        ]}
                        value={selectedFundPct}
                        onChange={(val) => setSelectedFundPct(val)}
                        placeholder="Release %"
                        size="sm"
                      />
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
                      <div className="text-sm font-bold text-[#14213D]">No Proceeding Batches Found</div>
                      <p className="text-xs text-[#52607D] max-w-sm mx-auto">
                        No proceeding uploads match your search criteria. Upload an Excel file or clear filters.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs min-w-[1000px]">
                          <thead className="bg-[#FAFAF8] border-b border-[#E4E1D8] text-[#52607D] uppercase font-semibold">
                            <tr>
                              <th className="py-2.5 px-3">Proceeding No</th>
                              <th className="py-2.5 px-3">Proceeding Date</th>
                              <th className="py-2.5 px-3">Release Tranche</th>
                              <th className="py-2.5 px-3 text-right">Total Proceeding Value</th>
                              <th className="py-2.5 px-3 text-right">Dealer Commission</th>
                              <th className="py-2.5 px-3 text-right text-[#7C3AED]">Fittings (5%)</th>
                              <th className="py-2.5 px-3 text-center">Bank Payment Received</th>
                              <th className="py-2.5 px-3 text-center">Dealer Payout</th>
                              <th className="py-2.5 px-3 text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#EDEAE1]">
                            {batches.map((b) => (
                              <tr key={b.id} className="hover:bg-[#FAFAF8] transition-colors">
                                <td className="py-3 px-3">
                                  <Link
                                    to={`/commissions/${b.id}`}
                                    className="font-bold text-[#2F6F5E] hover:underline font-mono text-xs flex items-center gap-1.5"
                                  >
                                    <span>#{b.proceeding_no}</span>
                                  </Link>
                                  <div className="text-[10px] text-[#52607D] mt-0.5">
                                    {b.projects?.length || 0} Projects recorded
                                  </div>
                                </td>

                                <td className="py-3 px-3 font-mono font-medium text-[#14213D]">
                                  {formatDate(b.proceeding_date)}
                                </td>

                                <td className="py-3 px-3">
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className={`px-2 py-0.5 rounded-full font-bold font-mono text-[11px] ${
                                        b.fund_percentage_value === 40
                                          ? "bg-indigo-50 text-indigo-800 border border-indigo-200"
                                          : b.fund_percentage_value === 45
                                          ? "bg-blue-50 text-blue-800 border border-blue-200"
                                          : "bg-emerald-50 text-[#2F6F5E] border border-emerald-200"
                                      }`}
                                    >
                                      {b.fund_percentage_value}% Fund
                                    </span>
                                  </div>
                                </td>

                                <td className="py-3 px-3 text-right font-mono font-bold text-[#14213D]">
                                  {formatRupees(b.total_proceeding_amount)}
                                </td>

                                <td className="py-3 px-3 text-right font-mono font-bold text-[#2F6F5E]">
                                  {formatRupees(b.total_calculated_commission)}
                                </td>

                                <td className="py-3 px-3 text-right font-mono text-[#7C3AED] font-semibold">
                                  {b.include_fittings ? formatRupees(b.total_calculated_fittings) : "—"}
                                </td>

                                <td className="py-3 px-3 text-center">
                                  {b.payment_received_date ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                                      ✓ Received ({formatDate(b.payment_received_date)})
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveBatchForBank(b);
                                        setBankReceiptDate(new Date().toISOString().split("T")[0]);
                                        setBankReceiptRef("");
                                        setBankReceiptModalOpen(true);
                                      }}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold hover:bg-amber-100 transition-colors cursor-pointer"
                                      title="Click to record bank receipt date"
                                    >
                                      <Clock size={10} />
                                      <span>Mark Received</span>
                                    </button>
                                  )}
                                </td>

                                <td className="py-3 px-3 text-center">
                                  {b.dealer_payout_status === "PAID" ? (
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                                      ✓ Disbursed
                                    </span>
                                  ) : b.dealer_payout_status === "PARTIAL" ? (
                                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-bold">
                                      Partial
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200 text-[10px] font-bold">
                                      Pending
                                    </span>
                                  )}
                                </td>

                                <td className="py-3 px-3 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <Button
                                      size="xs"
                                      variant="secondary"
                                      icon={Eye}
                                      onClick={() => navigate(`/commissions/${b.id}`)}
                                      title="View dealer-wise breakdown & projects"
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
              </div>
            ) : (
              /* ========================================================================= */
              /* VIEW 2B: DEALER-WISE COMMISSION STATEMENTS & PROJECT LEDGER             */
              /* ========================================================================= */
              <div className="space-y-6">
                {/* Dealer Statement KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-5 shadow-[0_1px_2px_rgba(20,33,61,0.04)] space-y-1">
                    <div className="flex items-center justify-between text-[#52607D] text-xs font-semibold">
                      <span>Total Assigned Projects</span>
                      <Users size={16} className="text-[#2F6F5E]" />
                    </div>
                    <div className="text-xl font-bold text-[#14213D] font-mono mt-1">
                      {statementSummary.total_projects} Projects
                    </div>
                    <div className="text-[11px] text-[#52607D]">
                      Gross Subsidy: {formatRupees(statementSummary.total_subsidy_amount)}
                    </div>
                  </div>

                  <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-5 shadow-[0_1px_2px_rgba(20,33,61,0.04)] space-y-1">
                    <div className="flex items-center justify-between text-[#52607D] text-xs font-semibold">
                      <span>Total Released Tranche</span>
                      <FileSpreadsheet size={16} className="text-[#2F6F5E]" />
                    </div>
                    <div className="text-xl font-bold text-[#2F6F5E] font-mono mt-1">
                      {formatRupees(statementSummary.total_now_released)}
                    </div>
                    <div className="text-[11px] text-[#52607D]">
                      Material Cost: {formatRupees(statementSummary.total_material_cost)}
                    </div>
                  </div>

                  <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-5 shadow-[0_1px_2px_rgba(20,33,61,0.04)] space-y-1">
                    <div className="flex items-center justify-between text-[#52607D] text-xs font-semibold">
                      <span>Base Commission & Fittings</span>
                      <IndianRupee size={16} className="text-[#2F6F5E]" />
                    </div>
                    <div className="text-xl font-bold text-[#2F6F5E] font-mono mt-1">
                      {formatRupees(statementSummary.total_commission)}
                    </div>
                    <div className="text-[11px] text-[#7C3AED] font-medium">
                      + {formatRupees(statementSummary.total_fittings)} (5% Fittings)
                    </div>
                  </div>

                  <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-5 shadow-[0_1px_2px_rgba(20,33,61,0.04)] space-y-1">
                    <div className="flex items-center justify-between text-[#52607D] text-xs font-semibold">
                      <span>Net Dealer Payout</span>
                      <CheckCircle2 size={16} className="text-emerald-700" />
                    </div>
                    <div className="text-xl font-bold text-emerald-800 font-mono mt-1">
                      {formatRupees(statementSummary.total_net_payable)}
                    </div>
                    <div className="text-[11px] text-[#52607D] flex items-center gap-2">
                      <span className="text-emerald-700 font-bold">Paid: {formatRupees(statementSummary.total_paid_amount)}</span>
                      <span>·</span>
                      <span className="text-amber-700 font-bold">Pending: {formatRupees(statementSummary.total_pending_amount)}</span>
                    </div>
                  </div>
                </div>

                {/* Filter Controls for Dealer Statement */}
                <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-4 shadow-[0_1px_2px_rgba(20,33,61,0.04)] space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
                    {/* Dealer Dropdown */}
                    <div className="lg:col-span-3">
                      <CustomSelect
                        options={[
                          { value: "", label: "All Assigned Dealers" },
                          ...dealers.map((d) => ({
                            value: d.id,
                            label: d.name,
                          })),
                        ]}
                        value={selectedDealer}
                        onChange={(val) => setSelectedDealer(val)}
                        placeholder="Select Dealer"
                        size="sm"
                      />
                    </div>

                    {/* Date Range: From */}
                    <div className="relative lg:col-span-2">
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-mono bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
                        title="Filter from Proceeding Date"
                      />
                    </div>

                    {/* Date Range: To */}
                    <div className="relative lg:col-span-2">
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-mono bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
                        title="Filter to Proceeding Date"
                      />
                    </div>

                    {/* Payout Status */}
                    <div className="lg:col-span-2">
                      <CustomSelect
                        options={[
                          { value: "", label: "All Payout Statuses" },
                          { value: "PAID", label: "Paid" },
                          { value: "PENDING", label: "Pending / Unpaid" },
                        ]}
                        value={payoutStatus}
                        onChange={(val) => setPayoutStatus(val)}
                        placeholder="Payout Status"
                        size="sm"
                      />
                    </div>

                    {/* Search Input */}
                    <div className="relative lg:col-span-2">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#52607D]" />
                      <input
                        type="text"
                        placeholder="Search App ID / Farmer / Batch..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 text-xs bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
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

                {/* Dealer Statement Line Items Table */}
                <div className="bg-white border border-[#E4E1D8] rounded-[10px] shadow-[0_1px_2px_rgba(20,33,61,0.04)] overflow-hidden">
                  <div className="p-4 border-b border-[#E4E1D8] flex items-center justify-between gap-3 flex-wrap bg-[#FAFAF8]">
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-[#2F6F5E]" />
                      <span className="text-xs font-bold text-[#14213D]">
                        Project Commission Line Items ({statementSummary.total_projects})
                      </span>
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      icon={Download}
                      onClick={handleExportDealerPDF}
                      disabled={statementProjects.length === 0}
                      title="Download Dealer Commission Statement PDF"
                    >
                      Download PDF Statement
                    </Button>
                  </div>

                  {statementLoading ? (
                    <div className="p-6">
                      <SkeletonLoader rows={6} />
                    </div>
                  ) : statementProjects.length === 0 ? (
                    <div className="p-12 text-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-[#FAFAF8] border border-[#E4E1D8] flex items-center justify-center mx-auto text-[#52607D]">
                        <Users size={24} />
                      </div>
                      <div className="text-sm font-bold text-[#14213D]">No Projects Found</div>
                      <p className="text-xs text-[#52607D] max-w-sm mx-auto">
                        No projects matched your selected dealer or date filters. Try changing or clearing your filters.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs min-w-[1350px]">
                          <thead className="bg-[#FAFAF8] border-b border-[#E4E1D8] text-[#52607D] uppercase font-semibold text-[11px]">
                            <tr>
                              <th className="py-2.5 px-3 w-10 text-center">#</th>
                              <th className="py-2.5 px-3">Proceeding & Date</th>
                              <th className="py-2.5 px-3">Application ID & Invoice</th>
                              <th className="py-2.5 px-3">Farmer & Location</th>
                              <th className="py-2.5 px-3">Dealer</th>
                              <th className="py-2.5 px-3 text-right">Invoice Amount</th>
                              <th className="py-2.5 px-3 text-right">Subsidy Eligible</th>
                              <th className="py-2.5 px-3 text-right">Total Material Cost</th>
                              <th className="py-2.5 px-3 text-right font-bold text-[#2F6F5E]">Now Released</th>
                              <th className="py-2.5 px-3">Delay</th>
                              <th className="py-2.5 px-3 text-right font-bold text-[#2F6F5E]">Commission</th>
                              <th className="py-2.5 px-3 text-right text-rose-600">Penalty</th>
                              <th className="py-2.5 px-3 text-right font-bold text-[#14213D]">Net Commission</th>
                              <th className="py-2.5 px-3 text-right text-[#7C3AED]">Fittings (5%)</th>
                              <th className="py-2.5 px-3 text-right font-bold text-emerald-800">Net Payout</th>
                              <th className="py-2.5 px-3 text-center">Payout Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#EDEAE1]">
                            {statementProjects.map((p, idx) => {
                              const invAmt = Math.floor(parseFloat(p.invoice_amount || 0));
                              const subAmt = Math.floor(parseFloat(p.subsidy_amount || p.state_restricted_amount || 0));
                              const matCost = Math.floor(parseFloat(p.total_material_cost || 0));
                              const nowRel = Math.floor(parseFloat(p.now_to_be_released_amount || p.fund_share_amount || 0));
                              const commAmt = Math.floor(parseFloat(p.commission_amount || 0));
                              const fitAmt = Math.floor(parseFloat(p.fittings_amount || 0));
                              const penAmt = Math.floor(
                                parseFloat(
                                  p.adjusted_penalty_amount !== undefined && p.adjusted_penalty_amount !== null
                                    ? p.adjusted_penalty_amount
                                    : p.penalty_amount || 0
                                )
                              );
                              const netComm = Math.max(0, commAmt - penAmt);
                              const netPayout = Math.max(0, netComm + fitAmt);

                              const isFirstFund = (p.batch?.fund_percentage_value || 55) >= 50.0;
                              const startLabel = isFirstFund ? "Inv Date" : "1st Fund Credited";
                              const endLabel = isFirstFund ? "Work Completion" : "Joint Verification";

                              return (
                                <tr key={p.id} className="hover:bg-[#FAFAF8] transition-colors">
                                  <td className="py-3 px-3 text-center font-mono text-[#8C97AB] font-medium">
                                    {(statementPagination.page - 1) * statementPagination.limit + idx + 1}
                                  </td>

                                  <td className="py-3 px-3">
                                    <Link
                                      to={`/commissions/${p.proceeding_batch_id}`}
                                      className="font-bold text-[#2F6F5E] hover:underline font-mono text-xs block"
                                    >
                                      #{p.batch?.proceeding_no || "—"}
                                    </Link>
                                    <div className="text-[10px] text-[#52607D] flex items-center gap-1.5 mt-0.5">
                                      <span>{formatDate(p.batch?.proceeding_date)}</span>
                                      <span>·</span>
                                      <span className="font-semibold text-indigo-700 font-mono">
                                        {p.batch?.fund_percentage_value || "—"}% Fund
                                      </span>
                                    </div>
                                  </td>

                                  <td className="py-3 px-3">
                                    <div className="font-mono font-bold text-[#14213D] text-xs">
                                      {p.application_id}
                                    </div>
                                    {p.invoice_number && p.invoice_number !== "—" && (
                                      <div className="mt-1">
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono font-bold text-[10px]">
                                          Inv No: #{p.invoice_number}
                                        </span>
                                      </div>
                                    )}
                                  </td>

                                  <td className="py-3 px-3">
                                    <div className="font-bold text-[#14213D] text-xs">{p.farmer_name || "—"}</div>
                                    <div className="text-[10px] text-[#52607D]">
                                      {[p.village, p.district].filter(Boolean).join(", ") || "—"}
                                    </div>
                                  </td>

                                  <td className="py-3 px-3 font-semibold text-[#14213D]">
                                    {p.dealer?.name || "Unassigned"}
                                  </td>

                                  <td className="py-3 px-3 text-right font-mono text-[#52607D]">
                                    {invAmt ? formatRupees(invAmt) : "—"}
                                  </td>

                                  <td className="py-3 px-3 text-right font-mono font-medium text-[#14213D]">
                                    {subAmt ? formatRupees(subAmt) : "—"}
                                  </td>

                                  <td className="py-3 px-3 text-right font-mono font-medium text-[#14213D]">
                                    <div>{matCost ? formatRupees(matCost) : "—"}</div>
                                    <span className="text-[9px] text-[#8C97AB] block font-mono">
                                      GST: {p.gst_percentage || 12}%
                                    </span>
                                  </td>

                                  <td className="py-3 px-3 text-right font-mono font-bold text-[#2F6F5E]">
                                    <div>{nowRel ? formatRupees(nowRel) : "—"}</div>
                                    <span className="text-[9px] text-[#8C97AB] block font-mono">
                                      GST: {p.gst_percentage || 12}%
                                    </span>
                                  </td>

                                  <td className="py-3 px-3 text-[11px] space-y-0.5 min-w-[170px]">
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

                                  <td className="py-3 px-3 text-right font-mono font-bold text-[#2F6F5E]">
                                    {formatRupees(commAmt)}
                                  </td>

                                  <td className="py-3 px-3 text-right font-mono">
                                    {penAmt > 0 ? (
                                      <span className="text-rose-600 font-bold">-{formatRupees(penAmt)}</span>
                                    ) : (
                                      <span className="text-[#8C97AB]">₹0</span>
                                    )}
                                  </td>

                                  <td className="py-3 px-3 text-right font-mono font-bold text-[#14213D]">
                                    {formatRupees(netComm)}
                                  </td>

                                  <td className="py-3 px-3 text-right font-mono text-[#7C3AED] font-semibold">
                                    {fitAmt > 0 ? formatRupees(fitAmt) : "—"}
                                  </td>

                                  <td className="py-3 px-3 text-right font-mono font-bold text-emerald-800 text-sm">
                                    {formatRupees(netPayout)}
                                  </td>

                                  <td className="py-3 px-3 text-center">
                                    {p.is_paid_to_dealer ? (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                                        ✓ Paid ({formatDate(p.dealer_paid_date)})
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                                        Pending
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {statementProjects.length > 0 && (
                        <div className="p-4 border-t border-[#E4E1D8]">
                          <Pagination
                            currentPage={statementPagination.page}
                            totalPages={statementPagination.totalPages}
                            onPageChange={(p) => fetchDealerStatement(p)}
                            totalItems={statementPagination.total}
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal: Preview Penalty Adjustment */}
      <Modal
        isOpen={previewPenaltyModalOpen}
        onClose={() => setPreviewPenaltyModalOpen(false)}
        title="Adjust Delay Penalty for Project"
      >
        <form onSubmit={handleSavePreviewPenalty} className="space-y-4">
          <div className="p-3 bg-[#FAFAF8] rounded-[8px] border border-[#EDEAE1] space-y-1 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-[#52607D]">Application ID:</span>
              <strong className="text-[#14213D]">{previewPenaltyRow?.application_id}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#52607D]">Milestone Delay:</span>
              <strong className="text-amber-800">
                {previewPenaltyRow?.delay_days || 0} days ({previewPenaltyRow?.penalty_percentage || 0}%)
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#52607D]">Calculated Commission:</span>
              <strong className="text-[#2F6F5E]">{formatRupees(previewPenaltyRow?.commission_amount)}</strong>
            </div>
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
                value={previewPenaltyInput}
                onChange={(e) => setPreviewPenaltyInput(e.target.value)}
                className="w-full pl-7 pr-3 py-2 text-xs font-mono font-bold bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-[#EDEAE1]">
            <Button variant="secondary" type="button" onClick={() => setPreviewPenaltyModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" icon={CheckCircle2}>
              Save Penalty
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Record Payment Received Date */}
      <Modal
        isOpen={bankReceiptModalOpen}
        onClose={() => setBankReceiptModalOpen(false)}
        title="Record Payment Received Date"
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
              Confirm Payment Received
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Delete Proceeding Confirmation */}
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
            <strong className="text-[#14213D]">{formatDate(batchToDelete?.proceeding_date)}</strong> (#{batchToDelete?.proceeding_no})? This will remove all calculated dealer commissions and linked project records for this batch.
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
