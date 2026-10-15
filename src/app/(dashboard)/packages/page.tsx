"use client";

import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Trash2,
  Edit3,
  X,
  Coins,
  Zap,
  Percent,
  Database,
  PlusCircle,
} from "lucide-react";
import { economyService } from "@/services/economy.service";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { EconomyConfig, KoinPackage } from "@/types/domain";
import PermissionGate from "@/components/shared/permission-gate";

function KoinPackagesContent() {
  const [packages, setPackages] = useState<KoinPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);
  const [pricePerCoin, setPricePerCoin] = useState<number>(100);

  const [formData, setFormData] = useState({
    jumlah_koin: "",
    discount_pct: "",
    apple_product_id: "",
  });

  const handleEdit = (pkg: KoinPackage) => {
    setFormData({
      jumlah_koin: pkg.jumlah_koin.toString(),
      discount_pct: pkg.discount_pct?.toString() || "0",
      apple_product_id: pkg.apple_product_id || "",
    });
    setEditingId(pkg.id);
    setIsAdding(true);
  };

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

  const handleSubmit = async () => {
    if (!formData.jumlah_koin) return toast.error("Coin quantity is required");
    const productId = formData.apple_product_id.trim();
    const expectedProductId = `com.ayocuci.coin_${Number(formData.jumlah_koin)}`;
    if (productId && productId !== expectedProductId) {
      return toast.error(`Apple Product ID untuk paket ini harus ${expectedProductId}`);
    }
    try {
      const payload = {
        jumlah_koin: Number(formData.jumlah_koin),
        discount_pct: Number(formData.discount_pct || 0),
        apple_product_id: productId,
      };

      let res;
      if (editingId) {
        res = await economyService.updatePackage(editingId, payload);
      } else {
        res = await economyService.createPackage(payload);
      }

      if (res.status === 200 || res.status === 201 || res.data?.status) {
        toast.success(editingId ? "Package updated successfully" : "Package published to ecosystem");
        setIsAdding(false);
        setEditingId(null);
        setFormData({ jumlah_koin: "", discount_pct: "", apple_product_id: "" });
        initData();
      }
    } catch (error: unknown) {
      const message = typeof error === "object" && error !== null && "response" in error
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      toast.error(message || (editingId ? "Failed to update package" : "Failed to publish package"));
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

  const handleStatusChange = async (pkg: KoinPackage, isActive: boolean) => {
    setUpdatingStatusId(pkg.id);
    try {
      await economyService.updatePackageStatus(pkg.id, isActive);
      setPackages((current) =>
        current.map((item) =>
          item.id === pkg.id ? { ...item, is_active: isActive } : item,
        ),
      );
      toast.success(isActive ? "Paket ditampilkan kembali" : "Paket disembunyikan dari aplikasi");
    } catch {
      toast.error("Gagal mengubah status paket");
    } finally {
      setUpdatingStatusId(null);
    }
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
            Paket Koin
          </h1>
          <p className="text-xs font-medium text-slate-500">
            Kelola paket pembelian koin dan harga promosi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="h-8 px-2 rounded font-bold text-[9px] uppercase tracking-wider text-slate-500 bg-white border-slate-200 shadow-none">
             Base: Rp {pricePerCoin.toLocaleString()}/U
          </Badge>
          <PermissionGate module="packages" action="create">
            <Button
              onClick={() => {
                setIsAdding(!isAdding);
                if (isAdding) {
                  setEditingId(null);
                  setFormData({ jumlah_koin: "", discount_pct: "", apple_product_id: "" });
                }
              }}
              variant={isAdding ? "outline" : "default"}
              size="sm"
              className="h-8 px-3 font-bold text-[10px] uppercase tracking-wider gap-2 shadow-none"
            >
              {isAdding ? <X className="h-3.5 w-3.5" /> : <PlusCircle className="h-3.5 w-3.5" />}
              {isAdding ? "Batal" : "Buat Baru"}
            </Button>
          </PermissionGate>
        </div>
      </div>

      {/* OPERATIONAL FORM */}
      {isAdding && (
        <Card className="p-4 border border-slate-200 shadow-none rounded-lg bg-white animate-in slide-in-from-top-1 duration-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase text-slate-400 ml-1">Jumlah Koin</label>
              <div className="relative">
                <Coins className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  type="number"
                  placeholder="e.g. 1000"
                  value={formData.jumlah_koin}
                  onChange={(e) => setFormData({ ...formData, jumlah_koin: e.target.value })}
                  disabled={Boolean(editingId && packages.find((pkg) => pkg.id === editingId)?.apple_product_id)}
                  className="pl-8 h-9 rounded border-slate-200 font-bold text-xs shadow-none"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase text-slate-400 ml-1">Apple Product ID</label>
              <Input
                type="text"
                placeholder="com.ayocuci.coin_2500"
                value={formData.apple_product_id}
                onChange={(e) => setFormData({ ...formData, apple_product_id: e.target.value })}
                disabled={Boolean(editingId && packages.find((pkg) => pkg.id === editingId)?.apple_product_id)}
                className="h-9 rounded border-slate-200 font-mono text-xs shadow-none disabled:bg-slate-100"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold uppercase text-slate-400 ml-1">Diskon (%)</label>
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
            <PermissionGate module="packages" action="create">
              <Button
                onClick={handleSubmit}
                className="h-9 rounded font-bold text-[10px] uppercase tracking-wider"
              >
                {editingId ? "Simpan Perubahan" : "Terbitkan Paket"}
              </Button>
            </PermissionGate>
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
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Tidak ada paket yang tersedia</p>
          </div>
        ) : (
          packages.map((pkg) => {
            const pricing = calculatePricing(pkg.jumlah_koin, pkg.discount_pct || 0);
            const isActive = pkg.is_active !== false;
            const isUpdatingStatus = updatingStatusId === pkg.id;
            return (
              <Card key={pkg.id} className={cn(
                "p-4 border border-slate-200 shadow-none rounded-lg bg-white transition-all group relative overflow-hidden",
                isActive ? "hover:border-primary" : "bg-slate-50/70 opacity-70",
              )}>
                <div className="flex justify-between items-start mb-4">
                  <div className="h-8 w-8 rounded bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                    <Zap className="h-4 w-4" />
                  </div>
                  <div className="flex gap-1">
                    <PermissionGate module="packages" action="update">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-slate-300 hover:text-primary"
                        onClick={() => handleEdit(pkg)}
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </Button>
                    </PermissionGate>
                    {!pkg.apple_product_id && <PermissionGate module="packages" action="delete">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-slate-300 hover:text-rose-600"
                        onClick={() => handleDelete(pkg.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </PermissionGate>}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-baseline gap-1.5">
                    <h3 className="text-3xl font-bold text-slate-900 tracking-tight font-heading leading-none">
                      {(pkg.jumlah_koin || 0).toLocaleString()}
                    </h3>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Koin</span>
                  </div>

                  <div className="min-h-8 rounded border border-slate-100 bg-slate-50/50 px-2 py-1.5">
                    <p className="text-[8px] font-bold uppercase tracking-wide text-slate-400">Apple Product ID</p>
                    <p className="mt-0.5 break-all font-mono text-[9px] text-slate-600">
                      {pkg.apple_product_id || "Belum dihubungkan"}
                    </p>
                  </div>

                  <div className="space-y-2 p-3 bg-slate-50/30 rounded border border-slate-100">
                    <div className="flex justify-between items-center text-[9px]">
                      <span className="font-bold text-slate-400 uppercase tracking-tight">Total Kotor</span>
                      <span className={cn("font-bold text-slate-500", pricing.hasDiscount && "line-through opacity-40")}>
                        {pricing.gross}
                      </span>
                    </div>
                    {pricing.hasDiscount && (
                      <div className="flex justify-between items-center text-[9px]">
                        <span className="font-bold text-emerald-600 uppercase tracking-tight flex items-center gap-1">
                          Insentif
                        </span>
                        <span className="font-bold text-emerald-600">-{pricing.saving}</span>
                      </div>
                    )}
                    <div className="pt-1.5 mt-1.5 border-t border-slate-100 flex justify-between items-center">
                      <span className="text-[9px] font-bold text-slate-900 uppercase">Total Bersih</span>
                      <span className="text-xs font-bold text-primary">{pricing.final}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-50 pt-3">
                  <Badge variant="outline" className={cn(
                    "rounded px-1.5 py-0 text-[8px] font-bold uppercase border shadow-none",
                    pricing.hasDiscount ? "bg-primary/5 text-primary border-primary/10" : "bg-slate-50 text-slate-400 border-slate-200"
                  )}>
                    {pricing.hasDiscount ? `Diskon ${pkg.discount_pct}%` : "Standar"}
                  </Badge>
                  <PermissionGate module="packages" action="update">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-[8px] font-bold uppercase tracking-tight",
                        isActive ? "text-emerald-600" : "text-slate-400",
                      )}>
                        {isActive ? "Aktif" : "Disembunyikan"}
                      </span>
                      <button
                        type="button"
                        role="switch"
                        aria-label={`${isActive ? "Sembunyikan" : "Tampilkan"} paket ${pkg.jumlah_koin} koin`}
                        aria-checked={isActive}
                        disabled={isUpdatingStatus}
                        onClick={() => handleStatusChange(pkg, !isActive)}
                        className={cn(
                          "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50",
                          isActive ? "bg-emerald-500" : "bg-slate-300",
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            "pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                            isActive ? "translate-x-4" : "translate-x-0",
                          )}
                        />
                      </button>
                    </div>
                  </PermissionGate>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function KoinPackagesPage() {
  return (
    <PermissionGate module="packages" action="read">
      <KoinPackagesContent />
    </PermissionGate>
  );
}
