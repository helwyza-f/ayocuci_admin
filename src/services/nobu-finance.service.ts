import api from "@/lib/api-client";

export type NobuPayable = {
  id: string; order_id: string; outlet_id: string; gross_amount: number;
  mdr_amount: number; platform_fee: number; net_amount: number; status: string;
};
export type NobuReconciliation = {
  payments: number; paid: number; pending: number; failed: number;
  open_payables: number; open_payable_amount: number; received_funds: number;
};

export const nobuFinanceService = {
  getReconciliation: () => api.get<{ data: NobuReconciliation }>("/nobu/reconciliation"),
  getPayables: (status = "OPEN") => api.get<{ data: NobuPayable[] }>(`/nobu/payables?status=${status}`),
  getPayments: () => api.get<{ data: any[] }>("/nobu/payments"),
  getAudits: () => api.get<{ data: any[] }>("/nobu/audits"),
  createSettlement: (payable_ids: string[], note?: string) => api.post("/nobu/settlements", { payable_ids, note }),
  updateSettlement: (id: string, payload: { status: string; proof_url?: string; note?: string }) => api.patch(`/nobu/settlements/${id}`, payload),
};
