"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Smartphone, RefreshCw } from "lucide-react";
import api from "@/lib/api-client";
import { Button } from "@/components/ui/button";

interface Session {
  id: string; installation_id: string; actor_type: string; actor_name: string;
  platform: string; device_model: string; os_version: string; app_version: string;
  notification_permission: string; outlet_id: string; outlet_name: string;
  signed_in_at: string; login_observed: boolean; last_seen_at: string; expires_at: string; logged_out_at: string | null;
}
interface Legacy {id: number; platform: string; app_version: string; outlet_id: string; actor_type: string; last_synced_at: string; push_active: boolean}
interface Result {sessions: Session[]; legacy_push_registrations: Legacy[]; has_more: boolean}
const permission: Record<string, string> = {authorized: "Aktif", provisional: "Diizinkan senyap", denied: "Tidak diizinkan", not_determined: "Belum diminta", unknown: "Belum diketahui"};
function date(value: string) {const d = new Date(value); return Number.isNaN(d.getTime()) ? "—" : format(d, "dd MMM yyyy HH:mm", {locale: localeId});}
function status(s: Session) {return s.logged_out_at ? "Sudah logout" : new Date(s.expires_at).getTime() <= Date.now() ? "Token kedaluwarsa" : "Belum logout";}
function role(s: Session) {return s.actor_type === "user" ? "Owner" : "Pegawai";}

export function DeviceActivity({ endpoint, outlet = false }: {endpoint: string; outlet?: boolean}) {
  const [data, setData] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const requestVersion = useRef(0);
  const load = useCallback(async () => {
    const version = ++requestVersion.current;
    setLoading(true); setFailed(false);
    try {const res = await api.get(endpoint); if (!res.data.status) throw new Error(); if (version === requestVersion.current) setData(res.data.data);}
    catch {if (version === requestVersion.current) setFailed(true);} finally {if (version === requestVersion.current) setLoading(false);}
  }, [endpoint]);
  useEffect(() => {
    setData(null); void load();
    const refresh = () => {if (document.visibilityState === "visible") void load();};
    const timer = window.setInterval(refresh, 60000);
    document.addEventListener("visibilitychange", refresh);
    return () => {requestVersion.current++; window.clearInterval(timer); document.removeEventListener("visibilitychange", refresh);};
  }, [load]);
  const groups = useMemo(() => {
    const map = new Map<string, Session[]>();
    for (const s of data?.sessions || []) {const rows = map.get(s.installation_id) || []; rows.push(s); map.set(s.installation_id, rows);}
    return [...map.values()];
  }, [data]);
  const platforms = [...new Set(groups.map(rows => rows[0].platform === "ios" ? "iOS" : "Android"))].join(" & ");
  return <section className="rounded-xl border bg-white p-5 space-y-4">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-bold">Perangkat & Aktivitas</h2><p className="text-sm text-slate-500">{outlet ? "Sesi yang terakhir beraktivitas pada outlet ini." : "Perangkat owner dan pegawai, digabung lintas outlet."}</p></div><Button variant="outline" disabled={loading} onClick={load}><RefreshCw className="mr-2 h-4 w-4" />{loading ? "Memuat…" : "Muat ulang"}</Button></div>
    {failed && <p role="alert" className="text-sm text-red-600">Gagal memuat perangkat. Silakan muat ulang.</p>}
    {data && <>
      <div className="rounded-lg bg-slate-50 p-3"><p className="font-semibold">{groups.length} instalasi tercatat{platforms ? ` · ${platforms}` : ""}</p><p className="text-xs text-slate-500 mt-1">Aktivitas diperbarui saat aplikasi di depan layar, sekitar setiap 2 menit. “Belum logout” tidak berarti sedang online. Install ulang bisa tercatat sebagai instalasi baru.</p></div>
      {groups.length === 0 && <p className="text-sm text-slate-500">Belum ada sesi dengan informasi perangkat lengkap. Data mulai tercatat setelah pengguna memakai aplikasi versi terbaru; bukan berarti akun tidak aktif.</p>}
      {groups.map(rows => {
        const s = rows[0]; const seen = new Date(s.last_seen_at);
        return <article key={s.installation_id} className="rounded-lg border p-4 space-y-3">
          <div className="flex items-start gap-3"><Smartphone className="h-6 w-6 shrink-0 text-orange-500"/><div className="min-w-0 flex-1"><p className="font-bold break-words">{s.device_model || "Model belum diketahui"}</p><p className="text-xs text-slate-500">{s.platform === "ios" ? "iOS" : "Android"} · {s.os_version || "—"} · Aplikasi {s.app_version || "—"}</p></div><span className="shrink-0 text-xs rounded bg-slate-100 px-2 py-1">{status(s)}</span></div>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div><dt className="text-xs text-slate-500">Pengguna terakhir</dt><dd className="break-words">{s.actor_name || "Nama belum tersedia"} · {role(s)}</dd></div>
            <div><dt className="text-xs text-slate-500">Aktivitas terakhir</dt><dd title={date(s.last_seen_at)}>{Number.isNaN(seen.getTime()) ? "—" : formatDistanceToNow(seen, {addSuffix: true, locale: localeId})} · {date(s.last_seen_at)}</dd></div>
            <div><dt className="text-xs text-slate-500">Outlet terakhir</dt><dd className="break-words">{s.outlet_name || s.outlet_id || "Belum memilih outlet"}</dd></div>
            <div><dt className="text-xs text-slate-500">Izin notifikasi</dt><dd>{permission[s.notification_permission] || "Belum diketahui"}</dd></div>
            <div><dt className="text-xs text-slate-500">{s.login_observed ? "Login sesi terakhir" : "Sesi mulai tercatat (login sebelumnya)"}</dt><dd>{date(s.signed_in_at)}</dd></div>
            {s.logged_out_at && <div><dt className="text-xs text-slate-500">Logout</dt><dd>{date(s.logged_out_at)}</dd></div>}
          </dl>
          <details className="text-xs"><summary className="cursor-pointer text-slate-600">Riwayat sesi ({rows.length})</summary><div className="divide-y mt-2">{rows.map(row => <p key={row.id} className="py-2 break-words">{row.actor_name || role(row)} · {date(row.signed_in_at)} · {status(row)} · {row.outlet_name || row.outlet_id || "Belum memilih outlet"}</p>)}</div></details>
        </article>;
      })}
      {data.has_more && <p className="text-xs text-slate-500">Menampilkan 200 sesi terbaru. Ringkasan hanya mencakup sesi yang ditampilkan.</p>}
      {data.legacy_push_registrations.length > 0 && <details className="rounded-lg border p-3 text-sm"><summary className="cursor-pointer font-semibold">Pendaftaran push lama · data belum lengkap ({data.legacy_push_registrations.length})</summary><p className="my-2 text-xs text-slate-500">Ini bukan daftar sesi login. Waktu berikut adalah pembaruan data push, bukan aktivitas aplikasi. Satu perangkat bisa memiliki beberapa pendaftaran.</p><div className="divide-y">{data.legacy_push_registrations.map(row => <p className="py-2 text-xs" key={row.id}>{row.platform || "Platform belum diketahui"} · {row.app_version || "Versi belum diketahui"} · Outlet {row.outlet_id} · Pembaruan {date(row.last_synced_at)} · Push {row.push_active ? "aktif" : "nonaktif"}</p>)}</div></details>}
    </>}
  </section>;
}
