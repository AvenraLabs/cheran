import React, { useEffect, useState } from "react";
import { Plus, Users, Search, RefreshCw, Edit2, Trash2, GitMerge, ArrowRight, Info, Percent, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import api from "../api/client.js";
import Navbar from "../components/layout/Navbar.jsx";
import Button from "../components/common/Button.jsx";
import Modal from "../components/common/Modal.jsx";
import CustomSelect from "../components/common/CustomSelect.jsx";
import Pagination from "../components/common/Pagination.jsx";
import { SkeletonLoader, EmptyState } from "../components/common/SkeletonLoader.jsx";
import { formatDate } from "../utils/dates.js";

export function DealersPage() {
  const [dealers, setDealers] = useState([]);
  const [allDealersForSelect, setAllDealersForSelect] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });

  // Bulk / Universal Commission Modal State
  const [bulkCommissionModalOpen, setBulkCommissionModalOpen] = useState(false);
  const [universalCommissionInput, setUniversalCommissionInput] = useState("8.0");
  const [overwriteExisting, setOverwriteExisting] = useState(true);
  const [applyingBulkCommission, setApplyingBulkCommission] = useState(false);

  // Add Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [commissionPercentage, setCommissionPercentage] = useState("");
  const [saving, setSaving] = useState(false);

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingDealer, setEditingDealer] = useState(null);
  const [editName, setEditName] = useState("");
  const [editCommission, setEditCommission] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Delete Confirmation State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingDealer, setDeletingDealer] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Merge Dealers Modal State
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [targetDealerId, setTargetDealerId] = useState("");
  const [sourceDealerId, setSourceDealerId] = useState("");
  const [merging, setMerging] = useState(false);

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

  const fetchAllDealersForMerge = async () => {
    try {
      const res = await api.get("/dealers/options");
      setAllDealersForSelect(res.data?.dealers || res.dealers || []);
    } catch (err) {
      console.error("Failed to load dealers list:", err);
    }
  };

  useEffect(() => {
    fetchDealers(1, pagination.limit);
  }, [search]);

  useEffect(() => {
    fetchAllDealersForMerge();
  }, []);

  const handleCreateDealer = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.post("/dealers", {
        name,
        commission_percentage: commissionPercentage ? parseFloat(commissionPercentage) : null,
      });

      toast.success(`Dealer '${name}' registered successfully`);
      setCreateModalOpen(false);
      setName("");
      setCommissionPercentage("");
      fetchDealers(1, pagination.limit);
      fetchAllDealersForMerge();
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
        is_active: editIsActive,
      });

      toast.success(`Dealer '${editName}' updated successfully`);
      setEditModalOpen(false);
      fetchDealers(pagination.page, pagination.limit);
      fetchAllDealersForMerge();
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
      fetchAllDealersForMerge();
    } catch (err) {
      toast.error(err.message || "Failed to delete dealer");
    } finally {
      setDeleting(false);
    }
  };

  const openMergeModal = () => {
    setTargetDealerId("");
    setSourceDealerId("");
    setMergeModalOpen(true);
  };

  const handleMergeDealers = async (e) => {
    e.preventDefault();
    if (!targetDealerId || !sourceDealerId) {
      toast.error("Please select both the primary dealer to keep and the duplicate dealer to merge.");
      return;
    }

    if (targetDealerId === sourceDealerId) {
      toast.error("Primary dealer and duplicate dealer cannot be the same.");
      return;
    }

    try {
      setMerging(true);
      const res = await api.post("/dealers/merge", {
        target_dealer_id: targetDealerId,
        source_dealer_ids: [sourceDealerId],
      });

      toast.success(res.data?.message || "Dealers merged and records reassigned successfully!");
      setMergeModalOpen(false);
      setTargetDealerId("");
      setSourceDealerId("");
      fetchDealers(pagination.page, pagination.limit);
      fetchAllDealersForMerge();
    } catch (err) {
      toast.error(err.message || "Failed to merge dealers");
    } finally {
      setMerging(false);
    }
  };

  const openUniversalCommissionModal = () => {
    setUniversalCommissionInput("8.0");
    setOverwriteExisting(true);
    setBulkCommissionModalOpen(true);
  };

  const handleSetUniversalCommission = async (e) => {
    e.preventDefault();
    if (universalCommissionInput === "" || isNaN(parseFloat(universalCommissionInput))) {
      toast.error("Please enter a valid commission percentage");
      return;
    }
    const val = parseFloat(universalCommissionInput);
    if (val < 0 || val > 100) {
      toast.error("Commission percentage must be between 0% and 100%");
      return;
    }

    try {
      setApplyingBulkCommission(true);
      const res = await api.post("/dealers/universal-commission", {
        commission_percentage: val,
        overwrite_existing: overwriteExisting,
      });

      toast.success(res.data?.message || `Commission percentage set to ${val}% for all dealers`);
      setBulkCommissionModalOpen(false);
      fetchDealers(pagination.page, pagination.limit);
      fetchAllDealersForMerge();
    } catch (err) {
      toast.error(err.message || "Failed to set universal commission percentage");
    } finally {
      setApplyingBulkCommission(false);
    }
  };

  const targetDealerObj = allDealersForSelect.find((d) => d.id === targetDealerId);
  const sourceDealerObj = allDealersForSelect.find((d) => d.id === sourceDealerId);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Navbar
        title="Dealers Directory"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              icon={Percent}
              onClick={openUniversalCommissionModal}
              title="Set universal standard commission percentage for all dealers"
            >
              Set Commission for All
            </Button>
            <Button variant="secondary" icon={GitMerge} onClick={openMergeModal}>
              Merge
            </Button>
            <Button icon={Plus} onClick={() => setCreateModalOpen(true)}>
              Add Dealer
            </Button>
          </div>
        }
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 overflow-y-auto">
        {/* Search Bar */}
        <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-4 shadow-[0_1px_2px_rgba(20,33,61,0.04)] flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#52607D]" />
            <input
              type="text"
              placeholder="Search dealer by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
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
                  Add
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
                      <th className="py-3 px-4">Created By</th>
                      <th className="py-3 px-4">Last Edited By</th>
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
                        <td className="py-3 px-4 text-[#52607D]">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#FAFAF8] text-[#52607D] border border-[#E4E1D8]">
                            {d.created_by || "—"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[#52607D]">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#FAFAF8] text-[#52607D] border border-[#E4E1D8]">
                            {d.updated_by || d.created_by || "—"}
                          </span>
                        </td>
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
                        <td className="py-3 px-4 text-[#52607D] font-mono">
                          {formatDate(d.created_at)}
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

      {/* MERGE / DEDUPLICATE DEALERS MODAL */}
      <Modal
        isOpen={mergeModalOpen}
        onClose={() => setMergeModalOpen(false)}
        title="Merge & Deduplicate Dealers"
        size="md"
      >
        <form onSubmit={handleMergeDealers} className="space-y-4 text-xs">
          <div className="p-3 bg-[#FAFAF8] border border-[#EDEAE1] rounded-[8px] flex items-start gap-2.5 text-[#52607D]">
            <Info size={16} className="text-[#2F6F5E] shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              Consolidate duplicate dealer entries into one master record. All transactions, sales, and item records linked to the duplicate will be transferred to the master dealer, and the duplicate will be safely removed.
            </p>
          </div>

          <div className="space-y-3.5">
            {/* Target Dealer to Preserve */}
            <div>
              <label className="font-semibold text-[#14213D] block mb-1">
                1. Select Correct / Primary Dealer (To Keep): <span className="text-[#B0403A]">*</span>
              </label>
              <CustomSelect
                options={allDealersForSelect
                  .filter((d) => d.id !== sourceDealerId)
                  .map((d) => ({
                    value: d.id,
                    label: d.name,
                    badge: d.commission_percentage ? `${d.commission_percentage}%` : null,
                  }))}
                value={targetDealerId}
                onChange={(val) => setTargetDealerId(val)}
                placeholder="-- Choose Master Dealer to Preserve --"
                searchable={true}
              />
            </div>

            {/* Source Duplicate Dealer to Merge */}
            <div>
              <label className="font-semibold text-[#14213D] block mb-1">
                2. Select Misspelled / Duplicate Dealer (To Merge & Remove): <span className="text-[#B0403A]">*</span>
              </label>
              <CustomSelect
                options={allDealersForSelect
                  .filter((d) => d.id !== targetDealerId)
                  .map((d) => ({
                    value: d.id,
                    label: d.name,
                    badge: d.commission_percentage ? `${d.commission_percentage}%` : null,
                  }))}
                value={sourceDealerId}
                onChange={(val) => setSourceDealerId(val)}
                placeholder="-- Choose Duplicate Dealer to Merge --"
                searchable={true}
              />
            </div>
          </div>

          {/* Merge Preview Flow */}
          {targetDealerObj && sourceDealerObj && (
            <div className="p-3 bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] flex items-center justify-between gap-3 text-center">
              <div className="flex-1 p-2.5 bg-[#FDF2F1] border border-[#F8D7D5] rounded-[6px]">
                <span className="text-[10px] text-[#B0403A] font-bold uppercase tracking-wider block">Duplicate</span>
                <span className="font-bold text-xs text-[#14213D] truncate block mt-0.5">
                  {sourceDealerObj.name}
                </span>
                <span className="text-[10px] text-[#52607D] block mt-0.5">(Will be removed)</span>
              </div>

              <ArrowRight size={18} className="text-[#2F6F5E] shrink-0" />

              <div className="flex-1 p-2.5 bg-[#EAF3F0] border border-[#D3E6E0] rounded-[6px]">
                <span className="text-[10px] text-[#2F6F5E] font-bold uppercase tracking-wider block">Master Dealer</span>
                <span className="font-bold text-xs text-[#2F6F5E] truncate block mt-0.5">
                  {targetDealerObj.name}
                </span>
                <span className="text-[10px] text-[#52607D] block mt-0.5">(Will retain all records)</span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-[#EDEAE1]">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setMergeModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              loading={merging}
              disabled={!targetDealerId || !sourceDealerId || targetDealerId === sourceDealerId}
              icon={GitMerge}
            >
              Merge Dealers
            </Button>
          </div>
        </form>
      </Modal>

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
              Save
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
              Save
            </Button>
          </div>
        </form>
      </Modal>

      {/* Universal / Bulk Commission Modal */}
      <Modal
        isOpen={bulkCommissionModalOpen}
        onClose={() => setBulkCommissionModalOpen(false)}
        title="Set Universal Commission for All Dealers"
      >
        <form onSubmit={handleSetUniversalCommission} className="space-y-4 text-xs">
          <div className="p-3 bg-[#EAF3F0] rounded-[8px] border border-[#C2DFD6] space-y-1.5 text-xs text-[#2F6F5E]">
            <div className="flex items-center gap-2 font-bold text-[#14213D]">
              <Percent size={15} className="text-[#2F6F5E]" />
              <span>Universal Standard Commission</span>
            </div>
            <p className="text-[#52607D] text-[11px] leading-relaxed">
              This will update the standard commission percentage for all registered dealers across the system. You can still customize or override any dealer's commission individually anytime from the table.
            </p>
          </div>

          <div>
            <label className="block font-semibold text-[#14213D] mb-1">
              Standard Commission Percentage (%) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                required
                placeholder="e.g. 8.0"
                value={universalCommissionInput}
                onChange={(e) => setUniversalCommissionInput(e.target.value)}
                className="w-full px-3 py-2 font-mono font-bold bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D] pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-xs text-[#52607D]">
                %
              </span>
            </div>
          </div>

          <div className="p-3 bg-[#FAFAF8] rounded-[8px] border border-[#EDEAE1] space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="overwriteExisting"
                checked={overwriteExisting}
                onChange={(e) => setOverwriteExisting(e.target.checked)}
                className="rounded border-[#E4E1D8] text-[#2F6F5E] focus:ring-[#2F6F5E] cursor-pointer"
              />
              <label htmlFor="overwriteExisting" className="font-semibold text-[#14213D] cursor-pointer">
                Overwrite dealers with existing custom commission %
              </label>
            </div>
            <div className="text-[11px] text-[#52607D]">
              {overwriteExisting
                ? `Will update all active dealers to ${universalCommissionInput || 0}%.`
                : `Will only assign ${universalCommissionInput || 0}% to dealers who currently have no commission percentage set.`}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#EDEAE1]">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setBulkCommissionModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              loading={applyingBulkCommission}
              icon={CheckCircle2}
            >
              Apply to All Dealers
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
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default DealersPage;
