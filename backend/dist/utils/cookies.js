export const ACCESS_COOKIE = "access_token";
export const REFRESH_COOKIE = "refresh_token";
export const CSRF_COOKIE = "XSRF-TOKEN";
export const CART_SESSION_COOKIE = "session_id";
function isProd() {
    return process.env.NODE_ENV === "production";
}
export function authCookieOptions(maxAgeMs) {
    return {
        httpOnly: true,
        secure: isProd(),
        sameSite: isProd() ? "none" : "lax",
        path: "/",
        maxAge: maxAgeMs,
    };
}
export function csrfCookieOptions(maxAgeMs) {
    return {
        httpOnly: false,
        secure: isProd(),
        sameSite: isProd() ? "none" : "lax",
        path: "/",
        maxAge: maxAgeMs,
    };
}
export function cartSessionCookieOptions(maxAgeMs) {
    return {
        httpOnly: true,
        secure: isProd(),
        sameSite: "lax",
        path: "/",
        maxAge: maxAgeMs,
    };
}
