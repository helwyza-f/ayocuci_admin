"use client";

import { useState, useMemo, useCallback } from "react";
import { useAuthStore } from "@/store/use-auth-store";


import {
  Store, Coins, Zap, Activity, ArrowRight, RefreshCw,
  LayoutGrid, AlertCircle, UserPlus, TrendingUp, Clock,
  Users, ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ApiErrorResponse, ApiResponse } from "@/types/api";
import { Owner } from "@/types/domain";
import useSWR from "swr";
import { apiFetcher } from "@/lib/fetcher";
import Link from "next/link";
import ActivityFeed from "@/components/modules/dashboard/activity-feed";
import { cn } from "@/lib/utils";
import { resolveUploadUrl } from "@/lib/upload-url";
import { getTopupStatusUi, isTopupActionable } from "@/lib/topup-status";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { analyticsService, GrowthSummary, ActivitySummary } from "@/services/analytics.service";
import { topupService } from "@/services/topup.service";
import { addonService, AddonTransaction } from "@/services/addon.service";
import { toast } from "sonner";
import { AxiosError } from "axios";
import {
  Dialog, DialogContent, DialogTitle,
} from "@/components/ui/dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { Badge } from "@/components/ui/badge";
import { type ActivityFeedItem } from "@/components/modules/dashboard/activity-feed";
import { Topup } from "@/types/topup";
import PermissionGate from "@/components/shared/permission-gate";

// ─── Tipe data summary platform ───────────────────────────
interface DashboardSummary {
  total_outlets: number;
  total_koin: number;
  total_koin_idle?: number;
  total_koin_purchased?: number;
  total_koin_used?: number;
  koin_used_today?: number;
  new_users_today?: number;
  transactions_today?: number;
  active_tenant: number;
  active_outlets?: number;
  inactive_outlets?: number;
  trial_outlets?: number;
  pro_outlets?: number;
  expired_outlets?: number;
  // Status Keaktifan Nasabah (outlet) — berbasis transaksi laundry terakhir
  nasabah_aktif_7d?: number;
  nasabah_aktif_30d?: number;
  nasabah_pasif?: number;
  nasabah_dorman?: number;
  nasabah_belum_transaksi?: number;
  outlets_addon_active?: number;
}

type KoinFeedItem = ActivityFeedItem & {
  tk_metode_bayar: "transfer" | "midtrans" | "bonus" | "manual" | "inject";
  type: "koin";
  date: Date;
};

type AddonFeedItem = ActivityFeedItem & {
  tk_metode_bayar: string;
  type: "addon";
  date: Date;
};

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
          {owner.owner_code && (
            <p className="text-[9px] text-slate-500 font-mono">Kode Referral: {owner.owner_code}</p>
          )}
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
  label, value, sub, icon: Icon, color, href,
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string; href?: string;
}) {
  const card = (
    <Card className="relative overflow-hidden border border-slate-200/60 bg-white/80 backdrop-blur-xl rounded-2xl p-5 flex flex-col gap-3 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 group">
      <div className="absolute -top-4 -right-4 p-4 opacity-[0.03] group-hover:scale-150 group-hover:rotate-12 transition-all duration-700 pointer-events-none">
         <Icon className="w-32 h-32" />
      </div>
      <div className={`relative z-10 h-10 w-10 rounded-xl flex items-center justify-center shadow-inner group-hover:-translate-y-1 transition-transform duration-300 ${color}`}>
        <Icon className="h-5 w-5 drop-shadow-sm" />
      </div>
      <div className="relative z-10 mt-1">
        <p className="text-2xl font-extrabold text-slate-900 tracking-tight drop-shadow-sm">{value}</p>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">{label}</p>
        {sub && <p className="text-[10px] text-slate-500 mt-1.5 line-clamp-1">{sub}</p>}
      </div>
    </Card>
  );

  if (!href) return card;

  return (
    <Link href={href} className="block">
      {card}
    </Link>
  );
}

