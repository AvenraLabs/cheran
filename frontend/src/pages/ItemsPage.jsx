import React, { useEffect, useState } from "react";
import { Package, Plus, Edit2, RefreshCw, Layers, CheckCircle, XCircle } from "lucide-react";
import api from "../api/client.js";
import Navbar from "../components/layout/Navbar.jsx";
import Button from "../components/common/Button.jsx";
import CustomSelect from "../components/common/CustomSelect.jsx";
import Modal from "../components/common/Modal.jsx";
import Pagination from "../components/common/Pagination.jsx";
import { SkeletonLoader, EmptyState } from "../components/common/SkeletonLoader.jsx";

const ITEM_TYPES = [
  { value: "", label: "All Item Types" },
  { value: "RAW_MATERIAL", label: "Raw Material" },
  { value: "FINISHED_GOOD", label: "Finished Good" },
];

export function ItemsPage() {
  const [items, setItems] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 1 });

  // Filters
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [itemType, setItemType] = useState("FINISHED_GOOD");
  const [unitId, setUnitId] = useState("");
  const [category, setCategory] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchUnits = async () => {
    try {
      const res = await api.get("/units?is_active=true");
      setUnits(res.data?.units || []);
      if (!unitId && res.data?.units?.length > 0) {
        setUnitId(res.data.units[0].id);
      }
    } catch (err) {
      console.error("Failed to load units:", err);
    }
  };

  const fetchItems = async (page = 1, limit = pagination.limit) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
        ...(search ? { search: search.trim() } : {}),
        ...(selectedType ? { item_type: selectedType } : {}),
      };

      const res = await api.get("/items", { params });
      setItems(res.data?.items || []);
      setPagination(res.data?.pagination || { page, limit, total: 0, totalPages: 1 });
    } catch (err) {
      console.error("Failed to load items:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchItems(1, pagination.limit);
    }, 280);
    return () => clearTimeout(timer);
  }, [search, selectedType]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setCode("");
    setName("");
    setItemType("FINISHED_GOOD");
    setUnitId(units.length > 0 ? units[0].id : "");
    setCategory("");
    setUnitPrice("");
    setIsActive(true);
    setErrorMsg("");
    setModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setCode(item.code || "");
    setName(item.name);
    setItemType(item.item_type);
    setUnitId(item.unit_id);
    setCategory(item.category || "");
    setUnitPrice(item.unit_price !== undefined && item.unit_price !== null ? item.unit_price : "");
    setIsActive(item.is_active);
    setErrorMsg("");
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("Item name is required.");
      return;
    }
    if (!unitId) {
      setErrorMsg("Measurement unit is required.");
      return;
    }

    try {
      setSaving(true);
      setErrorMsg("");

      const payload = {
        code: code ? code.trim() : null,
        name: name.trim(),
        item_type: itemType,
        unit_id: unitId,
        category: category ? category.trim() : null,
        unit_price: unitPrice !== "" ? parseFloat(unitPrice) : 0,
        is_active: isActive,
      };

      if (editingItem) {
        await api.patch(`/items/${editingItem.id}`, payload);
      } else {
        await api.post("/items", payload);
      }

      setModalOpen(false);
      fetchItems(pagination.page, pagination.limit);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to save item.");
    } finally {
      setSaving(false);
    }
  };

  const getItemTypeBadge = (type) => {
    switch (type) {
      case "RAW_MATERIAL":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">Raw Material</span>;
      case "FINISHED_GOOD":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">Finished Good</span>;
      case "TRADING_ITEM":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">Trading Item</span>;
      case "ACCESSORY":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-800 border border-purple-200">Accessory</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-700">{type}</span>;
    }
  };

  const unitOptions = units.map((u) => ({
    value: u.id,
    label: `${u.name} (${u.symbol})`,
  }));

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Navbar
        title="Item Master & Catalog"
        subtitle={`Standard product and materials catalog (${pagination.total.toLocaleString()} items registered)`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" icon={RefreshCw} onClick={() => fetchItems(pagination.page, pagination.limit)}>
              Refresh
            </Button>
            <Button icon={Plus} onClick={handleOpenAdd}>
              Add Item
            </Button>
          </div>
        }
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 overflow-y-auto">
        {/* Dynamic Filter Strip */}
        <div className="bg-white border border-[#E4E1D8] rounded-[10px] p-4 shadow-[0_1px_2px_rgba(20,33,61,0.04)] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search by code, item name, category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-80 px-3 py-2 text-xs bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
            />

            <div className="w-48">
              <CustomSelect
                options={ITEM_TYPES}
                value={selectedType}
                onChange={(val) => setSelectedType(val)}
                placeholder="All Item Types"
              />
            </div>
          </div>

          <div className="text-xs text-[#52607D]">
            Total: <strong className="text-[#14213D]">{pagination.total}</strong> items
          </div>
        </div>

        {/* Items Table */}
        <div className="bg-white border border-[#E4E1D8] rounded-[10px] shadow-[0_1px_2px_rgba(20,33,61,0.04)] overflow-hidden">
          {loading ? (
            <div className="p-6">
              <SkeletonLoader rows={8} />
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              title="No items found"
              description="Register raw materials, finished pipes, valves, and accessories in your catalog."
              action={
                <Button size="sm" icon={Plus} onClick={handleOpenAdd}>
                  Add Item
                </Button>
              }
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAFAF8] border-b border-[#E4E1D8] text-[#52607D] uppercase font-semibold">
                    <tr>
                      <th className="py-3 px-4">Item Code</th>
                      <th className="py-3 px-4">Item Name</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Default Unit</th>
                      <th className="py-3 px-4 text-right">Price / Unit</th>
                      <th className="py-3 px-4 text-right">Current Stock</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDEAE1]">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-[#FAFAF8] transition-colors">
                        <td className="py-3 px-4 font-mono text-[#52607D]">
                          {item.code || "—"}
                        </td>
                        <td className="py-3 px-4 font-semibold text-[#14213D] flex items-center gap-2">
                          <Package size={14} className="text-[#2F6F5E]" />
                          {item.name}
                        </td>
                        <td className="py-3 px-4">
                          {getItemTypeBadge(item.item_type)}
                        </td>
                        <td className="py-3 px-4 text-[#52607D]">
                          {item.category || "—"}
                        </td>
                        <td className="py-3 px-4 font-mono font-medium text-[#14213D]">
                          {item.unit?.name || item.unit?.symbol || "—"}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-[#2F6F5E]">
                          ₹{parseFloat(item.unit_price || 0).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-[#14213D]">
                          {parseFloat(item.stock?.quantity_on_hand || 0).toLocaleString()}{" "}
                          <span className="text-[10px] text-[#52607D] font-normal">{item.unit?.name || item.unit?.symbol}</span>
                        </td>
                        <td className="py-3 px-4">
                          {item.is_active ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                              <CheckCircle size={12} /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                              <XCircle size={12} /> Inactive
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={Edit2}
                            onClick={() => handleOpenEdit(item)}
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
                onPageChange={(p) => fetchItems(p, pagination.limit)}
                onLimitChange={(l) => fetchItems(1, l)}
              />
            </>
          )}
        </div>
      </main>

      {/* Add / Edit Item Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? "Edit Catalog Item" : "Add New Item to Catalog"}
      >
        <form onSubmit={handleSave} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-[8px]">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#14213D] mb-1">
                Item Code / SKU
              </label>
              <input
                type="text"
                placeholder="e.g. RM-PVC-01, FG-PIPE-63"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#14213D] mb-1">
                Item Type <span className="text-rose-500">*</span>
              </label>
              <CustomSelect
                options={ITEM_TYPES.filter((t) => t.value !== "")}
                value={itemType}
                onChange={(val) => setItemType(val)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#14213D] mb-1">
              Item Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. PVC Resin K67, PVC Pipe 63mm 4kg, Ball Valve 63mm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#14213D] mb-1">
                Default Measurement Unit <span className="text-rose-500">*</span>
              </label>
              <CustomSelect
                options={units.map((u) => ({ value: u.id, label: u.name || u.symbol }))}
                value={unitId}
                onChange={(val) => setUnitId(val)}
                placeholder="Select Unit"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#14213D] mb-1">
                Category
              </label>
              <input
                type="text"
                placeholder="e.g. Polymer, Pipes, Fittings"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#14213D] mb-1">
              Default Price / Rate per Unit (₹)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="e.g. 85.00"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="itemActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="accent-[#2F6F5E] rounded"
            />
            <label htmlFor="itemActive" className="text-xs text-[#14213D] font-medium cursor-pointer">
              Active item in sales & stock receipts
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-[#EDEAE1]">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editingItem ? "Save Changes" : "Create Item"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default ItemsPage;
