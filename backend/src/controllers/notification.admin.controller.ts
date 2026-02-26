import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  getAdminNotifications,
  getNotificationStats,
  markAsRead,
  retryNotificationEmail,
} from "../modules/notification/notification.service.js";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, unreadOnly } = req.query as {
    page?: string;
    limit?: string;
    unreadOnly?: string;
  };

  const result = await getAdminNotifications({
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 20,
    unreadOnly: unreadOnly === "true",
  });

  res.json({
    notifications: result.items,
    pagination: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: Math.max(1, Math.ceil(result.total / result.limit)),
    },
  });
});

export const stats = asyncHandler(async (_req: Request, res: Response) => {
  const data = await getNotificationStats();
  res.json(data);
});

export const read = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const notification = await markAsRead(id);
  res.json({ notification });
});

export const retryEmail = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const notification = await retryNotificationEmail(id);
  res.json({ notification });
});
