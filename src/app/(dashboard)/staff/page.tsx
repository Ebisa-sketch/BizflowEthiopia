"use client";

import React, { useState } from "react";
import useSWR from "swr";
import {
  Users,
  UserPlus,
  Shield,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Mail,
  Phone,
  Lock,
  RefreshCw,
  AlertCircle,
  X,
  Trash2,
  SlidersHorizontal,
} from "lucide-react";
import { BusinessRole } from "@/lib/permissions";
import { TableSkeleton } from "@/components/ui/skeleton";
import { DataLoadError } from "@/components/ui/data-load-error";

interface StaffMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: BusinessRole;
  status: "ACTIVE" | "INVITED" | "SUSPENDED";
  joinedDate: string;
}

export default function StaffPage() {
  const { data, error: swrError, isLoading, mutate } = useSWR("/api/staff", {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
    keepPreviousData: true,
  });

  const staffList: StaffMember[] = data?.staff || [];
  const loading = isLoading && !data;
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchStaff = async () => {
    await mutate();
  };

  // Modals
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [managingMember, setManagingMember] = useState<StaffMember | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Add Form
  const [newStaff, setNewStaff] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "CASHIER" as BusinessRole,
  });

  // Manage Form
  const [selectedRole, setSelectedRole] = useState<BusinessRole>("CASHIER");
  const [selectedStatus, setSelectedStatus] = useState<"ACTIVE" | "SUSPENDED">("ACTIVE");

  const showToast = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaff.name.trim() || !newStaff.email.trim()) {
      setError("Please fill out staff name and email.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newStaff.name.trim(),
          email: newStaff.email.trim(),
          phone: newStaff.phone.trim() || undefined,
          password: newStaff.password.trim() || undefined,
          role: newStaff.role,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to add staff member");
      }

      setShowInviteModal(false);
      setNewStaff({ name: "", email: "", phone: "", password: "", role: "CASHIER" });
      showToast(`Staff member "${newStaff.name}" successfully added!`);
      await fetchStaff();
    } catch (err: any) {
      setError(err.message || "Failed to add staff member");
    } finally {
      setSubmitting(false);
    }
  };

  const openManageModal = (member: StaffMember) => {
    setManagingMember(member);
    setSelectedRole(member.role);
    setSelectedStatus(member.status === "SUSPENDED" ? "SUSPENDED" : "ACTIVE");
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingMember) return;

    try {
      setSubmitting(true);
      setError(null);

      const res = await fetch(`/api/staff/${managingMember.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: selectedRole,
          status: selectedStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update staff member");
      }

      setManagingMember(null);
      showToast(`Updated role and status for ${managingMember.name}.`);
      await fetchStaff();
    } catch (err: any) {
      setError(err.message || "Failed to update staff member");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!managingMember) return;
    if (!confirm(`Are you sure you want to remove ${managingMember.name} from the business?`)) {
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`/api/staff/${managingMember.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove staff member");

      setManagingMember(null);
      showToast(`${managingMember.name} has been removed from store staff.`);
      await fetchStaff();
    } catch (err: any) {
      alert(err.message || "Failed to remove member");
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleBadge = (role: BusinessRole) => {
    switch (role) {
      case "OWNER":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "MANAGER":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "CASHIER":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "INVENTORY":
        return "bg-amber-50 text-amber-700 border-amber-200";
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6">
      <DataLoadError error={swrError} onRetry={mutate} />
      {/* Toast Notification */}
      {successMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white shadow-lg animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            Staff & Role Permissions
          </h1>
          <p className="text-sm text-slate-500">
            Manage your store team members, access roles, and permissions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchStaff()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            title="Refresh Staff"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-blue-600" : ""}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setShowInviteModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0D9668] hover:bg-[#097852] px-4 py-2.5 text-sm font-bold text-white shadow-xs shadow-[#0D9668]/30 transition"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add Staff Member</span>
          </button>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Staff Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-500" />
            <h2 className="font-bold text-slate-900 text-sm">
              Staff Members ({staffList.length})
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">Role Access Verified</span>
        </div>

        {loading && staffList.length === 0 ? (
          <div className="p-4">
            <TableSkeleton rows={5} cols={6} hasFilters={false} />
          </div>
        ) : staffList.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <Users className="h-10 w-10 mx-auto text-slate-300" />
            <h3 className="font-semibold text-slate-700">No staff members found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Add cashiers, managers, and inventory clerks to delegate operations securely.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Assigned Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Joined Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffList.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-[#101827] text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {member.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{member.name}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{member.userId.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="text-slate-700 flex items-center gap-1 font-sans">
                        <Mail className="h-3 w-3 text-slate-400" /> {member.email}
                      </p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getRoleBadge(
                          member.role
                        )}`}
                      >
                        {member.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 font-semibold px-2 py-0.5 rounded-full text-[11px] ${
                          member.status === "ACTIVE"
                            ? "text-emerald-700 bg-emerald-50"
                            : "text-amber-700 bg-amber-50"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            member.status === "ACTIVE" ? "bg-emerald-500" : "bg-amber-500"
                          }`}
                        />
                        {member.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono">
                      {formatDate(member.joinedDate)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => openManageModal(member)}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition font-semibold"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Role Access Matrix Guide */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
        <div>
          <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Shield className="h-4 w-4 text-[#0D9668]" /> Role-Based Access Control (RBAC) Matrix
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Server-enforced access policy protecting business records and financial numbers
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
          <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/30 space-y-2">
            <span className="font-bold text-xs text-purple-800 uppercase tracking-wider block">
              Business Owner
            </span>
            <p className="text-xs text-slate-600 leading-relaxed">
              Full control over business settings, subscription plans, gross profit statements, and staff invitations.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/30 space-y-2">
            <span className="font-bold text-xs text-blue-800 uppercase tracking-wider block">
              Store Manager
            </span>
            <p className="text-xs text-slate-600 leading-relaxed">
              Product catalog editing, stock adjustments, shift reviews, expense entries, and operational summaries.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 space-y-2">
            <span className="font-bold text-xs text-emerald-800 uppercase tracking-wider block">
              Cashier
            </span>
            <p className="text-xs text-slate-600 leading-relaxed">
              Fast POS search, customer checkout, receipt generation, and manual Telebirr/CBE payment recording.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/30 space-y-2">
            <span className="font-bold text-xs text-amber-800 uppercase tracking-wider block">
              Inventory Staff
            </span>
            <p className="text-xs text-slate-600 leading-relaxed">
              Stock intake from deliveries, damaged stock adjustments with mandatory reasons, and reorder alerts.
            </p>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Add New Staff Member</h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition p-1 rounded-lg"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Almaz Bekele"
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0D9668]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. almaz@addismart.et"
                  value={newStaff.email}
                  onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0D9668]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Initial Password (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Default: BizFlow@2026"
                  value={newStaff.password}
                  onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0D9668]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Role Permission
                </label>
                <select
                  value={newStaff.role}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, role: e.target.value as BusinessRole })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0D9668]"
                >
                  <option value="CASHIER">Cashier (Sales & Receipts)</option>
                  <option value="INVENTORY">Inventory Staff (Stock Receipts & Adjustments)</option>
                  <option value="MANAGER">Store Manager (Products, Expenses & Operations)</option>
                  <option value="OWNER">Owner (Full Business Control)</option>
                </select>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-[#0D9668] hover:bg-[#097852] text-xs font-bold text-white shadow-md transition disabled:opacity-50"
                >
                  {submitting ? "Adding..." : "Add Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Member Modal */}
      {managingMember && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Manage {managingMember.name}</h3>
                <p className="text-xs text-slate-500">{managingMember.email}</p>
              </div>
              <button
                onClick={() => setManagingMember(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition p-1 rounded-lg"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateMember} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Change Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as BusinessRole)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                >
                  <option value="CASHIER">Cashier (Sales & Receipts)</option>
                  <option value="INVENTORY">Inventory Staff (Stock Receipts & Adjustments)</option>
                  <option value="MANAGER">Store Manager (Products, Expenses & Operations)</option>
                  <option value="OWNER">Owner (Full Business Control)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Account Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                >
                  <option value="ACTIVE">Active (Can Sign In)</option>
                  <option value="SUSPENDED">Suspended (Access Revoked)</option>
                </select>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleRemoveMember}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 border border-red-200 transition"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Remove Staff</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setManagingMember(null)}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-sm disabled:opacity-50"
                  >
                    {submitting ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
