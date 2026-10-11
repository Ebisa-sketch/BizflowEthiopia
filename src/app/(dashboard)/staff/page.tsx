"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { BusinessRole } from "@/lib/permissions";

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: BusinessRole;
  status: "ACTIVE" | "INVITED" | "SUSPENDED";
  joinedDate: string;
}

const SAMPLE_STAFF: StaffMember[] = [
  {
    id: "U-1",
    name: "Abebe Kebede",
    email: "owner@addismart.et",
    phone: "+251 911 234567",
    role: "OWNER",
    status: "ACTIVE",
    joinedDate: "Jan 15, 2026",
  },
  {
    id: "U-2",
    name: "Rahel Tadesse",
    email: "manager@addismart.et",
    phone: "+251 922 345678",
    role: "MANAGER",
    status: "ACTIVE",
    joinedDate: "Feb 01, 2026",
  },
  {
    id: "U-3",
    name: "Tigist Haile",
    email: "cashier@addismart.et",
    phone: "+251 933 456789",
    role: "CASHIER",
    status: "ACTIVE",
    joinedDate: "Mar 10, 2026",
  },
  {
    id: "U-4",
    name: "Dawit Bekele",
    email: "inventory@addismart.et",
    phone: "+251 944 567890",
    role: "INVENTORY",
    status: "ACTIVE",
    joinedDate: "Apr 04, 2026",
  },
];

export default function StaffPage() {
  const [staffList, setStaffList] = useState<StaffMember[]>(SAMPLE_STAFF);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newStaff, setNewStaff] = useState({
    name: "",
    email: "",
    phone: "",
    role: "CASHIER" as BusinessRole,
  });

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaff.name || !newStaff.email) return;

    const newMember: StaffMember = {
      id: `U-${Date.now()}`,
      name: newStaff.name,
      email: newStaff.email,
      phone: newStaff.phone || "+251 911 000000",
      role: newStaff.role,
      status: "ACTIVE",
      joinedDate: "Just now",
    };

    setStaffList([...staffList, newMember]);
    setShowInviteModal(false);
    setNewStaff({ name: "", email: "", phone: "", role: "CASHIER" });
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            Staff & Role Permissions
          </h1>
          <p className="text-sm text-slate-500">
            Manage your store team members, access roles, and permissions across Addis Mini Mart
          </p>
        </div>

        <button
          onClick={() => setShowInviteModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#0D9668] hover:bg-[#097852] px-4 py-2.5 text-sm font-bold text-white shadow-xs shadow-[#0D9668]/30 transition"
        >
          <UserPlus className="h-4 w-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-500" />
            <h2 className="font-bold text-slate-900 text-sm">Active Members ({staffList.length})</h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">Store: Bole Branch</span>
        </div>

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
                      <div className="h-8 w-8 rounded-full bg-[#101827] text-white flex items-center justify-center font-bold text-xs">
                        {member.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{member.name}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{member.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="text-slate-700 flex items-center gap-1">
                      <Mail className="h-3 w-3 text-slate-400" /> {member.email}
                    </p>
                    <p className="text-slate-500 text-[11px] flex items-center gap-1 mt-0.5">
                      <Phone className="h-3 w-3 text-slate-400" /> {member.phone}
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
                    <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full text-[11px]">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {member.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 font-mono">{member.joinedDate}</td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => alert(`Managing permissions for ${member.name}`)}
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
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
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
                  Email Address
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
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="+251 9XX XXXXXX"
                  value={newStaff.phone}
                  onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
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
                  <option value="MANAGER">Store Manager (Products & Reports)</option>
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
                  className="flex-1 py-2.5 rounded-xl bg-[#0D9668] hover:bg-[#097852] text-xs font-bold text-white shadow-md transition"
                >
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
