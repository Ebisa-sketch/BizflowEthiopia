import React from "react";

export default function SettingsLoading() {
  return (
    <div className="space-y-6 animate-in fade-in-0 duration-300">
      <div className="space-y-2">
        <div className="h-7 w-32 rounded-lg bg-slate-200/70 animate-pulse" />
        <div className="h-4 w-56 rounded-lg bg-slate-200/50 animate-pulse" />
      </div>

      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <div className="h-5 w-40 rounded bg-slate-200/70 animate-pulse" />
            <div className="space-y-3">
              <div className="h-10 w-full rounded-xl bg-slate-200/50 animate-pulse" />
              <div className="h-10 w-full rounded-xl bg-slate-200/50 animate-pulse" />
              <div className="h-10 w-2/3 rounded-xl bg-slate-200/50 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
