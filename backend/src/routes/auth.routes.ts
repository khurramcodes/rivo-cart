import { Router } from "express";
import { validate } from "../middlewares/validate.js";
import {
  loginSchema,
  refreshSchema,
  registerSchema,
  resendOtpSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../validations/auth.validation.js";
import * as authController from "../controllers/auth.controller.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireCsrf } from "../middlewares/csrf.js";

export const authRoutes = Router();

authRoutes.post("/register", validate(registerSchema), authController.register);
authRoutes.post("/verify-email", validate(verifyEmailSchema), authController.verifyEmail);
authRoutes.post("/resend-otp", validate(resendOtpSchema), authController.resendOtp);
authRoutes.post("/login", validate(loginSchema), authController.login);
authRoutes.post("/refresh", validate(refreshSchema), authController.refresh);
authRoutes.post("/logout", authController.logout);
authRoutes.get("/me", requireAuth, authController.me);

authRoutes.post("/forgot-password", validate(forgotPasswordSchema), authController.forgotPasswordHandler);
authRoutes.post("/reset-password", validate(resetPasswordSchema), authController.resetPasswordHandler);


