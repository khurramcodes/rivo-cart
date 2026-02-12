import { apiClient } from "./apiClient";

export type ShippingQuote = {
  method: {
    id: string;
    type: "STANDARD" | "EXPRESS" | "FREE";
    name: string;
    description?: string | null;
  };
  cost: number;
  ruleId: string;
  zoneId: string;
};

export const shippingApi = {
  async quote(addressId: string) {
    const { data } = await apiClient.post<{ quotes: ShippingQuote[] }>("/shipping/quote", { addressId });
    return data;
  },
};
