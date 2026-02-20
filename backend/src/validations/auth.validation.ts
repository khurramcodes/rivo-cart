import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    firstName: z.string().trim().min(2).max(100),
    lastName: z.string().trim().min(2).max(100).optional(),
    email: z.string().email().max(255),
    password: z.string().min(8).max(72),
  }),
});

export const verifyEmailSchema = z.object({
  body: z.object({
    email: z.string().email().max(255),
    otp: z.string().regex(/^\d{6}$/),
  }),
});

export const resendOtpSchema = z.object({
  body: z.object({
    email: z.string().email().max(255),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email().max(255),
    password: z.string().min(1).max(72),
  }),
});

export const refreshSchema = z.object({
  body: z.object({}).optional(),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email().max(255),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    userId: z.string().min(1),
    token: z
      .string()
      .min(1)
      .regex(/^[a-fA-F0-9]{64}$/, "Invalid token"),
    password: z.string().min(8).max(72),
  }),
});


