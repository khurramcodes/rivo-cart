import { apiClient } from "./apiClient";
import type { Category, Product } from "@/types";

export const catalogApi = {
  async listCategories() {
    const { data } = await apiClient.get<{ categories: Category[] }>("/api/categories");
    return data.categories;
  },

  async listProducts(params?: { q?: string; categoryId?: string; page?: number; limit?: number }) {
    const { data } = await apiClient.get<{ items: Product[]; total: number; page: number; limit: number }>(
      "/api/products",
      { params },
    );
    return data;
  },

  async getProduct(id: string) {
    const { data } = await apiClient.get<{ product: Product }>(`/api/products/${id}`);
    return data.product;
  },
};


