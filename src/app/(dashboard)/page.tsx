"use client";

import { Store, Coins, Zap, Activity, ArrowRight, RefreshCw } from "lucide-react";
import StatCard from "@/components/modules/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { ApiResponse } from "@/types/api";
import useSWR from "swr";
import { apiFetcher } from "@/lib/fetcher";

interface DashboardSummary {
  total_outlets: number;
  total_koin: number;
  active_tenant: number;
}

const emptyStats: DashboardSummary = {
  total_outlets: 0,
  total_koin: 0,
  active_tenant: 0,
};

export default function DashboardPage() {
  const { data, error, isLoading, mutate } = useSWR<
    ApiResponse<DashboardSummary>
  >("/summary", apiFetcher, {
    dedupingInterval: 60_000,
    keepPreviousData: true,
    revalidateOnFocus: false,
  });
  const stats = data?.data || emptyStats;

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Ringkasan <span className="text-[#FF4500]">Platform</span>
          </h2>
          <p className="text-sm font-medium text-slate-500">
            Pantau denyut nadi ekosistem AyoCuci secara real-time.
          </p>
        </div>
        <Button
          onClick={() => mutate()}
          disabled={isLoading}
          className="bg-[#FF4500] hover:bg-[#E63E00] rounded-xl px-5 font-semibold text-xs gap-2 shadow-sm shadow-orange-100"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Muat Ulang
        </Button>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          label="Total Outlet Terdaftar"
          value={isLoading ? "..." : stats.total_outlets}
          icon={Store}
        />
        <StatCard
          label="Koin dalam Sirkulasi"
          value={isLoading ? "..." : stats.total_koin.toLocaleString("id-ID")}
          icon={Coins}
          color="#FF8C00"
        />
        <StatCard
          label="Langganan Aktif (Berbayar)"
          value={isLoading ? "..." : stats.active_tenant}
          icon={Zap}
          color="#00C853"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Global Activity Feed (2/3 width) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="flex items-center gap-2 font-semibold tracking-tight text-slate-900">
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

          <div className="min-h-[400px] rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            {/* List Transaksi Akan di Map di sini */}
            <div className="flex flex-col items-center justify-center h-[350px] text-slate-300">
              <Activity className="h-12 w-12 mb-2 opacity-20" />
              <p className="text-xs font-semibold uppercase tracking-widest">
                Menunggu Data Masuk...
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions (1/3 width) */}
        <div className="space-y-4">
          <h3 className="px-2 font-semibold tracking-tight text-slate-900">
            Perintah Cepat
          </h3>
          <div className="relative overflow-hidden rounded-2xl bg-slate-900 p-8 text-white shadow-sm">
            <div className="relative z-10">
              <p className="text-[10px] font-black text-orange-400 uppercase mb-4">
                Peringatan Sistem
              </p>
              <p className="text-sm font-bold leading-relaxed mb-6">
                Data ringkasan sudah diambil dari endpoint admin. Gunakan modul
                notifikasi untuk mengirim pengingat ke tenant yang perlu follow
                up.
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
