import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as reviewService from "../services/review.service.js";

export const listApprovedForProduct = asyncHandler(async (req: Request, res: Response) => {
  const { productId } = req.params as { productId: string };
  const { page, limit, sort } = req.query as { page?: string; limit?: string; sort?: string };

  const result = await reviewService.listApprovedReviewsForProduct({
    productId,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    sort: (sort as any) ?? undefined,
  });

  res.json(result);
});

export const topApprovedForProduct = asyncHandler(async (req: Request, res: Response) => {
  const { productId } = req.params as { productId: string };
  const items = await reviewService.listTopApprovedReviews({ productId });
  res.json({ items });
});

