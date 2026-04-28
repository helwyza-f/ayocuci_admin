"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";
import { ImagePlus, Loader2, Megaphone, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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

const emptyForm = {
  category: "PROMO" as ContentCategory,
  title: "",
  summary: "",
  body: "",
};

export default function DashboardContentPage() {
  const [items, setItems] = useState<ContentBanner[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<ContentBanner | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const promos = useMemo(
    () => items.filter((item) => item.category === "PROMO"),
    [items],
  );
  const infos = useMemo(
    () => items.filter((item) => item.category === "INFORMASI"),
    [items],
  );

  const fetchData = async () => {
    setFetching(true);
    try {
      const res = await contentService.getAll();
      if (res.status) setItems(res.data || []);
    } catch {
      toast.error("Gagal memuat konten");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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

  const resetForm = () => {
    setForm(emptyForm);
    setEditing(null);
    handleImageChange();
  };

  const startEdit = (item: ContentBanner) => {
    setEditing(item);
    setForm({
      category: item.category,
      title: item.title,
      summary: item.summary || "",
      body: item.body,
    });
    handleImageChange();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    if (!form.title || !form.body) return toast.error("Judul dan isi wajib diisi");
    if (!editing && !imageFile) return toast.error("Gambar wajib diupload");

    const payload = new FormData();
    payload.append("category", form.category);
    payload.append("title", form.title);
    payload.append("summary", form.summary);
    payload.append("body", form.body);
    payload.append("published_at", new Date().toISOString());
    if (imageFile) payload.append("image", imageFile);

    setLoading(true);
    try {
      const res = editing
        ? await contentService.update(editing.id, payload)
        : await contentService.create(payload);
      if (res.status) {
        toast.success(editing ? "Konten diupdate" : "Konten dibuat");
        resetForm();
        fetchData();
      }
    } catch {
      toast.error("Gagal menyimpan konten");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center gap-5 rounded-[40px] border border-slate-100 bg-white p-8 shadow-sm">
        <div className="rounded-[25px] bg-orange-50 p-5">
          <Megaphone className="h-8 w-8 text-[#FF4500]" />
        </div>
        <div>
          <h2 className="text-3xl font-black uppercase leading-none tracking-tighter text-slate-800">
            Konten <span className="text-[#FF4500]">& Banner</span>
          </h2>
          <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
            Promo dan informasi untuk halaman beranda aplikasi
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <Card className="p-8 lg:col-span-1">
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-black text-slate-900">
                {editing ? "Edit Konten" : "Buat Konten"}
              </h3>
              <p className="text-xs font-medium text-slate-400">
                Banner akan tampil di home app.
              </p>
            </div>

            <Select
              value={form.category}
              onValueChange={(v) =>
                setForm({ ...form, category: v as ContentCategory })
              }
            >
              <SelectTrigger className="h-12 rounded-2xl bg-slate-50 font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PROMO">Promo</SelectItem>
                <SelectItem value="INFORMASI">Informasi</SelectItem>
              </SelectContent>
            </Select>

            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Judul konten"
              className="h-12 rounded-2xl bg-slate-50 font-bold"
            />
            <Input
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
              placeholder="Ringkasan singkat"
              className="h-12 rounded-2xl bg-slate-50"
            />
            <Textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder="Isi detail konten..."
              className="min-h-40 rounded-3xl bg-slate-50 p-5"
            />

            {imagePreview || editing?.image_url ? (
              <div className="overflow-hidden rounded-3xl border bg-slate-50">
                <img
                  src={imagePreview || `${API_ROOT}${editing?.image_url}`}
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
              <label className="flex h-36 cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border border-dashed bg-slate-50">
                <ImagePlus className="h-7 w-7 text-slate-300" />
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
              className="h-13 w-full rounded-2xl bg-slate-900 font-black uppercase"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Simpan Perubahan" : "Publikasikan"}
            </Button>
            {editing && (
              <Button
                onClick={resetForm}
                variant="outline"
                className="h-12 w-full rounded-2xl font-black uppercase"
              >
                Batal Edit
              </Button>
            )}
          </div>
        </Card>

        <div className="space-y-8 lg:col-span-2">
          {fetching ? (
            <Card className="flex h-56 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-[#FF4500]" />
            </Card>
          ) : (
            <>
              <ContentSection title="Promo" items={promos} onEdit={startEdit} onRefresh={fetchData} />
              <ContentSection title="Informasi" items={infos} onEdit={startEdit} onRefresh={fetchData} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ContentSection({
  title,
  items,
  onEdit,
  onRefresh,
}: {
  title: string;
  items: ContentBanner[];
  onEdit: (item: ContentBanner) => void;
  onRefresh: () => void;
}) {
  return (
    <section className="space-y-4">
      <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">
        {title}
      </h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {items.map((item) => (
          <Card key={item.id} className="overflow-hidden p-0">
            <img
              src={`${API_ROOT}${item.image_url}`}
              alt={item.title}
              className="aspect-[16/9] w-full object-cover"
            />
            <div className="space-y-3 p-5">
              <div className="flex items-center justify-between gap-3">
                <Badge className="bg-orange-50 text-[#FF4500]">
                  {item.category}
                </Badge>
                <Badge variant="outline">
                  {item.is_active ? "Aktif" : "Nonaktif"}
                </Badge>
              </div>
              <div>
                <h4 className="line-clamp-1 font-black text-slate-900">
                  {item.title}
                </h4>
                <p className="line-clamp-2 text-xs text-slate-500">
                  {item.summary || item.body}
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => onEdit(item)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    await contentService.toggleStatus(item.id);
                    onRefresh();
                  }}
                >
                  {item.is_active ? "Nonaktifkan" : "Aktifkan"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    await contentService.delete(item.id);
                    onRefresh();
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
