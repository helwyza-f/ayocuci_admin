"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FileText, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  LegalDocument,
  LegalDocumentType,
  legalDocumentService,
} from "@/services/legal-document.service";

type FormState = {
  title: string;
  effective_label: string;
  body: string;
};

const typeOptions: Array<{
  type: LegalDocumentType;
  label: string;
  helper: string;
}> = [
  {
    type: "TERMS",
    label: "Syarat & Ketentuan",
    helper: "Dokumen yang tampil saat user membuka halaman syarat layanan.",
  },
  {
    type: "PRIVACY",
    label: "Kebijakan Privasi",
    helper: "Dokumen yang tampil saat user membuka halaman privasi.",
  },
];

const emptyForm: FormState = {
  title: "",
  effective_label: "",
  body: "",
};

export default function LegalDocumentsPage() {
  const [docs, setDocs] = useState<Record<LegalDocumentType, LegalDocument | null>>({
    TERMS: null,
    PRIVACY: null,
  });
  const [activeType, setActiveType] = useState<LegalDocumentType>("TERMS");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const activeMeta = useMemo(
    () => typeOptions.find((item) => item.type === activeType)!,
    [activeType],
  );

  const syncForm = (type: LegalDocumentType, source: Record<LegalDocumentType, LegalDocument | null>) => {
    const doc = source[type];
    setForm({
      title: doc?.title || "",
      effective_label: doc?.effective_label || "",
      body: doc?.body || "",
    });
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await legalDocumentService.getAll();
      const raw = Array.isArray(res.data) ? (res.data as LegalDocument[]) : [];
      const mapped: Record<LegalDocumentType, LegalDocument | null> = {
        TERMS: raw.find((item) => item.type === "TERMS") || null,
        PRIVACY: raw.find((item) => item.type === "PRIVACY") || null,
      };
      setDocs(mapped);
      syncForm(activeType, mapped);
    } catch {
      toast.error("Gagal memuat dokumen legal");
    } finally {
      setLoading(false);
    }
  }, [activeType]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    syncForm(activeType, docs);
  }, [activeType, docs]);

  const handleSave = async () => {
    if (!form.title.trim() || !form.body.trim()) {
      toast.error("Judul dan isi dokumen wajib diisi");
      return;
    }

    setSaving(true);
    try {
      const res = await legalDocumentService.save(activeType, form);
      const updated = res.data as LegalDocument;
      setDocs((prev) => ({ ...prev, [activeType]: updated }));
      toast.success(`${activeMeta.label} berhasil disimpan`);
    } catch {
      toast.error("Gagal menyimpan dokumen legal");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl bg-orange-50 p-4">
            <FileText className="h-7 w-7 text-[#FF4500]" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900">
              Terms & Privacy
            </h2>
            <p className="text-sm font-medium text-slate-400">
              Kelola dokumen legal yang ditampilkan di aplikasi secara realtime.
            </p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={loading || saving}
          className="h-11 rounded-xl bg-slate-900 font-black"
        >
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Simpan Dokumen
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Card className="p-4">
          <div className="space-y-3">
            {typeOptions.map((item) => {
              const isActive = item.type === activeType;
              return (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => setActiveType(item.type)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    isActive
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-900 hover:border-slate-300"
                  }`}
                >
                  <p className="font-black">{item.label}</p>
                  <p className={`mt-1 text-sm ${isActive ? "text-slate-200" : "text-slate-500"}`}>
                    {item.helper}
                  </p>
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="p-6">
          {loading ? (
            <div className="flex h-80 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-[#FF4500]" />
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  {activeMeta.label}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Gunakan format ringan: awali judul section dengan `## ` agar app
                  menampilkan blok per bagian. Baris lain akan ditampilkan sebagai
                  isi teks biasa.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400">
                  Judul Halaman
                </label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="h-12 rounded-xl bg-slate-50 font-bold"
                  placeholder="Contoh: Syarat & Ketentuan"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400">
                  Label Update
                </label>
                <Input
                  value={form.effective_label}
                  onChange={(e) =>
                    setForm({ ...form, effective_label: e.target.value })
                  }
                  className="h-12 rounded-xl bg-slate-50"
                  placeholder="Contoh: Terakhir diperbarui: April 2026"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400">
                  Isi Dokumen
                </label>
                <Textarea
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  className="min-h-[460px] rounded-2xl bg-slate-50 p-5 font-mono text-sm leading-7"
                  placeholder={"## Pendahuluan\nTulis isi dokumen di sini..."}
                />
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
