import React, { useEffect, useState } from "react";
import { Scale, Plus, Edit2, RefreshCw, Trash2, CheckCircle, XCircle, Search } from "lucide-react";
import { plastApi } from "../../api/plastApi.js";
import Navbar from "../../components/layout/Navbar.jsx";
import Button from "../../components/common/Button.jsx";
import Modal from "../../components/common/Modal.jsx";
import CustomSelect from "../../components/common/CustomSelect.jsx";
import { SkeletonLoader, EmptyState } from "../../components/common/SkeletonLoader.jsx";
import { formatDate } from "../../utils/dates.js";
import { toast } from "sonner";

export function PlastUnitsPage() {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [actionError, setActionError] = useState("");

  // Modal State (Add / Edit)
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Delete Confirmation Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [unitToDelete, setUnitToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUnits = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    try {
      const params = search.trim() ? { search: search.trim() } : {};
      const data = await plastApi.getUnits(params);
      const validUnits = Array.isArray(data) ? data : data?.data || [];
      setUnits(validUnits);
    } catch (err) {
      console.error("Failed to load Plast units:", err);
      toast.error(err.response?.data?.message || err.message || "Failed to load units");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUnits();
    }, 200);
    return () => clearTimeout(timer);
  }, [search]);

  const handleOpenAdd = () => {
    setEditingUnit(null);
    setName("");
    setSymbol("");
    setIsActive(true);
    setErrorMsg("");
    setModalOpen(true);
  };

  const handleOpenEdit = (unit) => {
    setEditingUnit(unit);
    setName(unit.name || "");
    setSymbol(unit.symbol || "");
    setIsActive(unit.is_active !== undefined ? unit.is_active : true);
    setErrorMsg("");
    setModalOpen(true);
  };

  const handlePromptDelete = (unit) => {
    setUnitToDelete(unit);
    setActionError("");
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!unitToDelete) return;
    try {
      setDeleting(true);
      await plastApi.deleteUnit(unitToDelete.id);
      toast.success(`Unit "${unitToDelete.name}" deleted successfully`);
      setDeleteModalOpen(false);
      setUnitToDelete(null);
      fetchUnits();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to delete unit";
      setActionError(msg);
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("Unit name is required.");
      return;
    }

    try {
      setSaving(true);
      setErrorMsg("");

      const payload = {
        name: name.trim(),
        symbol: symbol.trim() ? symbol.trim() : name.trim().slice(0, 3).toUpperCase(),
        is_active: isActive,
      };

      if (editingUnit) {
        await plastApi.updateUnit(editingUnit.id, payload);
        toast.success(`Unit "${payload.name}" updated successfully`);
      } else {
        await plastApi.createUnit(payload);
        toast.success(`Unit "${payload.name}" created successfully`);
      }

      setModalOpen(false);
      fetchUnits();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to save unit";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const safeUnits = Array.isArray(units) ? units : [];

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#FAFAF8] min-h-screen">
      <Navbar
        title="Units of Measurement"
        subtitle="Manage measurement units used across raw materials, production, and sales"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              onClick={() => fetchUnits(true)}
              loading={refreshing}
            >
              Refresh
            </Button>
            <Button size="sm" icon={Plus} onClick={handleOpenAdd}>
              Add Unit
            </Button>
          </div>
        }
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 overflow-y-auto w-full">
        {actionError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-[8px] flex items-center justify-between">
            <span>{actionError}</span>
            <button
              onClick={() => setActionError("")}
              className="text-rose-600 font-bold hover:text-rose-800 ml-2 cursor-pointer"
            >
              ×
            </button>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="bg-white p-3 sm:p-4 border border-[#E4E1D8] rounded-[10px] shadow-[0_1px_2px_rgba(20,33,61,0.04)] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C97AB]" />
            <input
              type="text"
              placeholder="Search units (e.g. Kilograms, Kg, Numbers, Nos, Meter)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-[#E4E1D8] rounded-[7px] text-[#14213D] placeholder-[#8C97AB] focus:outline-none focus:border-[#2F6F5E]"
            />
          </div>
          <div className="text-xs text-[#52607D]">
            Total Units: <strong className="text-[#14213D] font-mono">{safeUnits.length}</strong>
          </div>
        </div>

        {/* Units Table */}
        <div className="bg-white rounded-[10px] border border-[#E4E1D8] shadow-[0_1px_2px_rgba(20,33,61,0.04)] overflow-hidden">
          <div className="p-4 border-b border-[#EDEAE1] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scale size={16} className="text-[#2F6F5E]" />
              <h2 className="text-sm font-bold font-display text-[#14213D]">
                Plast Unit Master Directory
              </h2>
            </div>
            <span className="text-xs text-[#52607D]">
              Dynamic measurement units for Cheran Plast
            </span>
          </div>

          {loading ? (
            <div className="p-6">
              <SkeletonLoader count={4} />
            </div>
          ) : safeUnits.length === 0 ? (
            <EmptyState
              icon={Scale}
              title="No measurement units found"
              description={
                search
                  ? "No units match your search query. Try clearing filters."
                  : "Create custom measurement units to use for raw materials, production batches, and sales."
              }
              action={
                <Button size="sm" icon={Plus} onClick={handleOpenAdd}>
                  Add First Unit
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAFAF8] border-b border-[#EDEAE1] text-[#52607D] font-semibold">
                  <tr>
                    <th className="py-3 px-4">Unit Name</th>
                    <th className="py-3 px-4">Symbol / Abbreviation</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Created Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDEAE1] text-[#14213D]">
                  {safeUnits.map((u) => (
                    <tr key={u.id} className="hover:bg-[#FAFAF8] transition-colors">
                      <td className="py-3 px-4 font-bold text-[#14213D]">
                        {u.name}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-[#1E4D40] font-mono text-xs font-bold border border-emerald-200">
                          {u.symbol || "—"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {u.is_active ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <CheckCircle size={12} /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                            <XCircle size={12} /> Inactive
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-[#52607D] font-mono">
                        {formatDate(u.created_at)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(u)}
                            title="Edit Unit"
                            className="p-1.5 text-[#52607D] hover:text-[#2F6F5E] hover:bg-[#EAF3F0] rounded-[6px] transition-colors cursor-pointer"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePromptDelete(u)}
                            title="Delete Unit"
                            className="p-1.5 text-[#52607D] hover:text-[#B0403A] hover:bg-[#FDF2F1] rounded-[6px] transition-colors cursor-pointer"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Add / Edit Unit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingUnit ? "Edit Measurement Unit" : "Add New Measurement Unit"}
        size="sm"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-[8px]">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#14213D] mb-1">
              Unit Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Kilograms, Numbers / Pieces, Meters"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#14213D] mb-1">
              Symbol / Short Code <span className="text-[#8C97AB] font-normal">(e.g. Kg, Nos, Mtr)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. KG"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D] font-mono"
            />
            <span className="text-[10px] text-[#8C97AB] mt-0.5 block">
              Displayed on sales receipts, stock ledgers, and production cards.
            </span>
          </div>

          <div>
            <CustomSelect
              label="Status"
              searchable={false}
              value={isActive ? "true" : "false"}
              onChange={(val) => setIsActive(val === "true")}
              options={[
                { value: "true", label: "Active (Available for Items)" },
                { value: "false", label: "Inactive (Hidden from Dropdowns)" },
              ]}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#EDEAE1]">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={saving}>
              {editingUnit ? "Save Changes" : "Create Unit"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Unit Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Measurement Unit"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-[#52607D]">
            Are you sure you want to permanently delete unit{" "}
            <strong className="text-[#14213D]">"{unitToDelete?.name}"</strong> ({unitToDelete?.symbol})?
          </p>
          <p className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-[7px] border border-amber-200">
            Units currently assigned to existing raw materials or finished goods cannot be deleted.
          </p>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#EDEAE1]">
            <Button variant="secondary" type="button" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" type="button" loading={deleting} onClick={handleConfirmDelete}>
              Delete Unit
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default PlastUnitsPage;
