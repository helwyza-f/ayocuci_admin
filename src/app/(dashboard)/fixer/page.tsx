"use client";

import { useState } from "react";
import useSWR from "swr";
import axios from "axios";
import { Wrench, Search, Receipt, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PermissionGate from "@/components/shared/permission-gate";
import { apiFetcher } from "@/lib/fetcher";
import { DeleteTransactionButton, TransactionDeletionHistory } from "@/components/modules/transaction-deletion";

type Preview = {
  invoice: string; outlet_id: string; outlet_name: string; customer_name: string;
  total: number; paid: number; order_status: string; payment_status: string; blockers: string[];
};
const rupiah = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);

export default function TransactionFixerPage() {
  return <PermissionGate module="fixer" action="read"><TransactionFixerContent /></PermissionGate>;
}

function TransactionFixerContent() {
  const [input, setInput] = useState("");
  const [invoice, setInvoice] = useState("");
  const [invalid, setInvalid] = useState(false);
  const outlet = /^TRX\/([^/]+)\//.exec(invoice)?.[1] || "";
  const key = outlet ? `/tenants/${encodeURIComponent(outlet)}/transactions/deletion-preview?invoice=${encodeURIComponent(invoice)}` : null;
  const { data, error, isLoading, mutate } = useSWR<{ status: boolean; message: string; data: Preview }>(key, apiFetcher, { revalidateOnFocus: false });
  const preview = data?.data;
  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900"><Wrench className="h-5 w-5 text-primary" />Operational Fixer</h1><p className="mt-1 text-sm text-slate-500">Koreksi transaksi nasabah dengan backup dan riwayat tindakan admin.</p></div>
      <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">Akses terbatas</Badge>
    </div>
    <Card className="gap-4 p-5 sm:p-6 shadow-none">
      <div className="flex items-start gap-3"><div className="rounded-xl bg-orange-50 p-3 text-primary"><Receipt className="h-5 w-5" /></div><div><h2 className="font-bold text-slate-900">Hapus transaksi nasabah</h2><p className="mt-1 text-sm text-slate-500">Cari menggunakan nomor invoice lengkap dari aplikasi. Periksa outlet dan pelanggan sebelum melanjutkan.</p></div></div>
      <form className="flex flex-col gap-3 sm:flex-row" onSubmit={event => { event.preventDefault(); const value = input.trim(); if (!/^TRX\/[^/]+\/[^/]+$/.test(value)) { setInvalid(true); return; } setInvalid(false); setInvoice(value); if (value === invoice) void mutate(); }}>
        <Input aria-label="Nomor invoice lengkap" value={input} onChange={event => setInput(event.target.value)} placeholder="Contoh: TRX/565.001/202611180004" className="min-w-0 flex-1 font-mono text-sm" maxLength={60} autoComplete="off" />
        <Button type="submit" disabled={isLoading || !input.trim()}><Search className="h-4 w-4" />{isLoading ? "Memeriksa…" : "Cari transaksi"}</Button>
      </form>
      {invalid && <p role="alert" className="text-sm text-red-600">Masukkan invoice lengkap dengan format TRX/kode-outlet/nomor.</p>}
      {error && <p role="alert" className="text-sm text-red-600">{axios.isAxiosError(error) ? error.response?.data?.message || "Transaksi gagal dimuat. Coba lagi." : "Transaksi gagal dimuat."}</p>}
      {preview && !error && <div className="rounded-xl border p-4 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="break-all font-mono text-sm font-bold">{preview.invoice}</p><p className="mt-1 text-sm text-slate-500">{preview.outlet_name} · Outlet {preview.outlet_id}</p></div><Badge variant="outline">{preview.order_status} · {preview.payment_status}</Badge></div>
        <dl className="grid gap-4 sm:grid-cols-3"><div><dt className="text-xs text-slate-500">Pelanggan</dt><dd className="mt-1 break-words font-semibold">{preview.customer_name || "—"}</dd></div><div><dt className="text-xs text-slate-500">Total tagihan</dt><dd className="mt-1 font-semibold">{rupiah(preview.total)}</dd></div><div><dt className="text-xs text-slate-500">Pembayaran tercatat</dt><dd className="mt-1 font-semibold">{rupiah(preview.paid)}</dd></div></dl>
        {preview.blockers.length > 0 && <p className="text-sm text-amber-800">Ada relasi yang perlu direkonsiliasi. Lihat pemeriksaan untuk rinciannya.</p>}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3"><p className="flex items-center gap-2 text-xs text-slate-500"><ShieldCheck className="h-4 w-4 shrink-0" />Backup dan alasan tersimpan sebelum penghapusan.</p><DeleteTransactionButton key={invoice} outletId={outlet} invoice={invoice} onChanged={() => { setInvoice(""); setInput(""); }} /></div>
      </div>}
    </Card>
    <TransactionDeletionHistory />
  </div>;
}
