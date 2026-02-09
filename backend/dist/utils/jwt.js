import jwt from "jsonwebtoken";
import { ApiError } from "./ApiError.js";
function mustGetEnv(name) {
    const val = process.env[name];
    if (!val)
        throw new ApiError(500, "CONFIG_ERROR", `Missing env var: ${name}`);
    return val;
}
export function signAccessToken(payload) {
    const secret = mustGetEnv("JWT_SECRET");
    const expiresInRaw = process.env.JWT_ACCESS_EXPIRES_IN ?? "24h";
    const options = { expiresIn: expiresInRaw };
    return jwt.sign(payload, secret, options);
}
export function signRefreshToken(payload) {
    const secret = mustGetEnv("JWT_SECRET");
    const expiresInRaw = process.env.JWT_REFRESH_EXPIRES_IN ?? "7d";
    const options = { expiresIn: expiresInRaw };
    return jwt.sign(payload, secret, options);
}
export function verifyToken(token) {
    const secret = mustGetEnv("JWT_SECRET");
    try {
        const decoded = jwt.verify(token, secret);
        if (typeof decoded !== "object" || decoded === null) {
            throw new ApiError(401, "UNAUTHORIZED", "Invalid token");
        }
        const { sub, firstName, role } = decoded;
        if (typeof sub !== "string" || typeof firstName !== "string" || (role !== "USER" && role !== "ADMIN")) {
            throw new ApiError(401, "UNAUTHORIZED", "Invalid token");
        }
        return { sub, firstName, role };
    }
    catch (error) {
        throw new ApiError(401, "UNAUTHORIZED", "Invalid or expired token");
    }
}
