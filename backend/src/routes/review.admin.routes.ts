import { Router } from "express";
import { validate } from "../middlewares/validate.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireRole } from "../middlewares/requireRole.js";
import { requireCsrf } from "../middlewares/csrf.js";
import * as reviewAdminController from "../controllers/review.admin.controller.js";
import { adminListReviewsSchema, idParamSchema } from "../validations/review.validation.js";

export const reviewAdminRoutes = Router();

reviewAdminRoutes.get("/", requireAuth, requireRole("ADMIN"), validate(adminListReviewsSchema), reviewAdminController.list);
reviewAdminRoutes.patch(
  "/:id/approve",
  requireAuth,
  requireRole("ADMIN"),
  requireCsrf,
  validate(idParamSchema),
  reviewAdminController.approve,
);
reviewAdminRoutes.patch(
  "/:id/reject",
  requireAuth,
  requireRole("ADMIN"),
  requireCsrf,
  validate(idParamSchema),
  reviewAdminController.reject,
);

