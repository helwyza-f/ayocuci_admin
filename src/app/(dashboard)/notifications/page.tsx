"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Megaphone,
  Send,
  History,
  Store,
  Bell,
  ShieldAlert,
  CheckCircle2,
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
    setSelectedLog(log);
    setLoadingDetail(true);
    try {
      const res = await api.get(`/admin/notifications/logs/${log.id}`);
      if (res.data.status) setReceivers(res.data.data);
    } catch (err) {
      toast.error("Gagal memuat detail");
    } finally {
      setLoadingDetail(false);
    }
  };

  const outletOptions: Option[] = useMemo(
    () => [
      { label: "📢 SEMUA OUTLET", value: "all" },
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
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase flex items-center gap-3">
          <Megaphone className="h-8 w-8 text-[#FF4500]" />
          Broadcast <span className="text-[#FF4500]">System</span>
        </h2>
        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">
          Ayo Cuci - Sistem Broadcast Pesan untuk Outlet
        </p>
      </div>

      <Tabs defaultValue="broadcast" className="w-full">
        {/* Style Tab Capsule - Modern & Clean */}
        <TabsList className="bg-slate-100/80 rounded-full p-1 mb-8 w-fit border border-slate-200">
          <TabsTrigger
            value="broadcast"
            className="rounded-full px-8 py-2 font-black text-[10px] uppercase data-[state=active]:bg-[#FF4500] data-[state=active]:text-white transition-all"
          >
            Kirim Pesan
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="rounded-full px-8 py-2 font-black text-[10px] uppercase data-[state=active]:bg-[#FF4500] data-[state=active]:text-white transition-all"
          >
            Riwayat Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="broadcast" className="focus-visible:outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 p-8 border-none shadow-xl rounded-[32px] bg-white">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
                      Kategori
                    </label>
                    <Select
                      onValueChange={(v) => setForm({ ...form, kategori: v })}
                      value={form.kategori}
                    >
                      <SelectTrigger className="rounded-xl border-slate-200 font-bold h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="INFO" className="font-bold">
                          📢 INFO UMUM
                        </SelectItem>
                        <SelectItem value="PROMO" className="font-bold">
                          🔥 PROMO
                        </SelectItem>
                        <SelectItem value="SISTEM" className="font-bold">
                          ⚙️ SISTEM
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
                      Target Outlet
                    </label>
                    <MultiSelect
                      options={outletOptions}
                      selected={form.outlets}
                      onChange={handleOutletChange}
                      placeholder="Pilih tujuan..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
                    Judul
                  </label>
                  <Input
                    value={form.judul}
                    onChange={(e) =>
                      setForm({ ...form, judul: e.target.value })
                    }
                    placeholder="Masukkan judul pesan..."
                    className="rounded-xl border-slate-200 h-12 font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
                    Pesan
                  </label>
                  <Textarea
                    value={form.pesan}
                    onChange={(e) =>
                      setForm({ ...form, pesan: e.target.value })
                    }
                    placeholder="Apa yang ingin disampaikan?"
                    className="rounded-2xl border-slate-200 min-h-[160px] font-medium"
                  />
                </div>

                <Button
                  onClick={async () => {
                    if (!form.judul || !form.pesan)
                      return toast.error("Lengkapi form!");
                    setLoading(true);
                    try {
                      const res = await api.post(
                        "/admin/notifications/broadcast",
                        form,
                      );
                      if (res.data.status) {
                        toast.success("Broadcast Terkirim!");
                        setForm({
                          judul: "",
                          pesan: "",
                          kategori: "INFO",
                          outlets: ["all"],
                        });
                        fetchData();
                      }
                    } catch (e) {
                      toast.error("Gagal mengirim!");
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  className="w-full bg-[#FF4500] hover:bg-orange-600 text-white font-black rounded-xl h-14 shadow-lg shadow-orange-100 gap-3 transition-all active:scale-95"
                >
                  {loading ? (
                    <Loader2 className="animate-spin h-5 w-5" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                  PUBLISH SEKARANG
                </Button>
              </div>
            </Card>

            <div className="space-y-6">
              {/* Simple Preview Card */}
              <Card className="p-6 rounded-[32px] border-none bg-orange-50/50 space-y-4">
                <h4 className="font-black text-[10px] text-[#FF4500] uppercase tracking-widest flex items-center gap-2">
                  <Info className="h-3 w-3" /> Preview Pesan
                </h4>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-orange-100 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[8px] font-black bg-[#FF4500] text-white px-2 py-0.5 rounded-full uppercase">
                      {form.kategori}
                    </span>
                    <span className="text-[8px] text-slate-400 font-bold italic">
                      Baru saja
                    </span>
                  </div>
                  <h5 className="font-black text-slate-800 text-xs truncate">
                    {form.judul || "Judul..."}
                  </h5>
                  <p className="text-[10px] text-slate-500 line-clamp-4 leading-relaxed italic">
                    {form.pesan || "Isi pesan akan muncul di sini..."}
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="focus-visible:outline-none">
          <div className="space-y-4">
            {/* Proper Filter Bar with Combobox */}
            <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Cari judul..."
                  className="pl-11 rounded-xl border-slate-100 bg-slate-50 h-10 font-bold text-xs"
                  value={searchHistory}
                  onChange={(e) => setSearchHistory(e.target.value)}
                />
              </div>

              {/* Combobox Search Outlet */}
              <Popover open={openCombo} onOpenChange={setOpenCombo}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-10 rounded-xl border-slate-100 bg-slate-50 font-black text-[10px] uppercase min-w-[180px] justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Store className="h-3.5 w-3.5 text-slate-400" />
                      {filterOutlet === "ALL" ? "Cari Outlet" : filterOutlet}
                    </div>
                    <ChevronsUpDown className="h-3 w-3 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[220px] p-0 rounded-xl border-slate-100 shadow-2xl">
                  <Command>
                    <CommandInput
                      placeholder="Nama outlet..."
                      className="font-bold text-xs h-10"
                    />
                    <CommandEmpty className="text-[10px] font-black uppercase text-slate-400 p-4">
                      Tidak ketemu
                    </CommandEmpty>
                    <CommandGroup className="max-h-[200px] overflow-y-auto">
                      <CommandItem
                        className="font-bold text-xs uppercase"
                        onSelect={() => {
                          setFilterOutlet("ALL");
                          setOpenCombo(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-3 w-3",
                            filterOutlet === "ALL"
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                        SEMUA OUTLET
                      </CommandItem>
                      {tenants.map((t) => (
                        <CommandItem
                          key={t.ot_id}
                          value={t.ot_nama}
                          onSelect={() => {
                            setFilterOutlet(t.ot_nama);
                            setOpenCombo(false);
                          }}
                          className="font-bold text-xs uppercase"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-3 w-3",
                              filterOutlet === t.ot_nama
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                          {t.ot_nama}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>

              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="h-10 w-[140px] rounded-xl border-slate-100 bg-slate-50 font-black text-[10px] uppercase">
                  <div className="flex items-center gap-2">
                    <Filter className="h-3.5 w-3.5 text-slate-400" />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem
                    value="ALL"
                    className="font-black text-[10px] uppercase"
                  >
                    SEMUA TIPE
                  </SelectItem>
                  <SelectItem
                    value="INFO"
                    className="font-black text-[10px] uppercase"
                  >
                    INFO
                  </SelectItem>
                  <SelectItem
                    value="PROMO"
                    className="font-black text-[10px] uppercase"
                  >
                    PROMO
                  </SelectItem>
                  <SelectItem
                    value="SISTEM"
                    className="font-black text-[10px] uppercase"
                  >
                    SISTEM
                  </SelectItem>
                </SelectContent>
              </Select>

              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="date"
                  className="h-10 pl-9 pr-4 rounded-xl border border-slate-100 bg-slate-50 font-black text-[10px] uppercase focus:outline-none"
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
                  className="h-10 w-10 rounded-xl text-red-500 hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* History List */}
            <div className="grid grid-cols-1 gap-3">
              {isFetching ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-28 bg-white rounded-3xl animate-pulse"
                  />
                ))
              ) : filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <Card
                    key={log.id}
                    className="p-5 border-none shadow-sm rounded-3xl bg-white hover:shadow-md transition-all border border-slate-50"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-start gap-4">
                        <div
                          className={cn(
                            "p-3.5 rounded-2xl",
                            log.kategori === "SISTEM"
                              ? "bg-blue-50 text-blue-600"
                              : log.kategori === "PROMO"
                                ? "bg-orange-50 text-orange-600"
                                : "bg-slate-50 text-slate-500",
                          )}
                        >
                          {log.kategori === "SISTEM" ? (
                            <ShieldAlert className="h-5 w-5" />
                          ) : (
                            <Bell className="h-5 w-5" />
                          )}
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black uppercase text-slate-400">
                              {log.kategori}
                            </span>
                            <span className="text-[9px] font-bold text-slate-300">
                              {format(
                                new Date(log.created_at),
                                "dd MMM yyyy, HH:mm",
                                { locale: id },
                              )}
                            </span>
                          </div>
                          <h4 className="font-black text-slate-800 uppercase text-xs">
                            {log.judul}
                          </h4>
                          <div className="flex flex-wrap items-center gap-3 pt-2">
                            <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                              <Users className="h-3 w-3 text-slate-400 shrink-0" />
                              <span className="text-[9px] font-black text-slate-500 uppercase truncate max-w-[200px]">
                                {log.total_target >= tenants.length
                                  ? "📢 SELURUH OUTLET"
                                  : log.receiver_names || "Spesifik"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 bg-green-50 px-2 py-1 rounded-lg border border-green-100">
                              <MailOpen className="h-3 w-3 text-green-500" />
                              <span className="text-[9px] font-black text-green-600">
                                {log.total_read} DIBACA
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 justify-end">
                        <div className="text-right hidden sm:block">
                          <p className="text-[8px] font-black text-slate-300 uppercase mb-1">
                            Rate
                          </p>
                          <div className="h-1 w-16 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-orange-500 rounded-full"
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
                          className="h-10 w-10 rounded-xl bg-slate-50 text-slate-900 hover:bg-[#FF4500] hover:text-white transition-all"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="p-20 text-center bg-white rounded-[32px]">
                  <p className="text-xs font-black text-slate-300 uppercase">
                    Tidak ada data
                  </p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal Detail */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-xl p-0 overflow-hidden rounded-[32px] border-none">
          <VisuallyHidden.Root>
            <DialogTitle>Detail Log</DialogTitle>
          </VisuallyHidden.Root>
          <div className="p-6 bg-slate-900 text-white">
            <h3 className="font-black text-base uppercase">
              {selectedLog?.judul}
            </h3>
            <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-widest">
              {selectedLog?.kategori} •{" "}
              {selectedLog &&
                format(new Date(selectedLog.created_at), "dd MMM yyyy")}
            </p>
          </div>
          <div className="p-6 bg-white space-y-4">
            <div className="p-4 bg-slate-50 rounded-2xl text-xs leading-relaxed italic text-slate-600">
              "{selectedLog?.pesan}"
            </div>
            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {receivers.map((rcv) => (
                  <div
                    key={rcv.outlet_id}
                    className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl border border-slate-100"
                  >
                    <div className="flex items-center gap-3">
                      <Store
                        className={cn(
                          "h-3.5 w-3.5",
                          rcv.status === 1
                            ? "text-green-500"
                            : "text-slate-300",
                        )}
                      />
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase truncate">
                          {rcv.outlet_name}
                        </p>
                      </div>
                    </div>
                    {rcv.status === 1 && (
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                    )}
                  </div>
                ))}
              </div>
            </div>
            <Button
              onClick={() => setSelectedLog(null)}
              className="w-full bg-slate-900 text-white font-black rounded-xl h-12 uppercase text-[10px] tracking-widest mt-4"
            >
              TUTUP
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
