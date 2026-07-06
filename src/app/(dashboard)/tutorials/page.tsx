"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Eye,
  FileQuestion,
  FileText,
  Loader2,
  Pencil,
  PlayCircle,
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
import { cn } from "@/lib/utils";
import {
  TutorialItem,
  TutorialType,
  tutorialCategories,
  tutorialService,
  tutorialTypes,
} from "@/services/tutorial.service";
import PermissionGate from "@/components/shared/permission-gate";

const typeIcons: Record<TutorialType, React.ElementType> = {
  VIDEO: PlayCircle,
  GUIDE: FileText,
  FAQ: FileQuestion,
};

const typeLabels: Record<TutorialType, string> = {
  VIDEO: "Video",
  GUIDE: "Panduan",
  FAQ: "FAQ",
};

function DashboardTutorialContent() {
  const [items, setItems] = useState<TutorialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("ALL");
  const [category, setCategory] = useState("ALL");
  const [status, setStatus] = useState("ALL");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await tutorialService.getAll();
      if (res.status) setItems(res.data || []);
    } catch {
      toast.error("Gagal memuat tutorial");
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
        item.body?.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q);
      const matchType = type === "ALL" || item.type === type;
      const matchCategory = category === "ALL" || item.category === category;
      const matchStatus =
        status === "ALL" ||
        (status === "ACTIVE" ? item.is_active : !item.is_active);
      return matchSearch && matchType && matchCategory && matchStatus;
    });
  }, [items, search, type, category, status]);

  const stats = useMemo(
    () => ({
      total: items.length,
      video: items.filter((item) => item.type === "VIDEO").length,
      guide: items.filter((item) => item.type === "GUIDE").length,
      faq: items.filter((item) => item.type === "FAQ").length,
      active: items.filter((item) => item.is_active).length,
    }),
    [items],
  );

  const handleToggle = async (id: number) => {
    try {
      await tutorialService.toggleStatus(id);
      fetchData();
    } catch {
      toast.error("Gagal mengubah status tutorial");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus tutorial ini?")) return;
    try {
      await tutorialService.delete(id);
      toast.success("Tutorial dihapus");
      fetchData();
    } catch {
      toast.error("Gagal menghapus tutorial");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="space-y-0.5">
          <h1 className="flex items-center gap-2 font-heading text-xl font-bold tracking-tight text-slate-900">
            <BookOpen className="h-5 w-5 text-primary" />
            Tutorial & Panduan
          </h1>
          <p className="text-xs font-medium text-slate-500">
            Kelola materi pusat panduan: video, buku panduan, dan FAQ aplikasi.
          </p>
        </div>

        <PermissionGate module="tutorials" action="create">
          <Button
            asChild
            size="sm"
            className="h-8 gap-2 px-3 text-[10px] font-bold uppercase tracking-wider shadow-none"
          >
            <Link href="/tutorials/new">
              <Plus className="h-3.5 w-3.5" /> Buat Tutorial
            </Link>
          </Button>
        </PermissionGate>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <StatCard label="Total Item" value={stats.total} />
        <StatCard label="Video" value={stats.video} />
        <StatCard label="Panduan" value={stats.guide} />
        <StatCard label="FAQ" value={stats.faq} />
        <StatCard label="Aktif" value={stats.active} />
      </div>

      <Card className="overflow-hidden rounded-lg border border-slate-200 bg-white p-1 shadow-none">
        <div className="flex flex-col gap-1 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari judul, isi, atau kategori..."
              className="h-9 border-none pl-9 text-xs font-medium shadow-none placeholder:text-slate-400 focus-visible:ring-0"
            />
          </div>
          <div className="hidden h-5 w-px bg-slate-100 md:block" />
          <div className="flex flex-wrap items-center gap-1 p-1 md:p-0">
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="h-8 w-32 border-none text-[10px] font-bold shadow-none focus:ring-0">
                <SelectValue placeholder="Tipe" />
              </SelectTrigger>
              <SelectContent className="rounded-md">
                <SelectItem value="ALL" className="text-xs font-bold">
                  Semua Tipe
                </SelectItem>
                {tutorialTypes.map((item) => (
                  <SelectItem
                    key={item.value}
                    value={item.value}
                    className="text-xs font-bold"
                  >
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-8 w-36 border-none text-[10px] font-bold shadow-none focus:ring-0">
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent className="rounded-md">
                <SelectItem value="ALL" className="text-xs font-bold">
                  Semua Kategori
                </SelectItem>
                {tutorialCategories.map((item) => (
                  <SelectItem
                    key={item.value}
                    value={item.value}
                    className="text-xs font-bold"
                  >
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-8 w-32 border-none text-[10px] font-bold shadow-none focus:ring-0">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="rounded-md">
                <SelectItem value="ALL" className="text-xs font-bold">
                  Semua Status
                </SelectItem>
                <SelectItem value="ACTIVE" className="text-xs font-bold">
                  Aktif
                </SelectItem>
                <SelectItem value="INACTIVE" className="text-xs font-bold">
                  Nonaktif
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card className="min-h-[420px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-none">
        {loading ? (
          <div className="flex justify-center p-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center">
            <BookOpen className="mx-auto mb-2 h-8 w-8 text-slate-200" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Tutorial tidak ditemukan
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((item) => {
              const Icon = typeIcons[item.type];
              const categoryLabel =
                tutorialCategories.find((cat) => cat.value === item.category)
                  ?.label || item.category;
              return (
                <div
                  key={item.id}
                  className="grid grid-cols-1 gap-4 p-4 transition-all duration-300 hover:bg-primary/[0.01] md:grid-cols-[52px_minmax(0,1fr)_210px] md:items-center"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="rounded-full border-orange-100 bg-orange-50 px-2 py-0 text-[8px] font-bold uppercase text-primary shadow-none">
                        {typeLabels[item.type]}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="rounded-full border-slate-200 bg-slate-50 px-2 py-0 text-[8px] font-bold uppercase text-slate-500"
                      >
                        {categoryLabel}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={cn(
                          "rounded-full px-2 py-0 text-[8px] font-bold uppercase shadow-none",
                          item.is_active
                            ? "border-emerald-100 bg-emerald-50 text-emerald-600"
                            : "border-slate-200 bg-slate-50 text-slate-400",
                        )}
                      >
                        {item.is_active ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </div>
                    <h3 className="truncate font-heading text-sm font-bold tracking-tight text-slate-900">
                      {item.title}
                    </h3>
                    <p className="line-clamp-1 text-[11px] font-medium text-slate-500">
                      {item.summary || item.body || item.video_url || item.pdf_url}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 md:justify-end">
                    <PermissionGate module="tutorials" action="update">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggle(item.id)}
                        className={cn(
                          "h-8 gap-1.5 px-3 text-[9px] font-bold uppercase transition-all active:scale-95",
                          item.is_active
                            ? "text-slate-500 hover:bg-amber-50 hover:text-amber-600"
                            : "text-emerald-600 hover:bg-emerald-50",
                        )}
                      >
                        <Eye className="h-3 w-3" />
                        {item.is_active ? "Nonaktifkan" : "Aktifkan"}
                      </Button>
                    </PermissionGate>
                    <Button
                      asChild
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 border border-transparent p-0 text-slate-400 transition-all hover:border-slate-100 hover:text-primary active:scale-95"
                    >
                      <Link href={`/tutorials/${item.id}/edit`}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                    <PermissionGate module="tutorials" action="delete">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(item.id)}
                        className="h-8 w-8 border border-transparent p-0 text-slate-400 transition-all hover:border-rose-100 hover:text-rose-600 active:scale-95"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </PermissionGate>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

export default function DashboardTutorialPage() {
  return (
    <PermissionGate module="tutorials" action="read">
      <DashboardTutorialContent />
    </PermissionGate>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="gap-1 border border-slate-200 p-4 shadow-none transition-all duration-300 hover:border-primary/20 hover:shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
        {label}
      </p>
      <p className="font-heading text-xl font-bold text-slate-900">{value}</p>
    </Card>
  );
}
