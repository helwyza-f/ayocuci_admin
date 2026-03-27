"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { adminMenus } from "@/lib/menu-list";

interface SidebarProps {
  isCollapsed: boolean;
  isMobile?: boolean; // Tambahin flag mobile
}

export default function Sidebar({
  isCollapsed,
  isMobile = false,
}: SidebarProps) {
  const pathname = usePathname();

  // Logic: Kalau di Mobile, paksa tampilkan full (TIDAK collapsed)
  const showFull = isMobile ? true : !isCollapsed;

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-white transition-all duration-300",
        showFull ? "p-7" : "p-4",
      )}
    >
      {/* --- LOGO SECTION --- */}
      <div
        className={cn(
          "flex items-center gap-3 mb-12 transition-all duration-300",
          showFull ? "px-2" : "justify-center px-0",
        )}
      >
        <div className="h-10 w-10 min-w-[40px] bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black italic shadow-sm shadow-slate-200">
          AC
        </div>
        {showFull && (
          <div className="flex flex-col leading-tight animate-in fade-in slide-in-from-left-2 duration-500">
            <span className="font-black text-lg text-slate-800 tracking-tighter uppercase">
              Ayo<span className="text-[#FF4500]">Cuci</span>
            </span>
            <span className="text-[9px] font-black text-slate-300 tracking-[0.2em] uppercase">
              Admin Hub
            </span>
          </div>
        )}
      </div>

      {/* --- NAVIGATION SECTION --- */}
      <nav className="flex-1 space-y-9 overflow-y-auto scrollbar-hide">
        {adminMenus.map((group, idx) => (
          <div key={idx} className="space-y-4">
            {showFull ? (
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-300 px-4 animate-in fade-in duration-700">
                {group.group}
              </p>
            ) : (
              <div className="h-[1px] bg-slate-100 mx-2 rounded-full" />
            )}

            <div className="space-y-1.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={!showFull ? item.label : ""}
                    className={cn(
                      "flex items-center rounded-2xl transition-all duration-300 group relative",
                      showFull ? "gap-3 px-4 py-3" : "justify-center p-3",
                      isActive
                        ? "bg-slate-50 text-slate-900 shadow-sm shadow-slate-100"
                        : "text-slate-500 hover:bg-slate-50/50 hover:text-slate-900",
                    )}
                  >
                    {/* Active Indicator */}
                    {isActive && (
                      <div className="absolute left-0 w-1 h-6 bg-[#FF4500] rounded-r-full shadow-[2px_0_8px_rgba(255,69,0,0.3)]" />
                    )}

                    <item.icon
                      className={cn(
                        "h-5 w-5 transition-colors duration-300",
                        isActive
                          ? "text-[#FF4500]"
                          : "text-slate-400 group-hover:text-slate-700",
                      )}
                    />

                    {showFull && (
                      <span
                        className={cn(
                          "text-sm tracking-tight transition-all duration-300 animate-in slide-in-from-left-3",
                          isActive ? "font-black" : "font-bold",
                        )}
                      >
                        {item.label}
                      </span>
                    )}

                    {/* Tooltip on Collapse */}
                    {!showFull && (
                      <div className="absolute left-16 bg-slate-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-x-[-10px] group-hover:translate-x-0 whitespace-nowrap z-50 shadow-xl">
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
