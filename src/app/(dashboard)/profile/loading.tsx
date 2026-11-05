import React from "react";
import { TableSkeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div className="space-y-6 animate-in fade-in-0 duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-40 rounded-lg bg-slate-200/70 dark:bg-slate-800/70 animate-pulse" />
          <div className="h-4 w-64 rounded-lg bg-slate-200/50 dark:bg-slate-800/50 animate-pulse" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-24 rounded-xl bg-slate-200/70 dark:bg-slate-800/70 animate-pulse" />
          <div className="h-9 w-24 rounded-xl bg-slate-200/70 dark:bg-slate-800/70 animate-pulse" />
        </div>
      </div>

      {/* Profile card */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs">
        <div className="flex items-center gap-5">
          <div className="h-20 w-20 rounded-full bg-slate-200/70 dark:bg-slate-800/70 animate-pulse shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-5 w-48 rounded-lg bg-slate-200/70 dark:bg-slate-800/70 animate-pulse" />
            <div className="h-4 w-56 rounded-lg bg-slate-200/50 dark:bg-slate-800/50 animate-pulse" />
            <div className="h-4 w-32 rounded-lg bg-slate-200/50 dark:bg-slate-800/50 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Tab bar skeleton */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-8 w-24 rounded-lg bg-slate-200/70 dark:bg-slate-800/70 animate-pulse" />
        ))}
      </div>

      <TableSkeleton rows={5} cols={2} hasFilters={false} />
    </div>
  );
}

