import api from "@/lib/api-client";

export interface BankAccount {
  id: number;
  bank_name: string;
  account_name: string;
  account_number: string;
  is_active: boolean;
}

export const bankService = {
  getBanks: async () => {
    const res = await api.get("/banks");
    return res.data;
  },
  createBank: async (data: Omit<BankAccount, "id" | "is_active">) => {
    const res = await api.post("/banks", data);
    return res.data;
  },
  updateBank: async (id: number, data: Partial<BankAccount>) => {
    const res = await api.put(`/banks/${id}`, data);
    return res.data;
  },
  toggleStatus: async (id: number) => {
    const res = await api.patch(`/banks/${id}/status`);
    return res.data;
  },
  deleteBank: async (id: number) => {
    const res = await api.delete(`/banks/${id}`);
    return res.data;
  },
};
