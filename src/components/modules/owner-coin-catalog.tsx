"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api-client";
import { KoinPackage } from "@/types/domain";
import { Button } from "@/components/ui/button";
import PermissionGate from "@/components/shared/permission-gate";
import { toast } from "sonner";

type Config = { mode: "global" | "custom"; package_ids: number[]; packages: KoinPackage[] };

export function OwnerCoinCatalog({ ownerId }: { ownerId: string }) {
  const [config, setConfig] = useState<Config | null>(null);
  const [mode, setMode] = useState<Config["mode"]>("global");
  const [selected, setSelected] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const load = useCallback(async () => {
    setFailed(false);
    try {
      const { data } = await api.get(`/users/${ownerId}/coin-catalog`);
      if (!data.status) throw new Error(data.message);
      const value: Config = data.data;
      setConfig(value); setMode(value.mode); setSelected(value.package_ids);
    } catch { setFailed(true); }
  }, [ownerId]);
  useEffect(() => { setConfig(null); void load(); }, [load]);
  const visible = config?.packages.filter(p => p.is_active && (mode === "global" || selected.includes(p.id))) || [];
  async function save() {
    if (mode === "custom" && visible.length === 0 && !window.confirm("Semua paket koin akan disembunyikan untuk seluruh outlet owner ini. Simpan?")) return;
    setSaving(true);
    try {
      const { data } = await api.put(`/users/${ownerId}/coin-catalog`, { mode, package_ids: mode === "custom" ? selected : [] });
      if (!data.status) throw new Error(data.message);
      toast.success("Pengaturan katalog disimpan"); await load();
    } catch { toast.error("Gagal menyimpan katalog. Silakan coba lagi."); }
    finally { setSaving(false); }
  }
  if (failed) return <div className="p-5">Gagal memuat katalog. <Button onClick={load}>Coba lagi</Button></div>;
  if (!config) return <p className="p-5">Memuat pengaturan katalog…</p>;
  return <section className="rounded-xl border bg-white p-5 space-y-5">
    <div><h2 className="font-bold">Katalog Paket Koin</h2><p className="text-sm text-slate-500">Berlaku untuk semua outlet owner ini. Harga tetap mengikuti pengaturan paket global.</p></div>
    <div className="flex flex-wrap gap-4">
      {(["global", "custom"] as const).map(value => <label key={value} className="flex items-center gap-2 text-sm">
        <input type="radio" name={`catalog-${ownerId}`} checked={mode === value} disabled={saving} onChange={() => {
          if (value === "custom" && mode === "global") setSelected(config.packages.filter(p => p.is_active).map(p => p.id));
          setMode(value);
        }} />{value === "global" ? "Ikuti Global" : "Custom"}
      </label>)}
    </div>
    <p className="text-sm text-slate-500">{mode === "global" ? "Mengikuti paket aktif global. Menyimpan mode ini menghapus pilihan custom." : "Atur ON/OFF khusus owner ini. Paket baru otomatis OFF; paket nonaktif global tetap tidak tersedia."}</p>
    <div className="divide-y rounded-lg border">
      {config.packages.map(p => <label key={p.id} className="flex items-center justify-between gap-3 p-3">
        <div className="min-w-0"><p className="font-semibold">{p.jumlah_koin.toLocaleString("id-ID")} Koin</p><p className="text-xs text-slate-500">Diskon {p.discount_pct}% · {p.is_active ? "Aktif global" : "Nonaktif global"} · {p.apple_product_id ? "Android & iOS*" : "Android; SKU iOS belum tersedia"}</p></div>
        <input type="checkbox" role="switch" aria-label={`Tampilkan ${p.jumlah_koin} koin`} checked={!!p.is_active && (mode === "global" || selected.includes(p.id))} disabled={mode === "global" || !p.is_active || saving} onChange={e => setSelected(ids => e.target.checked ? [...ids, p.id] : ids.filter(id => id !== p.id))} className="h-5 w-5 shrink-0 accent-orange-500" />
      </label>)}
    </div>
    <div className="rounded-lg bg-slate-50 p-3 text-sm"><p className="font-semibold">Pratinjau: {visible.length} paket tersedia</p><p>{visible.map(p => `${p.jumlah_koin.toLocaleString("id-ID")} koin`).join(", ") || "Tidak ada paket"}</p><p className="mt-2 text-xs text-slate-500">*iOS tetap memerlukan produk yang tersedia di App Store. Pembelian yang sudah dibayar tetap diselesaikan.</p></div>
    <PermissionGate module="users" action="update"><Button onClick={save} disabled={saving}>{saving ? "Menyimpan…" : "Simpan Pengaturan"}</Button></PermissionGate>
  </section>;
}
