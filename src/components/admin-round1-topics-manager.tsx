"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { CirclePlus, Save, SquarePen, Trash2, X } from "lucide-react";

import { useSiteState } from "@/components/providers/site-state-provider";
import { StatusPill, Surface } from "@/components/site-ui";
import {
  normalizeRound1TopicName,
  normalizeRound1Topics,
  ROUND1_TOPIC_LIMIT,
} from "@/lib/round1-topics";
import type { Locale, Round1TestBank } from "@/types/site";

const fieldClassName =
  "theme-placeholder w-full rounded-2xl border theme-border theme-panel px-4 py-3 text-sm theme-text-strong outline-none";
const selectFieldClassName = `${fieldClassName} theme-admin-select`;

function sortTopics(locale: Locale, topics: string[]) {
  return [...topics].sort((left, right) => left.localeCompare(right, locale));
}

function getRound1TopicUsage(round1TestBanks: Round1TestBank[], topic: string) {
  const topicKey = normalizeRound1TopicName(topic).toLowerCase();

  return round1TestBanks.reduce(
    (result, bank) => {
      const count = bank.questions.filter(
        (question) => normalizeRound1TopicName(question.topic).toLowerCase() === topicKey,
      ).length;

      if (bank.bankType === "essay") {
        return { ...result, essay: result.essay + count };
      }

      return { ...result, objective: result.objective + count };
    },
    { objective: 0, essay: 0 },
  );
}

