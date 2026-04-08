"use client";

import Link from "next/link";
import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  CirclePlus,
  LoaderCircle,
  MessageSquare,
  Search,
  Sparkles,
  UsersRound,
  X,
} from "lucide-react";

import { pickText } from "@/lib/site";
import type { ForumReply, ForumThread, ForumThreadCategory, LocalizedText } from "@/types/site";
import { useSiteState } from "@/components/providers/site-state-provider";
import { GradientAvatar, Surface } from "@/components/site-ui";

type ForumThreadsPayload = {
  threads: ForumThread[];
};

type ForumThreadPayload = {
  thread: ForumThread;
};

type ForumModerationIssue = {
  field: "title" | "summary" | "body" | "contactNote" | "preferredRoles" | "reply";
  category: "profanity" | "sexual-content" | "abusive-content";
  terms: string[];
};

type ForumMutationPayload = {
  error?: string;
  slug?: string;
  issues?: ForumModerationIssue[];
};

const forumCategoryCopy: Record<
  ForumThreadCategory,
  { label: LocalizedText; description: LocalizedText }
> = {
  "looking-for-team": {
    label: { en: "Looking for team", vi: "Tìm đội" },
    description: {
      en: "For participants who want to join an existing team.",
      vi: "Dành cho thí sinh muốn tìm một đội đang tuyển thành viên.",
    },
  },
  "team-looking-for-members": {
    label: { en: "Team recruiting", vi: "Đội đang tuyển" },
    description: {
      en: "For teams that still need members before they lock their roster.",
      vi: "Dành cho các đội đang cần thêm người trước khi chốt đội hình.",
    },
  },
  "general-discussion": {
    label: { en: "General discussion", vi: "Trao đổi chung" },
    description: {
      en: "For broader questions about skills, expectations, and collaboration.",
      vi: "Dành cho trao đổi chung về kỹ năng, kỳ vọng và cách phối hợp.",
    },
  },
};

const forumCategoryOrder: ForumThreadCategory[] = [
  "looking-for-team",
  "team-looking-for-members",
  "general-discussion",
];

const THREADS_PER_PAGE = 10;

