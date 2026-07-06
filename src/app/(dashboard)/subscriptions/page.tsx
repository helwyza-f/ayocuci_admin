"use client";

import React from "react";
import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  Clock,
  RefreshCw,
  Search,
  Store,
  FilterX,
  ChevronRight,
  ExternalLink,
  CreditCard,
  ArrowRightLeft,
  Loader2 as LoaderIcon,
  Check,
  ChevronsUpDown,
  History,
  Activity,
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
import { addonService, AddonTransaction } from "@/services/addon.service";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { AxiosError } from "axios";
import { ApiErrorResponse, ApiResponse } from "@/types/api";
import Pagination from "@/components/shared/pagination";
import DateRangeFilter, { DateRange, filterByDateRange } from "@/components/shared/date-range-filter";
import { ExportExcelButton } from "@/components/shared/export-excel-button";
import { Tenant } from "@/types/tenant";
import { Owner, EconomyConfig } from "@/types/domain";
import { apiFetcher } from "@/lib/fetcher";
import { resolveUploadUrl } from "@/lib/upload-url";
import useSWR from "swr";
import { useRegionNames } from "@/hooks/use-region-names";
import PermissionGate from "@/components/shared/permission-gate";
import { useAuthStore } from "@/store/use-auth-store";

const PAGE_SIZE = 25;

