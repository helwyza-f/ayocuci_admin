"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Target,
  Flame,
  Search,
  Phone,
  Download,
  Loader2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Coins,
} from "lucide-react";
import {
  salesTargetService,
  type SalesTarget,
  type SalesTargetResponse,
  type SalesTier,
  type ContactStatus,
} from "@/services/sales-target.service";
import { cn } from "@/lib/utils";

const TIER_META: Record<SalesTier, { label: string; cls: string; dot: string }> = {
  hot: { label: "🔥 Hot", cls: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500" },
  warm: { label: "🟡 Warm", cls: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  cold: { label: "🔵 Cold", cls: "bg-sky-50 text-sky-700 border-sky-200", dot: "bg-sky-500" },
};

const STATUS_OPTIONS: { value: ContactStatus; label: string }[] = [
  { value: "baru", label: "Baru" },
  { value: "dihubungi", label: "Sudah dihubungi" },
  { value: "tertarik", label: "Tertarik" },
  { value: "closing", label: "Closing" },
  { value: "gagal", label: "Gagal" },
];

const STATUS_CLS: Record<ContactStatus, string> = {
  baru: "text-slate-500",
  dihubungi: "text-blue-600",
  tertarik: "text-violet-600",
  closing: "text-green-600",
  gagal: "text-red-500",
};

const rupiah = (n: number) => "Rp " + (n || 0).toLocaleString("id-ID");

function waLink(phone: string, outletName: string, ownerName: string) {
  let p = (phone || "").replace(/[^0-9]/g, "");
  if (p.startsWith("0")) p = "62" + p.slice(1);
  if (p.startsWith("8")) p = "62" + p;
  const text = encodeURIComponent(
    `Halo ${ownerName || ""}, kami dari tim Ayo Cuci. Kami lihat ${outletName || "outlet Anda"} sudah aktif bertransaksi 🎉 Mau bantu top up koin biar operasional lancar terus?`,
  );
  return `https://wa.me/${p}?text=${text}`;
}

export default function SalesTargetsPage() {
  const [resp, setResp] = useState<SalesTargetResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [tier, setTier] = useState<SalesTier | "">("");
  const [channel, setChannel] = useState("");
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await salesTargetService.list({
        tier: tier || undefined,
        channel: channel || undefined,
        search: search || undefined,
        onlyActive: true,
      });
      setResp(data);
    } catch {
      toast.error("Gagal memuat target sales");
    } finally {
      setLoading(false);
    }
  }, [tier, channel, search]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const channels = useMemo(() => {
    const s = new Set<string>();
    resp?.data.forEach((d) => d.lead_source && s.add(d.lead_source));
    return Array.from(s).sort();
  }, [resp]);

  const handleStatus = async (t: SalesTarget, status: ContactStatus) => {
    setSavingId(t.outlet_id);
    try {
      await salesTargetService.setContact(t.outlet_id, status);
      setResp((prev) =>
        prev
          ? {
              ...prev,
              data: prev.data.map((d) =>
                d.outlet_id === t.outlet_id ? { ...d, contact_status: status } : d,
              ),
            }
          : prev,
      );
      toast.success("Status diperbarui");
    } catch {
      toast.error("Gagal menyimpan status");
    } finally {
      setSavingId(null);
    }
  };

  const exportCsv = () => {
    if (!resp?.data.length) return;
    const head = [
      "Skor", "Tier", "Outlet", "Owner", "No HP", "Channel", "Kota", "Plan",
      "Sisa Koin", "Total Trx", "Omzet", "Trx 7hr", "Hari sejak trx", "Status", "Alasan",
    ];
    const rows = resp.data.map((d) => [
      d.score, d.tier, d.outlet_name, d.owner_name, d.owner_phone || d.outlet_phone,
      d.lead_source, d.city, d.plan, d.koin, d.total_tx, d.omzet, d.tx_count_7d,
      d.days_since_last_tx ?? "", d.contact_status, d.reasons.join("; "),
    ]);
    const csv = [head, ...rows]
      .map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `target-sales-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const s = resp?.summary;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-orange-50 p-2 text-primary">
            <Target className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-800">Target Sales</h1>
            <p className="text-xs text-slate-500">
              Outlet aktif yang belum top up, diurutkan berdasarkan peluang closing.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={load} className="gap-1.5">
            <RefreshCw className="h-4 w-4" /> Muat ulang
          </Button>
          <Button onClick={exportCsv} disabled={!resp?.data.length} className="gap-1.5">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryTile label="Total target" value={s?.total} icon={<Target className="h-4 w-4" />} tone="slate" />
        <SummaryTile label="🔥 Hot" value={s?.hot} tone="red" />
        <SummaryTile label="🟡 Warm" value={s?.warm} tone="amber" />
        <SummaryTile label="🔵 Cold" value={s?.cold} tone="sky" />
      </div>

      {/* Filters */}
      <Card className="flex flex-wrap items-center gap-2 border border-slate-200 p-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari outlet / owner..."
            className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-primary focus:outline-none"
          />
        </div>
        <select
          value={tier}
          onChange={(e) => setTier(e.target.value as SalesTier | "")}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
        >
          <option value="">Semua tier</option>
          <option value="hot">🔥 Hot</option>
          <option value="warm">🟡 Warm</option>
          <option value="cold">🔵 Cold</option>
        </select>
        <select
          value={channel}
          onChange={(e) => setChannel(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
        >
          <option value="">Semua channel</option>
          {channels.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden border border-slate-200">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" /> Menghitung peluang closing...
          </div>
        ) : !resp?.data.length ? (
          <div className="py-16 text-center text-sm text-slate-400">Tidak ada target sesuai filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2.5 font-semibold">Skor</th>
                  <th className="px-3 py-2.5 font-semibold">Outlet</th>
                  <th className="px-3 py-2.5 font-semibold">Sinyal</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Koin</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Trx</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Omzet</th>
                  <th className="px-3 py-2.5 font-semibold">Status</th>
                  <th className="px-3 py-2.5 font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {resp.data.map((t) => (
                  <tr key={t.outlet_id} className="border-b border-slate-50 hover:bg-slate-50/60">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-black text-slate-800">{t.score}</span>
                        <Badge className={cn("border", TIER_META[t.tier].cls)}>{TIER_META[t.tier].label}</Badge>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-semibold text-slate-800">{t.outlet_name}</div>
                      <div className="text-xs text-slate-500">
                        {t.owner_name} · {t.lead_source || "—"}
                        {t.plan === "PRO" && (
                          <span className="ml-1 rounded bg-orange-100 px-1 text-[10px] font-bold text-primary">PRO</span>
                        )}
                      </div>
                      {t.data_flag && (
                        <div className="mt-1 flex items-center gap-1 text-[11px] text-amber-600">
                          <AlertTriangle className="h-3 w-3" />
                          {t.data_flag === "omzet_janggal" ? "omzet janggal — cek input" : "omzet 0 — cek input"}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex max-w-[260px] flex-wrap gap-1">
                        {t.reasons.map((r, i) => (
                          <span key={i} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
                            {r}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <span className={cn("inline-flex items-center gap-1 font-semibold",
                        t.koin <= 5 ? "text-red-600" : t.koin <= 10 ? "text-amber-600" : "text-slate-600")}>
                        <Coins className="h-3.5 w-3.5" />{t.koin}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right text-slate-700">
                      {t.total_tx}
                      {t.tx_count_7d > 0 && <span className="ml-1 text-[10px] text-green-600">+{t.tx_count_7d}/7hr</span>}
                    </td>
                    <td className="px-3 py-3 text-right font-medium text-slate-700">{rupiah(t.omzet)}</td>
                    <td className="px-3 py-3">
                      <select
                        value={t.contact_status}
                        disabled={savingId === t.outlet_id}
                        onChange={(e) => handleStatus(t, e.target.value as ContactStatus)}
                        className={cn(
                          "rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium focus:border-primary focus:outline-none",
                          STATUS_CLS[t.contact_status],
                        )}
                      >
                        {STATUS_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-3">
                      <a
                        href={waLink(t.owner_phone || t.outlet_phone, t.outlet_name, t.owner_name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg bg-green-500 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-green-600"
                      >
                        <Phone className="h-3.5 w-3.5" /> WA
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <p className="flex items-center gap-1.5 text-[11px] text-slate-400">
        <Flame className="h-3.5 w-3.5" />
        Skor = aktivitas transaksi + urgensi sisa koin + recency + momentum 7 hari + status PRO. Verifikasi sebelum menghubungi.
      </p>
    </div>
  );
}

function SummaryTile({
  label, value, icon, tone,
}: {
  label: string; value?: number; icon?: React.ReactNode; tone: "slate" | "red" | "amber" | "sky";
}) {
  const tones: Record<string, string> = {
    slate: "text-slate-800",
    red: "text-red-600",
    amber: "text-amber-600",
    sky: "text-sky-600",
  };
  return (
    <Card className="border border-slate-200 p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">{label}</span>
        {icon && <span className="text-slate-400">{icon}</span>}
      </div>
      <div className={cn("mt-1 text-2xl font-black", tones[tone])}>
        {value ?? <CheckCircle2 className="h-5 w-5 animate-pulse text-slate-300" />}
      </div>
    </Card>
  );
}
