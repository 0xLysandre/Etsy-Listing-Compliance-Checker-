import { api } from './api';
import type { Listing, CreateListingInput, ApiResponse } from '../types';

export interface ListingsResponse {
  data: Listing[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const listingsService = {
  async getListings(page = 1, limit = 10): Promise<ListingsResponse> {
    const response = await api.get<ApiResponse<Listing[]>>('/listings', {
      params: { page, limit },
    });
    return {
      data: response.data.data || [],
      meta: response.data.meta || { page: 1, limit: 10, total: 0, totalPages: 0 },
    };
  },

  async getListing(id: string): Promise<Listing> {
    const response = await api.get<ApiResponse<Listing>>(`/listings/${id}`);
    return response.data.data!;
  },

  async createListing(data: CreateListingInput): Promise<Listing> {
    const response = await api.post<ApiResponse<Listing>>('/listings', data);
    return response.data.data!;
  },

  async updateListing(id: string, data: Partial<CreateListingInput>): Promise<Listing> {
    const response = await api.patch<ApiResponse<Listing>>(`/listings/${id}`, data);
    return response.data.data!;
  },

  async deleteListing(id: string): Promise<void> {
    await api.delete(`/listings/${id}`);
  },
};
