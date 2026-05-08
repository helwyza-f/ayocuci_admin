"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  Bell,
  Calendar as CalendarIcon,
  Eye,
  FileText,
  Loader2,
  MailOpen,
  Megaphone,
  Plus,
  Search,
  ShieldAlert,
  Store,
  Users,
  X,
  Send,
  ExternalLink,
  ChevronRight,
  FilterX,
  Sparkles,
} from "lucide-react";
import { format, isSameDay } from "date-fns";
import { id } from "date-fns/locale";
import { toast } from "sonner";
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

export default function NotificationsPage() {
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [outlet, setOutlet] = useState("ALL");
  const [date, setDate] = useState("");

  const [selectedLog, setSelectedLog] = useState<NotificationLog | null>(null);
  const [receivers, setReceivers] = useState<Receiver[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

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
      toast.error("Failed to load notification history");
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
      return matchesSearch && matchesCategory && matchesOutlet && matchesDate;
    });
  }, [logs, search, category, outlet, date]);

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
    setLoadingDetail(true);
    try {
      const res = await api.get(`/notifications/logs/${log.id}`);
      if (res.data.status) setReceivers(res.data.data || []);
    } catch {
      toast.error("Failed to fetch delivery details");
    } finally {
      setLoadingDetail(false);
    }
  };

  const resetFilters = () => {
    setSearch("");
    setCategory("ALL");
    setOutlet("ALL");
    setDate("");
  };

  return (
    <div className="space-y-6">
      {/* COMMAND BAR HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2 font-heading">
            <Megaphone className="h-5 w-5 text-primary" />
            Communication Hub
          </h1>
          <p className="text-xs font-medium text-slate-500">
            Broadcast messages and monitor read status across the ecosystem.
          </p>
        </div>

        <div className="flex items-center gap-2">
           <Button asChild size="sm" className="h-8 px-3 font-bold text-[10px] uppercase tracking-wider gap-2 shadow-none">
              <Link href="/notifications/new">
                <Send className="h-3.5 w-3.5" /> Dispatch New
              </Link>
           </Button>
        </div>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Campaigns Sent" value={loading ? "..." : stats.total} icon={Megaphone} />
        <StatCard label="Promo" value={loading ? "..." : stats.promo} icon={Sparkles} />
        <StatCard label="Info" value={loading ? "..." : stats.info} icon={Bell} />
        <StatCard label="Impressions" value={loading ? "..." : stats.read} icon={MailOpen} />
      </div>

      {/* FILTER COMMAND BAR */}
      <Card className="p-1 border border-slate-200 rounded-lg bg-white overflow-hidden shadow-none">
        <div className="flex flex-col xl:flex-row xl:items-center gap-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Filter by title or content..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 border-none shadow-none focus-visible:ring-0 text-xs font-medium placeholder:text-slate-400"
            />
          </div>
          
          <div className="h-5 w-px bg-slate-100 hidden xl:block" />

          <div className="flex flex-wrap items-center gap-1 p-1 xl:p-0">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-8 font-bold text-[10px] border-none shadow-none focus:ring-0 w-36 gap-2">
                <SelectValue placeholder="Categories" />
              </SelectTrigger>
              <SelectContent className="rounded-md">
                <SelectItem value="ALL" className="text-xs font-bold">All Categories</SelectItem>
                <SelectItem value="INFO" className="text-xs font-bold">Information</SelectItem>
                <SelectItem value="PROMO" className="text-xs font-bold">Promotions</SelectItem>
                <SelectItem value="SISTEM" className="text-xs font-bold">System Alerts</SelectItem>
              </SelectContent>
            </Select>

            <div className="h-4 w-px bg-slate-100" />

            <Select value={outlet} onValueChange={setOutlet}>
              <SelectTrigger className="h-8 font-bold text-[10px] border-none shadow-none focus:ring-0 w-44 gap-2">
                <Store className="h-3 w-3 opacity-40" />
                <SelectValue placeholder="Outlets" />
              </SelectTrigger>
              <SelectContent className="rounded-md">
                <SelectItem value="ALL" className="text-xs font-bold">All Outlets</SelectItem>
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
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">No history found</p>
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
                             {totalTarget >= tenants.length ? "Global" : "Segmented"}
                          </div>
                          <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                             <MailOpen className="h-2.5 w-2.5 opacity-60" />
                             {totalRead}/{totalTarget} <span className="text-[8px] font-medium opacity-50 ml-0.5">Impressions</span>
                          </div>
                       </div>
                    </div>
                  </div>

                  <div className="lg:w-56 flex items-center gap-4 justify-between lg:justify-end">
                    <div className="flex-1 lg:max-w-24 space-y-1.5">
                       <div className="flex items-center justify-between text-[8px] font-bold uppercase text-slate-400 tracking-widest">
                          <span>Read Rate</span>
                          <span className={cn(percent > 50 ? "text-emerald-500" : "text-slate-500")}>{Math.round(percent)}%</span>
                       </div>
                       <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-primary group-hover/item:bg-primary/80 transition-all duration-500 ease-out" style={{ width: `${percent}%` }} />
                       </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => fetchDetail(log)}
                      className="h-8 px-2 font-bold text-[9px] uppercase text-primary hover:bg-primary/5 gap-1 active:scale-95 transition-all"
                    >
                      Audit Log <ChevronRight className="h-3 w-3 group-hover/item:translate-x-0.5 transition-transform" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* AUDIT DIALOG */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden border border-slate-200 rounded-lg shadow-xl bg-white">
           <VisuallyHidden.Root><DialogTitle>Campaign Audit</DialogTitle></VisuallyHidden.Root>
           <div className="p-4 border-b border-slate-100 bg-slate-900 text-white">
              <Badge className="bg-primary/20 text-primary border-none font-bold text-[8px] uppercase mb-2">{selectedLog?.kategori}</Badge>
              <h3 className="text-base font-bold tracking-tight mb-0.5 font-heading">{selectedLog?.judul}</h3>
              <p className="text-[9px] font-bold text-white/40 uppercase tracking-wider italic">
                 Dispatched: {selectedLog && format(new Date(selectedLog.created_at), "dd/MM/yy, HH:mm")}
              </p>
           </div>
           
           <div className="grid md:grid-cols-[1fr_1.2fr] gap-0">
              <div className="p-4 space-y-3 border-r border-slate-100 bg-slate-50/30">
                 <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Content</p>
                 <div className="text-xs font-medium text-slate-600 leading-relaxed bg-white p-3 rounded border border-slate-100">
                    {selectedLog?.pesan}
                 </div>
              </div>
              <div className="p-4 space-y-3 max-h-[350px] overflow-y-auto">
                 <div className="flex items-center justify-between sticky top-0 bg-white pb-1.5 z-10">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Delivery Status</p>
                    <Badge variant="outline" className="font-bold text-[8px] px-1 py-0">{receivers.length} Outlets</Badge>
                 </div>
                 {loadingDetail ? (
                   <div className="py-10 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
                 ) : (
                   <div className="space-y-1.5">
                     {receivers.map(r => (
                        <div key={r.outlet_id} className="p-2.5 rounded border border-slate-100 bg-white flex items-center justify-between text-xs transition-colors hover:border-primary/20">
                           <div className="space-y-0.5">
                              <p className="font-bold text-slate-800 text-[11px]">{r.outlet_name}</p>
                              <p className="text-[9px] text-slate-400 italic">
                                 {r.read_at ? format(new Date(r.read_at), "dd/MM, HH:mm") : "Sent"}
                              </p>
                           </div>
                           <Badge variant="outline" className={cn(
                              "rounded px-1 py-0 text-[7px] font-bold uppercase border shadow-none",
                              r.status === 1 ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-slate-400 border-slate-200"
                           )}>
                              {r.status === 1 ? "Read" : "Sent"}
                           </Badge>
                        </div>
                     ))}
                   </div>
                 )}
              </div>
           </div>
        </DialogContent>
      </Dialog>
    </div>
    
  );
}
