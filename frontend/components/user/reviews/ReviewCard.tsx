"use client";

import { useState, useEffect } from "react";
import { StarRating } from "@/components/ui/StarRating";
import type { ReportReason, Review } from "@/types";
import { reviewApi } from "@/services/reviewApi";
import { useAppSelector } from "@/store/hooks";
import { ThumbsUp, Flag } from "lucide-react";

type ReviewCardProps = {
  review: Review;
  onHelpfulChange?: () => void;
  onReported?: () => void;
};

const REPORT_REASON_OPTIONS: { value: ReportReason; label: string }[] = [
  { value: "OFF_TOPIC", label: "Off topic" },
  { value: "INAPPROPRIATE", label: "Inappropriate" },
  { value: "FAKE", label: "Fake" },
  { value: "MISLEADING", label: "Misleading" },
];

export function ReviewCard({ review, onHelpfulChange, onReported }: ReviewCardProps) {
  const user = useAppSelector((s) => s.auth.user);
  const [helpful, setHelpful] = useState<boolean | null>(null);
  const [helpfulCount, setHelpfulCount] = useState(review.helpfulCount);
  const [loadingHelpful, setLoadingHelpful] = useState(false);
  const [reported, setReported] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState<ReportReason | "">("");
  const [submittingReport, setSubmittingReport] = useState(false);

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    Promise.all([reviewApi.myHelpful(review.id), reviewApi.myReported(review.id)])
      .then(([h, r]) => {
        if (mounted) {
          setHelpful(h);
          setReported(r);
        }
      })
      .catch(() => {
        if (mounted) setHelpful(null);
      });
    return () => {
      mounted = false;
    };
  }, [user, review.id]);

  const handleHelpful = async () => {
    if (!user) return;
    setLoadingHelpful(true);
    try {
      const next = helpful !== true;
      await reviewApi.markHelpful(review.id, next);
      setHelpful(next);
      setHelpfulCount((c) => Math.max(0, next ? c + 1 : c - 1));
      onHelpfulChange?.();
    } catch {
      // ignore
    } finally {
      setLoadingHelpful(false);
    }
  };

  const handleReportSubmit = async () => {
    if (!user || !reportReason) return;
    setSubmittingReport(true);
    try {
      await reviewApi.report(review.id, reportReason);
      setReported(true);
      setShowReportModal(false);
      setReportReason("");
      onReported?.();
    } catch {
      // show error in modal if needed
    } finally {
      setSubmittingReport(false);
    }
  };

  return (
    <div className="rounded border border-zinc-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <StarRating value={review.rating} />
          {review.isVerifiedPurchase ? (
            <span className="text-[11px] rounded bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
              Verified purchase
            </span>
          ) : null}
        </div>
        <span className="text-xs text-zinc-500">
          {new Date(review.createdAt).toLocaleDateString()}
        </span>
      </div>
      <p className="mt-3 text-sm text-zinc-800">{review.comment}</p>
      <p className="mt-2 text-xs text-zinc-500">by {review.user?.name ?? "Customer"}</p>

      {review.reply ? (
        <div className="mt-4 ml-4 border-l-2 border-zinc-200 pl-4 py-2 bg-zinc-50 rounded-r">
          <p className="text-xs font-medium text-zinc-600">Admin response</p>
          <p className="mt-1 text-sm text-zinc-800">{review.reply.message}</p>
          <p className="mt-1 text-xs text-zinc-500">— {review.reply.admin?.name ?? "Admin"}</p>
        </div>
      ) : null}

      <div className="mt-3 flex items-center gap-4">
        {user ? (
          <>
            <button
              type="button"
              onClick={() => void handleHelpful()}
              disabled={loadingHelpful}
              className={`
                cursor-pointer flex items-center gap-1.5 text-xs font-medium transition
                ${helpful === true ? "text-blue-600" : "text-zinc-500 hover:text-zinc-700"}
              `}
            >
              <ThumbsUp className={`h-3.5 w-3.5 ${helpful === true ? "fill-current" : ""}`} />
              Helpful ({helpfulCount})
            </button>
            <button
              type="button"
              onClick={() => setShowReportModal(true)}
              disabled={reported}
              className="cursor-pointer flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-700 disabled:opacity-50"
            >
              <Flag className="h-3.5 w-3.5" />
              {reported ? "Reported" : "Report"}
            </button>
          </>
        ) : (
          <span className="text-xs text-zinc-500">
            Helpful ({helpfulCount}) · Log in to mark helpful or report
          </span>
        )}
      </div>

      {showReportModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-4 shadow-lg">
            <h3 className="text-sm font-semibold text-zinc-900">Report this review</h3>
            <p className="mt-1 text-xs text-zinc-600">Select one reason.</p>
            <div className="mt-3 space-y-2">
              {REPORT_REASON_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-center gap-2 rounded border border-zinc-200 px-3 py-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={reportReason === option.value}
                    onChange={() =>
                      setReportReason((prev) => (prev === option.value ? "" : option.value))
                    }
                    className="h-4 w-4 rounded border-zinc-300"
                  />
                  <span className="text-zinc-800">{option.label}</span>
                </label>
              ))}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="rounded border border-zinc-200 px-3 py-1.5 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleReportSubmit()}
                disabled={!reportReason || submittingReport}
                className="rounded bg-zinc-900 px-3 py-1.5 text-sm text-white disabled:opacity-50"
              >
                {submittingReport ? "Sending…" : "Submit"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
