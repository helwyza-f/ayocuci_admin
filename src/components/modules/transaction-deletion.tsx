"use client";

import { useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import axios from "axios";
import { Trash2, RotateCcw, History, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api-client";
import { apiFetcher } from "@/lib/fetcher";
import PermissionGate from "@/components/shared/permission-gate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Preview = {
  invoice: string; outlet_id: string; outlet_name: string; customer_name: string;
  total: number; paid: number; order_status: string; payment_status: string;
  detail_count: number; payment_count: number; fingerprint: string; blockers: string[];
};
type Deletion = {
  id: string; outlet_id: string; invoice: string; customer_name: string; total: number; paid: number;
  reason: string; deleted_by: string; created_at: string;
  restored_at: string | null; restored_by: string; restore_reason: string;
};
type Envelope<T> = { status: boolean; message: string; data: T };
const rupiah = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
const date = (value: string) => new Date(value).toLocaleString("id-ID");
function errorMessage(error: unknown) {
  return axios.isAxiosError(error) ? error.response?.data?.message || "Permintaan gagal. Silakan coba lagi." : "Permintaan gagal. Silakan coba lagi.";
}
function useRefreshTransactions() {
  const { mutate } = useSWRConfig();
  return () => mutate(key => typeof key === "string" && (key.startsWith("/transactions?") || key.includes("/transaction-deletions") || key.startsWith("/tenants/")), undefined, { revalidate: true });
}

export function DeleteTransactionButton({ outletId, invoice, onChanged }: { outletId: string; invoice: string; onChanged?: () => void }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const refresh = useRefreshTransactions();
  const key = open ? `/tenants/${encodeURIComponent(outletId)}/transactions/deletion-preview?invoice=${encodeURIComponent(invoice)}` : null;
  const { data, error, isLoading, mutate } = useSWR<Envelope<Preview>>(key, apiFetcher, { revalidateOnFocus: false });
  const preview = data?.data;
  async function remove() {
    if (!preview || busy || confirmation !== invoice || reason.trim().length < 5) return;
    setBusy(true);
    try {
      await api.post(`/tenants/${encodeURIComponent(outletId)}/transactions/delete`, { invoice, confirmation, reason: reason.trim(), fingerprint: preview.fingerprint });
      toast.success("Transaksi dihapus. Backup dan alasan tersimpan.");
      setOpen(false); void refresh(); onChanged?.();
    } catch (error) { toast.error(errorMessage(error)); void mutate(); }
    finally { setBusy(false); }
  }
  return <PermissionGate module="fixer" action="delete_transaction">
    <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50 hover:text-red-700" aria-label={`Hapus transaksi ${invoice}`} onClick={() => { setReason(""); setConfirmation(""); setOpen(true); }}><Trash2 className="h-3.5 w-3.5" />Hapus</Button>
    <Dialog open={open} onOpenChange={value => { if (!busy) setOpen(value); }}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl" showCloseButton={!busy}>
        <DialogHeader><DialogTitle>Hapus transaksi nasabah</DialogTitle><DialogDescription>Periksa invoice dan dampaknya sebelum menghapus. Backup disimpan untuk pemulihan.</DialogDescription></DialogHeader>
        {isLoading && <p className="py-6 text-sm text-slate-500">Memeriksa transaksi dan pembayaran…</p>}
        {(error || (data && !data.status)) && <div className="space-y-3"><p role="alert" className="text-sm text-red-600">{error ? errorMessage(error) : data?.message}</p><Button variant="outline" onClick={() => void mutate()}>Muat ulang pratinjau</Button></div>}
        {preview && !error && <>
          <div className="rounded-xl border bg-slate-50 p-4 text-sm space-y-2">
            <p className="break-all font-mono font-semibold">{preview.invoice}</p>
            <p>{preview.outlet_name} · {preview.outlet_id}</p><p>Pelanggan: <strong>{preview.customer_name || "—"}</strong></p>
            <div className="flex flex-wrap gap-x-6 gap-y-2"><p>{preview.order_status} · {preview.payment_status}</p><p>Total <strong>{rupiah(preview.total)}</strong></p><p>Pembayaran tercatat <strong>{rupiah(preview.paid)}</strong></p></div>
            <p className="text-xs text-slate-500">{preview.detail_count} layanan · {preview.payment_count} catatan pembayaran</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Transaksi, layanan, pembayaran, dan log pesanan akan dikeluarkan dari data aktif serta laporan. Tindakan ini tidak mengembalikan uang pelanggan atau koin outlet.</div>
          {preview.blockers.length > 0 ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"><p className="font-semibold">Penghapusan belum dapat dilakukan</p><ul className="mt-2 list-disc pl-5">{preview.blockers.map(text => <li key={text}>{text}</li>)}</ul><p className="mt-2">Perlu rekonsiliasi relasi tersebut terlebih dahulu.</p></div> : <>
            <label className="space-y-2 text-sm font-medium">Alasan penghapusan<Textarea value={reason} onChange={event => setReason(event.target.value)} maxLength={500} disabled={busy} placeholder="Wajib, minimal 5 karakter. Contoh: permintaan owner karena transaksi duplikat. Disimpan untuk audit internal." /></label>
            <label className="space-y-2 text-sm font-medium">Ketik ulang invoice untuk konfirmasi<Input value={confirmation} onChange={event => setConfirmation(event.target.value)} disabled={busy} placeholder={invoice} autoComplete="off" /></label>
          </>}
          <div className="flex justify-end gap-2"><Button variant="outline" disabled={busy} onClick={() => setOpen(false)}>Batal</Button><Button variant="destructive" disabled={busy || preview.blockers.length > 0 || confirmation !== invoice || reason.trim().length < 5} onClick={() => void remove()}>{busy ? "Menghapus…" : "Hapus transaksi"}</Button></div>
        </>}
      </DialogContent>
    </Dialog>
  </PermissionGate>;
}

export function TransactionDeletionHistory({ outletId = "" }: { outletId?: string }) {
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState<Deletion | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const refresh = useRefreshTransactions();
  const { data, error, isLoading, mutate } = useSWR<Envelope<Deletion[]>>(expanded ? `/fixer/transaction-deletions${outletId ? `?outlet=${encodeURIComponent(outletId)}` : ""}` : null, apiFetcher);
  async function restore() {
    if (!selected || busy || reason.trim().length < 5) return;
    setBusy(true);
    try {
      await api.post(`/tenants/${encodeURIComponent(selected.outlet_id)}/transaction-deletions/${selected.id}/restore`, { reason: reason.trim() });
      toast.success("Transaksi dan pembayaran dipulihkan."); setSelected(null); void refresh();
    } catch (error) { toast.error(errorMessage(error)); }
    finally { setBusy(false); }
  }
  return <PermissionGate module="fixer" action="read"><section className="rounded-xl border bg-white p-4 space-y-4">
    <button type="button" onClick={() => setExpanded(value => !value)} aria-expanded={expanded} className="flex w-full items-center justify-between gap-3 text-left text-sm font-semibold"><span className="flex items-center gap-2"><History className="h-4 w-4" />Riwayat penghapusan transaksi</span><span className="text-xs text-slate-500">{expanded ? "Tutup" : "Lihat"}</span></button>
    {expanded && <><p className="text-xs text-slate-500">50 penghapusan terbaru di outlet ini. Alasan dan identitas admin disimpan untuk audit.</p>
      {isLoading && <p className="text-sm text-slate-500">Memuat riwayat…</p>}
      {error && <div role="alert" className="flex items-center gap-2 text-sm text-red-600"><AlertCircle className="h-4 w-4" />Gagal memuat riwayat.<Button variant="outline" size="sm" onClick={() => void mutate()}>Coba lagi</Button></div>}
      {data?.data?.length === 0 && <p className="text-sm text-slate-500">Belum ada penghapusan melalui admin panel.</p>}
      {data?.data?.map(row => <article key={row.id} className="rounded-lg border p-4 text-sm space-y-2"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="break-all font-mono font-semibold">{row.invoice}</p><p>{row.customer_name} · {rupiah(row.total)}</p></div>{!row.restored_at && <PermissionGate module="fixer" action="restore_transaction"><Button variant="outline" size="sm" onClick={() => { setSelected(row); setReason(""); }}><RotateCcw className="h-3.5 w-3.5" />Pulihkan</Button></PermissionGate>}</div><p className="whitespace-pre-wrap break-words">Alasan: {row.reason}</p><p className="text-xs text-slate-500">Dihapus {date(row.created_at)} oleh {row.deleted_by}</p>{row.restored_at && <div className="rounded bg-emerald-50 p-2 text-xs text-emerald-800">Dipulihkan {date(row.restored_at)} oleh {row.restored_by}<p className="mt-1 whitespace-pre-wrap break-words">{row.restore_reason}</p></div>}</article>)}
    </>}
    <Dialog open={!!selected} onOpenChange={open => { if (!busy && !open) setSelected(null); }}><DialogContent className="max-h-[90dvh] overflow-y-auto" showCloseButton={!busy}><DialogHeader><DialogTitle>Pulihkan transaksi</DialogTitle><DialogDescription className="break-all">{selected?.invoice}</DialogDescription></DialogHeader><p className="text-sm text-slate-600">Pesanan, status, layanan, dan catatan pembayaran akan dikembalikan dari backup. Nominal kembali masuk ke laporan; tidak ada penagihan ulang kepada pelanggan.</p><label className="space-y-2 text-sm font-medium">Alasan pemulihan<Textarea value={reason} onChange={event => setReason(event.target.value)} maxLength={500} disabled={busy} placeholder="Wajib, minimal 5 karakter untuk audit internal." /></label><div className="flex justify-end gap-2"><Button variant="outline" disabled={busy} onClick={() => setSelected(null)}>Batal</Button><Button disabled={busy || reason.trim().length < 5} onClick={() => void restore()}>{busy ? "Memulihkan…" : "Pulihkan transaksi"}</Button></div></DialogContent></Dialog>
  </section></PermissionGate>;
}
