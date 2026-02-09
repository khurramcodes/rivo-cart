import { asyncHandler } from "../utils/asyncHandler.js";
import * as pricingService from "../services/pricing.service.js";
export const getVariantPricing = asyncHandler(async (req, res) => {
    const { variantId } = req.params;
    const pricing = await pricingService.resolveVariantPricing(variantId);
    res.json({ pricing });
});
export const getBulkVariantPricing = asyncHandler(async (req, res) => {
    const { variantIds } = req.body;
    const results = await Promise.all(variantIds.map(async (variantId) => {
        try {
            const pricing = await pricingService.resolveVariantPricing(variantId);
            return { variantId, pricing };
        }
        catch {
            return { variantId, pricing: null };
        }
    }));
    res.json({ results });
});
