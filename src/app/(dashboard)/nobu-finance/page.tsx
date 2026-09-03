"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, WalletCards, ReceiptText, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { nobuFinanceService, NobuPayable, NobuReconciliation } from "@/services/nobu-finance.service";

const money = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value || 0);

export default function NobuFinancePage() {
  const [summary, setSummary] = useState<NobuReconciliation | null>(null);
  const [payables, setPayables] = useState<NobuPayable[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [proof, setProof] = useState("");
  const [batchId, setBatchId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [summaryRes, payablesRes] = await Promise.all([
        nobuFinanceService.getReconciliation(), nobuFinanceService.getPayables(),
      ]);
      setSummary(summaryRes.data.data); setPayables(payablesRes.data.data || []);
    } catch { toast.error("Gagal mengambil data keuangan QRIS"); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);

  const createSettlement = async () => {
    if (!selected.length) return toast.error("Pilih payable terlebih dahulu");
    try { const response = await nobuFinanceService.createSettlement(selected, "Settlement manual QRIS Nobu"); setBatchId(response.data?.data?.id || null); toast.success("Settlement batch dibuat"); setSelected([]); await load(); }
    catch { toast.error("Gagal membuat settlement batch"); }
  };

  const settle = async (id: string) => {
    try { await nobuFinanceService.updateSettlement(id, { status: "PAID", proof_url: proof }); toast.success("Settlement ditandai selesai"); setProof(""); await load(); }
    catch { toast.error("Gagal memperbarui settlement"); }
  };

  const kpis: { label: string; value: string | number; Icon: React.ElementType }[] = [
    { label: "Payment PAID", value: summary?.paid ?? 0, Icon: ReceiptText },
    { label: "Dana Diterima", value: money(summary?.received_funds ?? 0), Icon: WalletCards },
    { label: "Payable OPEN", value: summary?.open_payables ?? 0, Icon: ShieldCheck },
    { label: "Hak Owner", value: money(summary?.open_payable_amount ?? 0), Icon: WalletCards },
  ];
  return <main className="space-y-6 p-6">
    <div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-orange-600">Finance Control</p><h1 className="text-2xl font-bold text-slate-900">QRIS Nobu</h1><p className="text-sm text-slate-500">Payment, rekonsiliasi, payable owner, dan settlement manual.</p></div><Button variant="outline" onClick={() => void load()}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button></div>
    <div className="grid gap-4 md:grid-cols-4">
      {kpis.map(({ label, value, Icon }) => <Card key={label} className="p-5"><Icon className="mb-3 h-5 w-5 text-orange-600" /><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-xl font-bold">{value}</p></Card>)}
    </div>
    <Card className="p-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-bold">Owner Payables</h2><p className="text-xs text-slate-500">Pilih payable untuk membuat batch settlement.</p></div><Button onClick={() => void createSettlement()} disabled={!selected.length}>Buat Settlement ({selected.length})</Button></div>
      <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b text-xs text-slate-500"><th className="p-3"></th><th className="p-3">Order</th><th className="p-3">Outlet</th><th className="p-3">Gross</th><th className="p-3">MDR</th><th className="p-3">Hak Owner</th><th className="p-3">Status</th></tr></thead><tbody>{loading ? <tr><td colSpan={7} className="p-6 text-center">Memuat...</td></tr> : payables.map((p) => <tr key={p.id} className="border-b"><td className="p-3"><input type="checkbox" checked={selected.includes(p.id)} onChange={() => setSelected((old) => old.includes(p.id) ? old.filter((id) => id !== p.id) : [...old, p.id])} /></td><td className="p-3 font-medium">{p.order_id}</td><td className="p-3">{p.outlet_id}</td><td className="p-3">{money(p.gross_amount)}</td><td className="p-3">{money(p.mdr_amount)}</td><td className="p-3 font-semibold">{money(p.net_amount)}</td><td className="p-3"><Badge>{p.status}</Badge></td></tr>)}</tbody></table></div>
    </Card>
    <Card className="p-5"><h2 className="mb-2 font-bold">Konfirmasi Settlement</h2><p className="mb-3 text-xs text-slate-500">Masukkan URL bukti transfer setelah dana benar-benar dikirim ke owner.</p><div className="flex gap-3"><Input value={proof} onChange={(e) => setProof(e.target.value)} placeholder="URL bukti transfer" /><Button variant="outline" disabled={!proof || !batchId} onClick={() => void settle(batchId!)}>Tandai PAID</Button></div>{batchId && <p className="mt-2 text-xs text-slate-500">Batch aktif: {batchId}</p>}</Card>
  </main>;
}
