"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { adminApi } from "@/services/adminApi";
import type { AdminReportDetail, AdminReportListItem, ReportStatus, ReportTargetType } from "@/types";

const statusBadge: Record<ReportStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  UNDER_REVIEW: "bg-blue-100 text-blue-800",
  RESOLVED: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-zinc-200 text-zinc-700",
};

function extractContentPreview(detail: AdminReportDetail | null) {
  if (!detail?.content || typeof detail.content !== "object") return "No content payload";
  const row = detail.content as Record<string, unknown>;
  if (typeof row.question === "string") return row.question;
  if (typeof row.answer === "string") return row.answer;
  if (typeof row.comment === "string") return row.comment;
  return "Content loaded";
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<AdminReportListItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [working, setWorking] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState<"" | ReportStatus>("PENDING");
  const [targetType, setTargetType] = useState<"" | ReportTargetType>("");
  const [adminNote, setAdminNote] = useState("");
  const [hiddenReason, setHiddenReason] = useState("");

  async function refreshList() {
    setLoading(true);
    try {
      const data = await adminApi.listReports({
        page,
        limit: 20,
        status: status || undefined,
        targetType: targetType || undefined,
      });
      setReports(data.reports);
      setTotalPages(data.pagination.totalPages);
      if (data.reports.length > 0 && !selectedId) {
        setSelectedId(data.reports[0].reportId);
      }
      if (data.reports.length === 0) {
        setSelectedId(null);
        setDetail(null);
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadDetail(reportId: string) {
    setDetailLoading(true);
    try {
      const data = await adminApi.getReportDetail(reportId);
      setDetail(data);
      setAdminNote(data.report.adminNote ?? "");
      setHiddenReason("");
    } finally {
      setDetailLoading(false);
    }
  }

  useEffect(() => {
    void refreshList();
  }, [page, status, targetType]);

  useEffect(() => {
    if (!selectedId) return;
    void loadDetail(selectedId);
  }, [selectedId]);

  const canModerate = useMemo(() => {
    const s = detail?.report.status;
    return s === "PENDING" || s === "UNDER_REVIEW";
  }, [detail?.report.status]);

  async function runAction(action: "underReview" | "remove" | "approve" | "reject") {
    if (!detail) return;
    setWorking(true);
    try {
      if (action === "underReview") {
        await adminApi.markReportUnderReview(detail.report.id, adminNote.trim() || undefined);
      } else if (action === "remove") {
        await adminApi.resolveReportRemove(detail.report.id, {
          adminNote: adminNote.trim() || undefined,
          hiddenReason: hiddenReason.trim() || undefined,
        });
      } else if (action === "approve") {
        await adminApi.resolveReportApprove(detail.report.id, adminNote.trim() || undefined);
      } else {
        await adminApi.rejectReport(detail.report.id, adminNote.trim() || undefined);
      }
      await refreshList();
      await loadDetail(detail.report.id);
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Reports</h1>
          <p className="mt-1 text-sm text-zinc-600">Moderate reported reviews, questions, and answers.</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="h-10 rounded border border-zinc-200 px-3 text-sm"
            value={targetType}
            onChange={(e) => {
              setPage(1);
              setTargetType(e.target.value as "" | ReportTargetType);
            }}
          >
            <option value="">All targets</option>
            <option value="QUESTION">Question</option>
            <option value="ANSWER">Answer</option>
            <option value="REVIEW">Review</option>
          </select>
          <select
            className="h-10 rounded border border-zinc-200 px-3 text-sm"
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value as "" | ReportStatus);
            }}
          >
            <option value="">All status</option>
            <option value="PENDING">Pending</option>
            <option value="UNDER_REVIEW">Under review</option>
            <option value="RESOLVED">Resolved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          {loading ? <p className="text-sm text-zinc-600">Loading reports...</p> : null}
          {!loading && reports.length === 0 ? (
            <p className="rounded border border-zinc-200 bg-white p-4 text-sm text-zinc-600">No reports found.</p>
          ) : null}
          {reports.map((r) => (
            <button
              key={r.reportId}
              type="button"
              onClick={() => setSelectedId(r.reportId)}
              className={`w-full rounded border p-4 text-left ${
                selectedId === r.reportId ? "border-zinc-900 bg-zinc-50" : "border-zinc-200 bg-white"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-zinc-900">
                  {r.targetType} · {r.reason}
                </p>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${statusBadge[r.status]}`}>
                  {r.status}
                </span>
              </div>
              <p className="mt-1 text-xs text-zinc-500">Report #{r.reportId}</p>
              <p className="mt-1 text-xs text-zinc-500">Target ID: {r.targetId}</p>
              <p className="mt-1 text-xs text-zinc-500">{new Date(r.createdAt).toLocaleString()}</p>
            </button>
          ))}

          <div className="flex items-center justify-between pt-2">
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

        <div className="rounded border border-zinc-200 bg-white p-4">
          {!selectedId ? <p className="text-sm text-zinc-600">Select a report to view details.</p> : null}
          {selectedId && detailLoading ? <p className="text-sm text-zinc-600">Loading details...</p> : null}
          {selectedId && !detailLoading && detail ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-zinc-900">Report Detail</h2>
                <p className="mt-1 text-xs text-zinc-500">
                  Created {new Date(detail.report.createdAt).toLocaleString()}
                </p>
              </div>

              <div className="rounded bg-zinc-50 p-3 text-sm text-zinc-700">
                <p>
                  <span className="font-medium text-zinc-900">Target:</span> {detail.report.targetType}
                </p>
                <p>
                  <span className="font-medium text-zinc-900">Reason:</span> {detail.report.reason}
                </p>
                <p>
                  <span className="font-medium text-zinc-900">Reporter:</span> {detail.reporter.name} ({detail.reporter.email})
                </p>
                <p>
                  <span className="font-medium text-zinc-900">Status:</span> {detail.report.status}
                </p>
                {detail.report.resolution ? (
                  <p>
                    <span className="font-medium text-zinc-900">Resolution:</span> {detail.report.resolution}
                  </p>
                ) : null}
                <p className="mt-2">
                  <span className="font-medium text-zinc-900">Content preview:</span> {extractContentPreview(detail)}
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-zinc-700">Admin note</label>
                <textarea
                  rows={3}
                  className="w-full rounded border border-zinc-200 px-3 py-2 text-sm"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Internal moderation note"
                  disabled={!canModerate || working}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-zinc-700">Hidden reason (for remove-content action)</label>
                <input
                  className="h-10 w-full rounded border border-zinc-200 px-3 text-sm"
                  value={hiddenReason}
                  onChange={(e) => setHiddenReason(e.target.value)}
                  placeholder="Reason shown for hidden content"
                  disabled={!canModerate || working}
                />
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  variant="ghost"
                  className="h-8 text-xs"
                  disabled={!canModerate || working}
                  onClick={() => void runAction("underReview")}
                >
                  Mark under review
                </Button>
                <Button
                  variant="ghost"
                  className="h-8 text-xs text-amber-700"
                  disabled={!canModerate || working}
                  onClick={() => void runAction("approve")}
                >
                  Approve content
                </Button>
                <Button
                  variant="ghost"
                  className="h-8 text-xs text-red-700"
                  disabled={!canModerate || working}
                  onClick={() => void runAction("remove")}
                >
                  Remove content
                </Button>
                <Button
                  variant="ghost"
                  className="h-8 text-xs"
                  disabled={!canModerate || working}
                  onClick={() => void runAction("reject")}
                >
                  Reject report
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
