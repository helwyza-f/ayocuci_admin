"use client";

import { Activity, ArrowRight, CheckCircle2, Clock, XCircle, ArrowUpRight, Coins } from "lucide-react";
import { Topup } from "@/types/topup";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ActivityFeedProps {
  activities: Topup[];
  isLoading: boolean;
}

export default function ActivityFeed({ activities, isLoading }: ActivityFeedProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col p-4 gap-4 animate-pulse">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-14 w-full bg-slate-50 rounded-lg" />
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-slate-300">
        <Activity className="h-10 w-10 mb-3 opacity-20" />
        <p className="text-[10px] font-black uppercase tracking-widest italic text-slate-400">
          No live transactions detected
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100 overflow-hidden">
      {activities.map((topup) => (
        <div
          key={topup.tk_id}
          className="flex items-center justify-between p-3 hover:bg-slate-50/50 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "h-8 w-8 rounded flex items-center justify-center border",
              getStatusColors(topup.tk_status)
            )}>
              {getStatusIcon(topup.tk_status)}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 tracking-tight leading-none mb-1">
                {topup.outlet_name || "Unknown Outlet"}
              </p>
              <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                 {format(new Date(topup.tk_created), "dd/MM/yy • HH:mm")}
              </div>
            </div>
          </div>
          
          <div className="text-right space-y-0.5">
            <div className="flex items-center justify-end gap-1 font-bold text-slate-900 text-[11px]">
               {topup.tk_jumlah?.toLocaleString()} 
               <Coins className="h-3 w-3 text-primary" />
            </div>
            <div className="flex items-center justify-end gap-2 text-[9px] font-medium text-slate-500 uppercase tracking-tighter">
               <span>{topup.tk_metode_bayar}</span>
               <div className="h-0.5 w-0.5 bg-slate-300 rounded-full" />
               <span className="font-bold">Rp {topup.tk_total?.toLocaleString("id-ID")}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function getStatusIcon(status: string) {
  switch (status) {
    case "success":
      return <CheckCircle2 className="h-3.5 w-3.5" />;
    case "failed":
      return <XCircle className="h-3.5 w-3.5" />;
    default:
      return <Clock className="h-3.5 w-3.5" />;
  }
}

function getStatusColors(status: string) {
  switch (status) {
    case "success":
      return "bg-emerald-50 text-emerald-600 border-emerald-100";
    case "failed":
      return "bg-rose-50 text-rose-600 border-rose-100";
    default:
      return "bg-amber-50 text-amber-600 border-amber-100";
  }
}
