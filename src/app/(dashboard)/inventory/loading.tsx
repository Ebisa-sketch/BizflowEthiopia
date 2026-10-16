import React from "react";
import { TableSkeleton } from "@/components/ui/skeleton";

export default function InventoryLoading() {
  return (
    <div className="space-y-6 animate-in fade-in-0 duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-36 rounded-lg bg-slate-200/70 animate-pulse" />
          <div className="h-4 w-60 rounded-lg bg-slate-200/50 animate-pulse" />
        </div>
        <div className="h-10 w-40 rounded-xl bg-emerald-200/70 animate-pulse" />
      </div>
      <TableSkeleton rows={8} cols={5} hasFilters={true} />
    </div>
  );
}
