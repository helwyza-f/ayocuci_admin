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
import { cn } from "@/lib/utils";

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
    <div className="space-y-6">
      {/* COMMAND BAR HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2 font-heading">
            <FileText className="h-5 w-5 text-primary" />
            Content & Banners
          </h1>
          <p className="text-xs font-medium text-slate-500">
            Manage promotions and informational banners for the mobile app.
          </p>
        </div>

        <div className="flex items-center gap-2">
           <Button asChild size="sm" className="h-8 px-3 font-bold text-[10px] uppercase tracking-wider gap-2 shadow-none">
              <Link href="/content/new">
                <Plus className="h-3.5 w-3.5" /> Create New
              </Link>
           </Button>
        </div>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Items" value={stats.total} />
        <StatCard label="Promotions" value={stats.promo} />
        <StatCard label="Information" value={stats.info} />
        <StatCard label="Active Items" value={stats.active} />
      </div>

      {/* FILTER COMMAND BAR */}
      <Card className="p-1 border border-slate-200 rounded-lg bg-white overflow-hidden shadow-none">
        <div className="flex flex-col md:flex-row md:items-center gap-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or content..."
              className="pl-9 h-9 border-none shadow-none focus-visible:ring-0 text-xs font-medium placeholder:text-slate-400"
            />
          </div>
          
          <div className="h-5 w-px bg-slate-100 hidden md:block" />

          <div className="flex items-center gap-1 p-1 md:p-0">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-8 font-bold text-[10px] border-none shadow-none focus:ring-0 w-36 gap-2">
                <SelectValue placeholder="Categories" />
              </SelectTrigger>
              <SelectContent className="rounded-md">
                <SelectItem value="ALL" className="text-xs font-bold">All Categories</SelectItem>
                <SelectItem value="PROMO" className="text-xs font-bold">Promotions</SelectItem>
                <SelectItem value="INFORMASI" className="text-xs font-bold">Information</SelectItem>
              </SelectContent>
            </Select>

            <div className="h-4 w-px bg-slate-100" />

            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-8 font-bold text-[10px] border-none shadow-none focus:ring-0 w-32 gap-2">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="rounded-md">
                <SelectItem value="ALL" className="text-xs font-bold">All Status</SelectItem>
                <SelectItem value="ACTIVE" className="text-xs font-bold">Active</SelectItem>
                <SelectItem value="INACTIVE" className="text-xs font-bold">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* CONTENT LIST */}
      <Card className="border border-slate-200 rounded-lg overflow-hidden bg-white min-h-[400px] shadow-none">
        {loading ? (
          <div className="p-20 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center">
            <FileText className="h-8 w-8 text-slate-200 mx-auto mb-2" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">No content found</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-1 gap-4 p-4 md:grid-cols-[140px_minmax(0,1fr)_200px] md:items-center hover:bg-primary/[0.01] transition-all duration-300 group/item"
              >
                <div className="overflow-hidden rounded-md border border-slate-100 shadow-sm">
                  <img
                    src={`${API_ROOT}${item.image_url}`}
                    alt={item.title}
                    className="aspect-[16/9] w-full object-cover md:w-[140px] group-hover/item:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="rounded-full px-2 py-0 text-[8px] font-bold uppercase border-slate-200 bg-slate-50 text-slate-500">
                      {item.category === "PROMO" ? "Promo" : "Info"}
                    </Badge>
                    <Badge variant="outline" className={cn(
                      "rounded-full px-2 py-0 text-[8px] font-bold uppercase border shadow-none transition-colors",
                      item.is_active ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-slate-400 border-slate-200"
                    )}>
                      {item.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <h3 className="truncate text-sm font-bold text-slate-900 tracking-tight leading-none font-heading group-hover/item:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <p className="line-clamp-1 text-[11px] text-slate-500 font-medium">
                    {item.summary || item.body}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 md:justify-end">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleToggle(item.id)}
                    className={cn(
                      "h-8 px-3 font-bold text-[9px] uppercase gap-1.5 active:scale-95 transition-all",
                      item.is_active ? "text-slate-500 hover:text-amber-600 hover:bg-amber-50" : "text-emerald-600 hover:bg-emerald-50"
                    )}
                  >
                    <Eye className="h-3 w-3" />
                    {item.is_active ? "Deactivate" : "Activate"}
                  </Button>
                  <Button asChild size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-primary active:scale-95 transition-all border border-transparent hover:border-slate-100">
                    <Link href={`/content/${item.id}/edit`}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(item.id)}
                    className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 active:scale-95 transition-all border border-transparent hover:border-rose-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
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
    <Card className="gap-1 p-4 border border-slate-200 shadow-none hover:border-primary/20 hover:shadow-sm transition-all duration-300 group">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-slate-500 transition-colors">
        {label}
      </p>
      <p className="text-xl font-bold text-slate-900 font-heading group-hover:text-primary transition-colors">{value}</p>
    </Card>
  );
}
