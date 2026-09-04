"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RefreshCw,
  WalletCards,
  ReceiptText,
  Banknote,
  HandCoins,
  ChevronDown,
  Info,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  nobuFinanceService,
  NobuPayable,
  NobuReconciliation,
  NobuSettlement,
} from "@/services/nobu-finance.service";

const money = (v: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(v || 0);

const dateTime = (s?: string | null) =>
  s
    ? new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(s))
    : "-";

const PILL: Record<string, string> = {
  OPEN: "bg-amber-100 text-amber-700",
  RESERVED: "bg-blue-100 text-blue-700",
  SETTLED: "bg-emerald-100 text-emerald-700",
  PENDING: "bg-amber-100 text-amber-700",
  PAID: "bg-emerald-100 text-emerald-700",
  FAILED: "bg-red-100 text-red-700",
};

function Pill({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
        PILL[status] ?? "bg-slate-100 text-slate-600"
      }`}
    >
      {status}
    </span>
  );
}

export default function NobuFinancePage() {
  const [summary, setSummary] = useState<NobuReconciliation | null>(null);
  const [payables, setPayables] = useState<NobuPayable[]>([]);
  const [settlements, setSettlements] = useState<NobuSettlement[]>([]);

  const [payableStatus, setPayableStatus] = useState("OPEN");
  const [settlementStatus, setSettlementStatus] = useState("PENDING");
  const [selected, setSelected] = useState<string[]>([]);
  const [proofByBatch, setProofByBatch] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const [loadingPayables, setLoadingPayables] = useState(true);
  const [loadingSettlements, setLoadingSettlements] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const loadSummary = useCallback(async () => {
    try {
      const res = await nobuFinanceService.getReconciliation();
      setSummary(res.data.data);
    } catch {
      toast.error("Gagal mengambil ringkasan rekonsiliasi");
    }
  }, []);

  const loadPayables = useCallback(async () => {
    setLoadingPayables(true);
    try {
      const res = await nobuFinanceService.getPayables(payableStatus);
      setPayables(res.data.data || []);
      setSelected([]);
    } catch {
      toast.error("Gagal mengambil data payable owner");
    } finally {
      setLoadingPayables(false);
    }
  }, [payableStatus]);

  const loadSettlements = useCallback(async () => {
    setLoadingSettlements(true);
    try {
      const res = await nobuFinanceService.getSettlements(
        settlementStatus === "ALL" ? "" : settlementStatus,
      );
      setSettlements(res.data.data || []);
    } catch {
      toast.error("Gagal mengambil data settlement");
    } finally {
      setLoadingSettlements(false);
    }
  }, [settlementStatus]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);
  useEffect(() => {
    void loadPayables();
  }, [loadPayables]);
  useEffect(() => {
    void loadSettlements();
  }, [loadSettlements]);

  const refreshAll = () => {
    void loadSummary();
    void loadPayables();
    void loadSettlements();
  };

  // Kelompokkan payable per outlet dengan subtotal Hak Owner.
  const groups = useMemo(() => {
    const map = new Map<
      string,
      { outletId: string; outletName: string; rows: NobuPayable[]; subtotal: number }
    >();
    for (const p of payables) {
      const g =
        map.get(p.outlet_id) ??
        {
          outletId: p.outlet_id,
          outletName: p.outlet_name || p.outlet_id,
          rows: [],
          subtotal: 0,
        };
      g.rows.push(p);
      g.subtotal += p.net_amount;
      map.set(p.outlet_id, g);
    }
    return Array.from(map.values());
  }, [payables]);

  const selectable = payableStatus === "OPEN";
  const selectedTotal = useMemo(
    () =>
      payables
        .filter((p) => selected.includes(p.id))
        .reduce((sum, p) => sum + p.net_amount, 0),
    [payables, selected],
  );

  const toggleOne = (id: string) =>
    setSelected((old) =>
      old.includes(id) ? old.filter((x) => x !== id) : [...old, id],
    );

  const toggleGroup = (rows: NobuPayable[]) => {
    const ids = rows.map((r) => r.id);
    const allSelected = ids.every((id) => selected.includes(id));
    setSelected((old) =>
      allSelected
        ? old.filter((id) => !ids.includes(id))
        : Array.from(new Set([...old, ...ids])),
    );
  };

  const createSettlement = async () => {
    if (!selected.length) return;
    setBusy(true);
    try {
      await nobuFinanceService.createSettlement(
        selected,
        "Settlement manual QRIS Nobu",
      );
      toast.success("Batch settlement dibuat. Lihat tab Settlement.");
      setSelected([]);
      await Promise.all([loadPayables(), loadSettlements(), loadSummary()]);
    } catch {
      toast.error("Gagal membuat batch settlement");
    } finally {
      setBusy(false);
    }
  };

  const confirmSettlement = async (
    batch: NobuSettlement,
    status: "PAID" | "FAILED",
  ) => {
    const proof = proofByBatch[batch.id] || "";
    if (status === "PAID" && !proof) {
      return toast.error("Isi URL bukti transfer dulu");
    }
    setBusy(true);
    try {
      await nobuFinanceService.updateSettlement(batch.id, {
        status,
        proof_url: proof,
        note: status === "FAILED" ? "Dibatalkan admin" : "Transfer selesai",
      });
      toast.success(
        status === "PAID"
          ? "Settlement ditandai selesai"
          : "Settlement dibatalkan, payable kembali OPEN",
      );
      await Promise.all([loadSettlements(), loadPayables(), loadSummary()]);
    } catch {
      toast.error("Gagal memperbarui settlement");
    } finally {
      setBusy(false);
    }
  };

  const kpis = [
    {
      label: "Transaksi Lunas",
      value: summary?.paid ?? 0,
      hint: "Jumlah pembayaran QRIS yang sudah berhasil.",
      Icon: ReceiptText,
    },
    {
      label: "Dana Diterima",
      value: money(summary?.received_funds ?? 0),
      hint: "Total dana bersih (setelah MDR) yang masuk ke rekening Nobu.",
      Icon: Banknote,
    },
    {
      label: "Payable Belum Dibayar",
      value: summary?.open_payables ?? 0,
      hint: "Jumlah tagihan ke owner yang masih OPEN (belum ditransfer).",
      Icon: WalletCards,
    },
    {
      label: "Total Hak Owner",
      value: money(summary?.open_payable_amount ?? 0),
      hint: "Total rupiah yang masih harus ditransfer ke owner outlet.",
      Icon: HandCoins,
    },
  ];

  return (
    <main className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-orange-600">
            Finance Control
          </p>
          <h1 className="text-2xl font-bold text-slate-900">
            Rekonsiliasi QRIS Nobu
          </h1>
          <p className="text-sm text-slate-500">
            Pantau dana masuk, hitung hak owner, dan kelola pembayaran (settlement) ke owner.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowHelp((v) => !v)}>
            <Info className="mr-2 h-4 w-4" />
            Cara Kerja
          </Button>
          <Button variant="outline" onClick={refreshAll}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Explainer */}
      {showHelp && (
        <Card className="border-orange-100 bg-orange-50/50 p-5 text-sm text-slate-700">
          <div className="mb-3 flex flex-wrap items-center gap-2 font-semibold text-slate-800">
            <span className="rounded bg-white px-2 py-1">Pelanggan bayar (Gross)</span>
            <ArrowRight className="h-4 w-4 text-orange-500" />
            <span className="rounded bg-white px-2 py-1">Nobu potong MDR</span>
            <ArrowRight className="h-4 w-4 text-orange-500" />
            <span className="rounded bg-white px-2 py-1">Dana bersih masuk (Net)</span>
            <ArrowRight className="h-4 w-4 text-orange-500" />
            <span className="rounded bg-white px-2 py-1">Potong fee platform</span>
            <ArrowRight className="h-4 w-4 text-orange-500" />
            <span className="rounded bg-white px-2 py-1">Hak Owner → transfer manual</span>
          </div>
          <ul className="grid gap-1.5 md:grid-cols-2">
            <li><b>Gross</b>: nominal yang dibayar pelanggan.</li>
            <li><b>MDR</b>: potongan bank/Nobu dari gross.</li>
            <li><b>Fee platform</b>: bagian AyoCuci dari transaksi.</li>
            <li><b>Hak Owner</b>: sisa yang menjadi hak owner outlet (Net − fee platform).</li>
          </ul>
          <div className="mt-3 border-t border-orange-100 pt-3">
            <p className="mb-1 font-semibold text-slate-800">Alur settlement:</p>
            <div className="flex flex-wrap items-center gap-2">
              <Pill status="OPEN" /> <span className="text-slate-500">baru, belum diproses</span>
              <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
              <Pill status="RESERVED" /> <span className="text-slate-500">masuk batch, menunggu transfer</span>
              <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
              <Pill status="SETTLED" /> <span className="text-slate-500">sudah ditransfer & dikonfirmasi</span>
            </div>
          </div>
        </Card>
      )}

      {/* KPI */}
      <div className="grid gap-4 md:grid-cols-4">
        {kpis.map(({ label, value, hint, Icon }) => (
          <Card key={label} className="p-5">
            <Icon className="mb-3 h-5 w-5 text-orange-600" />
            <p className="text-xs font-medium text-slate-500">{label}</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{value}</p>
            <p className="mt-1 text-[11px] leading-tight text-slate-400">{hint}</p>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="payables" className="w-full">
        <TabsList>
          <TabsTrigger value="payables">Hak Owner</TabsTrigger>
          <TabsTrigger value="settlements">Settlement</TabsTrigger>
        </TabsList>

        {/* ---------------- PAYABLES ---------------- */}
        <TabsContent value="payables" className="mt-4">
          <Card className="p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-slate-900">Tagihan ke Owner</h2>
                <p className="text-xs text-slate-500">
                  Centang transaksi (per outlet), lalu buat batch untuk dibayar ke owner.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Select value={payableStatus} onValueChange={setPayableStatus}>
                  <SelectTrigger className="h-9 w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPEN">OPEN (belum dibayar)</SelectItem>
                    <SelectItem value="RESERVED">RESERVED (dalam batch)</SelectItem>
                    <SelectItem value="SETTLED">SETTLED (selesai)</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => void createSettlement()}
                  disabled={!selectable || !selected.length || busy}
                >
                  Buat Settlement ({selected.length})
                </Button>
              </div>
            </div>

            {selected.length > 0 && (
              <div className="mb-3 rounded-lg bg-orange-50 px-4 py-2 text-sm text-orange-800">
                {selected.length} transaksi dipilih · total{" "}
                <b>{money(selectedTotal)}</b>
              </div>
            )}

            {loadingPayables ? (
              <p className="p-6 text-center text-sm text-slate-500">Memuat...</p>
            ) : groups.length === 0 ? (
              <p className="p-8 text-center text-sm text-slate-500">
                Tidak ada payable dengan status {payableStatus}.
              </p>
            ) : (
              <div className="space-y-5">
                {groups.map((g) => {
                  const ids = g.rows.map((r) => r.id);
                  const allSel = ids.every((id) => selected.includes(id));
                  return (
                    <div
                      key={g.outletId}
                      className="overflow-hidden rounded-xl border border-slate-100"
                    >
                      <div className="flex items-center justify-between bg-slate-50 px-4 py-2.5">
                        <div className="flex items-center gap-3">
                          {selectable && (
                            <Checkbox
                              checked={allSel}
                              onCheckedChange={() => toggleGroup(g.rows)}
                            />
                          )}
                          <div>
                            <p className="text-sm font-bold text-slate-800">
                              {g.outletName}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {g.outletId} · {g.rows.length} transaksi
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] text-slate-400">Subtotal Hak Owner</p>
                          <p className="text-sm font-bold text-slate-900">
                            {money(g.subtotal)}
                          </p>
                        </div>
                      </div>
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b text-[11px] uppercase text-slate-400">
                            {selectable && <th className="w-10 p-3"></th>}
                            <th className="p-3">Order</th>
                            <th className="p-3 text-right">Gross</th>
                            <th className="p-3 text-right">MDR</th>
                            <th className="p-3 text-right">Fee Platform</th>
                            <th className="p-3 text-right">Hak Owner</th>
                            <th className="p-3">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {g.rows.map((p) => (
                            <tr key={p.id} className="border-b last:border-0">
                              {selectable && (
                                <td className="p-3">
                                  <Checkbox
                                    checked={selected.includes(p.id)}
                                    onCheckedChange={() => toggleOne(p.id)}
                                  />
                                </td>
                              )}
                              <td className="p-3 font-medium text-slate-700">
                                {p.order_id}
                              </td>
                              <td className="p-3 text-right text-slate-500">
                                {money(p.gross_amount)}
                              </td>
                              <td className="p-3 text-right text-slate-500">
                                {money(p.mdr_amount)}
                              </td>
                              <td className="p-3 text-right text-slate-500">
                                {money(p.platform_fee)}
                              </td>
                              <td className="p-3 text-right font-semibold text-slate-900">
                                {money(p.net_amount)}
                              </td>
                              <td className="p-3">
                                <Pill status={p.status} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ---------------- SETTLEMENTS ---------------- */}
        <TabsContent value="settlements" className="mt-4">
          <Card className="p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-slate-900">Batch Settlement</h2>
                <p className="text-xs text-slate-500">
                  Konfirmasi setelah dana benar-benar ditransfer ke owner.
                </p>
              </div>
              <Select value={settlementStatus} onValueChange={setSettlementStatus}>
                <SelectTrigger className="h-9 w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">PENDING (perlu transfer)</SelectItem>
                  <SelectItem value="PAID">PAID (selesai)</SelectItem>
                  <SelectItem value="FAILED">FAILED (dibatalkan)</SelectItem>
                  <SelectItem value="ALL">Semua</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loadingSettlements ? (
              <p className="p-6 text-center text-sm text-slate-500">Memuat...</p>
            ) : settlements.length === 0 ? (
              <p className="p-8 text-center text-sm text-slate-500">
                Belum ada batch settlement dengan status ini.
              </p>
            ) : (
              <div className="space-y-3">
                {settlements.map((b) => {
                  const isOpen = expanded[b.id];
                  return (
                    <div
                      key={b.id}
                      className="rounded-xl border border-slate-100"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() =>
                              setExpanded((old) => ({ ...old, [b.id]: !old[b.id] }))
                            }
                            className="rounded-md p-1 hover:bg-slate-100"
                          >
                            <ChevronDown
                              className={`h-4 w-4 text-slate-400 transition-transform ${
                                isOpen ? "rotate-180" : ""
                              }`}
                            />
                          </button>
                          <div>
                            <p className="font-mono text-sm font-bold text-slate-800">
                              {b.reference}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {dateTime(b.created_at)} · {b.item_count} transaksi
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-[11px] text-slate-400">Total</p>
                            <p className="text-sm font-bold text-slate-900">
                              {money(b.total_amount)}
                            </p>
                          </div>
                          <Pill status={b.status} />
                        </div>
                      </div>

                      {isOpen && (
                        <div className="border-t border-slate-100 px-4 py-3">
                          <table className="w-full text-left text-sm">
                            <thead>
                              <tr className="text-[11px] uppercase text-slate-400">
                                <th className="py-1">Order</th>
                                <th className="py-1">Outlet</th>
                                <th className="py-1 text-right">Nominal</th>
                              </tr>
                            </thead>
                            <tbody>
                              {b.items.map((it) => (
                                <tr key={it.payable_id} className="border-t">
                                  <td className="py-2 font-medium text-slate-700">
                                    {it.order_id}
                                  </td>
                                  <td className="py-2 text-slate-500">
                                    {it.outlet_name || it.outlet_id}
                                  </td>
                                  <td className="py-2 text-right font-semibold text-slate-900">
                                    {money(it.amount)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {b.proof_url && (
                            <p className="mt-2 text-xs text-slate-500">
                              Bukti:{" "}
                              <a
                                href={b.proof_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-orange-600 underline"
                              >
                                {b.proof_url}
                              </a>
                            </p>
                          )}
                        </div>
                      )}

                      {b.status === "PENDING" && (
                        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 bg-slate-50/60 p-3">
                          <Input
                            value={proofByBatch[b.id] || ""}
                            onChange={(e) =>
                              setProofByBatch((old) => ({
                                ...old,
                                [b.id]: e.target.value,
                              }))
                            }
                            placeholder="URL bukti transfer ke owner"
                            className="h-9 flex-1"
                          />
                          <Button
                            size="sm"
                            disabled={busy || !(proofByBatch[b.id] || "")}
                            onClick={() => void confirmSettlement(b, "PAID")}
                          >
                            Tandai Selesai
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() => void confirmSettlement(b, "FAILED")}
                          >
                            Batalkan
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
