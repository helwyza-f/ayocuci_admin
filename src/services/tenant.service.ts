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
};
