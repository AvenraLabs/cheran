import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Search, Eye, RefreshCw, X } from "lucide-react";
import api from "../api/client.js";
import Navbar from "../components/layout/Navbar.jsx";
import StatusBadge from "../components/common/StatusBadge.jsx";
import Button from "../components/common/Button.jsx";
import CustomSelect from "../components/common/CustomSelect.jsx";
import Pagination from "../components/common/Pagination.jsx";
import { SkeletonLoader, EmptyState } from "../components/common/SkeletonLoader.jsx";

export function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });

  // Filter state
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedDealer, setSelectedDealer] = useState("");
  const [district, setDistrict] = useState("");

  const debounceTimerRef = useRef(null);

  const fetchProjects = async (page = 1, limit = pagination.limit) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
        ...(search ? { search: search.trim() } : {}),
        ...(selectedStatus ? { status: selectedStatus } : {}),
        ...(selectedDealer ? { dealer_id: selectedDealer } : {}),
        ...(district ? { district: district.trim() } : {}),
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
          api.get("/dealers?limit=250"),
        ]);
        setStatuses(statRes.data?.statuses || []);
        setDealers(dealRes.data?.dealers || []);
      } catch (err) {
        console.error("Error loading filter options:", err);
      }
    }
    fetchMetadata();
  }, []);

  // Live dynamic filtering with debounce for text inputs & immediate for dropdowns
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchProjects(1, pagination.limit);
    }, 280);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [search, selectedStatus, selectedDealer, district]);

  const hasActiveFilters = Boolean(search || selectedStatus || selectedDealer || district);

  const handleResetFilters = () => {
    setSearch("");
    setSelectedStatus("");
    setSelectedDealer("");
    setDistrict("");
  };

  const statusOptions = [
    { value: "", label: "All Statuses" },
    ...statuses.map((s) => ({ value: s.name, label: s.name })),
  ];

  const dealerOptions = [
    { value: "", label: "All Dealers" },
    ...dealers.map((d) => ({
      value: d.id,
      label: d.name,
      badge: d.commission_percentage ? `${d.commission_percentage}%` : null,
    })),
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Navbar
        title="Government Projects"
        subtitle={`Tracking ${pagination.total.toLocaleString()} government horticulture applications`}
        actions={
          <Button variant="secondary" icon={RefreshCw} onClick={() => fetchProjects(pagination.page, pagination.limit)}>
            Refresh
          </Button>
        }
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 overflow-y-auto">
        {/* Dynamic Live Filter Bar (No manual filter button needed) */}
        <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-4 shadow-[0_1px_2px_rgba(20,33,61,0.04)]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
            {/* Search Input */}
            <div className="relative lg:col-span-4">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#52607D]" />
              <input
                type="text"
                placeholder="Search Application ID, Farmer, Mobile..."
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
            <div className="lg:col-span-3">
              <CustomSelect
                options={statusOptions}
                value={selectedStatus}
                onChange={(val) => setSelectedStatus(val)}
                placeholder="All Statuses"
                searchable={true}
              />
            </div>

            {/* Custom Dealer Dropdown */}
            <div className="lg:col-span-3">
              <CustomSelect
                options={dealerOptions}
                value={selectedDealer}
                onChange={(val) => setSelectedDealer(val)}
                placeholder="All Dealers"
                searchable={true}
              />
            </div>

            {/* District Filter */}
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
                      <th className="py-3 px-4">Area (Ha)</th>
                      <th className="py-3 px-4">Dealer</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDEAE1]">
                    {projects.map((proj) => (
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
                          {proj.current_status_date || "—"}
                        </td>
                        <td className="py-3 px-4 text-[#14213D] font-medium">
                          {proj.total_area_ha ? `${proj.total_area_ha} Ha` : "—"}
                        </td>
                        <td className="py-3 px-4 text-[#52607D]">
                          {proj.dealer?.name || "—"}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link to={`/projects/${proj.id}`}>
                            <Button variant="secondary" size="sm" icon={Eye}>
                              View
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
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
    </div>
  );
}

export default ProjectsPage;
