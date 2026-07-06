"use client";

import { useMemo, useState, useCallback } from "react";
import Link from "next/link";
import useSWR from "swr";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { toast } from "sonner";
import { AxiosError } from "axios";
import {
  ArrowRight,
  ArrowUpRight,
  Activity,
  Bell,
  Clock,
  Coins,
  LayoutGrid,
  RefreshCw,
  Store,
  TrendingUp,
  Users,
  Zap,
  UserRound,
} from "lucide-react";

import { useAuthStore } from "@/store/use-auth-store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PermissionGate from "@/components/shared/permission-gate";
import ActivityFeed from "@/components/modules/dashboard/activity-feed";
import { ApiErrorResponse, ApiResponse } from "@/types/api";
import { Owner } from "@/types/domain";
import { apiFetcher } from "@/lib/fetcher";
import { cn } from "@/lib/utils";
import { analyticsService, GrowthSummary, ActivitySummary } from "@/services/analytics.service";
import { topupService } from "@/services/topup.service";
import { addonService, AddonTransaction } from "@/services/addon.service";
import { resolveUploadUrl } from "@/lib/upload-url";
import { getTopupStatusUi } from "@/lib/topup-status";
import { type ActivityFeedItem } from "@/components/modules/dashboard/activity-feed";
import { Topup } from "@/types/topup";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";

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
}

type KoinFeedItem = ActivityFeedItem & {
  tk_metode_bayar: "transfer" | "midtrans" | "bonus" | "manual";
  type: "koin";
  date: Date;
};

type AddonFeedItem = ActivityFeedItem & {
  tk_metode_bayar: string;
  type: "addon";
  date: Date;
};

