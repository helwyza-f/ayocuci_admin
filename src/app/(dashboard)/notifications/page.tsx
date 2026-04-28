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
      const matchesSearch =
        log.judul?.toLowerCase().includes(q) ||
        log.pesan?.toLowerCase().includes(q);
      const matchesCategory = category === "ALL" || log.kategori === category;
      const matchesOutlet =
        outlet === "ALL" || log.receiver_names?.includes(outlet);
      const matchesDate =
        !date || isSameDay(new Date(log.created_at), new Date(date));
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
    [logs],
  );

  const fetchDetail = async (log: NotificationLog) => {
    setSelectedLog(log);
    setReceivers([]);
    setLoadingDetail(true);
    try {
      const res = await api.get(`/notifications/logs/${log.id}`);
      if (res.data.status) setReceivers(res.data.data || []);
    } catch {
      toast.error("Gagal memuat detail log");
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
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl bg-orange-50 p-4">
            <Megaphone className="h-7 w-7 text-[#FF4500]" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900">
              Siaran Notifikasi
            </h2>
            <p className="text-sm font-medium text-slate-400">
              Riwayat broadcast dan status baca setiap outlet.
            </p>
          </div>
        </div>
        <Button asChild className="h-11 rounded-xl bg-slate-900 font-black">
          <Link href="/notifications/new">
            <Plus className="mr-2 h-4 w-4" />
            Buat Broadcast
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Promo" value={stats.promo} />
        <StatCard label="Informasi" value={stats.info} />
        <StatCard label="Dibaca" value={stats.read} />
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari judul atau pesan..."
              className="h-11 rounded-xl bg-slate-50 pl-11"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-11 rounded-xl bg-slate-50 xl:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua kategori</SelectItem>
              <SelectItem value="INFO">Informasi</SelectItem>
              <SelectItem value="PROMO">Promo</SelectItem>
              <SelectItem value="SISTEM">Sistem</SelectItem>
            </SelectContent>
          </Select>
          <Select value={outlet} onValueChange={setOutlet}>
            <SelectTrigger className="h-11 rounded-xl bg-slate-50 xl:w-56">
              <Store className="mr-2 h-4 w-4 text-slate-400" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua outlet</SelectItem>
              {tenants.map((tenant) => (
                <SelectItem key={tenant.ot_id} value={tenant.ot_nama}>
                  {tenant.ot_nama}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative">
            <CalendarIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="date"
              className="h-11 rounded-xl border border-slate-100 bg-slate-50 pl-11 pr-4 text-sm font-bold outline-none xl:w-44"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          {(search || category !== "ALL" || outlet !== "ALL" || date) && (
            <Button
              onClick={resetFilters}
              variant="ghost"
              className="h-11 rounded-xl text-rose-500 hover:bg-rose-50"
            >
              <X className="mr-2 h-4 w-4" />
              Reset
            </Button>
          )}
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#FF4500]" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-center">
            <FileText className="mb-3 h-8 w-8 text-slate-300" />
            <p className="font-black text-slate-700">Belum ada riwayat</p>
            <p className="text-sm text-slate-400">
              Broadcast yang terkirim akan muncul di sini.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredLogs.map((log) => {
              const totalTarget = Number(log.total_target) || 0;
              const totalRead = Number(log.total_read) || 0;
              const percent = totalTarget ? (totalRead / totalTarget) * 100 : 0;
              return (
                <div
                  key={log.id}
                  className="grid grid-cols-1 gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-center"
                >
                  <div className="flex min-w-0 gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-[#FF4500]">
                      {log.kategori === "SISTEM" ? (
                        <ShieldAlert className="h-5 w-5" />
                      ) : (
                        <Bell className="h-5 w-5" />
                      )}
                    </div>
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="bg-orange-50 text-[#FF4500]">
                          {log.kategori}
                        </Badge>
                        <span className="text-xs font-bold text-slate-400">
                          {format(new Date(log.created_at), "dd MMM yyyy, HH:mm", {
                            locale: id,
                          })}
                        </span>
                      </div>
                      <h3 className="truncate font-black text-slate-900">
                        {log.judul}
                      </h3>
                      <p className="line-clamp-2 text-sm text-slate-500">
                        {log.pesan}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <InfoPill
                          icon={<Users className="h-3.5 w-3.5" />}
                          text={
                            totalTarget >= tenants.length
                              ? "Seluruh outlet"
                              : log.receiver_names || "Outlet spesifik"
                          }
                        />
                        <InfoPill
                          icon={<MailOpen className="h-3.5 w-3.5" />}
                          text={`${totalRead}/${totalTarget} dibaca`}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 lg:justify-end">
                    <div className="hidden min-w-28 md:block">
                      <div className="mb-2 flex justify-between text-[10px] font-black uppercase text-slate-400">
                        <span>Read</span>
                        <span>{Math.round(percent)}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-slate-900"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                    <Button
                      onClick={() => fetchDetail(log)}
                      variant="outline"
                      className="h-11 rounded-xl font-black"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Detail
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-h-[90vh] overflow-hidden p-0 sm:max-w-4xl">
          <DialogTitle className="sr-only">Detail Pengiriman Pesan</DialogTitle>
          <div className="bg-slate-900 p-7 text-white">
            <Badge className="mb-3 bg-white/10 text-white">
              {selectedLog?.kategori}
            </Badge>
            <h3 className="text-2xl font-black tracking-tight">
              {selectedLog?.judul}
            </h3>
            <p className="mt-2 text-xs font-bold uppercase tracking-widest text-white/40">
              {selectedLog &&
                format(new Date(selectedLog.created_at), "dd MMMM yyyy, HH:mm", {
                  locale: id,
                })}
            </p>
          </div>
          <div className="grid max-h-[65vh] grid-cols-1 gap-6 overflow-y-auto p-7 lg:grid-cols-[320px_minmax(0,1fr)]">
            <div className="space-y-3">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                Isi Pesan
              </p>
              <div className="rounded-2xl bg-slate-50 p-5 text-sm leading-relaxed text-slate-600">
                {selectedLog?.pesan}
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Penerima
                </p>
                <Badge variant="outline">{receivers.length} outlet</Badge>
              </div>
              {loadingDetail ? (
                <div className="flex h-40 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-[#FF4500]" />
                </div>
              ) : (
                <div className="space-y-2">
                  {receivers.map((receiver) => (
                    <div
                      key={receiver.outlet_id}
                      className="flex items-center justify-between rounded-2xl border border-slate-100 p-4"
                    >
                      <div>
                        <p className="font-black text-slate-800">
                          {receiver.outlet_name}
                        </p>
                        <p className="text-xs text-slate-400">
                          {receiver.read_at
                            ? format(new Date(receiver.read_at), "dd MMM yyyy, HH:mm", {
                                locale: id,
                              })
                            : "Belum dibaca"}
                        </p>
                      </div>
                      <Badge
                        className={
                          receiver.status === 1
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-slate-100 text-slate-500"
                        }
                      >
                        {receiver.status === 1 ? "Dibaca" : "Belum"}
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

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="gap-1 p-4">
      <p className="text-xs font-black uppercase tracking-widest text-slate-400">
        {label}
      </p>
      <p className="text-2xl font-black text-slate-900">{value}</p>
    </Card>
  );
}

function InfoPill({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex max-w-72 items-center gap-2 rounded-xl bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-500">
      {icon}
      <span className="truncate">{text}</span>
    </div>
  );
}
