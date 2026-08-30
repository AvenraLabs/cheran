import React, { useEffect, useState } from "react";
import {
  Users,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Phone,
  MapPin,
  UserCheck,
} from "lucide-react";
import { plastApi } from "../../api/plastApi.js";
import Navbar from "../../components/layout/Navbar.jsx";
import MetricCard from "../../components/common/MetricCard.jsx";
import Button from "../../components/common/Button.jsx";
import Modal from "../../components/common/Modal.jsx";
import { SkeletonLoader, EmptyState } from "../../components/common/SkeletonLoader.jsx";
import { toast } from "sonner";

export function PlastCustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({ name: "", phone: "", address: "" });
  const [saving, setSaving] = useState(false);

  const fetchCustomers = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await plastApi.getCustomers(search);
      setCustomers(Array.isArray(data) ? data : data?.data || []);
    } catch (err) {
      toast.error("Failed to load customer phonebook");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers();
    }, 200);
    return () => clearTimeout(timer);
  }, [search]);

  const openAddModal = () => {
    setEditingCustomer(null);
    setFormData({ name: "", phone: "", address: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone || "",
      address: customer.address || "",
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Customer name is required");
      return;
    }

    setSaving(true);
    try {
      if (editingCustomer) {
        await plastApi.updateCustomer(editingCustomer.id, {
          name: formData.name.trim(),
          phone: formData.phone.trim() || undefined,
          address: formData.address.trim() || undefined,
        });
        toast.success("Customer updated successfully");
      } else {
        await plastApi.createCustomer({
          name: formData.name.trim(),
          phone: formData.phone.trim() || undefined,
          address: formData.address.trim() || undefined,
        });
        toast.success("Customer created successfully");
      }
      setIsModalOpen(false);
      fetchCustomers();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to save customer");
    } finally {
      setSaving(false);
    }
  };

  const safeCustomers = Array.isArray(customers) ? customers : [];
  const withPhoneCount = safeCustomers.filter((c) => Boolean(c.phone)).length;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Navbar
        title="Customers Phonebook"
        subtitle="Minimal customer contact records for sales billing"
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              loading={refreshing}
              onClick={() => fetchCustomers(true)}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={openAddModal}
            >
              + Add Customer
            </Button>
          </>
        }
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 overflow-y-auto w-full">
        {/* KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <MetricCard
            title="Total Customers"
            value={safeCustomers.length}
            subtitle="Registered buyers in phonebook"
            icon={Users}
          />
          <MetricCard
            title="With Verified Phone"
            value={withPhoneCount}
            subtitle="Direct SMS & billing contacts"
            icon={UserCheck}
          />
        </div>

        {/* Search Bar */}
        <div className="bg-white p-3 sm:p-4 rounded-[10px] border border-[#E4E1D8] shadow-[0_1px_2px_rgba(20,33,61,0.04)]">
          <div className="relative max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C97AB]" />
            <input
              type="text"
              placeholder="Search by customer name or phone number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-[#E4E1D8] rounded-[7px] text-[#14213D] placeholder-[#8C97AB] focus:outline-none focus:border-[#2F6F5E]"
            />
          </div>
        </div>

        {/* Customer Table */}
        <div className="bg-white rounded-[10px] border border-[#E4E1D8] shadow-[0_1px_2px_rgba(20,33,61,0.04)] overflow-hidden">
          {loading ? (
            <div className="p-6">
              <SkeletonLoader count={4} />
            </div>
          ) : safeCustomers.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No customers found"
              description="Add customers with name and phone number for faster invoice billing."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] border-b border-[#EDEAE1] text-[#52607D] font-semibold">
                  <tr>
                    <th className="py-3 px-4">Customer Name</th>
                    <th className="py-3 px-4">Phone Number</th>
                    <th className="py-3 px-4">Address / City</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDEAE1]">
                  {safeCustomers.map((cust) => (
                    <tr key={cust.id} className="hover:bg-[#FAFAF8] transition-colors">
                      <td className="py-3 px-4 font-bold text-[#14213D]">{cust.name}</td>
                      <td className="py-3 px-4 font-mono font-medium text-[#2F6F5E]">
                        {cust.phone ? (
                          <a href={`tel:${cust.phone}`} className="hover:underline flex items-center gap-1">
                            <Phone size={12} />
                            <span>{cust.phone}</span>
                          </a>
                        ) : (
                          <span className="text-[#8C97AB]">No phone</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-[#52607D]">{cust.address || "—"}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => openEditModal(cust)}
                          className="p-1 text-[#2F6F5E] hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                          title="Edit Customer"
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

      {/* Add / Edit Customer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCustomer ? "Edit Customer" : "Add New Customer"}
        size="sm"
      >
        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-[#14213D] mb-1">
              Customer / Business Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Ramesh Kumar / Senthil Traders"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E4E1D8] rounded-[6px] text-[#14213D] focus:outline-none focus:border-[#2F6F5E]"
            />
          </div>

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
              Address / Town
            </label>
            <textarea
              rows={2}
              placeholder="Town, District"
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
              {editingCustomer ? "Update Customer" : "Save Customer"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default PlastCustomersPage;
