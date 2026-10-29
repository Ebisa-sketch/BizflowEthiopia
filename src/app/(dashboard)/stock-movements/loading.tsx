import React from "react";
import { TableSkeleton } from "@/components/ui/skeleton";

export default function StockMovementsLoading() {
  return (
    <div className="space-y-6 animate-in fade-in-0 duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-48 rounded-lg bg-slate-200/70 dark:bg-slate-700 animate-pulse" />
          <div className="h-4 w-72 rounded-lg bg-slate-200/50 dark:bg-slate-700/70 animate-pulse" />
        </div>
        <div className="h-9 w-24 rounded-xl bg-slate-200/70 dark:bg-slate-700 animate-pulse" />
      </div>
      {/* Tab nav skeleton */}
      <div className="h-9 w-96 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
      {/* Filter bar skeleton */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
        <div className="h-9 w-72 rounded-xl bg-slate-200/70 dark:bg-slate-700 animate-pulse" />
        <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-7 w-20 rounded-lg bg-slate-200/70 dark:bg-slate-700 animate-pulse" />
          ))}
        </div>
      </div>
      <TableSkeleton rows={8} cols={7} hasFilters={false} />
    </div>
  );
}

