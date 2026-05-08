"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Filter,
  LoaderCircle,
  MessageSquare,
  Search,
  Trash2,
} from "lucide-react";

import {
  ADMIN_LIST_TABLE_PAGE_SIZE,
  AdminTablePagination,
  useAdminTablePagination,
} from "@/components/admin-table-pagination";
import { useSiteState } from "@/components/providers/site-state-provider";
import { SectionHeading, StatusPill, Surface } from "@/components/site-ui";
import type { ForumThread, ForumThreadCategory } from "@/types/site";

type ForumThreadsPayload = {
  threads: ForumThread[];
};

type ThreadCategoryFilter = ForumThreadCategory | "all";
type ThreadStatusFilter = ForumThread["status"] | "all";

const categoryOptions: ForumThreadCategory[] = [
  "looking-for-team",
  "team-looking-for-members",
  "general-discussion",
];

function cn(...values: Array<string | undefined | false>) {
  return values.filter(Boolean).join(" ");
}

const stickyFirstColumnClass = "theme-admin-sticky-cell sticky left-0 z-20";
const stickySecondColumnClass = "theme-admin-sticky-cell sticky z-10";
const stickyFirstHeadClass = "theme-admin-sticky-head sticky left-0 z-30";
const stickySecondHeadClass = "theme-admin-sticky-head sticky z-20";

function formatAdminForumDate(locale: "en" | "vi", value: string) {
  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getCategoryLabel(locale: "en" | "vi", category: ForumThreadCategory) {
  switch (category) {
    case "looking-for-team":
      return locale === "en" ? "Looking for team" : "Tìm đội";
    case "team-looking-for-members":
      return locale === "en" ? "Team recruiting" : "Đội đang tuyển";
    case "general-discussion":
      return locale === "en" ? "General discussion" : "Trao đổi chung";
  }
}

function getStatusLabel(locale: "en" | "vi", status: ForumThread["status"]) {
  return status === "open"
    ? locale === "en"
      ? "Open"
      : "Đang mở"
    : locale === "en"
      ? "Closed"
      : "Đã đóng";
}

function IconActionButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="theme-button-danger group relative inline-flex h-10 w-10 items-center justify-center rounded-full border disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
      <span className="pointer-events-none absolute -top-11 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-full border border-slate-900/8 bg-white px-3 py-1.5 text-[0.68rem] font-semibold tracking-[0.14em] text-slate-700 shadow-[0_12px_28px_rgba(15,23,42,0.12)] group-hover:flex dark:border-white/10 dark:bg-[rgba(7,18,35,0.96)] dark:text-white/80">
        {label}
      </span>
    </button>
  );
}

