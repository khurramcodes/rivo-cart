import { Router } from "express";
import { validate } from "../middlewares/validate.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireRole } from "../middlewares/requireRole.js";
import { requireCsrf } from "../middlewares/csrf.js";
import * as discountController from "../controllers/discount.controller.js";
import { createDiscountSchema, idParamSchema, updateDiscountSchema } from "../validations/discount.validation.js";

export const discountRoutes = Router();

discountRoutes.get(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  discountController.list,
);

discountRoutes.get(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  validate(idParamSchema),
  discountController.get,
);

discountRoutes.post(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  requireCsrf,
  validate(createDiscountSchema),
  discountController.create,
);

discountRoutes.put(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  requireCsrf,
  validate(updateDiscountSchema),
  discountController.update,
);

discountRoutes.delete(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  requireCsrf,
  validate(idParamSchema),
  discountController.remove,
);
