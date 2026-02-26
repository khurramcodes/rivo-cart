import { apiClient } from "./apiClient";
import type {
  AdminNotification,
  AdminNotificationStats,
  Category,
  Order,
  OrderStatus,
  Product,
  Question,
  Review,
} from "@/types";

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
  // notifications
  async listNotifications(params?: { page?: number; limit?: number; unreadOnly?: boolean }) {
    const { data } = await apiClient.get<{
      notifications: AdminNotification[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>("/admin/notifications", { params });
    return data;
  },
  async getNotificationStats() {
    const { data } = await apiClient.get<AdminNotificationStats>("/admin/notifications/stats");
    return data;
  },
  async markNotificationRead(id: string) {
    const { data } = await apiClient.patch<{ notification: AdminNotification }>(
      `/admin/notifications/${id}/read`,
      {},
    );
    return data.notification;
  },
  async retryNotificationEmail(id: string) {
    const { data } = await apiClient.post<{ notification: AdminNotification }>(
      `/admin/notifications/${id}/retry-email`,
      {},
    );
    return data.notification;
  },

  // categories
  async listCategories() {
    const { data } = await apiClient.get<{ categories: Category[] }>("/categories");
    return { items: data.categories };
  },
  async createCategory(payload: { name: string; description?: string; parentId?: string | null }) {
    const { data } = await apiClient.post<{ category: Category }>("/categories", payload);
    return data.category;
  },
  async updateCategory(id: string, payload: { name?: string; description?: string; parentId?: string | null }) {
    const { data } = await apiClient.put<{ category: Category }>(`/categories/${id}`, payload);
    return data.category;
  },
  async deleteCategory(id: string) {
    await apiClient.delete(`/categories/${id}`);
  },

  // reviews (admin moderation)
  async listReviews(params?: { status?: "PENDING" | "APPROVED" | "REJECTED"; page?: number; limit?: number }) {
    const { data } = await apiClient.get<{ items: Review[]; total: number; page: number; limit: number }>(
      "/admin/reviews",
      { params },
    );
    return data;
  },
  async approveReview(id: string) {
    await apiClient.patch(`/admin/reviews/${id}/approve`, {});
  },
  async rejectReview(id: string) {
    await apiClient.patch(`/admin/reviews/${id}/reject`, {});
  },
  async removeReview(id: string) {
    await apiClient.patch(`/admin/reviews/${id}/remove`, {});
  },
  async createReviewReply(reviewId: string, message: string) {
    const { data } = await apiClient.post<{ reply: import("@/types").ReviewReply }>(`/admin/reviews/${reviewId}/reply`, { message });
    return data.reply;
  },
  async updateReviewReply(reviewId: string, message: string) {
    const { data } = await apiClient.put<{ reply: import("@/types").ReviewReply }>(`/admin/reviews/${reviewId}/reply`, { message });
    return data.reply;
  },
  async deleteReviewReply(reviewId: string) {
    await apiClient.delete(`/admin/reviews/${reviewId}/reply`);
  },

  // Q&A
  async listQuestions(params?: { productId?: string; status?: "VISIBLE" | "HIDDEN"; page?: number; limit?: number }) {
    const { data } = await apiClient.get<{ items: Question[]; total: number; page: number; limit: number }>(
      "/admin/qa/questions",
      { params },
    );
    return data;
  },
  async hideQuestion(questionId: string) {
    await apiClient.patch(`/admin/qa/questions/${questionId}/hide`, {});
  },
  async removeQuestion(questionId: string) {
    await apiClient.patch(`/admin/qa/questions/${questionId}/remove`, {});
  },
  async showQuestion(questionId: string) {
    await apiClient.patch(`/admin/qa/questions/${questionId}/show`, {});
  },
  async createAnswer(questionId: string, answer: string) {
    const { data } = await apiClient.post<{ answer: import("@/types").Answer }>(`/admin/qa/questions/${questionId}/answers`, { answer });
    return data.answer;
  },
  async updateAnswer(answerId: string, answer: string) {
    const { data } = await apiClient.put<{ answer: import("@/types").Answer }>(`/admin/qa/answers/${answerId}`, { answer });
    return data.answer;
  },
  async hideAnswer(answerId: string) {
    await apiClient.patch(`/admin/qa/answers/${answerId}/hide`, {});
  },
  async removeAnswer(answerId: string) {
    await apiClient.patch(`/admin/qa/answers/${answerId}/remove`, {});
  },
  async showAnswer(answerId: string) {
    await apiClient.patch(`/admin/qa/answers/${answerId}/show`, {});
  },

  // discounts
  async listDiscounts() {
    const { data } = await apiClient.get<{ discounts: Discount[] }>("/discounts");
    return data.discounts;
  },
  async getDiscount(id: string) {
    const { data } = await apiClient.get<{ discount: Discount }>(`/discounts/${id}`);
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
    const { data } = await apiClient.post<{ discount: Discount }>("/discounts", payload);
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
    const { data } = await apiClient.put<{ discount: Discount }>(`/discounts/${id}`, payload);
    return data.discount;
  },
  async deleteDiscount(id: string) {
    await apiClient.delete(`/discounts/${id}`);
  },

  // coupons
  async listCoupons() {
    const { data } = await apiClient.get<{ coupons: Coupon[] }>("/coupons");
    return data.coupons;
  },
  async getCoupon(id: string) {
    const { data } = await apiClient.get<{ coupon: Coupon }>(`/coupons/${id}`);
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
    const { data } = await apiClient.post<{ coupon: Coupon }>("/coupons", payload);
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
    const { data } = await apiClient.put<{ coupon: Coupon }>(`/coupons/${id}`, payload);
    return data.coupon;
  },
  async deleteCoupon(id: string) {
    await apiClient.delete(`/coupons/${id}`);
  },
  async validateCoupon(payload: { cartId: string; code: string }) {
    const { data } = await apiClient.post<{ valid: boolean; coupon: Coupon; subtotal: number }>("/coupons/validate", payload);
    return data;
  },
  async getCouponStats(id: string) {
    const { data } = await apiClient.get<{ stats: { couponId: string; totalRedemptions: number; uniqueUsers: number; lastRedeemedAt: string | null } }>(
      `/coupons/${id}/stats`,
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
      "/products",
      { params },
    );
    return data;
  },
  async getProduct(id: string) {
    const { data } = await apiClient.get<{ product: Product }>(`/products/${id}`);
    return data.product;
  },
  async newProductId() {
    const { data } = await apiClient.get<{ id: string; imageFolderPath: string }>("/products/admin/new-id");
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
    const { data } = await apiClient.post<{ product: Product }>("/products", payload);
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
    const { data } = await apiClient.put<{ product: Product }>(`/products/${id}`, payload);
    return data.product;
  },
  async deleteProduct(id: string) {
    await apiClient.delete(`/products/${id}`);
  },

  // orders
  async listOrders() {
    const { data } = await apiClient.get<{ orders: Order[] }>("/orders");
    return data.orders;
  },
  async updateOrderStatus(id: string, status: OrderStatus) {
    const { data } = await apiClient.put<{ order: Order }>(`/orders/${id}/status`, { status });
    return data.order;
  },

  // imagekit
  async imagekitAuth() {
    const { data } = await apiClient.get<{ token: string; expire: number; signature: string }>("/imagekit/auth");
    return data;
  },

  // dashboard
  async getDashboardStats() {
    const { data } = await apiClient.get<{ productsCount: number; categoriesCount: number; ordersCount: number }>(
      "/dashboard/stats"
    );
    return data;
  },
};


