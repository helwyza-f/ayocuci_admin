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
  AlertCircle,
  Database,
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
import { Badge } from "@/components/ui/badge";

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
      toast.error("Failed to sync configuration parameters");
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
      toast.error("Failed to load bank data");
    } finally {
      setLoadingBanks(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
    fetchBanks();
  }, []);

  // --- HANDLERS ECONOMY ---
  const formatDisplay = (val: string, type?: string) => {
    if (!val) return "—";
    if (type === "percentage") return `${val}%`;
    if (type === "amount" || type === "price") {
      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }).format(Number(val));
    }
    return `${val} Koin`;
  };

  const handleUpdateConfig = async () => {
    if (!rawValue) return toast.error("Value cannot be empty");
    setIsUpdating(true);
    try {
      if (!editingConfig) return;
      const res = await api.patch("/economy/configs", {
        key: editingConfig.cfg_key,
        value: rawValue,
      });
      if (res.data.status) {
        toast.success(`Configuration updated`);
        setEditingConfig(null);
        fetchConfigs();
      }
    } catch {
      toast.error("Failed to update config");
    } finally {
      setIsUpdating(false);
    }
  };

  // --- HANDLERS BANKS ---
  const handleAddBank = async () => {
    if (!newBank.bank_name || !newBank.account_number)
      return toast.error("Bank details incomplete");
    try {
      await bankService.createBank(newBank);
      toast.success("Bank account added");
      setNewBank({ bank_name: "", account_name: "", account_number: "" });
      fetchBanks();
    } catch {
      toast.error("Failed to add account");
    }
  };

  const handleToggleBank = async (id: number) => {
    try {
      await bankService.toggleStatus(id);
      fetchBanks();
    } catch {
      toast.error("Failed to toggle status");
    }
  };

  const handleDeleteBank = async (id: number) => {
    if (!confirm("Delete this account?")) return;
    try {
      await bankService.deleteBank(id);
      fetchBanks();
    } catch {
      toast.error("Failed to delete account");
    }
  };

  const getIcon = (key: string) => {
    if (key.includes("price"))
      return <Wallet2 className="h-5 w-5" />;
    if (key.includes("referral"))
      return <UserPlus className="h-5 w-5" />;
    if (key.includes("percent"))
      return <Settings2 className="h-5 w-5" />;
    if (key.includes("activation"))
      return <ShieldCheck className="h-5 w-5" />;
    return <Coins className="h-5 w-5" />;
  };

  return (
    <div className="space-y-6">
      {/* COMMAND BAR HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2 font-heading">
            <Database className="h-5 w-5 text-primary" />
            Economy Management
          </h1>
          <p className="text-xs font-medium text-slate-500">
            Control global economic parameters and billing endpoints.
          </p>
        </div>
      </div>

      <Tabs defaultValue="configs" className="w-full">
        <TabsList className="bg-slate-100/50 p-0.5 rounded border border-slate-200 mb-6 w-fit h-9 shadow-none">
          <TabsTrigger
            value="configs"
            className="rounded px-3 font-bold text-[9px] uppercase gap-1.5 h-8 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-slate-200"
          >
            <Coins className="h-3 w-3" /> Parameters
          </TabsTrigger>
          <TabsTrigger
            value="banks"
            className="rounded px-3 font-bold text-[9px] uppercase gap-1.5 h-8 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-slate-200"
          >
            <Landmark className="h-3 w-3" /> Billing
          </TabsTrigger>
        </TabsList>

        {/* --- TAB: CONFIGS --- */}
        <TabsContent
          value="configs"
          className="space-y-4 animate-in fade-in slide-in-from-bottom-1 duration-200"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loadingConfigs
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-32 bg-white border border-slate-200 rounded-lg animate-pulse"
                  />
                ))
              : configs.map((cfg) => (
                  <Card
                    key={cfg.cfg_key}
                    className="p-4 border border-slate-200 shadow-none rounded-lg bg-white group hover:border-primary/20 hover:shadow-sm transition-all duration-300"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="p-2 rounded-lg bg-slate-50 text-slate-400 group-hover:bg-primary/5 group-hover:text-primary group-hover:scale-110 transition-all duration-300 border border-slate-100/50">
                        {getIcon(cfg.cfg_key)}
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-slate-400 hover:text-primary active:scale-90 transition-all"
                        onClick={() => {
                          setEditingConfig(cfg);
                          setRawValue(cfg.cfg_value);
                        }}
                      >
                        <Settings2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none group-hover:text-slate-500 transition-colors">
                        {cfg.cfg_key.replaceAll("_", " ")}
                      </p>
                      <h3 className="text-lg font-bold text-slate-900 tracking-tight font-heading leading-none group-hover:text-primary transition-colors">
                        {formatDisplay(cfg.cfg_value, cfg.cfg_type)}
                      </h3>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-slate-100">
                      <p className="text-[9px] font-medium text-slate-400 italic flex items-center gap-1.5 line-clamp-1 group-hover:text-slate-500 transition-colors">
                        <Info className="h-2.5 w-2.5" /> {cfg.cfg_desc}
                      </p>
                    </div>
                  </Card>
                ))}
          </div>
        </TabsContent>

        {/* --- TAB: BANKS --- */}
        <TabsContent
          value="banks"
          className="space-y-4 animate-in fade-in slide-in-from-bottom-1 duration-200"
        >
          <Card className="p-4 border border-slate-200 rounded-lg bg-white shadow-none hover:border-slate-300 transition-colors">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase text-slate-400 ml-1 tracking-wider">Bank / Merchant</label>
                <Input
                  placeholder="e.g. BCA / QRIS"
                  value={newBank.bank_name}
                  onChange={(e) => setNewBank({ ...newBank, bank_name: e.target.value })}
                  className="rounded border-slate-200 h-8 text-[10px] font-bold shadow-none focus-visible:ring-primary/20"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase text-slate-400 ml-1 tracking-wider">Account Holder</label>
                <Input
                  placeholder="Full Name"
                  value={newBank.account_name}
                  onChange={(e) => setNewBank({ ...newBank, account_name: e.target.value })}
                  className="rounded border-slate-200 h-8 text-[10px] font-bold shadow-none focus-visible:ring-primary/20"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase text-slate-400 ml-1 tracking-wider">Account Number</label>
                <Input
                  placeholder="Number"
                  value={newBank.account_number}
                  onChange={(e) => setNewBank({ ...newBank, account_number: e.target.value })}
                  className="rounded border-slate-200 h-8 text-[10px] font-bold shadow-none focus-visible:ring-primary/20"
                />
              </div>
              <Button
                onClick={handleAddBank}
                className="h-8 rounded font-bold text-[9px] uppercase gap-1.5 active:scale-[0.98] transition-all"
              >
                <Plus className="h-3.5 w-3.5" /> Save Endpoint
              </Button>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {loadingBanks ? (
              Array.from({ length: 3 }).map((_, i) => (
                 <div key={i} className="h-24 bg-white border border-slate-200 rounded-lg animate-pulse" />
              ))
            ) : (
              banks.map((bank) => (
                <Card
                  key={bank.id}
                  className={cn(
                    "p-4 rounded-lg border border-slate-200 transition-all duration-300 relative group overflow-hidden bg-white shadow-none hover:border-primary/20 hover:shadow-sm",
                    !bank.is_active && "opacity-60 bg-slate-50 border-slate-100",
                  )}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div
                      className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center font-bold text-[9px] border transition-all duration-300",
                        bank.is_active
                          ? "bg-primary/5 text-primary border-primary/10 group-hover:scale-110"
                          : "bg-slate-100 text-slate-400 border-transparent",
                      )}
                    >
                      {bank.bank_name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex gap-1 translate-x-1 group-hover:translate-x-0 transition-transform">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleBank(bank.id)}
                        className="h-7 w-7 text-slate-400 hover:text-primary active:scale-90 transition-all"
                      >
                        <Power className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteBank(bank.id)}
                        className="h-7 w-7 text-slate-400 hover:text-rose-600 active:scale-90 transition-all"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-0.5 relative z-10">
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5 group-hover:text-slate-500 transition-colors">{bank.bank_name}</p>
                    <p className="text-base font-bold text-slate-900 tracking-tight font-heading leading-none group-hover:text-primary transition-colors">
                      {bank.account_number}
                    </p>
                    <p className="text-[10px] font-medium text-slate-500 italic">a.n {bank.account_name}</p>
                  </div>
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
        <DialogContent className="rounded-lg p-0 border border-slate-200 shadow-xl max-w-sm bg-white overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-[10px] font-bold uppercase tracking-tight flex items-center gap-2">
              <Settings2 className="h-3.5 w-3.5 text-primary" /> Update Parameter
            </h3>
          </div>
          <div className="p-4 space-y-4 bg-slate-50/30">
            <div className="space-y-1">
              <label className="text-[8px] font-bold uppercase text-slate-400 ml-1">Configuration Key</label>
              <Input
                value={editingConfig?.cfg_key ?? ""}
                disabled
                className="rounded h-7 bg-slate-100 border-none font-bold text-slate-400 text-[10px] shadow-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-bold uppercase text-slate-400 ml-1">New Value</label>
              <Input
                type="number"
                value={rawValue}
                onChange={(e) => setRawValue(e.target.value)}
                className="rounded border-slate-200 h-9 font-bold text-sm focus-visible:ring-primary shadow-none bg-white px-2.5"
              />
              <div className="mt-3 p-3 bg-white rounded border border-slate-100">
                <p className="text-[8px] font-bold text-slate-400 uppercase mb-0.5">Preview:</p>
                <p className="text-sm font-bold text-primary font-heading">
                  {rawValue ? formatDisplay(rawValue, editingConfig?.cfg_type) : "—"}
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-white border-t border-slate-100 flex flex-col gap-2">
            <div className="flex gap-2">
               <Button
                variant="ghost"
                onClick={() => setEditingConfig(null)}
                className="flex-1 h-8 rounded font-bold text-[9px] uppercase tracking-wider"
              >
                Cancel
              </Button>
              <Button
                disabled={isUpdating}
                onClick={handleUpdateConfig}
                className="flex-1 h-8 rounded font-bold text-[9px] uppercase tracking-wider"
              >
                {isUpdating ? <LoaderIcon className="animate-spin h-3 w-3" /> : <Save className="h-3 w-3 mr-1.5" />}
                Commit
              </Button>
            </div>
             <p className="text-[7px] text-center font-medium text-slate-400 uppercase tracking-tighter">
                Updates propagate immediately to all nodes.
             </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
