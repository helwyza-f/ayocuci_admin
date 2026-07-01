"use client";

import { useEffect, useState, useMemo, ElementType } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Store,
  ArrowLeft,
  User,
  Mail,
  Gift,
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
  Target,
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
  Loader2 as LoaderIcon,
  Trash2
} from "lucide-react";
import { tenantService } from "@/services/tenant.service";
import { addonService } from "@/services/addon.service";
import { topupService } from "@/services/topup.service";
import { economyService } from "@/services/economy.service";
import api from "@/lib/api-client";
import { Tenant } from "@/types/tenant";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, differenceInDays } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { getTopupStatusUi, isTopupActionable } from "@/lib/topup-status";
import { resolveImageVariantUrl, resolveUploadUrl } from "@/lib/upload-url";
import StatCard from "@/components/modules/dashboard/stat-card";
import { ResetDataForm } from "@/components/modules/ResetDataForm";
import { ResetHistoryTable } from "@/components/modules/ResetHistoryTable";
import { DeleteTenantAction } from "@/components/modules/DeleteTenantAction";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import PermissionGate from "@/components/shared/permission-gate";

interface StaffRoleOption {
  id: string;
  nama: string;
}

interface StaffAccountForm {
  nama: string;
  email: string;
  nohp: string;
  role_id: string;
  password: string;
  status: number;
}

