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

export default function TenantsPage() {
  const [search, setSearch] = useState("");
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

  const [open, setOpen] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState("all");

  const filteredTenants = useMemo(() => {
    return tenants.filter((t) => {
      const cleanSearch = search.toLowerCase();
      const matchesSearch =
        t.ot_nama.toLowerCase().includes(cleanSearch) ||
        t.ot_id.toLowerCase().includes(cleanSearch);
      const matchesOwner =
        selectedOwner === "all" || t.owner_name === selectedOwner;
      return matchesSearch && matchesOwner;
    });
  }, [search, selectedOwner, tenants]);

  const ownerLabel = useMemo(() => {
    if (selectedOwner === "all") return "All Owners";
    return selectedOwner;
  }, [selectedOwner]);

  return (
    <div className="space-y-6">
      {/* COMMAND BAR HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2 font-heading">
            <Store className="h-5 w-5 text-primary" />
            Tenants Directory
          </h1>
          <p className="text-xs font-medium text-slate-500">
            Operational database of all registered outlets.
          </p>
        </div>

        <div className="flex items-center gap-2">
           <Button className="h-8 px-3 font-bold text-[10px] uppercase tracking-wider gap-2 shadow-none">
              <Plus className="h-4 w-4" /> Register New
           </Button>
        </div>
      </div>

      {/* SEARCH & FILTER COMMAND BAR */}
      <Card className="p-1 border border-slate-200 rounded-lg bg-white overflow-hidden shadow-none">
        <div className="flex flex-col lg:flex-row lg:items-center gap-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Search by Name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 border-none shadow-none focus-visible:ring-0 text-xs font-medium placeholder:text-slate-400"
            />
          </div>
          
          <div className="h-5 w-px bg-slate-100 hidden lg:block" />

          <div className="flex items-center gap-1 p-1 lg:p-0">
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
                  <CommandInput placeholder="Search owner..." className="text-xs" />
                  <CommandList>
                    <CommandEmpty className="text-[10px] p-2">No results.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem onSelect={() => { setSelectedOwner("all"); setOpen(false); }} className="text-xs">All Owners</CommandItem>
                      {owners.map(o => (
                        <CommandItem key={o.id} onSelect={() => { setSelectedOwner(o.name); setOpen(false); }} className="text-xs">{o.name}</CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => { setSearch(""); setSelectedOwner("all"); }}
              className="h-8 w-8 text-slate-400 hover:text-rose-500"
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
                <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider">Outlet Profile</th>
                <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider">Ownership</th>
                <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider text-center">Liquidity</th>
                <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider text-center">Status</th>
                <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <TableSkeleton columns={5} rows={10} />
              ) : filteredTenants.length > 0 ? (
                filteredTenants.map((tenant) => (
                  <tr key={tenant.ot_id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-slate-50 rounded flex items-center justify-center text-slate-400 border border-slate-100">
                          <Store className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-xs">{tenant.ot_nama}</p>
                          <p className="text-[9px] font-medium text-slate-400">#{tenant.ot_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="font-bold text-slate-800 text-xs">{tenant.owner_name}</div>
                      <div className="text-[10px] font-medium text-slate-500">{tenant.owner_email}</div>
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
                            "rounded px-1.5 py-0 text-[8px] font-bold uppercase border shadow-none",
                            tenant.ot_status === 1
                              ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                              : "bg-amber-50 text-amber-600 border-amber-100 animate-pulse"
                          )}
                        >
                          {tenant.ot_status === 1 ? "Active" : "Pending Activation"}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={cn(
                            "rounded px-1.5 py-0 text-[7px] font-bold uppercase border-none opacity-60",
                            tenant.subscription_status === "PRO" ? "text-indigo-600" : "text-slate-400"
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
                            Control Hub <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
                          </Button>
                       </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <Database className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">No operational data found</p>
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
