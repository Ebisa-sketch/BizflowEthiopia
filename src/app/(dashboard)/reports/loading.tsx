import React from "react";

export default function ReportsLoading() {
  return (
    <div className="space-y-6 animate-in fade-in-0 duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-40 rounded-lg bg-slate-200/70 animate-pulse" />
          <div className="h-4 w-56 rounded-lg bg-slate-200/50 animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-28 rounded-xl bg-slate-200/70 animate-pulse" />
          <div className="h-9 w-28 rounded-xl bg-slate-200/70 animate-pulse" />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs space-y-3">
            <div className="h-3.5 w-20 rounded bg-slate-200/70 animate-pulse" />
            <div className="h-7 w-28 rounded bg-slate-200/70 animate-pulse" />
          </div>
        ))}
      </div>

      {/* Chart Area */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-5 w-36 rounded bg-slate-200/70 animate-pulse" />
          <div className="h-8 w-24 rounded-lg bg-slate-200/70 animate-pulse" />
        </div>
        <div className="h-64 w-full rounded-xl bg-slate-200/50 animate-pulse" />
      </div>
    </div>
  );
}
