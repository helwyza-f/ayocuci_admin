"use client";

import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { Copy, KeyRound, Loader2, RefreshCw, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api-client";
import { useAuthStore } from "@/store/use-auth-store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type KeyStatus = { enabled: boolean; version: string; updated_by: string; updated_at: string; last_used_at: string | null };
type Audit = { id: number; action: string; admin_id: string; owner_id: number; email: string; ip: string; created_at: string };
type Registry = { key: KeyStatus; history: Audit[] };
const actions: Record<string, string> = { rotate: "Kunci dirotasi", disable: "Kunci dinonaktifkan", login: "Login owner", login_failed: "Login gagal" };
function when(value?: string | null) {
  if (!value || value.startsWith("0001-")) return "Belum ada";
  return new Date(value).toLocaleString("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "medium", timeStyle: "short" });
}

export default function MasterLoginKeyCard() {
  const master = useAuthStore((state) => state.isMaster());
  const [data, setData] = useState<Registry | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  // Deliberately kept only in component memory; never persisted in browser storage.
  const [secret, setSecret] = useState("");

  async function load() {
    setLoading(true); setError("");
    try {
      const res = await api.get("/master-login-key");
      setData(res.data.data);
    } catch {
      setError("Status master key gagal dimuat. Coba muat ulang.");
    } finally { setLoading(false); }
  }
  useEffect(() => {
    if (!master) return;
    let cancelled = false;
    api.get("/master-login-key").then((res) => {
      if (!cancelled) setData(res.data.data);
    }).catch(() => {
      if (!cancelled) setError("Status master key gagal dimuat. Coba muat ulang.");
    });
    return () => { cancelled = true; };
  }, [master]);

  async function change(disable: boolean) {
    if (!password || busy) return;
    setBusy(true); setSecret("");
    try {
      const res = disable
        ? await api.delete("/master-login-key", { data: { admin_password: password } })
        : await api.post("/master-login-key", { admin_password: password });
      setPassword("");
      setSecret(res.data.data.master_key || "");
      toast.success(disable ? "Master key dinonaktifkan" : "Master key baru berhasil dibuat");
      await load();
    } catch (err) {
      toast.error(isAxiosError(err) ? err.response?.data?.message || "Gagal memperbarui master key" : "Gagal memperbarui master key");
    } finally { setBusy(false); }
  }

  if (!master) return null;
  return (
    <Card className="space-y-5 p-5 border-slate-200 shadow-none">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-semibold text-slate-900"><KeyRound className="h-4 w-4 text-primary" />Master Key Login Owner</h2>
          <p className="mt-1 text-sm text-slate-500">Masuk dari halaman login aplikasi dengan email owner dan master key sebagai password.</p>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium"><ShieldCheck className="h-3 w-3" />Khusus Master Admin</span>
      </div>
      {error ? <div className="flex flex-wrap items-center gap-3 text-sm text-red-600" role="alert">{error}<Button variant="outline" size="sm" onClick={load} disabled={loading}>Muat ulang</Button></div> : !data ? <p className="text-sm text-slate-500" role="status">Memuat status…</p> : <>
        <dl className="grid grid-cols-1 gap-4 rounded-lg bg-slate-50 p-4 text-sm sm:grid-cols-3">
          <div><dt className="text-slate-500">Status</dt><dd className="mt-1 font-semibold">{data.key.enabled ? "Aktif" : "Nonaktif"}</dd></div>
          <div><dt className="text-slate-500">Terakhir diubah</dt><dd className="mt-1">{when(data.key.updated_at)}</dd></div>
          <div><dt className="text-slate-500">Terakhir digunakan</dt><dd className="mt-1">{when(data.key.last_used_at)}</dd></div>
        </dl>
        <p className="text-sm text-slate-600">Hanya berlaku untuk akun owner aktif. Sesi berlaku maksimal 2 jam. Rotasi atau penonaktifan langsung mencabut sesi master key lama; login dengan password nasabah tetap berlaku.</p>
        <div className="max-w-md space-y-2">
          <Label htmlFor="master-key-admin-password">Password akun Master Admin Anda</Label>
          <Input id="master-key-admin-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={busy} placeholder="Verifikasi untuk rotasi atau nonaktifkan" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => change(false)} disabled={busy || !password || loading}>{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}{data.key.enabled ? "Rotasi Master Key" : "Buat Master Key"}</Button>
          <Button variant="outline" onClick={() => change(true)} disabled={busy || !password || !data.key.enabled || loading}>Nonaktifkan</Button>
        </div>
      </>}
      {secret && <div className="space-y-3 rounded-lg border border-orange-200 bg-orange-50 p-4" aria-live="polite">
        <div className="flex items-start justify-between gap-2"><p className="text-sm font-semibold">Salin sekarang. Kunci hanya ditampilkan sekali.</p><Button size="icon" variant="ghost" aria-label="Tutup kunci" onClick={() => setSecret("")}><X className="h-4 w-4" /></Button></div>
        <code className="block select-all break-all rounded bg-white p-3 text-sm">{secret}</code>
        <Button variant="outline" size="sm" onClick={async () => { try { await navigator.clipboard.writeText(secret); toast.success("Master key disalin"); } catch { toast.error("Tidak dapat menyalin. Pilih dan salin kunci secara manual."); } }}><Copy className="mr-2 h-4 w-4" />Salin kunci</Button>
      </div>}
      {data && <div className="space-y-3 border-t pt-4">
        <h3 className="text-sm font-semibold">Riwayat penggunaan & perubahan</h3>
        <p className="text-xs text-slate-500">100 aktivitas terakhir. Pengelola adalah master yang membuat kunci; pemakai kunci bersama dikenali dari email tujuan dan alamat IP.</p>
        <div className="max-h-80 overflow-auto rounded-lg border">
          <table className="w-full text-left text-xs"><thead className="sticky top-0 bg-slate-50"><tr>{["Waktu (WIB)", "Aktivitas", "Owner / Email", "Pengelola kunci", "IP"].map((label) => <th key={label} className="whitespace-nowrap p-3 font-medium">{label}</th>)}</tr></thead><tbody>
            {data.history.map((row) => <tr key={row.id} className="border-t"><td className="whitespace-nowrap p-3">{when(row.created_at)}</td><td className="whitespace-nowrap p-3">{actions[row.action] || row.action}</td><td className="p-3">{row.email || "—"}{row.owner_id > 0 && <span className="block text-slate-500">Owner #{row.owner_id}</span>}</td><td className="p-3">{row.admin_id || "—"}</td><td className="whitespace-nowrap p-3">{row.ip || "—"}</td></tr>)}
            {data.history.length === 0 && <tr><td colSpan={5} className="p-5 text-center text-slate-500">Belum ada aktivitas master key.</td></tr>}
          </tbody></table>
        </div>
      </div>}
    </Card>
  );
}
