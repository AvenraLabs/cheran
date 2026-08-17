import React, { useEffect, useState } from "react";
import { Plus, Users, Search, RefreshCw, Edit2, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import api from "../api/client.js";
import Navbar from "../components/layout/Navbar.jsx";
import Button from "../components/common/Button.jsx";
import Modal from "../components/common/Modal.jsx";
import Pagination from "../components/common/Pagination.jsx";
import { SkeletonLoader, EmptyState } from "../components/common/SkeletonLoader.jsx";

export function DealersPage() {
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });

  // Add Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [commissionPercentage, setCommissionPercentage] = useState("");
  const [commissionBasis, setCommissionBasis] = useState("");
  const [saving, setSaving] = useState(false);

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingDealer, setEditingDealer] = useState(null);
  const [editName, setEditName] = useState("");
  const [editCommission, setEditCommission] = useState("");
  const [editCommissionBasis, setEditCommissionBasis] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Delete Confirmation State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingDealer, setDeletingDealer] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchDealers = async (page = 1, limit = pagination.limit) => {
    try {
      setLoading(true);
      const res = await api.get("/dealers", { params: { search, page, limit } });
      setDealers(res.data?.dealers || []);
      setPagination(res.data?.pagination || { page, limit, total: 0, totalPages: 1 });
    } catch (err) {
      console.error("Failed to fetch dealers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDealers(1, pagination.limit);
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
      fetchDealers(1, pagination.limit);
    } catch (err) {
      toast.error(err.message || "Failed to create dealer");
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (dealer) => {
    setEditingDealer(dealer);
    setEditName(dealer.name || "");
    setEditCommission(dealer.commission_percentage || "");
    setEditCommissionBasis(dealer.commission_basis || "");
    setEditIsActive(dealer.is_active !== false);
    setEditModalOpen(true);
  };

  const handleUpdateDealer = async (e) => {
    e.preventDefault();
    if (!editingDealer) return;

    try {
      setUpdating(true);
      await api.patch(`/dealers/${editingDealer.id}`, {
        name: editName,
        commission_percentage: editCommission !== "" ? parseFloat(editCommission) : null,
        commission_basis: editCommissionBasis || null,
        is_active: editIsActive,
      });

      toast.success(`Dealer '${editName}' updated successfully`);
      setEditModalOpen(false);
      fetchDealers(pagination.page, pagination.limit);
    } catch (err) {
      toast.error(err.message || "Failed to update dealer");
    } finally {
      setUpdating(false);
    }
  };

  const openDeleteModal = (dealer) => {
    setDeletingDealer(dealer);
    setDeleteModalOpen(true);
  };

  const handleDeleteDealer = async () => {
    if (!deletingDealer) return;

    try {
      setDeleting(true);
      await api.delete(`/dealers/${deletingDealer.id}`);
      toast.success(`Dealer '${deletingDealer.name}' deleted successfully`);
      setDeleteModalOpen(false);
      fetchDealers(pagination.page, pagination.limit);
    } catch (err) {
      toast.error(err.message || "Failed to delete dealer");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Navbar
        title="Dealers Directory"
        subtitle="Manage verified micro-irrigation dealers, distributors, and commissions"
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

          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            onClick={() => fetchDealers(pagination.page, pagination.limit)}
          >
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
              title="No dealers found"
              description="Click 'Add Dealer' to register your first partner dealer."
              action={
                <Button size="sm" icon={Plus} onClick={() => setCreateModalOpen(true)}>
                  Add Dealer
                </Button>
              }
            />
          ) : (
            <>
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
                      <th className="py-3 px-4 text-right">Actions</th>
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
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={Edit2}
                              onClick={() => openEditModal(d)}
                              className="px-2 py-1"
                              title="Edit Dealer"
                            >
                              Edit
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              icon={Trash2}
                              onClick={() => openDeleteModal(d)}
                              className="px-2 py-1"
                              title="Delete Dealer"
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Reusable Pagination */}
              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                limit={pagination.limit}
                limitOptions={[20, 50, 100]}
                onPageChange={(newPage) => fetchDealers(newPage, pagination.limit)}
                onLimitChange={(newLimit) => fetchDealers(1, newLimit)}
              />
            </>
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

      {/* Edit Dealer Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`Edit Dealer: ${editingDealer?.name}`}
      >
        <form onSubmit={handleUpdateDealer} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-[#14213D]">Dealer / Firm Name *</label>
            <input
              type="text"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-3 py-2 bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:ring-2 focus:ring-[#2F6F5E] mt-1"
            />
          </div>

          <div>
            <label className="font-semibold text-[#14213D]">Commission Percentage (%)</label>
            <input
              type="number"
              step="0.01"
              value={editCommission}
              onChange={(e) => setEditCommission(e.target.value)}
              className="w-full px-3 py-2 bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:ring-2 focus:ring-[#2F6F5E] mt-1"
            />
          </div>

          <div>
            <label className="font-semibold text-[#14213D]">Commission Basis</label>
            <input
              type="text"
              value={editCommissionBasis}
              onChange={(e) => setEditCommissionBasis(e.target.value)}
              className="w-full px-3 py-2 bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:ring-2 focus:ring-[#2F6F5E] mt-1"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="editIsActive"
              checked={editIsActive}
              onChange={(e) => setEditIsActive(e.target.checked)}
              className="rounded border-[#E4E1D8] text-[#2F6F5E] focus:ring-[#2F6F5E]"
            />
            <label htmlFor="editIsActive" className="font-semibold text-[#14213D] cursor-pointer">
              Dealer is Active
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#EDEAE1]">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={updating}>
              Update Dealer
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Delete Dealer"
      >
        <div className="space-y-4 text-xs">
          <p className="text-[#14213D]">
            Are you sure you want to delete dealer <strong>{deletingDealer?.name}</strong>?
          </p>
          <p className="text-[#52607D]">
            Any existing government projects associated with this dealer will have their dealer assignment set to unassigned.
          </p>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#EDEAE1]">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              loading={deleting}
              onClick={handleDeleteDealer}
            >
              Delete Dealer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default DealersPage;
