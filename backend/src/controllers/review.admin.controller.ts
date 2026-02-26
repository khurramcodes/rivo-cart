import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import * as reviewService from "../services/review.service.js";

export const list = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, "UNAUTHORIZED", "Missing authentication");
  const { status, page, limit } = req.query as { status?: string; page?: string; limit?: string };

  const result = await reviewService.adminListReviews({
    status: (status as "PENDING" | "APPROVED" | "REJECTED") ?? undefined,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
  });

  res.json(result);
});

export const approve = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, "UNAUTHORIZED", "Missing authentication");
  const { id } = req.params as { id: string };
  await reviewService.adminApproveReview({ reviewId: id, approvedBy: req.user.sub });
  res.status(204).send();
});

export const reject = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, "UNAUTHORIZED", "Missing authentication");
  const { id } = req.params as { id: string };
  await reviewService.adminRejectReview({ reviewId: id, approvedBy: req.user.sub });
  res.status(204).send();
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, "UNAUTHORIZED", "Missing authentication");
  const { id } = req.params as { id: string };
  await reviewService.adminRemoveReview({ reviewId: id, approvedBy: req.user.sub });
  res.status(204).send();
});

export const createReply = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, "UNAUTHORIZED", "Missing authentication");
  const { id } = req.params as { id: string };
  const { message } = req.body as { message: string };
  const reply = await reviewService.createReply({ reviewId: id, adminId: req.user.sub, message });
  res.status(201).json({ reply });
});

export const updateReply = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, "UNAUTHORIZED", "Missing authentication");
  const { id } = req.params as { id: string };
  const { message } = req.body as { message: string };
  const reply = await reviewService.updateReply({ reviewId: id, adminId: req.user.sub, message });
  res.json({ reply });
});

export const deleteReply = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, "UNAUTHORIZED", "Missing authentication");
  const { id } = req.params as { id: string };
  await reviewService.deleteReply({ reviewId: id, adminId: req.user.sub });
  res.status(204).send();
});

