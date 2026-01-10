import { Router } from "express";
import { validate } from "../middlewares/validate.js";
import { loginSchema, refreshSchema, registerSchema } from "../validations/auth.validation.js";
import * as authController from "../controllers/auth.controller.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireCsrf } from "../middlewares/csrf.js";

export const authRoutes = Router();

authRoutes.post("/register", validate(registerSchema), authController.register);
authRoutes.post("/login", validate(loginSchema), authController.login);
authRoutes.post("/refresh", validate(refreshSchema), authController.refresh);
authRoutes.post("/logout", requireCsrf, authController.logout);
authRoutes.get("/me", requireAuth, authController.me);


