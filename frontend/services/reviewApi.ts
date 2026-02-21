import { apiClient } from "./apiClient";
import type { Review } from "@/types";

export type ReviewSort = "rating_desc" | "newest";

export const reviewApi = {
  async mine(productId: string) {
    const { data } = await apiClient.get<{ review: Review | null }>("/reviews/me", {
      params: { productId },
    });
    return data.review;
  },

  async create(payload: { productId: string; rating: number; comment: string }) {
    const { data } = await apiClient.post<{ review: Review }>("/reviews", payload);
    return data.review;
  },

  async update(id: string, payload: { rating: number; comment: string }) {
    const { data } = await apiClient.put<{ review: Review }>(`/reviews/${id}`, payload);
    return data.review;
  },

  async listApproved(productId: string, params?: { page?: number; limit?: number; sort?: ReviewSort }) {
    const { data } = await apiClient.get<{ items: Review[]; total: number; page: number; limit: number }>(
      `/products/${productId}/reviews`,
      { params },
    );
    return data;
  },

  async top(productId: string) {
    const { data } = await apiClient.get<{ items: Review[] }>(`/products/${productId}/reviews/top`);
    return data.items;
  },
};

