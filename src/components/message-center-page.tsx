"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Inbox,
  Mail,
  MessageCircle,
  Search,
  SendHorizontal,
  ShieldCheck,
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
};

type MessageConversation = {
  id: string;
  participant: MessageUser | null;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
  readAt?: string;
  unreadCount: number;
  requestPending: boolean;
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

function conversationUrl(conversationId: string) {
  return `/messages?conversation=${encodeURIComponent(conversationId)}`;
}

export function MessageCenterPage() {
  const { authStatus, currentUser, isAuthenticated, locale } = useSiteState();
  const [conversations, setConversations] = useState<MessageConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState("");
  const [draftRecipient, setDraftRecipient] = useState<MessageUser | null>(null);
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResult, setSearchResult] = useState<MessageUser | null>(null);
  const [hasSearchedExactEmail, setHasSearchedExactEmail] = useState(false);
  const [isSearchBusy, setIsSearchBusy] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadMessages = useCallback(async () => {
    if (!isAuthenticated) {
      return;
    }

    setIsLoading(true);
    const response = await fetch("/api/messages", {
      cache: "no-store",
      credentials: "same-origin",
    });

    if (!response.ok) {
      setStatusMessage(
        locale === "en"
          ? "Could not load message conversations."
          : "Không thể tải các cuộc trò chuyện.",
      );
      setIsLoading(false);
      return;
    }

    const payload = (await response.json()) as { conversations: MessageConversation[] };
    setConversations(payload.conversations);
    setActiveConversationId((current) => {
      if (current && payload.conversations.some((conversation) => conversation.id === current)) {
        return current;
      }

      const params = new URLSearchParams(window.location.search);
      const requestedConversationId = params.get("conversation") ?? "";
      if (
        requestedConversationId &&
        payload.conversations.some((conversation) => conversation.id === requestedConversationId)
      ) {
        return requestedConversationId;
      }

      return payload.conversations[0]?.id ?? "";
    });
    setIsLoading(false);
  }, [isAuthenticated, locale]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadMessages();
    });
  }, [loadMessages]);

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId),
    [activeConversationId, conversations],
  );

  const activeParticipant = activeConversation?.participant ?? draftRecipient;
  const activeMessages = activeConversation?.messages ?? [];
  const canSendMessage = Boolean(draftRecipient || activeConversation?.canSendMessage);
  const showFirstMessageNotice = Boolean(draftRecipient || (activeConversation && activeMessages.length === 0));
  const requestPending = Boolean(activeConversation?.requestPending);

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

    if (existingConversation) {
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
    window.dispatchEvent(new Event("attacker-notifications-refresh"));
    setIsSending(false);
  };

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
    <div className="space-y-6">
      <section className="theme-card-shadow-soft overflow-hidden rounded-[2rem] border theme-border-strong theme-panel">
        <div className="grid min-h-[720px] lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="border-b theme-border bg-white/42 p-4 dark:bg-white/4 lg:border-b-0 lg:border-r">
            <div className="flex items-start gap-3 px-1 py-2">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-sky-400/24 bg-sky-500/12 text-sky-600 dark:text-sky-200">
                <MessageCircle className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] theme-eyebrow">
                  {locale === "en" ? "Message center" : "Trung tâm tin nhắn"}
                </p>
                <h1 className="theme-heading mt-1 text-2xl font-semibold theme-text-strong">
                  {locale === "en" ? "Conversations" : "Cuộc trò chuyện"}
                </h1>
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

            <div className="mt-5 space-y-2">
              {isLoading ? (
                <p className="rounded-[1.25rem] border theme-border theme-panel-subtle px-4 py-4 text-sm theme-text-muted">
                  {locale === "en" ? "Loading conversations..." : "Đang tải cuộc trò chuyện..."}
                </p>
              ) : conversations.length ? (
                conversations.map((conversation) => {
                  const participant = conversation.participant;
                  const isActive = conversation.id === activeConversationId;

                  return (
                    <button
                      type="button"
                      key={conversation.id}
                      onClick={() => openConversation(conversation.id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-[1.35rem] border px-3 py-3 text-left transition",
                        isActive
                          ? "border-sky-300/38 bg-sky-500/12 shadow-[0_16px_38px_rgba(14,165,233,0.12)]"
                          : "theme-border theme-panel-subtle hover:border-sky-300/26 hover:bg-[rgba(23,114,208,0.06)]",
                      )}
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
                          {conversation.unreadCount > 0 ? (
                            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-sky-500 px-1.5 text-[0.68rem] font-bold text-white">
                              {conversation.unreadCount}
                            </span>
                          ) : null}
                        </span>
                        <span className="mt-1 block truncate text-xs theme-text-muted">
                          {conversation.latestMessage?.body ?? (locale === "en" ? "No messages yet" : "Chưa có tin nhắn")}
                        </span>
                      </span>
                    </button>
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

          <section className="flex min-h-[620px] flex-col">
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
                    <p className="mt-1 truncate text-sm theme-text-muted">{activeParticipant.email}</p>
                  </div>
                  <span className="hidden rounded-full border theme-border theme-panel-subtle px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] theme-text-soft sm:inline-flex">
                    {activeParticipant.role}
                  </span>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto px-5 py-6 md:px-6">
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
                              ? "Your first message is treated as a message request. You can send only one first message until the receiver replies. After they reply, both users can continue without this limit."
                              : "Tin nhắn đầu tiên được xem như một lời đề nghị trò chuyện. Bạn chỉ được gửi một tin nhắn đầu tiên cho đến khi người nhận phản hồi. Sau khi họ trả lời, hai bên có thể nhắn tiếp không giới hạn."}
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
                              "max-w-[78%] rounded-[1.35rem] px-4 py-3 shadow-[0_14px_34px_rgba(15,23,42,0.08)]",
                              isOwnMessage
                                ? "bg-[linear-gradient(135deg,#38bdf8,#2563eb)] text-white"
                                : "border theme-border theme-panel-subtle theme-text-strong",
                            )}
                          >
                            <p className="whitespace-pre-wrap text-sm leading-7">{message.body}</p>
                            <p
                              className={cn(
                                "mt-2 text-[0.68rem] font-medium",
                                isOwnMessage ? "text-white/72" : "theme-text-faint",
                              )}
                            >
                              {formatMessageTime(locale, message.createdAt)}
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
    </div>
  );
}
