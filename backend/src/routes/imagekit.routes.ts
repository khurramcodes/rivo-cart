import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireRole } from "../middlewares/requireRole.js";
import { requireCsrf } from "../middlewares/csrf.js";
import * as imagekitController from "../controllers/imagekit.controller.js";

export const imagekitRoutes = Router();

imagekitRoutes.get("/auth", requireAuth, requireRole("ADMIN"), requireCsrf, imagekitController.authParams);


