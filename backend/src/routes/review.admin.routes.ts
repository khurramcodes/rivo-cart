import { Router } from "express";
import { validate } from "../middlewares/validate.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireRole } from "../middlewares/requireRole.js";
import { requireCsrf } from "../middlewares/csrf.js";
import * as reviewAdminController from "../controllers/review.admin.controller.js";
import {
  adminListReviewsSchema,
  idParamSchema,
  createReplySchema,
  updateReplySchema,
} from "../validations/review.validation.js";

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
reviewAdminRoutes.patch(
  "/:id/remove",
  requireAuth,
  requireRole("ADMIN"),
  requireCsrf,
  validate(idParamSchema),
  reviewAdminController.remove,
);
reviewAdminRoutes.post(
  "/:id/reply",
  requireAuth,
  requireRole("ADMIN"),
  requireCsrf,
  validate(createReplySchema),
  reviewAdminController.createReply,
);
reviewAdminRoutes.put(
  "/:id/reply",
  requireAuth,
  requireRole("ADMIN"),
  requireCsrf,
  validate(updateReplySchema),
  reviewAdminController.updateReply,
);
reviewAdminRoutes.delete(
  "/:id/reply",
  requireAuth,
  requireRole("ADMIN"),
  validate(idParamSchema),
  reviewAdminController.deleteReply,
);

