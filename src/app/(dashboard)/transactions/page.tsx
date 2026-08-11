"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, Receipt, Store, AlertCircle } from "lucide-react";
import useSWR from "swr";
import { apiFetcher } from "@/lib/fetcher";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Pagination from "@/components/shared/pagination";
import DateRangeFilter, { DateRange } from "@/components/shared/date-range-filter";
import TableSkeleton from "@/components/shared/table-skeleton";
import PermissionGate from "@/components/shared/permission-gate";
import { format } from "date-fns";

const PAGE_SIZE = 20;

export default function TransactionsPage() {
  return (
    <PermissionGate module="dashboard" action="read">
      <TransactionsPageContent />
    </PermissionGate>
  );
}

function TransactionsPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [page, setPage] = useState(Number(searchParams.get("page") || "1"));
  const [selectedOutlet, setSelectedOutlet] = useState(searchParams.get("outlet") || "all");
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get("status") || "all");
  const [dateRange, setDateRange] = useState<DateRange>({
    start: searchParams.get("start") || "",
    end: searchParams.get("end") || "",
  });

  const queryParams = new URLSearchParams();
  if (page > 1) queryParams.set("page", String(page));
  if (PAGE_SIZE) queryParams.set("limit", String(PAGE_SIZE));
  if (search) queryParams.set("search", search);
  if (selectedOutlet !== "all") queryParams.set("outlet", selectedOutlet);
  if (selectedStatus !== "all") queryParams.set("status", selectedStatus);
  if (dateRange.start) queryParams.set("start", dateRange.start);
  if (dateRange.end) queryParams.set("end", dateRange.end);

  const { data: response, isLoading } = useSWR<any>(
    `/transactions?${queryParams.toString()}`,
    apiFetcher,
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
    }
  );

  useEffect(() => {
    setSearch(searchParams.get("search") || "");
    setPage(Number(searchParams.get("page") || "1"));
    setSelectedOutlet(searchParams.get("outlet") || "all");
    setSelectedStatus(searchParams.get("status") || "all");
    setDateRange({
      start: searchParams.get("start") || "",
      end: searchParams.get("end") || "",
    });
  }, [searchParams]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (page > 1) params.set("page", String(page));
    if (selectedOutlet !== "all") params.set("outlet", selectedOutlet);
    if (selectedStatus !== "all") params.set("status", selectedStatus);
    if (dateRange.start) params.set("start", dateRange.start);
    if (dateRange.end) params.set("end", dateRange.end);

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [search, page, selectedOutlet, selectedStatus, dateRange, pathname, router]);

  const result = response?.data;
  const transactions = result?.data || [];
  const totalData = result?.total || 0;
  const totalPages = result?.total_pages || 1;

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Receipt className="h-6 w-6 text-primary" />
            Riwayat Transaksi Global
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Pantau seluruh aktivitas transaksi dari semua outlet.
          </p>
        </div>
      </div>

      <Card className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 border border-slate-200 shadow-sm rounded-2xl bg-white">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Cari ID Trx / Nama Pelanggan..."
            value={search}
            onChange={handleSearch}
            className="pl-10 h-10 w-full"
          />
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto">
          <DateRangeFilter value={dateRange} onChange={(dr) => { setDateRange(dr); setPage(1); }} />
          
          <select
            className="h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 min-w-[140px]"
            value={selectedStatus}
            onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
          >
            <option value="all">Semua Status</option>
            <option value="Antrian">Antrian</option>
            <option value="Proses">Proses</option>
            <option value="Selesai">Selesai</option>
            <option value="Diambil">Diambil</option>
            <option value="Batal">Batal</option>
          </select>
        </div>
      </Card>

      <Card className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-[10px] text-slate-400 uppercase font-bold tracking-wider bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 rounded-tl-2xl">ID TRX & OUTLET</th>
                <th className="px-6 py-4">PELANGGAN</th>
                <th className="px-6 py-4 text-right">NOMINAL</th>
                <th className="px-6 py-4">STATUS</th>
                <th className="px-6 py-4 rounded-tr-2xl">TANGGAL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5}>
                    <TableSkeleton rows={5} columns={5} />
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <AlertCircle className="h-8 w-8 text-slate-300 mb-3" />
                      <p className="font-medium text-slate-900">Tidak ada transaksi</p>
                      <p className="text-xs mt-1">Data tidak ditemukan dengan filter saat ini.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                transactions.map((trx: any) => (
                  <tr key={trx.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{trx.id}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                        <Store className="h-3 w-3" />
                        {trx.outlet?.ot_nama || trx.outlet_id}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-700">
                        {trx.pelanggan?.nama || "-"}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {trx.pelanggan?.no_hp || ""}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-bold text-slate-900">
                        Rp {trx.total_akhir?.toLocaleString("id-ID") || 0}
                      </div>
                      <div className="text-[10px] uppercase font-bold mt-1 text-slate-500">
                        {trx.status_pembayaran}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="font-bold uppercase text-[10px] tracking-wider border-amber-200 text-amber-700 bg-amber-50">
                        {trx.status_order}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {format(new Date(trx.created_at), "dd/MM/yyyy HH:mm")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!isLoading && transactions.length > 0 && (
          <div className="border-t border-slate-100 p-4 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500 font-medium">
              Menampilkan {transactions.length} dari total {totalData} transaksi
            </p>
            <Pagination
              page={page}
              totalPages={totalPages}
              totalItems={totalData}
              pageSize={PAGE_SIZE}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        )}
      </Card>
    </div>
  );
}
