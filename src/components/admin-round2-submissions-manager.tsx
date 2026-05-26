"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CheckCheck,
  CircleDashed,
  Clock3,
  Download,
  Filter,
  Search,
  Trash2,
  UsersRound,
  X,
} from "lucide-react";
import * as XLSX from "xlsx";

import { ADMIN_TITLE_ID, useAdminTitleScroll } from "@/components/admin-title-scroll";
import {
  ADMIN_LIST_TABLE_PAGE_SIZE,
  AdminTablePagination,
  useAdminTablePagination,
} from "@/components/admin-table-pagination";
import { useSiteState } from "@/components/providers/site-state-provider";
import { StatusPill, Surface } from "@/components/site-ui";
import { pickLocalizedText } from "@/lib/site";
import type {
  AdminRound2AssignmentStatus,
  AdminRound2JudgeOption,
  AdminRound2SubmissionRow,
} from "@/types/admin-round2-submissions";

function cn(...values: Array<string | undefined | false>) {
  return values.filter(Boolean).join(" ");
}

const stickyFirstColumnClass = "theme-admin-sticky-cell sticky left-0 z-20";
const stickySecondColumnClass = "theme-admin-sticky-cell sticky z-10";
const stickyFirstHeadClass = "theme-admin-sticky-head sticky left-0 z-30";
const stickySecondHeadClass = "theme-admin-sticky-head sticky z-20";

function matchesFilter(value: string, query: string) {
  if (!query.trim()) {
    return true;
  }

  return value.toLowerCase().includes(query.trim().toLowerCase());
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

function exportRowsToWorkbook(
  fileName: string,
  sheetName: string,
  rows: Record<string, string | number>[],
) {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, fileName);
}

function createAssignmentMeta(locale: "en" | "vi", status: AdminRound2AssignmentStatus) {
  switch (status) {
    case "fully-assigned":
      return {
        label: locale === "en" ? "Assigned to 2 judges" : "Đã phân 2 giám khảo",
        description:
          locale === "en"
            ? "The latest Round 2 report already has two assigned judges."
            : "Bài nộp Vòng 2 mới nhất đã được phân cho hai giám khảo.",
        icon: CheckCheck,
        iconClass:
          "border-emerald-600/22 bg-[linear-gradient(135deg,rgba(16,185,129,0.18),rgba(52,211,153,0.12))] text-emerald-800 dark:border-emerald-300/20 dark:bg-emerald-300/12 dark:text-emerald-100",
      };
    case "partially-assigned":
      return {
        label: locale === "en" ? "Assigned to 1 judge" : "Đã phân 1 giám khảo",
        description:
          locale === "en"
            ? "Only one judge is currently assigned."
            : "Hiện mới có một giám khảo được phân.",
        icon: Clock3,
        iconClass:
          "border-amber-500/24 bg-[linear-gradient(135deg,rgba(245,158,11,0.18),rgba(251,191,36,0.12))] text-amber-800 dark:border-amber-300/20 dark:bg-amber-300/12 dark:text-amber-100",
      };
    case "unassigned":
    default:
      return {
        label: locale === "en" ? "Not assigned" : "Chưa phân công",
        description:
          locale === "en"
            ? "No judge has been assigned to this Round 2 report yet."
            : "Hiện chưa có giám khảo nào được phân cho báo cáo Vòng 2 này.",
        icon: CircleDashed,
        iconClass:
          "border-slate-500/18 bg-[linear-gradient(135deg,rgba(226,232,240,0.82),rgba(241,245,249,0.94))] text-slate-700 dark:border-white/16 dark:bg-white/[0.06] dark:text-slate-200",
      };
  }
}

function DownloadCell({
  locale,
  row,
}: {
  locale: "en" | "vi";
  row: AdminRound2SubmissionRow;
}) {
  if (!row.resourceUrl) {
    return (
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
    );
  }

  return (
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
  );
}

