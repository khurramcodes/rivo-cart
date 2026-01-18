import { getCookie } from "@/utils/cookies";
import type { Cart } from "@/types";

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL;

type CartResponse = { cart: Cart };

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
};
