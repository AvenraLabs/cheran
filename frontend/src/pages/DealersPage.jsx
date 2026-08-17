import React, { useEffect, useState } from "react";
import { Plus, Users, Search, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import api from "../api/client.js";
import Navbar from "../components/layout/Navbar.jsx";
import Button from "../components/common/Button.jsx";
import Modal from "../components/common/Modal.jsx";
import { SkeletonLoader, EmptyState } from "../components/common/SkeletonLoader.jsx";

export function DealersPage() {
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [commissionPercentage, setCommissionPercentage] = useState("");
  const [commissionBasis, setCommissionBasis] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchDealers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/dealers", { params: { search, limit: 100 } });
      setDealers(res.data?.dealers || []);
    } catch (err) {
      console.error("Failed to fetch dealers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDealers();
  }, [search]);

  const handleCreateDealer = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.post("/dealers", {
        name,
        commission_percentage: commissionPercentage ? parseFloat(commissionPercentage) : null,
        commission_basis: commissionBasis || null,
      });

      toast.success(`Dealer '${name}' registered successfully`);
      setCreateModalOpen(false);
      setName("");
      setCommissionPercentage("");
      setCommissionBasis("");
      fetchDealers();
    } catch (err) {
      toast.error(err.message || "Failed to create dealer");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Navbar
        title="Dealers Directory"
        subtitle="Manage verified micro-irrigation dealers and distributors"
        actions={
          <Button icon={Plus} onClick={() => setCreateModalOpen(true)}>
            Add Dealer
          </Button>
        }
      />

      <main className="p-8 space-y-6 flex-1 overflow-y-auto">
        {/* Search Bar */}
        <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-4 shadow-[0_1px_2px_rgba(20,33,61,0.04)] flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#52607D]" />
            <input
              type="text"
              placeholder="Search dealer by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E]"
            />
          </div>

          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={fetchDealers}>
            Refresh
          </Button>
        </div>

        {/* Dealers Table */}
        <div className="bg-white border border-[#E4E1D8] rounded-[10px] shadow-[0_1px_2px_rgba(20,33,61,0.04)] overflow-hidden">
          {loading ? (
            <div className="p-6">
              <SkeletonLoader rows={6} />
            </div>
          ) : dealers.length === 0 ? (
            <EmptyState
              title="No dealers registered"
              description="Click 'Add Dealer' to register your first partner dealer."
              action={
                <Button size="sm" icon={Plus} onClick={() => setCreateModalOpen(true)}>
                  Add Dealer
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAFAF8] border-b border-[#E4E1D8] text-[#52607D] uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">Dealer Name</th>
                    <th className="py-3 px-4">Normalized Key</th>
                    <th className="py-3 px-4">Commission %</th>
                    <th className="py-3 px-4">Commission Basis</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Registered Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDEAE1]">
                  {dealers.map((d) => (
                    <tr key={d.id} className="hover:bg-[#FAFAF8]">
                      <td className="py-3 px-4 font-semibold text-[#14213D]">{d.name}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-[#52607D]">
                        {d.normalized_name}
                      </td>
                      <td className="py-3 px-4 font-medium text-[#14213D]">
                        {d.commission_percentage ? `${d.commission_percentage}%` : "—"}
                      </td>
                      <td className="py-3 px-4 text-[#52607D]">{d.commission_basis || "—"}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            d.is_active
                              ? "bg-[#EAF3F0] text-[#2F6F5E]"
                              : "bg-[#FDF2F1] text-[#B0403A]"
                          }`}
                        >
                          {d.is_active ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#52607D]">
                        {new Date(d.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Add Dealer Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Add New Dealer"
      >
        <form onSubmit={handleCreateDealer} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-[#14213D]">Dealer / Firm Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Sri Balaji Agro Irrigation"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:ring-2 focus:ring-[#2F6F5E] mt-1"
            />
          </div>

          <div>
            <label className="font-semibold text-[#14213D]">Commission Percentage (%)</label>
            <input
              type="number"
              step="0.01"
              placeholder="e.g. 12.5"
              value={commissionPercentage}
              onChange={(e) => setCommissionPercentage(e.target.value)}
              className="w-full px-3 py-2 bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:ring-2 focus:ring-[#2F6F5E] mt-1"
            />
          </div>

          <div>
            <label className="font-semibold text-[#14213D]">Commission Basis (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Subsidy Value / Invoice Value"
              value={commissionBasis}
              onChange={(e) => setCommissionBasis(e.target.value)}
              className="w-full px-3 py-2 bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:ring-2 focus:ring-[#2F6F5E] mt-1"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#EDEAE1]">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={saving}>
              Save Dealer
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default DealersPage;
