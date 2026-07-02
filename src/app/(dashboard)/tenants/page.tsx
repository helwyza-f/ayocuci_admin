"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Store,
  ChevronsUpDown,
  User,
  FilterX,
  Plus,
  ArrowUpRight,
  Database,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { cn } from "@/lib/utils";
import { Tenant } from "@/types/tenant";
import { format } from "date-fns";
import { Owner } from "@/types/domain";
import { ApiResponse } from "@/types/api";
import useSWR from "swr";
import { apiFetcher } from "@/lib/fetcher";
import TableSkeleton from "@/components/shared/table-skeleton";
import { Badge } from "@/components/ui/badge";
import Pagination from "@/components/shared/pagination";
import DateRangeFilter, { DateRange, filterByDateRange } from "@/components/shared/date-range-filter";
import { ExportExcelButton } from "@/components/shared/export-excel-button";
import { useRegionNames } from "@/hooks/use-region-names";
import PermissionGate from "@/components/shared/permission-gate";

const PAGE_SIZE = 20;

export default function TenantsPage() {
  return (
    <PermissionGate module="tenants" action="read">
      <TenantsPageContent />
    </PermissionGate>
  );
}

function TenantsPageContent() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data: tenantsResponse, isLoading } = useSWR<ApiResponse<Tenant[]>>(
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
  const tenants = useMemo(() => tenantsResponse?.data || [], [tenantsResponse]);
  const owners = useMemo(() => ownersResponse?.data || [], [ownersResponse]);
  const regionNames = useRegionNames(tenants);

  const [open, setOpen] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [koinThreshold, setKoinThreshold] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange>({ start: "", end: "" });

  const filteredTenants = useMemo(() => {
    const byFilter = tenants.filter((t) => {
      const cleanSearch = search.toLowerCase();
      const matchesSearch =
        t.ot_nama.toLowerCase().includes(cleanSearch) ||
        t.ot_id.toLowerCase().includes(cleanSearch);
      const matchesOwner =
        selectedOwner === "all" || String(t.owner_id) === selectedOwner;
      const subscriptionStatus = String(t.subscription_status || "").toUpperCase();
      const matchesStatus =
        selectedStatus === "all" ||
        (selectedStatus === "outlet_active" && Number(t.ot_status) === 1) ||
        (selectedStatus === "outlet_inactive" && Number(t.ot_status) !== 1) ||
        (selectedStatus === "pro" && subscriptionStatus === "PRO") ||
        (selectedStatus === "trial" && subscriptionStatus === "TRIAL") ||
        (selectedStatus === "expired" && subscriptionStatus === "EXPIRED");
      const matchesKoin =
        koinThreshold === "all" ||
        Number(t.ot_koin || 0) < Number(koinThreshold);
      return matchesSearch && matchesOwner && matchesStatus && matchesKoin;
    });
    return filterByDateRange(byFilter, (t) => t.ot_created, dateRange);
  }, [search, selectedOwner, selectedStatus, koinThreshold, dateRange, tenants]);

  const tenantExportRows = useMemo(
    () =>
      filteredTenants.map((tenant) => ({
        owner_id: tenant.owner_id ?? "",
        owner_name: tenant.owner_name ?? "",
        owner_email: tenant.owner_email ?? "",
        ot_id: tenant.ot_id ?? "",
        ot_nama: tenant.ot_nama ?? "",
        owner_nohp: tenant.owner_nohp ?? "",
        ot_nohp: tenant.ot_nohp ?? "",
        ot_kecamatan: regionNames.districtName(tenant.ot_kecamatan),
        ot_kota: regionNames.cityName(tenant.ot_kota),
        ot_provinsi: regionNames.provinceName(tenant.ot_provinsi),
        ot_alamat: tenant.ot_alamat ?? "",
        ot_koin: tenant.ot_koin ?? 0,
        ot_status: tenant.ot_status,
        subscription_status: tenant.subscription_status ?? "",
        ot_created: tenant.ot_created,
        expiry_date: tenant.expiry_date,
        daily_tx_count: tenant.daily_tx_count ?? 0,
        daily_tx_amount: tenant.daily_tx_amount ?? 0,
        total_tx_count: tenant.total_tx_count ?? 0,
        total_tx_amount: tenant.total_tx_amount ?? 0,
      })),
    [filteredTenants, regionNames],
  );

  const totalPages = Math.ceil(filteredTenants.length / PAGE_SIZE);
  const paginatedTenants = filteredTenants.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSearch = (val: string) => { setSearch(val); setPage(1); };
  const handleOwnerFilter = (val: string) => { setSelectedOwner(val); setPage(1); };
  const handleStatusFilter = (val: string) => { setSelectedStatus(val); setPage(1); };
  const handleKoinThreshold = (val: string) => { setKoinThreshold(val); setPage(1); };
  const handleDateRange = (r: DateRange) => { setDateRange(r); setPage(1); };
  const handleReset = () => {
    setSearch("");
    handleOwnerFilter("all");
    handleStatusFilter("all");
    handleKoinThreshold("all");
    setDateRange({ start: "", end: "" });
    setPage(1);
  };
  const isFiltered =
    search || selectedOwner !== "all" || selectedStatus !== "all" || koinThreshold !== "all" || dateRange.start || dateRange.end;

  const ownerLabel = useMemo(() => {
    if (selectedOwner === "all") return "Semua Owner";
    const found = owners.find((o) => String(o.id) === selectedOwner);
    return found ? found.name : selectedOwner;
  }, [selectedOwner, owners]);

  const getSubscriptionBadgeClass = (status?: string | null) => {
    switch ((status || "").toUpperCase()) {
      case "PRO":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "TRIAL":
        return "bg-sky-50 text-sky-700 border-sky-200";
      case "EXPIRED":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "NONAKTIF":
      case "INACTIVE":
        return "bg-slate-100 text-slate-700 border-slate-200";
      default:
        return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* COMMAND BAR HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2 font-heading">
            <Store className="h-5 w-5 text-primary" />
            Direktori Outlet
          </h1>
          <p className="text-xs font-medium text-slate-500">
            Database operasional seluruh outlet yang terdaftar.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className="h-10 rounded-lg border-slate-200 bg-white px-4 text-xs font-extrabold uppercase tracking-[0.18em] text-slate-600"
          >
            {filteredTenants.length} / {tenants.length} Outlet
          </Badge>
          <ExportExcelButton
            data={tenantExportRows}
            filename="outlets_directory"
            sheetName="Outlets"
            disabled={regionNames.isLoading}
            columns={[
              { header: "ID Owner", key: "owner_id", width: 12 },
              { header: "Owner", key: "owner_name", width: 25 },
              { header: "Email Owner", key: "owner_email", width: 30 },
              { header: "ID Outlet", key: "ot_id", width: 12 },
              { header: "Nama Outlet", key: "ot_nama", width: 25 },
              { header: "No Hp Owner", key: "owner_nohp", width: 18 },
              { header: "No. Hp Outlet", key: "ot_nohp", width: 18 },
              { header: "Kecamatan", key: "ot_kecamatan", width: 20 },
              { header: "Kota", key: "ot_kota", width: 18 },
              { header: "Provinsi", key: "ot_provinsi", width: 18 },
              { header: "Alamat Lengkap", key: "ot_alamat", width: 40 },
              { header: "Saldo Koin", key: "ot_koin", width: 15 },
              { header: "Status", key: "ot_status", width: 15, format: (v) => v === 1 ? "Aktif" : "Pending" },
              { header: "Subscription", key: "subscription_status", width: 15 },
              { header: "Tanggal Daftar", key: "ot_created", width: 22, format: (v) => v ? format(new Date(v), "dd/MM/yyyy HH:mm") : "" },
              { header: "Expired At", key: "expiry_date", width: 20, format: (v) => v ? format(new Date(v), "dd/MM/yyyy") : "" },
              { header: "Daily TX", key: "daily_tx_count", width: 12 },
              { header: "Daily Revenue", key: "daily_tx_amount", width: 15 },
              { header: "Total TX", key: "total_tx_count", width: 12 },
              { header: "Total Revenue", key: "total_tx_amount", width: 15 },
            ]}
          />
          <Button className="h-8 px-3 font-bold text-[10px] uppercase tracking-wider gap-2 shadow-none">
            <Plus className="h-4 w-4" /> Daftar Baru
          </Button>
        </div>
      </div>

      {/* SEARCH & FILTER COMMAND BAR */}
      <Card className="p-1 border border-slate-200 rounded-lg bg-white overflow-hidden shadow-none">
        <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Cari Nama atau ID..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9 h-9 border-none shadow-none focus-visible:ring-0 text-xs font-medium placeholder:text-slate-400"
            />
          </div>
          
          <div className="h-px w-full bg-slate-100 xl:hidden" />
          <div className="hidden h-5 w-px bg-slate-100 xl:block" />

          <div className="flex flex-wrap items-center gap-1 p-1 xl:p-0">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 font-bold text-[10px] px-2 gap-2 text-slate-600">
                  <User className="h-3 w-3" />
                  {ownerLabel}
                  <ChevronsUpDown className="h-3 w-3 opacity-40" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-0 rounded-md" align="end">
                <Command>
                  <CommandInput placeholder="Cari owner..." className="text-xs" />
                  <CommandList>
                    <CommandEmpty className="text-[10px] p-2">Tidak ditemukan.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem onSelect={() => { handleOwnerFilter("all"); setOpen(false); }} className="text-xs">Semua Owner</CommandItem>
                      {owners.map(o => (
                        <CommandItem key={o.id} onSelect={() => { handleOwnerFilter(String(o.id)); setOpen(false); }} className="text-xs">
                          <span>{o.name}</span>
                          <span className="ml-2 shrink-0 bg-slate-100 border border-slate-200 text-slate-500 font-mono font-semibold text-[9px] px-1.5 py-0.5 rounded">#{o.id}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            <div className="h-4 w-px bg-slate-100 mx-0.5" />
            <div className="relative flex items-center">
              <select
                value={selectedStatus}
                onChange={(e) => handleStatusFilter(e.target.value)}
                className="h-8 pl-2.5 pr-7 text-[10px] font-bold uppercase text-slate-600 bg-transparent border border-slate-200 rounded-md focus:ring-0 focus:outline-none cursor-pointer appearance-none hover:bg-slate-50 transition-colors"
              >
                <option value="all">Semua Status</option>
                <option value="outlet_active">Outlet Aktif</option>
                <option value="outlet_inactive">Outlet Nonaktif</option>
                <option value="pro">PRO</option>
                <option value="trial">Trial</option>
                <option value="expired">Expired</option>
              </select>
              <ChevronsUpDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
            </div>

            <div className="h-4 w-px bg-slate-100 mx-0.5" />
            <div className="relative flex items-center">
              <select
                value={koinThreshold}
                onChange={(e) => handleKoinThreshold(e.target.value)}
                className="h-8 pl-2.5 pr-7 text-[10px] font-bold uppercase text-slate-600 bg-transparent border border-slate-200 rounded-md focus:ring-0 focus:outline-none cursor-pointer appearance-none hover:bg-slate-50 transition-colors"
              >
                <option value="all">Semua Koin</option>
                <option value="10">Sisa &lt; 10</option>
                <option value="20">Sisa &lt; 20</option>
                <option value="50">Sisa &lt; 50</option>
                <option value="100">Sisa &lt; 100</option>
              </select>
              <ChevronsUpDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
            </div>

            <div className="h-4 w-px bg-slate-100 mx-0.5" />
            <DateRangeFilter value={dateRange} onChange={handleDateRange} />
            <div className="h-4 w-px bg-slate-100 mx-0.5" />

            <Button
              variant="ghost"
              size="icon"
              onClick={handleReset}
              className={`h-8 w-8 transition-colors ${isFiltered ? "text-rose-500 hover:text-rose-700 hover:bg-rose-50" : "text-slate-400 hover:text-slate-600"}`}
            >
              <FilterX className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </Card>

      {/* OPERATIONAL DATA TABLE */}
      <Card className="border border-slate-200 rounded-lg overflow-hidden bg-white min-h-[400px] shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider">Profil Outlet</th>
                <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider">Kepemilikan</th>
                <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider text-center">Performa Harian</th>
                <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider text-center">Total Performa</th>
                <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider text-center">Likuiditas</th>
                <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider text-center">Status</th>
                <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <TableSkeleton columns={5} rows={10} />
              ) : filteredTenants.length > 0 ? (
                paginatedTenants.map((tenant) => (
                  <tr key={tenant.ot_id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-slate-50 rounded flex items-center justify-center text-slate-400 border border-slate-100">
                          <Store className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{tenant.ot_nama}</p>
                          <div className="flex items-center gap-2">
                             <p className="text-[10px] font-medium text-slate-500">#{tenant.ot_id}</p>
                             <span className="text-slate-200 text-[8px]">•</span>
                             <p className="text-[10px] font-medium text-slate-500">{format(new Date(tenant.ot_created), "dd MMM yy, HH:mm")}</p>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                          <Link href={`/users/${tenant.owner_id}`} className="group inline-block">
                          <div className="font-bold text-slate-800 text-sm group-hover:text-primary transition-colors">{tenant.owner_name}</div>
                          <div className="text-[10px] font-mono text-slate-500">Kode: #{tenant.owner_id}</div>
                          <div className="text-[11px] font-medium text-slate-500">{tenant.owner_email}</div>
                       </Link>
                    </td>
                    <td className="px-5 py-3 text-center">
                       <div className="font-bold text-slate-900 text-xs">{tenant.daily_tx_count} TX</div>
                       <div className="text-[10px] font-bold text-emerald-600">Rp {tenant.daily_tx_amount?.toLocaleString()}</div>
                    </td>
                    <td className="px-5 py-3 text-center">
                       <div className="font-bold text-slate-900 text-xs">{tenant.total_tx_count} TX</div>
                       <div className="text-[10px] font-bold text-emerald-600">Rp {tenant.total_tx_amount?.toLocaleString()}</div>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <div className="inline-flex items-center gap-1 font-bold text-slate-700 text-[10px]">
                         {tenant.ot_koin} KOIN
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-col items-center gap-1">
                        <Badge
                          className={cn(
                            "rounded-md px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide border shadow-none",
                            tenant.ot_status === 1
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-amber-50 text-amber-600 border-amber-100 animate-pulse"
                          )}
                        >
                          {tenant.ot_status === 1 ? "Aktif" : "Menunggu Aktivasi"}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={cn(
                            "rounded-md px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide border shadow-none",
                            getSubscriptionBadgeClass(tenant.subscription_status)
                          )}
                        >
                          {tenant.subscription_status}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                       <Link href={`/tenants/${tenant.ot_id}`}>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 font-bold text-[9px] uppercase text-primary hover:bg-primary/5"
                          >
                            Pusat Kontrol <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
                          </Button>
                       </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-24 text-center">
                    <Database className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Belum ada data operasional</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={filteredTenants.length}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      </Card>
    </div>
  );
}
