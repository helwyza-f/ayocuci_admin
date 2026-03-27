"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  XCircle,
  Eye,
  Wallet2,
  Loader2 as LoaderIcon,
  ExternalLink,
  ShieldCheck,
  Store,
  Clock,
  RefreshCw,
  Search,
  User2,
  Calendar as CalendarIcon,
  FilterX,
  ChevronRight,
  Check,
  ChevronsUpDown,
  CreditCard,
  ArrowRightLeft,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { topupService } from "@/services/topup.service";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { id } from "date-fns/locale";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.ayocuci.id";

export default function TopupsManagementPage() {
  const [data, setData] = useState<any[]>([]); // Default ke array kosong
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");

  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  // Searchable Dropdown States
  const [outletFilter, setOutletFilter] = useState<string>("all");
  const [ownerFilter, setOwnerFilter] = useState<string>("all");
  const [openOutlet, setOpenOutlet] = useState(false);
  const [openOwner, setOpenOwner] = useState(false);

  const [selectedTopup, setSelectedTopup] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const formatDateTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      const timeStr = format(date, "HH:mm", { locale: id });
      const fullDateStr = format(date, "dd MMM yyyy", { locale: id });
      return {
        display: isToday
          ? `Hari Ini, ${timeStr} WIB`
          : `${fullDateStr} • ${timeStr} WIB`,
        isToday,
      };
    } catch (e) {
      return { display: "-", isToday: false };
    }
  };

  const fetchTopups = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (methodFilter !== "all") params.append("metode", methodFilter);
      if (startDate)
        params.append("start_date", format(startDate, "yyyy-MM-dd"));
      if (endDate) params.append("end_date", format(endDate, "yyyy-MM-dd"));

      const res = await topupService.getAll(params.toString());
      // 🛡️ PROTEKSI: Pastikan data selalu array, jangan biarkan null masuk ke state
      setData(res.data || []);
    } catch (err) {
      toast.error("Gagal mengambil data transaksi");
      setData([]); // Reset ke array kosong jika error
    } finally {
      setLoading(false);
    }
  }, [statusFilter, methodFilter, startDate, endDate]);

  useEffect(() => {
    fetchTopups();
  }, [fetchTopups]);

  // 🛡️ PROTEKSI: Tambahkan optional chaining (?.) dan default array ([])
  const uniqueOutlets = useMemo(
    () =>
      Array.from(
        new Set((data || []).map((item) => item?.outlet_name).filter(Boolean)),
      ),
    [data],
  );

  const uniqueOwners = useMemo(
    () =>
      Array.from(
        new Set((data || []).map((item) => item?.owner_name).filter(Boolean)),
      ),
    [data],
  );

  const filteredData = useMemo(() => {
    return (data || []).filter((item) => {
      if (!item) return false;
      const cleanSearch = searchQuery
        .replace(/[^a-zA-Z0-9]/g, "")
        .toLowerCase();
      const cleanID = (item.tk_id || "")
        .replace(/[^a-zA-Z0-9]/g, "")
        .toLowerCase();

      const matchesSearch = cleanID.includes(cleanSearch);
      const matchesOutlet =
        outletFilter === "all" || item.outlet_name === outletFilter;
      const matchesOwner =
        ownerFilter === "all" || item.owner_name === ownerFilter;

      return matchesSearch && matchesOutlet && matchesOwner;
    });
  }, [data, searchQuery, outletFilter, ownerFilter]);

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setMethodFilter("all");
    setOutletFilter("all");
    setOwnerFilter("all");
    setStartDate(undefined);
    setEndDate(undefined);
  };

  const handleAction = async (id: string, status: "success" | "failed") => {
    setConfirming(true);
    try {
      const res = await topupService.confirm(id, status);
      if (res.status) {
        toast.success(
          status === "success" ? "Koin Berhasil Dicairkan!" : "Tagihan Ditolak",
        );
        setIsPreviewOpen(false);
        fetchTopups();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal memproses aksi");
    } finally {
      setConfirming(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-orange-50 text-orange-600 border-orange-100";
      case "success":
        return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "failed":
        return "bg-rose-50 text-rose-600 border-rose-100";
      default:
        return "bg-slate-50 text-slate-500 border-slate-100";
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-[1600px] mx-auto px-4 lg:px-0">
      {/* HEADER */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-orange-50 rounded-[24px]">
            <Wallet2 className="h-8 w-8 text-[#FF4500]" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight leading-none mb-2">
              Billing <span className="text-[#FF4500]">& Topups</span>
            </h2>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">
              Sistem Manajemen Ekonomi Platform
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-3xl border border-slate-100">
          <div className="px-6 border-r border-slate-200">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter italic">
              Total Terfilter
            </p>
            <p className="text-xl font-black text-slate-800 leading-none">
              {filteredData.length}
            </p>
          </div>
          <Button
            onClick={fetchTopups}
            className="rounded-2xl h-12 bg-slate-900 hover:bg-black text-white px-6 font-black text-[11px] uppercase gap-2 transition-all active:scale-95"
          >
            <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />{" "}
            Muat Ulang
          </Button>
        </div>
      </div>

      {/* FILTER TOOLBAR */}
      <Card className="p-5 rounded-[35px] border-none shadow-sm bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3 items-end">
          <div className="xl:col-span-2 space-y-1.5">
            <label className="font-black uppercase text-slate-400 ml-2 tracking-widest text-[10px]">
              Cari Transaksi
            </label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-300" />
              <Input
                placeholder="Cari berdasarkan ID transaksi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 rounded-xl border-slate-100 bg-slate-50/50 text-[12px] font-bold focus-visible:ring-[#FF4500]/10"
              />
            </div>
          </div>

          {/* Searchable Outlet */}
          <div className="space-y-1.5">
            <label className="font-black uppercase text-slate-400 ml-2 tracking-widest text-[10px]">
              Outlet
            </label>
            <Popover open={openOutlet} onOpenChange={setOpenOutlet}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full h-11 justify-between rounded-xl border-slate-100 bg-slate-50/50 text-[12px] font-bold px-4"
                >
                  <span className="truncate">
                    {outletFilter === "all" ? "Semua Outlet" : outletFilter}
                  </span>
                  <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[250px] p-0 rounded-2xl border-slate-100 shadow-2xl overflow-hidden">
                <Command>
                  <CommandInput
                    placeholder="Cari outlet..."
                    className="h-10 text-[12px] font-bold"
                  />
                  <CommandList>
                    <CommandEmpty className="p-4 text-[11px] text-center font-bold text-slate-400 uppercase">
                      Tidak ditemukan.
                    </CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        onSelect={() => {
                          setOutletFilter("all");
                          setOpenOutlet(false);
                        }}
                        className="text-[12px] font-bold"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-3 w-3",
                            outletFilter === "all"
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />{" "}
                        Semua Outlet
                      </CommandItem>
                      {uniqueOutlets.map((name) => (
                        <CommandItem
                          key={name}
                          onSelect={() => {
                            setOutletFilter(name);
                            setOpenOutlet(false);
                          }}
                          className="text-[12px] font-bold"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-3 w-3",
                              outletFilter === name
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />{" "}
                          {name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Searchable Owner */}
          <div className="space-y-1.5">
            <label className="font-black uppercase text-slate-400 ml-2 tracking-widest text-[10px]">
              Pemilik
            </label>
            <Popover open={openOwner} onOpenChange={setOpenOwner}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full h-11 justify-between rounded-xl border-slate-100 bg-slate-50/50 text-[12px] font-bold px-4"
                >
                  <span className="truncate">
                    {ownerFilter === "all" ? "Semua Pemilik" : ownerFilter}
                  </span>
                  <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[250px] p-0 rounded-2xl border-slate-100 shadow-2xl overflow-hidden">
                <Command>
                  <CommandInput
                    placeholder="Cari pemilik..."
                    className="h-10 text-[12px] font-bold"
                  />
                  <CommandList>
                    <CommandEmpty className="p-4 text-[11px] text-center font-bold text-slate-400 uppercase">
                      Tidak ditemukan.
                    </CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        onSelect={() => {
                          setOwnerFilter("all");
                          setOpenOwner(false);
                        }}
                        className="text-[12px] font-bold"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-3 w-3",
                            ownerFilter === "all" ? "opacity-100" : "opacity-0",
                          )}
                        />{" "}
                        Semua Pemilik
                      </CommandItem>
                      {uniqueOwners.map((name) => (
                        <CommandItem
                          key={name}
                          onSelect={() => {
                            setOwnerFilter(name);
                            setOpenOwner(false);
                          }}
                          className="text-[12px] font-bold"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-3 w-3",
                              ownerFilter === name
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />{" "}
                          {name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Shadcn Calendar - Mulai */}
          <div className="space-y-1.5">
            <label className="font-black uppercase text-slate-400 ml-2 tracking-widest text-[10px]">
              Tgl Mulai
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full h-11 justify-start text-left font-bold rounded-xl border-slate-100 bg-slate-50/50 text-[12px]",
                    !startDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? (
                    format(startDate, "dd/MM/yyyy")
                  ) : (
                    <span>Pilih Tanggal</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-2xl">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                  locale={id}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Shadcn Calendar - Selesai */}
          <div className="space-y-1.5">
            <label className="font-black uppercase text-slate-400 ml-2 tracking-widest text-[10px]">
              Tgl Selesai
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full h-11 justify-start text-left font-bold rounded-xl border-slate-100 bg-slate-50/50 text-[12px]",
                    !endDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? (
                    format(endDate, "dd/MM/yyyy")
                  ) : (
                    <span>Pilih Tanggal</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-2xl">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                  locale={id}
                />
              </PopoverContent>
            </Popover>
          </div>

          <Button
            variant="outline"
            onClick={resetFilters}
            className="h-11 rounded-xl border-slate-100 text-[11px] font-black uppercase text-slate-400 hover:text-rose-500 hover:bg-rose-50/50"
          >
            <FilterX className="h-3 w-3 mr-2" /> Reset
          </Button>
        </div>

        <div className="mt-5 pt-5 border-t border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4 text-[11px]">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="font-black text-slate-300 uppercase whitespace-nowrap mr-2 tracking-widest text-[10px]">
              Status:
            </span>
            {["all", "pending", "success", "failed"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "px-5 py-2 rounded-full font-black uppercase transition-all border",
                  statusFilter === s
                    ? "bg-slate-900 text-white border-slate-900 shadow-md"
                    : "bg-white text-slate-400 border-slate-100 hover:border-slate-300",
                )}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="font-black text-slate-300 uppercase whitespace-nowrap mr-2 tracking-widest text-[10px]">
              Metode:
            </span>
            {["all", "transfer", "midtrans"].map((m) => (
              <button
                key={m}
                onClick={() => setMethodFilter(m)}
                className={cn(
                  "px-5 py-2 rounded-full font-black uppercase transition-all border",
                  methodFilter === m
                    ? "bg-[#FF4500] text-white border-[#FF4500] shadow-md"
                    : "bg-white text-slate-400 border-slate-100 hover:border-[#FF4500]/30",
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* DATA TABLE */}
      <Card className="border-none shadow-xl shadow-slate-100/50 rounded-[45px] overflow-hidden bg-white border border-slate-50 relative min-h-[400px]">
        {/* 🚀 LOGIC LOADING STATE */}
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm z-10">
            <LoaderIcon className="h-12 w-12 animate-spin text-[#FF4500]" />
            <p className="mt-4 font-black text-[11px] text-slate-400 uppercase tracking-[0.2em]">
              Menyinkronkan Data...
            </p>
          </div>
        ) : filteredData.length === 0 ? (
          /* 🚀 LOGIC EMPTY STATE (PROPER CENTERED) */
          <div className="py-32 flex flex-col items-center justify-center space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-slate-100 rounded-full scale-150 blur-2xl opacity-50" />
              <div className="relative p-8 bg-slate-50 rounded-[40px] border-4 border-white shadow-inner">
                <FilterX className="h-16 w-16 text-slate-200" />
              </div>
            </div>
            <div className="text-center space-y-2 relative">
              <h3 className="font-black text-slate-800 uppercase tracking-tighter text-lg">
                Data Tidak Ditemukan
              </h3>
              <p className="font-bold text-slate-400 text-[11px] uppercase tracking-widest max-w-[280px] mx-auto leading-relaxed">
                Coba sesuaikan filter atau kata kunci pencarian Anda
              </p>
              <Button
                variant="ghost"
                onClick={resetFilters}
                className="mt-4 rounded-xl text-[10px] font-black uppercase text-[#FF4500] hover:bg-orange-50"
              >
                Reset Filter
              </Button>
            </div>
          </div>
        ) : (
          /* 🚀 TABLE CONTENT (ONLY SHOW IF DATA EXISTS) */
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="p-7 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    Transaksi
                  </th>
                  <th className="p-7 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    Partner Identity
                  </th>
                  <th className="p-7 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">
                    Nominal
                  </th>
                  <th className="p-7 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    Gateway
                  </th>
                  <th className="p-7 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    Status
                  </th>
                  <th className="p-7 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">
                    Detail
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-[13px]">
                {filteredData.map((item) => {
                  const dt = formatDateTime(item.tk_created);
                  return (
                    <tr
                      key={item.tk_id}
                      className="hover:bg-slate-50/30 transition-all group"
                    >
                      <td className="p-7">
                        <p className="font-black text-slate-700 mb-0.5 text-[13px]">
                          {item.tk_id}
                        </p>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-2.5 w-2.5 text-slate-300" />
                          <p
                            className={cn(
                              "font-bold italic leading-none uppercase text-[11px]",
                              dt.isToday ? "text-orange-500" : "text-slate-400",
                            )}
                          >
                            {dt.display}
                          </p>
                        </div>
                      </td>
                      <td className="p-7">
                        <div className="flex items-center gap-2 mb-1 font-black text-slate-800 uppercase italic leading-none text-[13px]">
                          <Store className="h-3 w-3 text-[#FF4500]" />{" "}
                          {item.outlet_name}
                        </div>
                        <div className="flex items-center gap-1.5 ml-5 font-bold text-slate-400 italic text-[12px]">
                          <User2 className="h-2.5 w-2.5 text-slate-300" />{" "}
                          {item.owner_name}
                        </div>
                      </td>
                      <td className="p-7 text-center">
                        <div className="bg-orange-50/50 py-2 px-4 rounded-2xl border border-orange-100/50 inline-flex items-center gap-2 shadow-sm">
                          <span className="font-black text-[#FF4500] italic text-[13px]">
                            {item.tk_jumlah?.toLocaleString() || 0}
                          </span>
                          <span className="font-black text-orange-300 uppercase text-[9px]">
                            Koin
                          </span>
                        </div>
                        <p className="mt-1.5 italic tracking-tighter leading-none uppercase text-[11px] font-bold text-slate-400">
                          Rp {item.tk_total?.toLocaleString("id-ID") || 0}
                        </p>
                      </td>
                      <td className="p-7">
                        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 w-fit">
                          {item.tk_metode_bayar === "transfer" ? (
                            <ArrowRightLeft className="h-3 w-3 text-blue-500" />
                          ) : (
                            <CreditCard className="h-3 w-3 text-amber-500" />
                          )}
                          <span className="font-black uppercase text-slate-600 tracking-tighter text-[11px]">
                            {item.tk_metode_bayar}
                          </span>
                        </div>
                      </td>
                      <td className="p-7">
                        <Badge
                          className={cn(
                            "rounded-full px-5 py-1 font-black uppercase border text-[11px]",
                            getStatusStyle(item.tk_status),
                          )}
                        >
                          {item.tk_status}
                        </Badge>
                      </td>
                      <td className="p-7 text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-11 w-11 rounded-2xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                          onClick={() => {
                            setSelectedTopup(item);
                            setIsPreviewOpen(true);
                          }}
                        >
                          <ChevronRight className="h-6 w-6" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* DETAIL MODAL */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="rounded-[50px] p-0 border-none max-w-lg bg-white overflow-hidden shadow-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Detail Transaksi Topup</DialogTitle>
          </DialogHeader>

          <div className="p-10 space-y-8">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-slate-900 rounded-[22px] shadow-xl">
                <ShieldCheck className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-black uppercase text-slate-800 tracking-tighter leading-none mb-1 text-[13px] md:text-[16px]">
                  Portal <span className="text-[#FF4500]">Validasi</span>
                </h3>
                <div className="flex items-center gap-2">
                  <span className="font-black text-slate-400 uppercase tracking-widest italic text-[11px]">
                    {selectedTopup?.tk_id}
                  </span>
                  {selectedTopup && (
                    <Badge
                      variant="outline"
                      className="font-black uppercase border-slate-100 text-slate-400 text-[10px]"
                    >
                      {formatDateTime(selectedTopup.tk_created).display}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {selectedTopup && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-2">
                    <label className="font-black uppercase text-slate-400 tracking-widest text-[10px]">
                      Bukti Pembayaran
                    </label>
                    {selectedTopup.tk_bukti && (
                      <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-black italic tracking-widest text-[10px]">
                        Bukti Tersedia
                      </Badge>
                    )}
                  </div>

                  {selectedTopup.tk_bukti ? (
                    <div className="group relative aspect-[4/3] rounded-[35px] overflow-hidden border-[6px] border-slate-50 shadow-xl transition-all duration-500 hover:scale-[1.02]">
                      <img
                        src={`${API_URL}${selectedTopup.tk_bukti}`}
                        className="w-full h-full object-cover"
                        alt="payment-proof"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <a
                          href={`${API_URL}${selectedTopup.tk_bukti}`}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-white text-black px-6 py-3 rounded-2xl font-black uppercase flex items-center gap-2 shadow-2xl transition-transform active:scale-90 text-[11px]"
                        >
                          <ExternalLink className="h-4 w-4" /> Lihat Ukuran
                          Penuh
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-[4/3] rounded-[35px] bg-slate-50 border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-slate-300">
                      <Clock className="h-10 w-10 mb-2 opacity-20" />
                      <span className="font-black uppercase tracking-widest italic text-[11px]">
                        Menunggu Bukti Pembayaran
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 bg-slate-50 rounded-[30px] border border-slate-100 flex flex-col justify-center items-center">
                    <span className="font-black text-slate-400 uppercase mb-1 text-[10px]">
                      Metode Pembayaran
                    </span>
                    <span className="font-black uppercase text-slate-700 italic tracking-tighter text-[13px]">
                      {selectedTopup.tk_metode_bayar}
                    </span>
                  </div>
                  <div className="p-6 bg-orange-50/50 rounded-[30px] border border-orange-100 flex flex-col justify-center items-center">
                    <span className="font-black text-[#FF4500] uppercase mb-1 text-[10px]">
                      Jumlah Koin
                    </span>
                    <span className="font-black text-[#FF4500] italic text-[13px]">
                      {selectedTopup.tk_jumlah?.toLocaleString() || 0} KOIN
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-10 bg-slate-50 flex flex-col gap-4 border-t border-slate-100">
            {selectedTopup?.tk_status === "pending" &&
            selectedTopup?.tk_metode_bayar === "transfer" ? (
              <div className="flex gap-4">
                <Button
                  disabled={confirming || !selectedTopup.tk_bukti}
                  variant="ghost"
                  onClick={() => handleAction(selectedTopup.tk_id, "failed")}
                  className="h-16 flex-1 rounded-[25px] font-black uppercase tracking-widest text-rose-500 border border-rose-100 transition-all hover:bg-rose-50 text-[11px]"
                >
                  Tolak
                </Button>
                <Button
                  disabled={confirming || !selectedTopup.tk_bukti}
                  onClick={() => handleAction(selectedTopup.tk_id, "success")}
                  className="h-16 flex-[1.5] rounded-[25px] bg-slate-900 hover:bg-black text-white font-black uppercase tracking-widest shadow-xl transition-all active:scale-95 text-[11px]"
                >
                  {confirming ? (
                    <LoaderIcon className="animate-spin h-4 w-4 mr-2" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 mr-2 text-orange-400" />
                  )}
                  Konfirmasi & Cairkan
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => setIsPreviewOpen(false)}
                className="w-full h-16 rounded-[25px] bg-white text-slate-500 font-black uppercase border border-slate-200 shadow-sm hover:bg-slate-50 transition-all text-[11px]"
              >
                Tutup Jendela Validasi
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
