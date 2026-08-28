"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Wallet2,
  ExternalLink,
  ShieldCheck,
  Store,
  Clock,
  RefreshCw,
  Search,
  FilterX,
  ChevronRight,
  Check,
  CreditCard,
  ArrowRightLeft,
  History,
  Gift,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { topupService } from "@/services/topup.service";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { AxiosError } from "axios";
import { ApiErrorResponse, ApiResponse } from "@/types/api";
import { Topup, TopupStatus } from "@/types/topup";
import Pagination from "@/components/shared/pagination";
import DateRangeFilter, { DateRange } from "@/components/shared/date-range-filter";
import { ExportExcelButton } from "@/components/shared/export-excel-button";
import { Tenant } from "@/types/tenant";
import { Owner } from "@/types/domain";
import { apiFetcher } from "@/lib/fetcher";
import { resolveUploadUrl } from "@/lib/upload-url";
import { getTopupStatusUi, isTopupActionable, normalizeTopupStatus } from "@/lib/topup-status";
import useSWR from "swr";
import { useRegionNames } from "@/hooks/use-region-names";
import PermissionGate from "@/components/shared/permission-gate";

const PAGE_SIZE = 25;

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Card className="border border-slate-200 bg-white rounded-2xl p-5 flex flex-col gap-3 shadow-sm">
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-extrabold text-slate-900 tracking-tight">{value}</p>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">{label}</p>
        {sub && <p className="text-[10px] text-slate-500 mt-1">{sub}</p>}
      </div>
    </Card>
  );
}

export default function TopupsManagementPage() {
  return (
    <PermissionGate module="topups" action="read">
      <TopupsManagementContent />
    </PermissionGate>
  );
}

