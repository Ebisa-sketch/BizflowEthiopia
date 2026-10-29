import React from "react";
import { DashboardSkeleton } from "@/components/ui/skeleton";

export default function PaymentsLoading() {
  return (
    <div className="space-y-6 animate-in fade-in-0 duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-44 rounded-lg bg-slate-200/70 dark:bg-slate-700 animate-pulse" />
          <div className="h-4 w-64 rounded-lg bg-slate-200/50 dark:bg-slate-700/70 animate-pulse" />
        </div>
        <div className="h-9 w-24 rounded-xl bg-slate-200/70 dark:bg-slate-700 animate-pulse" />
      </div>
      {/* Period pill skeleton */}
      <div className="h-10 w-72 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
      {/* KPI cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 space-y-3"
          >
            <div className="h-4 w-24 rounded-lg bg-slate-200/70 dark:bg-slate-700 animate-pulse" />
            <div className="h-7 w-32 rounded-lg bg-slate-200/50 dark:bg-slate-700/70 animate-pulse" />
          </div>
        ))}
      </div>
      <DashboardSkeleton />
    </div>
  );
}

