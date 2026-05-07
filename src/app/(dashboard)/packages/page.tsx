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
  Database,
  PlusCircle,
  History,
  TrendingDown,
} from "lucide-react";
import { economyService } from "@/services/economy.service";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { EconomyConfig, KoinPackage } from "@/types/domain";

export default function KoinPackagesPage() {
  const [packages, setPackages] = useState<KoinPackage[]>([]);
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
      const configRes = await economyService.getConfigs();
      const configs: EconomyConfig[] = configRes.data.data || [];

      if (Array.isArray(configs)) {
        const priceConfig = configs.find((c) => c.cfg_key === "price_per_coin");
        if (priceConfig) {
          setPricePerCoin(Number(priceConfig.cfg_value));
        }
      }

      const res = await economyService.getPackages();
      const incomingData: KoinPackage[] = res.data.data || [];
      setPackages(Array.isArray(incomingData) ? incomingData : []);
    } catch (err) {
      toast.error("Failed to sync economy data");
      setPackages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initData();
  }, [initData]);

  const handleCreate = async () => {
    if (!formData.jumlah_koin) return toast.error("Coin quantity is required");
    try {
      const res = await economyService.createPackage({
        jumlah_koin: Number(formData.jumlah_koin),
        discount_pct: Number(formData.discount_pct || 0),
      });

      if (res.status === 200 || res.status === 201 || res.data?.status) {
        toast.success("Package published to ecosystem");
        setIsAdding(false);
        setFormData({ jumlah_koin: "", discount_pct: "" });
        initData();
      }
    } catch {
      toast.error("Failed to publish package");
    }
  };

  const handleDelete = async (id: number) => {
    toast.promise(economyService.deletePackage(id), {
      loading: "Removing package...",
      success: () => {
        initData();
        return "Package removed";
      },
      error: "Deletion failed",
    });
  };

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
    <div className="space-y-6">
      {/* COMMAND BAR HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2 font-heading">
            <Coins className="h-5 w-5 text-primary" />
            Supply & Inventory
          </h1>
          <p className="text-xs font-medium text-slate-500">
            Define coin purchase bundles and promotional bulk pricing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="h-8 px-2 rounded font-bold text-[9px] uppercase tracking-wider text-slate-500 bg-white border-slate-200 shadow-none">
             Base: Rp {pricePerCoin.toLocaleString()}/U
          </Badge>
          <Button
            onClick={() => setIsAdding(!isAdding)}
            variant={isAdding ? "outline" : "default"}
            size="sm"
            className="h-8 px-3 font-bold text-[10px] uppercase tracking-wider gap-2 shadow-none"
          >
            {isAdding ? <X className="h-3.5 w-3.5" /> : <PlusCircle className="h-3.5 w-3.5" />}
            {isAdding ? "Cancel" : "Create New"}
          </Button>
        </div>
      </div>

      {/* OPERATIONAL FORM */}
      {isAdding && (
        <Card className="p-4 border border-slate-200 shadow-none rounded-lg bg-white animate-in slide-in-from-top-1 duration-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase text-slate-400 ml-1">Quantity Units</label>
              <div className="relative">
                <Coins className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  type="number"
                  placeholder="e.g. 1000"
                  value={formData.jumlah_koin}
                  onChange={(e) => setFormData({ ...formData, jumlah_koin: e.target.value })}
                  className="pl-8 h-9 rounded border-slate-200 font-bold text-xs shadow-none"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase text-slate-400 ml-1">Discount (%)</label>
              <div className="relative">
                <Percent className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  type="number"
                  placeholder="0 - 100"
                  value={formData.discount_pct}
                  onChange={(e) => setFormData({ ...formData, discount_pct: e.target.value })}
                  className="pl-8 h-9 rounded border-slate-200 font-bold text-xs shadow-none"
                />
              </div>
            </div>
            <Button
              onClick={handleCreate}
              className="h-9 rounded font-bold text-[10px] uppercase tracking-wider"
            >
              Publish Package
            </Button>
          </div>
        </Card>
      )}

      {/* PACKAGE GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
             <div key={i} className="h-48 bg-white border border-slate-200 rounded-lg animate-pulse" />
          ))
        ) : packages.length === 0 ? (
          <div className="col-span-full py-24 text-center bg-white rounded-lg border border-dashed border-slate-200">
            <Database className="h-8 w-8 text-slate-200 mx-auto mb-2" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">No packages defined</p>
          </div>
        ) : (
          packages.map((pkg) => {
            const pricing = calculatePricing(pkg.jumlah_koin, pkg.discount_pct || 0);
            return (
              <Card key={pkg.id} className="p-4 border border-slate-200 shadow-none rounded-lg bg-white hover:border-primary transition-colors group relative overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                  <div className="h-8 w-8 rounded bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                    <Zap className="h-4 w-4" />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-slate-300 hover:text-rose-600"
                    onClick={() => handleDelete(pkg.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-baseline gap-1.5">
                    <h3 className="text-3xl font-bold text-slate-900 tracking-tight font-heading leading-none">
                      {(pkg.jumlah_koin || 0).toLocaleString()}
                    </h3>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Koin</span>
                  </div>

                  <div className="space-y-2 p-3 bg-slate-50/30 rounded border border-slate-100">
                    <div className="flex justify-between items-center text-[9px]">
                      <span className="font-bold text-slate-400 uppercase tracking-tight">Gross</span>
                      <span className={cn("font-bold text-slate-500", pricing.hasDiscount && "line-through opacity-40")}>
                        {pricing.gross}
                      </span>
                    </div>
                    {pricing.hasDiscount && (
                      <div className="flex justify-between items-center text-[9px]">
                        <span className="font-bold text-emerald-600 uppercase tracking-tight flex items-center gap-1">
                          Incentive
                        </span>
                        <span className="font-bold text-emerald-600">-{pricing.saving}</span>
                      </div>
                    )}
                    <div className="pt-1.5 mt-1.5 border-t border-slate-100 flex justify-between items-center">
                      <span className="text-[9px] font-bold text-slate-900 uppercase">Settlement</span>
                      <span className="text-xs font-bold text-primary">{pricing.final}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-50 pt-3">
                  <Badge variant="outline" className={cn(
                    "rounded px-1.5 py-0 text-[8px] font-bold uppercase border shadow-none",
                    pricing.hasDiscount ? "bg-primary/5 text-primary border-primary/10" : "bg-slate-50 text-slate-400 border-slate-200"
                  )}>
                    {pricing.hasDiscount ? `${pkg.discount_pct}% Off` : "Standard"}
                  </Badge>
                  <div className="flex items-center gap-1 opacity-30">
                     <ShieldCheck className="h-3 w-3 text-emerald-500" />
                     <span className="text-[8px] font-bold uppercase tracking-tight">Live</span>
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
