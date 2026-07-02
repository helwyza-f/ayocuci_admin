import api from "@/lib/api-client";
import { ApiResponse } from "@/types/api";

export interface CoinLedgerEntry {
  hk_id: string;
  hk_outlet: string;
  outlet_name: string;
  owner_name: string;
  hk_jenis_transaksi: "masuk" | "keluar";
  hk_jumlah: number;
  hk_keterangan: string;
  hk_status: number;
  hk_created: string;
  source_type: string;
}

export const coinLedgerService = {
  getAll: async (query = "") => {
    const url = query ? `/topup-koin/ledger?${query}` : "/topup-koin/ledger";
    const res = await api.get<ApiResponse<CoinLedgerEntry[]>>(url);
    return res.data;
  },
};