export default function TenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // Real Data State
  const [profile, setProfile] = useState<Tenant | null>(null);
  const [koinHistory, setKoinHistory] = useState<any[]>([]);
  const [topupHistory, setTopupHistory] = useState<any[]>([]);
  const [addonHistory, setAddonHistory] = useState<any[]>([]);
  const [trxHistory, setTrxHistory] = useState<any[]>([]);
  const [staffAccounts, setStaffAccounts] = useState<any[]>([]);
  const [staffRoles, setStaffRoles] = useState<StaffRoleOption[]>([]);
  const [metrics, setMetrics] = useState<any>({
    today_orders: 0,
    today_revenue: 0,
    total_orders: 0,
    total_revenue: 0,
    active_staff: 0
  });

  const [pricePerCoin, setPricePerCoin] = useState(100);

  const [regionNames, setRegionNames] = useState({ provinsi: "", kota: "", kecamatan: "" });

  // Pagination States
  const [pages, setPages] = useState({
    transactions: 1,
    addons: 1,
    koin: 1,
    topups: 1
  });
  const [koinFilter, setKoinFilter] = useState<'all' | 'masuk' | 'keluar'>('all');
  const [isStaffFormOpen, setIsStaffFormOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any | null>(null);
  const [staffSaving, setStaffSaving] = useState(false);
  const [staffForm, setStaffForm] = useState<StaffAccountForm>({
    nama: "",
    email: "",
    nohp: "",
    role_id: "",
    password: "",
    status: 1,
  });

  const filteredKoinHistory = useMemo(() => {
    return koinHistory.filter(tx => {
      if (koinFilter === 'all') return true;
      return tx.hk_jenis_transaksi === koinFilter;
    });
  }, [koinHistory, koinFilter]);

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

  const fetchDetail = async () => {
    try {
      const [res, configRes] = await Promise.all([
        tenantService.getTenantDetail(params.id as string),
        economyService.getConfigs()
      ]);
      
      const configs = configRes.data?.data || [];
      const priceConfig = configs.find((c: any) => c.cfg_key === "price_per_coin");
      if (priceConfig) setPricePerCoin(Number(priceConfig.cfg_value));

      if (res.status && res.data) {
        setProfile(res.data.profile);
        setKoinHistory(res.data.koin_history || []);
        setTopupHistory(res.data.topup_history || []);
        setAddonHistory(res.data.addon_history || []);
        setTrxHistory(res.data.trx_history || []);
        setStaffAccounts(res.data.staff_accounts || []);
        setStaffRoles(res.data.staff_roles || []);
        setMetrics(res.data.metrics || { today_orders: 0, today_revenue: 0, active_staff: 0 });
      }
    } catch (error) {
      toast.error("Gagal memuat detail outlet");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [params.id]);

  useEffect(() => {
    const resolveRegions = async () => {
      try {
        if (profile?.ot_provinsi) {
          const provs = await fetch(`https://ibnux.github.io/data-indonesia/provinsi.json`).then(r => r.json());
          const p = provs.find((x: any) => x.id === profile.ot_provinsi);
          if (p) setRegionNames(prev => ({ ...prev, provinsi: p.nama }));
          
          if (profile?.ot_kota) {
            const cityCode = profile.ot_kota.replace(/\./g, '');
            const kabs = await fetch(`https://ibnux.github.io/data-indonesia/kabupaten/${profile.ot_provinsi}.json`).then(r => r.json());
            const k = kabs.find((x: any) => x.id === cityCode);
            if (k) setRegionNames(prev => ({ ...prev, kota: k.nama }));
          }

          if (profile?.ot_kecamatan) {
            const cityCode = profile.ot_kota?.replace(/\./g, '');
            const distCode = profile.ot_kecamatan.replace(/\./g, '');
            if (cityCode) {
              const kecs = await fetch(`https://ibnux.github.io/data-indonesia/kecamatan/${cityCode}.json`).then(r => r.json());
              const kec = kecs.find((x: any) => x.id === distCode);
              if (kec) setRegionNames(prev => ({ ...prev, kecamatan: kec.nama }));
            }
          }
        }
      } catch (e) {
        console.error("Region resolve error:", e);
      }
    };

    if (profile) resolveRegions();
  }, [profile]);

  const resetStaffForm = () => {
    setEditingStaff(null);
    setStaffForm({
      nama: "",
      email: "",
      nohp: "",
      role_id: staffRoles[0]?.id || "",
      password: "",
      status: 1,
    });
  };

  const openCreateStaffForm = () => {
    resetStaffForm();
    setIsStaffFormOpen(true);
  };

  const openEditStaffForm = (staff: any) => {
    setEditingStaff(staff);
    setStaffForm({
      nama: staff.nama || "",
      email: staff.email || "",
      nohp: staff.nohp || "",
      role_id: staff.role_id || "",
      password: "",
      status: Number(staff.status) === 1 ? 1 : 0,
    });
    setIsStaffFormOpen(true);
  };

  const handleSaveStaff = async () => {
    if (!profile?.ot_id) return;
    if (!staffForm.nama.trim() || !staffForm.email.trim() || !staffForm.role_id) {
      toast.error("Nama, email, dan role wajib diisi");
      return;
    }
    if (!editingStaff && staffForm.password.trim().length < 6) {
      toast.error("Password minimal 6 karakter");
      return;
    }

    setStaffSaving(true);
    try {
      const payload: Record<string, unknown> = {
        nama: staffForm.nama.trim(),
        email: staffForm.email.trim(),
        nohp: staffForm.nohp.trim(),
        role_id: staffForm.role_id,
        status: staffForm.status,
      };
      if (staffForm.password.trim()) {
        payload.password = staffForm.password.trim();
      }

      if (editingStaff?.id) {
        await api.put(`/tenants/${profile.ot_id}/staff-accounts/${editingStaff.id}`, payload);
        toast.success("Akun karyawan berhasil diperbarui");
      } else {
        await api.post(`/tenants/${profile.ot_id}/staff-accounts`, payload);
        toast.success("Akun karyawan berhasil dibuat");
      }

      setIsStaffFormOpen(false);
      resetStaffForm();
      fetchDetail();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Gagal menyimpan akun karyawan");
    } finally {
      setStaffSaving(false);
    }
  };

  const handleDeleteStaff = async (staff: any) => {
    if (!profile?.ot_id || !staff?.id) return;
    if (!confirm(`Hapus akun karyawan ${staff.nama || staff.id}?`)) return;

    try {
      await api.delete(`/tenants/${profile.ot_id}/staff-accounts/${staff.id}`);
      toast.success("Akun karyawan berhasil dihapus");
      fetchDetail();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Gagal menghapus akun karyawan");
    }
  };

  const getStaffAddonStatus = (staff: any) => {
    if (staff.type !== "addon") {
      return {
        label: "Slot Gratis Bawaan",
        className: "bg-sky-50 text-sky-700 border-sky-200",
      };
    }

    if (!staff.active_until) {
      return {
        label: "Addon Belum Aktif",
        className: "bg-slate-100 text-slate-700 border-slate-200",
      };
    }

    const remainingDays = differenceInDays(new Date(staff.active_until), new Date());
    if (remainingDays < 0) {
      return {
        label: "Addon Expired",
        className: "bg-rose-50 text-rose-700 border-rose-200",
      };
    }
    if (remainingDays <= 7) {
      return {
        label: `Expired ${remainingDays} Hari Lagi`,
        className: "bg-amber-50 text-amber-700 border-amber-200",
      };
    }
    return {
      label: "Addon Aktif",
      className: "bg-violet-50 text-violet-700 border-violet-200",
    };
  };

  const getStaffAccessStatus = (staff: any) => {
    const isActive = Number(staff.status) === 1;

    if (isActive) {
      return {
        label: "Login Aktif",
        className: "bg-emerald-50 text-emerald-700 border-emerald-200",
        description: "Akun bisa login ke aplikasi.",
      };
    }

    if (staff.type === "addon") {
      if (!staff.active_until) {
        return {
          label: "Belum Bisa Login",
          className: "bg-amber-50 text-amber-700 border-amber-200",
          description: "Addon pegawai belum diaktifkan atau belum dibeli.",
        };
      }

      const remainingDays = differenceInDays(new Date(staff.active_until), new Date());
      if (remainingDays < 0) {
        return {
          label: "Addon Habis",
          className: "bg-rose-50 text-rose-700 border-rose-200",
          description: "Masa aktif addon habis, akun tidak bisa login.",
        };
      }

      return {
        label: "Login Nonaktif",
        className: "bg-slate-100 text-slate-700 border-slate-200",
        description: "Akun dinonaktifkan manual walau addon masih tersimpan.",
      };
    }

    return {
      label: "Login Nonaktif",
      className: "bg-slate-100 text-slate-700 border-slate-200",
      description: "Slot gratis tetap ada, tetapi akun pegawai tidak bisa login.",
    };
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
    return resolveImageVariantUrl(profile.ot_gambar, { width: 640 });
  }, [profile]);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[400px] gap-3">
        <Activity className="h-5 w-5 text-primary animate-spin" />
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Memuat data outlet...</p>
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
    <PermissionGate module="tenants" action="read">
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
                {profile?.ot_nama}
              </h1>
              <Badge variant="outline" className={cn(
                "rounded px-2 py-0 text-[8px] font-bold uppercase border shadow-none",
                profile.ot_activated_at ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
              )}>
                {profile.ot_activated_at ? "Aktivasi Permanen" : "Masa Percobaan"}
              </Badge>
              {profile?.subscription_status === "PRO" && (
                <Badge variant="outline" className="rounded px-2 py-0 text-[8px] font-bold uppercase border-orange-100 bg-orange-50 text-orange-600 shadow-none">PRO</Badge>
              )}
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
               ID ENTITAS: <span className="text-slate-600 font-mono">{profile?.ot_id}</span>
               <span className="h-1 w-1 rounded-full bg-slate-200" />
               <span className={cn(profile?.ot_status === 1 ? "text-emerald-500" : "text-rose-500")}>
                  {profile?.ot_status === 1 ? "OPERASIONAL AKTIF" : "NON-AKTIF"}
               </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
           <Link href={`/users/${profile.owner_id}`}>
             <Button variant="outline" size="sm" className="h-9 px-4 font-bold text-[10px] uppercase tracking-wider gap-2 border-slate-200 shadow-sm hover:bg-slate-50 active:scale-95 transition-all">
                <User className="h-3.5 w-3.5" /> Profil Owner
             </Button>
           </Link>
        </div>
      </div>

      {/* CORE METRICS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          label="Saldo Koin" 
           value={`${profile?.ot_koin?.toLocaleString() || "0"}`} 
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
          value={`${metrics.active_staff}/${profile?.ot_max_pegawai_base || "0"}`} 
          icon={Users} 
          className="text-slate-600"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white border border-slate-200 p-0.5 rounded-lg mb-4 flex flex-wrap md:flex-nowrap w-full md:w-fit h-9 shadow-none gap-0.5">
          <TabsTrigger value="dashboard" className="rounded px-5 font-bold text-[10px] uppercase gap-1.5 h-8 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none">
            <LayoutGrid className="h-3 w-3" /> Dashboard
          </TabsTrigger>
          <TabsTrigger value="identitas" className="rounded px-5 font-bold text-[10px] uppercase gap-1.5 h-8 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none">
            <Building2 className="h-3 w-3" /> Identitas
          </TabsTrigger>
          <TabsTrigger value="transaksi" className="rounded px-5 font-bold text-[10px] uppercase gap-1.5 h-8 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none">
            <History className="h-3 w-3" /> Transaksi
          </TabsTrigger>
          <PermissionGate module="staff-accounts" action="read">
            <TabsTrigger value="staff" className="rounded px-5 font-bold text-[10px] uppercase gap-1.5 h-8 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none">
              <Users className="h-3 w-3" /> Akun Karyawan
            </TabsTrigger>
          </PermissionGate>
          <TabsTrigger value="addons" className="rounded px-5 font-bold text-[10px] uppercase gap-1.5 h-8 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none">
            <Zap className="h-3 w-3" /> Layanan Add-on
          </TabsTrigger>
          <TabsTrigger value="koin" className="rounded px-5 font-bold text-[10px] uppercase gap-1.5 h-8 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none">
            <Coins className="h-3 w-3" /> Ekonomi Koin
          </TabsTrigger>
          <TabsTrigger value="topups" className="rounded px-5 font-bold text-[10px] uppercase gap-1.5 h-8 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none">
            <Receipt className="h-3 w-3" /> Riwayat Top Up
          </TabsTrigger>
          <TabsTrigger value="data-management" className="rounded px-5 font-bold text-[10px] uppercase gap-1.5 h-8 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none">
            <Trash2 className="h-3 w-3" /> Reset Data
          </TabsTrigger>
        </TabsList>

        {/* TAB: DASHBOARD */}
        <TabsContent value="dashboard" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
           <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
              <div className="space-y-6">
                 {/* 1. TOPUP VALIDATION HUB (Only if pending) */}
                 {topupHistory.filter(t => isTopupActionable(t.tk_status)).length > 0 && (
                    <Card className="border-2 border-amber-200 bg-amber-50/20 shadow-sm overflow-hidden">
                       <div className="p-4 border-b border-amber-100 bg-amber-100/30 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                             <Coins className="h-4 w-4 text-amber-600" />
                             <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">Antrian Validasi Koin</p>
                          </div>
                          <Badge className="bg-amber-500 text-white border-none text-[8px] font-bold">PENDING</Badge>
                       </div>
                       <div className="divide-y divide-amber-100">
                          {topupHistory.filter(t => isTopupActionable(t.tk_status)).map((tk, i) => (
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
                                   Process
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
                          <div key={i} className="px-4 py-3 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                             <div>
                                <p className="text-xs font-bold text-slate-900">{trx.id}</p>
                                <p className="text-[9px] text-slate-400 font-medium mt-0.5">{trx.cust || 'Tanpa Nama'} · {format(new Date(trx.date), "dd/MM/yy HH:mm")}</p>
                             </div>
                             <div className="text-right">
                                <p className="text-xs font-bold text-slate-900 tabular-nums">Rp {trx.total?.toLocaleString()}</p>
                                <Badge variant="outline" className={cn(
                                  "text-[8px] px-1.5 py-0 border-none font-bold uppercase mt-0.5",
                                  trx.status === "Selesai" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                                )}>{trx.status}</Badge>
                             </div>
                          </div>
                        )) : (
                           <div className="py-10 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">Tidak ada transaksi terbaru</div>
                        )}
                     </div>
                 </Card>
              </div>

              <div className="space-y-4">
                 {/* Owner & Contact */}
                 <Card className="border border-slate-200 bg-white shadow-none overflow-hidden">
                    <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                       <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Kontak Owner</p>
                       <Link href={`/users/${profile.owner_id}`}>
                          <Button variant="ghost" size="sm" className="h-6 px-2 text-[9px] font-bold text-primary gap-1">
                             Profil <ArrowUpRight className="h-3 w-3" />
                          </Button>
                       </Link>
                    </div>
                    <div className="p-4 space-y-3">
                       <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200 shrink-0">
                             <User className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                             <p className="text-xs font-bold text-slate-900 truncate">{profile.owner_name}</p>
                             <p className="text-[10px] text-slate-500 truncate">{profile.owner_email}</p>
                             <p className="text-[10px] text-slate-400 truncate">{profile.owner_lead_source || "Sumber informasi tidak tersedia"}</p>
                          </div>
                       </div>
                       <div className="grid grid-cols-2 gap-2">
                          <a
                             href={`https://wa.me/62${(profile.ot_nohp || '').replace(/^0/, '').replace(/\D/g, '')}`}
                             target="_blank"
                             rel="noreferrer"
                             className={!profile.ot_nohp ? 'pointer-events-none opacity-40' : ''}
                          >
                             <Button className="w-full h-8 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold text-[9px] uppercase gap-1.5 rounded-lg">
                                <Smartphone className="h-3 w-3" /> WA Outlet
                             </Button>
                          </a>
                          <a href={`mailto:${profile.owner_email}`}>
                             <Button variant="outline" className="w-full h-8 font-bold text-[9px] uppercase gap-1.5 border-slate-200 shadow-none rounded-lg">
                                <Mail className="h-3 w-3 text-[#FF5F4E]" /> Email
                             </Button>
                          </a>
                       </div>
                       {profile.ot_nohp && (
                          <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-100 rounded text-[9px]">
                             <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                             <span className="font-mono font-bold text-slate-600">{profile.ot_nohp}</span>
                          </div>
                       )}
                    </div>
                 </Card>

                 {/* Account Status */}
                 <Card className="border border-slate-200 bg-white shadow-none overflow-hidden">
                    <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                       <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Status Akun</p>
                       <Badge className={cn(
                          "text-[8px] font-bold uppercase border-none shadow-none",
                          profile.ot_activated_at ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                       )}>
                          {profile.ot_activated_at ? "Permanen" : "Trial"}
                       </Badge>
                    </div>
                    <div className="divide-y divide-slate-50">
                       {([
                          { label: "Paket", value: profile.subscription_status, className: profile.subscription_status === "PRO" ? "text-orange-500" : "text-slate-700" },
                          { label: "Bergabung", value: format(new Date(profile.ot_created), "dd MMM yyyy"), className: "text-slate-700" },
                          { label: "Aktif Sejak", value: profile.ot_activated_at ? format(new Date(profile.ot_activated_at), "dd MMM yyyy") : "-", className: "text-slate-700" },
                          { label: "Exp. Langganan", value: profile.expiry_date ? format(new Date(profile.expiry_date), "dd MMM yyyy") : "-", className: profile.expiry_date && differenceInDays(new Date(profile.expiry_date), new Date()) < 7 ? "text-rose-500 font-black" : "text-slate-700" },
                          { label: "Sisa Trial", value: !profile.ot_activated_at ? `${daysRemaining} hari` : "-", className: daysRemaining < 5 ? "text-rose-500" : "text-amber-600" },
                       ] as {label: string; value: string; className: string}[]).map((row, i) => (
                          <div key={i} className="px-4 py-2.5 flex items-center justify-between">
                             <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">{row.label}</span>
                             <span className={cn("text-[10px] font-bold uppercase tracking-tight", row.className)}>{row.value}</span>
                          </div>
                       ))}
                    </div>
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
                             {([
                                { label: "Nama Outlet", value: profile?.ot_nama, icon: Store },
                                { label: "Nomor Kontak", value: profile?.ot_nohp || "-", icon: Phone, isPhone: true },
                                { label: "Kode Owner", value: `#${profile?.owner_id}`, icon: User, isMono: true },
                                { label: "Nama Owner", value: profile?.owner_name, icon: User, isLink: true, href: `/users/${profile?.owner_id}` },
                                { label: "Email Owner", value: profile?.owner_email || "-", icon: Mail, isLink: !!profile?.owner_email, href: profile?.owner_email ? `mailto:${profile.owner_email}` : undefined },
                                { label: "Sumber Informasi", value: profile?.owner_lead_source || "-", icon: Target },
                                { label: "Tipe Lokasi", value: profile?.ot_tipe_lokasi_usaha, icon: MapPin },
                                { label: "Skala Modal", value: profile?.ot_modal_usaha, icon: Coins },
                                { label: "Jumlah Pegawai", value: `${String(profile?.ot_jumlah_karyawan || "0").replace(/orang/i, "").trim()} Orang`, icon: Users },
                                { label: "Populasi Mesin", value: `${String(profile?.ot_jumlah_mesin_cuci || "0").replace(/unit/i, "").trim()} Unit`, icon: Layers },
                                { label: "Zona Waktu", value: (profile as any)?.ot_timezone, icon: Clock },
                                {
                                  label: "Usia Bisnis",
                                  value: (() => {
                                    // Usia bisnis = berdasarkan input tanggal berjalan dari nasabah
                                    const rawDate = profile?.ot_tanggal_berjalan;
                                    if (!rawDate) return "BELUM DIATUR";

                                    try {
                                      let baseDate;
                                      
                                      // Coba parse format "MM-YYYY", "YYYY-MM", "MM/YYYY", "YYYY/MM"
                                      const matchDash = rawDate.match(/^(\d{1,4})[-/](\d{1,4})$/);
                                      if (matchDash) {
                                        let p1 = parseInt(matchDash[1]);
                                        let p2 = parseInt(matchDash[2]);
                                        let year = p1 > 1000 ? p1 : (p2 > 1000 ? p2 : null);
                                        let month = p1 <= 12 ? p1 : (p2 <= 12 ? p2 : null);
                                        
                                        if (year !== null && month !== null) {
                                           baseDate = new Date(year, month - 1, 1);
                                        }
                                      } 
                                      
                                      // Coba parse format "Bulan Tahun" e.g. "Maret 2023"
                                      if (!baseDate) {
                                        const indonesianMonths: Record<string, number> = {
                                          "januari": 0, "februari": 1, "maret": 2, "april": 3, "mei": 4, "juni": 5,
                                          "juli": 6, "agustus": 7, "september": 8, "oktober": 9, "november": 10, "desember": 11,
                                          "january": 0, "february": 1, "march": 2, "may": 4, "june": 5, "july": 6, "august": 7, "october": 9, "december": 11
                                        };
                                        const parts = rawDate.toLowerCase().trim().split(/\s+/);
                                        if (parts.length >= 2) {
                                           let m = indonesianMonths[parts[0]];
                                           let y = parseInt(parts[1]);
                                           if (m !== undefined && !isNaN(y)) {
                                              baseDate = new Date(y, m, 1);
                                           } else {
                                              // reverse check "2023 Maret"
                                              m = indonesianMonths[parts[1]];
                                              y = parseInt(parts[0]);
                                              if (m !== undefined && !isNaN(y)) {
                                                 baseDate = new Date(y, m, 1);
                                              }
                                           }
                                        }
                                      }

                                      // Fallback ke native Date parsing
                                      if (!baseDate || isNaN(baseDate.getTime())) {
                                        baseDate = new Date(rawDate);
                                      }

                                      if (isNaN(baseDate.getTime())) {
                                        // Fallback ke ot_created jika seluruh parsing gagal
                                        if (profile?.ot_created) {
                                           baseDate = new Date(profile.ot_created);
                                        } else {
                                           return "BELUM DIATUR";
                                        }
                                      }

                                      const now = new Date();
                                      let years = now.getFullYear() - baseDate.getFullYear();
                                      let months = now.getMonth() - baseDate.getMonth();
                                      let days = now.getDate() - baseDate.getDate();

                                      if (days < 0) {
                                        months -= 1;
                                      }

                                      if (months < 0) {
                                        years -= 1;
                                        months += 12;
                                      }

                                      const partsText = [];
                                      if (years > 0) partsText.push(`${years} TAHUN`);
                                      if (months > 0) partsText.push(`${months} BULAN`);
                                      
                                      return partsText.length > 0 ? partsText.join(" ") : "KURANG DARI 1 BULAN";
                                    } catch (e) {
                                      return "BELUM DIATUR";
                                    }
                                  })(),
                                  icon: Calendar
                                },
                              ] as { label: string; value?: string; icon: ElementType; isPhone?: boolean; isMono?: boolean; isLink?: boolean; href?: string }[]).map((item, idx) => (
                                <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                                   <td className="px-6 py-4 w-48">
                                      <div className="flex items-center gap-3">
                                         <item.icon className="h-3.5 w-3.5 text-slate-400" />
                                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</span>
                                      </div>
                                   </td>
                                   <td className="px-6 py-4">
                                      {item.isLink ? (
                                        <Link href={item.href!} className="text-xs font-bold text-primary uppercase tracking-tight hover:underline">
                                          {item.value || "—"}
                                        </Link>
                                      ) : (
                                        <span className={cn(
                                          "text-xs font-bold text-slate-900 uppercase tracking-tight",
                                          item.isPhone && "text-primary hover:underline cursor-pointer",
                                          item.isMono && "font-mono text-slate-600"
                                        )}>
                                          {item.value || "BELUM DIATUR"}
                                        </span>
                                      )}
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


                    </div>
                 </Card>
              </div>

              {/* Sidebar Info */}
              <div className="space-y-6">
                 <Card className="border border-slate-200 bg-white shadow-none overflow-hidden">
                    <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                       <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Status Langganan</p>
                       <Badge className={cn(
                          "text-[8px] font-bold uppercase border-none shadow-none",
                          profile.ot_activated_at ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600 animate-pulse"
                       )}>
                          {profile.ot_activated_at ? "Aktif" : `Trial – ${daysRemaining}h`}
                       </Badge>
                    </div>
                    <div className="divide-y divide-slate-50">
                       {([
                          { label: "Paket", value: profile.subscription_status, bold: profile.subscription_status === "PRO", warn: false },
                          { label: "Tipe Lisensi", value: profile.ot_activated_at ? "Lisensi Permanen" : "Masa Percobaan", bold: false, warn: false },
                          { label: "Bergabung", value: format(new Date(profile.ot_created), "dd MMM yyyy"), bold: false, warn: false },
                          { label: "Aktif Sejak", value: profile.ot_activated_at ? format(new Date(profile.ot_activated_at), "dd MMM yyyy") : "-", bold: false, warn: false },
                          { label: "Berakhir", value: profile.expiry_date ? format(new Date(profile.expiry_date), "dd MMM yyyy") : "-", bold: false, warn: !!(profile.expiry_date && differenceInDays(new Date(profile.expiry_date), new Date()) < 7) },
                       ] as {label: string; value: string; bold: boolean; warn: boolean}[]).map((row, i) => (
                          <div key={i} className="px-4 py-2.5 flex items-center justify-between">
                             <span className="text-[9px] font-bold uppercase text-slate-400">{row.label}</span>
                             <span className={cn(
                                "text-[10px] font-bold uppercase tracking-tight",
                                row.warn ? "text-rose-500" : row.bold ? "text-orange-500" : "text-slate-700"
                             )}>{row.value || "-"}</span>
                          </div>
                       ))}
                    </div>
                    <div className="p-3 border-t border-slate-50">
                       <Button className="w-full h-9 font-bold text-[10px] uppercase tracking-wider gap-2 shadow-none rounded-lg">
                          Ubah Paket Lisensi <ArrowUpRight className="h-3.5 w-3.5" />
                       </Button>
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

        <PermissionGate module="staff-accounts" action="read">
        <TabsContent value="staff" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
            <Card className="border border-slate-200 bg-white shadow-none overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Akun Karyawan Outlet</p>
                  <p className="mt-1 text-xs font-medium text-slate-500">Status login, tipe slot, dan masa aktif setiap akun pegawai outlet.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="rounded-md border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold uppercase shadow-none">
                    {staffAccounts.length} Akun
                  </Badge>
                  <PermissionGate module="staff-accounts" action="create">
                    <Button
                      size="sm"
                      className="h-8 px-3 text-[10px] font-bold uppercase shadow-none"
                      onClick={openCreateStaffForm}
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" /> Tambah
                    </Button>
                  </PermissionGate>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/30 border-b border-slate-100">
                      <th className="px-6 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider">Karyawan</th>
                      <th className="px-6 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider">Role Outlet</th>
                      <th className="px-6 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider">Tipe</th>
                      <th className="px-6 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider">Status Login</th>
                      <th className="px-6 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider text-right">Status Slot</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {staffAccounts.length > 0 ? staffAccounts.map((staff, index) => (
                      <tr key={staff.id || index} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-slate-900">{staff.nama || "-"}</p>
                            <p className="text-[10px] font-medium text-slate-500">{staff.email || "-"}</p>
                            <p className="text-[10px] font-mono text-slate-400">{staff.nohp || "-"}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5">
                            <Briefcase className="h-3 w-3 text-slate-400" />
                            <span className="text-[10px] font-bold uppercase text-slate-700">{staff.role_name || "Tanpa Role"}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col items-start gap-2">
                            <Badge className={cn(
                              "border shadow-none text-[9px] font-extrabold uppercase tracking-wide",
                              staff.type === "addon"
                                ? "bg-violet-50 text-violet-700 border-violet-200"
                                : "bg-sky-50 text-sky-700 border-sky-200"
                            )}>
                              {staff.type === "addon" ? "Addon Staff" : "Base Staff"}
                            </Badge>
                            <Badge className={cn(
                              "border shadow-none text-[9px] font-extrabold uppercase tracking-wide",
                              getStaffAddonStatus(staff).className
                            )}>
                              {getStaffAddonStatus(staff).label}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <Badge className={cn(
                              "border shadow-none text-[9px] font-extrabold uppercase tracking-wide",
                              getStaffAccessStatus(staff).className
                            )}>
                              {getStaffAccessStatus(staff).label}
                            </Badge>
                            <p className="text-[10px] font-medium text-slate-400">
                              {getStaffAccessStatus(staff).description}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold uppercase text-slate-700">
                              {staff.active_until ? format(new Date(staff.active_until), "dd MMM yyyy") : "Slot permanen"}
                            </p>
                            <p className="text-[9px] font-medium text-slate-400">
                              {staff.type === "addon"
                                ? Number(staff.status) === 1
                                  ? "Addon berbayar aktif"
                                  : !staff.active_until
                                    ? "Addon belum diaktifkan"
                                    : differenceInDays(new Date(staff.active_until), new Date()) < 0
                                      ? "Addon sudah habis"
                                      : "Addon masih tersimpan"
                                : "Slot gratis bawaan outlet"}
                            </p>
                            <p className="text-[9px] font-medium text-slate-400">
                              Dibuat {staff.created_at ? format(new Date(staff.created_at), "dd/MM/yy") : "-"}
                            </p>
                            <div className="flex items-center justify-end gap-1 pt-1">
                              <PermissionGate module="staff-accounts" action="update">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-[9px] font-bold uppercase text-slate-600 hover:bg-slate-100"
                                  onClick={() => openEditStaffForm(staff)}
                                >
                                  Edit
                                </Button>
                              </PermissionGate>
                              <PermissionGate module="staff-accounts" action="delete">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-[9px] font-bold uppercase text-rose-600 hover:bg-rose-50"
                                  onClick={() => handleDeleteStaff(staff)}
                                >
                                  Hapus
                                </Button>
                              </PermissionGate>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="py-20 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                          Belum ada akun karyawan di outlet ini
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card className="border border-slate-200 bg-white shadow-none overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Ringkasan SDM Outlet</p>
              </div>
              <div className="p-4 space-y-3">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Slot Dasar</p>
                  <p className="mt-2 text-2xl font-black text-slate-900">{profile?.ot_max_pegawai_base || 0}</p>
                  <p className="mt-1 text-xs font-medium text-slate-500">Kuota bawaan gratis untuk akun pegawai aktif.</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Pegawai Aktif</p>
                  <p className="mt-2 text-2xl font-black text-emerald-700">{metrics.active_staff || 0}</p>
                  <p className="mt-1 text-xs font-medium text-slate-500">Total akun pegawai dengan status aktif saat ini.</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Addon Staff</p>
                  <p className="mt-2 text-2xl font-black text-violet-700">
                    {staffAccounts.filter((staff) => staff.type === "addon").length}
                  </p>
                  <p className="mt-1 text-xs font-medium text-slate-500">Akun tambahan di luar slot dasar outlet.</p>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
        </PermissionGate>

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
                             <td className="px-6 py-4">
                               <div className="space-y-1">
                                 <p className="text-xs font-bold text-slate-700">{trx.cust || "-"}</p>
                                 <p className="text-[9px] font-medium text-slate-400 uppercase">
                                   {trx.kasir_name || (trx.actor_type === "pegawai" ? "Pegawai" : "User")}
                                 </p>
                               </div>
                             </td>
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
                    <div key={i} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/30 transition-colors">
                       <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={cn(
                             "h-9 w-9 rounded-xl border flex items-center justify-center transition-all",
                             ha.feature_status === "ACTIVE" ? "bg-emerald-50 text-emerald-600 border-emerald-100/80 shadow-sm shadow-emerald-50/50" :
                             ha.feature_status === "EXPIRED" ? "bg-rose-50 text-rose-600 border-rose-100/80 shadow-sm shadow-rose-50/50" :
                             "bg-slate-50 text-slate-400 border-slate-100"
                          )}>
                             <Zap className="h-4 w-4 fill-current" />
                          </div>
                          <div className="min-w-0 flex-1">
                             <p className="text-[12px] font-black text-slate-800 tracking-tight leading-tight line-clamp-1">{ha.ha_item_names}</p>
                             <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                                ID: {ha.ha_id} <span className="text-slate-300 mx-1">•</span> Via {ha.ha_metode_bayar}
                             </p>
                          </div>
                       </div>
                       
                       {/* Lifecycle Dates */}
                       <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px]">
                          <div className="flex flex-col">
                             <span className="text-slate-400 font-bold uppercase tracking-wider text-[8px] mb-0.5">Tanggal Pembelian</span>
                             <span className="font-semibold text-slate-700">
                                {format(new Date(ha.ha_created), "dd/MM/yy HH:mm")}
                             </span>
                          </div>
                          <div className="flex flex-col">
                             <span className="text-slate-400 font-bold uppercase tracking-wider text-[8px] mb-0.5">Tanggal Jatuh Tempo/Expired</span>
                             {ha.ha_berakhir ? (
                                <span className={cn(
                                   "font-semibold",
                                   ha.feature_status === "EXPIRED" ? "text-rose-600 font-bold" : "text-slate-700"
                                )}>
                                   {format(new Date(ha.ha_berakhir), "dd/MM/yy HH:mm")}
                                </span>
                             ) : (
                                <span className={cn(
                                   "font-black",
                                   ha.feature_status === "ACTIVE" ? "text-emerald-600" : "text-slate-400"
                                )}>
                                   {ha.feature_status === "ACTIVE" ? "Permanen (PRO)" : "-"}
                                </span>
                             )}
                          </div>
                       </div>

                       {/* Price and Statuses */}
                       <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 sm:min-w-[145px]">
                          {ha.ha_metode_bayar === "PROMO_FREE" || ha.ha_metode_bayar === "FREE" ? (
                            <div className="flex flex-col items-end">
                              <p className="text-[12px] font-black text-slate-900">Rp 0</p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-end">
                              <p className="text-[12px] font-black text-slate-900">
                                Rp {(ha.ha_total * pricePerCoin).toLocaleString("id-ID")}
                              </p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                                {ha.ha_total.toLocaleString("id-ID")} Koin
                              </p>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5">
                             {/* Transaction Status Badge */}
                             <Badge className={cn(
                                "text-[8px] px-1.5 py-0.5 border font-extrabold uppercase shadow-none tracking-wider",
                                ha.ha_status === "SUCCESS" ? "bg-emerald-50/50 text-emerald-600 border-emerald-100" :
                                ha.ha_status === "PENDING_VALIDATION" ? "bg-amber-50 text-amber-600 border-amber-100 animate-pulse" :
                                "bg-slate-50 text-slate-400 border-slate-100"
                             )}>
                                {ha.ha_status === "PENDING_VALIDATION" ? "VALIDASI" : ha.ha_status}
                             </Badge>
                             {/* Feature status badge */}
                             <Badge className={cn(
                                "text-[8px] px-1.5 py-0.5 border font-extrabold uppercase shadow-none tracking-wider",
                                ha.feature_status === "ACTIVE" ? "bg-emerald-600 text-white border-emerald-600" :
                                ha.feature_status === "EXPIRED" ? "bg-rose-600 text-white border-rose-600" :
                                "bg-slate-500 text-white border-slate-500"
                             )}>
                                {ha.feature_status === "ACTIVE" ? "AKTIF" : ha.feature_status === "EXPIRED" ? "EXPIRED" : "NON-AKTIF"}
                             </Badge>

                             <Button
                               variant="ghost"
                               size="sm"
                               onClick={() => { setSelectedAddon(ha); setIsAddonModalOpen(true); }}
                               className="h-7 px-2 font-bold text-[9px] uppercase tracking-wider text-primary hover:bg-primary/10 transition-colors ml-1"
                             >
                               Detail <ArrowUpRight className="h-3 w-3 ml-1" />
                             </Button>
                          </div>
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
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                 <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Log Mutasi Koin Lengkap</p>
                    
                    <div className="flex items-center gap-1 bg-slate-100/80 p-0.5 rounded-lg border border-slate-200/50 w-fit">
                       <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setKoinFilter('all'); setPages(prev => ({ ...prev, koin: 1 })); }}
                          className={cn(
                             "h-6 px-2.5 text-[9px] font-bold uppercase tracking-tight rounded-md transition-all shadow-none",
                             koinFilter === 'all' ? "bg-white text-slate-800 border border-slate-200/50 shadow-sm" : "text-slate-500 hover:text-slate-700"
                          )}
                       >
                          Semua
                       </Button>
                       <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setKoinFilter('masuk'); setPages(prev => ({ ...prev, koin: 1 })); }}
                          className={cn(
                             "h-6 px-2.5 text-[9px] font-bold uppercase tracking-tight rounded-md transition-all shadow-none",
                             koinFilter === 'masuk' ? "bg-emerald-500 text-white border border-emerald-600/20" : "text-slate-500 hover:text-slate-700"
                          )}
                       >
                          Pemasukan
                       </Button>
                       <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setKoinFilter('keluar'); setPages(prev => ({ ...prev, koin: 1 })); }}
                          className={cn(
                             "h-6 px-2.5 text-[9px] font-bold uppercase tracking-tight rounded-md transition-all shadow-none",
                             koinFilter === 'keluar' ? "bg-rose-500 text-white border border-rose-600/20" : "text-slate-500 hover:text-slate-700"
                          )}
                       >
                          Pengeluaran
                       </Button>
                    </div>
                 </div>
                 
                 <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-slate-400">Hal {pages.koin}</span>
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
                      disabled={filteredKoinHistory.length <= pages.koin * itemsPerPage}
                      onClick={() => setPages(prev => ({ ...prev, koin: prev.koin + 1 }))}
                    >
                      <ArrowUpRight className="h-3 w-3 rotate-45" />
                    </Button>
                 </div>
              </div>
              <div className="divide-y divide-slate-100">
                 {filteredKoinHistory.length > 0 ? filteredKoinHistory.slice((pages.koin - 1) * itemsPerPage, pages.koin * itemsPerPage).map((tx, i) => {
                     const isMasuk = tx.hk_jenis_transaksi === 'masuk';
                     
                     const handleRowClick = () => {
                         if (!isMasuk) return;
                         
                         const tkMatch = tx.hk_keterangan.match(/TK-[A-Z0-9]+/i);
                         if (tkMatch) {
                            router.push(`/topups?search=${encodeURIComponent(tkMatch[0])}`);
                         } else if (tx.hk_id) {
                            router.push(`/topups?search=${encodeURIComponent(tx.hk_id)}`);
                         } else {
                            router.push(`/topups`);
                         }
                      };

                     return (
                        <div 
                           key={i} 
                           onClick={handleRowClick}
                           className={cn(
                              "p-4 flex items-center justify-between transition-all duration-300 border-l-[3px] border-l-transparent",
                              isMasuk ? "hover:bg-emerald-50/20 hover:border-l-emerald-500 cursor-pointer" : "hover:bg-slate-50/30"
                           )}
                        >
                           <div className="flex items-center gap-3">
                              <div className={cn(
                                "h-9 w-9 rounded-xl flex items-center justify-center border shrink-0",
                                isMasuk ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                              )}>
                                 {isMasuk ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                              </div>
                              <div>
                                 <p className="text-[12px] font-bold text-slate-900 uppercase tracking-tight line-clamp-1">{tx.hk_keterangan}</p>
                                 <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter flex items-center gap-2">
                                    <span>{format(new Date(tx.hk_created), "dd MMM yyyy HH:mm")}</span>
                                    {isMasuk && (
                                       <span className="text-[8px] font-bold text-orange-500 lowercase tracking-normal italic normal-case shrink-0">
                                          (click to view source)
                                       </span>
                                    )}
                                 </p>
                              </div>
                           </div>
                           <div className="text-right">
                              <p className={cn("text-xs font-bold font-heading", isMasuk ? "text-emerald-600" : "text-rose-600")}>
                                 {isMasuk ? '+' : '-'}{tx.hk_jumlah} Koin
                              </p>
                              <Badge variant="outline" className="text-[8px] border-none font-bold text-slate-300 uppercase">Settled</Badge>
                           </div>
                        </div>
                     );
                  }) : (
                     <div className="p-20 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">Tidak ada log koin</div>
                 )}
              </div>
           </Card>
        </TabsContent>

        {/* TAB: RIWAYAT TOP UP */}
        <TabsContent value="topups" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
           <Card className="border border-slate-200 bg-white shadow-none overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                 <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Riwayat Top Up Outlet</p>
                    <p className="text-[10px] font-medium text-slate-400">Tanggal, nominal, metode, bukti pembayaran, dan status transaksi.</p>
                 </div>
                 <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-slate-400">Hal {pages.topups}</span>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-7 w-7" 
                      disabled={pages.topups === 1}
                      onClick={() => setPages(prev => ({ ...prev, topups: prev.topups - 1 }))}
                    >
                      <ArrowLeft className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-7 w-7" 
                      disabled={topupHistory.length <= pages.topups * itemsPerPage}
                      onClick={() => setPages(prev => ({ ...prev, topups: prev.topups + 1 }))}
                    >
                      <ArrowUpRight className="h-3 w-3 rotate-45" />
                    </Button>
                 </div>
              </div>

              <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                    <thead>
                       <tr className="bg-slate-50/30 border-b border-slate-100">
                          <th className="px-6 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider">Tanggal & Jam</th>
                          <th className="px-6 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider">ID Top Up</th>
                          <th className="px-6 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider">Nominal</th>
                          <th className="px-6 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider">Metode</th>
                          <th className="px-6 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider">Bukti</th>
                          <th className="px-6 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider text-right">Status</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {topupHistory.length > 0 ? topupHistory.slice((pages.topups - 1) * itemsPerPage, pages.topups * itemsPerPage).map((topup, i) => {
                          const statusConfig = getTopupStatusUi(topup.tk_status);
                          const isActionable = isTopupActionable(topup.tk_status);
                          const proofUrl = topup.tk_bukti
                             ? resolveUploadUrl(topup.tk_bukti)
                             : "";

                          return (
                             <tr key={topup.tk_id || i} className="hover:bg-slate-50/30 transition-colors">
                                <td className="px-6 py-4">
                                   <div className="flex items-center gap-2">
                                      <Clock3 className="h-3.5 w-3.5 text-slate-300" />
                                      <span className="text-[10px] font-bold text-slate-500 uppercase">
                                         {topup.tk_created ? format(new Date(topup.tk_created), "dd MMM yyyy HH:mm", { locale: localeId }) : "-"}
                                      </span>
                                   </div>
                                </td>
                                <td className="px-6 py-4">
                                   <button
                                      type="button"
                                      onClick={() => { setSelectedKoin(topup); setIsKoinModalOpen(true); }}
                                      className="font-mono text-[11px] font-black text-slate-900 hover:text-primary hover:underline uppercase"
                                   >
                                      {topup.tk_id || "-"}
                                   </button>
                                </td>
                                <td className="px-6 py-4">
                                   <div className="space-y-0.5">
                                      <p className="text-xs font-black text-slate-900">Rp {(topup.tk_total || 0).toLocaleString("id-ID")}</p>
                                      <p className="text-[9px] font-bold text-emerald-600 uppercase">+{(topup.tk_jumlah || 0).toLocaleString("id-ID")} Koin</p>
                                   </div>
                                </td>
                                <td className="px-6 py-4">
                                   {topup.tk_metode_bayar === 'bonus' ? (
                                      <div className="flex flex-col gap-1">
                                         <div className="flex items-center gap-1.5 bg-purple-50 px-2.5 py-1.5 rounded-lg border border-purple-100 w-fit group-hover:bg-white group-hover:shadow-sm transition-all dark:bg-purple-950/20 dark:border-purple-900/30">
                                            <Gift className="h-3 w-3 text-purple-500 group-hover:scale-110 transition-transform" />
                                            <span className="font-bold uppercase text-purple-600 tracking-widest text-[8px] dark:text-purple-400">
                                               BONUS
                                            </span>
                                         </div>
                                         {topup.keterangan && (
                                            <span className="text-[8px] font-semibold text-slate-500 italic ml-1 max-w-[120px] truncate" title={topup.keterangan}>
                                               ({topup.keterangan})
                                            </span>
                                         )}
                                      </div>
                                   ) : (
                                      <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-100 text-[8px] font-bold uppercase">
                                         {topup.tk_metode_bayar || "-"}
                                      </Badge>
                                   )}
                                </td>
                                <td className="px-6 py-4">
                                   {proofUrl ? (
                                      <a
                                         href={proofUrl}
                                         target="_blank"
                                         rel="noreferrer"
                                         className="inline-flex items-center gap-1.5 text-[10px] font-bold text-primary hover:underline uppercase"
                                      >
                                         Payment Proof <ExternalLink className="h-3 w-3" />
                                      </a>
                                   ) : (
                                      <span className="text-[10px] font-bold text-slate-300 uppercase">Tidak ada</span>
                                   )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                       <Badge variant="outline" className={cn("text-[8px] px-2 py-0.5 font-bold uppercase border transition-colors", statusConfig.className, isActionable && "animate-pulse")}>
                                          {statusConfig.label}
                                       </Badge>
                                       <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => { setSelectedKoin(topup); setIsKoinModalOpen(true); }}
                                          className="h-7 px-2 font-bold text-[9px] uppercase tracking-wider text-primary hover:bg-primary/10 transition-colors"
                                       >
                                          {isActionable ? "Process" : "Detail"} <ArrowUpRight className="h-3 w-3 ml-1" />
                                       </Button>
                                    </div>
                                 </td>
                             </tr>
                          );
                       }) : (
                          <tr>
                             <td colSpan={6} className="py-20 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                                Belum ada riwayat top up
                             </td>
                          </tr>
                       )}
                    </tbody>
                 </table>
              </div>
           </Card>
        </TabsContent>
        {/* TAB: DATA MANAGEMENT */}
        <TabsContent value="data-management" className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-8">
          {/* Reset Form Section */}
          <div>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Trash2 className="w-6 h-6 text-red-500" />
              Reset Data Operasional
            </h2>
            {profile && (
              <PermissionGate module="tenants" action="reset_data">
                <ResetDataForm 
                  outletId={profile.ot_id} 
                  outletName={profile.ot_nama}
                  onSuccess={() => {
                    toast.success("Reset data berhasil. Halaman akan dimuat ulang.");
                    setTimeout(() => window.location.reload(), 1500);
                  }}
                />
              </PermissionGate>
            )}
          </div>

          {/* Reset History Section */}
          <div>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <History className="w-6 h-6" />
              Riwayat Reset
            </h2>
            {profile && <ResetHistoryTable outletId={profile.ot_id} />}
          </div>

          {/* Delete Outlet Section */}
          <div>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Trash2 className="w-6 h-6 text-rose-500" />
              Hapus Outlet
            </h2>
            {profile && (
              <PermissionGate module="tenants" action="delete">
                <DeleteTenantAction
                  outletId={profile.ot_id}
                  outletName={profile.ot_nama}
                  onDeleted={() => {
                    toast.success("Outlet berhasil dihapus. Anda akan diarahkan ke daftar outlet.");
                    setTimeout(() => router.push("/tenants"), 1200);
                  }}
                />
              </PermissionGate>
            )}
          </div>
        </TabsContent>

      </Tabs>
    

      <Dialog
        open={isStaffFormOpen}
        onOpenChange={(open) => {
          setIsStaffFormOpen(open);
          if (!open) resetStaffForm();
        }}
      >
        <DialogContent className="max-w-2xl overflow-hidden rounded-[28px] border border-slate-200/80 bg-white p-0 shadow-[0_28px_90px_rgba(15,23,42,0.18)]">
          <DialogHeader className="gap-0 border-b border-slate-100 bg-[linear-gradient(180deg,#fff7f2_0%,#ffffff_78%)] px-7 py-6 pr-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
              <ShieldCheck className="h-3.5 w-3.5" />
              Kontrol Akses Pegawai
            </div>
            <DialogTitle className="mt-4 text-[22px] font-black tracking-tight text-slate-900">
              {editingStaff ? "Edit Akun Karyawan" : "Tambah Akun Karyawan"}
            </DialogTitle>
            <DialogDescription className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
              {editingStaff
                ? "Perbarui identitas login, role operasional, status akses, dan reset password pegawai bila diperlukan."
                : "Buat akun pegawai baru yang akan dipakai untuk login ke aplikasi outlet."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 bg-white px-7 py-6">
            <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 md:grid-cols-[minmax(0,1fr)_220px]">
              <div className="space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  Ringkasan Akun
                </p>
                <p className="text-sm font-semibold text-slate-900">
                  {staffForm.nama?.trim() || "Nama pegawai belum diisi"}
                </p>
                <p className="text-xs leading-5 text-slate-500">
                  {editingStaff
                    ? "Perubahan di sini akan langsung memengaruhi akses login pegawai pada outlet ini."
                    : "Pastikan email login, role, dan status akun sesuai kebutuhan operasional outlet."}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                    Status Login
                  </p>
                  <p className={cn(
                    "mt-2 text-sm font-bold",
                    staffForm.status === 1 ? "text-emerald-600" : "text-slate-600"
                  )}>
                    {staffForm.status === 1 ? "Aktif" : "Nonaktif"}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                    Role Outlet
                  </p>
                  <p className="mt-2 truncate text-sm font-bold text-slate-900">
                    {staffRoles.find((role) => role.id === staffForm.role_id)?.nama || "Belum dipilih"}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-5 rounded-3xl border border-slate-200 bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)] p-5">
              <div className="grid gap-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">Nama Karyawan</label>
                <input
                  className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                  value={staffForm.nama}
                  onChange={(e) => setStaffForm((prev) => ({ ...prev, nama: e.target.value }))}
                  placeholder="Nama lengkap"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">Email Login</label>
                  <input
                    className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                    value={staffForm.email}
                    onChange={(e) => setStaffForm((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="pegawai@outlet.com"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">No. HP</label>
                  <input
                    className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                    value={staffForm.nohp}
                    onChange={(e) => setStaffForm((prev) => ({ ...prev, nohp: e.target.value }))}
                    placeholder="08xxxxxxxxxx"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">Role Outlet</label>
                  <select
                    className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                    value={staffForm.role_id}
                    onChange={(e) => setStaffForm((prev) => ({ ...prev, role_id: e.target.value }))}
                  >
                    <option value="">Pilih role</option>
                    {staffRoles.map((role) => (
                      <option key={role.id} value={role.id}>{role.nama}</option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">Status Akun</label>
                  <select
                    className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                    value={String(staffForm.status)}
                    onChange={(e) => setStaffForm((prev) => ({ ...prev, status: Number(e.target.value) }))}
                  >
                    <option value="1">Aktif</option>
                    <option value="0">Nonaktif</option>
                  </select>
                </div>
              </div>
              <div className="grid gap-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
                  {editingStaff ? "Reset Password Baru" : "Password Awal"}
                </label>
                <input
                  type="password"
                  className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                  value={staffForm.password}
                  onChange={(e) => setStaffForm((prev) => ({ ...prev, password: e.target.value }))}
                  placeholder={editingStaff ? "Kosongkan jika tidak diubah" : "Minimal 6 karakter"}
                />
                <p className="text-[11px] leading-5 text-slate-400">
                  {editingStaff
                    ? "Isi hanya jika Anda ingin mengganti password login pegawai ini."
                    : "Password awal akan dipakai pegawai saat pertama kali login."}
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-3 border-t border-slate-100 bg-white/95 px-7 py-5">
            <Button
              variant="outline"
              className="rounded-2xl border-slate-200 px-5"
              onClick={() => {
                setIsStaffFormOpen(false);
                resetStaffForm();
              }}
            >
              Batal
            </Button>
            <Button
              className="rounded-2xl bg-primary px-5 text-white shadow-[0_14px_32px_rgba(234,88,12,0.26)] hover:bg-primary/90"
              disabled={staffSaving}
              onClick={handleSaveStaff}
            >
              {staffSaving ? (
                <>
                  <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : editingStaff ? "Simpan Perubahan" : "Buat Akun"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* KOIN TOPUP VALIDATION MODAL */}
      <Dialog open={isKoinModalOpen} onOpenChange={setIsKoinModalOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-none rounded-xl shadow-2xl bg-white">
          <VisuallyHidden.Root><DialogTitle>Validasi Topup Koin</DialogTitle></VisuallyHidden.Root>
          
          <div className="p-5 border-b border-slate-100 bg-white">
             <div className="flex items-center justify-between mb-4">
                <Badge variant="outline" className="font-bold text-[9px] uppercase tracking-wider text-slate-400 border-slate-200">
                   {selectedKoin?.tk_id}
                </Badge>
                {selectedKoin && (
                  <Badge className={cn("text-[8px] font-bold uppercase", getTopupStatusUi(selectedKoin.tk_status).className)}>
                    {getTopupStatusUi(selectedKoin.tk_status).label}
                  </Badge>
                )}
             </div>
             <h3 className="text-lg font-bold text-slate-900 tracking-tight leading-none mb-1 font-heading uppercase">
                Topup {selectedKoin?.tk_jumlah?.toLocaleString()} Koin
             </h3>
             <p className="text-xs font-medium text-slate-500">Permintaan isi ulang saldo dari tenant.</p>
          </div>

          <div className="p-5 space-y-5 bg-slate-50/30">
             {selectedKoin?.tk_metode_bayar === 'bonus' ? (
                <div className="space-y-2">
                   <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Detail Alokasi Bonus</label>
                   <div className="p-3 bg-purple-50/50 border border-purple-100 rounded-lg dark:bg-purple-950/10 dark:border-purple-900/30">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-start gap-2">
                         <Gift className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
                         <span>{selectedKoin.keterangan || "Alokasi bonus sistem otomatis."}</span>
                      </p>
                   </div>
                </div>
             ) : (
                <div className="space-y-2">
                   <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Bukti Transfer</label>
                      {selectedKoin?.tk_bukti && (
                         <a href={resolveUploadUrl(selectedKoin.tk_bukti)} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-primary flex items-center gap-1 hover:underline">
                            Lihat Fullscreen <ExternalLink className="h-3 w-3" />
                         </a>
                      )}
                   </div>
                   {selectedKoin?.tk_bukti ? (
                      <div className="aspect-video rounded-xl border border-slate-200 overflow-hidden bg-slate-200 shadow-inner">
                         <img src={resolveUploadUrl(selectedKoin.tk_bukti)} className="w-full h-full object-cover" alt="Proof" />
                      </div>
                   ) : (
                      <div className="aspect-video rounded-xl bg-slate-100 border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400">
                         <AlertCircle className="h-8 w-8 mb-2 opacity-20" />
                         <p className="text-[10px] font-bold uppercase tracking-widest">Bukti Belum Diunggah</p>
                      </div>
                   )}
                </div>
             )}

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

          {selectedKoin && isTopupActionable(selectedKoin.tk_status) && (
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
                   onClick={() => handleValidateKoin(selectedKoin.tk_id, "failed")}
                   className="flex-1 h-11 rounded-xl font-bold text-[11px] uppercase tracking-wider text-rose-500 border-slate-200 hover:bg-rose-50"
                 >
                   Batalkan
                 </Button>
              </div>
          )}
          {selectedKoin && !isTopupActionable(selectedKoin.tk_status) && (
             <div className="p-4 bg-white border-t border-slate-100 text-center">
                <p className="text-[9px] font-bold uppercase text-slate-400 tracking-widest italic">
                  Locked: {getTopupStatusUi(selectedKoin.tk_status).label}
                </p>
             </div>
          )}
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
                      <a href={resolveUploadUrl(selectedAddon.ha_bukti)} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-primary flex items-center gap-1 hover:underline">
                         Lihat Fullscreen <ExternalLink className="h-3 w-3" />
                      </a>
                   )}
                </div>
                {selectedAddon?.ha_bukti ? (
                   <div className="aspect-video rounded-xl border border-slate-200 overflow-hidden bg-slate-200 shadow-inner">
                      <img src={resolveUploadUrl(selectedAddon.ha_bukti)} className="w-full h-full object-cover" alt="Proof" />
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
                          handleValidateKoin(confirmTarget.id, 'success');
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
    </PermissionGate>
  );
}