// ─── Main Page ─────────────────────────────────────────────
export default function DashboardPage() {
  const { hasPermission, _hasHydrated } = useAuthStore();
  const canReadAnalytics = _hasHydrated && hasPermission("analytics", "read");
  const canReadUsers = _hasHydrated && hasPermission("users", "read");
  const canReadTopups = _hasHydrated && hasPermission("topups", "read");
  const canReadPackages = _hasHydrated && hasPermission("packages", "read");
  const canConfirmTopups = _hasHydrated && hasPermission("topups", "confirm");
  const canCancelTopups = _hasHydrated && hasPermission("topups", "cancel");
  const canTakeVerificationAction = canConfirmTopups || canCancelTopups;

  const { data, error, isLoading, mutate } = useSWR<ApiResponse<DashboardSummary>>(
    "/summary", apiFetcher, {
      dedupingInterval: 60_000, keepPreviousData: true, revalidateOnFocus: false,
    }
  );

  const { data: activityData, isLoading: isActivityLoading, mutate: mutateActivity } = useSWR<ApiResponse<Topup[]>>(
    canReadTopups ? "/topup-koin" : null, apiFetcher, { dedupingInterval: 30_000 }
  );

  const { data: addonData, isLoading: isAddonLoading } = useSWR<ApiResponse<AddonTransaction[]>>(
    canReadPackages ? "/topup-addon" : null, apiFetcher, { dedupingInterval: 30_000 }
  );

  // Recent registrations (3 hari) — pakai endpoint growth dari analytics
  const { data: growth, mutate: mutateGrowth } = useSWR<GrowthSummary>(
    canReadAnalytics ? "dashboard-growth-3" : null, () => analyticsService.getGrowth(3), { dedupingInterval: 120_000 }
  );

  // Today's Activity Summary (GMV)
  const { data: activitySummary, mutate: mutateActivitySummary } = useSWR<ActivitySummary>(
    canReadAnalytics ? "dashboard-activity-1" : null, () => analyticsService.getActivity(1), { dedupingInterval: 120_000 }
  );

  // Recent owners (3 hari) dari endpoint users — filter client-side
  const { data: allOwners, mutate: mutateOwners } = useSWR<ApiResponse<Owner[]>>(
    canReadUsers ? "/users" : null, apiFetcher, { dedupingInterval: 120_000 }
  );


  // Modal & Verification States
  const [selectedItem, setSelectedItem] = useState<ActivityFeedItem | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [proofPreviewUrl, setProofPreviewUrl] = useState<string | null>(null);

  // Double Confirmation
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Filter owner yang daftar dalam 3 hari terakhir
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const recentOwners = (allOwners?.data || []).filter(
    (o) => o.created_at && new Date(o.created_at) >= threeDaysAgo
  ).sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime());

  const stats = data?.data || { total_outlets: 0, total_koin: 0, active_tenant: 0 };
  const dashboardStats = {
    totalOutlets: stats.total_outlets ?? 0,
    activeOutlets: stats.active_outlets ?? stats.active_tenant ?? 0,
    inactiveOutlets: stats.inactive_outlets ?? 0,
    totalKoinIdle: stats.total_koin_idle ?? stats.total_koin ?? 0,
    totalKoinPurchased: stats.total_koin_purchased ?? 0,
    totalKoinUsed: stats.total_koin_used ?? 0,
    koinUsedToday: stats.koin_used_today ?? 0,
    newUsersToday: stats.new_users_today ?? 0,
    transactionsToday: stats.transactions_today ?? 0,
    trialOutlets: stats.trial_outlets ?? 0,
    proOutlets: stats.pro_outlets ?? 0,
    expiredOutlets: stats.expired_outlets ?? 0,
    nasabahAktif7d: stats.nasabah_aktif_7d ?? 0,
    nasabahAktif30d: stats.nasabah_aktif_30d ?? 0,
    nasabahPasif: stats.nasabah_pasif ?? 0,
    nasabahDorman: stats.nasabah_dorman ?? 0,
    nasabahBelumTransaksi: stats.nasabah_belum_transaksi ?? 0,
    outletsAddonActive: stats.outlets_addon_active ?? 0,
  };
  
  // MERGE & SORT ACTIVITIES
  const activities = useMemo<ActivityFeedItem[]>(() => {
    const koinTrx: KoinFeedItem[] = (activityData?.data || []).map((t) => ({
      ...t,
      type: "koin",
      date: new Date(t.tk_created),
    }));
    const addonTrx: AddonFeedItem[] = (addonData?.data || []).map((a) => ({
      tk_id: a.ha_id,
      tk_status: a.ha_status === "PENDING" || a.ha_status === "PENDING_VALIDATION"
        ? "pending"
        : a.ha_status === "SUCCESS"
          ? "success"
          : "failed",
      tk_total: a.ha_total,
      tk_jumlah: 0,
      tk_metode_bayar: a.ha_metode_bayar,
      tk_created: a.ha_created,
      tk_bukti: a.ha_bukti,
      outlet_name: a.outlet_name,
      owner_name: a.owner_name,
      owner_code: a.owner_code,
      item_names: a.item_names,
      type: "addon",
      date: new Date(a.ha_created),
    }));

    return [...koinTrx, ...addonTrx].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 12);
  }, [activityData, addonData]);

  const handleAction = async (status: 'success' | 'failed') => {
    if (!selectedItem) return;
    setConfirming(true);
    try {
      if (selectedItem.type === "koin") {
        await topupService.confirm(selectedItem.tk_id, status);
      } else {
        if (status === "success") await addonService.approve(selectedItem.tk_id);
        else await addonService.reject(selectedItem.tk_id);
      }
      toast.success("Verifikasi berhasil diproses");
      setIsPreviewOpen(false);
      mutateActivity();
    } catch (error) {
      const err = error as AxiosError<ApiErrorResponse>;
      toast.error(err.response?.data?.message || "Gagal memproses verifikasi");
    } finally {
      setConfirming(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    await Promise.all([
      mutate(),
      mutateActivity(),
      mutateGrowth(),
      mutateActivitySummary(),
      mutateOwners(),
    ]);
  }, [mutate, mutateActivity, mutateGrowth, mutateActivitySummary, mutateOwners]);

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
            Ringkasan growth harian untuk akuisisi, transaksi, dan pemakaian koin hari ini.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canReadAnalytics && (
            <Link href="/analytics">
              <Button variant="outline" size="sm" className="h-8 px-3 font-bold text-[10px] uppercase tracking-wider gap-2 border-slate-200 text-primary hover:bg-primary/5">
                <TrendingUp className="h-3 w-3" />
                Lihat Analisis
              </Button>
            </Link>
          )}
          <Button
            variant="outline" size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="h-8 px-3 font-bold text-[10px] uppercase tracking-wider gap-2 border-slate-200"
          >
            <RefreshCw className={cn("h-3 w-3", isLoading && "animate-spin")} />
            Segarkan
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
      <div className="space-y-4">
        <div className="space-y-1 px-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">
            Growth Hari Ini
          </p>
          <p className="text-xs text-slate-500">
            Fokus ke akuisisi baru, aktivitas transaksi, dan pemakaian koin hari ini.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            label="New User Hari Ini"
            sub="Owner baru yang registrasi hari ini"
            value={isLoading ? "—" : dashboardStats.newUsersToday.toLocaleString("id-ID")}
            icon={UserPlus}
            color="bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-fuchsia-200"
            href="/users?date_preset=today"
          />
          <KpiCard
            label="Total Transaksi Hari Ini"
            sub="Jumlah transaksi laundry yang tercatat hari ini"
            value={isLoading ? "—" : dashboardStats.transactionsToday.toLocaleString("id-ID")}
            icon={Activity}
            color="bg-gradient-to-br from-sky-500 to-cyan-500 text-white shadow-cyan-200"
            href="/tenants?activity=today_tx"
          />
          <KpiCard
            label="Koin Terpakai Hari Ini"
            sub="Koin keluar hari ini dari seluruh outlet"
            value={isLoading ? "—" : dashboardStats.koinUsedToday.toLocaleString("id-ID")}
            icon={Coins}
            color="bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-orange-200"
            href="/coin-ledger?jenis=keluar&date_preset=today"
          />
          <KpiCard
            label="Outlet Operasional Hari Ini"
            sub="Outlet yang benar-benar bertransaksi hari ini"
            value={canReadAnalytics && activitySummary ? activitySummary.today_active_outlets.toLocaleString("id-ID") : "—"}
            icon={TrendingUp}
            color="bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-emerald-200"
            href="/tenants?activity=today_tx"
          />
        </div>
      </div>

      {/* ── STATUS KEAKTIFAN NASABAH ── */}
      <div className="space-y-4">
        <div className="space-y-1 px-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">
            Status Keaktifan Nasabah
          </p>
          <p className="text-xs text-slate-500">
            Klasifikasi outlet berdasarkan transaksi laundry terakhir &amp; kepemilikan Add-On.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          {[
            { label: "Aktif (7 hari)", value: dashboardStats.nasabahAktif7d, href: "/tenants?keaktifan=aktif_7d", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
            { label: "Aktif (30 hari)", value: dashboardStats.nasabahAktif30d, href: "/tenants?keaktifan=aktif_30d", color: "text-lime-700 bg-lime-50 border-lime-200" },
            { label: "Pasif (31-60 hr)", value: dashboardStats.nasabahPasif, href: "/tenants?keaktifan=pasif", color: "text-amber-700 bg-amber-50 border-amber-200" },
            { label: "Dorman (>60 hr)", value: dashboardStats.nasabahDorman, href: "/tenants?keaktifan=dorman", color: "text-rose-700 bg-rose-50 border-rose-200" },
            { label: "Belum Transaksi", value: dashboardStats.nasabahBelumTransaksi, href: "/tenants?keaktifan=belum", color: "text-slate-600 bg-slate-50 border-slate-200" },
            { label: "Add-On Aktif", value: dashboardStats.outletsAddonActive, href: "/tenants?addon=addon_active", color: "text-violet-700 bg-violet-50 border-violet-200" },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`rounded-2xl border p-4 transition-colors hover:brightness-[0.97] ${item.color}`}
            >
              <p className="text-2xl font-extrabold tracking-tight tabular-nums">
                {isLoading ? "—" : item.value.toLocaleString("id-ID")}
              </p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-widest opacity-80">
                {item.label}
              </p>
            </Link>
          ))}
        </div>
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
              {canReadTopups && (
                <Link href="/topups">
                  <Button variant="ghost" size="sm" className="text-primary font-bold text-[9px] uppercase tracking-wider h-7">
                    Lihat Semua <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              )}
            </div>
            <div className="min-h-[400px] rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              <ActivityFeed 
                activities={activities}
                isLoading={isActivityLoading || isAddonLoading} 
                onVerify={(item) => {
                  setSelectedItem(item);
                  setIsPreviewOpen(true);
                }}
              />
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
                {canReadAnalytics ? (growth?.recent_new_owners ?? 0) : 0}
              </span>
            </div>
            <div className="px-4 py-2 max-h-[260px] overflow-y-auto custom-scrollbar">
              {!canReadUsers ? (
                <div className="py-10 text-center">
                  <Users className="h-6 w-6 text-slate-200 mx-auto mb-2" />
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    Role ini tidak memiliki akses owner
                  </p>
                </div>
              ) : recentOwners.length === 0 ? (
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
            {canReadUsers && (
              <div className="px-4 py-2.5 border-t border-slate-50">
                <Link href="/users">
                  <Button variant="ghost" size="sm" className="w-full h-7 text-[10px] font-bold uppercase tracking-wider text-primary hover:bg-primary/5">
                    Lihat Semua Owner <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </div>
            )}
          </Card>

          {/* Quick Links */}
          <Card className="border border-slate-200 rounded-xl bg-white p-4 space-y-2">
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-3">
              Akses Cepat
            </p>
            {[
              { label: "Manajemen Topup", href: "/topups", icon: Coins },
              { label: "Outlet & Pemilik", href: "/tenants", icon: Store },
              { label: "Analytics Lengkap", href: "/analytics", icon: TrendingUp },
            ].filter(({ href }) => {
              if (href === "/topups") return canReadTopups;
              if (href === "/analytics") return canReadAnalytics;
              if (href === "/tenants") return hasPermission("tenants", "read");
              return true;
            }).map(({ label, href, icon: Icon }) => (
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
    

      {/* ── VERIFICATION MODALS ── */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden border border-slate-200 rounded-2xl shadow-2xl bg-white">
          <VisuallyHidden.Root><DialogTitle>Detail Verifikasi</DialogTitle></VisuallyHidden.Root>
          
          <div className="p-5 border-b border-slate-100 bg-white">
            <div className="flex items-center justify-between mb-3">
              <Badge variant="outline" className="font-bold text-[9px] uppercase tracking-wider text-slate-400 border-slate-200">
                {selectedItem?.tk_id}
              </Badge>
              <Badge className={cn(
                "text-[8px] font-bold uppercase",
                selectedItem?.type === "koin"
                  ? getTopupStatusUi(selectedItem?.tk_status).className
                  : "bg-orange-50 text-orange-600 border-orange-100"
              )}>
                {selectedItem?.type === "koin" ? "Topup Koin" : "Aktivasi Addon"}
              </Badge>
            </div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight leading-none mb-1 font-heading uppercase">
              {selectedItem?.type === "koin"
                ? `Topup ${selectedItem.tk_jumlah ?? 0} Koin`
                : selectedItem?.item_names}
            </h3>
            <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
              <Store className="h-3 w-3" /> {selectedItem?.outlet_name}
            </p>
            <p className="mt-1 text-[10px] font-medium text-slate-400">
              Owner: <span className="font-bold text-slate-600">{selectedItem?.owner_name || "Nama tidak tersedia"}</span>
              {selectedItem?.owner_code ? (
                <span className="ml-2 font-mono text-slate-500">#{selectedItem.owner_code}</span>
              ) : null}
            </p>
          </div>

          <div className="p-5 space-y-4 bg-slate-50/30">
            <div className="space-y-2">
              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Bukti Pembayaran</label>
              {selectedItem?.tk_bukti ? (
                 <div className="group relative aspect-video rounded-xl border border-slate-200 overflow-hidden bg-slate-200">
                  <img src={resolveUploadUrl(selectedItem.tk_bukti)} className="w-full h-full object-cover" alt="Proof" />
                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                      <button
                        type="button"
                        onClick={() => setProofPreviewUrl(resolveUploadUrl(selectedItem.tk_bukti))}
                        className="bg-white text-slate-900 px-3 py-1.5 rounded-lg font-bold text-[10px] flex items-center gap-2"
                      >
                        <ArrowUpRight className="h-3 w-3" /> Layar Penuh
                      </button>
                    </div>
                 </div>
              ) : (
                <div className="aspect-video rounded-xl bg-slate-100 border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                  <Clock className="h-6 w-6 mb-1 opacity-30" />
                  <p className="text-[9px] font-bold uppercase tracking-widest text-center px-10">Menunggu Bukti Transfer</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-sm">
                <p className="text-[8px] font-bold uppercase text-slate-400 mb-0.5">Metode</p>
                <div className="font-bold text-xs text-slate-700 uppercase">{selectedItem?.tk_metode_bayar}</div>
              </div>
              <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-sm">
                <p className="text-[8px] font-bold uppercase text-slate-400 mb-0.5">Nominal</p>
                <div className="font-bold text-xs text-primary">Rp {selectedItem?.tk_total?.toLocaleString("id-ID")}</div>
              </div>
            </div>

             <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl shadow-inner mt-4 text-[10px] space-y-2">
                <p className="font-bold uppercase text-slate-500 mb-2 border-b border-slate-200 pb-1 flex items-center gap-1">
                   <Clock className="h-3 w-3" /> Audit Log
                </p>
                <div className="flex justify-between items-center">
                   <span className="text-slate-500 font-medium">Tagihan Dibuat:</span>
                   <span className="font-bold text-slate-800">
                      {selectedItem?.tk_created ? format(new Date(selectedItem.tk_created), "dd MMM yyyy HH:mm") : "-"}
                   </span>
                </div>
                <div className="flex justify-between items-center">
                   <span className="text-slate-500 font-medium">Waktu Upload Bukti:</span>
                   <span className="font-bold text-slate-800">
                      {selectedItem?.tk_tanggal_upload_bukti ? format(new Date(selectedItem.tk_tanggal_upload_bukti), "dd MMM yyyy HH:mm") : "-"}
                   </span>
                </div>
                {selectedItem?.tk_tanggal_validasi && (
                   <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Divalidasi Pada:</span>
                      <span className="font-bold text-emerald-600">
                         {format(new Date(selectedItem.tk_tanggal_validasi), "dd MMM yyyy HH:mm")}
                      </span>
                   </div>
                )}
                {selectedItem?.tk_staf_validasi && (
                   <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Divalidasi Oleh:</span>
                      <span className="font-bold text-emerald-600">
                         {selectedItem.tk_staf_validasi}
                      </span>
                   </div>
                )}
             </div>
          </div>

          <div className="p-5 bg-white border-t border-slate-100">
            {selectedItem && isTopupActionable(selectedItem.tk_status) && canTakeVerificationAction ? (
              <div className="flex gap-3">
                <PermissionGate module="topups" action="confirm">
                  <Button
                    disabled={confirming || !selectedItem.tk_bukti}
                    onClick={() => setIsConfirmModalOpen(true)}
                    className="flex-1 h-11 rounded-xl font-bold text-[11px] uppercase tracking-wider bg-emerald-500 hover:bg-emerald-600 shadow-md"
                  >
                    {confirming ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Setujui"}
                  </Button>
                </PermissionGate>
                <PermissionGate module="topups" action="cancel">
                  <Button
                    variant="outline"
                    disabled={confirming}
                    onClick={() => handleAction('failed')}
                    className="flex-1 h-11 rounded-xl font-bold text-[11px] uppercase tracking-wider text-rose-600 border-slate-200 hover:bg-rose-50"
                  >
                    Tolak
                  </Button>
                </PermissionGate>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                 <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest italic">
                   {canTakeVerificationAction
                     ? `Locked: ${getTopupStatusUi(selectedItem?.tk_status).label}`
                     : "Read only: role ini tidak memiliki izin verifikasi"}
                 </p>
              </div>
            )}
          </div>
      </DialogContent>
      </Dialog>

      <Dialog open={Boolean(proofPreviewUrl)} onOpenChange={(open) => !open && setProofPreviewUrl(null)}>
        <DialogContent className="max-w-5xl p-2 border border-slate-200 rounded-2xl bg-white">
          <VisuallyHidden.Root><DialogTitle>Preview Bukti Pembayaran</DialogTitle></VisuallyHidden.Root>
          {proofPreviewUrl ? (
            <div className="overflow-hidden rounded-xl bg-slate-100">
              <img src={proofPreviewUrl} alt="Preview bukti pembayaran" className="max-h-[85vh] w-full object-contain" />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* DOUBLE CONFIRMATION */}
      <Dialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
        <DialogContent className="max-w-sm p-6 rounded-2xl border-none shadow-2xl">
          <div className="text-center space-y-4">
             <div className="h-14 w-14 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto border border-amber-100">
                <AlertCircle className="h-8 w-8" />
             </div>
             <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Konfirmasi Ganda</h3>
                <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                   Anda akan menyetujui transaksi senilai <b>Rp {selectedItem?.tk_total?.toLocaleString()}</b>. 
                   Lanjutkan proses?
                </p>
             </div>
             <div className="grid grid-cols-2 gap-3 pt-2">
                <Button variant="outline" className="h-10 rounded-xl font-bold text-[10px] uppercase border-slate-200" onClick={() => setIsConfirmModalOpen(false)}>Batal</Button>
                <PermissionGate module="topups" action="confirm">
                  <Button className="h-10 rounded-xl font-bold text-[10px] uppercase bg-emerald-500 hover:bg-emerald-600" onClick={() => { setIsConfirmModalOpen(false); handleAction("success"); }}>Ya, Lanjutkan</Button>
                </PermissionGate>
             </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
