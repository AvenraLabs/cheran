import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Filter, ChevronLeft, ChevronRight, Eye, RefreshCw } from "lucide-react";
import api from "../api/client.js";
import Navbar from "../components/layout/Navbar.jsx";
import StatusBadge from "../components/common/StatusBadge.jsx";
import Button from "../components/common/Button.jsx";
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
  const [block, setBlock] = useState("");

  const fetchProjects = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 20,
        ...(search ? { search } : {}),
        ...(selectedStatus ? { status: selectedStatus } : {}),
        ...(selectedDealer ? { dealer_id: selectedDealer } : {}),
        ...(district ? { district } : {}),
        ...(block ? { block } : {}),
      };

      const res = await api.get("/government/projects", { params });
      setProjects(res.data?.projects || []);
      setPagination(res.data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch of statuses & dealers
    async function fetchMetadata() {
      try {
        const [statRes, dealRes] = await Promise.all([
          api.get("/government/statuses"),
          api.get("/dealers?limit=100"),
        ]);
        setStatuses(statRes.data?.statuses || []);
        setDealers(dealRes.data?.dealers || []);
      } catch (err) {
        console.error("Error loading filter options:", err);
      }
    }
    fetchMetadata();
    fetchProjects(1);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProjects(1);
  };

  const handleResetFilters = () => {
    setSearch("");
    setSelectedStatus("");
    setSelectedDealer("");
    setDistrict("");
    setBlock("");
    fetchProjects(1);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Navbar
        title="Government Projects"
        subtitle={`Tracking ${pagination.total.toLocaleString()} government horticulture applications`}
        actions={
          <Button variant="secondary" icon={RefreshCw} onClick={() => fetchProjects(pagination.page)}>
            Refresh
          </Button>
        }
      />

      <main className="p-8 space-y-6 flex-1 overflow-y-auto">
        {/* Search & Filter Bar */}
        <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-4 shadow-[0_1px_2px_rgba(20,33,61,0.04)]">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            {/* Search Input */}
            <div className="relative lg:col-span-2">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#52607D]" />
              <input
                type="text"
                placeholder="Search Application ID, Farmer, Mobile..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E]"
              />
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
              >
                <option value="">All Statuses</option>
                {statuses.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Dealer Filter */}
            <div>
              <select
                value={selectedDealer}
                onChange={(e) => setSelectedDealer(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
              >
                <option value="">All Dealers</option>
                {dealers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* District Filter */}
            <div>
              <input
                type="text"
                placeholder="District..."
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E]"
              />
            </div>

            {/* Submit & Reset Buttons */}
            <div className="flex items-center gap-2">
              <Button type="submit" size="sm" className="w-full">
                Filter
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleResetFilters}
                className="px-2.5"
              >
                Reset
              </Button>
            </div>
          </form>
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
              description="Try adjusting your search terms or filter criteria."
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

              {/* Pagination Bar */}
              <div className="px-6 py-3 border-t border-[#EDEAE1] bg-[#FAFAF8] flex items-center justify-between">
                <div className="text-xs text-[#52607D]">
                  Showing Page <span className="font-semibold text-[#14213D]">{pagination.page}</span> of{" "}
                  <span className="font-semibold text-[#14213D]">{pagination.totalPages || 1}</span> (
                  {pagination.total} total projects)
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={pagination.page <= 1}
                    onClick={() => fetchProjects(pagination.page - 1)}
                    icon={ChevronLeft}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => fetchProjects(pagination.page + 1)}
                  >
                    Next <ChevronRight size={14} className="ml-1" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default ProjectsPage;
