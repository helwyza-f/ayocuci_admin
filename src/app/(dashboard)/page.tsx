"use client";

import { Store, Coins, Zap, Activity, ArrowRight, RefreshCw, LayoutGrid, MessageSquare, AlertCircle } from "lucide-react";
import StatCard from "@/components/modules/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { ApiResponse } from "@/types/api";
import useSWR from "swr";
import { apiFetcher } from "@/lib/fetcher";
import Link from "next/link";
import ActivityFeed from "@/components/modules/dashboard/activity-feed";
import { Topup } from "@/types/topup";
import { cn } from "@/lib/utils";

interface DashboardSummary {
  total_outlets: number;
  total_koin: number;
  active_tenant: number;
}

const emptyStats: DashboardSummary = {
  total_outlets: 0,
  total_koin: 0,
  active_tenant: 0,
};

export default function DashboardPage() {
  const { data, error, isLoading, mutate } = useSWR<
    ApiResponse<DashboardSummary>
  >("/summary", apiFetcher, {
    dedupingInterval: 60_000,
    keepPreviousData: true,
    revalidateOnFocus: false,
  });

  const { data: activityData, isLoading: isActivityLoading } = useSWR<
    ApiResponse<Topup[]>
  >("/topup-koin", apiFetcher, {
    dedupingInterval: 30_000,
  });

  const stats = data?.data || emptyStats;
  const activities = (activityData?.data || []).slice(0, 10);

  return (
    <div className="space-y-6">
      {/* COMMAND BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2 font-heading">
            <LayoutGrid className="h-5 w-5 text-primary" />
            Platform Monitoring
          </h1>
          <p className="text-xs font-medium text-slate-500">
            Real-time operational summary of the AyoCuci ecosystem.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => mutate()}
          disabled={isLoading}
          className="h-8 px-3 font-bold text-[10px] uppercase tracking-wider gap-2 border-slate-200"
        >
          <RefreshCw className={cn("h-3 w-3", isLoading && "animate-spin")} />
          Refresh Stats
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-[11px] font-bold text-rose-600 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* METRICS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Registered Outlets"
          value={isLoading ? "..." : stats.total_outlets}
          icon={Store}
        />
        <StatCard
          label="Coins Circulation"
          value={isLoading ? "..." : stats.total_koin.toLocaleString("id-ID")}
          icon={Coins}
        />
        <StatCard
          label="Active Subscriptions"
          value={isLoading ? "..." : stats.active_tenant}
          icon={Zap}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* OPERATIONAL ACTIVITY FEED */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Activity className="h-3.5 w-3.5" />
              Recent Transaction Events
            </h3>
            <Link href="/topups">
              <Button
                variant="ghost"
                size="sm"
                className="text-primary font-bold text-[9px] uppercase tracking-wider h-7"
              >
                View Full Ledger <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </div>

          <div className="min-h-[400px] rounded-lg border border-slate-200 bg-white overflow-hidden">
            <ActivityFeed
              activities={activities}
              isLoading={isActivityLoading}
            />
          </div>
        </div>

        {/* SYSTEM ACTIONS & ALERTS */}
        <div className="space-y-4">
          <div className="space-y-3">
             <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">
                Admin Utilities
             </h3>
             <div className="rounded-lg bg-slate-900 p-5 text-white border border-slate-800 relative overflow-hidden">
                <div className="relative z-10 space-y-3">
                  <div className="flex items-center gap-2 text-primary">
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span className="text-[9px] font-bold uppercase tracking-widest">Broadcast Alert</span>
                  </div>
                  <p className="text-[11px] font-medium text-slate-400 leading-relaxed">
                    12 tenants have pending validations. Consider sending a global reminder.
                  </p>
                  <Button className="w-full h-8 bg-primary hover:bg-primary/90 text-white font-bold rounded-md text-[10px] tracking-wider">
                    TRIGGER PUSH REMINDER
                  </Button>
                </div>
             </div>
          </div>

          <div className="p-4 border border-slate-200 bg-white rounded-lg space-y-3">
             <div className="flex items-center gap-2 text-slate-400">
                <AlertCircle className="h-3.5 w-3.5" />
                <span className="text-[9px] font-bold uppercase tracking-widest">System Latency</span>
             </div>
             <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-600">
                   <span>Gateway Latency</span>
                   <span className="text-emerald-500 italic">24ms</span>
                </div>
                <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                   <div className="h-full bg-emerald-500 w-[98%]" />
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
