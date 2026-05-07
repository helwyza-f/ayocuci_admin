import api from "@/lib/api-client";

export const tenantService = {
  // Ambil semua tenant
  getAllTenants: async () => {
    const response = await api.get("/tenants");
    return response.data; // Response format: { status: true, data: [...] }
  },

  // Ambil detail tenant berdasarkan ID
  getTenantDetail: async (id: string) => {
    const response = await api.get(`/tenants/${id}`);
    return response.data;
  },

  // Perbarui status operasional tenant (1: Aktif, 0: Suspend)
  updateStatus: async (id: string, status: number) => {
    const response = await api.patch(`/tenants/${id}/status`, { status });
    return response.data;
  },
};
