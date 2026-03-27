import api from "@/lib/api-client";

export const topupService = {
  /**
   * Mengambil semua data topup dengan dukungan filter
   * @param query string (e.g. status=pending&metode=transfer)
   */
  getAll: async (query?: string) => {
    const url = query ? `/admin/topup-koin?${query}` : "/admin/topup-koin";
    const res = await api.get(url);
    return res.data;
  },

  /**
   * Validasi Transfer Manual (Approve/Reject)
   */
  confirm: async (topupId: string, status: "success" | "failed") => {
    const res = await api.patch("/admin/topup-koin/confirm", {
      topup_id: topupId,
      status: status,
    });
    return res.data;
  },

  /**
   * Ambil detail spesifik topup (Jika diperlukan untuk halaman terpisah)
   */
  getById: async (id: string) => {
    const res = await api.get(`/admin/topup-koin/${id}`);
    return res.data;
  },

  /**
   * Fitur Sakti: Force Cancel Transaksi Midtrans yang nyangkut
   */
  cancelMidtrans: async (topupId: string) => {
    const res = await api.patch("/admin/topup-koin/cancel-midtrans", {
      topup_id: topupId,
    });
    return res.data;
  },
};
