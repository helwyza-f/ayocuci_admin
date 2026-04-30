import api from "@/lib/api-client";
import { ApiResponse } from "@/types/api";
import {
  ReferralAdminPayout,
  ReferralAdminSummary,
  ReferralConfig,
} from "@/types/domain";

export const referralAdminService = {
  getDashboard: () =>
    api.get<ApiResponse<ReferralAdminSummary>>("/referrals/dashboard"),
  getConfig: () => api.get<ApiResponse<ReferralConfig>>("/referrals/config"),
  updateConfig: (value: string) =>
    api.patch("/referrals/config", { value }),
  getPayouts: (status = "all") =>
    api.get<ApiResponse<ReferralAdminPayout[]>>(
      `/referrals/payouts?status=${status}`,
    ),
  updatePayoutStatus: (
    id: string,
    payload: { status: string; admin_note?: string },
  ) => api.patch(`/referrals/payouts/${id}/status`, payload),
};
