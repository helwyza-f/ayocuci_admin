"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp, Users, Activity, MapPin,
  Coins, ShieldCheck, UserPlus, BarChart2, Gift,
  ArrowUpRight, ArrowDownRight, Minus,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { analyticsService, RevenueSummary, GrowthSummary, GeoSummary, ActivitySummary, ReferralSummary } from "@/services/analytics.service";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

// ─── PERIOD SELECTOR ───────────────────────────────────────
const PERIODS = [
  { label: "7H", days: 7 },
  { label: "30H", days: 30 },
  { label: "90H", days: 90 },
  { label: "1T", days: 365 },
];

// ─── FORMATTERS ────────────────────────────────────────────
const fmtRp = (v: number) => {
  if (v >= 1_000_000) return `Rp ${(v / 1_000_000).toFixed(1)}jt`;
  if (v >= 1_000) return `Rp ${(v / 1_000).toFixed(0)}rb`;
  return `Rp ${v.toFixed(0)}`;
};

const fmtDate = (dateStr: string) => {
  try { return format(new Date(dateStr), "dd MMM", { locale: localeId }); }
  catch { return dateStr; }
};

// ─── KPI CARD ──────────────────────────────────────────────
function KpiCard({
  label, value, sub, icon: Icon, color, trend,
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string; trend?: "up" | "down" | "flat";
}) {
  const TrendIcon = trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : Minus;
  const trendColor = trend === "up" ? "text-emerald-500" : trend === "down" ? "text-rose-500" : "text-slate-400";
  return (
    <Card className="border border-slate-200 bg-white rounded-2xl p-5 flex flex-col gap-3 shadow-sm">
      <div className="flex items-start justify-between">
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        {trend && <TrendIcon className={`h-4 w-4 ${trendColor}`} />}
      </div>
      <div>
        <p className="text-2xl font-extrabold text-slate-900 tracking-tight">{value}</p>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">{label}</p>
        {sub && <p className="text-[10px] text-slate-500 mt-1">{sub}</p>}
      </div>
    </Card>
  );
}

// ─── SECTION HEADER ────────────────────────────────────────
function SectionHeader({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc?: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="h-8 w-8 rounded-xl bg-slate-900 flex items-center justify-center text-white">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="font-bold text-sm text-slate-900">{title}</p>
        {desc && <p className="text-[10px] text-slate-400 font-medium">{desc}</p>}
      </div>
    </div>
  );
}

// ─── TOOLTIP CUSTOM ────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 text-white text-[11px] rounded-xl p-3 shadow-xl min-w-[140px]">
      <p className="font-bold mb-2 text-slate-300">{fmtDate(label)}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
            {entry.name}
          </span>
          <span className="font-bold">{typeof entry.value === "number" && entry.value > 100 ? fmtRp(entry.value) : entry.value}</span>
        </div>
      ))}
    </div>
  );
};

