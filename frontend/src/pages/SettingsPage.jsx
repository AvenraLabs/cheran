import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Check, AlertTriangle, Settings } from "lucide-react";
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
  });
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState("");

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
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.effective_from) {
      setFormError("From Date is required.");
      return;
    }

    setFormSaving(true);
    setFormError("");

    const payload = {
      effective_from: formData.effective_from,
      effective_to: formData.effective_to || null,
      gst_percentage: parseFloat(formData.gst_percentage) || 0,
      fittings_percentage: parseFloat(formData.fittings_percentage) || 5.0,
      description: null,
    };

    try {
      if (editingSlab) {
        await api.put(`/settings/tax-slabs/${editingSlab.id}`, payload);
        setSuccessMsg("Settings updated successfully.");
      } else {
        await api.post("/settings/tax-slabs", payload);
        setSuccessMsg("New date rate added successfully.");
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

  // Delete Confirmation Modal State
  const [deleteTargetSlab, setDeleteTargetSlab] = useState(null);
  const [deleting, setDeleting] = useState(false);

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

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#F4F2EB] min-h-screen">
      <Navbar
        title="Govt Scheme GST & Fittings Settings"
        actions={
          <Button variant="primary" size="sm" onClick={handleOpenAdd} icon={Plus}>
            Add Date Rate
          </Button>
        }
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-5 flex-1 overflow-y-auto">
        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-[8px] text-xs font-bold text-emerald-900 flex items-center gap-2">
            <Check size={14} className="text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-300 rounded-[8px] text-xs font-bold text-rose-900 flex items-center gap-2">
            <AlertTriangle size={14} className="text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <div className="bg-white border border-[#E4E1D8] rounded-[12px] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#EDEAE1] pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#14213D]">
                GST & Fittings Rates
              </h3>
            </div>
          </div>

          {loading ? (
            <SkeletonLoader count={2} />
          ) : slabs.length === 0 ? (
            <EmptyState
              title="No Rates Configured"
              description="Click 'Add Date Rate' to add a GST & Fittings date range."
            />
          ) : (
            <div className="border border-[#EDEAE1] rounded-[8px] overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#FAFAF8] border-b border-[#EDEAE1] text-[#52607D] uppercase font-semibold text-[10px]">
                  <tr>
                    <th className="py-2.5 px-4">From Date</th>
                    <th className="py-2.5 px-4">To Date</th>
                    <th className="py-2.5 px-4 text-center">GST %</th>
                    <th className="py-2.5 px-4 text-center">Fittings %</th>
                    <th className="py-2.5 px-4 text-center w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDEAE1]">
                  {slabs.map((s) => (
                    <tr key={s.id} className="hover:bg-[#F9F8F5]">
                      <td className="py-2.5 px-4 font-mono font-bold text-[#14213D]">
                        {formatDate(s.effective_from)}
                      </td>
                      <td className="py-2.5 px-4 font-mono">
                        {s.effective_to ? (
                          <span className="font-bold text-[#14213D]">{formatDate(s.effective_to)}</span>
                        ) : (
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[10px]">
                            Current Active
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-center font-mono font-bold text-[#14213D]">
                        {s.gst_percentage}%
                      </td>
                      <td className="py-2.5 px-4 text-center font-mono font-bold text-[#14213D]">
                        {s.fittings_percentage}%
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(s)}
                            className="p-1 text-[#52607D] hover:text-[#2F6F5E] hover:bg-gray-100 rounded cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(s)}
                            className="p-1 text-[#52607D] hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={13} />
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

      {/* Add / Edit Simple Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSlab ? "Edit Date Rate" : "Add Date Rate"}
        maxWidth="max-w-sm"
      >
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-[#14213D] mb-1">
              From Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={formData.effective_from}
              onChange={(e) => setFormData({ ...formData, effective_from: e.target.value })}
              className="w-full px-3 py-1.5 font-mono bg-[#FAFAF8] border border-[#E4E1D8] rounded-[6px] text-[#14213D] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E]"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-[#14213D] mb-1">
              To Date (Leave empty for active)
            </label>
            <input
              type="date"
              value={formData.effective_to}
              onChange={(e) => setFormData({ ...formData, effective_to: e.target.value })}
              className="w-full px-3 py-1.5 font-mono bg-[#FAFAF8] border border-[#E4E1D8] rounded-[6px] text-[#14213D] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#14213D] mb-1">
                GST % <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                placeholder="e.g. 5 or 12"
                value={formData.gst_percentage}
                onChange={(e) => setFormData({ ...formData, gst_percentage: e.target.value })}
                className="w-full px-3 py-1.5 font-mono font-bold bg-[#FAFAF8] border border-[#E4E1D8] rounded-[6px] text-[#14213D] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E]"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-[#14213D] mb-1">
                Fittings % <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                placeholder="5.0"
                value={formData.fittings_percentage}
                onChange={(e) => setFormData({ ...formData, fittings_percentage: e.target.value })}
                className="w-full px-3 py-1.5 font-mono font-bold bg-[#FAFAF8] border border-[#E4E1D8] rounded-[6px] text-[#14213D] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E]"
                required
              />
            </div>
          </div>

          {formError && (
            <div className="p-2 bg-rose-50 border border-rose-200 rounded text-rose-800 text-[11px]">
              {formError}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-[#EDEAE1]">
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={formSaving} icon={Check}>
              Save
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
