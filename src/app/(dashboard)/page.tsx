"use client";

import { useState, useMemo } from "react";


import {
  Store, Coins, Zap, Activity, ArrowRight, RefreshCw,
  LayoutGrid, AlertCircle, UserPlus, TrendingUp, Clock,
  Users, ArrowUpRight,
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
import { topupService } from "@/services/topup.service";
import { addonService, AddonTransaction } from "@/services/addon.service";
import { toast } from "sonner";
import { 
  Dialog, DialogContent, DialogTitle,
} from "@/components/ui/dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { Badge } from "@/components/ui/badge";

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

  const { data: activityData, isLoading: isActivityLoading, mutate: mutateActivity } = useSWR<ApiResponse<Topup[]>>(
    "/topup-koin", apiFetcher, { dedupingInterval: 30_000 }
  );

  const { data: addonData, isLoading: isAddonLoading } = useSWR<ApiResponse<AddonTransaction[]>>(
    "/topup-addon", apiFetcher, { dedupingInterval: 30_000 }
  );

  // Recent registrations (3 hari) — pakai endpoint growth dari analytics
  const { data: growth } = useSWR<GrowthSummary>(
    "dashboard-growth-3", () => analyticsService.getGrowth(3), { dedupingInterval: 120_000 }
  );

  // Recent owners (3 hari) dari endpoint users — filter client-side
  const { data: allOwners } = useSWR<ApiResponse<Owner[]>>(
    "/users", apiFetcher, { dedupingInterval: 120_000 }
  );


  // Modal & Verification States
  const [selectedItem, setSelectedItem] = useState<{ type: 'koin' | 'addon', data: any } | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  
  // Double Confirmation
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<{ id: string, status: 'success' | 'failed' } | null>(null);

  // Filter owner yang daftar dalam 3 hari terakhir
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const recentOwners = (allOwners?.data || []).filter(
    (o) => o.created_at && new Date(o.created_at) >= threeDaysAgo
  ).sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime());

  const stats = data?.data || { total_outlets: 0, total_koin: 0, active_tenant: 0 };
  
  // MERGE & SORT ACTIVITIES
  const activities = useMemo(() => {
    const koinTrx = (activityData?.data || []).map(t => ({ ...t, type: 'koin' as const, date: new Date(t.tk_created) }));
    const addonTrx = (addonData?.data || []).map(a => ({ 
      tk_id: a.ha_id,
      tk_status: (a.ha_status === 'PENDING' || a.ha_status === 'PENDING_VALIDATION') ? 'pending' : (a.ha_status === 'SUCCESS' ? 'success' : 'failed'),
      tk_total: a.ha_total,
      tk_jumlah: 0,
      tk_metode_bayar: a.ha_metode_bayar,
      tk_created: a.ha_created,
      tk_bukti: a.ha_bukti,
      outlet_name: a.outlet_name,
      item_names: a.item_names,
      type: 'addon' as const,
      date: new Date(a.ha_created)
    }));
    
    return [...koinTrx, ...addonTrx].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 12);
  }, [activityData, addonData]);

  const handleAction = async (status: 'success' | 'failed') => {
    if (!selectedItem) return;
    setConfirming(true);
    try {
      if (selectedItem.type === 'koin') {
        await topupService.confirm(selectedItem.data.tk_id, status);
      } else {
        if (status === 'success') await addonService.approve(selectedItem.data.tk_id);
        else await addonService.reject(selectedItem.data.tk_id);
      }
      toast.success("Verifikasi berhasil diproses");
      setIsPreviewOpen(false);
      mutateActivity();
    } catch (err) {
      toast.error("Gagal memproses verifikasi");
    } finally {
      setConfirming(false);
    }
  };

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
          <div className="min-h-[400px] rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <ActivityFeed 
              activities={activities as any} 
              isLoading={isActivityLoading || isAddonLoading} 
              onVerify={(item) => {
                setSelectedItem({ type: item.type, data: item });
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
    

      {/* ── VERIFICATION MODALS ── */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden border border-slate-200 rounded-2xl shadow-2xl bg-white">
          <VisuallyHidden.Root><DialogTitle>Detail Verifikasi</DialogTitle></VisuallyHidden.Root>
          
          <div className="p-5 border-b border-slate-100 bg-white">
            <div className="flex items-center justify-between mb-3">
              <Badge variant="outline" className="font-bold text-[9px] uppercase tracking-wider text-slate-400 border-slate-200">
                {selectedItem?.data.tk_id}
              </Badge>
              <Badge className={cn(
                "text-[8px] font-bold uppercase",
                selectedItem?.data.tk_status === 'pending' ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
              )}>
                {selectedItem?.type === 'koin' ? 'Topup Koin' : 'Aktivasi Addon'}
              </Badge>
            </div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight leading-none mb-1 font-heading uppercase">
              {selectedItem?.type === 'koin' ? `Topup ${selectedItem.data.tk_jumlah} Koin` : selectedItem?.data.item_names}
            </h3>
            <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
              <Store className="h-3 w-3" /> {selectedItem?.data.outlet_name}
            </p>
          </div>

          <div className="p-5 space-y-4 bg-slate-50/30">
            <div className="space-y-2">
              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Bukti Pembayaran</label>
              {selectedItem?.data.tk_bukti ? (
                 <div className="group relative aspect-video rounded-xl border border-slate-200 overflow-hidden bg-slate-200">
                    <img src={`https://api.ayocuci.id${selectedItem.data.tk_bukti}`} className="w-full h-full object-cover" alt="Proof" />
                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                      <a href={`https://api.ayocuci.id${selectedItem.data.tk_bukti}`} target="_blank" rel="noreferrer" className="bg-white text-slate-900 px-3 py-1.5 rounded-lg font-bold text-[10px] flex items-center gap-2">
                        <ArrowUpRight className="h-3 w-3" /> Fullscreen
                      </a>
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
                <div className="font-bold text-xs text-slate-700 uppercase">{selectedItem?.data.tk_metode_bayar}</div>
              </div>
              <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-sm">
                <p className="text-[8px] font-bold uppercase text-slate-400 mb-0.5">Value</p>
                <div className="font-bold text-xs text-primary">Rp {selectedItem?.data.tk_total?.toLocaleString("id-ID")}</div>
              </div>
            </div>
          </div>

          <div className="p-5 bg-white border-t border-slate-100">
            {selectedItem?.data.tk_status === "pending" ? (
              <div className="flex gap-3">
                <Button
                  disabled={confirming || !selectedItem.data.tk_bukti}
                  onClick={() => {
                    setConfirmTarget({ id: selectedItem.data.tk_id, status: 'success' });
                    setIsConfirmModalOpen(true);
                  }}
                  className="flex-1 h-11 rounded-xl font-bold text-[11px] uppercase tracking-wider bg-emerald-500 hover:bg-emerald-600 shadow-md"
                >
                  {confirming ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Setujui"}
                </Button>
                <Button
                  variant="outline"
                  disabled={confirming}
                  onClick={() => handleAction('failed')}
                  className="flex-1 h-11 rounded-xl font-bold text-[11px] uppercase tracking-wider text-rose-600 border-slate-200 hover:bg-rose-50"
                >
                  Tolak
                </Button>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                 <p className="text-[10px] font-bold uppercase text-slate-400 tracking-widest italic">Sudah Diproses: {selectedItem?.data.tk_status}</p>
              </div>
            )}
          </div>
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
                   Anda akan menyetujui transaksi senilai <b>Rp {selectedItem?.data.tk_total?.toLocaleString()}</b>. 
                   Lanjutkan proses?
                </p>
             </div>
             <div className="grid grid-cols-2 gap-3 pt-2">
                <Button variant="outline" className="h-10 rounded-xl font-bold text-[10px] uppercase border-slate-200" onClick={() => setIsConfirmModalOpen(false)}>Batal</Button>
                <Button className="h-10 rounded-xl font-bold text-[10px] uppercase bg-emerald-500 hover:bg-emerald-600" onClick={() => { setIsConfirmModalOpen(false); handleAction('success'); }}>Ya, Lanjutkan</Button>
             </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
