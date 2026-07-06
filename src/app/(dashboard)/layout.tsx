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
    <div className="flex min-h-screen overflow-hidden bg-[#F4F7FB]">
      {/* OVERLAY MOBILE */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-[2px] transition-opacity md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* SIDEBAR CONTAINER */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 border-r border-slate-200/70 bg-white/95 transition-transform duration-200 ease-in-out backdrop-blur-xl md:relative md:translate-x-0",
          isCollapsed ? "md:w-20" : "md:w-64",
          isMobileOpen ? "w-72 translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <Sidebar isCollapsed={isCollapsed} isMobile={isMobileOpen} />
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex items-center border-b border-slate-200/70 bg-white/80 px-3 backdrop-blur-xl md:px-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-slate-500 hover:bg-slate-100 md:hidden"
            onClick={() => setIsMobileOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </Button>

          <div className="min-w-0 flex-1">
            <Header onToggleSidebar={() => setIsCollapsed(!isCollapsed)} />
          </div>
        </header>

        {/* SCROLLABLE CONTENT */}
        <main className="relative flex-1 overflow-y-auto bg-transparent custom-scrollbar">
          <div className="mx-auto min-h-full max-w-[1600px] p-3 md:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
