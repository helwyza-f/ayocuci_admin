import api from "@/lib/api-client";

export interface AccountDeletionRow {
  id: number;
  actor_id: string;
  actor_type: string;
  actor_name?: string | null;
  reason: string;
  reason_detail?: string | null;
  created_at: string;
}

export const accountDeletionService = {
  list: async (params?: { search?: string; actor_type?: string; limit?: number }) => {
    const response = await api.get("/account-deletions", { params });
    return response.data as {
      status: boolean;
      message?: string;
      data: AccountDeletionRow[];
    };
  },
};
