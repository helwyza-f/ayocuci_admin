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
  ArrowDownRight
} from "lucide-react";
import { userService } from "@/services/user.service";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { cn } from "@/lib/utils";
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

  const { profile, stats, recruits = [], outlets = [], payouts = [], koin_ledger = [] } = data;

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-10 w-10 text-slate-500 border border-slate-200 bg-white hover:bg-slate-50 transition-all shadow-sm shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-heading">
                {profile.name}
              </h1>
              <Badge className={cn(
                "rounded-full px-2 py-0.5 text-[9px] font-bold uppercase shadow-none border",
                profile.status === 1 ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
              )}>
                {profile.status === 1 ? "Verified Partner" : "Suspended"}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
               <span className="flex items-center gap-1.5"><Mail className="h-3 w-3" /> {profile.email}</span>
               <span className="h-1 w-1 rounded-full bg-slate-300" />
               <span className="flex items-center gap-1.5"><Calendar className="h-3 w-3" /> Bergabung {format(new Date(profile.created_at), "MMM yyyy", { locale: localeId })}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
           <Card className="px-4 py-2 border-slate-200 shadow-sm bg-indigo-50/50 flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-lg">
                 <Trophy className="h-4 w-4" />
              </div>
              <div>
                 <p className="text-[8px] font-bold text-indigo-400 uppercase leading-none mb-1">Referral Code</p>
                 <p className="text-xs font-bold text-indigo-700 font-mono tracking-tighter">{profile.referral_code}</p>
              </div>
           </Card>
           <Button className="h-10 px-5 font-bold text-[11px] uppercase tracking-wider gap-2 shadow-sm bg-slate-900 hover:bg-black">
              <Settings2 className="h-4 w-4" /> Kelola Akses
           </Button>
        </div>
      </div>

      {/* OPERATIONAL STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        <div className="space-y-6">
          <Tabs defaultValue="portfolio" className="w-full">
            <TabsList className="bg-slate-100/50 p-1 rounded-xl border border-slate-200 mb-6 w-full md:w-fit h-11 shadow-none">
              <TabsTrigger value="portfolio" className="rounded-lg px-6 font-bold text-[10px] uppercase gap-2 h-9 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
                <Layers className="h-4 w-4" /> Portfolio
              </TabsTrigger>
              <TabsTrigger value="referrals" className="rounded-lg px-6 font-bold text-[10px] uppercase gap-2 h-9 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
                <Target className="h-4 w-4" /> Network
              </TabsTrigger>
              <TabsTrigger value="ledger" className="rounded-lg px-6 font-bold text-[10px] uppercase gap-2 h-9 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
                <Activity className="h-4 w-4" /> Global Ledger
              </TabsTrigger>
              <TabsTrigger value="financials" className="rounded-lg px-6 font-bold text-[10px] uppercase gap-2 h-9 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
                <Receipt className="h-4 w-4" /> Payouts
              </TabsTrigger>
            </TabsList>

            {/* TAB: PORTFOLIO */}
            <TabsContent value="portfolio" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
               <Card className="border border-slate-200 bg-white shadow-sm overflow-hidden rounded-xl">
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <Store className="h-4 w-4 text-primary" />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Unit laundry yang dikelola owner ini</p>
                     </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/30 border-b border-slate-100">
                          <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-tight">Outlet Name</th>
                          <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-tight text-center">Liquidity</th>
                          <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-tight text-center">Activity</th>
                          <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-tight text-right">Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {outlets.map((outlet: any) => (
                          <tr key={outlet.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200 shadow-inner">
                                  <Store className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900 text-xs uppercase">{outlet.name}</p>
                                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">ID: {outlet.id}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-center">
                              <p className="text-xs font-bold text-slate-700">{outlet.koin.toLocaleString()}</p>
                              <p className="text-[8px] font-bold text-slate-400 uppercase">Koin Balance</p>
                            </td>
                            <td className="px-5 py-4 text-center">
                              <p className="text-xs font-bold text-slate-700">{outlet.total_trx.toLocaleString()}</p>
                              <p className="text-[8px] font-bold text-slate-400 uppercase">Total Orders</p>
                            </td>
                            <td className="px-5 py-4 text-right">
                               <p className="text-xs font-bold text-primary font-heading">Rp {outlet.total_revenue.toLocaleString()}</p>
                               <Link href={`/tenants/${outlet.id}`}>
                                  <Button variant="ghost" size="sm" className="h-6 px-2 text-[8px] font-bold uppercase text-slate-400 hover:text-primary">
                                     Control Hub <ArrowUpRight className="h-3 w-3 ml-1" />
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
            <TabsContent value="referrals" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
               <Card className="border-none shadow-md bg-indigo-600 text-white p-6 relative overflow-hidden group rounded-2xl">
                  <div className="relative z-10 space-y-4">
                     <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                        <DollarSign className="h-6 w-6" />
                     </div>
                     <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-indigo-100/60">Current Wallet Balance</p>
                        <h2 className="text-3xl font-bold font-heading">Rp {stats.referral_balance.toLocaleString()}</h2>
                     </div>
                     <Button className="w-fit px-8 bg-white text-indigo-600 font-bold text-xs uppercase h-10 hover:bg-indigo-50 shadow-lg">
                        Process Withdrawal
                     </Button>
                  </div>
               </Card>

               <Card className="border border-slate-200 bg-white shadow-sm overflow-hidden rounded-xl">
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                     <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Recruitment History & Network</p>
                  </div>
                  <div className="divide-y divide-slate-100">
                     {recruits.map((recruit: any) => (
                       <div key={recruit.id} className="p-4 flex items-center justify-between group hover:bg-slate-50/50 transition-colors">
                          <div className="flex items-center gap-3">
                             <div className="h-9 w-9 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                                <User className="h-4 w-4" />
                             </div>
                             <div>
                                <p className="text-xs font-bold text-slate-900 uppercase">{recruit.name}</p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Joined {format(new Date(recruit.created_at), "dd MMM yyyy", { locale: localeId })}</p>
                             </div>
                          </div>
                          <Badge variant="outline" className={cn(
                            "text-[8px] font-bold uppercase px-2 py-0 border shadow-none",
                            recruit.status === 1 ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-slate-400 border-slate-100"
                          )}>
                             {recruit.status === 1 ? 'Active Partner' : 'Inactive'}
                          </Badge>
                       </div>
                     ))}
                     {recruits.length === 0 && (
                        <div className="p-12 text-center text-slate-400">
                           <UserPlus className="h-8 w-8 mx-auto mb-2 opacity-20" />
                           <p className="text-[10px] font-bold uppercase tracking-widest">No recruits in this network</p>
                        </div>
                     )}
                  </div>
               </Card>
            </TabsContent>

            {/* TAB: LEDGER */}
            <TabsContent value="ledger" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
               <Card className="border border-slate-200 bg-white shadow-sm rounded-xl overflow-hidden">
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-primary" />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Cross-Outlet Operational Ledger</p>
                     </div>
                  </div>
                  <div className="divide-y divide-slate-100">
                     {koin_ledger.map((hk: any, i: number) => (
                       <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                          <div className="flex items-center gap-3">
                             <div className={cn(
                               "h-9 w-9 rounded-xl flex items-center justify-center border shadow-sm",
                               hk.hk_jenis_transaksi === 'masuk' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                             )}>
                                {hk.hk_jenis_transaksi === 'masuk' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                             </div>
                             <div>
                                <p className="text-[11px] font-bold text-slate-900 uppercase tracking-tight">{hk.outlet_nama}</p>
                                <p className="text-[9px] text-slate-400 font-bold tracking-tight line-clamp-1 uppercase">{hk.hk_keterangan}</p>
                             </div>
                          </div>
                          <div className="text-right">
                             <p className={cn("text-xs font-bold font-heading tracking-tight", hk.hk_jenis_transaksi === 'masuk' ? "text-emerald-600" : "text-rose-600")}>
                                {hk.hk_jenis_transaksi === 'masuk' ? '+' : '-'}{hk.hk_jumlah} Koin
                             </p>
                             <p className="text-[8px] font-bold text-slate-300 uppercase">{format(new Date(hk.hk_created), "dd/MM/yy HH:mm", { locale: localeId })}</p>
                          </div>
                       </div>
                     ))}
                  </div>
               </Card>
            </TabsContent>

            {/* TAB: FINANCIALS (Payouts) */}
            <TabsContent value="financials" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
               <Card className="border border-slate-200 bg-white shadow-sm rounded-xl overflow-hidden">
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                     <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Referral Commission Withdrawal History</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/30 border-b border-slate-100">
                          <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-tight">Request ID</th>
                          <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-tight text-center">Amount</th>
                          <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-tight text-center">Status</th>
                          <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-tight text-right">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {payouts.map((rp: any) => (
                          <tr key={rp.rp_id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-5 py-4">
                               <p className="text-xs font-bold text-slate-900 uppercase tracking-tighter">{rp.rp_id}</p>
                               <p className="text-[8px] font-bold text-slate-400 uppercase">{rp.rp_bank_name} • {rp.rp_account_number}</p>
                            </td>
                            <td className="px-5 py-4 text-center">
                               <p className="text-xs font-bold text-slate-700">Rp {rp.rp_amount?.toLocaleString()}</p>
                            </td>
                            <td className="px-5 py-4 text-center">
                               <Badge className={cn(
                                 "text-[8px] font-bold uppercase px-2 py-0 border-none shadow-none",
                                 rp.rp_status === "completed" ? "bg-emerald-500 text-white" : 
                                 rp.rp_status === "pending" ? "bg-amber-500 text-white animate-pulse" : "bg-slate-400 text-white"
                               )}>{rp.rp_status}</Badge>
                            </td>
                            <td className="px-5 py-4 text-right">
                               <p className="text-[9px] font-bold text-slate-400 uppercase">{format(new Date(rp.rp_created), "dd MMM yyyy", { locale: localeId })}</p>
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
        <div className="space-y-6">
          <Card className="border border-slate-200 bg-white shadow-sm rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
               <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Account Ecosystem</p>
            </div>
            <div className="p-5 space-y-6">
               <div className="space-y-4">
                  <div className="flex items-start gap-4">
                     <div className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                        <UserPlus className="h-4 w-4" />
                     </div>
                     <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mb-0.5">Invited By</p>
                        <p className="text-xs font-bold text-slate-800 uppercase">{profile.inviter_name || "Direct Registration"}</p>
                     </div>
                  </div>
                  <div className="flex items-start gap-4">
                     <div className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                        <Briefcase className="h-4 w-4" />
                     </div>
                     <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mb-0.5">Account Status</p>
                        <div className="flex items-center gap-2">
                           <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                           <p className="text-xs font-bold text-slate-800 uppercase font-heading">Operational Hub Ready</p>
                        </div>
                     </div>
                  </div>
                  <div className="flex items-start gap-4">
                     <div className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                        <Phone className="h-4 w-4" />
                     </div>
                     <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mb-0.5">Verified Contact</p>
                        <p className="text-xs font-bold text-slate-800">{profile.nohp || "No Phone Registered"}</p>
                     </div>
                  </div>
               </div>
               
               <Button variant="outline" className="w-full h-11 text-[10px] font-bold uppercase border-slate-200 shadow-sm hover:bg-slate-50 active:scale-95 transition-all text-slate-600 rounded-xl">
                  <Mail className="h-4 w-4 mr-2 text-primary" /> Hubungi Partner
               </Button>
            </div>
          </Card>

          <Button variant="ghost" className="w-full h-10 text-[9px] font-bold uppercase text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-colors shadow-none rounded-lg">
             <ShieldAlert className="h-4 w-4 mr-2" /> Revoke Global Access
          </Button>
        </div>
      </div>
    </div>
  );
}
