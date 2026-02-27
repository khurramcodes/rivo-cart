import type { Prisma, Report } from "@prisma/client";
import { prisma } from "../../prisma/client.js";
import type { AdminListReportsInput } from "./report.types.js";

export async function createReportRecord(data: Prisma.ReportCreateInput): Promise<Report> {
  return prisma.report.create({ data });
}

export async function countReportsByTarget(targetType: "QUESTION" | "ANSWER" | "REVIEW", targetId: string) {
  return prisma.report.count({ where: { targetType, targetId } });
}

export async function hasUserReportedTarget(input: {
  targetType: "QUESTION" | "ANSWER" | "REVIEW";
  targetId: string;
  userId: string;
}) {
  const row = await prisma.report.findUnique({
    where: {
      targetType_targetId_userId: {
        targetType: input.targetType,
        targetId: input.targetId,
        userId: input.userId,
      },
    },
    select: { id: true },
  });
  return Boolean(row);
}

export async function listReports(input: AdminListReportsInput) {
  const page = Math.max(1, input.page);
  const limit = Math.min(100, Math.max(1, input.limit));
  const skip = (page - 1) * limit;
  const where: Prisma.ReportWhereInput = {
    ...(input.targetType ? { targetType: input.targetType } : {}),
    ...(input.status ? { status: input.status } : {}),
    ...(input.startDate || input.endDate
      ? {
          createdAt: {
            ...(input.startDate ? { gte: input.startDate } : {}),
            ...(input.endDate ? { lte: input.endDate } : {}),
          },
        }
      : {}),
  };

  const [items, total] = await prisma.$transaction([
    prisma.report.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        targetType: true,
        targetId: true,
        reason: true,
        status: true,
        createdAt: true,
        reviewedAt: true,
      },
    }),
    prisma.report.count({ where }),
  ]);

  return { items, total, page, limit };
}
