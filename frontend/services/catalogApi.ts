import { apiClient } from "./apiClient";
import type { Category, Product } from "@/types";

/**
 * Catalog API for reading products and categories.
 * Uses skipLoading: true to avoid blocking navigation with global loader.
 * Pages should manage their own local loading state for data fetching.
 */
export const catalogApi = {
  async listCategories() {
    const { data } = await apiClient.get<{ categories: Category[] }>("/api/categories", {
      skipLoading: true,
    });
    return data.categories;
  },

  async listProducts(params?: { q?: string; categoryId?: string; page?: number; limit?: number; minPrice?: number; maxPrice?: number }) {
    const { data } = await apiClient.get<{ items: Product[]; total: number; page: number; limit: number }>(
      "/api/products",
      { params, skipLoading: true },
    );
    return data;
  },

  async getProduct(id: string) {
    const { data } = await apiClient.get<{ product: Product }>(`/api/products/${id}`, {
      skipLoading: true,
    });
    return data.product;
  },
};


