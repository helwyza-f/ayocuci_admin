"use client";

import { useEffect, useState } from "react";
import { Store, Coins, Zap, Activity, ArrowRight } from "lucide-react";
import StatCard from "@/components/modules/dashboard/stat-card";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  // Data dummy sementara sebelum kita connect ke api-client
  const [stats, setStats] = useState({
    total_outlets: 9,
    total_koin: 90,
    active_tenant: 9,
  });

  return (
    <div className="space-y-10">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">
            Ringkasan <span className="text-[#FF4500]">Platform</span>
          </h2>
          <p className="text-sm text-slate-500 font-medium italic">
            Pantau denyut nadi ekosistem AyoCuci secara real-time.
          </p>
        </div>
        <Button className="bg-[#FF4500] hover:bg-[#E63E00] rounded-2xl px-6 font-black text-xs gap-2 shadow-lg shadow-orange-200">
          <Zap className="h-4 w-4 fill-white" />
          PERIKSA SISTEM
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          label="Total Outlet Terdaftar"
          value={stats.total_outlets}
          icon={Store}
          trend="+2 baru minggu ini"
        />
        <StatCard
          label="Koin dalam Sirkulasi"
          value={stats.total_koin}
          icon={Coins}
          color="#FF8C00"
        />
        <StatCard
          label="Langganan Aktif (Berbayar)"
          value={stats.active_tenant}
          icon={Zap}
          color="#00C853"
          trend="100% Tingkat Retensi"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Global Activity Feed (2/3 width) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
              <Activity className="h-5 w-5 text-[#FF4500]" />
              Aliran Transaksi Langsung
            </h3>
            <Button
              variant="link"
              className="text-[#FF4500] font-bold text-xs gap-1"
            >
              LIHAT SEMUA <ArrowRight className="h-3 w-3" />
            </Button>
          </div>

          <div className="bg-white rounded-[32px] p-4 shadow-sm border border-orange-50 min-h-[400px]">
            {/* List Transaksi Akan di Map di sini */}
            <div className="flex flex-col items-center justify-center h-[350px] text-slate-300">
              <Activity className="h-12 w-12 mb-2 opacity-20" />
              <p className="text-xs font-black uppercase italic tracking-widest">
                Menunggu Data Masuk...
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions (1/3 width) */}
        <div className="space-y-4">
          <h3 className="font-black text-slate-800 uppercase tracking-tight px-2">
            Perintah Cepat
          </h3>
          <div className="bg-slate-900 rounded-[32px] p-8 text-white shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-[10px] font-black text-orange-400 uppercase mb-4">
                Peringatan Sistem
              </p>
              <p className="text-sm font-bold leading-relaxed mb-6">
                Ada <span className="text-orange-400 underline">4 tenant</span>{" "}
                yang masa langganannya akan habis dalam kurang dari 3 hari.
              </p>
              <Button className="w-full bg-white text-slate-900 hover:bg-orange-50 font-black rounded-2xl text-xs">
                KIRIM PENGINGAT SIARAN
              </Button>
            </div>
            {/* Decorative Circle */}
            <div className="absolute -right-10 -bottom-10 h-40 w-40 bg-orange-500/10 rounded-full blur-3xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
