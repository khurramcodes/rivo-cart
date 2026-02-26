"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { adminApi } from "@/services/adminApi";
import type { Review } from "@/types";

export default function AdminReviewsPage() {
  const [status, setStatus] = useState<"PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [items, setItems] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [replyState, setReplyState] = useState<{ reviewId: string; message: string; editing: boolean } | null>(null);
  const [submittingReply, setSubmittingReply] = useState(false);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  const title = useMemo(() => (status === "PENDING" ? "Pending reviews" : `${status.toLowerCase()} reviews`), [status]);

  async function refresh() {
    setLoading(true);
    try {
      const res = await adminApi.listReviews({ status });
      setItems(res.items);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, [status]);

  async function approve(id: string) {
    setSavingId(id);
    try {
      await adminApi.approveReview(id);
      await refresh();
    } finally {
      setSavingId(null);
    }
  }

  async function reject(id: string) {
    setSavingId(id);
    try {
      await adminApi.rejectReview(id);
      await refresh();
    } finally {
      setSavingId(null);
    }
  }

  async function remove(id: string) {
    setConfirmRemoveId(null);
    setSavingId(id);
    try {
      await adminApi.removeReview(id);
      await refresh();
    } finally {
      setSavingId(null);
    }
  }

  async function submitReply() {
    if (!replyState) return;
    setSubmittingReply(true);
    try {
      if (replyState.editing) {
        await adminApi.updateReviewReply(replyState.reviewId, replyState.message);
      } else {
        await adminApi.createReviewReply(replyState.reviewId, replyState.message);
      }
      setReplyState(null);
      await refresh();
    } finally {
      setSubmittingReply(false);
    }
  }

  async function deleteReply(reviewId: string) {
    try {
      await adminApi.deleteReviewReply(reviewId);
      setReplyState(null);
      await refresh();
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Reviews</h1>
          <p className="mt-1 text-sm text-zinc-600">{title}</p>
        </div>
        <select
          className="h-10 rounded border border-zinc-200 px-3 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value as any)}
        >
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {loading ? <p className="text-sm text-zinc-600">Loading…</p> : null}
      {!loading && items.length === 0 ? <p className="text-sm text-zinc-600">No reviews.</p> : null}

      <div className="space-y-3">
        {items.map((r) => (
          <div key={r.id} className="rounded border border-zinc-200 bg-white p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-zinc-900">{r.product?.name ?? r.productId}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  by {r.user?.name ?? r.userId} {r.user?.email ? `(${r.user.email})` : ""}
                </p>
                <p className="mt-2 text-sm text-zinc-800">
                  <span className="font-medium">Rating:</span> {r.rating}/5
                </p>
                <p className="mt-2 text-sm text-zinc-700">{r.comment}</p>
                <p className="mt-2 text-xs text-zinc-500">
                  {new Date(r.createdAt).toLocaleString()} · {r.isVerifiedPurchase ? "Verified purchase" : "Unverified"}
                </p>
                {r.reply ? (
                  <div className="mt-4 rounded border border-zinc-100 bg-zinc-50 p-3">
                    <p className="text-xs font-medium text-zinc-600">Admin reply</p>
                    <p className="mt-1 text-sm text-zinc-800">{r.reply.message}</p>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setReplyState({ reviewId: r.id, message: r.reply!.message, editing: true })}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteReply(r.id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Delete reply
                      </button>
                    </div>
                  </div>
                ) : null}
                {replyState?.reviewId === r.id ? (
                  <div className="mt-4">
                    <textarea
                      value={replyState.message}
                      onChange={(e) => setReplyState((prev) => prev ? { ...prev, message: e.target.value } : null)}
                      rows={3}
                      className="w-full rounded border border-zinc-200 px-3 py-2 text-sm"
                      placeholder="Reply message..."
                    />
                    <div className="mt-2 flex gap-2">
                      <Button
                        disabled={submittingReply || !replyState.message.trim()}
                        onClick={() => void submitReply()}
                      >
                        {submittingReply ? "Saving…" : replyState.editing ? "Update reply" : "Post reply"}
                      </Button>
                      <Button variant="ghost" onClick={() => setReplyState(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : !r.reply ? (
                  <button
                    type="button"
                    onClick={() => setReplyState({ reviewId: r.id, message: "", editing: false })}
                    className="mt-3 text-sm text-blue-600 hover:underline"
                  >
                    Add reply
                  </button>
                ) : null}
              </div>
              {(status === "PENDING" || status === "APPROVED" || status === "REJECTED") ? (
                <div className="flex shrink-0 flex-col gap-2">
                  {status === "PENDING" ? (
                    <>
                      <Button
                        className="h-9"
                        disabled={savingId === r.id}
                        onClick={() => void approve(r.id)}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="ghost"
                        className="h-9"
                        disabled={savingId === r.id}
                        onClick={() => void reject(r.id)}
                      >
                        Reject
                      </Button>
                    </>
                  ) : null}
                  {(status === "APPROVED" || status === "REJECTED") ? (
                    <Button
                      variant="ghost"
                      className="h-9 text-red-600 hover:text-red-700"
                      disabled={savingId === r.id}
                      onClick={() => setConfirmRemoveId(r.id)}
                    >
                      Remove
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {confirmRemoveId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-4 shadow-lg">
            <h3 className="text-sm font-semibold text-zinc-900">Remove review</h3>
            <p className="mt-2 text-sm text-zinc-600">
              Are you sure you want to permanently remove this review? This action cannot be undone.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setConfirmRemoveId(null)}>
                Cancel
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700"
                disabled={savingId === confirmRemoveId}
                onClick={() => void remove(confirmRemoveId)}
              >
                {savingId === confirmRemoveId ? "Removing…" : "Remove"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

