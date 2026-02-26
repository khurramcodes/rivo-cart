import { ApiError } from "../../utils/ApiError.js";
import { prisma } from "../../prisma/client.js";
import {
  createNotification,
  getAdminNotificationStats,
  listAdminNotifications,
  markAsRead as markAsReadRepo,
  retryFailedEmail,
} from "./notification.repository.js";
import type {
  AdminNotificationListInput,
  AdminNotificationStats,
  CreateAdminNotificationInput,
  CreateUserNotificationInput,
} from "./notification.types.js";
import { registerHandler } from "../event/event-bus.js";

function parseAdminNotificationEmails() {
  return (process.env.ADMIN_NOTIFICATION_EMAILS ?? process.env.ADMIN_NOTIFICATION_EMAIL ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

async function resolveAdminRecipients(explicitEmail?: string) {
  if (explicitEmail?.trim()) {
    return [{ recipientId: null as string | null, email: explicitEmail.trim() }];
  }

  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true, email: true },
  });

  const dbRecipients = admins
    .map((a) => ({ recipientId: a.id, email: a.email?.trim() ?? "" }))
    .filter((a) => a.email.length > 0);

  if (dbRecipients.length > 0) return dbRecipients;

  const fallback = parseAdminNotificationEmails();
  if (fallback.length === 0) return [{ recipientId: null as string | null, email: "" }];

  return fallback.map((email) => ({ recipientId: null as string | null, email }));
}

export async function createAdminNotification(input: CreateAdminNotificationInput) {
  const recipients = await resolveAdminRecipients(input.email);
  const created = [];
  for (const recipient of recipients) {
    const email = recipient.email || null;
    const notification = await createNotification({
      type: input.type,
      title: input.title,
      message: input.message,
      recipientId: recipient.recipientId ?? undefined,
      recipientRole: "ADMIN",
      email: email ?? undefined,
      emailStatus: email ? "PENDING" : "SENT",
      metadata: input.metadata,
    });
    created.push(notification);
  }
  return created;
}

export async function createUserNotification(input: CreateUserNotificationInput) {
  const email = input.email?.trim() || null;
  return createNotification({
    type: input.type,
    title: input.title,
    message: input.message,
    recipientId: input.recipientId,
    recipientRole: "USER",
    email: email ?? undefined,
    emailStatus: email ? "PENDING" : "SENT",
    metadata: input.metadata,
  });
}

export async function markAsRead(notificationId: string) {
  const updated = await markAsReadRepo(notificationId);
  if (!updated) throw new ApiError(404, "NOTIFICATION_NOT_FOUND", "Notification not found");
  return updated;
}

export async function getAdminNotifications(input: AdminNotificationListInput) {
  return listAdminNotifications(input);
}

export async function getNotificationStats(): Promise<AdminNotificationStats> {
  return getAdminNotificationStats();
}

export async function retryNotificationEmail(notificationId: string) {
  const updated = await retryFailedEmail(notificationId);
  if (!updated) {
    throw new ApiError(
      404,
      "NOTIFICATION_RETRY_NOT_ALLOWED",
      "Notification is not eligible for email retry",
    );
  }
  return updated;
}

export function registerNotificationEventHandlers() {
  registerHandler("QUESTION_CREATED", async (payload) => {
    await createAdminNotification({
      type: "QUESTION_CREATED",
      title: "New question submitted",
      message: `${payload.userName} asked: ${payload.questionText}`,
      metadata: {
        questionId: payload.questionId,
        userId: payload.userId,
        userName: payload.userName,
        productId: payload.productId,
        questionText: payload.questionText,
      },
    });
  });

  registerHandler("ANSWER_CREATED", async (payload) => {
    await createUserNotification({
      type: "ANSWER_CREATED",
      title: "Admin replied to your question",
      message: `Admin replied: ${payload.answerText}`,
      recipientId: payload.questionOwnerUserId,
      email: payload.questionOwnerEmail,
      metadata: {
        answerId: payload.answerId,
        questionId: payload.questionId,
        questionText: payload.questionText,
      },
    });
  });

  registerHandler("REVIEW_CREATED", async (payload) => {
    await createAdminNotification({
      type: "REVIEW_CREATED",
      title: "New review submitted",
      message: `User ${payload.userId} submitted a review (${payload.rating}/5).`,
      metadata: payload,
    });
  });

  registerHandler("REVIEW_APPROVED", async (payload) => {
    await createAdminNotification({
      type: "REVIEW_APPROVED",
      title: "Review approved",
      message: `Review ${payload.reviewId} was approved.`,
      metadata: payload,
    });
  });

  registerHandler("REVIEW_REJECTED", async (payload) => {
    await createAdminNotification({
      type: "REVIEW_REJECTED",
      title: "Review rejected",
      message: `Review ${payload.reviewId} was rejected.`,
      metadata: payload,
    });
  });

  registerHandler("ANSWER_REPORTED", async (payload) => {
    await createAdminNotification({
      type: "ANSWER_REPORTED",
      title: "Answer reported",
      message: `An answer was reported by user ${payload.userId}.`,
      metadata: payload,
    });
  });

  registerHandler("QUESTION_REPORTED", async (payload) => {
    await createAdminNotification({
      type: "QUESTION_REPORTED",
      title: "Question reported",
      message: `A question was reported by user ${payload.userId}.`,
      metadata: payload,
    });
  });
}
