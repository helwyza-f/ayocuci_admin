import api from "@/lib/api-client";
import { ApiResponse } from "@/types/api";

export interface AnalyticsQuery {
  days?: number;
  startDate?: string;
  endDate?: string;
}

type AnalyticsQueryInput = AnalyticsQuery | number;

const normalizeAnalyticsQuery = (query: AnalyticsQueryInput = { days: 30 }): AnalyticsQuery => {
  if (typeof query === "number") {
    return { days: query };
  }
  return query;
};

const buildAnalyticsQuery = (query: AnalyticsQueryInput = {}) => {
  const normalized = normalizeAnalyticsQuery(query);
  const params = new URLSearchParams();

  if (normalized.startDate || normalized.endDate) {
    const startDate = normalized.startDate || normalized.endDate;
    const endDate = normalized.endDate || normalized.startDate;
    if (startDate) params.set("start_date", startDate);
    if (endDate) params.set("end_date", endDate);
  } else {
    params.set("days", String(normalized.days ?? 30));
  }

  return params.toString();
};

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
  referral_topup_revenue: number;
  referral_topup_owners: number;
  non_referral_topup_revenue: number;
  non_referral_topup_owners: number;
  total_topup_revenue: number;
  top_referrers: TopReferrer[];
}

export interface TopupExportRow {
  category: string;
  owner_code: string;
  owner_name: string;
  total_outlets: number;
  registration_date: string;
  total_topup: number;
  avg_topup: number;
  referrer_name: string | null;
  referrer_code: string | null;
  referral_code: string | null;
}

export interface InactiveOwner {
  id: string;
  name: string;
  email: string;
  total_outlets: number;
  last_transaction_date: string | null;
}

export interface InactiveOwnerSummary {
  days: number;
  total: number;
  owners: InactiveOwner[];
}

export const analyticsService = {
  getRevenue: async (query: AnalyticsQueryInput = { days: 30 }) => {
    const res = await api.get<ApiResponse<RevenueSummary>>(`/analytics/revenue?${buildAnalyticsQuery(query)}`);
    return res.data.data;
  },
  getGrowth: async (query: AnalyticsQueryInput = { days: 30 }) => {
    const res = await api.get<ApiResponse<GrowthSummary>>(`/analytics/growth?${buildAnalyticsQuery(query)}`);
    return res.data.data;
  },
  getGeography: async (query: AnalyticsQueryInput = { days: 30 }) => {
    const res = await api.get<ApiResponse<GeoSummary>>(`/analytics/geography?${buildAnalyticsQuery(query)}`);
    return res.data.data;
  },
  getActivity: async (query: AnalyticsQueryInput = { days: 30 }) => {
    const res = await api.get<ApiResponse<ActivitySummary>>(`/analytics/activity?${buildAnalyticsQuery(query)}`);
    return res.data.data;
  },
  getReferral: async (query: AnalyticsQueryInput = { days: 30 }) => {
    const res = await api.get<ApiResponse<ReferralSummary>>(`/analytics/referral?${buildAnalyticsQuery(query)}`);
    return res.data.data;
  },
  getReferralTopupDetails: async (query: AnalyticsQueryInput = { days: 30 }) => {
    const res = await api.get<ApiResponse<TopupExportRow[]>>(`/analytics/referral-topup-details?${buildAnalyticsQuery(query)}`);
    return res.data.data;
  },
  getInactiveOwners: async (query: AnalyticsQueryInput = { days: 30 }) => {
    const res = await api.get<ApiResponse<InactiveOwnerSummary>>(`/analytics/inactive-owners?${buildAnalyticsQuery(query)}`);
    return res.data.data;
  },
};
