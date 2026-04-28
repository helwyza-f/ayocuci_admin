export type TopupStatus = "pending" | "success" | "failed";
export type TopupMethod = "transfer" | "midtrans";

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
