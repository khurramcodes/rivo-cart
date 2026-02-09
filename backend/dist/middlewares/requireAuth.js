import { ApiError } from "../utils/ApiError.js";
import { ACCESS_COOKIE } from "../utils/cookies.js";
import { verifyToken } from "../utils/jwt.js";
export function requireAuth(req, _res, next) {
    const cookieToken = req.cookies?.[ACCESS_COOKIE];
    const header = req.header("authorization");
    const headerToken = header && header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : undefined;
    const token = cookieToken ?? headerToken;
    if (!token)
        return next(new ApiError(401, "UNAUTHORIZED", "Missing authentication"));
    req.user = verifyToken(token);
    return next();
}
