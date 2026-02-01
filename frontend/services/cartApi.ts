import { getCookie } from "@/utils/cookies";
import type { Cart } from "@/types";

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL;

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

/**
 * Cart API request helper.
 * Does NOT trigger global loader - cart operations use local loading state.
 */
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${baseURL}${path}`;
  const headers = new Headers(options?.headers);
  headers.set("Content-Type", "application/json");

  const method = (options?.method ?? "GET").toUpperCase();
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    const csrf = getCookie("XSRF-TOKEN");
    if (csrf) headers.set("x-csrf-token", csrf);
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message = body?.error?.message ?? "Request failed";
    throw new Error(message);
  }
  return res.json();
}

export const cartApi = {
  async getCart() {
    return request<CartResponse>("/api/cart");
  },
  async getPricing() {
    return request<PricingResponse>("/api/cart/pricing");
  },
  async addItem(payload: { productId: string; variantId: string; quantity: number }) {
    return request<CartResponse>("/api/cart/items", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  async updateItem(itemId: string, quantity: number) {
    return request<CartResponse>(`/api/cart/items/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify({ quantity }),
    });
  },
  async removeItem(itemId: string) {
    return request<CartResponse>(`/api/cart/items/${itemId}`, {
      method: "DELETE",
    });
  },
  async migrate(items: { productId: string; variantId: string; quantity: number }[]) {
    return request<CartResponse>("/api/cart/migrate", {
      method: "POST",
      body: JSON.stringify({ items }),
    });
  },
  async applyCoupon(code: string) {
    return request<CartPricingResponse>("/api/cart/coupon", {
      method: "POST",
      body: JSON.stringify({ code, source: "cart" }),
    });
  },
  async removeCoupon() {
    return request<CartPricingResponse>("/api/cart/coupon", {
      method: "DELETE",
    });
  },
};
