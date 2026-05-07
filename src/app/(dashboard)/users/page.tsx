"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  UserCircle,
  Mail,
  Store,
  ChevronRight,
  UserCheck,
  Activity,
  Users,
  ExternalLink,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiResponse } from "@/types/api";
import { Owner } from "@/types/domain";
import useSWR from "swr";
import { apiFetcher } from "@/lib/fetcher";
import { Badge } from "@/components/ui/badge";
import TableSkeleton from "@/components/shared/table-skeleton";

export default function OwnersPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useSWR<ApiResponse<Owner[]>>(
    "/users",
    apiFetcher,
    {
      dedupingInterval: 60_000,
      keepPreviousData: true,
      revalidateOnFocus: false,
    },
  );
  const owners = data?.data || [];

  const filteredOwners = owners.filter(
    (o) =>
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* COMMAND BAR HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2 font-heading">
            <Users className="h-5 w-5 text-primary" />
            Owners Directory
          </h1>
          <p className="text-xs font-medium text-slate-500">
            Database of account owners managing laundry outlets.
          </p>
        </div>

        <div className="flex items-center gap-2">
           <Badge variant="outline" className="h-8 px-3 rounded-md font-bold text-[10px] uppercase tracking-wider text-slate-500 border-slate-200 bg-white">
              {owners.length} Total Accounts
           </Badge>
        </div>
      </div>

      {/* SEARCH COMMAND BAR */}
      <Card className="p-1 border border-slate-200 rounded-lg bg-white overflow-hidden">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search owners by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 border-none shadow-none focus-visible:ring-0 text-xs font-medium placeholder:text-slate-400"
          />
        </div>
      </Card>

      {/* OPERATIONAL DATA TABLE */}
      <Card className="border border-slate-200 rounded-lg overflow-hidden bg-white min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider">Owner Profile</th>
                <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider text-center">Portfolio</th>
                <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider text-center">Verification</th>
                <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <TableSkeleton columns={4} rows={10} />
              ) : filteredOwners.length > 0 ? (
                filteredOwners.map((owner) => (
                  <tr key={owner.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-slate-50 rounded flex items-center justify-center text-slate-400 border border-slate-100">
                          <UserCircle className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-xs">{owner.name}</p>
                          <p className="text-[9px] font-medium text-slate-400">{owner.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <div className="inline-flex items-center gap-1 font-bold text-slate-700 text-[10px]">
                         {owner.total_outlets || 0} Outlets
                      </div>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 shadow-none font-bold text-[8px] uppercase rounded px-1.5 py-0">
                        Active
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link href={`/users/${owner.id}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 font-bold text-[9px] uppercase text-primary hover:bg-primary/5"
                        >
                          View Profile <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                      </Link>
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
      </Card>
    </div>
  );
}
