"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Filter,
  LoaderCircle,
  MessageSquare,
  Search,
  ShieldCheck,
  Trash2,
  UsersRound,
} from "lucide-react";

import {
  ADMIN_LIST_TABLE_PAGE_SIZE,
  AdminTablePagination,
  useAdminTablePagination,
} from "@/components/admin-table-pagination";
import { useSiteState } from "@/components/providers/site-state-provider";
import { SectionHeading, StatusPill, Surface } from "@/components/site-ui";
import type { Locale } from "@/types/site";

type AdminConversationUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "moderator" | "judge" | "student" | "organizer";
  university: string;
  major: string;
  classYear: string;
  readAt?: string;
  hiddenAt?: string;
  showOtherEmail?: boolean;
};

type AdminConversationRow = {
  id: string;
  kind: "direct" | "organizer";
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
  messageCount: number;
  requester: AdminConversationUser | null;
  participants: AdminConversationUser[];
  latestMessage: {
    id: string;
    body: string;
    deletedAt?: string;
    deletedByName?: string;
    createdAt: string;
    sender: AdminConversationUser;
  } | null;
};

type ConversationKindFilter = "all" | AdminConversationRow["kind"];
type MessageStateFilter = "all" | "active" | "empty";

function cn(...values: Array<string | undefined | false>) {
  return values.filter(Boolean).join(" ");
}

const stickyFirstColumnClass = "theme-admin-sticky-cell sticky left-0 z-20";
const stickySecondColumnClass = "theme-admin-sticky-cell sticky z-10";
const stickyFirstHeadClass = "theme-admin-sticky-head sticky left-0 z-30";
const stickySecondHeadClass = "theme-admin-sticky-head sticky z-20";

