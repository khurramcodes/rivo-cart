import type { CookieOptions } from "express";

export const ACCESS_COOKIE = "access_token";
export const REFRESH_COOKIE = "refresh_token";
export const CSRF_COOKIE = "XSRF-TOKEN";

function isProd() {
  return process.env.NODE_ENV === "production";
}

export function authCookieOptions(maxAgeMs: number): CookieOptions {
  return {
    httpOnly: true,
    secure: isProd(),
    sameSite: isProd() ? "none" : "lax",
    path: "/",
    maxAge: maxAgeMs,
  };
}

export function csrfCookieOptions(maxAgeMs: number): CookieOptions {
  return {
    httpOnly: false,
    secure: isProd(),
    sameSite: isProd() ? "none" : "lax",
    path: "/",
    maxAge: maxAgeMs,
  };
}


