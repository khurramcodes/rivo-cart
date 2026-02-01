import { asyncHandler } from "../utils/asyncHandler.js";
import * as couponService from "../services/coupon.service.js";
export const list = asyncHandler(async (_req, res) => {
    const coupons = await couponService.listCoupons();
    res.json({ coupons });
});
export const get = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const coupon = await couponService.getCoupon(id);
    res.json({ coupon });
});
export const create = asyncHandler(async (req, res) => {
    const coupon = await couponService.createCoupon(req.body);
    res.status(201).json({ coupon });
});
export const update = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const coupon = await couponService.updateCoupon(id, req.body);
    res.json({ coupon });
});
export const remove = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await couponService.deleteCoupon(id);
    res.status(204).send();
});
export const validate = asyncHandler(async (req, res) => {
    const { cartId, code } = req.body;
    const result = await couponService.validateCouponForCart(cartId, code);
    res.json({ valid: true, coupon: result.coupon, subtotal: result.subtotal });
});
export const stats = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = await couponService.getCouponStats(id);
    res.json({ stats: data });
});
