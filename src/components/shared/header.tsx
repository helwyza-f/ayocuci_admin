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
  const { logout, admin } = useAuthStore();

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
      packages: "Paket Layanan",
      subscriptions: "Riwayat Langganan",
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
    <header className="h-14 border-b border-slate-200 bg-white flex items-center px-4 md:px-8 justify-between sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="hidden md:flex h-8 w-8 text-slate-400 hover:text-primary"
        >
          <LayoutGrid className="h-4 w-4" />
        </Button>

        {/* Title Section */}
        <div className="flex flex-col">
          <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
            AyoCuci <span className="opacity-50">Control Hub</span>
          </p>
          <h1 className="text-sm font-bold text-slate-900 tracking-tight leading-none font-heading">
            {getTitle()}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-400 hover:text-primary relative"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 h-1 w-1 bg-primary rounded-full" />
        </Button>

        <div className="h-4 w-px bg-slate-100 mx-1" />

        {/* Admin Info & Logout */}
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block leading-none">
            <p className="text-xs font-bold text-slate-900 tracking-tight">
              {admin?.adm_nama || "Administrator"}
            </p>
            <p className="text-[9px] font-medium text-primary uppercase tracking-tight">
              Superadmin
            </p>
          </div>

          <Button
            onClick={handleLogout}
            variant="ghost"
            className={cn(
              "text-slate-400 hover:text-rose-600 hover:bg-rose-50",
              "font-bold text-[10px] uppercase h-8 px-2 gap-2",
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
