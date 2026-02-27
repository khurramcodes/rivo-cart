import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireRole } from "../middlewares/requireRole.js";
import { requireCsrf } from "../middlewares/csrf.js";
import { validate } from "../middlewares/validate.js";
import * as reportController from "../modules/report/report.controller.js";
import {
  adminListReportsSchema,
  adminReportActionSchema,
  reportIdParamSchema,
} from "../validations/report.validation.js";

export const reportAdminRoutes = Router();

reportAdminRoutes.get("/", requireAuth, requireRole("ADMIN"), validate(adminListReportsSchema), reportController.list);
reportAdminRoutes.get(
  "/:reportId",
  requireAuth,
  requireRole("ADMIN"),
  validate(reportIdParamSchema),
  reportController.detail,
);
reportAdminRoutes.patch(
  "/:reportId/under-review",
  requireAuth,
  requireRole("ADMIN"),
  requireCsrf,
  validate(adminReportActionSchema),
  reportController.underReview,
);
reportAdminRoutes.patch(
  "/:reportId/resolve-remove",
  requireAuth,
  requireRole("ADMIN"),
  requireCsrf,
  validate(adminReportActionSchema),
  reportController.resolveRemove,
);
reportAdminRoutes.patch(
  "/:reportId/resolve-approve",
  requireAuth,
  requireRole("ADMIN"),
  requireCsrf,
  validate(adminReportActionSchema),
  reportController.resolveApprove,
);
reportAdminRoutes.patch(
  "/:reportId/reject",
  requireAuth,
  requireRole("ADMIN"),
  requireCsrf,
  validate(adminReportActionSchema),
  reportController.reject,
);
