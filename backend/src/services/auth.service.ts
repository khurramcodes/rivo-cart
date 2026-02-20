import type { User } from "@prisma/client";
import crypto from "node:crypto";
import { prisma } from "../prisma/client.js";
import { ApiError } from "../utils/ApiError.js";
import { randomToken, sha256 } from "../utils/crypto.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { signAccessToken, signRefreshToken, type JwtUserPayload } from "../utils/jwt.js";
import { redis } from "../utils/redis.js";
import { sendOtpEmail, sendPasswordResetEmail } from "./email.service.js";

function sanitizeUser(user: User) {
  const { password, ...safe } = user;
  return safe;
}

export async function registerUser(input: {
  firstName: string;
  lastName?: string | null;
  email: string;
  password: string;
}) {
  const email = input.email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new ApiError(409, "EMAIL_IN_USE", "Email is already in use");

  const passwordHash = await hashPassword(input.password);
  const firstName = input.firstName.trim();
  const lastName = input.lastName?.trim() || null;
  const name = lastName ? `${firstName} ${lastName}` : firstName;
  const user = await prisma.user.create({
    data: {
      name,
      firstName,
      lastName,
      email,
      password: passwordHash,
      role: "USER",
    },
  });

  const payload: JwtUserPayload = { sub: user.id, firstName: user.firstName || user.name, role: user.role };
  return {
    user: sanitizeUser(user),
    accessToken: signAccessToken(payload),
  };
}

const OTP_TTL_SECONDS = 10 * 60;
const REG_INTENT_TTL_SECONDS = 30 * 60;
const MAX_OTP_ATTEMPTS = 5;
const MAX_RESENDS = 3;
const RESEND_WINDOW_SECONDS = 10 * 60;
const PASSWORD_RESET_TTL_SECONDS = 10 * 60; // <= 15 minutes requirement

function passwordResetKey(userId: string) {
  return `auth:password_reset:${userId}`;
}

function timingSafeEqualHex(a: string, b: string) {
  // Ensure equal-length buffers for timingSafeEqual
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function otpKey(email: string) {
  return `auth:register:otp:${email}`;
}

function intentKey(email: string) {
  return `auth:register:intent:${email}`;
}

function attemptKey(email: string) {
  return `auth:register:attempts:${email}`;
}

function resendKey(email: string) {
  return `auth:register:resend:${email}`;
}

function generateOtp() {
  const n = Math.floor(100000 + Math.random() * 900000);
  return String(n);
}

export async function startRegistration(input: {
  email: string;
  password: string;
  firstName: string;
  lastName?: string | null;
}) {
  const email = input.email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new ApiError(409, "EMAIL_IN_USE", "Email is already in use");

  const existingIntent = await redis.get<string>(intentKey(email));
  if (existingIntent) {
    throw new ApiError(409, "REGISTRATION_PENDING", "Registration already pending");
  }

  const passwordHash = await hashPassword(input.password);
  const otp = generateOtp();
  const otpHash = sha256(otp);

  const intent = {
    email,
    firstName: input.firstName.trim(),
    lastName: input.lastName?.trim() || null,
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  await sendOtpEmail(email, otp);

  await redis.set(intentKey(email), JSON.stringify(intent), { ex: REG_INTENT_TTL_SECONDS });
  await redis.set(otpKey(email), otpHash, { ex: OTP_TTL_SECONDS });

  return { email };
}

export async function loginUser(input: {
  email: string;
  password: string;
  userAgent?: string;
  ip?: string;
}) {

  const email = input.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email } });

  
  if (!user) throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password");

  const ok = await verifyPassword(input.password, user.password);
  if (!ok) throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password");

  const payload: JwtUserPayload = {
    sub: user.id,
    firstName: user.firstName || user.name,
    role: user.role,
  };

  const refreshToken = randomToken(48);
  const refreshTokenHash = sha256(refreshToken);
  const refreshExpiresDays = Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS ?? 7);
  const expiresAt = new Date(Date.now() + refreshExpiresDays * 24 * 60 * 60 * 1000);

  const session = await prisma.session.create({
    data: {
      userId: user.id,
      refreshTokenHash,
      userAgent: input.userAgent,
      ip: input.ip,
      expiresAt,
    },
  });

  return {
    user: sanitizeUser(user),
    accessToken: signAccessToken(payload),
    // opaque refresh token stored in HttpOnly cookie; session id helps debug/rotate
    refreshToken,
    sessionId: session.id,
  };
}

export async function verifyRegistrationOtp(input: { email: string; otp: string }) {
  const email = input.email.toLowerCase().trim();

  const intentRaw = await redis.get<string>(intentKey(email));
  if (!intentRaw) throw new ApiError(400, "REGISTRATION_EXPIRED", "Registration expired");

  const storedOtpHash = await redis.get<string>(otpKey(email));
  if (!storedOtpHash) throw new ApiError(400, "OTP_EXPIRED", "OTP expired");

  const inputHash = sha256(input.otp);
  if (inputHash !== storedOtpHash) {
    const attempts = await redis.incr(attemptKey(email));
    if (attempts === 1) {
      await redis.expire(attemptKey(email), OTP_TTL_SECONDS);
    }
    if (attempts >= MAX_OTP_ATTEMPTS) {
      await redis.del(otpKey(email));
      throw new ApiError(400, "OTP_INVALIDATED", "OTP invalidated. Please request a new code.");
    }
    throw new ApiError(400, "OTP_INVALID", "Invalid OTP");
  }

  const intent = (typeof intentRaw === "string" 
  ? JSON.parse(intentRaw) 
  : intentRaw) as {
    email: string;
    firstName: string;
    lastName?: string | null;
    passwordHash: string;
  };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new ApiError(409, "EMAIL_IN_USE", "Email is already in use");

  const fullName = intent.lastName ? `${intent.firstName} ${intent.lastName}` : intent.firstName;
  const user = await prisma.user.create({
    data: {
      name: fullName,
      firstName: intent.firstName,
      lastName: intent.lastName ?? null,
      email,
      password: intent.passwordHash,
      role: "USER",
    },
  });

  await redis.del(intentKey(email), otpKey(email), attemptKey(email), resendKey(email));
  return sanitizeUser(user);
}

