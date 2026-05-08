"use client";

import { useState } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { CalendarDays, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface DateRange {
  start: string; // yyyy-MM-dd
  end: string;   // yyyy-MM-dd
}

const toDateStr = (d: Date) => d.toISOString().split("T")[0];
const today = () => toDateStr(new Date());
const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toDateStr(d);
};
const startOfMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
};

export const PRESETS = [
  { label: "Hari Ini",  getRange: () => ({ start: today(), end: today() }) },
  { label: "7 Hari",   getRange: () => ({ start: daysAgo(6), end: today() }) },
  { label: "Bulan Ini",getRange: () => ({ start: startOfMonth(), end: today() }) },
  { label: "Semua",    getRange: () => ({ start: "", end: "" }) },
];

/**
 * Utility: filter array by date field
 */
export function filterByDateRange<T>(
  items: T[],
  getDate: (item: T) => string | undefined,
  range: DateRange
): T[] {
  if (!range.start && !range.end) return items;
  return items.filter((item) => {
    const raw = getDate(item);
    if (!raw) return false;
    const d = raw.split("T")[0];
    if (range.start && d < range.start) return false;
    if (range.end && d > range.end) return false;
    return true;
  });
}

// ─── Single date picker popover ──────────────────────────────
function DatePickerButton({
  value,
  placeholder,
  onChange,
  fromDate,
}: {
  value: string;
  placeholder: string;
  onChange: (val: string) => void;
  fromDate?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = value ? new Date(value + "T00:00:00") : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "inline-flex h-7 items-center gap-1.5 rounded border px-2 text-[10px] font-bold transition-colors",
            value
              ? "border-primary/30 bg-primary/5 text-primary"
              : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700"
          )}
        >
          <CalendarDays className="h-3 w-3 shrink-0" />
          <span>{value ? format(new Date(value + "T00:00:00"), "dd MMM yy", { locale: localeId }) : placeholder}</span>
          <ChevronDown className="h-2.5 w-2.5 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(d) => {
            if (d) { onChange(toDateStr(d)); setOpen(false); }
          }}
          fromDate={fromDate ? new Date(fromDate + "T00:00:00") : undefined}
          toDate={new Date()}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

// ─── Main DateRangeFilter ────────────────────────────────────
interface DateRangeFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

export default function DateRangeFilter({ value, onChange, className }: DateRangeFilterProps) {
  const activePreset = PRESETS.find((p) => {
    const r = p.getRange();
    if (!r.start && !r.end) return !value.start && !value.end;
    return r.start === value.start && r.end === value.end;
  });

  const hasRange = value.start || value.end;

  return (
    <div className={cn("flex flex-wrap items-center gap-1", className)}>
      {/* Quick preset buttons */}
      {PRESETS.map((p) => (
        <button
          key={p.label}
          onClick={() => onChange(p.getRange())}
          className={cn(
            "rounded px-2 h-7 text-[9px] font-bold uppercase tracking-tight transition-all",
            activePreset?.label === p.label
              ? "bg-primary text-white shadow-sm"
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
          )}
        >
          {p.label}
        </button>
      ))}

      <div className="h-4 w-px bg-slate-200 mx-0.5" />

      {/* Calendar date pickers */}
      <DatePickerButton
        value={value.start}
        placeholder="Dari"
        onChange={(v) => onChange({ ...value, start: v })}
      />
      <span className="text-[9px] font-bold text-slate-400">—</span>
      <DatePickerButton
        value={value.end}
        placeholder="Sampai"
        onChange={(v) => onChange({ ...value, end: v })}
        fromDate={value.start || undefined}
      />

      {/* Clear */}
      {hasRange && !activePreset && (
        <button
          onClick={() => onChange({ start: "", end: "" })}
          className="h-7 w-7 rounded flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
