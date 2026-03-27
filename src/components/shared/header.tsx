"use client";

import { usePathname } from "next/navigation";
import { LogOut, Bell, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/use-auth-store";
import { cn } from "@/lib/utils";

export default function Header() {
  const pathname = usePathname();
  const { logout, admin } = useAuthStore();

  const getTitle = () => {
    const segment = pathname.split("/").pop();
    if (!segment || segment === "" || segment === "dashboard")
      return "Pusat Kontrol";

    // Mapping nama yang lebih manusiawi daripada sekadar capitalize slug
    const titles: Record<string, string> = {
      tenants: "Manajemen Outlet",
      users: "Daftar Owner",
      customers: "Database Pelanggan",
      economy: "Konfigurasi Ekonomi",
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
    <header className="h-20 border-b border-slate-100 bg-white/40 backdrop-blur-xl flex items-center px-6 md:px-10 justify-between sticky top-0 z-40 transition-all">
      {/* Title Section */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2 mb-0.5">
          <Sparkles className="h-3 w-3 text-[#FF4500]/40" />
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
            AyoCuci <span className="text-slate-300">Platform</span>
          </p>
        </div>
        <h1 className="text-lg font-black text-slate-800 tracking-tight leading-none">
          {getTitle()}
        </h1>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Notifikasi - Soft Style */}
        <Button
          variant="ghost"
          size="icon"
          className="rounded-xl text-slate-400 hover:text-[#FF4500] hover:bg-orange-50/50 transition-all duration-300 relative"
        >
          <Bell className="h-5 w-5" />
          {/* Dot Indikator Unread */}
          <span className="absolute top-2.5 right-2.5 h-2 w-2 bg-[#FF4500] rounded-full border-2 border-white" />
        </Button>

        <div className="h-6 w-[1px] bg-slate-100 mx-1 md:mx-2" />

        {/* Admin Info & Logout */}
        <div className="flex items-center gap-3 md:gap-5">
          <div className="text-right hidden lg:block">
            <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight">
              {admin?.adm_nama || "Fahry Admin"}
            </p>
            <p className="text-[9px] font-bold text-[#FF4500] uppercase tracking-wider opacity-70">
              Master Admin
            </p>
          </div>

          <Button
            onClick={handleLogout}
            variant="ghost"
            className={cn(
              "rounded-xl border border-slate-100 bg-white text-slate-600 shadow-sm transition-all duration-300",
              "hover:border-red-100 hover:bg-red-50 hover:text-red-500",
              "font-bold text-[10px] uppercase px-4 h-10 gap-2",
            )}
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