function AssignedJudgeCell({
  locale,
  row,
}: {
  locale: "en" | "vi";
  row: AdminRound2SubmissionRow;
}) {
  const meta = createAssignmentMeta(locale, row.assignmentStatus);
  const Icon = meta.icon;

  if (row.assignedJudges.length === 0) {
    return (
      <div className="min-w-[16rem] space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <div className="group relative inline-flex">
              <span className={cn("inline-flex h-9 w-9 items-center justify-center rounded-full border", meta.iconClass)}>
                <Icon className="h-4 w-4" />
              </span>
              <span className="theme-header-tooltip pointer-events-none absolute left-1/2 top-full z-30 mt-3 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1.5 text-[0.68rem] font-medium opacity-0 transition duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
                {meta.description}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] theme-text-soft">
                {locale === "en" ? "Assignment" : "Phân công"}
              </p>
              <p className="text-sm font-medium theme-text-body">{meta.label}</p>
            </div>
          </div>
        </div>
        <p className="text-sm font-medium theme-text-soft">
          {locale === "en" ? "Waiting for assignment" : "Đang chờ phân công"}
        </p>
      </div>
    );
  }

  return (
    <div className="min-w-[16rem] space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="group relative inline-flex">
            <span className={cn("inline-flex h-9 w-9 items-center justify-center rounded-full border", meta.iconClass)}>
              <Icon className="h-4 w-4" />
            </span>
            <span className="theme-header-tooltip pointer-events-none absolute left-1/2 top-full z-30 mt-3 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1.5 text-[0.68rem] font-medium opacity-0 transition duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
              {meta.description}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] theme-text-soft">
              {locale === "en" ? "Assignment" : "Phân công"}
            </p>
            <p className="text-sm font-medium theme-text-body">{meta.label}</p>
          </div>
        </div>
      </div>
      {row.assignedJudges.map((judge, index) => (
        <div key={judge.judgeUserId} className="min-w-0 rounded-[1rem] border theme-border bg-white/78 px-3 py-2 dark:bg-white/[0.04]">
          {judge.judgeProfileId ? (
            <Link
              href={`/admin/judges#judge-row-${judge.judgeProfileId}`}
              className="inline-flex max-w-full truncate font-semibold theme-text-strong transition hover:opacity-80"
            >
              {judge.judgeName}
            </Link>
          ) : (
            <p className="font-semibold theme-text-strong">{judge.judgeName}</p>
          )}
          <p className="mt-1 text-xs theme-text-soft">
            {locale === "en" ? `Judge ${index + 1}` : `Giám khảo ${index + 1}`} · {pickLocalizedText(locale, judge.organization)}
          </p>
        </div>
      ))}
    </div>
  );
}

