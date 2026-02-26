import { prisma } from "../../prisma/client.js";
import type { Notification, Prisma } from "@prisma/client";
import type {
  AdminNotificationListInput,
  NotificationEmailRecord,
  NotificationListItem,
} from "./notification.types.js";

export async function createNotification(data: Prisma.NotificationCreateInput): Promise<Notification> {
  return prisma.notification.create({ data });
}

export async function markAsRead(notificationId: string): Promise<Notification | null> {
  const updated = await prisma.notification.updateMany({
    where: { id: notificationId, recipientRole: "ADMIN", isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
  if (updated.count === 0) return null;
  return prisma.notification.findUnique({ where: { id: notificationId } });
}

export async function listAdminNotifications(input: AdminNotificationListInput) {
  const page = Math.max(1, input.page);
  const limit = Math.min(100, Math.max(1, input.limit));
  const skip = (page - 1) * limit;

  const where: Prisma.NotificationWhereInput = {
    recipientRole: "ADMIN",
    ...(input.unreadOnly ? { isRead: false } : {}),
  };

  const [items, total] = await prisma.$transaction([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        email: true,
        emailStatus: true,
        emailError: true,
        isRead: true,
        createdAt: true,
      },
    }),
    prisma.notification.count({ where }),
  ]);

  return { items: items as NotificationListItem[], total, page, limit };
}

export async function getAdminNotificationStats() {
  const [total, unread, unreadQuestions, pendingEmails, failedEmails] = await prisma.$transaction([
    prisma.notification.count({ where: { recipientRole: "ADMIN" } }),
    prisma.notification.count({ where: { recipientRole: "ADMIN", isRead: false } }),
    prisma.notification.count({
      where: { recipientRole: "ADMIN", isRead: false, type: "QUESTION_CREATED" },
    }),
    prisma.notification.count({
      where: { recipientRole: "ADMIN", emailStatus: "PENDING", email: { not: null } },
    }),
    prisma.notification.count({
      where: { recipientRole: "ADMIN", emailStatus: "FAILED", email: { not: null } },
    }),
  ]);

  return { total, unread, unreadQuestions, pendingEmails, failedEmails };
}

export async function getPendingEmailNotifications(limit: number): Promise<NotificationEmailRecord[]> {
  const rows = await prisma.notification.findMany({
    where: {
      emailStatus: "PENDING",
      email: { not: null },
    },
    orderBy: { createdAt: "asc" },
    take: limit,
    select: {
      id: true,
      title: true,
      message: true,
      email: true,
      recipientRole: true,
    },
  });

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    message: r.message,
    email: r.email as string,
    recipientRole: r.recipientRole,
  }));
}

export async function markEmailSent(notificationId: string) {
  await prisma.notification.update({
    where: { id: notificationId },
    data: {
      emailStatus: "SENT",
      emailSentAt: new Date(),
      emailFailedAt: null,
      emailError: null,
    },
  });
}

export async function markEmailFailed(notificationId: string, errorMessage: string) {
  await prisma.notification.update({
    where: { id: notificationId },
    data: {
      emailStatus: "FAILED",
      emailFailedAt: new Date(),
      emailError: errorMessage.slice(0, 1000),
    },
  });
}

export async function retryFailedEmail(notificationId: string): Promise<Notification | null> {
  const updated = await prisma.notification.updateMany({
    where: {
      id: notificationId,
      recipientRole: "ADMIN",
      email: { not: null },
      emailStatus: "FAILED",
    },
    data: {
      emailStatus: "PENDING",
      emailError: null,
      emailFailedAt: null,
      emailSentAt: null,
    },
  });

  if (updated.count === 0) return null;
  return prisma.notification.findUnique({ where: { id: notificationId } });
}
