import { apiClient } from "./apiClient";

type DiscountInfo = {
  id: string;
  name: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  amount: number;
};

export type VariantPricing = {
  variantId: string;
  originalPrice: number;
  discountedPrice: number;
  appliedDiscounts: DiscountInfo[];
  totalSavings: number;
};

export const pricingApi = {
  async getVariantPricing(variantId: string) {
    const { data } = await apiClient.get<{ pricing: VariantPricing }>(
      `/api/pricing/variants/${variantId}`
    );
    return data.pricing;
  },

  async getBulkVariantPricing(variantIds: string[]) {
    const { data } = await apiClient.post<{ results: { variantId: string; pricing: VariantPricing | null }[] }>(
      "/api/pricing/variants/bulk",
      { variantIds }
    );
    return data.results;
  },
};