function AssignmentDialog({
  locale,
  row,
  availableJudges,
  onClose,
  onSaved,
}: {
  locale: "en" | "vi";
  row: AdminRound2SubmissionRow;
  availableJudges: AdminRound2JudgeOption[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const initialJudgeIds = [row.assignedJudges[0]?.judgeUserId ?? "", row.assignedJudges[1]?.judgeUserId ?? ""];
  const [judgeOneId, setJudgeOneId] = useState(initialJudgeIds[0]);
  const [judgeTwoId, setJudgeTwoId] = useState(initialJudgeIds[1]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const handleSave = async () => {
    if (!judgeOneId || !judgeTwoId) {
      setError(locale === "en" ? "Please choose two judges." : "Vui lòng chọn đủ hai giám khảo.");
      return;
    }

    if (judgeOneId === judgeTwoId) {
      setError(locale === "en" ? "The two assignments must be different judges." : "Hai vị trí phải là hai giám khảo khác nhau.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      const response = await fetch(`/api/admin/round-2/submissions/${row.submissionId}/judges`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          judgeUserIds: [judgeOneId, judgeTwoId],
        }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? (locale === "en" ? "Could not save judge assignment." : "Không thể lưu phân công giám khảo."));
      }

      await onSaved();
      onClose();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : locale === "en" ? "Unexpected error." : "Có lỗi bất ngờ.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/36 px-4 py-4 backdrop-blur-sm">
      <Surface className="w-full max-w-2xl overflow-hidden px-0 py-0">
        <div className="flex items-center justify-between border-b theme-border px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] theme-eyebrow">
              {locale === "en" ? "Assign judges" : "Phân công giám khảo"}
            </p>
            <p className="mt-2 text-lg font-semibold theme-text-strong">{row.teamName}</p>
            <p className="mt-1 text-sm theme-text-soft">{row.title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="theme-button-secondary inline-flex h-10 w-10 items-center justify-center rounded-full border"
            aria-label={locale === "en" ? "Close dialog" : "Đóng cửa sổ"}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-6">
          <div className="rounded-[1.2rem] border theme-border bg-white/72 px-4 py-4 dark:bg-white/[0.04]">
            <p className="text-sm leading-7 theme-text-body">
              {locale === "en"
                ? "Choose two judges from the Round 2 panel. Assignments are only available after the Round 2 submission deadline and only for the latest report version."
                : "Chọn hai giám khảo từ hội đồng Vòng 2. Chức năng này chỉ mở sau khi hết hạn nộp Vòng 2 và chỉ áp dụng cho phiên bản báo cáo mới nhất."}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] theme-eyebrow">
                {locale === "en" ? "Judge 1" : "Giám khảo 1"}
              </span>
              <select
                value={judgeOneId}
                onChange={(event) => setJudgeOneId(event.target.value)}
                className="theme-admin-select theme-field h-12 w-full rounded-[1rem] border px-4 text-sm outline-none"
              >
                <option value="">{locale === "en" ? "Choose a judge" : "Chọn giám khảo"}</option>
                {availableJudges.map((judge) => (
                  <option key={judge.judgeUserId} value={judge.judgeUserId}>
                    {`${judge.judgeName} · ${pickLocalizedText(locale, judge.organization)}`}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] theme-eyebrow">
                {locale === "en" ? "Judge 2" : "Giám khảo 2"}
              </span>
              <select
                value={judgeTwoId}
                onChange={(event) => setJudgeTwoId(event.target.value)}
                className="theme-admin-select theme-field h-12 w-full rounded-[1rem] border px-4 text-sm outline-none"
              >
                <option value="">{locale === "en" ? "Choose a judge" : "Chọn giám khảo"}</option>
                {availableJudges.map((judge) => (
                  <option key={judge.judgeUserId} value={judge.judgeUserId}>
                    {`${judge.judgeName} · ${pickLocalizedText(locale, judge.organization)}`}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {error ? (
            <div className="rounded-[1.1rem] border border-rose-500/18 bg-[linear-gradient(180deg,rgba(255,241,242,0.98),rgba(255,228,230,0.94))] px-4 py-3 text-sm leading-7 text-rose-800 dark:border-rose-300/18 dark:bg-rose-300/12 dark:text-rose-100">
              {error}
            </div>
          ) : null}
        </div>

        <div className="border-t theme-border px-6 py-5">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="theme-button-primary inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
            >
              <UsersRound className="h-4 w-4" />
              {saving
                ? locale === "en"
                  ? "Saving..."
                  : "Đang lưu..."
                : locale === "en"
                  ? "Save assignment"
                  : "Lưu phân công"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="theme-button-secondary inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold"
            >
              {locale === "en" ? "Cancel" : "Hủy"}
            </button>
          </div>
        </div>
      </Surface>
    </div>
  );
}

function LoadingState({ locale }: { locale: "en" | "vi" }) {
  return (
    <div id={ADMIN_TITLE_ID} className="scroll-mt-32">
      <p className="theme-heading text-3xl font-semibold theme-text-strong">
        {locale === "en" ? "Loading Round 2 submissions..." : "Đang tải bài nộp Vòng 2..."}
      </p>
    </div>
  );
}

function ErrorState({ locale, message }: { locale: "en" | "vi"; message: string }) {
  return (
    <Surface className="px-6 py-6 md:px-8 md:py-8">
      <div id={ADMIN_TITLE_ID} className="scroll-mt-32">
        <p className="theme-heading text-3xl font-semibold theme-text-strong">
          {locale === "en" ? "Could not load Round 2 submissions." : "Không thể tải bài nộp Vòng 2."}
        </p>
        <p className="mt-3 text-sm leading-7 theme-text-muted">{message}</p>
      </div>
    </Surface>
  );
}

export function AdminRound2SubmissionsManager() {
  const { currentUser, locale } = useSiteState();
  const [rows, setRows] = useState<AdminRound2SubmissionRow[]>([]);
  const [availableJudges, setAvailableJudges] = useState<AdminRound2JudgeOption[]>([]);
  const [round2Closed, setRound2Closed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [versionFilter, setVersionFilter] = useState<"all" | "latest" | "history">("all");
  const [assignmentFilter, setAssignmentFilter] = useState<"all" | AdminRound2AssignmentStatus>("all");
  const [deletingSubmissionId, setDeletingSubmissionId] = useState<string | null>(null);
  const [activeRow, setActiveRow] = useState<AdminRound2SubmissionRow | null>(null);
  useAdminTitleScroll();

  useEffect(() => {
    let active = true;

    const run = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await fetch("/api/admin/round-2/submissions", { cache: "no-store" });
        const payload = (await response.json().catch(() => null)) as
          | {
              rows?: AdminRound2SubmissionRow[];
              availableJudges?: AdminRound2JudgeOption[];
              round2Closed?: boolean;
              error?: string;
            }
          | null;

        if (!response.ok || !payload?.rows || !payload.availableJudges) {
          throw new Error(payload?.error ?? (locale === "en" ? "Could not load Round 2 submissions." : "Không thể tải bài nộp Vòng 2."));
        }

        if (!active) {
          return;
        }

        setRows(payload.rows);
        setAvailableJudges(payload.availableJudges);
        setRound2Closed(Boolean(payload.round2Closed));
      } catch (nextError) {
        if (!active) {
          return;
        }

        setError(nextError instanceof Error ? nextError.message : locale === "en" ? "Unexpected error." : "Có lỗi bất ngờ.");
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

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch("/api/admin/round-2/submissions", { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as
        | {
            rows?: AdminRound2SubmissionRow[];
            availableJudges?: AdminRound2JudgeOption[];
            round2Closed?: boolean;
            error?: string;
          }
        | null;

      if (!response.ok || !payload?.rows || !payload.availableJudges) {
        throw new Error(payload?.error ?? (locale === "en" ? "Could not load Round 2 submissions." : "Không thể tải bài nộp Vòng 2."));
      }

      setRows(payload.rows);
      setAvailableJudges(payload.availableJudges);
      setRound2Closed(Boolean(payload.round2Closed));
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : locale === "en" ? "Unexpected error." : "Có lỗi bất ngờ.");
    } finally {
      setLoading(false);
    }
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
          ...row.assignedJudges.flatMap((judge) => [
            judge.judgeName,
            judge.judgeLoginId,
            pickLocalizedText("en", judge.organization),
            pickLocalizedText("vi", judge.organization),
          ]),
        ].join(" ");

        if (!matchesFilter(searchSource, search)) {
          return false;
        }

        if (versionFilter === "latest" && row.isLatest !== "valid latest") {
          return false;
        }

        if (versionFilter === "history" && row.isLatest !== "history only") {
          return false;
        }

        if (assignmentFilter !== "all" && row.assignmentStatus !== assignmentFilter) {
          return false;
        }

        return true;
      }),
    [rows, search, versionFilter, assignmentFilter],
  );

  const {
    page,
    setPage,
    pageCount,
    startIndex,
    paginatedRows,
  } = useAdminTablePagination(filteredRows, ADMIN_LIST_TABLE_PAGE_SIZE);

  const canDeleteSubmission = currentUser.role === "admin";

  const deleteSubmission = async (row: AdminRound2SubmissionRow) => {
    const confirmed = window.confirm(
      locale === "en"
        ? `Delete Round 2 submission ${row.title} from team ${row.teamName}?`
        : `Xóa bài nộp Vòng 2 ${row.title} của đội ${row.teamName}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingSubmissionId(row.submissionId);
      const response = await fetch(`/api/admin/round-2/submissions/${row.submissionId}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(
          payload?.error ??
            (locale === "en"
              ? "Could not delete the Round 2 submission."
              : "Không thể xóa bài nộp Vòng 2."),
        );
      }

      await load();
    } catch (nextError) {
      window.alert(
        nextError instanceof Error
          ? nextError.message
          : locale === "en"
            ? "Could not delete the Round 2 submission."
            : "Không thể xóa bài nộp Vòng 2.",
      );
    } finally {
      setDeletingSubmissionId(null);
    }
  };

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
            {locale === "en" ? "Round 2" : "Vòng 2"}
          </p>
          <p className="mt-3 text-sm leading-7 theme-text-muted">
            {locale === "en"
              ? "Review Round 2 report versions, download the file directly, and track the two judges assigned automatically when the Top 50 announcement goes live."
              : "Rà soát các phiên bản báo cáo Vòng 2, tải trực tiếp tệp bài nộp và theo dõi hai giám khảo được tự động phân khi công bố Top 50."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <StatusPill tone={round2Closed ? "success" : "warning"}>
            {round2Closed
              ? locale === "en"
                ? "Scoring open"
                : "Đã mở chấm điểm"
              : locale === "en"
                ? "Auto assignment from Top 50"
                : "Tự động phân từ Top 50"}
          </StatusPill>
          <button
            type="button"
            onClick={() =>
              exportRowsToWorkbook(
                "attacker-2026-round2-submissions.xlsx",
                "Round 2",
                filteredRows.map((row) => ({
                  Team: row.teamName,
                  Tag: row.teamTag,
                  Title: row.title,
                  Version: row.version,
                  VersionStatus: row.isLatest,
                  AssignmentStatus: row.assignmentStatus,
                  Judge1: row.assignedJudges[0]?.judgeName ?? "",
                  Judge2: row.assignedJudges[1]?.judgeName ?? "",
                  SubmittedBy: row.submittedByName,
                  SubmittedAt: row.submittedAt,
                  File: row.resourceLabel,
                })),
              )
            }
            className="theme-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
          >
            <Download className="h-4 w-4" />
            {locale === "en" ? "Export round2-submissions.xlsx" : "Xuất round2-submissions.xlsx"}
          </button>
        </div>
      </div>

      <Surface className="px-5 py-5 md:px-6">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.5fr)_220px_240px]">
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
                placeholder={locale === "en" ? "Search by team, title, judge, submitter..." : "Tìm theo đội, tiêu đề, giám khảo, người nộp..."}
                className="theme-field h-12 w-full rounded-[1rem] border pl-10 pr-4 text-sm outline-none"
              />
            </div>
          </label>

          <label className="space-y-2">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] theme-eyebrow">
              <Filter className="h-3.5 w-3.5" />
              {locale === "en" ? "Version status" : "Trạng thái phiên bản"}
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
              {locale === "en" ? "Judge assigned" : "Phân công giám khảo"}
            </span>
            <select
              value={assignmentFilter}
              onChange={(event) => setAssignmentFilter(event.target.value as "all" | AdminRound2AssignmentStatus)}
              className="theme-admin-select theme-field h-12 w-full rounded-[1rem] border px-4 text-sm outline-none"
            >
              <option value="all">{locale === "en" ? "All assignments" : "Tất cả phân công"}</option>
              <option value="unassigned">{locale === "en" ? "Not assigned" : "Chưa phân công"}</option>
              <option value="partially-assigned">{locale === "en" ? "Assigned to 1 judge" : "Đã phân 1 giám khảo"}</option>
              <option value="fully-assigned">{locale === "en" ? "Assigned to 2 judges" : "Đã phân 2 giám khảo"}</option>
            </select>
          </label>
        </div>
      </Surface>

      <Surface className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[1220px] text-left text-sm">
            <thead className="border-b theme-border bg-[var(--panel-strong)] theme-text-soft">
              <tr>
                {[
                  "#",
                  locale === "en" ? "Team" : "Đội",
                  locale === "en" ? "Version" : "Phiên bản",
                  locale === "en" ? "Judges" : "Giám khảo",
                  locale === "en" ? "File" : "Tệp",
                  locale === "en" ? "Submitted by" : "Người nộp",
                  locale === "en" ? "Submitted at" : "Nộp lúc",
                  ...(canDeleteSubmission ? [locale === "en" ? "Delete" : "Xóa"] : []),
                ].map((label, columnIndex) => (
                  <th
                    key={label}
                    style={
                      columnIndex === 0
                        ? { left: 0, width: 72, minWidth: 72 }
                        : columnIndex === 1
                          ? { left: 72, minWidth: 300 }
                          : undefined
                    }
                    className={cn(
                      "px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]",
                      columnIndex === 0 ? stickyFirstHeadClass : "",
                      columnIndex === 1 ? stickySecondHeadClass : "",
                    )}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row, index) => (
                <tr key={row.submissionId} className="border-b theme-border last:border-b-0">
                  <td
                    style={{ left: 0, width: 72, minWidth: 72 }}
                    className={cn("px-4 py-4 text-xs font-semibold theme-text-soft", stickyFirstColumnClass)}
                  >
                    {startIndex + index + 1}
                  </td>
                  <td
                    style={{ left: 72, minWidth: 300 }}
                    className={cn("px-4 py-4", stickySecondColumnClass)}
                  >
                    <div className="space-y-1">
                      <Link href={`/admin/teams/${row.teamId}`} className="inline-flex max-w-[260px] truncate font-semibold theme-text-strong transition hover:opacity-80">
                        {row.teamName}
                      </Link>
                      <p className="text-xs theme-text-soft">{`#${row.teamTag} · ${row.title}`}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <StatusPill tone={row.isLatest === "valid latest" ? "success" : "default"}>
                      {row.isLatest === "valid latest"
                        ? locale === "en"
                          ? `v${row.version} · latest`
                          : `bản ${row.version} · mới nhất`
                        : locale === "en"
                          ? `v${row.version} · history`
                          : `bản ${row.version} · lịch sử`}
                    </StatusPill>
                  </td>
                  <td className="px-4 py-4">
                    <AssignedJudgeCell locale={locale} row={row} />
                  </td>
                  <td className="px-4 py-4">
                    <DownloadCell locale={locale} row={row} />
                  </td>
                  <td className="px-4 py-4">
                    <Link
                      href={`/admin/users/${row.submittedByUserId}/profile`}
                      className="inline-flex max-w-[240px] flex-col gap-1 rounded-xl transition hover:opacity-85"
                    >
                      <span className="font-semibold theme-text-strong">{row.submittedByName}</span>
                      <span className="text-xs theme-text-soft">{row.submittedByLoginId}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-4 theme-text-body">{formatDateTime(locale, row.submittedAt)}</td>
                  {canDeleteSubmission ? (
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => {
                          void deleteSubmission(row);
                        }}
                        disabled={deletingSubmissionId === row.submissionId}
                        title={locale === "en" ? "Delete submission" : "Xóa bài nộp"}
                        aria-label={locale === "en" ? "Delete submission" : "Xóa bài nộp"}
                        className="theme-button-danger inline-flex h-10 w-10 items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-55"
                      >
                        <Trash2 className={`h-4 w-4 ${deletingSubmissionId === row.submissionId ? "animate-pulse" : ""}`} />
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))}
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

      {activeRow ? (
        <AssignmentDialog
          locale={locale}
          row={activeRow}
          availableJudges={availableJudges}
          onClose={() => setActiveRow(null)}
          onSaved={load}
        />
      ) : null}
    </div>
  );
}
