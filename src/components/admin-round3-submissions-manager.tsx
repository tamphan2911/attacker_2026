"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bot, Download, FileText, Filter, LoaderCircle, RotateCcw, Save, Search, Sparkles, Sprout, Trash2, Trophy } from "lucide-react";

import { AdminBulkDeleteDialog } from "@/components/admin-bulk-delete-dialog";
import { useSiteState } from "@/components/providers/site-state-provider";
import { StatusPill, Surface } from "@/components/site-ui";
import type { AdminRound3SubmissionRow } from "@/types/admin-round3-submissions";

type Round3AdminTab = "finalist" | "emerging";

type EmergingAiScoringJobSnapshot = {
  id: string;
  mode: "run-all" | "retry-failed";
  status: "pending" | "running" | "completed" | "failed";
  model: string;
  totalEligible: number;
  processedCount: number;
  scoredCount: number;
  failedCount: number;
  skippedHumanCount: number;
  skippedExistingCount: number;
  lastError?: string;
};

type EmergingAiScoringOverview = {
  emergingClosed: boolean;
  deadlineAt?: string;
  activeJob: EmergingAiScoringJobSnapshot | null;
  totals: {
    latestReports: number;
    humanScored: number;
    gptScored: number;
    failed: number;
    needsGptScore: number;
    gptScoringPercent: number;
  };
};

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

