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
  MessageSquare,
  FileText,
  Plus,
  Calendar,
  CheckCircle,
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
  const [followups, setFollowups] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [dispatchedMaterials, setDispatchedMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  // Follow-up Modal
  const [followupModalOpen, setFollowupModalOpen] = useState(false);
  const [followupDate, setFollowupDate] = useState(new Date().toISOString().split("T")[0]);
  const [followupRemarks, setFollowupRemarks] = useState("");
  const [nextActionDate, setNextActionDate] = useState("");
  const [followupStatus, setFollowupStatus] = useState("OPEN");
  const [savingFollowup, setSavingFollowup] = useState(false);

  // Document Modal
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [docName, setDocName] = useState("");
  const [docType, setDocType] = useState("Work Order");
  const [docPath, setDocPath] = useState("");
  const [savingDoc, setSavingDoc] = useState(false);

  const loadProjectDetails = async () => {
    try {
      setLoading(true);
      const [projRes, histRes, folRes, docRes, invRes] = await Promise.all([
        api.get(`/government/projects/${id}`),
        api.get(`/government/projects/${id}/status-history`),
        api.get(`/government/projects/${id}/followups`).catch(() => ({ data: { followups: [] } })),
        api.get(`/government/projects/${id}/documents`).catch(() => ({ data: { documents: [] } })),
        api.get(`/government/projects/${id}/invoices`).catch(() => ({ data: { invoices: [], dispatchedMaterials: [] } })),
      ]);
      setProject(projRes.data?.project);
      setHistoryData(histRes.data?.history || []);
      setFollowups(folRes.data?.followups || []);
      setDocuments(docRes.data?.documents || []);
      setInvoices(invRes.data?.invoices || []);
      setDispatchedMaterials(invRes.data?.dispatchedMaterials || []);
    } catch (err) {
      console.error("Failed to load project details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjectDetails();
  }, [id]);

  const handleSaveFollowup = async (e) => {
    e.preventDefault();
    if (!followupRemarks.trim()) return;

    try {
      setSavingFollowup(true);
      await api.post(`/government/projects/${id}/followups`, {
        followup_date: followupDate,
        remarks: followupRemarks.trim(),
        next_action_date: nextActionDate || null,
        status: followupStatus,
      });
      setFollowupModalOpen(false);
      setFollowupRemarks("");
      loadProjectDetails();
    } catch (err) {
      console.error("Failed to save followup:", err);
    } finally {
      setSavingFollowup(false);
    }
  };

  const handleSaveDocument = async (e) => {
    e.preventDefault();
    if (!docName.trim() || !docPath.trim()) return;

    try {
      setSavingDoc(true);
      await api.post(`/government/projects/${id}/documents`, {
        document_name: docName.trim(),
        document_type: docType,
        file_path: docPath.trim(),
      });
      setDocModalOpen(false);
      setDocName("");
      setDocPath("");
      loadProjectDetails();
    } catch (err) {
      console.error("Failed to save document:", err);
    } finally {
      setSavingDoc(false);
    }
  };

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
          <div className="flex items-center gap-2">
            <Button variant="secondary" icon={MessageSquare} onClick={() => setFollowupModalOpen(true)}>
              Add Follow-up
            </Button>
            <Button variant="secondary" icon={FileText} onClick={() => setDocModalOpen(true)}>
              Attach Document
            </Button>
            <Link to="/projects">
              <Button variant="secondary" icon={ArrowLeft}>
                Back to List
              </Button>
            </Link>
          </div>
        }
      />

      <main className="p-8 space-y-6 flex-1 overflow-y-auto">
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

        {/* Action Follow-ups & Documents Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Follow-ups */}
          <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-6 shadow-[0_1px_2px_rgba(20,33,61,0.04)] space-y-4">
            <div className="flex items-center justify-between border-b border-[#EDEAE1] pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare size={18} className="text-[#2F6F5E]" />
                <h2 className="text-sm font-bold font-display text-[#14213D]">Government Follow-ups</h2>
              </div>
              <Button size="sm" icon={Plus} onClick={() => setFollowupModalOpen(true)}>
                Add
              </Button>
            </div>

            {followups.length === 0 ? (
              <p className="text-xs text-[#52607D] py-4 text-center">No follow-ups recorded yet.</p>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {followups.map((fol) => (
                  <div key={fol.id} className="p-3 bg-[#FAFAF8] border border-[#EDEAE1] rounded-[8px] space-y-1 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-[#14213D]">{fol.followup_date}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EAF3F0] text-[#2F6F5E]">{fol.status}</span>
                    </div>
                    <p className="text-[#52607D]">{fol.remarks}</p>
                    {fol.next_action_date && (
                      <div className="text-[11px] text-[#2F6F5E] font-medium">
                        Next Action Date: {fol.next_action_date}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Attached Documents */}
          <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-6 shadow-[0_1px_2px_rgba(20,33,61,0.04)] space-y-4">
            <div className="flex items-center justify-between border-b border-[#EDEAE1] pb-3">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-[#2F6F5E]" />
                <h2 className="text-sm font-bold font-display text-[#14213D]">Project Documents</h2>
              </div>
              <Button size="sm" icon={Plus} onClick={() => setDocModalOpen(true)}>
                Upload
              </Button>
            </div>

            {documents.length === 0 ? (
              <p className="text-xs text-[#52607D] py-4 text-center">No documents attached yet.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {documents.map((doc) => (
                  <div key={doc.id} className="p-3 bg-[#FAFAF8] border border-[#EDEAE1] rounded-[8px] flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-[#14213D]">{doc.document_name}</div>
                      <div className="text-[11px] text-[#52607D]">{doc.document_type} · {doc.file_path}</div>
                    </div>
                    <span className="text-[11px] font-mono text-[#2F6F5E]">Attached</span>
                  </div>
                ))}
              </div>
            )}
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
              No dispatch invoices recorded for this Government Application ID yet.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary of Materials Dispatched */}
              <div>
                <h3 className="text-xs font-bold text-[#14213D] mb-2 uppercase tracking-wider text-[10px]">
                  Aggregated Dispatched Materials
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {dispatchedMaterials.map((mat, idx) => (
                    <div key={idx} className="p-3 bg-[#FAFAF8] border border-[#EDEAE1] rounded-[8px] flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#14213D]">{mat.item_name}</span>
                      <span className="font-mono font-bold text-[#2F6F5E]">
                        {parseFloat(mat.total_quantity).toLocaleString("en-IN")} {mat.unit}
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
                          ₹{parseFloat(inv.net_item_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-right text-[#D97706]">
                          +₹{parseFloat(inv.fittings_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-[#14213D]">
                          ₹{parseFloat(inv.total_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
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

        {/* Observed Status History Timeline */}
        <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-6 shadow-[0_1px_2px_rgba(20,33,61,0.04)] space-y-4">
          <div className="flex items-center gap-2 border-b border-[#EDEAE1] pb-3">
            <History size={18} className="text-[#2F6F5E]" />
            <div>
              <h2 className="text-base font-bold font-display text-[#14213D]">
                Observed Government Status History
              </h2>
              <p className="text-xs text-[#52607D]">
                Chronological transitions strictly observed across government Excel uploads (never inferred)
              </p>
            </div>
          </div>

          {historyData.length === 0 ? (
            <div className="py-6 text-center text-xs text-[#52607D]">
              No observed status history recorded yet.
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E4E1D8]">
              {historyData.map((item, index) => (
                <div key={item.id} className="relative group">
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

                    <div className="text-right text-[11px] text-[#52607D]">
                      {item.source_import?.file_name && (
                        <span>Source: <strong className="text-[#14213D]">{item.source_import.file_name}</strong></span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Follow-up Modal */}
      <Modal
        isOpen={followupModalOpen}
        onClose={() => setFollowupModalOpen(false)}
        title="Add Government Project Follow-up"
      >
        <form onSubmit={handleSaveFollowup} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#14213D] mb-1">
              Follow-up Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={followupDate}
              onChange={(e) => setFollowupDate(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#14213D] mb-1">
              Remarks & Officer Discussions <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Called Assistant Director regarding Joint Verification inspection schedule..."
              value={followupRemarks}
              onChange={(e) => setFollowupRemarks(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#14213D] mb-1">
                Next Action Date
              </label>
              <input
                type="date"
                value={nextActionDate}
                onChange={(e) => setNextActionDate(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#14213D] mb-1">
                Status
              </label>
              <select
                value={followupStatus}
                onChange={(e) => setFollowupStatus(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
              >
                <option value="OPEN">Open / Pending</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-[#EDEAE1]">
            <Button variant="secondary" type="button" onClick={() => setFollowupModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={savingFollowup}>
              Save Follow-up
            </Button>
          </div>
        </form>
      </Modal>

      {/* Document Modal */}
      <Modal
        isOpen={docModalOpen}
        onClose={() => setDocModalOpen(false)}
        title="Attach Document to Project"
      >
        <form onSubmit={handleSaveDocument} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#14213D] mb-1">
              Document Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Work Order Copy, Joint Verification Report"
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#14213D] mb-1">
              Document Category / Type
            </label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
            >
              <option value="Work Order">Work Order</option>
              <option value="Joint Verification">Joint Verification Report</option>
              <option value="Invoice">Invoice Copy</option>
              <option value="Quotation">Quotation</option>
              <option value="Other">Other Document</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#14213D] mb-1">
              File Path or Cloud URL <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. /uploads/documents/wo_10293.pdf"
              value={docPath}
              onChange={(e) => setDocPath(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-[#EDEAE1]">
            <Button variant="secondary" type="button" onClick={() => setDocModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={savingDoc}>
              Attach Document
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default ProjectDetailPage;
