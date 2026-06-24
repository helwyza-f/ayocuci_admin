"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Bell,
  Eye,
  FileText,
  Loader2,
  MailOpen,
  Megaphone,
  Search,
  ShieldAlert,
  Store,
  Users,
  X,
  Send,
  ChevronRight,
  FilterX,
  Sparkles,
  Trash2,
} from "lucide-react";
import { format, isSameDay } from "date-fns";
import { toast } from "sonner";
import { resolveImageVariantUrl } from "@/lib/upload-url";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import api from "@/lib/api-client";
import StatCard from "@/components/modules/dashboard/stat-card";
import { cn } from "@/lib/utils";
import { VisuallyHidden } from "radix-ui";

type NotificationLog = {
  id: string;
  judul: string;
  pesan: string;
  kategori: "INFO" | "PROMO" | "SISTEM" | string;
  image_url?: string;
  created_at: string;
  sender: string;
  total_target: number;
  total_read: number;
  receiver_names?: string;
};

type Tenant = {
  ot_id: string;
  ot_nama: string;
};

type Receiver = {
  outlet_id: string;
  outlet_name: string;
  status: number;
  read_at?: string | null;
};

type PushTokenTrace = {
  outlet_id: string;
  outlet_name: string;
  token?: string | null;
  platform?: string | null;
  app_version?: string | null;
  actor_id?: string | null;
  actor_type?: string | null;
  is_active?: boolean | null;
  last_seen_at?: string | null;
  created_at?: string | null;
};