function TopupsManagementContent() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<Topup[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [page, setPage] = useState(1);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get("status") || "all");
  const [methodFilter, setMethodFilter] = useState<string>("all");

  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [dateRange, setDateRange] = useState<DateRange>({ start: "", end: "" });

  const handleDateRange = (r: DateRange) => {
    setDateRange(r);
    setStartDate(r.start ? new Date(r.start + "T00:00:00") : undefined);
    setEndDate(r.end ? new Date(r.end + "T00:00:00") : undefined);
    setPage(1);
  };

  // Searchable Dropdown States
  const [outletFilter, setOutletFilter] = useState<string>("all");
  const [ownerFilter, setOwnerFilter] = useState<string>("all");
  const [openOutlet, setOpenOutlet] = useState(false);

  const [selectedTopup, setSelectedTopup] = useState<Topup | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [proofPreviewUrl, setProofPreviewUrl] = useState<string | null>(null);

  const { data: tenantsResponse } = useSWR<ApiResponse<Tenant[]>>(
    "/tenants",
    apiFetcher,
    {
      dedupingInterval: 60_000,
      keepPreviousData: true,
      revalidateOnFocus: false,
    },
  );

  const { data: ownersResponse } = useSWR<ApiResponse<Owner[]>>(
    "/users",
    apiFetcher,
    {
      dedupingInterval: 60_000,
      keepPreviousData: true,
      revalidateOnFocus: false,
    },
  );

  useEffect(() => {
    const search = searchParams.get("search");
    if (search) setSearchQuery(search);
  }, [searchParams]);

  const formatDateTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      const timeStr = format(date, "HH:mm", { locale: id });
      const fullDateStr = format(date, "dd/MM/yy", { locale: id });
      return {
        display: isToday ? `Today, ${timeStr}` : `${fullDateStr} ${timeStr}`,
        isToday,
      };
    } catch {
      return { display: "-", isToday: false };
    }
  };

  const fetchTopups = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (methodFilter !== "all") params.append("metode", methodFilter);
      if (startDate)
        params.append("start_date", format(startDate, "yyyy-MM-dd"));
      if (endDate) params.append("end_date", format(endDate, "yyyy-MM-dd"));

      const res = await topupService.getAll(params.toString());
      setData(res.data || []);
    } catch {
      toast.error("Failed to sync transaction data");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, methodFilter, startDate, endDate]);

  useEffect(() => {
    fetchTopups();
    setPage(1); // reset page on filter change
  }, [fetchTopups]);

  const uniqueOutlets = useMemo(
    () => Array.from(new Set((data || []).map((item) => item?.outlet_name).filter((name): name is string => Boolean(name)))),
    [data]
  );

  const tenants = useMemo(() => tenantsResponse?.data || [], [tenantsResponse]);
  const regionNames = useRegionNames(tenants);

  const filteredData = useMemo(() => {
    return (data || []).filter((item) => {
      if (!item) return false;
      const cleanSearch = searchQuery.toLowerCase();
      const matchesSearch = item.tk_id.toLowerCase().includes(cleanSearch);
      const matchesOutlet = outletFilter === "all" || item.outlet_name === outletFilter;
      const matchesOwner = ownerFilter === "all" || item.owner_name === ownerFilter;
      return matchesSearch && matchesOutlet && matchesOwner;
    });
  }, [data, searchQuery, outletFilter, ownerFilter]);

  const tenantMap = useMemo(
    () => new Map(tenants.map((tenant) => [tenant.ot_id, tenant])),
    [tenants],
  );

  const ownerMap = useMemo(
    () => new Map((ownersResponse?.data || []).map((owner) => [String(owner.id), owner])),
    [ownersResponse],
  );

  const ownerByNameMap = useMemo(
    () => new Map((ownersResponse?.data || []).map((owner) => [owner.name, owner])),
    [ownersResponse],
  );

  const topupExportRows = useMemo(
    () =>
      filteredData.map((item) => {
        const tenant = item.tk_outlet ? tenantMap.get(item.tk_outlet) : undefined;
        const owner = tenant?.owner_id != null
          ? ownerMap.get(String(tenant.owner_id))
          : ownerByNameMap.get(item.owner_name || "");

        return {
          tk_created: item.tk_created,
          tk_id: item.tk_id ?? "",
          owner_id: tenant?.owner_id ?? owner?.id ?? "",
          owner_name: item.owner_name ?? tenant?.owner_name ?? owner?.name ?? "",
          owner_code: tenant?.owner_code ?? owner?.owner_code ?? "",
          owner_nohp: tenant?.owner_nohp ?? owner?.nohp ?? "",
          tk_outlet: item.tk_outlet ?? "",
          outlet_name: item.outlet_name ?? tenant?.ot_nama ?? "",
          outlet_nohp: tenant?.ot_nohp ?? "",
          outlet_city: regionNames.cityName(tenant?.ot_kota),
          outlet_province: regionNames.provinceName(tenant?.ot_provinsi),
          tk_jumlah: item.tk_jumlah ?? 0,
          tk_total: item.tk_total ?? 0,
          tk_metode_bayar: item.tk_metode_bayar ?? "",
          tk_status: item.tk_status ?? "",
        };
      }),
    [filteredData, ownerByNameMap, ownerMap, regionNames, tenantMap],
  );

  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);
  const paginatedData = filteredData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const summary = useMemo(() => {
    const successful = data.filter((item) =>
      ["success", "completed", "accepted"].includes(normalizeTopupStatus(item.tk_status))
    );
    const topupKoin = successful
      .filter((item) => item.tk_metode_bayar !== "bonus")
      .reduce((sum, item) => sum + Number(item.tk_jumlah || 0), 0);
    const bonusKoin = successful
      .filter((item) => item.tk_metode_bayar === "bonus")
      .reduce((sum, item) => sum + Number(item.tk_jumlah || 0), 0);

    return {
      topupKoin,
      bonusKoin,
      totalKoinKeluar: topupKoin + bonusKoin,
    };
  }, [data]);

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setMethodFilter("all");
    setOutletFilter("all");
    setOwnerFilter("all");
    setStartDate(undefined);
    setEndDate(undefined);
    setDateRange({ start: "", end: "" });
  };

  const handleAction = async (id: string, status: Extract<TopupStatus, "success" | "failed">) => {
    setConfirming(true);
    try {
      const res = await topupService.confirm(id, status);
      if (res.status) {
        toast.success(status === "success" ? "Coins credited successfully" : "Transaction rejected");
        setIsPreviewOpen(false);
        fetchTopups();
      }
    } catch (err) {
      const error = err as AxiosError<ApiErrorResponse>;
      toast.error(error.response?.data?.message || "Operation failed");
    } finally {
      setConfirming(false);
    }
  };

  const handleCancelMidtrans = async (id: string) => {
    setConfirming(true);
    try {
      const res = await topupService.cancelMidtrans(id);
      if (res.status) {
        toast.success("Midtrans transaction canceled by system");
        setIsPreviewOpen(false);
        fetchTopups();
      }
    } catch (err) {
      const error = err as AxiosError<ApiErrorResponse>;
      toast.error(error.response?.data?.message || "Cancellation failed");
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* COMMAND BAR HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2 font-heading">
            <Wallet2 className="h-5 w-5 text-primary" />
            Top Up & Pendapatan
          </h1>
          <p className="text-xs font-medium text-slate-500">
            Pemantauan likuiditas keuangan dan pengisian koin.
          </p>
        </div>

          <div className="flex flex-wrap items-center gap-2">
          <ExportExcelButton
            data={topupExportRows}
            filename="topups_report"
            sheetName="Topups"
            disabled={regionNames.isLoading}
            columns={[
              { header: "Tanggal", key: "tk_created", width: 22, format: (v) => v ? format(new Date(v), "dd/MM/yyyy HH:mm") : "" },
              { header: "ID Top Up", key: "tk_id", width: 22 },
              { header: "ID Owner", key: "owner_id", width: 12 },
              { header: "Nama Owner", key: "owner_name", width: 25 },
              { header: "Kode Owner", key: "owner_code", width: 14 },
              { header: "No. Hp Owner", key: "owner_nohp", width: 18 },
              { header: "ID Outlet", key: "tk_outlet", width: 14 },
              { header: "Nama Outlet", key: "outlet_name", width: 25 },
              { header: "No. Hp Outlet", key: "outlet_nohp", width: 18 },
              { header: "Kota", key: "outlet_city", width: 18 },
              { header: "Provinsi", key: "outlet_province", width: 18 },
              { header: "Total Koin", key: "tk_jumlah", width: 15 },
              { header: "Total Bayar", key: "tk_total", width: 18, format: (v) => v != null ? `Rp ${Number(v).toLocaleString()}` : "Rp 0" },
              { header: "Metode", key: "tk_metode_bayar", width: 15 },
              {
                header: "Status",
                key: "tk_status",
                width: 12,
                format: (v, row) =>
                  row.tk_metode_bayar !== "bonus" && v === "completed"
                    ? "success"
                    : String(v ?? ""),
              },
            ]}
          />
           <Button
            variant="ghost"
            size="sm"
            onClick={fetchTopups}
            disabled={loading}
            className="h-8 px-2 font-bold text-[10px] uppercase tracking-wider gap-2 text-slate-500"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            Sinkronisasi
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          label="Total Koin Top Up"
          sub="Akumulasi koin dari top up yang sukses"
          value={loading ? "—" : summary.topupKoin.toLocaleString("id-ID")}
          icon={Wallet2}
          color="bg-orange-50 text-primary"
        />
        <KpiCard
          label="Total Koin Bonus"
          sub="Akumulasi koin bonus yang sudah dialokasikan"
          value={loading ? "—" : summary.bonusKoin.toLocaleString("id-ID")}
          icon={Gift}
          color="bg-violet-50 text-violet-600"
        />
        <KpiCard
          label="Total Koin Keluar"
          sub="Gabungan top up sukses dan bonus"
          value={loading ? "—" : summary.totalKoinKeluar.toLocaleString("id-ID")}
          icon={ShieldCheck}
          color="bg-emerald-50 text-emerald-600"
        />
      </div>

      {/* FILTER & SEARCH COMMAND BAR */}
      <Card className="p-1 border border-slate-200 rounded-lg bg-white overflow-hidden shadow-none">
        <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Cari ID Transaksi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 border-none shadow-none focus-visible:ring-0 text-xs font-medium placeholder:text-slate-400"
            />
          </div>
          
          <div className="h-px w-full bg-slate-100 xl:hidden" />
          <div className="hidden h-5 w-px bg-slate-100 xl:block" />

          <div className="flex flex-wrap items-center gap-2 p-1 xl:p-0">
            <Popover open={openOutlet} onOpenChange={setOpenOutlet}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 font-bold text-[10px] px-2 gap-2 text-slate-600">
                  <Store className="h-3 w-3" />
                  {outletFilter === "all" ? "Semua Outlet" : outletFilter}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-0 rounded-md">
                <Command>
                  <CommandInput placeholder="Cari outlet..." className="text-xs" />
                  <CommandList>
                    <CommandEmpty className="text-[10px] p-2">Tidak ditemukan.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem onSelect={() => { setOutletFilter("all"); setOpenOutlet(false); }} className="text-xs">Semua Outlet</CommandItem>
                      {uniqueOutlets.map(o => (
                        <CommandItem key={o} onSelect={() => { setOutletFilter(o); setOpenOutlet(false); }} className="text-xs">{o}</CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            <div className="hidden h-4 w-px bg-slate-100 xl:block" />

            <div className="flex flex-wrap items-center gap-1">
               {["all", "pending", "success", "failed"].map(s => (
                 <Button
                    key={s}
                    variant={statusFilter === s ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setStatusFilter(s)}
                    className={cn(
                      "h-7 px-2 text-[9px] font-bold uppercase tracking-tight rounded",
                      statusFilter === s ? "bg-primary/10 text-primary" : "text-slate-500"
                    )}
                 >
                   {s === "all" ? "Semua Status" : s}
                 </Button>
               ))}
            </div>

            <div className="hidden h-4 w-px bg-slate-100 xl:block" />

            <div className="flex flex-wrap items-center gap-1">
               {["all", "transfer", "midtrans", "bonus"].map(m => (
                 <Button
                    key={m}
                    variant={methodFilter === m ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setMethodFilter(m)}
                    className={cn(
                      "h-7 px-2 text-[9px] font-bold uppercase tracking-tight rounded",
                      methodFilter === m ? "bg-primary/10 text-primary" : "text-slate-500"
                    )}
                 >
                   {m === "all" ? "Semua Metode" : m === "midtrans" ? "Midtrans" : m === "transfer" ? "Transfer" : "Bonus"}
                 </Button>
               ))}
            </div>

            <div className="hidden h-4 w-px bg-slate-100 xl:block" />
            <DateRangeFilter value={dateRange} onChange={handleDateRange} />
            <div className="hidden h-4 w-px bg-slate-100 xl:block" />

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

      {/* OPERATIONAL DATA TABLE */}
      <Card className="border border-slate-200 rounded-lg overflow-hidden bg-white min-h-[400px]">
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider">Transaksi</th>
                <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider">Bisnis</th>
                <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider text-center">Likuiditas</th>
                <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider">Metode</th>
                <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider text-center">Status</th>
                <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.length === 0 && !loading ? (
                <tr>
                  <td colSpan={6} className="py-24 text-center">
                    <History className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tidak ada data yang sesuai</p>
                  </td>
                </tr>
              ) : (
              paginatedData.map((item) => {
                  const status = getTopupStatusUi(item.tk_status);
                  const isActionable = isTopupActionable(item.tk_status);
                  const dt = formatDateTime(item.tk_created);
                  return (
                    <tr key={item.tk_id} className="hover:bg-slate-50/80 hover:shadow-sm transition-all duration-300 group border-l-[3px] border-transparent hover:border-primary">
                      <td className="px-5 py-3">
                        <div className="font-bold text-slate-900 text-xs group-hover:text-primary transition-colors flex items-center gap-1.5">
                          #{item.tk_id}
                        </div>
                        <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">
                          {dt.display}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        {item.tk_outlet ? (
                          <Link
                            href={`/tenants/${item.tk_outlet}`}
                            className="font-bold text-slate-800 text-xs hover:text-primary hover:underline transition-colors block"
                          >
                            {item.outlet_name}
                          </Link>
                        ) : (
                          <div className="font-bold text-slate-800 text-xs">{item.outlet_name}</div>
                        )}
                        <div className="text-[10px] font-medium text-slate-500">{item.owner_name}</div>
                        {item.owner_code && (
                          <div className="text-[9px] font-mono text-slate-400">Kode Referral: {item.owner_code}</div>
                        )}
                        {typeof item.outlet_paid_count === "number" && (
                          item.outlet_paid_count >= 2 ? (
                            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-bold text-blue-600">
                              🔁 Repeat · {item.outlet_paid_count}× bayar
                            </span>
                          ) : (
                            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-600">
                              🟢 Pelanggan Baru
                            </span>
                          )
                        )}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <div className="inline-flex flex-col items-center">
                           <span className="font-bold text-xs text-slate-900 leading-none tracking-tight group-hover:scale-105 transition-transform">{item.tk_jumlah?.toLocaleString()} <span className="text-[9px] text-slate-400 font-medium">Koin</span></span>
                           <span className="text-[9px] font-bold text-primary uppercase mt-1">Rp {item.tk_total?.toLocaleString("id-ID")}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        {item.tk_metode_bayar === "bonus" ? (
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5 bg-purple-50 px-2.5 py-1.5 rounded-lg border border-purple-100 w-fit group-hover:bg-white group-hover:shadow-sm transition-all dark:bg-purple-950/20 dark:border-purple-900/30">
                              <Gift className="h-3 w-3 text-purple-500 group-hover:scale-110 transition-transform" />
                              <span className="font-bold uppercase text-purple-600 tracking-widest text-[8px] dark:text-purple-400">
                                BONUS
                              </span>
                            </div>
                            {item.bonus_type && (
                              <span className="text-[8px] font-semibold text-slate-500 italic mt-0.5 ml-1">
                                ({item.bonus_type})
                              </span>
                            )}
                          </div>
                        ) : item.tk_metode_bayar === "transfer" ? (
                          <div className="flex items-center gap-1.5 bg-orange-50 px-2.5 py-1.5 rounded-lg border border-orange-100 w-fit group-hover:bg-white group-hover:shadow-sm transition-all">
                            <ArrowRightLeft className="h-3 w-3 text-orange-500 group-hover:scale-110 transition-transform" />
                            <span className="font-bold uppercase text-slate-600 tracking-widest text-[8px]">
                              TRANSFER
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-100 w-fit group-hover:bg-white group-hover:shadow-sm transition-all">
                            <CreditCard className="h-3 w-3 text-amber-500 group-hover:scale-110 transition-transform" />
                            <span className="font-bold uppercase text-slate-600 tracking-widest text-[8px]">
                              MIDTRANS
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <Badge className={cn("rounded-full px-2 py-0.5 text-[8px] font-bold uppercase border shadow-none transition-all group-hover:shadow-sm", status.className, isActionable && "animate-pulse")}>
                          {status.label}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setSelectedTopup(item); setIsPreviewOpen(true); }}
                          className={cn(
                            "h-8 px-3 font-bold text-[9px] uppercase active:scale-95 transition-all rounded-lg opacity-80 group-hover:opacity-100 border border-transparent",
                            isActionable && item.tk_metode_bayar !== "bonus"
                              ? "text-amber-600 hover:bg-amber-50 group-hover:border-amber-200"
                              : "text-primary hover:bg-primary/10 group-hover:border-primary/20"
                          )}
                        >
                          {isActionable && item.tk_metode_bayar !== "bonus"
                            ? <>Verifikasi <ShieldCheck className="h-3 w-3 ml-1" /></>
                            : <>Detail <ChevronRight className="h-3 w-3 ml-1 group-hover:translate-x-1 transition-transform" /></>
                          }
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="space-y-3 p-4 md:hidden">
          {filteredData.length === 0 && !loading ? (
            <div className="py-16 text-center">
              <History className="mx-auto mb-2 h-7 w-7 text-slate-200" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Tidak ada data yang sesuai</p>
            </div>
          ) : (
            paginatedData.map((item) => {
              const status = getTopupStatusUi(item.tk_status);
              const isActionable = isTopupActionable(item.tk_status);
              const dt = formatDateTime(item.tk_created);
              return (
                <div key={`mobile-${item.tk_id}`} className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="break-all text-xs font-bold text-slate-900">#{item.tk_id}</p>
                        <p className="mt-1 text-[10px] font-bold uppercase text-slate-400">{dt.display}</p>
                      </div>
                      <Badge className={cn("rounded-full px-2 py-0.5 text-[8px] font-bold uppercase border shadow-none", status.className, isActionable && "animate-pulse")}>
                        {status.label}
                      </Badge>
                    </div>
                    <div>
                      {item.tk_outlet ? (
                        <Link href={`/tenants/${item.tk_outlet}`} className="text-sm font-bold text-slate-800 hover:text-primary hover:underline">
                          {item.outlet_name}
                        </Link>
                      ) : (
                        <p className="text-sm font-bold text-slate-800">{item.outlet_name}</p>
                      )}
                      <p className="mt-1 text-[11px] font-medium text-slate-500">{item.owner_name}</p>
                      {item.owner_code && (
                        <p className="text-[10px] font-mono text-slate-400">Kode Referral: {item.owner_code}</p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg border border-slate-100 bg-white p-3">
                        <p className="text-[9px] font-bold uppercase text-slate-400">Koin</p>
                        <p className="mt-1 text-sm font-black text-slate-900">{item.tk_jumlah?.toLocaleString()} Koin</p>
                      </div>
                      <div className="rounded-lg border border-slate-100 bg-white p-3">
                        <p className="text-[9px] font-bold uppercase text-slate-400">Nominal</p>
                        <p className="mt-1 text-sm font-black text-primary">Rp {item.tk_total?.toLocaleString("id-ID")}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {item.tk_metode_bayar === "bonus" ? (
                        <Badge className="border border-purple-100 bg-purple-50 text-[8px] font-bold uppercase text-purple-600 shadow-none">Bonus</Badge>
                      ) : item.tk_metode_bayar === "transfer" ? (
                        <Badge className="border border-orange-100 bg-orange-50 text-[8px] font-bold uppercase text-slate-600 shadow-none">Transfer</Badge>
                      ) : (
                        <Badge className="border border-amber-100 bg-amber-50 text-[8px] font-bold uppercase text-slate-600 shadow-none">Midtrans</Badge>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setSelectedTopup(item); setIsPreviewOpen(true); }}
                      className="h-8 w-full text-[10px] font-bold uppercase text-primary"
                    >
                      {isActionable && item.tk_metode_bayar !== "bonus" ? "Verifikasi" : "Detail"}
                      <ChevronRight className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={filteredData.length}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      </Card>

      {/* OPERATIONAL DETAIL MODAL */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden border border-slate-200 rounded-lg shadow-xl bg-white">
          <VisuallyHidden.Root><DialogTitle>Detail Topup</DialogTitle></VisuallyHidden.Root>
          
          <div className="p-4 border-b border-slate-100 bg-white">
            <div className="flex items-center justify-between mb-3">
              <Badge variant="outline" className="font-bold text-[9px] uppercase tracking-wider text-slate-400 border-slate-200">
                {selectedTopup?.tk_id}
              </Badge>
              <span className="text-[9px] font-medium text-slate-400 uppercase">{selectedTopup && formatDateTime(selectedTopup.tk_created).display}</span>
            </div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight leading-none mb-1 font-heading">
              Topup {selectedTopup?.tk_jumlah?.toLocaleString()} Koin
            </h3>
            <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
              <Store className="h-3 w-3" />
              {selectedTopup?.tk_outlet ? (
                <Link
                  href={`/tenants/${selectedTopup.tk_outlet}`}
                  className="hover:text-primary hover:underline transition-colors font-semibold"
                >
                  {selectedTopup.outlet_name}
                </Link>
              ) : (
                selectedTopup?.outlet_name
              )}
            </p>
            <p className="mt-1 text-[10px] font-medium text-slate-400">
              Owner: <span className="font-bold text-slate-600">{selectedTopup?.owner_name || "Nama tidak tersedia"}</span>
              {selectedTopup?.owner_code ? (
                <span className="ml-2 font-mono text-slate-500">#{selectedTopup.owner_code}</span>
              ) : null}
            </p>
          </div>

          <div className="p-4 space-y-4 bg-slate-50/30">
            {/* PROOF OF PAYMENT SECTION */}
            {selectedTopup?.tk_metode_bayar === "transfer" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Bukti Pembayaran</label>
                  {selectedTopup.tk_bukti && (
                    <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-600">
                      <Check className="h-3 w-3" /> Bukti Diunggah
                    </div>
                  )}
                </div>

                {selectedTopup.tk_bukti ? (
                   <div className="group relative aspect-video rounded border border-slate-200 overflow-hidden bg-slate-200">
                      <img src={resolveUploadUrl(selectedTopup.tk_bukti)} className="w-full h-full object-cover" alt="Proof" />
                      <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                        <button
                          type="button"
                          onClick={() => setProofPreviewUrl(resolveUploadUrl(selectedTopup.tk_bukti))}
                          className="bg-white text-slate-900 px-3 py-1.5 rounded font-bold text-[10px] flex items-center gap-2"
                        >
                           <ExternalLink className="h-3 w-3" /> Fullscreen
                        </button>
                      </div>
                   </div>
                ) : (
                  <div className="aspect-video rounded bg-slate-100 border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                    <Clock className="h-6 w-6 mb-1 opacity-30" />
                    <p className="text-[9px] font-bold uppercase tracking-widest">Menunggu Bukti</p>
                  </div>
                )}
              </div>
            )}

            {selectedTopup?.tk_metode_bayar === "bonus" || selectedTopup?.tk_metode_bayar === "inject" ? (
              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Detail Tambahan Koin</label>
                  <div className="p-3 bg-purple-50/50 border border-purple-100 rounded-lg">
                    <p className="text-xs font-semibold text-slate-700 flex items-start gap-2">
                      <Gift className="h-4 w-4 text-purple-500 shrink-0 mt-0.5" />
                      <span>{selectedTopup.keterangan || "Penambahan koin oleh admin AyoCuci."}</span>
                    </p>
                  </div>
                </div>
                {selectedTopup.tk_bukti && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Lampiran Bukti / Dokumen</label>
                      <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-600">
                        <Check className="h-3 w-3" /> Lampiran Ada
                      </div>
                    </div>
                    <div className="group relative aspect-video rounded border border-slate-200 overflow-hidden bg-slate-200">
                      <img src={resolveUploadUrl(selectedTopup.tk_bukti)} className="w-full h-full object-cover" alt="Proof" />
                      <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                        <button
                          type="button"
                          onClick={() => setProofPreviewUrl(resolveUploadUrl(selectedTopup.tk_bukti))}
                          className="bg-white text-slate-900 px-3 py-1.5 rounded font-bold text-[10px] flex items-center gap-2"
                        >
                           <ExternalLink className="h-3 w-3" /> Fullscreen
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {/* TRANSACTION SUMMARY */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 bg-white border border-slate-200 rounded">
                <p className="text-[8px] font-bold uppercase text-slate-400 mb-0.5">Metode</p>
                <div className="font-bold text-xs text-slate-700 uppercase">{selectedTopup?.tk_metode_bayar}</div>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded">
                <p className="text-[8px] font-bold uppercase text-slate-400 mb-0.5">Nominal</p>
                <div className="font-bold text-xs text-primary">Rp {selectedTopup?.tk_total?.toLocaleString("id-ID")}</div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded mt-2 text-[10px] space-y-2">
                <p className="font-bold uppercase text-slate-500 mb-2 border-b border-slate-200 pb-1 flex items-center gap-1">
                   <Clock className="h-3 w-3" /> Audit Log
                </p>
                <div className="flex justify-between items-center">
                   <span className="text-slate-500 font-medium">Tagihan Dibuat:</span>
                   <span className="font-bold text-slate-800">
                      {selectedTopup?.tk_created ? format(new Date(selectedTopup.tk_created), "dd MMM yyyy HH:mm") : "-"}
                   </span>
                </div>
                <div className="flex justify-between items-center">
                   <span className="text-slate-500 font-medium">Waktu Upload Bukti:</span>
                   <span className="font-bold text-slate-800">
                      {selectedTopup?.tk_tanggal_upload_bukti ? format(new Date(selectedTopup.tk_tanggal_upload_bukti), "dd MMM yyyy HH:mm") : "-"}
                   </span>
                </div>
                {selectedTopup?.tk_tanggal_validasi && (
                   <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Divalidasi Pada:</span>
                      <span className="font-bold text-emerald-600">
                         {format(new Date(selectedTopup.tk_tanggal_validasi), "dd MMM yyyy HH:mm")}
                      </span>
                   </div>
                )}
                {selectedTopup?.tk_staf_validasi && (
                   <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Divalidasi Oleh:</span>
                      <span className="font-bold text-emerald-600">
                         {selectedTopup.tk_staf_validasi}
                      </span>
                   </div>
                )}
             </div>
          </div>

          <div className="p-4 bg-white border-t border-slate-100 flex flex-col gap-2">
            {selectedTopup && isTopupActionable(selectedTopup.tk_status) ? (
              <div className="flex flex-col gap-2">
                {selectedTopup.tk_metode_bayar === 'transfer' ? (
                   <div className="grid grid-cols-2 gap-2">
                    <PermissionGate module="topups" action="confirm">
                      <Button
                        disabled={confirming || !selectedTopup.tk_bukti}
                        onClick={() => handleAction(selectedTopup.tk_id, "success")}
                        className="h-10 rounded font-bold text-[10px] uppercase tracking-wider"
                      >
                        Setujui
                      </Button>
                    </PermissionGate>
                    <PermissionGate module="topups" action="cancel">
                      <Button
                        variant="outline"
                        disabled={confirming}
                        onClick={() => handleAction(selectedTopup.tk_id, "failed")}
                        className="h-10 rounded font-bold text-[10px] uppercase tracking-wider text-rose-600 border-slate-200"
                      >
                        Tolak
                      </Button>
                    </PermissionGate>
                  </div>
                ) : (
                  <PermissionGate module="topups" action="cancel">
                    <Button
                      variant="outline"
                      disabled={confirming}
                      onClick={() => handleCancelMidtrans(selectedTopup.tk_id)}
                      className="h-10 rounded font-bold text-[10px] uppercase tracking-wider text-amber-600 border-amber-200 bg-amber-50/30"
                    >
                      Batalkan Midtrans
                    </Button>
                  </PermissionGate>
                )}
              </div>
            ) : (
              <div className="p-2.5 bg-slate-50 rounded border border-slate-100 text-center">
                 <p className="text-[9px] font-bold uppercase text-slate-400 tracking-widest italic">
                   Locked: {getTopupStatusUi(selectedTopup?.tk_status).label}
                 </p>
              </div>
            )}
             <p className="text-[8px] text-center font-medium text-slate-400 italic">
                Saldo outlet akan langsung diperbarui.
             </p>
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
    </div>
  );
}
