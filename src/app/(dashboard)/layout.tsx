"use client";

import { useState } from "react";
import Sidebar from "@/components/shared/sidebar";
import Header from "@/components/shared/header";
import { cn } from "@/lib/utils";
import { ChevronLeft, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#FFF5F0] overflow-hidden">
      {/* OVERLAY MOBILE: Muncul pas sidebar mobile dibuka */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* SIDEBAR CONTAINER */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-100 transition-all duration-300 ease-in-out md:relative",
          // Logic Desktop Collapsible
          isCollapsed ? "md:w-20" : "md:w-72",
          // Logic Mobile Trigger
          isMobileOpen
            ? "translate-x-0 w-72"
            : "-translate-x-full md:translate-x-0",
        )}
      >
        {/* BUTTON COLLAPSE (Desktop Only) */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-10 hidden md:flex h-6 w-6 items-center justify-center rounded-full border border-slate-100 bg-white text-slate-400 hover:text-[#FF4500] shadow-sm z-50 transition-transform duration-300"
          style={{ transform: isCollapsed ? "rotate(180)deg" : "rotate(0deg)" }}
        >
          <ChevronLeft className={cn("h-4 w-4", isCollapsed && "rotate-180")} />
        </button>

        {/* BUTTON CLOSE (Mobile Only) */}
        <button
          onClick={() => setIsMobileOpen(false)}
          className="absolute right-4 top-4 md:hidden text-slate-400"
        >
          <X className="h-6 w-6" />
        </button>

        {/* SIAPIN SIDEBAR COMPONENT (Kirim props isCollapsed kalau perlu) */}
        <Sidebar isCollapsed={isCollapsed} />
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* HEADER: Gue selipin Mobile Trigger di sini */}
        <header className="flex items-center gap-4 bg-white/50 backdrop-blur-md border-b border-slate-100 px-4 md:px-0">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-slate-500"
            onClick={() => setIsMobileOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>

          <div className="flex-1">
            <Header />
          </div>
        </header>

        {/* SCROLLABLE CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <div className="max-w-[1600px] mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
