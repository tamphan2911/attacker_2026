"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, FileText, Save, Search, Sprout, Trash2, Trophy } from "lucide-react";

import { useSiteState } from "@/components/providers/site-state-provider";
import { StatusPill, Surface } from "@/components/site-ui";
import type { AdminRound3SubmissionRow } from "@/types/admin-round3-submissions";

type Round3AdminTab = "finalist" | "emerging";

const round3Tabs: Array<{
  id: Round3AdminTab;
  icon: typeof Trophy;
}> = [
  { id: "finalist", icon: Trophy },
  { id: "emerging", icon: Sprout },
];

const stickyTeamHeadClass =
  "theme-admin-sticky-head sticky left-0 z-30 min-w-[240px] shadow-[12px_0_24px_rgba(14,116,144,0.08)]";
const stickyTeamCellClass =
  "theme-admin-sticky-cell sticky left-0 z-20 min-w-[240px] shadow-[12px_0_24px_rgba(14,116,144,0.08)]";

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
  const { locale, currentUser } = useSiteState();
  const [rows, setRows] = useState<AdminRound3SubmissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [scoreDrafts, setScoreDrafts] = useState<Record<string, string>>({});
  const [savingTeamId, setSavingTeamId] = useState<string | null>(null);
  const [deletingSubmissionId, setDeletingSubmissionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Round3AdminTab>("finalist");

  const loadRows = useCallback(
    async (active = true) => {
      try {
        setLoading(true);
        setError("");
        const response = await fetch("/api/admin/round-3/submissions", { cache: "no-store" });
        const payload = (await response.json().catch(() => null)) as
          | { rows?: AdminRound3SubmissionRow[]; error?: string }
          | null;

        if (!response.ok || !payload?.rows) {
          throw new Error(payload?.error ?? (locale === "en" ? "Could not load Final/Emerging submissions." : "Không thể tải bài nộp chung kết/Đội ươm mầm."));
        }

        if (active) {
          setRows(payload.rows);
          setScoreDrafts(
            Object.fromEntries(
              payload.rows
                .filter((row) => row.isLatest === "valid latest")
                .map((row) => [row.teamId, typeof row.finalScore === "number" ? String(row.finalScore) : ""]),
            ),
          );
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
    },
    [locale],
  );

  useEffect(() => {
    let active = true;

    void loadRows(active);

    return () => {
      active = false;
    };
  }, [loadRows]);

  async function saveFinalScore(teamId: string) {
    const draft = scoreDrafts[teamId]?.trim() ?? "";
    let finalScore: number | null = null;

    if (draft !== "") {
      const parsedScore = Number(draft);
      if (!Number.isFinite(parsedScore) || parsedScore < 0) {
        setError(locale === "en" ? "Final score must be zero or higher." : "Điểm chung kết phải từ 0 trở lên.");
        return;
      }
      finalScore = parsedScore;
    }

    try {
      setSavingTeamId(teamId);
      setError("");
      const response = await fetch("/api/admin/round-3/submissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId, finalScore }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? (locale === "en" ? "Could not save final score." : "Không thể lưu điểm chung kết."));
      }

      await loadRows();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : locale === "en" ? "Unexpected error." : "Có lỗi bất ngờ.");
    } finally {
      setSavingTeamId(null);
    }
  }

  async function deleteSubmission(row: AdminRound3SubmissionRow) {
    const confirmed = window.confirm(
      locale === "en"
        ? `Delete ${tabLabel} submission ${row.title} from team ${row.teamName}? The uploaded PDF will also be deleted from storage.`
        : `Xóa bài nộp ${tabLabel} ${row.title} của đội ${row.teamName}? Tệp PDF đã tải lên cũng sẽ bị xóa khỏi storage.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingSubmissionId(row.submissionId);
      setError("");
      const response = await fetch(`/api/admin/round-3/submissions/${row.submissionId}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(
          payload?.error ??
            (locale === "en"
              ? "Could not delete the Final/Emerging submission."
              : "Không thể xóa bài nộp chung kết/Đội ươm mầm."),
        );
      }

      await loadRows();
    } catch (nextError) {
      window.alert(
        nextError instanceof Error
          ? nextError.message
          : locale === "en"
            ? "Could not delete the Final/Emerging submission."
            : "Không thể xóa bài nộp chung kết/Đội ươm mầm.",
      );
    } finally {
      setDeletingSubmissionId(null);
    }
  }

  const tabRows = useMemo(
    () => rows.filter((row) => row.round2Bracket === activeTab),
    [activeTab, rows],
  );
  const filteredRows = useMemo(
    () => tabRows.filter((row) => matchesSearch(row, search)),
    [tabRows, search],
  );
  const countsByTab = useMemo(
    () =>
      round3Tabs.reduce(
        (counts, tab) => {
          const matchingRows = rows.filter((row) => row.round2Bracket === tab.id);
          counts[tab.id] = {
            latest: matchingRows.filter((row) => row.isLatest === "valid latest").length,
            total: matchingRows.length,
            scored: matchingRows.filter((row) => row.isLatest === "valid latest" && typeof row.finalScore === "number").length,
          };
          return counts;
        },
        {} as Record<Round3AdminTab, { latest: number; total: number; scored: number }>,
      ),
    [rows],
  );
  const currentCounts = countsByTab[activeTab];
  const tabLabel = activeTab === "finalist"
    ? locale === "en"
      ? "Finalist"
      : "Nhóm chung kết"
    : locale === "en"
      ? "Emerging"
      : "Đội ươm mầm";
  const canDeleteSubmission = currentUser?.role === "admin";
  const tableColumnCount = canDeleteSubmission ? 11 : 10;

  if (loading) {
    return (
      <Surface className="px-6 py-8 text-sm theme-text-muted">
        {locale === "en" ? "Loading Final/Emerging submissions..." : "Đang tải bài nộp chung kết/Đội ươm mầm..."}
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
            {locale === "en" ? "Final/Emerging submissions" : "Bài nộp chung kết/Đội ươm mầm"}
          </p>
          <p className="mt-3 text-sm leading-7 theme-text-muted">
            {locale === "en"
              ? "Review final and Emerging round report versions, submitted file details, team information, and direct downloads."
              : "Rà soát các phiên bản báo cáo Chung kết và Vòng Đội ươm mầm, thông tin tệp, đội nộp bài và tải trực tiếp."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill tone="success">
            {locale === "en" ? `${currentCounts.latest} latest submissions` : `${currentCounts.latest} bài mới nhất`}
          </StatusPill>
          <StatusPill>
            {locale === "en" ? `${currentCounts.total} total versions` : `${currentCounts.total} phiên bản`}
          </StatusPill>
          <StatusPill tone="info">
            {locale === "en" ? `${currentCounts.scored} scored teams` : `${currentCounts.scored} đội đã nhập điểm`}
          </StatusPill>
        </div>
      </div>

      <Surface className="p-2">
        <div className="grid gap-2 md:grid-cols-2">
          {round3Tabs.map((tab) => {
            const Icon = tab.icon;
            const selected = activeTab === tab.id;
            const label = tab.id === "finalist"
              ? locale === "en"
                ? "Finalist"
                : "Nhóm chung kết"
              : locale === "en"
                ? "Emerging"
                : "Đội ươm mầm";
            const description = tab.id === "finalist"
              ? locale === "en"
                ? "Top 5 teams advanced to the final presentation"
                : "5 đội vào phần trình bày chung kết"
              : locale === "en"
                ? "Emerging round teams and reward ranking"
                : "Các đội ươm mầm và xếp hạng giải thưởng";

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-between gap-4 rounded-[1rem] border px-4 py-3 text-left transition duration-200 ${
                  selected
                    ? "border-sky-400/40 bg-sky-500/12 shadow-[0_16px_34px_rgba(14,116,144,0.12)]"
                    : "theme-border bg-transparent hover:bg-[var(--panel-strong)]"
                }`}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span
                    className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[0.9rem] border ${
                      selected
                        ? "border-sky-400/35 bg-sky-500/16 text-sky-700 dark:text-sky-100"
                        : "theme-border theme-text-soft"
                    }`}
                  >
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold theme-text-strong">{label}</span>
                    <span className="mt-1 block text-xs leading-5 theme-text-muted">{description}</span>
                  </span>
                </span>
                <StatusPill tone={selected ? "info" : "default"}>
                  {countsByTab[tab.id].latest}
                </StatusPill>
              </button>
            );
          })}
        </div>
      </Surface>

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
          <table className="min-w-[1240px] text-left text-sm">
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
                  locale === "en" ? "Final score" : "Điểm chung kết",
                  locale === "en" ? "Rank" : "Xếp hạng",
                  locale === "en" ? "Download" : "Tải xuống",
                  ...(canDeleteSubmission ? [locale === "en" ? "Delete" : "Xóa"] : []),
                ].map((label, columnIndex) => (
                  <th
                    key={label}
                    className={`px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] ${
                      columnIndex === 1 ? stickyTeamHeadClass : ""
                    }`}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row, index) => (
                <tr key={row.submissionId} className="border-b theme-border last:border-b-0">
                  <td className="px-4 py-4 theme-text-soft">{index + 1}</td>
                  <td className={`${stickyTeamCellClass} px-4 py-4`}>
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
                    {row.isLatest === "valid latest" ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={scoreDrafts[row.teamId] ?? ""}
                          onChange={(event) =>
                            setScoreDrafts((current) => ({
                              ...current,
                              [row.teamId]: event.target.value,
                            }))
                          }
                          placeholder={locale === "en" ? "Score" : "Điểm"}
                          className="theme-field h-10 w-24 rounded-[0.8rem] border px-3 text-sm outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => void saveFinalScore(row.teamId)}
                          disabled={savingTeamId === row.teamId}
                          className="theme-button-secondary inline-flex h-10 w-10 items-center justify-center rounded-full disabled:opacity-60"
                          aria-label={locale === "en" ? "Save final score" : "Lưu điểm chung kết"}
                          title={locale === "en" ? "Save final score" : "Lưu điểm chung kết"}
                        >
                          <Save className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs theme-text-soft">-</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {row.finalRank ? (
                      <StatusPill tone={row.round2Bracket === "finalist" ? "success" : row.finalRank <= 10 ? "info" : "default"}>
                        {row.round2Bracket === "finalist"
                          ? `Final #${row.finalRank}`
                          : row.finalRank <= 10
                            ? `Emerging #${row.finalRank}`
                            : `#${row.finalRank}`}
                      </StatusPill>
                    ) : (
                      <span className="text-xs theme-text-soft">-</span>
                    )}
                  </td>
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
                  {canDeleteSubmission ? (
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => {
                          void deleteSubmission(row);
                        }}
                        disabled={deletingSubmissionId === row.submissionId}
                        title={locale === "en" ? "Delete submission and uploaded PDF" : "Xóa bài nộp và tệp PDF"}
                        aria-label={locale === "en" ? "Delete submission and uploaded PDF" : "Xóa bài nộp và tệp PDF"}
                        className="theme-button-danger inline-flex h-10 w-10 items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-55"
                      >
                        <Trash2 className={`h-4 w-4 ${deletingSubmissionId === row.submissionId ? "animate-pulse" : ""}`} />
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))}
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={tableColumnCount} className="px-4 py-10 text-center text-sm theme-text-muted">
                    {locale === "en"
                      ? `No ${tabLabel} submissions match this view.`
                      : `Không có bài nộp ${tabLabel.toLowerCase()} phù hợp.`}
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
