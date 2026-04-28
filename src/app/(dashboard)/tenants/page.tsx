"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  ChevronRight,
  Activity,
  Store,
  Check,
  ChevronsUpDown,
  User,
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
import { tenantService } from "@/services/tenant.service";
import api from "@/lib/api-client";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Owner } from "@/types/domain";
import { ApiResponse } from "@/types/api";

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // State untuk Filter Owner
  const [open, setOpen] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState("all");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Ambil data tenant & owner secara paralel
        const [resTenants, resOwners] = await Promise.all([
          tenantService.getAllTenants(),
          api.get<ApiResponse<Owner[]>>("/admin/users"),
        ]);

        if (resTenants.status) setTenants(resTenants.data || []);
        if (resOwners.data.status) setOwners(resOwners.data.data || []);
      } catch (error) {
        console.error("Gagal ambil data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter Logic: Search Nama/ID + Filter Owner
  const filteredTenants = useMemo(() => {
    return tenants.filter((t) => {
      const matchesSearch =
        t.ot_nama.toLowerCase().includes(search.toLowerCase()) ||
        t.ot_id.toLowerCase().includes(search.toLowerCase());

      const matchesOwner =
        selectedOwner === "all" || t.owner_name === selectedOwner;

      return matchesSearch && matchesOwner;
    });
  }, [search, selectedOwner, tenants]);

  // Label untuk Combobox
  const ownerLabel = useMemo(() => {
    if (selectedOwner === "all") return "Semua Owner";
    return selectedOwner;
  }, [selectedOwner]);

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">
            Manajemen <span className="text-[#FF4500]">Outlet</span>
          </h2>
          <p className="text-xs text-slate-500 font-bold italic">
            Total {filteredTenants.length} outlet ditampilkan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Combobox Filter Per Owner */}
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-[220px] justify-between rounded-2xl border-orange-100 font-bold text-xs bg-white h-10 shadow-sm"
              >
                <div className="flex items-center gap-2 truncate">
                  <User className="h-3.5 w-3.5 text-[#FF4500] shrink-0" />
                  <span className="truncate">{ownerLabel}</span>
                </div>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[220px] p-0 rounded-2xl border-orange-50 shadow-xl"
              align="end"
            >
              <Command className="rounded-2xl">
                <CommandInput
                  placeholder="Cari nama owner..."
                  className="font-medium text-xs"
                />
                <CommandList>
                  <CommandEmpty className="p-4 text-[10px] font-bold text-slate-400 uppercase italic text-center">
                    Owner tidak ditemukan.
                  </CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value="all"
                      onSelect={() => {
                        setSelectedOwner("all");
                        setOpen(false);
                      }}
                      className="text-xs font-bold"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4 text-[#FF4500]",
                          selectedOwner === "all" ? "opacity-100" : "opacity-0",
                        )}
                      />
                      Semua Owner
                    </CommandItem>
                    {owners.map((owner) => (
                      <CommandItem
                        key={owner.id}
                        value={owner.name}
                        onSelect={() => {
                          setSelectedOwner(owner.name);
                          setOpen(false);
                        }}
                        className="text-xs font-bold"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4 text-[#FF4500]",
                            selectedOwner === owner.name
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                        {owner.name}
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
              placeholder="Cari nama atau ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 w-full md:w-[250px] rounded-2xl border-orange-100 focus:ring-[#FF4500] h-10 shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Tabel Data */}
      <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white min-h-[500px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  Info Outlet
                </th>
                <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  Pemilik (Owner)
                </th>
                <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  Ekonomi
                </th>
                <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  Status
                </th>
                <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">
                  Tindakan
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="p-6">
                      <div className="h-12 bg-slate-50 rounded-2xl w-full" />
                    </td>
                  </tr>
                ))
              ) : filteredTenants.length > 0 ? (
                filteredTenants.map((tenant) => (
                  <tr
                    key={tenant.ot_id}
                    className="hover:bg-orange-50/20 transition-colors group"
                  >
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-orange-100 rounded-xl flex items-center justify-center text-[#FF4500]">
                          <Store className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-black text-slate-800 uppercase tracking-tight leading-none mb-1">
                            {tenant.ot_nama}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            ID: {tenant.ot_id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <div>
                        <p className="text-xs font-black text-slate-700 leading-none mb-1">
                          {tenant.owner_name}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400">
                          {tenant.owner_email}
                        </p>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="inline-flex items-center bg-orange-50 text-[#FF4500] px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border border-orange-100">
                        {tenant.ot_koin} KOIN
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex flex-col">
                        <span
                          className={`text-[10px] font-black px-2.5 py-1 rounded-full w-fit mb-1 uppercase ${
                            tenant.subscription_status === "active"
                              ? "text-green-600 bg-green-50"
                              : "text-red-600 bg-red-50"
                          }`}
                        >
                          {tenant.subscription_status}
                        </span>
                        {tenant.expiry_date && (
                          <span className="text-[9px] font-bold text-slate-400 italic">
                            Berakhir{" "}
                            {format(
                              new Date(tenant.expiry_date),
                              "dd MMM yyyy",
                              { locale: id },
                            )}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-6 text-right">
                      <Link href={`/tenants/${tenant.ot_id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl border-orange-100 text-[#FF4500] hover:bg-[#FF4500] hover:text-white font-black text-[10px] gap-2 transition-all shadow-sm"
                        >
                          DETAIL
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-32 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-300">
                      <Activity className="h-10 w-10 opacity-20" />
                      <p className="text-xs font-black uppercase tracking-widest italic">
                        Data tidak ditemukan
                      </p>
                      <Button
                        variant="link"
                        onClick={() => {
                          setSearch("");
                          setSelectedOwner("all");
                        }}
                        className="text-[#FF4500] text-[10px] font-bold"
                      >
                        RESET SEMUA FILTER
                      </Button>
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
