import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as pricingService from "../services/pricing.service.js";

export const getVariantPricing = asyncHandler(async (req: Request, res: Response) => {
  const { variantId } = req.params as { variantId: string };
  const pricing = await pricingService.resolveVariantPricing(variantId);
  res.json({ pricing });
});

export const getBulkVariantPricing = asyncHandler(async (req: Request, res: Response) => {
  const { variantIds } = req.body as { variantIds: string[] };
  
  const results = await Promise.all(
    variantIds.map(async (variantId) => {
      try {
        const pricing = await pricingService.resolveVariantPricing(variantId);
        return { variantId, pricing };
      } catch {
        return { variantId, pricing: null };
      }
    })
  );
  
  res.json({ results });
});
