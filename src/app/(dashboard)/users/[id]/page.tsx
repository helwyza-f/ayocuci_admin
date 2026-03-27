"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  UserCircle,
  Mail,
  Phone,
  Calendar,
  Store,
  MapPin,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import api from "@/lib/api-client";
import Link from "next/link";

export default function OwnerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await api.get(`/admin/users/${params.id}`);
        if (res.data.status) setData(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [params.id]);

  if (loading)
    return (
      <div className="p-10 font-black text-slate-300 animate-pulse uppercase">
        Memuat Data Owner...
      </div>
    );
  if (!data)
    return (
      <div className="p-10 font-black text-red-500 uppercase">
        Owner Tidak Ditemukan
      </div>
    );

  return (
    <div className="space-y-8">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="gap-2 font-bold text-slate-500 hover:text-[#FF4500] p-0"
      >
        <ArrowLeft className="h-4 w-4" /> KEMBALI
      </Button>

      {/* Header Profile */}
      <div className="bg-white rounded-[40px] p-8 shadow-sm border border-orange-50">
        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
          <div className="h-32 w-32 bg-slate-100 rounded-[32px] flex items-center justify-center text-slate-400">
            <UserCircle className="h-20 w-20" />
          </div>
          <div className="flex-1 space-y-4 text-center md:text-left">
            <div>
              <h1 className="text-4xl font-black text-slate-800 uppercase tracking-tighter leading-none mb-2">
                {data.profile.name}
              </h1>
              <span className="bg-green-50 text-green-600 text-[10px] font-black px-3 py-1 rounded-full uppercase">
                Akun Aktif
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-center md:justify-start gap-2 text-sm font-bold text-slate-500">
                <Mail className="h-4 w-4 text-[#FF4500]" /> {data.profile.email}
              </div>
              <div className="flex items-center justify-center md:justify-start gap-2 text-sm font-bold text-slate-500">
                <Phone className="h-4 w-4 text-[#FF4500]" />{" "}
                {data.profile.nohp || "-"}
              </div>
              <div className="flex items-center justify-center md:justify-start gap-2 text-sm font-bold text-slate-500">
                <Calendar className="h-4 w-4 text-[#FF4500]" /> Gabung:{" "}
                {new Date(data.profile.created_at).toLocaleDateString("id-ID")}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* List Outlets Milik Owner */}
      <div className="space-y-4">
        <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs px-2">
          Outlet Terdaftar ({data.outlets.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.outlets.map((ot: any) => (
            <Card
              key={ot.ot_id}
              className="border-none shadow-sm rounded-[32px] p-6 bg-white hover:shadow-orange-100 transition-all group"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-orange-50 rounded-2xl flex items-center justify-center text-[#FF4500]">
                    <Store className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-black text-slate-800 uppercase leading-none mb-1">
                      {ot.ot_nama}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                      <MapPin className="h-3 w-3" />{" "}
                      {ot.ot_kota || "Lokasi belum diatur"}
                    </div>
                  </div>
                </div>
                <Link href={`/tenants/${ot.ot_id}`}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-xl group-hover:text-[#FF4500]"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </Link>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
                <div className="text-[10px] font-black text-[#FF4500] uppercase">
                  {ot.ot_koin} KOIN
                </div>
                <div
                  className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${ot.ot_status === 1 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}
                >
                  {ot.ot_status === 1 ? "Online" : "Offline"}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
