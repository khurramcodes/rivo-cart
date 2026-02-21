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
              <div>
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
              </div>

              {status === "PENDING" ? (
                <div className="flex gap-2">
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
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

