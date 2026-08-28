"use client";

import { useEffect, useState, useMemo, ElementType } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Store,
  ArrowLeft,
  User,
  Mail,
  Gift,
  Calendar,
  Coins,
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
import { TenantTransactionsTab } from "@/components/modules/TenantTransactionsTab";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import PermissionGate from "@/components/shared/permission-gate";

export default function TenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // Real Data State
  const [profile, setProfile] = useState<Tenant | null>(null);
  const [koinHistory, setKoinHistory] = useState<any[]>([]);
  const [topupHistory, setTopupHistory] = useState<any[]>([]);
  const [addonHistory, setAddonHistory] = useState<any[]>([]);
  const [trxHistory, setTrxHistory] = useState<any[]>([]);
  const [staffAccounts, setStaffAccounts] = useState<any[]>([]);
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
  const [isHistoryNameModalOpen, setIsHistoryNameModalOpen] = useState(false);
  const [historyNameData, setHistoryNameData] = useState<any[]>([]);
  const [historyNameLoading, setHistoryNameLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [proofPreviewUrl, setProofPreviewUrl] = useState<string | null>(null);

  // Double Confirmation State
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<{ type: 'koin' | 'addon', id: string, status: 'confirm' | 'cancel' } | null>(null);

  // Inject Koin States
  const [isInjectModalOpen, setIsInjectModalOpen] = useState(false);
  const [injectAmount, setInjectAmount] = useState<number | "">("");
  const [injectReason, setInjectReason] = useState("");
  const [injectMethod, setInjectMethod] = useState<"transfer" | "bonus">("transfer");
  const [injectBukti, setInjectBukti] = useState<File | null>(null);
  const [injectLoading, setInjectLoading] = useState(false);

  // Status Update State
  const [isStatusUpdateModalOpen, setIsStatusUpdateModalOpen] = useState(false);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);

  const API_BASE_URL = "https://api.ayocuci.id";
  const backHref = useMemo(() => {
    const query = searchParams.toString();
    return query ? `/tenants?${query}` : "/tenants";
  }, [searchParams]);

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

  const handleInjectCoin = async () => {
    if (!injectAmount || Number(injectAmount) <= 0) {
      toast.error("Jumlah koin harus lebih dari 0");
      return;
    }
    if (!injectReason.trim()) {
      toast.error("Alasan penambahan koin wajib diisi");
      return;
    }

    setInjectLoading(true);
    try {
      const res = await tenantService.injectCoin(
        params.id as string,
        Number(injectAmount),
        injectReason,
        injectMethod,
        injectBukti || undefined
      );
      if (res.status) {
        toast.success(res.message || "Koin berhasil ditambahkan ke outlet");
        setIsInjectModalOpen(false);
        setInjectAmount("");
        setInjectReason("");
        setInjectMethod("transfer");
        setInjectBukti(null);
        fetchDetail();
      } else {
        toast.error(res.message || "Gagal menambahkan koin");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Terjadi kesalahan sistem");
    } finally {
      setInjectLoading(false);
    }
  };
  const fetchHistoryName = async () => {
    setHistoryNameLoading(true);
    try {
      const res = await api.get(`/tenants/${params.id}/name-history`);
      if (res.data?.status) {
        setHistoryNameData(res.data.data || []);
      }
    } catch (error) {
      toast.error("Gagal mengambil riwayat pergantian nama");
    } finally {
      setHistoryNameLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!profile?.ot_id) return;
    setStatusUpdateLoading(true);
    const newStatus = profile.ot_status === 1 ? 0 : 1;
    try {
      const res = await tenantService.updateStatus(profile.ot_id, newStatus);
      toast.success("Status outlet berhasil diperbarui");
      setIsStatusUpdateModalOpen(false);
      fetchDetail();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Terjadi kesalahan sistem");
    } finally {
      setStatusUpdateLoading(false);
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

  const identityRows = useMemo(() => ([
    { label: "Nama Outlet", value: profile?.ot_nama, icon: Store },
    { label: "Nomor Kontak", value: profile?.ot_nohp || "-", icon: Phone, isPhone: true },
    { label: "Kode Owner", value: `#${profile?.owner_id}`, icon: User, isMono: true },
    { label: "Nama Owner", value: profile?.owner_name, icon: User, isLink: true, href: `/users/${profile?.owner_id}` },
    { label: "Email Owner", value: profile?.owner_email || "-", icon: Mail, isLink: !!profile?.owner_email, href: profile?.owner_email ? `mailto:${profile.owner_email}` : undefined },
    { label: "Sumber Informasi", value: profile?.owner_lead_source || "-", icon: Target },
    { label: "Tipe Lokasi", value: profile?.ot_tipe_lokasi_usaha, icon: MapPin },
    { label: "Skala Modal", value: profile?.ot_modal_usaha, icon: Coins },
    { label: "Jumlah Pegawai", value: `${String(profile?.ot_jumlah_karyawan || "0").replace(/orang/i, "").trim()} Orang`, icon: Users },
    { label: "Populasi Mesin", value: `${String(profile?.ot_jumlah_mesin || "0").replace(/unit/i, "").trim()} Unit`, icon: Layers },
    { label: "Zona Waktu", value: (profile as any)?.ot_timezone, icon: Clock },
    {
      label: "Usia Bisnis",
      value: (() => {
        const rawDate = profile?.ot_tanggal_berjalan;
        if (!rawDate) return "BELUM DIATUR";

        try {
          let baseDate;

          const matchDash = rawDate.match(/^(\d{1,4})[-/](\d{1,4})$/);
          if (matchDash) {
            const p1 = parseInt(matchDash[1]);
            const p2 = parseInt(matchDash[2]);
            const year = p1 > 1000 ? p1 : (p2 > 1000 ? p2 : null);
            const month = p1 <= 12 ? p1 : (p2 <= 12 ? p2 : null);

            if (year !== null && month !== null) {
              baseDate = new Date(year, month - 1, 1);
            }
          }

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
                m = indonesianMonths[parts[1]];
                y = parseInt(parts[0]);
                if (m !== undefined && !isNaN(y)) {
                  baseDate = new Date(y, m, 1);
                }
              }
            }
          }

          if (!baseDate || isNaN(baseDate.getTime())) {
            baseDate = new Date(rawDate);
          }

          if (isNaN(baseDate.getTime())) {
            if (profile?.ot_created) {
              baseDate = new Date(profile.ot_created);
            } else {
              return "BELUM DIATUR";
            }
          }

          const now = new Date();
          let years = now.getFullYear() - baseDate.getFullYear();
          let months = now.getMonth() - baseDate.getMonth();
          const days = now.getDate() - baseDate.getDate();

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
        } catch {
          return "BELUM DIATUR";
        }
      })(),
      icon: Calendar
    },
  ] as { label: string; value?: string; icon: ElementType; isPhone?: boolean; isMono?: boolean; isLink?: boolean; href?: string }[]), [profile]);

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
        <Button variant="ghost" onClick={() => router.push(backHref)} size="sm">Kembali ke Daftar</Button>
      </div>
    );

  return (
    <PermissionGate module="tenants" action="read">
      <div className="space-y-6">
      {/* HEADER / ACTION BAR */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3 md:items-center md:gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(backHref)}
            className="h-9 w-9 shrink-0 text-slate-500 border border-slate-200 hover:bg-white active:scale-95 transition-all shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="break-words text-lg font-bold tracking-tight text-slate-900 font-heading uppercase md:text-xl flex items-center gap-2">
                {profile?.ot_nama}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-slate-400 hover:text-primary hover:bg-primary/10"
                  onClick={() => {
                    setIsHistoryNameModalOpen(true);
                    fetchHistoryName();
                  }}
                  title="Lihat Riwayat Nama"
                >
                  <History className="h-3.5 w-3.5" />
                </Button>
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
            <p className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
               ID ENTITAS: <span className="text-slate-600 font-mono">{profile?.ot_id}</span>
               <span className="h-1 w-1 rounded-full bg-slate-200" />
               <span className={cn(profile?.ot_status === 1 ? "text-emerald-500" : "text-rose-500")}>
                  {profile?.ot_status === 1 ? "OPERASIONAL AKTIF" : "NON-AKTIF"}
               </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
           <Link href={`/users/${profile.owner_id}`}>
             <Button variant="outline" size="sm" className="h-9 w-full px-4 font-bold text-[10px] uppercase tracking-wider gap-2 border-slate-200 shadow-sm hover:bg-slate-50 active:scale-95 transition-all sm:w-auto">
                <User className="h-3.5 w-3.5" /> Profil Owner
             </Button>
           </Link>
           <PermissionGate module="topups" action="confirm">
             <Button 
               variant="outline" 
               size="sm" 
               className="h-9 w-full px-4 font-bold text-[10px] uppercase tracking-wider gap-2 border-amber-200 text-amber-700 bg-amber-50/50 hover:bg-amber-50 hover:text-amber-800 shadow-sm active:scale-95 transition-all sm:w-auto"
               onClick={() => setIsInjectModalOpen(true)}
             >
                <Coins className="h-3.5 w-3.5" /> Tambah Koin
             </Button>
           </PermissionGate>
           <PermissionGate module="tenants" action="suspend">
             <Button 
               variant="outline" 
               size="sm" 
               className={cn(
                 "h-9 w-full px-4 font-bold text-[10px] uppercase tracking-wider gap-2 shadow-sm active:scale-95 transition-all sm:w-auto",
                 profile.ot_status === 1 
                  ? "border-rose-200 text-rose-700 bg-rose-50/50 hover:bg-rose-50 hover:text-rose-800" 
                  : "border-emerald-200 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-50 hover:text-emerald-800"
               )}
               onClick={() => setIsStatusUpdateModalOpen(true)}
             >
                {profile.ot_status === 1 ? (
                  <><ShieldAlert className="h-3.5 w-3.5" /> Nonaktifkan</>
                ) : (
                  <><CheckCircle2 className="h-3.5 w-3.5" /> Aktifkan</>
                )}
             </Button>
           </PermissionGate>
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
        <TabsList className="sticky top-3 z-20 mb-4 flex h-auto w-full flex-nowrap gap-0.5 overflow-x-auto rounded-lg border border-slate-200 bg-white/95 p-0.5 shadow-none backdrop-blur">
          <TabsTrigger value="dashboard" className="h-8 shrink-0 rounded px-4 font-bold text-[10px] uppercase gap-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none">
            <LayoutGrid className="h-3 w-3" /> Dashboard
          </TabsTrigger>
          <TabsTrigger value="identitas" className="h-8 shrink-0 rounded px-4 font-bold text-[10px] uppercase gap-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none">
            <Building2 className="h-3 w-3" /> Identitas
          </TabsTrigger>
          <TabsTrigger value="transaksi" className="h-8 shrink-0 rounded px-4 font-bold text-[10px] uppercase gap-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none">
            <History className="h-3 w-3" /> Transaksi
          </TabsTrigger>
          <PermissionGate module="staff-accounts" action="read">
            <TabsTrigger value="staff" className="h-8 shrink-0 rounded px-4 font-bold text-[10px] uppercase gap-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none">
              <Users className="h-3 w-3" /> Akun Karyawan
            </TabsTrigger>
          </PermissionGate>
          <TabsTrigger value="addons" className="h-8 shrink-0 rounded px-4 font-bold text-[10px] uppercase gap-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none">
            <Zap className="h-3 w-3" /> Layanan Add-on
          </TabsTrigger>
          <TabsTrigger value="koin" className="h-8 shrink-0 rounded px-4 font-bold text-[10px] uppercase gap-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none">
            <Coins className="h-3 w-3" /> Ekonomi Koin
          </TabsTrigger>
          <TabsTrigger value="topups" className="h-8 shrink-0 rounded px-4 font-bold text-[10px] uppercase gap-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none">
            <Receipt className="h-3 w-3" /> Riwayat Top Up
          </TabsTrigger>
          <TabsTrigger value="data-management" className="h-8 shrink-0 rounded px-4 font-bold text-[10px] uppercase gap-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none">
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
                             <div key={i} className="flex flex-col gap-3 bg-white/50 p-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                   <p className="text-xs font-bold text-slate-900 uppercase">{tk.tk_jumlah} Koin • Rp {tk.tk_total?.toLocaleString()}</p>
                                   <p className="text-[10px] text-slate-500 font-medium">{tk.tk_metode_bayar} • {format(new Date(tk.tk_created), "dd/MM/yy HH:mm")}</p>
                                </div>
                                <Button 
                                  size="sm" 
                                  className="h-8 w-full px-4 text-[10px] font-bold uppercase bg-amber-500 hover:bg-amber-600 sm:w-auto"
                                  onClick={() => { setSelectedKoin(tk); setIsKoinModalOpen(true); }}
                                >
                                   Tinjau
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
                             <div key={i} className="flex flex-col gap-3 bg-white/50 p-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                   <p className="text-xs font-bold text-slate-900 uppercase line-clamp-1">{ha.ha_item_names}</p>
                                   <p className="text-[10px] text-slate-500 font-medium">Rp {ha.ha_total?.toLocaleString()} • {format(new Date(ha.ha_created), "dd/MM/yy HH:mm")}</p>
                                </div>
                                <Button 
                                  size="sm" 
                                  className="h-8 w-full px-4 text-[10px] font-bold uppercase bg-orange-500 hover:bg-orange-600 sm:w-auto"
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
                          <div key={i} className="flex flex-col gap-3 px-4 py-3 transition-colors hover:bg-slate-50/50 sm:flex-row sm:items-center sm:justify-between">
                             <div className="min-w-0">
                                <p className="break-all text-xs font-bold text-slate-900">{trx.id}</p>
                                <p className="text-[9px] text-slate-400 font-medium mt-0.5">{trx.cust || 'Tanpa Nama'} · {format(new Date(trx.date), "dd/MM/yy HH:mm")}</p>
                             </div>
                             <div className="text-left sm:text-right">
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
                    <div className="block md:hidden p-4 space-y-3">
                      {identityRows.map((item, idx) => (
                        <div key={idx} className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                          <div className="mb-2 flex items-center gap-2">
                            <item.icon className="h-3.5 w-3.5 text-slate-400" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{item.label}</span>
                          </div>
                          {item.isLink ? (
                            <Link href={item.href!} className="text-sm font-bold uppercase tracking-tight text-primary break-words hover:underline">
                              {item.value || "—"}
                            </Link>
                          ) : (
                            <span className={cn(
                              "block text-sm font-bold uppercase tracking-tight text-slate-900 break-words",
                              item.isPhone && "text-primary",
                              item.isMono && "font-mono text-slate-600"
                            )}>
                              {item.value || "Belum diatur"}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="hidden md:block p-0">
                       <table className="w-full text-left border-collapse">
                          <tbody className="divide-y divide-slate-100">
                             {identityRows.map((item, idx) => (
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
                      onClick={() => router.push(`/tenants/${params.id}/staff-accounts/new`)}
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" /> Tambah
                    </Button>
                  </PermissionGate>
                </div>
              </div>
              <div className="hidden overflow-x-auto md:block">
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
                            <span className="text-[10px] font-bold uppercase text-slate-700">{staff.role_name || "Role belum diatur"}</span>
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
                                  onClick={() => router.push(`/tenants/${params.id}/staff-accounts/${staff.id}`)}
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
              <div className="space-y-3 p-4 md:hidden">
                {staffAccounts.length > 0 ? staffAccounts.map((staff, index) => (
                  <div key={staff.id || index} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-900">{staff.nama || "-"}</p>
                        <p className="break-all text-[11px] font-medium text-slate-500">{staff.email || "-"}</p>
                        <p className="text-[11px] font-mono text-slate-400">{staff.nohp || "-"}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge className="border border-slate-200 bg-white text-[9px] font-extrabold uppercase tracking-wide text-slate-700 shadow-none">
                          {staff.role_name || "Role belum diatur"}
                        </Badge>
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
                        <Badge className={cn(
                          "border shadow-none text-[9px] font-extrabold uppercase tracking-wide",
                          getStaffAccessStatus(staff).className
                        )}>
                          {getStaffAccessStatus(staff).label}
                        </Badge>
                      </div>
                      <div className="space-y-1 rounded-lg border border-slate-100 bg-white p-3">
                        <p className="text-[10px] font-bold uppercase text-slate-400">Status Slot</p>
                        <p className="text-xs font-bold uppercase text-slate-700">
                          {staff.active_until ? format(new Date(staff.active_until), "dd MMM yyyy") : "Slot permanen"}
                        </p>
                        <p className="text-[11px] font-medium text-slate-500">{getStaffAccessStatus(staff).description}</p>
                        <p className="text-[10px] font-medium text-slate-400">
                          Dibuat {staff.created_at ? format(new Date(staff.created_at), "dd/MM/yy") : "-"}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <PermissionGate module="staff-accounts" action="update">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 flex-1 min-w-[120px] text-[10px] font-bold uppercase"
                            onClick={() => router.push(`/tenants/${params.id}/staff-accounts/${staff.id}`)}
                          >
                            Edit
                          </Button>
                        </PermissionGate>
                        <PermissionGate module="staff-accounts" action="delete">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 flex-1 min-w-[120px] border-rose-200 text-[10px] font-bold uppercase text-rose-600 hover:bg-rose-50"
                            onClick={() => handleDeleteStaff(staff)}
                          >
                            Hapus
                          </Button>
                        </PermissionGate>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="py-10 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Belum ada akun karyawan di outlet ini
                  </div>
                )}
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

        {/* TAB: TRANSAKSI (WITH PAGINATION & DATE FILTER) */}
        <TabsContent value="transaksi">
          <TenantTransactionsTab tenantId={params.id as string} />
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
                    <div key={i} className="p-4 flex flex-col gap-4 transition-colors hover:bg-slate-50/30 sm:flex-row sm:items-center sm:justify-between">
                       <div className="flex min-w-0 flex-1 items-start gap-3">
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
                       <div className="grid grid-cols-1 gap-2 text-[11px] sm:flex sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-2">
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
                       <div className="flex flex-col gap-3 sm:min-w-[145px] sm:items-end sm:justify-center">
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
                          <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
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
                              "border-l-[3px] border-l-transparent p-4 transition-all duration-300 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
                              isMasuk ? "hover:bg-emerald-50/20 hover:border-l-emerald-500 cursor-pointer" : "hover:bg-slate-50/30"
                           )}
                        >
                           <div className="flex items-start gap-3">
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
                           <div className="text-left sm:text-right">
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

              <div className="hidden overflow-x-auto md:block">
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
                                          {isActionable ? "Tinjau" : "Detail"} <ArrowUpRight className="h-3 w-3 ml-1" />
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
              <div className="space-y-3 p-4 md:hidden">
                {topupHistory.length > 0 ? topupHistory.slice((pages.topups - 1) * itemsPerPage, pages.topups * itemsPerPage).map((topup, i) => {
                  const statusConfig = getTopupStatusUi(topup.tk_status);
                  const isActionable = isTopupActionable(topup.tk_status);
                  const proofUrl = topup.tk_bukti ? resolveUploadUrl(topup.tk_bukti) : "";

                  return (
                    <div key={topup.tk_id || i} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => { setSelectedKoin(topup); setIsKoinModalOpen(true); }}
                              className="break-all text-left font-mono text-[11px] font-black uppercase text-slate-900 hover:text-primary"
                            >
                              {topup.tk_id || "-"}
                            </button>
                            <p className="mt-1 text-[10px] font-bold uppercase text-slate-500">
                              {topup.tk_created ? format(new Date(topup.tk_created), "dd MMM yyyy HH:mm", { locale: localeId }) : "-"}
                            </p>
                          </div>
                          <Badge variant="outline" className={cn("shrink-0 px-2 py-0.5 text-[8px] font-bold uppercase border transition-colors", statusConfig.className, isActionable && "animate-pulse")}>
                            {statusConfig.label}
                          </Badge>
                        </div>

                        <div className="rounded-lg border border-slate-100 bg-white p-3">
                          <p className="text-[10px] font-bold uppercase text-slate-400">Nominal</p>
                          <p className="mt-1 text-base font-black text-slate-900">Rp {(topup.tk_total || 0).toLocaleString("id-ID")}</p>
                          <p className="text-[10px] font-bold uppercase text-emerald-600">+{(topup.tk_jumlah || 0).toLocaleString("id-ID")} Koin</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {topup.tk_metode_bayar === "bonus" ? (
                            <>
                              <Badge className="border border-purple-100 bg-purple-50 text-[8px] font-bold uppercase text-purple-600 shadow-none">
                                Bonus
                              </Badge>
                              {topup.keterangan && (
                                <span className="text-[10px] font-medium text-slate-500">{topup.keterangan}</span>
                              )}
                            </>
                          ) : (
                            <Badge variant="outline" className="border-slate-100 bg-white text-[8px] font-bold uppercase text-slate-600">
                              {topup.tk_metode_bayar || "-"}
                            </Badge>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {proofUrl ? (
                            <a
                              href={proofUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[10px] font-bold uppercase text-primary"
                            >
                              Bukti <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="inline-flex h-8 items-center rounded-lg border border-slate-100 bg-white px-3 text-[10px] font-bold uppercase text-slate-300">
                              Tidak ada bukti
                            </span>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => { setSelectedKoin(topup); setIsKoinModalOpen(true); }}
                            className="h-8 text-[10px] font-bold uppercase text-primary"
                          >
                            {isActionable ? "Tinjau" : "Detail"} <ArrowUpRight className="ml-1 h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="py-10 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Belum ada riwayat top up
                  </div>
                )}
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
                    setTimeout(() => router.push(backHref), 1200);
                  }}
                />
              </PermissionGate>
            )}
          </div>
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
                {selectedKoin && (
                  <Badge className={cn("text-[8px] font-bold uppercase", getTopupStatusUi(selectedKoin.tk_status).className)}>
                    {getTopupStatusUi(selectedKoin.tk_status).label}
                  </Badge>
                )}
             </div>
             <h3 className="text-lg font-bold text-slate-900 tracking-tight leading-none mb-1 font-heading uppercase">
                Topup {selectedKoin?.tk_jumlah?.toLocaleString()} Koin
             </h3>
             <p className="text-xs font-medium text-slate-500">Permintaan isi ulang saldo dari outlet.</p>
          </div>

          <div className="p-5 space-y-5 bg-slate-50/30">
             {/* Section khusus bonus / inject dari admin */}
             {(selectedKoin?.tk_metode_bayar === 'bonus' || selectedKoin?.tk_metode_bayar === 'inject') ? (
                <div className="space-y-4">
                   <div className="space-y-2">
                      <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Detail Tambahan Koin</label>
                      <div className="p-3 bg-purple-50/50 border border-purple-100 rounded-lg dark:bg-purple-950/10 dark:border-purple-900/30">
                         <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-start gap-2">
                            <Gift className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
                            <span>{selectedKoin.keterangan || "Penambahan koin oleh admin AyoCuci."}</span>
                         </p>
                      </div>
                   </div>
                   {selectedKoin?.tk_bukti && (
                      <div className="space-y-2">
                         <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Lampiran Bukti / Dokumen</label>
                            <button
                               type="button"
                               onClick={() => setProofPreviewUrl(resolveUploadUrl(selectedKoin.tk_bukti))}
                               className="text-[10px] font-bold text-primary flex items-center gap-1 hover:underline"
                            >
                               Lihat Fullscreen <ExternalLink className="h-3 w-3" />
                            </button>
                         </div>
                         <div className="aspect-video rounded-xl border border-slate-200 overflow-hidden bg-slate-200 shadow-inner">
                            <img src={resolveUploadUrl(selectedKoin.tk_bukti)} className="w-full h-full object-cover" alt="Proof" />
                         </div>
                      </div>
                   )}
                </div>
             ) : (
                <div className="space-y-2">
                   <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Bukti Transfer</label>
                      {selectedKoin?.tk_bukti && (
                         <button
                           type="button"
                           onClick={() => setProofPreviewUrl(resolveUploadUrl(selectedKoin.tk_bukti))}
                           className="text-[10px] font-bold text-primary flex items-center gap-1 hover:underline"
                         >
                            Lihat Fullscreen <ExternalLink className="h-3 w-3" />
                         </button>
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

             <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl shadow-inner mt-4 text-[10px] space-y-2">
                <p className="font-bold uppercase text-slate-500 mb-2 border-b border-slate-200 pb-1 flex items-center gap-1">
                   <Clock3 className="h-3 w-3" /> Audit Log
                </p>
                <div className="flex justify-between items-center">
                   <span className="text-slate-500 font-medium">Tagihan Dibuat:</span>
                   <span className="font-bold text-slate-800">
                      {selectedKoin?.tk_created ? format(new Date(selectedKoin.tk_created), "dd MMM yyyy HH:mm") : "-"}
                   </span>
                </div>
                <div className="flex justify-between items-center">
                   <span className="text-slate-500 font-medium">Waktu Upload Bukti:</span>
                   <span className="font-bold text-slate-800">
                      {selectedKoin?.tk_tanggal_upload_bukti ? format(new Date(selectedKoin.tk_tanggal_upload_bukti), "dd MMM yyyy HH:mm") : "-"}
                   </span>
                </div>
                {selectedKoin?.tk_tanggal_validasi && (
                   <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Divalidasi Pada:</span>
                      <span className="font-bold text-emerald-600">
                         {format(new Date(selectedKoin.tk_tanggal_validasi), "dd MMM yyyy HH:mm")}
                      </span>
                   </div>
                )}
                {selectedKoin?.tk_staf_validasi && (
                   <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Divalidasi Oleh:</span>
                      <span className="font-bold text-emerald-600">
                         {selectedKoin.tk_staf_validasi}
                      </span>
                   </div>
                )}
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
                      <button
                        type="button"
                        onClick={() => setProofPreviewUrl(resolveUploadUrl(selectedAddon.ha_bukti))}
                        className="text-[10px] font-bold text-primary flex items-center gap-1 hover:underline"
                      >
                         Lihat Fullscreen <ExternalLink className="h-3 w-3" />
                      </button>
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

      <Dialog open={Boolean(proofPreviewUrl)} onOpenChange={(open) => !open && setProofPreviewUrl(null)}>
        <DialogContent className="max-w-5xl p-2 border border-slate-200 rounded-2xl bg-white">
          <VisuallyHidden.Root><DialogTitle>Preview Bukti Pembayaran</DialogTitle></VisuallyHidden.Root>
          {proofPreviewUrl ? (
            <div className="overflow-hidden rounded-xl bg-slate-100">
              <img src={proofPreviewUrl} alt="Preview bukti pembayaran" className="max-h-[85vh] w-full object-contain" />
            </div>
          ) : null}
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

      {/* INJECT COIN DIALOG MODAL */}
      <Dialog open={isInjectModalOpen} onOpenChange={setIsInjectModalOpen}>
         <DialogContent className="max-w-md p-6 rounded-2xl border-none shadow-2xl bg-white">
           <div className="space-y-4">
             <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
               <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                 <Coins className="h-5 w-5" />
               </div>
               <div>
                 <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-tight">Tambah Saldo Koin</h3>
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tambahkan koin langsung untuk penyesuaian saldo</p>
               </div>
             </div>

             <div className="space-y-3 pt-2">
               <div className="space-y-1">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tipe Penambahan</label>
                 <select
                   className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500 focus:bg-white transition-all cursor-pointer"
                   value={injectMethod}
                   onChange={(e) => setInjectMethod(e.target.value as "transfer" | "bonus")}
                 >
                   <option value="transfer">Transfer (Manual diluar aplikasi)</option>
                   <option value="bonus">Bonus (Gratis / Penyesuaian Koin)</option>
                 </select>
               </div>

               <div className="space-y-1">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jumlah Koin</label>
                 <div className="relative">
                   <input
                     type="number"
                     placeholder="Masukkan jumlah koin (contoh: 100)"
                     className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                     value={injectAmount}
                     onChange={(e) => setInjectAmount(e.target.value === "" ? "" : Number(e.target.value))}
                   />
                 </div>
               </div>

               <div className="space-y-1">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Alasan Penambahan</label>
                 <textarea
                   placeholder="Tuliskan alasan penambahan koin (wajib)..."
                   rows={3}
                   className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white transition-all resize-none"
                   value={injectReason}
                   onChange={(e) => setInjectReason(e.target.value)}
                 />
               </div>

               <div className="space-y-1">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bukti Transfer / Dokumen (Opsional)</label>
                 <div className="flex flex-col gap-2">
                   <input
                     type="file"
                     accept="image/*"
                     id="inject-bukti"
                     className="hidden"
                     onChange={(e) => {
                       const file = e.target.files?.[0];
                       if (file) setInjectBukti(file);
                     }}
                   />
                   <label
                     htmlFor="inject-bukti"
                     className="flex items-center justify-center gap-2 w-full h-10 border border-dashed border-slate-300 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 cursor-pointer transition-all"
                   >
                     {injectBukti ? `File: ${injectBukti.name.slice(0, 30)}` : "Pilih Bukti Pembayaran (Gambar)"}
                   </label>
                   {injectBukti && (
                     <button
                       type="button"
                       className="text-[9px] font-black uppercase tracking-wider text-rose-500 hover:underline self-end"
                       onClick={() => setInjectBukti(null)}
                     >
                       Hapus File
                     </button>
                   )}
                 </div>
               </div>
             </div>

             <div className="grid grid-cols-2 gap-3 pt-4">
               <Button
                 variant="outline"
                 className="h-10 rounded-xl font-bold text-[10px] uppercase border-slate-200 text-slate-500 hover:bg-slate-50"
                 onClick={() => {
                   setIsInjectModalOpen(false);
                   setInjectAmount("");
                   setInjectReason("");
                   setInjectMethod("transfer");
                   setInjectBukti(null);
                 }}
                 disabled={injectLoading}
               >
                 Batal
               </Button>
               <Button
                 className="h-10 rounded-xl font-bold text-[10px] uppercase bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/10 active:scale-95 transition-all"
                 onClick={handleInjectCoin}
                 disabled={injectLoading}
               >
                 {injectLoading ? "Mengirim..." : "Tambah Koin"}
               </Button>
             </div>
           </div>
         </DialogContent>
       </Dialog>

       {/* MODAL: RIWAYAT GANTI NAMA */}
       <Dialog open={isHistoryNameModalOpen} onOpenChange={setIsHistoryNameModalOpen}>
         <DialogContent className="max-w-md p-0 overflow-hidden border-none rounded-xl shadow-2xl bg-white">
           <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col gap-1">
             <DialogTitle className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
               <History className="h-4 w-4 text-primary" />
               Riwayat Nama Outlet
             </DialogTitle>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
               Menampilkan log perubahan nama pada outlet ini
             </p>
           </div>
           
           <div className="p-0 max-h-[400px] overflow-y-auto">
             {historyNameLoading ? (
               <div className="flex flex-col items-center justify-center p-8 gap-3">
                 <LoaderIcon className="h-6 w-6 text-primary animate-spin" />
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Memuat Riwayat...</p>
               </div>
             ) : historyNameData.length === 0 ? (
               <div className="flex flex-col items-center justify-center p-8 gap-3 text-center">
                 <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center mb-1">
                   <Store className="h-6 w-6 text-slate-300" />
                 </div>
                 <p className="text-sm font-bold text-slate-700">Belum Ada Riwayat</p>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider max-w-[200px]">
                   Outlet ini belum pernah mengganti nama.
                 </p>
               </div>
             ) : (
               <div className="divide-y divide-slate-50">
                 {historyNameData.map((history, idx) => (
                   <div key={idx} className="p-4 hover:bg-slate-50/50 transition-colors">
                     <div className="flex items-center justify-between mb-3">
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                         {format(new Date(history.created_at), "dd MMM yyyy, HH:mm", { locale: localeId })}
                       </span>
                     </div>
                     <div className="flex items-center gap-3">
                       <div className="flex-1 min-w-0 p-3 rounded-lg bg-slate-50 border border-slate-100">
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nama Sebelumnya</p>
                         <p className="text-sm font-bold text-slate-600 truncate line-through">{history.old_name}</p>
                       </div>
                       <ArrowLeft className="h-4 w-4 text-slate-300 shrink-0 rotate-180" />
                       <div className="flex-1 min-w-0 p-3 rounded-lg bg-primary/5 border border-primary/10">
                         <p className="text-[10px] font-bold text-primary/60 uppercase tracking-wider mb-1">Nama Baru</p>
                         <p className="text-sm font-bold text-primary truncate">{history.new_name}</p>
                       </div>
                     </div>
                     {(history.changed_by || history.changed_by_type) && (
                       <div className="mt-3 flex items-center gap-1.5 justify-end">
                         <User className="h-3 w-3 text-slate-400" />
                         <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                           Diubah oleh: {history.changed_by || "-"} {history.changed_by_type ? `(${history.changed_by_type})` : ""}
                         </span>
                       </div>
                     )}
                   </div>
                 ))}
               </div>
             )}
           </div>
         </DialogContent>
       </Dialog>

      {/* MODAL UPDATE STATUS */}
      <Dialog open={isStatusUpdateModalOpen} onOpenChange={setIsStatusUpdateModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogTitle className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-4 flex items-center gap-2">
            {profile?.ot_status === 1 ? (
              <><ShieldAlert className="h-5 w-5 text-rose-500" /> Nonaktifkan Outlet</>
            ) : (
              <><CheckCircle2 className="h-5 w-5 text-emerald-500" /> Aktifkan Outlet</>
            )}
          </DialogTitle>
          <div className="py-6 space-y-4">
            <p className="text-sm text-slate-600 leading-relaxed text-center">
              {profile?.ot_status === 1 
                ? `Apakah Anda yakin ingin menonaktifkan outlet "${profile?.ot_nama}"? Outlet yang dinonaktifkan tidak akan dapat diakses oleh pegawainya.` 
                : `Apakah Anda yakin ingin mengaktifkan kembali outlet "${profile?.ot_nama}"?`}
            </p>
          </div>
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={() => setIsStatusUpdateModalOpen(false)}
              disabled={statusUpdateLoading}
              className="w-full sm:w-auto h-10 font-bold uppercase text-[10px] tracking-wider"
            >
              Batal
            </Button>
            <Button
              onClick={handleUpdateStatus}
              disabled={statusUpdateLoading}
              className={cn(
                "w-full sm:w-auto h-10 font-bold uppercase text-[10px] tracking-wider",
                profile?.ot_status === 1 
                  ? "bg-rose-500 hover:bg-rose-600 text-white" 
                  : "bg-emerald-500 hover:bg-emerald-600 text-white"
              )}
            >
              {statusUpdateLoading ? (
                <LoaderIcon className="h-4 w-4 animate-spin" />
              ) : (
                profile?.ot_status === 1 ? "Ya, Nonaktifkan" : "Ya, Aktifkan"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </PermissionGate>
  );
}
