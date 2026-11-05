import React from "react";

export default function SubscriptionLoading() {
  return (
    <div className="space-y-6 animate-in fade-in-0 duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-44 rounded-lg bg-slate-200/70 dark:bg-slate-800/70 animate-pulse" />
          <div className="h-4 w-72 rounded-lg bg-slate-200/50 dark:bg-slate-800/50 animate-pulse" />
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-3">
            <div className="h-5 w-20 rounded-lg bg-slate-200/70 dark:bg-slate-800/70 animate-pulse" />
            <div className="h-8 w-32 rounded-lg bg-slate-200/70 dark:bg-slate-800/70 animate-pulse" />
            <div className="space-y-1.5">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="h-3 w-full rounded bg-slate-200/50 dark:bg-slate-800/50 animate-pulse" />
              ))}
            </div>
            <div className="h-9 w-full rounded-xl bg-slate-200/70 dark:bg-slate-800/70 animate-pulse" />
          </div>
        ))}
      </div>

      {/* Billing history table */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="h-5 w-36 rounded bg-slate-200/70 dark:bg-slate-800/70 animate-pulse" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <div className="h-4 flex-1 rounded bg-slate-200/50 dark:bg-slate-800/50 animate-pulse" />
            <div className="h-4 w-20 rounded bg-slate-200/50 dark:bg-slate-800/50 animate-pulse" />
            <div className="h-4 w-16 rounded bg-slate-200/50 dark:bg-slate-800/50 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

