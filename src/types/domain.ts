export interface Customer {
  id?: string | number;
  name?: string;
  nohp?: string;
  outlet_name?: string;
  total_transaksi?: number;
  total_spent?: number;
  created_at?: string;
}

export interface Owner {
  id: string | number;
  name: string;
  email: string;
  nohp?: string;
  created_at?: string;
  total_outlets?: number;
}

export interface EconomyConfig {
  cfg_key: string;
  cfg_value: string;
  cfg_type?: string;
  cfg_desc?: string;
}

export interface KoinPackage {
  id: number;
  jumlah_koin: number;
  discount_pct: number;
  is_active?: number;
  created_at?: string;
}

export interface OwnerOutlet {
  ot_id: string;
  ot_nama: string;
  ot_kota?: string;
  ot_koin?: number;
  ot_status?: number;
}

export interface OwnerDetail {
  profile: Owner;
  outlets: OwnerOutlet[];
}

export interface ReferralConfig {
  cfg_key: string;
  cfg_value: string;
  cfg_desc?: string;
}

export interface ReferralAdminSummary {
  first_topup_percent: string;
  next_topup_percent: string;
  monthly_reward_limit: string;
  payout_monthly_budget: number;
  payout_monthly_used: number;
  payout_monthly_remaining: number;
  payout_min_amount: number;
  payout_max_amount: number;
  total_referrals: number;
  total_rewards: number;
  pending_payouts: number;
  pending_count: number;
  total_paid_out: number;
}

export interface ReferralAdminPayout {
  rp_id: string;
  rp_amount: number;
  rp_status: "pending" | "approved" | "process" | "done" | "paid";
  rp_bank_name: string;
  rp_account_name: string;
  rp_account_number: string;
  rp_note?: string | null;
  rp_admin_note?: string | null;
  rp_created: string;
  rp_processed_at?: string | null;
  rp_completed_at?: string | null;
  bonus_count?: number;
  referred_owner_names?: string | null;
  referred_outlet_names?: string | null;
  usr_id: number;
  usr_nama: string;
  usr_email: string;
  usr_nohp?: string | null;
}
export interface ReferralAdminReward {
  rr_id: number;
  rr_reward_amount: number;
  rr_type: string;          // 'recruit' | 'topup'
  rr_reference_id: string;
  rr_status: string;        // 'credited'
  rr_created: string;
  rr_referred_outlet: string;
  referrer_id: number;
  referrer_nama: string;
  referrer_email: string;
  referred_id: number;
  referred_nama: string;
  referred_email: string;
}

export interface Addon {
  ad_id: string;
  ad_nama: string;
  ad_link: string;
  ad_harga: number;
  ad_keterangan: string;
  ad_status: number;
  ad_created?: string;
}
