import api from "@/lib/api-client";

export type NobuPayable = {
  id: string;
  order_id: string;
  outlet_id: string;
  outlet_name?: string;
  gross_amount: number;
  mdr_amount: number;
  platform_fee: number;
  net_amount: number;
  status: string;
  created_at?: string;
};

export type NobuReconciliation = {
  payments: number;
  paid: number;
  pending: number;
  failed: number;
  open_payables: number;
  open_payable_amount: number;
  received_funds: number;
};

export type NobuSettlementItem = {
  payable_id: string;
  order_id: string;
  outlet_id: string;
  outlet_name?: string;
  amount: number;
};

export type NobuSettlement = {
  id: string;
  reference: string;
  total_amount: number;
  status: string; // PENDING | PAID | FAILED
  proof_url?: string | null;
  admin_note?: string | null;
  item_count: number;
  items: NobuSettlementItem[];
  created_at?: string;
  updated_at?: string;
};

export const nobuFinanceService = {
  getReconciliation: () =>
    api.get<{ data: NobuReconciliation }>("/nobu/reconciliation"),
  getPayables: (status = "OPEN") =>
    api.get<{ data: NobuPayable[] }>(`/nobu/payables?status=${status}`),
  getSettlements: (status = "") =>
    api.get<{ data: NobuSettlement[] }>(
      `/nobu/settlements${status ? `?status=${status}` : ""}`,
    ),
  getPayments: () => api.get<{ data: unknown[] }>("/nobu/payments"),
  getAudits: () => api.get<{ data: unknown[] }>("/nobu/audits"),
  createSettlement: (payable_ids: string[], note?: string) =>
    api.post("/nobu/settlements", { payable_ids, note }),
  updateSettlement: (
    id: string,
    payload: { status: string; proof_url?: string; note?: string },
  ) => api.patch(`/nobu/settlements/${id}`, payload),
};
