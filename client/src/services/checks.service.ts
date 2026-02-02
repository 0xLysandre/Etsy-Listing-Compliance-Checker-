import { api } from './api';
import type { ViolationCheck, ApiResponse } from '../types';

export interface ChecksHistoryResponse {
  data: ViolationCheck[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const checksService = {
  async runCheck(listingId: string): Promise<ViolationCheck> {
    const response = await api.post<ApiResponse<ViolationCheck>>(
      `/checks/listing/${listingId}`
    );
    return response.data.data!;
  },

  async getCheckHistory(listingId: string, page = 1, limit = 10): Promise<ChecksHistoryResponse> {
    const response = await api.get<ApiResponse<ViolationCheck[]>>(
      `/checks/listing/${listingId}/history`,
      {
        params: { page, limit },
      }
    );
    return {
      data: response.data.data || [],
      meta: response.data.meta || { page: 1, limit: 10, total: 0, totalPages: 0 },
    };
  },

  async getCheck(id: string): Promise<ViolationCheck> {
    const response = await api.get<ApiResponse<ViolationCheck>>(`/checks/${id}`);
    return response.data.data!;
  },
};
