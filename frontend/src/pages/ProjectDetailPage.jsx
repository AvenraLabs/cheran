import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  User,
  MapPin,
  Sprout,
  IndianRupee,
  History,
  FileCheck2,
  Clock,
  Calendar,
  CheckCircle,
  Award,
  AlertTriangle,
  CreditCard,
  Check,
  Percent,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import api from "../api/client.js";
import Navbar from "../components/layout/Navbar.jsx";
import StatusBadge from "../components/common/StatusBadge.jsx";
import Button from "../components/common/Button.jsx";
import Modal from "../components/common/Modal.jsx";
import { SkeletonLoader } from "../components/common/SkeletonLoader.jsx";

export function ProjectDetailPage() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [dispatchedMaterials, setDispatchedMaterials] = useState([]);
  const [commissionData, setCommissionData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Commission Payment Modal State
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [activeMilestone, setActiveMilestone] = useState("PART1");
  const [payDate, setPayDate] = useState(new Date().toISOString().split("T")[0]);
  const [payRef, setPayRef] = useState("");
  const [payNotes, setPayNotes] = useState("");
  const [savingPayment, setSavingPayment] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const loadProjectDetails = async () => {
    try {
      setLoading(true);
      const [projRes, histRes, invRes, commRes] = await Promise.all([
        api.get(`/government/projects/${id}`),
        api.get(`/government/projects/${id}/status-history`),
        api.get(`/government/projects/${id}/invoices`).catch(() => ({ data: { invoices: [], dispatchedMaterials: [] } })),
        api.get(`/government/projects/${id}/commission`).catch(() => ({ data: null })),
      ]);
      setProject(projRes.data?.project);
      setHistoryData(histRes.data?.history || []);
      setInvoices(invRes.data?.invoices || []);
      setDispatchedMaterials(invRes.data?.dispatchedMaterials || []);
      setCommissionData(commRes?.data || commRes || null);
    } catch (err) {
      console.error("Failed to load project details:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayout = async (e) => {
    e.preventDefault();
    try {
      setSavingPayment(true);
      await api.post(`/government/projects/${id}/commission/payout`, {
        milestone: activeMilestone,
        paid_date: payDate,
        paid_ref: payRef.trim() || "NEFT / Direct Bank Transfer",
        notes: payNotes.trim() || null,
      });
      setPayModalOpen(false);
      setPayRef("");
      setPayNotes("");
      loadProjectDetails();
    } catch (err) {
      console.error("Failed to record milestone payment:", err);
    } finally {
      setSavingPayment(false);
    }
  };

  useEffect(() => {
    loadProjectDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col">
        <Navbar title="Project Details" />
        <div className="p-8">
          <SkeletonLoader rows={10} />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex-1 flex flex-col p-8 text-center">
        <p className="text-sm text-[#52607D]">Project record not found.</p>
        <Link to="/projects" className="mt-4">
          <Button variant="secondary" icon={ArrowLeft}>
            Back to Projects
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Navbar
        title={`Application ${project.application_id}`}
        subtitle={`Farmer: ${project.farmer_name || "N/A"} · District: ${project.district || "N/A"}`}
        actions={
          <Link to="/projects">
            <Button variant="secondary" icon={ArrowLeft}>
              Back to List
            </Button>
          </Link>
        }
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 overflow-y-auto">
        {/* Top Status Header Card */}
        <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-6 shadow-[0_1px_2px_rgba(20,33,61,0.04)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-semibold uppercase text-[#52607D]">
              Current Government Status
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={project.current_status} size="lg" />
              {project.current_status_date && (
                <span className="text-xs text-[#52607D]">
                  Updated on: <strong className="text-[#14213D]">{project.current_status_date}</strong>
                </span>
              )}
            </div>
          </div>

          <div className="text-right sm:border-l sm:border-[#EDEAE1] sm:pl-6 space-y-1">
            <div className="text-xs font-semibold uppercase text-[#52607D]">Assigned Dealer</div>
            <div className="text-sm font-bold text-[#14213D]">
              {project.dealer?.name || "Unassigned"}
            </div>
          </div>
        </div>

        {/* 4-Grid Project Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Farmer & Location */}
          <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-6 shadow-[0_1px_2px_rgba(20,33,61,0.04)] space-y-4">
            <div className="flex items-center gap-2 border-b border-[#EDEAE1] pb-3">
              <User size={18} className="text-[#2F6F5E]" />
              <h2 className="text-sm font-bold font-display text-[#14213D]">Farmer & Location</h2>
            </div>
            <div className="grid grid-cols-2 gap-y-3 text-xs">
              <div>
                <span className="text-[#52607D]">Farmer Name:</span>
                <p className="font-semibold text-[#14213D]">{project.farmer_name || "—"}</p>
              </div>
              <div>
                <span className="text-[#52607D]">Father / Husband Name:</span>
                <p className="font-semibold text-[#14213D]">{project.father_name || "—"}</p>
              </div>
              <div>
                <span className="text-[#52607D]">Mobile Number:</span>
                <p className="font-semibold text-[#14213D]">{project.mobile || "—"}</p>
              </div>
              <div>
                <span className="text-[#52607D]">Gender / Caste:</span>
                <p className="font-semibold text-[#14213D]">
                  {[project.gender, project.caste].filter(Boolean).join(" / ") || "—"}
                </p>
              </div>
              <div>
                <span className="text-[#52607D]">District / Block:</span>
                <p className="font-semibold text-[#14213D]">
                  {[project.district, project.block].filter(Boolean).join(" / ") || "—"}
                </p>
              </div>
              <div>
                <span className="text-[#52607D]">Village:</span>
                <p className="font-semibold text-[#14213D]">{project.village || "—"}</p>
              </div>
              <div className="col-span-2">
                <span className="text-[#52607D]">Survey No / Subdivision No:</span>
                <p className="font-semibold text-[#14213D]">
                  {project.survey_no_subdivision_no || "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Crop & Technical Specs */}
          <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-6 shadow-[0_1px_2px_rgba(20,33,61,0.04)] space-y-4">
            <div className="flex items-center gap-2 border-b border-[#EDEAE1] pb-3">
              <Sprout size={18} className="text-[#2F6F5E]" />
              <h2 className="text-sm font-bold font-display text-[#14213D]">Crop & Irrigation System</h2>
            </div>
            <div className="grid grid-cols-2 gap-y-3 text-xs">
              <div>
                <span className="text-[#52607D]">Crop & Spacing:</span>
                <p className="font-semibold text-[#14213D]">
                  {[project.crop, project.spacing].filter(Boolean).join(" - ") || "—"}
                </p>
              </div>
              <div>
                <span className="text-[#52607D]">Total / Applied Area:</span>
                <p className="font-semibold text-[#14213D]">
                  {project.total_area_ha || "0"} Ha / {project.applied_area_ha || "0"} Ha
                </p>
              </div>
              <div>
                <span className="text-[#52607D]">Department & Scheme:</span>
                <p className="font-semibold text-[#14213D]">
                  {[project.department, project.scheme].filter(Boolean).join(" / ") || "—"}
                </p>
              </div>
              <div>
                <span className="text-[#52607D]">Irrigation Type:</span>
                <p className="font-semibold text-[#14213D]">{project.irrigation_type || "—"}</p>
              </div>
              <div>
                <span className="text-[#52607D]">MI Company:</span>
                <p className="font-semibold text-[#14213D]">{project.mi_company || "—"}</p>
              </div>
              <div>
                <span className="text-[#52607D]">MI Reference No:</span>
                <p className="font-semibold text-[#14213D]">{project.mi_reference_no || "—"}</p>
              </div>
            </div>
          </div>

          {/* Card 3: Financials & Quotation */}
          <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-6 shadow-[0_1px_2px_rgba(20,33,61,0.04)] space-y-4">
            <div className="flex items-center gap-2 border-b border-[#EDEAE1] pb-3">
              <IndianRupee size={18} className="text-[#2F6F5E]" />
              <h2 className="text-sm font-bold font-display text-[#14213D]">Financial Quotation & Invoicing</h2>
            </div>
            <div className="grid grid-cols-2 gap-y-3 text-xs">
              <div>
                <span className="text-[#52607D]">Quotation Subsidy:</span>
                <p className="font-semibold text-[#14213D]">
                  {project.quotation_subsidy_amount ? `₹${parseFloat(project.quotation_subsidy_amount).toLocaleString("en-IN")}` : "—"}
                </p>
              </div>
              <div>
                <span className="text-[#52607D]">Farmer Contribution:</span>
                <p className="font-semibold text-[#14213D]">
                  {project.farmer_contribution ? `₹${parseFloat(project.farmer_contribution).toLocaleString("en-IN")}` : "—"}
                </p>
              </div>
              <div>
                <span className="text-[#52607D]">Invoice Amount:</span>
                <p className="font-semibold text-[#2F6F5E]">
                  {project.invoice_amount ? `₹${parseFloat(project.invoice_amount).toLocaleString("en-IN")}` : "—"}
                </p>
              </div>
              <div>
                <span className="text-[#52607D]">Invoice Date:</span>
                <p className="font-semibold text-[#14213D]">{project.invoice_date || "—"}</p>
              </div>
              <div>
                <span className="text-[#52607D]">Work Order No & Date:</span>
                <p className="font-semibold text-[#14213D]">
                  {[project.work_order_no, project.work_order_date].filter(Boolean).join(" (") +
                    (project.work_order_date ? ")" : "") || "—"}
                </p>
              </div>
              <div>
                <span className="text-[#52607D]">Supply Date:</span>
                <p className="font-semibold text-[#14213D]">{project.supply_date || "—"}</p>
              </div>
            </div>
          </div>

          {/* Card 4: Fund Releases */}
          <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-6 shadow-[0_1px_2px_rgba(20,33,61,0.04)] space-y-4">
            <div className="flex items-center gap-2 border-b border-[#EDEAE1] pb-3">
              <FileCheck2 size={18} className="text-[#2F6F5E]" />
              <h2 className="text-sm font-bold font-display text-[#14213D]">Fund Release Milestones</h2>
            </div>
            <div className="grid grid-cols-2 gap-y-3 text-xs">
              <div>
                <span className="text-[#52607D]">First Fund Amount:</span>
                <p className="font-semibold text-[#14213D]">
                  {project.first_fund_amount ? `₹${parseFloat(project.first_fund_amount).toLocaleString("en-IN")}` : "—"}
                </p>
              </div>
              <div>
                <span className="text-[#52607D]">1st UTR No & Date:</span>
                <p className="font-semibold text-[#14213D]">
                  {[project.first_fund_utr_no, project.first_fund_utr_date].filter(Boolean).join(" / ") || "—"}
                </p>
              </div>
              <div>
                <span className="text-[#52607D]">Second Fund Amount:</span>
                <p className="font-semibold text-[#14213D]">
                  {project.second_fund_amount ? `₹${parseFloat(project.second_fund_amount).toLocaleString("en-IN")}` : "—"}
                </p>
              </div>
              <div>
                <span className="text-[#52607D]">Final / Treasury UTR:</span>
                <p className="font-semibold text-[#14213D]">
                  {[project.final_fund_utr_no, project.treasury_fund_utr_no].filter(Boolean).join(" / ") || "—"}
                </p>
              </div>
              <div className="col-span-2 pt-2 border-t border-[#EDEAE1] flex items-center justify-between">
                <span className="text-xs font-semibold text-[#52607D]">Total Fund Released:</span>
                <span className="text-sm font-bold text-[#2F6F5E]">
                  {project.total_fund_released ? `₹${parseFloat(project.total_fund_released).toLocaleString("en-IN")}` : "₹0.00"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Dispatched Materials & Linked Invoices Card */}
        <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-6 shadow-[0_1px_2px_rgba(20,33,61,0.04)] space-y-4">
          <div className="flex items-center justify-between border-b border-[#EDEAE1] pb-3">
            <div className="flex items-center gap-2">
              <Sprout size={18} className="text-[#2F6F5E]" />
              <div>
                <h2 className="text-sm font-bold font-display text-[#14213D]">
                  Dispatched Materials & Invoices
                </h2>
                <p className="text-[11px] text-[#52607D]">
                  Actual materials dispatched and deducted from physical inventory for this project
                </p>
              </div>
            </div>
            <Link to="/sales">
              <Button size="xs" variant="outline">
                New Invoice
              </Button>
            </Link>
          </div>

          {invoices.length === 0 ? (
            <div className="py-6 text-center text-xs text-[#52607D]">
              No sales invoices linked to this Government Application ID yet.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary of Materials Invoiced */}
              <div>
                <h3 className="text-xs font-bold text-[#14213D] mb-2 uppercase tracking-wider text-[10px]">
                  Materials Invoiced to Project
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {dispatchedMaterials.map((mat, idx) => (
                    <div key={idx} className="p-3 bg-[#FAFAF8] border border-[#EDEAE1] rounded-[8px] flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#14213D]">{mat.item_name}</span>
                      <span className="font-mono font-bold text-[#2F6F5E]">
                        {(parseFloat(mat.total_quantity) || 0).toLocaleString("en-IN")} {mat.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Invoices List */}
              <div className="border border-[#EDEAE1] rounded-[8px] overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#EDEAE1] bg-[#FAFAF8] text-[#52607D] font-semibold">
                      <th className="py-2.5 px-3">Invoice #</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3 text-right">Items Net</th>
                      <th className="py-2.5 px-3 text-right">5% Fittings Cost</th>
                      <th className="py-2.5 px-3 text-right">Total Amount</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDEAE1] text-[#14213D] font-mono">
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-[#FAFAF8]">
                        <td className="py-2.5 px-3 font-bold text-[#2F6F5E]">#{inv.invoice_number}</td>
                        <td className="py-2.5 px-3 font-sans">{inv.invoice_date}</td>
                        <td className="py-2.5 px-3 text-right">
                          ₹{(parseFloat(inv.net_item_amount) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-right text-[#D97706]">
                          +₹{(parseFloat(inv.fittings_amount) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-[#14213D]">
                          ₹{(parseFloat(inv.total_amount) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-center font-sans">
                          <span
                            className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              inv.status === "POSTED" ? "bg-[#EAF3F0] text-[#2F6F5E]" : "bg-[#FDE8E8] text-[#C81E1E]"
                            }`}
                          >
                            {inv.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Dealer Commission & Milestone Payouts Card */}
        <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-6 shadow-[0_1px_2px_rgba(20,33,61,0.04)] space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EDEAE1] pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[8px] bg-[#EAF3F0] flex items-center justify-center text-[#2F6F5E]">
                <Award size={18} />
              </div>
              <div>
                <h2 className="text-sm font-bold font-display text-[#14213D]">
                  Dealer Commission & Milestone Payouts
                </h2>
                <p className="text-[11px] text-[#52607D]">
                  Calculated from Invoiced Items Net Amount · 2-Stage Lifecycle (55% 1st Fund UTR / 45% Final Fund UTR) · 45-day Aging Penalty Rule
                </p>
              </div>
            </div>

            {commissionData?.dealer ? (
              <span className="text-xs font-semibold text-[#14213D] bg-[#FAFAF8] border border-[#E4E1D8] px-3 py-1 rounded-full flex items-center gap-1.5 self-start sm:self-auto">
                <span className="text-[#52607D]">Assigned:</span>
                <strong>{commissionData.dealer.name}</strong>
              </span>
            ) : (
              <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full self-start sm:self-auto font-medium">
                No Dealer Assigned
              </span>
            )}
          </div>

          {!commissionData?.dealer ? (
            <div className="p-6 text-center bg-[#FAFAF8] border border-dashed border-[#E4E1D8] rounded-[8px] space-y-1">
              <p className="text-xs font-semibold text-[#14213D]">No Dealer Assigned to this Government Project</p>
              <p className="text-[11px] text-[#52607D]">
                Dealer commission and milestone payouts are strictly calculated based on the assigned dealer's commission percentage in the Dealer Master.
              </p>
            </div>
          ) : (
            <>
              {/* Overview KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3.5 bg-[#FAFAF8] border border-[#EDEAE1] rounded-[8px] space-y-1">
                  <div className="text-[11px] font-medium text-[#52607D]">Dealer Base Rate</div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-base font-bold text-[#14213D]">
                      {commissionData.base_percentage !== null && commissionData.base_percentage !== undefined
                        ? `${commissionData.base_percentage}%`
                        : "0.00%"}
                    </span>
                    <span className="text-[10px] text-[#8C97AB]">Configured Rate</span>
                  </div>
                </div>

                <div className="p-3.5 bg-[#FAFAF8] border border-[#EDEAE1] rounded-[8px] space-y-1">
                  <div className="text-[11px] font-medium text-[#52607D]">Aging Delay & Penalty</div>
                  <div className="flex items-baseline gap-1.5">
                    <span
                      className={`text-base font-bold ${
                        (commissionData?.penalty_percentage || 0) > 0 ? "text-rose-600" : "text-[#2F6F5E]"
                      }`}
                    >
                      {(commissionData?.penalty_percentage || 0) > 0
                        ? `-${commissionData.penalty_percentage}%`
                        : "0% Penalty"}
                    </span>
                    <span className="text-[10px] text-[#8C97AB]">
                      {commissionData?.breakdown?.phase1DelayDays || 0} days delay
                    </span>
                  </div>
                </div>

                <div className="p-3.5 bg-[#FAFAF8] border border-[#EDEAE1] rounded-[8px] space-y-1">
                  <div className="text-[11px] font-medium text-[#52607D]">Effective Commission Rate</div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-base font-bold text-[#2F6F5E]">
                      {commissionData?.effective_percentage !== null && commissionData?.effective_percentage !== undefined
                        ? `${commissionData.effective_percentage}%`
                        : "0.00%"}
                    </span>
                    <span className="text-[10px] text-[#8C97AB]">
                      on ₹{(commissionData?.base_amount || 0).toLocaleString("en-IN")} Net
                    </span>
                  </div>
                </div>

                <div className="p-3.5 bg-[#EAF3F0]/60 border border-[#2F6F5E]/20 rounded-[8px] space-y-1">
                  <div className="text-[11px] font-bold text-[#2F6F5E]">Total Commission Value</div>
                  <div className="text-base font-bold text-[#14213D] font-mono">
                    ₹{parseFloat(commissionData?.total_commission_amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* 2-Part Milestone Payout Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {/* Milestone 1: Part 1 (55%) */}
                <div className="p-4 bg-white border border-[#E4E1D8] rounded-[8px] space-y-3 relative shadow-2xs">
                  <div className="flex items-center justify-between border-b border-[#EDEAE1] pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#2F6F5E] text-white text-[11px] font-bold flex items-center justify-center">
                        1
                      </span>
                      <div>
                        <h3 className="text-xs font-bold text-[#14213D]">First Milestone (55%)</h3>
                        <p className="text-[10px] text-[#52607D]">Payout upon First Fund Release (UTR Updated)</p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        commissionData?.part1?.status === "PAID"
                          ? "bg-[#EAF3F0] text-[#2F6F5E] border border-[#2F6F5E]/20"
                          : commissionData?.part1?.status === "ELIGIBLE"
                          ? "bg-amber-50 text-amber-800 border border-amber-200"
                          : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}
                    >
                      {commissionData?.part1?.status === "PAID"
                        ? "✓ PAID"
                        : commissionData?.part1?.status === "ELIGIBLE"
                        ? "⚡ ELIGIBLE TO PAY"
                        : "🔒 LOCKED"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-[#52607D] uppercase font-semibold">Milestone Amount</div>
                      <div className="text-lg font-extrabold text-[#14213D] font-mono">
                        ₹{parseFloat(commissionData?.part1?.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </div>
                    </div>

                    {commissionData?.part1?.status === "ELIGIBLE" && (
                      <Button
                        size="xs"
                        variant="primary"
                        icon={CreditCard}
                        onClick={() => {
                          setActiveMilestone("PART1");
                          setPayRef("Direct Bank Transfer / NEFT");
                          setPayNotes("");
                          setPayModalOpen(true);
                        }}
                      >
                        Mark Part 1 Paid
                      </Button>
                    )}
                  </div>

                  {commissionData?.part1?.status === "PAID" ? (
                    <div className="text-[11px] bg-[#FAFAF8] p-2.5 rounded-[6px] border border-[#EDEAE1] text-[#52607D] space-y-0.5">
                      <div className="flex justify-between font-medium">
                        <span>Paid Date: <strong className="text-[#14213D]">{commissionData.part1.paid_date || "—"}</strong></span>
                        <span>Ref: <strong className="text-[#14213D]">{commissionData.part1.paid_ref || "—"}</strong></span>
                      </div>
                      {commissionData.part1.notes && (
                        <div className="text-[10px] italic">Notes: {commissionData.part1.notes}</div>
                      )}
                    </div>
                  ) : commissionData?.part1?.status === "LOCKED" ? (
                    <div className="text-[10px] text-[#8C97AB] bg-[#FAFAF8] p-2 rounded-[6px] border border-[#EDEAE1]">
                      Awaiting government status <strong>First Fund Credited (UTR Updated)</strong> to unlock payout.
                    </div>
                  ) : null}
                </div>

                {/* Milestone 2: Part 2 (45%) */}
                <div className="p-4 bg-white border border-[#E4E1D8] rounded-[8px] space-y-3 relative shadow-2xs">
                  <div className="flex items-center justify-between border-b border-[#EDEAE1] pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#14213D] text-white text-[11px] font-bold flex items-center justify-center">
                        2
                      </span>
                      <div>
                        <h3 className="text-xs font-bold text-[#14213D]">Final Milestone (45%)</h3>
                        <p className="text-[10px] text-[#52607D]">Payout upon Final Fund Release (UTR Updated)</p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        commissionData?.part2?.status === "PAID"
                          ? "bg-[#EAF3F0] text-[#2F6F5E] border border-[#2F6F5E]/20"
                          : commissionData?.part2?.status === "ELIGIBLE"
                          ? "bg-amber-50 text-amber-800 border border-amber-200"
                          : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}
                    >
                      {commissionData?.part2?.status === "PAID"
                        ? "✓ PAID"
                        : commissionData?.part2?.status === "ELIGIBLE"
                        ? "⚡ ELIGIBLE TO PAY"
                        : "🔒 LOCKED"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-[#52607D] uppercase font-semibold">Milestone Amount</div>
                      <div className="text-lg font-extrabold text-[#14213D] font-mono">
                        ₹{parseFloat(commissionData?.part2?.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </div>
                    </div>

                    {commissionData?.part2?.status === "ELIGIBLE" && (
                      <Button
                        size="xs"
                        variant="primary"
                        icon={CreditCard}
                        onClick={() => {
                          setActiveMilestone("PART2");
                          setPayRef("Direct Bank Transfer / NEFT");
                          setPayNotes("");
                          setPayModalOpen(true);
                        }}
                      >
                        Mark Part 2 Paid
                      </Button>
                    )}
                  </div>

                  {commissionData?.part2?.status === "PAID" ? (
                    <div className="text-[11px] bg-[#FAFAF8] p-2.5 rounded-[6px] border border-[#EDEAE1] text-[#52607D] space-y-0.5">
                      <div className="flex justify-between font-medium">
                        <span>Paid Date: <strong className="text-[#14213D]">{commissionData.part2.paid_date || "—"}</strong></span>
                        <span>Ref: <strong className="text-[#14213D]">{commissionData.part2.paid_ref || "—"}</strong></span>
                      </div>
                      {commissionData.part2.notes && (
                        <div className="text-[10px] italic">Notes: {commissionData.part2.notes}</div>
                      )}
                    </div>
                  ) : commissionData?.part2?.status === "LOCKED" ? (
                    <div className="text-[10px] text-[#8C97AB] bg-[#FAFAF8] p-2 rounded-[6px] border border-[#EDEAE1]">
                      Awaiting government status <strong>Final Fund Credited (UTR Updated)</strong> to unlock payout.
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Collapsible Deduction Explainer */}
              <div className="pt-2 border-t border-[#EDEAE1]">
                <button
                  type="button"
                  onClick={() => setShowBreakdown(!showBreakdown)}
                  className="text-xs font-semibold text-[#52607D] hover:text-[#14213D] flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {showBreakdown ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  <span>How are these aging deductions and amounts calculated?</span>
                </button>

                {showBreakdown && (
                  <div className="mt-2.5 p-3.5 bg-[#FAFAF8] border border-[#EDEAE1] rounded-[8px] text-xs text-[#52607D] space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <span className="font-semibold text-[#14213D]">Phase 1 Stagnation Rule:</span>
                        <p className="text-[11px] mt-0.5">
                          Project baseline invoice date: <strong>{commissionData?.breakdown?.baselineInvoiceDate || "—"}</strong>. Delay between invoice date and first post-invoice transition is <strong>{commissionData?.breakdown?.phase1DelayDays || 0} days</strong>. Every 45 days deducts 1% from base commission ({commissionData?.breakdown?.phase1PenaltyPercentage || 0}% deduction applied).
                        </p>
                      </div>
                      <div>
                        <span className="font-semibold text-[#14213D]">Phase 2 Stagnation Rule:</span>
                        <p className="text-[11px] mt-0.5">
                          Delay between First Fund release and Final Fund release: <strong>{commissionData?.breakdown?.phase2DelayDays || 0} days</strong>. Every 45 days delay beyond First Fund deducts 1% from the remaining 45% milestone ({commissionData?.breakdown?.phase2PenaltyPercentage || 0}% deduction applied).
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Observed Status History Timeline */}
        <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-6 shadow-[0_1px_2px_rgba(20,33,61,0.04)] space-y-4">
          <div className="flex items-center gap-2 border-b border-[#EDEAE1] pb-3">
            <History size={18} className="text-[#2F6F5E]" />
            <h2 className="text-sm font-bold font-display text-[#14213D]">Status Change History</h2>
          </div>

          {historyData.length === 0 ? (
            <p className="text-xs text-[#52607D] py-4 text-center">No status transitions recorded yet.</p>
          ) : (
            <div className="relative pl-6 border-l-2 border-[#E4E1D8] space-y-6 my-2">
              {historyData.map((item, index) => (
                <div key={item.id || index} className="relative group">
                  {/* Timeline bullet dot */}
                  <div className="absolute -left-[27px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white bg-[#2F6F5E] shadow-xs" />

                  <div className="bg-[#FAFAF8] border border-[#EDEAE1] rounded-[8px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={item.status} size="sm" />
                        {index > 0 && item.days_since_previous !== null && (
                          <span className="text-[11px] font-semibold text-[#52607D] bg-white border border-[#E4E1D8] px-2 py-0.5 rounded-full">
                            +{item.days_since_previous} days from prior stage
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[#52607D]">
                        Status Date: <strong className="text-[#14213D]">{item.status_date || "N/A"}</strong> · Observed at:{" "}
                        {new Date(item.observed_at).toLocaleString()}
                      </div>
                      {item.remarks && (
                        <div className="text-xs text-[#52607D] italic">Remarks: {item.remarks}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Payout Record Modal */}
      <Modal
        isOpen={payModalOpen}
        onClose={() => setPayModalOpen(false)}
        title={`Record Dealer Milestone Payout (${activeMilestone === "PART1" ? "Part 1 - 55%" : "Part 2 - 45%"})`}
      >
        <form onSubmit={handleRecordPayout} className="space-y-4">
          <div className="p-3 bg-[#EAF3F0] rounded-[8px] text-xs text-[#2F6F5E] flex items-center justify-between">
            <span>Milestone Amount to Pay:</span>
            <strong className="text-sm font-mono font-bold text-[#14213D]">
              ₹
              {parseFloat(
                activeMilestone === "PART1"
                  ? commissionData?.part1?.amount || 0
                  : commissionData?.part2?.amount || 0
              ).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </strong>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#14213D] mb-1">
              Payment Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={payDate}
              onChange={(e) => setPayDate(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#14213D] mb-1">
              Payment Mode & UTR / Cheque Ref <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. NEFT-UTR-89123891, Cheque #49102"
              value={payRef}
              onChange={(e) => setPayRef(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#14213D] mb-1">
              Payment Remarks / Notes
            </label>
            <textarea
              rows={2}
              placeholder="Optional notes or remarks regarding this payout..."
              value={payNotes}
              onChange={(e) => setPayNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-[#EDEAE1]">
            <Button variant="secondary" type="button" onClick={() => setPayModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={savingPayment} icon={Check}>
              Confirm Payout
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default ProjectDetailPage;
