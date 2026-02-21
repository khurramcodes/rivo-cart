"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import clsx from "clsx";

import type { Review } from "@/types";
import { reviewApi } from "@/services/reviewApi";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

function StarInput({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => {
        const v = i + 1;
        const active = value >= v;
        return (
          <button
            key={v}
            type="button"
            disabled={disabled}
            onClick={() => onChange(v)}
            className={clsx("cursor-pointer p-0.5", disabled && "opacity-60 cursor-not-allowed")}
            aria-label={`Rate ${v} star${v === 1 ? "" : "s"}`}
          >
            <Star
              className={clsx("h-5 w-5 text-amber-500", active ? "fill-amber-500" : "fill-transparent")}
            />
          </button>
        );
      })}
    </div>
  );
}

export function ReviewEditor({
  productId,
  isAuthenticated,
}: {
  productId: string;
  isAuthenticated: boolean;
}) {
  const [existing, setExisting] = useState<Review | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const isEdit = Boolean(existing?.id);

  useEffect(() => {
    if (!isAuthenticated) return;
    let mounted = true;
    setLoading(true);
    reviewApi
      .mine(productId)
      .then((r) => {
        if (!mounted) return;
        setExisting(r);
        if (r) {
          setRating(r.rating);
          setComment(r.comment);
        }
      })
      .catch(() => {
        if (mounted) setExisting(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [isAuthenticated, productId]);

  const statusHint = useMemo(() => {
    if (!existing) return null;
    if (existing.status === "APPROVED") return "Your review is approved and visible.";
    if (existing.status === "REJECTED") return "Your review was rejected. You can edit and resubmit.";
    return "Your review is pending approval.";
  }, [existing]);

  async function submit() {
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      const trimmed = comment.trim();
      if (trimmed.length < 1) {
        setError("Comment is required.");
        return;
      }
      if (trimmed.length > 2000) {
        setError("Comment is too long.");
        return;
      }

      const next = isEdit
        ? await reviewApi.update(existing!.id, { rating, comment: trimmed })
        : await reviewApi.create({ productId, rating, comment: trimmed });

      setExisting(next);
      setSuccess(isEdit ? "Review updated (pending approval)." : "Review submitted (pending approval).");
    } catch (err: any) {
      const msg =
        err?.response?.data?.error?.message ??
        err?.message ??
        "Failed to submit review.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="rounded border border-zinc-200 bg-white p-4">
        <p className="text-sm text-zinc-700">
          <Link href="/login" className="underline underline-offset-4">
            Log in
          </Link>{" "}
          to write a review.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded border border-zinc-200 bg-white p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-zinc-900">
          {isEdit ? "Edit your review" : "Write a review"}
        </h3>
        {loading ? <span className="text-xs text-zinc-500">Loading…</span> : null}
      </div>

      {statusHint ? <p className="text-xs text-zinc-600">{statusHint}</p> : null}

      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-800">Rating</label>
        <StarInput value={rating} onChange={setRating} disabled={saving} />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-800">Comment</label>
        <Input
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          disabled={saving}
          placeholder="Share your experience…"
        />
      </div>

      {success ? (
        <div className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {success}
        </div>
      ) : null}
      {error ? (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <div className="flex gap-2">
        <Button type="button" onClick={() => void submit()} disabled={saving}>
          {saving ? "Saving…" : isEdit ? "Update review" : "Submit review"}
        </Button>
      </div>

      <p className="text-xs text-zinc-500">
        Reviews are visible only after admin approval. You can review only products that were delivered to you.
      </p>
    </div>
  );
}

