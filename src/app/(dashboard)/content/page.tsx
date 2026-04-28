"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Eye,
  FileText,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ContentBanner, contentService } from "@/services/content.service";

const API_ROOT =
  (process.env.NEXT_PUBLIC_API_URL || "https://api.ayocuci.id/api/v1").replace(
    /\/api\/v1$/,
    "",
  );

export default function DashboardContentPage() {
  const [items, setItems] = useState<ContentBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [status, setStatus] = useState("ALL");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await contentService.getAll();
      if (res.status) setItems(res.data || []);
    } catch {
      toast.error("Gagal memuat konten");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const q = search.toLowerCase();
      const matchSearch =
        item.title.toLowerCase().includes(q) ||
        item.summary?.toLowerCase().includes(q) ||
        item.body.toLowerCase().includes(q);
      const matchCategory = category === "ALL" || item.category === category;
      const matchStatus =
        status === "ALL" ||
        (status === "ACTIVE" ? item.is_active : !item.is_active);
      return matchSearch && matchCategory && matchStatus;
    });
  }, [items, search, category, status]);

  const stats = useMemo(
    () => ({
      total: items.length,
      promo: items.filter((item) => item.category === "PROMO").length,
      info: items.filter((item) => item.category === "INFORMASI").length,
      active: items.filter((item) => item.is_active).length,
    }),
    [items],
  );

  const handleToggle = async (id: number) => {
    try {
      await contentService.toggleStatus(id);
      fetchData();
    } catch {
      toast.error("Gagal mengubah status");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus konten ini?")) return;
    try {
      await contentService.delete(id);
      toast.success("Konten dihapus");
      fetchData();
    } catch {
      toast.error("Gagal menghapus konten");
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl bg-orange-50 p-4">
            <FileText className="h-7 w-7 text-[#FF4500]" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900">
              Konten & Banner
            </h2>
            <p className="text-sm font-medium text-slate-400">
              Daftar promo dan informasi yang tampil di beranda aplikasi.
            </p>
          </div>
        </div>
        <Button asChild className="h-11 rounded-xl bg-slate-900 font-black">
          <Link href="/content/new">
            <Plus className="mr-2 h-4 w-4" />
            Buat Konten
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Promo" value={stats.promo} />
        <StatCard label="Informasi" value={stats.info} />
        <StatCard label="Aktif" value={stats.active} />
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari judul, ringkasan, atau isi..."
              className="h-11 rounded-xl bg-slate-50 pl-11"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-11 rounded-xl bg-slate-50 md:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua kategori</SelectItem>
              <SelectItem value="PROMO">Promo</SelectItem>
              <SelectItem value="INFORMASI">Informasi</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-11 rounded-xl bg-slate-50 md:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua status</SelectItem>
              <SelectItem value="ACTIVE">Aktif</SelectItem>
              <SelectItem value="INACTIVE">Nonaktif</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#FF4500]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-center">
            <FileText className="mb-3 h-8 w-8 text-slate-300" />
            <p className="font-black text-slate-700">Belum ada konten</p>
            <p className="text-sm text-slate-400">
              Buat konten promo atau informasi dari tombol di atas.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-1 gap-4 p-4 md:grid-cols-[180px_minmax(0,1fr)_220px] md:items-center"
              >
                <img
                  src={`${API_ROOT}${item.image_url}`}
                  alt={item.title}
                  className="aspect-[16/9] w-full rounded-xl object-cover md:w-[180px]"
                />
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-orange-50 text-[#FF4500]">
                      {item.category === "PROMO" ? "Promo" : "Informasi"}
                    </Badge>
                    <Badge variant="outline">
                      {item.is_active ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </div>
                  <h3 className="truncate text-base font-black text-slate-900">
                    {item.title}
                  </h3>
                  <p className="line-clamp-2 text-sm text-slate-500">
                    {item.summary || item.body}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 md:justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggle(item.id)}
                    className="rounded-xl"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    {item.is_active ? "Nonaktif" : "Aktif"}
                  </Button>
                  <Button asChild size="sm" variant="outline" className="rounded-xl">
                    <Link href={`/content/${item.id}/edit`}>
                      <Pencil className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(item.id)}
                    className="rounded-xl text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="gap-1 p-4">
      <p className="text-xs font-black uppercase tracking-widest text-slate-400">
        {label}
      </p>
      <p className="text-2xl font-black text-slate-900">{value}</p>
    </Card>
  );
}
