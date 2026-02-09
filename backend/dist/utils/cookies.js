export const ACCESS_COOKIE = "access_token";
export const REFRESH_COOKIE = "refresh_token";
export const CSRF_COOKIE = "XSRF-TOKEN";
export const CART_SESSION_COOKIE = "session_id";
function isProd() {
    return process.env.NODE_ENV === "production";
}
function cookieDomain() {
    const raw = process.env.COOKIE_DOMAIN?.trim();
    return raw ? raw : undefined;
}
export function authCookieOptions(maxAgeMs) {
    const domain = cookieDomain();
    return {
        httpOnly: true,
        secure: isProd(),
        sameSite: isProd() ? "none" : "lax",
        path: "/",
        maxAge: maxAgeMs,
        ...(domain ? { domain } : {}),
    };
}
export function csrfCookieOptions(maxAgeMs) {
    const domain = cookieDomain();
    return {
        httpOnly: false,
        secure: isProd(),
        sameSite: isProd() ? "none" : "lax",
        path: "/",
        maxAge: maxAgeMs,
        ...(domain ? { domain } : {}),
    };
}
export function cartSessionCookieOptions(maxAgeMs) {
    const domain = cookieDomain();
    return {
        httpOnly: true,
        secure: isProd(),
        sameSite: "lax",
        path: "/",
        maxAge: maxAgeMs,
        ...(domain ? { domain } : {}),
    };
}
export function authCookieClearOptions() {
    const domain = cookieDomain();
    return {
        httpOnly: true,
        secure: isProd(),
        sameSite: isProd() ? "none" : "lax",
        path: "/",
        ...(domain ? { domain } : {}),
    };
}
export function csrfCookieClearOptions() {
    const domain = cookieDomain();
    return {
        httpOnly: false,
        secure: isProd(),
        sameSite: isProd() ? "none" : "lax",
        path: "/",
        ...(domain ? { domain } : {}),
    };
}
