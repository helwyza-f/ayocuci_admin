"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Search, Trash2, ShieldAlert, FilterX, Eye, User, CalendarRange, FileText } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import TableSkeleton from "@/components/shared/table-skeleton";
import DateRangeFilter, { DateRange, filterByDateRange } from "@/components/shared/date-range-filter";
import { ExportExcelButton } from "@/components/shared/export-excel-button";
import { apiFetcher } from "@/lib/fetcher";
import { ExcelColumn } from "@/lib/export-excel";
import { ApiResponse } from "@/types/api";
import { AccountDeletion } from "@/types/domain";
import { AccountDeletionRow } from "@/services/account-deletion.service";
import PermissionGate from "@/components/shared/permission-gate";

const REASON_LABELS: Record<string, string> = {
  business_closed: "Usaha tutup",
  switch_app: "Pindah aplikasi",
  privacy_concern: "Privasi / keamanan",
  duplicate_account: "Akun ganda",
  other: "Lainnya",
};

const ACTOR_LABELS: Record<string, string> = {
  user: "Owner",
  admin: "Admin",
};

function getReasonLabel(reason: string) {
  return REASON_LABELS[reason] || reason;
}

function AccountDeletionsContent() {
  const [search, setSearch] = useState("");
  const [actorType, setActorType] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange>({ start: "", end: "" });
  const [selectedRow, setSelectedRow] = useState<AccountDeletionRow | null>(null);

  const { data, isLoading, mutate } = useSWR<ApiResponse<AccountDeletion[]>>(
    "/account-deletions?limit=200",
    apiFetcher,
    {
      dedupingInterval: 2_000,
      keepPreviousData: true,
      revalidateOnFocus: true,
      revalidateIfStale: true,
      revalidateOnReconnect: true,
    },
  );

  const rows = useMemo(() => data?.data || [], [data]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const byText = rows.filter((row) => {
      const matchesActorType = actorType === "all" || row.actor_type === actorType;
      const matchesSearch =
        !q ||
        row.actor_id.toLowerCase().includes(q) ||
        (row.actor_name || "").toLowerCase().includes(q) ||
        row.reason.toLowerCase().includes(q) ||
        (row.reason_detail || "").toLowerCase().includes(q);
      return matchesActorType && matchesSearch;
    });
    return filterByDateRange(byText, (row) => row.created_at, dateRange);
  }, [rows, search, actorType, dateRange]);

  const stats = useMemo(() => {
    return {
      total: rows.length,
      user: rows.filter((r) => r.actor_type === "user").length,
      admin: rows.filter((r) => r.actor_type === "admin").length,
    };
  }, [rows]);

  const exportColumns = useMemo<ExcelColumn[]>(
    () => [
      {
        header: "Waktu",
        key: "created_at",
        width: 22,
        format: (value) => (value ? format(new Date(String(value)), "dd MMM yyyy HH:mm", { locale: id }) : ""),
      },
      {
        header: "Actor Type",
        key: "actor_type",
        width: 14,
        format: (value) => (value === "user" ? "Owner" : value === "admin" ? "Admin" : String(value ?? "")),
      },
      { header: "Actor Name", key: "actor_name", width: 24 },
      { header: "Actor ID", key: "actor_id", width: 24 },
      { header: "Alasan", key: "reason", width: 20, format: (value) => getReasonLabel(String(value ?? "")) },
      { header: "Detail Alasan", key: "reason_detail", width: 48 },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900 font-heading">
            <ShieldAlert className="h-5 w-5 text-primary" />
            Histori Hapus Akun
          </h1>
          <p className="text-xs font-medium text-slate-500">
            Audit trail untuk alasan penghapusan akun owner/admin.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="rounded-md border-slate-200 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Total {stats.total}
          </Badge>
          <Badge variant="outline" className="rounded-md border-slate-200 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Owner {stats.user}
          </Badge>
          <Badge variant="outline" className="rounded-md border-slate-200 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Admin {stats.admin}
          </Badge>
        </div>
      </div>

      <Card className="border border-slate-200 bg-white p-1 shadow-none">
        <div className="flex flex-col gap-2 p-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Cari actor, alasan, atau detail alasan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 border-none pl-9 text-xs shadow-none focus-visible:ring-0"
            />
          </div>
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <DateRangeFilter
              value={dateRange}
              onChange={(range) => setDateRange(range)}
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant={actorType === "all" ? "default" : "outline"}
                size="sm"
                className="h-8 rounded-md px-3 text-[10px] font-bold uppercase tracking-wider"
                onClick={() => setActorType("all")}
              >
                Semua
              </Button>
              <Button
                type="button"
                variant={actorType === "user" ? "default" : "outline"}
                size="sm"
                className="h-8 rounded-md px-3 text-[10px] font-bold uppercase tracking-wider"
                onClick={() => setActorType("user")}
              >
                Owner
              </Button>
              <Button
                type="button"
                variant={actorType === "admin" ? "default" : "outline"}
                size="sm"
                className="h-8 rounded-md px-3 text-[10px] font-bold uppercase tracking-wider"
                onClick={() => setActorType("admin")}
              >
                Admin
              </Button>
              <ExportExcelButton
                data={filtered}
                filename="account_deletions"
                sheetName="Account Deletions"
                columns={exportColumns}
                label="Export Excel"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-400"
                onClick={() => {
                  setSearch("");
                  setActorType("all");
                  setDateRange({ start: "", end: "" });
                  mutate();
                }}
              >
                <FilterX className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden border border-slate-200 bg-white shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/60">
                <th className="px-5 py-3 text-[9px] font-bold uppercase tracking-wider text-slate-400">Waktu</th>
                <th className="px-5 py-3 text-[9px] font-bold uppercase tracking-wider text-slate-400">Actor</th>
                <th className="px-5 py-3 text-[9px] font-bold uppercase tracking-wider text-slate-400">Alasan</th>
                <th className="px-5 py-3 text-[9px] font-bold uppercase tracking-wider text-slate-400">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <TableSkeleton columns={4} rows={8} />
              ) : filtered.length > 0 ? (
                filtered.map((row: AccountDeletionRow) => (
                  <tr key={row.id} className="align-top hover:bg-slate-50/40">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="space-y-0.5">
                        <p className="text-xs font-semibold text-slate-900">
                          {format(new Date(row.created_at), "dd MMM yyyy", { locale: id })}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {format(new Date(row.created_at), "HH:mm:ss")}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="rounded-md border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            {ACTOR_LABELS[row.actor_type] || row.actor_type}
                          </Badge>
                          <span className="text-xs font-semibold text-slate-900">
                            {row.actor_name || "Tanpa nama"}
                          </span>
                        </div>
                        <p className="font-mono text-[10px] text-slate-400">{row.actor_id}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Badge className="rounded-md bg-amber-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 hover:bg-amber-50">
                        {getReasonLabel(row.reason)}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <div className="max-w-[520px] space-y-1">
                        <p className="text-sm text-slate-700">
                          {row.reason_detail?.trim() || "Tidak ada detail tambahan"}
                        </p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-[10px] font-bold uppercase tracking-wider text-primary hover:bg-primary/5"
                          onClick={() => setSelectedRow(row)}
                        >
                          <Eye className="mr-1 h-3.5 w-3.5" />
                          Detail
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-24 text-center">
                    <Trash2 className="mx-auto mb-3 h-8 w-8 text-slate-200" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Belum ada histori hapus akun
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={!!selectedRow} onOpenChange={(open) => !open && setSelectedRow(null)}>
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden border border-slate-200 shadow-2xl bg-white">
          <DialogHeader className="border-b border-slate-100 px-5 py-4">
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
              <FileText className="h-4 w-4 text-primary" />
              Detail Hapus Akun
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Informasi lengkap alasan penghapusan akun ini.
            </DialogDescription>
          </DialogHeader>

          {selectedRow && (
            <div className="space-y-4 px-5 py-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                  <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">Actor</p>
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-slate-500" />
                    <span className="text-sm font-semibold text-slate-900">
                      {selectedRow.actor_name || "Tanpa nama"}
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-[10px] text-slate-400">{selectedRow.actor_id}</p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                  <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">Waktu</p>
                  <div className="flex items-center gap-2">
                    <CalendarRange className="h-3.5 w-3.5 text-slate-500" />
                    <span className="text-sm font-semibold text-slate-900">
                      {format(new Date(selectedRow.created_at), "dd MMM yyyy", { locale: id })}
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] text-slate-400">
                    {format(new Date(selectedRow.created_at), "HH:mm:ss")}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3">
                <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-amber-600">Alasan</p>
                <Badge className="rounded-md bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 hover:bg-white">
                  {getReasonLabel(selectedRow.reason)}
                </Badge>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <p className="mb-2 text-[9px] font-bold uppercase tracking-wider text-slate-400">Detail alasan</p>
                <p className="text-sm leading-6 text-slate-700">
                  {selectedRow.reason_detail?.trim() || "Tidak ada detail tambahan"}
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">Actor Type</p>
                <p className="text-sm font-semibold text-slate-900">
                  {ACTOR_LABELS[selectedRow.actor_type] || selectedRow.actor_type}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AccountDeletionsPage() {
  return (
    <PermissionGate module="account-deletions" action="read">
      <AccountDeletionsContent />
    </PermissionGate>
  );
}
