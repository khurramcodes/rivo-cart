import { apiClient } from "./apiClient";
import type { Cart } from "@/types";

type CartResponse = { cart: Cart };
export type PricingLineItem = {
  itemId: string;
  originalUnitPrice: number;
  discountedUnitPrice: number;
  quantity: number;
  lineTotal: number;
};

type PricingResult = {
  originalPrice: number;
  discountedPrice: number;
  lineItems: PricingLineItem[];
  appliedDiscounts: {
    id: string;
    name: string;
    discountType: "PERCENTAGE" | "FIXED";
    discountValue: number;
    scope: "SITE_WIDE" | "PRODUCT" | "VARIANT" | "CATEGORY" | "COLLECTION";
    priority: number;
    isStackable: boolean;
    amount: number;
  }[];
  appliedCoupon: {
    id: string;
    code: string;
    discountType: "PERCENTAGE" | "FIXED";
    discountValue: number;
    amount: number;
  } | null;
  totalSavings: number;
};

type PricingResponse = { pricing: PricingResult };
type CartPricingResponse = { cart: Cart; pricing: PricingResult };

export const cartApi = {
  async getCart() {
    const { data } = await apiClient.get<CartResponse>("/cart");
    return data;
  },
  async getPricing() {
    const { data } = await apiClient.get<PricingResponse>("/cart/pricing");
    return data;
  },
  async addItem(payload: { productId: string; variantId: string; quantity: number }) {
    const { data } = await apiClient.post<CartResponse>("/cart/items", payload);
    return data;
  },
  async updateItem(itemId: string, quantity: number) {
    const { data } = await apiClient.patch<CartResponse>(`/cart/items/${itemId}`, {
      quantity,
    });
    return data;
  },
  async removeItem(itemId: string) {
    const { data } = await apiClient.delete<CartResponse>(`/cart/items/${itemId}`);
    return data;
  },
  async migrate(items: { productId: string; variantId: string; quantity: number }[]) {
    const { data } = await apiClient.post<CartResponse>("/cart/migrate", { items });
    return data;
  },
  async applyCoupon(code: string) {
    const { data } = await apiClient.post<CartPricingResponse>("/cart/coupon", {
      code,
      source: "cart",
    });
    return data;
  },
  async removeCoupon() {
    const { data } = await apiClient.delete<CartPricingResponse>("/cart/coupon");
    return data;
  },
};
