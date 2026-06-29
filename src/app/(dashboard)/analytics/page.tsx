"use client";

import { type ElementType, useMemo, useState } from "react";
import useSWR from "swr";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp, Users, Activity, MapPin,
  Coins, ShieldCheck, UserPlus, BarChart2, Gift,
  ArrowUpRight, ArrowDownRight, Minus, AlertTriangle, Clock,
  FileDown, Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DateRangeFilter, { DateRange } from "@/components/shared/date-range-filter";
import { exportSheetsToExcel, type ExcelSheet } from "@/lib/export-excel";
import {
  analyticsService,
  type AnalyticsQuery,
  type RevenueSummary,
  type GrowthSummary,
  type GeoSummary,
  type ActivitySummary,
  type ReferralSummary,
  type InactiveOwnerSummary,
  type TopupExportRow,
} from "@/services/analytics.service";

const PERIODS = [
  { label: "7H", days: 7 },
  { label: "30H", days: 30 },
  { label: "90H", days: 90 },
  { label: "1T", days: 365 },
];

const SWR_OPTIONS = {
  dedupingInterval: 60_000,
  revalidateOnFocus: false,
};

const fmtRp = (value: number) => {
  if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)}jt`;
  if (value >= 1_000) return `Rp ${(value / 1_000).toFixed(0)}rb`;
  return `Rp ${value.toFixed(0)}`;
};

const fmtCurrency = (value: number) => `Rp ${Number(value || 0).toLocaleString("id-ID")}`;

const fmtDate = (dateStr: string) => {
  try {
    return format(new Date(dateStr), "dd MMM", { locale: localeId });
  } catch {
    return dateStr;
  }
};

const fmtDateTime = (dateStr?: string) => {
  if (!dateStr) return "—";
  try {
    return format(new Date(`${dateStr}T00:00:00`), "dd MMM yyyy", { locale: localeId });
  } catch {
    return dateStr;
  }
};

const normalizeAnalyticsQuery = (days: number, dateRange: DateRange): AnalyticsQuery => {
  const startDate = dateRange.start || dateRange.end;
  const endDate = dateRange.end || dateRange.start;

  if (startDate && endDate) {
    return { startDate, endDate };
  }

  return { days };
};

const buildAnalyticsKey = (query: AnalyticsQuery) =>
  query.startDate && query.endDate
    ? `${query.startDate}_${query.endDate}`
    : `days_${query.days ?? 30}`;

interface TooltipEntry {
  color?: string;
  name?: string;
  value?: number | string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-slate-900 text-white text-[11px] rounded-xl p-3 shadow-xl min-w-[140px]">
      <p className="font-bold mb-2 text-slate-300">{fmtDate(label ?? "")}</p>
      {payload.map((entry, index) => (
        <div key={`${entry.name || "entry"}-${index}`} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
            {entry.name}
          </span>
          <span className="font-bold">
            {typeof entry.value === "number" && entry.value > 100 ? fmtRp(entry.value) : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
  trend,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: ElementType;
  color: string;
  trend?: "up" | "down" | "flat";
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

function SectionHeader({
  icon: Icon,
  title,
  desc,
  action,
}: {
  icon: ElementType;
  title: string;
  desc?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4 gap-3 w-full">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-xl bg-slate-900 flex items-center justify-center text-white shrink-0">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="font-bold text-sm text-slate-900">{title}</p>
          {desc && <p className="text-[10px] text-slate-400 font-medium">{desc}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

function PanelExportButton({ sheets, filename }: { sheets: ExcelSheet<object>[], filename: string }) {
  const [exporting, setExporting] = useState(false);
  const handleExport = async () => {
    setExporting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 100));
      exportSheetsToExcel(sheets, filename);
    } finally {
      setExporting(false);
    }
  };

  if (!sheets || sheets.length === 0 || !sheets[0]?.data?.length) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={exporting}
      className="h-7 px-2.5 gap-1.5 text-[10px] font-bold uppercase tracking-wider border-slate-200 text-slate-600 hover:text-emerald-700 hover:border-emerald-200 hover:bg-emerald-50 transition-colors"
    >
      {exporting ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <FileDown className="h-3 w-3" />
      )}
      Export
    </Button>
  );
}

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const [dateRange, setDateRange] = useState<DateRange>({ start: "", end: "" });
  const [exportingReferralDetails, setExportingReferralDetails] = useState(false);

  const analyticsQuery = useMemo(
    () => normalizeAnalyticsQuery(days, dateRange),
    [dateRange, days],
  );

  const analyticsKey = useMemo(
    () => buildAnalyticsKey(analyticsQuery),
    [analyticsQuery],
  );

  const periodLabel = useMemo(() => {
    if (analyticsQuery.startDate && analyticsQuery.endDate) {
      return `${fmtDateTime(analyticsQuery.startDate)} - ${fmtDateTime(analyticsQuery.endDate)}`;
    }
    return `${days} hari terakhir`;
  }, [analyticsQuery, days]);

  const periodEndLabel = analyticsQuery.endDate
    ? fmtDateTime(analyticsQuery.endDate)
    : fmtDateTime(format(new Date(), "yyyy-MM-dd"));

  const periodStartLabel = analyticsQuery.startDate
    ? fmtDateTime(analyticsQuery.startDate)
    : fmtDateTime(format(new Date(Date.now() - (days - 1) * 86400000), "yyyy-MM-dd"));

  const { data: revenue } = useSWR<RevenueSummary>(
    `analytics-revenue-${analyticsKey}`,
    () => analyticsService.getRevenue(analyticsQuery),
    SWR_OPTIONS,
  );

  const { data: growth } = useSWR<GrowthSummary>(
    `analytics-growth-${analyticsKey}`,
    () => analyticsService.getGrowth(analyticsQuery),
    SWR_OPTIONS,
  );

  const { data: geo } = useSWR<GeoSummary>(
    `analytics-geography-${analyticsKey}`,
    () => analyticsService.getGeography(analyticsQuery),
    { ...SWR_OPTIONS, dedupingInterval: 300_000 },
  );

  const { data: activity } = useSWR<ActivitySummary>(
    `analytics-activity-${analyticsKey}`,
    () => analyticsService.getActivity(analyticsQuery),
    SWR_OPTIONS,
  );

  const { data: referral } = useSWR<ReferralSummary>(
    `analytics-referral-${analyticsKey}`,
    () => analyticsService.getReferral(analyticsQuery),
    SWR_OPTIONS,
  );

  const { data: inactiveOwners } = useSWR<InactiveOwnerSummary>(
    `analytics-inactive-owners-${analyticsKey}`,
    () => analyticsService.getInactiveOwners(analyticsQuery),
    SWR_OPTIONS,
  );

  const { data: referralTopupDetails } = useSWR<TopupExportRow[]>(
    `analytics-referral-topup-details-${analyticsKey}`,
    () => analyticsService.getReferralTopupDetails(analyticsQuery),
    SWR_OPTIONS,
  );

  const referralTopupPercent = referral?.total_topup_revenue
    ? (referral.referral_topup_revenue / referral.total_topup_revenue) * 100
    : 0;
  const nonReferralTopupPercent = referral?.total_topup_revenue
    ? (referral.non_referral_topup_revenue / referral.total_topup_revenue) * 100
    : 0;

  const referralTopupExportSheet = useMemo(() => ({
    sheetName: "Topup Referral Breakdown",
    data: referralTopupDetails?.map((row) => ({
      ...row,
      export_date: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
    })) ?? [],
    columns: [
      { header: "Tanggal Export Data", key: "export_date", width: 20 },
      { header: "Kategori Owner", key: "category", width: 18 },
      { header: "Kode Owner", key: "owner_code", width: 14 },
      { header: "Nama Owner", key: "owner_name", width: 26 },
      { header: "Jumlah Outlet", key: "total_outlets", width: 14 },
      { header: "Tanggal Registrasi", key: "registration_date", width: 18 },
      { header: "Nominal Top Up", key: "total_topup", width: 18, format: (v: unknown) => fmtCurrency(Number(v)) },
      { header: "Rata-rata Nominal Top Up", key: "avg_topup", width: 22, format: (v: unknown) => fmtCurrency(Number(v)) },
      { header: "Nama Owner Referrer", key: "referrer_name", width: 26, format: (v: unknown) => v ? String(v) : "-" },
      { header: "Kode Owner Referrer", key: "referrer_code", width: 18, format: (v: unknown) => v ? String(v) : "-" },
      { header: "Referral Code", key: "referral_code", width: 18, format: (v: unknown) => v ? String(v) : "-" },
    ],
  }), [referralTopupDetails]);

  const exportSheets = useMemo(() => [
    {
      sheetName: "Summary",
      data: [
        {
          period_label: periodLabel,
          start_date: periodStartLabel,
          end_date: periodEndLabel,
          total_revenue: revenue?.total_revenue ?? 0,
          topup_revenue: revenue?.topup_revenue ?? 0,
          addon_revenue: revenue?.addon_revenue ?? 0,
          avg_daily_revenue: revenue?.avg_daily_revenue ?? 0,
          total_new_owners: growth?.total_new_owners ?? 0,
          total_new_outlets: growth?.total_new_outlets ?? 0,
          total_referral_users: referral?.total_referral_users ?? 0,
          total_outlets_geo: geo?.total_outlets ?? 0,
          total_inactive_owners: inactiveOwners?.total ?? 0,
        },
      ],
      columns: [
        { header: "Periode", key: "period_label", width: 28 },
        { header: "Tanggal Mulai", key: "start_date", width: 18 },
        { header: "Tanggal Akhir", key: "end_date", width: 18 },
        { header: "Total Revenue", key: "total_revenue", width: 18, format: (v: unknown) => fmtCurrency(Number(v)) },
        { header: "Revenue Topup", key: "topup_revenue", width: 18, format: (v: unknown) => fmtCurrency(Number(v)) },
        { header: "Revenue Addon", key: "addon_revenue", width: 18, format: (v: unknown) => fmtCurrency(Number(v)) },
        { header: "Avg Revenue Harian", key: "avg_daily_revenue", width: 20, format: (v: unknown) => fmtCurrency(Number(v)) },
        { header: "Owner Baru", key: "total_new_owners", width: 14 },
        { header: "Outlet Baru", key: "total_new_outlets", width: 14 },
        { header: "User Referral", key: "total_referral_users", width: 14 },
        { header: "Outlet Terpetakan", key: "total_outlets_geo", width: 16 },
        { header: "Owner Inaktif", key: "total_inactive_owners", width: 14 },
      ],
    },
    {
      sheetName: "Revenue",
      data: revenue?.series ?? [],
      columns: [
        { header: "Tanggal", key: "date", width: 16, format: (v: unknown) => v ? format(new Date(String(v)), "dd/MM/yyyy") : "" },
        { header: "Topup Revenue", key: "topup_revenue", width: 18, format: (v: unknown) => fmtCurrency(Number(v)) },
        { header: "Addon Revenue", key: "addon_revenue", width: 18, format: (v: unknown) => fmtCurrency(Number(v)) },
        { header: "Total Revenue", key: "total_revenue", width: 18, format: (v: unknown) => fmtCurrency(Number(v)) },
      ],
    },
    {
      sheetName: "Growth",
      data: growth?.series ?? [],
      columns: [
        { header: "Tanggal", key: "date", width: 16, format: (v: unknown) => v ? format(new Date(String(v)), "dd/MM/yyyy") : "" },
        { header: "Owner Baru", key: "new_owners", width: 14 },
        { header: "Owner Organik", key: "organic_owners", width: 16 },
        { header: "Owner Referral", key: "referral_owners", width: 16 },
        { header: "Outlet Baru", key: "new_outlets", width: 14 },
      ],
    },
    {
      sheetName: "Geo Provinsi",
      data: geo?.top_provinsi ?? [],
      columns: [
        { header: "Provinsi", key: "name", width: 24 },
        { header: "Jumlah Outlet", key: "count", width: 14 },
        { header: "Persentase", key: "percentage", width: 14, format: (v: unknown) => `${v}%` },
      ],
    },
    {
      sheetName: "Geo Kota",
      data: geo?.top_kota ?? [],
      columns: [
        { header: "Kota", key: "name", width: 24 },
        { header: "Jumlah Outlet", key: "count", width: 14 },
        { header: "Persentase", key: "percentage", width: 14, format: (v: unknown) => `${v}%` },
      ],
    },
    {
      sheetName: "Activity",
      data: activity?.series ?? [],
      columns: [
        { header: "Tanggal", key: "date", width: 16, format: (v: unknown) => v ? format(new Date(String(v)), "dd/MM/yyyy") : "" },
        { header: "Outlet Aktif", key: "active_outlets", width: 14 },
        { header: "Total Order", key: "total_orders", width: 14 },
        { header: "GMV", key: "gmv", width: 18, format: (v: unknown) => fmtCurrency(Number(v)) },
      ],
    },
    {
      sheetName: "Referral Summary",
      data: [
        {
          total_reward_distributed: referral?.total_reward_distributed ?? 0,
          total_referral_users: referral?.total_referral_users ?? 0,
          pending_payouts: referral?.pending_payouts ?? 0,
          pending_payout_amount: referral?.pending_payout_amount ?? 0,
        },
      ],
      columns: [
        { header: "Total Reward Diklaim", key: "total_reward_distributed", width: 18 },
        { header: "User via Referral", key: "total_referral_users", width: 18 },
        { header: "Pending Payout", key: "pending_payouts", width: 16 },
        { header: "Nilai Payout Pending", key: "pending_payout_amount", width: 20 },
      ],
    },
    {
      sheetName: "Top Referrers",
      data: referral?.top_referrers ?? [],
      columns: [
        { header: "Nama", key: "name", width: 24 },
        { header: "Email", key: "email", width: 28 },
        { header: "Total Rekrut", key: "recruits", width: 14 },
        { header: "Total Reward", key: "total_reward", width: 16 },
      ],
    },
    {
      sheetName: "Inactive Owners",
      data: inactiveOwners?.owners ?? [],
      columns: [
        { header: "ID Owner", key: "id", width: 12 },
        { header: "Nama Owner", key: "name", width: 24 },
        { header: "Email", key: "email", width: 28 },
        { header: "Total Outlet", key: "total_outlets", width: 14 },
        {
          header: "Transaksi Terakhir",
          key: "last_transaction_date",
          width: 18,
          format: (v: unknown) => v ? format(new Date(String(v)), "dd/MM/yyyy") : "Belum Pernah",
        },
      ],
    },
    {
      ...referralTopupExportSheet,
    },
  ], [
    activity,
    geo,
    growth,
    inactiveOwners,
    periodEndLabel,
    periodLabel,
    periodStartLabel,
    referral,
    referralTopupExportSheet,
    revenue,
  ]);

  const handleReferralDetailExport = async () => {
    setExportingReferralDetails(true);
    try {
      const latestRows = await analyticsService.getReferralTopupDetails(analyticsQuery);
      exportSheetsToExcel(
        [
          {
            ...referralTopupExportSheet,
            data: latestRows.map((row) => ({
              ...row,
              export_date: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
            })),
          },
        ],
        "referral_topup_breakdown",
      );
    } finally {
      setExportingReferralDetails(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2 font-heading">
              <BarChart2 className="h-5 w-5 text-primary" />
              Analytics & Laporan
            </h1>
            <p className="text-xs font-medium text-slate-400 mt-0.5">
              Pantau pertumbuhan dan kesehatan platform secara real-time
            </p>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-2">
              Periode aktif: {periodLabel}
            </p>
          </div>

          <div className="flex flex-col items-stretch gap-2">
            <div className="flex flex-wrap items-center justify-end gap-2">
              <div className="flex gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                {PERIODS.map((period) => (
                  <button
                    key={period.days}
                    onClick={() => {
                      setDays(period.days);
                      setDateRange({ start: "", end: "" });
                    }}
                    className={`px-4 py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                      !analyticsQuery.startDate && days === period.days
                        ? "bg-white text-primary shadow border border-slate-200"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {period.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <DateRangeFilter value={dateRange} onChange={setDateRange} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard
          label="Total Pendapatan"
          value={revenue ? fmtRp(revenue.total_revenue) : "—"}
          sub={`Rata-rata ${revenue ? fmtRp(revenue.avg_daily_revenue) : "—"}/hari`}
          icon={TrendingUp}
          color="bg-emerald-50 text-emerald-600"
          trend="up"
        />
        <KpiCard
          label="Owner Baru (Periode)"
          value={growth?.total_new_owners ?? "—"}
          sub={`${growth?.total_referral_owners ?? 0} via referral`}
          icon={UserPlus}
          color="bg-blue-50 text-blue-600"
          trend="up"
        />
        <KpiCard
          label="Owner Baru 3 Hari"
          value={growth?.recent_new_owners ?? "—"}
          sub="Jendela akhir periode"
          icon={Users}
          color="bg-sky-50 text-sky-600"
          trend="up"
        />
        <KpiCard
          label="Trial → PRO"
          value={growth ? `${growth.conversion_rate.toFixed(1)}%` : "—"}
          sub={`${growth?.pro_outlets ?? 0} outlet PRO`}
          icon={ShieldCheck}
          color="bg-violet-50 text-violet-600"
          trend="up"
        />
        <KpiCard
          label="GMV Hari Akhir"
          value={activity ? fmtRp(activity.today_gmv) : "—"}
          sub={`Snapshot ${periodEndLabel}`}
          icon={Coins}
          color="bg-amber-50 text-amber-600"
        />
      </div>

      <Card className="border border-slate-200 rounded-2xl p-6 bg-white shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <SectionHeader
            icon={Coins}
            title="Summary Top Up Referral vs Non Referral"
            desc="Ringkasan pendapatan top up owner referral dan owner non referral pada periode aktif"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleReferralDetailExport}
            disabled={exportingReferralDetails}
            className="h-8 gap-1.5 text-[10px] font-bold uppercase tracking-wider border-slate-200 text-slate-600 hover:text-primary hover:border-primary/20 hover:bg-primary/5 transition-colors"
          >
            {exportingReferralDetails ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <FileDown className="h-3.5 w-3.5" />
            )}
            {exportingReferralDetails ? "Mengekspor..." : "Ekspor Detail"}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl p-4 bg-orange-50 border border-orange-100 flex flex-col gap-1">
            <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">Pendapatan Top Up Referral</p>
            <p className="text-2xl font-extrabold text-orange-700">{fmtCurrency(referral?.referral_topup_revenue ?? 0)}</p>
            <p className="text-xs font-medium text-orange-600/70">
              {referral?.referral_topup_owners ?? 0} owner referral pernah top up
            </p>
          </div>
          <div className="rounded-xl p-4 bg-blue-50 border border-blue-100 flex flex-col gap-1">
            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Pendapatan Top Up Non Referral</p>
            <p className="text-2xl font-extrabold text-blue-700">{fmtCurrency(referral?.non_referral_topup_revenue ?? 0)}</p>
            <p className="text-xs font-medium text-blue-600/70">
              {referral?.non_referral_topup_owners ?? 0} owner non referral pernah top up
            </p>
          </div>
          <div className="rounded-xl p-4 bg-emerald-50 border border-emerald-100 flex flex-col gap-1">
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Total Pendapatan Top Up</p>
            <p className="text-2xl font-extrabold text-emerald-700">{fmtCurrency(referral?.total_topup_revenue ?? 0)}</p>
            <p className="text-xs font-medium text-emerald-600/70">
              Referral {referralTopupPercent.toFixed(1)}% · Non referral {nonReferralTopupPercent.toFixed(1)}%
            </p>
          </div>
        </div>
      </Card>

      <Card className="border border-slate-200 rounded-2xl p-6 bg-white shadow-sm">
          <SectionHeader 
            icon={TrendingUp} 
            title="Arus Pendapatan" 
            desc={`Pendapatan harian pada ${periodLabel.toLowerCase()}`} 
            action={<PanelExportButton sheets={exportSheets.filter(s => s.sheetName === "Revenue")} filename="arus_pendapatan" />}
          />
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border border-slate-200 rounded-2xl p-6 bg-white shadow-sm">
          <SectionHeader 
            icon={UserPlus} 
            title="Pertumbuhan Owner Baru" 
            desc="Organic vs referral per hari" 
            action={<PanelExportButton sheets={exportSheets.filter(s => s.sheetName === "Growth")} filename="growth_report" />}
          />
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

          <div className="flex gap-2 mt-3 flex-wrap">
            {[
              { label: `${growth?.trial_outlets ?? 0} Trial`, color: "bg-amber-50 text-amber-600 border-amber-100" },
              { label: `${growth?.pro_outlets ?? 0} PRO`, color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
              { label: `${growth?.expired_outlets ?? 0} Expired`, color: "bg-rose-50 text-rose-500 border-rose-100" },
            ].map((badge) => (
              <span key={badge.label} className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold ${badge.color}`}>
                {badge.label}
              </span>
            ))}
          </div>
        </Card>

        <Card className="border border-slate-200 rounded-2xl p-6 bg-white shadow-sm">
          <SectionHeader 
            icon={MapPin} 
            title="Distribusi Wilayah" 
            desc={`${geo?.total_outlets ?? 0} outlet pada periode ini`} 
            action={<PanelExportButton sheets={exportSheets.filter(s => s.sheetName === "Geo Provinsi" || s.sheetName === "Geo Kota")} filename="geo_distribution" />}
          />
          <div className="space-y-2.5 mt-1 max-h-[240px] overflow-y-auto custom-scrollbar pr-1">
            {(geo?.top_provinsi ?? []).map((prov, index) => (
              <div key={prov.name} className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <span className="text-slate-400 font-medium w-4">{index + 1}.</span>
                    {prov.name}
                  </span>
                  <span className="font-bold text-slate-500">
                    {prov.count} <span className="text-slate-300">({prov.percentage}%)</span>
                  </span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${prov.percentage}%`,
                      background: `hsl(${220 + index * 15}, 70%, 55%)`,
                    }}
                  />
                </div>
              </div>
            ))}
            {!geo?.top_provinsi?.length && (
              <p className="text-center text-[10px] text-slate-400 py-8">Belum ada data wilayah</p>
            )}
          </div>
        </Card>
      </div>

      <Card className="border border-slate-200 rounded-2xl p-6 bg-white shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4 gap-4 w-full">
          <SectionHeader 
            icon={Activity} 
            title="Aktivitas Platform" 
            desc="Outlet aktif, volume order, dan GMV per hari" 
            action={<PanelExportButton sheets={exportSheets.filter(s => s.sheetName === "Activity")} filename="aktivitas_platform" />}
          />
          <div className="text-right shrink-0 mt-2 md:mt-0">
            <p className="text-xs font-extrabold text-slate-900">{activity?.total_workforce ?? 0}</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Tenaga Kerja</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border border-slate-200 rounded-2xl p-6 bg-white shadow-sm">
          <SectionHeader 
            icon={Gift} 
            title="Ekonomi Referral" 
            desc={periodLabel} 
            action={<PanelExportButton sheets={exportSheets.filter(s => s.sheetName === "Referral Summary" || s.sheetName === "Top Referrers")} filename="ekonomi_referral" />}
          />
          <div className="grid grid-cols-2 gap-3 mt-1">
            {[
              { label: "Total Komisi Topup", value: fmtCurrency(referral?.total_reward_distributed ?? 0), color: "bg-amber-50 text-amber-700" },
              { label: "Owner via Referral", value: `${referral?.total_referral_users ?? 0}`, color: "bg-blue-50 text-blue-700" },
              { label: "Pending Payout", value: `${referral?.pending_payouts ?? 0} req`, color: "bg-rose-50 text-rose-600" },
              { label: "Nilai Payout Pending", value: fmtCurrency(referral?.pending_payout_amount ?? 0), color: "bg-violet-50 text-violet-700" },
            ].map((item) => (
              <div key={item.label} className={`rounded-xl p-4 ${item.color}`}>
                <p className="text-base font-extrabold">{item.value}</p>
                <p className="text-[9px] font-bold uppercase tracking-widest opacity-70 mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="border border-slate-200 rounded-2xl p-6 bg-white shadow-sm">
          <SectionHeader icon={Users} title="Referrer Teratas" desc="Owner dengan rekrutmen terbanyak pada periode aktif" />
          <div className="space-y-2.5 max-h-[200px] overflow-y-auto custom-scrollbar mt-1">
            {(referral?.top_referrers ?? []).length === 0 ? (
              <p className="text-center text-[10px] text-slate-400 py-8">Belum ada data referral</p>
            ) : (
              (referral?.top_referrers ?? []).map((referrer, index) => (
                <div key={referrer.email} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] font-bold text-slate-300 w-4">{index + 1}</span>
                    <div className="h-7 w-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                      {referrer.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{referrer.name}</p>
                      <p className="text-[9px] text-slate-400">{referrer.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-extrabold text-primary">{referrer.recruits} rekrut</p>
                    <p className="text-[9px] text-slate-400">{referrer.total_reward.toLocaleString()} koin</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <Card className="border border-slate-200 rounded-2xl p-6 bg-white shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4 gap-4 w-full">
          <SectionHeader 
            icon={AlertTriangle} 
            title="Risiko Churn: Owner Inaktif" 
            desc="Owner tanpa transaksi sepanjang rentang terpilih" 
            action={<PanelExportButton sheets={exportSheets.filter(s => s.sheetName === "Inactive Owners")} filename="risiko_churn" />}
          />
          <div className="text-right shrink-0 mt-2 md:mt-0">
            <span className="text-xs font-extrabold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100">
              {inactiveOwners?.total ?? 0} Owner Inaktif
            </span>
          </div>
        </div>
        <div className="space-y-2.5 max-h-[300px] overflow-y-auto custom-scrollbar mt-1 pr-2">
          {(inactiveOwners?.owners ?? []).length === 0 ? (
            <div className="text-center py-10">
              <ShieldCheck className="h-8 w-8 text-emerald-300 mx-auto mb-2" />
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Semua owner aktif bertransaksi!</p>
            </div>
          ) : (
            (inactiveOwners?.owners ?? []).map((owner, index) => (
              <div key={owner.id} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors px-2 rounded-xl group">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-slate-300 w-4">{index + 1}</span>
                  <div className="h-8 w-8 rounded-full bg-rose-50 text-rose-500 text-xs font-bold flex items-center justify-center border border-rose-100 group-hover:scale-110 transition-transform">
                    {owner.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 group-hover:text-rose-600 transition-colors">{owner.name}</p>
                    <p className="text-[10px] font-medium text-slate-500">{owner.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-right">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Total Outlets</p>
                    <p className="text-xs font-bold text-slate-700">{owner.total_outlets}</p>
                  </div>
                  <div className="w-[120px]">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Last TX</p>
                    <p className="text-xs font-bold text-rose-500 flex items-center justify-end gap-1">
                      <Clock className="h-3 w-3" />
                      {owner.last_transaction_date ? fmtDate(owner.last_transaction_date) : "Belum Pernah"}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
