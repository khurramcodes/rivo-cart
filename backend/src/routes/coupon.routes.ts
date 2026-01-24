import { Router } from "express";
import { validate } from "../middlewares/validate.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireRole } from "../middlewares/requireRole.js";
import { requireCsrf } from "../middlewares/csrf.js";
import * as couponController from "../controllers/coupon.controller.js";
import { createCouponSchema, idParamSchema, updateCouponSchema, validateCouponSchema } from "../validations/coupon.validation.js";

export const couponRoutes = Router();

couponRoutes.get(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  couponController.list,
);

couponRoutes.get(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  validate(idParamSchema),
  couponController.get,
);

couponRoutes.post(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  requireCsrf,
  validate(createCouponSchema),
  couponController.create,
);

couponRoutes.put(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  requireCsrf,
  validate(updateCouponSchema),
  couponController.update,
);

couponRoutes.delete(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  requireCsrf,
  validate(idParamSchema),
  couponController.remove,
);

couponRoutes.post(
  "/validate",
  requireAuth,
  requireRole("ADMIN"),
  requireCsrf,
  validate(validateCouponSchema),
  couponController.validate,
);

couponRoutes.get(
  "/:id/stats",
  requireAuth,
  requireRole("ADMIN"),
  validate(idParamSchema),
  couponController.stats,
);
