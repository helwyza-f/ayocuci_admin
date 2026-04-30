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
  reward_per_owner: string;
  total_referrals: number;
  total_rewards: number;
  pending_payouts: number;
  pending_count: number;
  total_paid_out: number;
}

export interface ReferralAdminPayout {
  rp_id: string;
  rp_amount: number;
  rp_status: "pending" | "approved" | "process" | "done";
  rp_bank_name: string;
  rp_account_name: string;
  rp_account_number: string;
  rp_note?: string | null;
  rp_admin_note?: string | null;
  rp_created: string;
  rp_processed_at?: string | null;
  rp_completed_at?: string | null;
  usr_id: number;
  usr_nama: string;
  usr_email: string;
  usr_nohp?: string | null;
}
