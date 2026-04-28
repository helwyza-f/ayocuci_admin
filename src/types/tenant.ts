export interface Tenant {
  ot_id: string;
  ot_nama: string;
  ot_koin: number;
  ot_status: number;
  ot_created: string;
  ot_alamat?: string;
  ot_nohp?: string;
  owner_name: string;
  owner_email: string;
  subscription_status: string;
  expiry_date: string;
}
