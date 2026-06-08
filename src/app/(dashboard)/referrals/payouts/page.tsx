"use client";

import React, { useCallback, useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { CheckCircle2, Clock3, Loader2, Users2, Wallet2, History, ChevronRight, Activity, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ReferralAdminPayout, ReferralAdminSummary } from "@/types/domain";
import { referralAdminService } from "@/services/referral-admin.service";
import Pagination from "@/components/shared/pagination";
import DateRangeFilter, { DateRange, filterByDateRange } from "@/components/shared/date-range-filter";
import { ExportExcelButton } from "@/components/shared/export-excel-button";
import { format } from "date-fns";

const PAGE_SIZE = 10;

const statusOptions = ["all", "pending", "approved", "process", "paid"] as const;
type ReferralStatusFilter = (typeof statusOptions)[number];
type ReferralPayoutStatus = Exclude<ReferralStatusFilter, "all">;

const payoutStatusOrder: Record<ReferralPayoutStatus, number> = {
  pending: 1,
  approved: 2,
  process: 3,
  paid: 4,
};

const currency = (value: number | string) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(value || 0));

const dateTime = (value?: string | null) =>
  value ? format(new Date(value), "dd/MM/yyyy HH:mm") : "—";

const statusLabel = (status: ReferralPayoutStatus) => {
  if (status === "pending") return "Menunggu";
  if (status === "approved") return "Disetujui";
  if (status === "process") return "Diproses";
  if (status === "paid") return "Dibayar";
  return status;
};

const normalizePayoutStatus = (status: ReferralAdminPayout["rp_status"]): ReferralPayoutStatus =>
  status === "done" ? "paid" : status;

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

