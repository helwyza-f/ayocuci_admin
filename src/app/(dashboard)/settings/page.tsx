"use client";

import { Settings, SlidersHorizontal } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Pengaturan <span className="text-[#FF4500]">Global</span>
        </h2>
        <p className="text-sm font-medium text-slate-500">
          Pusat konfigurasi platform admin.
        </p>
      </div>

      <Card className="p-8">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-orange-50 p-3 text-[#FF4500]">
            <Settings className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-slate-900">
              Modul pengaturan sedang disiapkan
            </h3>
            <p className="max-w-2xl text-sm leading-6 text-slate-500">
              Konfigurasi ekonomi dan rekening saat ini sudah tersedia di menu
              Ekonomi. Halaman ini disiapkan agar navigasi admin tidak 404 dan
              bisa dipakai untuk pengaturan lintas modul berikutnya.
            </p>
          </div>
          <SlidersHorizontal className="ml-auto h-5 w-5 text-slate-300" />
        </div>
      </Card>
    </div>
  );
}
