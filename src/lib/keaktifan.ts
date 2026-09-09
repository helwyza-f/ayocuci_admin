/**
 * Status Keaktifan Nasabah (outlet) — berbasis transaksi laundry terakhir.
 * Dua tingkat "aktif" sesuai permintaan tim bisnis:
 *   - Aktif (7 hari)   : ada transaksi <= 7 hari
 *   - Aktif (30 hari)  : transaksi terakhir 8-30 hari lalu
 *   - Pasif            : transaksi terakhir 31-60 hari lalu
 *   - Dorman           : transaksi terakhir > 60 hari lalu
 *   - Belum transaksi  : tidak pernah membuat nota
 */
export type KeaktifanKey =
  | "aktif_7d"
  | "aktif_30d"
  | "pasif"
  | "dorman"
  | "belum";

export interface KeaktifanInfo {
  key: KeaktifanKey;
  label: string;
  /** Label ringkas untuk badge di tabel. */
  shortLabel: string;
  /** Kelas Tailwind untuk Badge. */
  badgeClass: string;
  /** Hari sejak transaksi terakhir (null bila belum pernah). */
  daysSince: number | null;
}

export const KEAKTIFAN_ORDER: KeaktifanKey[] = [
  "aktif_7d",
  "aktif_30d",
  "pasif",
  "dorman",
  "belum",
];

export const KEAKTIFAN_META: Record<
  KeaktifanKey,
  { label: string; shortLabel: string; badgeClass: string }
> = {
  aktif_7d: {
    label: "Aktif (7 hari)",
    shortLabel: "Aktif 7h",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  aktif_30d: {
    label: "Aktif (30 hari)",
    shortLabel: "Aktif 30h",
    badgeClass: "bg-lime-50 text-lime-700 border-lime-200",
  },
  pasif: {
    label: "Pasif (31-60 hari)",
    shortLabel: "Pasif",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
  },
  dorman: {
    label: "Dorman (>60 hari)",
    shortLabel: "Dorman",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
  },
  belum: {
    label: "Belum pernah transaksi",
    shortLabel: "Belum TX",
    badgeClass: "bg-slate-100 text-slate-600 border-slate-200",
  },
};

interface KeaktifanInput {
  last_tx_at?: string | null;
  total_tx_count?: number | null;
}

export function deriveKeaktifan(t: KeaktifanInput): KeaktifanInfo {
  const raw = t.last_tx_at ? new Date(t.last_tx_at) : null;
  const valid = raw && !Number.isNaN(raw.getTime());
  const hasTx = valid || Number(t.total_tx_count || 0) > 0;

  if (!hasTx || !valid) {
    return { key: "belum", daysSince: null, ...KEAKTIFAN_META.belum };
  }

  const daysSince = Math.floor(
    (Date.now() - raw.getTime()) / (1000 * 60 * 60 * 24),
  );

  let key: KeaktifanKey;
  if (daysSince <= 7) key = "aktif_7d";
  else if (daysSince <= 30) key = "aktif_30d";
  else if (daysSince <= 60) key = "pasif";
  else key = "dorman";

  return { key, daysSince, ...KEAKTIFAN_META[key] };
}
