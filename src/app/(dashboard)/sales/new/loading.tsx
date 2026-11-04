import React from "react";

export default function PosCheckoutLoading() {
  return (
    <div className="h-screen flex overflow-hidden animate-in fade-in-0 duration-300">
      {/* Product catalog panel */}
      <div className="flex-1 flex flex-col border-r border-slate-200/80 dark:border-slate-800">
        {/* Header bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-3 shrink-0">
          <div className="h-9 w-9 rounded-xl bg-slate-200/70 dark:bg-slate-800/70 animate-pulse" />
          <div className="h-9 flex-1 rounded-xl bg-slate-200/70 dark:bg-slate-800/70 animate-pulse" />
          <div className="h-9 w-24 rounded-xl bg-slate-200/70 dark:bg-slate-800/70 animate-pulse" />
        </div>

        {/* Category filter pills */}
        <div className="flex gap-2 px-4 py-2 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shrink-0">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-7 w-20 rounded-full bg-slate-200/70 dark:bg-slate-800/70 animate-pulse shrink-0" />
          ))}
        </div>

        {/* Product grid */}
        <div className="flex-1 overflow-hidden p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 space-y-2">
                <div className="h-4 w-full rounded bg-slate-200/70 dark:bg-slate-800/70 animate-pulse" />
                <div className="h-3 w-16 rounded bg-slate-200/50 dark:bg-slate-800/50 animate-pulse" />
                <div className="h-5 w-20 rounded bg-slate-200/70 dark:bg-slate-800/70 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cart / checkout panel */}
      <div className="w-80 xl:w-96 flex flex-col bg-white dark:bg-slate-900 shrink-0">
        {/* Customer bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="h-9 w-full rounded-xl bg-slate-200/70 dark:bg-slate-800/70 animate-pulse" />
        </div>

        {/* Cart empty state skeleton */}
        <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6">
          <div className="h-14 w-14 rounded-full bg-slate-200/70 dark:bg-slate-800/70 animate-pulse" />
          <div className="h-4 w-40 rounded bg-slate-200/70 dark:bg-slate-800/70 animate-pulse" />
          <div className="h-3 w-56 rounded bg-slate-200/50 dark:bg-slate-800/50 animate-pulse" />
        </div>

        {/* Footer totals */}
        <div className="border-t border-slate-100 dark:border-slate-800 p-4 space-y-2 shrink-0">
          <div className="h-4 w-full rounded bg-slate-200/50 dark:bg-slate-800/50 animate-pulse" />
          <div className="h-4 w-full rounded bg-slate-200/50 dark:bg-slate-800/50 animate-pulse" />
          <div className="h-10 w-full rounded-xl bg-slate-200/70 dark:bg-slate-800/70 animate-pulse mt-3" />
        </div>
      </div>
    </div>
  );
}
