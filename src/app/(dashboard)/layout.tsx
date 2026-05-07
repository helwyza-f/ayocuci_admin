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
    <div className="flex h-screen overflow-hidden bg-[#F1F5F9]">
      {/* OVERLAY MOBILE */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-[2px] z-40 md:hidden transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* SIDEBAR CONTAINER */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 bg-white transition-all duration-200 ease-in-out md:relative",
          isCollapsed ? "md:w-16" : "md:w-60",
          isMobileOpen ? "translate-x-0 w-60" : "-translate-x-full md:translate-x-0",
        )}
      >
        <Sidebar isCollapsed={isCollapsed} />
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex items-center bg-white border-b border-slate-200 px-4 md:px-0">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-slate-500 h-9 w-9"
            onClick={() => setIsMobileOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </Button>

          <div className="flex-1">
            <Header onToggleSidebar={() => setIsCollapsed(!isCollapsed)} />
          </div>
        </header>

        {/* SCROLLABLE CONTENT */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50 custom-scrollbar relative">
          <div className="p-4 md:p-6 max-w-[1600px] mx-auto min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
