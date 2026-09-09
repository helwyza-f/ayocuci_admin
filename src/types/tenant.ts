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
  ot_jumlah_mesin?: string;
  ot_tanggal_berjalan?: string;

  owner_id: number;
  owner_name: string;
  owner_email: string;
  owner_nohp?: string;
  owner_code?: string;
  owner_lead_source?: string;
  subscription_status: string;
  expiry_date: string;

  // Performance Metrics
  daily_tx_count: number;
  daily_tx_amount: number;
  total_tx_count: number;
  total_tx_amount: number;
  /** Jumlah top up SUKSES (berbayar) outlet ini sepanjang waktu. */
  topup_count?: number;

  // Keaktifan Nasabah (berbasis transaksi laundry)
  /** Timestamp transaksi laundry terakhir. Null = belum pernah transaksi. */
  last_tx_at?: string | null;
  /** Jumlah nota 7 hari terakhir. */
  tx_count_7d?: number;
  /** Jumlah nota 30 hari terakhir. */
  tx_count_30d?: number;

  // Add-On
  /** 1 = outlet punya minimal 1 add-on yang belum kedaluwarsa. */
  addon_active?: number;
  /** Nama add-on aktif, dipisah koma. */
  addon_active_names?: string;

  // Subscription & Guardrails
  ot_activated_at?: string;
  ot_trial_at?: string;
  ot_max_pegawai_base: number;

  // Feature Flags
  ot_skip_proses: number;
  ot_metode_pembayaran: number;
  ot_fitur_diskon: number;
  ot_timezone: string;
  ot_zona_waktu?: string;
}

export interface OutletNameHistory {
  id: number;
  ot_id: string;
  old_name: string;
  new_name: string;
  changed_by?: string;
  changed_by_type?: string;
  created_at: string;
}
