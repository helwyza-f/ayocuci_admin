"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, PlayCircle } from "lucide-react";
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
  TutorialCategory,
  TutorialItem,
  TutorialPayload,
  TutorialType,
  tutorialCategories,
  tutorialService,
  tutorialTypes,
} from "@/services/tutorial.service";

type FormState = TutorialPayload;

const emptyForm: FormState = {
  type: "VIDEO",
  category: "TRANSAKSI",
  title: "",
  summary: "",
  body: "",
  video_url: "",
  youtube_id: "",
  pdf_url: "",
  duration: "",
  sort_order: 0,
};

function extractYoutubeId(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const plainId = /^[a-zA-Z0-9_-]{11}$/.test(trimmed);
  if (plainId) return trimmed;

  try {
    const url = new URL(trimmed);
    if (url.hostname.includes("youtu.be")) {
      return url.pathname.replace("/", "").slice(0, 11);
    }
    if (url.searchParams.get("v")) {
      return url.searchParams.get("v")?.slice(0, 11) || "";
    }
    const embedMatch = url.pathname.match(/\/(embed|shorts)\/([^/?]+)/);
    return embedMatch?.[2]?.slice(0, 11) || "";
  } catch {
    return "";
  }
}

export function TutorialForm({ initial }: { initial?: TutorialItem }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(
    initial
      ? {
          type: initial.type,
          category: initial.category,
          title: initial.title,
          summary: initial.summary || "",
          body: initial.body || "",
          video_url: initial.video_url || "",
          youtube_id: initial.youtube_id || "",
          pdf_url: initial.pdf_url || "",
          duration: initial.duration || "",
          sort_order: initial.sort_order || 0,
        }
      : emptyForm,
  );
  const [loading, setLoading] = useState(false);

  const handleVideoUrlChange = (value: string) => {
    const nextId = extractYoutubeId(value);
    setForm({
      ...form,
      video_url: value,
      youtube_id: nextId || form.youtube_id,
    });
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) return toast.error("Judul wajib diisi");
    if (
      form.type === "VIDEO" &&
      !form.youtube_id.trim() &&
      !form.video_url.trim()
    ) {
      return toast.error("Video wajib punya YouTube ID atau URL video");
    }
    if (form.type === "GUIDE" && !form.pdf_url.trim() && !form.body.trim()) {
      return toast.error("Panduan wajib punya URL PDF atau deskripsi");
    }
    if (form.type === "FAQ" && !form.body.trim()) {
      return toast.error("FAQ wajib punya jawaban");
    }

    setLoading(true);
    try {
      const payload: TutorialPayload = {
        ...form,
        sort_order: Number(form.sort_order) || 0,
      };
      const res = initial
        ? await tutorialService.update(initial.id, payload)
        : await tutorialService.create(payload);
      if (res.status) {
        toast.success(initial ? "Tutorial diupdate" : "Tutorial dibuat");
        router.push("/tutorials");
        router.refresh();
      }
    } catch {
      toast.error("Gagal menyimpan tutorial");
    } finally {
      setLoading(false);
    }
  };

  const bodyLabel =
    form.type === "FAQ"
      ? "Jawaban FAQ"
      : form.type === "VIDEO"
        ? "Poin yang Dipelajari"
        : "Deskripsi Panduan";

  const bodyPlaceholder =
    form.type === "FAQ"
      ? "Tulis jawaban yang ringkas dan mudah dipahami..."
      : form.type === "VIDEO"
        ? "Contoh:\nCara memilih pelanggan\nCara tambah layanan\nCara lanjut pembayaran"
        : "Tulis deskripsi singkat isi panduan PDF ini...";

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Button
            variant="ghost"
            className="mb-3 rounded-xl px-0 font-bold text-slate-500"
            onClick={() => router.push("/tutorials")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
          <h2 className="text-3xl font-black tracking-tight text-slate-900">
            {initial ? "Edit Tutorial" : "Buat Tutorial Baru"}
          </h2>
          <p className="mt-1 text-sm font-medium text-slate-400">
            Masukkan materi pusat panduan untuk aplikasi AyoCuci.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="p-6">
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <SelectField
                label="Tipe"
                value={form.type}
                onChange={(value) =>
                  setForm({ ...form, type: value as TutorialType })
                }
                items={tutorialTypes}
              />
              <SelectField
                label="Kategori"
                value={form.category}
                onChange={(value) =>
                  setForm({ ...form, category: value as TutorialCategory })
                }
                items={tutorialCategories}
              />
              <Field
                label="Urutan"
                value={String(form.sort_order)}
                onChange={(value) =>
                  setForm({ ...form, sort_order: Number(value) || 0 })
                }
                placeholder="0"
                type="number"
              />
            </div>

            <Field
              label="Judul"
              value={form.title}
              onChange={(value) => setForm({ ...form, title: value })}
              placeholder="Contoh: Cara membuat transaksi baru"
              helper="Tampil sebagai judul utama kartu tutorial."
            />

            <Field
              label="Ringkasan"
              value={form.summary}
              onChange={(value) => setForm({ ...form, summary: value })}
              placeholder="Deskripsi singkat yang tampil di kartu tutorial"
              helper="Tampil di kartu list sebelum user membuka detail."
            />

            {form.type === "VIDEO" && (
              <div className="space-y-4 rounded-2xl border border-orange-100 bg-orange-50/40 p-4">
                <div>
                  <p className="text-sm font-black text-slate-900">
                    Data Video
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-500">
                    Tempel link YouTube di URL Video. YouTube ID akan diisi
                    otomatis kalau format link dikenali.
                  </p>
                </div>
                <Field
                  label="URL Video"
                  value={form.video_url}
                  onChange={handleVideoUrlChange}
                  placeholder="https://youtu.be/xxxxxxxxxxx"
                  helper="Dipakai untuk membuka video dari aplikasi."
                />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field
                    label="YouTube ID"
                    value={form.youtube_id}
                    onChange={(value) => setForm({ ...form, youtube_id: value })}
                    placeholder="11 karakter, contoh: hP8HzYZ74..."
                    helper="Opsional jika URL bukan YouTube. Dipakai untuk thumbnail."
                  />
                  <Field
                    label="Durasi"
                    value={form.duration}
                    onChange={(value) => setForm({ ...form, duration: value })}
                    placeholder="3:24"
                    helper="Isi manual. Bisa pakai 3:24, atau angka 3 untuk tampil sebagai 3 menit."
                  />
                </div>
              </div>
            )}

            {form.type === "GUIDE" && (
              <Field
                label="URL PDF"
                value={form.pdf_url}
                onChange={(value) => setForm({ ...form, pdf_url: value })}
                placeholder="https://.../panduan.pdf"
                helper="PDF dibuka external dari aplikasi mobile."
              />
            )}

            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-400">
                {bodyLabel}
              </label>
              <p className="text-xs font-semibold leading-relaxed text-slate-500">
                {form.type === "VIDEO"
                  ? "Untuk video, isi satu poin per baris. Ini muncul di bottom sheet detail video."
                  : form.type === "FAQ"
                    ? "Untuk FAQ, bagian ini menjadi jawaban lengkap."
                    : "Untuk panduan, bagian ini menjadi deskripsi tambahan jika PDF belum cukup menjelaskan."}
              </p>
              <Textarea
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                placeholder={bodyPlaceholder}
                className="min-h-72 rounded-2xl bg-slate-50 p-5 leading-relaxed"
              />
            </div>
          </div>
        </Card>

        <Card className="h-fit p-6">
          <div className="space-y-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-primary">
              <PlayCircle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-black text-slate-900">Preview Data</h3>
              <p className="text-xs text-slate-400">
                Data aktif akan tampil di pusat panduan mobile.
              </p>
            </div>
            <div className="rounded-2xl border bg-slate-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-primary">
                {form.type} · {form.category}
              </p>
              <p className="mt-2 text-sm font-black text-slate-900">
                {form.title || "Judul tutorial"}
              </p>
              <p className="mt-1 line-clamp-3 text-xs font-medium leading-relaxed text-slate-500">
                {form.summary ||
                  form.body ||
                  "Ringkasan tutorial akan tampil di sini."}
              </p>
            </div>

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

function Field({
  label,
  value,
  onChange,
  placeholder,
  helper,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  helper?: string;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-black uppercase text-slate-400">
        {label}
      </label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-12 rounded-xl bg-slate-50 font-bold"
      />
      {helper && (
        <p className="text-[11px] font-semibold leading-relaxed text-slate-400">
          {helper}
        </p>
      )}
    </div>
  );
}

function SelectField<T extends string>({
  label,
  value,
  onChange,
  items,
}: {
  label: string;
  value: T;
  onChange: (value: string) => void;
  items: Array<{ value: T; label: string }>;
}) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-black uppercase text-slate-400">
        {label}
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-12 rounded-xl bg-slate-50 font-bold">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
