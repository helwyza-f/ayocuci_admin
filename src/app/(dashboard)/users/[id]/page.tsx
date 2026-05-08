"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Mail,
  Calendar,
  Phone,
  Settings2,
  Activity,
  CreditCard,
  Users,
  ArrowUpRight,
  ShieldAlert,
  Zap,
  TrendingUp,
  History,
  BadgeCheck,
  Receipt,
  Smartphone,
  CreditCardIcon,
  Check,
  X,
  Eye,
  ExternalLink,
  Target,
  Trophy,
  Briefcase,
  Layers,
  Store,
  DollarSign,
  UserPlus,
  Globe,
  ShieldCheck,
  ArrowDownRight,
  GitBranch,
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
import StatCard from "@/components/modules/dashboard/stat-card";
import { toast } from "sonner";

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchDetail();
  }, [params.id]);

  const fetchDetail = async () => {
    try {
      const res = await userService.getOwnerDetail(params.id as string);
      if (res.status) {
        setData(res.data);
      }
    } catch (error) {
      toast.error("Gagal memuat detail owner");
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Activity className="h-6 w-6 text-primary animate-spin" />
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Generating comprehensive profile...</p>
      </div>
    );

  if (!data)
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <ShieldAlert className="h-8 w-8 text-rose-500" />
        <p className="text-sm font-bold text-slate-900">Owner Not Found</p>
        <Button variant="ghost" onClick={() => router.back()} size="sm">Go Back</Button>
      </div>
    );

  const { profile, stats, recruits = [], outlets = [], payouts = [], koin_ledger = [], referral_rewards = [] } = data;

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-20">
      {/* MODERN GLASS HEADER */}
      <div className="sticky top-0 z-50 -mx-4 px-4 py-4 bg-slate-50/80 backdrop-blur-md border-b border-slate-200/50 mb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="h-12 w-12 rounded-2xl text-slate-500 border border-slate-200 bg-white hover:bg-slate-50 hover:shadow-md transition-all shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="space-y-1.5">
              <div className="flex items-center gap-4">
                <h1 className="text-3xl font-black tracking-tight text-slate-900 font-heading leading-none">
                  {profile.name}
                </h1>
                <Badge className={cn(
                  "rounded-full px-3 py-1 text-[10px] font-black uppercase shadow-none border",
                  profile.status === 1 ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                )}>
                  {profile.status === 1 ? "Verified Partner" : "Suspended"}
                </Badge>
              </div>
              <div className="flex items-center gap-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                 <span className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-primary" /> {profile.email}</span>
                 <span className="h-1 w-1 rounded-full bg-slate-300" />
                 <span className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5 text-primary" /> Bergabung {format(new Date(profile.created_at), "MMMM yyyy", { locale: localeId })}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <div className="px-5 py-2.5 rounded-2xl border border-orange-100 bg-orange-50/50 flex items-center gap-4 shadow-inner">
                <div className="h-10 w-10 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
                   <Trophy className="h-5 w-5" />
                </div>
                <div>
                   <p className="text-[9px] font-black text-orange-400 uppercase leading-none mb-1 tracking-[0.2em]">Referral Code</p>
                   <p className="text-sm font-black text-orange-700 font-mono tracking-tighter leading-none">{profile.referral_code}</p>
                </div>
             </div>
             <Button className="h-12 px-8 font-black text-[11px] uppercase tracking-[0.2em] gap-3 shadow-xl shadow-slate-900/10 bg-slate-900 hover:bg-black transition-all hover:-translate-y-0.5 active:translate-y-0">
                <Settings2 className="h-4 w-4" /> Kelola Akses
             </Button>
          </div>
        </div>
      </div>

      {/* OPERATIONAL STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-1">
        <StatCard 
          label="Total Spend" 
          value={`Rp ${(stats.total_spend_topup + stats.total_spend_addon).toLocaleString()}`} 
          icon={CreditCard} 
        />
        <StatCard 
          label="Komisi Referral" 
          value={`Rp ${stats.referral_earnings.toLocaleString()}`} 
          icon={DollarSign} 
        />
        <StatCard 
          label="Total Outlet" 
          value={`${outlets.length} Unit`} 
          icon={Store} 
        />
        <StatCard 
          label="Referral Network" 
          value={`${recruits.length} User`} 
          icon={UserPlus} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
        <div className="space-y-8">
          <Tabs defaultValue="portfolio" className="w-full">
            <TabsList className="bg-slate-200/50 p-1.5 rounded-2xl border border-slate-200 mb-8 w-full md:w-fit h-14 shadow-inner">
              <TabsTrigger value="portfolio" className="rounded-xl px-8 font-black text-[11px] uppercase gap-3 h-11 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-lg data-[state=active]:shadow-slate-200/50">
                <Layers className="h-4 w-4" /> Portfolio
              </TabsTrigger>
              <TabsTrigger value="referrals" className="rounded-xl px-8 font-black text-[11px] uppercase gap-3 h-11 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-lg data-[state=active]:shadow-slate-200/50">
                <Target className="h-4 w-4" /> Network
              </TabsTrigger>
              <TabsTrigger value="komisi" className="rounded-xl px-8 font-black text-[11px] uppercase gap-3 h-11 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-lg data-[state=active]:shadow-slate-200/50">
                <GitBranch className="h-4 w-4" /> Komisi Masuk
              </TabsTrigger>
              <TabsTrigger value="ledger" className="rounded-xl px-8 font-black text-[11px] uppercase gap-3 h-11 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-lg data-[state=active]:shadow-slate-200/50">
                <Activity className="h-4 w-4" /> Global Ledger
              </TabsTrigger>
              <TabsTrigger value="financials" className="rounded-xl px-8 font-black text-[11px] uppercase gap-3 h-11 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-lg data-[state=active]:shadow-slate-200/50">
                <Receipt className="h-4 w-4" /> Payouts
              </TabsTrigger>
            </TabsList>

            {/* TAB: PORTFOLIO */}
            <TabsContent value="portfolio" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <Card className="border-none shadow-soft bg-white overflow-hidden p-0">
                  <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                           <Store className="h-5 w-5" />
                        </div>
                        <div>
                           <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Owner Portfolio</p>
                           <p className="text-sm font-bold text-slate-700">Daftar unit laundry yang dikelola partner ini</p>
                        </div>
                     </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/20 border-b border-slate-50">
                          <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Outlet Name</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Liquidity</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Activity</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {outlets.map((outlet: any) => (
                          <tr key={outlet.id} className="hover:bg-slate-50/50 transition-all group">
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 border border-white shadow-inner group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                  <Store className="h-5 w-5" />
                                </div>
                                <div>
                                  <p className="font-black text-slate-900 text-sm uppercase tracking-tight group-hover:text-primary transition-colors">{outlet.name}</p>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Node: {outlet.id}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5 text-center">
                              <p className="text-sm font-bold text-slate-700">{outlet.koin.toLocaleString()}</p>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Koin</p>
                            </td>
                            <td className="px-6 py-5 text-center">
                              <p className="text-sm font-bold text-slate-700">{outlet.total_trx.toLocaleString()}</p>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Orders</p>
                            </td>
                            <td className="px-6 py-5 text-right">
                               <p className="text-base font-black text-primary font-heading">Rp {outlet.total_revenue.toLocaleString()}</p>
                               <Link href={`/tenants/${outlet.id}`}>
                                  <Button variant="ghost" size="sm" className="h-8 px-4 text-[9px] font-black uppercase text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg mt-1">
                                     Control Hub <ArrowUpRight className="h-3.5 w-3.5 ml-1.5" />
                                  </Button>
                               </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
               </Card>
            </TabsContent>

            {/* TAB: REFERRALS */}
            <TabsContent value="referrals" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <Card className="border-none shadow-2xl shadow-orange-500/20 bg-gradient-to-br from-orange-500 to-orange-600 text-white p-8 relative overflow-hidden group rounded-[2.5rem]">
                  <div className="relative z-10 space-y-6">
                     <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md shadow-xl border border-white/20">
                        <DollarSign className="h-8 w-8" />
                     </div>
                     <div>
                        <p className="text-sm font-black uppercase tracking-[0.3em] text-orange-100/70">Available Balance</p>
                        <h2 className="text-5xl font-black font-heading tracking-tighter">Rp {stats.referral_balance.toLocaleString()}</h2>
                     </div>
                     <Button className="w-fit px-10 bg-white text-orange-600 font-black text-xs uppercase h-12 rounded-xl hover:bg-orange-50 shadow-2xl shadow-black/10 transition-all hover:scale-105 active:scale-95">
                        Withdraw Commissions
                     </Button>
                  </div>
                  <div className="absolute -bottom-20 -right-20 h-80 w-80 bg-white/5 rounded-full blur-3xl" />
                  <div className="absolute top-0 right-0 p-8">
                     <Target className="h-40 w-40 text-white/5 -rotate-12" />
                  </div>
               </Card>

               <Card className="border-none shadow-soft bg-white p-0 overflow-hidden">
                  <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                           <UserPlus className="h-5 w-5" />
                        </div>
                        <div>
                           <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Recruitment Network</p>
                           <p className="text-sm font-bold text-slate-700">Afiliasi yang bergabung menggunakan kode partner</p>
                        </div>
                     </div>
                     <ExportExcelButton
                        data={recruits}
                        filename={`network_${profile?.name}`}
                        sheetName="Network"
                        columns={[
                          { header: "Nama", key: "name", width: 25 },
                          { header: "Tanggal", key: "created_at", width: 22, format: (v) => v ? format(new Date(v), "dd/MM/yyyy HH:mm") : "" },
                          { header: "Status", key: "status", width: 12, format: (v) => v === 1 ? "Active" : "Inactive" },
                        ]}
                      />
                  </div>
                  <div className="divide-y divide-slate-50">
                     {recruits.map((recruit: any) => (
                       <div key={recruit.id} className="p-6 flex items-center justify-between group hover:bg-slate-50/50 transition-all">
                          <div className="flex items-center gap-4">
                             <div className="h-12 w-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:scale-110 transition-transform">
                                <User className="h-5 w-5" />
                             </div>
                             <div>
                                <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{recruit.name}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Joined {format(new Date(recruit.created_at), "dd MMMM yyyy", { locale: localeId })}</p>
                             </div>
                          </div>
                          <Badge variant="outline" className={cn(
                            "text-[9px] font-black uppercase px-4 py-1 border shadow-none rounded-full",
                            recruit.status === 1 ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-slate-400 border-slate-100"
                          )}>
                             {recruit.status === 1 ? 'Active Partner' : 'Inactive'}
                          </Badge>
                       </div>
                     ))}
                  </div>
               </Card>
            </TabsContent>

            {/* TAB: KOMISI MASUK */}
            <TabsContent value="komisi" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <Card className="border-none shadow-soft bg-white p-0 overflow-hidden">
                  <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                           <GitBranch className="h-5 w-5" />
                        </div>
                        <div>
                           <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Riwayat Komisi Masuk</p>
                           <p className="text-sm font-bold text-slate-700">Komisi yang diterima dari setiap rekrutmen berhasil</p>
                        </div>
                     </div>
                     <ExportExcelButton
                        data={referral_rewards}
                        filename={`komisi_${profile?.name}`}
                        sheetName="Rewards"
                        columns={[
                          { header: "Referred", key: "referred_nama", width: 25 },
                          { header: "Email", key: "referred_email", width: 30 },
                          { header: "Outlet", key: "rr_referred_outlet", width: 15 },
                          { header: "Tipe", key: "rr_type", width: 12 },
                          { header: "Komisi", key: "rr_reward_amount", width: 15, format: (v) => v != null ? `Rp ${Number(v).toLocaleString()}` : "Rp 0" },
                          { header: "Tanggal", key: "rr_created", width: 22, format: (v) => v ? format(new Date(v), "dd/MM/yyyy HH:mm") : "" },
                        ]}
                      />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/20 border-b border-slate-50">
                          <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Referred (Diajak)</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Outlet</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Tipe</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Komisi</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Tanggal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {referral_rewards.length === 0 ? (
                          <tr><td colSpan={5} className="py-16 text-center">
                            <GitBranch className="h-7 w-7 text-slate-200 mx-auto mb-2" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Belum ada komisi masuk</p>
                          </td></tr>
                        ) : referral_rewards.map((r: any, i: number) => (
                          <tr key={`rr-${r.rr_id || i}`} className="hover:bg-slate-50/50 transition-all group">
                            <td className="px-6 py-5">
                              <p className="text-xs font-black text-slate-900 uppercase tracking-tight group-hover:text-primary transition-colors">{r.referred_nama}</p>
                              <p className="text-[10px] font-bold text-slate-400">{r.referred_email}</p>
                            </td>
                            <td className="px-6 py-5">
                              <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">{r.rr_referred_outlet || "—"}</span>
                            </td>
                            <td className="px-6 py-5 text-center">
                              <span className={cn(
                                "text-[9px] font-black uppercase px-3 py-1 rounded-full",
                                r.rr_type === "recruit" ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                              )}>{r.rr_type}</span>
                            </td>
                            <td className="px-6 py-5 text-right">
                              <p className="text-base font-black text-primary font-heading">Rp {r.rr_reward_amount?.toLocaleString()}</p>
                            </td>
                            <td className="px-6 py-5 text-right">
                              <p className="text-[10px] font-black text-slate-400 uppercase">
                                {r.rr_created ? format(new Date(r.rr_created), "dd MMM yyyy", { locale: localeId }) : "—"}
                              </p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
               </Card>
            </TabsContent>

            {/* TAB: LEDGER */}
            <TabsContent value="ledger" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <Card className="border-none shadow-soft bg-white p-0 overflow-hidden">
                  <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                           <Activity className="h-5 w-5" />
                        </div>
                        <div>
                           <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Global Operational Ledger</p>
                           <p className="text-sm font-bold text-slate-700">Arus kas koin real-time dari seluruh outlet</p>
                        </div>
                     </div>
                     <ExportExcelButton
                        data={koin_ledger}
                        filename={`ledger_${profile?.name}`}
                        sheetName="Ledger"
                        columns={[
                          { header: "Outlet", key: "outlet_nama", width: 25 },
                          { header: "Tipe", key: "hk_jenis_transaksi", width: 12 },
                          { header: "Jumlah", key: "hk_jumlah", width: 12 },
                          { header: "Keterangan", key: "hk_keterangan", width: 40 },
                          { header: "Tanggal", key: "hk_created", width: 22, format: (v) => v ? format(new Date(v), "dd/MM/yyyy HH:mm") : "" },
                        ]}
                      />
                  </div>
                  <div className="divide-y divide-slate-50">
                     {koin_ledger.map((hk: any, i: number) => (
                       <div key={i} className="p-5 flex items-center justify-between hover:bg-slate-50/50 transition-all group">
                          <div className="flex items-center gap-4">
                             <div className={cn(
                               "h-12 w-12 rounded-2xl flex items-center justify-center border shadow-sm transition-all group-hover:rotate-6",
                               hk.hk_jenis_transaksi === 'masuk' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                             )}>
                                {hk.hk_jenis_transaksi === 'masuk' ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                             </div>
                             <div>
                                <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{hk.outlet_nama}</p>
                                <p className="text-[10px] text-slate-400 font-bold tracking-tight line-clamp-1 uppercase opacity-60">{hk.hk_keterangan}</p>
                             </div>
                          </div>
                          <div className="text-right">
                             <p className={cn("text-base font-black font-heading tracking-tight", hk.hk_jenis_transaksi === 'masuk' ? "text-emerald-600" : "text-rose-600")}>
                                {hk.hk_jenis_transaksi === 'masuk' ? '+' : '-'}{hk.hk_jumlah} Koin
                             </p>
                             <p className="text-[9px] font-black text-slate-300 uppercase">{format(new Date(hk.hk_created), "HH:mm • dd MMM yyyy", { locale: localeId })}</p>
                          </div>
                       </div>
                     ))}
                  </div>
               </Card>
            </TabsContent>

            {/* TAB: FINANCIALS (Payouts) */}
            <TabsContent value="financials" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <Card className="border-none shadow-soft bg-white p-0 overflow-hidden">
                  <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                           <Receipt className="h-5 w-5" />
                        </div>
                        <div>
                           <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Withdrawal History</p>
                           <p className="text-sm font-bold text-slate-700">Riwayat pencairan komisi ke rekening partner</p>
                        </div>
                     </div>
                     <ExportExcelButton
                        data={payouts}
                        filename={`payouts_${profile?.name}`}
                        sheetName="Payouts"
                        columns={[
                          { header: "ID", key: "rp_id", width: 22 },
                          { header: "Bank", key: "rp_bank_name", width: 12 },
                          { header: "Account", key: "rp_account_number", width: 18 },
                          { header: "Nama Rek", key: "rp_account_name", width: 25 },
                          { header: "Amount", key: "rp_amount", width: 15, format: (v) => v != null ? `Rp ${Number(v).toLocaleString()}` : "Rp 0" },
                          { header: "Status", key: "rp_status", width: 12 },
                          { header: "Tanggal", key: "rp_created", width: 22, format: (v) => v ? format(new Date(v), "dd/MM/yyyy HH:mm") : "" },
                        ]}
                      />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/20 border-b border-slate-50">
                          <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Transaction</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Amount</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Status</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {payouts.map((rp: any) => (
                          <tr key={rp.rp_id} className="hover:bg-slate-50/50 transition-all group">
                            <td className="px-6 py-5">
                               <p className="text-xs font-black text-slate-900 uppercase tracking-tighter group-hover:text-primary transition-colors">{rp.rp_id}</p>
                               <p className="text-[10px] font-black text-slate-400 uppercase">{rp.rp_bank_name} • {rp.rp_account_number}</p>
                            </td>
                            <td className="px-6 py-5 text-center">
                               <p className="text-sm font-black text-slate-700">Rp {rp.rp_amount?.toLocaleString()}</p>
                            </td>
                            <td className="px-6 py-5 text-center">
                               <Badge className={cn(
                                 "text-[9px] font-black uppercase px-4 py-1 border-none shadow-lg rounded-full",
                                 rp.rp_status === "completed" || rp.rp_status === "done" ? "bg-emerald-500 text-white shadow-emerald-500/20" : 
                                 rp.rp_status === "pending" ? "bg-orange-500 text-white animate-pulse shadow-orange-500/20" : "bg-slate-400 text-white"
                               )}>{rp.rp_status}</Badge>
                            </td>
                            <td className="px-6 py-5 text-right">
                               <p className="text-[10px] font-black text-slate-400 uppercase">{format(new Date(rp.rp_created), "dd MMM yyyy", { locale: localeId })}</p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
               </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* SIDEBAR: ACTIONABLE DATA ONLY */}
        <div className="space-y-8">
          <Card className="border-none shadow-soft bg-white p-0 overflow-hidden sticky top-24">
            <div className="p-6 border-b border-slate-50 bg-slate-50/30">
               <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Account Ecosystem</p>
            </div>
            <div className="p-6 space-y-8">
               <div className="space-y-6">
                  <div className="flex items-start gap-5">
                     <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shrink-0 shadow-inner">
                        <UserPlus className="h-5 w-5" />
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Invited By</p>
                        <p className="text-sm font-black text-slate-800 uppercase leading-none">{profile.inviter_name || "Direct Registration"}</p>
                     </div>
                  </div>
                  <div className="flex items-start gap-5">
                     <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shrink-0 shadow-inner">
                        <Briefcase className="h-5 w-5" />
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Account Status</p>
                        <div className="flex items-center gap-2.5">
                           <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)] animate-pulse" />
                           <p className="text-sm font-black text-slate-800 uppercase font-heading leading-none">Verified Hub</p>
                        </div>
                     </div>
                  </div>
                  <div className="flex items-start gap-5">
                     <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shrink-0 shadow-inner">
                        <Phone className="h-5 w-5" />
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Verified Contact</p>
                        <p className="text-sm font-black text-slate-800 leading-none">{profile.nohp || "No Phone Registered"}</p>
                     </div>
                  </div>
               </div>
               
               <Button className="w-full h-14 text-xs font-black uppercase border-none shadow-xl shadow-orange-500/20 bg-orange-500 hover:bg-orange-600 transition-all hover:scale-[1.02] active:scale-[0.98] text-white rounded-2xl gap-3">
                  <Mail className="h-5 w-5" /> Hubungi Partner
               </Button>

               <Button variant="ghost" className="w-full h-12 text-[10px] font-black uppercase text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-all rounded-xl mt-4">
                  <ShieldAlert className="h-4 w-4 mr-2" /> Revoke Global Access
               </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
