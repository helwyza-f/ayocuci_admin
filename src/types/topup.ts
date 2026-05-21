export type TopupStatus = "pending" | "success" | "failed" | "completed" | "verification";
export type TopupMethod = "transfer" | "midtrans" | "bonus" | "manual";

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
  tk_outlet?: string;
  keterangan?: string;
  bonus_type?: string;
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
