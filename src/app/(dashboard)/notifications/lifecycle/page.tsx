"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Clock3, Loader2, RefreshCw, Send, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Rule = { key: string; name: string; description: string; target: string; cooldown: string };
type Stat = { RuleKey?: string; rule_key?: string; Sent?: number; sent?: number; Failed?: number; failed?: number };
type Run = { id: number; rule_key: string; outlet_id: string; source_event_id?: string; status: string; reason?: string; created_at: string };

export default function LifecyclePage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [stats, setStats] = useState<Stat[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const response = await api.get("/notifications/lifecycle");
      setRules(response.data?.data?.rules || []);
      setStats(response.data?.data?.stats || []);
      setRuns(response.data?.data?.recent_runs || []);
    } catch {
      toast.error("Gagal memuat lifecycle automation");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);
  const statMap = useMemo(() => new Map(stats.map((item) => [item.rule_key || item.RuleKey, item])), [stats]);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Button asChild variant="ghost" className="mb-3 rounded-xl px-0 font-bold text-slate-500"><Link href="/notifications"><ArrowLeft className="mr-2 h-4 w-4" />Kembali</Link></Button>
          <h2 className="text-3xl font-black tracking-tight text-slate-900">Lifecycle Automation</h2>
          <p className="mt-1 text-sm font-medium text-slate-400">Pesan otomatis berdasarkan tahap penggunaan dan perilaku owner outlet.</p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rules.map((rule) => {
          const stat = statMap.get(rule.key);
          return <Card key={rule.key} className="rounded-2xl p-5">
            <div className="flex items-start justify-between gap-3"><div><p className="font-black text-slate-900">{rule.name}</p><p className="mt-1 text-xs font-medium leading-relaxed text-slate-500">{rule.description}</p></div><Badge className="bg-emerald-50 text-emerald-700">Aktif</Badge></div>
            <div className="mt-4 flex gap-2 text-xs"><Badge variant="outline">{rule.target}</Badge><Badge variant="outline"><Clock3 className="mr-1 h-3 w-3" />{rule.cooldown}</Badge></div>
            <div className="mt-4 grid grid-cols-2 gap-2"><div className="rounded-xl bg-emerald-50 p-3"><p className="text-xs text-emerald-700">Terkirim 30 hari</p><p className="text-xl font-black text-emerald-800">{stat?.sent ?? stat?.Sent ?? 0}</p></div><div className="rounded-xl bg-red-50 p-3"><p className="text-xs text-red-700">Gagal</p><p className="text-xl font-black text-red-800">{stat?.failed ?? stat?.Failed ?? 0}</p></div></div>
          </Card>;
        })}
      </div>

      <Card className="overflow-hidden rounded-2xl">
        <div className="border-b p-5"><h3 className="font-black text-slate-900">Eksekusi Terbaru</h3></div>
        {loading ? <div className="flex justify-center p-12"><Loader2 className="h-6 w-6 animate-spin" /></div> : runs.length === 0 ? <div className="p-12 text-center text-sm text-slate-400">Belum ada automation yang dieksekusi.</div> : <div className="divide-y">{runs.map((run) => <div key={run.id} className="flex items-center justify-between gap-4 p-4 text-sm"><div><p className="font-bold text-slate-800">{run.rule_key}</p><p className="text-xs text-slate-400">Outlet {run.outlet_id} · {new Date(run.created_at).toLocaleString("id-ID")}</p></div><Badge className={run.status === "sent" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}>{run.status === "sent" ? <Send className="mr-1 h-3 w-3" /> : <TriangleAlert className="mr-1 h-3 w-3" />}{run.status}</Badge></div>)}</div>}
      </Card>
    </div>
  );
}