export async function resendRegistrationOtp(input: { email: string }) {
  const email = input.email.toLowerCase().trim();

  const intentRaw = await redis.get<string>(intentKey(email));
  if (!intentRaw) throw new ApiError(400, "REGISTRATION_EXPIRED", "Registration expired");

  const existingOtp = await redis.get<string>(otpKey(email));
  if (existingOtp) throw new ApiError(409, "OTP_STILL_VALID", "OTP still valid");

  const resendCount = await redis.incr(resendKey(email));
  if (resendCount === 1) {
    await redis.expire(resendKey(email), RESEND_WINDOW_SECONDS);
  }
  if (resendCount > MAX_RESENDS) {
    throw new ApiError(429, "RATE_LIMITED", "Too many OTP requests. Try again later.");
  }

  const otp = generateOtp();
  const otpHash = sha256(otp);
  await redis.set(otpKey(email), otpHash, { ex: OTP_TTL_SECONDS });

  await sendOtpEmail(email, otp);
  return { email };
}

export async function rotateRefreshToken(input: { refreshToken: string }) {
  const refreshTokenHash = sha256(input.refreshToken);
  const session = await prisma.session.findFirst({
    where: { refreshTokenHash, revokedAt: null, expiresAt: { gt: new Date() } },
    include: { user: true },
  });

  if (!session) throw new ApiError(401, "INVALID_REFRESH", "Invalid refresh token");

  // rotate: revoke old, issue new
  const newRefreshToken = randomToken(48);
  const newRefreshTokenHash = sha256(newRefreshToken);
  const refreshExpiresDays = Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS ?? 7);
  const newExpiresAt = new Date(Date.now() + refreshExpiresDays * 24 * 60 * 60 * 1000);

  await prisma.$transaction([
    prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    }),
    prisma.session.create({
      data: {
        userId: session.userId,
        refreshTokenHash: newRefreshTokenHash,
        userAgent: session.userAgent ?? undefined,
        ip: session.ip ?? undefined,
        expiresAt: newExpiresAt,
      },
    }),
  ]);

  const payload: JwtUserPayload = {
    sub: session.userId,
    firstName: session.user.firstName || session.user.name,
    role: session.user.role,
  };

  return {
    user: sanitizeUser(session.user),
    accessToken: signAccessToken(payload),
    refreshToken: newRefreshToken,
  };
}

export async function logoutByRefreshToken(refreshToken: string) {
  const refreshTokenHash = sha256(refreshToken);
  await prisma.session.updateMany({
    where: { refreshTokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, "NOT_FOUND", "User not found");
  return sanitizeUser(user);
}

/**
 * Forgot password: always succeeds without revealing whether the email exists.
 * Stores ONLY the SHA256 hash of the reset token in Redis (single-use, short TTL).
 */
export async function forgotPassword(input: { email: string }) {
  const email = input.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return;
  }

  const token = randomToken(32); // crypto.randomBytes(32) under the hood
  const tokenHash = sha256(token);

  await redis.set(passwordResetKey(user.id), tokenHash, {
    ex: PASSWORD_RESET_TTL_SECONDS,
  });

  const baseUrl =
    process.env.FRONTEND_URL?.trim() ||
    process.env.CORS_ORIGIN?.split(",")[0]?.trim() ||
    "http://localhost:3000";

  const resetUrl = `${baseUrl.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(
    token,
  )}&uid=${encodeURIComponent(user.id)}`;

  await sendPasswordResetEmail(email, resetUrl);
}

/**
 * Reset password: validates token (constant-time), single-use, updates password,
 * and invalidates ALL sessions (logout from all devices).
 */
export async function resetPassword(input: { userId: string; token: string; password: string }) {
  const key = passwordResetKey(input.userId);
  const storedHash = await redis.get<string>(key);
  if (!storedHash) {
    throw new ApiError(400, "RESET_INVALID", "Invalid or expired reset token");
  }

  const inputHash = sha256(input.token);
  if (!timingSafeEqualHex(inputHash, storedHash)) {
    throw new ApiError(400, "RESET_INVALID", "Invalid or expired reset token");
  }

  // Single-use token: delete and ensure we "won" the race.
  const deleted = await redis.del(key);
  if (deleted !== 1) {
    throw new ApiError(400, "RESET_INVALID", "Invalid or expired reset token");
  }

  const passwordHash = await hashPassword(input.password);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: input.userId },
      data: { password: passwordHash },
    }),
    prisma.session.deleteMany({
      where: { userId: input.userId },
    }),
  ]);
}


