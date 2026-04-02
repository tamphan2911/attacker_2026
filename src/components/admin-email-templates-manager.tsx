"use client";

import { useEffect, useMemo, useState } from "react";
import { Mail, RotateCcw, Save, ShieldCheck } from "lucide-react";

import { ADMIN_TITLE_ID, useAdminTitleScroll } from "@/components/admin-title-scroll";
import { useSiteState } from "@/components/providers/site-state-provider";
import { SectionHeading, Surface } from "@/components/site-ui";
import { defaultSystemEmailTemplates } from "@/data/system-email-templates";
import type { Locale, SystemEmailTemplate, SystemEmailTemplates } from "@/types/site";

const fieldClassName =
  "theme-placeholder w-full rounded-2xl border theme-border theme-panel px-4 py-3 text-sm theme-text-strong outline-none";

function cloneTemplates(value: SystemEmailTemplates) {
  return JSON.parse(JSON.stringify(value)) as SystemEmailTemplates;
}

function LocalizedField({
  label,
  value,
  rows = 3,
  onChange,
}: {
  label: string;
  value: { en: string; vi: string };
  rows?: number;
  onChange: (locale: Locale, nextValue: string) => void;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {(["en", "vi"] as Locale[]).map((language) => (
        <label key={language} className="space-y-2">
          <span className="text-sm theme-text-muted">
            {label} ({language.toUpperCase()})
          </span>
          <textarea
            rows={rows}
            value={value[language]}
            onChange={(event) => onChange(language, event.target.value)}
            className={fieldClassName}
          />
        </label>
      ))}
    </div>
  );
}

function TemplateEditorCard({
  title,
  description,
  template,
  onChange,
}: {
  title: string;
  description: string;
  template: SystemEmailTemplate;
  onChange: (field: keyof SystemEmailTemplate, locale: Locale, value: string) => void;
}) {
  return (
    <Surface className="space-y-5 px-5 py-5 md:px-6 md:py-6">
      <div>
        <p className="text-lg font-semibold theme-text-strong">{title}</p>
        <p className="mt-2 text-sm leading-7 theme-text-soft">{description}</p>
      </div>

      <LocalizedField
        label="Subject"
        rows={2}
        value={template.subject}
        onChange={(locale, value) => onChange("subject", locale, value)}
      />
      <LocalizedField
        label="Preview"
        rows={3}
        value={template.preview}
        onChange={(locale, value) => onChange("preview", locale, value)}
      />
      <LocalizedField
        label="Headline"
        rows={3}
        value={template.headline}
        onChange={(locale, value) => onChange("headline", locale, value)}
      />
      <LocalizedField
        label="Intro"
        rows={5}
        value={template.intro}
        onChange={(locale, value) => onChange("intro", locale, value)}
      />
      <LocalizedField
        label="Action label"
        rows={2}
        value={template.actionLabel}
        onChange={(locale, value) => onChange("actionLabel", locale, value)}
      />
      <LocalizedField
        label="Action hint"
        rows={5}
        value={template.actionHint}
        onChange={(locale, value) => onChange("actionHint", locale, value)}
      />
      <LocalizedField
        label="Footer"
        rows={4}
        value={template.footer}
        onChange={(locale, value) => onChange("footer", locale, value)}
      />
    </Surface>
  );
}

