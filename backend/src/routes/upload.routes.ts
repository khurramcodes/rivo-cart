import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireRole } from "../middlewares/requireRole.js";
import { requireCsrf } from "../middlewares/csrf.js";
import * as uploadController from "../controllers/upload.controller.js";

export const uploadRoutes = Router();

uploadRoutes.post("/", requireAuth, requireRole("ADMIN"), requireCsrf, uploadController.uploadFile);
