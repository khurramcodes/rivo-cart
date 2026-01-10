import { apiClient } from "./apiClient";
import type { Order, OrderStatus } from "@/types";

export const orderApi = {
  async place(payload: {
    customerName: string;
    customerEmail?: string;
    customerPhone: string;
    shippingAddress: string;
    items: { productId: string; variantId: string; quantity: number }[];
  }) {
    const { data } = await apiClient.post<{ order: Order }>("/api/orders", payload);
    return data.order;
  },

  async listAll() {
    const { data } = await apiClient.get<{ orders: Order[] }>("/api/orders");
    return data.orders;
  },

  async updateStatus(orderId: string, status: OrderStatus) {
    const { data } = await apiClient.put<{ order: Order }>(`/api/orders/${orderId}/status`, { status });
    return data.order;
  },
};


