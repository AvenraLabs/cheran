import React, { useEffect, useState } from "react";
import { Scale, Plus, Edit2, RefreshCw, CheckCircle, XCircle, Trash2 } from "lucide-react";
import api from "../api/client.js";
import Navbar from "../components/layout/Navbar.jsx";
import Button from "../components/common/Button.jsx";
import Modal from "../components/common/Modal.jsx";
import { SkeletonLoader, EmptyState } from "../components/common/SkeletonLoader.jsx";

export function UnitsPage() {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionError, setActionError] = useState("");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchUnits = async () => {
    try {
      setLoading(true);
      const params = search ? { search: search.trim() } : {};
      const res = await api.get("/units", { params });
      setUnits(res.data?.units || []);
    } catch (err) {
      console.error("Failed to load units:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUnits();
    }, 250);
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
    setName(unit.name);
    setSymbol(unit.symbol || "");
    setIsActive(unit.is_active);
    setErrorMsg("");
    setModalOpen(true);
  };

  const handleDeleteUnit = async (unit) => {
    if (!window.confirm(`Are you sure you want to delete unit "${unit.name}" (${unit.symbol})?`)) {
      return;
    }
    try {
      setActionError("");
      await api.delete(`/units/${unit.id}`);
      fetchUnits();
    } catch (err) {
      setActionError(err.response?.data?.message || err.message || "Failed to delete unit.");
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
        symbol: symbol.trim() ? symbol.trim().toUpperCase() : name.trim().toUpperCase(),
        is_active: isActive,
      };

      if (editingUnit) {
        await api.patch(`/units/${editingUnit.id}`, payload);
      } else {
        await api.post("/units", payload);
      }

      setModalOpen(false);
      fetchUnits();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || "Failed to save unit.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#FAFAF8] min-h-screen">
      <Navbar
        title="Units of Measurement"
        subtitle="Manage measurement units used across inventory and items"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" icon={RefreshCw} onClick={fetchUnits} loading={loading}>
              Refresh
            </Button>
            <Button size="sm" icon={Plus} onClick={handleOpenAdd}>
              Add
            </Button>
          </div>
        }
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 overflow-y-auto">
        {actionError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-[8px] flex items-center justify-between">
            <span>{actionError}</span>
            <button
              onClick={() => setActionError("")}
              className="text-rose-600 font-bold hover:text-rose-800 ml-2"
            >
              ×
            </button>
          </div>
        )}

        {/* Filter Bar */}
        <div className="bg-white p-4 border border-[#E4E1D8] rounded-[10px] shadow-[0_1px_2px_rgba(20,33,61,0.04)] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search units (e.g. Kilogram, KG, Meter, NOS)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
            />
          </div>
          <div className="text-xs text-[#52607D]">
            Total Units: <strong className="text-[#14213D]">{units.length}</strong>
          </div>
        </div>

        {/* Units Table */}
        <div className="bg-white border border-[#E4E1D8] rounded-[10px] shadow-[0_1px_2px_rgba(20,33,61,0.04)] overflow-hidden">
          {loading ? (
            <div className="p-6">
              <SkeletonLoader rows={6} />
            </div>
          ) : units.length === 0 ? (
            <EmptyState
              title="No units found"
              description="Create your first measurement unit to use in catalog items."
              action={
                <Button size="sm" icon={Plus} onClick={handleOpenAdd}>
                  Add
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAFAF8] border-b border-[#E4E1D8] text-[#52607D] uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">Unit Name</th>
                    <th className="py-3 px-4">Symbol / Code</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Created Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDEAE1]">
                  {units.map((u) => (
                    <tr key={u.id} className="hover:bg-[#FAFAF8] transition-colors">
                      <td className="py-3 px-4 font-semibold text-sm text-[#14213D] flex items-center gap-2">
                        <Scale size={14} className="text-[#2F6F5E]" />
                        {u.name}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-xs text-[#2F6F5E]">
                        {u.symbol || "—"}
                      </td>
                      <td className="py-3 px-4">
                        {u.is_active ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EAF3F0] text-[#2F6F5E]">
                            <CheckCircle size={10} /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700">
                            <XCircle size={10} /> Inactive
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-[#52607D] font-mono">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="xs"
                            icon={Edit2}
                            onClick={() => handleOpenEdit(u)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="xs"
                            icon={Trash2}
                            onClick={() => handleDeleteUnit(u)}
                            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
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

      {/* Add / Edit Unit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingUnit ? "Edit Measurement Unit" : "Add New Measurement Unit"}
      >
        <form onSubmit={handleSave} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-[8px]">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#14213D] mb-1">
              Unit Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Kilogram, Meter, Pieces / Numbers, Litre, Box"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!editingUnit && (!symbol || symbol === name.toUpperCase().slice(0, 4))) {
                  setSymbol(e.target.value.toUpperCase().slice(0, 5));
                }
              }}
              className="w-full px-3 py-2 text-xs bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#14213D] mb-1">
              Symbol / Short Code <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. KG, MTR, NOS, LTR, BOX, SET"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 text-xs font-mono font-bold uppercase bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
              required
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="accent-[#2F6F5E] rounded"
            />
            <label htmlFor="isActive" className="text-xs text-[#14213D] font-medium cursor-pointer">
              Active for item selection
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-[#EDEAE1]">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editingUnit ? "Save" : "Create"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default UnitsPage;
