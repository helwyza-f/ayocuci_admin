export interface Tenant {
  ot_id: string;
  ot_nama: string;
  ot_koin: number;
  ot_status: number;
  ot_created: string;
  ot_alamat?: string;
  ot_nohp?: string;
  ot_gambar?: string;
  
  // Location Stack
  ot_provinsi?: string;
  ot_kota?: string;
  ot_kecamatan?: string;

  // Operational Context
  ot_tipe_lokasi_usaha?: string;
  ot_modal_usaha?: string;
  ot_jumlah_karyawan?: string;
  ot_jumlah_mesin_cuci?: string;

  owner_name: string;
  owner_email: string;
  subscription_status: string;
  expiry_date: string;

  // Subscription & Guardrails
  ot_activated_at?: string;
  ot_trial_at?: string;
  ot_max_pegawai_base: number;

  // Feature Flags
  ot_skip_proses: number;
  ot_metode_pembayaran: number;
  ot_fitur_diskon: number;
}
