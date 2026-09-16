import api from "@/lib/api-client";
import { ApiResponse } from "@/types/api";

export type SalesTier = "hot" | "warm" | "cold";
export type ContactStatus = "baru" | "dihubungi" | "tertarik" | "closing" | "gagal";

export interface SalesTarget {
  outlet_id: string;
  outlet_name: string;
  owner_id: number;
  owner_name: string;
  owner_phone: string;
  outlet_phone: string;
  lead_source: string;
  city: string;
  plan: "PRO" | "FREE";
  koin: number;
  created_at: string | null;
  total_tx: number;
  omzet: number;
  last_tx_at: string | null;
  tx_count_7d: number;
  tx_count_30d: number;
  days_since_last_tx: number | null;
  score: number;
  tier: SalesTier;
  reasons: string[];
  data_flag?: string;
  contact_status: ContactStatus;
  contact_note?: string;
  contact_by?: string;
  contact_at?: string | null;
}

export interface SalesTargetSummary {
  total: number;
  hot: number;
  warm: number;
  cold: number;
}

export interface SalesTargetResponse {
  summary: SalesTargetSummary;
  data: SalesTarget[];
}

export interface SalesTargetFilter {
  tier?: SalesTier | "";
  channel?: string;
  search?: string;
  onlyActive?: boolean;
  limit?: number;
}

export const salesTargetService = {
  list: async (filter: SalesTargetFilter = {}) => {
    const params = new URLSearchParams();
    if (filter.tier) params.set("tier", filter.tier);
    if (filter.channel) params.set("channel", filter.channel);
    if (filter.search) params.set("search", filter.search);
    if (filter.onlyActive === false) params.set("only_active", "false");
    if (filter.limit) params.set("limit", String(filter.limit));
    const qs = params.toString();
    const res = await api.get<ApiResponse<SalesTargetResponse>>(
      `/sales-targets${qs ? `?${qs}` : ""}`,
    );
    return res.data.data;
  },

  setContact: async (outletId: string, status: ContactStatus, note?: string) => {
    const res = await api.patch<ApiResponse<unknown>>(
      `/sales-targets/${encodeURIComponent(outletId)}/contact`,
      { status, note },
    );
    return res.data;
  },
};
