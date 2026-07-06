"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Activity,
  Users,
  ArrowUpRight,
  ShieldAlert,
  Receipt,
  Store,
  GitBranch,
  Layers,
  Target,
  ArrowDownRight,
  ExternalLink,
  MessageCircle,
} from "lucide-react";
import { userService } from "@/services/user.service";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ExportExcelButton } from "@/components/shared/export-excel-button";
import { toast } from "sonner";
import PermissionGate from "@/components/shared/permission-gate";

// ── Compact KPI ────────────────────────────────────────────────────────────────
function Kpi({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex-1 p-4 bg-white border border-slate-200 rounded-lg">
      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">{label}</p>
      <p className="text-lg font-extrabold text-slate-900 tracking-tight">{value}</p>
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────────
function Empty({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="py-16 text-center">
      <Icon className="h-7 w-7 text-slate-200 mx-auto mb-2" />
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{text}</p>
    </div>
  );
}

// ── Section header ─────────────────────────────────────────────────────────────
function SectionHeader({ label, action }: { label: string; action?: React.ReactNode }) {
  return (
    <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
      {action}
    </div>
  );
}

interface OwnerProfileDetail {
  name: string;
  email: string;
  nohp?: string;
  status: number;
  created_at: string;
  referral_code?: string;
  lead_source?: string;
  inviter_name?: string;
}

interface OwnerStatsDetail {
  total_spend_topup: number;
  total_spend_addon: number;
  referral_earnings: number;
  referral_balance: number;
}

interface OwnerOutletDetailRow {
  id: string;
  name: string;
  koin: number;
  total_trx: number;
  total_revenue: number;
}

interface OwnerRecruitDetailRow {
  id: string;
  name: string;
  created_at?: string;
  status: number;
}

interface OwnerRewardDetailRow {
  rr_id: string | number;
  referred_nama: string;
  referred_email: string;
  rr_referred_outlet: string | null;
  rr_type: string;
  rr_reward_amount: number;
  rr_created: string;
}

interface OwnerLedgerDetailRow {
  hk_id: string | number;
  outlet_nama: string;
  hk_jenis_transaksi: string;
  hk_jumlah: number;
  hk_keterangan: string;
  hk_created: string;
}

interface OwnerPayoutDetailRow {
  rp_id: string;
  rp_amount: number;
  rp_status: string;
  rp_bank_name: string;
  rp_account_number: string;
  rp_account_name: string;
  rp_created: string;
}

interface OwnerDetailData {
  profile: OwnerProfileDetail;
  stats: OwnerStatsDetail;
  recruits: OwnerRecruitDetailRow[];
  outlets: OwnerOutletDetailRow[];
  payouts: OwnerPayoutDetailRow[];
  koin_ledger: OwnerLedgerDetailRow[];
  referral_rewards: OwnerRewardDetailRow[];
}

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<OwnerDetailData | null>(null);

  const fetchDetail = useCallback(async () => {
    try {
      const res = await userService.getOwnerDetail(params.id as string);
      if (res.status) setData(res.data as OwnerDetailData);
    } catch {
      toast.error("Gagal memuat detail owner");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[400px] gap-3">
        <Activity className="h-5 w-5 text-primary animate-spin" />
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Memuat...</p>
      </div>
    );

  if (!data)
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <ShieldAlert className="h-8 w-8 text-rose-500" />
        <p className="text-sm font-bold text-slate-900">Owner tidak ditemukan</p>
        <Button variant="ghost" onClick={() => router.back()} size="sm">Kembali</Button>
      </div>
    );

  const { profile, stats, recruits = [], outlets = [], payouts = [], koin_ledger = [], referral_rewards = [] } = data;
  const waHref = profile.nohp ? `https://wa.me/62${String(profile.nohp).replace(/^0/, "")}` : null;

  return (
    <PermissionGate module="users" action="read">
      <div className="space-y-5 pb-16">

      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost" size="icon"
          onClick={() => router.back()}
          className="h-8 w-8 rounded text-slate-500 border border-slate-200 bg-white shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-extrabold tracking-tight text-slate-900 truncate">{profile.name}</h1>
            <Badge className={cn(
              "rounded px-2 py-0.5 text-[9px] font-bold uppercase shadow-none border shrink-0",
              profile.status === 1
                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                : "bg-rose-50 text-rose-600 border-rose-100"
            )}>
              {profile.status === 1 ? "Aktif" : "Suspended"}
            </Badge>
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-[10px] font-medium text-slate-400">
            <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{profile.email}</span>
            <span>·</span>
            <span>Bergabung {format(new Date(profile.created_at), "MMM yyyy", { locale: localeId })}</span>
            <span>·</span>
            <span className="font-mono text-slate-500">#{params.id}</span>
          </div>
        </div>
        <PermissionGate module="users" action="update">
          <Link href={`/users/${params.id}/edit`}>
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded text-[10px] font-bold uppercase tracking-widest border-slate-200 bg-white text-slate-600 hover:text-primary hover:bg-primary/5"
            >
              Atur Profil
            </Button>
          </Link>
        </PermissionGate>
        {profile.referral_code && (
          <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-100 rounded-lg">
            <p className="text-[9px] font-bold uppercase text-orange-400 tracking-widest">Kode Referral</p>
            <p className="text-sm font-black text-orange-700 font-mono">{profile.referral_code}</p>
          </div>
        )}
      </div>

      {/* ── KPI ROW ───────────────────────────────────────────────────────── */}
      <div className="flex gap-3 flex-wrap">
        <Kpi label="Total Spend" value={`Rp ${(stats.total_spend_topup + stats.total_spend_addon).toLocaleString()}`} />
        <Kpi label="Komisi Referral" value={`Rp ${stats.referral_earnings.toLocaleString()}`} />
        <Kpi label="Saldo Referral" value={`Rp ${stats.referral_balance.toLocaleString()}`} />
        <Kpi label="Total Outlet" value={`${outlets.length} Unit`} />
        <Kpi label="Network" value={`${recruits.length} User`} />
      </div>

      {/* ── MAIN GRID ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">

        {/* LEFT: Tabs */}
        <div>
          <Tabs defaultValue="portfolio" className="w-full">
            <TabsList className="mb-4 flex h-auto w-full flex-nowrap gap-0.5 overflow-x-auto rounded-lg border border-slate-200 bg-white p-0.5 shadow-none">
              {[
                { value: "portfolio", icon: Layers, label: "Portfolio" },
                { value: "referrals", icon: Target, label: "Network" },
                { value: "komisi", icon: GitBranch, label: "Komisi" },
                { value: "ledger", icon: Activity, label: "Ledger" },
                { value: "payouts", icon: Receipt, label: "Payouts" },
              ].map(({ value, icon: Icon, label }) => (
                <TabsTrigger
                  key={value} value={value}
                  className="h-8 shrink-0 rounded px-4 font-bold text-[10px] uppercase gap-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
                >
                  <Icon className="h-3 w-3" />{label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* TAB: PORTFOLIO */}
            <TabsContent value="portfolio">
              <Card className="border border-slate-200 shadow-none bg-white overflow-hidden p-0 rounded-lg">
                <SectionHeader
                  label={`Owner Portfolio — ${outlets.length} Outlet`}
                />
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider">Outlet</th>
                        <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider text-center">Koin</th>
                        <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider text-center">Orders</th>
                        <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider text-right">Revenue</th>
                        <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {outlets.length === 0 ? (
                        <tr><td colSpan={5}><Empty icon={Store} text="Belum ada outlet terdaftar" /></td></tr>
                      ) : outlets.map((outlet) => (
                        <tr key={outlet.id} className="hover:bg-slate-50/30 transition-colors">
                          <td className="px-5 py-3">
                            <Link href={`/tenants/${outlet.id}`} className="font-bold text-slate-900 text-xs hover:text-primary hover:underline transition-colors">
                              {outlet.name}
                            </Link>
                            <p className="text-[9px] font-mono text-slate-400 mt-0.5">#{outlet.id}</p>
                          </td>
                          <td className="px-5 py-3 text-center font-bold text-slate-700 text-xs tabular-nums">
                            {outlet.koin.toLocaleString()}
                          </td>
                          <td className="px-5 py-3 text-center font-bold text-slate-700 text-xs tabular-nums">
                            {outlet.total_trx.toLocaleString()}
                          </td>
                          <td className="px-5 py-3 text-right font-bold text-primary text-xs tabular-nums">
                            Rp {outlet.total_revenue.toLocaleString()}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <Link href={`/tenants/${outlet.id}`}>
                              <Button variant="ghost" size="sm" className="h-7 px-2 text-[9px] font-bold uppercase text-primary hover:bg-primary/5 gap-1">
                                Detail <ExternalLink className="h-3 w-3" />
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="space-y-3 p-4 md:hidden">
                  {outlets.length === 0 ? (
                    <Empty icon={Store} text="Belum ada outlet terdaftar" />
                  ) : outlets.map((outlet) => (
                    <div key={outlet.id} className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                      <div className="space-y-3">
                        <div>
                          <Link href={`/tenants/${outlet.id}`} className="text-sm font-bold text-slate-900 hover:text-primary hover:underline">
                            {outlet.name}
                          </Link>
                          <p className="mt-1 text-[10px] font-mono text-slate-400">#{outlet.id}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded-lg border border-slate-100 bg-white p-3">
                            <p className="text-[9px] font-bold uppercase text-slate-400">Koin</p>
                            <p className="mt-1 text-sm font-black text-slate-900">{outlet.koin.toLocaleString()}</p>
                          </div>
                          <div className="rounded-lg border border-slate-100 bg-white p-3">
                            <p className="text-[9px] font-bold uppercase text-slate-400">Orders</p>
                            <p className="mt-1 text-sm font-black text-slate-900">{outlet.total_trx.toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="rounded-lg border border-slate-100 bg-white p-3">
                          <p className="text-[9px] font-bold uppercase text-slate-400">Revenue</p>
                          <p className="mt-1 text-sm font-black text-primary">Rp {outlet.total_revenue.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            {/* TAB: NETWORK */}
            <TabsContent value="referrals">
              <Card className="border border-slate-200 shadow-none bg-white overflow-hidden p-0 rounded-lg">
                <SectionHeader
                  label={`Recruitment Network — ${recruits.length} User`}
                  action={
                    <ExportExcelButton
                      data={recruits} filename={`network_${profile?.name}`} sheetName="Network"
                      columns={[
                        { header: "Nama", key: "name", width: 25 },
                        { header: "Tanggal", key: "created_at", width: 22, format: (v) => v ? format(new Date(v), "dd/MM/yyyy HH:mm") : "" },
                        { header: "Status", key: "status", width: 12, format: (v) => v === 1 ? "Active" : "Inactive" },
                      ]}
                    />
                  }
                />
                <div className="hidden md:block">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider">Nama</th>
                      <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider">Tanggal Bergabung</th>
                      <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recruits.length === 0 ? (
                      <tr><td colSpan={3}><Empty icon={Users} text="Belum ada rekrutan" /></td></tr>
                    ) : recruits.map((recruit) => (
                      <tr key={recruit.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-5 py-3">
                          <p className="font-bold text-slate-900 text-xs">{recruit.name}</p>
                          <p className="text-[9px] font-mono text-slate-400">#{recruit.id}</p>
                        </td>
                        <td className="px-5 py-3 text-[10px] font-medium text-slate-500 tabular-nums">
                          {recruit.created_at ? format(new Date(recruit.created_at), "dd MMM yyyy", { locale: localeId }) : "—"}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <Badge variant="outline" className={cn(
                            "text-[9px] font-bold uppercase px-2 py-0.5 rounded shadow-none",
                            recruit.status === 1 ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-slate-400 border-slate-200"
                          )}>
                            {recruit.status === 1 ? "Aktif" : "Inaktif"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
                <div className="space-y-3 p-4 md:hidden">
                  {recruits.length === 0 ? (
                    <Empty icon={Users} text="Belum ada rekrutan" />
                  ) : recruits.map((recruit) => (
                    <div key={recruit.id} className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                      <p className="text-sm font-bold text-slate-900">{recruit.name}</p>
                      <p className="mt-1 text-[10px] font-mono text-slate-400">#{recruit.id}</p>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <p className="text-[11px] font-medium text-slate-500">
                          {recruit.created_at ? format(new Date(recruit.created_at), "dd MMM yyyy", { locale: localeId }) : "—"}
                        </p>
                        <Badge variant="outline" className={cn(
                          "text-[9px] font-bold uppercase px-2 py-0.5 rounded shadow-none",
                          recruit.status === 1 ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-slate-400 border-slate-200"
                        )}>
                          {recruit.status === 1 ? "Aktif" : "Inaktif"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            {/* TAB: KOMISI */}
            <TabsContent value="komisi">
              <Card className="border border-slate-200 shadow-none bg-white overflow-hidden p-0 rounded-lg">
                <SectionHeader
                  label="Riwayat Komisi Masuk"
                  action={
                    <ExportExcelButton
                      data={referral_rewards} filename={`komisi_${profile?.name}`} sheetName="Rewards"
                      columns={[
                        { header: "Referred", key: "referred_nama", width: 25 },
                        { header: "Email", key: "referred_email", width: 30 },
                        { header: "Outlet", key: "rr_referred_outlet", width: 15 },
                        { header: "Tipe", key: "rr_type", width: 12 },
                        { header: "Komisi", key: "rr_reward_amount", width: 15, format: (v) => v != null ? `Rp ${Number(v).toLocaleString()}` : "Rp 0" },
                        { header: "Tanggal", key: "rr_created", width: 22, format: (v) => v ? format(new Date(v), "dd/MM/yyyy HH:mm") : "" },
                      ]}
                    />
                  }
                />
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider">Referred</th>
                        <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider">Outlet</th>
                        <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider text-center">Tipe</th>
                        <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider text-right">Komisi</th>
                        <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider text-right">Tanggal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {referral_rewards.length === 0 ? (
                        <tr><td colSpan={5}><Empty icon={GitBranch} text="Belum ada komisi masuk" /></td></tr>
                      ) : referral_rewards.map((r, i: number) => (
                        <tr key={`rr-${r.rr_id || i}`} className="hover:bg-slate-50/30 transition-colors">
                          <td className="px-5 py-3">
                            <p className="font-bold text-slate-900 text-xs">{r.referred_nama}</p>
                            <p className="text-[9px] text-slate-400">{r.referred_email}</p>
                          </td>
                          <td className="px-5 py-3">
                            <span className="text-[9px] font-mono font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                              {r.rr_referred_outlet || "—"}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-center">
                            <span className={cn(
                              "text-[9px] font-bold uppercase px-2 py-0.5 rounded",
                              r.rr_type === "recruit" ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                            )}>{r.rr_type}</span>
                          </td>
                          <td className="px-5 py-3 text-right font-bold text-primary text-xs tabular-nums">
                            Rp {r.rr_reward_amount?.toLocaleString()}
                          </td>
                          <td className="px-5 py-3 text-right text-[10px] font-medium text-slate-400 tabular-nums">
                            {r.rr_created ? format(new Date(r.rr_created), "dd MMM yyyy", { locale: localeId }) : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="space-y-3 p-4 md:hidden">
                  {referral_rewards.length === 0 ? (
                    <Empty icon={GitBranch} text="Belum ada komisi masuk" />
                  ) : referral_rewards.map((r, i: number) => (
                    <div key={`rr-mobile-${r.rr_id || i}`} className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-900">{r.referred_nama}</p>
                        <p className="text-[11px] text-slate-500 break-all">{r.referred_email}</p>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[9px] font-mono font-bold text-slate-600">
                          {r.rr_referred_outlet || "—"}
                        </span>
                        <span className={cn(
                          "rounded px-2 py-0.5 text-[9px] font-bold uppercase",
                          r.rr_type === "recruit" ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                        )}>{r.rr_type}</span>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <p className="text-sm font-black text-primary">Rp {r.rr_reward_amount?.toLocaleString()}</p>
                        <p className="text-[10px] font-medium text-slate-400">
                          {r.rr_created ? format(new Date(r.rr_created), "dd MMM yyyy", { locale: localeId }) : "—"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            {/* TAB: LEDGER */}
            <TabsContent value="ledger">
              <Card className="border border-slate-200 shadow-none bg-white overflow-hidden p-0 rounded-lg">
                <SectionHeader
                  label="Global Ledger Koin"
                  action={
                    <ExportExcelButton
                      data={koin_ledger} filename={`ledger_${profile?.name}`} sheetName="Ledger"
                      columns={[
                        { header: "Outlet", key: "outlet_nama", width: 25 },
                        { header: "Tipe", key: "hk_jenis_transaksi", width: 12 },
                        { header: "Jumlah", key: "hk_jumlah", width: 12 },
                        { header: "Keterangan", key: "hk_keterangan", width: 40 },
                        { header: "Tanggal", key: "hk_created", width: 22, format: (v) => v ? format(new Date(v), "dd/MM/yyyy HH:mm") : "" },
                      ]}
                    />
                  }
                />
                <div className="hidden md:block">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider">Outlet & Keterangan</th>
                      <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider text-right">Jumlah</th>
                      <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider text-right">Waktu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {koin_ledger.length === 0 ? (
                      <tr><td colSpan={3}><Empty icon={Activity} text="Tidak ada aktivitas koin" /></td></tr>
                      ) : koin_ledger.map((hk, i: number) => (
                      <tr key={i} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-5 py-3">
                          <p className="font-bold text-slate-900 text-xs">{hk.outlet_nama}</p>
                          <p className="text-[9px] text-slate-400 line-clamp-1">{hk.hk_keterangan}</p>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span className={cn(
                            "text-xs font-bold tabular-nums flex items-center justify-end gap-1",
                            hk.hk_jenis_transaksi === "masuk" ? "text-emerald-600" : "text-rose-600"
                          )}>
                            {hk.hk_jenis_transaksi === "masuk"
                              ? <ArrowUpRight className="h-3 w-3" />
                              : <ArrowDownRight className="h-3 w-3" />
                            }
                            {hk.hk_jenis_transaksi === "masuk" ? "+" : "-"}{hk.hk_jumlah} Koin
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right text-[9px] font-medium text-slate-400 tabular-nums">
                          {format(new Date(hk.hk_created), "dd MMM yy, HH:mm", { locale: localeId })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
                <div className="space-y-3 p-4 md:hidden">
                  {koin_ledger.length === 0 ? (
                    <Empty icon={Activity} text="Tidak ada aktivitas koin" />
                  ) : koin_ledger.map((hk, i: number) => (
                    <div key={`ledger-mobile-${i}`} className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                      <p className="text-sm font-bold text-slate-900">{hk.outlet_nama}</p>
                      <p className="mt-1 text-[11px] text-slate-500">{hk.hk_keterangan}</p>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <span className={cn(
                          "flex items-center gap-1 text-sm font-bold tabular-nums",
                          hk.hk_jenis_transaksi === "masuk" ? "text-emerald-600" : "text-rose-600"
                        )}>
                          {hk.hk_jenis_transaksi === "masuk" ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                          {hk.hk_jenis_transaksi === "masuk" ? "+" : "-"}{hk.hk_jumlah} Koin
                        </span>
                        <p className="text-[10px] font-medium text-slate-400">
                          {format(new Date(hk.hk_created), "dd MMM yy, HH:mm", { locale: localeId })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            {/* TAB: PAYOUTS */}
            <TabsContent value="payouts">
              <Card className="border border-slate-200 shadow-none bg-white overflow-hidden p-0 rounded-lg">
                <SectionHeader
                  label="Riwayat Pencairan Komisi"
                  action={
                    <ExportExcelButton
                      data={payouts} filename={`payouts_${profile?.name}`} sheetName="Payouts"
                      columns={[
                        { header: "ID", key: "rp_id", width: 22 },
                        { header: "Bank", key: "rp_bank_name", width: 12 },
                        { header: "No. Rek", key: "rp_account_number", width: 18 },
                        { header: "Nama Rek", key: "rp_account_name", width: 25 },
                        { header: "Amount", key: "rp_amount", width: 15, format: (v) => v != null ? `Rp ${Number(v).toLocaleString()}` : "Rp 0" },
                        { header: "Status", key: "rp_status", width: 12 },
                        { header: "Tanggal", key: "rp_created", width: 22, format: (v) => v ? format(new Date(v), "dd/MM/yyyy HH:mm") : "" },
                      ]}
                    />
                  }
                />
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                        <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider">Transaksi</th>
                        <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider text-center">Amount</th>
                        <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider text-center">Status</th>
                        <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider text-right">Tanggal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {payouts.length === 0 ? (
                        <tr><td colSpan={4}><Empty icon={Receipt} text="Belum ada pencairan" /></td></tr>
                      ) : payouts.map((rp) => (
                        <tr key={rp.rp_id} className="hover:bg-slate-50/30 transition-colors">
                          <td className="px-5 py-3">
                            <p className="font-bold text-slate-900 text-xs">{rp.rp_id}</p>
                            <p className="text-[9px] text-slate-400">{rp.rp_bank_name} · {rp.rp_account_number}</p>
                          </td>
                          <td className="px-5 py-3 text-center font-bold text-slate-800 text-xs tabular-nums">
                            Rp {rp.rp_amount?.toLocaleString()}
                          </td>
                          <td className="px-5 py-3 text-center">
                            <Badge variant="outline" className={cn(
                              "text-[9px] font-bold uppercase px-2 py-0.5 rounded shadow-none border",
                              rp.rp_status === "completed" || rp.rp_status === "done"
                                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                : rp.rp_status === "pending"
                                ? "bg-orange-50 text-orange-600 border-orange-100"
                                : "bg-slate-50 text-slate-400 border-slate-200"
                            )}>
                              {rp.rp_status}
                            </Badge>
                          </td>
                          <td className="px-5 py-3 text-right text-[10px] font-medium text-slate-400 tabular-nums">
                            {format(new Date(rp.rp_created), "dd MMM yyyy", { locale: localeId })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="space-y-3 p-4 md:hidden">
                  {payouts.length === 0 ? (
                    <Empty icon={Receipt} text="Belum ada pencairan" />
                  ) : payouts.map((rp) => (
                    <div key={rp.rp_id} className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                      <p className="text-sm font-bold text-slate-900">{rp.rp_id}</p>
                      <p className="mt-1 text-[11px] text-slate-500">{rp.rp_bank_name} · {rp.rp_account_number}</p>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <p className="text-sm font-black text-slate-800">Rp {rp.rp_amount?.toLocaleString()}</p>
                        <Badge variant="outline" className={cn(
                          "text-[9px] font-bold uppercase px-2 py-0.5 rounded shadow-none border",
                          rp.rp_status === "completed" || rp.rp_status === "done"
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                            : rp.rp_status === "pending"
                            ? "bg-orange-50 text-orange-600 border-orange-100"
                            : "bg-slate-50 text-slate-400 border-slate-200"
                        )}>
                          {rp.rp_status}
                        </Badge>
                      </div>
                      <p className="mt-2 text-[10px] font-medium text-slate-400">
                        {format(new Date(rp.rp_created), "dd MMM yyyy", { locale: localeId })}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* SIDEBAR */}
        <div className="space-y-4">
          <Card className="border border-slate-200 shadow-none bg-white overflow-hidden rounded-lg p-0">
            <SectionHeader label="Info Akun" />
            <table className="w-full text-left border-collapse">
              <tbody className="divide-y divide-slate-100">
                {[
                  { label: "ID Owner", value: `#${params.id}`, mono: true },
                  { label: "Status", value: profile.status === 1 ? "Aktif" : "Suspended" },
                  { label: "Diajak oleh", value: profile.inviter_name || "Registrasi Mandiri" },
                  { label: "Sumber Informasi", value: profile.lead_source || "—" },
                  { label: "Telepon", value: profile.nohp || "—" },
                  { label: "Bergabung", value: format(new Date(profile.created_at), "dd MMM yyyy", { locale: localeId }) },
                ].map(({ label, value, mono }) => (
                  <tr key={label}>
                    <td className="px-4 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider w-28">{label}</td>
                    <td className={cn("px-4 py-3 text-xs font-bold text-slate-900", mono && "font-mono text-slate-600")}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {waHref && (
              <div className="p-4 border-t border-slate-100">
                <a href={waHref} target="_blank" rel="noreferrer">
                  <Button className="w-full h-9 text-[10px] font-bold uppercase gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded shadow-none">
                    <MessageCircle className="h-3.5 w-3.5" />
                    WhatsApp Owner
                  </Button>
                </a>
              </div>
            )}
          </Card>
        </div>
      </div>
      </div>
    </PermissionGate>
  );
}
