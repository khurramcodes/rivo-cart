import { Router } from "express";
import { validate } from "../middlewares/validate.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireRole } from "../middlewares/requireRole.js";
import { requireCsrf } from "../middlewares/csrf.js";
import * as notificationAdminController from "../controllers/notification.admin.controller.js";
import {
  adminListNotificationsSchema,
  notificationIdParamSchema,
} from "../validations/notification.validation.js";

export const notificationAdminRoutes = Router();

notificationAdminRoutes.get(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  validate(adminListNotificationsSchema),
  notificationAdminController.list,
);
notificationAdminRoutes.get(
  "/stats",
  requireAuth,
  requireRole("ADMIN"),
  notificationAdminController.stats,
);
notificationAdminRoutes.patch(
  "/:id/read",
  requireAuth,
  requireRole("ADMIN"),
  requireCsrf,
  validate(notificationIdParamSchema),
  notificationAdminController.read,
);
notificationAdminRoutes.post(
  "/:id/retry-email",
  requireAuth,
  requireRole("ADMIN"),
  requireCsrf,
  validate(notificationIdParamSchema),
  notificationAdminController.retryEmail,
);
