"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { qaApi } from "@/services/qaApi";
import type { Question, ReportReason } from "@/types";
import { useAppSelector } from "@/store/hooks";
import { ThumbsUp, Flag } from "lucide-react";

type ProductQASectionProps = {
  productId: string;
};

const REPORT_REASON_OPTIONS: { value: ReportReason; label: string }[] = [
  { value: "OFF_TOPIC", label: "Off topic" },
  { value: "INAPPROPRIATE", label: "Inappropriate" },
  { value: "FAKE", label: "Fake" },
  { value: "MISLEADING", label: "Misleading" },
];

export function ProductQASection({ productId }: ProductQASectionProps) {
  const user = useAppSelector((s) => s.auth.user);
  const [items, setItems] = useState<Question[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [askQuestion, setAskQuestion] = useState("");
  const [submittingQuestion, setSubmittingQuestion] = useState(false);
  const [questionSuccess, setQuestionSuccess] = useState(false);
  const [helpfulIds, setHelpfulIds] = useState<Set<string>>(new Set());
  const [reportedQuestionIds, setReportedQuestionIds] = useState<Set<string>>(new Set());
  const [reportedAnswerIds, setReportedAnswerIds] = useState<Set<string>>(new Set());
  const [reportModal, setReportModal] = useState<{ type: "question" | "answer"; id: string } | null>(null);
  const [reportReason, setReportReason] = useState<ReportReason | "">("");
  const [submittingReport, setSubmittingReport] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    qaApi
      .listQuestions(productId, { page, limit })
      .then((data) => {
        if (!mounted) return;
        setItems(data.items);
        setTotal(data.total);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [productId, page, limit]);

  useEffect(() => {
    if (!user || items.length === 0) return;
    const answerIds = items.flatMap((q) => q.answers ?? []).map((a) => a.id);
    answerIds.forEach((answerId) => {
      qaApi.myAnswerHelpful(answerId).then((helpful) => {
        if (helpful) setHelpfulIds((prev) => new Set(prev).add(answerId));
      }).catch(() => {});
    });
  }, [user, items]);

  useEffect(() => {
    if (!user || items.length === 0) return;
    const questionIds = items.map((q) => q.id);
    const answerIds = items.flatMap((q) => q.answers ?? []).map((a) => a.id);

    questionIds.forEach((questionId) => {
      qaApi
        .myQuestionReported(questionId)
        .then((reported) => {
          if (!reported) return;
          setReportedQuestionIds((prev) => new Set(prev).add(questionId));
        })
        .catch(() => {});
    });

    answerIds.forEach((answerId) => {
      qaApi
        .myAnswerReported(answerId)
        .then((reported) => {
          if (!reported) return;
          setReportedAnswerIds((prev) => new Set(prev).add(answerId));
        })
        .catch(() => {});
    });
  }, [user, items]);

  const handleAskQuestion = async () => {
    if (!user || !askQuestion.trim()) return;
    setSubmittingQuestion(true);
    setQuestionSuccess(false);
    try {
      await qaApi.createQuestion(productId, askQuestion.trim());
      setAskQuestion("");
      setQuestionSuccess(true);
      const data = await qaApi.listQuestions(productId, { page: 1, limit });
      setItems(data.items);
      setTotal(data.total);
      setPage(1);
    } catch {
      // error
    } finally {
      setSubmittingQuestion(false);
    }
  };

  const handleToggleHelpful = async (answerId: string) => {
    if (!user) return;
    const alreadyHelpful = helpfulIds.has(answerId);
    const newHelpful = !alreadyHelpful;
    try {
      await qaApi.setAnswerHelpful(answerId, newHelpful);
      setHelpfulIds((prev) => {
        const next = new Set(prev);
        if (newHelpful) next.add(answerId);
        else next.delete(answerId);
        return next;
      });
      setItems((prev) =>
        prev.map((q) => ({
          ...q,
          answers: q.answers?.map((a) =>
            a.id === answerId
              ? { ...a, helpfulCount: Math.max(0, a.helpfulCount + (newHelpful ? 1 : -1)) }
              : a,
          ),
        })),
      );
    } catch {
      // ignore
    }
  };

  const handleReportSubmit = async () => {
    if (!reportModal || !reportReason) return;
    setSubmittingReport(true);
    try {
      if (reportModal.type === "question") {
        await qaApi.reportQuestion(reportModal.id, reportReason);
        setReportedQuestionIds((prev) => new Set(prev).add(reportModal.id));
      } else {
        await qaApi.reportAnswer(reportModal.id, reportReason);
        setReportedAnswerIds((prev) => new Set(prev).add(reportModal.id));
      }
      setReportModal(null);
      setReportReason("");
    } finally {
      setSubmittingReport(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="pt-8 border-t border-zinc-200">
      <h2 className="text-lg font-semibold text-zinc-900">Questions & Answers</h2>

      {user ? (
        <div className="mt-4 rounded border border-zinc-200 bg-white p-4">
          <label className="block text-sm font-medium text-zinc-800">Ask a question</label>
          <textarea
            value={askQuestion}
            onChange={(e) => setAskQuestion(e.target.value)}
            placeholder="What would you like to know about this product?"
            rows={3}
            className="mt-2 w-full rounded border border-zinc-200 px-3 py-2 text-sm text-zinc-900"
          />
          <button
            type="button"
            onClick={() => void handleAskQuestion()}
            disabled={!askQuestion.trim() || submittingQuestion}
            className="mt-3 rounded bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {submittingQuestion ? "Submitting…" : "Submit question"}
          </button>
          {questionSuccess ? (
            <p className="mt-2 text-sm text-emerald-600">Your question was submitted.</p>
          ) : null}
        </div>
      ) : (
        <p className="mt-2 text-sm text-zinc-600">
          <Link href="/login" className="underline underline-offset-4">Log in</Link> to ask a question.
        </p>
      )}

      {loading ? (
        <p className="mt-4 text-sm text-zinc-600">Loading questions…</p>
      ) : items.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-600">No questions yet.</p>
      ) : (
        <div className="mt-4 space-y-4">
          {items.map((q) => (
            <div key={q.id} className="rounded border border-zinc-200 bg-white p-4">
              <p className="font-medium text-zinc-900">{q.question}</p>
              <p className="mt-1 text-xs text-zinc-500">
                by {q.user?.name ?? "Customer"} · {new Date(q.createdAt).toLocaleDateString()}
              </p>
              {user ? (
                <button
                  type="button"
                  onClick={() => setReportModal({ type: "question", id: q.id })}
                  disabled={reportedQuestionIds.has(q.id)}
                  className="mt-2 flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Flag className="h-3.5 w-3.5" /> {reportedQuestionIds.has(q.id) ? "Reported" : "Report"}
                </button>
              ) : null}

              <div className="mt-3 space-y-3 pl-4 border-l-2 border-zinc-100">
                {(q.answers ?? []).map((a) => (
                  <div key={a.id}>
                    <p className="text-sm text-zinc-800">{a.answer}</p>
                    <p className="mt-1 text-xs text-zinc-500">— {a.admin?.name ?? "Admin"}</p>
                    <div className="mt-2 flex items-center gap-4">
                      {user ? (
  <>
                          <button
                            type="button"
                            onClick={() => void handleToggleHelpful(a.id)}
                            className={`cursor-pointer flex items-center gap-1 text-xs ${helpfulIds.has(a.id) ? "text-blue-600" : "text-zinc-500 hover:text-zinc-700"}`}
                          >
                            <ThumbsUp className={`h-3.5 w-3.5 ${helpfulIds.has(a.id) ? "fill-current" : ""}`} />
                            Helpful ({a.helpfulCount})
                          </button>
                          <button
                            type="button"
                            onClick={() => setReportModal({ type: "answer", id: a.id })}
                            disabled={reportedAnswerIds.has(a.id)}
                            className="cursor-pointer flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <Flag className="h-3.5 w-3.5" /> {reportedAnswerIds.has(a.id) ? "Reported" : "Report"}
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-zinc-500">Helpful ({a.helpfulCount})</span>
                      )}
                    </div>
                  </div>
                ))}
                {(!q.answers || q.answers.length === 0) ? (
                  <p className="text-sm text-zinc-500">No answer yet.</p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            className="rounded border border-zinc-200 px-3 py-1.5 text-sm disabled:opacity-50"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span className="text-sm text-zinc-600">Page {page} of {totalPages}</span>
          <button
            type="button"
            className="rounded border border-zinc-200 px-3 py-1.5 text-sm disabled:opacity-50"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      ) : null}

      {reportModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-4 shadow-lg">
            <h3 className="text-sm font-semibold text-zinc-900">Report this {reportModal.type}</h3>
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
                onClick={() => { setReportModal(null); setReportReason(""); }}
                className="rounded border border-zinc-200 px-3 py-1.5 text-sm text-zinc-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleReportSubmit()}
                disabled={!reportReason || submittingReport}
                className="rounded bg-zinc-900 px-3 py-1.5 text-sm text-white disabled:opacity-50 cursor-pointer"
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
