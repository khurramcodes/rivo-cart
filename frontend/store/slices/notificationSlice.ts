import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AdminNotificationStats } from "@/types";

type NotificationState = AdminNotificationStats;

const initialState: NotificationState = {
  total: 0,
  unread: 0,
  unreadQuestions: 0,
  pendingEmails: 0,
  failedEmails: 0,
};

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    setNotificationStats: (_state, action: PayloadAction<AdminNotificationStats>) => action.payload,
  },
});

export const { setNotificationStats } = notificationSlice.actions;
export default notificationSlice.reducer;
