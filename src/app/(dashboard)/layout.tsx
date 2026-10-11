"use client";

import React, { useState } from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { MobileNavigation } from "@/components/layout/mobile-navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar (Permanent on Desktop, Drawer on Mobile/Tablet) */}
      <AppSidebar
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col pb-16 md:pb-0 min-w-0">
        <AppHeader onToggleSidebar={() => setMobileSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNavigation />
    </div>
  );
}
