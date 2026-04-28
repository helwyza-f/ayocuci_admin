"use client";

import { useEffect, useState } from "react";
import {
  Ticket,
  Plus,
  Power,
  RefreshCcw,
  Calendar,
  Layers,
  Tag,
  Loader2 as LoaderIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api from "@/lib/api-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ApiResponse } from "@/types/api";
import { Voucher } from "@/types/voucher";

export default function VoucherManagementPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    vc_voucher: "",
    vc_jenis: "persen",
    vc_nilai_potongan: "",
    vc_keterangan: "",
    vc_tanggalmulai: "",
    vc_tanggalberakhir: "",
    vc_jumlah_voucher: "",
  });

  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<Voucher[]>>("/admin/vouchers");
      if (res.data.status) setVouchers(res.data.data || []);
    } catch {
      toast.error("Gagal mengambil data voucher");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  const handleCreateVoucher = async () => {
    // Basic Validation
    if (
      !formData.vc_voucher ||
      !formData.vc_nilai_potongan ||
      !formData.vc_tanggalberakhir
    ) {
      return toast.error("Mohon lengkapi data voucher");
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        vc_nilai_potongan: Number(formData.vc_nilai_potongan),
        vc_jumlah_voucher: Number(formData.vc_jumlah_voucher),
        // Format date to ISO string for backend
        vc_tanggalmulai: new Date(formData.vc_tanggalmulai).toISOString(),
        vc_tanggalberakhir: new Date(formData.vc_tanggalberakhir).toISOString(),
      };

      const res = await api.post("/admin/vouchers/", payload);
      if (res.data.status) {
        toast.success("Voucher berhasil diterbitkan!");
        setIsDialogOpen(false);
        setFormData({
          vc_voucher: "",
          vc_jenis: "persen",
          vc_nilai_potongan: "",
          vc_keterangan: "",
          vc_tanggalmulai: "",
          vc_tanggalberakhir: "",
          vc_jumlah_voucher: "",
        });
        fetchVouchers();
      }
    } catch {
      toast.error("Gagal membuat voucher");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus: number) => {
    try {
      const res = await api.patch(`/admin/vouchers/${id}/status`, {
        status: currentStatus === 1 ? 0 : 1,
      });
      if (res.data.status) {
        toast.success("Status updated");
        fetchVouchers();
      }
    } catch {
      toast.error("Gagal mengubah status");
    }
  };

  return (
    <div className="space-y-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase flex items-center gap-3">
            <Ticket className="h-8 w-8 text-[#FF4500]" />
            Promo <span className="text-[#FF4500]">Vouchers</span>
          </h2>
          <p className="text-xs text-slate-500 font-bold italic">
            Management kode promo dan diskon top-up koin AyoCuci.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={fetchVouchers}
            variant="outline"
            className="rounded-2xl font-black text-[10px] uppercase gap-2"
          >
            <RefreshCcw className={cn("h-3 w-3", loading && "animate-spin")} />
            Sync
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-2xl bg-[#FF4500] hover:bg-orange-600 text-white font-black text-[10px] uppercase gap-2 shadow-lg shadow-orange-100 px-6">
                <Plus className="h-3 w-3" /> Buat Voucher
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[40px] p-8 border-none shadow-2xl max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                  <Tag className="h-6 w-6 text-[#FF4500]" /> Create New Voucher
                </DialogTitle>
              </DialogHeader>

              <div className="py-6 grid grid-cols-2 gap-6">
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
                    Kode Voucher
                  </label>
                  <Input
                    placeholder="Contoh: MERDEKA10"
                    className="rounded-2xl border-slate-200 font-bold uppercase"
                    value={formData.vc_voucher}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        vc_voucher: e.target.value.toUpperCase(),
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
                    Jenis
                  </label>
                  <Select
                    value={formData.vc_jenis}
                    onValueChange={(val) =>
                      setFormData({ ...formData, vc_jenis: val })
                    }
                  >
                    <SelectTrigger className="rounded-2xl border-slate-200 font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="persen">Persentase (%)</SelectItem>
                      <SelectItem value="nominal">Nominal (Rp)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
                    Nilai Potongan
                  </label>
                  <Input
                    type="number"
                    placeholder="0"
                    className="rounded-2xl border-slate-200 font-bold"
                    value={formData.vc_nilai_potongan}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        vc_nilai_potongan: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
                    Mulai
                  </label>
                  <Input
                    type="date"
                    className="rounded-2xl border-slate-200 font-bold"
                    value={formData.vc_tanggalmulai}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        vc_tanggalmulai: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
                    Berakhir
                  </label>
                  <Input
                    type="date"
                    className="rounded-2xl border-slate-200 font-bold"
                    value={formData.vc_tanggalberakhir}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        vc_tanggalberakhir: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
                    Keterangan Promo
                  </label>
                  <Input
                    placeholder="Misal: Diskon khusus Ramadhan"
                    className="rounded-2xl border-slate-200 font-bold"
                    value={formData.vc_keterangan}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        vc_keterangan: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
                    Kuota (Jumlah Voucher)
                  </label>
                  <Input
                    type="number"
                    placeholder="100"
                    className="rounded-2xl border-slate-200 font-bold"
                    value={formData.vc_jumlah_voucher}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        vc_jumlah_voucher: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  onClick={handleCreateVoucher}
                  disabled={isSubmitting}
                  className="w-full rounded-2xl bg-[#FF4500] hover:bg-orange-600 text-white font-black text-[10px] uppercase h-12"
                >
                  {isSubmitting ? (
                    <LoaderIcon className="animate-spin h-3 w-3 mr-2" />
                  ) : (
                    <Layers className="h-3 w-3 mr-2" />
                  )}
                  Publish Voucher Sekarang
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* VOUCHER LIST SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-64 bg-slate-100 rounded-[40px] animate-pulse"
            />
          ))
        ) : vouchers.length === 0 ? (
          <div className="col-span-full py-20 text-center">
            <Ticket className="h-12 w-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-bold">
              Belum ada voucher yang aktif.
            </p>
          </div>
        ) : (
          vouchers.map((v) => (
            <Card
              key={v.vc_id}
              className={cn(
                "group relative p-8 border-none shadow-sm rounded-[40px] bg-white transition-all overflow-hidden",
                v.vc_status === 0 && "grayscale opacity-60",
              )}
            >
              {/* Status Badge */}
              <div className="flex justify-between items-start mb-6">
                <Badge
                  variant="secondary"
                  className="bg-orange-50 text-[#FF4500] text-[9px] font-black uppercase rounded-lg border-none"
                >
                  {v.vc_jenis === "persen" ? "Discount %" : "Cashback IDR"}
                </Badge>
                <Button
                  size="icon"
                  variant="ghost"
                  className="rounded-full hover:bg-red-50 group/btn"
                  onClick={() => toggleStatus(v.vc_id, v.vc_status)}
                >
                  <Power
                    className={cn(
                      "w-4 h-4 transition-colors",
                      v.vc_status === 1
                        ? "text-green-500"
                        : "text-slate-300 group-hover/btn:text-red-500",
                    )}
                  />
                </Button>
              </div>

              <div className="space-y-1 mb-6">
                <h3 className="text-3xl font-black text-slate-800 tracking-tighter uppercase leading-tight">
                  {v.vc_voucher}
                </h3>
                <p className="text-xs font-bold text-slate-400">
                  {v.vc_keterangan}
                </p>
              </div>

              <div className="space-y-3 pt-6 border-t border-dashed border-slate-100">
                <div className="flex justify-between text-[10px] font-black">
                  <span className="text-slate-400 uppercase tracking-widest">
                    Potongan
                  </span>
                  <span className="text-[#FF4500]">
                    {v.vc_jenis === "persen"
                      ? `${v.vc_nilai_potongan}%`
                      : `Rp ${v.vc_nilai_potongan.toLocaleString("id-ID")}`}
                  </span>
                </div>
                <div className="flex justify-between text-[10px] font-black">
                  <span className="text-slate-400 uppercase tracking-widest">
                    Sisa Kuota
                  </span>
                  <span className="text-slate-700">
                    {v.vc_sisa_voucher} / {v.vc_jumlah_voucher}
                  </span>
                </div>
                <div className="flex justify-between text-[10px] font-black">
                  <span className="text-slate-400 uppercase tracking-widest">
                    Valid Sampai
                  </span>
                  <span className="text-slate-500 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(v.vc_tanggalberakhir), "dd MMM yyyy")}
                  </span>
                </div>
              </div>

              {/* Decorative Circle */}
              <div className="absolute -bottom-6 -right-6 h-24 w-24 bg-slate-50 rounded-full group-hover:scale-110 transition-transform -z-0 opacity-50" />
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
