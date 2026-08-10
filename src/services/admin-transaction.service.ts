import api from "@/lib/api-client";
import { ApiResponse } from "@/types/api";

export interface TransactionFilter {
  page?: number;
  limit?: number;
  outlet?: string;
  status?: string;
  start?: string;
  end?: string;
  search?: string;
}

export const adminTransactionService = {
  // Ambil semua transaksi global dengan filter
  getAllTransactions: async (params: TransactionFilter) => {
    const response = await api.get("/admin/transactions", { params });
    return response.data;
  },
};
