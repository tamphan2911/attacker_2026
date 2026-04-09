"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCheck,
  CircleDashed,
  Clock3,
  Download,
  Filter,
  LoaderCircle,
  Save,
  Search,
} from "lucide-react";

import { ADMIN_TITLE_ID, useAdminTitleScroll } from "@/components/admin-title-scroll";
import {
  ADMIN_TABLE_PAGE_SIZE,
  AdminTablePagination,
  useAdminTablePagination,
} from "@/components/admin-table-pagination";
import { useSiteState } from "@/components/providers/site-state-provider";
import { SectionHeading, StatusPill, Surface } from "@/components/site-ui";
import type { AdminRound2JudgeOption } from "@/types/admin-round2-submissions";
import type {
  AdminRound2JudgeScoreRecord,
  AdminRound2ScoreRow,
  AdminRound2ScoreStatus,
} from "@/types/admin-round2-scores";

function cn(...values: Array<string | undefined | false>) {
  return values.filter(Boolean).join(" ");
}

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
  if (typeof value !== "number") {
    return "--";
  }

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(value);
}

function matchesFilter(value: string, query: string) {
  if (!query.trim()) {
    return true;
  }

  return value.toLowerCase().includes(query.trim().toLowerCase());
}

type JudgeScoreDraft = {
  judgeUserIds: [string, string];
  scores: [string, string];
};

function createDraftFromRow(row: AdminRound2ScoreRow): JudgeScoreDraft {
  return {
    judgeUserIds: [row.judges[0]?.judgeUserId ?? "", row.judges[1]?.judgeUserId ?? ""],
    scores: [
      typeof row.judges[0]?.score === "number" ? String(row.judges[0]?.score) : "",
      typeof row.judges[1]?.score === "number" ? String(row.judges[1]?.score) : "",
    ],
  };
}

