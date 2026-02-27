"use client";

import { useEffect, useMemo, useState } from "react";
import { adminApi } from "@/services/adminApi";
import type { AdminNotification, AdminNotificationStats } from "@/types";
import { Button } from "@/components/ui/Button";
import { useAppDispatch } from "@/store/hooks";
import { setNotificationStats } from "@/store/slices/notificationSlice";

const typeLabel: Record<AdminNotification["type"], string> = {
  QUESTION_CREATED: "Question Created",
  ANSWER_CREATED: "Answer Created",
  REVIEW_CREATED: "Review Created",
  REVIEW_APPROVED: "Review Approved",
  REVIEW_REJECTED: "Review Rejected",
  REPORT_CREATED: "Report Created",
  ANSWER_REPORTED: "Answer Reported",
  QUESTION_REPORTED: "Question Reported",
};

const emailStatusClass: Record<AdminNotification["emailStatus"], string> = {
  PENDING: "bg-amber-100 text-amber-800",
  SENT: "bg-emerald-100 text-emerald-800",
  FAILED: "bg-red-100 text-red-800",
};

export default function AdminNotificationsPage() {
  const dispatch = useAppDispatch();
  const [items, setItems] = useState<AdminNotification[]>([]);
  const [stats, setStats] = useState<AdminNotificationStats>({
    total: 0,
    unread: 0,
    unreadQuestions: 0,
    pendingEmails: 0,
    failedEmails: 0,
  });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [workingId, setWorkingId] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const [list, s] = await Promise.all([
        adminApi.listNotifications({ page, limit, unreadOnly }),
        adminApi.getNotificationStats(),
      ]);
      setItems(list.notifications);
      setTotalPages(list.pagination.totalPages);
      setStats(s);
      dispatch(setNotificationStats(s));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, [page, limit, unreadOnly]);

  async function markRead(id: string) {
    setWorkingId(id);
    try {
      await adminApi.markNotificationRead(id);
      await refresh();
    } finally {
      setWorkingId(null);
    }
  }

  async function retryEmail(id: string) {
    setWorkingId(id);
    try {
      await adminApi.retryNotificationEmail(id);
      await refresh();
    } finally {
      setWorkingId(null);
    }
  }

  const title = useMemo(() => {
    if (unreadOnly) return "Unread notifications";
    return "All notifications";
  }, [unreadOnly]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Notifications</h1>
          <p className="mt-1 text-sm text-zinc-600">{title}</p>
        </div>
        <div className="inline-flex items-center rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium text-white">
          Unread {stats.unread}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded border border-zinc-200 bg-white p-4">
          <p className="text-xs text-zinc-500">Total</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900">{stats.total}</p>
        </div>
        <div className="rounded border border-zinc-200 bg-white p-4">
          <p className="text-xs text-zinc-500">Unread</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900">{stats.unread}</p>
        </div>
        <div className="rounded border border-zinc-200 bg-white p-4">
          <p className="text-xs text-zinc-500">Pending emails</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900">{stats.pendingEmails}</p>
        </div>
        <div className="rounded border border-zinc-200 bg-white p-4">
          <p className="text-xs text-zinc-500">Failed emails</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900">{stats.failedEmails}</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-zinc-300"
            checked={unreadOnly}
            onChange={(e) => {
              setPage(1);
              setUnreadOnly(e.target.checked);
            }}
          />
          Unread only
        </label>
      </div>

      {loading ? <p className="text-sm text-zinc-600">Loading…</p> : null}
      {!loading && items.length === 0 ? (
        <p className="text-sm text-zinc-600">No notifications found.</p>
      ) : null}

      <div className="space-y-3">
        {items.map((n) => (
          <div key={n.id} className="rounded border border-zinc-200 bg-white p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {!n.isRead ? <span className="h-2 w-2 rounded-full bg-blue-600" /> : null}
                  <span className="text-xs font-medium text-zinc-500">{typeLabel[n.type]}</span>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${emailStatusClass[n.emailStatus]}`}
                  >
                    {n.emailStatus}
                  </span>
                </div>
                <p className="mt-1 text-sm font-semibold text-zinc-900">{n.title}</p>
                <p className="mt-1 text-sm text-zinc-700">{n.message}</p>
                <p className="mt-2 text-xs text-zinc-500">
                  {new Date(n.createdAt).toLocaleString()}
                  {n.email ? ` · email: ${n.email}` : ""}
                </p>
                {n.emailStatus === "FAILED" && n.emailError ? (
                  <p className="mt-1 text-xs text-red-600">Email error: {n.emailError}</p>
                ) : null}
              </div>
              <div className="flex shrink-0 flex-col gap-2">
                {!n.isRead ? (
                  <Button
                    className="h-8 px-3 text-xs"
                    disabled={workingId === n.id}
                    onClick={() => void markRead(n.id)}
                  >
                    Mark as read
                  </Button>
                ) : null}
                {n.emailStatus === "FAILED" ? (
                  <Button
                    variant="ghost"
                    className="h-8 px-3 text-xs"
                    disabled={workingId === n.id}
                    onClick={() => void retryEmail(n.id)}
                  >
                    Retry email
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          className="h-8 px-3 text-xs"
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Previous
        </Button>
        <p className="text-sm text-zinc-600">
          Page {page} of {totalPages}
        </p>
        <Button
          variant="ghost"
          className="h-8 px-3 text-xs"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
