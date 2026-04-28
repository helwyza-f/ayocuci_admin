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
