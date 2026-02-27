import type { ReportReason, ReportResolution, ReportStatus, ReportTargetType } from "@prisma/client";

export type CreateReportInput = {
  targetType: ReportTargetType;
  targetId: string;
  userId: string;
  reason: ReportReason;
  optionalNote?: string;
};

export type AdminListReportsInput = {
  targetType?: ReportTargetType;
  status?: ReportStatus;
  startDate?: Date;
  endDate?: Date;
  page: number;
  limit: number;
};

export type AdminResolveReportInput = {
  reportId: string;
  adminId: string;
  adminNote?: string;
  hiddenReason?: string;
};

export type AdminSetReportStatusInput = {
  reportId: string;
  adminId: string;
  adminNote?: string;
  resolution?: ReportResolution;
};