function formatScore(value?: number) {
  if (typeof value !== "number") {
    return "-";
  }

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
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

function compareRowsByScore(left: AdminRound3SubmissionRow, right: AdminRound3SubmissionRow) {
  const leftScore = left.finalScore ?? Number.NEGATIVE_INFINITY;
  const rightScore = right.finalScore ?? Number.NEGATIVE_INFINITY;

  if (leftScore !== rightScore) {
    return rightScore - leftScore;
  }

  if ((left.finalRank ?? Number.POSITIVE_INFINITY) !== (right.finalRank ?? Number.POSITIVE_INFINITY)) {
    return (left.finalRank ?? Number.POSITIVE_INFINITY) - (right.finalRank ?? Number.POSITIVE_INFINITY);
  }

  if (left.isLatest !== right.isLatest) {
    return left.isLatest === "valid latest" ? -1 : 1;
  }

  return new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime();
}

function createGptStatusMeta(locale: "en" | "vi", status?: AdminRound3SubmissionRow["emergingGptStatus"]) {
  switch (status) {
    case "scoring":
      return { label: locale === "en" ? "GPT scoring" : "GPT đang chấm", tone: "info" as const };
    case "scored":
      return { label: locale === "en" ? "GPT scored" : "GPT đã chấm", tone: "success" as const };
    case "failed":
      return { label: locale === "en" ? "GPT failed" : "GPT lỗi", tone: "warning" as const };
    case "skipped-human":
      return { label: locale === "en" ? "Human locked" : "Đã có giám khảo", tone: "default" as const };
    case "not-started":
    default:
      return { label: locale === "en" ? "GPT not run" : "Chưa chạy GPT", tone: "default" as const };
  }
}

function EmergingGptScoreCell({ locale, row }: { locale: "en" | "vi"; row: AdminRound3SubmissionRow }) {
  const meta = createGptStatusMeta(locale, row.emergingGptStatus);

  return (
    <div className="space-y-2">
      <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
      <div className="space-y-1 text-xs leading-5">
        <p className="font-semibold theme-text-strong">
          {locale === "en" ? "Score" : "Điểm"}: {formatScore(row.emergingGptScore)}
        </p>
        <p className="theme-text-soft">
          {locale === "en" ? "Time" : "Thời gian"}: {row.emergingGptScoredAt ? formatDateTime(locale, row.emergingGptScoredAt) : "-"}
        </p>
        {row.emergingGptModel ? (
          <p className="theme-text-soft">Model: {row.emergingGptModel}</p>
        ) : null}
        {row.emergingGptError ? (
          <p className="max-w-[240px] font-medium text-amber-700 dark:text-amber-200">
            {row.emergingGptError}
          </p>
        ) : null}
      </div>
    </div>
  );
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
  const [selectedSubmissionIds, setSelectedSubmissionIds] = useState<string[]>([]);
  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false);
  const [batchDeleting, setBatchDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<Round3AdminTab>("finalist");
  const [versionFilter, setVersionFilter] = useState<"all" | "latest" | "history">("all");
  const [scoreFilter, setScoreFilter] = useState<"all" | "scored" | "unscored">("all");
  const [emergingRankFilter, setEmergingRankFilter] = useState<"all" | "awarded" | "not-awarded">("all");
  const [aiOverview, setAiOverview] = useState<EmergingAiScoringOverview | null>(null);
  const [aiActionLoading, setAiActionLoading] = useState<"run-all" | "retry-failed" | null>(null);
  const [aiError, setAiError] = useState("");
  const aiProcessBusyRef = useRef(false);
  const activeAiJob = aiOverview?.activeJob ?? null;
  const activeAiProgressPercent =
    activeAiJob && activeAiJob.totalEligible > 0
      ? Math.min(100, Math.max(0, Math.round((activeAiJob.processedCount / activeAiJob.totalEligible) * 100)))
      : activeAiJob?.status === "completed"
        ? 100
        : 0;

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

  const loadAiOverview = useCallback(async () => {
    const response = await fetch("/api/admin/round-3/ai-report-scoring", { cache: "no-store" });
    const payload = (await response.json().catch(() => null)) as { overview?: EmergingAiScoringOverview; error?: string } | null;
    if (!response.ok || !payload?.overview) {
      throw new Error(payload?.error ?? (locale === "en" ? "Could not load Emerging GPT scoring progress." : "Không thể tải tiến độ chấm GPT Vòng Đội ươm mầm."));
    }
    setAiOverview(payload.overview);
  }, [locale]);

  useEffect(() => {
    void loadAiOverview().catch((nextError) => {
      setAiError(nextError instanceof Error ? nextError.message : locale === "en" ? "Unexpected Emerging GPT scoring error." : "Có lỗi bất ngờ khi tải tiến độ GPT Vòng Đội ươm mầm.");
    });
  }, [loadAiOverview, locale]);

  const startAiScoring = async (mode: "run-all" | "retry-failed") => {
    try {
      setAiError("");
      setAiActionLoading(mode);
      const response = await fetch("/api/admin/round-3/ai-report-scoring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ mode }),
      });
      const payload = (await response.json().catch(() => null)) as { overview?: EmergingAiScoringOverview; error?: string } | null;
      if (!response.ok || !payload?.overview) {
        throw new Error(payload?.error ?? (locale === "en" ? "Could not start Emerging GPT scoring." : "Không thể bắt đầu chấm GPT Vòng Đội ươm mầm."));
      }
      setAiOverview(payload.overview);
      await loadRows();
    } catch (nextError) {
      setAiError(nextError instanceof Error ? nextError.message : locale === "en" ? "Unexpected Emerging GPT scoring error." : "Có lỗi bất ngờ khi chấm GPT Vòng Đội ươm mầm.");
    } finally {
      setAiActionLoading(null);
    }
  };

  useEffect(() => {
    const activeJobId = activeAiJob?.id ?? "";
    if (!activeJobId || activeAiJob?.status === "completed" || activeAiJob?.status === "failed") {
      return;
    }

    let cancelled = false;
    const processNext = async () => {
      if (aiProcessBusyRef.current) {
        return;
      }

      try {
        aiProcessBusyRef.current = true;
        const response = await fetch(`/api/admin/round-3/ai-report-scoring/${activeJobId}/process`, {
          method: "POST",
          credentials: "same-origin",
        });
        const payload = (await response.json().catch(() => null)) as { overview?: EmergingAiScoringOverview; error?: string } | null;
        if (!response.ok || !payload?.overview) {
          throw new Error(payload?.error ?? (locale === "en" ? "Could not process the next Emerging GPT score." : "Không thể xử lý lượt chấm GPT tiếp theo."));
        }
        if (!cancelled) {
          setAiOverview(payload.overview);
          await loadRows();
        }
      } catch (nextError) {
        if (!cancelled) {
          setAiError(nextError instanceof Error ? nextError.message : locale === "en" ? "Unexpected Emerging GPT scoring error." : "Có lỗi bất ngờ khi chấm GPT.");
          await loadAiOverview().catch(() => {});
        }
      } finally {
        if (!cancelled) {
          aiProcessBusyRef.current = false;
        }
      }
    };

    void processNext();
    const timer = window.setInterval(() => void processNext(), 2200);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [activeAiJob?.id, activeAiJob?.status, loadAiOverview, loadRows, locale]);

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
    () =>
      tabRows
        .filter((row) => matchesSearch(row, search))
        .filter((row) => {
          if (versionFilter === "latest" && row.isLatest !== "valid latest") {
            return false;
          }

          if (versionFilter === "history" && row.isLatest !== "history only") {
            return false;
          }

          if (scoreFilter === "scored" && typeof row.finalScore !== "number") {
            return false;
          }

          if (scoreFilter === "unscored" && typeof row.finalScore === "number") {
            return false;
          }

          if (activeTab === "emerging" && emergingRankFilter === "awarded" && (!row.finalRank || row.finalRank > 10)) {
            return false;
          }

          if (activeTab === "emerging" && emergingRankFilter === "not-awarded" && row.finalRank && row.finalRank <= 10) {
            return false;
          }

          return true;
        })
        .sort(compareRowsByScore),
    [activeTab, emergingRankFilter, scoreFilter, tabRows, search, versionFilter],
  );
  const selectedRows = useMemo(
    () => filteredRows.filter((row) => selectedSubmissionIds.includes(row.submissionId)),
    [filteredRows, selectedSubmissionIds],
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
  const tableColumnCount = (canDeleteSubmission ? 12 : 10) + (activeTab === "emerging" ? 2 : 0);

  function toggleSubmissionSelection(submissionId: string, checked: boolean) {
    setSelectedSubmissionIds((current) =>
      checked
        ? current.includes(submissionId) ? current : [...current, submissionId]
        : current.filter((id) => id !== submissionId),
    );
  }

  async function deleteSelectedSubmissions() {
    setBatchDeleting(true);
    setError("");
    try {
      for (const row of selectedRows) {
        const response = await fetch(`/api/admin/round-3/submissions/${row.submissionId}`, {
          method: "DELETE",
          credentials: "same-origin",
        });
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        if (!response.ok) {
          throw new Error(payload?.error ?? (locale === "en" ? "Could not delete selected submissions." : "Không thể xóa các bài nộp đã chọn."));
        }
      }

      setSelectedSubmissionIds([]);
      setBatchDeleteOpen(false);
      await loadRows();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : locale === "en" ? "Unexpected error." : "Có lỗi bất ngờ.");
    } finally {
      setBatchDeleting(false);
    }
  }

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
              : "Rà soát các phiên bản báo cáo Chung kết và Vòng Đội Ươm mầm, thông tin tệp, đội nộp bài và tải trực tiếp."}
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
          {canDeleteSubmission ? (
            <button
              type="button"
              onClick={() => setBatchDeleteOpen(true)}
              disabled={selectedRows.length === 0 || batchDeleting}
              className="theme-button-danger inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Trash2 className="h-4 w-4" />
              {locale === "en" ? "Delete selected" : "Xóa bài đã chọn"}
            </button>
          ) : null}
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

      {activeTab === "emerging" ? (
        <Surface className="px-5 py-5 md:px-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="max-w-4xl">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-[1rem] border border-emerald-500/24 bg-emerald-500/12 text-emerald-700 dark:text-emerald-100">
                  <Bot className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] theme-eyebrow">
                    {locale === "en" ? "Emerging GPT scoring" : "Chấm GPT Vòng Đội ươm mầm"}
                  </p>
                  <h2 className="mt-1 text-xl font-semibold theme-text-strong">
                    {locale === "en" ? "Score latest Emerging reports by improvement" : "Chấm báo cáo Ươm mầm mới nhất theo mức cải thiện"}
                  </h2>
                </div>
              </div>
              <p className="mt-3 text-sm leading-7 theme-text-muted">
                {locale === "en"
                  ? "GPT scoring opens after the Emerging report deadline. It uses the Round 2 rubric and compares each report with the team’s Round 2 scores/comments."
                  : "Chấm GPT mở sau hạn nộp báo cáo Ươm mầm. Hệ thống dùng rubric Vòng 2 và so sánh từng báo cáo với điểm/nhận xét Vòng 2 của đội."}
              </p>
              {aiError ? (
                <div className="mt-3 rounded-[1.1rem] border border-amber-300/40 bg-amber-400/12 px-4 py-3 text-sm leading-6 text-amber-900 dark:border-amber-200/24 dark:bg-amber-300/12 dark:text-amber-100">
                  {aiError}
                </div>
              ) : null}
            </div>

            <div className="min-w-0 space-y-3 xl:min-w-[360px]">
              <div className="grid grid-cols-2 gap-2 text-sm">
                {[
                  { label: locale === "en" ? "Latest reports" : "Báo cáo mới nhất", value: aiOverview?.totals.latestReports ?? currentCounts.latest },
                  { label: locale === "en" ? "Needs GPT" : "Cần GPT chấm", value: aiOverview?.totals.needsGptScore ?? "--" },
                  { label: locale === "en" ? "GPT scored" : "GPT đã chấm", value: aiOverview?.totals.gptScored ?? "--" },
                  { label: locale === "en" ? "Failed" : "Lỗi", value: aiOverview?.totals.failed ?? "--" },
                ].map((item) => (
                  <div key={item.label} className="rounded-[1rem] border theme-border theme-panel-subtle px-3 py-3">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] theme-text-soft">{item.label}</p>
                    <p className="mt-1 text-lg font-semibold theme-text-strong">{item.value}</p>
                  </div>
                ))}
              </div>

              {activeAiJob ? (
                <div className="rounded-[1rem] border border-emerald-500/22 bg-emerald-500/10 px-3 py-3 text-sm leading-6 text-emerald-900 dark:border-emerald-300/20 dark:bg-emerald-300/12 dark:text-emerald-100">
                  <div className="flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-2 font-semibold">
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      {locale === "en" ? "Live scoring progress" : "Tiến độ chấm GPT"}
                    </span>
                    <span className="shrink-0 rounded-full border border-white/50 bg-white/70 px-2.5 py-1 text-xs font-semibold text-emerald-950 dark:border-white/12 dark:bg-white/10 dark:text-emerald-100">
                      {activeAiJob.processedCount}/{activeAiJob.totalEligible} · {activeAiProgressPercent}%
                    </span>
                  </div>
                  <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-950/10 dark:bg-white/10">
                    <div className="h-full rounded-full bg-[linear-gradient(90deg,#86efac,#22c55e,#059669)] transition-[width] duration-700 ease-out" style={{ width: `${activeAiProgressPercent}%` }} />
                  </div>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void startAiScoring("run-all")}
                  disabled={!aiOverview?.emergingClosed || Boolean(activeAiJob) || aiActionLoading != null}
                  className="theme-button-primary inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {aiActionLoading === "run-all" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {locale === "en" ? "Score with GPT" : "Chấm bằng GPT"}
                </button>
                <button
                  type="button"
                  onClick={() => void startAiScoring("retry-failed")}
                  disabled={!aiOverview?.emergingClosed || Boolean(activeAiJob) || aiActionLoading != null || (aiOverview?.totals.failed ?? 0) === 0}
                  className="theme-button-secondary inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {aiActionLoading === "retry-failed" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                  {locale === "en" ? "Retry failed" : "Chạy lại lỗi"}
                </button>
              </div>
            </div>
          </div>
        </Surface>
      ) : null}

      <Surface className="px-5 py-5 md:px-6">
        <div className={`grid gap-3 ${activeTab === "emerging" ? "lg:grid-cols-[minmax(0,1.35fr)_210px_210px_230px]" : "lg:grid-cols-[minmax(0,1.35fr)_210px_210px]"}`}>
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

          <label className="space-y-2">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] theme-eyebrow">
              <Filter className="h-3.5 w-3.5" />
              {locale === "en" ? "Version" : "Phiên bản"}
            </span>
            <select
              value={versionFilter}
              onChange={(event) => setVersionFilter(event.target.value as "all" | "latest" | "history")}
              className="theme-admin-select theme-field h-12 w-full rounded-[1rem] border px-4 text-sm outline-none"
            >
              <option value="all">{locale === "en" ? "All versions" : "Tất cả phiên bản"}</option>
              <option value="latest">{locale === "en" ? "Latest only" : "Chỉ bản mới nhất"}</option>
              <option value="history">{locale === "en" ? "History only" : "Chỉ bản lịch sử"}</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] theme-eyebrow">
              <Filter className="h-3.5 w-3.5" />
              {locale === "en" ? "Score" : "Điểm"}
            </span>
            <select
              value={scoreFilter}
              onChange={(event) => setScoreFilter(event.target.value as "all" | "scored" | "unscored")}
              className="theme-admin-select theme-field h-12 w-full rounded-[1rem] border px-4 text-sm outline-none"
            >
              <option value="all">{locale === "en" ? "All score states" : "Tất cả trạng thái điểm"}</option>
              <option value="scored">{locale === "en" ? "Scored" : "Đã nhập điểm"}</option>
              <option value="unscored">{locale === "en" ? "Unscored" : "Chưa nhập điểm"}</option>
            </select>
          </label>

          {activeTab === "emerging" ? (
            <label className="space-y-2">
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] theme-eyebrow">
                <Filter className="h-3.5 w-3.5" />
                {locale === "en" ? "Emerging result" : "Kết quả Ươm mầm"}
              </span>
              <select
                value={emergingRankFilter}
                onChange={(event) => setEmergingRankFilter(event.target.value as "all" | "awarded" | "not-awarded")}
                className="theme-admin-select theme-field h-12 w-full rounded-[1rem] border px-4 text-sm outline-none"
              >
                <option value="all">{locale === "en" ? "All Emerging teams" : "Tất cả đội Ươm mầm"}</option>
                <option value="awarded">{locale === "en" ? "Awarded top 10" : "Top 10 đạt giải"}</option>
                <option value="not-awarded">{locale === "en" ? "Outside top 10" : "Ngoài top 10"}</option>
              </select>
            </label>
          ) : null}
        </div>
      </Surface>

      <Surface className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[1240px] text-left text-sm">
            <thead className="border-b theme-border bg-[var(--panel-strong)] theme-text-soft">
              <tr>
                {canDeleteSubmission ? (
                  <th className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={filteredRows.length > 0 && filteredRows.every((row) => selectedSubmissionIds.includes(row.submissionId))}
                      onChange={(event) => setSelectedSubmissionIds(event.target.checked ? filteredRows.map((row) => row.submissionId) : [])}
                      aria-label={locale === "en" ? "Select all visible submissions" : "Chọn tất cả bài đang hiển thị"}
                      className="h-4 w-4 rounded border theme-border accent-[var(--brand)]"
                    />
                  </th>
                ) : null}
                {[
                  "#",
                  locale === "en" ? "Team" : "Đội",
                  locale === "en" ? "Report" : "Báo cáo",
                  locale === "en" ? "Version" : "Phiên bản",
                  locale === "en" ? "File" : "Tệp",
                  locale === "en" ? "Submitted by" : "Người nộp",
                  locale === "en" ? "Submitted at" : "Nộp lúc",
                  locale === "en" ? "Final score" : "Điểm chung kết",
                  ...(activeTab === "emerging" ? [locale === "en" ? "GPT score" : "Điểm GPT"] : []),
                  ...(activeTab === "emerging" ? [locale === "en" ? "Round 2 comparison" : "So sánh Vòng 2"] : []),
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
                  {canDeleteSubmission ? (
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedSubmissionIds.includes(row.submissionId)}
                        onChange={(event) => toggleSubmissionSelection(row.submissionId, event.target.checked)}
                        aria-label={locale === "en" ? "Select submission" : "Chọn bài nộp"}
                        className="h-4 w-4 rounded border theme-border accent-[var(--brand)]"
                      />
                    </td>
                  ) : null}
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
                    {activeTab === "emerging" ? (
                      <div className="space-y-1">
                        {typeof row.finalScore === "number" ? (
                          <>
                            <p className="text-lg font-semibold theme-text-strong">{formatScore(row.finalScore)}</p>
                            <StatusPill tone={row.emergingScoreSource === "human" ? "success" : row.emergingScoreSource === "gpt" ? "info" : "default"}>
                              {row.emergingScoreSource === "human"
                                ? locale === "en"
                                  ? "Human judge"
                                  : "Giám khảo"
                                : row.emergingScoreSource === "gpt"
                                  ? "GPT"
                                  : locale === "en"
                                    ? "Not scored"
                                    : "Chưa chấm"}
                            </StatusPill>
                            {row.emergingScoredAt ? (
                              <p className="text-xs theme-text-soft">{formatDateTime(locale, row.emergingScoredAt)}</p>
                            ) : null}
                          </>
                        ) : (
                          <StatusPill tone="warning">{locale === "en" ? "Not scored" : "Chưa chấm"}</StatusPill>
                        )}
                      </div>
                    ) : row.isLatest === "valid latest" ? (
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
                  {activeTab === "emerging" ? (
                    <td className="px-4 py-4 align-top">
                      <EmergingGptScoreCell locale={locale} row={row} />
                    </td>
                  ) : null}
                  {activeTab === "emerging" ? (
                    <td className="px-4 py-4">
                      {typeof row.finalScore === "number" && typeof row.round2Score === "number" && typeof row.scoreDifference === "number" ? (
                        <div className="space-y-1">
                          <p className="text-sm theme-text-body">
                            {locale === "en" ? "Round 2" : "Vòng 2"}: <span className="font-semibold">{formatScore(row.round2Score)}</span>
                          </p>
                          <StatusPill tone={row.scoreDifference > 0 ? "success" : row.scoreDifference < 0 ? "warning" : "default"}>
                            {row.scoreDifference > 0 ? "+" : ""}{formatScore(row.scoreDifference)}
                          </StatusPill>
                        </div>
                      ) : (
                        <StatusPill tone="warning">{locale === "en" ? "Not score" : "Chưa có điểm"}</StatusPill>
                      )}
                    </td>
                  ) : null}
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
      <AdminBulkDeleteDialog
        open={batchDeleteOpen}
        locale={locale}
        title={locale === "en" ? `Delete selected ${tabLabel} submissions?` : `Xóa các bài nộp ${tabLabel}?`}
        description={
          locale === "en"
            ? "The selected submission records and their uploaded PDFs will be removed permanently."
            : "Các bài nộp đã chọn và tệp PDF đã tải lên sẽ bị xóa vĩnh viễn."
        }
        items={selectedRows.map((row) => `${row.teamName} · ${row.title}`)}
        confirmLabel={locale === "en" ? "Delete selected submissions" : "Xóa các bài đã chọn"}
        busy={batchDeleting}
        onClose={() => setBatchDeleteOpen(false)}
        onConfirm={() => void deleteSelectedSubmissions()}
      />
    </div>
  );
}