function formatForumTimestamp(locale: "en" | "vi", value: string) {
  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getForumCategoryLabel(locale: "en" | "vi", category: ForumThreadCategory) {
  return pickText(locale, forumCategoryCopy[category].label);
}

function getForumAuthorHref(userId: string) {
  return `/users/${userId}`;
}

function trimForumPreview(value: string, maxLength = 168) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength).trimEnd()}...`;
}

function getForumRoleLabel(locale: "en" | "vi", role: ForumThread["author"]["role"]) {
  if (role === "admin") {
    return locale === "en" ? "Admin" : "Quản trị";
  }

  if (role === "moderator") {
    return locale === "en" ? "Moderator" : "Điều phối";
  }

  if (role === "judge") {
    return locale === "en" ? "Judge" : "Giám khảo";
  }

  return locale === "en" ? "Participant" : "Thí sinh";
}

function getForumModerationFieldLabel(locale: "en" | "vi", field: ForumModerationIssue["field"]) {
  switch (field) {
    case "title":
      return locale === "en" ? "Thread title" : "Tiêu đề chủ đề";
    case "summary":
      return locale === "en" ? "Short summary" : "Mô tả ngắn";
    case "body":
      return locale === "en" ? "Main post" : "Nội dung chính";
    case "contactNote":
      return locale === "en" ? "Contact note" : "Ghi chú liên hệ";
    case "preferredRoles":
      return locale === "en" ? "Roles or skills" : "Vai trò hoặc kỹ năng";
    case "reply":
      return locale === "en" ? "Reply content" : "Nội dung phản hồi";
  }
}

function getForumModerationCategoryLabel(locale: "en" | "vi", category: ForumModerationIssue["category"]) {
  switch (category) {
    case "profanity":
      return locale === "en" ? "Vulgar language" : "Từ ngữ tục tĩu";
    case "sexual-content":
      return locale === "en" ? "Sexual content" : "Nội dung gợi dục";
    case "abusive-content":
      return locale === "en" ? "Abusive language" : "Ngôn ngữ công kích";
  }
}

function ForumModerationWarning({
  locale,
  issues,
  className = "",
}: {
  locale: "en" | "vi";
  issues: ForumModerationIssue[];
  className?: string;
}) {
  if (issues.length === 0) {
    return null;
  }

  return (
    <div className={`rounded-[1.4rem] border border-amber-400/26 bg-[linear-gradient(135deg,rgba(251,191,36,0.16),rgba(255,255,255,0.88))] px-4 py-4 text-left shadow-[0_18px_34px_rgba(120,53,15,0.08)] dark:bg-[linear-gradient(135deg,rgba(251,191,36,0.16),rgba(15,23,42,0.82))] dark:shadow-none ${className}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-400/18 text-amber-800 dark:text-amber-100">
          <AlertTriangle className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold theme-text-strong">
            {locale === "en"
              ? "Please revise the highlighted wording before posting."
              : "Hãy chỉnh lại các nội dung được đánh dấu trước khi đăng."}
          </p>
          <p className="mt-2 text-sm leading-7 theme-text-muted">
            {locale === "en"
              ? "The forum blocks vulgar, sexual, or abusive wording. Remove or rewrite the items below and try again."
              : "Forum sẽ chặn từ ngữ tục tĩu, gợi dục hoặc công kích. Hãy sửa hoặc viết lại các mục dưới đây rồi thử lại."}
          </p>
          <div className="mt-4 space-y-3">
            {issues.map((issue, index) => (
              <div
                key={`${issue.field}-${issue.category}-${index}`}
                className="rounded-[1.15rem] border border-amber-500/18 bg-white/72 px-3.5 py-3 dark:bg-white/[0.05]"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.22em] theme-eyebrow">
                  {getForumModerationFieldLabel(locale, issue.field)} · {getForumModerationCategoryLabel(locale, issue.category)}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {issue.terms.map((term) => (
                    <span
                      key={term}
                      className="rounded-full border border-amber-500/24 bg-amber-500/12 px-2.5 py-1 text-[0.72rem] font-medium text-slate-950 dark:text-amber-100"
                    >
                      {term}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ForumPage() {
  const { locale, currentUser, isAuthenticated } = useSiteState();
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [activeThreadSlug, setActiveThreadSlug] = useState<string>("");
  const [activeThread, setActiveThread] = useState<ForumThread | null>(null);
  const [listError, setListError] = useState("");
  const [detailError, setDetailError] = useState("");
  const [composerError, setComposerError] = useState("");
  const [replyError, setReplyError] = useState("");
  const [composerModerationIssues, setComposerModerationIssues] = useState<ForumModerationIssue[]>([]);
  const [replyModerationIssues, setReplyModerationIssues] = useState<ForumModerationIssue[]>([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [isLoadingThreads, setIsLoadingThreads] = useState(true);
  const [isLoadingThreadDetail, setIsLoadingThreadDetail] = useState(false);
  const [isCreatingThread, setIsCreatingThread] = useState(false);
  const [isPostingReply, setIsPostingReply] = useState(false);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<ForumThreadCategory | "all">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [replyDraft, setReplyDraft] = useState("");
  const [threadDraft, setThreadDraft] = useState({
    title: "",
    category: "looking-for-team" as ForumThreadCategory,
    preferredRoles: "",
    summary: "",
    body: "",
    contactNote: "",
  });

  const deferredSearchValue = useDeferredValue(searchValue);
  const canPostAsParticipant = isAuthenticated && currentUser.role === "student";

  const loadThreads = useCallback(async () => {
    setIsLoadingThreads(true);
    setListError("");

    try {
      const response = await fetch("/api/forum/threads", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Unable to load forum threads.");
      }

      const payload = (await response.json()) as ForumThreadsPayload;
      setThreads(payload.threads);
    } catch (error) {
      setListError(error instanceof Error ? error.message : "Unable to load forum threads.");
    } finally {
      setIsLoadingThreads(false);
    }
  }, []);

  const loadThreadDetail = useCallback(async (slug: string) => {
    if (!slug) {
      setActiveThread(null);
      return;
    }

    setIsLoadingThreadDetail(true);
    setDetailError("");

    try {
      const response = await fetch(`/api/forum/threads/${slug}`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Unable to load this discussion.");
      }

      const payload = (await response.json()) as ForumThreadPayload;
      setActiveThread(payload.thread);
    } catch (error) {
      setDetailError(error instanceof Error ? error.message : "Unable to load this discussion.");
    } finally {
      setIsLoadingThreadDetail(false);
    }
  }, []);

  useEffect(() => {
    void loadThreads();
  }, [loadThreads]);

  useEffect(() => {
    if (threads.length === 0) {
      setActiveThreadSlug("");
      setActiveThread(null);
      return;
    }

    const hasCurrentThread = threads.some((thread) => thread.slug === activeThreadSlug);
    if (activeThreadSlug && !hasCurrentThread) {
      setActiveThreadSlug("");
      setActiveThread(null);
    }
  }, [activeThreadSlug, threads]);

  useEffect(() => {
    void loadThreadDetail(activeThreadSlug);
  }, [activeThreadSlug, loadThreadDetail]);

  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, deferredSearchValue]);

  useEffect(() => {
    if (!isComposerOpen) {
      return;
    }

    const { overflow: bodyOverflow } = document.body.style;
    const { overflow: htmlOverflow } = document.documentElement.style;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = bodyOverflow;
      document.documentElement.style.overflow = htmlOverflow;
    };
  }, [isComposerOpen]);

  useEffect(() => {
    if (composerModerationIssues.length === 0) {
      return;
    }

    setComposerModerationIssues([]);
  }, [threadDraft, composerModerationIssues.length]);

  useEffect(() => {
    if (replyModerationIssues.length === 0) {
      return;
    }

    setReplyModerationIssues([]);
  }, [replyDraft, replyModerationIssues.length]);

  const filteredThreads = useMemo(() => {
    const normalizedSearch = deferredSearchValue.trim().toLowerCase();

    return threads.filter((thread) => {
      const matchesCategory = categoryFilter === "all" || thread.category === categoryFilter;
      if (!matchesCategory) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return [
        thread.title,
        thread.summary,
        thread.author.name,
        thread.university,
        ...thread.preferredRoles,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [categoryFilter, deferredSearchValue, threads]);

  const selectedThreadFromList =
    threads.find((thread) => thread.slug === activeThreadSlug) ?? null;

  const totalPages = Math.max(1, Math.ceil(filteredThreads.length / THREADS_PER_PAGE));
  const currentListPage = Math.min(currentPage, totalPages);
  const paginatedThreads = filteredThreads.slice(
    (currentListPage - 1) * THREADS_PER_PAGE,
    currentListPage * THREADS_PER_PAGE,
  );

  const activeCategoryDescription =
    categoryFilter === "all"
      ? locale === "en"
        ? "Browse all open conversations from participants looking for teammates or building discussion."
        : "Xem toàn bộ cuộc trò chuyện của thí sinh đang tìm đồng đội hoặc trao đổi chung."
      : pickText(locale, forumCategoryCopy[categoryFilter].description);

  const resetComposer = () => {
    setThreadDraft({
      title: "",
      category: "looking-for-team",
      preferredRoles: "",
      summary: "",
      body: "",
      contactNote: "",
    });
  };

  const handleCreateThread = async () => {
    setComposerError("");
    setComposerModerationIssues([]);
    setStatusMessage("");
    setIsCreatingThread(true);

    try {
      const response = await fetch("/api/forum/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: threadDraft.title,
          category: threadDraft.category,
          preferredRoles: threadDraft.preferredRoles
            .split(",")
            .map((role) => role.trim())
            .filter(Boolean),
          summary: threadDraft.summary,
          body: threadDraft.body,
          contactNote: threadDraft.contactNote,
        }),
      });

      const payload = (await response.json()) as ForumMutationPayload;

      if (!response.ok) {
        if (payload.issues?.length) {
          setComposerModerationIssues(payload.issues);
          setComposerError("");
          return;
        }

        throw new Error(payload.error ?? "Unable to create this thread.");
      }

      await loadThreads();
      setActiveThreadSlug(payload.slug ?? "");
      setIsComposerOpen(false);
      resetComposer();
      setStatusMessage(
        locale === "en"
          ? "Thread created. It is now live in the forum."
          : "Chủ đề đã được tạo và đang hiển thị trên forum.",
      );
    } catch (error) {
      setComposerError(error instanceof Error ? error.message : "Unable to create this thread.");
    } finally {
      setIsCreatingThread(false);
    }
  };

  const handleReply = async () => {
    if (!activeThreadSlug) {
      return;
    }

    setReplyError("");
    setReplyModerationIssues([]);
    setStatusMessage("");
    setIsPostingReply(true);

    try {
      const response = await fetch(`/api/forum/threads/${activeThreadSlug}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ body: replyDraft }),
      });

      const payload = (await response.json()) as ForumMutationPayload;
      if (!response.ok) {
        if (payload.issues?.length) {
          setReplyModerationIssues(payload.issues);
          setReplyError("");
          return;
        }

        throw new Error(payload.error ?? "Unable to post this reply.");
      }

      setReplyDraft("");
      await Promise.all([loadThreads(), loadThreadDetail(activeThreadSlug)]);
      setStatusMessage(
        locale === "en"
          ? "Reply posted to the discussion."
          : "Phản hồi đã được gửi vào cuộc thảo luận.",
      );
    } catch (error) {
      setReplyError(error instanceof Error ? error.message : "Unable to post this reply.");
    } finally {
      setIsPostingReply(false);
    }
  };

  const handleReplyKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) {
      return;
    }

    event.preventDefault();
    if (isPostingReply || !replyDraft.trim()) {
      return;
    }

    void handleReply();
  };

  return (
    <div className="space-y-8 md:space-y-10">
      <section className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Surface className="overflow-hidden px-0 py-0 xl:sticky xl:top-24 xl:self-start">
          <div className="border-b theme-border px-5 py-5">
            <div className="theme-news-search flex items-center gap-3 rounded-[1.4rem] border px-4 py-3">
              <span className="theme-news-search-icon inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                <Search className="h-4 w-4" />
              </span>
              <input
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder={locale === "en" ? "Search by title, university, or role" : "Tìm theo tiêu đề, trường hoặc vai trò"}
                className="theme-news-search-input min-w-0 flex-1 bg-transparent text-sm outline-none"
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCategoryFilter("all")}
                className={`rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] ${
                  categoryFilter === "all" ? "theme-kicker" : "theme-chip"
                }`}
              >
                {locale === "en" ? "All threads" : "Tất cả"}
              </button>
              {forumCategoryOrder.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setCategoryFilter(category)}
                  className={`rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] ${
                    categoryFilter === category ? "theme-kicker" : "theme-chip"
                  }`}
                >
                  {getForumCategoryLabel(locale, category)}
                </button>
              ))}
            </div>
            <div className="mt-4 rounded-[1.35rem] border theme-border theme-panel-subtle px-4 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold theme-text-strong">
                  {filteredThreads.length} {locale === "en" ? "matching threads" : "chủ đề phù hợp"}
                </p>
              </div>
              <p className="mt-2 text-sm leading-6 theme-text-muted">{activeCategoryDescription}</p>
            </div>
          </div>
        </Surface>

        <Surface className="px-0 py-0">
          {selectedThreadFromList ? (
            <div className="min-h-[720px]">
              <div className="border-b theme-border px-6 py-6 md:px-7">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveThreadSlug("");
                        setActiveThread(null);
                        setDetailError("");
                        setReplyError("");
                      }}
                      className="theme-button-secondary inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      {locale === "en" ? "Back to thread list" : "Quay lại danh sách chủ đề"}
                    </button>
                    <h2 className="theme-heading min-w-0 text-2xl font-semibold leading-[1.15] theme-text-strong md:text-[2.3rem]">
                      {selectedThreadFromList.title}
                    </h2>
                    <span className="theme-chip rounded-full px-3 py-1 text-[0.66rem]">
                      {locale === "en" ? "Last activity" : "Hoạt động gần nhất"} ·{" "}
                      {formatForumTimestamp(locale, selectedThreadFromList.lastActivityAt)}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="theme-kicker rounded-full px-3 py-1 text-[0.66rem] tracking-[0.2em]">
                      {getForumCategoryLabel(locale, selectedThreadFromList.category)}
                    </span>
                  </div>
                  <p className="mt-4 text-sm leading-7 theme-text-muted">{selectedThreadFromList.summary}</p>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-4">
                  <Link
                    href={getForumAuthorHref(selectedThreadFromList.author.id)}
                    className="group flex items-center gap-3 rounded-[1rem] transition hover:opacity-90"
                  >
                    <GradientAvatar
                      label={selectedThreadFromList.author.name}
                      tone={selectedThreadFromList.author.avatarTone}
                      imageSrc={selectedThreadFromList.author.avatarImageSrc}
                      className="h-11 w-11 rounded-full"
                    />
                    <div>
                      <p className="text-sm font-semibold theme-text-strong transition group-hover:text-sky-700 dark:group-hover:text-sky-200">
                        {selectedThreadFromList.author.name}
                      </p>
                      <p className="text-xs theme-text-soft">
                        {selectedThreadFromList.university || (locale === "en" ? "Participant" : "Thí sinh")}
                      </p>
                    </div>
                  </Link>
                  <span className="theme-chip rounded-full px-3 py-1 text-[0.72rem]">
                    <UsersRound className="mr-1 inline h-3.5 w-3.5" />
                    {selectedThreadFromList.replyCount} {locale === "en" ? "replies" : "phản hồi"}
                  </span>
                </div>
              </div>

              <div className="space-y-6 px-6 py-6 md:px-7">
                {isLoadingThreadDetail ? (
                  <div className="flex items-center gap-3 rounded-[1.4rem] border theme-border px-4 py-4 theme-panel-subtle">
                    <LoaderCircle className="h-4 w-4 animate-spin theme-accent" />
                    <span className="text-sm theme-text-body">
                      {locale === "en" ? "Loading discussion..." : "Đang tải thảo luận..."}
                    </span>
                  </div>
                ) : detailError ? (
                  <div className="rounded-[1.4rem] border border-rose-500/18 bg-rose-500/10 px-4 py-4 text-sm text-rose-800 dark:text-rose-100">
                    {detailError}
                  </div>
                ) : activeThread ? (
                  <>
                    <div className="rounded-[1.6rem] border theme-border bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(241,247,253,0.88))] px-5 py-5 shadow-[0_18px_36px_rgba(13,37,66,0.06)] dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.04))] dark:shadow-none">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] theme-eyebrow">
                          {locale === "en" ? "Main thread post" : "Bài đăng chính"}
                        </p>
                        <span className="theme-chip rounded-full px-3 py-1 text-[0.68rem]">
                          {formatForumTimestamp(locale, selectedThreadFromList.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm leading-8 theme-text-body whitespace-pre-line">{activeThread.body}</p>
                      {activeThread.contactNote ? (
                        <div className="mt-5 rounded-[1.25rem] border theme-border bg-white/76 px-4 py-4 dark:bg-white/[0.05]">
                          <p className="text-xs font-semibold uppercase tracking-[0.22em] theme-eyebrow">
                            {locale === "en" ? "Preferred contact note" : "Ghi chú liên hệ"}
                          </p>
                          <p className="mt-2 text-sm leading-7 theme-text-body">{activeThread.contactNote}</p>
                        </div>
                      ) : null}
                      {activeThread.preferredRoles.length > 0 ? (
                        <div className="mt-5 flex flex-wrap gap-2">
                          {activeThread.preferredRoles.map((role) => (
                            <span
                              key={role}
                              className="rounded-full border border-sky-500/22 bg-[linear-gradient(135deg,rgba(37,99,235,0.12),rgba(14,165,233,0.08))] px-3 py-1 text-[0.72rem] font-medium text-sky-800 shadow-[0_10px_24px_rgba(37,99,235,0.06)] dark:border-sky-300/22 dark:bg-sky-300/[0.12] dark:text-sky-100 dark:shadow-none"
                            >
                              {role}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.28em] theme-eyebrow">
                        {locale === "en" ? "Replies" : "Phản hồi"}
                      </p>
                      <div className="mt-4 space-y-3">
                        {activeThread.replies && activeThread.replies.length > 0 ? (
                          activeThread.replies.map((reply: ForumReply) => (
                            <div
                              key={reply.id}
                              className="rounded-[1.45rem] border theme-border bg-white/70 px-4 py-4 shadow-[0_12px_28px_rgba(13,37,66,0.04)] dark:bg-white/[0.04] dark:shadow-none"
                            >
                              <div className="flex items-center gap-3">
                                <Link
                                  href={getForumAuthorHref(reply.author.id)}
                                  className="group flex min-w-0 items-center gap-3 rounded-[1rem] transition hover:opacity-90"
                                >
                                  <GradientAvatar
                                    label={reply.author.name}
                                    tone={reply.author.avatarTone}
                                    imageSrc={reply.author.avatarImageSrc}
                                    className="h-10 w-10 rounded-full"
                                  />
                                  <div className="min-w-0">
                                    <p className="text-sm font-semibold theme-text-strong transition group-hover:text-sky-700 dark:group-hover:text-sky-200">
                                      {reply.author.name}
                                    </p>
                                  </div>
                                </Link>
                                <div className="min-w-0">
                                  <p className="text-xs theme-text-soft">
                                    {formatForumTimestamp(locale, reply.createdAt)}
                                  </p>
                                </div>
                              </div>
                              <p className="mt-4 text-sm leading-7 theme-text-body whitespace-pre-line">{reply.body}</p>
                            </div>
                          ))
                        ) : (
                          <div className="rounded-[1.4rem] border theme-border px-4 py-4 theme-panel-subtle">
                            <p className="text-sm theme-text-muted">
                              {locale === "en"
                                ? "No reply yet. Start the conversation from the composer below."
                                : "Chưa có phản hồi nào. Hãy bắt đầu cuộc trao đổi bằng khung trả lời bên dưới."}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="rounded-[1.6rem] border theme-border px-5 py-5 theme-panel-subtle">
                      <div className="rounded-[1.45rem] border theme-border bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(244,249,255,0.84))] px-5 py-5 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))]">
                      <p className="text-xs font-semibold uppercase tracking-[0.28em] theme-eyebrow">
                        {locale === "en" ? "Join the conversation" : "Tham gia trao đổi"}
                      </p>
                      {!canPostAsParticipant ? (
                        <div className="mt-4 rounded-[1.35rem] border theme-border px-4 py-4 bg-white/76 dark:bg-white/[0.05]">
                          <p className="text-sm leading-7 theme-text-body">
                            {locale === "en"
                              ? "Only signed-in participant accounts can reply. Browsing remains open to everyone."
                              : "Chỉ tài khoản thí sinh đã đăng nhập mới có thể phản hồi. Việc xem nội dung vẫn mở cho mọi người."}
                          </p>
                          <Link
                            href="/auth"
                            className="theme-button-secondary mt-4 inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold"
                          >
                            {locale === "en" ? "Sign in now" : "Đăng nhập ngay"}
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </div>
                      ) : (
                        <>
                          <textarea
                            value={replyDraft}
                            onChange={(event) => setReplyDraft(event.target.value)}
                            onKeyDown={handleReplyKeyDown}
                            placeholder={
                              locale === "en"
                                ? "Write a useful reply about your background, what role you can take, and how people should contact you."
                                : "Viết một phản hồi hữu ích về nền tảng của bạn, vai trò bạn có thể đảm nhận và cách mọi người nên liên hệ với bạn."
                            }
                            className="theme-field mt-4 min-h-[140px] w-full rounded-[1.35rem] border px-4 py-3 text-sm leading-7 outline-none"
                          />
                          <ForumModerationWarning
                            locale={locale}
                            issues={replyModerationIssues}
                            className="mt-3"
                          />
                          {replyError ? (
                            <p className="mt-3 text-sm text-rose-700 dark:text-rose-200">{replyError}</p>
                          ) : null}
                          <div className="mt-4 flex flex-wrap items-center gap-3">
                            <button
                              type="button"
                              onClick={() => void handleReply()}
                              disabled={isPostingReply || !replyDraft.trim()}
                              className="theme-button-primary inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
                            >
                              {isPostingReply ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                              {locale === "en" ? "Post reply" : "Gửi phản hồi"}
                            </button>
                            {statusMessage ? <span className="text-sm theme-text-soft">{statusMessage}</span> : null}
                          </div>
                        </>
                      )}
                      </div>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="min-h-[720px]">
              <div className="border-b theme-border px-6 py-6 md:px-7">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="theme-chip rounded-full px-3 py-1 text-[0.68rem]">
                      <MessageSquare className="mr-1 inline h-3.5 w-3.5" />
                      {filteredThreads.length} {locale === "en" ? "active threads" : "chủ đề đang hoạt động"}
                    </span>
                    <span className="theme-chip rounded-full px-3 py-1 text-[0.68rem]">
                      {locale === "en"
                        ? `Sorted by recent activity`
                        : "Sắp theo hoạt động gần nhất"}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setIsComposerOpen(true)}
                      disabled={!canPostAsParticipant}
                      className="inline-flex items-center gap-3 rounded-full border border-sky-500/24 bg-[linear-gradient(135deg,rgba(37,99,235,0.98),rgba(14,165,233,0.9))] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_18px_34px_rgba(37,99,235,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_40px_rgba(37,99,235,0.28)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 dark:border-sky-300/18 dark:bg-[linear-gradient(135deg,rgba(14,165,233,0.88),rgba(37,99,235,0.78))] dark:shadow-[0_18px_34px_rgba(2,8,20,0.28)]"
                    >
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/18 ring-1 ring-white/18">
                        <Sparkles className="h-4 w-4" />
                      </span>
                      {locale === "en" ? "Open a thread" : "Mở chủ đề"}
                    </button>
                    {!canPostAsParticipant ? (
                      <Link
                        href="/auth"
                        className="theme-button-secondary inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold"
                      >
                        {locale === "en" ? "Sign in to participate" : "Đăng nhập để tham gia"}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    ) : null}
                  </div>
                </div>
                {statusMessage ? <p className="mt-4 text-sm theme-text-soft">{statusMessage}</p> : null}
              </div>

              <div className="space-y-6 px-6 py-6 md:px-7">
                {isLoadingThreads ? (
                  <div className="flex items-center gap-3 rounded-[1.4rem] border theme-border px-4 py-4 theme-panel-subtle">
                    <LoaderCircle className="h-4 w-4 animate-spin theme-accent" />
                    <span className="text-sm theme-text-body">
                      {locale === "en" ? "Loading discussion threads..." : "Đang tải danh sách thảo luận..."}
                    </span>
                  </div>
                ) : listError ? (
                  <div className="rounded-[1.4rem] border border-rose-500/18 bg-rose-500/10 px-4 py-4 text-sm text-rose-800 dark:text-rose-100">
                    {listError}
                  </div>
                ) : filteredThreads.length === 0 ? (
                  <div className="rounded-[1.4rem] border theme-border px-4 py-5 theme-panel-subtle">
                    <p className="text-sm font-semibold theme-text-strong">
                      {locale === "en" ? "No matching thread yet." : "Chưa có chủ đề phù hợp."}
                    </p>
                    <p className="mt-2 text-sm leading-7 theme-text-muted">
                      {locale === "en"
                        ? "Try another keyword or open the first thread for your own team-search message."
                        : "Hãy đổi từ khóa khác hoặc mở một chủ đề mới cho nhu cầu tìm đội của bạn."}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid gap-4">
                      {paginatedThreads.map((thread) => (
                        <button
                          key={thread.id}
                          type="button"
                          onClick={() => setActiveThreadSlug(thread.slug)}
                          className="w-full rounded-[1.45rem] border theme-border px-4 py-4 text-left theme-panel-subtle transition hover:-translate-y-0.5 hover:bg-[var(--panel)]"
                        >
                          <div className="flex items-start gap-4">
                            <GradientAvatar
                              label={thread.author.name}
                              tone={thread.author.avatarTone}
                              imageSrc={thread.author.avatarImageSrc}
                              className="h-12 w-12 rounded-full"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold theme-text-strong">
                                    {thread.author.name}
                                  </p>
                                  <p className="truncate text-xs theme-text-soft">
                                    {thread.author.university || thread.university || getForumRoleLabel(locale, thread.author.role)}
                                  </p>
                                </div>
                                <span className="text-[0.72rem] theme-text-soft">
                                  {locale === "en" ? "Last activity" : "Hoạt động gần nhất"} ·{" "}
                                  {formatForumTimestamp(locale, thread.lastActivityAt)}
                                </span>
                              </div>

                              <div className="mt-3 flex flex-wrap items-center gap-2">
                                <span className="theme-kicker rounded-full px-3 py-1 text-[0.66rem] tracking-[0.2em]">
                                  {getForumCategoryLabel(locale, thread.category)}
                                </span>
                                <span className="theme-chip rounded-full px-3 py-1 text-[0.66rem] tracking-[0.2em]">
                                  {thread.status === "open"
                                    ? locale === "en"
                                      ? "Open"
                                      : "Đang mở"
                                    : locale === "en"
                                      ? "Closed"
                                      : "Đã đóng"}
                                </span>
                                <span className="theme-chip rounded-full px-3 py-1 text-[0.66rem]">
                                  <UsersRound className="mr-1 inline h-3.5 w-3.5" />
                                  {thread.replyCount} {locale === "en" ? "replies" : "phản hồi"}
                                </span>
                                <span className="theme-chip rounded-full px-3 py-1 text-[0.66rem]">
                                  {getForumRoleLabel(locale, thread.author.role)}
                                </span>
                              </div>

                              <p className="mt-3 truncate text-base font-semibold leading-6 theme-text-strong">
                                {thread.title}
                              </p>
                              <p className="mt-1 truncate text-sm leading-6 theme-text-muted">
                                {thread.summary}
                              </p>

                              <div className="mt-3 rounded-[1.1rem] border theme-border bg-white/72 px-3.5 py-3 dark:bg-white/[0.05]">
                                <p className="truncate text-sm leading-6 theme-text-body">
                                  {trimForumPreview(thread.lastMessagePreview || thread.summary, 88)}
                                </p>
                                <p className="mt-1 truncate text-xs theme-text-soft">
                                  {(thread.lastMessageAuthorName || thread.author.name)} ·{" "}
                                  {formatForumTimestamp(locale, thread.lastMessageAt || thread.lastActivityAt)}
                                </p>
                              </div>

                              {thread.preferredRoles.length > 0 ? (
                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                  {thread.preferredRoles.slice(0, 3).map((role) => (
                                    <span key={role} className="theme-chip rounded-full px-3 py-1 text-[0.66rem]">
                                      {role}
                                    </span>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>

                    {totalPages > 1 ? (
                      <div className="flex flex-col gap-3 border-t theme-border pt-5 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm theme-text-soft">
                          {locale === "en"
                            ? `Page ${currentListPage} of ${totalPages}`
                            : `Trang ${currentListPage} / ${totalPages}`}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setCurrentPage((current) => Math.max(1, current - 1))}
                            disabled={currentListPage === 1}
                            className="theme-button-secondary inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold disabled:opacity-60"
                          >
                            <ChevronLeft className="h-4 w-4" />
                            {locale === "en" ? "Previous" : "Trước"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setCurrentPage((current) => Math.min(totalPages, current + 1))}
                            disabled={currentListPage === totalPages}
                            className="theme-button-secondary inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold disabled:opacity-60"
                          >
                            {locale === "en" ? "Next" : "Tiếp"}
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            </div>
          )}
        </Surface>
      </section>

      {isComposerOpen ? (
        <div className="fixed inset-0 z-[80] overflow-y-auto overscroll-contain bg-[rgba(7,18,35,0.58)] p-4 backdrop-blur-sm md:p-8">
          <div className="mx-auto max-w-3xl py-2 md:py-4">
            <Surface className="flex max-h-[calc(100vh-2rem)] flex-col overflow-hidden px-0 py-0 md:max-h-[calc(100vh-4rem)]">
              <div className="flex items-center justify-between border-b theme-border px-6 py-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] theme-eyebrow">
                    {locale === "en" ? "New forum thread" : "Chủ đề forum mới"}
                  </p>
                  <p className="mt-2 text-lg font-semibold theme-text-strong">
                    {locale === "en"
                      ? "Open a discussion for teammate matching"
                      : "Mở một chủ đề để kết nối tìm đồng đội"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsComposerOpen(false);
                    setComposerError("");
                  }}
                  className="theme-button-secondary inline-flex h-10 w-10 items-center justify-center rounded-full border"
                  aria-label={locale === "en" ? "Close dialog" : "Đóng cửa sổ"}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="overflow-y-auto overscroll-contain px-6 py-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.22em] theme-text-soft">
                      {locale === "en" ? "Thread title" : "Tiêu đề"}
                    </span>
                    <input
                      value={threadDraft.title}
                      onChange={(event) => setThreadDraft((current) => ({ ...current, title: event.target.value }))}
                      className="theme-field h-12 w-full rounded-[1rem] border px-4 text-sm outline-none"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.22em] theme-text-soft">
                      {locale === "en" ? "Category" : "Phân loại"}
                    </span>
                    <select
                      value={threadDraft.category}
                      onChange={(event) =>
                        setThreadDraft((current) => ({
                          ...current,
                          category: event.target.value as ForumThreadCategory,
                        }))
                      }
                      className="theme-field h-12 w-full rounded-[1rem] border px-4 text-sm outline-none"
                    >
                      {forumCategoryOrder.map((category) => (
                        <option key={category} value={category}>
                          {getForumCategoryLabel(locale, category)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-2 md:col-span-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.22em] theme-text-soft">
                      {locale === "en" ? "Roles or skills you want to mention" : "Vai trò hoặc kỹ năng bạn muốn nhắc đến"}
                    </span>
                    <input
                      value={threadDraft.preferredRoles}
                      onChange={(event) =>
                        setThreadDraft((current) => ({ ...current, preferredRoles: event.target.value }))
                      }
                      placeholder={
                        locale === "en"
                          ? "Example: Product, UI/UX, Data analysis, Frontend"
                          : "Ví dụ: Product, UI/UX, Phân tích dữ liệu, Frontend"
                      }
                      className="theme-field h-12 w-full rounded-[1rem] border px-4 text-sm outline-none"
                    />
                  </label>

                  <label className="space-y-2 md:col-span-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.22em] theme-text-soft">
                      {locale === "en" ? "Short summary" : "Mô tả ngắn"}
                    </span>
                    <textarea
                      value={threadDraft.summary}
                      onChange={(event) => setThreadDraft((current) => ({ ...current, summary: event.target.value }))}
                      className="theme-field min-h-[96px] w-full rounded-[1rem] border px-4 py-3 text-sm leading-7 outline-none"
                    />
                  </label>

                  <label className="space-y-2 md:col-span-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.22em] theme-text-soft">
                      {locale === "en" ? "Main post" : "Nội dung chính"}
                    </span>
                    <textarea
                      value={threadDraft.body}
                      onChange={(event) => setThreadDraft((current) => ({ ...current, body: event.target.value }))}
                      className="theme-field min-h-[180px] w-full rounded-[1rem] border px-4 py-3 text-sm leading-7 outline-none"
                    />
                  </label>

                  <label className="space-y-2 md:col-span-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.22em] theme-text-soft">
                      {locale === "en" ? "Contact note" : "Ghi chú liên hệ"}
                    </span>
                    <input
                      value={threadDraft.contactNote}
                      onChange={(event) => setThreadDraft((current) => ({ ...current, contactNote: event.target.value }))}
                      placeholder={
                        locale === "en"
                          ? "Example: I usually check forum replies every evening."
                          : "Ví dụ: Tôi thường xem phản hồi trên forum vào mỗi buổi tối."
                      }
                      className="theme-field h-12 w-full rounded-[1rem] border px-4 text-sm outline-none"
                    />
                  </label>
                </div>
              </div>

              <div className="border-t theme-border px-6 py-5">
                <ForumModerationWarning locale={locale} issues={composerModerationIssues} className="mb-3" />
                {composerError ? (
                  <p className="mb-3 text-sm text-rose-700 dark:text-rose-200">{composerError}</p>
                ) : null}
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => void handleCreateThread()}
                    disabled={isCreatingThread}
                    className="theme-button-primary inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
                  >
                    {isCreatingThread ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CirclePlus className="h-4 w-4" />}
                    {locale === "en" ? "Publish thread" : "Đăng chủ đề"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      resetComposer();
                      setComposerError("");
                    }}
                    className="theme-button-secondary inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold"
                  >
                    {locale === "en" ? "Clear form" : "Xóa nội dung"}
                  </button>
                </div>
              </div>
            </Surface>
          </div>
        </div>
      ) : null}
    </div>
  );
}
