"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Clock,
  RefreshCw,
  Search,
  Store,
  User2,
  Calendar as CalendarIcon,
  FilterX,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  CreditCard,
  ArrowRightLeft,
  Loader2 as LoaderIcon,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
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
import { addonService, AddonTransaction, AddonStatus } from "@/services/addon.service";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { AxiosError } from "axios";
import { ApiErrorResponse } from "@/types/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.ayocuci.id";

export default function SubscriptionsPage() {
  const [data, setData] = useState<AddonTransaction[]>([]);
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
  const [openOutlet, setOpenOutlet] = useState(false);

  const [selectedTrx, setSelectedTrx] = useState<AddonTransaction | null>(null);
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
    } catch {
      return { display: "-", isToday: false };
    }
  };

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (methodFilter !== "all") params.append("metode", methodFilter);
      if (startDate)
        params.append("start_date", format(startDate, "yyyy-MM-dd"));
      if (endDate) params.append("end_date", format(endDate, "yyyy-MM-dd"));

      const res = await addonService.getAll(params.toString());
      setData(res.data || []);
    } catch {
      toast.error("Gagal mengambil data transaksi");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, methodFilter, startDate, endDate]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const uniqueOutlets = useMemo(
    () =>
      Array.from(
        new Set(
          (data || [])
            .map((item) => item?.outlet_name)
            .filter((name): name is string => Boolean(name)),
        ),
      ),
    [data],
  );

  const filteredData = useMemo(() => {
    return (data || []).filter((item) => {
      if (!item) return false;
      const cleanSearch = searchQuery
        .replace(/[^a-zA-Z0-9]/g, "")
        .toLowerCase();
      const cleanID = (item.ha_id || "")
        .replace(/[^a-zA-Z0-9]/g, "")
        .toLowerCase();
      const cleanItemNames = (item.item_names || "").toLowerCase();

      const matchesSearch = cleanID.includes(cleanSearch) || cleanItemNames.includes(cleanSearch);
      const matchesOutlet =
        outletFilter === "all" || item.outlet_name === outletFilter;

      return matchesSearch && matchesOutlet;
    });
  }, [data, searchQuery, outletFilter]);

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setMethodFilter("all");
    setOutletFilter("all");
    setStartDate(undefined);
    setEndDate(undefined);
  };

  const handleApprove = async (id: string) => {
    setConfirming(true);
    try {
      const res = await addonService.approve(id);
      if (res.status) {
        toast.success("Transaksi berhasil divalidasi!");
        setIsPreviewOpen(false);
        fetchTransactions();
      }
    } catch (err) {
      const error = err as AxiosError<ApiErrorResponse>;
      toast.error(error.response?.data?.message || "Gagal memproses approval");
    } finally {
      setConfirming(false);
    }
  };

  const handleReject = async (id: string) => {
    setConfirming(true);
    try {
      const res = await addonService.reject(id);
      if (res.status) {
        toast.success("Bukti transfer ditolak");
        setIsPreviewOpen(false);
        fetchTransactions();
      }
    } catch (err) {
      const error = err as AxiosError<ApiErrorResponse>;
      toast.error(error.response?.data?.message || "Gagal menolak transaksi");
    } finally {
      setConfirming(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-orange-50 text-orange-600 border-orange-100";
      case "PENDING_VALIDATION":
        return "bg-blue-50 text-blue-600 border-blue-100";
      case "SUCCESS":
        return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "FAILED":
        return "bg-rose-50 text-rose-600 border-rose-100";
      case "CANCELED":
        return "bg-slate-50 text-slate-400 border-slate-100";
      default:
        return "bg-slate-50 text-slate-500 border-slate-100";
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-[1600px] mx-auto px-4 lg:px-0">
      {/* HEADER */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-blue-50 rounded-[24px]">
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight leading-none mb-2">
              Management <span className="text-blue-600">Addons & Pro</span>
            </h2>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">
              Validasi Aktivasi Akun & Pembelian Fitur Addon
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
            onClick={fetchTransactions}
            className="rounded-2xl h-12 bg-slate-900 hover:bg-black text-white px-6 font-black text-[11px] uppercase gap-2 transition-all active:scale-95"
          >
            <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />{" "}
            Muat Ulang
          </Button>
        </div>
      </div>

      {/* FILTER TOOLBAR */}
      <Card className="p-5 rounded-[35px] border-none shadow-sm bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3 items-end">
          <div className="xl:col-span-2 space-y-1.5">
            <label className="font-black uppercase text-slate-400 ml-2 tracking-widest text-[10px]">
              Cari Transaksi / Fitur
            </label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-300" />
              <Input
                placeholder="Cari ID atau nama fitur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 rounded-xl border-slate-100 bg-slate-50/50 text-[12px] font-bold focus-visible:ring-blue-600/10"
              />
            </div>
          </div>

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
            {["all", "PENDING", "PENDING_VALIDATION", "SUCCESS", "FAILED", "CANCELED"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "px-5 py-2 rounded-full font-black uppercase transition-all border",
                  statusFilter === s
                    ? "bg-blue-600 text-white border-blue-600 shadow-md"
                    : "bg-white text-slate-400 border-slate-100 hover:border-slate-300",
                )}
              >
                {s.replace("_", " ")}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="font-black text-slate-300 uppercase whitespace-nowrap mr-2 tracking-widest text-[10px]">
              Metode:
            </span>
            {["all", "KOIN", "TRANSFER", "MIDTRANS"].map((m) => (
              <button
                key={m}
                onClick={() => setMethodFilter(m)}
                className={cn(
                  "px-5 py-2 rounded-full font-black uppercase transition-all border",
                  methodFilter === m
                    ? "bg-blue-600 text-white border-blue-600 shadow-md"
                    : "bg-white text-slate-400 border-slate-100 hover:border-blue-600/30",
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
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm z-10">
            <LoaderIcon className="h-12 w-12 animate-spin text-blue-600" />
            <p className="mt-4 font-black text-[11px] text-slate-400 uppercase tracking-[0.2em]">
              Menyinkronkan Data...
            </p>
          </div>
        ) : filteredData.length === 0 ? (
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
                className="mt-4 rounded-xl text-[10px] font-black uppercase text-blue-600 hover:bg-blue-50"
              >
                Reset Filter
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="p-7 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    Transaksi
                  </th>
                  <th className="p-7 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    Outlet & Pemilik
                  </th>
                  <th className="p-7 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    Fitur / Item
                  </th>
                  <th className="p-7 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">
                    Nominal
                  </th>
                  <th className="p-7 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    Metode & Status
                  </th>
                  <th className="p-7 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">
                    Detail
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-[13px]">
                {filteredData.map((item) => {
                  const dt = formatDateTime(item.ha_created);
                  return (
                    <tr
                      key={item.ha_id}
                      className="hover:bg-slate-50/30 transition-all group"
                    >
                      <td className="p-7">
                        <p className="font-black text-slate-700 mb-0.5 text-[13px]">
                          {item.ha_id}
                        </p>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-2.5 w-2.5 text-slate-300" />
                          <p
                            className={cn(
                              "font-bold italic leading-none uppercase text-[11px]",
                              dt.isToday ? "text-blue-500" : "text-slate-400",
                            )}
                          >
                            {dt.display}
                          </p>
                        </div>
                      </td>
                      <td className="p-7">
                        <div className="flex items-center gap-2 mb-1 font-black text-slate-800 uppercase italic leading-none text-[13px]">
                          <Store className="h-3 w-3 text-blue-600" />{" "}
                          {item.outlet_name}
                        </div>
                        <div className="flex items-center gap-1.5 ml-5 font-bold text-slate-400 italic text-[12px]">
                          <User2 className="h-2.5 w-2.5 text-slate-300" />{" "}
                          {item.owner_name}
                        </div>
                      </td>
                      <td className="p-7">
                        <div className="max-w-[200px]">
                           <p className="font-black text-slate-700 uppercase tracking-tighter truncate">
                             {item.item_names}
                           </p>
                        </div>
                      </td>
                      <td className="p-7 text-center">
                        <div className="bg-blue-50/50 py-2 px-4 rounded-2xl border border-blue-100/50 inline-flex flex-col items-center shadow-sm">
                           <span className="font-black text-blue-600 italic text-[13px]">
                             Rp {item.ha_total?.toLocaleString("id-ID") || 0}
                           </span>
                        </div>
                      </td>
                      <td className="p-7">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 w-fit">
                            {item.ha_metode_bayar === "TRANSFER" ? (
                              <ArrowRightLeft className="h-3 w-3 text-blue-500" />
                            ) : item.ha_metode_bayar === "MIDTRANS" ? (
                              <CreditCard className="h-3 w-3 text-amber-500" />
                            ) : (
                              <Badge className="h-3 w-3 p-0 rounded-full bg-orange-500" />
                            )}
                            <span className="font-black uppercase text-slate-600 tracking-tighter text-[11px]">
                              {item.ha_metode_bayar}
                            </span>
                          </div>
                          <Badge
                            className={cn(
                              "rounded-full px-5 py-1 font-black uppercase border text-[10px]",
                              getStatusStyle(item.ha_status),
                            )}
                          >
                            {item.ha_status.replace("_", " ")}
                          </Badge>
                        </div>
                      </td>
                      <td className="p-7 text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-11 w-11 rounded-2xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                          onClick={() => {
                            setSelectedTrx(item);
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
        <DialogContent className="rounded-xl p-0 border-none max-w-lg bg-white overflow-hidden shadow-2xl">
          <VisuallyHidden.Root>
            <DialogTitle>Detail Transaksi Addon</DialogTitle>
          </VisuallyHidden.Root>

          <div className="p-5 space-y-8">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-slate-900 rounded-[22px] shadow-xl">
                <ShieldCheck className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-black uppercase text-slate-800 tracking-tighter leading-none mb-1 text-[16px]">
                  Portal <span className="text-blue-600">Validasi</span>
                </h3>
                <div className="flex items-center gap-2">
                  <span className="font-black text-slate-400 uppercase tracking-widest italic text-[11px]">
                    {selectedTrx?.ha_id}
                  </span>
                  {selectedTrx && (
                    <Badge
                      variant="outline"
                      className="font-black uppercase border-slate-100 text-slate-400 text-[10px]"
                    >
                      {formatDateTime(selectedTrx.ha_created).display}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {selectedTrx && (
              <div className="space-y-6">
                {/* 🚀 BUKTI PEMBAYARAN: Hanya muncul jika BUKAN Midtrans & Koin */}
                {selectedTrx.ha_metode_bayar === "TRANSFER" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-2">
                      <label className="font-black uppercase text-slate-400 tracking-widest text-[10px]">
                        Bukti Pembayaran
                      </label>
                      {selectedTrx.ha_bukti && (
                        <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-black italic tracking-widest text-[10px]">
                          Bukti Tersedia
                        </Badge>
                      )}
                    </div>

                    {selectedTrx.ha_bukti ? (
                      <div className="group relative aspect-[4/3] rounded-[35px] overflow-hidden border-[6px] border-slate-50 shadow-xl transition-all duration-500 hover:scale-[1.02]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`${API_URL}${selectedTrx.ha_bukti}`}
                          className="w-full h-full object-cover"
                          alt="payment-proof"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <a
                            href={`${API_URL}${selectedTrx.ha_bukti}`}
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
                )}

                {/* INFO RINGKASAN */}
                <div className="space-y-4">
                  <div className="p-6 bg-slate-50 rounded-[30px] border border-slate-100">
                     <span className="font-black text-slate-400 uppercase mb-2 text-[10px] block">
                        Item / Layanan
                     </span>
                     <p className="font-black text-slate-800 uppercase tracking-tight leading-relaxed">
                        {selectedTrx.item_names}
                     </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 bg-slate-50 rounded-[30px] border border-slate-100 flex flex-col justify-center items-center text-center">
                      <span className="font-black text-slate-400 uppercase mb-1 text-[10px]">
                        Metode
                      </span>
                      <span className="font-black uppercase text-slate-700 italic tracking-tighter text-[13px]">
                        {selectedTrx.ha_metode_bayar}
                      </span>
                    </div>
                    <div className="p-6 bg-blue-50/50 rounded-[30px] border border-blue-100 flex flex-col justify-center items-center text-center">
                      <span className="font-black text-blue-600 uppercase mb-1 text-[10px]">
                        Total Bayar
                      </span>
                      <span className="font-black text-blue-600 italic text-[13px]">
                        Rp {selectedTrx.ha_total?.toLocaleString("id-ID") || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-5 bg-slate-50 flex flex-col gap-4 border-t border-slate-100">
            {selectedTrx?.ha_status === "PENDING" || selectedTrx?.ha_status === "PENDING_VALIDATION" ? (
              <div className="flex gap-4">
                 <Button
                    disabled={confirming || !selectedTrx.ha_bukti}
                    onClick={() => handleApprove(selectedTrx.ha_id)}
                    className="flex-1 h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase text-[12px] shadow-lg shadow-emerald-200 transition-all active:scale-95 gap-2"
                  >
                    <Check className="h-5 w-5" /> Konfirmasi Lunas
                  </Button>
                  <Button
                    disabled={confirming}
                    variant="outline"
                    onClick={() => handleReject(selectedTrx.ha_id)}
                    className="flex-1 h-14 rounded-2xl bg-white border-rose-100 text-rose-500 hover:bg-rose-50 font-black uppercase text-[12px] transition-all active:scale-95"
                  >
                    Tolak Bukti
                  </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center p-4 bg-white rounded-2xl border border-slate-100">
                 <p className="font-black text-slate-300 uppercase tracking-widest text-[11px] italic">
                   Transaksi Berstatus {selectedTrx?.ha_status}
                 </p>
              </div>
            )}
            
            <p className="text-[10px] text-center font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
              Tindakan ini akan mempengaruhi akses fitur <br />
              langsung ke akun tenant terkait secara realtime.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
