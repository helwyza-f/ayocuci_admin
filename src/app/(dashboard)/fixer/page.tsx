"use client";

import { Wrench, ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function TransactionFixerPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Perbaikan <span className="text-[#FF4500]">Transaksi</span>
        </h2>
        <p className="text-sm font-medium text-slate-500">
          Area tindakan korektif untuk transaksi bermasalah.
        </p>
      </div>

      <Card className="p-8">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-amber-50 p-3 text-amber-600">
            <Wrench className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-slate-900">
              Belum ada action fixer yang aktif
            </h3>
            <p className="max-w-2xl text-sm leading-6 text-slate-500">
              Untuk saat ini pembatalan Midtrans yang tersangkut sudah tersedia
              di halaman Topup & Tagihan. Halaman ini disiapkan sebagai tempat
              action korektif tambahan agar route tidak lagi 404.
            </p>
          </div>
          <ShieldAlert className="ml-auto h-5 w-5 text-slate-300" />
        </div>
      </Card>
    </div>
  );
}
