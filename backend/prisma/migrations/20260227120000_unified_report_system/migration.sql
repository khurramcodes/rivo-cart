-- Add REPORT_CREATED to NotificationType enum (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'NotificationType' AND e.enumlabel = 'REPORT_CREATED'
  ) THEN
    ALTER TYPE "NotificationType" ADD VALUE 'REPORT_CREATED';
  END IF;
END $$;

-- Create enums for unified Report model
CREATE TYPE "ReportTargetType" AS ENUM ('QUESTION', 'ANSWER', 'REVIEW');
CREATE TYPE "ReportReason" AS ENUM ('OFF_TOPIC', 'INAPPROPRIATE', 'FAKE', 'MISLEADING');
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED');
CREATE TYPE "ReportResolution" AS ENUM ('CONTENT_REMOVED', 'CONTENT_APPROVED', 'USER_WARNED', 'USER_BANNED', 'NO_ACTION');

-- Add moderation fields to content tables
ALTER TABLE "Question"
  ADD COLUMN "isHidden" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "hiddenAt" TIMESTAMP(3),
  ADD COLUMN "hiddenReason" TEXT;

ALTER TABLE "Answer"
  ADD COLUMN "isHidden" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "hiddenAt" TIMESTAMP(3),
  ADD COLUMN "hiddenReason" TEXT;

ALTER TABLE "Review"
  ADD COLUMN "isHidden" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "hiddenAt" TIMESTAMP(3),
  ADD COLUMN "hiddenReason" TEXT;

-- Create unified Report table
CREATE TABLE "Report" (
  "id" TEXT NOT NULL,
  "targetType" "ReportTargetType" NOT NULL,
  "targetId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "reason" "ReportReason" NOT NULL,
  "optionalNote" TEXT,
  "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
  "resolution" "ReportResolution",
  "adminNote" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "reviewedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Report"
  ADD CONSTRAINT "Report_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "Report_targetType_targetId_userId_key" ON "Report"("targetType", "targetId", "userId");
CREATE INDEX "Report_targetType_targetId_idx" ON "Report"("targetType", "targetId");
CREATE INDEX "Report_status_idx" ON "Report"("status");

-- Migrate existing report data to unified Report table.
-- Existing reason values are normalized into the new enum.
INSERT INTO "Report" ("id", "targetType", "targetId", "userId", "reason", "createdAt", "updatedAt")
SELECT
  rr."id",
  'REVIEW'::"ReportTargetType",
  rr."reviewId",
  rr."userId",
  CASE
    WHEN UPPER(TRIM(rr."reason")) IN ('OFF_TOPIC', 'INAPPROPRIATE', 'FAKE', 'MISLEADING') THEN UPPER(TRIM(rr."reason"))::"ReportReason"
    ELSE 'MISLEADING'::"ReportReason"
  END,
  rr."createdAt",
  rr."createdAt"
FROM "ReviewReport" rr
ON CONFLICT ("targetType", "targetId", "userId") DO NOTHING;

INSERT INTO "Report" ("id", "targetType", "targetId", "userId", "reason", "createdAt", "updatedAt")
SELECT
  qr."id",
  'QUESTION'::"ReportTargetType",
  qr."questionId",
  qr."userId",
  CASE
    WHEN UPPER(TRIM(qr."reason")) IN ('OFF_TOPIC', 'INAPPROPRIATE', 'FAKE', 'MISLEADING') THEN UPPER(TRIM(qr."reason"))::"ReportReason"
    ELSE 'MISLEADING'::"ReportReason"
  END,
  qr."createdAt",
  qr."createdAt"
FROM "QuestionReport" qr
ON CONFLICT ("targetType", "targetId", "userId") DO NOTHING;

INSERT INTO "Report" ("id", "targetType", "targetId", "userId", "reason", "createdAt", "updatedAt")
SELECT
  ar."id",
  'ANSWER'::"ReportTargetType",
  ar."answerId",
  ar."userId",
  CASE
    WHEN UPPER(TRIM(ar."reason")) IN ('OFF_TOPIC', 'INAPPROPRIATE', 'FAKE', 'MISLEADING') THEN UPPER(TRIM(ar."reason"))::"ReportReason"
    ELSE 'MISLEADING'::"ReportReason"
  END,
  ar."createdAt",
  ar."createdAt"
FROM "AnswerReport" ar
ON CONFLICT ("targetType", "targetId", "userId") DO NOTHING;

-- Recompute denormalized report counts from the unified table
UPDATE "Review" r
SET "reportCount" = COALESCE((
  SELECT COUNT(*)::int
  FROM "Report" rep
  WHERE rep."targetType" = 'REVIEW' AND rep."targetId" = r."id"
), 0);

UPDATE "Question" q
SET "reportCount" = COALESCE((
  SELECT COUNT(*)::int
  FROM "Report" rep
  WHERE rep."targetType" = 'QUESTION' AND rep."targetId" = q."id"
), 0);

UPDATE "Answer" a
SET "reportCount" = COALESCE((
  SELECT COUNT(*)::int
  FROM "Report" rep
  WHERE rep."targetType" = 'ANSWER' AND rep."targetId" = a."id"
), 0);

-- Remove old per-entity report tables
DROP TABLE "ReviewReport";
DROP TABLE "QuestionReport";
DROP TABLE "AnswerReport";
