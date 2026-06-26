export type ResetType = 'full' | 'transactions_only' | 'customers_only';
export type ResetReason = 'trial_to_production' | 'data_cleanup' | 'customer_request' | 'other';

export interface DeletedStats {
  orders: number;
  customers: number;
  expenses: number;
  detail_transaksi: number;
  dp_transaksi: number;
  item_transaksi: number;
  log_transaksi: number;
  history_koin: number;
  topup_koin: number;
  diskon: number;
}

export interface ResetBackup {
  id: string;
  outlet_id: string;
  reset_type: ResetType;
  reason: ResetReason;
  reset_at: string;
  backup_data: unknown;
  deleted_stats: DeletedStats;
  actor_id: string;
  actor_type: string;
  created_at: string;
}

export interface ResetRequest {
  reset_type: ResetType;
  reason: ResetReason;
  confirmation_code: string;
}

export interface ResetResponse {
  status: boolean;
  message: string;
  data: {
    backup_id: string;
    reset_type: ResetType;
    reason: ResetReason;
    deleted_records: DeletedStats;
    reset_at: string;
  };
}
