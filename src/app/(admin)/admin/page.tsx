"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  Building2,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
  Plus,
  ExternalLink,
  CreditCard,
  Ban,
  CheckCircle2,
  Edit2,
  Trash2,
  X,
  AlertTriangle,
  Loader2,
  Calendar,
  Sparkles,
} from "lucide-react";
import { swrFetcher } from "@/lib/swr-fetcher";
import { DataLoadError } from "@/components/ui/data-load-error";

type StatusFilter = "ALL" | "ACTIVE" | "SUSPENDED" | "INACTIVE";

interface Tenant {
  id: string;
  name: string;
  contactEmail: string | null;
  phone?: string | null;
  address?: string | null;
  taxNumber?: string | null;
  currency: string;
  status: string;
  createdAt: string;
  memberCount: number;
  subscription: {
    plan: string;
    status: string;
    billingPeriodEnd: string;
  } | null;
}

interface TenantResponse {
  tenants: Tenant[];
  summary: { total: number; active: number; suspended: number };
  pagination: { page: number; pageSize: number; totalCount: number; totalPages: number };
}

function statusClasses(status: string) {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
    case "SUSPENDED":
      return "bg-red-50 text-red-700 ring-red-600/20";
    default:
      return "bg-slate-100 text-slate-700 ring-slate-500/20";
  }
}

