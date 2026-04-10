"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ArrowUpDown,
  BookText,
  CircleDashed,
  Clock3,
  FileQuestion,
  Eye,
  Filter,
  ListFilter,
  Save,
  Search,
  ShieldCheck,
  Target,
  UserRound,
  CheckCircle2,
} from "lucide-react";

import { ADMIN_TITLE_ID, useAdminTitleScroll } from "@/components/admin-title-scroll";
import {
  ADMIN_TABLE_PAGE_SIZE,
  AdminTablePagination,
  useAdminTablePagination,
} from "@/components/admin-table-pagination";
import { useSiteState } from "@/components/providers/site-state-provider";
import { PageIntro, SectionHeading, StatusPill, Surface } from "@/components/site-ui";
import { pickRoundLabel } from "@/lib/competition";
import {
  ROUND1_ESSAY_MAX_SCORE,
  ROUND1_ESSAY_WORD_LIMIT,
  getRound1QuestionOptionPreview,
  pickRound1QuestionText,
  pickRound1TypeLabel,
} from "@/lib/round1";
import { estimateEssayAiLikelihood } from "@/lib/essay-ai-guard";
import { pickText } from "@/lib/site";
import type {
  AdminRound1ExamDetail,
  AdminRound1ExamListRow,
  AdminRound1ExamStatus,
} from "@/types/admin-round1-exams";
import type { CompetitionStage } from "@/types/site";

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

function formatScoreValue(value?: number | null) {
  if (typeof value !== "number") {
    return "--";
  }

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(value);
}

type Round1ExamSortKey =
  | "participant"
  | "team"
  | "stage"
  | "status"
  | "objectiveScore"
  | "essayScore"
  | "totalScore"
  | "lastUpdate";

type SortDirection = "asc" | "desc";

function createStringCompare(locale: "en" | "vi") {
  const collator = new Intl.Collator(locale === "vi" ? "vi-VN" : "en-US", {
    numeric: true,
    sensitivity: "base",
  });

  return (left: string, right: string) => collator.compare(left, right);
}

function getDefaultSortDirection(sortKey: Round1ExamSortKey): SortDirection {
  switch (sortKey) {
    case "objectiveScore":
    case "essayScore":
    case "totalScore":
    case "lastUpdate":
      return "desc";
    default:
      return "asc";
  }
}

function SortableHeader({
  label,
  active,
  direction,
  onClick,
}: {
  label: string;
  active: boolean;
  direction: SortDirection;
  onClick: () => void;
}) {
  const Icon = active ? (direction === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 transition",
        active ? "theme-text-strong" : "hover:theme-text-strong",
      )}
    >
      <span>{label}</span>
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

function createStageLabel(locale: "en" | "vi", stage: CompetitionStage) {
  return pickRoundLabel(locale, stage);
}

function createStatusMeta(locale: "en" | "vi", status: AdminRound1ExamStatus) {
  switch (status) {
    case "submitted":
      return {
        label: locale === "en" ? "Submitted" : "Đã nộp",
        description:
          locale === "en"
            ? "This user has completed and submitted the official Round 1 exam."
            : "Người dùng này đã hoàn thành và nộp bài thi Vòng 1 chính thức.",
        icon: CheckCircle2,
        iconClass:
          "border-emerald-600/22 bg-[linear-gradient(135deg,rgba(16,185,129,0.18),rgba(52,211,153,0.12))] text-emerald-800 dark:border-emerald-300/20 dark:bg-emerald-300/12 dark:text-emerald-100",
      };
    case "in-progress":
      return {
        label: locale === "en" ? "In progress" : "Đang làm bài",
        description:
          locale === "en"
            ? "The exam has started and still has a live saved attempt."
            : "Bài thi đã được khởi tạo và hiện vẫn còn lượt làm đang lưu.",
        icon: Clock3,
        iconClass:
          "border-sky-600/22 bg-[linear-gradient(135deg,rgba(14,165,233,0.18),rgba(59,130,246,0.12))] text-sky-800 dark:border-sky-300/20 dark:bg-sky-300/12 dark:text-sky-100",
      };
    case "not-initiated":
    default:
      return {
        label: locale === "en" ? "Not initiated" : "Chưa khởi tạo",
        description:
          locale === "en"
            ? "This eligible user has not started the official Round 1 exam yet."
            : "Người dùng đủ điều kiện này vẫn chưa bắt đầu bài thi Vòng 1 chính thức.",
        icon: CircleDashed,
        iconClass:
          "border-slate-500/18 bg-[linear-gradient(135deg,rgba(226,232,240,0.82),rgba(241,245,249,0.94))] text-slate-700 dark:border-white/16 dark:bg-white/[0.06] dark:text-slate-200",
      };
  }
}

function matchFilter(value: string, filter: string) {
  if (!filter.trim()) {
    return true;
  }

  return value.toLowerCase().includes(filter.trim().toLowerCase());
}

