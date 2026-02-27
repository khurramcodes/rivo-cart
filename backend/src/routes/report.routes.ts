import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireCsrf } from "../middlewares/csrf.js";
import { validate } from "../middlewares/validate.js";
import * as reportController from "../modules/report/report.controller.js";
import { createReportSchema, myReportStatusSchema } from "../validations/report.validation.js";

export const reportRoutes = Router();

reportRoutes.get("/my-status", requireAuth, validate(myReportStatusSchema), reportController.myStatus);
reportRoutes.post("/", requireAuth, requireCsrf, validate(createReportSchema), reportController.create);
