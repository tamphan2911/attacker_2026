"use client";

import Link from "next/link";
import { useCallback, useDeferredValue, useEffect, useMemo, useState, type KeyboardEvent, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  CirclePlus,
  Lock,
  LoaderCircle,
  MessageSquare,
  Pencil,
  PencilLine,
  Search,
  Save,
  Sparkles,
  Trash2,
  UsersRound,
  X,
} from "lucide-react";

import { pickText } from "@/lib/site";
import type { ForumReply, ForumThread, ForumThreadCategory, TeamProfile } from "@/types/site";
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

type ForumPageContent = ReturnType<typeof useSiteState>["pageContent"]["forum"];

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

function formatForumDateTime(locale: "en" | "vi", value: string) {
  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getForumCategoryCopy(content: ForumPageContent, category: ForumThreadCategory) {
  if (category === "looking-for-team") {
    return {
      label: content.categoryLookingForTeamLabel,
      description: content.categoryLookingForTeamDescription,
    };
  }

  if (category === "team-looking-for-members") {
    return {
      label: content.categoryTeamRecruitingLabel,
      description: content.categoryTeamRecruitingDescription,
    };
  }

  return {
    label: content.categoryGeneralDiscussionLabel,
    description: content.categoryGeneralDiscussionDescription,
  };
}

function getForumCategoryLabel(locale: "en" | "vi", content: ForumPageContent, category: ForumThreadCategory) {
  return pickText(locale, getForumCategoryCopy(content, category).label);
}

function getForumAuthorHref(userId: string) {
  return `/users/${userId}`;
}

function canLinkForumAuthor(author: ForumThread["author"]) {
  return author.role === "student";
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

  if (role === "supporter") {
    return locale === "en" ? "Supporter" : "Supporter";
  }

  return locale === "en" ? "Participant" : "Thí sinh";
}

function getForumAuthorContext(
  locale: "en" | "vi",
  author: ForumThread["author"],
  teams: TeamProfile[],
) {
  if (author.role === "admin" || author.role === "moderator" || author.role === "judge") {
    return getForumRoleLabel(locale, author.role);
  }

  const team = teams.find((item) => item.memberIds.includes(author.id));
  if (!team) {
    return author.university || getForumRoleLabel(locale, author.role);
  }

  const position = team.leaderId === author.id
    ? locale === "en"
      ? "leader"
      : "trưởng nhóm"
    : locale === "en"
      ? "member"
      : "thành viên";

  return `${team.name} - ${position}`;
}

function ForumAuthorIdentity({
  author,
  teams,
  locale,
  subtitle,
  avatarClassName = "h-10 w-10 rounded-full",
}: {
  author: ForumThread["author"];
  teams: TeamProfile[];
  locale: "en" | "vi";
  subtitle?: string;
  avatarClassName?: string;
}) {
  const content = (
    <>
      <GradientAvatar
        label={author.name}
        tone={author.avatarTone}
        imageSrc={author.avatarImageSrc}
        className={avatarClassName}
      />
      <div className="min-w-0">
        <p className="text-sm font-semibold theme-text-strong transition group-hover:text-sky-700 dark:group-hover:text-sky-200">
          {author.name}{" "}
          <span className="font-medium theme-text-soft">
            ({getForumAuthorContext(locale, author, teams)})
          </span>
        </p>
        {subtitle ? <p className="truncate text-xs theme-text-soft">{subtitle}</p> : null}
      </div>
    </>
  );

  const className = "group flex min-w-0 items-center gap-3 rounded-[1rem] transition hover:opacity-90";

  if (canLinkForumAuthor(author)) {
    return (
      <Link
        href={getForumAuthorHref(author.id)}
        onClick={(event) => event.stopPropagation()}
        className={className}
      >
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}

function ForumCategorySelect({
  value,
  onChange,
  label,
  content,
  locale,
}: {
  value: ForumThreadCategory;
  onChange: (value: ForumThreadCategory) => void;
  label: string;
  content: ForumPageContent;
  locale: "en" | "vi";
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.22em] theme-text-soft">{label}</span>
      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value as ForumThreadCategory)}
          className="theme-admin-select theme-field h-12 w-full rounded-[1rem] border px-4 text-sm font-semibold outline-none"
        >
          {forumCategoryOrder.map((category) => (
            <option
              key={category}
              value={category}
              className="bg-white text-slate-950 dark:bg-slate-950 dark:text-slate-50"
            >
              {getForumCategoryLabel(locale, content, category)}
            </option>
          ))}
        </select>
      </div>
    </label>
  );
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

function ForumIconButton({
  label,
  tone = "default",
  disabled,
  onClick,
  children,
}: {
  label: string;
  tone?: "default" | "danger" | "success";
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
      className={`group relative inline-flex h-9 w-9 items-center justify-center rounded-full border disabled:cursor-not-allowed disabled:opacity-50 ${
        tone === "danger"
          ? "theme-button-danger"
          : tone === "success"
            ? "border-emerald-600/24 bg-emerald-500/12 text-emerald-900 transition hover:-translate-y-0.5 hover:bg-emerald-500/18 active:translate-y-0 dark:border-emerald-300/24 dark:text-emerald-100"
            : "theme-button-secondary"
      }`}
    >
      {children}
      <span className="pointer-events-none absolute -top-10 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-full border border-slate-900/8 bg-white px-3 py-1.5 text-[0.68rem] font-semibold tracking-[0.14em] text-slate-700 shadow-[0_12px_28px_rgba(15,23,42,0.12)] group-hover:flex dark:border-white/10 dark:bg-[rgba(7,18,35,0.96)] dark:text-white/80">
        {label}
      </span>
    </button>
  );
}

export function ForumPage() {
  const { locale, currentUser, isAuthenticated, teams, pageContent } = useSiteState();
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [activeThreadSlug, setActiveThreadSlug] = useState<string>("");
  const [activeThread, setActiveThread] = useState<ForumThread | null>(null);
  const [listError, setListError] = useState("");
  const [detailError, setDetailError] = useState("");
  const [composerError, setComposerError] = useState("");
  const [replyError, setReplyError] = useState("");
  const [threadActionError, setThreadActionError] = useState("");
  const [replyActionError, setReplyActionError] = useState("");
  const [composerModerationIssues, setComposerModerationIssues] = useState<ForumModerationIssue[]>([]);
  const [replyModerationIssues, setReplyModerationIssues] = useState<ForumModerationIssue[]>([]);
  const [threadEditModerationIssues, setThreadEditModerationIssues] = useState<ForumModerationIssue[]>([]);
  const [replyEditModerationIssues, setReplyEditModerationIssues] = useState<ForumModerationIssue[]>([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [isLoadingThreads, setIsLoadingThreads] = useState(true);
  const [isLoadingThreadDetail, setIsLoadingThreadDetail] = useState(false);
  const [isCreatingThread, setIsCreatingThread] = useState(false);
  const [isPostingReply, setIsPostingReply] = useState(false);
  const [isSavingThreadEdit, setIsSavingThreadEdit] = useState(false);
  const [isSavingReplyId, setIsSavingReplyId] = useState("");
  const [isDeletingReplyId, setIsDeletingReplyId] = useState("");
  const [isClosingThread, setIsClosingThread] = useState(false);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<ForumThreadCategory | "all">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [replyDraft, setReplyDraft] = useState("");
  const [editingReplyId, setEditingReplyId] = useState("");
  const [replyEditDraft, setReplyEditDraft] = useState("");
  const [isThreadEditOpen, setIsThreadEditOpen] = useState(false);
  const [pendingDeleteReply, setPendingDeleteReply] = useState<ForumReply | null>(null);
  const [pendingCloseThread, setPendingCloseThread] = useState<ForumThread | null>(null);
  const [threadDraft, setThreadDraft] = useState({
    title: "",
    category: "looking-for-team" as ForumThreadCategory,
    body: "",
    contactNote: "",
  });
  const [threadEditDraft, setThreadEditDraft] = useState({
    title: "",
    category: "looking-for-team" as ForumThreadCategory,
    body: "",
    contactNote: "",
  });

  const deferredSearchValue = useDeferredValue(searchValue);
  const canPostOnForum =
    isAuthenticated &&
    (currentUser.role === "student" || currentUser.role === "admin" || currentUser.role === "moderator");
  const canModerateForum = currentUser.role === "admin" || currentUser.role === "moderator";

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
    const threadSlug = new URLSearchParams(window.location.search).get("thread") ?? "";
    if (threadSlug) {
      setActiveThreadSlug(threadSlug);
    }
  }, []);

  useEffect(() => {
    if (isLoadingThreads) {
      return;
    }

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
  }, [activeThreadSlug, isLoadingThreads, threads]);

  useEffect(() => {
    void loadThreadDetail(activeThreadSlug);
  }, [activeThreadSlug, loadThreadDetail]);

  useEffect(() => {
    setIsThreadEditOpen(false);
    setEditingReplyId("");
    setThreadActionError("");
    setReplyActionError("");
    setThreadEditModerationIssues([]);
    setReplyEditModerationIssues([]);
    setPendingDeleteReply(null);
    setPendingCloseThread(null);
  }, [activeThreadSlug]);

  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, deferredSearchValue]);

  useEffect(() => {
    if (!isComposerOpen && !isThreadEditOpen) {
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
  }, [isComposerOpen, isThreadEditOpen]);

  useEffect(() => {
    if (!isComposerOpen && !isThreadEditOpen) {
      return;
    }

    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      setIsComposerOpen(false);
      setIsThreadEditOpen(false);
      setComposerError("");
      setThreadActionError("");
      setComposerModerationIssues([]);
      setThreadEditModerationIssues([]);
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isComposerOpen, isThreadEditOpen]);

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
        thread.body,
        thread.contactNote,
        thread.author.name,
        thread.university,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [categoryFilter, deferredSearchValue, threads]);

  const selectedThreadFromList =
    threads.find((thread) => thread.slug === activeThreadSlug) ?? null;
  const latestEditableReplyId = useMemo(() => {
    if (!activeThread?.replies || !currentUser.id) {
      return "";
    }

    return [...activeThread.replies]
      .reverse()
      .find((reply) => reply.author.id === currentUser.id && !reply.deletedAt)?.id ?? "";
  }, [activeThread?.replies, currentUser.id]);
  const canEditActiveThread = Boolean(activeThread && activeThread.author.id === currentUser.id);
  const canCloseActiveThread = Boolean(
    activeThread && activeThread.author.id === currentUser.id && activeThread.status === "open",
  );
  const canReplyToActiveThread = canPostOnForum && activeThread?.status === "open";

  const totalPages = Math.max(1, Math.ceil(filteredThreads.length / THREADS_PER_PAGE));
  const currentListPage = Math.min(currentPage, totalPages);
  const paginatedThreads = filteredThreads.slice(
    (currentListPage - 1) * THREADS_PER_PAGE,
    currentListPage * THREADS_PER_PAGE,
  );

  const activeCategoryDescription =
    categoryFilter === "all"
      ? pickText(locale, pageContent.forum.allCategoriesDescription)
      : pickText(locale, getForumCategoryCopy(pageContent.forum, categoryFilter).description);

  const resetComposer = () => {
    setThreadDraft({
      title: "",
      category: "looking-for-team",
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

  const reloadActiveThread = async () => {
    if (!activeThreadSlug) {
      return;
    }

    await Promise.all([loadThreads(), loadThreadDetail(activeThreadSlug)]);
  };

  const openThreadEditModal = () => {
    if (!activeThread) {
      return;
    }

    setThreadEditDraft({
      title: activeThread.title,
      category: activeThread.category,
      body: activeThread.body,
      contactNote: activeThread.contactNote,
    });
    setThreadActionError("");
    setThreadEditModerationIssues([]);
    setIsThreadEditOpen(true);
  };

  const closeThreadEditModal = () => {
    if (isSavingThreadEdit) {
      return;
    }

    setIsThreadEditOpen(false);
    setThreadActionError("");
    setThreadEditModerationIssues([]);
  };

  const handleSaveThreadEdit = async () => {
    if (!activeThread) {
      return;
    }

    setThreadActionError("");
    setThreadEditModerationIssues([]);
    setStatusMessage("");
    setIsSavingThreadEdit(true);

    try {
      const response = await fetch(`/api/forum/threads/${activeThread.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: threadEditDraft.title,
          category: threadEditDraft.category,
          body: threadEditDraft.body,
          contactNote: threadEditDraft.contactNote,
        }),
      });

      const payload = (await response.json()) as ForumMutationPayload;
      if (!response.ok) {
        if (payload.issues?.length) {
          setThreadEditModerationIssues(payload.issues);
          return;
        }

        throw new Error(payload.error ?? "Unable to update this thread.");
      }

      setIsThreadEditOpen(false);
      await reloadActiveThread();
      setStatusMessage(
        locale === "en"
          ? "Thread post updated successfully."
          : "Bài đăng đã được cập nhật thành công.",
      );
    } catch (error) {
      setThreadActionError(error instanceof Error ? error.message : "Unable to update this thread.");
    } finally {
      setIsSavingThreadEdit(false);
    }
  };

  const handleDeleteReply = async (reply: ForumReply) => {
    if (!activeThreadSlug) {
      return;
    }

    setReplyActionError("");
    setStatusMessage("");
    setIsDeletingReplyId(reply.id);

    try {
      const response = await fetch(`/api/forum/threads/${activeThreadSlug}/replies/${reply.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const payload = (await response.json().catch(() => null)) as ForumMutationPayload | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to delete this reply.");
      }

      await reloadActiveThread();
      setPendingDeleteReply(null);
      setStatusMessage(locale === "en" ? "Reply deleted." : "Phản hồi đã được xóa.");
    } catch (error) {
      setReplyActionError(error instanceof Error ? error.message : "Unable to delete this reply.");
    } finally {
      setIsDeletingReplyId("");
    }
  };

  const handleSaveReplyEdit = async (reply: ForumReply) => {
    if (!activeThreadSlug) {
      return;
    }

    setReplyActionError("");
    setReplyEditModerationIssues([]);
    setStatusMessage("");
    setIsSavingReplyId(reply.id);

    try {
      const response = await fetch(`/api/forum/threads/${activeThreadSlug}/replies/${reply.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ body: replyEditDraft }),
      });

      const payload = (await response.json()) as ForumMutationPayload;
      if (!response.ok) {
        if (payload.issues?.length) {
          setReplyEditModerationIssues(payload.issues);
          return;
        }

        throw new Error(payload.error ?? "Unable to update this reply.");
      }

      setEditingReplyId("");
      setReplyEditDraft("");
      await reloadActiveThread();
      setStatusMessage(locale === "en" ? "Reply updated." : "Phản hồi đã được cập nhật.");
    } catch (error) {
      setReplyActionError(error instanceof Error ? error.message : "Unable to update this reply.");
    } finally {
      setIsSavingReplyId("");
    }
  };

  const handleCloseThread = async () => {
    if (!activeThread) {
      return;
    }

    setThreadActionError("");
    setStatusMessage("");
    setIsClosingThread(true);

    try {
      const response = await fetch(`/api/forum/threads/${activeThread.slug}/close`, {
        method: "POST",
        credentials: "include",
      });

      const payload = (await response.json().catch(() => null)) as ForumMutationPayload | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to close this thread.");
      }

      setPendingCloseThread(null);
      await reloadActiveThread();
      setStatusMessage(
        locale === "en"
          ? "Thread closed. New replies are no longer accepted."
          : "Chủ đề đã đóng. Không thể gửi thêm phản hồi mới.",
      );
    } catch (error) {
      setThreadActionError(error instanceof Error ? error.message : "Unable to close this thread.");
    } finally {
      setIsClosingThread(false);
    }
  };

  const handleReplyKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
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
                placeholder={pickText(locale, pageContent.forum.searchPlaceholder)}
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
                {pickText(locale, pageContent.forum.allThreadsLabel)}
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
                  {getForumCategoryLabel(locale, pageContent.forum, category)}
                </button>
              ))}
            </div>
            <div className="mt-4 rounded-[1.35rem] border theme-border theme-panel-subtle px-4 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold theme-text-strong">
                  {filteredThreads.length} {pickText(locale, pageContent.forum.matchingThreadsSuffix)}
                </p>
              </div>
              <p className="mt-2 text-sm leading-6 theme-text-muted">{activeCategoryDescription}</p>
            </div>
          </div>
        </Surface>

        <Surface className="px-0 py-0">
          {selectedThreadFromList ? (
            <div className="min-h-[720px]">
              <div className="border-b theme-border px-5 py-5 md:px-6">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveThreadSlug("");
	                        setActiveThread(null);
	                        setDetailError("");
	                        setReplyError("");
	                        setThreadActionError("");
	                        setReplyActionError("");
	                        setIsThreadEditOpen(false);
	                        setEditingReplyId("");
	                      }}
                      className="theme-button-secondary inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      {pickText(locale, pageContent.forum.backToThreadListLabel)}
                    </button>
                    <h2 className="theme-heading min-w-0 flex-1 text-xl font-semibold leading-[1.2] theme-text-strong md:text-2xl">
                      {selectedThreadFromList.title}
                    </h2>
                    <span className="theme-chip rounded-full px-3 py-1 text-[0.66rem]">
                      {pickText(locale, pageContent.forum.lastActivityLabel)} ·{" "}
                      {formatForumTimestamp(locale, selectedThreadFromList.lastActivityAt)}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="theme-kicker rounded-full px-3 py-1 text-[0.66rem] tracking-[0.2em]">
                      {getForumCategoryLabel(locale, pageContent.forum, selectedThreadFromList.category)}
                    </span>
                    {selectedThreadFromList.status === "closed" ? (
                      <span className="rounded-full border border-amber-600/24 bg-amber-400/18 px-3 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-amber-950 shadow-[0_10px_24px_rgba(245,158,11,0.08)] dark:border-amber-300/22 dark:bg-amber-300/12 dark:text-amber-100 dark:shadow-none">
                        {pickText(locale, pageContent.forum.closedByOwnerLabel)}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <ForumAuthorIdentity
                    author={selectedThreadFromList.author}
                    teams={teams}
                    locale={locale}
                    subtitle={selectedThreadFromList.university || getForumRoleLabel(locale, selectedThreadFromList.author.role)}
                    avatarClassName="h-11 w-11 rounded-full"
                  />
                  <span className="theme-chip rounded-full px-3 py-1 text-[0.72rem]">
                    <UsersRound className="mr-1 inline h-3.5 w-3.5" />
                    {selectedThreadFromList.replyCount} {pickText(locale, pageContent.forum.repliesSuffix)}
                  </span>
                </div>
              </div>

              <div className="space-y-4 px-5 py-5 md:px-6">
                {isLoadingThreadDetail ? (
                  <div className="flex items-center gap-3 rounded-[1.4rem] border theme-border px-4 py-4 theme-panel-subtle">
                    <LoaderCircle className="h-4 w-4 animate-spin theme-accent" />
                    <span className="text-sm theme-text-body">
                      {pickText(locale, pageContent.forum.loadingDiscussionLabel)}
                    </span>
                  </div>
                ) : detailError ? (
                  <div className="rounded-[1.4rem] border border-rose-500/18 bg-rose-500/10 px-4 py-4 text-sm text-rose-800 dark:text-rose-100">
                    {detailError}
                  </div>
                ) : activeThread ? (
                  <>
	                    <div className="rounded-[1.4rem] border theme-border bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(241,247,253,0.88))] px-4 py-4 shadow-[0_14px_30px_rgba(13,37,66,0.05)] dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.04))] dark:shadow-none">
	                      <div className="flex flex-wrap items-center justify-between gap-3">
	                        <p className="text-xs font-semibold uppercase tracking-[0.28em] theme-eyebrow">
	                          {locale === "en" ? "Main thread post" : "Nội dung"}
	                        </p>
	                        <div className="flex flex-wrap items-center gap-2">
	                          <span className="theme-chip rounded-full px-3 py-1 text-[0.68rem]">
	                            {formatForumTimestamp(locale, selectedThreadFromList.createdAt)}
	                          </span>
	                          {canCloseActiveThread ? (
	                            <ForumIconButton
	                              label={locale === "en" ? "Close thread" : "Đóng chủ đề"}
	                              tone="danger"
	                              onClick={() => setPendingCloseThread(activeThread)}
	                            >
	                              <Lock className="h-4 w-4" />
	                            </ForumIconButton>
	                          ) : null}
	                          {canEditActiveThread ? (
	                            <ForumIconButton
	                              label={locale === "en" ? "Update thread post" : "Cập nhập bài đăng"}
	                              onClick={openThreadEditModal}
	                            >
	                              <PencilLine className="h-4 w-4" />
	                            </ForumIconButton>
	                          ) : null}
	                        </div>
	                      </div>
	                      <p className="mt-4 whitespace-pre-line text-sm leading-7 theme-text-body">{activeThread.body}</p>
	                      {activeThread.editedAt ? (
	                        <p className="mt-3 text-xs font-medium theme-text-soft">
	                          {locale === "en" ? "Edited by" : "Đã chỉnh sửa bởi"}{" "}
	                          {activeThread.editedByName ?? activeThread.author.name} ·{" "}
	                          {formatForumDateTime(locale, activeThread.editedAt)}
	                        </p>
	                      ) : null}
	                      {activeThread.contactNote ? (
                        <div className="mt-4 rounded-[1.15rem] border theme-border bg-white/76 px-4 py-3 dark:bg-white/[0.05]">
                          <p className="text-xs font-semibold uppercase tracking-[0.22em] theme-eyebrow">
                            {locale === "en" ? "Preferred contact note" : "Ghi chú liên hệ"}
                          </p>
                          <p className="mt-2 text-sm leading-6 theme-text-body">{activeThread.contactNote}</p>
                        </div>
                      ) : null}
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.28em] theme-eyebrow">
                        {pickText(locale, pageContent.forum.repliesSectionLabel)}
                      </p>
                      <div className="mt-4 space-y-3">
	                        {activeThread.replies && activeThread.replies.length > 0 ? (
	                          activeThread.replies.map((reply: ForumReply) => {
	                            const canDeleteReply =
	                              !reply.deletedAt &&
	                              (reply.author.id === currentUser.id ||
	                                activeThread.author.id === currentUser.id ||
	                                canModerateForum);
	                            const canEditReply =
	                              !reply.deletedAt &&
	                              reply.author.id === currentUser.id &&
	                              reply.id === latestEditableReplyId;
	                            const isEditingReply = editingReplyId === reply.id;

	                            if (reply.deletedAt) {
	                              return (
	                                <div
	                                  key={reply.id}
	                                  className="rounded-[1.35rem] border border-slate-900/10 bg-slate-950/[0.035] px-4 py-3 text-sm theme-text-muted dark:border-white/10 dark:bg-white/[0.045]"
	                                >
	                                  {locale === "en" ? "This reply has been deleted by" : "Phản hồi này đã bị xóa bởi"}{" "}
	                                  <span className="font-semibold theme-text-strong">{reply.deletedByName ?? "moderator"}</span>{" "}
	                                  {locale === "en" ? "at" : "lúc"} {formatForumDateTime(locale, reply.deletedAt)}.
	                                </div>
	                              );
	                            }

	                            return (
	                              <div
	                                key={reply.id}
	                                className="rounded-[1.45rem] border theme-border bg-white/70 px-4 py-4 shadow-[0_12px_28px_rgba(13,37,66,0.04)] dark:bg-white/[0.04] dark:shadow-none"
	                              >
	                                <div className="flex items-start justify-between gap-3">
	                                  <div className="flex min-w-0 items-center gap-3">
                                      <ForumAuthorIdentity
                                        author={reply.author}
                                        teams={teams}
                                        locale={locale}
                                      />
	                                    <div className="min-w-0">
	                                      <p className="text-xs theme-text-soft">
	                                        {formatForumTimestamp(locale, reply.createdAt)}
	                                      </p>
	                                    </div>
	                                  </div>
	                                  <div className="flex shrink-0 items-center gap-2">
	                                    {canEditReply ? (
	                                      isEditingReply ? (
	                                        <>
	                                          <ForumIconButton
	                                            label={locale === "en" ? "Save reply" : "Lưu phản hồi"}
	                                            tone="success"
	                                            disabled={isSavingReplyId === reply.id || !replyEditDraft.trim()}
	                                            onClick={() => void handleSaveReplyEdit(reply)}
	                                          >
	                                            {isSavingReplyId === reply.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
	                                          </ForumIconButton>
	                                          <ForumIconButton
	                                            label={locale === "en" ? "Cancel edit" : "Hủy chỉnh sửa"}
	                                            onClick={() => {
	                                              setEditingReplyId("");
	                                              setReplyEditDraft("");
	                                              setReplyActionError("");
	                                              setReplyEditModerationIssues([]);
	                                            }}
	                                          >
	                                            <X className="h-4 w-4" />
	                                          </ForumIconButton>
	                                        </>
	                                      ) : (
	                                        <ForumIconButton
	                                          label={locale === "en" ? "Edit latest reply" : "Sửa phản hồi mới nhất"}
	                                          onClick={() => {
	                                            setEditingReplyId(reply.id);
	                                            setReplyEditDraft(reply.body);
	                                            setReplyActionError("");
	                                            setReplyEditModerationIssues([]);
	                                          }}
	                                        >
	                                          <Pencil className="h-4 w-4" />
	                                        </ForumIconButton>
	                                      )
	                                    ) : null}
	                                    {canDeleteReply ? (
	                                      <ForumIconButton
	                                        label={locale === "en" ? "Delete reply" : "Xóa phản hồi"}
	                                        tone="danger"
	                                        disabled={isDeletingReplyId === reply.id}
	                                        onClick={() => setPendingDeleteReply(reply)}
	                                      >
	                                        {isDeletingReplyId === reply.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
	                                      </ForumIconButton>
	                                    ) : null}
	                                  </div>
	                                </div>
	                                {isEditingReply ? (
	                                  <div className="mt-4">
	                                    <textarea
	                                      value={replyEditDraft}
	                                      onChange={(event) => {
	                                        setReplyEditDraft(event.target.value);
	                                        setReplyEditModerationIssues([]);
	                                      }}
	                                      className="theme-field min-h-[120px] w-full rounded-[1.25rem] border px-4 py-3 text-sm leading-7 outline-none"
	                                    />
	                                    <ForumModerationWarning
	                                      locale={locale}
	                                      issues={replyEditModerationIssues}
	                                      className="mt-3"
	                                    />
	                                  </div>
	                                ) : (
	                                  <>
	                                    <p className="mt-4 text-sm leading-7 theme-text-body whitespace-pre-line">{reply.body}</p>
	                                    {reply.editedAt ? (
	                                      <p className="mt-3 text-xs font-medium theme-text-soft">
	                                        {locale === "en" ? "Edited by" : "Đã chỉnh sửa bởi"}{" "}
	                                        {reply.editedByName ?? reply.author.name} ·{" "}
	                                        {formatForumDateTime(locale, reply.editedAt)}
	                                      </p>
	                                    ) : null}
	                                  </>
	                                )}
	                              </div>
	                            );
	                          })
                        ) : (
                          <div className="rounded-[1.4rem] border theme-border px-4 py-4 theme-panel-subtle">
                            <p className="text-sm theme-text-muted">
                              {pickText(locale, pageContent.forum.noReplyYetLabel)}
                            </p>
                          </div>
	                        )}
	                      </div>
	                      {replyActionError ? (
	                        <p className="mt-3 text-sm text-rose-700 dark:text-rose-200">{replyActionError}</p>
	                      ) : null}
	                    </div>

                    <div className="rounded-[1.6rem] border theme-border px-5 py-5 theme-panel-subtle">
                      <div className="rounded-[1.45rem] border theme-border bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(244,249,255,0.84))] px-5 py-5 dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))]">
                      <p className="text-xs font-semibold uppercase tracking-[0.28em] theme-eyebrow">
                        {pickText(locale, pageContent.forum.joinConversationLabel)}
                      </p>
                      {!canReplyToActiveThread ? (
                        <div className="mt-4 rounded-[1.35rem] border theme-border px-4 py-4 bg-white/76 dark:bg-white/[0.05]">
                          <p className="text-sm leading-7 theme-text-body">
                            {activeThread.status === "closed"
                              ? pickText(locale, pageContent.forum.closedThreadNotice)
                              : pickText(locale, pageContent.forum.signedInReplyNotice)}
                          </p>
                          {activeThread.status === "open" && !isAuthenticated ? (
                            <Link
                              href="/auth"
                              className="theme-button-secondary mt-4 inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold"
                            >
                              {pickText(locale, pageContent.forum.signInNowLabel)}
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          ) : null}
                        </div>
                      ) : (
                        <>
                          <textarea
                            value={replyDraft}
                            onChange={(event) => setReplyDraft(event.target.value)}
                            onKeyDown={handleReplyKeyDown}
                            placeholder={pickText(locale, pageContent.forum.replyPlaceholder)}
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
                              {pickText(locale, pageContent.forum.postReplyLabel)}
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
                      {filteredThreads.length} {pickText(locale, pageContent.forum.activeThreadsSuffix)}
                    </span>
                    <span className="theme-chip rounded-full px-3 py-1 text-[0.68rem]">
                      {pickText(locale, pageContent.forum.sortedByRecentActivityLabel)}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setIsComposerOpen(true)}
                      disabled={!canPostOnForum}
                      className="inline-flex items-center gap-3 rounded-full border border-sky-500/24 bg-[linear-gradient(135deg,rgba(37,99,235,0.98),rgba(14,165,233,0.9))] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_18px_34px_rgba(37,99,235,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_40px_rgba(37,99,235,0.28)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 dark:border-sky-300/18 dark:bg-[linear-gradient(135deg,rgba(14,165,233,0.88),rgba(37,99,235,0.78))] dark:shadow-[0_18px_34px_rgba(2,8,20,0.28)]"
                    >
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/18 ring-1 ring-white/18">
                        <Sparkles className="h-4 w-4" />
                      </span>
                      {pickText(locale, pageContent.forum.openThreadLabel)}
                    </button>
                    {!canPostOnForum ? (
                      <Link
                        href="/auth"
                        className="theme-button-secondary inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold"
                      >
                        {pickText(locale, pageContent.forum.signInToParticipateLabel)}
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
                      {pickText(locale, pageContent.forum.loadingThreadsLabel)}
                    </span>
                  </div>
                ) : listError ? (
                  <div className="rounded-[1.4rem] border border-rose-500/18 bg-rose-500/10 px-4 py-4 text-sm text-rose-800 dark:text-rose-100">
                    {listError}
                  </div>
                ) : filteredThreads.length === 0 ? (
                  <div className="rounded-[1.4rem] border theme-border px-4 py-5 theme-panel-subtle">
                    <p className="text-sm font-semibold theme-text-strong">
                      {pickText(locale, pageContent.forum.noMatchingThreadTitle)}
                    </p>
                    <p className="mt-2 text-sm leading-7 theme-text-muted">
                      {pickText(locale, pageContent.forum.noMatchingThreadDescription)}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid gap-3">
                      {paginatedThreads.map((thread) => {
                        const isClosedThread = thread.status === "closed";

                        return (
                        <div
                          key={thread.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => setActiveThreadSlug(thread.slug)}
                          onKeyDown={(event) => {
                            if (event.target !== event.currentTarget) {
                              return;
                            }

                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              setActiveThreadSlug(thread.slug);
                            }
                          }}
                          className={`group relative w-full cursor-pointer overflow-hidden rounded-[1.25rem] border px-4 py-3 text-left outline-none transition-all duration-200 focus-visible:ring-4 focus-visible:ring-sky-400/18 ${
                            isClosedThread
                              ? "border-amber-600/24 bg-amber-50/82 shadow-[0_12px_26px_rgba(245,158,11,0.06)] hover:-translate-y-0.5 hover:border-amber-500/44 hover:shadow-[0_18px_34px_rgba(245,158,11,0.14)] dark:border-amber-300/18 dark:bg-amber-300/[0.07] dark:shadow-none dark:hover:border-amber-200/34 dark:hover:bg-amber-300/[0.1]"
                              : "theme-border theme-panel-subtle hover:-translate-y-0.5 hover:border-sky-400/36 hover:bg-[var(--panel)] hover:shadow-[0_18px_36px_rgba(14,165,233,0.12)] dark:hover:border-sky-200/24 dark:hover:bg-white/[0.07]"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <GradientAvatar
                              label={thread.author.name}
                              tone={thread.author.avatarTone}
                              imageSrc={thread.author.avatarImageSrc}
                              className="h-10 w-10 rounded-full transition-transform duration-200 group-hover:scale-105"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="min-w-0 truncate text-base font-semibold leading-6 theme-text-strong transition-colors group-hover:text-sky-700 dark:group-hover:text-sky-200">
                                  {thread.title}
                                </p>
                                <span className="shrink-0 text-[0.72rem] theme-text-soft">
                                  {pickText(locale, pageContent.forum.lastActivityLabel)} ·{" "}
                                  {formatForumTimestamp(locale, thread.lastActivityAt)}
                                </span>
                              </div>

                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <span className="theme-kicker rounded-full px-3 py-1 text-[0.66rem] tracking-[0.2em]">
                                  {getForumCategoryLabel(locale, pageContent.forum, thread.category)}
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
                                {isClosedThread ? (
                                  <span className="rounded-full border border-amber-600/24 bg-amber-400/18 px-3 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-amber-950 dark:border-amber-300/22 dark:bg-amber-300/12 dark:text-amber-100">
                                    {pickText(locale, pageContent.forum.closedByOwnerLabel)}
                                  </span>
                                ) : null}
                                <span className="theme-chip rounded-full px-3 py-1 text-[0.66rem]">
                                  <UsersRound className="mr-1 inline h-3.5 w-3.5" />
                                  {thread.replyCount} {pickText(locale, pageContent.forum.repliesSuffix)}
                                </span>
                                <span className="theme-chip rounded-full px-3 py-1 text-[0.66rem]">
                                  {getForumRoleLabel(locale, thread.author.role)}
                                </span>
                              </div>

                              <div className="mt-3 grid gap-2 rounded-[1rem] border theme-border bg-white/72 px-3.5 py-2.5 transition-colors group-hover:border-sky-400/24 group-hover:bg-sky-50/60 dark:bg-white/[0.05] dark:group-hover:border-sky-200/16 dark:group-hover:bg-sky-300/[0.06]">
                                <p className="line-clamp-2 text-sm leading-6 theme-text-body">
                                  {trimForumPreview(thread.lastMessagePreview || thread.body, 140)}
                                </p>
                                <p className="truncate text-xs theme-text-soft">
                                  {canLinkForumAuthor(thread.author) ? (
                                    <Link
                                      href={getForumAuthorHref(thread.author.id)}
                                      onClick={(event) => event.stopPropagation()}
                                      className="font-semibold theme-accent hover:underline"
                                    >
                                      {thread.author.name}
                                    </Link>
                                  ) : (
                                    <span className="font-semibold theme-text-strong">{thread.author.name}</span>
                                  )}{" "}
                                  · {thread.author.university || thread.university || getForumRoleLabel(locale, thread.author.role)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                        );
                      })}
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

	      {pendingDeleteReply ? (
	        <div className="fixed inset-0 z-[85] flex items-center justify-center bg-[rgba(7,18,35,0.62)] p-4 backdrop-blur-sm">
	          <div className="theme-panel theme-card-shadow w-full max-w-lg rounded-[1.8rem] border px-6 py-6">
	            <div className="flex items-start gap-4">
	              <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-rose-500/24 bg-rose-500/12 text-rose-800 dark:text-rose-100">
	                <Trash2 className="h-5 w-5" />
	              </span>
	              <div className="min-w-0 flex-1">
	                <p className="text-lg font-semibold theme-text-strong">
	                  {locale === "en" ? "Delete this reply?" : "Xóa phản hồi này?"}
	                </p>
	                <p className="mt-3 text-sm leading-7 theme-text-muted">
	                  {locale === "en"
	                    ? "The original reply content will be hidden and replaced by a deleted-reply notice in the thread."
	                    : "Nội dung gốc sẽ được ẩn và thay bằng thông báo phản hồi đã bị xóa trong chủ đề."}
	                </p>
	              </div>
	            </div>
	            <div className="mt-6 flex flex-wrap justify-end gap-3">
	              <button
	                type="button"
	                onClick={() => setPendingDeleteReply(null)}
	                className="theme-button-secondary inline-flex items-center justify-center rounded-full border px-4 py-2.5 text-sm font-semibold"
	              >
	                {locale === "en" ? "Cancel" : "Hủy"}
	              </button>
	              <button
	                type="button"
	                disabled={Boolean(isDeletingReplyId)}
	                onClick={() => void handleDeleteReply(pendingDeleteReply)}
	                className="theme-button-danger inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
	              >
	                {isDeletingReplyId ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
	                {locale === "en" ? "Delete reply" : "Xóa phản hồi"}
	              </button>
	            </div>
	          </div>
	        </div>
	      ) : null}

	      {pendingCloseThread ? (
	        <div className="fixed inset-0 z-[85] flex items-center justify-center bg-[rgba(7,18,35,0.62)] p-4 backdrop-blur-sm">
	          <div className="theme-panel theme-card-shadow w-full max-w-lg rounded-[1.8rem] border px-6 py-6">
	            <div className="flex items-start gap-4">
	              <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-500/24 bg-amber-400/14 text-amber-900 dark:text-amber-100">
	                <Lock className="h-5 w-5" />
	              </span>
	              <div className="min-w-0 flex-1">
	                <p className="text-lg font-semibold theme-text-strong">
	                  {pickText(locale, pageContent.forum.closeThreadConfirmTitle)}
	                </p>
	                <p className="mt-3 text-sm leading-7 theme-text-muted">
	                  {pickText(locale, pageContent.forum.closeThreadConfirmDescription)}
	                </p>
	              </div>
	            </div>
	            <div className="mt-6 flex flex-wrap justify-end gap-3">
	              <button
	                type="button"
	                onClick={() => setPendingCloseThread(null)}
	                className="theme-button-secondary inline-flex items-center justify-center rounded-full border px-4 py-2.5 text-sm font-semibold"
	              >
	                {pickText(locale, pageContent.forum.cancelLabel)}
	              </button>
	              <button
	                type="button"
	                disabled={isClosingThread}
	                onClick={() => void handleCloseThread()}
	                className="theme-button-danger inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
	              >
	                {isClosingThread ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
	                {pickText(locale, pageContent.forum.closeThreadLabel)}
	              </button>
	            </div>
	          </div>
	        </div>
	      ) : null}

	      {isThreadEditOpen && activeThread ? (
        <div className="fixed inset-0 z-[80] overflow-y-auto overscroll-contain bg-[rgba(7,18,35,0.58)] p-4 backdrop-blur-sm md:p-8">
          <div className="mx-auto max-w-3xl py-2 md:py-4">
            <Surface className="flex max-h-[calc(100vh-2rem)] flex-col overflow-hidden px-0 py-0 md:max-h-[calc(100vh-4rem)]">
              <div className="flex items-center justify-between border-b theme-border px-6 py-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] theme-eyebrow">
                    {locale === "en" ? "Edit existing thread" : "Chỉnh sửa bài đăng hiện có"}
                  </p>
                  <p className="mt-2 text-lg font-semibold theme-text-strong">
                    {locale === "en" ? "Update thread post" : "Cập nhập bài đăng"}
                  </p>
                  <p className="mt-1 text-sm theme-text-muted">
                    {locale === "en"
                      ? "This updates the thread information already published in the forum."
                      : "Cửa sổ này cập nhật thông tin bài đăng đã hiển thị trên forum."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeThreadEditModal}
                  className="theme-button-secondary inline-flex h-10 w-10 items-center justify-center rounded-full border"
                  aria-label={locale === "en" ? "Close edit thread dialog" : "Đóng cửa sổ chỉnh sửa"}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="overflow-y-auto overscroll-contain px-6 py-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.22em] theme-text-soft">
                      {pickText(locale, pageContent.forum.threadTitleFieldLabel)}
                    </span>
                    <input
                      value={threadEditDraft.title}
                      onChange={(event) => {
                        setThreadEditDraft((current) => ({ ...current, title: event.target.value }));
                        setThreadEditModerationIssues([]);
                      }}
                      className="theme-field h-12 w-full rounded-[1rem] border px-4 text-sm outline-none"
                    />
                  </label>

                  <ForumCategorySelect
                    value={threadEditDraft.category}
                    label={pickText(locale, pageContent.forum.categoryFieldLabel)}
                    content={pageContent.forum}
                    locale={locale}
                    onChange={(value) => {
                        setThreadEditDraft((current) => ({
                          ...current,
                          category: value,
                        }));
                        setThreadEditModerationIssues([]);
                      }}
                  />

                  <label className="space-y-2 md:col-span-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.22em] theme-text-soft">
                      {pickText(locale, pageContent.forum.mainPostFieldLabel)}
                    </span>
                    <textarea
                      value={threadEditDraft.body}
                      onChange={(event) => {
                        setThreadEditDraft((current) => ({ ...current, body: event.target.value }));
                        setThreadEditModerationIssues([]);
                      }}
                      className="theme-field min-h-[180px] w-full rounded-[1rem] border px-4 py-3 text-sm leading-7 outline-none"
                    />
                  </label>

                  <label className="space-y-2 md:col-span-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.22em] theme-text-soft">
                      {pickText(locale, pageContent.forum.contactNoteFieldLabel)}
                    </span>
                    <input
                      value={threadEditDraft.contactNote}
                      onChange={(event) => {
                        setThreadEditDraft((current) => ({ ...current, contactNote: event.target.value }));
                        setThreadEditModerationIssues([]);
                      }}
                      placeholder={pickText(locale, pageContent.forum.contactNotePlaceholder)}
                      className="theme-field h-12 w-full rounded-[1rem] border px-4 text-sm outline-none"
                    />
                  </label>
                </div>
              </div>

              <div className="border-t theme-border px-6 py-5">
                <ForumModerationWarning locale={locale} issues={threadEditModerationIssues} className="mb-3" />
                {threadActionError ? (
                  <p className="mb-3 text-sm text-rose-700 dark:text-rose-200">{threadActionError}</p>
                ) : null}
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => void handleSaveThreadEdit()}
                    disabled={isSavingThreadEdit || !threadEditDraft.title.trim() || !threadEditDraft.body.trim()}
                    className="theme-button-primary inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
                  >
                    {isSavingThreadEdit ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {locale === "en" ? "Save changes" : "Lưu thay đổi"}
                  </button>
                  <button
                    type="button"
                    onClick={closeThreadEditModal}
                    className="theme-button-secondary inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold"
                  >
                    {pickText(locale, pageContent.forum.cancelLabel)}
                  </button>
                </div>
              </div>
            </Surface>
          </div>
        </div>
      ) : null}

	      {isComposerOpen ? (
        <div className="fixed inset-0 z-[80] overflow-y-auto overscroll-contain bg-[rgba(7,18,35,0.58)] p-4 backdrop-blur-sm md:p-8">
          <div className="mx-auto max-w-3xl py-2 md:py-4">
            <Surface className="flex max-h-[calc(100vh-2rem)] flex-col overflow-hidden px-0 py-0 md:max-h-[calc(100vh-4rem)]">
              <div className="flex items-center justify-between border-b theme-border px-6 py-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] theme-eyebrow">
                    {pickText(locale, pageContent.forum.newThreadEyebrow)}
                  </p>
                  <p className="mt-2 text-lg font-semibold theme-text-strong">
                    {pickText(locale, pageContent.forum.newThreadTitle)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsComposerOpen(false);
                    setComposerError("");
                  }}
                  className="theme-button-secondary inline-flex h-10 w-10 items-center justify-center rounded-full border"
                  aria-label={pickText(locale, pageContent.forum.closeDialogLabel)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="overflow-y-auto overscroll-contain px-6 py-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.22em] theme-text-soft">
                      {pickText(locale, pageContent.forum.threadTitleFieldLabel)}
                    </span>
                    <input
                      value={threadDraft.title}
                      onChange={(event) => setThreadDraft((current) => ({ ...current, title: event.target.value }))}
                      className="theme-field h-12 w-full rounded-[1rem] border px-4 text-sm outline-none"
                    />
                  </label>

                  <ForumCategorySelect
                    value={threadDraft.category}
                    label={pickText(locale, pageContent.forum.categoryFieldLabel)}
                    content={pageContent.forum}
                    locale={locale}
                    onChange={(value) =>
                        setThreadDraft((current) => ({
                          ...current,
                          category: value,
                        }))
                      }
                  />

                  <label className="space-y-2 md:col-span-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.22em] theme-text-soft">
                      {pickText(locale, pageContent.forum.mainPostFieldLabel)}
                    </span>
                    <textarea
                      value={threadDraft.body}
                      onChange={(event) => setThreadDraft((current) => ({ ...current, body: event.target.value }))}
                      className="theme-field min-h-[180px] w-full rounded-[1rem] border px-4 py-3 text-sm leading-7 outline-none"
                    />
                  </label>

                  <label className="space-y-2 md:col-span-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.22em] theme-text-soft">
                      {pickText(locale, pageContent.forum.contactNoteFieldLabel)}
                    </span>
                    <input
                      value={threadDraft.contactNote}
                      onChange={(event) => setThreadDraft((current) => ({ ...current, contactNote: event.target.value }))}
                      placeholder={pickText(locale, pageContent.forum.contactNotePlaceholder)}
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
                    {pickText(locale, pageContent.forum.publishThreadLabel)}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      resetComposer();
                      setComposerError("");
                    }}
                    className="theme-button-secondary inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold"
                  >
                    {pickText(locale, pageContent.forum.clearFormLabel)}
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