// ─── KPI Card (gaya analytics) ────────────────────────────
function KpiCard({
  label, value, sub, icon: Icon, color,
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string;
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

function SubscriptionsContent() {
  const { hasPermission } = useAuthStore();
  const canReadEconomy = hasPermission("economy", "read");
  const canReadUsers = hasPermission("users", "read");
  const canExportSubscriptions = hasPermission("subscriptions", "export");
  const canConfirmTopups = hasPermission("topups", "confirm");
  const canCancelTopups = hasPermission("topups", "cancel");
  const [data, setData] = useState<AddonTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [page, setPage] = useState(1);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [licenseTypeFilter, setLicenseTypeFilter] = useState<string>("all");

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
  const [openOutlet, setOpenOutlet] = useState(false);

  const [selectedTrx, setSelectedTrx] = useState<AddonTransaction | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const { data: tenantsResponse } = useSWR<ApiResponse<Tenant[]>>(
    "/tenants",
    apiFetcher,
    {
      dedupingInterval: 60_000,
      keepPreviousData: true,
      revalidateOnFocus: false,
    },
  );

  const { data: configsResponse } = useSWR<ApiResponse<EconomyConfig[]>>(
    canReadEconomy ? "/economy/configs" : null,
    apiFetcher,
    {
      dedupingInterval: 60_000,
      keepPreviousData: true,
      revalidateOnFocus: false,
    },
  );

  const pricePerCoin = useMemo(() => {
    const configs = configsResponse?.data || [];
    const priceConfig = configs.find((c) => c.cfg_key === "price_per_coin");
    return priceConfig ? Number(priceConfig.cfg_value) : 100;
  }, [configsResponse]);

  const { data: ownersResponse } = useSWR<ApiResponse<Owner[]>>(
    canReadUsers ? "/users" : null,
    apiFetcher,
    {
      dedupingInterval: 60_000,
      keepPreviousData: true,
      revalidateOnFocus: false,
    },
  );

  const formatDateTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      const timeStr = format(date, "HH:mm", { locale: id });
      const fullDateStr = format(date, "dd/MM/yy", { locale: id });
      return {
        display: isToday
          ? `Today, ${timeStr}`
          : `${fullDateStr} ${timeStr}`,
        isToday,
      };
    } catch {
      return { display: "-", isToday: false };
    }
  };

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (methodFilter !== "all") params.append("metode", methodFilter);
      if (startDate)
        params.append("start_date", format(startDate, "yyyy-MM-dd"));
      if (endDate) params.append("end_date", format(endDate, "yyyy-MM-dd"));

      const res = await addonService.getAll(params.toString());
      setData(res.data || []);
    } catch {
      toast.error("Failed to sync transactions");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, methodFilter, startDate, endDate]);

  useEffect(() => {
    fetchTransactions();
    setPage(1);
  }, [fetchTransactions]);

  const resolveLicenseType = useCallback((item: AddonTransaction) => {
    const itemNames = (item.item_names || "").toUpperCase();
    const trxId = (item.ha_id || "").toUpperCase();
    if (itemNames.includes("AKTIVASI LISENSI PRO") || trxId.startsWith("PRO-")) {
      return "pro";
    }
    return "addon";
  }, []);

  const stats = useMemo(() => {
    const total = data.length;
    const pending = data.filter(d => d.ha_status === 'PENDING_VALIDATION').length;
    const success = data.filter(d => d.ha_status === 'SUCCESS').length;
    const proTotal = data.filter((d) => resolveLicenseType(d) === "pro").length;
    const addonTotal = data.filter((d) => resolveLicenseType(d) === "addon").length;
    return { total, pending, success, proTotal, addonTotal };
  }, [data, resolveLicenseType]);

  const uniqueOutlets = useMemo(
    () =>
      Array.from(
        new Set(
          (data || [])
            .map((item) => item?.outlet_name)
            .filter((name): name is string => Boolean(name)),
        ),
      ),
    [data],
  );

  const filteredData = useMemo(() => {
    const byFilter = (data || []).filter((item) => {
      if (!item) return false;
      const cleanSearch = searchQuery.toLowerCase();
      const matchesSearch =
        item.ha_id.toLowerCase().includes(cleanSearch) ||
        item.item_names.toLowerCase().includes(cleanSearch);
      const matchesOutlet =
        outletFilter === "all" || item.outlet_name === outletFilter;
      const matchesType =
        licenseTypeFilter === "all" || resolveLicenseType(item) === licenseTypeFilter;
      return matchesSearch && matchesOutlet && matchesType;
    });
    return filterByDateRange(byFilter, (item) => item.ha_created, dateRange);
  }, [data, searchQuery, outletFilter, dateRange, licenseTypeFilter, resolveLicenseType]);

  const tenants = useMemo(() => tenantsResponse?.data || [], [tenantsResponse]);
  const regionNames = useRegionNames(tenants);

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

  const subscriptionExportRows = useMemo(
    () =>
      filteredData.flatMap((item) => {
        const outlet = item.ha_outlet ? tenantMap.get(item.ha_outlet) : undefined;
        const owner = outlet?.owner_id != null
          ? ownerMap.get(String(outlet.owner_id))
          : ownerByNameMap.get(item.owner_name || "");

        const baseRow = {
          transaction_date: item.ha_created ?? "",
          ha_id: item.ha_id ?? "",
          owner_id: outlet?.owner_id ?? owner?.id ?? "",
          owner_name: item.owner_name ?? outlet?.owner_name ?? owner?.name ?? "",
          owner_email: outlet?.owner_email ?? owner?.email ?? "",
          owner_nohp: outlet?.owner_nohp ?? owner?.nohp ?? "",
          ha_outlet: item.ha_outlet ?? "",
          outlet_name: item.outlet_name ?? outlet?.ot_nama ?? "",
          outlet_city: regionNames.cityName(outlet?.ot_kota),
          outlet_province: regionNames.provinceName(outlet?.ot_provinsi),
          join_date: outlet?.ot_created ?? owner?.created_at ?? "",
          outlet_koin: outlet?.ot_koin ?? "",
          ha_metode_bayar: item.ha_metode_bayar ?? "",
          transaction_status: item.ha_status ?? "",
        };

        if (item.details && item.details.length > 0) {
          return item.details.map((detail) => ({
            ...baseRow,
            item_name: detail.item_name ?? item.item_names ?? "",
            item_price: detail.dha_harga ?? item.ha_total ?? 0,
            expired_at: detail.ha_berakhir ?? "",
            feature_status: detail.feature_status ?? "",
          }));
        }

        return [{
          ...baseRow,
          item_name: item.item_names ?? "",
          item_price: item.ha_total ?? 0,
          expired_at: "",
          feature_status: "",
        }];
      }),
    [filteredData, ownerByNameMap, ownerMap, regionNames, tenantMap],
  );

  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);
  const paginatedData = filteredData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setMethodFilter("all");
    setLicenseTypeFilter("all");
    setOutletFilter("all");
    setStartDate(undefined);
    setEndDate(undefined);
    setDateRange({ start: "", end: "" });
  };

  const handleApprove = async (id: string) => {
    setConfirming(true);
    try {
      const res = await addonService.approve(id);
      if (res.status) {
        toast.success("Transaksi berhasil diverifikasi");
        setIsPreviewOpen(false);
        fetchTransactions();
      }
    } catch (err) {
      const error = err as AxiosError<ApiErrorResponse>;
      toast.error(error.response?.data?.message || "Gagal memverifikasi transaksi");
    } finally {
      setConfirming(false);
    }
  };

  const handleReject = async (id: string) => {
    setConfirming(true);
    try {
      const res = await addonService.reject(id);
      if (res.status) {
        toast.success("Transaksi berhasil ditolak");
        setIsPreviewOpen(false);
        fetchTransactions();
      }
    } catch (err) {
      const error = err as AxiosError<ApiErrorResponse>;
      toast.error(error.response?.data?.message || "Gagal menolak transaksi");
    } finally {
      setConfirming(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "PENDING":
        return { label: "Menunggu Pembayaran", class: "bg-amber-50 text-amber-600 border-amber-100" };
      case "PENDING_VALIDATION":
        return { label: "Menunggu Validasi", class: "bg-orange-50 text-orange-600 border-orange-100 animate-pulse" };
      case "SUCCESS":
        return { label: "Sukses", class: "bg-emerald-50 text-emerald-600 border-emerald-100" };
      case "FAILED":
        return { label: "Ditolak", class: "bg-rose-50 text-rose-600 border-rose-100" };
      case "CANCELED":
        return { label: "Dibatalkan", class: "bg-slate-100 text-slate-500 border-slate-200" };
      default:
        return { label: status, class: "bg-slate-50 text-slate-400 border-slate-100" };
    }
  };

  return (
    <div className="space-y-6">
      {/* COMMAND BAR HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2 font-heading">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Aktivasi Lisensi
          </h1>
          <p className="text-xs font-medium text-slate-500">
            Pantau riwayat aktivasi lisensi PRO dan layanan add-on. Validasi transaksi mengikuti izin Top Up & Penagihan.
          </p>
        </div>

          <div className="flex flex-wrap items-center gap-2">
          <PermissionGate module="subscriptions" action="export">
            <ExportExcelButton
              data={subscriptionExportRows}
              filename="subscriptions_report"
              sheetName="Subscriptions"
              disabled={regionNames.isLoading || !canExportSubscriptions}
              columns={[
                { header: "Tanggal Transaksi", key: "transaction_date", width: 22, format: (v) => v ? format(new Date(v), "dd/MM/yyyy HH:mm") : "" },
                { header: "ID", key: "ha_id", width: 22 },
                { header: "ID Owner", key: "owner_id", width: 12 },
                { header: "Nama Owner", key: "owner_name", width: 25 },
                { header: "Email", key: "owner_email", width: 30 },
                { header: "No HP Owner", key: "owner_nohp", width: 18 },
                { header: "ID Outlet", key: "ha_outlet", width: 14 },
                { header: "Nama Outlet", key: "outlet_name", width: 25 },
                { header: "Kota", key: "outlet_city", width: 18 },
                { header: "Provinsi", key: "outlet_province", width: 18 },
                { header: "Tanggal Bergabung", key: "join_date", width: 18, format: (v) => v ? format(new Date(v), "dd/MM/yyyy HH:mm") : "" },
                { header: "Koin", key: "outlet_koin", width: 12 },
                { header: "Harga", key: "item_price", width: 15, format: (v, item) => {
                   if (v == null) return "Rp 0";
                   if (item.ha_metode_bayar === "KOIN") return `Rp ${(Number(v) * pricePerCoin).toLocaleString()}`;
                   return `Rp ${Number(v).toLocaleString()}`;
                }},
                { header: "Metode Pembayaran", key: "ha_metode_bayar", width: 20 },
                { header: "Item", key: "item_name", width: 45 },
                { header: "EXP", key: "expired_at", width: 20, format: (v, item) => {
                  if (v) return format(new Date(String(v)), "dd/MM/yyyy HH:mm");
                  if (item.item_name === "Aktivasi Lisensi PRO" && item.transaction_status === "SUCCESS") return "Permanen";
                  return "";
                }},
                { header: "Status", key: "transaction_status", width: 16 },
              ]}
            />
          </PermissionGate>
           <Button
            variant="ghost"
            size="sm"
            onClick={fetchTransactions}
            disabled={loading}
            className="h-8 px-2 font-bold text-[10px] uppercase tracking-wider gap-2 text-slate-500"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            Sinkron Data
          </Button>
        </div>
      </div>

      {/* OPERATIONAL METRICS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total Permintaan"
          sub="Semua transaksi langganan masuk"
          value={loading ? "—" : stats.total}
          icon={Activity}
          color="bg-slate-100 text-slate-600"
        />
        <KpiCard
          label="Menunggu Review"
          sub="Menunggu verifikasi pembayaran"
          value={loading ? "—" : stats.pending}
          icon={Clock}
          color="bg-orange-50 text-primary"
        />
        <KpiCard
          label="Total Aktivasi PRO"
          sub="Permintaan aktivasi lisensi PRO"
          value={loading ? "—" : stats.proTotal}
          icon={ShieldCheck}
          color="bg-blue-50 text-blue-600"
        />
        <KpiCard
          label="Total Add-on"
          sub="Permintaan layanan add-on"
          value={loading ? "—" : stats.addonTotal}
          icon={Check}
          color="bg-violet-50 text-violet-600"
        />
      </div>

      {/* FILTER & SEARCH COMMAND BAR */}
      <Card className="p-1 border border-slate-200 rounded-lg bg-white overflow-hidden shadow-none">
        <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Filter ID atau layanan..."
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
                <Button variant="ghost" size="sm" className="h-8 font-bold text-[10px] px-2 gap-1.5 text-slate-600">
                  <Store className="h-3 w-3" />
                  {outletFilter === "all" ? "Outlet" : outletFilter}
                  <ChevronsUpDown className="h-2.5 w-2.5 opacity-40" />
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

            {/* Status Filter — compact select */}
            <div className="relative flex items-center">
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="h-8 pl-2.5 pr-7 text-[10px] font-bold uppercase text-slate-600 bg-transparent border border-slate-200 rounded-md focus:ring-0 focus:outline-none cursor-pointer appearance-none hover:bg-slate-50 transition-colors"
              >
                <option value="all">Semua Status</option>
                <option value="PENDING_VALIDATION">Menunggu Review</option>
                <option value="SUCCESS">Sukses</option>
                <option value="FAILED">Gagal</option>
                <option value="CANCELED">Dibatalkan</option>
              </select>
              <ChevronsUpDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
            </div>

            {/* Method Filter — compact select */}
            <div className="relative flex items-center">
              <select
                value={methodFilter}
                onChange={(e) => { setMethodFilter(e.target.value); setPage(1); }}
                className="h-8 pl-2.5 pr-7 text-[10px] font-bold uppercase text-slate-600 bg-transparent border border-slate-200 rounded-md focus:ring-0 focus:outline-none cursor-pointer appearance-none hover:bg-slate-50 transition-colors"
              >
                <option value="all">Semua Metode</option>
                <option value="TRANSFER">Transfer Bank</option>
                <option value="MIDTRANS">Midtrans</option>
                <option value="KOIN">Koin</option>
                <option value="FREE">Gratis</option>
              </select>
              <ChevronsUpDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
            </div>

            <div className="relative flex items-center">
              <select
                value={licenseTypeFilter}
                onChange={(e) => { setLicenseTypeFilter(e.target.value); setPage(1); }}
                className="h-8 pl-2.5 pr-7 text-[10px] font-bold uppercase text-slate-600 bg-transparent border border-slate-200 rounded-md focus:ring-0 focus:outline-none cursor-pointer appearance-none hover:bg-slate-50 transition-colors"
              >
                <option value="all">Semua Item</option>
                <option value="pro">Aktivasi Pro</option>
                <option value="addon">Add-on</option>
              </select>
              <ChevronsUpDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
            </div>

            <div className="hidden h-4 w-px bg-slate-100 xl:block" />
            <DateRangeFilter
              value={dateRange}
              onChange={handleDateRange}
            />
            <div className="hidden h-4 w-px bg-slate-100 xl:block" />

            <Button
              variant="ghost"
              size="icon"
              onClick={() => { resetFilters(); }}
              className="h-8 w-8 text-slate-400 hover:text-rose-600"
            >
              <FilterX className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </Card>

      {/* OPERATIONAL DATA TABLE */}
      <Card className="border border-slate-200 rounded-lg overflow-hidden bg-white min-h-[400px] relative shadow-none">
        {loading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-50 flex flex-col items-center justify-center">
            <LoaderIcon className="h-6 w-6 animate-spin text-primary" />
            <p className="mt-2 text-[9px] font-bold uppercase tracking-widest text-slate-400">Sinkronisasi Data...</p>
          </div>
        )}

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider">Transaksi</th>
                <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider">Bisnis</th>
                <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider">Item Layanan</th>
                <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider text-right">Nominal</th>
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
                  const status = getStatusConfig(item.ha_status);
                  const dt = formatDateTime(item.ha_created);
                  return (
                    <tr key={item.ha_id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-5 py-3">
                        <div className="font-bold text-slate-900 text-xs">#{item.ha_id}</div>
                        <div className="flex items-center gap-1 text-[9px] font-medium text-slate-400 uppercase">
                          {dt.display}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        {item.ha_outlet ? (
                          <Link
                            href={`/tenants/${item.ha_outlet}`}
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
                      </td>
                      <td className="px-5 py-3 max-w-[220px]">
                        <div className="space-y-1.5">
                          <Badge
                            variant="outline"
                            className={cn(
                              "rounded px-1.5 py-0 text-[8px] font-bold uppercase border shadow-none w-fit",
                              resolveLicenseType(item) === "pro"
                                ? "border-blue-200 bg-blue-50 text-blue-700"
                                : "border-violet-200 bg-violet-50 text-violet-700"
                            )}
                          >
                            {resolveLicenseType(item) === "pro" ? "Aktivasi PRO" : "Add-on"}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="rounded px-1.5 py-0 text-[8px] font-bold uppercase border-slate-200 bg-slate-50 max-w-full block truncate"
                            title={item.item_names}
                          >
                            {item.item_names}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right">
                        {item.ha_metode_bayar === "KOIN" ? (
                           <>
                             <div className="font-bold text-slate-900 text-xs">
                               Rp {(item.ha_total * pricePerCoin).toLocaleString("id-ID")}
                             </div>
                             <div className="text-[9px] font-bold uppercase text-slate-400 tracking-wide mt-0.5">
                               {item.ha_total.toLocaleString("id-ID")} KOIN
                             </div>
                           </>
                        ) : (
                           <>
                             <div className="font-bold text-slate-900 text-xs">
                               Rp {item.ha_total.toLocaleString("id-ID")}
                             </div>
                             <div className="text-[9px] font-bold uppercase text-slate-400 tracking-wide mt-0.5">
                               {item.ha_metode_bayar || "—"}
                             </div>
                           </>
                        )}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <Badge className={cn("rounded px-1.5 py-0 text-[8px] font-bold uppercase border shadow-none", status.class)}>
                          {status.label}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setSelectedTrx(item); setIsPreviewOpen(true); }}
                          className="h-7 px-2 font-bold text-[9px] uppercase text-primary hover:bg-primary/5 gap-1"
                        >
                          Detail <ChevronRight className="h-3 w-3" />
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
              const status = getStatusConfig(item.ha_status);
              const dt = formatDateTime(item.ha_created);
              return (
                <div key={`mobile-${item.ha_id}`} className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="break-all text-xs font-bold text-slate-900">#{item.ha_id}</p>
                        <p className="mt-1 text-[10px] font-bold uppercase text-slate-400">{dt.display}</p>
                      </div>
                      <Badge className={cn("rounded px-1.5 py-0 text-[8px] font-bold uppercase border shadow-none", status.class)}>
                        {status.label}
                      </Badge>
                    </div>
                    <div>
                      {item.ha_outlet ? (
                        <Link href={`/tenants/${item.ha_outlet}`} className="text-sm font-bold text-slate-800 hover:text-primary hover:underline">
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
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          "rounded px-1.5 py-0 text-[8px] font-bold uppercase border shadow-none",
                          resolveLicenseType(item) === "pro"
                            ? "border-blue-200 bg-blue-50 text-blue-700"
                            : "border-violet-200 bg-violet-50 text-violet-700"
                        )}
                      >
                        {resolveLicenseType(item) === "pro" ? "Aktivasi PRO" : "Add-on"}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="max-w-full truncate rounded px-1.5 py-0 text-[8px] font-bold uppercase border-slate-200 bg-slate-50 shadow-none"
                        title={item.item_names}
                      >
                        {item.item_names}
                      </Badge>
                    </div>
                    <div className="rounded-lg border border-slate-100 bg-white p-3">
                      <p className="text-[9px] font-bold uppercase text-slate-400">Nominal</p>
                      <p className="mt-1 text-sm font-black text-slate-900">
                        Rp {item.ha_metode_bayar === "KOIN"
                          ? (item.ha_total * pricePerCoin).toLocaleString("id-ID")
                          : item.ha_total.toLocaleString("id-ID")}
                      </p>
                      <p className="mt-1 text-[10px] font-bold uppercase text-slate-400">
                        {item.ha_metode_bayar === "KOIN"
                          ? `${item.ha_total.toLocaleString("id-ID")} Koin`
                          : item.ha_metode_bayar || "—"}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setSelectedTrx(item); setIsPreviewOpen(true); }}
                      className="h-8 w-full text-[10px] font-bold uppercase text-primary"
                    >
                      Detail <ChevronRight className="ml-1 h-3 w-3" />
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
          <VisuallyHidden.Root><DialogTitle>Detail Transaksi</DialogTitle></VisuallyHidden.Root>
          
          <div className="p-4 border-b border-slate-100 bg-white">
            <div className="flex items-center justify-between mb-3">
              <Badge variant="outline" className="font-bold text-[9px] uppercase tracking-wider text-slate-400 border-slate-200">
                {selectedTrx?.ha_id}
              </Badge>
              <span className="text-[9px] font-medium text-slate-400 uppercase">{selectedTrx && formatDateTime(selectedTrx.ha_created).display}</span>
            </div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight leading-none mb-1 font-heading">
              {selectedTrx?.item_names}
            </h3>
            <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
              <Store className="h-3 w-3" />
              {selectedTrx?.ha_outlet ? (
                <Link
                  href={`/tenants/${selectedTrx.ha_outlet}`}
                  className="hover:text-primary hover:underline transition-colors font-semibold"
                >
                  {selectedTrx.outlet_name}
                </Link>
              ) : (
                selectedTrx?.outlet_name
              )}
            </p>
          </div>

          <div className="p-4 space-y-4 bg-slate-50/30">
            {/* PROOF OF PAYMENT SECTION */}
            {selectedTrx?.ha_metode_bayar === "TRANSFER" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Bukti Pembayaran</label>
                  {selectedTrx.ha_bukti && (
                    <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-600">
                      <Check className="h-3 w-3" /> Bukti Diunggah
                    </div>
                  )}
                </div>

                {selectedTrx.ha_bukti ? (
                   <div className="group relative aspect-video rounded border border-slate-200 overflow-hidden bg-slate-200">
                      <img src={resolveUploadUrl(selectedTrx.ha_bukti)} className="w-full h-full object-cover" alt="Proof" />
                      <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                        <a href={resolveUploadUrl(selectedTrx.ha_bukti)} target="_blank" rel="noreferrer" className="bg-white text-slate-900 px-3 py-1.5 rounded font-bold text-[10px] flex items-center gap-2">
                          <ExternalLink className="h-3 w-3" /> Fullscreen
                        </a>
                      </div>
                   </div>
                ) : (
                  <div className="aspect-video rounded bg-slate-100 border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                    <Clock className="h-6 w-6 mb-1 opacity-30" />
                    <p className="text-[9px] font-bold uppercase tracking-widest">Menunggu Upload</p>
                  </div>
                )}
              </div>
            )}

            {/* TRANSACTION SUMMARY */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 bg-white border border-slate-200 rounded">
                <p className="text-[8px] font-bold uppercase text-slate-400 mb-0.5">Metode</p>
                <div className="font-bold text-xs text-slate-700 flex items-center gap-1.5 uppercase">
                  {selectedTrx?.ha_metode_bayar === 'TRANSFER' ? <ArrowRightLeft className="h-3 w-3" /> : <CreditCard className="h-3 w-3" />}
                  {selectedTrx?.ha_metode_bayar}
                </div>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded">
                <p className="text-[8px] font-bold uppercase text-slate-400 mb-0.5">Nominal</p>
                <div className="font-bold text-xs text-primary">
                  Rp {selectedTrx?.ha_metode_bayar === "KOIN" 
                        ? (selectedTrx.ha_total * pricePerCoin).toLocaleString("id-ID")
                        : selectedTrx?.ha_total.toLocaleString("id-ID")}
                </div>
                {selectedTrx?.ha_metode_bayar === "KOIN" && (
                  <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5 tracking-wider">
                    ({selectedTrx.ha_total.toLocaleString("id-ID")} Koin)
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 bg-white border-t border-slate-100 flex flex-col gap-2">
            {selectedTrx?.ha_status === "PENDING_VALIDATION" || selectedTrx?.ha_status === "PENDING" ? (
              <div className="grid grid-cols-2 gap-2">
                <PermissionGate module="topups" action="confirm">
                  <Button
                    disabled={confirming || !selectedTrx.ha_bukti || !canConfirmTopups}
                    onClick={() => handleApprove(selectedTrx.ha_id)}
                    className="h-10 rounded font-bold text-[10px] uppercase tracking-wider"
                  >
                    {confirming ? <LoaderIcon className="h-4 w-4 animate-spin" /> : "Setujui"}
                  </Button>
                </PermissionGate>
                <PermissionGate module="topups" action="cancel">
                  <Button
                    variant="outline"
                    disabled={confirming || !canCancelTopups}
                    onClick={() => handleReject(selectedTrx.ha_id)}
                    className="h-10 rounded font-bold text-[10px] uppercase tracking-wider text-rose-600 border-slate-200"
                  >
                    Tolak
                  </Button>
                </PermissionGate>
              </div>
            ) : (
              <div className="p-2.5 bg-slate-50 rounded border border-slate-100 text-center">
                 <p className="text-[9px] font-bold uppercase text-slate-400 tracking-widest italic">
                   Transaksi Final: {selectedTrx?.ha_status}
                 </p>
              </div>
            )}
            <p className="text-[8px] text-center font-medium text-slate-400 italic">
               Perubahan akses outlet akan langsung berlaku.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function SubscriptionsPage() {
  return (
    <PermissionGate module="subscriptions" action="read">
      <SubscriptionsContent />
    </PermissionGate>
  );
}
