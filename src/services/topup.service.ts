import api from "@/lib/api-client";
import { ApiResponse } from "@/types/api";
import { Topup, TopupStatus } from "@/types/topup";

export const topupService = {
  /**
   * Mengambil semua data topup dengan dukungan filter
   * @param query string (e.g. status=pending&metode=transfer)
   */
  getAll: async (query?: string) => {
    const url = query ? `/admin/topup-koin?${query}` : "/admin/topup-koin";
    const res = await api.get<ApiResponse<Topup[]>>(url);
    return res.data;
  },

  /**
   * Validasi Transfer Manual (Approve/Reject)
   */
  confirm: async (topupId: string, status: Extract<TopupStatus, "success" | "failed">) => {
    const res = await api.patch<ApiResponse<null>>("/admin/topup-koin/confirm", {
      topup_id: topupId,
      status: status,
    });
    return res.data;
  },

  /**
   * Ambil detail spesifik topup (Jika diperlukan untuk halaman terpisah)
   */
  getById: async (id: string) => {
    const res = await api.get<ApiResponse<Topup>>(`/admin/topup-koin/${id}`);
    return res.data;
  },

  /**
   * Fitur Sakti: Force Cancel Transaksi Midtrans yang nyangkut
   */
  cancelMidtrans: async (topupId: string) => {
    const res = await api.patch<ApiResponse<null>>("/admin/topup-koin/cancel-midtrans", {
      topup_id: topupId,
    });
    return res.data;
  },
};
