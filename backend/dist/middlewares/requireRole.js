import { ApiError } from "../utils/ApiError.js";
export function requireRole(role) {
    return (req, _res, next) => {
        if (!req.user)
            return next(new ApiError(401, "UNAUTHORIZED", "Missing authentication"));
        if (req.user.role !== role)
            return next(new ApiError(403, "FORBIDDEN", "Forbidden"));
        return next();
    };
}
