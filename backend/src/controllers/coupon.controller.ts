import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as couponService from "../services/coupon.service.js";

export const list = asyncHandler(async (_req: Request, res: Response) => {
  const coupons = await couponService.listCoupons();
  res.json({ coupons });
});

export const get = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const coupon = await couponService.getCoupon(id);
  res.json({ coupon });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const coupon = await couponService.createCoupon(req.body);
  res.status(201).json({ coupon });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const coupon = await couponService.updateCoupon(id, req.body);
  res.json({ coupon });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  await couponService.deleteCoupon(id);
  res.status(204).send();
});

export const validate = asyncHandler(async (req: Request, res: Response) => {
  const { cartId, code } = req.body as { cartId: string; code: string };
  const result = await couponService.validateCouponForCart(cartId, code);
  res.json({ valid: true, coupon: result.coupon, subtotal: result.subtotal });
});

export const stats = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const data = await couponService.getCouponStats(id);
  res.json({ stats: data });
});
