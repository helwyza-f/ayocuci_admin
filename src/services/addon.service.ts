import api from "@/lib/api-client";
import { ApiResponse } from "@/types/api";

export type AddonStatus = "PENDING" | "PENDING_VALIDATION" | "SUCCESS" | "FAILED" | "CANCELED";

export interface AddonTransaction {
  ha_id: string;
  ha_outlet: string;
  outlet_name: string;
  owner_name: string;
  ha_total: number;
  ha_metode_bayar: string;
  ha_status: AddonStatus;
  ha_bukti: string | null;
  bank_name: string;
  item_names: string;
  ha_created: string;
  ha_tanggal_validasi: string | null;
}

export const addonService = {
  getAll: async (query?: string) => {
    const url = query ? `/topup-addon?${query}` : "/topup-addon";
    const res = await api.get<ApiResponse<AddonTransaction[]>>(url);
    return res.data;
  },

  approve: async (ha_id: string) => {
    const res = await api.patch<ApiResponse<null>>("/topup-addon/confirm", { ha_id });
    return res.data;
  },

  reject: async (ha_id: string) => {
    const res = await api.patch<ApiResponse<null>>("/topup-addon/cancel", { ha_id });
    return res.data;
  },

  getById: async (id: string) => {
    const res = await api.get<ApiResponse<AddonTransaction>>(`/topup-addon/${id}`);
    return res.data;
  },
};
