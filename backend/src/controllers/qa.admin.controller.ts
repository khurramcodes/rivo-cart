import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import * as qaService from "../services/qa.service.js";

export const listQuestions = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, "UNAUTHORIZED", "Missing authentication");
  const { productId, status, page, limit } = req.query as {
    productId?: string;
    status?: string;
    page?: string;
    limit?: string;
  };
  const result = await qaService.adminListQuestions({
    productId,
    status: status as "VISIBLE" | "HIDDEN" | undefined,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
  });
  res.json(result);
});

export const hideQuestion = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, "UNAUTHORIZED", "Missing authentication");
  const { id } = req.params as { id: string };
  await qaService.adminHideQuestion({ questionId: id });
  res.status(204).send();
});

export const removeQuestion = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, "UNAUTHORIZED", "Missing authentication");
  const { id } = req.params as { id: string };
  await qaService.adminRemoveQuestion({ questionId: id });
  res.status(204).send();
});

export const showQuestion = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, "UNAUTHORIZED", "Missing authentication");
  const { id } = req.params as { id: string };
  await qaService.adminShowQuestion({ questionId: id });
  res.status(204).send();
});

export const createAnswer = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, "UNAUTHORIZED", "Missing authentication");
  const { id: questionId } = req.params as { id: string };
  const { answer } = req.body as { answer: string };
  const a = await qaService.adminCreateAnswer({
    questionId,
    adminId: req.user.sub,
    answer,
  });
  res.status(201).json({ answer: a });
});

export const updateAnswer = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, "UNAUTHORIZED", "Missing authentication");
  const { id } = req.params as { id: string };
  const { answer } = req.body as { answer: string };
  const a = await qaService.adminUpdateAnswer({
    answerId: id,
    adminId: req.user.sub,
    answer,
  });
  res.json({ answer: a });
});

export const hideAnswer = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, "UNAUTHORIZED", "Missing authentication");
  const { id } = req.params as { id: string };
  await qaService.adminHideAnswer({ answerId: id, adminId: req.user.sub });
  res.status(204).send();
});

export const removeAnswer = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, "UNAUTHORIZED", "Missing authentication");
  const { id } = req.params as { id: string };
  await qaService.adminRemoveAnswer({ answerId: id, adminId: req.user.sub });
  res.status(204).send();
});

export const showAnswer = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, "UNAUTHORIZED", "Missing authentication");
  const { id } = req.params as { id: string };
  await qaService.adminShowAnswer({ answerId: id, adminId: req.user.sub });
  res.status(204).send();
});
