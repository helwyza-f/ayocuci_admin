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
      .get("/admin/tenants")
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
      const res = await api.post("/admin/notifications/broadcast", payload, {
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

          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge className="bg-slate-900 text-white">
                  {form.kategori}
                </Badge>
                <span className="text-xs font-bold text-slate-300">
                  Preview
                </span>
              </div>
              <h4 className="line-clamp-1 font-black text-slate-900">
                {form.judul || "Judul broadcast"}
              </h4>
              <p className="line-clamp-5 text-sm leading-relaxed text-slate-500">
                {form.pesan || "Isi pesan akan muncul di sini."}
              </p>
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="aspect-[16/9] w-full rounded-2xl object-cover"
                />
              )}
            </div>
          </Card>

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
