"use client";

import { useState } from "react";
import useSWR from "swr";
import { apiFetcher } from "@/lib/fetcher";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Pagination from "@/components/shared/pagination";
import DateRangeFilter, { DateRange } from "@/components/shared/date-range-filter";
import TableSkeleton from "@/components/shared/table-skeleton";
import { format } from "date-fns";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

export function TenantTransactionsTab({ tenantId }: { tenantId: string }) {
  const [page, setPage] = useState(1);
  const [dateRange, setDateRange] = useState<DateRange>({
    start: "",
    end: "",
  });

  const queryParams = new URLSearchParams();
  queryParams.set("outlet", tenantId);
  queryParams.set("page", String(page));
  queryParams.set("limit", String(PAGE_SIZE));
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

  const result = response?.data;
  const transactions = result?.data || [];
  const totalData = result?.total || 0;
  const totalPages = result?.total_pages || 1;

  return (
    <Card className="border border-slate-200 bg-white shadow-none overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Daftar Transaksi Outlet</p>
        <div className="flex items-center gap-2">
          <DateRangeFilter value={dateRange} onChange={(dr) => { setDateRange(dr); setPage(1); }} />
        </div>
      </div>
      
      <div className="hidden overflow-x-auto md:block">
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
            {isLoading ? (
              <tr>
                <td colSpan={5}>
                  <TableSkeleton rows={5} columns={5} />
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-20 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <AlertCircle className="h-8 w-8 text-slate-300 mb-3" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Data transaksi tidak ditemukan</p>
                  </div>
                </td>
              </tr>
            ) : (
              transactions.map((trx: any) => (
                <tr key={trx.id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-6 py-4 font-bold text-[11px] text-slate-900 uppercase font-mono">{trx.id}</td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-700">{trx.pelanggan?.nama || "-"}</p>
                      <p className="text-[9px] font-medium text-slate-400 uppercase">
                        {trx.kasir_name || (trx.user_update_type === "pegawai" ? "Pegawai" : "User")}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-primary">Rp {trx.total_akhir?.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <Badge variant="outline" className={cn(
                      "text-[8px] px-2 py-0.5 border-none font-bold uppercase",
                      trx.status_order === "Selesai" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                    )}>{trx.status_order}</Badge>
                  </td>
                  <td className="px-6 py-4 text-right text-[10px] font-bold text-slate-400 uppercase">
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
  );
}
