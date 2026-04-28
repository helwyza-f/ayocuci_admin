"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Store,
  User,
  Mail,
  Calendar,
  Coins,
  ShieldCheck,
  MapPin,
  Phone,
} from "lucide-react";
import { tenantService } from "@/services/tenant.service";
import { Tenant } from "@/types/tenant";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export default function TenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await tenantService.getTenantDetail(params.id as string);
        if (res.status) {
          setTenant(res.data);
        }
      } catch (error) {
        console.error("Gagal ambil detail:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [params.id]);

  if (loading)
    return (
      <div className="p-10 animate-pulse font-black text-slate-300">
        MEMUAT DATA OUTLET...
      </div>
    );
  if (!tenant)
    return (
      <div className="p-10 font-black text-red-400">OUTLET TIDAK DITEMUKAN</div>
    );

  return (
    <div className="space-y-8">
      {/* Tombol Kembali */}
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="gap-2 font-bold text-slate-500 hover:text-[#FF4500] p-0"
      >
        <ArrowLeft className="h-4 w-4" /> KEMBALI KE DAFTAR
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Kolom Kiri: Profil & Lokasi */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[40px] p-8 shadow-sm border border-orange-50 relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start">
              <div className="h-24 w-24 bg-orange-100 rounded-3xl flex items-center justify-center text-[#FF4500]">
                <Store className="h-12 w-12" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">
                    {tenant.ot_nama}
                  </h1>
                  <span className="bg-green-50 text-green-600 text-[10px] font-black px-3 py-1 rounded-full uppercase">
                    {tenant.subscription_status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-4 text-sm font-bold text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-[#FF4500]" />{" "}
                    {tenant.ot_alamat || "Alamat belum diatur"}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-4 w-4 text-[#FF4500]" />{" "}
                    {tenant.ot_nohp}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Statistik Ekonomi */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-none bg-[#FF4500] text-white rounded-[32px] shadow-lg shadow-orange-200">
              <CardContent className="p-8 space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-xs font-black uppercase tracking-widest opacity-80">
                    Saldo Koin Outlet
                  </p>
                  <Coins className="h-6 w-6 opacity-50" />
                </div>
                <h2 className="text-5xl font-black">
                  {tenant.ot_koin}{" "}
                  <span className="text-sm uppercase opacity-70">Koin</span>
                </h2>
                <Button className="w-full bg-white text-[#FF4500] hover:bg-orange-50 font-black rounded-2xl text-xs">
                  TAMBAH KOIN MANUAL
                </Button>
              </CardContent>
            </Card>

            <Card className="border-none bg-slate-900 text-white rounded-[32px] shadow-xl">
              <CardContent className="p-8 space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-xs font-black uppercase tracking-widest opacity-80">
                    Masa Berlaku
                  </p>
                  <Calendar className="h-6 w-6 opacity-50" />
                </div>
                <h2 className="text-2xl font-black">
                  {tenant.expiry_date
                    ? format(new Date(tenant.expiry_date), "dd MMMM yyyy", {
                        locale: localeId,
                      })
                    : "-"}
                </h2>
                <p className="text-[10px] font-bold text-orange-400 italic">
                  Langganan akan otomatis berakhir pada tanggal di atas.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Kolom Kanan: Owner Info */}
        <div className="space-y-6">
          <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs px-2 text-slate-400">
            Informasi Pemilik
          </h3>
          <div className="bg-white rounded-[32px] p-6 shadow-sm border border-orange-50 space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500">
                <User className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Nama Owner
                </p>
                <p className="font-black text-slate-800 tracking-tight">
                  {tenant.owner_name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500">
                <Mail className="h-6 w-6" />
              </div>
              <div className="overflow-hidden">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Email Terdaftar
                </p>
                <p className="font-bold text-slate-800 truncate">
                  {tenant.owner_email}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-50">
              <Button
                variant="outline"
                className="w-full rounded-2xl border-orange-100 text-[#FF4500] font-black text-xs hover:bg-orange-50"
              >
                HUBUNGI OWNER
              </Button>
            </div>
          </div>

          <div className="bg-orange-50 rounded-[32px] p-6 border border-orange-100 space-y-3">
            <div className="flex items-center gap-2 text-[#FF4500]">
              <ShieldCheck className="h-5 w-5" />
              <span className="font-black text-xs uppercase">
                Verifikasi Sistem
              </span>
            </div>
            <p className="text-[11px] font-bold text-slate-600 leading-relaxed">
              Outlet ini terdaftar sejak{" "}
              <span className="text-[#FF4500]">
                {format(new Date(tenant.ot_created), "dd/MM/yyyy")}
              </span>
              . Seluruh transaksi terekam dalam log audit global.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
