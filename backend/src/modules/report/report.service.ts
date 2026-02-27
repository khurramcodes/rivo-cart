import { Prisma } from "@prisma/client";
import { prisma } from "../../prisma/client.js";
import { ApiError } from "../../utils/ApiError.js";
import { emitEvent } from "../event/event-bus.js";
import {
  countReportsByTarget,
  createReportRecord,
  hasUserReportedTarget,
  listReports,
} from "./report.repository.js";
import type {
  AdminListReportsInput,
  AdminResolveReportInput,
  AdminSetReportStatusInput,
  CreateReportInput,
} from "./report.types.js";

async function ensureTargetExists(targetType: "QUESTION" | "ANSWER" | "REVIEW", targetId: string) {
  if (targetType === "QUESTION") {
    const q = await prisma.question.findUnique({ where: { id: targetId }, select: { id: true } });
    if (!q) throw new ApiError(404, "QUESTION_NOT_FOUND", "Question not found");
    return;
  }
  if (targetType === "ANSWER") {
    const a = await prisma.answer.findUnique({ where: { id: targetId }, select: { id: true } });
    if (!a) throw new ApiError(404, "ANSWER_NOT_FOUND", "Answer not found");
    return;
  }
  const r = await prisma.review.findUnique({ where: { id: targetId }, select: { id: true } });
  if (!r) throw new ApiError(404, "REVIEW_NOT_FOUND", "Review not found");
}

async function syncTargetReportCount(targetType: "QUESTION" | "ANSWER" | "REVIEW", targetId: string) {
  const count = await countReportsByTarget(targetType, targetId);
  if (targetType === "QUESTION") {
    await prisma.question.update({ where: { id: targetId }, data: { reportCount: count } });
    return;
  }
  if (targetType === "ANSWER") {
    await prisma.answer.update({ where: { id: targetId }, data: { reportCount: count } });
    return;
  }
  await prisma.review.update({ where: { id: targetId }, data: { reportCount: count } });
}

async function assertCanModerate(reportId: string) {
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    select: { id: true, status: true, targetId: true, targetType: true, reason: true },
  });
  if (!report) throw new ApiError(404, "REPORT_NOT_FOUND", "Report not found");
  if (report.status === "RESOLVED" || report.status === "REJECTED") {
    throw new ApiError(409, "REPORT_ALREADY_FINALIZED", "Report is already finalized");
  }
  return report;
}

export async function createReport(input: CreateReportInput) {
  await ensureTargetExists(input.targetType, input.targetId);
  try {
    const report = await createReportRecord({
      targetType: input.targetType,
      targetId: input.targetId,
      reason: input.reason,
      optionalNote: input.optionalNote?.trim() || undefined,
      user: { connect: { id: input.userId } },
    });
    await syncTargetReportCount(input.targetType, input.targetId);
    await emitEvent("REPORT_CREATED", {
      reportId: report.id,
      targetType: input.targetType,
      targetId: input.targetId,
      reason: input.reason,
      reporterId: input.userId,
    });
    return report;
  } catch (err: unknown) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new ApiError(409, "ALREADY_REPORTED", "You have already reported this content");
    }
    throw err;
  }
}

export async function userHasReported(input: {
  userId: string;
  targetType: "QUESTION" | "ANSWER" | "REVIEW";
  targetId: string;
}) {
  return hasUserReportedTarget(input);
}

export async function adminListReports(input: AdminListReportsInput) {
  return listReports(input);
}

