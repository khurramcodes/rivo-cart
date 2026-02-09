import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ACCESS_COOKIE, CART_SESSION_COOKIE, cartSessionCookieOptions } from "../utils/cookies.js";
import { verifyToken } from "../utils/jwt.js";
import * as cartService from "../services/cart.service.js";
import { resolveCartPricing } from "../services/pricing.service.js";
const CART_SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
function getOptionalUserId(req) {
    const cookieToken = req.cookies?.[ACCESS_COOKIE];
    const header = req.header("authorization");
    const headerToken = header && header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : undefined;
    const token = cookieToken ?? headerToken;
    if (!token)
        return undefined;
    try {
        return verifyToken(token).sub;
    }
    catch {
        throw new ApiError(401, "UNAUTHORIZED", "Invalid token");
    }
}
function applySessionCookie(res, result) {
    if (result.clearSessionCookie) {
        res.clearCookie(CART_SESSION_COOKIE, cartSessionCookieOptions(0));
        return;
    }
    // Always re-set the cookie when the cart has a session (guest cart) so the browser stores it consistently
    const toSet = result.newSessionId ?? result.cart.sessionId ?? undefined;
    if (toSet) {
        res.cookie(CART_SESSION_COOKIE, toSet, cartSessionCookieOptions(CART_SESSION_MAX_AGE_MS));
    }
}
export const getCart = asyncHandler(async (req, res) => {
    const userId = getOptionalUserId(req);
    const sessionId = req.cookies?.[CART_SESSION_COOKIE];
    const result = await cartService.resolveCart(userId, sessionId);
    applySessionCookie(res, result);
    res.json({ cart: result.cart });
});
export const addItem = asyncHandler(async (req, res) => {
    const userId = getOptionalUserId(req);
    const sessionId = req.cookies?.[CART_SESSION_COOKIE];
    const result = await cartService.addItemToCart(userId, sessionId, req.body);
    applySessionCookie(res, result);
    res.json({ cart: result.cart });
});
export const updateItem = asyncHandler(async (req, res) => {
    const userId = getOptionalUserId(req);
    const sessionId = req.cookies?.[CART_SESSION_COOKIE];
    const result = await cartService.updateCartItemQuantity(userId, sessionId, req.params.id, req.body.quantity);
    applySessionCookie(res, result);
    res.json({ cart: result.cart });
});
export const removeItem = asyncHandler(async (req, res) => {
    const userId = getOptionalUserId(req);
    const sessionId = req.cookies?.[CART_SESSION_COOKIE];
    const result = await cartService.removeCartItem(userId, sessionId, req.params.id);
    applySessionCookie(res, result);
    res.json({ cart: result.cart });
});
export const migrateCart = asyncHandler(async (req, res) => {
    const userId = getOptionalUserId(req);
    const sessionId = req.cookies?.[CART_SESSION_COOKIE];
    const result = await cartService.migrateCartItems(userId, sessionId, req.body.items);
    applySessionCookie(res, result);
    res.json({ cart: result.cart });
});
export const applyCoupon = asyncHandler(async (req, res) => {
    const { code, source } = req.body;
    if (source === "checkout") {
        throw new ApiError(400, "COUPON_NOT_ALLOWED", "Coupons can only be applied in the cart");
    }
    const userId = getOptionalUserId(req);
    const sessionId = req.cookies?.[CART_SESSION_COOKIE];
    const result = await cartService.applyCouponToCart(userId, sessionId, code);
    applySessionCookie(res, result);
    const pricing = await resolveCartPricing(result.cart.id);
    res.json({ cart: result.cart, pricing });
});
export const removeCoupon = asyncHandler(async (req, res) => {
    const userId = getOptionalUserId(req);
    const sessionId = req.cookies?.[CART_SESSION_COOKIE];
    const result = await cartService.removeCouponFromCart(userId, sessionId);
    applySessionCookie(res, result);
    const pricing = await resolveCartPricing(result.cart.id);
    res.json({ cart: result.cart, pricing });
});
export const getPricing = asyncHandler(async (req, res) => {
    const userId = getOptionalUserId(req);
    const sessionId = req.cookies?.[CART_SESSION_COOKIE];
    const result = await cartService.resolveCart(userId, sessionId);
    applySessionCookie(res, result);
    const pricing = await resolveCartPricing(result.cart.id);
    res.json({ pricing });
});
