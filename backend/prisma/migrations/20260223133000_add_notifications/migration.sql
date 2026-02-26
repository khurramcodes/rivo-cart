-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM (
  'QUESTION_CREATED',
  'ANSWER_CREATED',
  'REVIEW_CREATED',
  'REVIEW_APPROVED',
  'REVIEW_REJECTED',
  'ANSWER_REPORTED',
  'QUESTION_REPORTED'
);

-- CreateEnum
CREATE TYPE "NotificationRecipientRole" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "Notification" (
  "id" TEXT NOT NULL,
  "type" "NotificationType" NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "recipientId" TEXT,
  "recipientRole" "NotificationRecipientRole" NOT NULL,
  "email" TEXT,
  "emailStatus" "EmailStatus" NOT NULL DEFAULT 'PENDING',
  "emailSentAt" TIMESTAMP(3),
  "emailFailedAt" TIMESTAMP(3),
  "emailError" TEXT,
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "readAt" TIMESTAMP(3),
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_recipientRole_isRead_idx" ON "Notification"("recipientRole", "isRead");

-- CreateIndex
CREATE INDEX "Notification_emailStatus_idx" ON "Notification"("emailStatus");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");
