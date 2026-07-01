"use client";

import { usePathname } from "next/navigation";
import { LogOut, Bell, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/use-auth-store";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  const pathname = usePathname();
  const { logout, admin, _hasHydrated } = useAuthStore();

  const getTitle = () => {
    const segment = pathname.split("/").pop();
    if (!segment || segment === "" || segment === "dashboard")
      return "Pusat Kontrol";

    const titles: Record<string, string> = {
      tenants: "Manajemen Outlet",
      users: "Daftar Owner",
      customers: "Database Pelanggan",
      economy: "Konfigurasi Ekonomi",
      referrals: "Referral Owner",
      vouchers: "Voucher & Promo",
      notifications: "Siaran Notifikasi",
      "otp-logs": "Log OTP",
      packages: "Paket Layanan",
      subscriptions: "Aktivasi Lisensi",
    };

    return (
      titles[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
    );
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200/70 bg-white/80 px-3 backdrop-blur-xl md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="hidden h-9 w-9 text-slate-400 hover:bg-slate-100 hover:text-primary md:flex"
        >
          <LayoutGrid className="h-4 w-4" />
        </Button>

        {/* Title Section */}
        <div className="flex min-w-0 flex-col">
          <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-slate-400 mb-0.5 truncate">
            AyoCuci <span className="opacity-50">Control Hub</span>
          </p>
          <h1 className="truncate text-sm font-bold text-slate-900 tracking-tight leading-none font-heading md:text-base">
            {getTitle()}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 text-slate-400 hover:bg-slate-100 hover:text-primary"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 h-1 w-1 bg-primary rounded-full" />
        </Button>

        <div className="hidden h-4 w-px bg-slate-200 mx-1 md:block" />

        {/* Admin Info & Logout */}
        <div className="flex items-center gap-4">
          <div className="hidden max-w-[180px] text-right leading-none sm:block">
            {_hasHydrated ? (
              <>
                <p className="truncate text-xs font-bold text-slate-900 tracking-tight">
                  {admin?.adm_nama || "Administrator"}
                </p>
                <p className="truncate text-[9px] font-medium text-primary uppercase tracking-tight">
                  {admin?.adm_is_master ? "Master Admin" : "Superadmin"}
                </p>
              </>
            ) : (
              <div className="space-y-1">
                <div className="h-3 w-20 bg-slate-100 animate-pulse rounded" />
                <div className="h-2 w-12 bg-slate-50 animate-pulse rounded ml-auto" />
              </div>
            )}
          </div>

          <Button
            onClick={handleLogout}
            variant="ghost"
            className={cn(
              "h-9 gap-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600",
              "font-bold text-[10px] uppercase px-3",
            )}
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">Sign Out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