export default function PlatformAdminPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [page, setPage] = useState(1);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Modals state
  const [isProvisionOpen, setIsProvisionOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Active tenant being edited / subscribed / deleted / impersonated
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null);

  // Provision Form state
  const [provisionForm, setProvisionForm] = useState({
    name: "",
    contactEmail: "",
    phone: "",
    address: "",
    currency: "ETB",
    taxNumber: "",
    ownerName: "",
    ownerEmail: "",
    ownerPassword: "",
    plan: "STARTER",
    trialDays: "30",
  });

  // Edit Form state
  const [editForm, setEditForm] = useState({
    name: "",
    contactEmail: "",
    phone: "",
    address: "",
    taxNumber: "",
    currency: "ETB",
  });

  // Subscription Form state
  const [subForm, setSubForm] = useState({
    plan: "STARTER",
    status: "ACTIVE",
    extendDays: "30",
    customEndDate: "",
  });

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const params = new URLSearchParams({ page: String(page), status });
  if (search) params.set("search", search);

  const { data, error, isLoading, isValidating, mutate } = useSWR<TenantResponse>(
    `/api/admin/tenants?${params.toString()}`,
    swrFetcher,
    { keepPreviousData: true }
  );

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const isForbidden =
    error instanceof Error && /administrator access|active account/i.test(error.message);

  // Handlers
  const handleProvisionTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetch("/api/admin/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(provisionForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to provision business");

      showToast(data.message || "Business tenant created successfully!");
      setIsProvisionOpen(false);
      setProvisionForm({
        name: "",
        contactEmail: "",
        phone: "",
        address: "",
        currency: "ETB",
        taxNumber: "",
        ownerName: "",
        ownerEmail: "",
        ownerPassword: "",
        plan: "STARTER",
        trialDays: "30",
      });
      await mutate();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (tenant: Tenant) => {
    const nextStatus = tenant.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    const confirmMsg =
      nextStatus === "SUSPENDED"
        ? `Are you sure you want to SUSPEND '${tenant.name}'? Staff will immediately be locked out of POS and Dashboard.`
        : `Reactivate '${tenant.name}' to restore POS and workspace access?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/admin/tenants/${tenant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "UPDATE_STATUS", status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update tenant status");

      showToast(data.message);
      await mutate();
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleUpdateDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenant) return;
    try {
      setSubmitting(true);
      const res = await fetch(`/api/admin/tenants/${selectedTenant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "UPDATE_DETAILS", ...editForm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update business details");

      showToast(data.message);
      setIsEditModalOpen(false);
      await mutate();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenant) return;
    try {
      setSubmitting(true);
      const res = await fetch(`/api/admin/tenants/${selectedTenant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "UPDATE_SUBSCRIPTION", ...subForm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update subscription");

      showToast(data.message);
      setIsSubscriptionModalOpen(false);
      await mutate();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTenant = async () => {
    if (!selectedTenant) return;
    try {
      setSubmitting(true);
      const res = await fetch(`/api/admin/tenants/${selectedTenant.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete business");

      showToast(data.message);
      setIsDeleteModalOpen(false);
      setSelectedTenant(null);
      await mutate();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleImpersonate = async (tenant: Tenant) => {
    try {
      setImpersonatingId(tenant.id);
      const res = await fetch(`/api/admin/tenants/${tenant.id}/impersonate`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to enter store workspace");

      showToast(`Entering ${tenant.name} workspace...`);
      window.location.href = data.redirectUrl || "/dashboard";
    } catch (err: any) {
      showToast(err.message, "error");
      setImpersonatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-xl animate-in fade-in slide-in-from-top-4 ${
            toastMessage.type === "error" ? "bg-rose-600" : "bg-emerald-600"
          }`}
        >
          {toastMessage.type === "error" ? (
            <AlertTriangle className="h-5 w-5 shrink-0" />
          ) : (
            <CheckCircle2 className="h-5 w-5 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold text-emerald-600 flex items-center gap-1.5">
            <Sparkles className="h-4 w-4" />
            Platform Multi-Tenant Operations
          </p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
            Tenant Management & Governance
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Provision, license, monitor, and troubleshoot Ethiopian business stores across the platform.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => void mutate()}
            disabled={isValidating}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 shadow-2xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isValidating ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setIsProvisionOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition"
          >
            <Plus className="h-4 w-4" />
            + Provision New Store
          </button>
        </div>
      </div>

      {isForbidden ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900" role="alert">
          Platform administrator access is required to view tenant data.
        </div>
      ) : (
        <>
          <DataLoadError error={error} onRetry={mutate} />

          {/* Metric Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Total Businesses", value: data?.summary.total, icon: Building2, color: "text-blue-600", bg: "bg-blue-50" },
              { label: "Active Businesses", value: data?.summary.active, icon: ShieldCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
              { label: "Suspended Businesses", value: data?.summary.suspended, icon: Users, color: "text-rose-600", bg: "bg-rose-50" },
            ].map((metric) => {
              const Icon = metric.icon;
              return (
                <section
                  key={metric.label}
                  className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{metric.label}</p>
                    <div className={`rounded-xl p-2 ${metric.bg} ${metric.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="mt-3 text-3xl font-black text-slate-900 font-mono">
                    {isLoading && !data ? "—" : metric.value ?? 0}
                  </p>
                </section>
              );
            })}
          </div>

          {/* Table Container */}
          <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
            {/* Filter Header */}
            <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
              <form onSubmit={submitSearch} className="flex min-w-0 flex-1 gap-2 sm:max-w-md">
                <div className="relative min-w-0 flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Search store name, contact email, or TIN..."
                    aria-label="Search businesses"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2 pl-9 pr-3 text-xs outline-none focus:border-emerald-600 focus:bg-white focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition"
                >
                  Search
                </button>
              </form>

              {/* Status Filter Pills */}
              <div className="flex items-center gap-1.5">
                {(["ALL", "ACTIVE", "SUSPENDED"] as const).map((pill) => (
                  <button
                    key={pill}
                    type="button"
                    onClick={() => {
                      setStatus(pill);
                      setPage(1);
                    }}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      status === pill
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {pill === "ALL" ? "All Stores" : pill}
                  </button>
                ))}
              </div>
            </div>

            {/* Tenant Records Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                  <tr>
                    <th scope="col" className="px-4 py-3.5 font-bold">Business & Details</th>
                    <th scope="col" className="px-4 py-3.5 font-bold">Status</th>
                    <th scope="col" className="px-4 py-3.5 font-bold">Staff</th>
                    <th scope="col" className="px-4 py-3.5 font-bold">Subscription & Validity</th>
                    <th scope="col" className="px-4 py-3.5 font-bold">Registered</th>
                    <th scope="col" className="px-4 py-3.5 font-bold text-right">Super Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading && !data ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-600 mb-2" />
                        Loading registered business tenants…
                      </td>
                    </tr>
                  ) : data?.tenants.length ? (
                    data.tenants.map((tenant) => {
                      const isSuspended = tenant.status === "SUSPENDED";
                      return (
                        <tr key={tenant.id} className="hover:bg-slate-50/70 transition">
                          {/* Business Info */}
                          <td className="px-4 py-4">
                            <p className="font-bold text-slate-900 text-sm">{tenant.name}</p>
                            <p className="mt-0.5 text-slate-500 font-mono text-[11px]">
                              {tenant.contactEmail || "No contact email"} · {tenant.currency}
                            </p>
                            {tenant.taxNumber && (
                              <span className="inline-block mt-1 font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                                TIN: {tenant.taxNumber}
                              </span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="px-4 py-4">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${statusClasses(tenant.status)}`}>
                              {tenant.status}
                            </span>
                          </td>

                          {/* Staff Count */}
                          <td className="px-4 py-4 font-mono font-semibold text-slate-700">
                            {tenant.memberCount} {tenant.memberCount === 1 ? "user" : "users"}
                          </td>

                          {/* Subscription */}
                          <td className="px-4 py-4">
                            {tenant.subscription ? (
                              <div>
                                <span className="inline-block font-bold text-slate-800 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[11px]">
                                  {tenant.subscription.plan} · {tenant.subscription.status}
                                </span>
                                <p className="mt-1 text-[11px] text-slate-500 font-mono">
                                  Valid until {new Date(tenant.subscription.billingPeriodEnd).toLocaleDateString()}
                                </p>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">No Active Plan</span>
                            )}
                          </td>

                          {/* Registered Date */}
                          <td className="whitespace-nowrap px-4 py-4 text-slate-500 font-mono">
                            {new Date(tenant.createdAt).toLocaleDateString()}
                          </td>

                          {/* Action Buttons (CRUD) */}
                          <td className="px-4 py-4 text-right">
                            <div className="inline-flex items-center gap-1.5 flex-wrap justify-end">
                              {/* 1. Enter Workspace (Support Impersonation) */}
                              <button
                                type="button"
                                onClick={() => handleImpersonate(tenant)}
                                disabled={impersonatingId === tenant.id}
                                className="inline-flex items-center gap-1 rounded-lg bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs font-bold text-blue-700 hover:bg-blue-100 transition shadow-2xs"
                                title="Login and inspect this store's POS & inventory"
                              >
                                {impersonatingId === tenant.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <ExternalLink className="h-3.5 w-3.5" />
                                )}
                                <span>Workspace</span>
                              </button>

                              {/* 2. Manage Subscription / Plan */}
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedTenant(tenant);
                                  setSubForm({
                                    plan: tenant.subscription?.plan || "STARTER",
                                    status: tenant.subscription?.status || "ACTIVE",
                                    extendDays: "30",
                                    customEndDate: tenant.subscription?.billingPeriodEnd
                                      ? new Date(tenant.subscription.billingPeriodEnd).toISOString().split("T")[0]
                                      : "",
                                  });
                                  setIsSubscriptionModalOpen(true);
                                }}
                                className="inline-flex items-center gap-1 rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-bold text-amber-800 hover:bg-amber-100 transition shadow-2xs"
                                title="Change Plan or Extend Validity"
                              >
                                <CreditCard className="h-3.5 w-3.5 text-amber-600" />
                                <span>Plan</span>
                              </button>

                              {/* 3. Suspend / Activate Toggle */}
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(tenant)}
                                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition shadow-2xs ${
                                  isSuspended
                                    ? "bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                                    : "bg-red-50 border border-red-200 text-red-700 hover:bg-red-100"
                                }`}
                                title={isSuspended ? "Reactivate Store" : "Suspend Store"}
                              >
                                {isSuspended ? (
                                  <>
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                    <span>Activate</span>
                                  </>
                                ) : (
                                  <>
                                    <Ban className="h-3.5 w-3.5 text-red-600" />
                                    <span>Suspend</span>
                                  </>
                                )}
                              </button>

                              {/* 4. Edit Store Details */}
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedTenant(tenant);
                                  setEditForm({
                                    name: tenant.name,
                                    contactEmail: tenant.contactEmail || "",
                                    phone: tenant.phone || "",
                                    address: tenant.address || "",
                                    taxNumber: tenant.taxNumber || "",
                                    currency: tenant.currency || "ETB",
                                  });
                                  setIsEditModalOpen(true);
                                }}
                                className="p-1 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                                title="Edit Store Profile"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>

                              {/* 5. Delete Tenant */}
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedTenant(tenant);
                                  setIsDeleteModalOpen(true);
                                }}
                                className="p-1 rounded-lg border border-red-100 bg-red-50/50 text-red-500 hover:text-red-700 hover:bg-red-100"
                                title="Delete Tenant"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                        No businesses match these filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500 font-mono">
                {data?.pagination.totalCount ?? 0} businesses · page {data?.pagination.page ?? page} of{" "}
                {data?.pagination.totalPages ?? 1}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1 || isValidating}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-40 hover:bg-slate-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={!data || page >= data.pagination.totalPages || isValidating}
                  onClick={() => setPage((current) => current + 1)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-40 hover:bg-slate-50"
                >
                  Next
                </button>
              </div>
            </div>
          </section>
        </>
      )}

      {/* ================= MODAL 1: PROVISION NEW BUSINESS ================= */}
      {isProvisionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Provision New Business Tenant</h2>
                <p className="text-xs text-slate-500">Onboard a store and set up its primary owner account</p>
              </div>
              <button
                onClick={() => setIsProvisionOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleProvisionTenant} className="space-y-4">
              <div className="space-y-3 border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Business Info</h3>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Store / Business Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Merkato Supermarket"
                    value={provisionForm.name}
                    onChange={(e) => setProvisionForm({ ...provisionForm, name: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="text"
                      placeholder="e.g. +251 911 234567"
                      value={provisionForm.phone}
                      onChange={(e) => setProvisionForm({ ...provisionForm, phone: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-emerald-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Tax Number (TIN)</label>
                    <input
                      type="text"
                      placeholder="e.g. TIN-001928374"
                      value={provisionForm.taxNumber}
                      onChange={(e) => setProvisionForm({ ...provisionForm, taxNumber: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-emerald-600 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Store Address</label>
                  <input
                    type="text"
                    placeholder="e.g. Bole Medhanialem, Addis Ababa"
                    value={provisionForm.address}
                    onChange={(e) => setProvisionForm({ ...provisionForm, address: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-3 border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Owner Account</h3>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Owner Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Abebe Kebede"
                    value={provisionForm.ownerName}
                    onChange={(e) => setProvisionForm({ ...provisionForm, ownerName: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-emerald-600 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Owner Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="owner@store.et"
                      value={provisionForm.ownerEmail}
                      onChange={(e) => setProvisionForm({ ...provisionForm, ownerEmail: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-emerald-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Initial Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Store@123456"
                      value={provisionForm.ownerPassword}
                      onChange={(e) => setProvisionForm({ ...provisionForm, ownerPassword: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-mono focus:border-emerald-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Subscription Plan</label>
                  <select
                    value={provisionForm.plan}
                    onChange={(e) => setProvisionForm({ ...provisionForm, plan: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="STARTER">STARTER</option>
                    <option value="BUSINESS">BUSINESS</option>
                    <option value="PRO">PRO</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Free Trial Days</label>
                  <input
                    type="number"
                    min="1"
                    value={provisionForm.trialDays}
                    onChange={(e) => setProvisionForm({ ...provisionForm, trialDays: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsProvisionOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {submitting ? "Creating..." : "Provision Tenant"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: EDIT STORE PROFILE ================= */}
      {isEditModalOpen && selectedTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Edit Store Profile</h2>
                <p className="text-xs text-slate-500">{selectedTenant.name}</p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateDetails} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Business Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Email</label>
                <input
                  type="email"
                  value={editForm.contactEmail}
                  onChange={(e) => setEditForm({ ...editForm, contactEmail: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-emerald-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tax Number (TIN)</label>
                  <input
                    type="text"
                    value={editForm.taxNumber}
                    onChange={(e) => setEditForm({ ...editForm, taxNumber: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Address</label>
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: MANAGE SUBSCRIPTION ================= */}
      {isSubscriptionModalOpen && selectedTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Subscription & Licensing</h2>
                <p className="text-xs text-slate-500">{selectedTenant.name}</p>
              </div>
              <button
                onClick={() => setIsSubscriptionModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSubscription} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Plan Tier</label>
                <select
                  value={subForm.plan}
                  onChange={(e) => setSubForm({ ...subForm, plan: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold focus:border-emerald-600 focus:outline-none"
                >
                  <option value="STARTER">STARTER</option>
                  <option value="BUSINESS">BUSINESS</option>
                  <option value="PRO">PRO</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subscription Status</label>
                <select
                  value={subForm.status}
                  onChange={(e) => setSubForm({ ...subForm, status: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold focus:border-emerald-600 focus:outline-none"
                >
                  <option value="ACTIVE">ACTIVE (Paid & In Good Standing)</option>
                  <option value="TRIAL">TRIAL</option>
                  <option value="PAST_DUE">PAST DUE (Payment Pending)</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quick Validity Extension (After Telebirr/CBE payment receipt)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "+30 Days", val: "30" },
                    { label: "+90 Days", val: "90" },
                    { label: "+1 Year", val: "365" },
                  ].map((chip) => (
                    <button
                      key={chip.val}
                      type="button"
                      onClick={() => setSubForm({ ...subForm, extendDays: chip.val, customEndDate: "" })}
                      className={`rounded-xl border py-2 text-xs font-bold transition ${
                        subForm.extendDays === chip.val && !subForm.customEndDate
                          ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Or Specific Expiry Date</label>
                <input
                  type="date"
                  value={subForm.customEndDate}
                  onChange={(e) => setSubForm({ ...subForm, customEndDate: e.target.value, extendDays: "" })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSubscriptionModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {submitting ? "Updating..." : "Update Subscription"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 4: DELETE CONFIRMATION ================= */}
      {isDeleteModalOpen && selectedTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-red-200 animate-in fade-in zoom-in-95">
            <div className="rounded-xl bg-red-100 p-3 text-red-600 w-fit mb-3">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h2 className="text-base font-bold text-slate-900">Delete Business Tenant?</h2>
            <p className="mt-1 text-xs text-slate-500">
              Are you sure you want to permanently delete <strong>{selectedTenant.name}</strong>?
              All associated catalog products, inventory movements, sales, and cashier accounts will be permanently removed.
            </p>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteTenant}
                disabled={submitting}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {submitting ? "Deleting..." : "Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
