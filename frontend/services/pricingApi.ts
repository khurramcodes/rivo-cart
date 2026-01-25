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

/**
 * Pricing API - fetches discount/pricing data.
 * Uses skipLoading: true to avoid blocking navigation with global loader.
 * Components should manage their own local loading state for pricing.
 */
export const pricingApi = {
  async getVariantPricing(variantId: string) {
    const { data } = await apiClient.get<{ pricing: VariantPricing }>(
      `/api/pricing/variants/${variantId}`,
      { skipLoading: true }
    );
    return data.pricing;
  },

  async getBulkVariantPricing(variantIds: string[]) {
    const { data } = await apiClient.post<{ results: { variantId: string; pricing: VariantPricing | null }[] }>(
      "/api/pricing/variants/bulk",
      { variantIds },
      { skipLoading: true }
    );
    return data.results;
  },
};
