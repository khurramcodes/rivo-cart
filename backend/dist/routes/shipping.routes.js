import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireCsrf } from "../middlewares/csrf.js";
import { validate } from "../middlewares/validate.js";
import { requireRole } from "../middlewares/requireRole.js";
import * as shippingController from "../controllers/shipping.controller.js";
import * as shippingAdminController from "../controllers/shipping.admin.controller.js";
import { quoteShippingSchema } from "../validations/shipping.validation.js";
import { createShippingMethodSchema, createShippingRuleSchema, createShippingZoneSchema, idParamSchema, updateShippingMethodSchema, updateShippingRuleSchema, updateShippingZoneSchema, } from "../validations/shipping.admin.validation.js";
export const shippingRoutes = Router();
shippingRoutes.post("/quote", requireAuth, requireCsrf, validate(quoteShippingSchema), shippingController.quote);
// Admin: zones
shippingRoutes.get("/zones", requireAuth, requireRole("ADMIN"), shippingAdminController.listZones);
shippingRoutes.post("/zones", requireAuth, requireRole("ADMIN"), requireCsrf, validate(createShippingZoneSchema), shippingAdminController.createZone);
shippingRoutes.put("/zones/:id", requireAuth, requireRole("ADMIN"), requireCsrf, validate(updateShippingZoneSchema), shippingAdminController.updateZone);
shippingRoutes.delete("/zones/:id", requireAuth, requireRole("ADMIN"), requireCsrf, validate(idParamSchema), shippingAdminController.removeZone);
// Admin: methods
shippingRoutes.get("/methods", requireAuth, requireRole("ADMIN"), shippingAdminController.listMethods);
shippingRoutes.post("/methods", requireAuth, requireRole("ADMIN"), requireCsrf, validate(createShippingMethodSchema), shippingAdminController.createMethod);
shippingRoutes.put("/methods/:id", requireAuth, requireRole("ADMIN"), requireCsrf, validate(updateShippingMethodSchema), shippingAdminController.updateMethod);
shippingRoutes.delete("/methods/:id", requireAuth, requireRole("ADMIN"), requireCsrf, validate(idParamSchema), shippingAdminController.removeMethod);
// Admin: rules
shippingRoutes.get("/rules", requireAuth, requireRole("ADMIN"), shippingAdminController.listRules);
shippingRoutes.post("/rules", requireAuth, requireRole("ADMIN"), requireCsrf, validate(createShippingRuleSchema), shippingAdminController.createRule);
shippingRoutes.put("/rules/:id", requireAuth, requireRole("ADMIN"), requireCsrf, validate(updateShippingRuleSchema), shippingAdminController.updateRule);
shippingRoutes.delete("/rules/:id", requireAuth, requireRole("ADMIN"), requireCsrf, validate(idParamSchema), shippingAdminController.removeRule);
