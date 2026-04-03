"use client";

import Link from "next/link";
import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  CirclePlus,
  LoaderCircle,
  MessageSquare,
  Search,
  UsersRound,
  X,
} from "lucide-react";

import { pickText } from "@/lib/site";
import type { ForumReply, ForumThread, ForumThreadCategory, LocalizedText } from "@/types/site";
import { useSiteState } from "@/components/providers/site-state-provider";
import { GradientAvatar, SectionHeading, Surface } from "@/components/site-ui";

type ForumThreadsPayload = {
  threads: ForumThread[];
};

type ForumThreadPayload = {
  thread: ForumThread;
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

export function ForumPage() {
  const { locale, currentUser, isAuthenticated } = useSiteState();
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [activeThreadSlug, setActiveThreadSlug] = useState<string>("");
  const [activeThread, setActiveThread] = useState<ForumThread | null>(null);
  const [listError, setListError] = useState("");
  const [detailError, setDetailError] = useState("");
  const [composerError, setComposerError] = useState("");
  const [replyError, setReplyError] = useState("");
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

      const payload = (await response.json()) as { error?: string; slug?: string };

      if (!response.ok) {
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
    setStatusMessage("");
    setIsPostingReply(true);

    try {
      const response = await fetch(`/api/forum/threads/${activeThreadSlug}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ body: replyDraft }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
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
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] theme-eyebrow">
                {locale === "en" ? "Forum navigator" : "Điều hướng forum"}
              </p>
              <p className="mt-3 text-xl font-semibold theme-text-strong">
                {locale === "en" ? "Filter teammate-matching conversations" : "Lọc các cuộc trò chuyện tìm đồng đội"}
              </p>
            </div>
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
            <p className="mt-4 text-sm leading-7 theme-text-muted">{activeCategoryDescription}</p>
            <div className="mt-4 rounded-[1.35rem] border theme-border theme-panel-subtle px-4 py-4">
              <p className="text-sm font-semibold theme-text-strong">
                {filteredThreads.length} {locale === "en" ? "matching threads" : "chủ đề phù hợp"}
              </p>
              <p className="mt-2 text-sm leading-7 theme-text-muted">
                {locale === "en"
                  ? "Use the list on the right to review the newest active discussions, then open one when it matches your interest."
                  : "Dùng danh sách bên phải để xem các chủ đề đang hoạt động mới nhất, rồi mở cuộc trò chuyện phù hợp với nhu cầu của bạn."}
              </p>
            </div>
          </div>
        </Surface>

        <Surface className="px-0 py-0">
          {selectedThreadFromList ? (
            <div className="min-h-[720px]">
              <div className="border-b theme-border px-6 py-6 md:px-7">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
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
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="theme-kicker rounded-full px-3 py-1 text-[0.66rem] tracking-[0.2em]">
                        {getForumCategoryLabel(locale, selectedThreadFromList.category)}
                      </span>
                      <span className="theme-chip rounded-full px-3 py-1 text-[0.66rem]">
                        {locale === "en" ? "Last activity" : "Hoạt động gần nhất"} ·{" "}
                        {formatForumTimestamp(locale, selectedThreadFromList.lastActivityAt)}
                      </span>
                    </div>
                    <h2 className="theme-heading mt-4 text-2xl font-semibold leading-[1.15] theme-text-strong md:text-[2.3rem]">
                      {selectedThreadFromList.title}
                    </h2>
                    <p className="mt-3 text-sm leading-7 theme-text-muted">{selectedThreadFromList.summary}</p>
                  </div>
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
                    <div className="rounded-[1.6rem] border theme-border px-5 py-5 theme-panel-subtle">
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
                            <span key={role} className="theme-chip rounded-full px-3 py-1 text-[0.72rem]">
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
                              className="rounded-[1.45rem] border theme-border px-4 py-4 theme-panel-subtle"
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
                  </>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="min-h-[720px]">
              <div className="border-b theme-border px-6 py-6 md:px-7">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <SectionHeading
                    eyebrow={locale === "en" ? "Forum thread list" : "Danh sách chủ đề"}
                    title={
                      locale === "en"
                        ? "Open the newest active discussions from participants and teams."
                        : "Mở các cuộc trò chuyện đang hoạt động mới nhất từ thí sinh và đội thi."
                    }
                    description={
                      locale === "en"
                        ? "Threads are ordered by recent activity. Open one to read the full conversation or publish your own if you still need teammates."
                        : "Các chủ đề được sắp theo hoạt động gần nhất. Hãy mở một chủ đề để đọc toàn bộ cuộc trao đổi, hoặc đăng chủ đề mới nếu bạn vẫn cần đồng đội."
                    }
                  />

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setIsComposerOpen(true)}
                      disabled={!canPostAsParticipant}
                      className="theme-button-primary inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
                    >
                      <CirclePlus className="h-4 w-4" />
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
                          className="w-full rounded-[1.6rem] border theme-border px-5 py-5 text-left theme-panel-subtle transition hover:-translate-y-0.5 hover:bg-[var(--panel)]"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-2">
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
                            </div>
                            <span className="text-xs theme-text-soft">
                              {locale === "en" ? "Last activity" : "Hoạt động gần nhất"} ·{" "}
                              {formatForumTimestamp(locale, thread.lastActivityAt)}
                            </span>
                          </div>

                          <div className="mt-4 flex items-start gap-4">
                            <GradientAvatar
                              label={thread.author.name}
                              tone={thread.author.avatarTone}
                              imageSrc={thread.author.avatarImageSrc}
                              className="h-11 w-11 rounded-full"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-lg font-semibold leading-7 theme-text-strong">{thread.title}</p>
                              <p className="mt-2 text-sm leading-7 theme-text-muted">{thread.summary}</p>
                              <div className="mt-4 rounded-[1.25rem] border theme-border bg-white/76 px-4 py-4 dark:bg-white/[0.05]">
                                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] theme-eyebrow">
                                  {locale === "en" ? "Latest message" : "Tin nhắn mới nhất"}
                                </p>
                                <p className="mt-2 text-sm leading-7 theme-text-body">
                                  {trimForumPreview(thread.lastMessagePreview || thread.summary)}
                                </p>
                                <p className="mt-2 text-xs theme-text-soft">
                                  {(thread.lastMessageAuthorName || thread.author.name)} ·{" "}
                                  {formatForumTimestamp(locale, thread.lastMessageAt || thread.lastActivityAt)}
                                </p>
                              </div>
                              <div className="mt-4 flex flex-wrap items-center gap-2">
                                <span className="theme-chip rounded-full px-3 py-1 text-[0.68rem]">
                                  <MessageSquare className="mr-1 inline h-3.5 w-3.5" />
                                  {thread.replyCount} {locale === "en" ? "replies" : "phản hồi"}
                                </span>
                                <span className="theme-chip rounded-full px-3 py-1 text-[0.68rem]">
                                  {thread.author.name}
                                </span>
                                {thread.preferredRoles.slice(0, 3).map((role) => (
                                  <span key={role} className="theme-chip rounded-full px-3 py-1 text-[0.68rem]">
                                    {role}
                                  </span>
                                ))}
                              </div>
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
