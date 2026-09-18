"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ImagePlus, Loader2, Save, Send, Trash2 } from "lucide-react";
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

type EntityOption = {
  id: string;
  label: string;
  parentId?: string;
};

type NotificationTemplate = {
  id: number;
  name: string;
  description?: string;
  title: string;
  message: string;
  category: string;
  target: string;
  fallback_target?: string;
  cta_label?: string;
};

const notificationTargets = [
  { value: "notification_detail", label: "Informasi atau Promo" },
  { value: "coin_management", label: "Pengelolaan Koin" },
  { value: "coin_topup_detail", label: "Detail Top Up Koin" },
  { value: "addon_purchases", label: "Riwayat Pembelian Add-on" },
  { value: "addon_purchase_detail", label: "Detail Pembelian Add-on" },
  { value: "pro_activation", label: "Aktivasi atau Upgrade PRO" },
  { value: "referral_dashboard", label: "Program Referral" },
  { value: "report_dashboard", label: "Insight dan Laporan" },
] as const;

const adminTargetValues = new Set<string>(
  notificationTargets.map((item) => item.value),
);

export default function NewNotificationPage() {
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [templateName, setTemplateName] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    judul: "",
    pesan: "",
    kategori: "INFO",
    outlets: ["all"],
    target: "notification_detail",
    ctaLabel: "",
    entityId: "",
    parentId: "",
  });
  const [entityOptions, setEntityOptions] = useState<EntityOption[]>([]);
  const [loadingEntities, setLoadingEntities] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");

  useEffect(() => {
    api
      .get("/tenants")
      .then((res) => {
        if (res.data.status) setTenants(res.data.data || []);
      })
      .catch(() => toast.error("Gagal memuat outlet"));
    api.get("/notifications/templates", { params: { active_only: true } })
      .then((res) => setTemplates(
        (res.data?.data || []).filter((template: NotificationTemplate) =>
          adminTargetValues.has(template.target),
        ),
      ))
      .catch(() => toast.error("Gagal memuat template notifikasi"));
  }, []);

  const applyTemplate = (id: string) => {
    const template = templates.find((item) => String(item.id) === id);
    if (!template) return;
    setForm((current) => ({
      ...current,
      judul: template.title,
      pesan: template.message,
      kategori: template.category,
      target: template.target,
      ctaLabel: template.cta_label || "",
      entityId: "",
      parentId: "",
    }));
    toast.success(`Template “${template.name}” diterapkan`);
  };

  const saveTemplate = async () => {
    if (!templateName.trim() || !form.judul.trim() || !form.pesan.trim()) {
      toast.error("Nama template, judul, dan pesan wajib diisi");
      return;
    }
    setSavingTemplate(true);
    try {
      const response = await api.post("/notifications/templates", {
        name: templateName.trim(),
        title: form.judul.trim(),
        message: form.pesan.trim(),
        category: form.kategori,
        target: form.target,
        fallback_target: "notification_detail",
        cta_label: form.ctaLabel.trim(),
      });
      setTemplates((current) => [...current, response.data.data].sort((a, b) => a.name.localeCompare(b.name)));
      setTemplateName("");
      toast.success("Template notifikasi disimpan");
    } catch {
      toast.error("Gagal menyimpan template; pastikan namanya belum digunakan");
    } finally {
      setSavingTemplate(false);
    }
  };

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const selectedOutlet = form.outlets.length === 1 && form.outlets[0] !== "all"
    ? form.outlets[0]
    : "";

  useEffect(() => {
    const entityTargets = new Set([
      "coin_topup_detail",
      "addon_purchase_detail",
    ]);
    if (!entityTargets.has(form.target) || !selectedOutlet) {
      setEntityOptions([]);
      return;
    }
    setLoadingEntities(true);
    const loadEntities = async () => {
      try {
        if (form.target === "transaction_detail") {
          const res = await api.get("/transactions", { params: { outlet: selectedOutlet, page: 1, limit: 100 } });
          const rows = res.data?.data?.data || [];
          setEntityOptions(rows.map((row: Record<string, any>) => ({
            id: String(row.id),
            label: `${row.id} · ${row.pelanggan?.nama || row.pelanggan?.name || "Pelanggan"} · ${row.status_order || "-"}`,
          })));
        } else if (form.target === "customer_detail" || form.target === "customer_deposit") {
          const res = await api.get("/customers", { params: { outlet_id: selectedOutlet } });
          const rows = res.data?.data || [];
          setEntityOptions(rows.map((row: Record<string, any>) => ({
            id: String(row.pel_id || row.id),
            label: `${row.pel_nama || row.name || "Pelanggan"} · ${row.pel_nohp || row.nohp || "-"}`,
          })));
        } else if (form.target === "customer_deposit_entry") {
          const res = await api.get("/notifications/entity-options", {
            params: { target: form.target, outlet_id: selectedOutlet },
          });
          const rows = res.data?.data || [];
          setEntityOptions(rows.map((row: Record<string, any>) => ({
            id: String(row.id),
            parentId: String(row.parent_id),
            label: `${row.customer_name || "Pelanggan"} · ${row.entry_type || "Mutasi"} ${row.deposit_type || ""} · ${row.amount || 0}`,
          })));
        } else if (form.target === "coin_topup_detail") {
          const res = await api.get("/topup-koin", { params: { outlet_id: selectedOutlet } });
          const rows = res.data?.data || [];
          setEntityOptions(rows.map((row: Record<string, any>) => ({
            id: String(row.tk_id),
            label: `${row.tk_id} · ${row.tk_jumlah || 0} koin · ${row.tk_status || "-"}`,
          })));
        } else if (form.target === "addon_purchase_detail") {
          const res = await api.get("/topup-addon", { params: { outlet_id: selectedOutlet } });
          const rows = res.data?.data || [];
          setEntityOptions(rows.map((row: Record<string, any>) => ({
            id: String(row.ha_id),
            label: `${row.ha_id} · ${row.item_names || "Add-on"} · ${row.ha_status || "-"}`,
          })));
		} else if (form.target === "expense_detail") {
		  const res = await api.get("/notifications/entity-options", {
			params: { target: form.target, outlet_id: selectedOutlet },
		  });
		  const rows = res.data?.data || [];
		  setEntityOptions(rows.map((row: Record<string, any>) => ({
			id: String(row.id),
			label: `${row.kategori || "Pengeluaran"} · Rp${Number(row.total || 0).toLocaleString("id-ID")} · ${String(row.tanggal || "").slice(0, 10)}`,
		  })));
        }
      } catch {
        setEntityOptions([]);
        toast.error("Gagal memuat data tujuan outlet");
      } finally {
        setLoadingEntities(false);
      }
    };
    loadEntities();
  }, [form.target, selectedOutlet]);

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
      setForm({ ...form, outlets: ["all"], entityId: "" });
    } else if (values.includes("all") && values.length > 1) {
      setForm({ ...form, outlets: values.filter((v) => v !== "all"), entityId: "" });
    } else {
      setForm({ ...form, outlets: values, entityId: "" });
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
    if (["coin_topup_detail", "addon_purchase_detail"].includes(form.target)) {
      if (!selectedOutlet) return toast.error("Tujuan spesifik hanya dapat dikirim ke satu outlet");
      if (!form.entityId) return toast.error("Pilih data tujuan notifikasi");
    }

    const payload = new FormData();
    payload.append("judul", form.judul);
    payload.append("pesan", form.pesan);
    payload.append("kategori", form.kategori);
    payload.append("target", form.target);
    payload.append("fallback_target", "notification_detail");
    if (form.ctaLabel.trim()) payload.append("cta_label", form.ctaLabel.trim());
    if (form.entityId) payload.append("entity_id", form.entityId);
    if (form.parentId) payload.append("parent_id", form.parentId);
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
            <div className="rounded-2xl border border-orange-100 bg-orange-50/50 p-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-slate-500">Gunakan Template</label>
                  <Select onValueChange={applyTemplate}>
                    <SelectTrigger className="h-12 rounded-xl bg-white font-bold">
                      <SelectValue placeholder={templates.length ? "Pilih template" : "Belum ada template"} />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={String(template.id)}>{template.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-slate-500">Simpan sebagai Template</label>
                  <div className="flex gap-2">
                    <Input value={templateName} onChange={(event) => setTemplateName(event.target.value)} placeholder="Nama template" className="h-12 bg-white" />
                    <Button type="button" variant="outline" className="h-12" onClick={saveTemplate} disabled={savingTemplate}>
                      {savingTemplate ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-[11px] font-medium text-slate-500">Template menyimpan isi dan aksi, tetapi outlet serta data tujuan tetap dipilih setiap pengiriman.</p>
            </div>
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

            {["coin_topup_detail", "addon_purchase_detail"].includes(form.target) && (
              <div className="space-y-2 rounded-2xl border border-orange-100 bg-orange-50/50 p-4">
                <label className="text-xs font-black uppercase text-slate-500">
                  Data Tujuan
                </label>
                {!selectedOutlet ? (
                  <p className="text-xs font-bold text-amber-700">
                    Pilih tepat satu outlet untuk mengambil data tujuan.
                  </p>
                ) : (
                  <Select
                    value={form.entityId}
                    onValueChange={(v) => {
                      const selected = entityOptions.find((item) => item.id === v);
                      setForm({ ...form, entityId: v, parentId: selected?.parentId || "" });
                    }}
                    disabled={loadingEntities}
                  >
                    <SelectTrigger className="h-12 rounded-xl bg-white font-bold">
                      <SelectValue placeholder={loadingEntities ? "Memuat data..." : "Pilih data tujuan"} />
                    </SelectTrigger>
                    <SelectContent>
                      {entityOptions.map((entity) => (
                        <SelectItem key={entity.id} value={entity.id}>
                          {entity.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400">
                  Aksi Saat Dibuka
                </label>
                <Select
                  value={form.target}
                  onValueChange={(v) => setForm({ ...form, target: v, entityId: "" })}
                >
                  <SelectTrigger className="h-12 rounded-xl bg-slate-50 font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {notificationTargets.map((target) => (
                      <SelectItem key={target.value} value={target.value}>
                        {target.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] font-medium text-slate-400">
                  Pilih halaman relasi platform yang relevan bagi owner outlet.
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400">
                  Label CTA Opsional
                </label>
                <Input
                  value={form.ctaLabel}
                  onChange={(e) => setForm({ ...form, ctaLabel: e.target.value })}
                  placeholder="Contoh: Lihat Laporan"
                  maxLength={80}
                  className="h-12 rounded-xl bg-slate-50 font-bold"
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
                        <span className="text-[9px] font-medium text-slate-400">sekarang</span>
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-[11px] font-black leading-tight text-slate-900">
                          {form.judul || "Judul broadcast"}
                        </h4>
                        <p className="text-[10px] leading-snug text-slate-600 line-clamp-3">
                          {form.pesan || "Pesan Anda akan muncul di sini saat mulai mengetik."}
                        </p>
                        {form.target !== "notification_detail" && (
                          <p className="pt-1 text-[9px] font-black uppercase tracking-wide text-primary">
                            {form.ctaLabel || notificationTargets.find((item) => item.value === form.target)?.label}
                          </p>
                        )}
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
              Pratinjau Aplikasi
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
