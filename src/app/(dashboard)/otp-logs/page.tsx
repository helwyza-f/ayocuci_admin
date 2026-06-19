"use client";

import { useMemo, useState } from "react";
import {
  Calendar,
  ExternalLink,
  FilterX,
  MessageSquareWarning,
  Phone,
  Search,
  ShieldAlert,
  ShieldCheck,
  Store,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import useSWR from "swr";
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
import Pagination from "@/components/shared/pagination";
import TableSkeleton from "@/components/shared/table-skeleton";
import DateRangeFilter, {
  DateRange,
  filterByDateRange,
} from "@/components/shared/date-range-filter";
import { apiFetcher } from "@/lib/fetcher";
import { cn } from "@/lib/utils";
import type { ApiResponse } from "@/types/api";
import type { OtpLog } from "@/types/domain";

const PAGE_SIZE = 25;

const FLOW_LABELS: Record<string, string> = {
  register: "Registrasi",
  forgot_password: "Lupa Password",
  unknown: "Lainnya",
};

const EVENT_LABELS: Record<string, string> = {
  sent: "OTP Terkirim",
  send_failed: "Kirim Gagal",
  verify_success: "Verifikasi Berhasil",
  verify_failed: "Verifikasi Gagal",
};

function formatFlow(flow: string) {
  return FLOW_LABELS[flow] || flow.replaceAll("_", " ");
}

function formatEvent(event: string) {
  return EVENT_LABELS[event] || event.replaceAll("_", " ");
}

function eventBadgeClass(event: string) {
  switch (event) {
    case "sent":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "verify_success":
      return "bg-sky-50 text-sky-700 border-sky-200";
    case "send_failed":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "verify_failed":
      return "bg-amber-50 text-amber-700 border-amber-200";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
}

function normalizeWhatsapp(phone?: string | null) {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("62")) return `https://wa.me/${digits}`;
  if (digits.startsWith("0")) return `https://wa.me/62${digits.slice(1)}`;
  return `https://wa.me/${digits}`;
}

export default function OTPLogsPage() {
  const [search, setSearch] = useState("");
  const [flow, setFlow] = useState("all");
  const [event, setEvent] = useState("all");
  const [page, setPage] = useState(1);
  const [dateRange, setDateRange] = useState<DateRange>({ start: "", end: "" });

  const { data, isLoading } = useSWR<ApiResponse<OtpLog[]>>(
    "/otp-logs?limit=500",
    apiFetcher,
    {
      dedupingInterval: 15_000,
      keepPreviousData: true,
      revalidateOnFocus: true,
    },
  );

  const logs = useMemo(() => data?.data || [], [data]);

  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase();
    const byFilters = logs.filter((item) => {
      const matchesSearch =
        !query ||
        item.phone?.toLowerCase().includes(query) ||
        item.email?.toLowerCase().includes(query) ||
        item.flow?.toLowerCase().includes(query) ||
        item.event?.toLowerCase().includes(query) ||
        item.message?.toLowerCase().includes(query);

      const matchesFlow = flow === "all" || item.flow === flow;
      const matchesEvent = event === "all" || item.event === event;
      return matchesSearch && matchesFlow && matchesEvent;
    });

    return filterByDateRange(byFilters, (item) => item.created_at, dateRange);
  }, [dateRange, event, flow, logs, search]);

  const stats = useMemo(
    () => ({
      total: logs.length,
      sent: logs.filter((item) => item.event === "sent").length,
      failed: logs.filter((item) => item.event === "send_failed").length,
      verified: logs.filter((item) => item.event === "verify_success").length,
    }),
    [logs],
  );

  const totalPages = Math.ceil(filteredLogs.length / PAGE_SIZE);
  const paginatedLogs = filteredLogs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const isFiltered = Boolean(search || flow !== "all" || event !== "all" || dateRange.start || dateRange.end);

  const resetFilters = () => {
    setSearch("");
    setFlow("all");
    setEvent("all");
    setDateRange({ start: "", end: "" });
    setPage(1);
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleFlowChange = (value: string) => {
    setFlow(value);
    setPage(1);
  };

  const handleEventChange = (value: string) => {
    setEvent(value);
    setPage(1);
  };

  const handleDateRange = (value: DateRange) => {
    setDateRange(value);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2 font-heading">
            <MessageSquareWarning className="h-5 w-5 text-primary" />
            Log OTP
          </h1>
          <p className="text-xs font-medium text-slate-500">
            Monitor permintaan OTP Fontte dan hasil verifikasinya untuk kebutuhan support admin.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="h-8 px-3 rounded-md font-bold text-[10px] uppercase tracking-wider text-slate-500 border-slate-200 bg-white shadow-none">
            {filteredLogs.length} Log
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 border border-slate-200 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total</span>
            <Store className="h-4 w-4 text-slate-300" />
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">{isLoading ? "..." : stats.total}</p>
        </Card>
        <Card className="p-4 border border-slate-200 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Terkirim</span>
            <ShieldCheck className="h-4 w-4 text-emerald-300" />
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">{isLoading ? "..." : stats.sent}</p>
        </Card>
        <Card className="p-4 border border-slate-200 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Kirim Gagal</span>
            <XCircle className="h-4 w-4 text-rose-300" />
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">{isLoading ? "..." : stats.failed}</p>
        </Card>
        <Card className="p-4 border border-slate-200 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Verified</span>
            <ShieldAlert className="h-4 w-4 text-sky-300" />
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">{isLoading ? "..." : stats.verified}</p>
        </Card>
      </div>

      <Card className="p-1 border border-slate-200 rounded-lg bg-white overflow-hidden shadow-none">
        <div className="flex flex-col xl:flex-row xl:items-center gap-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Cari no. HP, email, flow, event, atau pesan..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9 h-9 border-none shadow-none focus-visible:ring-0 text-xs font-medium placeholder:text-slate-400"
            />
          </div>

          <div className="h-5 w-px bg-slate-100 hidden xl:block" />

          <div className="flex flex-wrap items-center gap-1 p-1 xl:p-0">
            <Select value={flow} onValueChange={handleFlowChange}>
              <SelectTrigger className="h-8 font-bold text-[10px] border-none shadow-none focus:ring-0 w-36 gap-2">
                <SelectValue placeholder="Flow" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Flow</SelectItem>
                <SelectItem value="register">Registrasi</SelectItem>
                <SelectItem value="forgot_password">Lupa Password</SelectItem>
              </SelectContent>
            </Select>

            <Select value={event} onValueChange={handleEventChange}>
              <SelectTrigger className="h-8 font-bold text-[10px] border-none shadow-none focus:ring-0 w-40 gap-2">
                <SelectValue placeholder="Event" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Event</SelectItem>
                <SelectItem value="sent">OTP Terkirim</SelectItem>
                <SelectItem value="send_failed">Kirim Gagal</SelectItem>
                <SelectItem value="verify_success">Verifikasi Berhasil</SelectItem>
                <SelectItem value="verify_failed">Verifikasi Gagal</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="ghost"
              size="icon"
              onClick={resetFilters}
              className={cn(
                "h-8 w-8 transition-colors",
                isFiltered ? "text-rose-500 hover:text-rose-700 hover:bg-rose-50" : "text-slate-400 hover:text-slate-600",
              )}
            >
              <FilterX className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="h-5 w-px bg-slate-100 hidden xl:block" />
          <DateRangeFilter value={dateRange} onChange={handleDateRange} className="p-1 xl:p-0" />
        </div>
      </Card>

      <Card className="border border-slate-200 rounded-lg overflow-hidden bg-white min-h-[420px] shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider">Kontak</th>
                <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider">Flow</th>
                <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider">Status</th>
                <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider">Kode OTP</th>
                <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider">Pesan Sistem</th>
                <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider text-right">Waktu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <TableSkeleton columns={6} rows={10} />
              ) : paginatedLogs.length > 0 ? (
                paginatedLogs.map((item) => {
                  const waHref = normalizeWhatsapp(item.phone);
                  return (
                    <tr key={item.id} className="hover:bg-primary/[0.02] transition-colors group">
                      <td className="px-5 py-3 align-top">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5 text-primary/70" />
                            <span className="font-bold text-xs text-slate-900">{item.phone || "-"}</span>
                          </div>
                          {item.email ? (
                            <p className="text-[10px] font-medium text-slate-500">{item.email}</p>
                          ) : (
                            <p className="text-[10px] font-medium text-slate-300">Tanpa email</p>
                          )}
                          {waHref ? (
                            <a
                              href={waHref}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-primary hover:text-primary/80"
                            >
                              Hubungi WhatsApp <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-5 py-3 align-top">
                        <div className="space-y-1">
                          <p className="font-bold text-xs text-slate-800">{formatFlow(item.flow)}</p>
                          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{item.provider}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3 align-top">
                        <Badge variant="outline" className={cn("h-7 px-2.5 rounded-md text-[10px] font-bold uppercase tracking-wider border", eventBadgeClass(item.event))}>
                          {formatEvent(item.event)}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 align-top">
                        {item.otp_code ? (
                          <div className="inline-flex items-center rounded-md border border-orange-200 bg-orange-50 px-2.5 py-1.5">
                            <span className="font-mono text-xs font-bold tracking-[0.2em] text-primary">
                              {item.otp_code}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] font-medium text-slate-300">-</span>
                        )}
                      </td>
                      <td className="px-5 py-3 align-top">
                        <p className="text-xs font-medium text-slate-600 leading-5 max-w-[380px]">
                          {item.message || "-"}
                        </p>
                      </td>
                      <td className="px-5 py-3 align-top text-right">
                        <div className="inline-flex flex-col items-end gap-1">
                          <span className="text-[10px] font-bold text-slate-800 tabular-nums">
                            {item.created_at ? format(new Date(item.created_at), "dd/MM/yyyy HH:mm") : "-"}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400">
                            <Calendar className="h-3 w-3" />
                            Log #{item.id}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-24 text-center">
                    <MessageSquareWarning className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
                      Belum ada log OTP
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={filteredLogs.length}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      </Card>
    </div>
  );
}
