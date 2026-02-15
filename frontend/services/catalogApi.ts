import { apiClient } from "./apiClient";
import type { Category, Product } from "@/types";

/**
 * Catalog API for reading products and categories.
 * Uses skipLoading: true to avoid blocking navigation with global loader.
 * Pages should manage their own local loading state for data fetching.
 */
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

  // async getCategoryBySlug(slug: string){
  //   const baseURL = process.env.API_BASE_URL;
  //   if (!baseURL) throw new Error("NEXT_PUBLIC_API_BASE_URL is missing");
  //   const { data } = await apiClient.get<{ category: Category }>(
  //     `${baseURL}/categories/${slug}`,
  //     {
  //       skipLoading: true,
  //     },
  //   );
  //   return data.category;
  // },

  async getCategoryBySlug(slug: string) {
    const baseURL = process.env.API_BASE_URL;

    console.log("Environment:", process.env.NODE_ENV);
    console.log("API Base URL:", baseURL);
    console.log("Full URL:", `${baseURL}/categories/${slug}`);

    if (!baseURL) {
      console.error(
        "API_BASE_URL is missing. Available env vars:",
        Object.keys(process.env),
      );
      throw new Error("API_BASE_URL is missing");
    }

    try {
      const { data } = await apiClient.get<{ category: Category }>(
        `${baseURL}/categories/${slug}`,
        { skipLoading: true },
      );
      return data.category;
    } catch (error) {
      console.error("Failed to fetch category:", error);
      throw error;
    }
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
