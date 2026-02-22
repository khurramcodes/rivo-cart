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

  async markHelpful(reviewId: string, isHelpful: boolean) {
    await apiClient.put(`/reviews/${reviewId}/helpful`, { isHelpful });
  },

  async report(reviewId: string, reason: string) {
    await apiClient.post(`/reviews/${reviewId}/report`, { reason });
  },

  async myHelpful(reviewId: string) {
    const { data } = await apiClient.get<{ isHelpful: boolean | null }>(`/reviews/${reviewId}/helpful`);
    return data.isHelpful;
  },

  async myReported(reviewId: string) {
    const { data } = await apiClient.get<{ reported: boolean }>(`/reviews/${reviewId}/reported`);
    return data.reported;
  },
};

