import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError.js";
import { CSRF_COOKIE } from "../utils/cookies.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function requireCsrf(req: Request, _res: Response, next: NextFunction) {
  if (SAFE_METHODS.has(req.method)) return next();

  const cookie = req.cookies?.[CSRF_COOKIE] as string | undefined;
  const header =
    req.header("x-csrf-token") ??
    req.header("x-xsrf-token") ??
    req.header("csrf-token") ??
    undefined;

  if (!cookie || !header || cookie !== header) {
    return next(new ApiError(403, "CSRF_FAILED", "CSRF validation failed"));
  }

  return next();
}


