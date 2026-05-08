"use client";

import {
  Store, Coins, Zap, Activity, ArrowRight, RefreshCw,
  LayoutGrid, AlertCircle, UserPlus, TrendingUp, Clock,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ApiResponse } from "@/types/api";
import { Owner } from "@/types/domain";
import useSWR from "swr";
import { apiFetcher } from "@/lib/fetcher";
import Link from "next/link";
import ActivityFeed from "@/components/modules/dashboard/activity-feed";
import { Topup } from "@/types/topup";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { analyticsService, GrowthSummary } from "@/services/analytics.service";

// ─── Tipe data summary platform ───────────────────────────
interface DashboardSummary {
  total_outlets: number;
  total_koin: number;
  active_tenant: number;
}

// ─── Recent Owner Card ─────────────────────────────────────
function RecentOwnerRow({ owner }: { owner: Owner }) {
  const displayName = owner.name || "—";
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
      <div className="flex items-center gap-2.5">
        <div className="h-7 w-7 rounded-full bg-primary/10 text-primary text-[10px] font-extrabold flex items-center justify-center">
          {displayName.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-xs font-bold text-slate-800">{displayName}</p>
          <p className="text-[9px] text-slate-400">{owner.email}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-[10px] font-bold text-slate-500">
          {owner.created_at
            ? format(new Date(owner.created_at), "dd MMM, HH:mm", { locale: localeId })
            : "—"}
        </p>
        <p className="text-[9px] text-slate-400">{owner.total_outlets ?? 0} outlet</p>
      </div>
    </div>
  );
}

// ─── KPI Card (gaya analytics) ────────────────────────────
function KpiCard({
  label, value, sub, icon: Icon, color,
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <Card className="border border-slate-200 bg-white rounded-2xl p-5 flex flex-col gap-3 shadow-sm">
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-extrabold text-slate-900 tracking-tight">{value}</p>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">{label}</p>
        {sub && <p className="text-[10px] text-slate-500 mt-1">{sub}</p>}
      </div>
    </Card>
  );
}

