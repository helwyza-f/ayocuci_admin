"use client";

import React, { useCallback, useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, TrendingUp, GitBranch, Users2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ReferralAdminReward, ReferralAdminSummary } from "@/types/domain";
import { referralAdminService } from "@/services/referral-admin.service";
import DateRangeFilter, { DateRange, filterByDateRange } from "@/components/shared/date-range-filter";
import { ExportExcelButton } from "@/components/shared/export-excel-button";
import { format } from "date-fns";

const currency = (value: number | string) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(value || 0));

const getPayoutMethod = (reward: Pick<ReferralAdminReward, "rr_coin_amount" | "rr_coin_status">) =>
  reward.rr_coin_status === "claimed" || Number(reward.rr_coin_amount || 0) > 0
    ? "Koin"
    : "Cash";

const formatCoin = (value: number | string | null | undefined) =>
  `${Number(value || 0).toLocaleString("id-ID")} Koin`;

// ─── KPI Card ──────────────────────────────────────────────
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

function ReferralRewardsContent() {
  const [summary, setSummary] = useState<ReferralAdminSummary | null>(null);
  const [rewards, setRewards] = useState<ReferralAdminReward[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [rewardTypeFilter, setRewardTypeFilter] = useState<"all" | "first" | "monthly">("all");
  const [rewardStatusFilter, setRewardStatusFilter] = useState<"all" | "pending" | "paid">("all");
  const [rewardDateRange, setRewardDateRange] = useState<DateRange>({ start: "", end: "" });
  const searchParams = useSearchParams();
  const [rewardSearch, setRewardSearch] = useState(searchParams.get("search") || "");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryRes, rewardsRes] = await Promise.all([
        referralAdminService.getDashboard(),
        referralAdminService.getRewards()
      ]);

      if (summaryRes.data.status) {
        setSummary(summaryRes.data.data);
      }
      if (rewardsRes.data.status) {
        setRewards(rewardsRes.data.data || []);
      }
    } catch {
      toast.error("Gagal memuat data komisi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredRewards = useMemo(() => {
    let r = filterByDateRange(rewards, (rw) => rw.rr_created, rewardDateRange);
    
    if (rewardTypeFilter !== "all") {
      if (rewardTypeFilter === "first") {
        r = r.filter((rw) => rw.rr_type === "topup" && rw.rr_percent >= 10);
      } else if (rewardTypeFilter === "monthly") {
        r = r.filter((rw) => rw.rr_type === "topup" && rw.rr_percent > 0 && rw.rr_percent < 10);
      }
    }
    
    if (rewardStatusFilter !== "all") {
      r = r.filter((rw) => {
        if (rewardStatusFilter === "pending") return rw.rr_status === "credited" || rw.rr_status === "pending";
        return rw.rr_status === "paid" || rw.rr_status === "done";
      });
    }

    if (rewardSearch.trim()) {
      const q = rewardSearch.toLowerCase();
      r = r.filter((rw) =>
        rw.referrer_nama?.toLowerCase().includes(q) ||
        rw.referrer_email?.toLowerCase().includes(q) ||
        rw.referred_nama?.toLowerCase().includes(q) ||
        rw.referred_email?.toLowerCase().includes(q) ||
        rw.rr_referred_outlet?.toLowerCase().includes(q) ||
        rw.referred_outlet_name?.toLowerCase().includes(q) ||
        rw.referrer_id?.toString() === q
      );
    }
    return r;
  }, [rewards, rewardTypeFilter, rewardStatusFilter, rewardDateRange, rewardSearch]);

  return (
    <div className="space-y-6">
      {/* COMMAND BAR HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2 font-heading">
            <GitBranch className="h-5 w-5 text-primary" />
            Komisi Referral
          </h1>
          <p className="text-xs font-medium text-slate-500">
            Riwayat komisi masuk dari hasil ajakan pemilik usaha lain.
          </p>
        </div>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <KpiCard
          label="Komisi Isi Saldo"
          sub="Pertama / berikutnya"
          value={loading ? "—" : `${summary?.first_topup_percent ?? 0}% / ${summary?.next_topup_percent ?? 0}%`}
          icon={TrendingUp}
          color="bg-orange-50 text-primary"
        />
        <KpiCard
          label="Referral Berhasil"
          sub="Total owner berhasil diajak"
          value={loading ? "—" : (summary?.total_referrals ?? 0).toLocaleString("id-ID")}
          icon={Users2}
          color="bg-slate-100 text-slate-600"
        />
      </div>

      {/* REWARD HISTORY */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <GitBranch className="h-3.5 w-3.5" />
            Riwayat Komisi Masuk
            <span className="ml-1 text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold">{filteredRewards.length}</span>
          </h3>
          {/* Filter bar */}
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Cari nama / email / outlet..."
              value={rewardSearch}
              onChange={(e) => setRewardSearch(e.target.value)}
              className="h-8 text-[10px] rounded border-slate-200 shadow-none w-48 bg-white"
            />
            <div className="flex gap-0.5 bg-slate-100/50 p-0.5 rounded border border-slate-200">
              {(["all", "first", "monthly"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setRewardTypeFilter(t)}
                  className={cn(
                    "rounded px-2.5 h-7 text-[8px] font-bold uppercase tracking-tight transition-all",
                    rewardTypeFilter === t ? "bg-white text-slate-900 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  {t === "all" ? "Semua Tipe" : t === "first" ? "Top Up Pertama" : "Top Up Bulanan"}
                </button>
              ))}
            </div>
            <div className="flex gap-0.5 bg-slate-100/50 p-0.5 rounded border border-slate-200">
              {(["all", "pending", "paid"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setRewardStatusFilter(t)}
                  className={cn(
                    "rounded px-2.5 h-7 text-[8px] font-bold uppercase tracking-tight transition-all",
                    rewardStatusFilter === t ? "bg-white text-slate-900 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  {t === "all" ? "Semua Status" : t === "pending" ? "Menunggu" : "Sudah Dicairkan"}
                </button>
              ))}
            </div>
            <DateRangeFilter value={rewardDateRange} onChange={setRewardDateRange} />
            <ExportExcelButton
              data={filteredRewards}
              filename="referral_rewards"
              sheetName="Rewards"
              columns={[
                { header: "Tanggal", key: "rr_created", width: 22, format: (v) => v ? format(new Date(v as string), "dd/MM/yyyy HH:mm") : "" },
                { header: "Referrer", key: "referrer_nama", width: 25 },
                { header: "Referred", key: "referred_nama", width: 25 },
                { header: "Kode Outlet", key: "rr_referred_outlet", width: 15 },
                { header: "Nama Outlet", key: "referred_outlet_name", width: 25 },
                { header: "Tipe", key: "rr_type", width: 12 },
                { header: "Persen Terkunci", key: "rr_percent", width: 15, format: (v) => `${v}%` },
                { header: "Nominal Top Up (Koin)", key: "topup_coin_amount", width: 18, format: (v) => formatCoin(v as number | string) },
                { header: "Nominal Top Up (Rp)", key: "topup_amount_rp", width: 18, format: (v) => `Rp ${Number(v || 0).toLocaleString("id-ID")}` },
                { header: "Komisi", key: "rr_reward_amount", width: 15, format: (v) => v != null ? `Rp ${Number(v).toLocaleString()}` : "Rp 0" },
                { header: "Metode Pencairan", key: "payout_method", width: 16, format: (_, r) => getPayoutMethod(r as ReferralAdminReward) },
                { header: "Status", key: "rr_status", width: 15 },
              ]}
            />
            {(rewardSearch || rewardTypeFilter !== "all" || rewardStatusFilter !== "all" || rewardDateRange.start) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setRewardSearch(""); setRewardTypeFilter("all"); setRewardStatusFilter("all"); setRewardDateRange({ start: "", end: "" }); }}
                className="h-7 px-2 text-[9px] font-bold text-slate-400 hover:text-slate-700 uppercase"
              >
                Reset
              </Button>
            )}
          </div>
        </div>
        <Card className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-none">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider w-24">Tanggal</th>
                  <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider">Referrer (Pengajak)</th>
                  <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider">Referred (Diajak)</th>
                  <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider">Outlet Utama</th>
                  <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider">Tipe Komisi</th>
                  <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider text-right">Nominal Top Up</th>
                  <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider text-right">Komisi</th>
                  <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider text-center">Metode Pencairan</th>
                  <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider text-right">Status Pencairan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={9} className="py-12 text-center">
                    <Loader2 className="h-5 w-5 animate-spin text-slate-300 mx-auto" />
                  </td></tr>
                ) : filteredRewards.length === 0 ? (
                  <tr><td colSpan={9} className="py-16 text-center">
                    <GitBranch className="h-7 w-7 text-slate-200 mx-auto mb-2" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Belum ada riwayat komisi</p>
                  </td></tr>
                ) : (
                  filteredRewards.map((r) => (
                    <tr key={r.rr_id} className="hover:bg-primary/[0.01] transition-colors group">
                      <td className="px-5 py-3">
                        <span className="text-[10px] font-medium text-slate-500 whitespace-nowrap">
                          {new Date(r.rr_created).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <Link href={`/users/${r.referrer_id}`} className="hover:underline group-hover:text-primary transition-colors block">
                          <p className="text-xs font-bold text-slate-900">{r.referrer_nama}</p>
                          <p className="text-[10px] text-slate-400">{r.referrer_email}</p>
                        </Link>
                      </td>
                      <td className="px-5 py-3">
                        <Link href={`/users/${r.referred_id}`} className="hover:underline group-hover:text-primary transition-colors block">
                          <p className="text-xs font-bold text-slate-900">{r.referred_nama}</p>
                          <p className="text-[10px] text-slate-400">{r.referred_email}</p>
                        </Link>
                      </td>
                      <td className="px-5 py-3">
                        {r.rr_referred_outlet ? (
                          <Link href={`/tenants/${r.rr_referred_outlet}`} className="hover:underline group-hover:text-primary transition-colors block">
                            <p className="text-xs font-bold text-slate-900">{r.referred_outlet_name || "Outlet Tidak Diketahui"}</p>
                            <span className="text-[9px] font-mono font-bold text-slate-500">{r.rr_referred_outlet}</span>
                          </Link>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {r.rr_type === "recruit" ? (
                          <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 whitespace-nowrap">Bonus Daftar</span>
                        ) : (
                          <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 whitespace-nowrap">
                            {r.rr_percent >= 10 ? `Top Up Pertama (${r.rr_percent}%)` : `Top Up Bulanan (${r.rr_percent}%)`}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {Number(r.topup_coin_amount || 0) > 0 ? (
                           <div className="flex flex-col items-end">
                              <span className="text-[10px] font-bold text-primary tracking-tight">{currency(r.topup_amount_rp)}</span>
                              <span className="text-[9px] font-medium text-slate-400">{formatCoin(r.topup_coin_amount)}</span>
                           </div>
                        ) : "—"}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className="text-sm font-extrabold text-primary tracking-tight">{currency(r.rr_reward_amount)}</span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <Badge
                          variant="outline"
                          className={cn(
                            "rounded px-1.5 py-0 text-[8px] font-bold uppercase shadow-none",
                            getPayoutMethod(r) === "Koin"
                              ? "border-sky-100 bg-sky-50 text-sky-600"
                              : "border-emerald-100 bg-emerald-50 text-emerald-600",
                          )}
                        >
                          {getPayoutMethod(r)}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-right">
                        {(r.rr_status === "paid" || r.rr_status === "done") ? (
                          <Badge variant="outline" className="rounded px-1.5 py-0 text-[8px] font-bold uppercase border-emerald-100 bg-emerald-50 text-emerald-600 shadow-none">
                            Sudah Dicairkan
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="rounded px-1.5 py-0 text-[8px] font-bold uppercase border-orange-100 bg-orange-50 text-orange-600 shadow-none">
                            Menunggu
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function RewardsPageAdmin() {
  return (
    <Suspense fallback={<div className="flex justify-center p-10"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>}>
      <ReferralRewardsContent />
    </Suspense>
  );
}
