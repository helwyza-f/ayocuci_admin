"use client";

import { Activity, ArrowRight, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Topup } from "@/types/topup";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface ActivityFeedProps {
  activities: Topup[];
  isLoading: boolean;
}

export default function ActivityFeed({ activities, isLoading }: ActivityFeedProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 animate-pulse">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 w-full bg-slate-50 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[350px] text-slate-300">
        <Activity className="h-12 w-12 mb-2 opacity-20" />
        <p className="text-xs font-semibold uppercase tracking-widest">
          Belum ada aktivitas transaksi.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.slice(0, 8).map((topup) => (
        <div
          key={topup.tk_id}
          className="flex items-center justify-between p-4 rounded-2xl border border-slate-50 bg-white hover:bg-slate-50/50 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${getStatusBg(topup.tk_status)}`}>
              {getStatusIcon(topup.tk_status)}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">
                {topup.outlet_name || "Outlet Tanpa Nama"}
              </p>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                {format(new Date(topup.tk_created), "dd MMM yyyy • HH:mm", {
                  locale: id,
                })}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-black text-slate-900">
              IDR {(topup.tk_total || 0).toLocaleString("id-ID")}
            </p>
            <p className="text-[10px] font-bold text-[#FF4500] uppercase">
              {topup.tk_metode_bayar}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function getStatusIcon(status: string) {
  switch (status) {
    case "success":
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    case "failed":
      return <XCircle className="h-4 w-4 text-red-600" />;
    default:
      return <Clock className="h-4 w-4 text-orange-500" />;
  }
}

function getStatusBg(status: string) {
  switch (status) {
    case "success":
      return "bg-green-50";
    case "failed":
      return "bg-red-50";
    default:
      return "bg-orange-50";
  }
}
