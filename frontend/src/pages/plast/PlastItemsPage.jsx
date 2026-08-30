import React, { useEffect, useState } from "react";
import {
  Package,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  Boxes,
  TrendingUp,
} from "lucide-react";
import { plastApi } from "../../api/plastApi.js";
import Navbar from "../../components/layout/Navbar.jsx";
import MetricCard from "../../components/common/MetricCard.jsx";
import Button from "../../components/common/Button.jsx";
import Modal from "../../components/common/Modal.jsx";
import CustomSelect from "../../components/common/CustomSelect.jsx";
import { SkeletonLoader, EmptyState } from "../../components/common/SkeletonLoader.jsx";
import { toast } from "sonner";

export function PlastItemsPage() {
  const [items, setItems] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState("ALL");
  const [search, setSearch] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    item_type: "FINISHED_GOOD",
    category: "",
    unit_id: "",
    unit_price: "",
    initial_stock: "",
  });
  const [saving, setSaving] = useState(false);

  const fetchItems = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await plastApi.getItems({
        item_type: filterType === "ALL" ? undefined : filterType,
        search: search || undefined,
      });
      setItems(Array.isArray(data) ? data : data?.data || []);
    } catch (err) {
      toast.error("Failed to load items");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchUnits = async () => {
    try {
      const data = await plastApi.getUnits();
      const validUnits = Array.isArray(data) ? data : data?.data || [];
      setUnits(validUnits);
      if (validUnits.length > 0 && !formData.unit_id) {
        setFormData((prev) => ({ ...prev, unit_id: validUnits[0].id }));
      }
    } catch (err) {}
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchItems();
    }, 200);
    return () => clearTimeout(timer);
  }, [filterType, search]);

  const openAddModal = (type = "FINISHED_GOOD") => {
    setEditingItem(null);
    setFormData({
      name: "",
      item_type: type,
      category: "",
      unit_id: units[0]?.id || "",
      unit_price: "",
      initial_stock: "0",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      item_type: item.item_type,
      category: item.category || "",
      unit_id: item.unit_id || units[0]?.id || "",
      unit_price: String(item.unit_price || ""),
      initial_stock: "0",
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Item name is required");
      return;
    }

    setSaving(true);
    try {
      if (editingItem) {
        await plastApi.updateItem(editingItem.id, {
          name: formData.name.trim(),
          item_type: formData.item_type,
          category: formData.category.trim() || undefined,
          unit_id: formData.unit_id || undefined,
          unit_price: parseFloat(formData.unit_price) || 0,
        });
        toast.success("Item updated successfully");
      } else {
        await plastApi.createItem({
          name: formData.name.trim(),
          item_type: formData.item_type,
          category: formData.category.trim() || undefined,
          unit_id: formData.unit_id || undefined,
          unit_price: parseFloat(formData.unit_price) || 0,
          initial_stock: parseFloat(formData.initial_stock) || 0,
        });
        toast.success("Item created successfully");
      }
      setIsModalOpen(false);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to save item");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to deactivate this item?")) return;
    try {
      await plastApi.deleteItem(id);
      toast.success("Item deactivated");
      fetchItems();
    } catch (err) {
      toast.error("Failed to delete item");
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(val || 0);
  };

  const safeItems = Array.isArray(items) ? items : [];
  const rawCount = safeItems.filter((i) => i.item_type === "RAW_MATERIAL").length;
  const finishedCount = safeItems.filter((i) => i.item_type === "FINISHED_GOOD").length;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Navbar
        title="Items"
        subtitle="Manage raw materials and finished goods catalog"
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              loading={refreshing}
              onClick={() => fetchItems(true)}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => openAddModal("FINISHED_GOOD")}
            >
              + Add Item
            </Button>
          </>
        }
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 overflow-y-auto w-full">
        {/* KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricCard
            title="Total Catalog Items"
            value={safeItems.length}
            subtitle="Active SKUs in Master"
            icon={Package}
          />
          <MetricCard
            title="Raw Materials"
            value={rawCount}
            subtitle="Purchased materials & inputs"
            icon={TrendingUp}
          />
          <MetricCard
            title="Finished Goods"
            value={finishedCount}
            subtitle="Manufactured pipes & fittings"
            icon={Boxes}
          />
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-3 sm:p-4 rounded-[10px] border border-[#E4E1D8] shadow-[0_1px_2px_rgba(20,33,61,0.04)] flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Type Tabs */}
          <div className="flex items-center gap-1 bg-[#FAFAF8] p-1 rounded-[8px] border border-[#E4E1D8] w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setFilterType("ALL")}
              className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold transition-all cursor-pointer ${
                filterType === "ALL"
                  ? "bg-white text-[#2F6F5E] shadow-xs font-bold border border-[#E4E1D8]"
                  : "text-[#52607D] hover:text-[#14213D]"
              }`}
            >
              All Items ({safeItems.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType("RAW_MATERIAL")}
              className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold transition-all cursor-pointer ${
                filterType === "RAW_MATERIAL"
                  ? "bg-amber-100 text-amber-900 shadow-xs font-bold border border-amber-200"
                  : "text-[#52607D] hover:text-[#14213D]"
              }`}
            >
              Raw Materials ({rawCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterType("FINISHED_GOOD")}
              className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold transition-all cursor-pointer ${
                filterType === "FINISHED_GOOD"
                  ? "bg-[#EAF3F0] text-[#2F6F5E] shadow-xs font-bold border border-[#D3E6E0]"
                  : "text-[#52607D] hover:text-[#14213D]"
              }`}
            >
              Finished Goods ({finishedCount})
            </button>
          </div>

          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8C97AB]" />
            <input
              type="text"
              placeholder="Search items by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-[#E4E1D8] rounded-[7px] text-[#14213D] placeholder-[#8C97AB] focus:outline-none focus:border-[#2F6F5E]"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-[10px] border border-[#E4E1D8] shadow-[0_1px_2px_rgba(20,33,61,0.04)] overflow-hidden">
          {loading ? (
            <div className="p-6">
              <SkeletonLoader count={5} />
            </div>
          ) : safeItems.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No items found"
              description="Add raw materials (resin, PVC, dyes) or finished goods (pipes, fittings) to get started."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] border-b border-[#EDEAE1] text-[#52607D] font-semibold">
                  <tr>
                    <th className="py-3 px-4">Item Name</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Unit</th>
                    <th className="py-3 px-3 text-right">Selling Price</th>
                    <th className="py-3 px-4 text-right">Current Stock</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDEAE1]">
                  {safeItems.map((item) => {
                    const isRaw = item.item_type === "RAW_MATERIAL";
                    return (
                      <tr key={item.id} className="hover:bg-[#FAFAF8] transition-colors">
                        <td className="py-3 px-4 font-bold text-[#14213D]">{item.name}</td>
                        <td className="py-3 px-3">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              isRaw
                                ? "bg-amber-100 text-amber-900 border border-amber-200"
                                : "bg-[#EAF3F0] text-[#2F6F5E] border border-[#D3E6E0]"
                            }`}
                          >
                            {isRaw ? "Raw Material" : "Finished Good"}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-[#52607D]">{item.category || "—"}</td>
                        <td className="py-3 px-3 text-[#52607D] font-mono">{item.unit?.name || "Kg"}</td>
                        <td className="py-3 px-3 text-right font-medium text-[#14213D]">
                          {formatCurrency(item.unit_price)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-[#14213D]">
                          {item.stock?.quantity_on_hand || 0} {item.unit?.symbol || ""}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openEditModal(item)}
                              className="p-1 text-[#2F6F5E] hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                              title="Edit Item"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(item.id)}
                              className="p-1 text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                              title="Deactivate"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Add / Edit Item Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? "Edit Item" : "Add New Item"}
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-[#14213D] mb-1">
              Item Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 63mm PVC Pipe 4kg"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E4E1D8] rounded-[6px] text-[#14213D] focus:outline-none focus:border-[#2F6F5E]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <CustomSelect
                label="Item Type"
                required
                value={formData.item_type}
                onChange={(val) => setFormData((prev) => ({ ...prev, item_type: val }))}
                options={[
                  { value: "FINISHED_GOOD", label: "Finished Good (Outputs/Sales)" },
                  { value: "RAW_MATERIAL", label: "Raw Material (Purchased)" },
                ]}
              />
            </div>

            <div>
              <CustomSelect
                label="Unit of Measure"
                required
                value={formData.unit_id}
                onChange={(val) => setFormData((prev) => ({ ...prev, unit_id: val }))}
                options={units.map((u) => ({
                  value: u.id,
                  label: `${u.name} (${u.symbol})`,
                }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#14213D] mb-1">
                Category
              </label>
              <input
                type="text"
                placeholder="e.g. PVC Pipes / Resin"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E4E1D8] rounded-[6px] text-[#14213D] focus:outline-none focus:border-[#2F6F5E]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#14213D] mb-1">
                Unit Price (₹)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="0.00"
                value={formData.unit_price}
                onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E4E1D8] rounded-[6px] text-[#14213D] font-mono focus:outline-none focus:border-[#2F6F5E]"
              />
            </div>
          </div>

          {!editingItem && (
            <div>
              <label className="block text-xs font-semibold text-[#14213D] mb-1">
                Initial Opening Stock Quantity
              </label>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="0"
                value={formData.initial_stock}
                onChange={(e) => setFormData({ ...formData, initial_stock: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E4E1D8] rounded-[6px] text-[#14213D] font-mono focus:outline-none focus:border-[#2F6F5E]"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-[#EDEAE1]">
            <Button type="button" variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={saving}>
              {editingItem ? "Update Item" : "Create Item"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default PlastItemsPage;
