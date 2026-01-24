import { apiClient } from "./apiClient";
import type { Category, Order, OrderStatus, Product } from "@/types";

export type DiscountScope = "SITE_WIDE" | "PRODUCT" | "VARIANT" | "CATEGORY" | "COLLECTION";
export type DiscountType = "PERCENTAGE" | "FIXED";

export type Discount = {
  id: string;
  name: string;
  description?: string | null;
  discountType: DiscountType;
  discountValue: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  priority: number;
  isStackable: boolean;
  scope: DiscountScope;
  products?: { productId: string }[];
  variants?: { variantId: string }[];
  categories?: { categoryId: string }[];
  collections?: { collectionId: string }[];
  createdAt?: string;
  updatedAt?: string;
};

export type Coupon = {
  id: string;
  code: string;
  description?: string | null;
  discountType: DiscountType;
  discountValue: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  minimumCartValue?: number | null;
  maxRedemptions?: number | null;
  maxRedemptionsPerUser?: number | null;
  isStackable: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export const adminApi = {
  // categories
  async listCategories() {
    const { data } = await apiClient.get<{ categories: Category[] }>("/api/categories");
    return { items: data.categories };
  },
  async createCategory(payload: { name: string; description?: string; parentId?: string | null }) {
    const { data } = await apiClient.post<{ category: Category }>("/api/categories", payload);
    return data.category;
  },
  async updateCategory(id: string, payload: { name?: string; description?: string; parentId?: string | null }) {
    const { data } = await apiClient.put<{ category: Category }>(`/api/categories/${id}`, payload);
    return data.category;
  },
  async deleteCategory(id: string) {
    await apiClient.delete(`/api/categories/${id}`);
  },

  // discounts
  async listDiscounts() {
    const { data } = await apiClient.get<{ discounts: Discount[] }>("/api/discounts");
    return data.discounts;
  },
  async getDiscount(id: string) {
    const { data } = await apiClient.get<{ discount: Discount }>(`/api/discounts/${id}`);
    return data.discount;
  },
  async createDiscount(payload: {
    name: string;
    description?: string;
    discountType: DiscountType;
    discountValue: number;
    startDate: string;
    endDate: string;
    isActive?: boolean;
    priority?: number;
    isStackable?: boolean;
    scope: DiscountScope;
    productIds?: string[];
    variantIds?: string[];
    categoryIds?: string[];
    collectionIds?: string[];
  }) {
    const { data } = await apiClient.post<{ discount: Discount }>("/api/discounts", payload);
    return data.discount;
  },
  async updateDiscount(
    id: string,
    payload: Partial<{
      name: string;
      description: string;
      discountType: DiscountType;
      discountValue: number;
      startDate: string;
      endDate: string;
      isActive: boolean;
      priority: number;
      isStackable: boolean;
      scope: DiscountScope;
      productIds: string[];
      variantIds: string[];
      categoryIds: string[];
      collectionIds: string[];
    }>,
  ) {
    const { data } = await apiClient.put<{ discount: Discount }>(`/api/discounts/${id}`, payload);
    return data.discount;
  },
  async deleteDiscount(id: string) {
    await apiClient.delete(`/api/discounts/${id}`);
  },

  // coupons
  async listCoupons() {
    const { data } = await apiClient.get<{ coupons: Coupon[] }>("/api/coupons");
    return data.coupons;
  },
  async getCoupon(id: string) {
    const { data } = await apiClient.get<{ coupon: Coupon }>(`/api/coupons/${id}`);
    return data.coupon;
  },
  async createCoupon(payload: {
    code: string;
    description?: string;
    discountType: DiscountType;
    discountValue: number;
    startDate: string;
    endDate: string;
    isActive?: boolean;
    minimumCartValue?: number;
    maxRedemptions?: number;
    maxRedemptionsPerUser?: number;
    isStackable?: boolean;
  }) {
    const { data } = await apiClient.post<{ coupon: Coupon }>("/api/coupons", payload);
    return data.coupon;
  },
  async updateCoupon(
    id: string,
    payload: Partial<{
      code: string;
      description: string;
      discountType: DiscountType;
      discountValue: number;
      startDate: string;
      endDate: string;
      isActive: boolean;
      minimumCartValue: number;
      maxRedemptions: number;
      maxRedemptionsPerUser: number;
      isStackable: boolean;
    }>,
  ) {
    const { data } = await apiClient.put<{ coupon: Coupon }>(`/api/coupons/${id}`, payload);
    return data.coupon;
  },
  async deleteCoupon(id: string) {
    await apiClient.delete(`/api/coupons/${id}`);
  },
  async validateCoupon(payload: { cartId: string; code: string }) {
    const { data } = await apiClient.post<{ valid: boolean; coupon: Coupon; subtotal: number }>("/api/coupons/validate", payload);
    return data;
  },
  async getCouponStats(id: string) {
    const { data } = await apiClient.get<{ stats: { couponId: string; totalRedemptions: number; uniqueUsers: number; lastRedeemedAt: string | null } }>(
      `/api/coupons/${id}/stats`,
    );
    return data.stats;
  },

  // products
  async listProducts(params?: {
    q?: string;
    categoryId?: string;
    page?: number;
    limit?: number;
    sortBy?: "name" | "category" | "price" | "stock" | "type" | "createdAt";
    sortDir?: "asc" | "desc";
    minPrice?: number;
    maxPrice?: number;
  }) {
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


