export type TopupStatus = "pending" | "success" | "failed" | "completed" | "verification" | "accepted" | "rejected" | "expired";
export type TopupMethod = "transfer" | "midtrans" | "bonus" | "manual" | "inject";

export interface Topup {
  tk_id: string;
  tk_created: string;
  tk_jumlah?: number;
  tk_total?: number;
  tk_status: TopupStatus;
  tk_metode_bayar: TopupMethod;
  tk_bukti?: string;
  outlet_name?: string;
  owner_name?: string;
  owner_code?: string;
  tk_outlet?: string;
  keterangan?: string;
  bonus_type?: string;
  tk_lastupdate?: string | null;
  tk_tanggal_upload_bukti?: string | null;
  tk_tanggal_validasi?: string | null;
  tk_staf_validasi?: string | null;
}

export interface TopupFiltersValue {
  searchQuery: string;
  statusFilter: string;
  methodFilter: string;
  outletFilter: string;
  ownerFilter: string;
  startDate?: Date;
  endDate?: Date;
}
