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

  // Hapus outlet beserta data operasionalnya
  deleteTenant: async (id: string) => {
    const response = await api.delete(`/tenants/${id}`);
    return response.data;
  },

  // Inject koin ke outlet
  injectCoin: async (id: string, jumlahKoin: number, alasan: string, bukti?: File) => {
    const formData = new FormData();
    formData.append("jumlah_koin", jumlahKoin.toString());
    formData.append("alasan", alasan);
    if (bukti) {
      formData.append("bukti", bukti);
    }
    const response = await api.post(`/tenants/${id}/inject-koin`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },
};


