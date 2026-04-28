"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ContentBanner,
  ContentCategory,
  contentService,
} from "@/services/content.service";

const API_ROOT =
  (process.env.NEXT_PUBLIC_API_URL || "https://api.ayocuci.id/api/v1").replace(
    /\/api\/v1$/,
    "",
  );

type FormState = {
  category: ContentCategory;
  title: string;
  summary: string;
  body: string;
};

const emptyForm: FormState = {
  category: "PROMO",
  title: "",
  summary: "",
  body: "",
};

export function ContentForm({ initial }: { initial?: ContentBanner }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(
    initial
      ? {
          category: initial.category,
          title: initial.title,
          summary: initial.summary || "",
          body: initial.body,
        }
      : emptyForm,
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

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
    if (!form.title || !form.body) return toast.error("Judul dan isi wajib diisi");
    if (!initial && !imageFile) return toast.error("Gambar wajib diupload");

    const payload = new FormData();
    payload.append("category", form.category);
    payload.append("title", form.title);
    payload.append("summary", form.summary);
    payload.append("body", form.body);
    payload.append("published_at", new Date().toISOString());
    if (imageFile) payload.append("image", imageFile);

    setLoading(true);
    try {
      const res = initial
        ? await contentService.update(initial.id, payload)
        : await contentService.create(payload);
      if (res.status) {
        toast.success(initial ? "Konten diupdate" : "Konten dibuat");
        router.push("/content");
        router.refresh();
      }
    } catch {
      toast.error("Gagal menyimpan konten");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Button
            variant="ghost"
            className="mb-3 rounded-xl px-0 font-bold text-slate-500"
            onClick={() => router.push("/content")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
          <h2 className="text-3xl font-black tracking-tight text-slate-900">
            {initial ? "Edit Konten" : "Buat Konten Baru"}
          </h2>
          <p className="mt-1 text-sm font-medium text-slate-400">
            Kelola materi banner yang tampil di beranda aplikasi.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Card className="p-6">
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400">
                  Kategori
                </label>
                <Select
                  value={form.category}
                  onValueChange={(v) =>
                    setForm({ ...form, category: v as ContentCategory })
                  }
                >
                  <SelectTrigger className="h-12 rounded-xl bg-slate-50 font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PROMO">Promo</SelectItem>
                    <SelectItem value="INFORMASI">Informasi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400">
                  Judul
                </label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Contoh: POS Bundle Pro"
                  className="h-12 rounded-xl bg-slate-50 font-bold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-400">
                Ringkasan
              </label>
              <Input
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
                placeholder="Subjudul singkat yang tampil di detail"
                className="h-12 rounded-xl bg-slate-50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-400">
                Isi Detail
              </label>
              <Textarea
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                placeholder="Tulis detail konten..."
                className="min-h-72 rounded-2xl bg-slate-50 p-5 leading-relaxed"
              />
            </div>
          </div>
        </Card>

        <Card className="h-fit p-6">
          <div className="space-y-4">
            <div>
              <h3 className="font-black text-slate-900">Banner</h3>
              <p className="text-xs text-slate-400">Rasio ideal 16:9.</p>
            </div>

            {imagePreview || initial?.image_url ? (
              <div className="overflow-hidden rounded-2xl border bg-slate-50">
                <img
                  src={imagePreview || `${API_ROOT}${initial?.image_url}`}
                  alt="Preview banner"
                  className="aspect-[16/9] w-full object-cover"
                />
                <label className="block cursor-pointer p-4 text-center text-xs font-black uppercase text-[#FF4500]">
                  Ganti Gambar
                  <input
                    hidden
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageChange(e.target.files?.[0])}
                  />
                </label>
              </div>
            ) : (
              <label className="flex h-48 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed bg-slate-50">
                <ImagePlus className="h-8 w-8 text-slate-300" />
                <span className="text-xs font-black uppercase text-slate-500">
                  Upload banner
                </span>
                <input
                  hidden
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e.target.files?.[0])}
                />
              </label>
            )}

            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="h-12 w-full rounded-xl bg-slate-900 font-black uppercase"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initial ? "Simpan Perubahan" : "Publikasikan"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