export function AdminForumManager() {
  const { locale } = useSiteState();
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<ThreadCategoryFilter>("all");
  const [statusFilter, setStatusFilter] = useState<ThreadStatusFilter>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isDeletingSlug, setIsDeletingSlug] = useState("");
  const [pendingDeleteThread, setPendingDeleteThread] = useState<ForumThread | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadThreads() {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch("/api/forum/threads", {
          method: "GET",
          credentials: "include",
        });

        const payload = (await response.json()) as ForumThreadsPayload & { error?: string };
        if (!response.ok) {
          throw new Error(payload.error ?? "Could not load forum threads.");
        }

        if (isMounted) {
          setThreads(payload.threads);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : "Could not load forum threads.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadThreads();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredThreads = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    return threads.filter((thread) => {
      if (categoryFilter !== "all" && thread.category !== categoryFilter) {
        return false;
      }

      if (statusFilter !== "all" && thread.status !== statusFilter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return [
        thread.title,
        thread.summary,
        thread.body,
        thread.author.name,
        thread.author.university,
        thread.university,
        ...thread.preferredRoles,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [categoryFilter, searchValue, statusFilter, threads]);

  const {
    page,
    setPage,
    pageCount,
    paginatedRows,
    startIndex,
  } = useAdminTablePagination(filteredThreads, ADMIN_LIST_TABLE_PAGE_SIZE);

  async function handleDeleteThread(thread: ForumThread) {
    setIsDeletingSlug(thread.slug);
    setError("");

    try {
      const response = await fetch(`/api/admin/forum/threads/${thread.slug}`, {
        method: "DELETE",
        credentials: "include",
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? "Could not delete this forum thread.");
      }

      setThreads((current) => current.filter((item) => item.slug !== thread.slug));
      setPendingDeleteThread(null);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not delete this forum thread.");
    } finally {
      setIsDeletingSlug("");
    }
  }

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow={locale === "en" ? "Admin / Forum" : "Admin / Diễn đàn"}
        title={locale === "en" ? "Forum thread moderation" : "Quản lý chủ đề diễn đàn"}
        description={
          locale === "en"
            ? "Review live forum threads, open the public discussion, and remove outdated or inappropriate threads."
            : "Rà soát các chủ đề forum đang hiển thị, mở thảo luận công khai và gỡ các chủ đề không còn phù hợp."
        }
      />

      <Surface className="overflow-hidden px-0 py-0">
        <div className="border-b theme-border px-5 py-5">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_180px]">
            <label className="theme-news-search flex items-center gap-3 rounded-[1.25rem] border px-4 py-3">
              <span className="theme-news-search-icon inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                <Search className="h-4 w-4" />
              </span>
              <input
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder={locale === "en" ? "Search thread, owner, university, role..." : "Tìm chủ đề, chủ sở hữu, trường, vai trò..."}
                className="theme-news-search-input min-w-0 flex-1 bg-transparent text-sm outline-none"
              />
            </label>

            <label className="theme-panel-subtle flex items-center gap-3 rounded-[1.25rem] border theme-border px-4 py-3">
              <Filter className="h-4 w-4 text-sky-700 dark:text-sky-200" />
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value as ThreadCategoryFilter)}
                className="w-full bg-transparent text-sm font-medium theme-text-strong outline-none"
              >
                <option value="all">{locale === "en" ? "All categories" : "Tất cả phân loại"}</option>
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {getCategoryLabel(locale, category)}
                  </option>
                ))}
              </select>
            </label>

            <label className="theme-panel-subtle flex items-center gap-3 rounded-[1.25rem] border theme-border px-4 py-3">
              <MessageSquare className="h-4 w-4 text-emerald-700 dark:text-emerald-200" />
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as ThreadStatusFilter)}
                className="w-full bg-transparent text-sm font-medium theme-text-strong outline-none"
              >
                <option value="all">{locale === "en" ? "All status" : "Tất cả trạng thái"}</option>
                <option value="open">{getStatusLabel(locale, "open")}</option>
                <option value="closed">{getStatusLabel(locale, "closed")}</option>
              </select>
            </label>
          </div>

          {error ? (
            <div className="mt-4 rounded-[1.25rem] border border-rose-500/18 bg-rose-500/10 px-4 py-3 text-sm text-rose-800 dark:text-rose-100">
              {error}
            </div>
          ) : null}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="border-b theme-border theme-panel-subtle">
              <tr className="text-xs uppercase tracking-[0.18em] theme-text-soft">
                <th
                  style={{ left: 0, width: 72, minWidth: 72 }}
                  className={cn("px-4 py-3 text-center", stickyFirstHeadClass)}
                >
                  #
                </th>
                <th
                  style={{ left: 72, minWidth: 360 }}
                  className={cn("px-4 py-3", stickySecondHeadClass)}
                >
                  {locale === "en" ? "Thread" : "Chủ đề"}
                </th>
                <th className="px-4 py-3">{locale === "en" ? "Owner" : "Chủ sở hữu"}</th>
                <th className="px-4 py-3">{locale === "en" ? "Category" : "Phân loại"}</th>
                <th className="px-4 py-3 text-center">{locale === "en" ? "Status" : "Trạng thái"}</th>
                <th className="px-4 py-3 text-center">{locale === "en" ? "Replies" : "Phản hồi"}</th>
                <th className="px-4 py-3">{locale === "en" ? "Last activity" : "Hoạt động gần nhất"}</th>
                <th className="w-20 px-4 py-3 text-center">{locale === "en" ? "Delete" : "Xóa"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/10 dark:divide-white/10">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center">
                    <span className="inline-flex items-center gap-3 text-sm theme-text-body">
                      <LoaderCircle className="h-4 w-4 animate-spin theme-accent" />
                      {locale === "en" ? "Loading forum threads..." : "Đang tải chủ đề forum..."}
                    </span>
                  </td>
                </tr>
              ) : paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm theme-text-muted">
                    {locale === "en" ? "No forum thread matches the current filters." : "Không có chủ đề nào khớp bộ lọc hiện tại."}
                  </td>
                </tr>
              ) : (
                paginatedRows.map((thread, index) => (
                  <tr key={thread.id} className="transition hover:bg-[rgba(23,114,208,0.05)]">
                    <td
                      style={{ left: 0, width: 72, minWidth: 72 }}
                      className={cn("px-4 py-3 text-center font-semibold theme-text-soft", stickyFirstColumnClass)}
                    >
                      {startIndex + index + 1}
                    </td>
                    <td
                      style={{ left: 72, minWidth: 360 }}
                      className={cn("max-w-[360px] px-4 py-3", stickySecondColumnClass)}
                    >
                      <Link
                        href={`/forum?thread=${encodeURIComponent(thread.slug)}`}
                        className="group inline-flex min-w-0 flex-col rounded-xl transition hover:text-sky-700 dark:hover:text-sky-200"
                      >
                        <span className="truncate font-semibold theme-text-strong group-hover:text-sky-700 dark:group-hover:text-sky-200">
                          {thread.title}
                        </span>
                        <span className="mt-1 line-clamp-1 text-xs leading-5 theme-text-muted">
                          {thread.summary}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold theme-text-strong">{thread.author.name}</p>
                      <p className="mt-1 truncate text-xs theme-text-soft">{thread.author.university || thread.university}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="theme-chip inline-flex rounded-full px-3 py-1 text-[0.68rem] font-semibold">
                        {getCategoryLabel(locale, thread.category)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusPill tone={thread.status === "open" ? "success" : "warning"}>
                        {getStatusLabel(locale, thread.status)}
                      </StatusPill>
                    </td>
                    <td className="px-4 py-3 text-center font-semibold theme-text-strong">{thread.replyCount}</td>
                    <td className="px-4 py-3">
                      <p className="text-xs theme-text-soft">{formatAdminForumDate(locale, thread.lastActivityAt)}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <IconActionButton
                        label={locale === "en" ? "Delete thread" : "Xóa chủ đề"}
                        disabled={isDeletingSlug === thread.slug}
                        onClick={() => setPendingDeleteThread(thread)}
                      >
                        {isDeletingSlug === thread.slug ? (
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </IconActionButton>
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
          totalRows={filteredThreads.length}
          onPageChange={setPage}
        />
      </Surface>

      {pendingDeleteThread ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[rgba(7,18,35,0.62)] p-4 backdrop-blur-sm">
          <div className="theme-panel theme-card-shadow w-full max-w-lg rounded-[1.8rem] border px-6 py-6">
            <div className="flex items-start gap-4">
              <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-rose-500/24 bg-rose-500/12 text-rose-800 dark:text-rose-100">
                <Trash2 className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-lg font-semibold theme-text-strong">
                  {locale === "en" ? "Delete forum thread?" : "Xóa chủ đề forum?"}
                </p>
                <p className="mt-3 text-sm leading-7 theme-text-muted">
                  {locale === "en"
                    ? `This will remove "${pendingDeleteThread.title}" and all replies from the forum.`
                    : `Hành động này sẽ xóa "${pendingDeleteThread.title}" và toàn bộ phản hồi khỏi forum.`}
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingDeleteThread(null)}
                className="theme-button-secondary inline-flex items-center justify-center rounded-full border px-4 py-2.5 text-sm font-semibold"
              >
                {locale === "en" ? "Cancel" : "Hủy"}
              </button>
              <button
                type="button"
                disabled={Boolean(isDeletingSlug)}
                onClick={() => void handleDeleteThread(pendingDeleteThread)}
                className="theme-button-danger inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
              >
                {isDeletingSlug ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                {locale === "en" ? "Delete thread" : "Xóa chủ đề"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
