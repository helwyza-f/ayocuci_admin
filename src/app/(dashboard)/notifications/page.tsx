"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Megaphone,
  Send,
  Store,
  Bell,
  ShieldAlert,
  Search,
  Loader2,
  MailOpen,
  Users,
  Eye,
  Filter,
  Calendar as CalendarIcon,
  X,
  Check,
  ChevronsUpDown,
  Info,
  Layers,
  LayoutGrid,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MultiSelect, Option } from "@/components/ui/multi-select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import api from "@/lib/api-client";
import { format, isSameDay } from "date-fns";
import { id } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function NotificationsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  // Filter States
  const [searchHistory, setSearchHistory] = useState("");
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [filterOutlet, setFilterOutlet] = useState("ALL");
  const [filterDate, setFilterDate] = useState("");
  const [openCombo, setOpenCombo] = useState(false);

  // Modal Detail States
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [receivers, setReceivers] = useState<any[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [form, setForm] = useState({
    judul: "",
    pesan: "",
    kategori: "INFO",
    outlets: ["all"],
  });

  const fetchData = async () => {
    setIsFetching(true);
    try {
      const [resLogs, resTenants] = await Promise.all([
        api.get("/admin/notifications/logs"),
        api.get("/admin/tenants"),
      ]);
      if (resLogs.data.status) setLogs(resLogs.data.data || []);
      if (resTenants.data.status) setTenants(resTenants.data.data || []);
    } catch (err) {
      toast.error("Gagal sinkronisasi data");
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchDetail = async (log: any) => {
    setReceivers([]);
    setSelectedLog(log);
    setLoadingDetail(true);
    try {
      const res = await api.get(`/admin/notifications/logs/${log.id}`);
      if (res.data.status) setReceivers(res.data.data || []);
    } catch (err) {
      toast.error("Gagal memuat detail log");
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedLog(null);
    setReceivers([]);
  };

  const outletOptions: Option[] = useMemo(
    () => [
      { label: "SEMUA OUTLET", value: "all" },
      ...tenants.map((t) => ({ label: t.ot_nama, value: t.ot_id })),
    ],
    [tenants],
  );

  const handleOutletChange = (values: string[]) => {
    const lastValue = values[values.length - 1];
    if (lastValue === "all") {
      setForm({ ...form, outlets: ["all"] });
    } else if (values.includes("all") && values.length > 1) {
      setForm({ ...form, outlets: values.filter((v) => v !== "all") });
    } else {
      setForm({ ...form, outlets: values });
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch = log.judul
        ?.toLowerCase()
        .includes(searchHistory.toLowerCase());
      const matchesCategory =
        filterCategory === "ALL" || log.kategori === filterCategory;
      const matchesOutlet =
        filterOutlet === "ALL" || log.receiver_names?.includes(filterOutlet);
      const matchesDate =
        !filterDate ||
        isSameDay(new Date(log.created_at), new Date(filterDate));
      return matchesSearch && matchesCategory && matchesOutlet && matchesDate;
    });
  }, [logs, searchHistory, filterCategory, filterOutlet, filterDate]);

  return (
    <div className="space-y-8 pb-10">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="p-5 bg-orange-50 rounded-[25px]">
            <Megaphone className="h-8 w-8 text-[#FF4500]" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none mb-1">
              Pusat <span className="text-[#FF4500]">Broadcast</span>
            </h2>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">
              Manajemen & Distribusi Informasi Outlet
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="broadcast" className="w-full">
        <TabsList className="bg-slate-100/80 rounded-2xl p-1.5 mb-8 w-fit border border-slate-200">
          <TabsTrigger
            value="broadcast"
            className="rounded-xl px-10 py-2.5 font-black text-[11px] uppercase data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all"
          >
            Buat Pengumuman
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="rounded-xl px-10 py-2.5 font-black text-[11px] uppercase data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all"
          >
            Log Riwayat
          </TabsTrigger>
        </TabsList>

        <TabsContent value="broadcast" className="focus-visible:outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 p-10 border-none shadow-2xl shadow-slate-200/50 rounded-[45px] bg-white">
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">
                      Tipe Kategori
                    </label>
                    <Select
                      onValueChange={(v) => setForm({ ...form, kategori: v })}
                      value={form.kategori}
                    >
                      <SelectTrigger className="rounded-2xl border-slate-100 bg-slate-50/50 font-black h-14 px-6 text-xs uppercase tracking-wider text-left whitespace-nowrap">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        <SelectItem
                          value="INFO"
                          className="font-black text-xs py-3 uppercase"
                        >
                          Informasi Umum
                        </SelectItem>
                        <SelectItem
                          value="PROMO"
                          className="font-black text-xs py-3 uppercase"
                        >
                          Promo Marketing
                        </SelectItem>
                        <SelectItem
                          value="SISTEM"
                          className="font-black text-xs py-3 uppercase"
                        >
                          Peringatan Sistem
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">
                      Target Penerima
                    </label>
                    <MultiSelect
                      options={outletOptions}
                      selected={form.outlets}
                      onChange={handleOutletChange}
                      placeholder="Pilih Outlet Tujuan..."
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">
                    Judul Pengumuman
                  </label>
                  <Input
                    value={form.judul}
                    onChange={(e) =>
                      setForm({ ...form, judul: e.target.value })
                    }
                    placeholder="Masukkan judul broadcast..."
                    className="rounded-2xl border-slate-100 bg-slate-50/50 h-14 font-black px-6 text-xs uppercase"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">
                    Isi Pesan
                  </label>
                  <Textarea
                    value={form.pesan}
                    onChange={(e) =>
                      setForm({ ...form, pesan: e.target.value })
                    }
                    placeholder="Tulis pesan..."
                    className="rounded-[30px] border-slate-100 bg-slate-50/50 min-h-[200px] font-medium p-8 text-sm leading-relaxed"
                  />
                </div>

                <Button
                  onClick={async () => {
                    if (!form.judul || !form.pesan)
                      return toast.error("Data tidak lengkap!");
                    setLoading(true);
                    try {
                      const res = await api.post(
                        "/admin/notifications/broadcast",
                        form,
                      );
                      if (res.data.status) {
                        toast.success("Broadcast Berhasil Dikirim!");
                        setForm({
                          judul: "",
                          pesan: "",
                          kategori: "INFO",
                          outlets: ["all"],
                        });
                        fetchData();
                      }
                    } catch (e) {
                      toast.error("Gagal mengirim broadcast");
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  className="w-full bg-slate-900 hover:bg-black text-white font-black rounded-2xl h-16 shadow-xl shadow-slate-200 gap-3 transition-all active:scale-95 text-xs uppercase tracking-widest"
                >
                  {loading ? (
                    <Loader2 className="animate-spin h-5 w-5" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Konfirmasi & Kirim Pesan
                </Button>
              </div>
            </Card>

            <Card className="p-8 rounded-[40px] border-none bg-orange-50/30 space-y-6 h-fit">
              <div className="flex items-center gap-3 border-b border-orange-100 pb-4">
                <Info className="h-4 w-4 text-[#FF4500]" />
                <h4 className="font-black text-[10px] text-[#FF4500] uppercase tracking-[0.2em]">
                  Preview Langsung
                </h4>
              </div>
              <div className="bg-white p-8 rounded-[35px] shadow-sm border border-orange-100 space-y-4">
                <div className="flex justify-between items-center">
                  <Badge className="bg-slate-900 text-white rounded-lg font-black text-[8px] px-2 py-1 uppercase border-none">
                    {form.kategori}
                  </Badge>
                  <span className="text-[8px] text-slate-300 font-bold uppercase tracking-widest">
                    Baru Saja
                  </span>
                </div>
                <h5 className="font-black text-slate-800 text-sm uppercase tracking-tight truncate">
                  {form.judul || "Judul..."}
                </h5>
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed italic line-clamp-6">
                  {form.pesan || "Isi pesan akan muncul di sini..."}
                </p>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent
          value="history"
          className="focus-visible:outline-none animate-in slide-in-from-bottom-4 duration-500"
        >
          {/* Riwayat Layout Sama Seperti Sebelumnya - Sudah Proper */}
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-4 bg-white p-6 rounded-[35px] shadow-sm border border-slate-100">
              <div className="flex-1 min-w-[250px] relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-[#FF4500] transition-colors" />
                <Input
                  placeholder="Cari judul..."
                  className="pl-12 rounded-2xl border-slate-100 bg-slate-50 h-12 font-black text-xs uppercase"
                  value={searchHistory}
                  onChange={(e) => setSearchHistory(e.target.value)}
                />
              </div>

              <Popover open={openCombo} onOpenChange={setOpenCombo}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-12 rounded-2xl border-slate-100 bg-slate-50 font-black text-[10px] uppercase min-w-[200px] justify-between px-6"
                  >
                    <div className="flex items-center gap-3">
                      <Store className="h-4 w-4 text-slate-400" />
                      {filterOutlet === "ALL" ? "Semua Outlet" : filterOutlet}
                    </div>
                    <ChevronsUpDown className="h-3 w-3 opacity-30" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-0 rounded-2xl border-slate-100 shadow-2xl overflow-hidden">
                  <Command>
                    <CommandInput
                      placeholder="Cari nama..."
                      className="font-bold text-xs h-12 px-4"
                    />
                    <CommandList>
                      <CommandEmpty className="text-[10px] font-black uppercase text-slate-300 p-6 text-center">
                        Data tidak ditemukan
                      </CommandEmpty>
                      <CommandGroup className="max-h-[250px] overflow-y-auto p-2">
                        <CommandItem
                          className="font-black text-[10px] uppercase rounded-xl py-3"
                          onSelect={() => {
                            setFilterOutlet("ALL");
                            setOpenCombo(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-3.5 w-3.5",
                              filterOutlet === "ALL"
                                ? "opacity-100 text-[#FF4500]"
                                : "opacity-0",
                            )}
                          />{" "}
                          Seluruh Network
                        </CommandItem>
                        {tenants.map((t) => (
                          <CommandItem
                            key={t.ot_id}
                            value={t.ot_nama}
                            onSelect={() => {
                              setFilterOutlet(t.ot_nama);
                              setOpenCombo(false);
                            }}
                            className="font-black text-[10px] uppercase rounded-xl py-3"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-3.5 w-3.5",
                                filterOutlet === t.ot_nama
                                  ? "opacity-100 text-[#FF4500]"
                                  : "opacity-0",
                              )}
                            />{" "}
                            {t.ot_nama}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="h-12 w-[160px] rounded-2xl border-slate-100 bg-slate-50 font-black text-[10px] uppercase px-6">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-slate-400" />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-100">
                  <SelectItem
                    value="ALL"
                    className="font-black text-[10px] uppercase"
                  >
                    Semua Tipe
                  </SelectItem>
                  <SelectItem
                    value="INFO"
                    className="font-black text-[10px] uppercase"
                  >
                    Informasi
                  </SelectItem>
                  <SelectItem
                    value="PROMO"
                    className="font-black text-[10px] uppercase"
                  >
                    Promosi
                  </SelectItem>
                  <SelectItem
                    value="SISTEM"
                    className="font-black text-[10px] uppercase"
                  >
                    Sistem
                  </SelectItem>
                </SelectContent>
              </Select>

              <div className="relative group">
                <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[#FF4500]" />
                <input
                  type="date"
                  className="h-12 pl-11 pr-4 rounded-2xl border border-slate-100 bg-slate-50 font-black text-[10px] uppercase focus:outline-none focus:ring-2 focus:ring-[#FF4500]/20 transition-all"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                />
              </div>

              {(searchHistory ||
                filterCategory !== "ALL" ||
                filterOutlet !== "ALL" ||
                filterDate) && (
                <Button
                  onClick={() => {
                    setSearchHistory("");
                    setFilterCategory("ALL");
                    setFilterOutlet("ALL");
                    setFilterDate("");
                  }}
                  variant="ghost"
                  className="h-12 w-12 rounded-2xl text-rose-500 hover:bg-rose-50 transition-colors"
                >
                  <X className="h-5 w-5" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4">
              {isFetching ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-32 bg-white rounded-[35px] animate-pulse border border-slate-50"
                  />
                ))
              ) : filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <Card
                    key={log.id}
                    className="p-8 border-none shadow-sm rounded-[40px] bg-white hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border border-slate-50 group"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                      <div className="flex items-start gap-6">
                        <div
                          className={cn(
                            "p-4 rounded-2xl shadow-inner",
                            log.kategori === "SISTEM"
                              ? "bg-slate-900 text-white"
                              : "bg-orange-50 text-orange-600",
                          )}
                        >
                          {log.kategori === "SISTEM" ? (
                            <ShieldAlert className="h-6 w-6" />
                          ) : (
                            <Bell className="h-6 w-6" />
                          )}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <span className="text-[9px] font-black uppercase text-slate-300 tracking-[0.2em]">
                              {log.kategori}
                            </span>
                            <span className="h-1 w-1 bg-slate-200 rounded-full" />
                            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                              {format(
                                new Date(log.created_at),
                                "dd MMMM yyyy",
                                { locale: id },
                              )}
                            </span>
                          </div>
                          <h4 className="font-black text-slate-800 uppercase text-[13px] tracking-tight group-hover:text-[#FF4500] transition-colors">
                            {log.judul}
                          </h4>
                          <div className="flex flex-wrap items-center gap-3 pt-3">
                            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                              <Users className="h-3.5 w-3.5 text-slate-400" />
                              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest max-w-[250px] truncate">
                                {log.total_target >= tenants.length
                                  ? "Seluruh Outlet Network"
                                  : log.receiver_names || "Grup Spesifik"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                              <MailOpen className="h-3.5 w-3.5 text-emerald-500" />
                              <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">
                                {log.total_read} Konfirmasi Baca
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-8 justify-end">
                        <div className="text-right hidden xl:block">
                          <p className="text-[9px] font-black text-slate-300 uppercase mb-2 tracking-widest text-center">
                            Interaksi
                          </p>
                          <div className="h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                            <div
                              className="h-full bg-slate-900 rounded-full transition-all duration-1000"
                              style={{
                                width: `${(log.total_read / log.total_target) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                        <Button
                          onClick={() => fetchDetail(log)}
                          variant="ghost"
                          size="icon"
                          className="h-14 w-14 rounded-2xl bg-slate-50 text-slate-400 hover:bg-[#FF4500] hover:text-white transition-all shadow-sm active:scale-90"
                        >
                          <Eye className="h-6 w-6" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="p-32 text-center bg-slate-50/50 rounded-[50px] border-4 border-dashed border-slate-100 flex flex-col items-center gap-4">
                  <LayoutGrid className="h-12 w-12 text-slate-200" />
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                    Riwayat Masih Kosong
                  </p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* 🚀 MODAL DETAIL (FIXED WIDTH & FULL RESPONSIVE) */}
      <Dialog
        open={!!selectedLog}
        onOpenChange={(open) => {
          if (!open) handleCloseModal();
        }}
      >
        <DialogContent className="sm:max-w-[90vw] md:max-w-4xl lg:max-w-5xl xl:max-w-6xl w-full p-0 overflow-hidden rounded-[50px] border-none shadow-2xl bg-white animate-in zoom-in-95 duration-200">
          <VisuallyHidden.Root>
            <DialogTitle>Detail Pengiriman Pesan</DialogTitle>
          </VisuallyHidden.Root>

          <div className="p-10 bg-slate-900 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <Badge className="bg-white/10 text-white/70 rounded-lg text-[9px] uppercase tracking-widest font-black border-none px-3 py-1">
                Arsip {selectedLog?.kategori}
              </Badge>
              <h3 className="font-black text-4xl uppercase tracking-tighter italic leading-tight">
                {selectedLog?.judul}
              </h3>
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em]">
                Dikirim pada{" "}
                {selectedLog &&
                  format(
                    new Date(selectedLog.created_at),
                    "dd MMMM yyyy, HH:mm",
                    { locale: id },
                  )}
              </p>
            </div>
            <div className="flex gap-4">
              <div className="bg-white/5 p-5 rounded-[22px] border border-white/10 text-center min-w-[120px] backdrop-blur-sm">
                <p className="text-[9px] font-black text-white/40 uppercase mb-1 tracking-widest">
                  Target
                </p>
                <p className="text-3xl font-black">
                  {selectedLog?.total_target || 0}
                </p>
              </div>
              <div className="bg-[#FF4500]/20 p-5 rounded-[22px] border border-[#FF4500]/20 text-center min-w-[120px] backdrop-blur-sm">
                <p className="text-[9px] font-black text-[#FF4500] uppercase mb-1 tracking-widest">
                  Dibaca
                </p>
                <p className="text-3xl font-black text-[#FF4500]">
                  {selectedLog?.total_read || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="p-10 grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Isi Pesan Column */}
            <div className="lg:col-span-4 space-y-6">
              <div className="flex items-center gap-2 ml-2">
                <Megaphone className="h-4 w-4 text-[#FF4500]" />
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
                  Isi Pesan Siaran
                </span>
              </div>
              <div className="p-8 bg-slate-50 rounded-[40px] border-2 border-slate-100 shadow-inner min-h-[250px] flex flex-col">
                <p className="text-sm font-medium leading-relaxed text-slate-600 italic">
                  "{selectedLog?.pesan}"
                </p>
              </div>
              <Button
                onClick={handleCloseModal}
                className="w-full bg-slate-100 text-slate-500 hover:bg-slate-200 font-black rounded-2xl h-16 uppercase text-[11px] tracking-widest transition-all active:scale-95 shadow-sm"
              >
                Tutup Arsip Detail
              </Button>
            </div>

            {/* Recipients Column (WIDER GRID & SCROLLABLE) */}
            <div className="lg:col-span-8 space-y-6">
              <div className="flex items-center justify-between ml-2">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-slate-300" />
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
                    Status Penerimaan Outlet
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className="text-[9px] font-black border-slate-200 text-slate-400 uppercase rounded-lg px-3"
                >
                  {receivers.length} Entri
                </Badge>
              </div>

              <div className="max-h-[500px] overflow-y-auto pr-4 custom-scrollbar min-h-[300px]">
                {loadingDetail ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3 border-2 border-dashed border-slate-100 rounded-[40px]">
                    <Loader2 className="h-10 w-10 animate-spin text-orange-200" />
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                      Mengambil Data Penerima...
                    </span>
                  </div>
                ) : receivers.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 pb-4">
                    {receivers.map((rcv) => (
                      <div
                        key={rcv.outlet_id}
                        className="flex items-center justify-between p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-[#FF4500]/30 transition-all group active:scale-95"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div
                            className={cn(
                              "h-3 w-3 rounded-full",
                              rcv.status === 1
                                ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]"
                                : "bg-slate-200",
                            )}
                          ></div>
                          <p className="text-[11px] font-black uppercase truncate text-slate-700 group-hover:text-[#FF4500] transition-colors">
                            {rcv.outlet_name}
                          </p>
                        </div>
                        {rcv.status === 1 && (
                          <Badge className="bg-emerald-50 text-emerald-600 hover:bg-emerald-50 border-none text-[8px] font-black uppercase tracking-tighter shadow-none">
                            Opened
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-100">
                    <LayoutGrid className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                      Detail Penerima Tidak Tersedia
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
