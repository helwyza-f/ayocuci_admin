"use client";

import { FileText, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function SubscriptionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Riwayat <span className="text-[#FF4500]">Langganan</span>
        </h2>
        <p className="text-sm font-medium text-slate-500">
          Riwayat paket tenant akan ditampilkan di sini.
        </p>
      </div>

      <Card className="p-8">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-slate-100 p-3 text-slate-600">
            <FileText className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-slate-900">
              Endpoint riwayat langganan belum aktif
            </h3>
            <p className="max-w-2xl text-sm leading-6 text-slate-500">
              Halaman placeholder ini mencegah prefetch/navigation 404.
              Implementasi list bisa disambungkan setelah backend menyediakan
              endpoint riwayat langganan admin.
            </p>
          </div>
          <Clock className="ml-auto h-5 w-5 text-slate-300" />
        </div>
      </Card>
    </div>
  );
}
