import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError.js";
import { CSRF_COOKIE } from "../utils/cookies.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function requireCsrf(req: Request, _res: Response, next: NextFunction) {
  if (SAFE_METHODS.has(req.method)) return next();

  const cookie = req.cookies?.[CSRF_COOKIE] as string | undefined;
  
  console.log("req.headers", req.headers);
  console.log("cookie", cookie);

  const header =
    req.header("X-XSRF-TOKEN") ||
    req.header("x-xsrf-token") || // optional fallback
    req.header("x-csrf-token");

  if (!cookie || !header || cookie !== header) {
    return next(new ApiError(403, "CSRF_FAILED", "CSRF validation failed"));
  }

  return next();
}


