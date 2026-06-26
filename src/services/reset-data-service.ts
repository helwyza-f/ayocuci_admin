import axios from 'axios';
import { ResetRequest, ResetResponse, ResetBackup } from '@/types/reset-data';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api/v1';

export const resetDataService = {
  // Reset outlet data
  async resetOutletData(
    outletId: string,
    request: ResetRequest
  ): Promise<ResetResponse> {
    const response = await axios.post(
      `${API_BASE_URL}/admin/tenants/${outletId}/data/reset`,
      request
    );
    return response.data;
  },

  // Get reset history for an outlet
  async getResetHistory(outletId: string, limit = 10): Promise<ResetBackup[]> {
    const response = await axios.get(
      `${API_BASE_URL}/admin/tenants/${outletId}/data/reset-history`,
      {
        params: { limit },
      }
    );
    return response.data.data?.data || [];
  },

  // Get reset detail (requires outlet ID)
  async getResetDetail(outletId: string, resetId: string): Promise<ResetBackup> {
    const response = await axios.get(
      `${API_BASE_URL}/admin/tenants/${outletId}/data/reset-history/${resetId}`
    );
    return response.data.data;
  },
};
