"use client";

import { useEffect, useMemo, useState, type ComponentType } from "react";
import { ChevronRight, Mail, RotateCcw, Save, ShieldCheck } from "lucide-react";

import { ADMIN_TITLE_ID, useAdminTitleScroll } from "@/components/admin-title-scroll";
import { useSiteState } from "@/components/providers/site-state-provider";
import { SectionHeading, Surface } from "@/components/site-ui";
import { defaultSystemEmailTemplates } from "@/data/system-email-templates";
import type { SystemEmailTemplate, SystemEmailTemplates } from "@/types/site";

const fieldClassName =
  "theme-placeholder w-full rounded-2xl border theme-border theme-panel px-4 py-3 text-sm theme-text-strong outline-none";

function cloneTemplates(value: SystemEmailTemplates) {
  return JSON.parse(JSON.stringify(value)) as SystemEmailTemplates;
}

function VietnameseField({
  label,
  value,
  rows = 3,
  onChange,
}: {
  label: string;
  value: string;
  rows?: number;
  onChange: (nextValue: string) => void;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm theme-text-muted">{label} (VI)</span>
      <textarea
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={fieldClassName}
      />
    </label>
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
  onChange: (field: keyof SystemEmailTemplate, value: string) => void;
}) {
  return (
    <Surface className="space-y-5 px-5 py-5 md:px-6 md:py-6">
      <div>
        <p className="text-lg font-semibold theme-text-strong">{title}</p>
        <p className="mt-2 text-sm leading-7 theme-text-soft">{description}</p>
      </div>

      <VietnameseField
        label="Subject"
        rows={2}
        value={template.subject.vi}
        onChange={(value) => onChange("subject", value)}
      />
      <VietnameseField
        label="Preview"
        rows={3}
        value={template.preview.vi}
        onChange={(value) => onChange("preview", value)}
      />
      <VietnameseField
        label="Headline"
        rows={3}
        value={template.headline.vi}
        onChange={(value) => onChange("headline", value)}
      />
      <VietnameseField
        label="Intro"
        rows={5}
        value={template.intro.vi}
        onChange={(value) => onChange("intro", value)}
      />
      <VietnameseField
        label="Action label"
        rows={2}
        value={template.actionLabel.vi}
        onChange={(value) => onChange("actionLabel", value)}
      />
      <VietnameseField
        label="Action hint"
        rows={5}
        value={template.actionHint.vi}
        onChange={(value) => onChange("actionHint", value)}
      />
      <VietnameseField
        label="Footer"
        rows={4}
        value={template.footer.vi}
        onChange={(value) => onChange("footer", value)}
      />
    </Surface>
  );
}

function TemplateSelectorCard({
  active,
  title,
  description,
  icon: Icon,
  accentClassName,
  onClick,
}: {
  active: boolean;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  accentClassName: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        "group w-full rounded-[1.75rem] border px-5 py-5 text-left transition md:px-6",
        active
          ? "border-[var(--line-strong)] bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(235,244,255,0.96))] shadow-[0_20px_44px_var(--shadow-soft)] dark:bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.04))]"
          : "theme-panel theme-border hover:border-[var(--line-strong)] hover:bg-[var(--panel-strong)]",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${accentClassName}`}>
            <Icon className="h-4.5 w-4.5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold theme-text-strong">{title}</p>
            <p className="mt-1 text-sm leading-7 theme-text-soft">{description}</p>
          </div>
        </div>
        <span
          className={[
            "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition",
            active
              ? "border-sky-500/20 bg-sky-500/10 text-[var(--brand)]"
              : "theme-border theme-panel-subtle theme-text-soft group-hover:text-[var(--brand)]",
          ].join(" ")}
        >
          <ChevronRight className={`h-4 w-4 transition ${active ? "rotate-90" : ""}`} />
        </span>
      </div>
    </button>
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
  const [activeTemplateKey, setActiveTemplateKey] = useState<keyof SystemEmailTemplates>("activation");

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
    value: string,
  ) => {
    setTemplates((current) => ({
      ...current,
      [key]: {
        ...current[key],
        [field]: {
          en: value,
          vi: value,
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
          <div className="grid gap-4 lg:grid-cols-2">
            <TemplateSelectorCard
              active={activeTemplateKey === "activation"}
              title={locale === "en" ? "Activation email" : "Email kích hoạt"}
              description={
                locale === "en"
                  ? "Sent immediately after registration and when an unverified user asks to resend."
                  : "Được gửi ngay sau khi đăng ký và khi người dùng chưa xác thực yêu cầu gửi lại."
              }
              icon={Mail}
              accentClassName="border-sky-500/18 bg-sky-500/10 text-sky-600 dark:text-sky-200"
              onClick={() => setActiveTemplateKey("activation")}
            />
            <TemplateSelectorCard
              active={activeTemplateKey === "passwordReset"}
              title={locale === "en" ? "Password reset email" : "Email đặt lại mật khẩu"}
              description={
                locale === "en"
                  ? "Sent when a verified user requests a secure link to set a new password."
                  : "Được gửi khi người dùng đã xác thực yêu cầu nhận liên kết bảo mật để đặt mật khẩu mới."
              }
              icon={ShieldCheck}
              accentClassName="border-amber-500/18 bg-amber-500/10 text-amber-600 dark:text-amber-200"
              onClick={() => setActiveTemplateKey("passwordReset")}
            />
          </div>

          {activeTemplateKey === "activation" ? (
            <TemplateEditorCard
              title={locale === "en" ? "Activation email template" : "Mẫu email kích hoạt"}
              description={
                locale === "en"
                  ? "This template is sent after email/password registration to activate a new competition account."
                  : "Mẫu này được gửi sau khi đăng ký email/mật khẩu để kích hoạt tài khoản dự thi mới."
              }
              template={templates.activation}
              onChange={(field, value) =>
                updateTemplateField("activation", field, value)
              }
            />
          ) : null}

          {activeTemplateKey === "passwordReset" ? (
            <TemplateEditorCard
              title={locale === "en" ? "Password reset email template" : "Mẫu email đặt lại mật khẩu"}
              description={
                locale === "en"
                  ? "This template is sent when a user asks to choose a new password through a time-limited secure link."
                  : "Mẫu này được gửi khi người dùng yêu cầu chọn mật khẩu mới thông qua liên kết bảo mật có thời hạn."
              }
              template={templates.passwordReset}
              onChange={(field, value) =>
                updateTemplateField("passwordReset", field, value)
              }
            />
          ) : null}
        </div>
      )}
    </div>
  );
}
