import { z } from "zod";

const reportIdParam = z.object({
  reportId: z.string().min(1),
});

export const createReportSchema = z.object({
  body: z.object({
    targetType: z.enum(["QUESTION", "ANSWER", "REVIEW"]),
    targetId: z.string().min(1),
    reason: z.enum(["OFF_TOPIC", "INAPPROPRIATE", "FAKE", "MISLEADING"]),
    optionalNote: z.string().trim().max(2000).optional(),
  }),
});

export const myReportStatusSchema = z.object({
  query: z.object({
    targetType: z.enum(["QUESTION", "ANSWER", "REVIEW"]),
    targetId: z.string().min(1),
  }),
});

export const adminListReportsSchema = z.object({
  query: z
    .object({
      page: z.string().optional(),
      limit: z.string().optional(),
      targetType: z.enum(["QUESTION", "ANSWER", "REVIEW"]).optional(),
      status: z.enum(["PENDING", "UNDER_REVIEW", "RESOLVED", "REJECTED"]).optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    })
    .optional(),
});

export const reportIdParamSchema = z.object({
  params: reportIdParam,
});

export const adminReportActionSchema = z.object({
  params: reportIdParam,
  body: z
    .object({
      adminNote: z.string().trim().max(2000).optional(),
      hiddenReason: z.string().trim().max(500).optional(),
    })
    .optional(),
});
