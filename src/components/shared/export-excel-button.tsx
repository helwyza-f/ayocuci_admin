"use client";

import { FileDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { exportToExcel, ExcelColumn } from "@/lib/export-excel";

interface ExportExcelButtonProps<T extends Record<string, any>> {
  data: T[];
  columns: ExcelColumn[];
  filename: string;
  sheetName?: string;
  disabled?: boolean;
  label?: string;
}

export function ExportExcelButton<T extends Record<string, any>>({
  data,
  columns,
  filename,
  sheetName,
  disabled,
  label = "Export Excel",
}: ExportExcelButtonProps<T>) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    if (!data.length) return;
    setLoading(true);
    try {
      // Give UI time to render spinner
      await new Promise((r) => setTimeout(r, 100));
      exportToExcel(data, columns, filename, sheetName);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={disabled || !data.length || loading}
      className="h-8 gap-1.5 text-[10px] font-bold uppercase tracking-wider border-slate-200 text-slate-600 hover:text-emerald-700 hover:border-emerald-200 hover:bg-emerald-50 transition-colors"
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <FileDown className="h-3.5 w-3.5" />
      )}
      {label}
    </Button>
  );
}