export function Round1QuestionTopicSelect({
  locale,
  value,
  topics,
  onChange,
}: {
  locale: Locale;
  value: string;
  topics: string[];
  onChange: (topic: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const topicOptions = useMemo(
    () => sortTopics(locale, normalizeRound1Topics([...topics, value])),
    [locale, topics, value],
  );

  return (
    <div className="relative">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={!topicOptions.length}
        aria-label={locale === "en" ? "Topic" : "Chủ đề"}
        className={selectFieldClassName}
      >
        {topicOptions.length ? null : (
          <option value="">
            {locale === "en" ? "Create a topic first" : "Hãy tạo chủ đề trước"}
          </option>
        )}
        {topicOptions.map((topic) => (
          <option key={topic} value={topic}>
            {topic}
          </option>
        ))}
      </select>
    </div>
  );
}

export function Round1EditorSelect({
  value,
  onChange,
  disabled = false,
  ariaLabel,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  ariaLabel: string;
  children: ReactNode;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        aria-label={ariaLabel}
        className={selectFieldClassName}
      >
        {children}
      </select>
    </div>
  );
}

export function Round1TopicsManager() {
  const { locale, currentUser, round1TestBanks, round1Topics, updateRound1TopicsByAdmin } = useSiteState();
  const canManageTopics = currentUser.role === "admin";
  const [newTopic, setNewTopic] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [pendingDeleteIndex, setPendingDeleteIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "warning"; text: string } | null>(null);
  const pendingDeleteTopic = pendingDeleteIndex === null ? null : round1Topics[pendingDeleteIndex] ?? null;
  const canAddMoreTopics = round1Topics.length < ROUND1_TOPIC_LIMIT;

  useEffect(() => {
    if (pendingDeleteIndex === null) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPendingDeleteIndex(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pendingDeleteIndex]);

  const setTopicMessage = (tone: "success" | "warning", text: string) => {
    setMessage({ tone, text });
  };

  const persistTopics = async (
    topics: string[],
    successText: string,
    options?: { rename?: { from: string; to: string } },
  ) => {
    const normalizedTopics = normalizeRound1Topics(topics);

    if (normalizedTopics.length > ROUND1_TOPIC_LIMIT) {
      setTopicMessage(
        "warning",
        locale === "en"
          ? `Round 1 supports up to ${ROUND1_TOPIC_LIMIT} topics.`
          : `Vòng 1 chỉ hỗ trợ tối đa ${ROUND1_TOPIC_LIMIT} chủ đề.`,
      );
      return false;
    }

    setSaving(true);
    const ok = await updateRound1TopicsByAdmin(normalizedTopics, options);
    setSaving(false);

    if (ok) {
      setTopicMessage("success", successText);
    }

    return ok;
  };

  const addTopic = async () => {
    const topicName = normalizeRound1TopicName(newTopic);

    if (!topicName) {
      setTopicMessage(
        "warning",
        locale === "en" ? "Enter a topic name before adding it." : "Hãy nhập tên chủ đề trước khi thêm.",
      );
      return;
    }

    if (!canAddMoreTopics) {
      setTopicMessage(
        "warning",
        locale === "en"
          ? `You already have ${ROUND1_TOPIC_LIMIT} topics. Edit an existing topic instead.`
          : `Đã có đủ ${ROUND1_TOPIC_LIMIT} chủ đề. Hãy chỉnh sửa chủ đề hiện có.`,
      );
      return;
    }

    if (round1Topics.some((topic) => topic.toLowerCase() === topicName.toLowerCase())) {
      setTopicMessage("warning", locale === "en" ? "That topic already exists." : "Chủ đề này đã tồn tại.");
      return;
    }

    const ok = await persistTopics(
      [...round1Topics, topicName],
      locale === "en" ? "Topic added successfully." : "Đã thêm chủ đề thành công.",
    );

    if (ok) {
      setNewTopic("");
    }
  };

  const startEditing = (index: number, topic: string) => {
    setEditingIndex(index);
    setEditingValue(topic);
    setMessage(null);
  };

  const saveEditedTopic = async () => {
    if (editingIndex === null) {
      return;
    }

    const previousTopic = round1Topics[editingIndex];
    const nextTopic = normalizeRound1TopicName(editingValue);

    if (!previousTopic || !nextTopic) {
      setTopicMessage("warning", locale === "en" ? "Topic name cannot be empty." : "Tên chủ đề không được để trống.");
      return;
    }

    if (
      round1Topics.some(
        (topic, index) => index !== editingIndex && topic.toLowerCase() === nextTopic.toLowerCase(),
      )
    ) {
      setTopicMessage(
        "warning",
        locale === "en" ? "Another topic already uses that name." : "Một chủ đề khác đã dùng tên này.",
      );
      return;
    }

    const nextTopics = round1Topics.map((topic, index) => (index === editingIndex ? nextTopic : topic));
    const ok = await persistTopics(
      nextTopics,
      locale === "en" ? "Topic updated successfully." : "Đã cập nhật chủ đề thành công.",
      { rename: { from: previousTopic, to: nextTopic } },
    );

    if (ok) {
      setEditingIndex(null);
      setEditingValue("");
    }
  };

  const confirmDeleteTopic = async () => {
    if (pendingDeleteIndex === null || !pendingDeleteTopic) {
      return;
    }

    const nextTopics = round1Topics.filter((_, index) => index !== pendingDeleteIndex);
    const ok = await persistTopics(
      nextTopics,
      locale === "en" ? "Topic deleted successfully." : "Đã xóa chủ đề thành công.",
    );

    if (ok) {
      setPendingDeleteIndex(null);
      if (editingIndex === pendingDeleteIndex) {
        setEditingIndex(null);
        setEditingValue("");
      }
    }
  };

  return (
    <Surface className="px-6 py-6 md:px-8 md:py-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-3xl">
          <p className="theme-eyebrow text-xs font-semibold uppercase tracking-[0.28em]">
            {locale === "en" ? "Round 1 topics" : "Chủ đề Vòng 1"}
          </p>
          <h2 className="mt-2 theme-heading text-3xl font-semibold theme-text-strong">
            {locale === "en" ? "Topic manager" : "Quản lý chủ đề"}
          </h2>
          <p className="mt-3 text-sm leading-7 theme-text-muted">
            {locale === "en"
              ? "Round 1 questions are assigned to these topics. Official attempts draw objective questions by topic bucket."
              : "Câu hỏi Vòng 1 sẽ được gắn với các chủ đề này. Lượt thi chính thức rút câu hỏi trắc nghiệm theo từng nhóm chủ đề."}
          </p>
        </div>
        <StatusPill tone={round1Topics.length === ROUND1_TOPIC_LIMIT ? "warning" : "info"}>
          {`${round1Topics.length}/${ROUND1_TOPIC_LIMIT} ${locale === "en" ? "topics" : "chủ đề"}`}
        </StatusPill>
      </div>

      {!canManageTopics ? (
        <div className="mt-5 rounded-[1.35rem] border border-amber-500/20 bg-amber-400/10 px-4 py-3 text-sm leading-6 text-amber-950 dark:text-amber-100">
          {locale === "en"
            ? "Only admin accounts can add, edit, or delete Round 1 topics."
            : "Chỉ tài khoản admin mới có thể thêm, sửa hoặc xóa chủ đề Vòng 1."}
        </div>
      ) : null}

      {message ? (
        <div className="mt-5">
          <StatusPill tone={message.tone === "success" ? "success" : "warning"}>{message.text}</StatusPill>
        </div>
      ) : null}

      <div className="mt-6 overflow-x-auto rounded-[1.5rem] border theme-border">
        <div className="min-w-[680px]">
          <div className="grid grid-cols-[64px_minmax(220px,1fr)_220px_130px] border-b theme-border bg-[var(--panel-strong)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] theme-text-soft">
            <span>#</span>
            <span>{locale === "en" ? "Topic name" : "Tên chủ đề"}</span>
            <span>{locale === "en" ? "Questions" : "Câu hỏi"}</span>
            <span className="text-right">{locale === "en" ? "Actions" : "Thao tác"}</span>
          </div>

          {round1Topics.length ? (
            round1Topics.map((topic, index) => {
              const usage = getRound1TopicUsage(round1TestBanks, topic);
              const isEditing = editingIndex === index;

              return (
                <div
                  key={`${topic}-${index}`}
                  className="grid grid-cols-[64px_minmax(220px,1fr)_220px_130px] items-center gap-3 border-b theme-border px-4 py-3 last:border-b-0"
                >
                  <span className="text-sm font-semibold theme-text-soft">{String(index + 1).padStart(2, "0")}</span>
                  {isEditing ? (
                    <input value={editingValue} onChange={(event) => setEditingValue(event.target.value)} className={fieldClassName} autoFocus />
                  ) : (
                    <p className="font-semibold theme-text-strong">{topic}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <StatusPill>{`${locale === "en" ? "Objective" : "Trắc nghiệm"}: ${usage.objective}`}</StatusPill>
                    <StatusPill tone="info">{`${locale === "en" ? "Essay" : "Tự luận"}: ${usage.essay}`}</StatusPill>
                  </div>
                  <div className="flex justify-end gap-2">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          onClick={() => void saveEditedTopic()}
                          disabled={!canManageTopics || saving}
                          className="theme-button-primary inline-flex h-10 w-10 items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-55"
                          aria-label={locale === "en" ? "Save topic" : "Lưu chủ đề"}
                        >
                          <Save className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingIndex(null);
                            setEditingValue("");
                          }}
                          className="theme-button-secondary inline-flex h-10 w-10 items-center justify-center rounded-full border"
                          aria-label={locale === "en" ? "Cancel editing" : "Hủy chỉnh sửa"}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => startEditing(index, topic)}
                          disabled={!canManageTopics}
                          className="theme-button-secondary inline-flex h-10 w-10 items-center justify-center rounded-full border disabled:cursor-not-allowed disabled:opacity-55"
                          aria-label={locale === "en" ? "Edit topic" : "Sửa chủ đề"}
                        >
                          <SquarePen className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingDeleteIndex(index)}
                          disabled={!canManageTopics || saving}
                          className="theme-button-danger inline-flex h-10 w-10 items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-55"
                          aria-label={locale === "en" ? "Delete topic" : "Xóa chủ đề"}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="px-4 py-8 text-center text-sm theme-text-muted">
              {locale === "en" ? "No managed topics yet." : "Chưa có chủ đề nào được quản lý."}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 rounded-[1.5rem] border theme-border theme-panel-subtle px-4 py-4 md:flex-row md:items-center">
        <input
          value={newTopic}
          onChange={(event) => setNewTopic(event.target.value)}
          disabled={!canManageTopics || !canAddMoreTopics || saving}
          placeholder={
            canAddMoreTopics
              ? locale === "en"
                ? "New topic name"
                : "Tên chủ đề mới"
              : locale === "en"
                ? "Topic limit reached"
                : "Đã đủ số chủ đề"
          }
          className={fieldClassName}
        />
        <button
          type="button"
          onClick={() => void addTopic()}
          disabled={!canManageTopics || !canAddMoreTopics || saving}
          className="theme-button-primary inline-flex shrink-0 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-55"
        >
          <CirclePlus className="h-4 w-4" />
          {locale === "en" ? "Add topic" : "Thêm chủ đề"}
        </button>
      </div>

      {pendingDeleteTopic ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setPendingDeleteIndex(null);
            }
          }}
        >
          <Surface className="w-full max-w-lg rounded-[1.75rem] px-6 py-6 shadow-[0_28px_80px_rgba(2,8,20,0.28)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="theme-eyebrow text-xs font-semibold uppercase tracking-[0.24em]">
                  {locale === "en" ? "Confirm deletion" : "Xác nhận xóa"}
                </p>
                <h3 className="mt-2 theme-heading text-2xl font-semibold theme-text-strong">
                  {locale === "en" ? "Delete this topic?" : "Xóa chủ đề này?"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPendingDeleteIndex(null)}
                className="theme-button-secondary inline-flex h-10 w-10 items-center justify-center rounded-full border"
                aria-label={locale === "en" ? "Close" : "Đóng"}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-5 rounded-[1.25rem] border theme-border theme-panel-subtle px-4 py-4">
              <p className="text-sm theme-text-muted">{locale === "en" ? "Topic" : "Chủ đề"}</p>
              <p className="mt-1 text-lg font-semibold theme-text-strong">{pendingDeleteTopic}</p>
            </div>
            <p className="mt-4 text-sm leading-7 theme-text-muted">
              {locale === "en"
                ? "The topic will be removed from the managed list. Existing questions keep their saved topic text until you edit them."
                : "Chủ đề sẽ bị xóa khỏi danh sách quản lý. Các câu hỏi hiện có vẫn giữ nhãn chủ đề đã lưu cho đến khi bạn chỉnh sửa lại."}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setPendingDeleteIndex(null)}
                className="theme-button-secondary inline-flex justify-center rounded-full border px-5 py-3 text-sm font-semibold"
              >
                {locale === "en" ? "Cancel" : "Hủy"}
              </button>
              <button
                type="button"
                onClick={() => void confirmDeleteTopic()}
                disabled={saving}
                className="theme-button-danger inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-55"
              >
                <Trash2 className="h-4 w-4" />
                {locale === "en" ? "Delete topic" : "Xóa chủ đề"}
              </button>
            </div>
          </Surface>
        </div>
      ) : null}
    </Surface>
  );
}
