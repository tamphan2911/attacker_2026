"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import {
  ArrowRight,
  Inbox,
  Mail,
  MessageCircle,
  Search,
  SendHorizontal,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";

import { useSiteState } from "@/components/providers/site-state-provider";
import { GradientAvatar, Surface } from "@/components/site-ui";
import type { Locale } from "@/types/site";

type MessageUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  university: string;
  major: string;
  classYear: string;
  avatarTone: string;
  avatarImageSrc?: string;
};

type DirectMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
  sender: MessageUser;
};

type MessageConversation = {
  id: string;
  kind: "direct" | "organizer";
  isOrganizer: boolean;
  isPinned: boolean;
  canDelete: boolean;
  participant: MessageUser | null;
  showParticipantEmail: boolean;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
  readAt?: string;
  unreadCount: number;
  requestPending: boolean;
  isMessageRequest: boolean;
  canSendMessage: boolean;
  latestMessage: DirectMessage | null;
  messages: DirectMessage[];
};

function cn(...values: Array<string | false | undefined>) {
  return values.filter(Boolean).join(" ");
}

function formatMessageTime(locale: Locale, value: string) {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "vi-VN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatCompactMessageTime(locale: Locale, value: string) {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatMessageSenderRole(locale: Locale, role: string) {
  if (role === "admin") {
    return locale === "en" ? "Admin" : "Quản trị viên";
  }

  if (role === "moderator") {
    return locale === "en" ? "Moderator" : "Điều phối viên";
  }

  if (role === "organizer") {
    return locale === "en" ? "Organizer" : "Ban tổ chức";
  }

  return locale === "en" ? "Participant" : "Thí sinh";
}

function conversationUrl(conversationId: string) {
  return `/messages?conversation=${encodeURIComponent(conversationId)}`;
}