export async function adminGetReportDetail(reportId: string) {
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });
  if (!report) throw new ApiError(404, "REPORT_NOT_FOUND", "Report not found");

  let content: unknown = null;
  if (report.targetType === "QUESTION") {
    content = await prisma.question.findUnique({
      where: { id: report.targetId },
      include: {
        product: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });
  } else if (report.targetType === "ANSWER") {
    content = await prisma.answer.findUnique({
      where: { id: report.targetId },
      include: {
        question: { select: { id: true, question: true, productId: true } },
        admin: { select: { id: true, name: true, email: true } },
      },
    });
  } else {
    content = await prisma.review.findUnique({
      where: { id: report.targetId },
      include: {
        product: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  return {
    report,
    reporter: report.user,
    content,
  };
}

export async function markReportUnderReview(input: AdminSetReportStatusInput) {
  const report = await assertCanModerate(input.reportId);
  if (report.status === "UNDER_REVIEW") return prisma.report.findUnique({ where: { id: input.reportId } });
  await prisma.report.update({
    where: { id: input.reportId },
    data: {
      status: "UNDER_REVIEW",
      reviewedBy: input.adminId,
      reviewedAt: new Date(),
      adminNote: input.adminNote?.trim() || undefined,
    },
  });
  return prisma.report.findUnique({ where: { id: input.reportId } });
}

export async function resolveReportRemoveContent(input: AdminResolveReportInput) {
  const report = await assertCanModerate(input.reportId);
  const now = new Date();
  await prisma.$transaction(async (tx) => {
    if (report.targetType === "QUESTION") {
      await tx.question.update({
        where: { id: report.targetId },
        data: {
          isHidden: true,
          hiddenAt: now,
          hiddenReason: input.hiddenReason?.trim() || `Removed due to report: ${report.reason}`,
          status: "HIDDEN",
        },
      });
    } else if (report.targetType === "ANSWER") {
      await tx.answer.update({
        where: { id: report.targetId },
        data: {
          isHidden: true,
          hiddenAt: now,
          hiddenReason: input.hiddenReason?.trim() || `Removed due to report: ${report.reason}`,
          status: "HIDDEN",
        },
      });
    } else {
      const reviewBefore = await tx.review.findUnique({
        where: { id: report.targetId },
        select: { id: true, productId: true, status: true },
      });
      if (!reviewBefore) throw new ApiError(404, "REVIEW_NOT_FOUND", "Review not found");
      await tx.review.update({
        where: { id: report.targetId },
        data: {
          isHidden: true,
          hiddenAt: now,
          hiddenReason: input.hiddenReason?.trim() || `Removed due to report: ${report.reason}`,
        },
      });
      if (reviewBefore.status === "APPROVED") {
        const agg = await tx.review.aggregate({
          where: { productId: reviewBefore.productId, status: "APPROVED", isHidden: false },
          _avg: { rating: true },
          _count: { _all: true },
        });
        const ratingCount = agg._count._all;
        await tx.product.update({
          where: { id: reviewBefore.productId },
          data: {
            ratingAverage: ratingCount > 0 ? Number(agg._avg.rating ?? 0) : 0,
            ratingCount,
            reviewCount: ratingCount,
          },
        });
      }
    }

    await tx.report.update({
      where: { id: input.reportId },
      data: {
        status: "RESOLVED",
        resolution: "CONTENT_REMOVED",
        reviewedBy: input.adminId,
        reviewedAt: now,
        adminNote: input.adminNote?.trim() || undefined,
      },
    });
  });
  return prisma.report.findUnique({ where: { id: input.reportId } });
}

export async function resolveReportApproveContent(input: AdminSetReportStatusInput) {
  await assertCanModerate(input.reportId);
  await prisma.report.update({
    where: { id: input.reportId },
    data: {
      status: "RESOLVED",
      resolution: "CONTENT_APPROVED",
      reviewedBy: input.adminId,
      reviewedAt: new Date(),
      adminNote: input.adminNote?.trim() || undefined,
    },
  });
  return prisma.report.findUnique({ where: { id: input.reportId } });
}

export async function rejectReport(input: AdminSetReportStatusInput) {
  await assertCanModerate(input.reportId);
  await prisma.report.update({
    where: { id: input.reportId },
    data: {
      status: "REJECTED",
      reviewedBy: input.adminId,
      reviewedAt: new Date(),
      adminNote: input.adminNote?.trim() || undefined,
    },
  });
  return prisma.report.findUnique({ where: { id: input.reportId } });
}
