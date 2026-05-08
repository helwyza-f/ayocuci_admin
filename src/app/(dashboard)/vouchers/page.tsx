"use client";

import { useEffect, useState } from "react";
import {
  Ticket,
  Plus,
  Power,
  RefreshCcw,
  Calendar,
  Layers,
  Tag,
  Loader2 as LoaderIcon,
  FilterX,
  PlusCircle,
  CalendarDays,
  Info,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api from "@/lib/api-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ApiResponse } from "@/types/api";
import { Voucher } from "@/types/voucher";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { ExportExcelButton } from "@/components/shared/export-excel-button";

export default function VoucherManagementPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    vc_voucher: "",
    vc_jenis: "persen",
    vc_nilai_potongan: "",
    vc_keterangan: "",
    vc_tanggalmulai: "",
    vc_tanggalberakhir: "",
    vc_jumlah_voucher: "",
  });

  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<Voucher[]>>("/vouchers");
      if (res.data.status) setVouchers(res.data.data || []);
    } catch {
      toast.error("Failed to sync voucher data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  const handleCreateVoucher = async () => {
    if (!formData.vc_voucher || !formData.vc_nilai_potongan || !formData.vc_tanggalberakhir) {
      return toast.error("Please complete voucher information");
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        vc_nilai_potongan: Number(formData.vc_nilai_potongan),
        vc_jumlah_voucher: Number(formData.vc_jumlah_voucher),
        vc_tanggalmulai: new Date(formData.vc_tanggalmulai).toISOString(),
        vc_tanggalberakhir: new Date(formData.vc_tanggalberakhir).toISOString(),
      };

      const res = await api.post("/vouchers/", payload);
      if (res.data.status) {
        toast.success("Voucher issued successfully");
        setIsDialogOpen(false);
        setFormData({
          vc_voucher: "",
          vc_jenis: "persen",
          vc_nilai_potongan: "",
          vc_keterangan: "",
          vc_tanggalmulai: "",
          vc_tanggalberakhir: "",
          vc_jumlah_voucher: "",
        });
        fetchVouchers();
      }
    } catch {
      toast.error("Failed to issue voucher");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus: number) => {
    try {
      const res = await api.patch(`/vouchers/${id}/status`, {
        status: currentStatus === 1 ? 0 : 1,
      });
      if (res.data.status) {
        toast.success("Status updated");
        fetchVouchers();
      }
    } catch {
      toast.error("Failed to toggle status");
    }
  };

  return (
    <div className="space-y-6">
      {/* COMMAND BAR HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2 font-heading">
            <Ticket className="h-5 w-5 text-primary" />
            Vouchers & Promos
          </h1>
          <p className="text-xs font-medium text-slate-500">
            Issue and manage discount codes for the ecosystem.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={fetchVouchers}
            variant="ghost"
            size="sm"
            className="h-8 px-2 font-bold text-[10px] uppercase tracking-wider gap-2 text-slate-500"
          >
            <RefreshCcw className={cn("h-3 w-3", loading && "animate-spin")} />
            Sync
          </Button>

          <ExportExcelButton
            data={vouchers}
            filename="vouchers_campaign"
            sheetName="Vouchers"
            columns={[
              { header: "Voucher Code", key: "vc_voucher", width: 20 },
              { header: "Jenis", key: "vc_jenis", width: 12 },
              { header: "Potongan", key: "vc_nilai_potongan", width: 15, format: (v, r) => r.vc_jenis === "persen" ? `${v}%` : (v != null ? `Rp ${Number(v).toLocaleString()}` : "Rp 0") },
              { header: "Keterangan", key: "vc_keterangan", width: 30 },
              { header: "Tgl Mulai", key: "vc_tanggalmulai", width: 20, format: (v) => v ? format(new Date(v), "dd/MM/yyyy") : "" },
              { header: "Tgl Berakhir", key: "vc_tanggalberakhir", width: 20, format: (v) => v ? format(new Date(v), "dd/MM/yyyy") : "" },
              { header: "Jumlah", key: "vc_jumlah_voucher", width: 12 },
              { header: "Sisa", key: "vc_sisa_voucher", width: 12 },
              { header: "Status", key: "vc_status", width: 12, format: (v) => v === 1 ? "Aktif" : "Nonaktif" },
            ]}
          />
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="h-8 px-3 font-bold text-[10px] uppercase tracking-wider gap-2">
                <PlusCircle className="h-4 w-4" /> Issue New
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-lg p-0 border border-slate-200 shadow-xl max-w-lg overflow-hidden bg-white">
               <VisuallyHidden.Root><DialogTitle>Create Campaign Voucher</DialogTitle></VisuallyHidden.Root>
               <div className="p-4 border-b border-slate-100 bg-white">
                  <h3 className="text-sm font-bold uppercase tracking-tight flex items-center gap-2">
                    <Tag className="h-4 w-4 text-primary" /> Create Campaign Voucher
                  </h3>
               </div>

               <div className="p-4 bg-slate-50/30 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 space-y-1">
                      <label className="text-[9px] font-bold uppercase text-slate-400 ml-1">Voucher Code</label>
                      <Input
                        placeholder="e.g. FLASH10"
                        className="rounded border-slate-200 font-bold uppercase h-9 text-xs shadow-none bg-white"
                        value={formData.vc_voucher}
                        onChange={(e) => setFormData({ ...formData, vc_voucher: e.target.value.toUpperCase() })}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase text-slate-400 ml-1">Reward Type</label>
                      <Select value={formData.vc_jenis} onValueChange={(val) => setFormData({ ...formData, vc_jenis: val })}>
                        <SelectTrigger className="rounded border-slate-200 font-bold h-9 bg-white shadow-none text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-md">
                          <SelectItem value="persen" className="text-xs font-bold">Percentage (%)</SelectItem>
                          <SelectItem value="nominal" className="text-xs font-bold">Nominal (Rp)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase text-slate-400 ml-1">Discount Value</label>
                      <Input
                        type="number"
                        placeholder="0"
                        className="rounded border-slate-200 font-bold h-9 text-xs shadow-none bg-white"
                        value={formData.vc_nilai_potongan}
                        onChange={(e) => setFormData({ ...formData, vc_nilai_potongan: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase text-slate-400 ml-1">Starts From</label>
                      <Input
                        type="date"
                        className="rounded border-slate-200 font-bold h-9 text-xs shadow-none bg-white"
                        value={formData.vc_tanggalmulai}
                        onChange={(e) => setFormData({ ...formData, vc_tanggalmulai: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase text-slate-400 ml-1">Expires At</label>
                      <Input
                        type="date"
                        className="rounded border-slate-200 font-bold h-9 text-xs shadow-none bg-white"
                        value={formData.vc_tanggalberakhir}
                        onChange={(e) => setFormData({ ...formData, vc_tanggalberakhir: e.target.value })}
                      />
                    </div>

                    <div className="col-span-2 space-y-1">
                      <label className="text-[9px] font-bold uppercase text-slate-400 ml-1">Description</label>
                      <Input
                        placeholder="Short note about this promo..."
                        className="rounded border-slate-200 font-bold h-9 text-xs shadow-none bg-white"
                        value={formData.vc_keterangan}
                        onChange={(e) => setFormData({ ...formData, vc_keterangan: e.target.value })}
                      />
                    </div>

                    <div className="col-span-2 space-y-1">
                      <label className="text-[9px] font-bold uppercase text-slate-400 ml-1">Total Pool Quota</label>
                      <Input
                        type="number"
                        placeholder="100"
                        className="rounded border-slate-200 font-bold h-9 text-xs shadow-none bg-white"
                        value={formData.vc_jumlah_voucher}
                        onChange={(e) => setFormData({ ...formData, vc_jumlah_voucher: e.target.value })}
                      />
                    </div>
                  </div>
               </div>

               <div className="p-4 bg-white border-t border-slate-100">
                  <Button
                    onClick={handleCreateVoucher}
                    disabled={isSubmitting}
                    className="w-full h-10 rounded font-bold text-[10px] uppercase tracking-wider"
                  >
                    {isSubmitting ? <LoaderIcon className="animate-spin h-4 w-4" /> : <Layers className="h-4 w-4 mr-2" />}
                    Publish Campaign
                  </Button>
               </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* VOUCHER GRID LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 bg-white border border-slate-200 rounded-lg animate-pulse" />
          ))
        ) : vouchers.length === 0 ? (
          <div className="col-span-full py-24 text-center bg-white rounded-lg border border-dashed border-slate-200">
            <Ticket className="h-8 w-8 text-slate-200 mx-auto mb-2" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">No active vouchers found</p>
          </div>
        ) : (
          vouchers.map((v) => (
            <Card
              key={v.vc_id}
              className={cn(
                "group relative p-4 border border-slate-200 rounded-lg bg-white transition-all overflow-hidden shadow-none",
                v.vc_status === 0 && "opacity-60 bg-slate-50 border-slate-100",
              )}
            >
              <div className="flex justify-between items-start mb-4">
                <Badge
                  variant="outline"
                  className={cn(
                    "rounded px-1.5 py-0 text-[8px] font-bold uppercase border shadow-none",
                    v.vc_jenis === "persen" ? "bg-orange-50/50 text-orange-600 border-orange-100" : "bg-emerald-50/50 text-emerald-600 border-emerald-100"
                  )}
                >
                  {v.vc_jenis === "persen" ? "Rate" : "Fixed"}
                </Badge>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-slate-400 hover:text-primary"
                  onClick={() => toggleStatus(v.vc_id, v.vc_status)}
                >
                  <Power
                    className={cn(
                      "w-3.5 h-3.5 transition-colors",
                      v.vc_status === 1 ? "text-emerald-500" : "text-slate-300",
                    )}
                  />
                </Button>
              </div>

              <div className="space-y-0.5 mb-4">
                <h3 className="text-xl font-bold text-slate-900 tracking-tight font-heading leading-none">
                  {v.vc_voucher}
                </h3>
                <p className="text-[10px] font-medium text-slate-500 line-clamp-1">
                  {v.vc_keterangan}
                </p>
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Amount</span>
                  <span className="text-[11px] font-bold text-slate-900">
                    {v.vc_jenis === "persen" ? `${v.vc_nilai_potongan}%` : `Rp ${v.vc_nilai_potongan.toLocaleString("id-ID")}`}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Quota</span>
                  <div className="flex items-center gap-1 text-[11px] font-bold">
                    <span className="text-primary">{v.vc_sisa_voucher}</span>
                    <span className="text-slate-300">/</span>
                    <span className="text-slate-500">{v.vc_jumlah_voucher}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Expiry</span>
                  <div className="flex items-center gap-1 text-[10px] font-medium text-slate-500">
                    <CalendarDays className="h-3 w-3" />
                    {format(new Date(v.vc_tanggalberakhir), "dd/MM/yy")}
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
