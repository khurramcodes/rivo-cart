import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import * as qaService from "../services/qa.service.js";

export const listQuestions = asyncHandler(async (req: Request, res: Response) => {
  const { productId } = req.params as { productId: string };
  const { page, limit } = req.query as { page?: string; limit?: string };
  const result = await qaService.listVisibleQuestions({
    productId,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
  });
  res.json(result);
});

export const createQuestion = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, "UNAUTHORIZED", "Missing authentication");
  const { productId } = req.params as { productId: string };
  const { question } = req.body as { question: string };
  const q = await qaService.createQuestion({
    userId: req.user.sub,
    productId,
    question,
  });
  res.status(201).json({ question: q });
});

export const reportQuestion = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, "UNAUTHORIZED", "Missing authentication");
  const { id } = req.params as { id: string };
  const { reason } = req.body as { reason: string };
  await qaService.reportQuestion({ questionId: id, userId: req.user.sub, reason });
  res.status(204).send();
});

export const markAnswerHelpful = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, "UNAUTHORIZED", "Missing authentication");
  const { id } = req.params as { id: string };
  await qaService.markAnswerHelpful({ answerId: id, userId: req.user.sub });
  res.status(204).send();
});

export const reportAnswer = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, "UNAUTHORIZED", "Missing authentication");
  const { id } = req.params as { id: string };
  const { reason } = req.body as { reason: string };
  await qaService.reportAnswer({ answerId: id, userId: req.user.sub, reason });
  res.status(204).send();
});

export const myAnswerHelpful = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, "UNAUTHORIZED", "Missing authentication");
  const { id } = req.params as { id: string };
  const helpful = await qaService.userHasMarkedAnswerHelpful({
    userId: req.user.sub,
    answerId: id,
  });
  res.json({ helpful });
});
