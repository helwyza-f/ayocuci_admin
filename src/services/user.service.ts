import api from "@/lib/api-client";

export const userService = {
  // Ambil detail owner (user) secara komprehensif
  getOwnerDetail: async (id: string) => {
    const response = await api.get(`/users/${id}`);
    return response.data; // Expected format: { status: true, data: { profile, stats, recruits, outlets } }
  },

  // (Optional) Update status owner atau role jika diperlukan nanti
  updateUserStatus: async (id: string, status: number) => {
    const response = await api.patch(`/users/${id}/status`, { status });
    return response.data;
  }
};
