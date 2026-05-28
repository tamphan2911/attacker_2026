"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, FileText, Search } from "lucide-react";

import { useSiteState } from "@/components/providers/site-state-provider";
import { StatusPill, Surface } from "@/components/site-ui";
import type { AdminRound3SubmissionRow } from "@/types/admin-round3-submissions";

function formatDateTime(locale: "en" | "vi", value: string) {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatFileSize(bytes?: number) {
  if (!bytes || bytes <= 0) {
    return "-";
  }

  if (bytes >= 1024 * 1024) {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function matchesSearch(row: AdminRound3SubmissionRow, search: string) {
  const keyword = search.trim().toLowerCase();
  if (!keyword) {
    return true;
  }

  return [
    row.teamName,
    row.teamTag,
    row.title,
    row.resourceLabel,
    row.submittedByName,
    row.submittedByLoginId,
  ]
    .join(" ")
    .toLowerCase()
    .includes(keyword);
}

export function AdminRound3SubmissionsManager() {
  const { locale } = useSiteState();
  const [rows, setRows] = useState<AdminRound3SubmissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        setLoading(true);
        setError("");
        const response = await fetch("/api/admin/round-3/submissions", { cache: "no-store" });
        const payload = (await response.json().catch(() => null)) as
          | { rows?: AdminRound3SubmissionRow[]; error?: string }
          | null;

        if (!response.ok || !payload?.rows) {
          throw new Error(payload?.error ?? (locale === "en" ? "Could not load Round 3 submissions." : "Không thể tải bài nộp Vòng 3."));
        }

        if (active) {
          setRows(payload.rows);
        }
      } catch (nextError) {
        if (active) {
          setError(nextError instanceof Error ? nextError.message : locale === "en" ? "Unexpected error." : "Có lỗi bất ngờ.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [locale]);

  const filteredRows = useMemo(
    () => rows.filter((row) => matchesSearch(row, search)),
    [rows, search],
  );
  const latestCount = rows.filter((row) => row.isLatest === "valid latest").length;

  if (loading) {
    return (
      <Surface className="px-6 py-8 text-sm theme-text-muted">
        {locale === "en" ? "Loading Round 3 submissions..." : "Đang tải bài nộp Vòng 3..."}
      </Surface>
    );
  }

  if (error) {
    return (
      <Surface className="px-6 py-8 text-sm text-rose-600 dark:text-rose-200">
        {error}
      </Surface>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="theme-heading text-3xl font-semibold theme-text-strong">
            {locale === "en" ? "Round 3 submissions" : "Bài nộp Vòng 3"}
          </p>
          <p className="mt-3 text-sm leading-7 theme-text-muted">
            {locale === "en"
              ? "Review finalist report versions, submitted file details, team information, and direct downloads. Round 3 does not use judge assignment."
              : "Rà soát các phiên bản báo cáo chung kết, thông tin tệp, đội nộp bài và tải trực tiếp. Vòng 3 không cần phân công giám khảo."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill tone="success">
            {locale === "en" ? `${latestCount} latest submissions` : `${latestCount} bài mới nhất`}
          </StatusPill>
          <StatusPill>
            {locale === "en" ? `${rows.length} total versions` : `${rows.length} phiên bản`}
          </StatusPill>
        </div>
      </div>

      <Surface className="px-5 py-5 md:px-6">
        <label className="space-y-2">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] theme-eyebrow">
            <Search className="h-3.5 w-3.5" />
            {locale === "en" ? "Search" : "Tìm kiếm"}
          </span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 theme-text-soft" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={locale === "en" ? "Search by team, title, submitter, or file..." : "Tìm theo đội, tiêu đề, người nộp hoặc tệp..."}
              className="theme-field h-12 w-full rounded-[1rem] border pl-10 pr-4 text-sm outline-none"
            />
          </div>
        </label>
      </Surface>

      <Surface className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[1040px] text-left text-sm">
            <thead className="border-b theme-border bg-[var(--panel-strong)] theme-text-soft">
              <tr>
                {[
                  "#",
                  locale === "en" ? "Team" : "Đội",
                  locale === "en" ? "Report" : "Báo cáo",
                  locale === "en" ? "Version" : "Phiên bản",
                  locale === "en" ? "File" : "Tệp",
                  locale === "en" ? "Submitted by" : "Người nộp",
                  locale === "en" ? "Submitted at" : "Nộp lúc",
                  locale === "en" ? "Download" : "Tải xuống",
                ].map((label) => (
                  <th key={label} className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row, index) => (
                <tr key={row.submissionId} className="border-b theme-border last:border-b-0">
                  <td className="px-4 py-4 theme-text-soft">{index + 1}</td>
                  <td className="px-4 py-4">
                    <p className="font-semibold theme-text-strong">{row.teamName}</p>
                    <p className="mt-1 text-xs theme-text-soft">{row.teamTag}</p>
                  </td>
                  <td className="max-w-[260px] px-4 py-4">
                    <p className="truncate font-semibold theme-text-strong">{row.title}</p>
                    <p className="mt-1 truncate text-xs theme-text-soft">{row.resourceLabel}</p>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col items-start gap-2">
                      <StatusPill tone={row.isLatest === "valid latest" ? "success" : "default"}>
                        {`v${row.version}`}
                      </StatusPill>
                      <span className="text-xs theme-text-soft">
                        {row.isLatest === "valid latest"
                          ? locale === "en"
                            ? "Current valid"
                            : "Bản hợp lệ"
                          : locale === "en"
                            ? "History only"
                            : "Lịch sử"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-start gap-2">
                      <FileText className="mt-0.5 h-4 w-4 theme-text-soft" />
                      <div>
                        <p className="max-w-[190px] truncate theme-text-strong">{row.resourceLabel}</p>
                        <p className="mt-1 text-xs theme-text-soft">{formatFileSize(row.resourceSizeBytes)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-medium theme-text-strong">{row.submittedByName}</p>
                    <p className="mt-1 text-xs theme-text-soft">{row.submittedByLoginId}</p>
                  </td>
                  <td className="px-4 py-4 theme-text-muted">{formatDateTime(locale, row.submittedAt)}</td>
                  <td className="px-4 py-4">
                    {row.resourceUrl ? (
                      <a
                        href={row.resourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="theme-button-primary inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold"
                      >
                        <Download className="h-3.5 w-3.5" />
                        {locale === "en" ? "Download" : "Tải tệp"}
                      </a>
                    ) : (
                      <StatusPill tone="warning">
                        {locale === "en" ? "File archived" : "Tệp đã lưu lịch sử"}
                      </StatusPill>
                    )}
                  </td>
                </tr>
              ))}
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm theme-text-muted">
                    {locale === "en" ? "No Round 3 submissions match this view." : "Không có bài nộp Vòng 3 phù hợp."}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Surface>
    </div>
  );
}
