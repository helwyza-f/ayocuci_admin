"use client";

import { Activity, CheckCircle2, Clock, XCircle, Coins, Zap } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { getTopupStatusUi, isTopupActionable, normalizeTopupStatus } from "@/lib/topup-status";

function formatMetodeLabel(metode?: string): string {
  const key = (metode || "").toLowerCase();
  if (key === "iap_topup" || key === "iap") return "Apple IAP";
  if (key === "midtrans") return "Midtrans";
  if (key === "transfer") return "Transfer";
  return metode || "-";
}

export interface ActivityFeedItem {
  tk_id: string;
  tk_created: string;
  tk_jumlah?: number;
  tk_total?: number;
  tk_status: string;
  tk_metode_bayar: string;
  tk_bukti?: string | null;
  outlet_name?: string;
  owner_name?: string;
  owner_code?: string;
  type: "koin" | "addon";
  item_names?: string;
  tk_lastupdate?: string | null;
  tk_tanggal_validasi?: string | null;
  tk_staf_validasi?: string | null;
}

interface ActivityFeedProps {
  activities: ActivityFeedItem[];
  isLoading: boolean;
  onVerify?: (item: ActivityFeedItem) => void;
}

export default function ActivityFeed({ activities, isLoading, onVerify }: ActivityFeedProps) {
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
          Belum ada aktivitas transaksi terbaru
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100 overflow-hidden">
      {activities.map((item) => {
        const isActionable = isTopupActionable(item.tk_status);
        const statusUi = getTopupStatusUi(item.tk_status);

        return (
        <div
          key={item.tk_id}
          className="flex items-center justify-between p-3 hover:bg-slate-50/80 transition-all duration-300 group rounded-xl border border-transparent hover:border-slate-100 hover:shadow-sm hover:translate-x-1"
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "h-10 w-10 rounded-xl flex items-center justify-center border transition-all duration-300 group-hover:scale-110",
              statusUi.className
            )}>
              {item.type === 'addon' ? <Zap className="h-4 w-4" /> : getStatusIcon(item.tk_status)}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 tracking-tight leading-none mb-1.5 group-hover:text-primary transition-colors">
                {item.type === 'addon' ? item.item_names : (item.outlet_name || "Outlet tidak tersedia")}
              </p>
              <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                 <span className={cn("px-1.5 py-0.5 rounded-md", item.type === 'addon' ? "bg-orange-50 text-orange-600" : "bg-primary/10 text-primary")}>
                    {item.type === 'addon' ? 'Addon' : 'Koin'}
                 </span>
                 <div className="h-1 w-1 bg-slate-300 rounded-full" />
                 {format(new Date(item.tk_created), "dd/MM/yy • HH:mm")}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="text-right space-y-0.5">
               <div className="flex items-center justify-end gap-1 font-bold text-slate-900 text-[11px]">
                  {item.type === 'koin' ? (
                    <>
                      {item.tk_jumlah?.toLocaleString()} 
                      <Coins className="h-3 w-3 text-primary" />
                    </>
                  ) : (
                    <span className="text-orange-600 uppercase text-[9px] tracking-tighter">Feature Active</span>
                  )}
               </div>
               <div className="flex items-center justify-end gap-2 text-[9px] font-medium text-slate-500 uppercase tracking-tighter">
                  <span>{formatMetodeLabel(item.tk_metode_bayar)}</span>
                  <div className="h-0.5 w-0.5 bg-slate-300 rounded-full" />
                  <span className="font-bold">Rp {item.tk_total?.toLocaleString("id-ID")}</span>
               </div>
             </div>

             {onVerify && (
               <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onVerify(item)}
               className="h-8 px-3 font-bold text-[10px] uppercase text-primary bg-primary/5 hover:bg-primary/10 border border-primary/10 shadow-sm"
               >
                 {isActionable ? "Tinjau" : "Detail"}
               </Button>
             )}
          </div>
        </div>
        );
      })}
    </div>
  );
}

function getStatusIcon(status: string) {
  switch (normalizeTopupStatus(status)) {
    case "success":
    case "completed":
    case "accepted":
      return <CheckCircle2 className="h-3.5 w-3.5" />;
    case "failed":
    case "rejected":
    case "expired":
      return <XCircle className="h-3.5 w-3.5" />;
    default:
      return <Clock className="h-3.5 w-3.5" />;
  }
}
