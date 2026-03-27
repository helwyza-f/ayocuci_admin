"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  UserCircle,
  Mail,
  Store,
  ChevronRight,
  UserCheck,
  Activity,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/api-client";

export default function OwnersPage() {
  const [owners, setOwners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchOwners = async () => {
      try {
        const res = await api.get("/admin/users");
        if (res.data.status) {
          setOwners(res.data.data);
        }
      } catch (error) {
        console.error("Gagal ambil data owner:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOwners();
  }, []);

  const filteredOwners = owners.filter(
    (o) =>
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">
            Database <span className="text-[#FF4500]">Owner</span>
          </h2>
          <p className="text-xs text-slate-500 font-bold italic">
            Total {owners.length} pemilik akun terdaftar di platform.
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Cari nama atau email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 w-full md:w-[300px] rounded-2xl border-orange-100 focus:ring-[#FF4500]"
          />
        </div>
      </div>

      {/* Table Section */}
      <Card className="border-none shadow-sm rounded-[32px] overflow-hidden bg-white min-h-[500px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  Profil Owner
                </th>
                <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  Total Outlet
                </th>
                <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  Status Akun
                </th>
                <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={4} className="p-6">
                      <div className="h-10 bg-slate-50 rounded-2xl w-full" />
                    </td>
                  </tr>
                ))
              ) : filteredOwners.length > 0 ? (
                filteredOwners.map((owner) => (
                  <tr
                    key={owner.id}
                    className="hover:bg-orange-50/20 transition-colors group"
                  >
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-orange-100 group-hover:text-[#FF4500] transition-colors">
                          <UserCircle className="h-7 w-7" />
                        </div>
                        <div>
                          <p className="font-black text-slate-800 uppercase leading-none mb-1 tracking-tight">
                            {owner.name}
                          </p>
                          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                            <Mail className="h-3 w-3 text-[#FF4500]" />{" "}
                            {owner.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2 text-slate-700 font-black">
                        <Store className="h-4 w-4 text-orange-400" />
                        {owner.total_outlets || 0}{" "}
                        <span className="text-[10px] text-slate-400 uppercase">
                          Outlet
                        </span>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-green-50 text-green-600">
                        <UserCheck className="h-3 w-3" /> Aktif
                      </span>
                    </td>
                    <td className="p-6 text-right">
                      <Link href={`/users/${owner.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl border-orange-100 text-[#FF4500] hover:bg-[#FF4500] hover:text-white font-black text-[10px] gap-2 transition-all shadow-sm"
                        >
                          PROFIL
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-32 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-300">
                      <Activity className="h-10 w-10 opacity-20" />
                      <p className="text-xs font-black uppercase tracking-widest italic">
                        Owner tidak ditemukan
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
