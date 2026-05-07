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
    const url = query ? `/addons?${query}` : "/addons";
    const res = await api.get<ApiResponse<AddonTransaction[]>>(url);
    return res.data;
  },

  approve: async (id: string) => {
    const res = await api.patch<ApiResponse<null>>(`/addons/approve?id=${id}`);
    return res.data;
  },

  reject: async (id: string) => {
    const res = await api.patch<ApiResponse<null>>(`/addons/cancel?id=${id}`);
    return res.data;
  },

  getById: async (id: string) => {
    const res = await api.get<ApiResponse<AddonTransaction>>(`/addons/${id}`);
    return res.data;
  },
};
