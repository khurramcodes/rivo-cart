import { ApiError } from "../utils/ApiError.js";
import { CSRF_COOKIE } from "../utils/cookies.js";
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
export function requireCsrf(req, _res, next) {
    if (SAFE_METHODS.has(req.method))
        return next();
    const cookie = req.cookies?.[CSRF_COOKIE];
    const header = req.header("X-XSRF-TOKEN") ||
        req.header("x-xsrf-token") || // optional fallback
        req.header("x-csrf-token");
    if (!cookie || !header || cookie !== header) {
        return next(new ApiError(403, "CSRF_FAILED", "CSRF validation failed"));
    }
    return next();
}
