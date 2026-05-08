"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  Mail,
  Calendar,
  Coins,
  ShieldCheck,
  MapPin,
  Phone,
  Settings2,
  Activity,
  CreditCard,
  Users,
  LayoutGrid,
  Clock,
  Plus,
  ArrowUpRight,
  ShieldAlert,
  Zap,
  Globe,
  Building2,
  Briefcase,
  Layers,
  Smartphone,
  TrendingUp,
  History,
  CheckCircle2,
  FileText,
  BadgeCheck,
  Receipt,
  AlertCircle,
  Clock3,
  CreditCardIcon,
  ArrowDownRight,
  Check,
  X,
  Eye,
  ExternalLink,
  Loader2 as LoaderIcon
} from "lucide-react";
import { tenantService } from "@/services/tenant.service";
import { addonService } from "@/services/addon.service";
import { topupService } from "@/services/topup.service";
import api from "@/lib/api-client";
import { Tenant } from "@/types/tenant";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, differenceInDays } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { cn } from "@/lib/utils";
import StatCard from "@/components/modules/dashboard/stat-card";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";

export default function TenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  // Real Data State
  const [profile, setProfile] = useState<Tenant | null>(null);
  const [koinHistory, setKoinHistory] = useState<any[]>([]);
  const [topupHistory, setTopupHistory] = useState<any[]>([]);
  const [addonHistory, setAddonHistory] = useState<any[]>([]);
  const [trxHistory, setTrxHistory] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>({
    today_orders: 0,
    today_revenue: 0,
    active_staff: 0
  });

  // Modal State
  const [isKoinModalOpen, setIsKoinModalOpen] = useState(false);
  const [selectedKoin, setSelectedKoin] = useState<any>(null);
  const [isAddonModalOpen, setIsAddonModalOpen] = useState(false);
  const [selectedAddon, setSelectedAddon] = useState<any>(null);
  const [confirming, setConfirming] = useState(false);

  const API_BASE_URL = "https://api.ayocuci.id";

  useEffect(() => {
    fetchDetail();
  }, [params.id]);

  const fetchDetail = async () => {
    try {
      const res = await tenantService.getTenantDetail(params.id as string);
      if (res.status && res.data) {
        setProfile(res.data.profile);
        setKoinHistory(res.data.koin_history || []);
        setTopupHistory(res.data.topup_history || []);
        setAddonHistory(res.data.addon_history || []);
        setTrxHistory(res.data.trx_history || []);
        setMetrics(res.data.metrics || { today_orders: 0, today_revenue: 0, active_staff: 0 });
      }
    } catch (error) {
      toast.error("Gagal memuat detail outlet");
    } finally {
      setLoading(false);
    }
  };

  const handleValidateAddon = async (ha_id: string, status: "confirm" | "cancel") => {
    setConfirming(true);
    try {
      const res = status === "confirm" 
        ? await addonService.approve(ha_id) 
        : await addonService.reject(ha_id);
      
      if (res.status) {
        toast.success(res.message);
        setIsAddonModalOpen(false);
        fetchDetail();
      } else {
        toast.error(res.message);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Terjadi kesalahan sistem");
    } finally {
      setConfirming(false);
    }
  };

  const handleValidateKoin = async (topup_id: string, status: "success" | "failed") => {
    setConfirming(true);
    try {
      const res = await topupService.confirm(topup_id, status);
      
      if (res.status) {
        toast.success(res.message);
        setIsKoinModalOpen(false);
        fetchDetail();
      } else {
        toast.error(res.message);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Terjadi kesalahan sistem");
    } finally {
      setConfirming(false);
    }
  };

  // 🚀 REAL-TIME COMMAND CENTER (WebSocket Integration)
  useEffect(() => {
    if (!params.id) return;
    
    let socket: WebSocket | null = null;
    let timeoutId: NodeJS.Timeout;

    const connectWS = () => {
      const base = API_BASE_URL.replace(/^http/, 'ws');
      const wsUrl = `${base}/api/v1/ws?outlet_id=${params.id}`;
      
      console.log(`🔌 Mencoba menghubungkan ke WS: ${wsUrl}`);
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log(`✅ WS Connected: Command Center Outlet ${params.id}`);
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (["TOPUP_STATUS_CHANGED", "ADDON_PAYMENT_STATUS", "COIN_UPDATED", "OUTLET_ACTIVATED"].includes(data.type)) {
            toast.info(data.message || "Pembaruan data operasional...", { icon: "⚡" });
            fetchDetail();
          }
        } catch (err) {}
      };

      socket.onerror = (event) => {
        console.error("❌ WS Connection Error:", event);
        console.log("💡 Tip: Cek apakah domain mendukung WSS dan path /api/v1/ws sudah benar.");
      };

      socket.onclose = (e) => {
        console.log(`🔌 WS Disconnected. Kode: ${e.code}. Reconnecting in 5s...`);
        timeoutId = setTimeout(connectWS, 5000);
      };
    };

    connectWS();

    return () => {
      if (socket) socket.close();
      clearTimeout(timeoutId);
    };
  }, [params.id]);

  const daysRemaining = useMemo(() => {
    if (!profile?.ot_trial_at) return 0;
    const diff = differenceInDays(new Date(profile.ot_trial_at), new Date());
    return diff > 0 ? diff : 0;
  }, [profile]);

  const imageUrl = useMemo(() => {
    if (!profile?.ot_gambar) return null;
    if (profile.ot_gambar.startsWith("http")) return profile.ot_gambar;
    return `${API_BASE_URL}${profile.ot_gambar}`;
  }, [profile]);

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Activity className="h-6 w-6 text-[#FF5F4E] animate-spin" />
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sinkronisasi Data Outlet...</p>
      </div>
    );
    
  if (!profile)
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <ShieldAlert className="h-8 w-8 text-rose-500" />
        <p className="text-sm font-bold text-slate-900">Outlet Tidak Ditemukan</p>
        <Button variant="ghost" onClick={() => router.back()} size="sm">Kembali ke Daftar</Button>
      </div>
    );

  return (
    <div className="space-y-6">
      {/* HEADER / ACTION BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-9 w-9 text-slate-500 border border-slate-200 hover:bg-white active:scale-95 transition-all shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 font-heading uppercase">
                {profile.ot_nama}
              </h1>
              <Badge variant="outline" className={cn(
                "rounded-full px-2 py-0 text-[8px] font-bold uppercase border shadow-none",
                profile.ot_activated_at ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
              )}>
                {profile.ot_activated_at ? "Aktivasi Permanen" : "Masa Percobaan (Trial)"}
              </Badge>
              {profile.subscription_status === "PRO" && (
                <Badge variant="outline" className="rounded-full px-2 py-0 text-[8px] font-bold uppercase border-orange-100 bg-orange-50 text-orange-600 shadow-none">PRO ACCOUNT</Badge>
              )}
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
               ID ENTITAS: <span className="text-slate-600 font-mono">{profile.ot_id}</span>
               <span className="h-1 w-1 rounded-full bg-slate-200" />
               <span className={cn(profile.ot_status === 1 ? "text-emerald-500" : "text-rose-500")}>
                  {profile.ot_status === 1 ? "OPERASIONAL AKTIF" : "NON-AKTIF"}
               </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
           <Button variant="outline" size="sm" className="h-9 px-4 font-bold text-[10px] uppercase tracking-wider gap-2 border-slate-200 shadow-sm hover:bg-slate-50 active:scale-95 transition-all">
              <Settings2 className="h-3.5 w-3.5" /> Konfigurasi
           </Button>
           <Button size="sm" className="h-9 px-4 font-bold text-[10px] uppercase tracking-wider gap-2 shadow-sm bg-[#FF5F4E] hover:bg-[#E04F3F] active:scale-95 transition-all">
              <Plus className="h-3.5 w-3.5" /> Aksi Cepat
           </Button>
        </div>
      </div>

      {/* CORE METRICS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Saldo Koin" value={`${profile.ot_koin.toLocaleString()}`} icon={Coins} />
        <StatCard label="Order Hari Ini" value={`${metrics.today_orders} Trx`} icon={TrendingUp} />
        <StatCard 
          label="Omzet Hari Ini" 
          value={`Rp ${metrics.today_revenue.toLocaleString()}`} 
          icon={CreditCard} 
        />
        <StatCard label="Sisa Kuota SDM" value={`${metrics.active_staff}/${profile.ot_max_pegawai_base} Slot`} icon={Users} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        {/* OPERATIONAL AREA */}
        <div className="space-y-6">
          <Tabs defaultValue="ringkasan" className="w-full">
            <TabsList className="bg-slate-100/80 p-1 rounded-lg border border-slate-200 mb-6 w-fit h-10 shadow-none overflow-x-auto">
              <TabsTrigger value="ringkasan" className="rounded-md px-5 font-bold text-[9px] uppercase gap-2 h-8 data-[state=active]:bg-white data-[state=active]:text-[#FF5F4E]">
                <Smartphone className="h-3.5 w-3.5" /> Ringkasan
              </TabsTrigger>
              <TabsTrigger value="transaksi" className="rounded-md px-5 font-bold text-[9px] uppercase gap-2 h-8 data-[state=active]:bg-white data-[state=active]:text-[#FF5F4E]">
                <History className="h-3.5 w-3.5" /> Transaksi
              </TabsTrigger>
              <TabsTrigger value="addon" className="rounded-md px-5 font-bold text-[9px] uppercase gap-2 h-8 data-[state=active]:bg-white data-[state=active]:text-[#FF5F4E]">
                <Zap className="h-3.5 w-3.5" /> Add-on & Lisensi
              </TabsTrigger>
              <TabsTrigger value="ekonomi" className="rounded-md px-5 font-bold text-[9px] uppercase gap-2 h-8 data-[state=active]:bg-white data-[state=active]:text-[#FF5F4E]">
                <CreditCardIcon className="h-3.5 w-3.5" /> Ekonomi Koin
              </TabsTrigger>
            </TabsList>

            {/* TAB: RINGKASAN */}
            <TabsContent value="ringkasan" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Informasi Bisnis */}
                  <Card className="border border-slate-200 bg-white shadow-none overflow-hidden">
                     <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-[#FF5F4E]" />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Informasi Bisnis</p>
                     </div>
                     <div className="p-5 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1">
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Tipe Lokasi</p>
                              <p className="text-xs font-bold text-slate-900">{profile.ot_tipe_lokasi_usaha || "Belum Diatur"}</p>
                           </div>
                           <div className="space-y-1">
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Modal Usaha</p>
                              <p className="text-xs font-bold text-slate-900">{profile.ot_modal_usaha || "Belum Diatur"}</p>
                           </div>
                           <div className="space-y-1">
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Kekuatan SDM</p>
                              <p className="text-xs font-bold text-slate-900">{profile.ot_jumlah_karyawan || "0"}</p>
                           </div>
                           <div className="space-y-1">
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Populasi Mesin</p>
                              <p className="text-xs font-bold text-slate-900">{profile.ot_jumlah_mesin_cuci || "0"}</p>
                           </div>
                        </div>
                     </div>
                  </Card>

                  {/* Lokasi & Jangkauan */}
                  <Card className="border border-slate-200 bg-white shadow-none overflow-hidden">
                     <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-[#FF5F4E]" />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Lokasi & Jangkauan</p>
                     </div>
                     <div className="p-5 space-y-4">
                        <div className="space-y-3">
                           <div className="flex justify-between items-start text-xs">
                              <span className="text-slate-400 font-medium">Alamat</span>
                              <span className="font-bold text-slate-900 text-right max-w-[160px] leading-relaxed">{profile.ot_alamat || "-"}</span>
                           </div>
                           <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-400 font-medium">Kode Area</span>
                              <span className="font-bold text-slate-900 font-mono text-[10px]">{profile.ot_kecamatan} / {profile.ot_kota} / {profile.ot_provinsi}</span>
                           </div>
                        </div>
                     </div>
                  </Card>
               </div>
            </TabsContent>

            {/* TAB: TRANSAKSI */}
            <TabsContent value="transaksi" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
               <Card className="border border-slate-200 bg-white shadow-none overflow-hidden">
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                     <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Daftar Transaksi Outlet (Terbaru)</p>
                  </div>
                  <div className="divide-y divide-slate-100">
                     {trxHistory.length > 0 ? trxHistory.map((trx, i) => (
                       <div key={i} className="p-4 flex items-center justify-between group hover:bg-slate-50/50 transition-colors">
                          <div className="flex items-center gap-3">
                             <div className="h-9 w-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                                <History className="h-4 w-4" />
                             </div>
                             <div>
                                <p className="text-[11px] font-bold text-slate-900 uppercase tracking-tight">{trx.id}</p>
                                <p className="text-[9px] text-slate-500 font-medium">{trx.cust || 'Tanpa Nama'} • {format(new Date(trx.date), "dd/MM/yy HH:mm")}</p>
                             </div>
                          </div>
                          <div className="text-right">
                             <p className="text-xs font-bold text-slate-900 font-heading">Rp {trx.total?.toLocaleString()}</p>
                             <Badge variant="outline" className={cn(
                               "text-[8px] px-1.5 py-0 border-none font-bold uppercase",
                               trx.status === "Selesai" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                             )}>{trx.status}</Badge>
                          </div>
                       </div>
                     )) : (
                        <div className="p-10 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">Tidak ada transaksi terbaru</div>
                     )}
                  </div>
               </Card>
            </TabsContent>

            {/* TAB: ADD-ON & LISENSI */}
            <TabsContent value="addon" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
               <Card className="border border-slate-200 bg-white shadow-none overflow-hidden">
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                     <BadgeCheck className="h-4 w-4 text-emerald-500" />
                     <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Riwayat Aktivasi Lisensi PRO</p>
                  </div>
                  <div className="divide-y divide-slate-100">
                     {profile.ot_activated_at ? (
                        <div className="p-5 flex items-center justify-between">
                           <div className="flex items-center gap-4">
                              <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100">
                                 <ShieldCheck className="h-5 w-5 text-emerald-600" />
                              </div>
                              <div>
                                 <p className="text-[12px] font-bold text-slate-900 uppercase tracking-tight">PRO License Activated</p>
                                 <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">Activated On: {format(new Date(profile.ot_activated_at), "dd MMM yyyy HH:mm")}</p>
                              </div>
                           </div>
                           <Badge className="bg-emerald-500 text-white border-none text-[9px] font-bold uppercase shadow-none">PERMANENT ACCESS</Badge>
                        </div>
                     ) : (
                        <div className="p-10 text-center space-y-2">
                           <Clock3 className="h-8 w-8 text-slate-200 mx-auto" />
                           <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Belum Ada Riwayat Aktivasi PRO</p>
                        </div>
                     )}
                  </div>
               </Card>

               <Card className="border border-slate-200 bg-white shadow-none overflow-hidden">
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                     <Receipt className="h-4 w-4 text-[#FF5F4E]" />
                     <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Riwayat Pembelian & Log Add-on</p>
                  </div>
                  <div className="divide-y divide-slate-100">
                     {addonHistory.length > 0 ? addonHistory.map((ha, i) => (
                        <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50/30 transition-colors">
                           <div className="flex items-center gap-4">
                              <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", ha.ha_status === "SUCCESS" ? "bg-orange-50 text-orange-600" : "bg-amber-50 text-amber-600")}>
                                 <Zap className="h-4 w-4" />
                              </div>
                              <div>
                                 <p className="text-[11px] font-bold text-slate-900">{ha.ha_item_names || "Layanan Add-on"}</p>
                                 <p className="text-[9px] text-slate-400 font-medium uppercase tracking-tighter">ID: {ha.ha_id} • Via {ha.ha_metode_bayar}</p>
                              </div>
                           </div>
                           <div className="text-right">
                              <p className="text-[10px] font-bold text-slate-900">Rp {ha.ha_total?.toLocaleString()}</p>
                              <Badge className={cn(
                                 "text-[8px] px-1.5 py-0 border-none font-bold uppercase shadow-none",
                                 ha.ha_status === "SUCCESS" ? "bg-emerald-500" : 
                                 ha.ha_status === "PENDING_VALIDATION" ? "bg-amber-500 animate-pulse" : "bg-slate-400"
                              )}>{ha.ha_status}</Badge>

                              {ha.ha_status === "PENDING_VALIDATION" && (
                                 <div className="flex items-center gap-1 mt-2 justify-end">
                                    <Button 
                                      size="sm" 
                                      className="h-7 px-3 text-[9px] font-bold uppercase bg-primary hover:bg-primary/90 text-white"
                                      onClick={() => { setSelectedAddon(ha); setIsAddonModalOpen(true); }}
                                    >
                                       Review & Validasi
                                    </Button>
                                 </div>
                              )}
                              <p className="text-[8px] text-slate-300 font-bold mt-1 uppercase">{format(new Date(ha.ha_created), "dd/MM/yy")}</p>
                           </div>
                        </div>
                     )) : (
                        <div className="p-10 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">Tidak ada riwayat add-on</div>
                     )}
                  </div>
               </Card>
            </TabsContent>

            {/* TAB: EKONOMI KOIN */}
            <TabsContent value="ekonomi" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
               <Card className="border border-slate-200 bg-white shadow-none overflow-hidden">
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                     <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                     <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Riwayat Isi Ulang Koin</p>
                  </div>
                  <div className="divide-y divide-slate-100">
                     {topupHistory.length > 0 ? topupHistory.map((tk, i) => (
                        <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50/30 transition-colors">
                           <div className="flex items-center gap-4">
                              <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                 <ArrowUpRight className="h-4 w-4" />
                              </div>
                              <div>
                                 <p className="text-[11px] font-bold text-slate-900">{tk.tk_jumlah} Koin</p>
                                 <p className="text-[9px] text-slate-400 font-medium uppercase tracking-tighter">ID: {tk.tk_id} • Via {tk.tk_metode_bayar}</p>
                              </div>
                           </div>
                           <div className="text-right">
                              <p className="text-[10px] font-bold text-slate-900">Rp {tk.tk_total?.toLocaleString()}</p>
                              <Badge variant="outline" className={cn(
                                 "text-[8px] px-1.5 py-0 border-none font-bold uppercase shadow-none",
                                 tk.tk_status === "success" ? "bg-emerald-50 text-emerald-600" : 
                                 tk.tk_status === "pending" ? "bg-amber-50 text-amber-600 animate-pulse border-amber-200" : "bg-slate-50 text-slate-600"
                              )}>{tk.tk_status}</Badge>

                              {tk.tk_status === "pending" && (
                                 <div className="flex items-center gap-1 mt-2 justify-end">
                                    <Button 
                                      size="sm" 
                                      className="h-7 px-3 text-[9px] font-bold uppercase bg-primary hover:bg-primary/90 text-white"
                                      onClick={() => { setSelectedKoin(tk); setIsKoinModalOpen(true); }}
                                    >
                                       Review & Validasi
                                    </Button>
                                 </div>
                              )}
                           </div>
                        </div>
                     )) : (
                        <div className="p-10 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">Tidak ada riwayat topup</div>
                     )}
                  </div>
               </Card>

               <Card className="border border-slate-200 bg-white shadow-none overflow-hidden">
                  <div className="p-4 border-b border-slate-100 bg-slate-50/30 flex items-center gap-2">
                     <TrendingUp className="h-4 w-4 text-orange-500" />
                     <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Log Mutasi Koin Lengkap</p>
                  </div>
                  <div className="divide-y divide-slate-100">
                     {koinHistory.length > 0 ? koinHistory.map((tx, i) => (
                       <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                          <div className="flex items-center gap-3">
                             <div className={cn(
                               "h-9 w-9 rounded-xl flex items-center justify-center border",
                               tx.hk_jenis_transaksi === 'masuk' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                             )}>
                                {tx.hk_jenis_transaksi === 'masuk' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                             </div>
                             <div>
                                <p className="text-[11px] font-bold text-slate-900 uppercase tracking-tight">{tx.hk_jenis_transaksi === 'masuk' ? 'MASUK' : 'KELUAR'}</p>
                                <p className="text-[9px] text-slate-400 font-medium tracking-tight line-clamp-1">{tx.hk_keterangan}</p>
                             </div>
                          </div>
                          <div className="text-right">
                             <p className={cn("text-xs font-bold font-heading tracking-tight", tx.hk_jenis_transaksi === 'masuk' ? "text-emerald-600" : "text-rose-600")}>
                                {tx.hk_jenis_transaksi === 'masuk' ? '+' : '-'}{tx.hk_jumlah} Koin
                             </p>
                             <p className="text-[8px] font-bold text-slate-300 uppercase">{format(new Date(tx.hk_created), "dd/MM/yy HH:mm")}</p>
                          </div>
                       </div>
                     )) : (
                        <div className="p-10 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">Tidak ada mutasi koin</div>
                     )}
                  </div>
               </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* SIDEBAR: PROFIL PEMILIK */}
        <div className="space-y-6">
          <Card className="border border-slate-200 bg-white shadow-none overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
               <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Profil Pemilik (Owner)</p>
            </div>
            <div className="p-5 space-y-5">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 overflow-hidden border border-slate-200 shadow-inner group">
                  {imageUrl ? (
                    <img src={imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="Outlet" />
                  ) : (
                    <User className="h-6 w-6" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate uppercase tracking-tight">{profile.owner_name}</p>
                  <p className="text-[10px] font-medium text-slate-400 truncate mt-0.5">{profile.owner_email}</p>
                </div>
              </div>
              
              <div className="pt-4 border-t border-slate-50 space-y-3">
                 <div className="flex items-center gap-3 text-[10px] text-slate-600 font-bold group">
                    <div className="h-7 w-7 rounded-lg border border-slate-100 flex items-center justify-center group-hover:bg-[#FF5F4E]/5 group-hover:text-[#FF5F4E] transition-all">
                       <Phone className="h-3.5 w-3.5" />
                    </div>
                    <span>{profile.ot_nohp || "No Contact"}</span>
                 </div>
                 <div className="flex items-center gap-3 text-[10px] text-slate-600 font-bold group">
                    <div className="h-7 w-7 rounded-lg border border-slate-100 flex items-center justify-center group-hover:bg-[#FF5F4E]/5 group-hover:text-[#FF5F4E] transition-all">
                       <Briefcase className="h-3.5 w-3.5" />
                    </div>
                    <span className="uppercase tracking-tighter">Business Partner</span>
                 </div>
              </div>
              
              <Button variant="outline" className="w-full h-9 text-[9px] font-bold uppercase border-slate-200 shadow-sm hover:bg-slate-50 active:scale-95 transition-all text-slate-600">
                 <Mail className="h-3.5 w-3.5 mr-2 text-[#FF5F4E]" /> Hubungi Owner
              </Button>
            </div>
          </Card>

          {/* INTEGRITAS SISTEM */}
          <Card className="p-5 border border-slate-200 bg-slate-900 text-white shadow-lg relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-[#FF5F4E] mb-4">
                <ShieldCheck className="h-4 w-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-90">Sistem Keamanan AyoCuci</span>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-[10px]">
                    <span className="text-white/40 uppercase font-bold tracking-tight">Terdaftar Sejak</span>
                    <span className="font-bold">{format(new Date(profile.ot_created), "dd MMM yyyy", { locale: localeId })}</span>
                </div>
                {profile.ot_activated_at && (
                   <div className="flex justify-between items-center text-[10px]">
                      <span className="text-[#FF5F4E]/60 uppercase font-bold tracking-tight">Tanggal Aktivasi</span>
                      <span className="font-bold text-[#FF5F4E]">{format(new Date(profile.ot_activated_at), "dd MMM yyyy", { locale: localeId })}</span>
                   </div>
                )}
                {!profile.ot_activated_at && profile.ot_trial_at && (
                   <div className="flex justify-between items-center text-[10px]">
                      <span className="text-amber-400/60 uppercase font-bold tracking-tight">Selesai Trial</span>
                      <span className="font-bold text-amber-400">{format(new Date(profile.ot_trial_at), "dd MMM yyyy", { locale: localeId })}</span>
                   </div>
                )}
                <div className="flex justify-between items-center text-[10px]">
                    <span className="text-white/40 uppercase font-bold tracking-tight">Status Node</span>
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-none text-[8px] font-bold uppercase py-0 px-2 h-5">Verified</Badge>
                </div>
              </div>
            </div>
            <Globe className="absolute -bottom-6 -right-6 h-28 w-28 text-white/[0.04] rotate-12 group-hover:rotate-45 transition-transform duration-1000" />
          </Card>

          <Button variant="ghost" className="w-full h-9 text-[9px] font-bold uppercase text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-colors shadow-none">
             <ShieldAlert className="h-3.5 w-3.5 mr-2" /> Hentikan Akses Outlet
          </Button>
        </div>
      </div>

      {/* KOIN TOPUP VALIDATION MODAL */}
      <Dialog open={isKoinModalOpen} onOpenChange={setIsKoinModalOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-none rounded-xl shadow-2xl bg-white">
          <VisuallyHidden.Root><DialogTitle>Validasi Topup Koin</DialogTitle></VisuallyHidden.Root>
          
          <div className="p-5 border-b border-slate-100 bg-white">
             <div className="flex items-center justify-between mb-4">
                <Badge variant="outline" className="font-bold text-[9px] uppercase tracking-wider text-slate-400 border-slate-200">
                   {selectedKoin?.tk_id}
                </Badge>
                <Badge className="bg-amber-50 text-amber-600 border-amber-100 text-[8px] font-bold uppercase">Pending Verification</Badge>
             </div>
             <h3 className="text-lg font-bold text-slate-900 tracking-tight leading-none mb-1 font-heading uppercase">
                Topup {selectedKoin?.tk_jumlah?.toLocaleString()} Koin
             </h3>
             <p className="text-xs font-medium text-slate-500">Permintaan isi ulang saldo dari tenant.</p>
          </div>

          <div className="p-5 space-y-5 bg-slate-50/30">
             <div className="space-y-2">
                <div className="flex items-center justify-between">
                   <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Bukti Transfer</label>
                   {selectedKoin?.tk_bukti && (
                      <a href={`${API_BASE_URL}${selectedKoin.tk_bukti}`} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-primary flex items-center gap-1 hover:underline">
                         Lihat Fullscreen <ExternalLink className="h-3 w-3" />
                      </a>
                   )}
                </div>
                {selectedKoin?.tk_bukti ? (
                   <div className="aspect-video rounded-xl border border-slate-200 overflow-hidden bg-slate-200 shadow-inner">
                      <img src={`${API_BASE_URL}${selectedKoin.tk_bukti}`} className="w-full h-full object-cover" alt="Proof" />
                   </div>
                ) : (
                   <div className="aspect-video rounded-xl bg-slate-100 border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400">
                      <AlertCircle className="h-8 w-8 mb-2 opacity-20" />
                      <p className="text-[10px] font-bold uppercase tracking-widest">Bukti Belum Diunggah</p>
                   </div>
                )}
             </div>

             <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                   <p className="text-[9px] font-bold uppercase text-slate-400 mb-1">Metode</p>
                   <p className="font-bold text-xs text-slate-800 uppercase">{selectedKoin?.tk_metode_bayar}</p>
                </div>
                <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                   <p className="text-[9px] font-bold uppercase text-slate-400 mb-1">Total Bayar</p>
                   <p className="font-bold text-xs text-[#FF5F4E]">Rp {selectedKoin?.tk_total?.toLocaleString("id-ID")}</p>
                </div>
             </div>
          </div>

          <div className="p-5 bg-white border-t border-slate-100 flex gap-3">
             <Button
                disabled={confirming || !selectedKoin?.tk_bukti}
                onClick={() => handleValidateKoin(selectedKoin.tk_id, "success")}
                className="flex-1 h-11 rounded-xl font-bold text-[11px] uppercase tracking-wider bg-emerald-500 hover:bg-emerald-600 shadow-md"
             >
                {confirming ? <LoaderIcon className="h-4 w-4 animate-spin" /> : "Validasi & Terima"}
             </Button>
             <Button
                variant="outline"
                disabled={confirming}
                onClick={() => handleValidateKoin(selectedKoin.tk_id, "failed")}
                className="flex-1 h-11 rounded-xl font-bold text-[11px] uppercase tracking-wider text-rose-500 border-slate-200 hover:bg-rose-50"
             >
                Tolak
             </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ADDON VALIDATION MODAL */}
      <Dialog open={isAddonModalOpen} onOpenChange={setIsAddonModalOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-none rounded-xl shadow-2xl bg-white">
          <VisuallyHidden.Root><DialogTitle>Validasi Lisensi Add-on</DialogTitle></VisuallyHidden.Root>
          
          <div className="p-5 border-b border-slate-100 bg-white">
             <div className="flex items-center justify-between mb-4">
                <Badge variant="outline" className="font-bold text-[9px] uppercase tracking-wider text-slate-400 border-slate-200">
                   {selectedAddon?.ha_id}
                </Badge>
                <Badge className="bg-orange-50 text-orange-600 border-orange-100 text-[8px] font-bold uppercase">License Pending</Badge>
             </div>
             <h3 className="text-lg font-bold text-slate-900 tracking-tight leading-none mb-1 font-heading uppercase">
                {selectedAddon?.ha_item_names}
             </h3>
             <p className="text-xs font-medium text-slate-500">Aktivasi fitur tambahan untuk operasional outlet.</p>
          </div>

          <div className="p-5 space-y-5 bg-slate-50/30">
             <div className="space-y-2">
                <div className="flex items-center justify-between">
                   <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Bukti Pembayaran</label>
                   {selectedAddon?.ha_bukti && (
                      <a href={`${API_BASE_URL}${selectedAddon.ha_bukti}`} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-primary flex items-center gap-1 hover:underline">
                         Lihat Fullscreen <ExternalLink className="h-3 w-3" />
                      </a>
                   )}
                </div>
                {selectedAddon?.ha_bukti ? (
                   <div className="aspect-video rounded-xl border border-slate-200 overflow-hidden bg-slate-200 shadow-inner">
                      <img src={`${API_BASE_URL}${selectedAddon.ha_bukti}`} className="w-full h-full object-cover" alt="Proof" />
                   </div>
                ) : (
                   <div className="aspect-video rounded-xl bg-slate-100 border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400">
                      <AlertCircle className="h-8 w-8 mb-2 opacity-20" />
                      <p className="text-[10px] font-bold uppercase tracking-widest">Bukti Belum Diunggah</p>
                   </div>
                )}
             </div>

             <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                   <p className="text-[9px] font-bold uppercase text-slate-400 mb-1">Metode</p>
                   <p className="font-bold text-xs text-slate-800 uppercase">{selectedAddon?.ha_metode_bayar}</p>
                </div>
                <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                   <p className="text-[9px] font-bold uppercase text-slate-400 mb-1">Harga Lisensi</p>
                   <p className="font-bold text-xs text-[#FF5F4E]">Rp {selectedAddon?.ha_total?.toLocaleString("id-ID")}</p>
                </div>
             </div>
          </div>

          <div className="p-5 bg-white border-t border-slate-100 flex gap-3">
             <Button
                disabled={confirming || !selectedAddon?.ha_bukti}
                onClick={() => handleValidateAddon(selectedAddon.ha_id, "confirm")}
                className="flex-1 h-11 rounded-xl font-bold text-[11px] uppercase tracking-wider bg-emerald-500 hover:bg-emerald-600 shadow-md"
             >
                {confirming ? <LoaderIcon className="h-4 w-4 animate-spin" /> : "Aktivasi Fitur"}
             </Button>
             <Button
                variant="outline"
                disabled={confirming}
                onClick={() => handleValidateAddon(selectedAddon.ha_id, "cancel")}
                className="flex-1 h-11 rounded-xl font-bold text-[11px] uppercase tracking-wider text-rose-500 border-slate-200 hover:bg-rose-50"
             >
                Batalkan
             </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
