import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as wishlistService from "./wishlist.service.js";

export const toggle = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.sub as string;
  const { productId } = req.body as { productId?: string };
  if (!productId || typeof productId !== "string") {
    res.status(400).json({ error: { message: "productId is required" } });
    return;
  }
  const result = await wishlistService.toggleWishlist(userId, productId.trim());
  res.json(result);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.sub as string;
  const items = await wishlistService.listWishlist(userId);
  res.json({ items });
});

export const getIds = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.sub as string;
  const productIds = await wishlistService.getWishlistProductIds(userId);
  res.json({ productIds });
});
