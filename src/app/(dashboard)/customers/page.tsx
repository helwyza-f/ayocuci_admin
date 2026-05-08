"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Phone,
  Store,
  Filter,
  UserRound,
  Activity,
  Check,
  ChevronsUpDown,
  Users,
  Calendar,
  CreditCard,
  FilterX,
} from "lucide-react";
import { Card } from "@/components/ui/card";
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
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Customer } from "@/types/domain";
import { Tenant } from "@/types/tenant";
import { ApiResponse } from "@/types/api";
import useSWR from "swr";
import { apiFetcher } from "@/lib/fetcher";
import { Badge } from "@/components/ui/badge";
import TableSkeleton from "@/components/shared/table-skeleton";
import { format } from "date-fns";
import Pagination from "@/components/shared/pagination";
import DateRangeFilter, { DateRange, filterByDateRange } from "@/components/shared/date-range-filter";
import { ExportExcelButton } from "@/components/shared/export-excel-button";

const PAGE_SIZE = 25;

export default function CustomersPage() {
  const [open, setOpen] = useState(false);
  const [selectedOutlet, setSelectedOutlet] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dateRange, setDateRange] = useState<DateRange>({ start: "", end: "" });
  
  const customerUrl = selectedOutlet === "all" ? "/customers" : `/customers?outlet_id=${selectedOutlet}`;
  
  const { data: tenantsResponse } = useSWR<ApiResponse<Tenant[]>>("/tenants", apiFetcher, {
    dedupingInterval: 60_000,
    keepPreviousData: true,
    revalidateOnFocus: false,
  });
  
  const { data: customersResponse, isLoading } = useSWR<ApiResponse<Customer[]>>(customerUrl, apiFetcher, {
    dedupingInterval: 60_000,
    keepPreviousData: true,
    revalidateOnFocus: false,
  });

  const tenants = useMemo(() => tenantsResponse?.data || [], [tenantsResponse]);
  const customers = useMemo(() => customersResponse?.data || [], [customersResponse]);

  const filtered = useMemo(() => {
    const bySearch = (customers || []).filter(
      (c) =>
        c?.name?.toLowerCase().includes(search.toLowerCase()) ||
        c?.nohp?.includes(search)
    );
    return filterByDateRange(bySearch, (c) => c.created_at, dateRange);
  }, [customers, search, dateRange]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSearch = (val: string) => { setSearch(val); setPage(1); };
  const handleOutletChange = (val: string) => { setSelectedOutlet(val); setPage(1); };
  const handleDateRange = (r: DateRange) => { setDateRange(r); setPage(1); };
  const handleReset = () => { setSearch(""); handleOutletChange("all"); setDateRange({ start: "", end: "" }); setPage(1); };
  const isFiltered = search || selectedOutlet !== "all" || dateRange.start || dateRange.end;

  const selectedLabel = useMemo(() => {
    if (selectedOutlet === "all") return "All Outlets";
    return tenants.find((t) => t.ot_id === selectedOutlet)?.ot_nama || "Select Outlet...";
  }, [selectedOutlet, tenants]);

  return (
    <div className="space-y-6">
      {/* COMMAND BAR HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2 font-heading">
            <Users className="h-5 w-5 text-primary" />
            End-User Database
          </h1>
          <p className="text-xs font-medium text-slate-500">
            Unified repository of customers across the ecosystem.
          </p>
        </div>

        <div className="flex items-center gap-2">
           <Badge variant="outline" className="h-8 px-3 rounded-md font-bold text-[10px] uppercase tracking-wider text-slate-500 border-slate-200 bg-white shadow-none">
              {filtered.length} Total Records
           </Badge>
           <ExportExcelButton
            data={filtered}
            filename="customers_database"
            sheetName="Customers"
            columns={[
              { header: "Nama", key: "name", width: 25 },
              { header: "No. HP", key: "nohp", width: 18 },
              { header: "Outlet Terdaftar", key: "outlet_name", width: 25 },
              { header: "Total Transaksi", key: "total_transaksi", width: 15 },
              { header: "Bergabung", key: "created_at", width: 22, format: (v) => v ? format(new Date(v), "dd/MM/yyyy HH:mm") : "" },
            ]}
          />
        </div>
      </div>

      {/* SEARCH & FILTER COMMAND BAR */}
      <Card className="p-1 border border-slate-200 rounded-lg bg-white overflow-hidden shadow-none">
        <div className="flex flex-col lg:flex-row lg:items-center gap-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Search by name or phone..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9 h-9 border-none shadow-none focus-visible:ring-0 text-xs font-medium placeholder:text-slate-400"
            />
          </div>
          
          <div className="h-5 w-px bg-slate-100 hidden lg:block" />

          <div className="flex items-center gap-1 p-1 lg:p-0">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 font-bold text-[10px] px-2 gap-2 text-slate-600">
                  <Store className="h-3 w-3" />
                  {selectedLabel}
                  <ChevronsUpDown className="h-3 w-3 opacity-40" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0 rounded-md" align="end">
                <Command>
                  <CommandInput placeholder="Search outlet..." className="text-xs" />
                  <CommandList>
                    <CommandEmpty className="text-[10px] p-2">No results.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem onSelect={() => { handleOutletChange("all"); setOpen(false); }} className="text-xs">All Outlets</CommandItem>
                      {tenants.map(t => (
                        <CommandItem key={t.ot_id} onSelect={() => { handleOutletChange(t.ot_id); setOpen(false); }} className="text-xs">
                           <div className="flex flex-col">
                              <span className="font-bold">{t.ot_nama}</span>
                              <span className="text-[9px] text-slate-400">#{t.ot_id}</span>
                           </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleReset}
              className={`h-8 w-8 transition-colors ${isFiltered ? "text-rose-500 hover:text-rose-700 hover:bg-rose-50" : "text-slate-400 hover:text-slate-600"}`}
            >
              <FilterX className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="h-5 w-px bg-slate-100 hidden lg:block" />
          <DateRangeFilter value={dateRange} onChange={handleDateRange} className="p-1 lg:p-0" />
        </div>
      </Card>

      {/* OPERATIONAL DATA TABLE */}
      <Card className="border border-slate-200 rounded-lg overflow-hidden bg-white min-h-[400px] shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider">Customer</th>
                <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider">Primary Outlet</th>
                <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider text-center">Activity</th>
                <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider text-right">Join Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <TableSkeleton columns={4} rows={10} />
              ) : filtered.length > 0 ? (
                paginated.map((customer) => (
                  <tr key={customer.id} className="hover:bg-primary/[0.02] transition-colors group">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-slate-50 rounded flex items-center justify-center text-slate-400 border border-slate-100 group-hover:bg-primary/5 group-hover:text-primary group-hover:border-primary/10 group-hover:scale-110 transition-all duration-300">
                          <UserRound className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-xs group-hover:text-primary transition-colors">{customer.name}</p>
                          <p className="text-[9px] font-medium text-slate-400">{customer.nohp}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2 text-slate-800 font-bold text-xs tracking-tight">
                        <Store className="h-3 w-3 text-primary/60 group-hover:scale-110 transition-transform" />
                        {customer.outlet_name}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <div className="inline-flex items-center gap-1.5 font-bold text-slate-600 text-[10px] bg-slate-50 px-2 py-0.5 rounded border border-slate-100/50 group-hover:bg-white transition-colors">
                         {customer.total_transaksi || 0} <span className="text-[8px] uppercase text-slate-400">Tx</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1 text-[10px] font-bold text-slate-400 tabular-nums">
                         {customer.created_at ? format(new Date(customer.created_at), "dd/MM/yy") : "-"}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-24 text-center">
                    <Activity className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">No records found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={filtered.length}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      </Card>
    </div>
  );
}