export default function NotificationsPage() {
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [outlet, setOutlet] = useState("ALL");
  const [date, setDate] = useState("");
  const [source, setSource] = useState<"ALL" | "ADMIN" | "SYSTEM">("ADMIN");

  const [receivers, setReceivers] = useState<Receiver[]>([]);
  const [pushTokens, setPushTokens] = useState<PushTokenTrace[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [selectedLog, setSelectedLog] = useState<NotificationLog | null>(null);
  const [receiverPage, setReceiverPage] = useState(1);
  const receiversPerPage = 10;

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resLogs, resTenants] = await Promise.all([
        api.get("/notifications/logs"),
        api.get("/tenants"),
      ]);
      if (resLogs.data.status) setLogs(resLogs.data.data || []);
      if (resTenants.data.status) setTenants(resTenants.data.data || []);
    } catch {
      toast.error("Gagal memuat riwayat notifikasi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const q = search.toLowerCase();
      const matchesSearch = log.judul?.toLowerCase().includes(q) || log.pesan?.toLowerCase().includes(q);
      const matchesCategory = category === "ALL" || log.kategori === category;
      const matchesOutlet = outlet === "ALL" || log.receiver_names?.includes(outlet);
      const matchesDate = !date || isSameDay(new Date(log.created_at), new Date(date));
      
      const isSystem = log.sender === "SYSTEM";
      const matchesSource = 
        source === "ALL" ? true :
        source === "SYSTEM" ? isSystem :
        !isSystem;

      return matchesSearch && matchesCategory && matchesOutlet && matchesDate && matchesSource;
    });
  }, [logs, search, category, outlet, date, source]);

  const stats = useMemo(
    () => ({
      total: logs.length,
      promo: logs.filter((log) => log.kategori === "PROMO").length,
      info: logs.filter((log) => log.kategori === "INFO").length,
      read: logs.reduce((sum, log) => sum + (Number(log.total_read) || 0), 0),
    }),
    [logs]
  );

  const fetchDetail = async (log: NotificationLog) => {
    setSelectedLog(log);
    setReceivers([]);
    setPushTokens([]);
    setLoadingDetail(true);
    setReceiverPage(1);
    try {
      const [receiverRes, tokenRes] = await Promise.all([
        api.get(`/notifications/logs/${log.id}`),
        api.get(`/notifications/logs/${log.id}/push-tokens`),
      ]);
      if (receiverRes.data.status) setReceivers(receiverRes.data.data || []);
      if (tokenRes.data.status) setPushTokens(tokenRes.data.data || []);
    } catch {
      toast.error("Gagal memuat detail pengiriman");
    } finally {
      setLoadingDetail(false);
    }
  };

  const deactivateToken = async (item: PushTokenTrace) => {
    if (!item.token || !item.outlet_id) return;
    if (!confirm(`Nonaktifkan token push untuk outlet ${item.outlet_name}?`)) return;

    try {
      const res = await api.patch("/notifications/push-tokens/deactivate", {
        outlet_id: item.outlet_id,
        token: item.token,
      });
      if (res.data.status) {
        toast.success("Token push dinonaktifkan");
        setPushTokens((prev) =>
          prev.map((row) =>
            row.outlet_id === item.outlet_id && row.token === item.token
              ? { ...row, is_active: false }
              : row,
          ),
        );
      }
    } catch {
      toast.error("Gagal menonaktifkan token");
    }
  };

  const tokenStats = useMemo(() => {
    const activeTokens = pushTokens.filter((item) => item.token);
    const outletWithoutTokens = new Set(
      pushTokens.filter((item) => !item.token).map((item) => item.outlet_id),
    );
    return {
      total: activeTokens.length,
      missingOutletCount: outletWithoutTokens.size,
    };
  }, [pushTokens]);

  const resetFilters = () => {
    setSearch("");
    setCategory("ALL");
    setOutlet("ALL");
    setDate("");
    setSource("ADMIN");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus siaran ini? Ini juga akan menghapusnya dari riwayat penerima.")) return;
    
    try {
      const res = await api.delete(`/notifications/logs/${id}`);
      if (res.data.status) {
        toast.success("Siaran berhasil dihapus");
        setLogs(prev => prev.filter(l => l.id !== id));
      }
    } catch {
      toast.error("Gagal menghapus siaran");
    }
  };

  return (
    <div className="space-y-6">
      {/* COMMAND BAR HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2 font-heading">
            <Megaphone className="h-5 w-5 text-primary" />
            Pusat Komunikasi
          </h1>
          <p className="text-xs font-medium text-slate-500">
            Siarkan pesan dan pantau status baca di seluruh ekosistem.
          </p>
        </div>

        <div className="flex items-center gap-2">
           <Button asChild size="sm" className="h-8 px-3 font-bold text-[10px] uppercase tracking-wider gap-2 shadow-none">
              <Link href="/notifications/new">
                <Send className="h-3.5 w-3.5" /> Kirim Baru
              </Link>
           </Button>
        </div>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Kampanye Terkirim" value={loading ? "..." : stats.total} icon={Megaphone} />
        <StatCard label="Promo" value={loading ? "..." : stats.promo} icon={Sparkles} />
        <StatCard label="Info" value={loading ? "..." : stats.info} icon={Bell} />
        <StatCard label="Dilihat" value={loading ? "..." : stats.read} icon={MailOpen} />
      </div>

      {/* SOURCE TABS */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setSource("ADMIN")}
          className={cn(
            "px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all",
            source === "ADMIN" ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          Siaran Admin
        </button>
        <button
          onClick={() => setSource("SYSTEM")}
          className={cn(
            "px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all",
            source === "SYSTEM" ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          Log Sistem
        </button>
        <button
          onClick={() => setSource("ALL")}
          className={cn(
            "px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all",
            source === "ALL" ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          Semua Aktivitas
        </button>
      </div>

      {/* FILTER COMMAND BAR */}
      <Card className="p-1 border border-slate-200 rounded-lg bg-white overflow-hidden shadow-none">
        <div className="flex flex-col xl:flex-row xl:items-center gap-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Filter berdasarkan judul atau konten..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 border-none shadow-none focus-visible:ring-0 text-xs font-medium placeholder:text-slate-400"
            />
          </div>
          
          <div className="h-5 w-px bg-slate-100 hidden xl:block" />

          <div className="flex flex-wrap items-center gap-1 p-1 xl:p-0">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-8 font-bold text-[10px] border-none shadow-none focus:ring-0 w-36 gap-2">
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent className="rounded-md">
                <SelectItem value="ALL" className="text-xs font-bold">Semua Kategori</SelectItem>
                <SelectItem value="INFO" className="text-xs font-bold">Informasi</SelectItem>
                <SelectItem value="PROMO" className="text-xs font-bold">Promosi</SelectItem>
                <SelectItem value="SISTEM" className="text-xs font-bold">Peringatan Sistem</SelectItem>
              </SelectContent>
            </Select>

            <div className="h-4 w-px bg-slate-100" />

            <Select value={outlet} onValueChange={setOutlet}>
              <SelectTrigger className="h-8 font-bold text-[10px] border-none shadow-none focus:ring-0 w-44 gap-2">
                <Store className="h-3 w-3 opacity-40" />
                <SelectValue placeholder="Outlet" />
              </SelectTrigger>
              <SelectContent className="rounded-md">
                <SelectItem value="ALL" className="text-xs font-bold">Semua Outlet</SelectItem>
                {tenants.map(t => (
                  <SelectItem key={t.ot_id} value={t.ot_nama} className="text-xs font-bold">{t.ot_nama}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="ghost"
              size="icon"
              onClick={resetFilters}
              className="h-8 w-8 text-slate-400 hover:text-rose-600"
            >
              <FilterX className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </Card>

      {/* BROADCAST LOGS */}
      <Card className="border border-slate-200 rounded-lg overflow-hidden bg-white min-h-[400px] shadow-none">
        {loading ? (
          <div className="p-20 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-24 text-center">
            <FileText className="h-8 w-8 text-slate-200 mx-auto mb-2" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Tidak ada riwayat ditemukan</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredLogs.map((log) => {
              const totalTarget = Number(log.total_target) || 0;
              const totalRead = Number(log.total_read) || 0;
              const percent = totalTarget ? (totalRead / totalTarget) * 100 : 0;
              return (
                <div key={log.id} className="p-4 hover:bg-primary/[0.01] transition-all duration-300 flex flex-col lg:flex-row lg:items-center gap-4 group/item">
                  <div className="flex-1 flex gap-4">
                    <div className="h-10 w-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 group-hover/item:bg-primary/5 group-hover/item:text-primary group-hover/item:border-primary/20 group-hover/item:scale-105 transition-all duration-300">
                      {log.kategori === "SISTEM" ? <ShieldAlert className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1.5">
                       <div className="flex items-center gap-2">
                          <Badge variant="outline" className={cn(
                            "rounded-full px-2 py-0 text-[8px] font-bold uppercase border shadow-none transition-colors",
                            log.kategori === 'SISTEM' ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-orange-50 text-orange-600 border-orange-100"
                          )}>
                             {log.kategori}
                          </Badge>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                             {format(new Date(log.created_at), "dd/MM/yy, HH:mm")}
                          </span>
                       </div>
                       <h3 className="font-bold text-slate-900 text-xs tracking-tight leading-none group-hover/item:text-primary transition-colors">{log.judul}</h3>
                       <p className="text-[11px] text-slate-500 line-clamp-1 font-medium">{log.pesan}</p>
                       <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                             <Users className="h-2.5 w-2.5 opacity-60" />
                             {totalTarget >= tenants.length ? "Global" : "Tersegmen"}
                          </div>
                          <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                             <MailOpen className="h-2.5 w-2.5 opacity-60" />
                             {totalRead}/{totalTarget} <span className="text-[8px] font-medium opacity-50 ml-0.5">Dilihat</span>
                          </div>
                       </div>
                    </div>
                  </div>

                  <div className="lg:w-56 flex items-center gap-4 justify-between lg:justify-end">
                    <div className="flex-1 lg:max-w-24 space-y-1.5">
                       <div className="flex items-center justify-between text-[8px] font-bold uppercase text-slate-400 tracking-widest">
                          <span>Tingkat Baca</span>
                          <span className={cn(percent > 50 ? "text-emerald-500" : "text-slate-500")}>{Math.round(percent)}%</span>
                       </div>
                       <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-primary group-hover/item:bg-primary/80 transition-all duration-500 ease-out" style={{ width: `${percent}%` }} />
                       </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => fetchDetail(log)}
                        className="h-8 px-2 font-bold text-[9px] uppercase text-primary hover:bg-primary/5 gap-1 active:scale-95 transition-all"
                      >
                        Log Audit <ChevronRight className="h-3 w-3 group-hover/item:translate-x-0.5 transition-transform" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(log.id)}
                        className="h-8 w-8 text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-all opacity-0 group-hover/item:opacity-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* AUDIT DIALOG */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="!w-[96vw] !max-w-[96vw] h-[92vh] p-0 overflow-hidden border border-slate-200 rounded-2xl shadow-2xl bg-white animate-in zoom-in-95 duration-200 flex flex-col">
           <VisuallyHidden.Root><DialogTitle>Audit Kampanye</DialogTitle></VisuallyHidden.Root>
           <div className="p-4 border-b border-slate-100 bg-slate-900 text-white flex-shrink-0">
              <Badge className="bg-primary/20 text-primary border-none font-bold text-[8px] uppercase mb-2">{selectedLog?.kategori}</Badge>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold tracking-tight mb-0.5 font-heading">{selectedLog?.judul}</h3>
                  <p className="text-[9px] font-bold text-white/40 uppercase tracking-wider italic">
                    Dikirim: {selectedLog && format(new Date(selectedLog.created_at), "dd/MM/yy, HH:mm")}
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setSelectedLog(null)}
                  className="text-white/40 hover:text-white hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
           </div>
           
            <div className="flex flex-1 overflow-hidden">
              {/* LEFT COLUMN: CONTENT */}
              <div className="w-[450px] flex-shrink-0 p-6 space-y-6 border-r border-slate-100 bg-slate-50/50 overflow-y-auto">
                 <div className="space-y-1.5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Isi Konten</p>
                    <div className="text-[13px] font-medium text-slate-600 leading-relaxed bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm whitespace-pre-wrap">
                        {selectedLog?.pesan}
                    </div>
                 </div>
                 {selectedLog?.image_url && (
                    <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Media Lampiran</p>
                        <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white p-2">
                           <Image
                            src={resolveImageVariantUrl(selectedLog.image_url, {
                              width: 960,
                            })}
                            alt="Notification"
                            width={960}
                            height={540}
                            unoptimized
                            className="h-auto w-full rounded-lg object-contain shadow-inner"
                           />
                        </div>
                    </div>
                 )}
              </div>

              {/* RIGHT COLUMN: DELIVERY STATUS */}
              <div className="flex-1 flex flex-col min-w-0 bg-white">
                 <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white flex-shrink-0">
                    <div className="flex items-center gap-2">
                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status Pengiriman</p>
                       <Badge variant="secondary" className="font-bold text-[9px] px-1.5 py-0 bg-slate-100 text-slate-600 border-none">{receivers.length} Target</Badge>
                       <Badge variant="secondary" className="font-bold text-[9px] px-1.5 py-0 bg-emerald-50 text-emerald-700 border-none">{tokenStats.total} Token Aktif</Badge>
                       <Badge variant="secondary" className="font-bold text-[9px] px-1.5 py-0 bg-amber-50 text-amber-700 border-none">{tokenStats.missingOutletCount} Outlet Tanpa Token</Badge>
                    </div>
                 </div>
                 
                 <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {loadingDetail ? (
                      <div className="h-full flex flex-col items-center justify-center gap-2 text-slate-400 py-20">
                         <Loader2 className="h-6 w-6 animate-spin text-primary" />
                         <p className="text-[10px] font-bold uppercase tracking-tighter">Menyinkronkan statistik...</p>
                      </div>
                    ) : receivers.length === 0 ? (
                      <div className="py-20 text-center">
                         <p className="text-[10px] font-bold text-slate-300 uppercase">Tidak ada data pengiriman</p>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status Penerima</p>
                          </div>
                          <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-3">
                            {receivers.slice((receiverPage - 1) * receiversPerPage, receiverPage * receiversPerPage).map(r => (
                              <div key={r.outlet_id} className="group p-4 rounded-xl border border-slate-100 bg-white flex items-center justify-between text-xs transition-all hover:border-primary/20 hover:shadow-md hover:-translate-y-0.5">
                                <div className="flex items-center gap-3">
                                  <div className={cn(
                                    "h-10 w-10 rounded-lg flex items-center justify-center transition-colors",
                                    r.status === 1 ? "bg-emerald-50 text-emerald-500" : "bg-slate-50 text-slate-300"
                                  )}>
                                    <Store className="h-5 w-5" />
                                  </div>
                                  <div className="space-y-0.5">
                                    <p className="font-bold text-slate-800 text-[13px] group-hover:text-primary transition-colors">{r.outlet_name}</p>
                                    <div className="flex items-center gap-1.5">
                                      <p className="text-[10px] font-medium text-slate-400">
                                        {r.read_at ? format(new Date(r.read_at), "dd MMM, HH:mm") : "Menunggu penerimaan"}
                                      </p>
                                      {r.status === 1 && <span className="h-1 w-1 rounded-full bg-slate-200" />}
                                      {r.status === 1 && (
                                        <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-tighter flex items-center gap-1">
                                          <Eye className="h-2.5 w-2.5" /> Dilihat
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <Badge variant="outline" className={cn(
                                  "rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase border shadow-none transition-all",
                                  r.status === 1 ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-slate-400 border-slate-200"
                                )}>
                                  {r.status === 1 ? "Dibuka" : "Terkirim"}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Trace Token Push Aktif</p>
                          </div>
                          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                            {pushTokens.map((item, index) => (
                              <div
                                key={`${item.outlet_id}-${item.token ?? "missing"}-${index}`}
                                className="rounded-xl border border-slate-100 bg-slate-50 p-4"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="space-y-1">
                                    <p className="text-[13px] font-bold text-slate-900">{item.outlet_name}</p>
                                    <p className="text-[10px] font-medium text-slate-500">
                                      {item.platform || "platform ?"} • {item.app_version || "versi ?"}
                                    </p>
                                  </div>
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "rounded-lg px-2 py-1 text-[9px] font-bold uppercase border-none shadow-none",
                                      item.token ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700",
                                    )}
                                  >
                                    {item.token ? (item.is_active ? "Aktif" : "Nonaktif") : "Tidak Ada Token"}
                                  </Badge>
                                </div>
                                <div className="mt-3 space-y-1.5">
                                  <p className="break-all rounded-lg bg-white px-3 py-2 text-[10px] font-mono text-slate-600 border border-slate-200">
                                    {item.token || "Outlet ini belum punya token push aktif."}
                                  </p>
                                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-500">
                                    <span>Actor: {item.actor_type || "-"} {item.actor_id || "-"}</span>
                                    <span>Last seen: {item.last_seen_at ? format(new Date(item.last_seen_at), "dd MMM yyyy, HH:mm") : "-"}</span>
                                  </div>
                                  {item.token && item.is_active && (
                                    <button
                                      onClick={() => deactivateToken(item)}
                                      className="mt-2 inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-rose-600 hover:bg-rose-100"
                                    >
                                      <X className="h-3 w-3" />
                                      Nonaktifkan
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                 </div>

                 {receivers.length > receiversPerPage && (
                    <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50 flex-shrink-0">
                       <p className="text-[10px] font-bold text-slate-400 uppercase">
                          Halaman {receiverPage} dari {Math.ceil(receivers.length / receiversPerPage)}
                       </p>
                       <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-9 px-6 text-[10px] font-bold bg-white shadow-sm"
                            disabled={receiverPage === 1}
                            onClick={() => setReceiverPage(p => p - 1)}
                          >
                             Sebelumnya
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-9 px-6 text-[10px] font-bold bg-white shadow-sm"
                            disabled={receiverPage === Math.ceil(receivers.length / receiversPerPage)}
                            onClick={() => setReceiverPage(p => p + 1)}
                          >
                             Selanjutnya
                          </Button>
                       </div>
                    </div>
                 )}
              </div>
            </div>
        </DialogContent>
      </Dialog>
    </div>
    
  );
}
