"use client";

import { Wrench, ShieldAlert, AlertTriangle, Construction } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function TransactionFixerPage() {
  return (
    <div className="space-y-6">
      {/* COMMAND BAR HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2 font-heading">
            <Wrench className="h-5 w-5 text-primary" />
            Operational Fixer
          </h1>
          <p className="text-xs font-medium text-slate-500">
            Internal utilities for corrective actions and ledger reconciliation.
          </p>
        </div>

        <div className="flex items-center gap-2">
           <Badge variant="outline" className="h-7 px-2 rounded font-bold text-[8px] uppercase tracking-wider text-amber-600 bg-amber-50 border-amber-100 shadow-none">
              Restricted Area
           </Badge>
        </div>
      </div>

      <Card className="p-16 border border-slate-200 shadow-none rounded-lg bg-white relative overflow-hidden flex flex-col items-center justify-center text-center">
         <div className="h-12 w-12 rounded bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 mb-5">
            <Construction className="h-6 w-6" />
         </div>
         
         <div className="max-w-sm space-y-3">
            <h3 className="text-base font-bold text-slate-900 tracking-tight leading-none font-heading">No active fixer modules</h3>
            <p className="text-[11px] font-medium text-slate-500 leading-relaxed">
              Corrective actions for Midtrans timeouts have been integrated into the <b>Topups & Billing</b> module. This dedicated workspace remains on standby for future diagnostic tools.
            </p>
            
            <div className="pt-4 flex items-center justify-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-300 italic">
               <ShieldAlert className="h-3 w-3" />
               Audit log is tracking this access
            </div>
         </div>
      </Card>
    </div>
  );
}