// ─── Main Page ─────────────────────────────────────────────
export default function DashboardPage() {
  const { data, error, isLoading, mutate } = useSWR<ApiResponse<DashboardSummary>>(
    "/summary", apiFetcher, {
      dedupingInterval: 60_000, keepPreviousData: true, revalidateOnFocus: false,
    }
  );

  const { data: activityData, isLoading: isActivityLoading } = useSWR<ApiResponse<Topup[]>>(
    "/topup-koin", apiFetcher, { dedupingInterval: 30_000 }
  );

  // Recent registrations (3 hari) — pakai endpoint growth dari analytics
  const { data: growth } = useSWR<GrowthSummary>(
    "dashboard-growth-3", () => analyticsService.getGrowth(3), { dedupingInterval: 120_000 }
  );

  // Recent owners (3 hari) dari endpoint users — filter client-side
  const { data: allOwners } = useSWR<ApiResponse<Owner[]>>(
    "/users", apiFetcher, { dedupingInterval: 120_000 }
  );

  // Filter owner yang daftar dalam 3 hari terakhir
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const recentOwners = (allOwners?.data || []).filter(
    (o) => o.created_at && new Date(o.created_at) >= threeDaysAgo
  ).sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime());

  const stats = data?.data || { total_outlets: 0, total_koin: 0, active_tenant: 0 };
  const activities = (activityData?.data || []).slice(0, 10);

  return (
    <div className="space-y-6">
      {/* ── COMMAND BAR ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2 font-heading">
            <LayoutGrid className="h-5 w-5 text-primary" />
            Pusat Kontrol
          </h1>
          <p className="text-xs font-medium text-slate-500">
            Ringkasan operasional platform AyoCuci hari ini.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/analytics">
            <Button variant="outline" size="sm" className="h-8 px-3 font-bold text-[10px] uppercase tracking-wider gap-2 border-slate-200 text-primary hover:bg-primary/5">
              <TrendingUp className="h-3 w-3" />
              Lihat Analytics
            </Button>
          </Link>
          <Button
            variant="outline" size="sm"
            onClick={() => mutate()}
            disabled={isLoading}
            className="h-8 px-3 font-bold text-[10px] uppercase tracking-wider gap-2 border-slate-200"
          >
            <RefreshCw className={cn("h-3 w-3", isLoading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-[11px] font-bold text-rose-600 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* ── PLATFORM STATS ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <KpiCard
          label="Registered Outlets"
          sub="Total outlet terdaftar di platform"
          value={isLoading ? "—" : stats.total_outlets.toLocaleString("id-ID")}
          icon={Store}
          color="bg-slate-100 text-slate-600"
        />
        <KpiCard
          label="Koin Beredar"
          sub="Total koin aktif seluruh outlet"
          value={isLoading ? "—" : stats.total_koin.toLocaleString("id-ID")}
          icon={Coins}
          color="bg-orange-50 text-primary"
        />
        <KpiCard
          label="Outlet Aktif / Langganan"
          sub="Outlet dengan lisensi PRO aktif"
          value={isLoading ? "—" : stats.active_tenant.toLocaleString("id-ID")}
          icon={Zap}
          color="bg-emerald-50 text-emerald-600"
        />
      </div>

      {/* ── RECENT REGISTRATIONS + ACTIVITY FEED ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Transaction Activity Feed (2/3 lebar) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Activity className="h-3.5 w-3.5" />
              Aktivitas Topup Terkini
            </h3>
            <Link href="/topups">
              <Button variant="ghost" size="sm" className="text-primary font-bold text-[9px] uppercase tracking-wider h-7">
                Lihat Semua <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="min-h-[400px] rounded-xl border border-slate-200 bg-white overflow-hidden">
            <ActivityFeed activities={activities} isLoading={isActivityLoading} />
          </div>
        </div>

        {/* Sidebar kanan */}
        <div className="space-y-4">
          {/* Recent New Owners (3 hari) */}
          <Card className="border border-slate-200 rounded-xl bg-white overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
              <div className="flex items-center gap-2">
                <UserPlus className="h-3.5 w-3.5 text-primary" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                  Owner Baru (3 Hari)
                </p>
              </div>
              <span className="text-xs font-extrabold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                {growth?.recent_new_owners ?? 0}
              </span>
            </div>
            <div className="px-4 py-2 max-h-[260px] overflow-y-auto custom-scrollbar">
              {recentOwners.length === 0 ? (
                <div className="py-10 text-center">
                  <Users className="h-6 w-6 text-slate-200 mx-auto mb-2" />
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    Belum ada registrasi baru
                  </p>
                </div>
              ) : (
                recentOwners.slice(0, 8).map((owner) => (
                  <RecentOwnerRow key={owner.id} owner={owner} />
                ))
              )}
            </div>
            <div className="px-4 py-2.5 border-t border-slate-50">
              <Link href="/users">
                <Button variant="ghost" size="sm" className="w-full h-7 text-[10px] font-bold uppercase tracking-wider text-primary hover:bg-primary/5">
                  Lihat Semua Owner <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
          </Card>

          {/* Quick Links */}
          <Card className="border border-slate-200 rounded-xl bg-white p-4 space-y-2">
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-3">
              Akses Cepat
            </p>
            {[
              { label: "Manajemen Topup", href: "/topups", icon: Coins },
              { label: "Outlet & Tenant", href: "/tenants", icon: Store },
              { label: "Analytics Lengkap", href: "/analytics", icon: TrendingUp },
            ].map(({ label, href, icon: Icon }) => (
              <Link key={href} href={href}>
                <div className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 transition-colors group cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      <Icon className="h-3.5 w-3.5 text-slate-500 group-hover:text-primary" />
                    </div>
                    <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900">{label}</span>
                  </div>
                  <ArrowRight className="h-3 w-3 text-slate-300 group-hover:text-primary" />
                </div>
              </Link>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
