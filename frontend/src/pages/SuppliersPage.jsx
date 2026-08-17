import React, { useEffect, useState } from "react";
import { Truck, Plus, Edit2, RefreshCw, Phone, Mail, MapPin } from "lucide-react";
import api from "../api/client.js";
import Navbar from "../components/layout/Navbar.jsx";
import Button from "../components/common/Button.jsx";
import Modal from "../components/common/Modal.jsx";
import Pagination from "../components/common/Pagination.jsx";
import { SkeletonLoader, EmptyState } from "../components/common/SkeletonLoader.jsx";

export function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 1 });
  const [search, setSearch] = useState("");

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchSuppliers = async (page = 1, limit = pagination.limit) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
        ...(search ? { search: search.trim() } : {}),
      };
      const res = await api.get("/suppliers", { params });
      setSuppliers(res.data?.suppliers || []);
      setPagination(res.data?.pagination || { page, limit, total: 0, totalPages: 1 });
    } catch (err) {
      console.error("Failed to load suppliers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSuppliers(1, pagination.limit);
    }, 280);
    return () => clearTimeout(timer);
  }, [search]);

  const handleOpenAdd = () => {
    setEditingSupplier(null);
    setName("");
    setPhone("");
    setEmail("");
    setAddress("");
    setGstNumber("");
    setErrorMsg("");
    setModalOpen(true);
  };

  const handleOpenEdit = (sup) => {
    setEditingSupplier(sup);
    setName(sup.name);
    setPhone(sup.phone || "");
    setEmail(sup.email || "");
    setAddress(sup.address || "");
    setGstNumber(sup.gst_number || "");
    setErrorMsg("");
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("Supplier name is required.");
      return;
    }

    try {
      setSaving(true);
      setErrorMsg("");

      const payload = {
        name: name.trim(),
        phone: phone ? phone.trim() : null,
        email: email ? email.trim() : null,
        address: address ? address.trim() : null,
        gst_number: gstNumber ? gstNumber.trim() : null,
      };

      if (editingSupplier) {
        await api.patch(`/suppliers/${editingSupplier.id}`, payload);
      } else {
        await api.post("/suppliers", payload);
      }

      setModalOpen(false);
      fetchSuppliers(pagination.page, pagination.limit);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to save supplier.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Navbar
        title="Suppliers & Vendors"
        subtitle={`Directory of material vendors & manufacturers (${pagination.total.toLocaleString()} suppliers)`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" icon={RefreshCw} onClick={() => fetchSuppliers(pagination.page, pagination.limit)}>
              Refresh
            </Button>
            <Button icon={Plus} onClick={handleOpenAdd}>
              Add Supplier
            </Button>
          </div>
        }
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 overflow-y-auto">
        <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-4 shadow-[0_1px_2px_rgba(20,33,61,0.04)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <input
            type="text"
            placeholder="Search suppliers by name, phone, GST..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:max-w-md px-3 py-2 text-xs bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
          />
          <div className="text-xs text-[#52607D]">
            Total: <strong className="text-[#14213D]">{pagination.total}</strong> suppliers
          </div>
        </div>

        <div className="bg-white border border-[#E4E1D8] rounded-[10px] shadow-[0_1px_2px_rgba(20,33,61,0.04)] overflow-hidden">
          {loading ? (
            <div className="p-6">
              <SkeletonLoader rows={6} />
            </div>
          ) : suppliers.length === 0 ? (
            <EmptyState
              title="No suppliers found"
              description="Register raw material and equipment suppliers to record stock purchases."
              action={
                <Button size="sm" icon={Plus} onClick={handleOpenAdd}>
                  Add Supplier
                </Button>
              }
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAFAF8] border-b border-[#E4E1D8] text-[#52607D] uppercase font-semibold">
                    <tr>
                      <th className="py-3 px-4">Supplier Name</th>
                      <th className="py-3 px-4">Contact Info</th>
                      <th className="py-3 px-4">GST Number</th>
                      <th className="py-3 px-4">Address</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDEAE1]">
                    {suppliers.map((sup) => (
                      <tr key={sup.id} className="hover:bg-[#FAFAF8] transition-colors">
                        <td className="py-3 px-4 font-semibold text-[#14213D] flex items-center gap-2">
                          <Truck size={14} className="text-[#2F6F5E]" />
                          {sup.name}
                        </td>
                        <td className="py-3 px-4 text-[#52607D] space-y-0.5">
                          {sup.phone && (
                            <div className="flex items-center gap-1 text-[11px]">
                              <Phone size={11} /> {sup.phone}
                            </div>
                          )}
                          {sup.email && (
                            <div className="flex items-center gap-1 text-[11px]">
                              <Mail size={11} /> {sup.email}
                            </div>
                          )}
                          {!sup.phone && !sup.email && "—"}
                        </td>
                        <td className="py-3 px-4 font-mono font-medium text-[#14213D]">
                          {sup.gst_number || "—"}
                        </td>
                        <td className="py-3 px-4 text-[#52607D] max-w-xs truncate">
                          {sup.address || "—"}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={Edit2}
                            onClick={() => handleOpenEdit(sup)}
                          >
                            Edit
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                limit={pagination.limit}
                onPageChange={(p) => fetchSuppliers(p, pagination.limit)}
                onLimitChange={(l) => fetchSuppliers(1, l)}
              />
            </>
          )}
        </div>
      </main>

      {/* Add / Edit Supplier Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingSupplier ? "Edit Supplier Details" : "Add New Supplier"}
      >
        <form onSubmit={handleSave} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-[8px]">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#14213D] mb-1">
              Supplier / Company Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Reliance Polymers Ltd, Supreme Industries"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#14213D] mb-1">
                Phone Number
              </label>
              <input
                type="text"
                placeholder="e.g. 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#14213D] mb-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="e.g. orders@supplier.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#14213D] mb-1">
              GST Number
            </label>
            <input
              type="text"
              placeholder="e.g. 33AABCR1234F1Z5"
              value={gstNumber}
              onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 text-xs font-mono uppercase bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#14213D] mb-1">
              Address / Plant Location
            </label>
            <textarea
              rows={2}
              placeholder="Address details..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-[#EDEAE1]">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editingSupplier ? "Save Changes" : "Create Supplier"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default SuppliersPage;
