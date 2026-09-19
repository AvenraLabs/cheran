import React, { useState, useEffect } from "react";
import {
  ClipboardList,
  CalendarDays,
  Download,
  Share2,
  RefreshCw,
  Package,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { plastApi } from "../../api/plastApi.js";
import Navbar from "../../components/layout/Navbar.jsx";
import Button from "../../components/common/Button.jsx";
import { SkeletonLoader, EmptyState } from "../../components/common/SkeletonLoader.jsx";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const todayStr = () => new Date().toISOString().split("T")[0];

const formatDate = (d) =>
  new Date(d + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

const formatQty = (val) => {
  const n = Number(val || 0);
  return n % 1 === 0 ? String(Math.round(n)) : n.toFixed(2);
};

export function PlastDispatchPage() {
  const [date, setDate] = useState(todayStr());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const fetchReport = async () => {
    if (!date) {
      toast.error("Please select a date");
      return;
    }
    setLoading(true);
    setReport(null);
    try {
      const data = await plastApi.getDailyDispatchReport(date);
      setReport(data);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  // ── PDF Export ──────────────────────────────────────────────────────────────
  const handleDownloadPdf = () => {
    if (!report) return;
    setExportingPdf(true);
    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header band
      doc.setFillColor(47, 111, 94);
      doc.rect(0, 0, pageWidth, 30, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.text("CHERAN PLAST", 14, 12);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(210, 230, 225);
      doc.text("PVC & Polymer Pipes Manufacturing Division", 14, 18);
      doc.text("Daily Dispatch / Billing Report", 14, 24);

      // Date on right
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text(formatDate(report.date), pageWidth - 14, 16, { align: "right" });

      // Summary sub-header
      doc.setFillColor(240, 246, 244);
      doc.rect(0, 30, pageWidth, 14, "F");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(47, 111, 94);
      doc.text(
        `Total Bills: ${report.total_bills}   |   Total Item Types: ${report.total_items}`,
        14,
        39
      );

      // Table
      const tableRows = (report.items || []).map((row, idx) => [
        idx + 1,
        row.item_name,
        `${formatQty(row.total_qty)}${row.unit ? "  " + row.unit : ""}`,
      ]);

      autoTable(doc, {
        startY: 48,
        head: [["#", "Item / Product Name", "Total Qty Dispatched"]],
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
          0: { cellWidth: 12, halign: "center" },
          1: { cellWidth: "auto" },
          2: { cellWidth: 52, halign: "right", fontStyle: "bold" },
        },
        styles: {
          fontSize: 9,
          cellPadding: 2.8,
          textColor: [20, 33, 61],
        },
        alternateRowStyles: { fillColor: [247, 250, 248] },
      });

      // Footer note
      doc.setFont("helvetica", "italic");
      doc.setFontSize(7.5);
      doc.setTextColor(150, 160, 175);
      doc.text(
        "This is a computer-generated daily dispatch report. Cheran Plast.",
        pageWidth / 2,
        287,
        { align: "center" }
      );

      doc.save(`Cheran_Plast_Dispatch_${report.date}.pdf`);
      toast.success("Dispatch report PDF downloaded");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF");
    } finally {
      setExportingPdf(false);
    }
  };

  // ── WhatsApp Share ───────────────────────────────────────────────────────────
  const handleWhatsApp = () => {
    if (!report) return;

    const lines = (report.items || [])
      .map((row, i) => `${i + 1}. ${row.item_name} — *${formatQty(row.total_qty)}${row.unit ? " " + row.unit : ""}*`)
      .join("\n");

    const msg =
      `📦 *CHERAN PLAST — DAILY DISPATCH REPORT*\n` +
      `📅 *Date: ${formatDate(report.date)}*\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `${lines}\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `🧾 *Total Bills: ${report.total_bills}*   |   *Items: ${report.total_items}*\n\n` +
      `Cheran Plast`;

    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const hasData = report && report.items && report.items.length > 0;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Navbar
        title="Daily Dispatch Report"
        subtitle="View total items billed / dispatched for any date — share with factory workers"
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-5 flex-1 overflow-y-auto w-full">
        {/* Date Picker Card */}
        <div className="bg-white rounded-[10px] border border-[#E4E1D8] shadow-[0_1px_2px_rgba(20,33,61,0.04)] p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-[#14213D] mb-1.5">
                <CalendarDays size={12} className="inline mr-1.5 text-[#2F6F5E]" />
                Select Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full sm:w-64 px-3 py-2 text-sm bg-white border border-[#E4E1D8] rounded-[7px] text-[#14213D] font-mono focus:outline-none focus:border-[#2F6F5E] focus:ring-2 focus:ring-[#2F6F5E]/10"
              />
            </div>
            <Button
              variant="primary"
              size="sm"
              icon={loading ? RefreshCw : ClipboardList}
              loading={loading}
              onClick={fetchReport}
            >
              {loading ? "Loading..." : "Generate Report"}
            </Button>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="bg-white rounded-[10px] border border-[#E4E1D8] p-6">
            <SkeletonLoader count={6} />
          </div>
        ) : report && report.items.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No bills on this date"
            description={`No sales were recorded on ${formatDate(date)}. Try a different date.`}
          />
        ) : hasData ? (
          <div className="bg-white rounded-[10px] border border-[#E4E1D8] shadow-[0_1px_2px_rgba(20,33,61,0.04)] overflow-hidden">
            {/* Report Header */}
            <div className="bg-[#2F6F5E] px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="text-white font-bold text-base flex items-center gap-2">
                  <ClipboardList size={16} />
                  {formatDate(report.date)}
                </div>
                <div className="text-[#A8D4C8] text-xs mt-0.5">
                  {report.total_bills} bill{report.total_bills !== 1 ? "s" : ""} &nbsp;&middot;&nbsp; {report.total_items} item type{report.total_items !== 1 ? "s" : ""}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={handleWhatsApp}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] text-xs font-semibold bg-[#25D366] text-white hover:bg-[#1fb558] transition-colors shadow-sm"
                >
                  <Share2 size={13} />
                  Share on WhatsApp
                </button>
                <button
                  onClick={handleDownloadPdf}
                  disabled={exportingPdf}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] text-xs font-semibold bg-white/15 text-white hover:bg-white/25 transition-colors border border-white/30"
                >
                  <Download size={13} />
                  {exportingPdf ? "Downloading..." : "Download PDF"}
                </button>
              </div>
            </div>

            {/* Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] border-b border-[#EDEAE1] text-[#52607D] font-semibold">
                  <tr>
                    <th className="py-3 px-4 w-10 text-center">#</th>
                    <th className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <Package size={11} />
                        Item / Product Name
                      </div>
                    </th>
                    <th className="py-3 px-4 text-right">Total Qty Dispatched</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDEAE1]">
                  {report.items.map((row, idx) => (
                    <tr key={row.item_id} className="hover:bg-[#FAFAF8] transition-colors">
                      <td className="py-3 px-4 text-center text-[#8C97AB] font-mono">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#14213D]">{row.item_name}</div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-mono font-bold text-[#2F6F5E] text-sm">
                          {formatQty(row.total_qty)}
                        </span>
                        {row.unit && (
                          <span className="ml-1.5 text-[10px] font-semibold text-[#8C97AB] bg-[#F0F4F2] px-1.5 py-0.5 rounded">
                            {row.unit}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-[#F0F7F4] border-t-2 border-[#2F6F5E]/20">
                    <td className="py-3 px-4" />
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-[#2F6F5E] font-bold text-xs">
                        <CheckCircle2 size={13} />
                        {report.total_items} item type{report.total_items !== 1 ? "s" : ""} dispatched
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right text-[10px] text-[#52607D]">
                      across {report.total_bills} bill{report.total_bills !== 1 ? "s" : ""}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ) : null}

        {/* Initial prompt */}
        {!report && !loading && (
          <div className="text-center py-12 text-[#8C97AB]">
            <ClipboardList size={40} className="mx-auto mb-3 opacity-30" />
            <div className="text-sm font-medium">Select a date and click Generate Report</div>
            <div className="text-xs mt-1">All items billed that day will be totalled and shown here</div>
          </div>
        )}
      </main>
    </div>
  );
}

export default PlastDispatchPage;