function parseDraftScore(value: string) {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function createStatusMeta(locale: "en" | "vi", status: AdminRound2ScoreStatus) {
  switch (status) {
    case "scored":
      return {
        label: locale === "en" ? "Fully scored" : "Đã chấm đủ",
        description:
          locale === "en"
            ? "Two judge scores are already saved for this Round 2 submission."
            : "Bài nộp Vòng 2 này đã có đủ hai điểm chấm từ giám khảo.",
        icon: CheckCheck,
        iconClass:
          "border-emerald-600/22 bg-[linear-gradient(135deg,rgba(16,185,129,0.18),rgba(52,211,153,0.12))] text-emerald-800 dark:border-emerald-300/20 dark:bg-emerald-300/12 dark:text-emerald-100",
      };
    case "partially-scored":
      return {
        label: locale === "en" ? "Partially scored" : "Đang chấm",
        description:
          locale === "en"
            ? "Only one judge score is saved so far."
            : "Hiện mới có một điểm chấm được lưu.",
        icon: Clock3,
        iconClass:
          "border-amber-500/24 bg-[linear-gradient(135deg,rgba(245,158,11,0.18),rgba(251,191,36,0.12))] text-amber-800 dark:border-amber-300/20 dark:bg-amber-300/12 dark:text-amber-100",
      };
    case "not-scored":
    default:
      return {
        label: locale === "en" ? "Not scored" : "Chưa chấm",
        description:
          locale === "en"
            ? "No saved judge score exists for this latest Round 2 submission yet."
            : "Hiện chưa có điểm chấm nào được lưu cho bài nộp Vòng 2 mới nhất này.",
        icon: CircleDashed,
        iconClass:
          "border-slate-500/18 bg-[linear-gradient(135deg,rgba(226,232,240,0.82),rgba(241,245,249,0.94))] text-slate-700 dark:border-white/16 dark:bg-white/[0.06] dark:text-slate-200",
      };
  }
}

function StatusIconCell({
  locale,
  status,
}: {
  locale: "en" | "vi";
  status: AdminRound2ScoreStatus;
}) {
  const meta = createStatusMeta(locale, status);
  const Icon = meta.icon;

  return (
    <div className="flex justify-center">
      <div className="group relative inline-flex">
        <span className={cn("inline-flex h-11 w-11 items-center justify-center rounded-full border", meta.iconClass)}>
          <Icon className="h-4.5 w-4.5" />
        </span>
        <span className="theme-header-tooltip pointer-events-none absolute left-1/2 top-full z-30 mt-3 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1.5 text-[0.68rem] font-medium opacity-0 transition duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
          {meta.description}
        </span>
      </div>
    </div>
  );
}

function JudgeScoreCell({
  locale,
  judge,
  canEdit = false,
  availableJudges = [],
  selectedJudgeId = "",
  otherSelectedJudgeId = "",
  scoreValue = "",
  onJudgeChange,
  onScoreChange,
}: {
  locale: "en" | "vi";
  judge?: AdminRound2JudgeScoreRecord;
  canEdit?: boolean;
  availableJudges?: AdminRound2JudgeOption[];
  selectedJudgeId?: string;
  otherSelectedJudgeId?: string;
  scoreValue?: string;
  onJudgeChange?: (value: string) => void;
  onScoreChange?: (value: string) => void;
}) {
  const selectedJudge =
    availableJudges.find((option) => option.judgeUserId === selectedJudgeId) ??
    (judge
      ? {
          judgeUserId: judge.judgeUserId,
          judgeName: judge.judgeName,
          judgeProfileId: judge.judgeProfileId,
          judgeLoginId: "",
          organization: "",
        }
      : undefined);

  if (!canEdit && !judge) {
    return (
      <div className="space-y-1">
        <p className="text-sm font-semibold theme-text-soft">
          {locale === "en" ? "Waiting for judge" : "Đang chờ giám khảo"}
        </p>
        <p className="text-xs theme-text-muted">--</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {selectedJudge ? (
        selectedJudge.judgeProfileId ? (
          <Link
            href={`/admin/judges#judge-row-${selectedJudge.judgeProfileId}`}
            className="inline-flex max-w-[220px] truncate font-semibold theme-text-strong transition hover:opacity-80"
          >
            {selectedJudge.judgeName}
          </Link>
        ) : (
          <p className="font-semibold theme-text-strong">{selectedJudge.judgeName}</p>
        )
      ) : (
        <p className="text-sm font-semibold theme-text-soft">
          {locale === "en" ? "Select judge" : "Chọn giám khảo"}
        </p>
      )}

      {canEdit ? (
        <>
          <select
            value={selectedJudgeId}
            onChange={(event) => onJudgeChange?.(event.target.value)}
            className="theme-field h-10 w-full rounded-[0.95rem] border px-3 text-sm outline-none"
          >
            <option value="">{locale === "en" ? "Select Round 2 judge" : "Chọn giám khảo Vòng 2"}</option>
            {availableJudges.map((option) => (
              <option
                key={option.judgeUserId}
                value={option.judgeUserId}
                disabled={Boolean(otherSelectedJudgeId && option.judgeUserId === otherSelectedJudgeId)}
              >
                {option.judgeName} {option.organization ? `· ${option.organization}` : ""}
              </option>
            ))}
          </select>
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={scoreValue}
            onChange={(event) => onScoreChange?.(event.target.value)}
            placeholder={locale === "en" ? "Score" : "Điểm"}
            className="theme-field h-10 w-full rounded-[0.95rem] border px-3 text-sm outline-none"
          />
        </>
      ) : null}

      <p className="text-xs theme-text-soft">
        {typeof judge?.score === "number"
          ? `${locale === "en" ? "Score" : "Điểm"} ${formatScore(judge.score)}`
          : locale === "en"
            ? "No saved score"
            : "Chưa có điểm"}
      </p>
    </div>
  );
}

function LoadingState({ locale }: { locale: "en" | "vi" }) {
  return (
    <SectionHeading
      eyebrow={locale === "en" ? "Round 2 scores" : "Điểm Vòng 2"}
      title={locale === "en" ? "Loading Round 2 score records..." : "Đang tải dữ liệu điểm Vòng 2..."}
    />
  );
}

function ErrorState({ locale, message }: { locale: "en" | "vi"; message: string }) {
  return (
    <Surface className="px-6 py-6 md:px-8 md:py-8">
      <SectionHeading
        eyebrow={locale === "en" ? "Round 2 scores" : "Điểm Vòng 2"}
        title={locale === "en" ? "Could not load Round 2 scores." : "Không thể tải điểm Vòng 2."}
        description={message}
      />
    </Surface>
  );
}

export function AdminRound2ScoresManager() {
  const { locale } = useSiteState();
  const [rows, setRows] = useState<AdminRound2ScoreRow[]>([]);
  const [availableJudges, setAvailableJudges] = useState<AdminRound2JudgeOption[]>([]);
  const [round2Closed, setRound2Closed] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, JudgeScoreDraft>>({});
  const [loading, setLoading] = useState(true);
  const [savingSubmissionId, setSavingSubmissionId] = useState<string | null>(null);
  const [rowNotice, setRowNotice] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | AdminRound2ScoreStatus>("all");
  useAdminTitleScroll();

  const loadData = useCallback(async () => {
    const response = await fetch("/api/admin/round-2/scores", { cache: "no-store" });
    const payload = (await response.json().catch(() => null)) as
      | {
          scores?: AdminRound2ScoreRow[];
          availableJudges?: AdminRound2JudgeOption[];
          round2Closed?: boolean;
          error?: string;
        }
      | null;

    if (!response.ok || !payload?.scores || !payload?.availableJudges || typeof payload.round2Closed !== "boolean") {
      throw new Error(payload?.error ?? (locale === "en" ? "Could not load Round 2 scores." : "Không thể tải điểm Vòng 2."));
    }

    setRows(payload.scores);
    setAvailableJudges(payload.availableJudges);
    setRound2Closed(payload.round2Closed);
    setDrafts(Object.fromEntries(payload.scores.map((row) => [row.submissionId, createDraftFromRow(row)])));
  }, [locale]);

  useEffect(() => {
    let active = true;

    const run = async () => {
      try {
        setLoading(true);
        setError("");
        await loadData();
      } catch (nextError) {
        if (active) {
          setError(nextError instanceof Error ? nextError.message : locale === "en" ? "Unexpected error." : "Có lỗi bất ngờ.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void run();

    return () => {
      active = false;
    };
  }, [loadData, locale]);

  const updateDraftJudge = (submissionId: string, index: 0 | 1, judgeUserId: string) => {
    setDrafts((current) => {
      const next = current[submissionId] ?? { judgeUserIds: ["", ""], scores: ["", ""] };
      const judgeUserIds = [...next.judgeUserIds] as [string, string];
      judgeUserIds[index] = judgeUserId;

      return {
        ...current,
        [submissionId]: {
          ...next,
          judgeUserIds,
        },
      };
    });
  };

  const updateDraftScore = (submissionId: string, index: 0 | 1, score: string) => {
    setDrafts((current) => {
      const next = current[submissionId] ?? { judgeUserIds: ["", ""], scores: ["", ""] };
      const scores = [...next.scores] as [string, string];
      scores[index] = score;

      return {
        ...current,
        [submissionId]: {
          ...next,
          scores,
        },
      };
    });
  };

  const saveRow = async (row: AdminRound2ScoreRow) => {
    const draft = drafts[row.submissionId] ?? createDraftFromRow(row);
    setSavingSubmissionId(row.submissionId);
    setRowNotice((current) => ({ ...current, [row.submissionId]: "" }));

    const response = await fetch(`/api/admin/round-2/scores/${row.submissionId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        judges: draft.judgeUserIds.map((judgeUserId, index) => ({
          judgeUserId,
          score: parseDraftScore(draft.scores[index]),
        })),
      }),
    });

    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    if (!response.ok) {
      setRowNotice((current) => ({
        ...current,
        [row.submissionId]: payload?.error ?? (locale === "en" ? "Could not save this row." : "Không thể lưu dòng này."),
      }));
      setSavingSubmissionId(null);
      return;
    }

    setRowNotice((current) => ({
      ...current,
      [row.submissionId]: locale === "en" ? "Saved." : "Đã lưu.",
    }));
    await loadData();
    setSavingSubmissionId(null);
  };

  const filteredRows = useMemo(
    () =>
      rows.filter((row) => {
        const searchSource = [
          row.teamName,
          row.teamTag,
          row.title,
          row.resourceLabel,
          row.submittedByName,
          row.submittedByLoginId,
          ...row.judges.map((judge) => judge.judgeName),
        ].join(" ");

        if (!matchesFilter(searchSource, search)) {
          return false;
        }

        if (statusFilter !== "all" && row.status !== statusFilter) {
          return false;
        }

        return true;
      }),
    [rows, search, statusFilter],
  );

  const {
    page,
    setPage,
    pageCount,
    startIndex,
    paginatedRows,
  } = useAdminTablePagination(filteredRows, ADMIN_TABLE_PAGE_SIZE);

  if (loading) {
    return <LoadingState locale={locale} />;
  }

  if (error) {
    return <ErrorState locale={locale} message={error} />;
  }

  return (
    <div className="space-y-6">
      <div id={ADMIN_TITLE_ID} className="scroll-mt-32 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="theme-heading text-3xl font-semibold theme-text-strong">
            {locale === "en" ? "Round 2 scores" : "Điểm Vòng 2"}
          </p>
          <p className="mt-3 text-sm leading-7 theme-text-muted">
            {locale === "en"
              ? "Track the latest Round 2 submission of each team, assign the two Round 2 judges after the deadline, and save their scores directly in the table."
              : "Theo dõi bài nộp Vòng 2 mới nhất của từng đội, phân hai giám khảo Vòng 2 sau hạn nộp và lưu điểm trực tiếp ngay trong bảng."}
          </p>
        </div>
        <StatusPill tone="info">
          {locale === "en" ? `${rows.length} teams` : `${rows.length} đội`}
        </StatusPill>
      </div>

      <Surface className="px-5 py-4 md:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <StatusPill tone={round2Closed ? "success" : "warning"}>
            {round2Closed
              ? locale === "en"
                ? "Round 2 deadline closed"
                : "Đã đóng hạn nộp Vòng 2"
              : locale === "en"
                ? "Round 2 deadline still open"
                : "Hạn nộp Vòng 2 vẫn đang mở"}
          </StatusPill>
          <p className="text-sm theme-text-soft">
            {round2Closed
              ? locale === "en"
                ? "Judge assignment and score entry are now enabled here."
                : "Chức năng phân giám khảo và nhập điểm hiện đã được mở tại đây."
              : locale === "en"
                ? "This table becomes editable automatically after the Round 2 submission deadline saved in Timeline."
                : "Bảng này sẽ tự mở quyền chỉnh sửa sau khi hết hạn nộp Vòng 2 đã lưu ở Timeline."}
          </p>
        </div>
      </Surface>

      <Surface className="px-5 py-5 md:px-6">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_240px]">
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
                placeholder={locale === "en" ? "Search by team, judge, file, submitter..." : "Tìm theo đội, giám khảo, tệp, người nộp..."}
                className="theme-field h-12 w-full rounded-[1rem] border pl-10 pr-4 text-sm outline-none"
              />
            </div>
          </label>

          <label className="space-y-2">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] theme-eyebrow">
              <Filter className="h-3.5 w-3.5" />
              {locale === "en" ? "Score status" : "Trạng thái chấm điểm"}
            </span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as "all" | AdminRound2ScoreStatus)}
              className="theme-field h-12 w-full rounded-[1rem] border px-4 text-sm outline-none"
            >
              <option value="all">{locale === "en" ? "All statuses" : "Tất cả trạng thái"}</option>
              <option value="not-scored">{locale === "en" ? "Not scored" : "Chưa chấm"}</option>
              <option value="partially-scored">{locale === "en" ? "Partially scored" : "Đang chấm"}</option>
              <option value="scored">{locale === "en" ? "Fully scored" : "Đã chấm đủ"}</option>
            </select>
          </label>
        </div>
      </Surface>

      <Surface className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[1480px] text-left text-sm">
            <thead className="border-b theme-border bg-[var(--panel-strong)] theme-text-soft">
              <tr>
                {[
                  "#",
                  locale === "en" ? "Team" : "Đội",
                  locale === "en" ? "Judge 1" : "Giám khảo 1",
                  locale === "en" ? "Judge 2" : "Giám khảo 2",
                  locale === "en" ? "Average" : "Điểm trung bình",
                  locale === "en" ? "Status" : "Trạng thái",
                  locale === "en" ? "File" : "Tệp",
                  locale === "en" ? "Submitted" : "Nộp lúc",
                  locale === "en" ? "Version" : "Phiên bản",
                  locale === "en" ? "Action" : "Thao tác",
                ].map((label) => (
                  <th key={label} className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row, index) => {
                const draft = drafts[row.submissionId] ?? createDraftFromRow(row);
                const draftScores = draft.scores
                  .map((score) => parseDraftScore(score))
                  .filter((score): score is number => typeof score === "number");
                const draftAverage =
                  draftScores.length > 0
                    ? draftScores.reduce((total, score) => total + score, 0) / draftScores.length
                    : undefined;
                const canSave =
                  round2Closed &&
                  draft.judgeUserIds.every((judgeUserId) => judgeUserId.trim()) &&
                  draft.judgeUserIds[0] !== draft.judgeUserIds[1];

                return (
                  <tr key={row.submissionId} className="border-b theme-border last:border-b-0">
                    <td className="px-4 py-4 font-medium theme-text-soft">{startIndex + index + 1}</td>
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <Link href={`/admin/teams/${row.teamId}`} className="inline-flex max-w-[260px] truncate font-semibold theme-text-strong transition hover:opacity-80">
                          {row.teamName}
                        </Link>
                        <p className="text-xs theme-text-soft">{`#${row.teamTag} · ${row.title}`}</p>
                        <Link href={`/admin/users/${row.submittedByUserId}/profile`} className="text-xs theme-text-muted transition hover:opacity-80">
                          {locale === "en" ? "Submitted by" : "Nộp bởi"} {row.submittedByName} ({row.submittedByLoginId})
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <JudgeScoreCell
                        locale={locale}
                        judge={row.judges[0]}
                        canEdit={round2Closed}
                        availableJudges={availableJudges}
                        selectedJudgeId={draft.judgeUserIds[0]}
                        otherSelectedJudgeId={draft.judgeUserIds[1]}
                        scoreValue={draft.scores[0]}
                        onJudgeChange={(value) => updateDraftJudge(row.submissionId, 0, value)}
                        onScoreChange={(value) => updateDraftScore(row.submissionId, 0, value)}
                      />
                    </td>
                    <td className="px-4 py-4 align-top">
                      <JudgeScoreCell
                        locale={locale}
                        judge={row.judges[1]}
                        canEdit={round2Closed}
                        availableJudges={availableJudges}
                        selectedJudgeId={draft.judgeUserIds[1]}
                        otherSelectedJudgeId={draft.judgeUserIds[0]}
                        scoreValue={draft.scores[1]}
                        onJudgeChange={(value) => updateDraftJudge(row.submissionId, 1, value)}
                        onScoreChange={(value) => updateDraftScore(row.submissionId, 1, value)}
                      />
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="space-y-1">
                        <p className="text-lg font-semibold theme-text-strong">{formatScore(round2Closed ? draftAverage : row.averageScore)}</p>
                        <p className="text-xs theme-text-soft">
                          {typeof (round2Closed ? draftAverage : row.averageScore) === "number"
                            ? locale === "en"
                              ? "Final average"
                              : "Điểm cuối"
                            : locale === "en"
                              ? "Awaiting scores"
                              : "Đang chờ điểm"}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <StatusIconCell locale={locale} status={row.status} />
                    </td>
                    <td className="px-4 py-4 align-top">
                      {row.resourceUrl ? (
                        <div className="flex justify-center">
                          <div className="group relative inline-flex">
                            <a
                              href={row.resourceUrl}
                              target={row.resourceSource === "external" ? "_blank" : undefined}
                              rel={row.resourceSource === "external" ? "noreferrer" : undefined}
                              download={row.resourceSource === "upload" ? row.resourceLabel : undefined}
                              aria-label={locale === "en" ? "Download submission file" : "Tải tệp bài nộp"}
                              className="theme-button-secondary inline-flex h-10 w-10 items-center justify-center rounded-full border"
                            >
                              <Download className="h-4 w-4" />
                            </a>
                            <span className="theme-header-tooltip pointer-events-none absolute left-1/2 top-full z-30 mt-3 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1.5 text-[0.68rem] font-medium opacity-0 transition duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
                              {locale === "en" ? "Download submission file" : "Tải tệp bài nộp"}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-center">
                          <div className="group relative inline-flex">
                            <span className="theme-button-secondary inline-flex h-10 w-10 items-center justify-center rounded-full border opacity-45">
                              <Download className="h-4 w-4" />
                            </span>
                            <span className="theme-header-tooltip pointer-events-none absolute left-1/2 top-full z-30 mt-3 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1.5 text-[0.68rem] font-medium opacity-0 transition duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
                              {locale === "en" ? "No file available" : "Không có tệp khả dụng"}
                            </span>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <p className="theme-text-body">{formatDateTime(locale, row.submittedAt)}</p>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <StatusPill>{`${locale === "en" ? "v" : "bản"}${row.version}`}</StatusPill>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="flex flex-col items-center gap-2">
                        <div className="group relative inline-flex">
                          <button
                            type="button"
                            onClick={() => void saveRow(row)}
                            disabled={!canSave || savingSubmissionId === row.submissionId}
                            className="theme-button-primary inline-flex h-10 w-10 items-center justify-center rounded-full disabled:opacity-45"
                            aria-label={locale === "en" ? "Save judge assignment and scores" : "Lưu phân giám khảo và điểm"}
                          >
                            {savingSubmissionId === row.submissionId ? (
                              <LoaderCircle className="h-4 w-4 animate-spin" />
                            ) : (
                              <Save className="h-4 w-4" />
                            )}
                          </button>
                          <span className="theme-header-tooltip pointer-events-none absolute left-1/2 top-full z-30 mt-3 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1.5 text-[0.68rem] font-medium opacity-0 transition duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
                            {locale === "en" ? "Save this row" : "Lưu dòng này"}
                          </span>
                        </div>
                        {rowNotice[row.submissionId] ? (
                          <p className="max-w-[180px] text-center text-[0.72rem] leading-5 theme-text-soft">
                            {rowNotice[row.submissionId]}
                          </p>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <AdminTablePagination
          locale={locale}
          page={page}
          pageCount={pageCount}
          pageSize={ADMIN_TABLE_PAGE_SIZE}
          totalRows={filteredRows.length}
          onPageChange={setPage}
        />
      </Surface>
    </div>
  );
}
