"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ImagePlus, Loader2, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MultiSelect, Option } from "@/components/ui/multi-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import api from "@/lib/api-client";

type Tenant = {
  ot_id: string;
  ot_nama: string;
};

export default function NewNotificationPage() {
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    judul: "",
    pesan: "",
    kategori: "INFO",
    outlets: ["all"],
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");

  useEffect(() => {
    api
      .get("/tenants")
      .then((res) => {
        if (res.data.status) setTenants(res.data.data || []);
      })
      .catch(() => toast.error("Gagal memuat outlet"));
  }, []);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const outletOptions: Option[] = useMemo(
    () => [
      { label: "SEMUA OUTLET", value: "all" },
      ...tenants.map((tenant) => ({
        label: tenant.ot_nama,
        value: tenant.ot_id,
      })),
    ],
    [tenants],
  );

  const handleOutletChange = (values: string[]) => {
    const lastValue = values[values.length - 1];
    if (lastValue === "all") {
      setForm({ ...form, outlets: ["all"] });
    } else if (values.includes("all") && values.length > 1) {
      setForm({ ...form, outlets: values.filter((v) => v !== "all") });
    } else {
      setForm({ ...form, outlets: values });
    }
  };

  const handleImageChange = (file?: File) => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    if (!file) {
      setImageFile(null);
      setImagePreview("");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran gambar maksimal 5MB");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!form.judul || !form.pesan) return toast.error("Data tidak lengkap");
    if (form.outlets.length === 0) return toast.error("Pilih target outlet");

    const payload = new FormData();
    payload.append("judul", form.judul);
    payload.append("pesan", form.pesan);
    payload.append("kategori", form.kategori);
    form.outlets.forEach((outlet) => payload.append("outlets", outlet));
    if (imageFile) payload.append("image", imageFile);

    setLoading(true);
    try {
      const res = await api.post("/notifications/broadcast", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.status) {
        toast.success("Broadcast berhasil dikirim");
        router.push("/notifications");
        router.refresh();
      }
    } catch {
      toast.error("Gagal mengirim broadcast");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div>
        <Button
          variant="ghost"
          className="mb-3 rounded-xl px-0 font-bold text-slate-500"
          onClick={() => router.push("/notifications")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>
        <h2 className="text-3xl font-black tracking-tight text-slate-900">
          Buat Broadcast
        </h2>
        <p className="mt-1 text-sm font-medium text-slate-400">
          Kirim notifikasi ke outlet tertentu atau seluruh network.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="p-6">
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400">
                  Kategori
                </label>
                <Select
                  value={form.kategori}
                  onValueChange={(v) => setForm({ ...form, kategori: v })}
                >
                  <SelectTrigger className="h-12 rounded-xl bg-slate-50 font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INFO">Informasi</SelectItem>
                    <SelectItem value="PROMO">Promo</SelectItem>
                    <SelectItem value="SISTEM">Sistem</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400">
                  Target Penerima
                </label>
                <MultiSelect
                  options={outletOptions}
                  selected={form.outlets}
                  onChange={handleOutletChange}
                  placeholder="Pilih outlet..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-400">
                Judul
              </label>
              <Input
                value={form.judul}
                onChange={(e) => setForm({ ...form, judul: e.target.value })}
                placeholder="Contoh: Promo Ramadhan"
                className="h-12 rounded-xl bg-slate-50 font-bold"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-400">
                Isi Pesan
              </label>
              <Textarea
                value={form.pesan}
                onChange={(e) => setForm({ ...form, pesan: e.target.value })}
                placeholder="Tulis pesan broadcast..."
                className="min-h-72 rounded-2xl bg-slate-50 p-5 leading-relaxed"
              />
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-black text-slate-900">
                  Gambar Opsional
                </h3>
                <p className="text-xs text-slate-400">
                  Cocok untuk notifikasi promo.
                </p>
              </div>
              {imagePreview ? (
                <div className="relative overflow-hidden rounded-2xl border bg-slate-50">
                  <img
                    src={imagePreview}
                    alt="Preview notifikasi"
                    className="aspect-[16/9] w-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => handleImageChange()}
                    className="absolute right-3 top-3 rounded-xl bg-white/90 font-black"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Hapus
                  </Button>
                </div>
              ) : (
                <label className="flex h-40 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed bg-slate-50">
                  <ImagePlus className="h-8 w-8 text-slate-300" />
                  <span className="text-xs font-black uppercase text-slate-500">
                    Upload gambar
                  </span>
                  <input
                    hidden
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageChange(e.target.files?.[0])}
                  />
                </label>
              )}
            </div>
          </Card>

          {/* PREVIEW SMARTPHONE */}
          <div className="relative mx-auto w-full max-w-[300px]">
            {/* Phone Frame */}
            <div className="relative rounded-[2.5rem] border-[8px] border-slate-900 bg-slate-900 p-2 shadow-2xl">
              {/* Notch */}
              <div className="absolute left-1/2 top-0 h-6 w-32 -translate-x-1/2 rounded-b-2xl bg-slate-900 z-20" />
              
              <div className="relative aspect-[9/19.5] w-full overflow-hidden rounded-[1.8rem] bg-slate-100">
                {/* Status Bar */}
                <div className="flex h-10 items-end justify-between px-6 pb-2 text-[10px] font-bold text-slate-400">
                  <span>9:41</span>
                  <div className="flex items-center gap-1">
                    <div className="h-2.5 w-4 rounded-sm border border-slate-400" />
                  </div>
                </div>

                <div className="p-3">
                   {/* Notification Card */}
                   <div className="mt-2 overflow-hidden rounded-2xl bg-white/80 p-3 shadow-sm backdrop-blur-md">
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <div className="flex h-5 w-5 items-center justify-center rounded-md bg-primary p-1">
                            <img src="/logo_white.png" alt="App Icon" className="h-full w-full object-contain" />
                          </div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">AyoCuci</span>
                        </div>
                        <span className="text-[9px] font-medium text-slate-400">now</span>
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-[11px] font-black leading-tight text-slate-900">
                          {form.judul || "Judul broadcast"}
                        </h4>
                        <p className="text-[10px] leading-snug text-slate-600 line-clamp-3">
                          {form.pesan || "Pesan Anda akan muncul di sini saat mulai mengetik."}
                        </p>
                      </div>
                      {imagePreview && (
                        <div className="mt-2.5 overflow-hidden rounded-xl">
                          <img
                            src={imagePreview}
                            alt="Preview Attachment"
                            className="aspect-video w-full object-cover"
                          />
                        </div>
                      )}
                   </div>
                </div>

                {/* Bottom Bar */}
                <div className="absolute bottom-2 left-1/2 h-1 w-24 -translate-x-1/2 rounded-full bg-slate-300" />
              </div>
            </div>
            <p className="mt-4 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Live App Preview
            </p>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="h-13 w-full rounded-xl bg-slate-900 font-black uppercase"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Kirim Broadcast
          </Button>
        </div>
      </div>
    </div>
  );
}
