import { z } from "zod";

export const adminListNotificationsSchema = z.object({
  query: z
    .object({
      page: z.string().optional(),
      limit: z.string().optional(),
      unreadOnly: z.enum(["true", "false"]).optional(),
    })
    .optional(),
});

export const notificationIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});