function ReferralPayoutsContent() {
  const [summary, setSummary] = useState<ReferralAdminSummary | null>(null);
  const [payouts, setPayouts] = useState<ReferralAdminPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ReferralStatusFilter>("all");
  const [savingPayoutId, setSavingPayoutId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [dateRange, setDateRange] = useState<DateRange>({ start: "", end: "" });

  const loadData = useCallback(async (status: ReferralStatusFilter) => {
    setLoading(true);
    try {
      const [summaryRes, payoutsRes] = await Promise.all([
        referralAdminService.getDashboard(),
        referralAdminService.getPayouts(status),
      ]);

      if (summaryRes.data.status) {
        setSummary(summaryRes.data.data);
      }
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
      toast.error("Gagal memuat data pencairan");
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
      toast.success(`Status pencairan diubah ke ${statusLabel(status)}`);
      await loadData(filter);
    } catch {
      toast.error("Gagal mengubah status pencairan");
    } finally {
      setSavingPayoutId(null);
    }
  };

  const getNextStatuses = (status: ReferralPayoutStatus) => {
    return (["approved", "process", "paid"] as ReferralPayoutStatus[]).filter(
      (item) => payoutStatusOrder[item] > payoutStatusOrder[status],
    );
  };

  const filteredPayouts = filterByDateRange(payouts, (p) => p.rp_created, dateRange);
  const totalPages = Math.ceil(filteredPayouts.length / PAGE_SIZE);
  const paginatedPayouts = filteredPayouts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* COMMAND BAR HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2 font-heading">
            <TrendingUp className="h-5 w-5 text-primary" />
            Pencairan Referral
          </h1>
          <p className="text-xs font-medium text-slate-500">
            Kelola permintaan pencairan dana dari program referral.
          </p>
        </div>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <KpiCard
          label="Anggaran Pencairan"
          sub={`Sisa dari ${currency(summary?.payout_monthly_budget ?? 0)}`}
          value={loading ? "—" : currency(summary?.payout_monthly_remaining ?? 0)}
          icon={Wallet2}
          color="bg-violet-50 text-violet-600"
        />
        <KpiCard
          label="Menunggu Pencairan"
          sub="Pencairan menunggu verifikasi"
          value={loading ? "—" : (summary?.pending_count ?? 0).toLocaleString("id-ID")}
          icon={Clock3}
          color="bg-amber-50 text-amber-600"
        />
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <History className="h-3.5 w-3.5" />
              Antrean Verifikasi
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
                  {item === "all" ? "Semua" : statusLabel(item as ReferralPayoutStatus)}
                </button>
              ))}
            </div>
        </div>

        <div className="flex items-center gap-1 justify-between">
          <DateRangeFilter value={dateRange} onChange={(r) => { setDateRange(r); setPage(1); }} />
          <ExportExcelButton
            data={filteredPayouts}
            filename="payout_requests"
            sheetName="Payouts"
            columns={[
              { header: "ID", key: "rp_id", width: 22 },
              { header: "Owner", key: "usr_nama", width: 25 },
              { header: "Email", key: "usr_email", width: 30 },
              { header: "Bank", key: "rp_bank_name", width: 12 },
              { header: "Account No", key: "rp_account_number", width: 18 },
              { header: "Amount", key: "rp_amount", width: 15, format: (v) => v != null ? `Rp ${Number(v).toLocaleString()}` : "Rp 0" },
              { header: "Status", key: "rp_status", width: 12 },
              { header: "Bonus Count", key: "bonus_count", width: 12 },
              { header: "Referred Owners", key: "referred_owner_names", width: 30 },
              { header: "Referred Outlets", key: "referred_outlet_names", width: 30 },
              { header: "Requested", key: "rp_created", width: 22, format: (v) => v ? format(new Date(v), "dd/MM/yyyy HH:mm") : "" },
              { header: "Processed", key: "rp_processed_at", width: 22, format: (v) => v ? format(new Date(v), "dd/MM/yyyy HH:mm") : "" },
              { header: "Paid", key: "rp_completed_at", width: 22, format: (v) => v ? format(new Date(v), "dd/MM/yyyy HH:mm") : "" },
            ]}
          />
        </div>

        <div className="space-y-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 bg-white border border-slate-200 rounded-lg animate-pulse" />
            ))
          ) : payouts.length === 0 ? (
            <div className="py-24 text-center bg-white rounded-lg border border-dashed border-slate-200">
              <Activity className="h-8 w-8 text-slate-200 mx-auto mb-2" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Tidak ada permintaan ditemukan</p>
            </div>
          ) : (
            paginatedPayouts.map((item) => {
              const normalizedStatus = normalizePayoutStatus(item.rp_status);
              return (
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
                          normalizedStatus === 'paid' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-orange-50 text-orange-600 border-orange-100"
                        )}>
                          {statusLabel(normalizedStatus)}
                        </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-0.5">
                          <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Penyelesaian</p>
                          <p className="text-base font-bold text-primary font-heading tracking-tight">{currency(item.rp_amount)}</p>
                          <p className="text-[9px] font-semibold text-slate-400">{item.bonus_count ?? 0} bonus dipilih</p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Bank Tujuan</p>
                          <p className="text-[10px] font-bold text-slate-700 uppercase tracking-tight">
                              {item.rp_bank_name} <span className="text-slate-300 mx-0.5">|</span> {item.rp_account_number}
                          </p>
                          <p className="text-[9px] font-medium text-slate-700">{dateTime(item.rp_completed_at)}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 p-2 rounded bg-slate-50/70 border border-slate-100">
                      <div>
                        <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Diminta</p>
                        <p className="text-[10px] font-bold text-slate-700">{dateTime(item.rp_created)}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Diproses</p>
                        <p className="text-[10px] font-bold text-slate-700">{dateTime(item.rp_processed_at)}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Dibayar</p>
                        <p className="text-[10px] font-bold text-slate-700">{dateTime(item.rp_completed_at)}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 rounded border border-slate-100 bg-white">
                        <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Owner Direferensikan</p>
                        <p className="text-[10px] font-semibold text-slate-700 line-clamp-2">{item.referred_owner_names || "—"}</p>
                      </div>
                      <div className="p-2 rounded border border-slate-100 bg-white">
                        <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Outlet Referral</p>
                        <p className="text-[10px] font-semibold text-slate-700 line-clamp-2">{item.referred_outlet_names || "—"}</p>
                      </div>
                    </div>

                    {item.rp_note && (
                      <div className="p-2 bg-amber-50/20 border border-amber-100/50 rounded text-[10px] font-medium text-amber-700 italic group-hover:bg-amber-50/40 transition-colors">
                        <span className="font-bold uppercase not-italic mr-1 text-[8px] opacity-60">Catatan:</span>
                        <span>{item.rp_note}</span>
                      </div>
                    )}
                  </div>

                  <div className="xl:w-64 space-y-2 pt-4 xl:pt-0 xl:pl-4 xl:border-l border-slate-100">
                    <Textarea
                      value={notes[item.rp_id] || ""}
                      onChange={(e) => setNotes((prev) => ({ ...prev, [item.rp_id]: e.target.value }))}
                      rows={2}
                      placeholder="Catatan admin..."
                      className="rounded text-[10px] font-medium border-slate-200 shadow-none bg-slate-50/20 focus:bg-white transition-all resize-none"
                    />
                    <div className="flex flex-col gap-1.5">
                      {getNextStatuses(normalizedStatus).map((status) => (
                        <Button
                          key={status}
                          size="sm"
                          disabled={savingPayoutId === item.rp_id}
                          onClick={() => handleUpdatePayout(item.rp_id, status)}
                          className={cn(
                            "rounded font-bold uppercase text-[9px] tracking-widest h-8 active:scale-[0.98] transition-all",
                            status === "paid" ? "bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-100" : "bg-slate-900 hover:bg-black shadow-sm shadow-slate-200"
                          )}
                        >
                          {savingPayoutId === item.rp_id ? <Loader2 className="h-3 w-3 animate-spin" /> : <ChevronRight className="h-3 w-3 mr-1 group-hover:translate-x-0.5 transition-transform" />}
                          Ke {statusLabel(status)}
                        </Button>
                      ))}
                      {getNextStatuses(normalizedStatus).length === 0 && (
                        <div className="flex items-center justify-center gap-1.5 py-2 text-emerald-600 font-bold text-[9px] uppercase italic tracking-wider">
                          <CheckCircle2 className="h-3 w-3" /> Selesai Dibayar
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
              );
            })
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
    </div>
  );
}

export default function PayoutsPageAdmin() {
  return (
    <Suspense fallback={<div className="flex justify-center p-10"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>}>
      <ReferralPayoutsContent />
    </Suspense>
  );
}