export function MessageCenterPage() {
  const { authStatus, currentUser, isAuthenticated, locale } = useSiteState();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [conversations, setConversations] = useState<MessageConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState("");
  const [draftRecipient, setDraftRecipient] = useState<MessageUser | null>(null);
  const [draftRecipientSource, setDraftRecipientSource] = useState<"email-search" | "profile">("email-search");
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResult, setSearchResult] = useState<MessageUser | null>(null);
  const [hasSearchedExactEmail, setHasSearchedExactEmail] = useState(false);
  const [isSearchBusy, setIsSearchBusy] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [pageNotice, setPageNotice] = useState("");
  const [conversationToDelete, setConversationToDelete] = useState<MessageConversation | null>(null);
  const [isDeletingConversation, setIsDeletingConversation] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadMessages = useCallback(async (options?: { silent?: boolean }) => {
    if (!isAuthenticated) {
      return;
    }

    if (!options?.silent) {
      setIsLoading(true);
    }

    const response = await fetch("/api/messages", {
      cache: "no-store",
      credentials: "same-origin",
    });

    if (!response.ok) {
      if (!options?.silent) {
        setStatusMessage(
          locale === "en"
            ? "Could not load message conversations."
            : "Không thể tải các cuộc trò chuyện.",
        );
        setIsLoading(false);
      }
      return;
    }

    const payload = (await response.json()) as { conversations: MessageConversation[] };
    const params = new URLSearchParams(window.location.search);
    const requestedConversationId = params.get("conversation") ?? "";
    const requestedRecipientId = params.get("recipient") ?? "";
    const requestedOrganizer = params.get("organizer") === "1" || params.get("organizer") === "true";
    const requestedRecipientSource = params.get("source") === "profile" ? "profile" : "email-search";
    const requestedRecipientConversation = requestedRecipientId
      ? payload.conversations.find((conversation) => conversation.participant?.id === requestedRecipientId)
      : null;
    const requestedOrganizerConversation = requestedOrganizer
      ? payload.conversations.find((conversation) => conversation.isOrganizer)
      : null;

    setConversations(payload.conversations);

    if (requestedOrganizerConversation) {
      setDraftRecipient(null);
      setActiveConversationId(requestedOrganizerConversation.id);
      window.history.replaceState(null, "", conversationUrl(requestedOrganizerConversation.id));
    } else if (requestedOrganizer && !options?.silent) {
      setStatusMessage(
        locale === "en"
          ? "Could not open the organizer support conversation."
          : "Không thể mở cuộc trò chuyện hỗ trợ với ban tổ chức.",
      );
    } else if (requestedRecipientConversation) {
      setDraftRecipient(null);
      setActiveConversationId(requestedRecipientConversation.id);
      window.history.replaceState(null, "", conversationUrl(requestedRecipientConversation.id));
    } else if (requestedRecipientId) {
      const userResponse = await fetch(`/api/messages/users?userId=${encodeURIComponent(requestedRecipientId)}`, {
        cache: "no-store",
        credentials: "same-origin",
      });
      const userPayload = userResponse.ok
        ? ((await userResponse.json()) as { user: MessageUser | null })
        : { user: null };

      if (userPayload.user) {
        setDraftRecipient(userPayload.user);
        setDraftRecipientSource(requestedRecipientSource);
        setActiveConversationId("");
        window.history.replaceState(null, "", "/messages");
      } else if (!options?.silent) {
        setStatusMessage(
          locale === "en"
            ? "Could not open a private message with this user."
            : "Không thể mở tin nhắn riêng với người dùng này.",
        );
      }
    } else {
      setActiveConversationId((current) => {
        if (options?.silent && draftRecipient) {
          return current;
        }

        if (current && payload.conversations.some((conversation) => conversation.id === current)) {
          return current;
        }

        if (
          requestedConversationId &&
          payload.conversations.some((conversation) => conversation.id === requestedConversationId)
        ) {
          return requestedConversationId;
        }

        return payload.conversations[0]?.id ?? "";
      });
    }

    if (!options?.silent) {
      setIsLoading(false);
    }
  }, [draftRecipient, isAuthenticated, locale]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadMessages();
    });
  }, [loadMessages]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const refresh = () => void loadMessages({ silent: true });
    const intervalId = window.setInterval(refresh, 4000);

    window.addEventListener("focus", refresh);
    window.addEventListener("attacker-messages-refresh", refresh);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("attacker-messages-refresh", refresh);
    };
  }, [isAuthenticated, loadMessages]);

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId),
    [activeConversationId, conversations],
  );

  const activeParticipant = activeConversation?.participant ?? draftRecipient;
  const activeMessages = activeConversation?.messages ?? [];
  const canSendMessage = Boolean(draftRecipient || activeConversation?.canSendMessage);
  const showFirstMessageNotice = Boolean(
    draftRecipient || (activeConversation && !activeConversation.isOrganizer && activeMessages.length === 0),
  );
  const showReceiverFirstMessageNotice = Boolean(
    activeConversation &&
      !activeConversation.isOrganizer &&
      activeMessages.length === 1 &&
      activeMessages[0]?.senderId !== currentUser.id,
  );
  const requestPending = Boolean(activeConversation?.requestPending);
  const shouldShowParticipantEmail = Boolean(
    activeConversation?.showParticipantEmail || (draftRecipient && draftRecipientSource === "email-search"),
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [activeConversationId, activeMessages.length]);

  useEffect(() => {
    if (!activeConversation || activeConversation.unreadCount <= 0) {
      return;
    }

    void fetch(`/api/messages/conversations/${activeConversation.id}/read`, {
      method: "POST",
      credentials: "same-origin",
    }).then(() => {
      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === activeConversation.id
            ? { ...conversation, unreadCount: 0, readAt: new Date().toISOString() }
            : conversation,
        ),
      );
      window.dispatchEvent(new Event("attacker-notifications-refresh"));
    });
  }, [activeConversation]);

  useEffect(() => {
    const keyword = searchEmail.trim().toLowerCase();

    if (!keyword.includes("@")) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIsSearchBusy(true);
      void fetch(`/api/messages/users?email=${encodeURIComponent(keyword)}`, {
        cache: "no-store",
        credentials: "same-origin",
      })
        .then(async (response) => {
          if (!response.ok) {
            return { user: null };
          }

          return (await response.json()) as { user: MessageUser | null };
        })
        .then((payload) => {
          setSearchResult(payload.user);
          setHasSearchedExactEmail(true);
        })
        .finally(() => {
          setIsSearchBusy(false);
        });
    }, 260);

    return () => window.clearTimeout(timeoutId);
  }, [searchEmail]);

  const handleSearchEmailChange = (value: string) => {
    setSearchEmail(value);
    setSearchResult(null);
    setHasSearchedExactEmail(false);
    if (!value.trim().includes("@")) {
      setIsSearchBusy(false);
    }
  };

  const openConversation = (conversationId: string) => {
    setDraftRecipient(null);
    setActiveConversationId(conversationId);
    setStatusMessage("");
    window.history.replaceState(null, "", conversationUrl(conversationId));
  };

  const chooseSearchResult = (user: MessageUser) => {
    const existingConversation = conversations.find((conversation) => conversation.participant?.id === user.id);

    setSearchEmail(user.email);
    setSearchResult(null);
    setHasSearchedExactEmail(false);
    setStatusMessage("");
    setDraftRecipientSource("email-search");

    if (existingConversation) {
      void fetch(`/api/messages/conversations/${existingConversation.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({ showOtherEmail: true }),
      }).then(() => {
        setConversations((current) =>
          current.map((conversation) =>
            conversation.id === existingConversation.id
              ? { ...conversation, showParticipantEmail: true }
              : conversation,
          ),
        );
      });
      openConversation(existingConversation.id);
      return;
    }

    setActiveConversationId("");
    setDraftRecipient(user);
    window.history.replaceState(null, "", "/messages");
  };

  const handleSendMessage = async () => {
    const body = messageText.trim();
    if (!body || !activeParticipant || !canSendMessage) {
      return;
    }

    setIsSending(true);
    setStatusMessage("");

    const response = await fetch("/api/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
      body: JSON.stringify({
        conversationId: activeConversation?.id,
        recipientId: draftRecipient?.id,
        recipientSource: draftRecipient ? draftRecipientSource : undefined,
        organizer: activeConversation?.isOrganizer,
        body,
      }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setStatusMessage(
        payload?.error ??
          (locale === "en"
            ? "Could not send this message."
            : "Không thể gửi tin nhắn này."),
      );
      setIsSending(false);
      return;
    }

    const payload = (await response.json()) as {
      conversationId: string;
      conversation: MessageConversation | null;
    };

    if (payload.conversation) {
      setConversations((current) => {
        const next = current.filter((conversation) => conversation.id !== payload.conversationId);
        return [payload.conversation!, ...next];
      });
    } else {
      await loadMessages();
    }

    setMessageText("");
    setDraftRecipient(null);
    setActiveConversationId(payload.conversationId);
    window.history.replaceState(null, "", conversationUrl(payload.conversationId));
    window.dispatchEvent(new Event("attacker-messages-refresh"));
    window.dispatchEvent(new Event("attacker-notifications-refresh"));
    setIsSending(false);
  };

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }

    event.preventDefault();
    void handleSendMessage();
  };

  const closeDeleteDialog = useCallback(() => {
    if (isDeletingConversation) {
      return;
    }

    setConversationToDelete(null);
  }, [isDeletingConversation]);

  const confirmDeleteConversation = async () => {
    if (!conversationToDelete) {
      return;
    }

    setIsDeletingConversation(true);
    const deletedConversationId = conversationToDelete.id;
    const response = await fetch(`/api/messages/conversations/${deletedConversationId}`, {
      method: "DELETE",
      credentials: "same-origin",
    });

    setIsDeletingConversation(false);
    setConversationToDelete(null);

    if (!response.ok) {
      setStatusMessage(
        locale === "en"
          ? "Could not delete this conversation."
          : "Không thể xóa cuộc trò chuyện này.",
      );
      return;
    }

    const nextConversations = conversations.filter((conversation) => conversation.id !== deletedConversationId);
    setConversations(nextConversations);
    if (activeConversationId === deletedConversationId) {
      setActiveConversationId(nextConversations[0]?.id ?? "");
      setDraftRecipient(null);
      window.history.replaceState(
        null,
        "",
        nextConversations[0] ? conversationUrl(nextConversations[0].id) : "/messages",
      );
    }
    setPageNotice(
      locale === "en"
        ? "Conversation deleted from your message center."
        : "Đã xóa cuộc trò chuyện khỏi trung tâm tin nhắn của bạn.",
    );
    window.dispatchEvent(new Event("attacker-notifications-refresh"));
  };

  useEffect(() => {
    if (!conversationToDelete) {
      return;
    }

    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        closeDeleteDialog();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [closeDeleteDialog, conversationToDelete]);

  if (authStatus === "loading") {
    return (
      <Surface className="px-6 py-10 text-center">
        <p className="text-sm theme-text-soft">
          {locale === "en" ? "Loading message center..." : "Đang tải trung tâm tin nhắn..."}
        </p>
      </Surface>
    );
  }

  if (!isAuthenticated) {
    return (
      <Surface className="mx-auto max-w-3xl px-6 py-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] theme-eyebrow">
          {locale === "en" ? "Sign in required" : "Cần đăng nhập"}
        </p>
        <h1 className="theme-heading mt-4 text-3xl font-semibold theme-text-strong">
          {locale === "en" ? "Sign in to open messages." : "Đăng nhập để mở tin nhắn."}
        </h1>
        <Link
          href="/auth"
          className="theme-button-primary mt-7 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
        >
          {locale === "en" ? "Open sign in" : "Mở đăng nhập"}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Surface>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-8.5rem)] min-h-0 flex-col gap-4 overflow-hidden">
      {pageNotice ? (
        <div className="rounded-[1.35rem] border border-emerald-300/40 bg-emerald-400/12 px-5 py-4 text-sm font-semibold text-emerald-800 shadow-[0_18px_42px_rgba(16,185,129,0.12)] dark:text-emerald-100">
          {pageNotice}
        </div>
      ) : null}
      <section className="theme-card-shadow-soft min-h-0 flex-1 overflow-hidden rounded-[2rem] border theme-border-strong theme-panel">
        <div className="grid h-full min-h-0 lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="flex min-h-0 flex-col border-b theme-border bg-white/42 p-4 dark:bg-white/4 lg:border-b-0 lg:border-r">
            <div className="flex items-center gap-3 px-1 py-2">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-sky-400/24 bg-sky-500/12 text-sky-600 dark:text-sky-200">
                <MessageCircle className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] theme-eyebrow">
                  {locale === "en" ? "Message center" : "Trung tâm tin nhắn"}
                </p>
              </div>
            </div>

            <div className="relative mt-5">
              <div className="theme-panel-subtle flex items-center gap-3 rounded-[1.35rem] border theme-border px-4 py-3">
                <Search className="h-4 w-4 shrink-0 theme-accent" />
                <input
                  value={searchEmail}
                  onChange={(event) => handleSearchEmailChange(event.target.value)}
                  placeholder={locale === "en" ? "Search exact user email" : "Tìm đúng email người dùng"}
                  className="w-full bg-transparent text-sm theme-text-strong outline-none placeholder:theme-text-faint"
                />
              </div>

              {(searchResult || hasSearchedExactEmail || isSearchBusy) && searchEmail.trim().includes("@") ? (
                <div className="theme-card-shadow-soft absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-[1.4rem] border theme-border theme-panel backdrop-blur-xl">
                  {isSearchBusy ? (
                    <p className="px-4 py-4 text-sm theme-text-muted">
                      {locale === "en" ? "Checking exact email..." : "Đang kiểm tra email chính xác..."}
                    </p>
                  ) : searchResult ? (
                    <button
                      type="button"
                      onClick={() => chooseSearchResult(searchResult)}
                      className="flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-[rgba(23,114,208,0.08)]"
                    >
                      <GradientAvatar
                        label={searchResult.name}
                        tone={searchResult.avatarTone}
                        imageSrc={searchResult.avatarImageSrc}
                        className="h-10 w-10 rounded-full text-xs"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold theme-text-strong">{searchResult.name}</span>
                        <span className="block truncate text-xs theme-text-muted">{searchResult.email}</span>
                      </span>
                    </button>
                  ) : (
                    <p className="px-4 py-4 text-sm theme-text-muted">
                      {locale === "en" ? "No user matches this exact email." : "Không có người dùng khớp email này."}
                    </p>
                  )}
                </div>
              ) : null}
            </div>

            <div className="mt-5 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
              {isLoading ? (
                <p className="rounded-[1.25rem] border theme-border theme-panel-subtle px-4 py-4 text-sm theme-text-muted">
                  {locale === "en" ? "Loading conversations..." : "Đang tải cuộc trò chuyện..."}
                </p>
              ) : conversations.length ? (
                conversations.map((conversation) => {
                  const participant = conversation.participant;
                  const isActive = conversation.id === activeConversationId;

                  return (
                    <div
                      key={conversation.id}
                      className={cn(
                        "group flex items-center gap-2 rounded-[1.35rem] border px-3 py-3 transition",
                        isActive
                          ? "border-sky-300/38 bg-sky-500/12 shadow-[0_16px_38px_rgba(14,165,233,0.12)]"
                          : conversation.unreadCount > 0
                            ? "border-orange-300/45 bg-orange-400/10 shadow-[0_16px_34px_rgba(249,115,22,0.12)]"
                            : conversation.isOrganizer
                              ? "border-cyan-300/35 bg-cyan-400/10 hover:border-cyan-300/50"
                              : "theme-border theme-panel-subtle hover:border-sky-300/26 hover:bg-[rgba(23,114,208,0.06)]",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => openConversation(conversation.id)}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      >
                        <GradientAvatar
                          label={participant?.name ?? "User"}
                          tone={participant?.avatarTone ?? "from-sky-500 via-cyan-400 to-emerald-400"}
                          imageSrc={participant?.avatarImageSrc}
                          className="h-11 w-11 shrink-0 rounded-full text-xs"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-2">
                            <span className="truncate text-sm font-semibold theme-text-strong">
                              {participant?.name ?? (locale === "en" ? "User" : "Người dùng")}
                            </span>
                            <span className="flex shrink-0 items-center gap-1.5">
                              {conversation.isOrganizer ? (
                                <span className="rounded-full border border-cyan-300/34 bg-cyan-400/12 px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-cyan-800 dark:text-cyan-100">
                                  {locale === "en" ? "Support" : "Hỗ trợ"}
                                </span>
                              ) : null}
                              {conversation.unreadCount > 0 ? (
                                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[linear-gradient(135deg,#fb7185,#f97316)] px-1.5 text-[0.68rem] font-bold text-white shadow-[0_10px_22px_rgba(249,115,22,0.24)]">
                                  {conversation.unreadCount}
                                </span>
                              ) : null}
                            </span>
                          </span>
                          <span className="mt-1 block truncate text-xs theme-text-muted">
                            {conversation.latestMessage?.body ??
                              (conversation.isOrganizer
                                ? locale === "en"
                                  ? "Competition support channel"
                                  : "Kênh hỗ trợ từ ban tổ chức"
                                : locale === "en"
                                  ? "No messages yet"
                                  : "Chưa có tin nhắn")}
                          </span>
                        </span>
                      </button>
                      {conversation.canDelete ? (
                        <button
                          type="button"
                          onClick={() => setConversationToDelete(conversation)}
                          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-transparent text-slate-400 opacity-0 transition hover:border-rose-200/70 hover:bg-rose-500/10 hover:text-rose-500 group-hover:opacity-100 focus:opacity-100 dark:hover:border-rose-300/20 dark:hover:text-rose-200"
                          aria-label={locale === "en" ? "Delete conversation" : "Xóa cuộc trò chuyện"}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      ) : null}
                    </div>
                  );
                })
              ) : (
                <div className="rounded-[1.35rem] border theme-border theme-panel-subtle px-4 py-5 text-sm theme-text-muted">
                  <Inbox className="mb-3 h-5 w-5 theme-accent" />
                  {locale === "en"
                    ? "No conversations yet. Search an exact email to start one."
                    : "Chưa có cuộc trò chuyện. Tìm đúng email để bắt đầu."}
                </div>
              )}
            </div>
          </aside>

          <section className="flex min-h-0 flex-col">
            {activeParticipant ? (
              <>
                <div className="flex items-center gap-4 border-b theme-border px-5 py-5 md:px-6">
                  <GradientAvatar
                    label={activeParticipant.name}
                    tone={activeParticipant.avatarTone}
                    imageSrc={activeParticipant.avatarImageSrc}
                    className="h-12 w-12 rounded-full text-sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-semibold theme-text-strong">{activeParticipant.name}</p>
                    {shouldShowParticipantEmail ? (
                      <p className="mt-1 truncate text-sm theme-text-muted">{activeParticipant.email}</p>
                    ) : activeConversation?.isOrganizer ? (
                      <p className="mt-1 truncate text-sm theme-text-muted">
                        {locale === "en" ? "Official competition support channel" : "Kênh hỗ trợ chính thức của cuộc thi"}
                      </p>
                    ) : null}
                  </div>
                  <span className="hidden rounded-full border theme-border theme-panel-subtle px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] theme-text-soft sm:inline-flex">
                    {formatMessageSenderRole(locale, activeParticipant.role)}
                  </span>
                </div>

                <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-4 py-4 md:px-5">
                  {showFirstMessageNotice ? (
                    <div className="rounded-[1.5rem] border border-amber-300/34 bg-amber-400/12 px-4 py-4">
                      <div className="flex gap-3">
                        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-200" />
                        <div>
                          <p className="text-sm font-semibold theme-text-strong">
                            {locale === "en" ? "First-message request rule" : "Quy tắc tin nhắn đầu tiên"}
                          </p>
                          <p className="mt-2 text-sm leading-7 theme-text-muted">
                            {locale === "en"
                              ? "Your first message is treated as a message request. You can send only one first message until the receiver replies, and the receiver will be able to see your email address. After they reply, both users can continue without this limit."
                              : "Tin nhắn đầu tiên được xem như một lời đề nghị trò chuyện. Bạn chỉ được gửi một tin nhắn đầu tiên cho đến khi người nhận phản hồi, và người nhận sẽ thấy địa chỉ email của bạn. Sau khi họ trả lời, hai bên có thể nhắn tiếp không giới hạn."}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {showReceiverFirstMessageNotice ? (
                    <div className="rounded-[1.5rem] border border-sky-300/34 bg-sky-400/12 px-4 py-4">
                      <div className="flex gap-3">
                        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-sky-600 dark:text-sky-200" />
                        <div>
                          <p className="text-sm font-semibold theme-text-strong">
                            {locale === "en" ? "New message request" : "Lời nhắn đầu tiên"}
                          </p>
                          <p className="mt-2 text-sm leading-7 theme-text-muted">
                            {locale === "en"
                              ? "This is the first message from this sender. If you reply, both of you can continue messaging without limits. If you do not want more messages from this user, simply do not answer."
                              : "Đây là tin nhắn đầu tiên từ người gửi này. Nếu bạn trả lời, hai bên có thể tiếp tục nhắn tin không giới hạn. Nếu bạn không muốn nhận thêm tin nhắn từ người này, bạn chỉ cần không phản hồi."}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {activeConversation?.isOrganizer && activeMessages.length === 0 ? (
                    <div className="rounded-[1.5rem] border border-cyan-300/34 bg-cyan-400/12 px-4 py-4">
                      <div className="flex gap-3">
                        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-cyan-600 dark:text-cyan-200" />
                        <div>
                          <p className="text-sm font-semibold theme-text-strong">
                            {locale === "en" ? "Competition organizer support" : "Hỗ trợ từ ban tổ chức"}
                          </p>
                          <p className="mt-2 text-sm leading-7 theme-text-muted">
                            {locale === "en"
                              ? "This fixed conversation connects you with the competition organizer for account, team, submission, eligibility, or general support questions."
                              : "Cuộc trò chuyện cố định này kết nối bạn với ban tổ chức để được hỗ trợ về tài khoản, đội thi, bài nộp, điều kiện tham gia hoặc các câu hỏi chung."}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {requestPending ? (
                    <div className="mx-auto max-w-xl rounded-full border theme-border theme-panel-subtle px-4 py-2 text-center text-xs font-semibold theme-text-soft">
                      {locale === "en"
                        ? "Waiting for the receiver to reply before more messages can be sent."
                        : "Đang chờ người nhận phản hồi trước khi có thể gửi thêm tin nhắn."}
                    </div>
                  ) : null}

                  {activeMessages.length ? (
                    activeMessages.map((message) => {
                      const isOwnMessage = message.senderId === currentUser.id;
                      return (
                        <div
                          key={message.id}
                          className={cn("flex", isOwnMessage ? "justify-end" : "justify-start")}
                        >
                          <div
                            className={cn(
                              "max-w-[72%] rounded-[1.05rem] px-3 py-2 shadow-[0_10px_22px_rgba(15,23,42,0.07)]",
                              isOwnMessage
                                ? "bg-[linear-gradient(135deg,#38bdf8,#2563eb)] text-white"
                                : "border theme-border theme-panel-subtle theme-text-strong",
                            )}
                          >
                            {activeConversation?.isOrganizer ? (
                              <p
                                className={cn(
                                  "mb-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em]",
                                  isOwnMessage ? "text-white/72" : "theme-text-faint",
                                )}
                              >
                                {message.sender.name} · {formatMessageSenderRole(locale, message.sender.role)}
                              </p>
                            ) : null}
                            <p className="whitespace-pre-wrap text-sm leading-6">
                              {message.body}
                              <span
                                title={formatMessageTime(locale, message.createdAt)}
                                className={cn(
                                  "ml-2 inline-block align-baseline text-[0.65rem] font-medium",
                                  isOwnMessage ? "text-white/68" : "theme-text-faint",
                                )}
                              >
                                {formatCompactMessageTime(locale, message.createdAt)}
                              </span>
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex min-h-[220px] items-center justify-center text-center">
                      <div>
                        <Mail className="mx-auto h-8 w-8 theme-accent" />
                        <p className="mt-3 text-sm theme-text-muted">
                          {locale === "en" ? "No messages in this conversation yet." : "Cuộc trò chuyện này chưa có tin nhắn."}
                        </p>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="border-t theme-border px-5 py-5 md:px-6">
                  {statusMessage ? (
                    <div className="mb-3 rounded-2xl border border-amber-300/34 bg-amber-400/12 px-4 py-3 text-sm leading-6 text-amber-800 dark:text-amber-100">
                      {statusMessage}
                    </div>
                  ) : null}
                  <div className="flex items-end gap-3">
                    <textarea
                      value={messageText}
                      onChange={(event) => setMessageText(event.target.value)}
                      onKeyDown={handleComposerKeyDown}
                      disabled={!canSendMessage || isSending}
                      rows={2}
                      maxLength={2000}
                      placeholder={
                        requestPending
                          ? locale === "en"
                            ? "Waiting for reply"
                            : "Đang chờ phản hồi"
                          : locale === "en"
                            ? "Type a message..."
                            : "Nhập tin nhắn..."
                      }
                      className="theme-placeholder min-h-12 flex-1 resize-none rounded-[1.35rem] border theme-border theme-panel-subtle px-4 py-3 text-sm leading-6 theme-text-strong outline-none disabled:cursor-not-allowed disabled:opacity-55"
                    />
                    <button
                      type="button"
                      onClick={handleSendMessage}
                      disabled={!messageText.trim() || !canSendMessage || isSending}
                      className="theme-button-primary inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-45"
                      aria-label={locale === "en" ? "Send message" : "Gửi tin nhắn"}
                    >
                      <SendHorizontal className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center px-6 text-center">
                <div className="max-w-md">
                  <MessageCircle className="mx-auto h-10 w-10 theme-accent" />
                  <h2 className="theme-heading mt-4 text-2xl font-semibold theme-text-strong">
                    {locale === "en" ? "Choose a conversation" : "Chọn một cuộc trò chuyện"}
                  </h2>
                  <p className="mt-3 text-sm leading-7 theme-text-muted">
                    {locale === "en"
                      ? "Select an existing conversation or search an exact email to start a message request."
                      : "Chọn cuộc trò chuyện hiện có hoặc tìm đúng email để bắt đầu lời đề nghị trò chuyện."}
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>
      </section>
      {conversationToDelete ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-conversation-title"
            className="theme-card-shadow-soft w-full max-w-lg rounded-[1.8rem] border theme-border-strong theme-panel p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] theme-eyebrow">
                  {locale === "en" ? "Delete conversation" : "Xóa cuộc trò chuyện"}
                </p>
                <h2 id="delete-conversation-title" className="theme-heading mt-3 text-2xl font-semibold theme-text-strong">
                  {locale === "en" ? "Delete this conversation?" : "Xóa cuộc trò chuyện này?"}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeDeleteDialog}
                disabled={isDeletingConversation}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border theme-border theme-panel-subtle theme-text-soft transition hover:border-sky-300/30 hover:text-[var(--text-strong)] disabled:opacity-50"
                aria-label={locale === "en" ? "Close delete confirmation" : "Đóng xác nhận xóa"}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 rounded-[1.3rem] border border-rose-200/60 bg-rose-500/8 px-4 py-4 text-sm leading-7 text-rose-800 dark:border-rose-300/20 dark:bg-rose-400/10 dark:text-rose-100">
              {locale === "en"
                ? "This action cannot be reversed. The conversation will be removed only from your message center; the other person will still keep their copy."
                : "Thao tác này không thể khôi phục. Cuộc trò chuyện chỉ bị xóa khỏi trung tâm tin nhắn của bạn; người còn lại vẫn giữ cuộc trò chuyện của họ."}
            </div>

            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeDeleteDialog}
                disabled={isDeletingConversation}
                className="inline-flex items-center justify-center rounded-full border theme-border theme-panel-subtle px-5 py-3 text-sm font-semibold theme-text-strong transition hover:border-sky-300/30 disabled:opacity-50"
              >
                {locale === "en" ? "Close" : "Đóng"}
              </button>
              <button
                type="button"
                onClick={confirmDeleteConversation}
                disabled={isDeletingConversation}
                className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,#fb7185,#ef4444)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_42px_rgba(239,68,68,0.22)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeletingConversation
                  ? locale === "en"
                    ? "Deleting..."
                    : "Đang xóa..."
                  : locale === "en"
                    ? "Confirm delete"
                    : "Xác nhận xóa"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
