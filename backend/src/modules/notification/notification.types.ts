import type {
  EmailStatus,
  NotificationRecipientRole,
  NotificationType,
  Prisma,
} from "@prisma/client";

export type CreateAdminNotificationInput = {
  type: NotificationType;
  title: string;
  message: string;
  email?: string;
  metadata?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
};

export type AdminNotificationListInput = {
  page: number;
  limit: number;
  unreadOnly?: boolean;
};

export type AdminNotificationStats = {
  total: number;
  unread: number;
  unreadQuestions: number;
  pendingEmails: number;
  failedEmails: number;
};

export type NotificationListItem = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  email: string | null;
  emailStatus: EmailStatus;
  emailError: string | null;
  isRead: boolean;
  createdAt: Date;
};

export type NotificationEmailRecord = {
  id: string;
  title: string;
  message: string;
  email: string;
  recipientRole: NotificationRecipientRole;
};

export type CreateUserNotificationInput = {
  type: NotificationType;
  title: string;
  message: string;
  recipientId: string;
  email?: string;
  metadata?: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput;
};
