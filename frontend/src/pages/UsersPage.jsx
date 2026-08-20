import React, { useEffect, useState } from "react";
import {
  Users as UsersIcon,
  UserPlus,
  Shield,
  ShieldAlert,
  User,
  Edit2,
  Trash2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import Navbar from "../components/layout/Navbar.jsx";
import Button from "../components/common/Button.jsx";
import Modal from "../components/common/Modal.jsx";
import Pagination from "../components/common/Pagination.jsx";
import CustomSelect from "../components/common/CustomSelect.jsx";
import { SkeletonLoader, EmptyState } from "../components/common/SkeletonLoader.jsx";
import { formatDate } from "../utils/dates.js";

export function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 1 });

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    role: "USER",
    is_active: true,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Delete / Confirmation Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = async (page = 1, limit = pagination.limit) => {
    try {
      setLoading(true);
      const res = await api.get("/users", { params: { page, limit } });
      setUsers(res.data?.users || []);
      setPagination(res.data?.pagination || { page, limit, total: 0, totalPages: 1 });
    } catch (err) {
      console.error("Failed to load users:", err);
      toast.error(err.message || "Failed to load user list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1, pagination.limit);
  }, []);

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({
      name: "",
      username: "",
      password: "",
      role: "USER",
      is_active: true,
    });
    setShowPassword(false);
    setErrorMsg("");
    setModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name || "",
      username: user.username || "",
      password: "", // empty means unchanged
      role: user.role || "USER",
      is_active: user.is_active,
    });
    setShowPassword(false);
    setErrorMsg("");
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMsg("Full name is required.");
      return;
    }
    if (!formData.username.trim()) {
      setErrorMsg("Username is required.");
      return;
    }
    if (!editingUser && (!formData.password || formData.password.length < 6)) {
      setErrorMsg("Password must be at least 6 characters for a new account.");
      return;
    }

    try {
      setSaving(true);
      setErrorMsg("");

      if (editingUser) {
        const payload = {
          name: formData.name.trim(),
          username: formData.username.trim(),
          role: formData.role,
          is_active: formData.is_active,
        };
        if (formData.password && formData.password.trim()) {
          payload.password = formData.password.trim();
        }
        await api.patch(`/users/${editingUser.id}`, payload);
        toast.success(`User '${formData.username}' updated successfully!`);
      } else {
        await api.post("/users", {
          name: formData.name.trim(),
          username: formData.username.trim(),
          password: formData.password.trim(),
          role: formData.role,
          is_active: formData.is_active,
        });
        toast.success(`User '${formData.username}' created successfully!`);
      }

      setModalOpen(false);
      fetchUsers(pagination.page, pagination.limit);
    } catch (err) {
      setErrorMsg(err.message || "Failed to save user.");
    } finally {
      setSaving(false);
    }
  };

  const handlePromptDelete = (user) => {
    setUserToDelete(user);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    try {
      setDeleting(true);
      await api.delete(`/users/${userToDelete.id}`);
      toast.success(`User '${userToDelete.username}' deleted successfully.`);
      setDeleteModalOpen(false);
      setUserToDelete(null);
      fetchUsers(pagination.page, pagination.limit);
    } catch (err) {
      toast.error(err.message || "Failed to delete user.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#FAFAF8]">
      <Navbar
        title="User Management & Access Control"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" icon={RefreshCw} onClick={() => fetchUsers(pagination.page, pagination.limit)}>
              Refresh
            </Button>
            <Button variant="primary" icon={UserPlus} onClick={handleOpenAdd}>
              Add
            </Button>
          </div>
        }
      />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 overflow-y-auto max-w-7xl">
        {/* Users Table */}
        <div className="bg-[#FFFFFF] border border-[#E4E1D8] rounded-[10px] shadow-[0_1px_2px_rgba(20,33,61,0.04)] overflow-hidden">
          {loading ? (
            <div className="p-6">
              <SkeletonLoader rows={6} />
            </div>
          ) : users.length === 0 ? (
            <EmptyState
              icon={UsersIcon}
              title="No users found"
              description="No user accounts match your search filters. Click 'Add User' to create a new user account."
              action={
                <Button variant="primary" icon={UserPlus} onClick={handleOpenAdd}>
                  Add
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#EDEAE1] bg-[#FAFAF8] text-[#52607D] font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Username</th>
                    <th className="py-3 px-4">Role & Access Scope</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Created Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDEAE1]">
                  {users.map((u) => {
                    const isAdmin = u.role === "ADMIN";
                    const isSelf = currentUser?.id === u.id;

                    return (
                      <tr key={u.id} className="hover:bg-[#FAFAF8] transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 font-mono ${
                                isAdmin
                                  ? "bg-[#2F6F5E]/15 text-[#2F6F5E]"
                                  : "bg-[#14213D]/10 text-[#14213D]"
                              }`}
                            >
                              {u.name?.charAt(0)?.toUpperCase() || u.username?.charAt(0)?.toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-[#14213D] flex items-center gap-1.5">
                                {u.name}
                                {isSelf && (
                                  <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded font-mono font-medium">
                                    You
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          {u.role === "ADMIN" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#EAF3F0] text-[#2F6F5E] border border-[#2F6F5E]/20">
                              <Shield size={12} /> Admin (Full Access)
                            </span>
                          ) : u.role === "DEALER" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              <UsersIcon size={12} /> Dealer (Projects & Imports)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-blue-50 text-blue-800 border border-blue-200">
                              <User size={12} /> User (Operations & Sales)
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          {u.is_active ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                              <CheckCircle2 size={12} /> Active
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
                              title="Edit user details or reset password"
                              className="p-1.5 text-[#52607D] hover:text-[#2F6F5E] hover:bg-[#EAF3F0] rounded-[6px] transition-colors cursor-pointer"
                            >
                              <Edit2 size={15} />
                            </button>
                            {!isSelf && (
                              <button
                                type="button"
                                onClick={() => handlePromptDelete(u)}
                                title="Delete user account"
                                className="p-1.5 text-[#52607D] hover:text-[#B0403A] hover:bg-[#FDF2F1] rounded-[6px] transition-colors cursor-pointer"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {pagination.totalPages > 1 && (
            <div className="p-4 border-t border-[#EDEAE1]">
              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={(p) => fetchUsers(p, pagination.limit)}
              />
            </div>
          )}
        </div>
      </main>

      {/* Add / Edit User Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingUser ? `Edit User: ${editingUser.username}` : "Create New User Account"}
      >
        <form onSubmit={handleSave} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-[8px] flex items-center gap-2">
              <ShieldAlert size={16} /> {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#14213D] mb-1">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. John Doe"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#14213D] mb-1">
              Username <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. jdoe"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D] font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#14213D] mb-1">
              {editingUser ? "New Password (leave blank to retain existing)" : "Password *"}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required={!editingUser}
                placeholder={editingUser ? "••••••••" : "Minimum 6 characters"}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-3 pr-10 py-2 text-xs bg-[#FAFAF8] border border-[#E4E1D8] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#2F6F5E] text-[#14213D]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8C97AB] hover:text-[#14213D] cursor-pointer"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <CustomSelect
                label="Assigned Role"
                required
                searchable={false}
                value={formData.role}
                onChange={(val) => setFormData({ ...formData, role: val })}
                options={[
                  { value: "ADMIN", label: "Admin (Full ERP Access)" },
                  { value: "USER", label: "User (Dashboard, Projects, Sales & Uploads)" },
                  { value: "DEALER", label: "Dealer (Projects, Imports & Directory Only)" },
                ]}
              />
            </div>

            <div>
              <CustomSelect
                label="Account Status"
                searchable={false}
                value={formData.is_active ? "true" : "false"}
                onChange={(val) => setFormData({ ...formData, is_active: val === "true" })}
                options={[
                  { value: "true", label: "Active (Can Login)" },
                  { value: "false", label: "Inactive (Suspended)" },
                ]}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#EDEAE1]">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={saving}>
              {editingUser ? "Save" : "Create"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete User Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm User Deletion"
      >
        <div className="space-y-4">
          <p className="text-xs text-[#52607D]">
            Are you sure you want to permanently delete user{" "}
            <strong className="text-[#14213D]">'{userToDelete?.username}'</strong> ({userToDelete?.name})?
          </p>
          <p className="text-[11px] text-[#8C97AB]">
            This action cannot be undone. The user will immediately lose access to all system functions.
          </p>
          <div className="flex justify-end gap-2 pt-3 border-t border-[#EDEAE1]">
            <Button variant="secondary" type="button" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              type="button"
              loading={deleting}
              onClick={handleConfirmDelete}
              icon={Trash2}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default UsersPage;
