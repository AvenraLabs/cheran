import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Check, AlertTriangle, Settings, Percent, Calendar, ShieldCheck, RefreshCw } from "lucide-react";
import api from "../api/client.js";
import Navbar from "../components/layout/Navbar.jsx";
import Button from "../components/common/Button.jsx";
import Modal from "../components/common/Modal.jsx";
import { SkeletonLoader, EmptyState } from "../components/common/SkeletonLoader.jsx";
import { formatDate } from "../utils/dates.js";

export function SettingsPage() {
  const [slabs, setSlabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlab, setEditingSlab] = useState(null);
  const [formData, setFormData] = useState({
    effective_from: "",
    effective_to: "",
    gst_percentage: "5.0",
    fittings_percentage: "5.0",
    description: "",
  });
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Delete Confirmation Modal State
  const [deleteTargetSlab, setDeleteTargetSlab] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchSlabs = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/settings/tax-slabs");
      const list = res.data?.slabs || res.slabs || (Array.isArray(res.data) ? res.data : []);
      setSlabs(list);
    } catch (err) {
      console.error("Failed to load tax slabs:", err);
      setError("Failed to load GST settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlabs();
  }, []);

  const handleOpenAdd = () => {
    setEditingSlab(null);
    setFormData({
      effective_from: "",
      effective_to: "",
      gst_percentage: "5.0",
      fittings_percentage: "5.0",
      description: "",
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (slab) => {
    setEditingSlab(slab);
    setFormData({
      effective_from: slab.effective_from || "",
      effective_to: slab.effective_to || "",
      gst_percentage: String(slab.gst_percentage),
      fittings_percentage: String(slab.fittings_percentage),
      description: slab.description || "",
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanFrom = (formData.effective_from || "").trim();
    const cleanTo = formData.effective_to ? formData.effective_to.trim() : null;

    if (!cleanFrom) {
      setFormError("Effective From Date is required.");
      return;
    }

    if (cleanTo && cleanTo < cleanFrom) {
      setFormError("Effective To Date cannot be earlier than Effective From Date.");
      return;
    }

    // Client-side overlap validation
    const newEnd = cleanTo || "9999-12-31";
    for (const existing of slabs) {
      if (editingSlab && existing.id === editingSlab.id) continue;
      const exFrom = existing.effective_from;
      const exTo = existing.effective_to || "9999-12-31";

      if (cleanFrom <= exTo && newEnd >= exFrom) {
        const slabDesc = existing.description || `${existing.gst_percentage}% GST`;
        const exToStr = existing.effective_to ? formatDate(existing.effective_to) : "Ongoing";
        setFormError(
          `Date Conflict: The date range (${formatDate(cleanFrom)} to ${cleanTo ? formatDate(cleanTo) : "Ongoing"}) clashes with existing slab '${slabDesc}' (${formatDate(exFrom)} to ${exToStr}). Tax slabs cannot have overlapping dates.`
        );
        return;
      }
    }

    setFormSaving(true);
    setFormError("");

    const payload = {
      effective_from: cleanFrom,
      effective_to: cleanTo,
      gst_percentage: parseFloat(formData.gst_percentage) || 0,
      fittings_percentage: parseFloat(formData.fittings_percentage) || 5.0,
      description: formData.description ? formData.description.trim() : null,
    };

    try {
      if (editingSlab) {
        await api.put(`/settings/tax-slabs/${editingSlab.id}`, payload);
        setSuccessMsg("Tax slab updated successfully.");
      } else {
        await api.post("/settings/tax-slabs", payload);
        setSuccessMsg("New tax slab added successfully.");
      }
      setIsModalOpen(false);
      fetchSlabs();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || "Failed to save.");
    } finally {
      setFormSaving(false);
    }
  };

  const handleDeleteClick = (slab) => {
    setDeleteTargetSlab(slab);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetSlab) return;
    try {
      setDeleting(true);
      await api.delete(`/settings/tax-slabs/${deleteTargetSlab.id}`);
      setSuccessMsg("Tax rate deleted successfully.");
      setDeleteTargetSlab(null);
      fetchSlabs();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setError("Failed to delete tax rate.");
    } finally {
      setDeleting(false);
    }
  };

  const activeSlab = slabs.find((s) => !s.effective_to) || slabs[slabs.length - 1];

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Navbar
        title="Govt Scheme GST & Fittings Settings"
        subtitle="Configure historical and active tax slabs applied during Government project calculations"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              onClick={fetchSlabs}
            >
              Refresh
            </Button>
            <Button variant="primary" size="sm" onClick={handleOpenAdd} icon={Plus}>
              Add Date Rate
            </Button>
          </div>
        }
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 overflow-y-auto">
        {successMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-[10px] text-xs font-bold text-emerald-900 flex items-center gap-2 shadow-xs">
            <Check size={16} className="text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-[10px] text-xs font-bold text-rose-900 flex items-center gap-2 shadow-xs">
            <AlertTriangle size={16} className="text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Top Info / Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-4 shadow-[0_1px_2px_rgba(20,33,61,0.04)]">
            <div className="flex items-center justify-between text-xs text-[#52607D]">
              <span className="font-semibold uppercase tracking-wider">Current Active GST</span>
              <Percent size={16} className="text-[#2F6F5E]" />
            </div>
            <div className="text-2xl font-extrabold font-mono text-[#14213D] mt-2">
              {activeSlab ? `${activeSlab.gst_percentage}%` : "5.00%"}
            </div>
            <div className="text-[11px] text-[#2F6F5E] font-medium mt-0.5">
              {activeSlab ? `Effective from ${formatDate(activeSlab.effective_from)}` : "Standard Active Rate"}
            </div>
          </div>

          <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-4 shadow-[0_1px_2px_rgba(20,33,61,0.04)]">
            <div className="flex items-center justify-between text-xs text-[#52607D]">
              <span className="font-semibold uppercase tracking-wider">Standard Fittings Cost</span>
              <ShieldCheck size={16} className="text-[#2F6F5E]" />
            </div>
            <div className="text-2xl font-extrabold font-mono text-[#14213D] mt-2">
              {activeSlab ? `${activeSlab.fittings_percentage}%` : "5.00%"}
            </div>
            <div className="text-[11px] text-[#52607D] mt-0.5">
              Reimbursed to assigned dealer
            </div>
          </div>

          <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-4 shadow-[0_1px_2px_rgba(20,33,61,0.04)]">
            <div className="flex items-center justify-between text-xs text-[#52607D]">
              <span className="font-semibold uppercase tracking-wider">Configured Tax Slabs</span>
              <Calendar size={16} className="text-[#52607D]" />
            </div>
            <div className="text-2xl font-extrabold font-mono text-[#14213D] mt-2">
              {slabs.length}
            </div>
            <div className="text-[11px] text-[#52607D] mt-0.5">
              Evaluated dynamically by Project Invoice Date
            </div>
          </div>
        </div>

        {/* Tax Slabs Table */}
        <div className="bg-white border border-[#E4E1D8] rounded-[10px] shadow-[0_1px_2px_rgba(20,33,61,0.04)] overflow-hidden">
          <div className="p-4 border-b border-[#E4E1D8] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#14213D] flex items-center gap-2">
                <Settings size={16} className="text-[#2F6F5E]" />
                GST & Fittings Date Slabs
              </h3>
              <p className="text-xs text-[#52607D] mt-0.5">
                Each Government Project dynamically resolves its GST rate based on its exact Invoice Date.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="p-6">
              <SkeletonLoader rows={4} />
            </div>
          ) : slabs.length === 0 ? (
            <EmptyState
              title="No Rates Configured"
              description="Click 'Add Date Rate' to add a GST & Fittings date range."
              action={
                <Button size="sm" icon={Plus} onClick={handleOpenAdd}>
                  Add Date Rate
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAFAF8] border-b border-[#E4E1D8] text-[#52607D] uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">From Date</th>
                    <th className="py-3 px-4">To Date</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">GST %</th>
                    <th className="py-3 px-4 text-center">Fittings %</th>
                    <th className="py-3 px-4">Description / Notes</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDEAE1]">
                  {slabs.map((s) => (
                    <tr key={s.id} className="hover:bg-[#FAFAF8]">
                      <td className="py-3 px-4 font-mono font-bold text-[#14213D]">
                        {formatDate(s.effective_from)}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        {s.effective_to ? (
                          <span className="font-semibold text-[#14213D]">{formatDate(s.effective_to)}</span>
                        ) : (
                          <span className="text-[#52607D] italic">Ongoing</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {!s.effective_to ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EAF3F0] text-[#2F6F5E] border border-[#2F6F5E]/30">
                            Current Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FAFAF8] text-[#52607D] border border-[#E4E1D8]">
                            Historical Slab
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-extrabold text-[#14213D] text-sm">
                        {s.gst_percentage}%
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-[#14213D]">
                        {s.fittings_percentage}%
                      </td>
                      <td className="py-3 px-4 text-[#52607D]">
                        {s.description || "—"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={Edit2}
                            onClick={() => handleOpenEdit(s)}
                            className="px-2 py-1"
                            title="Edit Slab"
                          >
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            icon={Trash2}
                            onClick={() => handleDeleteClick(s)}
                            className="px-2 py-1"
                            title="Delete Slab"
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
          )}
        </div>
      </main>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSlab ? "Edit Tax Slab" : "Add Tax Slab"}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#14213D] mb-1">
                Effective From Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={formData.effective_from}
                onChange={(e) => setFormData({ ...formData, effective_from: e.target.value })}
                className="w-full px-3 py-2 font-mono bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] text-[#14213D] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E]"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-[#14213D] mb-1">
                Effective To Date
              </label>
              <input
                type="date"
                value={formData.effective_to}
                onChange={(e) => setFormData({ ...formData, effective_to: e.target.value })}
                placeholder="Leave blank for ongoing"
                className="w-full px-3 py-2 font-mono bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] text-[#14213D] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E]"
              />
              <span className="text-[10px] text-[#52607D]">Leave empty if current active</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#14213D] mb-1">
                GST Percentage (%) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                min="0"
                max="100"
                placeholder="e.g. 5 or 12"
                value={formData.gst_percentage}
                onChange={(e) => setFormData({ ...formData, gst_percentage: e.target.value })}
                className="w-full px-3 py-2 font-mono font-bold bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] text-[#14213D] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E]"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-[#14213D] mb-1">
                Fittings Percentage (%) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                min="0"
                max="100"
                placeholder="5.0"
                value={formData.fittings_percentage}
                onChange={(e) => setFormData({ ...formData, fittings_percentage: e.target.value })}
                className="w-full px-3 py-2 font-mono font-bold bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] text-[#14213D] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#14213D] mb-1">
              Description / Scheme Reference (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Post-Sep 2025 Revised 5% GST Scheme"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] text-[#14213D] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E]"
            />
          </div>

          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-[8px] text-rose-800 text-xs flex items-center gap-2">
              <AlertTriangle size={15} className="text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-[#EDEAE1]">
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={formSaving} icon={Check}>
              Save Tax Slab
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteTargetSlab)}
        onClose={() => setDeleteTargetSlab(null)}
        title="Confirm Delete Rate"
        maxWidth="max-w-sm"
      >
        {deleteTargetSlab && (
          <div className="space-y-4 text-xs">
            <div className="flex items-start gap-3 p-3 bg-rose-50 border border-rose-200 rounded-[8px]">
              <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <Trash2 size={16} />
              </div>
              <div className="space-y-1">
                <div className="font-bold text-rose-950 text-xs">
                  Are you sure you want to delete this GST rate?
                </div>
                <div className="text-rose-800 text-[11px]">
                  <strong>{formatDate(deleteTargetSlab.effective_from)}</strong> to{" "}
                  <strong>
                    {deleteTargetSlab.effective_to
                      ? formatDate(deleteTargetSlab.effective_to)
                      : "Current Active"}
                  </strong>{" "}
                  ({deleteTargetSlab.gst_percentage}% GST)
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#EDEAE1]">
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={() => setDeleteTargetSlab(null)}
              >
                Cancel
              </Button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-3 py-1.5 rounded-[6px] text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {deleting ? "Deleting..." : "Yes, Delete Rate"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default SettingsPage;
