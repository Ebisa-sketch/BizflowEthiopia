import React from "react";
import { TableSkeleton } from "@/components/ui/skeleton";

export default function CustomersLoading() {
  return (
    <div className="space-y-6 animate-in fade-in-0 duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-48 rounded-lg bg-slate-200/70 animate-pulse" />
          <div className="h-4 w-64 rounded-lg bg-slate-200/50 animate-pulse" />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs space-y-3">
            <div className="h-3.5 w-24 rounded bg-slate-200/70 animate-pulse" />
            <div className="h-7 w-28 rounded bg-slate-200/70 animate-pulse" />
          </div>
        ))}
      </div>

      <TableSkeleton rows={6} cols={4} hasFilters={true} />
    </div>
  );
}
