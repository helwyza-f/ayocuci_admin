// economy.service.ts
import api from "@/lib/api-client";
import { Voucher } from "@/types/voucher";
import { EconomyConfig, KoinPackage } from "@/types/domain";
import { ApiResponse } from "@/types/api";

export const economyService = {
  // Configs
  getConfigs: () => api.get<ApiResponse<EconomyConfig[]>>("/admin/economy/configs"),
  updateConfig: (key: string, value: string) =>
    api.patch("/admin/economy/configs", { key, value }),

  // Vouchers
  getVouchers: () => api.get<ApiResponse<Voucher[]>>("/admin/vouchers"),
  createVoucher: (data: Partial<Voucher>) => api.post("/admin/vouchers/", data),
  toggleVoucher: (id: string, status: number) =>
    api.patch(`/admin/vouchers/${id}/status`, { status }),

  // 🚀 Koin Packages (Dinamis untuk Mobile)
  getPackages: () => api.get<ApiResponse<KoinPackage[]>>("/admin/economy/packages"),
  createPackage: (data: { jumlah_koin: number; discount_pct: number }) =>
    api.post("/admin/economy/packages", data),
  deletePackage: (id: number) => api.delete(`/admin/economy/packages/${id}`),
};
