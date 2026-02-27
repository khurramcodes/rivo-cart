import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import * as reviewService from "../services/review.service.js";

export const create = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, "UNAUTHORIZED", "Missing authentication");
  const { productId, rating, comment } = req.body as {
    productId: string;
    rating: number;
    comment: string;
  };

  const review = await reviewService.createReview({
    userId: req.user.sub,
    productId,
    rating,
    comment,
  });

  res.status(201).json({ review });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, "UNAUTHORIZED", "Missing authentication");
  const { id } = req.params as { id: string };
  const { rating, comment } = req.body as { rating: number; comment: string };

  const review = await reviewService.updateReview({
    userId: req.user.sub,
    reviewId: id,
    rating,
    comment,
  });

  res.json({ review });
});

export const mine = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, "UNAUTHORIZED", "Missing authentication");
  const { productId } = req.query as { productId: string };
  const review = await reviewService.getMyReviewForProduct({
    userId: req.user.sub,
    productId,
  });
  res.json({ review });
});

export const markHelpful = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, "UNAUTHORIZED", "Missing authentication");
  const { id } = req.params as { id: string };
  const { isHelpful } = req.body as { isHelpful: boolean };
  await reviewService.markReviewHelpful({ reviewId: id, userId: req.user.sub, isHelpful });
  res.status(204).send();
});

export const myHelpful = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, "UNAUTHORIZED", "Missing authentication");
  const { id } = req.params as { id: string };
  const isHelpful = await reviewService.getMyReviewHelpful({ userId: req.user.sub, reviewId: id });
  res.json({ isHelpful });
});

export const myReported = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, "UNAUTHORIZED", "Missing authentication");
  const { id } = req.params as { id: string };
  const reported = await reviewService.getMyReviewReported({ userId: req.user.sub, reviewId: id });
  res.json({ reported });
});

