"use client";

import { useEffect, useState } from "react";
import {
  Coins,
  Settings2,
  Save,
  Info,
  UserPlus,
  ShieldCheck,
  Wallet2,
  Loader2 as LoaderIcon,
  Landmark,
  Plus,
  Trash2,
  Power,
  CheckCircle2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api from "@/lib/api-client";
import { bankService, BankAccount } from "@/services/bank.service";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ApiResponse } from "@/types/api";
import { EconomyConfig } from "@/types/domain";

export default function AdminEconomyPage() {
  // --- STATE ECONOMY ---
  const [configs, setConfigs] = useState<EconomyConfig[]>([]);
  const [loadingConfigs, setLoadingConfigs] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editingConfig, setEditingConfig] = useState<EconomyConfig | null>(
    null,
  );
  const [rawValue, setRawValue] = useState("");

  // --- STATE BANKS ---
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(true);
  const [newBank, setNewBank] = useState({
    bank_name: "",
    account_name: "",
    account_number: "",
  });

  // --- FETCH DATA ---
  const fetchConfigs = async () => {
    setLoadingConfigs(true);
    try {
      const res = await api.get<ApiResponse<EconomyConfig[]>>(
        "/economy/configs",
      );
      if (res.data.status) setConfigs(res.data.data || []);
    } catch {
      toast.error("Gagal mengambil data konfigurasi");
    } finally {
      setLoadingConfigs(false);
    }
  };

  const fetchBanks = async () => {
    setLoadingBanks(true);
    try {
      const res = await bankService.getBanks();
      if (res.status) setBanks(res.data);
    } catch {
      toast.error("Gagal memuat data bank");
    } finally {
      setLoadingBanks(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
    fetchBanks();
  }, []);

  // --- HANDLERS ECONOMY ---
  const formatDisplay = (val: string) => {
    if (!val || !editingConfig) return val || "";
    if (
      editingConfig.cfg_key.includes("price") ||
      editingConfig.cfg_key.includes("fee") ||
      editingConfig.cfg_key.includes("topup")
    ) {
      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }).format(Number(val));
    }
    return `${Number(val).toLocaleString("id-ID")} Koin`;
  };

  const handleUpdateConfig = async () => {
    if (!rawValue) return toast.error("Nilai tidak boleh kosong");
    setIsUpdating(true);
    try {
      if (!editingConfig) return;
      const res = await api.patch("/economy/configs", {
        key: editingConfig.cfg_key,
        value: rawValue,
      });
      if (res.data.status) {
        toast.success(`Konfigurasi diperbarui`);
        setEditingConfig(null);
        fetchConfigs();
      }
    } catch {
      toast.error("Gagal memperbarui konfigurasi");
    } finally {
      setIsUpdating(false);
    }
  };

  // --- HANDLERS BANKS ---
  const handleAddBank = async () => {
    if (!newBank.bank_name || !newBank.account_number)
      return toast.error("Data bank tidak lengkap");
    try {
      await bankService.createBank(newBank);
      toast.success("Rekening berhasil ditambah");
      setNewBank({ bank_name: "", account_name: "", account_number: "" });
      fetchBanks();
    } catch {
      toast.error("Gagal menambah rekening");
    }
  };

  const handleToggleBank = async (id: number) => {
    try {
      await bankService.toggleStatus(id);
      fetchBanks();
    } catch {
      toast.error("Gagal mengubah status");
    }
  };

  const handleDeleteBank = async (id: number) => {
    if (!confirm("Hapus rekening ini?")) return;
    try {
      await bankService.deleteBank(id);
      fetchBanks();
    } catch {
      toast.error("Gagal menghapus");
    }
  };

  const getIcon = (key: string) => {
    if (key.includes("price"))
      return <Wallet2 className="h-5 w-5 text-green-500" />;
    if (key.includes("referral"))
      return <UserPlus className="h-5 w-5 text-blue-500" />;
    if (key.includes("activation"))
      return <ShieldCheck className="h-5 w-5 text-purple-500" />;
    return <Coins className="h-5 w-5 text-orange-500" />;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase flex items-center gap-3">
          Economy <span className="text-[#FF4500]">Management</span>
        </h2>
        <p className="text-xs text-slate-500 font-bold italic ml-1">
          Atur parameter ekonomi dan rekening penagihan platform AyoCuci.
        </p>
      </div>

      <Tabs defaultValue="configs" className="w-full">
        <TabsList className="bg-slate-100/50 p-1.5 rounded-2xl mb-8 border border-slate-100 w-fit">
          <TabsTrigger
            value="configs"
            className="rounded-xl px-8 font-black text-[10px] uppercase gap-2 py-2.5"
          >
            <Coins className="h-3.5 w-3.5" /> Parameter Koin
          </TabsTrigger>
          <TabsTrigger
            value="banks"
            className="rounded-xl px-8 font-black text-[10px] uppercase gap-2 py-2.5"
          >
            <Landmark className="h-3.5 w-3.5" /> Rekening Transfer
          </TabsTrigger>
        </TabsList>

        {/* --- TAB: CONFIGS --- */}
        <TabsContent
          value="configs"
          className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loadingConfigs
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-56 bg-slate-100 rounded-[40px] animate-pulse"
                  />
                ))
              : configs.map((cfg) => (
                  <Card
                    key={cfg.cfg_key}
                    className="group p-8 border-none shadow-sm rounded-[40px] bg-white hover:shadow-xl hover:shadow-orange-100/50 transition-all border border-slate-50"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-orange-50 transition-colors">
                        {getIcon(cfg.cfg_key)}
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="rounded-xl hover:bg-orange-50 text-slate-400"
                        onClick={() => {
                          setEditingConfig(cfg);
                          setRawValue(cfg.cfg_value);
                        }}
                      >
                        <Settings2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                        {cfg.cfg_key.replaceAll("_", " ")}
                      </p>
                      <h3 className="text-2xl font-black text-slate-800 tracking-tighter">
                        {cfg.cfg_key.includes("price") ||
                        cfg.cfg_key.includes("fee")
                          ? `Rp ${Number(cfg.cfg_value).toLocaleString("id-ID")}`
                          : `${cfg.cfg_value} Koin`}
                      </h3>
                    </div>
                    <div className="mt-6 pt-6 border-t border-slate-50">
                      <p className="text-[10px] font-bold text-slate-400 italic flex items-center gap-2 line-clamp-1">
                        <Info className="h-3 w-3" /> {cfg.cfg_desc}
                      </p>
                    </div>
                  </Card>
                ))}
          </div>
        </TabsContent>

        {/* --- TAB: BANKS --- */}
        <TabsContent
          value="banks"
          className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500"
        >
          <Card className="p-8 border-none shadow-sm rounded-[35px] bg-white border border-slate-50">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">
                  Bank / Merchant
                </label>
                <Input
                  placeholder="Contoh: BCA / QRIS"
                  value={newBank.bank_name}
                  onChange={(e) =>
                    setNewBank({ ...newBank, bank_name: e.target.value })
                  }
                  className="rounded-2xl border-slate-100 bg-slate-50 h-12 text-sm font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">
                  Atas Nama
                </label>
                <Input
                  placeholder="Nama Pemilik"
                  value={newBank.account_name}
                  onChange={(e) =>
                    setNewBank({ ...newBank, account_name: e.target.value })
                  }
                  className="rounded-2xl border-slate-100 bg-slate-50 h-12 text-sm font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">
                  No. Rekening
                </label>
                <Input
                  placeholder="Nomor"
                  value={newBank.account_number}
                  onChange={(e) =>
                    setNewBank({ ...newBank, account_number: e.target.value })
                  }
                  className="rounded-2xl border-slate-100 bg-slate-50 h-12 text-sm font-bold"
                />
              </div>
              <Button
                onClick={handleAddBank}
                className="bg-slate-900 hover:bg-black text-white rounded-2xl h-12 font-black text-[10px] uppercase gap-2 shadow-lg shadow-slate-200"
              >
                <Plus className="h-4 w-4" /> Simpan Rekening
              </Button>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {loadingBanks ? (
              <p className="text-xs font-bold text-slate-400 uppercase italic">
                Memuat bank...
              </p>
            ) : (
              banks.map((bank) => (
                <Card
                  key={bank.id}
                  className={cn(
                    "p-6 rounded-[35px] border transition-all duration-500 relative group",
                    bank.is_active
                      ? "bg-white border-slate-100 shadow-sm"
                      : "bg-slate-50/50 border-transparent opacity-60",
                  )}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div
                      className={cn(
                        "h-12 w-12 rounded-2xl flex items-center justify-center font-black italic text-sm",
                        bank.is_active
                          ? "bg-orange-50 text-[#FF4500]"
                          : "bg-slate-200 text-slate-400",
                      )}
                    >
                      {bank.bank_name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleBank(bank.id)}
                        className="h-9 w-9 rounded-xl hover:bg-orange-50 text-slate-400 hover:text-orange-500"
                      >
                        <Power className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteBank(bank.id)}
                        className="h-9 w-9 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
                      {bank.bank_name}
                    </p>
                    <p className="text-xl font-black text-slate-800 tracking-tighter leading-none">
                      {bank.account_number}
                    </p>
                    <p className="text-[11px] font-bold text-slate-400 italic">
                      a.n {bank.account_name}
                    </p>
                  </div>
                  {bank.is_active && (
                    <CheckCircle2 className="absolute -bottom-2 -right-2 h-16 w-16 text-green-500/5 rotate-12" />
                  )}
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* --- DIALOG EDIT CONFIG --- */}
      <Dialog
        open={!!editingConfig}
        onOpenChange={() => setEditingConfig(null)}
      >
        <DialogContent className="rounded-[40px] p-8 border-none shadow-2xl max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
              <Settings2 className="h-6 w-6 text-[#FF4500]" /> Parameter Update
            </DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
                Key Konfigurasi
              </label>
              <Input
                value={editingConfig?.cfg_key ?? ""}
                disabled
                className="rounded-2xl bg-slate-50 border-none font-bold text-slate-400 h-12"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
                Input Nilai
              </label>
              <Input
                type="number"
                value={rawValue}
                onChange={(e) => setRawValue(e.target.value)}
                className="rounded-2xl border-orange-100 h-14 font-black text-2xl focus:ring-2 focus:ring-[#FF4500]"
              />
              <div className="mt-4 p-4 bg-orange-50/30 rounded-2xl border border-dashed border-orange-100">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">
                  Preview Format:
                </p>
                <p className="text-lg font-black text-[#FF4500]">
                  {rawValue ? formatDisplay(rawValue) : "—"}
                </p>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setEditingConfig(null)}
              className="rounded-2xl font-black text-[10px] uppercase h-12 px-6"
            >
              Batal
            </Button>
            <Button
              disabled={isUpdating}
              onClick={handleUpdateConfig}
              className="rounded-2xl bg-[#FF4500] hover:bg-orange-600 text-white font-black text-[10px] uppercase h-12 px-10 shadow-lg shadow-orange-100"
            >
              {isUpdating ? (
                <LoaderIcon className="animate-spin h-3 w-3 mr-2" />
              ) : (
                <Save className="h-3 w-3 mr-2" />
              )}{" "}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
