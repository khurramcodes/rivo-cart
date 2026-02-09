import { Router } from "express";
import * as pricingController from "../controllers/pricing.controller.js";
export const pricingRoutes = Router();
// Public pricing endpoints
pricingRoutes.get("/variants/:variantId", pricingController.getVariantPricing);
pricingRoutes.post("/variants/bulk", pricingController.getBulkVariantPricing);
