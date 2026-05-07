"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRightLeft,
  Banknote,
  CheckCircle2,
  Clock3,
  Loader2,
  Save,
  Users2,
  Wallet2,
  TrendingUp,
  History,
  ExternalLink,
  ChevronRight,
  UserCheck,
  AlertCircle,
  Activity,
  Coins,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  ReferralAdminPayout,
  ReferralAdminSummary,
} from "@/types/domain";
import { referralAdminService } from "@/services/referral-admin.service";
import StatCard from "@/components/modules/dashboard/stat-card";

const statusOptions = ["all", "pending", "approved", "process", "done"] as const;
type ReferralStatusFilter = (typeof statusOptions)[number];
type ReferralPayoutStatus = Exclude<ReferralStatusFilter, "all">;

const payoutStatusOrder: Record<ReferralPayoutStatus, number> = {
  pending: 1,
  approved: 2,
  process: 3,
  done: 4,
};

const currency = (value: number | string) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(value || 0));

export default function ReferralAdminPage() {
  const [summary, setSummary] = useState<ReferralAdminSummary | null>(null);
  const [payouts, setPayouts] = useState<ReferralAdminPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ReferralStatusFilter>("all");
  const [rawReward, setRawReward] = useState("");
  const [savingConfig, setSavingConfig] = useState(false);
  const [savingPayoutId, setSavingPayoutId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const loadData = useCallback(async (status: ReferralStatusFilter) => {
    setLoading(true);
    try {
      const [summaryRes, configRes, payoutsRes] = await Promise.all([
        referralAdminService.getDashboard(),
        referralAdminService.getConfig(),
        referralAdminService.getPayouts(status),
      ]);

      if (summaryRes.data.status) setSummary(summaryRes.data.data);
      if (configRes.data.status) {
        setRawReward(configRes.data.data.cfg_value);
      }
      if (payoutsRes.data.status) {
        setPayouts(payoutsRes.data.data || []);
        setNotes(
          Object.fromEntries(
            (payoutsRes.data.data || []).map((item) => [
              item.rp_id,
              item.rp_admin_note || "",
            ]),
          ),
        );
      }
    } catch {
      toast.error("Failed to load referral ecosystem data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(filter);
  }, [filter, loadData]);

  const handleSaveConfig = async () => {
    if (!rawReward) return toast.error("Reward amount is required");
    setSavingConfig(true);
    try {
      await referralAdminService.updateConfig(rawReward);
      toast.success("Referral reward parameter updated");
      await loadData(filter);
    } catch {
      toast.error("Failed to update referral configuration");
    } finally {
      setSavingConfig(false);
    }
  };

  const handleUpdatePayout = async (id: string, status: ReferralPayoutStatus) => {
    setSavingPayoutId(id);
    try {
      await referralAdminService.updatePayoutStatus(id, {
        status,
        admin_note: notes[id] || undefined,
      });
      toast.success(`Payout status transitioned to ${status}`);
      await loadData(filter);
    } catch {
      toast.error("Failed to transition payout status");
    } finally {
      setSavingPayoutId(null);
    }
  };

  const getNextStatuses = (status: ReferralPayoutStatus) => {
    return (["approved", "process", "done"] as ReferralPayoutStatus[]).filter(
      (item) => payoutStatusOrder[item] > payoutStatusOrder[status],
    );
  };

  return (
    <div className="space-y-6">
      {/* COMMAND BAR HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2 font-heading">
            <TrendingUp className="h-5 w-5 text-primary" />
            Referral Economics
          </h1>
          <p className="text-xs font-medium text-slate-500">
            Manage owner acquisition incentives and payout requests.
          </p>
        </div>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Reward / Acq"
          value={loading ? "..." : currency(summary?.reward_per_owner || 0)}
          icon={Wallet2}
        />
        <StatCard
          label="Success Referrals"
          value={loading ? "..." : summary?.total_referrals || 0}
          icon={Users2}
        />
        <StatCard
          label="Issued Rewards"
          value={loading ? "..." : currency(summary?.total_rewards || 0)}
          icon={Coins}
        />
        <StatCard
          label="Pending Payouts"
          value={loading ? "..." : summary?.pending_count || 0}
          icon={Clock3}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-6">
        {/* CONFIGURATION SIDEBAR */}
        <div className="space-y-4">
           <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">Engine Parameters</h3>
           <Card className="p-4 border border-slate-200 shadow-none rounded-lg bg-white space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-primary">
                   <Settings2 className="h-3.5 w-3.5" />
                   <span className="text-[9px] font-bold uppercase tracking-wider">Global Reward</span>
                </div>
                <p className="text-[10px] font-medium text-slate-500 leading-normal">
                  IDR credit received for successful referrals.
                </p>
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-50">
                <label className="text-[9px] font-bold uppercase tracking-tight text-slate-400 ml-1">Reward Value</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                  <Input
                    value={rawReward}
                    onChange={(e) => setRawReward(e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="25000"
                    className="pl-8 h-9 rounded border-slate-200 font-bold text-base shadow-none"
                  />
                </div>
              </div>

              <Button
                onClick={handleSaveConfig}
                disabled={savingConfig}
                className="w-full h-9 rounded font-bold text-[10px] uppercase tracking-wider"
              >
                {savingConfig ? <Loader2 className="animate-spin h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5 mr-2" />}
                Update Incentive
              </Button>

              <div className="p-3 rounded bg-slate-50 border border-slate-100 flex items-start gap-2">
                 <AlertCircle className="h-3 w-3 text-slate-400 mt-0.5" />
                 <p className="text-[9px] font-medium text-slate-500 leading-tight italic">
                   Credited to Referral Wallet.
                 </p>
              </div>
           </Card>
        </div>

        {/* PAYOUT QUEUE */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
             <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <History className="h-3.5 w-3.5" />
                Verification Queue
             </h3>
             <div className="flex flex-wrap gap-0.5 bg-slate-100/50 p-0.5 rounded border border-slate-200">
                {statusOptions.map((item) => (
                  <button
                    key={item}
                    onClick={() => setFilter(item)}
                    className={cn(
                      "rounded px-2 h-7 text-[8px] font-bold uppercase transition-all tracking-tight",
                      filter === item ? "bg-white text-slate-900 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700",
                    )}
                  >
                    {item}
                  </button>
                ))}
             </div>
          </div>

          <div className="space-y-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-32 bg-white border border-slate-200 rounded-lg animate-pulse" />
              ))
            ) : payouts.length === 0 ? (
              <div className="py-24 text-center bg-white rounded-lg border border-dashed border-slate-200">
                <Activity className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">No requests found</p>
              </div>
            ) : (
              payouts.map((item) => (
                <Card key={item.rp_id} className="p-4 border border-slate-200 shadow-none rounded-lg bg-white overflow-hidden group hover:border-primary/20 hover:shadow-sm transition-all duration-300">
                  <div className="flex flex-col xl:flex-row gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                         <div className="space-y-0.5">
                            <h4 className="text-sm font-bold text-slate-900 tracking-tight group-hover:text-primary transition-colors">{item.usr_nama}</h4>
                            <p className="text-[10px] font-medium text-slate-500">{item.usr_email}</p>
                         </div>
                         <Badge variant="outline" className={cn(
                            "rounded px-1.5 py-0 text-[8px] font-bold uppercase border shadow-none transition-colors",
                            item.rp_status === 'done' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-indigo-50 text-indigo-600 border-indigo-100"
                         )}>
                            {item.rp_status}
                         </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-0.5">
                            <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Settlement</p>
                            <p className="text-base font-bold text-primary font-heading tracking-tight">{currency(item.rp_amount)}</p>
                         </div>
                         <div className="space-y-0.5">
                            <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Bank Destination</p>
                            <p className="text-[10px] font-bold text-slate-700 uppercase tracking-tight">
                               {item.rp_bank_name} <span className="text-slate-300 mx-0.5">|</span> {item.rp_account_number}
                            </p>
                            <p className="text-[9px] font-medium text-slate-400 italic">a.n {item.rp_account_name}</p>
                         </div>
                      </div>

                      {item.rp_note && (
                        <div className="p-2 bg-amber-50/20 border border-amber-100/50 rounded text-[10px] font-medium text-amber-700 italic group-hover:bg-amber-50/40 transition-colors">
                          <span className="font-bold uppercase not-italic mr-1 text-[8px] opacity-60">Note:</span>
                          "{item.rp_note}"
                        </div>
                      )}
                    </div>

                    <div className="xl:w-64 space-y-2 pt-4 xl:pt-0 xl:pl-4 xl:border-l border-slate-100">
                      <Textarea
                        value={notes[item.rp_id] || ""}
                        onChange={(e) => setNotes((prev) => ({ ...prev, [item.rp_id]: e.target.value }))}
                        rows={2}
                        placeholder="Admin notes..."
                        className="rounded text-[10px] font-medium border-slate-200 shadow-none bg-slate-50/20 focus:bg-white transition-all resize-none"
                      />
                      <div className="flex flex-col gap-1.5">
                        {getNextStatuses(item.rp_status).map((status) => (
                          <Button
                            key={status}
                            size="sm"
                            disabled={savingPayoutId === item.rp_id}
                            onClick={() => handleUpdatePayout(item.rp_id, status)}
                            className={cn(
                              "rounded font-bold uppercase text-[9px] tracking-widest h-8 active:scale-[0.98] transition-all",
                              status === "done" ? "bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-100" : "bg-slate-900 hover:bg-black shadow-sm shadow-slate-200"
                            )}
                          >
                            {savingPayoutId === item.rp_id ? <Loader2 className="h-3 w-3 animate-spin" /> : <ChevronRight className="h-3 w-3 mr-1 group-hover:translate-x-0.5 transition-transform" />}
                            To {status}
                          </Button>
                        ))}
                        {getNextStatuses(item.rp_status).length === 0 && (
                          <div className="flex items-center justify-center gap-1.5 py-2 text-emerald-600 font-bold text-[9px] uppercase italic tracking-wider">
                            <CheckCircle2 className="h-3 w-3" /> Fully Settled
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Settings2({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
  );
}
