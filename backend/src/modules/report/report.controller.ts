import type { Request, Response } from "express";
import { ApiError } from "../../utils/ApiError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  adminGetReportDetail,
  adminListReports,
  createReport,
  markReportUnderReview,
  rejectReport,
  resolveReportApproveContent,
  resolveReportRemoveContent,
  userHasReported,
} from "./report.service.js";

export const create = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, "UNAUTHORIZED", "Missing authentication");
  const { targetType, targetId, reason, optionalNote } = req.body as {
    targetType: "QUESTION" | "ANSWER" | "REVIEW";
    targetId: string;
    reason: "OFF_TOPIC" | "INAPPROPRIATE" | "FAKE" | "MISLEADING";
    optionalNote?: string;
  };
  const report = await createReport({
    targetType,
    targetId,
    userId: req.user.sub,
    reason,
    optionalNote,
  });
  res.status(201).json({ report });
});

export const myStatus = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, "UNAUTHORIZED", "Missing authentication");
  const { targetType, targetId } = req.query as {
    targetType: "QUESTION" | "ANSWER" | "REVIEW";
    targetId: string;
  };
  const reported = await userHasReported({
    userId: req.user.sub,
    targetType,
    targetId,
  });
  res.json({ reported });
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, targetType, status, startDate, endDate } = req.query as {
    page?: string;
    limit?: string;
    targetType?: "QUESTION" | "ANSWER" | "REVIEW";
    status?: "PENDING" | "UNDER_REVIEW" | "RESOLVED" | "REJECTED";
    startDate?: string;
    endDate?: string;
  };
  const result = await adminListReports({
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 20,
    targetType,
    status,
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
  });
  const reports = result.items.map((item) => ({
    reportId: item.id,
    targetType: item.targetType,
    targetId: item.targetId,
    reason: item.reason,
    status: item.status,
    createdAt: item.createdAt,
    reviewedAt: item.reviewedAt,
  }));
  res.json({
    reports,
    pagination: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: Math.max(1, Math.ceil(result.total / result.limit)),
    },
  });
});

export const detail = asyncHandler(async (req: Request, res: Response) => {
  const { reportId } = req.params as { reportId: string };
  const data = await adminGetReportDetail(reportId);
  res.json(data);
});

export const underReview = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, "UNAUTHORIZED", "Missing authentication");
  const { reportId } = req.params as { reportId: string };
  const { adminNote } = req.body as { adminNote?: string };
  const report = await markReportUnderReview({
    reportId,
    adminId: req.user.sub,
    adminNote,
  });
  res.json({ report });
});

export const resolveRemove = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, "UNAUTHORIZED", "Missing authentication");
  const { reportId } = req.params as { reportId: string };
  const { adminNote, hiddenReason } = req.body as { adminNote?: string; hiddenReason?: string };
  const report = await resolveReportRemoveContent({
    reportId,
    adminId: req.user.sub,
    adminNote,
    hiddenReason,
  });
  res.json({ report });
});

export const resolveApprove = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, "UNAUTHORIZED", "Missing authentication");
  const { reportId } = req.params as { reportId: string };
  const { adminNote } = req.body as { adminNote?: string };
  const report = await resolveReportApproveContent({
    reportId,
    adminId: req.user.sub,
    adminNote,
  });
  res.json({ report });
});

export const reject = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, "UNAUTHORIZED", "Missing authentication");
  const { reportId } = req.params as { reportId: string };
  const { adminNote } = req.body as { adminNote?: string };
  const report = await rejectReport({
    reportId,
    adminId: req.user.sub,
    adminNote,
  });
  res.json({ report });
});
