"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search, UserCircle, Activity, Users, ExternalLink, FilterX,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiResponse } from "@/types/api";
import { Owner } from "@/types/domain";
import useSWR from "swr";
import { apiFetcher } from "@/lib/fetcher";
import { Badge } from "@/components/ui/badge";
import TableSkeleton from "@/components/shared/table-skeleton";
import Pagination from "@/components/shared/pagination";
import DateRangeFilter, { DateRange, filterByDateRange } from "@/components/shared/date-range-filter";
import { ExportExcelButton } from "@/components/shared/export-excel-button";
import { format } from "date-fns";
import PermissionGate from "@/components/shared/permission-gate";

const PAGE_SIZE = 20;

export default function OwnersPage() {
  return (
    <PermissionGate module="users" action="read">
      <OwnersPageContent />
    </PermissionGate>
  );
}

function OwnersPageContent() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const initialDatePreset = searchParams.get("date_preset");
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const [dateRange, setDateRange] = useState<DateRange>(
    initialDatePreset === "today"
      ? { start: todayStr, end: todayStr }
      : { start: "", end: "" },
  );

  const { data, isLoading } = useSWR<ApiResponse<Owner[]>>(
    "/users", apiFetcher,
    { dedupingInterval: 60_000, keepPreviousData: true, revalidateOnFocus: false },
  );
  const owners = data?.data || [];

  const filteredOwners = useMemo(() => {
    const bySearch = owners.filter(
      (o) =>
        o.name.toLowerCase().includes(search.toLowerCase()) ||
        o.email.toLowerCase().includes(search.toLowerCase()) ||
        String(o.id).includes(search.trim()),
    );
    return filterByDateRange(bySearch, (o) => o.created_at, dateRange);
  }, [owners, search, dateRange]);

  const totalPages = Math.ceil(filteredOwners.length / PAGE_SIZE);
  const paginated = filteredOwners.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const summary = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const total = owners.length || 0;
    const filtered = filteredOwners.length || 0;
    const thisMonth = owners.filter((o) => o.created_at && new Date(o.created_at) >= monthStart).length;
    const outlets = owners.reduce((sum, owner) => sum + Number(owner.total_outlets || 0), 0);
    const withOutlet = owners.filter((owner) => Number(owner.total_outlets || 0) > 0).length;
    const avgOutlets = total > 0 ? outlets / total : 0;

    return {
      total,
      filtered,
      thisMonth,
      thisMonthPct: total > 0 ? (thisMonth / total) * 100 : 0,
      filteredPct: total > 0 ? (filtered / total) * 100 : 0,
      withOutlet,
      withOutletPct: total > 0 ? (withOutlet / total) * 100 : 0,
      outlets,
      avgOutlets,
    };
  }, [owners, filteredOwners]);

  const handleSearch = (val: string) => { setSearch(val); setPage(1); };
  const handleDateRange = (r: DateRange) => { setDateRange(r); setPage(1); };
  const handleReset = () => { setSearch(""); setDateRange({ start: "", end: "" }); setPage(1); };

  const isFiltered = search || dateRange.start || dateRange.end;

  return (
    <div className="space-y-6">
      {/* COMMAND BAR HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2 font-heading">
            <Users className="h-5 w-5 text-primary" />
            Direktori Owner
          </h1>
          <p className="text-xs font-medium text-slate-500">
            Database akun owner yang mengelola outlet.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="h-8 px-3 rounded-md font-bold text-[10px] uppercase tracking-wider text-slate-500 border-slate-200 bg-white">
            {filteredOwners.length} / {owners.length} Akun
          </Badge>
          <ExportExcelButton
            data={filteredOwners}
            filename="owners_directory"
            sheetName="Owners"
            columns={[
              { header: "Kode Owner", key: "id", width: 14, format: (v) => v ? `#${String(v)}` : "-" },
              { header: "Nama", key: "name", width: 25 },
              { header: "Email", key: "email", width: 30 },
              { header: "No. HP", key: "nohp", width: 18 },
              { header: "Status", key: "status", width: 12, format: (v) => v === 1 ? "Aktif" : "Nonaktif" },
              { header: "Total Outlet", key: "total_outlets", width: 14 },
              { header: "Tanggal Bergabung", key: "created_at", width: 22, format: (v) => v ? format(new Date(v), "dd/MM/yyyy HH:mm") : "" },
            ]}
          />
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        <Card className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-primary to-orange-500 p-5 text-white shadow-lg">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
          <div className="relative space-y-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/70">
                Owner Bulan Ini
              </p>
              <p className="mt-1 text-3xl font-black tracking-tight">
                {summary.thisMonth.toLocaleString("id-ID")}
              </p>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/10 p-3 backdrop-blur-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/80">
                {summary.thisMonthPct.toFixed(1)}% dari total owner
              </p>
              <p className="mt-1 text-sm font-semibold text-white/95">
                {summary.filteredPct.toFixed(1)}% dari total ikut filter saat ini
              </p>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
            Total Owner
          </p>
          <p className="mt-3 text-3xl font-black tracking-tight text-slate-900">
            {summary.total.toLocaleString("id-ID")}
          </p>
          <p className="mt-2 text-xs font-semibold text-slate-500">
            {summary.filtered.toLocaleString("id-ID")} tampil di filter aktif
          </p>
        </Card>

        <Card className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
            Owner Dengan Outlet
          </p>
          <p className="mt-3 text-3xl font-black tracking-tight text-emerald-600">
            {summary.withOutlet.toLocaleString("id-ID")}
          </p>
          <p className="mt-2 text-xs font-semibold text-slate-500">
            {summary.withOutletPct.toFixed(1)}% dari total owner
          </p>
        </Card>

        <Card className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
            Rata-rata Outlet / Owner
          </p>
          <p className="mt-3 text-3xl font-black tracking-tight text-slate-900">
            {summary.avgOutlets.toFixed(1)}
          </p>
          <p className="mt-2 text-xs font-semibold text-slate-500">
            {summary.outlets.toLocaleString("id-ID")} total outlet aktif
          </p>
        </Card>
      </div>

      <Card className="p-1 border border-slate-200 rounded-lg bg-white overflow-hidden shadow-none">
        <div className="flex flex-col lg:flex-row lg:items-center gap-1">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Cari nama, email, atau ID owner..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9 h-9 border-none shadow-none focus-visible:ring-0 text-xs font-medium placeholder:text-slate-400"
            />
          </div>

          <div className="h-5 w-px bg-slate-100 hidden lg:block" />

          {/* Date range */}
          <div className="flex items-center gap-1 p-1 lg:p-0">
            <DateRangeFilter value={dateRange} onChange={handleDateRange} />
            <div className="h-4 w-px bg-slate-100 mx-0.5" />
            <Button
              variant="ghost" size="icon"
              onClick={handleReset}
              className={`h-8 w-8 transition-colors ${isFiltered ? "text-rose-500 hover:text-rose-700 hover:bg-rose-50" : "text-slate-400 hover:text-slate-600"}`}
            >
              <FilterX className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </Card>

      {/* TABLE */}
      <Card className="border border-slate-200 rounded-lg overflow-hidden bg-white min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider">Profil Owner</th>
                <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider text-center">Kode Owner</th>
                <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider text-center">Portofolio</th>
                <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider text-center">Tgl Daftar</th>
                <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <TableSkeleton columns={5} rows={10} />
              ) : paginated.length > 0 ? (
                paginated.map((owner) => (
                  <tr key={owner.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-5 py-3">
                      <Link
                        href={`/users/${owner.id}`}
                        className="group -m-2 flex rounded-lg p-2 transition-colors hover:bg-slate-50/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 bg-slate-50 rounded flex items-center justify-center text-slate-400 border border-slate-100 transition-colors group-hover:border-primary/20 group-hover:text-primary">
                            <UserCircle className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-slate-900 text-sm transition-colors group-hover:text-primary">{owner.name}</p>
                              <ExternalLink className="h-3.5 w-3.5 text-slate-300 transition-colors group-hover:text-primary" />
                            </div>
                            <p className="text-[11px] font-medium text-slate-500">{owner.email}</p>
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className="inline-flex rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-[10px] font-bold text-slate-600">
                        #{owner.id}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <div className="inline-flex items-center gap-1 font-bold text-slate-700 text-[10px]">
                        {owner.total_outlets || 0} Outlet
                      </div>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className="text-[10px] font-bold text-slate-500 tabular-nums">
                        {owner.created_at ? format(new Date(owner.created_at), "dd/MM/yy HH:mm") : "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link href={`/users/${owner.id}`}>
                        <Button variant="ghost" size="sm" className="h-7 px-2 font-bold text-[9px] uppercase text-primary hover:bg-primary/5">
                          Lihat Profil <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <Activity className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Belum ada data owner</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={totalPages} totalItems={filteredOwners.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </Card>
    </div>
  );
}
