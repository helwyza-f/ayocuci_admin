"use client";

import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  X,
  RefreshCw,
  Coins,
  ShieldCheck,
  Zap,
  Percent,
  ArrowDownCircle,
} from "lucide-react";
import { economyService } from "@/services/economy.service";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function KoinPackagesPage() {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [pricePerCoin, setPricePerCoin] = useState<number>(100);

  const [formData, setFormData] = useState({
    jumlah_koin: "",
    discount_pct: "",
  });

  const initData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Get Price Per Coin dari Configs
      const configRes = await economyService.getConfigs();

      // 🛡️ Guard: Sinkronkan dengan struktur API { status: true, data: [...] }
      const configs = (configRes.data as any)?.data || configRes.data || [];

      if (Array.isArray(configs)) {
        const priceConfig = configs.find(
          (c: any) => c.cfg_key === "price_per_coin",
        );
        if (priceConfig) {
          setPricePerCoin(Number(priceConfig.cfg_value));
        }
      }

      // 2. Get Packages
      const res = await economyService.getPackages();
      const incomingData = (res.data as any)?.data || res.data || [];
      setPackages(Array.isArray(incomingData) ? incomingData : []);
    } catch (err) {
      console.error("Economy Sync Error:", err);
      toast.error("Gagal sinkronisasi data ekonomi");
      setPackages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initData();
  }, [initData]);

  const handleCreate = async () => {
    if (!formData.jumlah_koin) return toast.error("Jumlah koin wajib diisi");
    try {
      const res = await economyService.createPackage({
        jumlah_koin: Number(formData.jumlah_koin),
        discount_pct: Number(formData.discount_pct || 0),
      });

      if (
        res.status === 200 ||
        res.status === 201 ||
        (res.data as any)?.status
      ) {
        toast.success("Paket koin berhasil dipublish!");
        setIsAdding(false);
        setFormData({ jumlah_koin: "", discount_pct: "" });
        initData();
      }
    } catch (err) {
      toast.error("Gagal menambah paket koin");
    }
  };

  const handleDelete = async (id: number) => {
    toast.promise(economyService.deletePackage(id), {
      loading: "Sedang menghapus paket...",
      success: () => {
        initData();
        return "Paket berhasil dihapus";
      },
      error: "Gagal menghapus paket",
    });
  };

  // --- HELPER CALCULATOR ---
  const calculatePricing = (koin: number, discountPct: number) => {
    const gross = koin * pricePerCoin;
    const saving = gross * (discountPct / 100);
    const final = gross - saving;

    const formatter = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    });

    return {
      gross: formatter.format(gross),
      saving: formatter.format(saving),
      final: formatter.format(final),
      hasDiscount: discountPct > 0,
    };
  };

  return (
    <div className="space-y-8 pb-20 max-w-[1600px] mx-auto px-4 lg:px-0">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-10 rounded-[50px] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="p-5 bg-orange-50 rounded-[25px]">
            <Coins className="h-8 w-8 text-[#FF4500]" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none mb-2">
              Koin <span className="text-[#FF4500]">Supply</span>
            </h2>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">
              Manajemen Opsi Paket Belanja Koin
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden xl:flex flex-col items-end mr-2 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
              Base Rate
            </span>
            <span className="text-sm font-black text-[#FF4500] italic">
              Rp {pricePerCoin.toLocaleString()}/Koin
            </span>
          </div>
          <Button
            onClick={() => setIsAdding(!isAdding)}
            className={cn(
              "rounded-2xl h-14 px-8 font-black text-[12px] uppercase gap-3 transition-all active:scale-95 shadow-xl",
              isAdding
                ? "bg-slate-100 text-slate-500 hover:bg-slate-200 shadow-none border border-slate-200"
                : "bg-slate-900 hover:bg-black text-white shadow-slate-200",
            )}
          >
            {isAdding ? (
              <X className="h-5 w-5" />
            ) : (
              <Plus className="h-5 w-5" />
            )}
            {isAdding ? "Batal" : "Tambah Item Paket"}
          </Button>
        </div>
      </div>

      {/* FORM ADD PACKAGE */}
      {isAdding && (
        <Card className="p-10 rounded-[45px] border-none shadow-2xl shadow-orange-100/50 bg-white animate-in fade-in zoom-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest text-[11px]">
                Kuantitas Koin
              </label>
              <div className="relative group">
                <Coins className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-[#FF4500] transition-colors" />
                <Input
                  type="number"
                  placeholder="Contoh: 1000"
                  value={formData.jumlah_koin}
                  onChange={(e) =>
                    setFormData({ ...formData, jumlah_koin: e.target.value })
                  }
                  className="pl-14 h-14 rounded-2xl border-slate-100 bg-slate-50/50 font-black text-[13px] focus-visible:ring-[#FF4500]/20 transition-all"
                />
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest text-[11px]">
                Diskon Berlaku (%)
              </label>
              <div className="relative group">
                <Percent className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-[#FF4500] transition-colors" />
                <Input
                  type="number"
                  placeholder="0 - 100"
                  value={formData.discount_pct}
                  onChange={(e) =>
                    setFormData({ ...formData, discount_pct: e.target.value })
                  }
                  className="pl-14 h-14 rounded-2xl border-slate-100 bg-slate-50/50 font-black text-[13px] focus-visible:ring-[#FF4500]/20 transition-all"
                />
              </div>
            </div>
            <Button
              onClick={handleCreate}
              className="h-14 rounded-2xl bg-[#FF4500] hover:bg-orange-600 text-white font-black text-[11px] uppercase tracking-widest shadow-lg shadow-orange-100 transition-all"
            >
              Simpan & Sinkronkan
            </Button>
          </div>
        </Card>
      )}

      {/* PACKAGE GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {loading ? (
          <div className="col-span-full py-40 text-center">
            <RefreshCw className="h-12 w-12 animate-spin mx-auto text-orange-200 mb-6" />
            <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.3em]">
              Syncing Economy...
            </p>
          </div>
        ) : packages.length === 0 ? (
          <div className="col-span-full py-40 text-center bg-slate-50/50 rounded-[60px] border-4 border-dashed border-slate-100">
            <div className="p-8 bg-white rounded-full w-fit mx-auto shadow-sm mb-6">
              <Coins className="h-12 w-12 text-slate-100" />
            </div>
            <h3 className="font-black text-slate-400 uppercase text-sm tracking-widest">
              Belum Ada Paket
            </h3>
          </div>
        ) : (
          packages.map((pkg) => {
            const pricing = calculatePricing(
              pkg.jumlah_koin,
              pkg.discount_pct || 0,
            );
            return (
              <Card
                key={pkg.id}
                className="relative p-10 rounded-[55px] border-none shadow-sm bg-white group hover:shadow-2xl hover:-translate-y-3 transition-all duration-500 overflow-hidden border border-slate-50"
              >
                <div className="absolute -right-8 -top-8 p-14 bg-slate-50 rounded-full group-hover:bg-orange-50 transition-colors duration-500" />

                <div className="flex justify-between items-start mb-10 relative z-10">
                  <div className="p-4 bg-white rounded-[22px] shadow-sm border border-slate-100 group-hover:border-[#FF4500]/20 transition-all">
                    <Zap className="h-6 w-6 text-[#FF4500]" />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full text-slate-200 hover:text-rose-500 hover:bg-rose-50 transition-all"
                    onClick={() => handleDelete(pkg.id)}
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>

                <div className="space-y-6 relative z-10">
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-5xl font-black text-slate-800 tracking-tighter italic leading-none">
                        {(pkg.jumlah_koin || 0).toLocaleString()}
                      </h3>
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                        Units
                      </span>
                    </div>
                  </div>

                  {/* PRICING BREAKDOWN */}
                  <div className="space-y-2 p-5 bg-slate-50/80 rounded-[30px] border border-slate-100">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="font-black text-slate-400 uppercase tracking-tighter">
                        Harga Asli
                      </span>
                      <span
                        className={cn(
                          "font-bold text-slate-500",
                          pricing.hasDiscount &&
                            "line-through decoration-[#FF4500] decoration-2",
                        )}
                      >
                        {pricing.gross}
                      </span>
                    </div>
                    {pricing.hasDiscount && (
                      <div className="flex justify-between items-center text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <ArrowDownCircle className="h-3 w-3 text-emerald-500" />
                          <span className="font-black text-emerald-600 uppercase tracking-tighter">
                            Potongan
                          </span>
                        </div>
                        <span className="font-black text-emerald-600">
                          -{pricing.saving}
                        </span>
                      </div>
                    )}
                    <div className="pt-2 mt-2 border-t border-slate-200 flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-700 uppercase tracking-tighter">
                        Harga Jual
                      </span>
                      <span className="text-sm font-black text-[#FF4500]">
                        {pricing.final}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between relative z-10">
                  <Badge
                    className={cn(
                      "rounded-full px-5 py-2 font-black text-[9px] uppercase shadow-none border-none tracking-widest",
                      pricing.hasDiscount
                        ? "bg-orange-50 text-[#FF4500]"
                        : "bg-slate-50 text-slate-400",
                    )}
                  >
                    {pricing.hasDiscount
                      ? `Hemat ${pkg.discount_pct}%`
                      : "Reguler"}
                  </Badge>

                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                      Live
                    </span>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
