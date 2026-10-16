import React from "react";

export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-in fade-in-0 duration-300">
      {/* Page Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-48 rounded-lg bg-slate-200/70 animate-pulse" />
          <div className="h-4 w-64 rounded-lg bg-slate-200/50 animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-24 rounded-xl bg-slate-200/70 animate-pulse" />
          <div className="h-9 w-32 rounded-xl bg-slate-200/70 animate-pulse" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-20 sm:w-24 rounded bg-slate-200/70 animate-pulse" />
              <div className="h-8 w-8 rounded-lg bg-slate-200/70 animate-pulse" />
            </div>
            <div className="h-7 w-28 sm:w-32 rounded bg-slate-200/70 animate-pulse" />
            <div className="h-3 w-24 sm:w-28 rounded bg-slate-200/50 animate-pulse" />
          </div>
        ))}
      </div>

      {/* Content Area */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        {/* Table Header */}
        <div className="bg-slate-50 border-b border-slate-200/80 px-4 py-3.5 flex items-center gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-3.5 w-20 rounded bg-slate-200/70 animate-pulse" />
          ))}
        </div>
        {/* Table Rows */}
        <div className="divide-y divide-slate-100">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="px-4 py-4 flex items-center gap-4">
              <div className="h-9 w-9 rounded-lg bg-slate-200/70 animate-pulse shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-32 sm:w-40 rounded bg-slate-200/70 animate-pulse" />
                <div className="h-3 w-20 sm:w-24 rounded bg-slate-200/50 animate-pulse" />
              </div>
              <div className="h-4 w-20 rounded bg-slate-200/70 animate-pulse hidden sm:block" />
              <div className="h-6 w-16 rounded-full bg-slate-200/70 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