function StatusIconCell({
  locale,
  status,
}: {
  locale: "en" | "vi";
  status: AdminRound1ExamStatus;
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

function ExamListLoading({ locale }: { locale: "en" | "vi" }) {
  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow={locale === "en" ? "Round 1 exam" : "Bài thi Vòng 1"}
        title={locale === "en" ? "Loading eligible Round 1 exams..." : "Đang tải danh sách bài thi Vòng 1..."}
      />
    </div>
  );
}

function ExamListError({ locale, message }: { locale: "en" | "vi"; message: string }) {
  return (
    <Surface className="px-6 py-6 md:px-8 md:py-8">
      <SectionHeading
        eyebrow={locale === "en" ? "Round 1 exam" : "Bài thi Vòng 1"}
        title={locale === "en" ? "Could not load exam records." : "Không thể tải dữ liệu bài thi."}
        description={message}
      />
    </Surface>
  );
}

export function AdminRound1ExamList() {
  const { locale } = useSiteState();
  const [rows, setRows] = useState<AdminRound1ExamListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | AdminRound1ExamStatus>("all");
  const [stageFilter, setStageFilter] = useState<"all" | CompetitionStage>("all");
  const [sortKey, setSortKey] = useState<Round1ExamSortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  useAdminTitleScroll();

  useEffect(() => {
    let active = true;

    const run = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await fetch("/api/admin/round-1/exams", { cache: "no-store" });
        const payload = (await response.json().catch(() => null)) as
          | { exams?: AdminRound1ExamListRow[]; error?: string }
          | null;

        if (!response.ok || !payload?.exams) {
          throw new Error(payload?.error ?? (locale === "en" ? "Could not load exam records." : "Không thể tải dữ liệu bài thi."));
        }

        if (active) {
          setRows(payload.exams);
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
    };

    void run();

    return () => {
      active = false;
    };
  }, [locale]);

  const filteredRows = useMemo(
    () =>
      rows.filter((row) => {
        const searchSource = [row.name, row.loginId, row.email, row.teamName, row.university, row.major].join(" ");
        if (!matchFilter(searchSource, search)) {
          return false;
        }

        if (statusFilter !== "all" && row.status !== statusFilter) {
          return false;
        }

        if (stageFilter !== "all" && row.teamStage !== stageFilter) {
          return false;
        }

        return true;
      }),
    [rows, search, stageFilter, statusFilter],
  );

  const sortedRows = useMemo(() => {
    if (!sortKey) {
      return filteredRows;
    }

    const compareStrings = createStringCompare(locale);
    const statusRank: Record<AdminRound1ExamStatus, number> = {
      submitted: 3,
      "in-progress": 2,
      "not-initiated": 1,
    };
    const stageRank: Record<CompetitionStage, number> = {
      "round-1": 1,
      "round-2": 2,
      "round-3": 3,
    };

    return [...filteredRows].sort((left, right) => {
      let comparison = 0;

      switch (sortKey) {
        case "participant":
          comparison = compareStrings(left.name, right.name);
          break;
        case "team":
          comparison = compareStrings(left.teamName, right.teamName);
          break;
        case "stage":
          comparison = stageRank[left.teamStage] - stageRank[right.teamStage];
          break;
        case "status":
          comparison = statusRank[left.status] - statusRank[right.status];
          break;
        case "objectiveScore": {
          const leftValue = left.objectiveScore ?? Number.NEGATIVE_INFINITY;
          const rightValue = right.objectiveScore ?? Number.NEGATIVE_INFINITY;
          comparison = leftValue === rightValue ? 0 : leftValue < rightValue ? -1 : 1;
          break;
        }
        case "essayScore": {
          const leftValue = left.essayScore ?? Number.NEGATIVE_INFINITY;
          const rightValue = right.essayScore ?? Number.NEGATIVE_INFINITY;
          comparison = leftValue === rightValue ? 0 : leftValue < rightValue ? -1 : 1;
          break;
        }
        case "totalScore": {
          const leftValue = left.totalScore ?? Number.NEGATIVE_INFINITY;
          const rightValue = right.totalScore ?? Number.NEGATIVE_INFINITY;
          comparison = leftValue === rightValue ? 0 : leftValue < rightValue ? -1 : 1;
          break;
        }
        case "lastUpdate":
          comparison = compareStrings(
            left.submittedAt ?? left.updatedAt ?? left.startedAt ?? "",
            right.submittedAt ?? right.updatedAt ?? right.startedAt ?? "",
          );
          break;
      }

      if (comparison === 0) {
        comparison = compareStrings(left.name, right.name);
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [filteredRows, locale, sortDirection, sortKey]);

  const {
    page,
    setPage,
    pageCount,
    startIndex,
    paginatedRows,
  } = useAdminTablePagination(sortedRows, ADMIN_TABLE_PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search, setPage, sortDirection, sortKey, stageFilter, statusFilter]);

  const toggleSort = (nextSortKey: Round1ExamSortKey) => {
    if (sortKey === nextSortKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextSortKey);
    setSortDirection(getDefaultSortDirection(nextSortKey));
  };

  if (loading) {
    return <ExamListLoading locale={locale} />;
  }

  if (error) {
    return <ExamListError locale={locale} message={error} />;
  }

  return (
    <div className="space-y-6">
      <div
        id={ADMIN_TITLE_ID}
        className="scroll-mt-32 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"
      >
        <div className="max-w-3xl">
          <p className="theme-heading text-3xl font-semibold theme-text-strong">
            {locale === "en" ? "Round 1 exam" : "Bài thi Vòng 1"}
          </p>
          <p className="mt-3 text-sm leading-7 theme-text-muted">
            {locale === "en"
              ? "List every eligible student who can or could take the official Round 1 exam, including the current attempt status and direct drill-down into the saved paper."
              : "Liệt kê mọi thí sinh đủ điều kiện đã hoặc có thể vào bài thi Vòng 1 chính thức, kèm trạng thái hiện tại và liên kết đi sâu vào đề thi đã lưu."}
          </p>
        </div>
        <StatusPill tone="info">
          {locale === "en" ? `${rows.length} eligible exams` : `${rows.length} bài thi đủ điều kiện`}
        </StatusPill>
      </div>

      <Surface className="px-5 py-5 md:px-6">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.35fr)_220px_220px]">
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
                placeholder={locale === "en" ? "Search by name, login, email, team, university..." : "Tìm theo tên, ID, email, đội, trường..."}
                className="theme-field h-12 w-full rounded-[1rem] border pl-10 pr-4 text-sm outline-none"
              />
            </div>
          </label>

          <label className="space-y-2">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] theme-eyebrow">
              <Filter className="h-3.5 w-3.5" />
              {locale === "en" ? "Status" : "Trạng thái"}
            </span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as "all" | AdminRound1ExamStatus)}
              className="theme-field h-12 w-full rounded-[1rem] border px-4 text-sm outline-none"
            >
              <option value="all">{locale === "en" ? "All statuses" : "Tất cả trạng thái"}</option>
              <option value="not-initiated">{locale === "en" ? "Not initiated" : "Chưa khởi tạo"}</option>
              <option value="in-progress">{locale === "en" ? "In progress" : "Đang làm bài"}</option>
              <option value="submitted">{locale === "en" ? "Submitted" : "Đã nộp"}</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] theme-eyebrow">
              <ListFilter className="h-3.5 w-3.5" />
              {locale === "en" ? "Current stage" : "Vị trí hiện tại"}
            </span>
            <select
              value={stageFilter}
              onChange={(event) => setStageFilter(event.target.value as "all" | CompetitionStage)}
              className="theme-field h-12 w-full rounded-[1rem] border px-4 text-sm outline-none"
            >
              <option value="all">{locale === "en" ? "All stages" : "Tất cả giai đoạn"}</option>
              <option value="round-1">{locale === "en" ? "Round 1" : "Vòng 1"}</option>
              <option value="round-2">{locale === "en" ? "Round 2" : "Vòng 2"}</option>
              <option value="round-3">{locale === "en" ? "Round 3" : "Vòng 3"}</option>
            </select>
          </label>
        </div>
      </Surface>

      <Surface className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[1320px] text-left text-sm">
            <thead className="border-b theme-border bg-[var(--panel-strong)] theme-text-soft">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">#</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                  <SortableHeader
                    label={locale === "en" ? "Participant" : "Thí sinh"}
                    active={sortKey === "participant"}
                    direction={sortDirection}
                    onClick={() => toggleSort("participant")}
                  />
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                  <SortableHeader
                    label={locale === "en" ? "Team" : "Đội"}
                    active={sortKey === "team"}
                    direction={sortDirection}
                    onClick={() => toggleSort("team")}
                  />
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                  <SortableHeader
                    label={locale === "en" ? "Current stage" : "Vị trí hiện tại"}
                    active={sortKey === "stage"}
                    direction={sortDirection}
                    onClick={() => toggleSort("stage")}
                  />
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                  <SortableHeader
                    label={locale === "en" ? "Status" : "Trạng thái"}
                    active={sortKey === "status"}
                    direction={sortDirection}
                    onClick={() => toggleSort("status")}
                  />
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                  <SortableHeader
                    label={locale === "en" ? "Multiple choice score" : "Điểm trắc nghiệm"}
                    active={sortKey === "objectiveScore"}
                    direction={sortDirection}
                    onClick={() => toggleSort("objectiveScore")}
                  />
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                  <SortableHeader
                    label={locale === "en" ? "Essay score" : "Điểm tự luận"}
                    active={sortKey === "essayScore"}
                    direction={sortDirection}
                    onClick={() => toggleSort("essayScore")}
                  />
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                  <SortableHeader
                    label={locale === "en" ? "Total score" : "Tổng điểm"}
                    active={sortKey === "totalScore"}
                    direction={sortDirection}
                    onClick={() => toggleSort("totalScore")}
                  />
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                  <SortableHeader
                    label={locale === "en" ? "Last update" : "Cập nhật gần nhất"}
                    active={sortKey === "lastUpdate"}
                    direction={sortDirection}
                    onClick={() => toggleSort("lastUpdate")}
                  />
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                  {locale === "en" ? "Detail" : "Chi tiết"}
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row, index) => (
                <tr key={row.userId} className="border-b theme-border last:border-b-0">
                  <td className="px-4 py-4 font-medium theme-text-soft">{startIndex + index + 1}</td>
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      <Link
                        href={`/admin/users/${row.userId}/profile`}
                        className="font-semibold theme-text-strong transition hover:theme-accent focus-visible:theme-accent"
                      >
                        {row.name}
                      </Link>
                      <p className="text-xs theme-text-soft">{row.loginId}</p>
                      <p className="text-xs theme-text-muted">{row.university}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      <Link
                        href={`/admin/teams/${row.teamId}`}
                        className="font-semibold theme-text-strong transition hover:theme-accent focus-visible:theme-accent"
                      >
                        {row.teamName}
                      </Link>
                      <p className="text-xs theme-text-soft">{`#${row.teamTag}`}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <StatusPill>{createStageLabel(locale, row.teamStage)}</StatusPill>
                  </td>
                  <td className="px-4 py-4">
                    <StatusIconCell locale={locale} status={row.status} />
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-semibold theme-text-strong">{formatScoreValue(row.objectiveScore)}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-semibold theme-text-strong">{formatScoreValue(row.essayScore)}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-semibold theme-text-strong">{formatScoreValue(row.totalScore)}</p>
                  </td>
                  <td className="px-4 py-4">
                    <div className="space-y-1 text-xs">
                      <p className="theme-text-body">
                        {formatDateTime(locale, row.submittedAt ?? row.updatedAt ?? row.startedAt)}
                      </p>
                      <p className="theme-text-soft">
                        {row.submittedAt
                          ? locale === "en"
                            ? "Submitted"
                            : "Đã nộp"
                          : row.deadlineAt
                            ? `${locale === "en" ? "Deadline" : "Hạn"} ${formatDateTime(locale, row.deadlineAt)}`
                            : "--"}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    {row.detailAvailable ? (
                      <Link
                        href={`/admin/round-1/exams/${row.userId}`}
                        title={locale === "en" ? "Open exam detail" : "Mở chi tiết bài thi"}
                        aria-label={locale === "en" ? "Open exam detail" : "Mở chi tiết bài thi"}
                        className="theme-button-secondary inline-flex h-10 w-10 items-center justify-center rounded-full border"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                    ) : (
                      <button
                        type="button"
                        disabled
                        title={locale === "en" ? "No saved exam exists yet." : "Chưa có đề thi nào được lưu."}
                        aria-label={locale === "en" ? "No saved exam exists yet." : "Chưa có đề thi nào được lưu."}
                        className="theme-button-secondary inline-flex h-10 w-10 items-center justify-center rounded-full border opacity-45"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
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

function DetailLoading({ locale }: { locale: "en" | "vi" }) {
  return (
    <SectionHeading
      eyebrow={locale === "en" ? "Round 1 exam" : "Bài thi Vòng 1"}
      title={locale === "en" ? "Loading exam detail..." : "Đang tải chi tiết bài thi..."}
    />
  );
}

function DetailError({ locale, message }: { locale: "en" | "vi"; message: string }) {
  return (
    <Surface className="px-6 py-6 md:px-8 md:py-8">
      <SectionHeading
        eyebrow={locale === "en" ? "Round 1 exam" : "Bài thi Vòng 1"}
        title={locale === "en" ? "Round 1 exam not found." : "Không tìm thấy bài thi Vòng 1."}
        description={message}
      />
    </Surface>
  );
}

function OptionAnswerList({
  locale,
  question,
}: {
  locale: "en" | "vi";
  question: AdminRound1ExamDetail["questions"][number];
}) {
  const selectedOptionIds = question.response?.selectedOptionIds ?? [];

  return (
    <div className="space-y-2">
      {(question.options ?? []).map((option) => {
        const isSelected = selectedOptionIds.includes(option.id);

        return (
          <div
            key={option.id}
            className={cn(
              "rounded-[1rem] border px-4 py-3 text-sm leading-7",
              isSelected
                ? "border-sky-500/24 bg-sky-500/10 theme-text-strong"
                : "theme-border bg-white/78 theme-text-body dark:bg-white/[0.04]",
            )}
          >
            <span className="mr-2 font-semibold">{option.displayLabel ?? option.label}.</span>
            {pickRound1QuestionText(option.text)}
            {isSelected ? (
              <span className="ml-2 text-xs font-medium theme-text-soft">
                {locale === "en" ? "(Selected)" : "(Đã chọn)"}
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function PairingAnswerList({
  locale,
  question,
}: {
  locale: "en" | "vi";
  question: AdminRound1ExamDetail["questions"][number];
}) {
  const matches = question.response?.pairingMatches ?? {};
  const optionMap = new Map((question.options ?? []).map((option) => [option.id, option]));

  return (
    <div className="space-y-2">
      {(question.pairingItems ?? []).map((item) => {
        const chosenOption = matches[item.id] ? optionMap.get(matches[item.id]) : undefined;
        return (
          <div key={item.id} className="grid gap-2 rounded-[1rem] border theme-border bg-white/78 px-4 py-3 text-sm dark:bg-white/[0.04] md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] theme-eyebrow">
                {locale === "en" ? "Prompt" : "Vế trái"}
              </p>
              <p className="mt-2 leading-7 theme-text-body">{pickRound1QuestionText(item.prompt)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] theme-eyebrow">
                {locale === "en" ? "Selected match" : "Lựa chọn đã nối"}
              </p>
              <p className="mt-2 leading-7 theme-text-strong">
                {chosenOption ? `${chosenOption.displayLabel ?? chosenOption.label}. ${pickRound1QuestionText(chosenOption.text)}` : locale === "en" ? "No match selected" : "Chưa chọn đáp án"}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function QuestionRecordCard({
  locale,
  question,
  essayDraft,
  essayQuestionMaxScore,
  canScoreEssay,
  onEssayScoreChange,
}: {
  locale: "en" | "vi";
  question: AdminRound1ExamDetail["questions"][number];
  essayDraft?: string;
  essayQuestionMaxScore: number;
  canScoreEssay: boolean;
  onEssayScoreChange?: (questionId: string, nextValue: string) => void;
}) {
  const statusTone = question.answered
    ? question.autoScored
      ? question.isCorrect
        ? "success"
        : "warning"
      : "info"
    : "default";
  const essayAiGuard =
    question.type === "essay"
      ? estimateEssayAiLikelihood(question.response?.essayText ?? "", locale)
      : null;

  return (
    <Surface className="px-5 py-5 md:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill>{`${locale === "en" ? "Question" : "Câu"} ${String(question.paperOrder).padStart(2, "0")}`}</StatusPill>
            <StatusPill>{pickRound1TypeLabel(locale, question.type)}</StatusPill>
            <StatusPill tone={statusTone}>
              {question.answered
                ? locale === "en"
                  ? "Answered"
                  : "Đã trả lời"
                : locale === "en"
                  ? "No answer"
                  : "Chưa trả lời"}
            </StatusPill>
          </div>
          <h3 className="theme-heading text-lg font-semibold theme-text-strong">{pickRound1QuestionText(question.prompt)}</h3>
          <p className="text-sm leading-7 theme-text-soft">{question.topic}</p>
        </div>

        <div className="rounded-[1.15rem] border theme-border bg-white/82 px-4 py-3 dark:bg-white/[0.05]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] theme-eyebrow">
            {locale === "en" ? "Review note" : "Ghi chú"}
          </p>
          <p className="mt-2 text-sm leading-7 theme-text-body">
            {!question.answered
              ? locale === "en"
                ? "No saved answer yet."
                : "Chưa có đáp án được lưu."
              : question.type === "essay"
                ? locale === "en"
                  ? `${question.wordCount ?? 0} words saved`
                  : `Đã lưu ${question.wordCount ?? 0} từ`
                : question.autoScored
                  ? question.isCorrect
                    ? locale === "en"
                      ? "Auto-scored as correct"
                      : "Tự chấm: đúng"
                    : locale === "en"
                      ? "Auto-scored as incorrect"
                      : "Tự chấm: sai"
                  : locale === "en"
                    ? "Manual review needed"
                    : "Cần chấm thủ công"}
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {(question.type === "true-false" || question.type === "single-choice" || question.type === "multiple-choice") ? (
          <OptionAnswerList locale={locale} question={question} />
        ) : null}

        {question.type === "pairing" ? <PairingAnswerList locale={locale} question={question} /> : null}

        {question.type === "essay" ? (
          <div className="space-y-4 rounded-[1.15rem] border theme-border bg-white/78 px-4 py-4 dark:bg-white/[0.04]">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill tone="warning">{`${ROUND1_ESSAY_WORD_LIMIT} ${locale === "en" ? "words max" : "từ tối đa"}`}</StatusPill>
              {typeof question.wordCount === "number" ? (
                <StatusPill tone={question.wordCount > ROUND1_ESSAY_WORD_LIMIT ? "warning" : "info"}>
                  {locale === "en" ? `${question.wordCount} words` : `${question.wordCount} từ`}
                </StatusPill>
              ) : null}
              {typeof question.essayScore === "number" ? (
                <StatusPill tone="success">
                  {locale === "en"
                    ? `${question.essayScore} / ${essayQuestionMaxScore} scored`
                    : `${question.essayScore} / ${essayQuestionMaxScore} đã chấm`}
                </StatusPill>
              ) : null}
            </div>
            <div className="mt-4 whitespace-pre-line rounded-[1rem] border theme-border bg-white/86 px-4 py-4 text-sm leading-8 theme-text-body dark:bg-white/[0.03]">
              {question.response?.essayText?.trim()
                ? question.response.essayText
                : locale === "en"
                  ? "No essay answer saved."
                  : "Chưa có câu trả lời tự luận được lưu."}
            </div>
            {essayAiGuard && question.response?.essayText?.trim() ? (
              <div
                className={cn(
                  "rounded-[1rem] border px-4 py-3.5 text-sm leading-7",
                  essayAiGuard.shouldWarn
                    ? "border-amber-700/22 bg-[linear-gradient(135deg,rgba(255,249,219,0.96),rgba(255,237,213,0.92))] text-amber-950 dark:border-amber-300/22 dark:bg-amber-300/12 dark:text-amber-100"
                    : "border-sky-600/18 bg-[linear-gradient(135deg,rgba(239,246,255,0.98),rgba(224,242,254,0.92))] text-slate-900 dark:border-sky-300/18 dark:bg-sky-300/10 dark:text-sky-100",
                )}
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-4.5 w-4.5 shrink-0" />
                  <div className="space-y-1.5">
                    <p className="font-semibold">
                      {locale === "en"
                        ? `AI-like content estimate: ${essayAiGuard.score}%`
                        : `Ước lượng mức giống nội dung AI: ${essayAiGuard.score}%`}
                    </p>
                    <p>
                      {essayAiGuard.shouldWarn
                        ? locale === "en"
                          ? "This answer exceeds the 50% warning threshold and should be reviewed carefully."
                          : "Câu trả lời này vượt ngưỡng cảnh báo 50% và cần được xem xét kỹ."
                        : locale === "en"
                          ? "This estimate stays below the current warning threshold, but it is still shown for reviewer reference."
                          : "Mức ước lượng này đang dưới ngưỡng cảnh báo hiện tại, nhưng vẫn được hiển thị để người chấm tham khảo."}
                    </p>
                    {essayAiGuard.reasons.length > 0 ? (
                      <p className="text-xs font-medium opacity-85">
                        {locale === "en" ? "Signals:" : "Dấu hiệu:"} {essayAiGuard.reasons.join("; ")}.
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}
            <div className="rounded-[1rem] border theme-border bg-white/82 px-4 py-4 dark:bg-white/[0.03]">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] theme-eyebrow">
                    {locale === "en" ? "Essay question score" : "Điểm câu tự luận"}
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={essayQuestionMaxScore}
                    step="1"
                    value={essayDraft ?? ""}
                    onChange={(event) => onEssayScoreChange?.(question.id, event.target.value)}
                    disabled={!canScoreEssay}
                    placeholder={`0-${essayQuestionMaxScore}`}
                    className="theme-placeholder w-28 rounded-xl border theme-border theme-panel px-3 py-2 text-sm theme-text-strong outline-none disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </label>
                <div className="text-sm leading-7 theme-text-soft md:text-right">
                  <p>
                    {canScoreEssay
                      ? locale === "en"
                        ? `Enter a score from 0 to ${essayQuestionMaxScore} for this essay.`
                        : `Nhập điểm từ 0 đến ${essayQuestionMaxScore} cho câu tự luận này.`
                      : locale === "en"
                        ? "Scores are only available after the participant submits the official exam."
                        : "Chỉ có thể nhập điểm sau khi thí sinh nộp bài thi chính thức."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {question.type !== "essay" ? (
          <div className="rounded-[1.1rem] border theme-border bg-white/70 px-4 py-3 text-xs leading-6 theme-text-soft dark:bg-white/[0.03]">
            {getRound1QuestionOptionPreview(question, locale)}
          </div>
        ) : null}
      </div>
    </Surface>
  );
}

export function AdminRound1ExamDetailView({ userId }: { userId: string }) {
  const { locale, updateRound1EssayScoreByAdmin } = useSiteState();
  const [detail, setDetail] = useState<AdminRound1ExamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [questionFilter, setQuestionFilter] = useState<"objective" | "essay">("objective");
  const [essayDrafts, setEssayDrafts] = useState<Record<string, string>>({});
  const [savePending, setSavePending] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [queuedQuestionId, setQueuedQuestionId] = useState<string | null>(null);
  useAdminTitleScroll();

  useEffect(() => {
    let active = true;

    const run = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await fetch(`/api/admin/round-1/exams/${userId}`, { cache: "no-store" });
        const payload = (await response.json().catch(() => null)) as
          | { exam?: AdminRound1ExamDetail; error?: string }
          | null;

        if (!response.ok || !payload?.exam) {
          throw new Error(payload?.error ?? (locale === "en" ? "Could not load the exam detail." : "Không thể tải chi tiết bài thi."));
        }

        if (active) {
          setDetail(payload.exam);
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
    };

    void run();

    return () => {
      active = false;
    };
  }, [locale, userId]);
  const questions = detail?.questions ?? [];
  const objectiveQuestions = questions.filter((question) => question.type !== "essay");
  const essayQuestions = questions.filter((question) => question.type === "essay");
  const essayQuestionMaxScore = essayQuestions.length
    ? Math.round(ROUND1_ESSAY_MAX_SCORE / essayQuestions.length)
    : ROUND1_ESSAY_MAX_SCORE;
  const visibleQuestions = questionFilter === "essay" ? essayQuestions : objectiveQuestions;
  const canScoreEssay = Boolean(detail?.submissionId && detail.status === "submitted" && essayQuestions.length > 0);
  const enteredEssayScoreTotal = essayQuestions.reduce((total, question) => {
    const rawValue = essayDrafts[question.id];
    const value = typeof rawValue === "string" && rawValue.trim() !== "" ? Number(rawValue) : NaN;
    return Number.isFinite(value) ? total + value : total;
  }, 0);
  const statusMeta = detail ? createStatusMeta(locale, detail.status) : null;

  useEffect(() => {
    if (!detail) {
      setEssayDrafts({});
      return;
    }

    setEssayDrafts(
      Object.fromEntries(
        detail.questions
          .filter((question) => question.type === "essay")
          .map((question) => [
            question.id,
            typeof question.essayScore === "number" ? String(question.essayScore) : "",
        ]),
      ),
    );

    setQuestionFilter((current) => {
      const hasObjective = detail.questions.some((question) => question.type !== "essay");
      const hasEssay = detail.questions.some((question) => question.type === "essay");

      if (current === "essay" && hasEssay) {
        return current;
      }

      if (current === "objective" && hasObjective) {
        return current;
      }

      return hasObjective ? "objective" : "essay";
    });
  }, [detail]);

  useEffect(() => {
    if (!queuedQuestionId) {
      return;
    }

    const node = document.getElementById(`admin-round1-question-${queuedQuestionId}`);
    if (!node) {
      return;
    }

    node.scrollIntoView({ behavior: "smooth", block: "start" });
    setQueuedQuestionId(null);
  }, [queuedQuestionId, questionFilter, visibleQuestions.length]);

  if (loading) {
    return <DetailLoading locale={locale} />;
  }

  if (error || !detail || !statusMeta) {
    return <DetailError locale={locale} message={error || (locale === "en" ? "Exam detail is unavailable." : "Chi tiết bài thi hiện không khả dụng.")} />;
  }

  const saveEssayQuestionScores = async () => {
    if (!detail.submissionId || !canScoreEssay) {
      return;
    }

    const nextQuestionScores: Record<string, number> = {};

    for (const question of essayQuestions) {
      const rawValue = essayDrafts[question.id]?.trim() ?? "";
      if (!rawValue) {
        continue;
      }

      const value = Number(rawValue);
      if (!Number.isFinite(value) || value < 0 || value > essayQuestionMaxScore) {
        setSaveError(
          locale === "en"
            ? `Each essay question score must be a whole number from 0 to ${essayQuestionMaxScore}.`
            : `Mỗi câu tự luận phải được nhập điểm nguyên từ 0 đến ${essayQuestionMaxScore}.`,
        );
        return;
      }

      nextQuestionScores[question.id] = value;
    }

    if (Object.keys(nextQuestionScores).length === 0) {
      setSaveError(
        locale === "en"
          ? "Enter at least one essay question score before saving."
          : "Hãy nhập ít nhất một điểm câu tự luận trước khi lưu.",
      );
      return;
    }

    setSavePending(true);
    setSaveError("");

    const result = await updateRound1EssayScoreByAdmin(detail.submissionId, {
      questionScores: nextQuestionScores,
    });

    if (result) {
      setDetail((current) =>
        current
          ? {
              ...current,
              essayScore: result.essayScore,
              totalScore: result.totalScore,
              questions: current.questions.map((question) =>
                question.type === "essay"
                  ? {
                      ...question,
                      essayScore:
                        typeof result.essayQuestionScores[question.id] === "number"
                          ? result.essayQuestionScores[question.id]
                          : null,
                    }
                  : question,
              ),
            }
          : current,
      );
    }

    setSavePending(false);
  };

  return (
    <div className="space-y-8">
      <div
        id={ADMIN_TITLE_ID}
        className="scroll-mt-32 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"
      >
        <div className="max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] theme-eyebrow">
            {locale === "en" ? "Round 1 exam detail" : "Chi tiết bài thi Vòng 1"}
          </p>
          <h1 className="theme-heading mt-3 text-3xl font-semibold theme-text-strong">
            {detail.name}
          </h1>
          <p className="mt-3 text-sm leading-7 theme-text-muted">
            {locale === "en"
              ? `Saved paper review for ${detail.loginId}, team ${detail.teamName}, with full question order and response state.`
              : `Bản xem lại đề thi đã lưu của ${detail.loginId}, đội ${detail.teamName}, bao gồm thứ tự câu hỏi và trạng thái trả lời chi tiết.`}
          </p>
        </div>
        <Link
          href="/admin/round-1/exams"
          className="theme-button-secondary inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          {locale === "en" ? "Back to exam list" : "Quay lại danh sách bài thi"}
        </Link>
      </div>

      <PageIntro
        eyebrow={locale === "en" ? "Exam overview" : "Tổng quan bài thi"}
        title={`${detail.teamName} · ${detail.loginId}`}
        description={
          locale === "en"
            ? "A direct administrative view of the official Round 1 paper state, including archived answers and current progress metadata."
            : "Góc nhìn quản trị trực tiếp vào trạng thái bài thi Vòng 1 chính thức, bao gồm đáp án đã lưu và metadata tiến độ hiện tại."
        }
        aside={
          <Surface className="rounded-[1.6rem] px-5 py-5">
            <div className="group relative inline-flex">
              <span className={cn("inline-flex h-12 w-12 items-center justify-center rounded-full border", statusMeta.iconClass)}>
                <statusMeta.icon className="h-5 w-5" />
              </span>
              <span className="theme-header-tooltip pointer-events-none absolute right-0 top-full z-20 mt-3 whitespace-nowrap rounded-full px-3 py-1.5 text-[0.68rem] font-medium opacity-0 transition duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
                {statusMeta.description}
              </span>
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.22em] theme-eyebrow">
              {locale === "en" ? "Current status" : "Trạng thái hiện tại"}
            </p>
            <p className="mt-2 text-lg font-semibold theme-text-strong">{statusMeta.label}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <StatusPill>{createStageLabel(locale, detail.teamStage)}</StatusPill>
              {detail.bankTitle ? <StatusPill tone="info">{pickText(locale, detail.bankTitle)}</StatusPill> : null}
            </div>
          </Surface>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            icon: UserRound,
            label: locale === "en" ? "Participant" : "Thí sinh",
            value: detail.email,
          },
          {
            icon: ShieldCheck,
            label: locale === "en" ? "Team" : "Đội",
            value: `${detail.teamName} · #${detail.teamTag}`,
          },
          {
            icon: Target,
            label: locale === "en" ? "Progress" : "Tiến độ",
            value: detail.totalQuestions > 0 ? `${detail.answeredCount}/${detail.totalQuestions}` : "--",
          },
          {
            icon: Clock3,
            label: locale === "en" ? "Latest timestamp" : "Mốc gần nhất",
            value: formatDateTime(locale, detail.submittedAt ?? detail.updatedAt ?? detail.startedAt),
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Surface key={item.label} className="px-5 py-5">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-[1rem] border border-sky-600/18 bg-sky-500/12 text-sky-700 dark:border-sky-300/16 dark:bg-sky-300/12 dark:text-sky-100">
                <Icon className="h-4.5 w-4.5" />
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.22em] theme-eyebrow">{item.label}</p>
              <p className="mt-2 text-sm leading-7 theme-text-strong">{item.value}</p>
            </Surface>
          );
        })}
      </section>

      <Surface className="px-6 py-6 md:px-7">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] theme-eyebrow">
              {locale === "en" ? "Started at" : "Bắt đầu lúc"}
            </p>
            <p className="mt-2 text-sm leading-7 theme-text-body">{formatDateTime(locale, detail.startedAt)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] theme-eyebrow">
              {locale === "en" ? "Deadline" : "Hạn kết thúc"}
            </p>
            <p className="mt-2 text-sm leading-7 theme-text-body">{formatDateTime(locale, detail.deadlineAt)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] theme-eyebrow">
              {locale === "en" ? "Submitted at" : "Nộp lúc"}
            </p>
            <p className="mt-2 text-sm leading-7 theme-text-body">{formatDateTime(locale, detail.submittedAt)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] theme-eyebrow">
              {locale === "en" ? "Scores" : "Điểm số"}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {typeof detail.objectiveScore === "number" ? (
                <StatusPill tone="info">{`${detail.objectiveScore}`}</StatusPill>
              ) : null}
              {typeof detail.essayScore === "number" ? (
                <StatusPill tone="warning">{`${detail.essayScore}`}</StatusPill>
              ) : null}
              {typeof detail.totalScore === "number" ? (
                <StatusPill tone="success">{`${detail.totalScore}`}</StatusPill>
              ) : detail.status === "submitted" ? (
                <StatusPill tone="warning">{locale === "en" ? "Awaiting essay score" : "Chờ điểm tự luận"}</StatusPill>
              ) : (
                <StatusPill>{locale === "en" ? "No final score yet" : "Chưa có điểm cuối"}</StatusPill>
              )}
            </div>
          </div>
        </div>
      </Surface>

      <Surface className="px-6 py-6 md:px-8 md:py-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <p className="theme-heading text-2xl font-semibold theme-text-strong">
              {locale === "en" ? "Question controls" : "Điều hướng câu hỏi"}
            </p>
            <p className="text-sm leading-7 theme-text-muted">
              {locale === "en"
                ? "Switch between objective and essay sections, then jump straight to a specific saved question."
                : "Chuyển giữa phần trắc nghiệm và phần tự luận, sau đó nhảy thẳng tới câu hỏi đã lưu cụ thể."}
            </p>
          </div>

          {questionFilter === "essay" && essayQuestions.length > 0 ? (
            <div className="flex flex-col items-start gap-3 xl:items-end">
              <div className="flex flex-wrap gap-2">
                <StatusPill tone="warning">
                  {locale === "en"
                    ? `Essay total ${typeof detail.essayScore === "number" ? detail.essayScore : "--"} / ${ROUND1_ESSAY_MAX_SCORE}`
                    : `Tổng tự luận ${typeof detail.essayScore === "number" ? detail.essayScore : "--"} / ${ROUND1_ESSAY_MAX_SCORE}`}
                </StatusPill>
                <StatusPill tone="info">
                  {locale === "en"
                    ? `Draft sum ${enteredEssayScoreTotal} / ${ROUND1_ESSAY_MAX_SCORE}`
                    : `Tổng nhập ${enteredEssayScoreTotal} / ${ROUND1_ESSAY_MAX_SCORE}`}
                </StatusPill>
              </div>
              <button
                type="button"
                onClick={() => {
                  void saveEssayQuestionScores();
                }}
                disabled={!canScoreEssay || savePending}
                className="theme-button-primary inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-55"
              >
                <Save className={`h-4 w-4 ${savePending ? "animate-pulse" : ""}`} />
                {locale === "en" ? "Save essay scores" : "Lưu điểm tự luận"}
              </button>
            </div>
          ) : null}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setQuestionFilter("objective")}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition",
              questionFilter === "objective"
                ? "border-sky-600/28 bg-[linear-gradient(135deg,rgba(14,165,233,0.14),rgba(37,99,235,0.12))] text-sky-900 dark:border-sky-300/22 dark:bg-sky-300/12 dark:text-sky-100"
                : "theme-button-secondary border",
            )}
          >
            <FileQuestion className="h-4 w-4" />
            {locale === "en"
              ? `Multiple choice (${objectiveQuestions.length})`
              : `Trắc nghiệm (${objectiveQuestions.length})`}
          </button>
          <button
            type="button"
            onClick={() => setQuestionFilter("essay")}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition",
              questionFilter === "essay"
                ? "border-amber-600/28 bg-[linear-gradient(135deg,rgba(251,191,36,0.16),rgba(245,158,11,0.12))] text-amber-950 dark:border-amber-300/22 dark:bg-amber-300/12 dark:text-amber-100"
                : "theme-button-secondary border",
            )}
          >
            <BookText className="h-4 w-4" />
            {locale === "en"
              ? `Essay (${essayQuestions.length})`
              : `Tự luận (${essayQuestions.length})`}
          </button>
        </div>

        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] theme-eyebrow">
            {locale === "en" ? "Question navigator" : "Bảng số câu hỏi"}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {detail.questions.map((question) => {
              const isEssay = question.type === "essay";
              return (
                <button
                  key={question.id}
                  type="button"
                  onClick={() => {
                    setQuestionFilter(isEssay ? "essay" : "objective");
                    setQueuedQuestionId(question.id);
                  }}
                  className={cn(
                    "inline-flex h-11 min-w-11 items-center justify-center rounded-[1rem] border px-3 text-sm font-semibold transition",
                    isEssay
                      ? "border-amber-500/24 bg-[linear-gradient(135deg,rgba(255,251,235,0.94),rgba(254,243,199,0.86))] text-amber-900 dark:border-amber-300/18 dark:bg-amber-300/10 dark:text-amber-100"
                      : "border-sky-500/22 bg-[linear-gradient(135deg,rgba(239,246,255,0.98),rgba(224,242,254,0.88))] text-sky-900 dark:border-sky-300/18 dark:bg-sky-300/10 dark:text-sky-100",
                  )}
                  title={
                    locale === "en"
                      ? `${isEssay ? "Essay" : "Multiple choice"} question ${question.paperOrder}`
                      : `${isEssay ? "Câu tự luận" : "Câu trắc nghiệm"} ${question.paperOrder}`
                  }
                >
                  {question.paperOrder}
                </button>
              );
            })}
          </div>
        </div>

        {saveError ? (
          <div className="mt-5 rounded-[1.2rem] border border-amber-700/22 bg-[linear-gradient(135deg,rgba(255,249,219,0.96),rgba(255,237,213,0.92))] px-4 py-3.5 text-sm leading-7 text-amber-950 dark:border-amber-300/22 dark:bg-amber-300/12 dark:text-amber-100">
            {saveError}
          </div>
        ) : null}
      </Surface>

      {detail.questions.length === 0 ? (
        <Surface className="px-6 py-6 md:px-8 md:py-8">
          <SectionHeading
            eyebrow={locale === "en" ? "Questions" : "Câu hỏi"}
            title={locale === "en" ? "No archived question set is available." : "Chưa có bộ câu hỏi lưu trữ khả dụng."}
            description={
              locale === "en"
                ? "This usually means the exam was never started, or the older record does not include archived answer payloads yet."
                : "Điều này thường có nghĩa là bài thi chưa từng được khởi tạo, hoặc bản ghi cũ chưa lưu lại payload đề và đáp án."
            }
          />
        </Surface>
      ) : (
        <div className="space-y-4">
          {visibleQuestions.map((question) => (
            <div key={question.id} id={`admin-round1-question-${question.id}`} className="scroll-mt-28">
              <QuestionRecordCard
                locale={locale}
                question={question}
                essayDraft={essayDrafts[question.id] ?? ""}
                essayQuestionMaxScore={essayQuestionMaxScore}
                canScoreEssay={canScoreEssay}
                onEssayScoreChange={(questionId, nextValue) => {
                  setSaveError("");
                  setEssayDrafts((current) => ({
                    ...current,
                    [questionId]: nextValue,
                  }));
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
