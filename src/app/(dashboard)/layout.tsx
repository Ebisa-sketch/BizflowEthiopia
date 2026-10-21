"use client";

import React, { useState, Suspense } from "react";
import { SWRConfig } from "swr";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { NavigationProgress } from "@/components/ui/navigation-progress";
import { swrFetcher } from "@/lib/swr-fetcher";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <SWRConfig
      value={{
        fetcher: swrFetcher,
        revalidateOnFocus: false,
        revalidateIfStale: false,
        revalidateOnReconnect: false,
        keepPreviousData: true,
        dedupingInterval: 60000,
      }}
    >
      {/* Top loading progress bar */}
      <NavigationProgress />

      <div className="flex min-h-screen bg-slate-50 dark:bg-[#070e17] transition-colors">
        {/* Sidebar (Permanent on Desktop, Drawer on Mobile/Tablet) */}
        <AppSidebar
          isOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col pb-16 md:pb-0 min-w-0">
          <AppHeader onToggleSidebar={() => setMobileSidebarOpen(true)} />
          <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            <Suspense fallback={
              <div className="space-y-6 animate-in fade-in-0 duration-300">
                <div className="h-7 w-48 rounded-lg bg-slate-200/70 dark:bg-slate-800 animate-pulse" />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-24 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 animate-pulse" />
                  ))}
                </div>
                <div className="h-64 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 animate-pulse" />
              </div>
            }>
              {children}
            </Suspense>
          </main>
        </div>

        {/* Mobile Bottom Navigation */}
        <MobileNavigation />
      </div>
    </SWRConfig>
  );
}
