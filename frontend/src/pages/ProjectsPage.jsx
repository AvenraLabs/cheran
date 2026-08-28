import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Eye,
  RefreshCw,
  X,
  Clock,
  Calendar,
  History,
  ArrowRight,
  ExternalLink,
  MapPin,
  User,
  Phone,
  GitMerge,
  Edit3,
  FileQuestion,
  Layers,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { toast } from "sonner";
import Navbar from "../components/layout/Navbar.jsx";
import StatusBadge from "../components/common/StatusBadge.jsx";
import Button from "../components/common/Button.jsx";
import CustomSelect from "../components/common/CustomSelect.jsx";
import Modal from "../components/common/Modal.jsx";
import Pagination from "../components/common/Pagination.jsx";
import { SkeletonLoader, EmptyState } from "../components/common/SkeletonLoader.jsx";
import { formatDate } from "../utils/dates.js";
import MergeProjectModal from "../components/projects/MergeProjectModal.jsx";

export function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });

  // Filter state
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedFundType, setSelectedFundType] = useState("");
  const [selectedDealer, setSelectedDealer] = useState("");
  const [district, setDistrict] = useState("");
  const [minStatusDays, setMinStatusDays] = useState("");
  const [orphanOnly, setOrphanOnly] = useState(false);

  // History modal state
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Merge / Correct ID modal state
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [mergeSourceProject, setMergeSourceProject] = useState(null);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { user } = useAuth();
  const isAdmin = (user?.role || "USER").toUpperCase() === "ADMIN";

  const debounceTimerRef = useRef(null);

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    try {
      setDeleting(true);
      await api.delete(`/government/projects/${projectToDelete.id}`);
      toast.success(`Project ${projectToDelete.application_id} and all associated data were deleted successfully`);
      setDeleteModalOpen(false);
      setProjectToDelete(null);
      fetchProjects(pagination.page);
    } catch (err) {
      console.error("Failed to delete project:", err);
      toast.error(err?.message || "Failed to delete project");
    } finally {
      setDeleting(false);
    }
  };

  const fetchProjects = async (page = 1, limit = pagination.limit) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
        ...(search ? { search: search.trim() } : {}),
        ...(selectedStatus ? { status: selectedStatus } : {}),
        ...(selectedFundType ? { fund_type: selectedFundType } : {}),
        ...(selectedDealer ? { dealer_id: selectedDealer } : {}),
        ...(district ? { district: district.trim() } : {}),
        ...(orphanOnly ? { orphan_only: true } : {}),
        ...(minStatusDays !== "" && !isNaN(parseInt(minStatusDays, 10))
          ? { min_status_days: parseInt(minStatusDays, 10) }
          : {}),
      };

      const res = await api.get("/government/projects", { params });
      setProjects(res.data?.projects || []);
      setPagination(res.data?.pagination || { page, limit, total: 0, totalPages: 1 });
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    } finally {
      setLoading(false);
    }
  };

  // Load Metadata (statuses, dealers) on mount
  useEffect(() => {
    async function fetchMetadata() {
      try {
        const [statRes, dealRes] = await Promise.all([
          api.get("/government/statuses"),
          api.get("/dealers/options"),
        ]);
        setStatuses(statRes.data?.statuses || statRes.statuses || []);
        setDealers(dealRes.data?.dealers || dealRes.dealers || []);
      } catch (err) {
        console.error("Error loading filter options:", err);
      }
    }
    fetchMetadata();
  }, []);

  // Live dynamic filtering with debounce
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchProjects(1, pagination.limit);
    }, 250);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [search, selectedStatus, selectedFundType, selectedDealer, district, minStatusDays, orphanOnly]);

  const hasActiveFilters = Boolean(
    search || selectedStatus || selectedFundType || selectedDealer || district || minStatusDays !== "" || orphanOnly
  );

  const handleResetFilters = () => {
    setSearch("");
    setSelectedStatus("");
    setSelectedFundType("");
    setSelectedDealer("");
    setDistrict("");
    setMinStatusDays("");
    setOrphanOnly(false);
  };

  // Calculate days elapsed from current status date to today
  const calculateDaysSinceStatus = (statusDate) => {
    if (!statusDate) return null;
    const sDate = new Date(statusDate);
    const today = new Date();
    const diffTime = today.setHours(0, 0, 0, 0) - sDate.setHours(0, 0, 0, 0);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 ? diffDays : 0;
  };

  const handleViewProject = async (proj) => {
    setSelectedProject(proj);
    setHistoryModalOpen(true);
    setHistoryLoading(true);
    try {
      const res = await api.get(`/government/projects/${proj.id}/status-history`);
      setHistoryData(res.data?.history || []);
    } catch (err) {
      console.error("Failed to load status history:", err);
      setHistoryData([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const statusOptions = [
    { value: "", label: "All Statuses" },
    ...statuses.map((s) => ({ value: s.name, label: s.name })),
  ];

  const fundTypeOptions = [
    { value: "", label: "All Fund Types" },
    { value: "40%-SPARSH", label: "40%-SPARSH (60/40 Split)" },
    { value: "SPARSH", label: "SPARSH (60/40 Split)" },
    { value: "Regular", label: "Regular (55/45 Split)" },
    { value: "First Fund SNA SPARSH", label: "First Fund SNA SPARSH" },
  ];

  const dealerOptions = [
    { value: "", label: "All Dealers" },
    { value: "UNASSIGNED", label: "Unassigned Projects" },
    ...dealers.map((d) => ({ value: d.id, label: d.name })),
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Navbar
        title="Government Projects Registry"
        actions={
          <Button
            variant="secondary"
            icon={RefreshCw}
            loading={loading}
            onClick={() => fetchProjects(pagination.page, pagination.limit)}
          >
            Refresh
          </Button>
        }
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 overflow-y-auto w-full">
        {/* Quick View Toggle Tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOrphanOnly(false)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-[8px] text-xs font-bold transition-all cursor-pointer ${
              !orphanOnly
                ? "bg-[#14213D] text-white shadow-2xs"
                : "bg-white border border-[#E4E1D8] text-[#52607D] hover:text-[#14213D]"
            }`}
          >
            <Layers size={14} />
            <span>All Government Projects</span>
          </button>

          <button
            onClick={() => setOrphanOnly(true)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-[8px] text-xs font-bold transition-all cursor-pointer ${
              orphanOnly
                ? "bg-amber-800 text-white shadow-2xs"
                : "bg-white border border-[#E4E1D8] text-[#52607D] hover:text-amber-800"
            }`}
          >
            <FileQuestion size={14} className={orphanOnly ? "text-white" : "text-amber-600"} />
            <span>Orphan Invoices Only (Needs Merge)</span>
          </button>
        </div>

        {/* Dynamic Live Filter Bar */}
        <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-4 shadow-[0_1px_2px_rgba(20,33,61,0.04)]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
            {/* Search Input */}
            <div className="relative lg:col-span-3">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#52607D]" />
              <input
                type="text"
                placeholder="Search App ID, Farmer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D] placeholder:text-[#8C97AB]"
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

            {/* Custom Status Dropdown */}
            <div className="lg:col-span-2">
              <CustomSelect
                options={statusOptions}
                value={selectedStatus}
                onChange={(val) => setSelectedStatus(val)}
                placeholder="All Statuses"
                searchable={true}
                size="sm"
              />
            </div>

            {/* Custom Fund Type Dropdown */}
            <div className="lg:col-span-2">
              <CustomSelect
                options={fundTypeOptions}
                value={selectedFundType}
                onChange={(val) => setSelectedFundType(val)}
                placeholder="All Fund Types"
                searchable={true}
                size="sm"
              />
            </div>

            {/* Custom Dealer Dropdown */}
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

            {/* Min Days in Current Status Filter */}
            <div className="relative lg:col-span-1">
              <div className="relative flex items-center">
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Min Days"
                  value={minStatusDays}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "" || parseInt(val, 10) >= 0) {
                      setMinStatusDays(val);
                    }
                  }}
                  className="w-full px-2.5 py-2 text-xs font-mono bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D] placeholder:text-[#8C97AB]"
                  title="Filter projects whose current status date is at least N days old"
                />
                {minStatusDays !== "" && (
                  <button
                    onClick={() => setMinStatusDays("")}
                    className="absolute right-2 text-[#8C97AB] hover:text-[#14213D] p-0.5 cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* District Filter & Clear */}
            <div className="relative lg:col-span-2 flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="District..."
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D] placeholder:text-[#8C97AB]"
                />
                {district && (
                  <button
                    onClick={() => setDistrict("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8C97AB] hover:text-[#14213D] p-0.5 cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {hasActiveFilters && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleResetFilters}
                  className="px-2.5 shrink-0"
                  title="Clear all active filters"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Active Filter Summary Indicator */}
        {minStatusDays !== "" && (
          <div className="flex items-center gap-2 text-xs text-[#52607D] bg-white border border-[#E4E1D8] px-3 py-2 rounded-[8px]">
            <Clock size={14} className="text-[#2F6F5E]" />
            <span>
              Filtering projects in current status for <strong>≥ {minStatusDays} days</strong> (Status Date on or before{" "}
              {new Date(Date.now() - parseInt(minStatusDays, 10) * 86400000).toISOString().split("T")[0]})
            </span>
          </div>
        )}

        {/* Data Table Container */}
        <div className="bg-white border border-[#E4E1D8] rounded-[10px] shadow-[0_1px_2px_rgba(20,33,61,0.04)] overflow-hidden">
          {loading ? (
            <div className="p-6">
              <SkeletonLoader rows={8} />
            </div>
          ) : projects.length === 0 ? (
            <EmptyState
              title="No matching government projects found"
              description={
                hasActiveFilters
                  ? "Try clearing or relaxing your search filters."
                  : "No projects recorded yet. Upload an Excel import to get started."
              }
              action={
                hasActiveFilters ? (
                  <Button size="sm" variant="secondary" onClick={handleResetFilters}>
                    Clear Filters
                  </Button>
                ) : null
              }
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAFAF8] border-b border-[#E4E1D8] text-[#52607D] uppercase font-semibold">
                    <tr>
                      <th className="py-3 px-4">Application ID</th>
                      <th className="py-3 px-4">Farmer Details</th>
                      <th className="py-3 px-4">Location</th>
                      <th className="py-3 px-4">Current Status</th>
                      <th className="py-3 px-4">Status Date</th>
                      <th className="py-3 px-4">Invoice Date</th>
                      <th className="py-3 px-4">Fund Type</th>
                      <th className="py-3 px-4">Dealer</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDEAE1]">
                    {projects.map((proj) => {
                      const daysInStatus = calculateDaysSinceStatus(proj.current_status_date);
                      return (
                        <tr key={proj.id} className="hover:bg-[#FAFAF8] transition-colors">
                          <td className="py-3 px-4 font-mono font-medium text-[#14213D]">
                            {proj.application_id}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-[#14213D]">{proj.farmer_name || "—"}</div>
                            {proj.mobile && <div className="text-[11px] text-[#52607D]">{proj.mobile}</div>}
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-[#14213D] font-medium">{proj.village || "—"}</div>
                            <div className="text-[11px] text-[#52607D]">
                              {[proj.block, proj.district].filter(Boolean).join(", ")}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <StatusBadge status={proj.current_status} size="sm" />
                          </td>
                          <td className="py-3 px-4 text-[#52607D]">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono">{formatDate(proj.current_status_date)}</span>
                              {daysInStatus !== null && (
                                <span
                                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                                    daysInStatus >= 30
                                      ? "bg-rose-50 text-rose-700 border border-rose-200"
                                      : daysInStatus >= 15
                                      ? "bg-amber-50 text-amber-800 border border-amber-200"
                                      : "bg-[#EAF3F0] text-[#2F6F5E]"
                                  }`}
                                  title={`${daysInStatus} days since current status date`}
                                >
                                  {daysInStatus}d
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-[#14213D] font-medium font-mono">
                            {proj.invoice_date ? formatDate(proj.invoice_date) : "—"}
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-[#FAFAF8] border border-[#E4E1D8] text-[#14213D]">
                              {proj.fund_type || "Regular"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-[#52607D]">
                            {proj.dealer?.name || "—"}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <Button
                                variant="secondary"
                                size="xs"
                                icon={GitMerge}
                                onClick={() => {
                                  setMergeSourceProject(proj);
                                  setMergeModalOpen(true);
                                }}
                                title="Correct mistyped ID or Merge with existing Government Project"
                              >
                                Edit ID
                              </Button>
                              <Button
                                variant="outline"
                                size="xs"
                                icon={Eye}
                                onClick={() => handleViewProject(proj)}
                              >
                                View
                              </Button>
                              {isAdmin && (
                                <Button
                                  variant="danger"
                                  size="xs"
                                  icon={Trash2}
                                  onClick={() => {
                                    setProjectToDelete(proj);
                                    setDeleteModalOpen(true);
                                  }}
                                  title="Permanently Delete Project & Associated Data"
                                >
                                  Delete
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Reusable Pagination Component */}
              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                limit={pagination.limit}
                limitOptions={[20, 50, 100, 250]}
                onPageChange={(newPage) => fetchProjects(newPage, pagination.limit)}
                onLimitChange={(newLimit) => fetchProjects(1, newLimit)}
              />
            </>
          )}
        </div>
      </main>

      {/* Project Status Change History Modal */}
      <Modal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        title={`Status History: ${selectedProject?.application_id || ""}`}
        size="xl"
      >
        {selectedProject && (
          <div className="space-y-4 text-xs">
            {/* Project Summary Card */}
            <div className="p-3.5 bg-[#FAFAF8] border border-[#EDEAE1] rounded-[8px] grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
              <div className="flex items-start gap-2 min-w-0">
                <User size={14} className="text-[#52607D] shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="text-[10px] text-[#52607D] uppercase font-bold">Farmer</div>
                  <div className="font-semibold text-[#14213D] truncate">{selectedProject.farmer_name || "—"}</div>
                </div>
              </div>

              <div className="flex items-start gap-2 min-w-0">
                <MapPin size={14} className="text-[#52607D] shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="text-[10px] text-[#52607D] uppercase font-bold">Location</div>
                  <div className="font-semibold text-[#14213D] truncate">
                    {[selectedProject.village, selectedProject.district].filter(Boolean).join(", ") || "—"}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2 min-w-0">
                <Clock size={14} className="text-[#52607D] shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="text-[10px] text-[#52607D] uppercase font-bold">Current Status</div>
                  <div className="mt-0.5">
                    <StatusBadge status={selectedProject.current_status} size="sm" />
                  </div>
                </div>
              </div>
            </div>

            {/* Status Change History Timeline */}
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#14213D] mb-3 uppercase tracking-wider">
                <History size={14} className="text-[#2F6F5E]" />
                <span>Observed Status Change History & Dates</span>
              </div>

              {historyLoading ? (
                <div className="py-4">
                  <SkeletonLoader rows={4} />
                </div>
              ) : historyData.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#52607D] bg-[#FAFAF8] rounded-[8px] border border-[#EDEAE1]">
                  No status transition history recorded for this project yet.
                </div>
              ) : (
                <div className="border border-[#EDEAE1] rounded-[8px] overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAFAF8] border-b border-[#EDEAE1] text-[#52607D] font-semibold">
                      <tr>
                        <th className="py-2.5 px-3 w-10">#</th>
                        <th className="py-2.5 px-3 min-w-[220px]">Status</th>
                        <th className="py-2.5 px-3 w-36 whitespace-nowrap">Status Date</th>
                        <th className="py-2.5 px-3 w-44 whitespace-nowrap">Days in Prior Stage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EDEAE1] text-[#14213D]">
                      {historyData.map((item, idx) => (
                        <tr key={item.id || idx} className="hover:bg-[#FAFAF8] transition-colors">
                          <td className="py-2.5 px-3 font-mono text-[#8C97AB]">{idx + 1}</td>
                          <td className="py-2.5 px-3">
                            <StatusBadge status={item.status} size="sm" />
                          </td>
                          <td className="py-2.5 px-3 font-mono font-medium">
                            <div className="flex items-center gap-1.5">
                              <Calendar size={12} className="text-[#2F6F5E]" />
                              <span>{formatDate(item.status_date)}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            {idx === 0 ? (
                              <span className="text-[#8C97AB] font-mono">Initial Stage</span>
                            ) : item.days_since_previous !== null ? (
                              <span className="font-mono font-semibold text-[#14213D] bg-white border border-[#E4E1D8] px-2 py-0.5 rounded-full text-[11px]">
                                +{item.days_since_previous} days
                              </span>
                            ) : (
                              <span className="text-[#8C97AB] font-mono">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-[#EDEAE1]">
              <Link to={`/projects/${selectedProject.id}`}>
                <Button variant="secondary" size="sm" icon={ExternalLink}>
                  Details
                </Button>
              </Link>

              <Button variant="outline" size="sm" onClick={() => setHistoryModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Correct / Merge Application ID Modal */}
      <MergeProjectModal
        isOpen={mergeModalOpen}
        onClose={() => {
          setMergeModalOpen(false);
          setMergeSourceProject(null);
        }}
        sourceProject={mergeSourceProject}
        onSuccess={() => {
          fetchProjects(pagination.page, pagination.limit);
        }}
      />

      {/* Delete Project Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          if (!deleting) {
            setDeleteModalOpen(false);
            setProjectToDelete(null);
          }
        }}
        title="Delete Government Project"
      >
        <div className="space-y-4">
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-[8px] flex items-start gap-3">
            <AlertTriangle size={20} className="text-red-600 shrink-0 mt-0.5" />
            <div className="text-xs text-red-800 space-y-1">
              <p className="font-bold text-red-900">Permanent Deletion Warning</p>
              <p>
                This will permanently delete project{" "}
                <strong className="font-mono text-red-950">{projectToDelete?.application_id}</strong>
                {projectToDelete?.farmer_name && (
                  <span> ({projectToDelete.farmer_name})</span>
                )}
                , along with all associated data including invoices, invoice line items, payments, status milestones history, dealer commissions, and proceeding references.
              </p>
            </div>
          </div>

          <p className="text-xs text-[#52607D]">
            Are you sure you want to delete this entire project? This action cannot be undone.
          </p>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#EDEAE1]">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDeleteModalOpen(false);
                setProjectToDelete(null);
              }}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              icon={Trash2}
              onClick={handleDeleteProject}
              loading={deleting}
            >
              Delete Entire Project
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default ProjectsPage;

