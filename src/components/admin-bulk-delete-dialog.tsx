"use client";

import { useState } from "react";
import { Trash2, X } from "lucide-react";

const DELETE_ALL_PASSWORD = "Aa@291189";

function cn(...values: Array<string | undefined | false>) {
  return values.filter(Boolean).join(" ");
}

export function AdminBulkDeleteDialog({
  open,
  locale,
  title,
  description,
  items,
  confirmLabel,
  busy,
  passwordRequired = false,
  onClose,
  onConfirm,
}: {
  open: boolean;
  locale: "en" | "vi";
  title: string;
  description: string;
  items: string[];
  confirmLabel: string;
  busy: boolean;
  passwordRequired?: boolean;
  onClose: () => void;
  onConfirm: (password?: string) => void;
}) {
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  if (!open) {
    return null;
  }

  const previewItems = items.slice(0, 6);
  const submit = () => {
    if (passwordRequired && password !== DELETE_ALL_PASSWORD) {
      setPasswordError(locale === "en" ? "Password is incorrect." : "Mật khẩu chưa đúng.");
      return;
    }

    onConfirm(password);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center px-4 py-6">
      <button
        type="button"
        aria-label={locale === "en" ? "Close dialog" : "Đóng hộp thoại"}
        className="absolute inset-0 cursor-default bg-slate-950/55 backdrop-blur-sm"
        onClick={busy ? undefined : onClose}
      />
      <div className="theme-panel theme-card-shadow relative w-full max-w-2xl overflow-hidden rounded-[2rem] border theme-border">
        <div className="border-b theme-border bg-red-50/80 px-6 py-5 dark:bg-red-400/10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-4">
              <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-red-300/50 bg-red-100 text-red-800 dark:border-red-200/20 dark:bg-red-400/15 dark:text-red-100">
                <Trash2 className="h-5 w-5" />
              </span>
              <div>
                <p className="theme-heading text-xl font-semibold theme-text-strong">{title}</p>
                <p className="mt-2 text-sm leading-6 theme-text-muted">{description}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border theme-border theme-panel-strong disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="rounded-[1.25rem] border border-red-300/45 bg-red-50/80 px-4 py-4 dark:border-red-200/20 dark:bg-red-400/10">
            <p className="text-sm font-semibold text-red-900 dark:text-red-100">
              {locale === "en" ? "Records to be deleted" : "Dữ liệu sẽ bị xóa"}
            </p>
            <div className="mt-3 space-y-2">
              {previewItems.map((item) => (
                <p
                  key={item}
                  className="rounded-xl border border-red-300/35 bg-white/65 px-3 py-2 text-xs font-semibold text-red-900 dark:border-red-200/15 dark:bg-white/5 dark:text-red-100"
                >
                  {item}
                </p>
              ))}
              {items.length > previewItems.length ? (
                <p className="px-1 text-xs font-semibold text-red-900/75 dark:text-red-100/75">
                  +{items.length - previewItems.length} {locale === "en" ? "more records" : "dòng khác"}
                </p>
              ) : null}
            </div>
          </div>

          {passwordRequired ? (
            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] theme-eyebrow">
                {locale === "en" ? "Delete-all password" : "Mật khẩu xác nhận xóa tất cả"}
              </span>
              <input
                type="password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setPasswordError("");
                }}
                placeholder={locale === "en" ? "Enter confirmation password" : "Nhập mật khẩu xác nhận"}
                className="theme-field h-12 w-full rounded-[1rem] border px-4 text-sm outline-none"
              />
              {passwordError ? (
                <p className="text-sm font-semibold text-red-600 dark:text-red-200">{passwordError}</p>
              ) : null}
            </label>
          ) : null}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t theme-border bg-[var(--panel-strong)] px-6 py-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="theme-button-secondary rounded-full border px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {locale === "en" ? "Cancel" : "Hủy"}
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={busy}
            className="theme-button-danger inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Trash2 className={cn("h-4 w-4", busy && "animate-pulse")} />
            {busy ? (locale === "en" ? "Deleting..." : "Đang xóa...") : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