// ─── MAIN PAGE ─────────────────────────────────────────────
export default function AnalyticsPage() {
  const [days, setDays] = useState(30);

  const { data: revenue } = useSWR<RevenueSummary>(
    `analytics-revenue-${days}`, () => analyticsService.getRevenue(days), { dedupingInterval: 60_000 }
  );
  const { data: growth } = useSWR<GrowthSummary>(
    `analytics-growth-${days}`, () => analyticsService.getGrowth(days), { dedupingInterval: 60_000 }
  );
  const { data: geo } = useSWR<GeoSummary>(
    "analytics-geography", () => analyticsService.getGeography(), { dedupingInterval: 300_000 }
  );
  const { data: activity } = useSWR<ActivitySummary>(
    `analytics-activity-${days}`, () => analyticsService.getActivity(days), { dedupingInterval: 60_000 }
  );
  const { data: referral } = useSWR<ReferralSummary>(
    `analytics-referral-${days}`, () => analyticsService.getReferral(days), { dedupingInterval: 60_000 }
  );

  return (
    <div className="space-y-8">
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2 font-heading">
            <BarChart2 className="h-5 w-5 text-primary" />
            Analytics & Laporan
          </h1>
          <p className="text-xs font-medium text-slate-400 mt-0.5">
            Pantau pertumbuhan dan kesehatan platform secara real-time
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          {PERIODS.map((p) => (
            <button
              key={p.days}
              onClick={() => setDays(p.days)}
              className={`px-4 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                days === p.days
                  ? "bg-white text-primary shadow border border-slate-200"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPI SUMMARY ROW ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard
          label="Total Revenue"
          value={revenue ? fmtRp(revenue.total_revenue) : "—"}
          sub={`Avg ${revenue ? fmtRp(revenue.avg_daily_revenue) : "—"}/hari`}
          icon={TrendingUp} color="bg-emerald-50 text-emerald-600" trend="up"
        />
        <KpiCard
          label="Owner Baru (Periode)"
          value={growth?.total_new_owners ?? "—"}
          sub={`${growth?.total_referral_owners ?? 0} via referral`}
          icon={UserPlus} color="bg-blue-50 text-blue-600" trend="up"
        />
        <KpiCard
          label="Owner Baru 3 Hari"
          value={growth?.recent_new_owners ?? "—"}
          sub="Registrasi terkini"
          icon={Users} color="bg-sky-50 text-sky-600" trend="up"
        />
        <KpiCard
          label="Trial → PRO"
          value={growth ? `${growth.conversion_rate.toFixed(1)}%` : "—"}
          sub={`${growth?.pro_outlets ?? 0} outlet PRO`}
          icon={ShieldCheck} color="bg-violet-50 text-violet-600" trend="up"
        />
        <KpiCard
          label="GMV Hari Ini"
          value={activity ? fmtRp(activity.today_gmv) : "—"}
          sub={`${activity?.total_customers ?? 0} total pelanggan`}
          icon={Coins} color="bg-amber-50 text-amber-600"
        />
      </div>

      {/* ── REVENUE STREAM ── */}
      <Card className="border border-slate-200 rounded-2xl p-6 bg-white shadow-sm">
        <SectionHeader icon={TrendingUp} title="Revenue Stream" desc="Pendapatan harian: topup koin vs aktivasi addon" />
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={revenue?.series ?? []} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="colorTopup" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorAddon" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={(v) => fmtRp(v)} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={70} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: "11px", fontWeight: 600 }} />
            <Area type="monotone" dataKey="topup_revenue" name="Topup Koin" stroke="#f97316" strokeWidth={2} fill="url(#colorTopup)" dot={false} />
            <Area type="monotone" dataKey="addon_revenue" name="Addon" stroke="#6366f1" strokeWidth={2} fill="url(#colorAddon)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>

        {/* Revenue breakdown pills */}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-50">
          {[
            { label: "Topup Koin", value: revenue?.topup_revenue ?? 0, color: "bg-orange-100 text-orange-700" },
            { label: "Addon/Aktivasi", value: revenue?.addon_revenue ?? 0, color: "bg-violet-100 text-violet-700" },
            { label: "Total", value: revenue?.total_revenue ?? 0, color: "bg-emerald-100 text-emerald-700" },
          ].map((item) => (
            <div key={item.label} className={`rounded-xl p-3 text-center ${item.color}`}>
              <p className="text-xs font-bold">{fmtRp(item.value)}</p>
              <p className="text-[9px] font-bold uppercase tracking-widest opacity-70 mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* ── GROWTH + WILAYAH (2 col) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Owner Growth */}
        <Card className="border border-slate-200 rounded-2xl p-6 bg-white shadow-sm">
          <SectionHeader icon={UserPlus} title="Pertumbuhan Owner Baru" desc="Organic vs via referral per hari" />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={growth?.series ?? []} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: "11px", fontWeight: 600 }} />
              <Bar dataKey="organic_owners" name="Organik" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
              <Bar dataKey="referral_owners" name="Referral" stackId="a" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          {/* Conversion badges */}
          <div className="flex gap-2 mt-3 flex-wrap">
            {[
              { label: `${growth?.trial_outlets ?? 0} Trial`, color: "bg-amber-50 text-amber-600 border-amber-100" },
              { label: `${growth?.pro_outlets ?? 0} PRO`, color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
              { label: `${growth?.expired_outlets ?? 0} Expired`, color: "bg-rose-50 text-rose-500 border-rose-100" },
            ].map((b) => (
              <span key={b.label} className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold ${b.color}`}>{b.label}</span>
            ))}
          </div>
        </Card>

        {/* Geographic Breakdown */}
        <Card className="border border-slate-200 rounded-2xl p-6 bg-white shadow-sm">
          <SectionHeader icon={MapPin} title="Distribusi Wilayah" desc={`${geo?.total_outlets ?? 0} outlet, berdasarkan provinsi`} />
          <div className="space-y-2.5 mt-1 max-h-[240px] overflow-y-auto custom-scrollbar pr-1">
            {(geo?.top_provinsi ?? []).map((prov, i) => (
              <div key={prov.name} className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <span className="text-slate-400 font-medium w-4">{i + 1}.</span>
                    {prov.name}
                  </span>
                  <span className="font-bold text-slate-500">{prov.count} <span className="text-slate-300">({prov.percentage}%)</span></span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${prov.percentage}%`,
                      background: `hsl(${220 + i * 15}, 70%, 55%)`,
                    }}
                  />
                </div>
              </div>
            ))}
            {(!geo?.top_provinsi?.length) && (
              <p className="text-center text-[10px] text-slate-400 py-8">Belum ada data wilayah</p>
            )}
          </div>
        </Card>
      </div>

      {/* ── PLATFORM ACTIVITY ── */}
      <Card className="border border-slate-200 rounded-2xl p-6 bg-white shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <SectionHeader icon={Activity} title="Platform Activity" desc="Daily active outlets & volume order laundry" />
          <div className="flex gap-2 text-right">
            <div className="text-right">
              <p className="text-xs font-extrabold text-slate-900">{activity?.total_workforce ?? 0}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Tenaga Kerja</p>
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={activity?.series ?? []} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tickFormatter={fmtDate} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
            <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => fmtRp(v)} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={65} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: "11px", fontWeight: 600 }} />
            <Line yAxisId="left" type="monotone" dataKey="active_outlets" name="Outlet Aktif" stroke="#f97316" strokeWidth={2.5} dot={false} />
            <Line yAxisId="left" type="monotone" dataKey="total_orders" name="Total Order" stroke="#3b82f6" strokeWidth={2} dot={false} strokeDasharray="4 2" />
            <Line yAxisId="right" type="monotone" dataKey="gmv" name="GMV" stroke="#10b981" strokeWidth={2} dot={false} strokeDasharray="8 3" />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* ── REFERRAL ECONOMY ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border border-slate-200 rounded-2xl p-6 bg-white shadow-sm">
          <SectionHeader icon={Gift} title="Referral Economy" desc={`${days} hari terakhir`} />
          <div className="grid grid-cols-2 gap-3 mt-1">
            {[
              { label: "Total Reward Diklaim", value: `${(referral?.total_reward_distributed ?? 0).toLocaleString()} Koin`, color: "bg-amber-50 text-amber-700" },
              { label: "User via Referral", value: `${referral?.total_referral_users ?? 0}`, color: "bg-blue-50 text-blue-700" },
              { label: "Pending Payout", value: `${referral?.pending_payouts ?? 0} req`, color: "bg-rose-50 text-rose-600" },
              { label: "Nilai Payout Pending", value: `${(referral?.pending_payout_amount ?? 0).toLocaleString()} Koin`, color: "bg-violet-50 text-violet-700" },
            ].map((item) => (
              <div key={item.label} className={`rounded-xl p-4 ${item.color}`}>
                <p className="text-base font-extrabold">{item.value}</p>
                <p className="text-[9px] font-bold uppercase tracking-widest opacity-70 mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Referrers */}
        <Card className="border border-slate-200 rounded-2xl p-6 bg-white shadow-sm">
          <SectionHeader icon={Users} title="Top Referrers" desc="Owner dengan rekrutmen terbanyak" />
          <div className="space-y-2.5 max-h-[200px] overflow-y-auto custom-scrollbar mt-1">
            {(referral?.top_referrers ?? []).length === 0 ? (
              <p className="text-center text-[10px] text-slate-400 py-8">Belum ada data referral</p>
            ) : (
              (referral?.top_referrers ?? []).map((r, i) => (
                <div key={r.email} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] font-bold text-slate-300 w-4">{i + 1}</span>
                    <div className="h-7 w-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                      {r.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{r.name}</p>
                      <p className="text-[9px] text-slate-400">{r.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-extrabold text-primary">{r.recruits} rekrut</p>
                    <p className="text-[9px] text-slate-400">{r.total_reward.toLocaleString()} koin</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
