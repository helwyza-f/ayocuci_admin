"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Zap,
  PlusCircle,
  RefreshCcw,
  Search,
  Trash2,
  Edit,
  Power,
  Box,
  Layers,
  Database,
  Info,
  Loader2 as LoaderIcon,
  X,
  ShieldCheck,
  CreditCard,
  Settings,
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
import { economyService } from "@/services/economy.service";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Addon } from "@/types/domain";
import { ApiResponse } from "@/types/api";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";

export default function AddonCatalogPage() {
  const [addons, setAddons] = useState<Addon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddon, setEditingAddon] = useState<Addon | null>(null);

  const [formData, setFormData] = useState({
    ad_id: "",
    ad_nama: "",
    ad_link: "",
    ad_harga: "",
    ad_keterangan: "",
    ad_status: 1,
  });

  const fetchAddons = useCallback(async () => {
    setLoading(true);
    try {
      const res = await economyService.getAddons();
      if (res.data.status) {
        setAddons(res.data.data || []);
      }
    } catch (err) {
      toast.error("Failed to fetch addon catalog");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAddons();
  }, [fetchAddons]);

  const handleOpenCreate = () => {
    setEditingAddon(null);
    setFormData({
      ad_id: "",
      ad_nama: "",
      ad_link: "",
      ad_harga: "",
      ad_keterangan: "",
      ad_status: 1,
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (addon: Addon) => {
    setEditingAddon(addon);
    setFormData({
      ad_id: addon.ad_id,
      ad_nama: addon.ad_nama,
      ad_link: addon.ad_link,
      ad_harga: addon.ad_harga.toString(),
      ad_keterangan: addon.ad_keterangan,
      ad_status: addon.ad_status,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.ad_id || !formData.ad_nama || !formData.ad_link || !formData.ad_harga) {
      return toast.error("Please complete all required fields");
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        ad_harga: Number(formData.ad_harga),
      };

      if (editingAddon) {
        const res = await economyService.updateAddon(editingAddon.ad_id, payload);
        if (res.data.status) {
          toast.success("Addon updated successfully");
          setIsDialogOpen(false);
          fetchAddons();
        }
      } else {
        const res = await economyService.createAddon(payload);
        if (res.data.status) {
          toast.success("Addon published to catalog");
          setIsDialogOpen(false);
          fetchAddons();
        }
      }
    } catch (err) {
      toast.error("Operation failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this feature from the catalog?")) return;

    try {
      const res = await economyService.deleteAddon(id);
      if (res.data.status) {
        toast.success("Addon removed");
        fetchAddons();
      }
    } catch {
      toast.error("Deletion failed");
    }
  };

  const toggleStatus = async (addon: Addon) => {
    try {
      const res = await economyService.updateAddon(addon.ad_id, {
        ad_status: addon.ad_status === 1 ? 0 : 1,
      });
      if (res.data.status) {
        toast.success("Status updated");
        fetchAddons();
      }
    } catch {
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2 font-heading">
            <Zap className="h-5 w-5 text-primary" />
            Addon Catalog Management
          </h1>
          <p className="text-xs font-medium text-slate-500">
            Configure premium features and per-unit pricing for the ecosystem.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={fetchAddons}
            variant="ghost"
            size="sm"
            className="h-8 px-2 font-bold text-[10px] uppercase tracking-wider gap-2 text-slate-500"
          >
            <RefreshCcw className={cn("h-3 w-3", loading && "animate-spin")} />
            Refresh
          </Button>

          <Button onClick={handleOpenCreate} className="h-8 px-3 font-bold text-[10px] uppercase tracking-wider gap-2">
            <PlusCircle className="h-3.5 w-3.5" /> Define New Feature
          </Button>
        </div>
      </div>

      {/* CATALOG GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-56 bg-white border border-slate-200 rounded-lg animate-pulse" />
          ))
        ) : addons.length === 0 ? (
          <div className="col-span-full py-24 text-center bg-white rounded-lg border border-dashed border-slate-200">
            <Box className="h-8 w-8 text-slate-200 mx-auto mb-2" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">No features defined</p>
          </div>
        ) : (
          addons.map((addon) => (
            <Card
              key={addon.ad_id}
              className={cn(
                "group relative p-4 border border-slate-200 rounded-lg bg-white transition-all hover:border-primary/50 shadow-none",
                addon.ad_status === 0 && "opacity-60 bg-slate-50",
              )}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col gap-1">
                  <Badge
                    variant="outline"
                    className="rounded px-1.5 py-0 text-[8px] font-bold uppercase border bg-slate-50 text-slate-500 border-slate-200 shadow-none"
                  >
                    {addon.ad_id}
                  </Badge>
                  <div className="text-[10px] font-bold text-primary flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" />
                    {addon.ad_link}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-slate-300 hover:text-primary transition-colors"
                    onClick={() => handleOpenEdit(addon)}
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-slate-300 hover:text-rose-600 transition-colors"
                    onClick={() => handleDelete(addon.ad_id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <div className="space-y-1 mb-4">
                <h3 className="text-base font-bold text-slate-900 tracking-tight font-heading leading-tight group-hover:text-primary transition-colors">
                  {addon.ad_nama}
                </h3>
                <p className="text-[10px] font-medium text-slate-500 line-clamp-2 h-7">
                  {addon.ad_keterangan}
                </p>
              </div>

              <div className="space-y-2 p-3 bg-slate-50/30 rounded border border-slate-100 mb-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Price</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold text-slate-900">{addon.ad_harga.toLocaleString()}</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase">Koin</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                 <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      addon.ad_status === 1 ? "bg-emerald-500" : "bg-slate-300"
                    )} />
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                      {addon.ad_status === 1 ? "Active" : "Inactive"}
                    </span>
                 </div>
                 <Button
                    onClick={() => toggleStatus(addon)}
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-6 px-2 text-[8px] font-bold uppercase rounded-md",
                      addon.ad_status === 1 ? "text-slate-400" : "text-emerald-600"
                    )}
                 >
                    {addon.ad_status === 1 ? "Deactivate" : "Activate"}
                 </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* CREATE/EDIT DIALOG */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="rounded-lg p-0 border border-slate-200 shadow-xl max-w-md overflow-hidden bg-white">
          <VisuallyHidden.Root>
            <DialogTitle>{editingAddon ? "Edit Addon" : "Create Addon"}</DialogTitle>
          </VisuallyHidden.Root>
          <div className="p-4 border-b border-slate-100 bg-white">
            <h3 className="text-sm font-bold uppercase tracking-tight flex items-center gap-2">
              <Settings className="h-4 w-4 text-primary" />
              {editingAddon ? "Edit Catalog Item" : "Define New Feature"}
            </h3>
          </div>

          <div className="p-4 bg-slate-50/30 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase text-slate-400 ml-1">Unique ID</label>
                <Input
                  disabled={!!editingAddon}
                  placeholder="e.g. AD-006"
                  className="rounded border-slate-200 font-bold h-9 text-xs shadow-none bg-white uppercase"
                  value={formData.ad_id}
                  onChange={(e) => setFormData({ ...formData, ad_id: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase text-slate-400 ml-1">Internal Link Key</label>
                <Input
                  placeholder="e.g. REPORT_DEBT"
                  className="rounded border-slate-200 font-bold h-9 text-xs shadow-none bg-white uppercase"
                  value={formData.ad_link}
                  onChange={(e) => setFormData({ ...formData, ad_link: e.target.value })}
                />
              </div>

              <div className="col-span-2 space-y-1">
                <label className="text-[9px] font-bold uppercase text-slate-400 ml-1">Display Name</label>
                <Input
                  placeholder="Feature title seen by users"
                  className="rounded border-slate-200 font-bold h-9 text-xs shadow-none bg-white"
                  value={formData.ad_nama}
                  onChange={(e) => setFormData({ ...formData, ad_nama: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase text-slate-400 ml-1">Price (Koin)</label>
                <div className="relative">
                   <Database className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                   <Input
                    type="number"
                    placeholder="120"
                    className="pl-8 rounded border-slate-200 font-bold h-9 text-xs shadow-none bg-white"
                    value={formData.ad_harga}
                    onChange={(e) => setFormData({ ...formData, ad_harga: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase text-slate-400 ml-1">Initial Status</label>
                <div className="flex items-center h-9 gap-4">
                   <label className="flex items-center gap-2 cursor-pointer group">
                      <input 
                        type="radio" 
                        name="status" 
                        checked={formData.ad_status === 1} 
                        onChange={() => setFormData({...formData, ad_status: 1})}
                        className="w-3 h-3 accent-primary"
                      />
                      <span className="text-[10px] font-bold uppercase text-slate-600">Active</span>
                   </label>
                   <label className="flex items-center gap-2 cursor-pointer group">
                      <input 
                        type="radio" 
                        name="status" 
                        checked={formData.ad_status === 0} 
                        onChange={() => setFormData({...formData, ad_status: 0})}
                        className="w-3 h-3 accent-primary"
                      />
                      <span className="text-[10px] font-bold uppercase text-slate-600">Inactive</span>
                   </label>
                </div>
              </div>

              <div className="col-span-2 space-y-1">
                <label className="text-[9px] font-bold uppercase text-slate-400 ml-1">Description / Benefit</label>
                <Input
                  placeholder="Summary of what this feature does"
                  className="rounded border-slate-200 font-bold h-9 text-xs shadow-none bg-white"
                  value={formData.ad_keterangan}
                  onChange={(e) => setFormData({ ...formData, ad_keterangan: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="p-4 bg-white border-t border-slate-100 flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="flex-1 h-10 rounded font-bold text-[10px] uppercase tracking-wider shadow-none"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-[2] h-10 rounded font-bold text-[10px] uppercase tracking-wider"
            >
              {isSubmitting ? (
                <LoaderIcon className="animate-spin h-4 w-4" />
              ) : (
                editingAddon ? "Update Feature" : "Publish to Ecosystem"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
