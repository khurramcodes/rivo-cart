import { asyncHandler } from "../utils/asyncHandler.js";
import { csrfCookieOptions, CSRF_COOKIE, authCookieOptions, ACCESS_COOKIE, REFRESH_COOKIE, } from "../utils/cookies.js";
import { randomToken } from "../utils/crypto.js";
import { loginUser, rotateRefreshToken, logoutByRefreshToken, getUserById, startRegistration, verifyRegistrationOtp, resendRegistrationOtp, } from "../services/auth.service.js";
import { ApiError } from "../utils/ApiError.js";
function msFromExpires(str) {
    // supports "15m", "7d", "1h" (fallback to minutes)
    const match = /^(\d+)([smhd])$/.exec(str.trim());
    if (!match)
        return 15 * 60 * 1000;
    const n = Number(match[1]);
    const unit = match[2];
    const mult = unit === "s"
        ? 1000
        : unit === "m"
            ? 60_000
            : unit === "h"
                ? 3_600_000
                : 86_400_000;
    return n * mult;
}
function setCsrfCookie(res) {
    const token = randomToken(24);
    res.cookie(CSRF_COOKIE, token, csrfCookieOptions(7 * 24 * 60 * 60 * 1000));
    return token;
}
export const register = asyncHandler(async (req, res) => {
    const { email, password, firstName, lastName } = req.body;
    await startRegistration({ email, password, firstName, lastName });
    res.status(202).json({ message: "OTP sent" });
});
export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const { user, accessToken, refreshToken } = await loginUser({
        email,
        password,
        userAgent: req.get("user-agent") ?? undefined,
        ip: req.ip,
    });
    const accessMaxAge = msFromExpires(process.env.JWT_ACCESS_EXPIRES_IN ?? "24h");
    const refreshDays = Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS ?? 7);
    const refreshMaxAge = refreshDays * 24 * 60 * 60 * 1000;
    res.cookie(ACCESS_COOKIE, accessToken, authCookieOptions(accessMaxAge));
    res.cookie(REFRESH_COOKIE, refreshToken, authCookieOptions(refreshMaxAge));
    const csrf = setCsrfCookie(res);
    res.json({ user, csrfToken: csrf });
});
export const refresh = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.[REFRESH_COOKIE];
    if (!refreshToken)
        throw new ApiError(401, "INVALID_REFRESH", "Missing refresh token");
    const { user, accessToken, refreshToken: newRefresh, } = await rotateRefreshToken({ refreshToken });
    const accessMaxAge = msFromExpires(process.env.JWT_ACCESS_EXPIRES_IN ?? "24h");
    const refreshDays = Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS ?? 7);
    const refreshMaxAge = refreshDays * 24 * 60 * 60 * 1000;
    res.cookie(ACCESS_COOKIE, accessToken, authCookieOptions(accessMaxAge));
    res.cookie(REFRESH_COOKIE, newRefresh, authCookieOptions(refreshMaxAge));
    const csrf = setCsrfCookie(res);
    res.json({ user, csrfToken: csrf });
});
export const logout = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.[REFRESH_COOKIE];
    if (refreshToken)
        await logoutByRefreshToken(refreshToken);
    res.clearCookie(ACCESS_COOKIE, { path: "/" });
    res.clearCookie(REFRESH_COOKIE, { path: "/" });
    res.clearCookie(CSRF_COOKIE, { path: "/" });
    res.status(204).send();
});
export const verifyEmail = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;
    await verifyRegistrationOtp({ email, otp });
    res.status(201).json({ message: "Email verified. Please log in." });
});
export const resendOtp = asyncHandler(async (req, res) => {
    const { email } = req.body;
    await resendRegistrationOtp({ email });
    res.json({ message: "OTP resent" });
});
export const me = asyncHandler(async (req, res) => {
    if (!req.user)
        throw new ApiError(401, "UNAUTHORIZED", "Missing authentication");
    const user = await getUserById(req.user.sub);
    res.json({ user });
});
