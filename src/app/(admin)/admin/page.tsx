"use client";

import { useState } from "react";
import useSWR from "swr";
import { Building2, RefreshCw, Search, ShieldCheck, Users } from "lucide-react";
import { swrFetcher } from "@/lib/swr-fetcher";
import { DataLoadError } from "@/components/ui/data-load-error";

type StatusFilter = "ALL" | "ACTIVE" | "SUSPENDED" | "INACTIVE";

interface Tenant {
  id: string;
  name: string;
  contactEmail: string | null;
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-emerald-700">Platform operations</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Business tenants
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Read-only overview of registered businesses and subscription status.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void mutate()}
          disabled={isValidating}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${isValidating ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {isForbidden ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900" role="alert">
          Platform administrator access is required to view tenant data.
        </div>
      ) : (
        <>
          <DataLoadError error={error} onRetry={mutate} />

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Total businesses", value: data?.summary.total, icon: Building2 },
              { label: "Active businesses", value: data?.summary.active, icon: ShieldCheck },
              { label: "Suspended businesses", value: data?.summary.suspended, icon: Users },
            ].map((metric) => {
              const Icon = metric.icon;
              return (
                <section
                  key={metric.label}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-500">{metric.label}</p>
                    <Icon className="h-5 w-5 text-slate-400" />
                  </div>
                  <p className="mt-3 text-3xl font-bold text-slate-900">
                    {isLoading && !data ? "—" : metric.value ?? 0}
                  </p>
                </section>
              );
            })}
          </div>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
              <form onSubmit={submitSearch} className="flex min-w-0 flex-1 gap-2 sm:max-w-lg">
                <label className="relative min-w-0 flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Search business or contact email"
                    aria-label="Search businesses"
                    className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  />
                </label>
                <button
                  type="submit"
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                >
                  Search
                </button>
              </form>
              <label className="flex items-center gap-2 text-sm text-slate-600">
                Status
                <select
                  value={status}
                  onChange={(event) => {
                    const nextStatus = event.target.value;
                    if (
                      nextStatus === "ALL" ||
                      nextStatus === "ACTIVE" ||
                      nextStatus === "SUSPENDED" ||
                      nextStatus === "INACTIVE"
                    ) {
                      setStatus(nextStatus);
                      setPage(1);
                    }
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2"
                >
                  <option value="ALL">All</option>
                  <option value="ACTIVE">Active</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </label>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">Business</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Members</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Subscription</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Registered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading && !data ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                        Loading business tenants…
                      </td>
                    </tr>
                  ) : data?.tenants.length ? (
                    data.tenants.map((tenant) => (
                      <tr key={tenant.id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-4">
                          <p className="font-semibold text-slate-900">{tenant.name}</p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {tenant.contactEmail || "No contact email"} · {tenant.currency}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusClasses(tenant.status)}`}>
                            {tenant.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-slate-700">{tenant.memberCount}</td>
                        <td className="px-4 py-4">
                          {tenant.subscription ? (
                            <>
                              <p className="font-medium text-slate-800">
                                {tenant.subscription.plan} · {tenant.subscription.status}
                              </p>
                              <p className="mt-0.5 text-xs text-slate-500">
                                Through {new Date(tenant.subscription.billingPeriodEnd).toLocaleDateString()}
                              </p>
                            </>
                          ) : error ? (
                            <tr>
                              <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                                Business records could not be loaded.
                              </td>
                            </tr>
                          ) : (
                            <span className="text-slate-500">No subscription</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                          {new Date(tenant.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                        No businesses match these filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500">
                {data?.pagination.totalCount ?? 0} businesses · page {data?.pagination.page ?? page} of{" "}
                {data?.pagination.totalPages ?? 1}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1 || isValidating}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={!data || page >= data.pagination.totalPages || isValidating}
                  onClick={() => setPage((current) => current + 1)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
