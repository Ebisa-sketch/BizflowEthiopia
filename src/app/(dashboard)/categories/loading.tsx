import React from "react";
import { TableSkeleton } from "@/components/ui/skeleton";

export default function CategoriesLoading() {
  return (
    <div className="space-y-6 animate-in fade-in-0 duration-300">
      {/* KPI cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 space-y-3"
          >
            <div className="h-4 w-24 rounded-lg bg-slate-200/70 dark:bg-slate-700 animate-pulse" />
            <div className="h-7 w-16 rounded-lg bg-slate-200/50 dark:bg-slate-700/70 animate-pulse" />
          </div>
        ))}
      </div>

      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-36 rounded-lg bg-slate-200/70 dark:bg-slate-700 animate-pulse" />
          <div className="h-4 w-48 rounded-lg bg-slate-200/50 dark:bg-slate-700/70 animate-pulse" />
        </div>
        <div className="h-10 w-36 rounded-xl bg-emerald-200/70 dark:bg-emerald-800/30 animate-pulse" />
      </div>

      <TableSkeleton rows={5} cols={5} hasFilters={false} />
    </div>
  );
}

