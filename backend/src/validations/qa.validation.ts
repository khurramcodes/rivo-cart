import { z } from "zod";

export const listQuestionsSchema = z.object({
  params: z.object({ productId: z.string().min(1) }),
  query: z
    .object({
      page: z.string().optional(),
      limit: z.string().optional(),
    })
    .optional(),
});

export const createQuestionSchema = z.object({
  params: z.object({ productId: z.string().min(1) }),
  body: z.object({ question: z.string().trim().min(1).max(2000) }),
});

export const questionIdParamSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});

export const reportQuestionSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({ reason: z.string().trim().min(1).max(500) }),
});

export const answerIdParamSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
});

export const setAnswerHelpfulSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({ helpful: z.boolean() }),
});

export const reportAnswerSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({ reason: z.string().trim().min(1).max(500) }),
});

export const adminListQuestionsSchema = z.object({
  query: z
    .object({
      productId: z.string().min(1).optional(),
      status: z.enum(["VISIBLE", "HIDDEN", "REMOVED"]).optional(),
      page: z.string().optional(),
      limit: z.string().optional(),
    })
    .optional(),
});

export const adminCreateAnswerSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({ answer: z.string().trim().min(1).max(5000) }),
});

export const adminUpdateAnswerSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({ answer: z.string().trim().min(1).max(5000) }),
});
