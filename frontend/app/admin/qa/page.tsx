"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { adminApi } from "@/services/adminApi";
import type { Question } from "@/types";

export default function AdminQAPage() {
  const [items, setItems] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"VISIBLE" | "HIDDEN" | "REMOVED">("VISIBLE");
  const [answerState, setAnswerState] = useState<{
    questionId: string;
    answerId?: string;
    message: string;
    isEdit: boolean;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const res = await adminApi.listQuestions({ status });
      setItems(res.items);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, [status]);

  async function hideQuestion(id: string) {
    try {
      await adminApi.hideQuestion(id);
      await refresh();
    } catch {
      // ignore
    }
  }

  async function removeQuestion(id: string) {
    try {
      await adminApi.removeQuestion(id);
      await refresh();
    } catch {
      // ignore
    }
  }

  async function submitAnswer() {
    if (!answerState) return;
    setSubmitting(true);
    try {
      if (answerState.isEdit && answerState.answerId) {
        await adminApi.updateAnswer(answerState.answerId, answerState.message);
      } else {
        await adminApi.createAnswer(answerState.questionId, answerState.message);
      }
      setAnswerState(null);
      await refresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function hideAnswer(id: string) {
    try {
      await adminApi.hideAnswer(id);
      await refresh();
    } catch {
      // ignore
    }
  }

  async function removeAnswer(id: string) {
    try {
      await adminApi.removeAnswer(id);
      await refresh();
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Q&A</h1>
          <p className="mt-1 text-sm text-zinc-600">Manage product questions and answers</p>
        </div>
        <select
          className="h-10 rounded border border-zinc-200 px-3 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
        >
          <option value="VISIBLE">Visible</option>
          <option value="HIDDEN">Hidden</option>
          <option value="REMOVED">Removed</option>
        </select>
      </div>

      {loading ? <p className="text-sm text-zinc-600">Loading…</p> : null}
      {!loading && items.length === 0 ? <p className="text-sm text-zinc-600">No questions.</p> : null}

      <div className="space-y-4">
        {items.map((q) => (
          <div key={q.id} className="rounded border border-zinc-200 bg-white p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-zinc-900">{q.question}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  {q.product?.name ?? q.productId} · by {q.user?.name ?? q.userId} · {new Date(q.createdAt).toLocaleString()}
                </p>
                <div className="mt-2 flex gap-2">
                  {status !== "REMOVED" ? (
                    <>
                      <Button
                        variant="ghost"
                        className="h-8 text-sm"
                        onClick={() => setAnswerState({ questionId: q.id, message: "", isEdit: false })}
                      >
                        Add answer
                      </Button>
                      <Button
                        variant="ghost"
                        className="h-8 text-sm text-amber-600"
                        onClick={() => void hideQuestion(q.id)}
                      >
                        Hide question
                      </Button>
                      <Button
                        variant="ghost"
                        className="h-8 text-sm text-red-600"
                        onClick={() => void removeQuestion(q.id)}
                      >
                        Remove question
                      </Button>
                    </>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-3 pl-4 border-l-2 border-zinc-100">
              {(q.answers ?? []).map((a) => (
                <div key={a.id} className="rounded bg-zinc-50 p-3">
                  <p className="text-sm text-zinc-800">{a.answer}</p>
                  <p className="mt-1 text-xs text-zinc-500">— {a.admin?.name ?? "Admin"} · {a.status}</p>
                  {a.status !== "REMOVED" ? (
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setAnswerState({ questionId: q.id, answerId: a.id, message: a.answer, isEdit: true })}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void hideAnswer(a.id)}
                        className="text-xs text-amber-600 hover:underline"
                      >
                        Hide
                      </button>
                      <button
                        type="button"
                        onClick={() => void removeAnswer(a.id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>

            {answerState?.questionId === q.id ? (
              <div className="mt-4">
                <textarea
                  value={answerState.message}
                  onChange={(e) => setAnswerState((prev) => prev ? { ...prev, message: e.target.value } : null)}
                  rows={3}
                  className="w-full rounded border border-zinc-200 px-3 py-2 text-sm"
                  placeholder="Your answer..."
                />
                <div className="mt-2 flex gap-2">
                  <Button
                    disabled={submitting || !answerState.message.trim()}
                    onClick={() => void submitAnswer()}
                  >
                    {submitting ? "Saving…" : answerState.isEdit ? "Update answer" : "Post answer"}
                  </Button>
                  <Button variant="ghost" onClick={() => setAnswerState(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
