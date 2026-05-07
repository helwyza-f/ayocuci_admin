"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  Clock,
  RefreshCw,
  Search,
  Store,
  User2,
  Calendar as CalendarIcon,
  FilterX,
  ChevronRight,
  ExternalLink,
  CreditCard,
  ArrowRightLeft,
  Loader2 as LoaderIcon,
  Check,
  ChevronsUpDown,
  History,
  Activity,
  ArrowUpRight,
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
import { addonService, AddonTransaction } from "@/services/addon.service";
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
      const fullDateStr = format(date, "dd/MM/yy", { locale: id });
      return {
        display: isToday
          ? `Today, ${timeStr}`
          : `${fullDateStr} ${timeStr}`,
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
      toast.error("Failed to sync transactions");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, methodFilter, startDate, endDate]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const stats = useMemo(() => {
    const total = data.length;
    const pending = data.filter(d => d.ha_status === 'PENDING_VALIDATION').length;
    const success = data.filter(d => d.ha_status === 'SUCCESS').length;
    return { total, pending, success };
  }, [data]);

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
      const cleanSearch = searchQuery.toLowerCase();
      const matchesSearch = 
        item.ha_id.toLowerCase().includes(cleanSearch) || 
        item.item_names.toLowerCase().includes(cleanSearch);
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
        toast.success("Transaction verified successfully");
        setIsPreviewOpen(false);
        fetchTransactions();
      }
    } catch (err) {
      const error = err as AxiosError<ApiErrorResponse>;
      toast.error(error.response?.data?.message || "Verification failed");
    } finally {
      setConfirming(false);
    }
  };

  const handleReject = async (id: string) => {
    setConfirming(true);
    try {
      const res = await addonService.reject(id);
      if (res.status) {
        toast.success("Transaction rejected");
        setIsPreviewOpen(false);
        fetchTransactions();
      }
    } catch (err) {
      const error = err as AxiosError<ApiErrorResponse>;
      toast.error(error.response?.data?.message || "Rejection failed");
    } finally {
      setConfirming(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "PENDING":
        return { label: "Waiting Payment", class: "bg-amber-50 text-amber-600 border-amber-100" };
      case "PENDING_VALIDATION":
        return { label: "Need Review", class: "bg-indigo-50 text-indigo-600 border-indigo-100 animate-pulse" };
      case "SUCCESS":
        return { label: "Active", class: "bg-emerald-50 text-emerald-600 border-emerald-100" };
      case "FAILED":
        return { label: "Rejected", class: "bg-rose-50 text-rose-600 border-rose-100" };
      case "CANCELED":
        return { label: "Canceled", class: "bg-slate-100 text-slate-500 border-slate-200" };
      default:
        return { label: status, class: "bg-slate-50 text-slate-400 border-slate-100" };
    }
  };

  return (
    <div className="space-y-6">
      {/* COMMAND BAR HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2 font-heading">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Subscriptions Management
          </h1>
          <p className="text-xs font-medium text-slate-500">
            Operational center for license activations and feature addons.
          </p>
        </div>

        <div className="flex items-center gap-2">
           <Button
            variant="ghost"
            size="sm"
            onClick={fetchTransactions}
            disabled={loading}
            className="h-8 px-2 font-bold text-[10px] uppercase tracking-wider gap-2 text-slate-500"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            Sync Data
          </Button>
        </div>
      </div>

      {/* OPERATIONAL METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Request", value: stats.total, icon: Activity, color: "text-slate-600", bg: "bg-white" },
          { label: "Pending Review", value: stats.pending, icon: Clock, color: "text-indigo-600", bg: "bg-indigo-50/30 border-indigo-100/50" },
          { label: "Active Licenses", value: stats.success, icon: Check, color: "text-emerald-600", bg: "bg-white" },
        ].map((stat, i) => (
          <Card key={i} className={cn("p-3 border border-slate-200 shadow-none rounded-lg flex items-center justify-between", stat.bg)}>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">{stat.label}</p>
              <h3 className={cn("text-xl font-bold leading-none", stat.color)}>{stat.value}</h3>
            </div>
            <div className={cn("p-2 rounded bg-white border border-slate-100", stat.color)}>
              <stat.icon className="h-4 w-4" />
            </div>
          </Card>
        ))}
      </div>

      {/* FILTER & SEARCH COMMAND BAR */}
      <Card className="p-1 border border-slate-200 rounded-lg bg-white overflow-hidden shadow-none">
        <div className="flex flex-col lg:flex-row lg:items-center gap-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Filter by ID or Service..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 border-none shadow-none focus-visible:ring-0 text-xs font-medium placeholder:text-slate-400"
            />
          </div>
          
          <div className="h-5 w-px bg-slate-100 hidden lg:block" />

          <div className="flex items-center gap-1 p-1 lg:p-0">
            <Popover open={openOutlet} onOpenChange={setOpenOutlet}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 font-bold text-[10px] px-2 gap-2 text-slate-600">
                  <Store className="h-3 w-3" />
                  {outletFilter === "all" ? "Outlets" : outletFilter}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-0 rounded-md">
                <Command>
                  <CommandInput placeholder="Search outlet..." className="text-xs" />
                  <CommandList>
                    <CommandEmpty className="text-[10px] p-2">No results.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem onSelect={() => { setOutletFilter("all"); setOpenOutlet(false); }} className="text-xs">All Outlets</CommandItem>
                      {uniqueOutlets.map(o => (
                        <CommandItem key={o} onSelect={() => { setOutletFilter(o); setOpenOutlet(false); }} className="text-xs">{o}</CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            <div className="h-4 w-px bg-slate-100" />

            <div className="flex items-center gap-1">
               {["all", "PENDING_VALIDATION", "SUCCESS", "FAILED"].map(s => (
                 <Button
                    key={s}
                    variant={statusFilter === s ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setStatusFilter(s)}
                    className={cn(
                      "h-7 px-2 text-[9px] font-bold uppercase tracking-tight rounded",
                      statusFilter === s ? "bg-primary/10 text-primary" : "text-slate-500"
                    )}
                 >
                   {s === "all" ? "All" : s === "PENDING_VALIDATION" ? "Review" : s}
                 </Button>
               ))}
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={resetFilters}
              className="h-8 w-8 text-slate-400 hover:text-rose-600"
            >
              <FilterX className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </Card>

      {/* OPERATIONAL DATA TABLE */}
      <Card className="border border-slate-200 rounded-lg overflow-hidden bg-white min-h-[400px] relative shadow-none">
        {loading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-50 flex flex-col items-center justify-center">
            <LoaderIcon className="h-6 w-6 animate-spin text-primary" />
            <p className="mt-2 text-[9px] font-bold uppercase tracking-widest text-slate-400">Syncing Ecosystem...</p>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider">Transaction</th>
                <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider">Business</th>
                <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider">Service Item</th>
                <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider text-right">Amount</th>
                <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider text-center">Status</th>
                <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.length === 0 && !loading ? (
                <tr>
                  <td colSpan={6} className="py-24 text-center">
                    <History className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No matching records found</p>
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => {
                  const status = getStatusConfig(item.ha_status);
                  const dt = formatDateTime(item.ha_created);
                  return (
                    <tr key={item.ha_id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-5 py-3">
                        <div className="font-bold text-slate-900 text-xs">#{item.ha_id}</div>
                        <div className="flex items-center gap-1 text-[9px] font-medium text-slate-400 uppercase">
                          {dt.display}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="font-bold text-slate-800 text-xs">{item.outlet_name}</div>
                        <div className="text-[10px] font-medium text-slate-500">{item.owner_name}</div>
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant="outline" className="rounded px-1.5 py-0 text-[8px] font-bold uppercase border-slate-200 bg-slate-50">
                          {item.item_names}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-right font-bold text-slate-900 text-xs">
                        Rp {item.ha_total.toLocaleString("id-ID")}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <Badge className={cn("rounded px-1.5 py-0 text-[8px] font-bold uppercase border shadow-none", status.class)}>
                          {status.label}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setSelectedTrx(item); setIsPreviewOpen(true); }}
                          className="h-7 px-2 font-bold text-[9px] uppercase text-primary hover:bg-primary/5 gap-1"
                        >
                          Details <ChevronRight className="h-3 w-3" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* OPERATIONAL DETAIL MODAL */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden border border-slate-200 rounded-lg shadow-xl bg-white">
          <VisuallyHidden.Root><DialogTitle>Transaction Detail</DialogTitle></VisuallyHidden.Root>
          
          <div className="p-4 border-b border-slate-100 bg-white">
            <div className="flex items-center justify-between mb-3">
              <Badge variant="outline" className="font-bold text-[9px] uppercase tracking-wider text-slate-400 border-slate-200">
                {selectedTrx?.ha_id}
              </Badge>
              <span className="text-[9px] font-medium text-slate-400 uppercase">{selectedTrx && formatDateTime(selectedTrx.ha_created).display}</span>
            </div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight leading-none mb-1 font-heading">
              {selectedTrx?.item_names}
            </h3>
            <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
              <Store className="h-3 w-3" /> {selectedTrx?.outlet_name}
            </p>
          </div>

          <div className="p-4 space-y-4 bg-slate-50/30">
            {/* PROOF OF PAYMENT SECTION */}
            {selectedTrx?.ha_metode_bayar === "TRANSFER" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Payment Evidence</label>
                  {selectedTrx.ha_bukti && (
                    <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-600">
                      <Check className="h-3 w-3" /> Proof Uploaded
                    </div>
                  )}
                </div>

                {selectedTrx.ha_bukti ? (
                   <div className="group relative aspect-video rounded border border-slate-200 overflow-hidden bg-slate-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`${API_URL}${selectedTrx.ha_bukti}`} className="w-full h-full object-cover" alt="Proof" />
                      <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                        <a href={`${API_URL}${selectedTrx.ha_bukti}`} target="_blank" rel="noreferrer" className="bg-white text-slate-900 px-3 py-1.5 rounded font-bold text-[10px] flex items-center gap-2">
                          <ExternalLink className="h-3 w-3" /> Fullscreen
                        </a>
                      </div>
                   </div>
                ) : (
                  <div className="aspect-video rounded bg-slate-100 border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                    <Clock className="h-6 w-6 mb-1 opacity-30" />
                    <p className="text-[9px] font-bold uppercase tracking-widest">Awaiting Upload</p>
                  </div>
                )}
              </div>
            )}

            {/* TRANSACTION SUMMARY */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 bg-white border border-slate-200 rounded">
                <p className="text-[8px] font-bold uppercase text-slate-400 mb-0.5">Method</p>
                <div className="font-bold text-xs text-slate-700 flex items-center gap-1.5 uppercase">
                  {selectedTrx?.ha_metode_bayar === 'TRANSFER' ? <ArrowRightLeft className="h-3 w-3" /> : <CreditCard className="h-3 w-3" />}
                  {selectedTrx?.ha_metode_bayar}
                </div>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded">
                <p className="text-[8px] font-bold uppercase text-slate-400 mb-0.5">Amount</p>
                <div className="font-bold text-xs text-primary">
                  Rp {selectedTrx?.ha_total.toLocaleString("id-ID")}
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-white border-t border-slate-100 flex flex-col gap-2">
            {selectedTrx?.ha_status === "PENDING_VALIDATION" || selectedTrx?.ha_status === "PENDING" ? (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  disabled={confirming || !selectedTrx.ha_bukti}
                  onClick={() => handleApprove(selectedTrx.ha_id)}
                  className="h-10 rounded font-bold text-[10px] uppercase tracking-wider"
                >
                  {confirming ? <LoaderIcon className="h-4 w-4 animate-spin" /> : "Approve"}
                </Button>
                <Button
                  variant="outline"
                  disabled={confirming}
                  onClick={() => handleReject(selectedTrx.ha_id)}
                  className="h-10 rounded font-bold text-[10px] uppercase tracking-wider text-rose-600 border-slate-200"
                >
                  Reject
                </Button>
              </div>
            ) : (
              <div className="p-2.5 bg-slate-50 rounded border border-slate-100 text-center">
                 <p className="text-[9px] font-bold uppercase text-slate-400 tracking-widest italic">
                   Transaction Final: {selectedTrx?.ha_status}
                 </p>
              </div>
            )}
            <p className="text-[8px] text-center font-medium text-slate-400 italic">
               Affects tenant access immediately.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
