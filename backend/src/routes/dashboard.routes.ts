import { Router } from "express";
import * as dashboardController from "../controllers/dashboard.controller.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireRole } from "../middlewares/requireRole.js";

export const dashboardRoutes = Router();

// Admin only - get dashboard statistics
dashboardRoutes.get(
  "/stats",
  requireAuth,
  requireRole("ADMIN"),
  dashboardController.getStats
);
