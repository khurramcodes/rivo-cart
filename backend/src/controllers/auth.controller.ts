import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  csrfCookieOptions,
  CSRF_COOKIE,
  authCookieOptions,
  ACCESS_COOKIE,
  REFRESH_COOKIE,
} from "../utils/cookies.js";
import { randomToken } from "../utils/crypto.js";
import {
  registerUser,
  loginUser,
  rotateRefreshToken,
  logoutByRefreshToken,
} from "../services/auth.service.js";
import { ApiError } from "../utils/ApiError.js";

function msFromExpires(str: string) {
  // supports "15m", "7d", "1h" (fallback to minutes)
  const match = /^(\d+)([smhd])$/.exec(str.trim());
  if (!match) return 15 * 60 * 1000;
  const n = Number(match[1]);
  const unit = match[2];
  const mult =
    unit === "s"
      ? 1000
      : unit === "m"
      ? 60_000
      : unit === "h"
      ? 3_600_000
      : 86_400_000;
  return n * mult;
}

function setCsrfCookie(res: Response) {
  const token = randomToken(24);
  res.cookie(CSRF_COOKIE, token, csrfCookieOptions(7 * 24 * 60 * 60 * 1000));
  return token;
}

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = req.body as {
    name: string;
    email: string;
    password: string;
  };
  const result = await registerUser({ name, email, password });

  const accessMaxAge = msFromExpires(
    process.env.JWT_ACCESS_EXPIRES_IN ?? "24h"
  );
  res.cookie(
    ACCESS_COOKIE,
    result.accessToken,
    authCookieOptions(accessMaxAge)
  );
  const csrf = setCsrfCookie(res);

  res.status(201).json({ user: result.user, csrfToken: csrf });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };
  
  const { user, accessToken, refreshToken } = await loginUser({
    email,
    password,
    userAgent: req.get("user-agent") ?? undefined,
    ip: req.ip,
  });


  const accessMaxAge = msFromExpires(
    process.env.JWT_ACCESS_EXPIRES_IN ?? "24h"
  );
  const refreshDays = Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS ?? 7);
  const refreshMaxAge = refreshDays * 24 * 60 * 60 * 1000;

  res.cookie(ACCESS_COOKIE, accessToken, authCookieOptions(accessMaxAge));
  res.cookie(REFRESH_COOKIE, refreshToken, authCookieOptions(refreshMaxAge));
  const csrf = setCsrfCookie(res);

  res.json({ user, csrfToken: csrf });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.[REFRESH_COOKIE] as string | undefined;
  if (!refreshToken)
    throw new ApiError(401, "INVALID_REFRESH", "Missing refresh token");

  const {
    user,
    accessToken,
    refreshToken: newRefresh,
  } = await rotateRefreshToken({ refreshToken });

  const accessMaxAge = msFromExpires(
    process.env.JWT_ACCESS_EXPIRES_IN ?? "24h"
  );
  const refreshDays = Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS ?? 7);
  const refreshMaxAge = refreshDays * 24 * 60 * 60 * 1000;

  res.cookie(ACCESS_COOKIE, accessToken, authCookieOptions(accessMaxAge));
  res.cookie(REFRESH_COOKIE, newRefresh, authCookieOptions(refreshMaxAge));
  const csrf = setCsrfCookie(res);

  res.json({ user, csrfToken: csrf });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.[REFRESH_COOKIE] as string | undefined;
  if (refreshToken) await logoutByRefreshToken(refreshToken);

  res.clearCookie(ACCESS_COOKIE, { path: "/" });
  res.clearCookie(REFRESH_COOKIE, { path: "/" });
  res.clearCookie(CSRF_COOKIE, { path: "/" });

  res.status(204).send();
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user)
    throw new ApiError(401, "UNAUTHORIZED", "Missing authentication");
  res.json({ user: req.user });
});
