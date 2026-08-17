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
} from "lucide-react";
import api from "../api/client.js";
import Navbar from "../components/layout/Navbar.jsx";
import StatusBadge from "../components/common/StatusBadge.jsx";
import Button from "../components/common/Button.jsx";
import { SkeletonLoader } from "../components/common/SkeletonLoader.jsx";

export function ProjectDetailPage() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProjectDetails() {
      try {
        setLoading(true);
        const [projRes, histRes] = await Promise.all([
          api.get(`/government/projects/${id}`),
          api.get(`/government/projects/${id}/status-history`),
        ]);
        setProject(projRes.data?.project);
        setHistoryData(histRes.data?.history || []);
      } catch (err) {
        console.error("Failed to load project details:", err);
      } finally {
        setLoading(false);
      }
    }
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
            <Button variant="secondary" icon={ArrowLeft} size="sm">
              Back to List
            </Button>
          </Link>
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
                  {/* Timeline bullet */}
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
    </div>
  );
}

export default ProjectDetailPage;
