"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { ArrowUp, CheckCircle2, Lightbulb, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api-client";
import { apiFetcher } from "@/lib/fetcher";
import type { ApiResponse } from "@/types/api";
import { resolveUploadUrl } from "@/lib/upload-url";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type FeatureStatus = "SUBMITTED" | "UNDER_REVIEW" | "IN_PROGRESS" | "COMPLETED" | "NOT_PLANNED";

type FeatureRequest = {
  id: string;
  outlet_id: string;
  creator_name: string;
  title: string;
  description: string;
  status: FeatureStatus;
  admin_note: string;
  vote_count: number;
  created_at: string;
  status_updated_at?: string;
  attachments: { id: string; file_url: string }[];
};

const statuses: Record<FeatureStatus, { label: string; badge: string }> = {
  SUBMITTED: { label: "Diajukan", badge: "bg-orange-50 text-orange-700 border-orange-200" },
  UNDER_REVIEW: { label: "Dipertimbangkan", badge: "bg-amber-50 text-amber-700 border-amber-200" },
  IN_PROGRESS: { label: "Dalam Pengerjaan", badge: "bg-blue-50 text-blue-700 border-blue-200" },
  COMPLETED: { label: "Selesai", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  NOT_PLANNED: { label: "Belum Dapat Dikerjakan", badge: "bg-slate-100 text-slate-600 border-slate-200" },
};

export default function FeatureRequestsPage() {
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<FeatureRequest | null>(null);
  const [nextStatus, setNextStatus] = useState<FeatureStatus>("SUBMITTED");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const { data, isLoading, mutate } = useSWR<ApiResponse<FeatureRequest[]>>("/feature-requests?sort=popular", apiFetcher, { refreshInterval: 30_000 });
  const items = data?.data ?? [];

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesStatus = filter === "ALL" || item.status === filter;
      const matchesSearch = !query || item.title.toLowerCase().includes(query) || item.description.toLowerCase().includes(query) || item.creator_name.toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [filter, items, search]);

  const counts = useMemo(() => Object.keys(statuses).reduce<Record<string, number>>((result, status) => {
    result[status] = items.filter((item) => item.status === status).length;
    return result;
  }, {}), [items]);

  function openStatus(item: FeatureRequest) {
    setSelected(item);
    setNextStatus(item.status);
    setNote(item.admin_note || "");
  }

  async function saveStatus() {
    if (!selected) return;
    setSaving(true);
    try {
      await api.patch(`/feature-requests/${selected.id}/status`, { status: nextStatus, admin_note: note.trim() });
      toast.success("Status usulan diperbarui");
      setSelected(null);
      await mutate();
    } catch {
      toast.error("Status belum bisa disimpan");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900 font-heading">
          <Lightbulb className="h-5 w-5 text-primary" /> Request Fitur
        </h1>
        <p className="text-xs font-medium text-slate-500">Pantau kebutuhan pengguna, prioritas berdasarkan vote, dan sampaikan progres pengerjaan.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {(Object.entries(statuses) as [FeatureStatus, (typeof statuses)[FeatureStatus]][]).map(([key, meta]) => (
          <Card key={key} className="p-4 shadow-none border-slate-200">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{meta.label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{counts[key] || 0}</p>
          </Card>
        ))}
      </div>

      <Card className="p-4 shadow-none border-slate-200">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari judul, kebutuhan, atau outlet..." className="pl-9" />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-full md:w-[230px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Status ({items.length})</SelectItem>
              {(Object.entries(statuses) as [FeatureStatus, (typeof statuses)[FeatureStatus]][]).map(([key, meta]) => <SelectItem key={key} value={key}>{meta.label} ({counts[key] || 0})</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {isLoading ? (
        <div className="flex h-52 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <Card className="flex h-52 flex-col items-center justify-center gap-2 border-dashed shadow-none"><Lightbulb className="h-8 w-8 text-slate-300" /><p className="text-sm text-slate-500">Belum ada usulan yang cocok.</p></Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {filtered.map((item) => (
            <Card key={item.id} className="flex flex-col gap-4 p-5 shadow-none border-slate-200">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={statuses[item.status].badge}>{statuses[item.status].label}</Badge>
                    <span className="text-[11px] text-slate-400">{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(item.created_at))}</span>
                  </div>
                  <h2 className="font-bold text-slate-900">{item.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                </div>
                <div className="flex min-w-14 flex-col items-center rounded-xl bg-orange-50 px-3 py-2 text-primary">
                  <ArrowUp className="h-4 w-4" /><span className="text-sm font-bold">{item.vote_count}</span><span className="text-[9px] font-bold uppercase">Vote</span>
                </div>
              </div>
              {item.admin_note && <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600"><span className="font-bold">Update publik:</span> {item.admin_note}</div>}
              {item.attachments?.length > 0 && <div className="flex gap-2 overflow-x-auto">{item.attachments.map((attachment) => <img key={attachment.id} src={resolveUploadUrl(attachment.file_url)} alt="Lampiran usulan" className="h-16 w-16 rounded-lg border border-slate-200 object-cover" />)}</div>}
              <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                <div><p className="text-xs font-semibold text-slate-700">{item.creator_name}</p><p className="text-[10px] text-slate-400">{item.outlet_id || "Tanpa outlet"}</p></div>
                <Button size="sm" variant="outline" onClick={() => openStatus(item)}>Ubah Status</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Detail & status usulan</DialogTitle><DialogDescription>Status dan catatan ini langsung terlihat oleh pengguna aplikasi.</DialogDescription></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="rounded-lg bg-slate-50 p-3"><p className="text-sm font-bold text-slate-900">{selected?.title}</p><p className="mt-2 text-xs leading-5 text-slate-600">{selected?.description}</p><p className="mt-2 text-xs text-slate-400">{selected?.creator_name} • {selected?.vote_count} vote</p></div>
            {selected?.attachments?.length ? <div className="flex gap-2 overflow-x-auto">{selected.attachments.map((attachment) => <a key={attachment.id} href={resolveUploadUrl(attachment.file_url)} target="_blank" rel="noreferrer"><img src={resolveUploadUrl(attachment.file_url)} alt="Lampiran usulan" className="h-24 w-24 rounded-lg border border-slate-200 object-cover" /></a>)}</div> : null}
            <Select value={nextStatus} onValueChange={(value) => setNextStatus(value as FeatureStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{(Object.entries(statuses) as [FeatureStatus, (typeof statuses)[FeatureStatus]][]).map(([key, meta]) => <SelectItem key={key} value={key}>{meta.label}</SelectItem>)}</SelectContent>
            </Select>
            <Textarea value={note} onChange={(event) => setNote(event.target.value)} rows={4} maxLength={1000} placeholder="Catatan singkat untuk pengguna (opsional), mis. sedang masuk riset Q4." />
            <Button onClick={saveStatus} disabled={saving} className="w-full">{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}Simpan Perubahan</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
