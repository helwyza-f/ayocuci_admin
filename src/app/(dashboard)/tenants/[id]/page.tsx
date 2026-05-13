"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Store,
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
    total_orders: 0,
    total_revenue: 0,
    active_staff: 0
  });

  const [regionNames, setRegionNames] = useState({ provinsi: "", kota: "", kecamatan: "" });

  // Pagination States
  const [pages, setPages] = useState({
    transactions: 1,
    addons: 1,
    koin: 1
  });
  const itemsPerPage = 10;

  // Modal State
  const [isKoinModalOpen, setIsKoinModalOpen] = useState(false);
  const [selectedKoin, setSelectedKoin] = useState<any>(null);
  const [isAddonModalOpen, setIsAddonModalOpen] = useState(false);
  const [selectedAddon, setSelectedAddon] = useState<any>(null);
  const [confirming, setConfirming] = useState(false);

  // Double Confirmation State
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<{ type: 'koin' | 'addon', id: string, status: 'confirm' | 'cancel' } | null>(null);

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

  useEffect(() => {
    const resolveRegions = async () => {
      try {
        if (profile?.ot_provinsi) {
          const p = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/province/${profile.ot_provinsi}.json`).then(r => r.json());
          if (p) setRegionNames(prev => ({ ...prev, provinsi: p.name }));
          
          if (profile?.ot_kota) {
            // Remove dots from code for API compatibility if needed
            const cityCode = profile.ot_kota.replace(/\./g, '');
            const k = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regency/${cityCode}.json`).then(r => r.json());
            if (k) setRegionNames(prev => ({ ...prev, kota: k.name }));
          }

          if (profile?.ot_kecamatan) {
            const distCode = profile.ot_kecamatan.replace(/\./g, '');
            const kec = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/district/${distCode}.json`).then(r => r.json());
            if (kec) setRegionNames(prev => ({ ...prev, kecamatan: kec.name }));
          }
        }
      } catch (e) {
        console.error("Region resolve error:", e);
      }
    };

    if (profile) resolveRegions();
  }, [profile]);

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
        <StatCard 
          label="Saldo Koin" 
          value={`${profile.ot_koin.toLocaleString()}`} 
          icon={Coins} 
          trend={{ value: "Saldo Aktif", isUp: true }}
        />
        <StatCard 
          label="Performa Order" 
          value={`${metrics.today_orders} Trx`} 
          icon={TrendingUp} 
          trend={{ value: `${metrics.total_orders.toLocaleString()} Lifetime`, isUp: true }}
        />
        <StatCard 
          label="Performa Omzet" 
          value={`Rp ${metrics.today_revenue.toLocaleString()}`} 
          icon={CreditCard} 
          trend={{ value: `Total Rp ${metrics.total_revenue.toLocaleString()}`, isUp: true }}
        />
        <StatCard 
          label="Sisa Kuota SDM" 
          value={`${metrics.active_staff}/${profile.ot_max_pegawai_base}`} 
          icon={Users} 
          className="text-slate-600"
        />
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="bg-slate-100/50 p-1 rounded-xl border border-slate-200 mb-6 flex flex-wrap md:flex-nowrap w-full md:w-fit h-auto md:h-11 shadow-sm">
          <TabsTrigger value="dashboard" className="rounded-lg flex-1 md:flex-none px-6 font-bold text-[10px] uppercase gap-2 h-9 data-[state=active]:bg-white data-[state=active]:text-[#FF5F4E] data-[state=active]:shadow-sm transition-all">
            <LayoutGrid className="h-3.5 w-3.5" /> Dashboard
          </TabsTrigger>
          <TabsTrigger value="identitas" className="rounded-lg flex-1 md:flex-none px-6 font-bold text-[10px] uppercase gap-2 h-9 data-[state=active]:bg-white data-[state=active]:text-[#FF5F4E] data-[state=active]:shadow-sm transition-all">
            <Building2 className="h-3.5 w-3.5" /> Identitas
          </TabsTrigger>
          <TabsTrigger value="transaksi" className="rounded-lg flex-1 md:flex-none px-6 font-bold text-[10px] uppercase gap-2 h-9 data-[state=active]:bg-white data-[state=active]:text-[#FF5F4E] data-[state=active]:shadow-sm transition-all">
            <History className="h-3.5 w-3.5" /> Transaksi
          </TabsTrigger>
          <TabsTrigger value="addons" className="rounded-lg flex-1 md:flex-none px-6 font-bold text-[10px] uppercase gap-2 h-9 data-[state=active]:bg-white data-[state=active]:text-[#FF5F4E] data-[state=active]:shadow-sm transition-all">
            <Zap className="h-3.5 w-3.5" /> Layanan Add-on
          </TabsTrigger>
          <TabsTrigger value="koin" className="rounded-lg flex-1 md:flex-none px-6 font-bold text-[10px] uppercase gap-2 h-9 data-[state=active]:bg-white data-[state=active]:text-[#FF5F4E] data-[state=active]:shadow-sm transition-all">
            <Coins className="h-3.5 w-3.5" /> Ekonomi Koin
          </TabsTrigger>
        </TabsList>

        {/* TAB: DASHBOARD */}
        <TabsContent value="dashboard" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
           <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
              <div className="space-y-6">
                 {/* 1. TOPUP VALIDATION HUB (Only if pending) */}
                 {topupHistory.filter(t => t.tk_status === 'pending').length > 0 && (
                    <Card className="border-2 border-amber-200 bg-amber-50/20 shadow-sm overflow-hidden">
                       <div className="p-4 border-b border-amber-100 bg-amber-100/30 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                             <Coins className="h-4 w-4 text-amber-600" />
                             <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">Antrian Validasi Koin</p>
                          </div>
                          <Badge className="bg-amber-500 text-white border-none text-[8px] font-bold">PENDING</Badge>
                       </div>
                       <div className="divide-y divide-amber-100">
                          {topupHistory.filter(t => t.tk_status === 'pending').map((tk, i) => (
                             <div key={i} className="p-4 flex items-center justify-between bg-white/50">
                                <div>
                                   <p className="text-xs font-bold text-slate-900 uppercase">{tk.tk_jumlah} Koin • Rp {tk.tk_total?.toLocaleString()}</p>
                                   <p className="text-[10px] text-slate-500 font-medium">{tk.tk_metode_bayar} • {format(new Date(tk.tk_created), "dd/MM/yy HH:mm")}</p>
                                </div>
                                <Button 
                                  size="sm" 
                                  className="h-8 px-4 text-[10px] font-bold uppercase bg-amber-500 hover:bg-amber-600"
                                  onClick={() => { setSelectedKoin(tk); setIsKoinModalOpen(true); }}
                                >
                                   Review Bukti
                                </Button>
                             </div>
                          ))}
                       </div>
                    </Card>
                 )}

                 {/* 2. ADDON VALIDATION HUB (Only if pending) */}
                 {addonHistory.filter(a => a.ha_status === 'PENDING_VALIDATION').length > 0 && (
                    <Card className="border-2 border-orange-200 bg-orange-50/20 shadow-sm overflow-hidden">
                       <div className="p-4 border-b border-orange-100 bg-orange-100/30 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                             <Zap className="h-4 w-4 text-orange-600" />
                             <p className="text-[10px] font-black uppercase tracking-widest text-orange-700">Antrian Aktivasi Fitur</p>
                          </div>
                          <Badge className="bg-orange-500 text-white border-none text-[8px] font-bold">VALIDASI</Badge>
                       </div>
                       <div className="divide-y divide-orange-100">
                          {addonHistory.filter(a => a.ha_status === 'PENDING_VALIDATION').map((ha, i) => (
                             <div key={i} className="p-4 flex items-center justify-between bg-white/50">
                                <div>
                                   <p className="text-xs font-bold text-slate-900 uppercase line-clamp-1">{ha.ha_item_names}</p>
                                   <p className="text-[10px] text-slate-500 font-medium">Rp {ha.ha_total?.toLocaleString()} • {format(new Date(ha.ha_created), "dd/MM/yy HH:mm")}</p>
                                </div>
                                <Button 
                                  size="sm" 
                                  className="h-8 px-4 text-[10px] font-bold uppercase bg-orange-500 hover:bg-orange-600"
                                  onClick={() => { setSelectedAddon(ha); setIsAddonModalOpen(true); }}
                                >
                                   Review
                                </Button>
                             </div>
                          ))}
                       </div>
                    </Card>
                 )}

                 {/* 3. RECENT ACTIVITY (Laundry) */}
                 <Card className="border border-slate-200 bg-white shadow-none overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                       <div className="flex items-center gap-2">
                          <History className="h-3.5 w-3.5 text-[#FF5F4E]" />
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Aktivitas Laundry Terakhir</p>
                       </div>
                    </div>
                    <div className="divide-y divide-slate-100">
                       {trxHistory.length > 0 ? trxHistory.slice(0, 5).map((trx, i) => (
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
              </div>

              <div className="space-y-6">
                 {/* Quick Contact Card */}
                 <Card className="p-5 border border-slate-200 bg-white shadow-none space-y-4">
                    <div className="flex items-center gap-4">
                       <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
                          <User className="h-6 w-6" />
                       </div>
                       <div>
                          <p className="text-xs font-bold text-slate-900 uppercase tracking-tight">{profile.owner_name}</p>
                          <p className="text-[10px] font-medium text-slate-400">{profile.owner_email}</p>
                       </div>
                    </div>
                    <div className="pt-4 border-t border-slate-50 space-y-2">
                       <Button className="w-full h-10 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold text-[10px] uppercase gap-2 rounded-xl">
                          <Smartphone className="h-4 w-4" /> WhatsApp Owner
                       </Button>
                       <Button variant="outline" className="w-full h-10 font-bold text-[10px] uppercase gap-2 rounded-xl border-slate-200 shadow-sm">
                          <Mail className="h-4 w-4 text-[#FF5F4E]" /> Kirim Email
                       </Button>
                    </div>
                 </Card>

                 {/* Security & Node Status */}
                 <Card className="p-5 border border-slate-200 bg-slate-900 text-white shadow-lg relative overflow-hidden">
                    <div className="relative z-10 space-y-4">
                       <div className="flex items-center gap-2 text-[#FF5F4E]">
                          <ShieldCheck className="h-4 w-4" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">System Integrity</span>
                       </div>
                       <div className="space-y-3">
                          <div className="flex justify-between text-[10px]">
                             <span className="text-white/40 font-bold uppercase">Uptime</span>
                             <span className="font-bold text-emerald-400 tracking-widest">99.9%</span>
                          </div>
                          <div className="flex justify-between text-[10px]">
                             <span className="text-white/40 font-bold uppercase">Node ID</span>
                             <span className="font-bold font-mono">NODE-0{profile.ot_id.split('.')[0]}</span>
                          </div>
                       </div>
                    </div>
                    <Globe className="absolute -bottom-6 -right-6 h-28 w-28 text-white/[0.04] rotate-12" />
                 </Card>
              </div>
           </div>
        </TabsContent>

        {/* TAB: IDENTITAS BISNIS (FULL TAB) */}
        <TabsContent value="identitas" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Primary Info */}
              <div className="lg:col-span-2 space-y-6">
                 <Card className="border border-slate-200 bg-white shadow-none overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                       <Building2 className="h-3.5 w-3.5 text-[#FF5F4E]" />
                       <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Detail Profil Operasional</p>
                    </div>
                    <div className="p-0">
                       <table className="w-full text-left border-collapse">
                          <tbody className="divide-y divide-slate-100">
                             {[
                               { label: "Nama Outlet", value: profile.ot_nama, icon: Store },
                               { label: "Nomor Kontak", value: profile.ot_nohp || "-", icon: Phone, isPhone: true },
                               { label: "Tipe Lokasi", value: profile.ot_tipe_lokasi_usaha, icon: MapPin },
                               { label: "Skala Modal", value: profile.ot_modal_usaha, icon: Coins },
                               { label: "Jumlah Pegawai", value: `${profile.ot_jumlah_karyawan} Orang`, icon: Users },
                               { label: "Populasi Mesin", value: `${profile.ot_jumlah_mesin_cuci} Unit`, icon: Layers },
                               { label: "Zona Waktu", value: profile.ot_timezone, icon: Clock },
                             ].map((item, idx) => (
                               <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                                  <td className="px-6 py-4 w-48">
                                     <div className="flex items-center gap-3">
                                        <item.icon className="h-3.5 w-3.5 text-slate-400" />
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</span>
                                     </div>
                                  </td>
                                  <td className="px-6 py-4">
                                     <span className={cn("text-xs font-bold text-slate-900 uppercase tracking-tight", item.isPhone && "text-primary hover:underline cursor-pointer")}>
                                        {item.value || "BELUM DIATUR"}
                                     </span>
                                  </td>
                               </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                 </Card>

                 <Card className="border border-slate-200 bg-white shadow-none overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                       <MapPin className="h-3.5 w-3.5 text-[#FF5F4E]" />
                       <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Legalitas & Alamat Lokasi</p>
                    </div>
                    <div className="p-6 space-y-6">
                       <div className="space-y-1.5">
                          <label className="text-[9px] font-bold uppercase text-slate-400 tracking-widest">Alamat Lengkap</label>
                          <p className="text-sm font-bold text-slate-900 leading-relaxed border-l-2 border-primary/20 pl-4 bg-slate-50/50 py-3 rounded-r-lg">
                             {profile.ot_alamat || "Alamat belum diunggah oleh owner."}
                          </p>
                       </div>
                       
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {[
                            { label: "Kecamatan", value: regionNames.kecamatan || profile.ot_kecamatan },
                            { label: "Kota / Kabupaten", value: regionNames.kota || profile.ot_kota },
                            { label: "Provinsi", value: regionNames.provinsi || profile.ot_provinsi },
                          ].map((loc, i) => (
                            <div key={i} className="p-4 rounded-xl border border-slate-100 bg-white space-y-1 shadow-sm">
                               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{loc.label}</p>
                               <p className="text-xs font-bold text-slate-900 uppercase truncate">{loc.value || "-"}</p>
                            </div>
                          ))}
                       </div>

                       <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                          <Globe className="h-4 w-4 text-blue-500" />
                          <p className="text-[10px] font-bold text-blue-600 uppercase">Kode Area Sistem: <span className="font-mono tracking-tighter">{profile.ot_kecamatan || "00"}.{profile.ot_kota || "00"}.{profile.ot_provinsi || "00"}</span></p>
                       </div>
                    </div>
                 </Card>
              </div>

              {/* Sidebar Info */}
              <div className="space-y-6">
                 <Card className="border border-slate-200 bg-white shadow-none overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                       <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Status Langganan</p>
                    </div>
                    <div className="p-6 space-y-6 text-center">
                       <div className="relative inline-block">
                          <div className={cn(
                            "h-24 w-24 rounded-full flex flex-col items-center justify-center border-4",
                            profile.ot_activated_at ? "border-emerald-100 bg-emerald-50 text-emerald-600" : "border-amber-100 bg-amber-50 text-amber-600"
                          )}>
                             <ShieldCheck className="h-8 w-8 mb-1" />
                             <span className="text-[10px] font-black">{profile.subscription_status}</span>
                          </div>
                          <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center shadow-sm">
                             <BadgeCheck className="h-5 w-5 text-[#FF5F4E]" />
                          </div>
                       </div>
                       
                       <div className="space-y-2">
                          <p className="text-sm font-bold text-slate-900 uppercase tracking-tight">
                             {profile.ot_activated_at ? "Lisensi Permanen" : "Masa Percobaan"}
                          </p>
                          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                             {profile.ot_activated_at 
                               ? `Aktif Sejak ${format(new Date(profile.ot_activated_at), "dd MMM yyyy")}`
                               : `Berakhir Dalam ${daysRemaining} Hari`
                             }
                          </p>
                       </div>

                       <div className="pt-4 border-t border-slate-50">
                          <Button className="w-full h-10 font-bold text-[10px] uppercase tracking-widest gap-2 rounded-xl shadow-none">
                             Ubah Paket Lisensi <ArrowUpRight className="h-4 w-4" />
                          </Button>
                       </div>
                    </div>
                 </Card>

                 <Card className="border border-slate-200 bg-white shadow-none overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                       <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Gambar Outlet</p>
                    </div>
                    <div className="p-4">
                       <div className="aspect-[4/3] rounded-xl border border-slate-200 overflow-hidden bg-slate-50 group cursor-zoom-in">
                          {imageUrl ? (
                             <img src={imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Outlet" />
                          ) : (
                             <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-2">
                                <Building2 className="h-10 w-10 opacity-20" />
                                <span className="text-[9px] font-bold uppercase tracking-widest">Tidak Ada Foto</span>
                             </div>
                          )}
                       </div>
                    </div>
                 </Card>
              </div>
           </div>
        </TabsContent>

        {/* TAB: TRANSAKSI (WITH PAGINATION) */}
        <TabsContent value="transaksi" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
           <Card className="border border-slate-200 bg-white shadow-none overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                 <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Daftar Transaksi Outlet</p>
                 <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400">Hal {pages.transactions}</span>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-7 w-7" 
                      disabled={pages.transactions === 1}
                      onClick={() => setPages(prev => ({ ...prev, transactions: prev.transactions - 1 }))}
                    >
                      <ArrowLeft className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-7 w-7" 
                      disabled={trxHistory.length <= pages.transactions * itemsPerPage}
                      onClick={() => setPages(prev => ({ ...prev, transactions: prev.transactions + 1 }))}
                    >
                      <ArrowUpRight className="h-3 w-3 rotate-45" />
                    </Button>
                 </div>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                    <thead>
                       <tr className="bg-slate-50/30 border-b border-slate-100">
                          <th className="px-6 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider">ID Trx</th>
                          <th className="px-6 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider">Pelanggan</th>
                          <th className="px-6 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider">Nominal</th>
                          <th className="px-6 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider">Status</th>
                          <th className="px-6 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider text-right">Tanggal</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {trxHistory.length > 0 ? trxHistory.slice((pages.transactions - 1) * itemsPerPage, pages.transactions * itemsPerPage).map((trx, i) => (
                          <tr key={i} className="hover:bg-slate-50/30 transition-colors">
                             <td className="px-6 py-4 font-bold text-[11px] text-slate-900 uppercase font-mono">{trx.id}</td>
                             <td className="px-6 py-4 text-xs font-bold text-slate-700">{trx.cust || "-"}</td>
                             <td className="px-6 py-4 text-xs font-bold text-primary">Rp {trx.total?.toLocaleString()}</td>
                             <td className="px-6 py-4">
                                <Badge variant="outline" className={cn(
                                   "text-[8px] px-2 py-0.5 border-none font-bold uppercase",
                                   trx.status === "Selesai" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                                )}>{trx.status}</Badge>
                             </td>
                             <td className="px-6 py-4 text-right text-[10px] font-bold text-slate-400 uppercase">{format(new Date(trx.date), "dd/MM/yyyy HH:mm")}</td>
                          </tr>
                       )) : (
                          <tr><td colSpan={5} className="py-20 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">Data transaksi tidak ditemukan</td></tr>
                       )}
                    </tbody>
                 </table>
              </div>
           </Card>
        </TabsContent>

        {/* TAB: LAYANAN ADD-ON */}
        <TabsContent value="addons" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
           <Card className="border border-slate-200 bg-white shadow-none overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                 <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Riwayat Pembelian Layanan & Fitur</p>
                 <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-7 w-7" 
                      disabled={pages.addons === 1}
                      onClick={() => setPages(prev => ({ ...prev, addons: prev.addons - 1 }))}
                    >
                      <ArrowLeft className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-7 w-7" 
                      disabled={addonHistory.length <= pages.addons * itemsPerPage}
                      onClick={() => setPages(prev => ({ ...prev, addons: prev.addons + 1 }))}
                    >
                      <ArrowUpRight className="h-3 w-3 rotate-45" />
                    </Button>
                 </div>
              </div>
              <div className="divide-y divide-slate-100">
                 {addonHistory.length > 0 ? addonHistory.slice((pages.addons - 1) * itemsPerPage, pages.addons * itemsPerPage).map((ha, i) => (
                    <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50/30 transition-colors">
                       <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                             <Zap className="h-4 w-4" />
                          </div>
                          <div>
                             <p className="text-[12px] font-bold text-slate-900 line-clamp-1">{ha.ha_item_names}</p>
                             <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">ID: {ha.ha_id} • Via {ha.ha_metode_bayar} • {format(new Date(ha.ha_created), "dd/MM/yy HH:mm")}</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-xs font-bold text-slate-900 mb-1">Rp {ha.ha_total?.toLocaleString()}</p>
                          <Badge className={cn(
                             "text-[8px] px-1.5 py-0 border-none font-bold uppercase shadow-none",
                             ha.ha_status === "SUCCESS" ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
                          )}>{ha.ha_status}</Badge>
                       </div>
                    </div>
                 )) : (
                    <div className="p-20 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">Tidak ada riwayat add-on</div>
                 )}
              </div>
           </Card>
        </TabsContent>

        {/* TAB: EKONOMI KOIN */}
        <TabsContent value="koin" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
           <Card className="border border-slate-200 bg-white shadow-none overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                 <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Log Mutasi Koin Lengkap</p>
                 <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-7 w-7" 
                      disabled={pages.koin === 1}
                      onClick={() => setPages(prev => ({ ...prev, koin: prev.koin - 1 }))}
                    >
                      <ArrowLeft className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-7 w-7" 
                      disabled={koinHistory.length <= pages.koin * itemsPerPage}
                      onClick={() => setPages(prev => ({ ...prev, koin: prev.koin + 1 }))}
                    >
                      <ArrowUpRight className="h-3 w-3 rotate-45" />
                    </Button>
                 </div>
              </div>
              <div className="divide-y divide-slate-100">
                 {koinHistory.length > 0 ? koinHistory.slice((pages.koin - 1) * itemsPerPage, pages.koin * itemsPerPage).map((tx, i) => (
                    <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                       <div className="flex items-center gap-3">
                          <div className={cn(
                            "h-9 w-9 rounded-xl flex items-center justify-center border",
                            tx.hk_jenis_transaksi === 'masuk' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                          )}>
                             {tx.hk_jenis_transaksi === 'masuk' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                          </div>
                          <div>
                             <p className="text-[12px] font-bold text-slate-900 uppercase tracking-tight line-clamp-1">{tx.hk_keterangan}</p>
                             <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">{format(new Date(tx.hk_created), "dd MMM yyyy HH:mm")}</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className={cn("text-xs font-bold font-heading", tx.hk_jenis_transaksi === 'masuk' ? "text-emerald-600" : "text-rose-600")}>
                             {tx.hk_jenis_transaksi === 'masuk' ? '+' : '-'}{tx.hk_jumlah} Koin
                          </p>
                          <Badge variant="outline" className="text-[8px] border-none font-bold text-slate-300 uppercase">Settled</Badge>
                       </div>
                    </div>
                 )) : (
                    <div className="p-20 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">Tidak ada log koin</div>
                 )}
              </div>
           </Card>
        </TabsContent>
      </Tabs>
    

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
                disabled={confirming} 
                onClick={() => {
                   setConfirmTarget({ type: 'koin', id: selectedKoin.tk_id, status: 'confirm' });
                   setIsConfirmModalOpen(true);
                }}
                className="flex-1 h-11 rounded-xl font-bold text-[11px] uppercase tracking-wider bg-emerald-500 hover:bg-emerald-600 shadow-md"
              >
                {confirming ? <LoaderIcon className="h-4 w-4 animate-spin" /> : "Konfirmasi Pembayaran"}
              </Button>
              <Button 
                variant="outline" 
                disabled={confirming} 
                onClick={() => handleValidateKoin(selectedKoin.tk_id, "cancel")}
                className="flex-1 h-11 rounded-xl font-bold text-[11px] uppercase tracking-wider text-rose-500 border-slate-200 hover:bg-rose-50"
              >
                Batalkan
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
                 disabled={confirming}
                 onClick={() => {
                    setConfirmTarget({ type: 'addon', id: selectedAddon.ha_id, status: 'confirm' });
                    setIsConfirmModalOpen(true);
                 }}
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

      {/* DOUBLE CONFIRMATION MODAL */}
      <Dialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
         <DialogContent className="max-w-sm p-6 rounded-2xl border-none shadow-2xl">
            <div className="text-center space-y-4">
               <div className="h-14 w-14 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto border border-amber-100">
                  <AlertCircle className="h-8 w-8" />
               </div>
               <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Konfirmasi Ganda Dibutuhkan</h3>
                  <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                     Anda akan menyetujui transaksi senilai <b>Rp {confirmTarget?.type === 'koin' ? selectedKoin?.tk_total?.toLocaleString() : selectedAddon?.ha_total?.toLocaleString()}</b>. 
                     Tindakan ini tidak dapat dibatalkan. Lanjutkan?
                  </p>
               </div>
               <div className="grid grid-cols-2 gap-3 pt-2">
                  <Button 
                    variant="outline" 
                    className="h-10 rounded-xl font-bold text-[10px] uppercase border-slate-200"
                    onClick={() => setIsConfirmModalOpen(false)}
                  >
                     Tidak, Batal
                  </Button>
                  <Button 
                    className="h-10 rounded-xl font-bold text-[10px] uppercase bg-emerald-500 hover:bg-emerald-600"
                    onClick={() => {
                       setIsConfirmModalOpen(false);
                       if (confirmTarget?.type === 'koin') {
                          handleValidateKoin(confirmTarget.id, 'confirm');
                       } else if (confirmTarget?.type === 'addon') {
                          handleValidateAddon(confirmTarget.id, 'confirm');
                       }
                    }}
                  >
                     Ya, Konfirmasi
                  </Button>
               </div>
            </div>
         </DialogContent>
      </Dialog>
    </div>
  );
}
