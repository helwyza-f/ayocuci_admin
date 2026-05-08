import api from "@/lib/api-client";
import { ApiResponse } from "@/types/api";

export interface RevenuePoint {
  date: string;
  topup_revenue: number;
  addon_revenue: number;
  total_revenue: number;
}

export interface RevenueSummary {
  total_revenue: number;
  topup_revenue: number;
  addon_revenue: number;
  avg_daily_revenue: number;
  series: RevenuePoint[];
}

export interface GrowthPoint {
  date: string;
  new_owners: number;
  organic_owners: number;
  referral_owners: number;
  new_outlets: number;
}

export interface GrowthSummary {
  total_new_owners: number;
  total_organic_owners: number;
  total_referral_owners: number;
  total_new_outlets: number;
  recent_new_owners: number; // 3 hari terakhir
  trial_outlets: number;
  pro_outlets: number;
  expired_outlets: number;
  conversion_rate: number;
  series: GrowthPoint[];
}

export interface GeoPoint {
  name: string;
  count: number;
  percentage: number;
}

export interface GeoSummary {
  top_provinsi: GeoPoint[];
  top_kota: GeoPoint[];
  total_outlets: number;
}

export interface ActivityPoint {
  date: string;
  active_outlets: number;
  total_orders: number;
  gmv: number;
}

export interface ActivitySummary {
  today_active_outlets: number;
  today_orders: number;
  today_gmv: number;
  total_workforce: number;
  total_customers: number;
  avg_orders_per_outlet: number;
  series: ActivityPoint[];
}

export interface TopReferrer {
  name: string;
  email: string;
  recruits: number;
  total_reward: number;
}

export interface ReferralSummary {
  total_reward_distributed: number;
  total_referral_users: number;
  pending_payouts: number;
  pending_payout_amount: number;
  top_referrers: TopReferrer[];
}

export const analyticsService = {
  getRevenue: async (days = 30) => {
    const res = await api.get<ApiResponse<RevenueSummary>>(`/analytics/revenue?days=${days}`);
    return res.data.data;
  },
  getGrowth: async (days = 30) => {
    const res = await api.get<ApiResponse<GrowthSummary>>(`/analytics/growth?days=${days}`);
    return res.data.data;
  },
  getGeography: async () => {
    const res = await api.get<ApiResponse<GeoSummary>>(`/analytics/geography`);
    return res.data.data;
  },
  getActivity: async (days = 30) => {
    const res = await api.get<ApiResponse<ActivitySummary>>(`/analytics/activity?days=${days}`);
    return res.data.data;
  },
  getReferral: async (days = 30) => {
    const res = await api.get<ApiResponse<ReferralSummary>>(`/analytics/referral?days=${days}`);
    return res.data.data;
  },
};
