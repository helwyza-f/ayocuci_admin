"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { adminMenus } from "@/lib/menu-list";

interface SidebarProps {
  isCollapsed: boolean;
  isMobile?: boolean;
}

export default function Sidebar({
  isCollapsed,
  isMobile = false,
}: SidebarProps) {
  const pathname = usePathname();
  const showFull = isMobile ? true : !isCollapsed;

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-white transition-all duration-300 border-r border-slate-100",
        showFull ? "p-5" : "p-3",
      )}
    >
      {/* --- BRANDING --- */}
      <div
        className={cn(
          "flex items-center gap-3 mb-8 transition-all duration-300",
          showFull ? "px-2" : "justify-center px-0",
        )}
      >
        <div className="h-8 w-8 min-w-[32px] bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold text-sm">
          AC
        </div>
        {showFull && (
          <div className="flex flex-col leading-tight">
            <span className="font-bold text-sm text-slate-900 tracking-tight uppercase font-heading">
              Ayo<span className="text-primary">Cuci</span>
            </span>
            <span className="text-[8px] font-bold text-slate-400 tracking-widest uppercase">
              Control Panel
            </span>
          </div>
        )}
      </div>

      {/* --- NAVIGATION --- */}
      <nav className="flex-1 space-y-6 overflow-y-auto custom-scrollbar">
        {adminMenus.map((group, idx) => (
          <div key={idx} className="space-y-2">
            {showFull ? (
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 px-3 opacity-80">
                {group.group}
              </p>
            ) : (
              <div className="h-px bg-slate-100 mx-2" />
            )}

            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={!showFull ? item.label : ""}
                    className={cn(
                      "flex items-center rounded-lg transition-all duration-150 group relative",
                      showFull ? "gap-3 px-3 py-2" : "justify-center p-2",
                      isActive
                        ? "bg-slate-100 text-primary"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
                    )}
                  >
                    {isActive && (
                      <div className="absolute left-0 w-1 h-3 bg-primary rounded-r-full" />
                    )}

                    <item.icon
                      className={cn(
                        "h-4 w-4 transition-colors duration-150",
                        isActive
                          ? "text-primary"
                          : "text-slate-400 group-hover:text-slate-600",
                      )}
                    />

                    {showFull && (
                      <span
                        className={cn(
                          "text-xs tracking-tight font-medium",
                          isActive ? "text-slate-900" : "text-slate-500",
                        )}
                      >
                        {item.label}
                      </span>
                    )}

                    {!showFull && (
                      <div className="absolute left-14 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-all whitespace-nowrap z-50 shadow-lg">
                        {item.label}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
}
