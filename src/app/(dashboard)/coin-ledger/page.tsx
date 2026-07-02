"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Search, Coins, FilterX, ArrowDownLeft, ArrowUpRight, Database } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import PermissionGate from "@/components/shared/permission-gate";
import Pagination from "@/components/shared/pagination";
import TableSkeleton from "@/components/shared/table-skeleton";
import DateRangeFilter, { DateRange } from "@/components/shared/date-range-filter";
import { ExportExcelButton } from "@/components/shared/export-excel-button";
import { ApiResponse } from "@/types/api";
import { Owner, Tenant } from "@/types/domain";
import { apiFetcher } from "@/lib/fetcher";
import { coinLedgerService, CoinLedgerEntry } from "@/services/coin-ledger.service";

const PAGE_SIZE = 25;

export default function CoinLedgerPage() {
  return (
    <PermissionGate module="topups" action="read">
      <CoinLedgerContent />
    </PermissionGate>
  );
}

function CoinLedgerContent() {
  const searchParams = useSearchParams();
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const initialPreset = searchParams.get("date_preset");

  const [data, setData] = useState<CoinLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [jenis, setJenis] = useState(searchParams.get("jenis") || "all");
  const [sourceType, setSourceType] = useState(searchParams.get("source_type") || "all");
  const [dateRange, setDateRange] = useState<DateRange>(
    initialPreset === "today" ? { start: todayStr, end: todayStr } : { start: "", end: "" },
  );
  const [outletFilter, setOutletFilter] = useState("all");

  const { data: tenantsResponse } = useSWR<ApiResponse<Tenant[]>>("/tenants", apiFetcher, {
    dedupingInterval: 60_000,
    keepPreviousData: true,
    revalidateOnFocus: false,
  });
  const tenants = useMemo(() => tenantsResponse?.data || [], [tenantsResponse]);

  const fetchLedger = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (jenis !== "all") params.set("jenis", jenis);
      if (sourceType !== "all") params.set("source_type", sourceType);
      if (dateRange.start) params.set("start_date", dateRange.start);
      if (dateRange.end) params.set("end_date", dateRange.end);
      if (search.trim()) params.set("search", search.trim());
      const res = await coinLedgerService.getAll(params.toString());
      setData(res.data || []);
    } finally {
      setLoading(false);
    }
  }, [jenis, sourceType, dateRange, search]);

  useEffect(() => {
    fetchLedger();
    setPage(1);
  }, [fetchLedger]);

  const filtered = useMemo(() => {
    return data.filter((item) => outletFilter === "all" || item.hk_outlet === outletFilter);
  }, [data, outletFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const summary = useMemo(() => {
    return filtered.reduce(
      (acc, item) => {
        if (item.hk_jenis_transaksi === "masuk") acc.masuk += item.hk_jumlah || 0;
        if (item.hk_jenis_transaksi === "keluar") acc.keluar += item.hk_jumlah || 0;
        return acc;
      },
      { masuk: 0, keluar: 0 },
    );
  }, [filtered]);

  const isFiltered = search || jenis !== "all" || sourceType !== "all" || outletFilter !== "all" || dateRange.start || dateRange.end;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2 font-heading">
            <Coins className="h-5 w-5 text-primary" />
            Ledger Koin
          </h1>
          <p className="text-xs font-medium text-slate-500">
            Audit arus masuk dan keluar koin seluruh outlet.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="h-8 px-3 rounded-md font-bold text-[10px] uppercase tracking-wider text-slate-500 border-slate-200 bg-white">
            {filtered.length} Entri
          </Badge>
          <ExportExcelButton
            data={filtered}
            filename="coin_ledger"
            sheetName="Coin Ledger"
            columns={[
              { header: "Tanggal", key: "hk_created", width: 22, format: (v) => v ? format(new Date(v), "dd/MM/yyyy HH:mm") : "" },
              { header: "ID", key: "hk_id", width: 22 },
              { header: "Outlet ID", key: "hk_outlet", width: 14 },
              { header: "Outlet", key: "outlet_name", width: 24 },
              { header: "Owner", key: "owner_name", width: 24 },
              { header: "Jenis", key: "hk_jenis_transaksi", width: 12 },
              { header: "Jumlah", key: "hk_jumlah", width: 12 },
              { header: "Sumber", key: "source_type", width: 18 },
              { header: "Keterangan", key: "hk_keterangan", width: 42 },
            ]}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border border-slate-200 bg-white rounded-2xl p-5 flex flex-col gap-3 shadow-sm">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-emerald-100 text-emerald-700">
            <ArrowDownLeft className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-slate-900 tracking-tight">{summary.masuk.toLocaleString("id-ID")}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">Total Koin Masuk</p>
          </div>
        </Card>
        <Card className="border border-slate-200 bg-white rounded-2xl p-5 flex flex-col gap-3 shadow-sm">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-amber-100 text-amber-700">
            <ArrowUpRight className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-slate-900 tracking-tight">{summary.keluar.toLocaleString("id-ID")}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">Total Koin Keluar</p>
          </div>
        </Card>
      </div>

      <Card className="p-1 border border-slate-200 rounded-lg bg-white overflow-hidden shadow-none">
        <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Cari ID ledger, outlet, owner, atau keterangan..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 h-9 border-none shadow-none focus-visible:ring-0 text-xs font-medium placeholder:text-slate-400"
            />
          </div>
          <div className="h-px w-full bg-slate-100 xl:hidden" />
          <div className="hidden h-5 w-px bg-slate-100 xl:block" />
          <div className="flex flex-wrap items-center gap-1 p-1 xl:p-0">
            <div className="relative flex items-center">
              <select
                value={jenis}
                onChange={(e) => { setJenis(e.target.value); setPage(1); }}
                className="h-8 pl-2.5 pr-7 text-[10px] font-bold uppercase text-slate-600 bg-transparent border border-slate-200 rounded-md focus:ring-0 focus:outline-none cursor-pointer appearance-none hover:bg-slate-50 transition-colors"
              >
                <option value="all">Semua Jenis</option>
                <option value="masuk">Koin Masuk</option>
                <option value="keluar">Koin Keluar</option>
              </select>
            </div>
            <div className="h-4 w-px bg-slate-100 mx-0.5" />
            <div className="relative flex items-center">
              <select
                value={sourceType}
                onChange={(e) => { setSourceType(e.target.value); setPage(1); }}
                className="h-8 pl-2.5 pr-7 text-[10px] font-bold uppercase text-slate-600 bg-transparent border border-slate-200 rounded-md focus:ring-0 focus:outline-none cursor-pointer appearance-none hover:bg-slate-50 transition-colors"
              >
                <option value="all">Semua Sumber</option>
                <option value="transaksi_laundry">Transaksi Laundry</option>
                <option value="addon_koin">Addon via Koin</option>
                <option value="referral">Referral</option>
                <option value="bonus_pendaftaran">Bonus Pendaftaran</option>
                <option value="manual">Manual</option>
                <option value="lainnya">Lainnya</option>
              </select>
            </div>
            <div className="h-4 w-px bg-slate-100 mx-0.5" />
            <div className="relative flex items-center">
              <select
                value={outletFilter}
                onChange={(e) => { setOutletFilter(e.target.value); setPage(1); }}
                className="h-8 pl-2.5 pr-7 text-[10px] font-bold uppercase text-slate-600 bg-transparent border border-slate-200 rounded-md focus:ring-0 focus:outline-none cursor-pointer appearance-none hover:bg-slate-50 transition-colors"
              >
                <option value="all">Semua Outlet</option>
                {tenants.map((tenant) => (
                  <option key={tenant.ot_id} value={tenant.ot_id}>
                    {tenant.ot_nama}
                  </option>
                ))}
              </select>
            </div>
            <div className="h-4 w-px bg-slate-100 mx-0.5" />
            <DateRangeFilter value={dateRange} onChange={(r) => { setDateRange(r); setPage(1); }} />
            <div className="h-4 w-px bg-slate-100 mx-0.5" />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSearch("");
                setJenis("all");
                setSourceType("all");
                setOutletFilter("all");
                setDateRange({ start: "", end: "" });
                setPage(1);
              }}
              className={`h-8 w-8 transition-colors ${isFiltered ? "text-rose-500 hover:text-rose-700 hover:bg-rose-50" : "text-slate-400 hover:text-slate-600"}`}
            >
              <FilterX className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </Card>

      <Card className="border border-slate-200 rounded-lg overflow-hidden bg-white min-h-[400px] shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider">Waktu</th>
                <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider">Ledger</th>
                <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider">Outlet</th>
                <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider text-center">Jenis</th>
                <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider text-center">Jumlah</th>
                <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider">Sumber</th>
                <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <TableSkeleton columns={7} rows={10} />
              ) : paginated.length > 0 ? (
                paginated.map((item) => {
                  const isMasuk = item.hk_jenis_transaksi === "masuk";
                  return (
                    <tr key={item.hk_id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-5 py-3 text-[11px] font-medium text-slate-500">
                        {format(new Date(item.hk_created), "dd/MM/yy HH:mm", { locale: id })}
                      </td>
                      <td className="px-5 py-3">
                        <div className="font-mono text-[11px] font-semibold text-slate-700">{item.hk_id}</div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="font-bold text-slate-900 text-sm">{item.outlet_name}</div>
                        <div className="text-[10px] font-medium text-slate-500">{item.owner_name}</div>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <Badge className={isMasuk ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}>
                          {isMasuk ? "Masuk" : "Keluar"}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className={`font-extrabold text-sm ${isMasuk ? "text-emerald-600" : "text-amber-600"}`}>
                          {isMasuk ? "+" : "-"}{item.hk_jumlah} Koin
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant="outline" className="uppercase text-[10px] font-bold">
                          {item.source_type.replaceAll("_", " ")}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-[11px] font-medium text-slate-600">
                        {item.hk_keterangan || "-"}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-24 text-center">
                    <Database className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Belum ada data ledger koin</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={totalPages} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </Card>
    </div>
  );
}
