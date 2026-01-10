import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError.js";

export function requireRole(role: "ADMIN" | "USER") {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new ApiError(401, "UNAUTHORIZED", "Missing authentication"));
    if (req.user.role !== role) return next(new ApiError(403, "FORBIDDEN", "Forbidden"));
    return next();
  };
}


