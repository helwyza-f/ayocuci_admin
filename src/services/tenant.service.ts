import api from "@/lib/api-client";

export const tenantService = {
  // Ambil semua tenant
  getAllTenants: async () => {
    const response = await api.get("/admin/tenants");
    return response.data; // Response format: { status: true, data: [...] }
  },

  // Ambil detail tenant berdasarkan ID
  getTenantDetail: async (id: string) => {
    const response = await api.get(`/admin/tenants/${id}`);
    return response.data;
  },

  // Adjust koin (Fitur yang tadi kita buat di Go)
  adjustKoin: async (ot_id: string, amount: number, reason: string) => {
    const response = await api.post("/admin/economy/adjust-koin", {
      ot_id,
      amount,
      reason,
    });
    return response.data;
  },
};
