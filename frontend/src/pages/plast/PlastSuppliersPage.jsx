import React, { useEffect, useState } from "react";
import {
  Truck,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Phone,
  Building,
  FileText,
} from "lucide-react";
import { plastApi } from "../../api/plastApi.js";
import Navbar from "../../components/layout/Navbar.jsx";
import MetricCard from "../../components/common/MetricCard.jsx";
import Button from "../../components/common/Button.jsx";
import Modal from "../../components/common/Modal.jsx";
import { SkeletonLoader, EmptyState } from "../../components/common/SkeletonLoader.jsx";
import { toast } from "sonner";

export function PlastSuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    gst_number: "",
    address: "",
  });
  const [saving, setSaving] = useState(false);

  const fetchSuppliers = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await plastApi.getSuppliers(search);
      setSuppliers(Array.isArray(data) ? data : data?.data || []);
    } catch (err) {
      toast.error("Failed to load suppliers directory");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSuppliers();
    }, 200);
    return () => clearTimeout(timer);
  }, [search]);

  const openAddModal = () => {
    setEditingSupplier(null);
    setFormData({
      name: "",
      phone: "",
      email: "",
      gst_number: "",
      address: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      phone: supplier.phone || "",
      email: supplier.email || "",
      gst_number: supplier.gst_number || "",
      address: supplier.address || "",
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Supplier name is required");
      return;
    }

    setSaving(true);
    try {
      if (editingSupplier) {
        await plastApi.updateSupplier(editingSupplier.id, {
          name: formData.name.trim(),
          phone: formData.phone.trim() || undefined,
          email: formData.email.trim() || undefined,
          gst_number: formData.gst_number.trim() || undefined,
          address: formData.address.trim() || undefined,
        });
        toast.success("Supplier updated successfully");
      } else {
        await plastApi.createSupplier({
          name: formData.name.trim(),
          phone: formData.phone.trim() || undefined,
          email: formData.email.trim() || undefined,
          gst_number: formData.gst_number.trim() || undefined,
          address: formData.address.trim() || undefined,
        });
        toast.success("Supplier added successfully");
      }
      setIsModalOpen(false);
      fetchSuppliers();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to save supplier");
    } finally {
      setSaving(false);
    }
  };

  const safeSuppliers = Array.isArray(suppliers) ? suppliers : [];
  const withPhoneCount = safeSuppliers.filter((v) => Boolean(v.phone)).length;
  const withGstCount = safeSuppliers.filter((v) => Boolean(v.gst_number)).length;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Navbar
        title="Suppliers"
        subtitle="Raw material supplier contacts and vendor master"
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              loading={refreshing}
              onClick={() => fetchSuppliers(true)}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={openAddModal}
            >
              + Add Supplier
            </Button>
          </>
        }
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 overflow-y-auto w-full">
        {/* KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricCard
            title="Total Suppliers"
            value={safeSuppliers.length}
            subtitle="Registered raw material suppliers"
            icon={Truck}
          />
          <MetricCard
            title="Direct Phone Contacts"
            value={withPhoneCount}
            subtitle="Suppliers with verified phone"
            icon={Phone}
          />
          <MetricCard
            title="GST Registered Suppliers"
            value={withGstCount}
            subtitle="With GSTIN tax identifiers"
            icon={FileText}
          />
        </div>

        {/* Search Bar */}
        <div className="bg-white p-3 sm:p-4 rounded-[10px] border border-[#E4E1D8] shadow-[0_1px_2px_rgba(20,33,61,0.04)]">
          <div className="relative max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C97AB]" />
            <input
              type="text"
              placeholder="Search suppliers by name, phone, or GST..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-[#E4E1D8] rounded-[7px] text-[#14213D] placeholder-[#8C97AB] focus:outline-none focus:border-[#2F6F5E]"
            />
          </div>
        </div>

        {/* Suppliers Table */}
        <div className="bg-white rounded-[10px] border border-[#E4E1D8] shadow-[0_1px_2px_rgba(20,33,61,0.04)] overflow-hidden">
          {loading ? (
            <div className="p-6">
              <SkeletonLoader count={4} />
            </div>
          ) : safeSuppliers.length === 0 ? (
            <EmptyState
              icon={Truck}
              title="No suppliers found"
              description="Add raw material & polymer suppliers to record inward material purchases."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] border-b border-[#EDEAE1] text-[#52607D] font-semibold">
                  <tr>
                    <th className="py-3 px-4">Supplier Name</th>
                    <th className="py-3 px-4">Phone Number</th>
                    <th className="py-3 px-4">GST Number</th>
                    <th className="py-3 px-4">Address / Location</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDEAE1]">
                  {safeSuppliers.map((supplier) => (
                    <tr key={supplier.id} className="hover:bg-[#FAFAF8] transition-colors">
                      <td className="py-3 px-4 font-bold text-[#14213D]">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded bg-[#EAF3F0] text-[#2F6F5E] flex items-center justify-center font-bold text-[10px]">
                            {supplier.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <span>{supplier.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-[#2F6F5E]">
                        {supplier.phone ? (
                          <a href={`tel:${supplier.phone}`} className="hover:underline flex items-center gap-1">
                            <Phone size={12} />
                            <span>{supplier.phone}</span>
                          </a>
                        ) : (
                          <span className="text-[#8C97AB]">No phone</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-[#52607D]">
                        {supplier.gst_number ? (
                          <span className="px-2 py-0.5 rounded bg-[#FAFAF8] border border-[#E4E1D8] font-bold text-[#14213D]">
                            {supplier.gst_number}
                          </span>
                        ) : (
                          <span className="text-[#8C97AB]">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-[#52607D]">{supplier.address || "—"}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => openEditModal(supplier)}
                          className="p-1 text-[#2F6F5E] hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                          title="Edit Supplier"
                        >
                          <Edit2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Add / Edit Supplier Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSupplier ? "Edit Supplier" : "Add New Supplier"}
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-[#14213D] mb-1">
              Supplier / Business Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Supreme Polymer Corp / R.K. Granules"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E4E1D8] rounded-[6px] text-[#14213D] focus:outline-none focus:border-[#2F6F5E]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#14213D] mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                placeholder="10-digit mobile number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E4E1D8] rounded-[6px] text-[#14213D] font-mono focus:outline-none focus:border-[#2F6F5E]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#14213D] mb-1">
                GST Number
              </label>
              <input
                type="text"
                placeholder="15-digit GSTIN"
                value={formData.gst_number}
                onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E4E1D8] rounded-[6px] text-[#14213D] font-mono uppercase focus:outline-none focus:border-[#2F6F5E]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#14213D] mb-1">
              Email Address
            </label>
            <input
              type="email"
              placeholder="supplier@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E4E1D8] rounded-[6px] text-[#14213D] focus:outline-none focus:border-[#2F6F5E]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#14213D] mb-1">
              Address / Location
            </label>
            <textarea
              rows={2}
              placeholder="Factory address, Town, District"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E4E1D8] rounded-[6px] text-[#14213D] focus:outline-none focus:border-[#2F6F5E]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#EDEAE1]">
            <Button type="button" variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={saving}>
              {editingSupplier ? "Update Supplier" : "Save Supplier"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default PlastSuppliersPage;
