"use client";

import { useEffect, useMemo, useState } from "react";
import { Bot, Download, Route, Search, Trash2 } from "lucide-react";

import { AdminBulkDeleteDialog } from "@/components/admin-bulk-delete-dialog";
import {
  ADMIN_LIST_TABLE_PAGE_SIZE,
  AdminTablePagination,
  useAdminTablePagination,
} from "@/components/admin-table-pagination";
import { ADMIN_TITLE_ID, useAdminTitleScroll } from "@/components/admin-title-scroll";
import { useSiteState } from "@/components/providers/site-state-provider";
import { StatusPill, Surface } from "@/components/site-ui";
import type { AdminRound2GptScoreRow } from "@/server/admin-round2-gpt-scores";

function formatDateTime(locale: "en" | "vi", value?: string) {
  if (!value) {
    return "--";
  }

  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatScore(value?: number) {
  return typeof value === "number" ? value.toFixed(1) : "--";
}

function statusTone(status: AdminRound2GptScoreRow["status"]): "default" | "info" | "success" | "warning" {
  switch (status) {
    case "scoring":
      return "info";
    case "scored":
      return "success";
    case "failed":
      return "warning";
    default:
      return "default";
  }
}

function statusLabel(locale: "en" | "vi", status: AdminRound2GptScoreRow["status"]) {
  switch (status) {
    case "scoring":
      return locale === "en" ? "Scoring" : "Đang chấm";
    case "scored":
      return locale === "en" ? "Scored" : "Đã chấm";
    case "failed":
      return locale === "en" ? "Failed" : "Lỗi";
    case "skipped-human":
      return locale === "en" ? "Skipped: human" : "Bỏ qua: điểm người";
    case "not-started":
    default:
      return locale === "en" ? "Not started" : "Chưa chạy";
  }
}

function roundTone(round: AdminRound2GptScoreRow["round"]): "info" | "success" {
  return round === "round-3" ? "success" : "info";
}

function roundLabel(locale: "en" | "vi", round: AdminRound2GptScoreRow["round"]) {
  if (round === "round-3") {
    return locale === "en" ? "Round 3" : "Vòng 3";
  }

  return locale === "en" ? "Round 2" : "Vòng 2";
}

export function AdminRound2GptScoresManager() {
  const { locale } = useSiteState();
  useAdminTitleScroll();
  const [rows, setRows] = useState<AdminRound2GptScoreRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roundFilter, setRoundFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedReviewIds, setSelectedReviewIds] = useState<string[]>([]);
  const [pendingDelete, setPendingDelete] = useState<{
    mode: "single" | "selected" | "all";
    rows: AdminRound2GptScoreRow[];
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (statusFilter && row.status !== statusFilter) {
        return false;
      }

      if (roundFilter && row.round !== roundFilter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return [
        row.teamName,
        row.teamTag,
        row.title,
        row.resourceLabel,
        row.model ?? "",
        row.error ?? "",
        row.submittedByName,
        row.submittedByLoginId,
        roundLabel("en", row.round),
        roundLabel("vi", row.round),
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [rows, roundFilter, search, statusFilter]);

  const { page, pageCount, setPage, startIndex, paginatedRows } = useAdminTablePagination(filteredRows);
  const selectedRows = useMemo(
    () => rows.filter((row) => selectedReviewIds.includes(row.reviewId)),
    [rows, selectedReviewIds],
  );

  async function loadRows() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/round-2/gpt-scores", { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as { rows?: AdminRound2GptScoreRow[]; error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? (locale === "en" ? "Could not load GPT report scores." : "Không thể tải điểm GPT báo cáo."));
      }
      setRows(payload?.rows ?? []);
      setSelectedReviewIds([]);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : locale === "en" ? "Unexpected error." : "Có lỗi bất ngờ.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteRows(password?: string) {
    if (!pendingDelete) {
      return;
    }

    setDeleting(true);
    setError("");
    try {
      const response = await fetch("/api/admin/round-2/gpt-scores", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          deleteAll: pendingDelete.mode === "all",
          reviewIds: pendingDelete.mode === "all" ? undefined : pendingDelete.rows.map((row) => row.reviewId),
          password,
        }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? (locale === "en" ? "Could not delete GPT score entries." : "Không thể xóa điểm GPT."));
      }

      setPendingDelete(null);
      await loadRows();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : locale === "en" ? "Unexpected delete error." : "Có lỗi khi xóa.");
    } finally {
      setDeleting(false);
    }
  }

  function toggleSelection(reviewId: string, checked: boolean) {
    setSelectedReviewIds((current) =>
      checked
        ? current.includes(reviewId) ? current : [...current, reviewId]
        : current.filter((id) => id !== reviewId),
    );
  }

  useEffect(() => {
    void loadRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setPage(1);
  }, [roundFilter, search, setPage, statusFilter]);

  const visibleIds = paginatedRows.map((row) => row.reviewId);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedReviewIds.includes(id));

  return (
    <div className="space-y-6">
      <div id={ADMIN_TITLE_ID} className="scroll-mt-32 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="theme-heading text-3xl font-semibold theme-text-strong">
            {locale === "en" ? "GPT report scores" : "Điểm GPT báo cáo"}
          </p>
          <p className="mt-3 text-sm leading-7 theme-text-muted">
            {locale === "en"
              ? "Review GPT scoring entries for Round 2 and Round 3 reports, clear failed or outdated AI scores, and keep human judge scores untouched."
              : "Quản lý các lượt chấm GPT cho báo cáo Vòng 2 và Vòng 3, xóa điểm AI lỗi hoặc cũ, và không ảnh hưởng điểm giám khảo chấm thủ công."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <StatusPill tone="info">{`${rows.length} GPT`}</StatusPill>
          <button
            type="button"
            disabled={selectedRows.length === 0}
            onClick={() => setPendingDelete({ mode: "selected", rows: selectedRows })}
            className="theme-button-danger inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            {locale === "en" ? "Delete selected" : "Xóa đã chọn"}
          </button>
          <button
            type="button"
            disabled={rows.length === 0}
            onClick={() => setPendingDelete({ mode: "all", rows })}
            className="theme-button-danger inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            {locale === "en" ? "Delete all GPT" : "Xóa toàn bộ GPT"}
          </button>
        </div>
      </div>

      {error ? (
        <Surface className="border-amber-300/40 bg-amber-50/80 px-5 py-4 text-sm font-semibold text-amber-900 dark:bg-amber-300/10 dark:text-amber-100">
          {error}
        </Surface>
      ) : null}

      <Surface className="px-5 py-5 md:px-6">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px_260px]">
          <label className="space-y-2">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] theme-eyebrow">
              <Search className="h-4 w-4" />
              {locale === "en" ? "Search" : "Tìm kiếm"}
            </span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={locale === "en" ? "Team, file, model, error..." : "Đội, tệp, model, lỗi..."}
              className="theme-field h-12 w-full rounded-[1.15rem] border px-4 text-sm outline-none"
            />
          </label>
          <label className="space-y-2">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] theme-eyebrow">
              <Route className="h-4 w-4" />
              {locale === "en" ? "Round" : "Vòng"}
            </span>
            <select
              value={roundFilter}
              onChange={(event) => setRoundFilter(event.target.value)}
              className="theme-field h-12 w-full rounded-[1.15rem] border px-4 text-sm outline-none"
            >
              <option value="">{locale === "en" ? "All rounds" : "Tất cả vòng"}</option>
              {(["round-2", "round-3"] as const).map((round) => (
                <option key={round} value={round}>{roundLabel(locale, round)}</option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] theme-eyebrow">
              <Bot className="h-4 w-4" />
              {locale === "en" ? "Status" : "Trạng thái"}
            </span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="theme-field h-12 w-full rounded-[1.15rem] border px-4 text-sm outline-none"
            >
              <option value="">{locale === "en" ? "All statuses" : "Tất cả trạng thái"}</option>
              {(["scored", "failed", "scoring", "skipped-human", "not-started"] as const).map((status) => (
                <option key={status} value={status}>{statusLabel(locale, status)}</option>
              ))}
            </select>
          </label>
        </div>
      </Surface>

      <Surface className="overflow-hidden px-0 py-0">
        <div className="overflow-x-auto">
          <table className="min-w-[1420px] text-left text-sm">
            <thead className="theme-table-head">
              <tr>
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={(event) => {
                      const checked = event.target.checked;
                      setSelectedReviewIds((current) => {
                        const rest = current.filter((id) => !visibleIds.includes(id));
                        return checked ? [...rest, ...visibleIds] : rest;
                      });
                    }}
                    aria-label={locale === "en" ? "Select visible GPT scores" : "Chọn điểm GPT đang hiển thị"}
                    className="h-4 w-4 rounded border theme-border accent-[var(--brand)]"
                  />
                </th>
                {[
                  "#",
                  locale === "en" ? "Round" : "Vòng",
                  locale === "en" ? "Team / report" : "Đội / báo cáo",
                  "GPT",
                  locale === "en" ? "Judge slots" : "Ô giám khảo",
                  locale === "en" ? "File" : "Tệp",
                  locale === "en" ? "Submitted" : "Nộp lúc",
                  locale === "en" ? "Updated" : "Cập nhật",
                  locale === "en" ? "Delete" : "Xóa",
                ].map((label) => (
                  <th key={label} className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-5 py-10 text-center theme-text-muted">
                    {locale === "en" ? "Loading GPT score entries..." : "Đang tải điểm GPT..."}
                  </td>
                </tr>
              ) : paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-5 py-10 text-center theme-text-muted">
                    {locale === "en" ? "No GPT score entries match this view." : "Không có điểm GPT phù hợp."}
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row, index) => (
                  <tr key={row.reviewId} className="border-b theme-border last:border-b-0">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedReviewIds.includes(row.reviewId)}
                        onChange={(event) => toggleSelection(row.reviewId, event.target.checked)}
                        aria-label={locale === "en" ? "Select GPT score" : "Chọn điểm GPT"}
                        className="h-4 w-4 rounded border theme-border accent-[var(--brand)]"
                      />
                    </td>
                    <td className="px-4 py-4 font-medium theme-text-soft">{startIndex + index + 1}</td>
                    <td className="px-4 py-4 align-top">
                      <StatusPill tone={roundTone(row.round)}>{roundLabel(locale, row.round)}</StatusPill>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <p className="font-semibold theme-text-strong">{row.teamName}</p>
                        <p className="text-xs theme-text-soft">{`#${row.teamTag} · ${row.title} · v${row.version}`}</p>
                        <p className="text-xs theme-text-muted">
                          {locale === "en" ? "Submitted by" : "Nộp bởi"} {row.submittedByName} ({row.submittedByLoginId})
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="space-y-2">
                        <StatusPill tone={statusTone(row.status)}>{statusLabel(locale, row.status)}</StatusPill>
                        <p className="text-lg font-semibold theme-text-strong">{formatScore(row.score)}</p>
                        <p className="text-xs theme-text-soft">{row.model ?? "--"}</p>
                        {row.error ? <p className="max-w-[280px] text-xs leading-5 text-amber-700 dark:text-amber-200">{row.error}</p> : null}
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="space-y-2">
                        {row.judgeSlots.map((judge, judgeIndex) => (
                          <div key={judge.judgeUserId} className="rounded-2xl border theme-border theme-panel-subtle px-3 py-2">
                            <p className="text-xs font-semibold theme-text-strong">
                              {locale === "en" ? `Judge ${judgeIndex + 1}` : `Giám khảo ${judgeIndex + 1}`}: {judge.judgeName}
                            </p>
                            <p className="mt-1 text-xs theme-text-soft">
                              {judge.source.toUpperCase()} · {formatScore(judge.score)} · {formatDateTime(locale, judge.scoredAt)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <a
                        href={`/api/team-submissions/${row.submissionId}/file`}
                        download={row.resourceLabel}
                        className="theme-button-secondary inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold"
                      >
                        <Download className="h-3.5 w-3.5" />
                        {row.resourceLabel}
                      </a>
                    </td>
                    <td className="px-4 py-4 align-top theme-text-body">{formatDateTime(locale, row.submittedAt)}</td>
                    <td className="px-4 py-4 align-top theme-text-body">{formatDateTime(locale, row.updatedAt)}</td>
                    <td className="px-4 py-4 align-top">
                      <button
                        type="button"
                        onClick={() => setPendingDelete({ mode: "single", rows: [row] })}
                        className="theme-button-danger inline-flex h-10 w-10 items-center justify-center rounded-full"
                        aria-label={locale === "en" ? "Delete GPT score" : "Xóa điểm GPT"}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <AdminTablePagination
          locale={locale}
          page={page}
          pageCount={pageCount}
          pageSize={ADMIN_LIST_TABLE_PAGE_SIZE}
          totalRows={filteredRows.length}
          onPageChange={setPage}
        />
      </Surface>

      <AdminBulkDeleteDialog
        open={Boolean(pendingDelete)}
        locale={locale}
        title={
          pendingDelete?.mode === "all"
            ? locale === "en" ? "Delete all GPT report scores?" : "Xóa toàn bộ điểm GPT báo cáo?"
            : locale === "en" ? "Delete GPT report score entries?" : "Xóa điểm GPT báo cáo?"
        }
        description={
          pendingDelete?.mode === "all"
            ? locale === "en"
              ? "This clears every Round 2 and Round 3 GPT report score entry and removes AI-filled judge scores. Human judge scores remain untouched. The delete-all password is required."
              : "Thao tác này xóa toàn bộ điểm GPT báo cáo Vòng 2 và Vòng 3, đồng thời xóa điểm giám khảo do AI điền. Điểm giám khảo chấm thủ công không bị ảnh hưởng. Cần nhập mật khẩu xác nhận."
            : locale === "en"
              ? "This clears the selected GPT score entries and removes AI-filled judge scores for those submissions. Human judge scores remain untouched."
              : "Thao tác này xóa các điểm GPT đã chọn và xóa điểm giám khảo do AI điền cho các bài đó. Điểm người chấm thủ công không bị ảnh hưởng."
        }
        items={(pendingDelete?.rows ?? []).map((row) => `${roundLabel(locale, row.round)} · ${row.teamName} · ${row.title} · ${statusLabel(locale, row.status)}`)}
        confirmLabel={locale === "en" ? "Delete GPT scores" : "Xóa điểm GPT"}
        busy={deleting}
        passwordRequired={pendingDelete?.mode === "all"}
        onClose={() => setPendingDelete(null)}
        onConfirm={(password) => void deleteRows(password)}
      />
    </div>
  );
}
