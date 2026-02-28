import { apiClient } from "./apiClient";
import type { BestSellingCategory, BestSellingProduct, Category, Product } from "@/types";

export const catalogApi = {
  async listCategories() {
    const { data } = await apiClient.get<{ categories: Category[] }>(
      "/categories",
      {
        skipLoading: true,
      },
    );
    return data.categories;
  },

  async getCategoryBySlug(slug: string) {
    const { data } = await apiClient.get<{ category: Category }>(
      `/categories/${slug}`,
      {
        skipLoading: true,
      },
    );
    return data.category;
  },

  async listProducts(params?: {
    q?: string;
    categoryId?: string;
    page?: number;
    limit?: number;
    minPrice?: number;
    maxPrice?: number;
  }) {
    const { data } = await apiClient.get<{
      items: Product[];
      total: number;
      page: number;
      limit: number;
    }>("/products", { params, skipLoading: true });
    return data;
  },

  async listLatestProducts(limit?: number) {
    const { data } = await apiClient.get<{ items: Product[] }>(
      "/products/latest",
      {
        params: { limit },
        skipLoading: true,
      },
    );

    return data;
  },

  async listBestSellingProducts(limit?: number) {
    const { data } = await apiClient.get<{ items: BestSellingProduct[] }>("/products/best-selling", {
      params: { limit },
      skipLoading: true,
    });
    return data;
  },

  async listBestSellingCategories(limit?: number) {
    const { data } = await apiClient.get<{ items: BestSellingCategory[] }>("/categories/best-selling", {
      params: { limit },
      skipLoading: true,
    });
    return data;
  },

  async getProduct(id: string) {
    const { data } = await apiClient.get<{ product: Product }>(
      `/products/${id}`,
      {
        skipLoading: true,
      },
    );
    return data.product;
  },
};
