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
    <div className="space-y-6">
      {/* COMMAND BAR HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2 font-heading">
            <FileText className="h-5 w-5 text-primary" />
            Terms & Privacy
          </h1>
          <p className="text-xs font-medium text-slate-500">
            Manage legal documents displayed in the mobile application.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleSave}
            disabled={loading || saving}
            size="sm"
            className="h-8 px-3 font-bold text-[10px] uppercase tracking-wider gap-2 shadow-none"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* SIDEBAR NAVIGATION */}
        <Card className="p-2 border border-slate-200 shadow-none rounded-lg bg-white h-fit">
          <div className="space-y-1">
            {typeOptions.map((item) => {
              const isActive = item.type === activeType;
              return (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => setActiveType(item.type)}
                  className={`w-full rounded-md p-3 text-left transition-colors ${
                    isActive
                      ? "bg-primary/5 text-primary border border-primary/10"
                      : "bg-white text-slate-600 hover:bg-slate-50 border border-transparent"
                  }`}
                >
                  <p className="font-bold text-xs uppercase tracking-tight leading-none mb-1.5">{item.label}</p>
                  <p className={`text-[10px] font-medium leading-normal ${isActive ? "text-primary/70" : "text-slate-400"}`}>
                    {item.helper}
                  </p>
                </button>
              );
            })}
          </div>
        </Card>

        {/* EDITOR SECTION */}
        <Card className="p-5 border border-slate-200 shadow-none rounded-lg bg-white">
          {loading ? (
            <div className="flex h-80 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-5">
              <div className="pb-4 border-b border-slate-50">
                <h3 className="text-base font-bold text-slate-900 font-heading leading-none mb-1">
                  {activeMeta.label}
                </h3>
                <p className="text-[10px] font-medium text-slate-400 italic">
                  Markdown support enabled: Use `## ` for section headers.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-tight text-slate-400 ml-1">
                    Display Title
                  </label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="h-9 rounded border-slate-200 font-bold text-xs shadow-none"
                    placeholder="e.g. Terms of Service"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-tight text-slate-400 ml-1">
                    Revision Label
                  </label>
                  <Input
                    value={form.effective_label}
                    onChange={(e) =>
                      setForm({ ...form, effective_label: e.target.value })
                    }
                    className="h-9 rounded border-slate-200 font-medium text-xs shadow-none"
                    placeholder="e.g. Effective: April 2026"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-tight text-slate-400 ml-1">
                  Document Content
                </label>
                <Textarea
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  className="min-h-[400px] rounded border-slate-200 p-4 font-mono text-[11px] leading-6 shadow-none bg-slate-50/30"
                  placeholder={"## Introduction\nWrite document content here..."}
                />
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
