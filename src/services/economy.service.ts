// economy.service.ts
import api from "@/lib/api-client";
import { Voucher } from "@/types/voucher";
import { EconomyConfig, KoinPackage } from "@/types/domain";
import { ApiResponse } from "@/types/api";

export const economyService = {
  // Configs
  getConfigs: () => api.get<ApiResponse<EconomyConfig[]>>("/economy/configs"),
  updateConfig: (key: string, value: string) =>
    api.patch("/economy/configs", { key, value }),

  // Vouchers
  getVouchers: () => api.get<ApiResponse<Voucher[]>>("/vouchers"),
  createVoucher: (data: Partial<Voucher>) => api.post("/vouchers/", data),
  toggleVoucher: (id: string, status: number) =>
    api.patch(`/vouchers/${id}/status`, { status }),

  // 🚀 Koin Packages (Dinamis untuk Mobile)
  getPackages: () => api.get<ApiResponse<KoinPackage[]>>("/economy/packages"),
  createPackage: (data: { jumlah_koin: number; discount_pct: number }) =>
    api.post("/economy/packages", data),
  deletePackage: (id: number) => api.delete(`/economy/packages/${id}`),
};
