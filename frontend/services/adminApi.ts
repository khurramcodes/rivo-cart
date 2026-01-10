import { apiClient } from "./apiClient";
import type { Category, Order, OrderStatus, Product } from "@/types";

export const adminApi = {
  // categories
  async listCategories() {
    const { data } = await apiClient.get<{ categories: Category[] }>("/api/categories");
    return { items: data.categories };
  },
  async createCategory(payload: { name: string; description?: string }) {
    const { data } = await apiClient.post<{ category: Category }>("/api/categories", payload);
    return data.category;
  },
  async updateCategory(id: string, payload: { name?: string; description?: string }) {
    const { data } = await apiClient.put<{ category: Category }>(`/api/categories/${id}`, payload);
    return data.category;
  },
  async deleteCategory(id: string) {
    await apiClient.delete(`/api/categories/${id}`);
  },

  // products
  async listProducts() {
    const { data } = await apiClient.get<{ items: Product[]; total: number; page: number; limit: number }>(
      "/api/products",
    );
    return data;
  },
  async getProduct(id: string) {
    const { data } = await apiClient.get<{ product: Product }>(`/api/products/${id}`);
    return data.product;
  },
  async newProductId() {
    const { data } = await apiClient.get<{ id: string; imageFolderPath: string }>("/api/products/admin/new-id");
    return data;
  },
  async createProduct(payload: {
    id: string;
    name: string;
    description?: string;
    type: "SIMPLE" | "VARIABLE";
    imageUrl: string;
    imageFileId: string;
    imageFilePath: string;
    imageFolderPath: string;
    thumbUrl?: string;
    thumbFileId?: string;
    thumbFilePath?: string;
    gallery?: { index: number; url: string; fileId: string; filePath: string }[];
    categoryId: string;
    variants: {
      sku: string;
      price: number;
      stock: number;
      isDefault?: boolean;
      attributes?: { name: string; value: string }[];
    }[];
  }) {
    const { data } = await apiClient.post<{ product: Product }>("/api/products", payload);
    return data.product;
  },
  async updateProduct(
    id: string,
    payload: Partial<{
      name: string;
      description: string;
      type: "SIMPLE" | "VARIABLE";
      imageUrl: string;
      imageFileId: string;
      imageFilePath: string;
      thumbUrl: string;
      thumbFileId: string;
      thumbFilePath: string;
      gallery: { index: number; url: string; fileId: string; filePath: string }[];
      deleteGalleryIndexes: number[];
      categoryId: string;
      variants: {
        id?: string;
        sku: string;
        price: number;
        stock: number;
        isDefault?: boolean;
        attributes?: { name: string; value: string }[];
      }[];
      deleteVariantIds: string[];
    }>,
  ) {
    const { data } = await apiClient.put<{ product: Product }>(`/api/products/${id}`, payload);
    return data.product;
  },
  async deleteProduct(id: string) {
    await apiClient.delete(`/api/products/${id}`);
  },

  // orders
  async listOrders() {
    const { data } = await apiClient.get<{ orders: Order[] }>("/api/orders");
    return data.orders;
  },
  async updateOrderStatus(id: string, status: OrderStatus) {
    const { data } = await apiClient.put<{ order: Order }>(`/api/orders/${id}/status`, { status });
    return data.order;
  },

  // imagekit
  async imagekitAuth() {
    const { data } = await apiClient.get<{ token: string; expire: number; signature: string }>("/api/imagekit/auth");
    return data;
  },

  // dashboard
  async getDashboardStats() {
    const { data } = await apiClient.get<{ productsCount: number; categoriesCount: number; ordersCount: number }>(
      "/api/dashboard/stats"
    );
    return data;
  },
};