export function AdminEmailTemplatesManager() {
  const { locale } = useSiteState();
  useAdminTitleScroll();

  const [templates, setTemplates] = useState<SystemEmailTemplates>(() =>
    cloneTemplates(defaultSystemEmailTemplates),
  );
  const [savedTemplates, setSavedTemplates] = useState<SystemEmailTemplates>(() =>
    cloneTemplates(defaultSystemEmailTemplates),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const response = await fetch("/api/admin/email-templates", {
        cache: "no-store",
        credentials: "same-origin",
      });

      if (!response.ok) {
        if (!cancelled) {
          setMessage(
            locale === "en"
              ? "Could not load the current system email templates."
              : "Không thể tải mẫu email hệ thống hiện tại.",
          );
          setIsLoading(false);
        }
        return;
      }

      const payload = (await response.json()) as { templates: SystemEmailTemplates };
      if (!cancelled) {
        const nextTemplates = cloneTemplates(payload.templates);
        setTemplates(nextTemplates);
        setSavedTemplates(cloneTemplates(payload.templates));
        setIsLoading(false);
      }
    })().catch(() => {
      if (!cancelled) {
        setMessage(
          locale === "en"
            ? "Could not load the current system email templates."
            : "Không thể tải mẫu email hệ thống hiện tại.",
        );
        setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [locale]);

  const isDirty = useMemo(
    () => JSON.stringify(templates) !== JSON.stringify(savedTemplates),
    [savedTemplates, templates],
  );

  const updateTemplateField = (
    key: keyof SystemEmailTemplates,
    field: keyof SystemEmailTemplate,
    language: Locale,
    value: string,
  ) => {
    setTemplates((current) => ({
      ...current,
      [key]: {
        ...current[key],
        [field]: {
          ...current[key][field],
          [language]: value,
        },
      },
    }));
  };

  const handleReset = () => {
    setTemplates(cloneTemplates(savedTemplates));
    setMessage("");
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage("");

    const response = await fetch("/api/admin/email-templates", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
      body: JSON.stringify(templates),
    });

    if (!response.ok) {
      setMessage(
        locale === "en"
          ? "Could not save the email templates right now."
          : "Hiện chưa thể lưu các mẫu email.",
      );
      setIsSaving(false);
      return;
    }

    setSavedTemplates(cloneTemplates(templates));
    setMessage(
      locale === "en"
        ? "System email templates updated."
        : "Đã cập nhật mẫu email hệ thống.",
    );
    setIsSaving(false);
  };

  return (
    <div className="space-y-8">
      <section className="space-y-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <SectionHeading
            id={ADMIN_TITLE_ID}
            className="scroll-mt-32"
            eyebrow={locale === "en" ? "System / Email templates" : "Hệ thống / Mẫu email"}
            title={
              locale === "en"
                ? "Activation and password-reset emails live here."
                : "Email kích hoạt và đặt lại mật khẩu được quản lý tại đây."
            }
            description={
              locale === "en"
                ? "Use placeholders {{name}}, {{link}}, {{supportEmail}}, and {{competitionName}} inside the copy. The visual email shell stays fixed; this screen edits the message content."
                : "Dùng các biến {{name}}, {{link}}, {{supportEmail}} và {{competitionName}} trong nội dung. Phần khung email giữ cố định; màn hình này chỉ chỉnh thông điệp."
            }
          />

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="theme-button-secondary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
            >
              <RotateCcw className="h-4 w-4" />
              {locale === "en" ? "Reset draft" : "Đặt lại bản nháp"}
            </button>
            <button
              type="button"
              disabled={!isDirty || isSaving || isLoading}
              onClick={() => void handleSave()}
              className="theme-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {isSaving
                ? locale === "en"
                  ? "Saving..."
                  : "Đang lưu..."
                : locale === "en"
                  ? "Save templates"
                  : "Lưu mẫu email"}
            </button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Surface className="px-5 py-5">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-sky-500/18 bg-sky-500/10">
                <Mail className="h-4.5 w-4.5 text-sky-600 dark:text-sky-200" />
              </span>
              <div>
                <p className="text-sm font-semibold theme-text-strong">
                  {locale === "en" ? "Activation email" : "Email kích hoạt"}
                </p>
                <p className="mt-1 text-sm theme-text-soft">
                  {locale === "en"
                    ? "Sent immediately after registration and when an unverified user asks to resend."
                    : "Được gửi ngay sau khi đăng ký và khi người dùng chưa xác thực yêu cầu gửi lại."}
                </p>
              </div>
            </div>
          </Surface>

          <Surface className="px-5 py-5">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-amber-500/18 bg-amber-500/10">
                <ShieldCheck className="h-4.5 w-4.5 text-amber-600 dark:text-amber-200" />
              </span>
              <div>
                <p className="text-sm font-semibold theme-text-strong">
                  {locale === "en" ? "Password reset email" : "Email đặt lại mật khẩu"}
                </p>
                <p className="mt-1 text-sm theme-text-soft">
                  {locale === "en"
                    ? "Sent when a verified user requests a secure link to set a new password."
                    : "Được gửi khi người dùng đã xác thực yêu cầu nhận liên kết bảo mật để đặt mật khẩu mới."}
                </p>
              </div>
            </div>
          </Surface>
        </div>
      </section>

      {message ? (
        <Surface className="px-5 py-4">
          <p className="text-sm theme-text-body">{message}</p>
        </Surface>
      ) : null}

      {isLoading ? (
        <Surface className="px-6 py-8">
          <p className="text-sm theme-text-soft">
            {locale === "en" ? "Loading email templates..." : "Đang tải mẫu email..."}
          </p>
        </Surface>
      ) : (
        <div className="space-y-6">
          <TemplateEditorCard
            title={locale === "en" ? "Activation email template" : "Mẫu email kích hoạt"}
            description={
              locale === "en"
                ? "This template is sent after email/password registration to activate a new competition account."
                : "Mẫu này được gửi sau khi đăng ký email/mật khẩu để kích hoạt tài khoản dự thi mới."
            }
            template={templates.activation}
            onChange={(field, language, value) =>
              updateTemplateField("activation", field, language, value)
            }
          />

          <TemplateEditorCard
            title={locale === "en" ? "Password reset email template" : "Mẫu email đặt lại mật khẩu"}
            description={
              locale === "en"
                ? "This template is sent when a user asks to choose a new password through a time-limited secure link."
                : "Mẫu này được gửi khi người dùng yêu cầu chọn mật khẩu mới thông qua liên kết bảo mật có thời hạn."
            }
            template={templates.passwordReset}
            onChange={(field, language, value) =>
              updateTemplateField("passwordReset", field, language, value)
            }
          />
        </div>
      )}
    </div>
  );
}