function formatConversationDate(locale: Locale, value: string) {
  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getKindLabel(locale: Locale, kind: AdminConversationRow["kind"]) {
  if (kind === "organizer") {
    return locale === "en" ? "Organizer support" : "Hỗ trợ ban tổ chức";
  }

  return locale === "en" ? "User conversation" : "Trao đổi người dùng";
}

function getRoleLabel(locale: Locale, role: AdminConversationUser["role"]) {
  switch (role) {
    case "admin":
      return locale === "en" ? "Admin" : "Admin";
    case "moderator":
      return locale === "en" ? "Moderator" : "Moderator";
    case "judge":
      return locale === "en" ? "Judge" : "Giám khảo";
    case "organizer":
      return locale === "en" ? "Organizer" : "Ban tổ chức";
    case "student":
    default:
      return locale === "en" ? "Participant" : "Thí sinh";
  }
}

function summarizeParticipants(locale: Locale, conversation: AdminConversationRow) {
  if (conversation.kind === "organizer") {
    const requester = conversation.requester ?? conversation.participants[0];
    return requester
      ? `${requester.name} ↔ ${locale === "en" ? "Competition Organizer" : "Ban tổ chức"}`
      : locale === "en"
        ? "Organizer support conversation"
        : "Cuộc trò chuyện hỗ trợ";
  }

  return conversation.participants.map((participant) => participant.name).join(" ↔ ");
}

function buildLatestPreview(locale: Locale, conversation: AdminConversationRow) {
  const message = conversation.latestMessage;
  if (!message) {
    return locale === "en" ? "No message yet" : "Chưa có tin nhắn";
  }

  if (message.deletedAt) {
    return locale === "en"
      ? `${message.deletedByName ?? message.sender.name} deleted a message.`
      : `${message.deletedByName ?? message.sender.name} đã xóa một tin nhắn.`;
  }

  return message.body;
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

export function AdminMessagesManager() {
  const { locale } = useSiteState();
  const [conversations, setConversations] = useState<AdminConversationRow[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [kindFilter, setKindFilter] = useState<ConversationKindFilter>("all");
  const [messageStateFilter, setMessageStateFilter] = useState<MessageStateFilter>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isDeletingId, setIsDeletingId] = useState("");
  const [pendingDeleteConversation, setPendingDeleteConversation] = useState<AdminConversationRow | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadConversations() {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch("/api/admin/messages", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const payload = (await response.json()) as { conversations?: AdminConversationRow[]; error?: string };
        if (!response.ok || !payload.conversations) {
          throw new Error(payload.error ?? "Could not load conversations.");
        }

        if (isMounted) {
          setConversations(payload.conversations);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : "Could not load conversations.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadConversations();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredConversations = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();
    const normalizedUserFilter = userFilter.trim().toLowerCase();

    return conversations.filter((conversation) => {
      if (kindFilter !== "all" && conversation.kind !== kindFilter) {
        return false;
      }

      if (messageStateFilter === "active" && conversation.messageCount === 0) {
        return false;
      }

      if (messageStateFilter === "empty" && conversation.messageCount > 0) {
        return false;
      }

      const participantText = conversation.participants
        .map((participant) =>
          [
            participant.name,
            participant.email,
            participant.role,
            participant.university,
            participant.major,
            participant.classYear,
          ].join(" "),
        )
        .join(" ");

      if (normalizedUserFilter && !participantText.toLowerCase().includes(normalizedUserFilter)) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return [
        conversation.id,
        getKindLabel(locale, conversation.kind),
        summarizeParticipants(locale, conversation),
        participantText,
        conversation.latestMessage?.sender.name ?? "",
        buildLatestPreview(locale, conversation),
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [conversations, kindFilter, locale, messageStateFilter, searchValue, userFilter]);

  const {
    page,
    setPage,
    pageCount,
    paginatedRows,
    startIndex,
  } = useAdminTablePagination(filteredConversations, ADMIN_LIST_TABLE_PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [kindFilter, messageStateFilter, searchValue, setPage, userFilter]);

  useEffect(() => {
    if (!pendingDeleteConversation || isDeletingId) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPendingDeleteConversation(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDeletingId, pendingDeleteConversation]);

  async function handleDeleteConversation(conversation: AdminConversationRow) {
    setIsDeletingId(conversation.id);
    setError("");

    try {
      const response = await fetch(`/api/admin/messages/${encodeURIComponent(conversation.id)}`, {
        method: "DELETE",
        credentials: "include",
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? "Could not delete this conversation.");
      }

      setConversations((current) => current.filter((item) => item.id !== conversation.id));
      setPendingDeleteConversation(null);
      window.dispatchEvent(new Event("attacker-messages-refresh"));
      window.dispatchEvent(new Event("attacker-notifications-refresh"));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not delete this conversation.");
    } finally {
      setIsDeletingId("");
    }
  }

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow={locale === "en" ? "Admin / Messages" : "Admin / Tin nhắn"}
        title={locale === "en" ? "Conversation management" : "Quản lý cuộc trò chuyện"}
        description={
          locale === "en"
            ? "Review conversations between users and organizer support, filter by participant, and remove conversations when moderation requires it."
            : "Rà soát các cuộc trò chuyện giữa người dùng và kênh hỗ trợ ban tổ chức, lọc theo người tham gia và xóa khi cần điều phối."
        }
      />

      <Surface className="overflow-hidden px-0 py-0">
        <div className="border-b theme-border px-5 py-5">
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1.1fr)_minmax(260px,0.9fr)_210px_190px]">
            <label className="theme-news-search flex items-center gap-3 rounded-[1.25rem] border px-4 py-3">
              <span className="theme-news-search-icon inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                <Search className="h-4 w-4" />
              </span>
              <input
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder={locale === "en" ? "Search conversation, latest message..." : "Tìm cuộc trò chuyện, tin nhắn gần nhất..."}
                className="theme-news-search-input min-w-0 flex-1 bg-transparent text-sm outline-none"
              />
            </label>

            <label className="theme-panel-subtle flex items-center gap-3 rounded-[1.25rem] border theme-border px-4 py-3">
              <UsersRound className="h-4 w-4 text-sky-700 dark:text-sky-200" />
              <input
                value={userFilter}
                onChange={(event) => setUserFilter(event.target.value)}
                placeholder={locale === "en" ? "Filter by user name or email" : "Lọc theo tên hoặc email người dùng"}
                className="min-w-0 flex-1 bg-transparent text-sm font-medium theme-text-strong outline-none"
              />
            </label>

            <label className="theme-panel-subtle flex items-center gap-3 rounded-[1.25rem] border theme-border px-4 py-3">
              <Filter className="h-4 w-4 text-emerald-700 dark:text-emerald-200" />
              <select
                value={kindFilter}
                onChange={(event) => setKindFilter(event.target.value as ConversationKindFilter)}
                className="w-full bg-transparent text-sm font-medium theme-text-strong outline-none"
              >
                <option value="all">{locale === "en" ? "All conversations" : "Tất cả cuộc trò chuyện"}</option>
                <option value="direct">{getKindLabel(locale, "direct")}</option>
                <option value="organizer">{getKindLabel(locale, "organizer")}</option>
              </select>
            </label>

            <label className="theme-panel-subtle flex items-center gap-3 rounded-[1.25rem] border theme-border px-4 py-3">
              <MessageSquare className="h-4 w-4 text-indigo-700 dark:text-indigo-200" />
              <select
                value={messageStateFilter}
                onChange={(event) => setMessageStateFilter(event.target.value as MessageStateFilter)}
                className="w-full bg-transparent text-sm font-medium theme-text-strong outline-none"
              >
                <option value="all">{locale === "en" ? "All states" : "Tất cả trạng thái"}</option>
                <option value="active">{locale === "en" ? "Has messages" : "Có tin nhắn"}</option>
                <option value="empty">{locale === "en" ? "No messages" : "Chưa có tin nhắn"}</option>
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
          <table className="w-full min-w-[1180px] text-left text-sm">
            <thead className="border-b theme-border theme-panel-subtle">
              <tr className="text-xs uppercase tracking-[0.18em] theme-text-soft">
                <th
                  style={{ left: 0, width: 72, minWidth: 72 }}
                  className={cn("px-4 py-3 text-center", stickyFirstHeadClass)}
                >
                  #
                </th>
                <th
                  style={{ left: 72, minWidth: 320 }}
                  className={cn("px-4 py-3", stickySecondHeadClass)}
                >
                  {locale === "en" ? "Conversation" : "Cuộc trò chuyện"}
                </th>
                <th className="px-4 py-3">{locale === "en" ? "Users" : "Người tham gia"}</th>
                <th className="px-4 py-3 text-center">{locale === "en" ? "Type" : "Loại"}</th>
                <th className="px-4 py-3 text-center">{locale === "en" ? "Messages" : "Tin nhắn"}</th>
                <th className="px-4 py-3">{locale === "en" ? "Latest message" : "Tin nhắn gần nhất"}</th>
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
                      {locale === "en" ? "Loading conversations..." : "Đang tải cuộc trò chuyện..."}
                    </span>
                  </td>
                </tr>
              ) : paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm theme-text-muted">
                    {locale === "en"
                      ? "No conversation matches the current filters."
                      : "Không có cuộc trò chuyện nào khớp bộ lọc hiện tại."}
                  </td>
                </tr>
              ) : (
                paginatedRows.map((conversation, index) => (
                  <tr key={conversation.id} className="transition hover:bg-[rgba(23,114,208,0.05)]">
                    <td
                      style={{ left: 0, width: 72, minWidth: 72 }}
                      className={cn("px-4 py-3 text-center font-semibold theme-text-soft", stickyFirstColumnClass)}
                    >
                      {startIndex + index + 1}
                    </td>
                    <td
                      style={{ left: 72, minWidth: 320 }}
                      className={cn("max-w-[320px] px-4 py-3", stickySecondColumnClass)}
                    >
                      <p className="truncate font-semibold theme-text-strong">
                        {summarizeParticipants(locale, conversation)}
                      </p>
                      <p className="mt-1 truncate text-xs theme-text-soft">{conversation.id}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex max-w-[340px] flex-wrap gap-2">
                        {conversation.participants.map((participant) => (
                          <span
                            key={participant.id}
                            className="inline-flex max-w-[260px] items-center gap-2 rounded-full border theme-border theme-panel-subtle px-3 py-1.5"
                            title={`${participant.name} · ${participant.email}`}
                          >
                            <span className="h-2 w-2 shrink-0 rounded-full bg-sky-400" />
                            <span className="truncate text-xs font-semibold theme-text-strong">{participant.name}</span>
                            <span className="shrink-0 text-[0.65rem] uppercase tracking-[0.14em] theme-text-soft">
                              {getRoleLabel(locale, participant.role)}
                            </span>
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusPill tone={conversation.kind === "organizer" ? "info" : "success"}>
                        {getKindLabel(locale, conversation.kind)}
                      </StatusPill>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex h-10 min-w-10 items-center justify-center rounded-full border theme-border theme-panel px-3 font-semibold theme-text-strong">
                        {conversation.messageCount}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="max-w-[280px] truncate font-medium theme-text-body">
                        {buildLatestPreview(locale, conversation)}
                      </p>
                      {conversation.latestMessage ? (
                        <p className="mt-1 text-xs theme-text-soft">
                          {conversation.latestMessage.sender.name} · {formatConversationDate(locale, conversation.latestMessage.createdAt)}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-semibold theme-text-body">
                        {formatConversationDate(locale, conversation.lastMessageAt)}
                      </p>
                      <p className="mt-1 text-xs theme-text-soft">
                        {locale === "en" ? "Created" : "Tạo"} {formatConversationDate(locale, conversation.createdAt)}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <IconActionButton
                        label={locale === "en" ? "Delete conversation" : "Xóa cuộc trò chuyện"}
                        disabled={isDeletingId === conversation.id}
                        onClick={() => setPendingDeleteConversation(conversation)}
                      >
                        {isDeletingId === conversation.id ? (
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
          totalRows={filteredConversations.length}
          onPageChange={setPage}
        />
      </Surface>

      {pendingDeleteConversation ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center px-4 py-6">
          <button
            type="button"
            aria-label={locale === "en" ? "Close delete confirmation" : "Đóng xác nhận xóa"}
            className="absolute inset-0 cursor-default bg-slate-950/55 backdrop-blur-sm"
            onClick={() => {
              if (!isDeletingId) {
                setPendingDeleteConversation(null);
              }
            }}
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-xl overflow-hidden rounded-[2rem] border border-white/20 bg-[var(--panel)] shadow-[0_32px_90px_rgba(15,23,42,0.34)]"
          >
            <div className="border-b theme-border bg-[linear-gradient(135deg,rgba(239,68,68,0.14),rgba(59,130,246,0.08))] px-6 py-5">
              <div className="flex items-start gap-4">
                <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-500/12 text-red-500 ring-1 ring-red-500/20">
                  <Trash2 className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="theme-heading text-xl font-semibold theme-text-strong">
                    {locale === "en" ? "Delete conversation?" : "Xóa cuộc trò chuyện?"}
                  </p>
                  <p className="mt-2 text-sm leading-6 theme-text-muted">
                    {locale === "en"
                      ? "This permanently removes the conversation for every participant, including all messages and notification context."
                      : "Thao tác này xóa vĩnh viễn cuộc trò chuyện với tất cả người tham gia, gồm toàn bộ tin nhắn và ngữ cảnh thông báo."}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div className="rounded-[1.4rem] border theme-border theme-panel-subtle p-4">
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-500/12 text-sky-700 dark:text-sky-200">
                    {pendingDeleteConversation.kind === "organizer" ? (
                      <ShieldCheck className="h-4 w-4" />
                    ) : (
                      <MessageSquare className="h-4 w-4" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold theme-text-strong">
                      {summarizeParticipants(locale, pendingDeleteConversation)}
                    </p>
                    <p className="mt-1 text-xs theme-text-soft">
                      {getKindLabel(locale, pendingDeleteConversation.kind)} · {pendingDeleteConversation.messageCount}{" "}
                      {locale === "en" ? "messages" : "tin nhắn"}
                    </p>
                  </div>
                </div>
              </div>

              {error ? (
                <div className="rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-500">
                  {error}
                </div>
              ) : null}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t theme-border bg-[var(--panel-strong)] px-6 py-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={Boolean(isDeletingId)}
                onClick={() => setPendingDeleteConversation(null)}
                className="theme-button-secondary rounded-full border px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              >
                {locale === "en" ? "Cancel" : "Hủy"}
              </button>
              <button
                type="button"
                disabled={Boolean(isDeletingId)}
                onClick={() => void handleDeleteConversation(pendingDeleteConversation)}
                className="theme-button-danger inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeletingId ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                {isDeletingId
                  ? locale === "en"
                    ? "Deleting..."
                    : "Đang xóa..."
                  : locale === "en"
                    ? "Delete conversation"
                    : "Xóa cuộc trò chuyện"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
