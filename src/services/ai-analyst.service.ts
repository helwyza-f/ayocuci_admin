import api from "@/lib/api-client";
import { ApiResponse } from "@/types/api";

export interface AiAnalystAnswer {
  answer: string;
  sqls: string[];
  session_id: string;
}

export const aiAnalystService = {
  ask: async (message: string, sessionId?: string) => {
    const res = await api.post<ApiResponse<AiAnalystAnswer>>("/ai-analyst/ask", {
      message,
      session_id: sessionId,
    });
    return res.data.data;
  },
};
