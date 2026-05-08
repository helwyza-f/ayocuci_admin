"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRightLeft,
  Banknote,
  CheckCircle2,
  Clock3,
  Loader2,
  Users2,
  Wallet2,
  History,
  ExternalLink,
  ChevronRight,
  UserCheck,
  Activity,
  Coins,
  TrendingUp,
  GitBranch,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  ReferralAdminPayout,
  ReferralAdminReward,
  ReferralAdminSummary,
} from "@/types/domain";
import { referralAdminService } from "@/services/referral-admin.service";
import Pagination from "@/components/shared/pagination";
import DateRangeFilter, { DateRange, filterByDateRange } from "@/components/shared/date-range-filter";

const PAGE_SIZE = 10;

const statusOptions = ["all", "pending", "approved", "process", "done"] as const;
type ReferralStatusFilter = (typeof statusOptions)[number];
type ReferralPayoutStatus = Exclude<ReferralStatusFilter, "all">;

const payoutStatusOrder: Record<ReferralPayoutStatus, number> = {
  pending: 1,
  approved: 2,
  process: 3,
  done: 4,
};

const currency = (value: number | string) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(value || 0));

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

export default function ReferralAdminPage() {
  const [summary, setSummary] = useState<ReferralAdminSummary | null>(null);
  const [payouts, setPayouts] = useState<ReferralAdminPayout[]>([]);
  const [rewards, setRewards] = useState<ReferralAdminReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ReferralStatusFilter>("all");
  const [savingPayoutId, setSavingPayoutId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [dateRange, setDateRange] = useState<DateRange>({ start: "", end: "" });
  const [rewardTypeFilter, setRewardTypeFilter] = useState<"all" | "recruit" | "topup">("all");
  const [rewardDateRange, setRewardDateRange] = useState<DateRange>({ start: "", end: "" });
  const [rewardSearch, setRewardSearch] = useState("");

  const loadData = useCallback(async (status: ReferralStatusFilter) => {
    setLoading(true);
    try {
      const [summaryRes, payoutsRes, rewardsRes] = await Promise.all([
        referralAdminService.getDashboard(),
        referralAdminService.getPayouts(status),
        referralAdminService.getRewards(),
      ]);

      if (summaryRes.data.status) setSummary(summaryRes.data.data);
      if (rewardsRes.data.status) setRewards(rewardsRes.data.data || []);
      if (payoutsRes.data.status) {
        setPayouts(payoutsRes.data.data || []);
        setNotes(
          Object.fromEntries(
            (payoutsRes.data.data || []).map((item) => [
              item.rp_id,
              item.rp_admin_note || "",
            ]),
          ),
        );
      }
    } catch {
      toast.error("Failed to load referral ecosystem data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(filter);
    setPage(1);
  }, [filter, loadData]);

  const handleUpdatePayout = async (id: string, status: ReferralPayoutStatus) => {
    setSavingPayoutId(id);
    try {
      await referralAdminService.updatePayoutStatus(id, {
        status,
        admin_note: notes[id] || undefined,
      });
      toast.success(`Payout status transitioned to ${status}`);
      await loadData(filter);
    } catch {
      toast.error("Failed to transition payout status");
    } finally {
      setSavingPayoutId(null);
    }
  };

  const getNextStatuses = (status: ReferralPayoutStatus) => {
    return (["approved", "process", "done"] as ReferralPayoutStatus[]).filter(
      (item) => payoutStatusOrder[item] > payoutStatusOrder[status],
    );
  };

  const filteredPayouts = filterByDateRange(payouts, (p) => p.rp_created, dateRange);
  const totalPages = Math.ceil(filteredPayouts.length / PAGE_SIZE);

  const filteredRewards = useMemo(() => {
    let r = filterByDateRange(rewards, (rw) => rw.rr_created, rewardDateRange);
    if (rewardTypeFilter !== "all") r = r.filter((rw) => rw.rr_type === rewardTypeFilter);
    if (rewardSearch.trim()) {
      const q = rewardSearch.toLowerCase();
      r = r.filter((rw) =>
        rw.referrer_nama?.toLowerCase().includes(q) ||
        rw.referrer_email?.toLowerCase().includes(q) ||
        rw.referred_nama?.toLowerCase().includes(q) ||
        rw.referred_email?.toLowerCase().includes(q) ||
        rw.rr_referred_outlet?.toLowerCase().includes(q)
      );
    }
    return r;
  }, [rewards, rewardTypeFilter, rewardDateRange, rewardSearch]);
  const paginatedPayouts = filteredPayouts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* COMMAND BAR HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2 font-heading">
            <TrendingUp className="h-5 w-5 text-primary" />
            Referral Economics
          </h1>
          <p className="text-xs font-medium text-slate-500">
            Manage owner acquisition incentives and payout requests.
          </p>
        </div>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Reward / Acq"
          sub="Nilai reward per owner referral"
          value={loading ? "—" : currency(Number(summary?.reward_per_owner ?? 0))}
          icon={Wallet2}
          color="bg-orange-50 text-primary"
        />
        <KpiCard
          label="Success Referrals"
          sub="Total owner berhasil diajak"
          value={loading ? "—" : (summary?.total_referrals ?? 0).toLocaleString("id-ID")}
          icon={Users2}
          color="bg-slate-100 text-slate-600"
        />
        <KpiCard
          label="Issued Rewards"
          sub="Total reward yang sudah dikreditkan"
          value={loading ? "—" : currency(summary?.total_rewards ?? 0)}
          icon={Coins}
          color="bg-violet-50 text-violet-600"
        />
        <KpiCard
          label="Pending Payouts"
          sub="Payout menunggu verifikasi"
          value={loading ? "—" : (summary?.pending_count ?? 0).toLocaleString("id-ID")}
          icon={Clock3}
          color="bg-amber-50 text-amber-600"
        />
      </div>

      {/* PAYOUT QUEUE — full width */}
      <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
             <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <History className="h-3.5 w-3.5" />
                Verification Queue
             </h3>
             <div className="flex flex-wrap gap-0.5 bg-slate-100/50 p-0.5 rounded border border-slate-200">
                {statusOptions.map((item) => (
                  <button
                    key={item}
                    onClick={() => setFilter(item)}
                    className={cn(
                      "rounded px-2 h-7 text-[8px] font-bold uppercase transition-all tracking-tight",
                      filter === item ? "bg-white text-slate-900 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700",
                    )}
                  >
                    {item}
                  </button>
                ))}
             </div>
          </div>

          <div className="flex items-center gap-1">
            <DateRangeFilter value={dateRange} onChange={(r) => { setDateRange(r); setPage(1); }} />
          </div>

          <div className="space-y-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-32 bg-white border border-slate-200 rounded-lg animate-pulse" />
              ))
            ) : payouts.length === 0 ? (
              <div className="py-24 text-center bg-white rounded-lg border border-dashed border-slate-200">
                <Activity className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">No requests found</p>
              </div>
            ) : (
              paginatedPayouts.map((item) => (
                <Card key={item.rp_id} className="p-4 border border-slate-200 shadow-none rounded-lg bg-white overflow-hidden group hover:border-primary/20 hover:shadow-sm transition-all duration-300">
                  <div className="flex flex-col xl:flex-row gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                         <div className="space-y-0.5">
                            <h4 className="text-sm font-bold text-slate-900 tracking-tight group-hover:text-primary transition-colors">{item.usr_nama}</h4>
                            <p className="text-[10px] font-medium text-slate-500">{item.usr_email}</p>
                         </div>
                         <Badge variant="outline" className={cn(
                            "rounded px-1.5 py-0 text-[8px] font-bold uppercase border shadow-none transition-colors",
                            item.rp_status === 'done' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-orange-50 text-orange-600 border-orange-100"
                         )}>
                            {item.rp_status}
                         </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-0.5">
                            <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Settlement</p>
                            <p className="text-base font-bold text-primary font-heading tracking-tight">{currency(item.rp_amount)}</p>
                         </div>
                         <div className="space-y-0.5">
                            <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Bank Destination</p>
                            <p className="text-[10px] font-bold text-slate-700 uppercase tracking-tight">
                               {item.rp_bank_name} <span className="text-slate-300 mx-0.5">|</span> {item.rp_account_number}
                            </p>
                            <p className="text-[9px] font-medium text-slate-400 italic">a.n {item.rp_account_name}</p>
                         </div>
                      </div>

                      {item.rp_note && (
                        <div className="p-2 bg-amber-50/20 border border-amber-100/50 rounded text-[10px] font-medium text-amber-700 italic group-hover:bg-amber-50/40 transition-colors">
                          <span className="font-bold uppercase not-italic mr-1 text-[8px] opacity-60">Note:</span>
                          "{item.rp_note}"
                        </div>
                      )}
                    </div>

                    <div className="xl:w-64 space-y-2 pt-4 xl:pt-0 xl:pl-4 xl:border-l border-slate-100">
                      <Textarea
                        value={notes[item.rp_id] || ""}
                        onChange={(e) => setNotes((prev) => ({ ...prev, [item.rp_id]: e.target.value }))}
                        rows={2}
                        placeholder="Admin notes..."
                        className="rounded text-[10px] font-medium border-slate-200 shadow-none bg-slate-50/20 focus:bg-white transition-all resize-none"
                      />
                      <div className="flex flex-col gap-1.5">
                        {getNextStatuses(item.rp_status).map((status) => (
                          <Button
                            key={status}
                            size="sm"
                            disabled={savingPayoutId === item.rp_id}
                            onClick={() => handleUpdatePayout(item.rp_id, status)}
                            className={cn(
                              "rounded font-bold uppercase text-[9px] tracking-widest h-8 active:scale-[0.98] transition-all",
                              status === "done" ? "bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-100" : "bg-slate-900 hover:bg-black shadow-sm shadow-slate-200"
                            )}
                          >
                            {savingPayoutId === item.rp_id ? <Loader2 className="h-3 w-3 animate-spin" /> : <ChevronRight className="h-3 w-3 mr-1 group-hover:translate-x-0.5 transition-transform" />}
                            To {status}
                          </Button>
                        ))}
                        {getNextStatuses(item.rp_status).length === 0 && (
                          <div className="flex items-center justify-center gap-1.5 py-2 text-emerald-600 font-bold text-[9px] uppercase italic tracking-wider">
                            <CheckCircle2 className="h-3 w-3" /> Fully Settled
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            totalItems={filteredPayouts.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </div>

        {/* REWARD HISTORY — Riwayat mutasi reward masuk */}
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
                {(["all", "recruit", "topup"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setRewardTypeFilter(t)}
                    className={cn(
                      "rounded px-2.5 h-7 text-[8px] font-bold uppercase tracking-tight transition-all",
                      rewardTypeFilter === t ? "bg-white text-slate-900 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    {t === "all" ? "Semua" : t}
                  </button>
                ))}
              </div>
              <DateRangeFilter value={rewardDateRange} onChange={setRewardDateRange} />
              {(rewardSearch || rewardTypeFilter !== "all" || rewardDateRange.start) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setRewardSearch(""); setRewardTypeFilter("all"); setRewardDateRange({ start: "", end: "" }); }}
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
                    <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider">Referrer (Pengajak)</th>
                    <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider">Referred (Diajak)</th>
                    <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider">Outlet</th>
                    <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider">Tipe</th>
                    <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider text-right">Reward</th>
                    <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider text-right">Tanggal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr><td colSpan={6} className="py-12 text-center">
                      <Loader2 className="h-5 w-5 animate-spin text-slate-300 mx-auto" />
                    </td></tr>
                  ) : filteredRewards.length === 0 ? (
                    <tr><td colSpan={6} className="py-16 text-center">
                      <GitBranch className="h-7 w-7 text-slate-200 mx-auto mb-2" />
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Belum ada riwayat komisi</p>
                    </td></tr>
                  ) : (
                    filteredRewards.map((r) => (
                      <tr key={r.rr_id} className="hover:bg-primary/[0.01] transition-colors group">
                        <td className="px-5 py-3">
                          <p className="text-xs font-bold text-slate-900">{r.referrer_nama}</p>
                          <p className="text-[10px] text-slate-400">{r.referrer_email}</p>
                        </td>
                        <td className="px-5 py-3">
                          <p className="text-xs font-bold text-slate-900">{r.referred_nama}</p>
                          <p className="text-[10px] text-slate-400">{r.referred_email}</p>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">{r.rr_referred_outlet || "—"}</span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={cn(
                            "text-[9px] font-bold uppercase px-2 py-0.5 rounded-full",
                            r.rr_type === "recruit" ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                          )}>{r.rr_type}</span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span className="text-sm font-extrabold text-primary tracking-tight">{currency(r.rr_reward_amount)}</span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span className="text-[10px] font-medium text-slate-500">
                            {new Date(r.rr_created).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                          </span>
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
