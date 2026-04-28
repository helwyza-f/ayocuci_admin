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

export default function CustomersPage() {
  const [open, setOpen] = useState(false);
  const [selectedOutlet, setSelectedOutlet] = useState("all");
  const [search, setSearch] = useState("");
  const customerUrl =
    selectedOutlet === "all"
      ? "/customers"
      : `/customers?outlet_id=${selectedOutlet}`;
  const { data: tenantsResponse } = useSWR<ApiResponse<Tenant[]>>(
    "/tenants",
    apiFetcher,
    {
      dedupingInterval: 60_000,
      keepPreviousData: true,
      revalidateOnFocus: false,
    },
  );
  const { data: customersResponse, isLoading } = useSWR<ApiResponse<Customer[]>>(
    customerUrl,
    apiFetcher,
    {
      dedupingInterval: 60_000,
      keepPreviousData: true,
      revalidateOnFocus: false,
    },
  );
  const tenants = useMemo(() => tenantsResponse?.data || [], [tenantsResponse]);
  const customers = useMemo(
    () => customersResponse?.data || [],
    [customersResponse],
  );

  const filtered = (customers || []).filter(
    (c) =>
      c?.name?.toLowerCase().includes(search.toLowerCase()) ||
      c?.nohp?.includes(search),
  );

  // Label untuk Combobox
  const selectedLabel = useMemo(() => {
    if (selectedOutlet === "all") return "Semua Outlet";
    return (
      tenants.find((t) => t.ot_id === selectedOutlet)?.ot_nama ||
      "Pilih Outlet..."
    );
  }, [selectedOutlet, tenants]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">
            Database <span className="text-[#FF4500]">Pelanggan</span>
          </h2>
          <p className="text-xs text-slate-500 font-bold italic">
            Total {filtered.length} pelanggan ditemukan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Shadcn Combobox Filter */}
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-[250px] justify-between rounded-2xl border-orange-100 font-bold text-xs bg-white h-10 shadow-sm"
              >
                <div className="flex items-center gap-2 truncate">
                  <Filter className="h-3.5 w-3.5 text-[#FF4500] shrink-0" />
                  <span className="truncate">{selectedLabel}</span>
                </div>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[250px] p-0 rounded-2xl border-orange-50 shadow-xl">
              <Command className="rounded-2xl">
                <CommandInput
                  placeholder="Cari outlet..."
                  className="font-medium text-xs"
                />
                <CommandList>
                  <CommandEmpty className="p-4 text-center text-[10px] font-bold text-slate-400 uppercase italic">
                    Outlet tidak ditemukan.
                  </CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value="all"
                      onSelect={() => {
                        setSelectedOutlet("all");
                        setOpen(false);
                      }}
                      className="text-xs font-bold"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4 text-[#FF4500]",
                          selectedOutlet === "all"
                            ? "opacity-100"
                            : "opacity-0",
                        )}
                      />
                      Semua Outlet
                    </CommandItem>
                    {tenants.map((tenant) => (
                      <CommandItem
                        key={tenant.ot_id}
                        value={tenant.ot_nama} // Untuk search filter internal command
                        onSelect={() => {
                          setSelectedOutlet(tenant.ot_id);
                          setOpen(false);
                        }}
                        className="text-xs font-bold"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4 text-[#FF4500]",
                            selectedOutlet === tenant.ot_id
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                        <div className="flex flex-col">
                          <span>{tenant.ot_nama}</span>
                          <span className="text-[8px] text-slate-400 opacity-70 italic">
                            ID: {tenant.ot_id}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari nama/HP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 w-[250px] rounded-2xl border-orange-100 bg-white h-10 shadow-sm"
            />
          </div>
        </div>
      </div>

      <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white min-h-[450px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  Data Pelanggan
                </th>
                <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  Outlet Terdaftar
                </th>
                <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">
                  Transaksi
                </th>
                <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">
                  Tgl Join
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={4} className="p-6">
                      <div className="h-10 bg-slate-50 rounded-xl w-full" />
                    </td>
                  </tr>
                ))
              ) : filtered.length > 0 ? (
                filtered.map((customer) => (
                  <tr
                    key={customer.id}
                    className="hover:bg-orange-50/20 transition-colors group"
                  >
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-orange-100 group-hover:text-[#FF4500] transition-colors">
                          <UserRound className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-black text-slate-800 uppercase text-xs leading-none mb-1 tracking-tight">
                            {customer.name}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                            <Phone className="h-3 w-3 text-[#FF4500]" />{" "}
                            {customer.nohp}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2">
                        <Store className="h-4 w-4 text-orange-400" />
                        <span className="text-[10px] font-black text-slate-600 uppercase italic">
                          {customer.outlet_name}
                        </span>
                      </div>
                    </td>
                    <td className="p-6 text-center">
                      <div className="inline-flex items-center bg-green-50 text-green-600 px-3 py-1 rounded-lg text-[10px] font-black border border-green-100">
                        {customer.total_transaksi || 0} TRX
                      </div>
                    </td>
                    <td className="p-6 text-right">
                      <p className="text-[10px] font-bold text-slate-400">
                        {customer.created_at
                          ? new Date(customer.created_at).toLocaleDateString(
                              "id-ID",
                            )
                          : "-"}
                      </p>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-32 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-300">
                      <Activity className="h-10 w-10 opacity-20" />
                      <p className="text-xs font-black uppercase tracking-widest italic">
                        Data Pelanggan Kosong
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