function MetricCard({
  label,
  value,
  icon: Icon,
  sub,
  accent = "text-slate-900",
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  sub?: string;
  accent?: string;
}) {
  return (
    <Card className="relative overflow-hidden rounded-[1.8rem] border border-slate-200/70 bg-white/90 p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)] backdrop-blur-xl">
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/5 blur-2xl" />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">{label}</p>
          <div className={cn("mt-3 text-[34px] leading-none font-black tracking-tight", accent)}>{value}</div>
          {sub ? <p className="mt-2 text-[11px] font-medium text-slate-500">{sub}</p> : null}
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 text-slate-400">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

function IdentityField({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/5 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">{label}</p>
          <p className="mt-1 text-sm font-black tracking-tight text-slate-900">{value || "-"}</p>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { hasPermission, _hasHydrated } = useAuthStore();
  const canReadAnalytics = _hasHydrated && hasPermission("analytics", "read");
  const canReadUsers = _hasHydrated && hasPermission("users", "read");
  const canReadTopups = _hasHydrated && hasPermission("topups", "read");
  const canReadPackages = _hasHydrated && hasPermission("packages", "read");
  const canConfirmTopups = _hasHydrated && hasPermission("topups", "confirm");
  const canCancelTopups = _hasHydrated && hasPermission("topups", "cancel");

  const { data, error, isLoading, mutate } = useSWR<ApiResponse<DashboardSummary>>(
    "/summary",
    apiFetcher,
    { dedupingInterval: 60_000, keepPreviousData: true, revalidateOnFocus: false },
  );

  const { data: activityData, mutate: mutateActivity } = useSWR<ApiResponse<Topup[]>>(
    canReadTopups ? "/topup-koin" : null,
    apiFetcher,
    { dedupingInterval: 30_000 },
  );

  const { data: addonData } = useSWR<ApiResponse<AddonTransaction[]>>(
    canReadPackages ? "/topup-addon" : null,
    apiFetcher,
    { dedupingInterval: 30_000 },
  );

  const { data: growth, mutate: mutateGrowth } = useSWR<GrowthSummary>(
    canReadAnalytics ? "dashboard-growth-3" : null,
    () => analyticsService.getGrowth(3),
    { dedupingInterval: 120_000 },
  );

  const { data: activitySummary, mutate: mutateActivitySummary } = useSWR<ActivitySummary>(
    canReadAnalytics ? "dashboard-activity-1" : null,
    () => analyticsService.getActivity(1),
    { dedupingInterval: 120_000 },
  );

  const { data: allOwners, mutate: mutateOwners } = useSWR<ApiResponse<Owner[]>>(
    canReadUsers ? "/users" : null,
    apiFetcher,
    { dedupingInterval: 120_000 },
  );

  const [selectedItem, setSelectedItem] = useState<ActivityFeedItem | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);

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
  };

  const recentOwners = useMemo(() => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    return (allOwners?.data || [])
      .filter((o) => o.created_at && new Date(o.created_at) >= threeDaysAgo)
      .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime());
  }, [allOwners]);

  const activities = useMemo<ActivityFeedItem[]>(() => {
    const koinTrx: KoinFeedItem[] = (activityData?.data || []).map((t) => ({
      ...t,
      type: "koin",
      date: new Date(t.tk_created),
    }));
    const addonTrx: AddonFeedItem[] = (addonData?.data || []).map((a) => ({
      tk_id: a.ha_id,
      tk_status:
        a.ha_status === "PENDING" || a.ha_status === "PENDING_VALIDATION"
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

  const handleAction = async (status: "success" | "failed") => {
    if (!selectedItem) return;
    setConfirming(true);
    try {
      if (selectedItem.type === "koin") {
        await topupService.confirm(selectedItem.tk_id, status);
      } else if (status === "success") {
        await addonService.approve(selectedItem.tk_id);
      } else {
        await addonService.reject(selectedItem.tk_id);
      }
      toast.success("Verifikasi berhasil diproses");
      setIsPreviewOpen(false);
      mutateActivity();
    } catch (err) {
      const error = err as AxiosError<ApiErrorResponse>;
      toast.error(error.response?.data?.message || "Gagal memproses verifikasi");
    } finally {
      setConfirming(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    await Promise.all([mutate(), mutateActivity(), mutateGrowth(), mutateActivitySummary(), mutateOwners()]);
  }, [mutate, mutateActivity, mutateGrowth, mutateActivitySummary, mutateOwners]);

  if (error) {
    return (
      <div className="rounded-[2rem] border border-rose-100 bg-rose-50 p-6 text-sm font-medium text-rose-700">
        Gagal memuat dashboard.
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-gradient-to-br from-slate-50 via-white to-primary/5 p-5 shadow-[0_18px_55px_rgba(15,23,42,0.08)] md:p-6">
        <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-12 left-1/3 h-36 w-36 rounded-full bg-sky-400/10 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">
              <LayoutGrid className="h-3.5 w-3.5 text-primary" />
              Control Hub
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 md:text-3xl">Dashboard Operasional</h1>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                Ringkasan aktif outlet, koin, transaksi, dan aktivitas verifikasi dalam satu layar.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="rounded-full border-slate-200 bg-white/80 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                <Store className="mr-1 h-3 w-3 text-primary" />
                Admin Dev
              </Badge>
              <Badge variant="outline" className="rounded-full border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">
                Operasional Aktif
              </Badge>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 md:min-w-[360px]">
            <Button
              onClick={handleRefresh}
              variant="outline"
              className="h-11 rounded-2xl border-slate-200 bg-white/90 px-4 text-xs font-black uppercase tracking-[0.18em] text-slate-600 shadow-none hover:bg-slate-50"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Link href="/users" className="inline-flex">
              <Button className="h-11 w-full rounded-2xl bg-slate-900 px-4 text-xs font-black uppercase tracking-[0.18em] text-white hover:bg-slate-800">
                <Users className="mr-2 h-4 w-4" />
                Profil Owner
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard label="Saldo Koin" value={dashboardStats.totalKoinIdle.toLocaleString("id-ID")} icon={Coins} sub="Saldo aktif" accent="text-slate-950" />
        <MetricCard label="Performa Order" value={`${dashboardStats.transactionsToday} Trx`} icon={TrendingUp} sub="Aktivitas hari ini" />
        <MetricCard label="Performa Omzet" value={`Rp ${dashboardStats.totalKoinPurchased.toLocaleString("id-ID")}`} icon={Activity} sub="Total realisasi" />
        <MetricCard label="Sisa Kuota SDM" value={`${dashboardStats.activeOutlets}/${dashboardStats.totalOutlets || 0}`} icon={Users} sub="Sumber daya aktif" />
      </div>

      <div className="overflow-hidden rounded-[1.4rem] border border-slate-200/70 bg-white/90 p-1 shadow-sm">
        <div className="grid grid-cols-3 overflow-hidden rounded-[1.2rem] bg-slate-50 p-1 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
          <div className="rounded-[1rem] bg-white px-3 py-3 text-center text-slate-900 shadow-sm">Dashboard</div>
          <div className="rounded-[1rem] bg-primary/10 px-3 py-3 text-center text-primary">Identitas</div>
          <div className="rounded-[1rem] px-3 py-3 text-center">Transaksi</div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="rounded-[1.8rem] border border-slate-200/70 bg-white/90 p-5 shadow-[0_12px_40px_rgba(15,23,42,0.05)]">
          <div className="mb-5 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
              <UserRound className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-[0.18em] text-slate-600">Detail Profil Operasional</h2>
              <p className="text-xs text-slate-400">Identitas outlet dan owner yang sedang aktif</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <IdentityField label="Nama Outlet" value="CERAH CUCI" icon={Store} />
            <IdentityField label="Nomor Kontak" value="6285658076427" icon={Bell} />
            <IdentityField label="ID Entitas" value="39.001" icon={Activity} />
            <IdentityField label="Status" value="OPERASIONAL AKTIF" icon={Zap} />
          </div>
        </Card>

        <div className="grid gap-3">
          <Card className="rounded-[1.8rem] border border-slate-200/70 bg-white/90 p-5 shadow-[0_12px_40px_rgba(15,23,42,0.05)]">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-black uppercase tracking-[0.18em] text-slate-600">Performa Mingguan</h2>
                <p className="text-xs text-slate-400">Progress ringkas operasional</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Owner Baru</p>
                <p className="mt-2 text-2xl font-black text-slate-900">{dashboardStats.newUsersToday}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Used Today</p>
                <p className="mt-2 text-2xl font-black text-slate-900">{dashboardStats.koinUsedToday}</p>
              </div>
            </div>
          </Card>

          <Card className="rounded-[1.8rem] border border-slate-200/70 bg-white/90 p-5 shadow-[0_12px_40px_rgba(15,23,42,0.05)]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-black uppercase tracking-[0.18em] text-slate-600">Aksi Cepat</h2>
                <p className="text-xs text-slate-400">Shortcut operasional</p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-slate-400" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/topups">
                <Button variant="outline" className="h-11 w-full justify-start rounded-2xl border-slate-200 bg-white text-xs font-bold text-slate-600">
                  <Coins className="mr-2 h-4 w-4 text-primary" />
                  Top Up
                </Button>
              </Link>
              <Link href="/customers">
                <Button variant="outline" className="h-11 w-full justify-start rounded-2xl border-slate-200 bg-white text-xs font-bold text-slate-600">
                  <Users className="mr-2 h-4 w-4 text-primary" />
                  Customers
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-[1.8rem] border border-slate-200/70 bg-white/90 p-5 shadow-[0_12px_40px_rgba(15,23,42,0.05)]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black uppercase tracking-[0.18em] text-slate-600">Aktivitas Terkini</h2>
              <p className="text-xs text-slate-400">Top up dan addon terbaru</p>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400" />
          </div>
          <div className="max-h-[520px] overflow-y-auto pr-1">
            <ActivityFeed
              activities={activities}
              isLoading={isLoading}
              onVerify={(item) => {
                setSelectedItem(item);
                setIsPreviewOpen(true);
              }}
            />
          </div>
        </Card>

        <Card className="rounded-[1.8rem] border border-slate-200/70 bg-white/90 p-5 shadow-[0_12px_40px_rgba(15,23,42,0.05)]">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-[0.18em] text-slate-600">Owner Terbaru</h2>
              <p className="text-xs text-slate-400">3 hari terakhir</p>
            </div>
          </div>
          <div className="space-y-2">
            {recentOwners.map((owner) => (
              <div key={owner.id ?? owner.email} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3">
                <p className="text-sm font-bold text-slate-900">{owner.name || "—"}</p>
                <p className="text-[11px] text-slate-400">{owner.email}</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                  {owner.created_at ? format(new Date(owner.created_at), "dd MMM yyyy, HH:mm", { locale: localeId }) : "—"}
                </p>
              </div>
            ))}
            {recentOwners.length === 0 ? <p className="text-sm text-slate-400">Belum ada owner baru.</p> : null}
          </div>
        </Card>
      </div>

      <PermissionGate module="analytics" action="read">
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard label="Active Outlet" value={dashboardStats.activeOutlets} icon={Store} sub="Outlet aktif saat ini" />
          <MetricCard label="Trial Outlet" value={dashboardStats.trialOutlets} icon={TrendingUp} sub="Dalam fase trial" />
          <MetricCard label="Expired Outlet" value={dashboardStats.expiredOutlets} icon={Clock} sub="Perlu tindak lanjut" />
        </div>
      </PermissionGate>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto rounded-[1.8rem] border border-slate-200/70 bg-white p-0 shadow-2xl sm:max-w-xl">
          <VisuallyHidden.Root>
            <DialogTitle>Detail Aktivitas</DialogTitle>
          </VisuallyHidden.Root>
          {selectedItem ? (
            <div className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Preview</p>
                  <h3 className="mt-2 text-lg font-black tracking-tight text-slate-900">{selectedItem.owner_name || selectedItem.outlet_name || "-"}</h3>
                  <p className="text-sm text-slate-500">{selectedItem.owner_code || selectedItem.tk_id}</p>
                </div>
                <Badge variant="outline" className="rounded-full border-slate-200 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                  {selectedItem.tk_status}
                </Badge>
              </div>

              <div className="mt-5 space-y-3">
                <div className="rounded-2xl bg-slate-50 p-4 text-sm">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Total</p>
                  <p className="mt-1 text-lg font-black text-slate-900">{selectedItem.tk_total?.toLocaleString("id-ID")}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => handleAction("success")}
                    disabled={confirming}
                    className="h-11 rounded-2xl bg-emerald-600 text-xs font-black uppercase tracking-[0.18em] text-white hover:bg-emerald-700"
                  >
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleAction("failed")}
                    disabled={confirming}
                    variant="outline"
                    className="h-11 rounded-2xl border-rose-200 text-xs font-black uppercase tracking-[0.18em] text-rose-600 hover:bg-rose-50"
                  >
                    Reject
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
