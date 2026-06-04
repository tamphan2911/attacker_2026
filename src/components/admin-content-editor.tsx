"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  ArrowLeft,
  Bold,
  BriefcaseBusiness,
  ChevronDown,
  CheckCircle2,
  CircleHelp,
  Clock3,
  FileText,
  Heading2,
  ImageIcon,
  Italic,
  LayoutDashboard,
  Link2,
  List,
  ListOrdered,
  Mail,
  Medal,
  MessageSquare,
  Newspaper,
  Plus,
  Quote,
  ShieldCheck,
  Sparkles,
  Sprout,
  Save,
  Tags,
  Trash2,
  Trophy,
  Upload,
  Users2,
} from "lucide-react";

import {
  contentPageConfigs,
  contentTypeConfigs,
  type ContentPageId,
  type ContentTypeId,
} from "@/data/admin-content";
import {
  getCompetitionLegacyImageValidationError,
  MAX_COMPETITION_LEGACY_IMAGE_BYTES,
} from "@/lib/competition-legacy-image";
import {
  getFooterBrandImageValidationError,
  MAX_FOOTER_BRAND_IMAGE_BYTES,
} from "@/lib/footer-brand-image";
import {
  getHeaderBrandImageValidationError,
  MAX_HEADER_BRAND_IMAGE_BYTES,
} from "@/lib/header-brand-image";
import { pickText } from "@/lib/site";
import { ADMIN_TITLE_ID, useAdminTitleScroll } from "@/components/admin-title-scroll";
import { useSiteState } from "@/components/providers/site-state-provider";
import { SectionHeading, Surface } from "@/components/site-ui";
import type {
  FAQItem,
  FAQTopic,
  Locale,
  LocalizedText,
  SitePageContent,
  TestimonialItem,
  TimelineItem,
} from "@/types/site";
import type { SponsorProfile } from "@/types/site";

function cn(...values: Array<string | undefined | false>) {
  return values.filter(Boolean).join(" ");
}

const fieldClassName =
  "theme-placeholder w-full rounded-2xl border theme-border theme-panel px-4 py-3 text-sm theme-text-strong outline-none";
const MAX_TESTIMONIAL_AVATAR_FILE_BYTES = 2 * 1024 * 1024;
const MAX_HERO_SLIDE_IMAGE_FILE_BYTES = 2 * 1024 * 1024;
const MAX_CONTENT_IMAGE_FILE_BYTES = MAX_COMPETITION_LEGACY_IMAGE_BYTES;
const DEFAULT_COMPETITION_LEGACY_IMAGE = "/theme-hero-1.jpg";
const DEFAULT_FOOTER_BRAND_IMAGE = "/footer-brand-demo.jpg";
const DEFAULT_HEADER_BRAND_IMAGE = "/header-brand-demo.jpg";

function formatFileSize(bytes: number) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }

  return `${Math.ceil(bytes / 1024)}KB`;
}

function readImageFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Unable to read image file."));
    };
    reader.onerror = () => reject(reader.error ?? new Error("Unable to read image file."));
    reader.readAsDataURL(file);
  });
}

function clonePageContent(content: SitePageContent): SitePageContent {
  return JSON.parse(JSON.stringify(content)) as SitePageContent;
}

function updateDraftContent(
  current: SitePageContent,
  recipe: (draft: SitePageContent) => void,
) {
  const next = clonePageContent(current);
  recipe(next);
  return next;
}

function createBlankLocalizedText(): LocalizedText {
  return { en: "", vi: "" };
}

function createRichRulesFallback(specificRules: LocalizedText[]): LocalizedText {
  return {
    en: specificRules.map((item) => item.en).join("\n"),
    vi: specificRules.map((item) => item.vi).join("\n"),
  };
}

function createTestimonialDraft(index: number): TestimonialItem {
  return {
    id: `testimonial-${Date.now()}-${index}`,
    name: "",
    competitionRole: createBlankLocalizedText(),
    university: "",
    currentEmployment: createBlankLocalizedText(),
    avatarImageSrc: "",
    quote: createBlankLocalizedText(),
  };
}

function cloneSponsors(sponsors: SponsorProfile[]): SponsorProfile[] {
  return JSON.parse(JSON.stringify(sponsors)) as SponsorProfile[];
}

function cloneTimelineItems(items: TimelineItem[]): TimelineItem[] {
  return JSON.parse(JSON.stringify(items)) as TimelineItem[];
}

function createSponsorDraft(index: number): SponsorProfile {
  return {
    name: `Sponsor ${index + 1}`,
    logoSrc: "",
    hidden: false,
    tier: createBlankLocalizedText(),
    category: createBlankLocalizedText(),
    description: createBlankLocalizedText(),
    contribution: createBlankLocalizedText(),
  };
}

function createFaqDraft(index: number, topicId = ""): FAQItem {
  return {
    topicId,
    question: {
      en: `New FAQ question ${index}`,
      vi: `Câu hỏi FAQ mới ${index}`,
    },
    answer: createBlankLocalizedText(),
  };
}

function createFaqTopicDraft(index: number): FAQTopic {
  return {
    id: `faq-topic-${Date.now()}-${index}`,
    title: {
      en: `FAQ topic ${index}`,
      vi: `Chủ đề FAQ ${index}`,
    },
    description: createBlankLocalizedText(),
  };
}

function createPhoneContactDraft(index: number) {
  return {
    name: "",
    phone: "",
    tel: "",
    responsibility: {
      en: `Phone contact ${index + 1} responsibility`,
      vi: `Phạm vi hỗ trợ đầu mối ${index + 1}`,
    },
  };
}

function createOrganizerGallerySlideDraft(index: number) {
  return {
    year: `${2027 + index}`,
    image: "",
    label: createBlankLocalizedText(),
    title: createBlankLocalizedText(),
    description: createBlankLocalizedText(),
  };
}

function LocalizedFieldEditor({
  label,
  value,
  rows = 3,
  onChange,
}: {
  label: string;
  value: LocalizedText;
  rows?: number;
  onChange: (locale: Locale, nextValue: string) => void;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {(["en", "vi"] as Locale[]).map((locale) => (
        <label key={locale} className="space-y-2">
          <span className="text-sm theme-text-muted">
            {`${label} (${locale.toUpperCase()})`}
          </span>
          <textarea
            rows={rows}
            value={value[locale]}
            onChange={(event) => onChange(locale, event.target.value)}
            className={fieldClassName}
          />
        </label>
      ))}
    </div>
  );
}

function LocalizedRichTextEditor({
  label,
  value,
  onChange,
}: {
  label: string;
  value: LocalizedText;
  onChange: (locale: Locale, nextValue: string) => void;
}) {
  const textAreaRefs = useRef<Record<Locale, HTMLTextAreaElement | null>>({ en: null, vi: null });

  const applyInlineFormat = (language: Locale, before: string, after = before, placeholder = "text") => {
    const textarea = textAreaRefs.current[language];
    const currentValue = value[language] ?? "";
    const start = textarea?.selectionStart ?? currentValue.length;
    const end = textarea?.selectionEnd ?? currentValue.length;
    const selectedText = currentValue.slice(start, end) || placeholder;
    const nextValue = `${currentValue.slice(0, start)}${before}${selectedText}${after}${currentValue.slice(end)}`;
    onChange(language, nextValue);

    window.requestAnimationFrame(() => {
      textarea?.focus();
      textarea?.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    });
  };

  const applyLinePrefix = (language: Locale, prefix: string) => {
    const textarea = textAreaRefs.current[language];
    const currentValue = value[language] ?? "";
    const start = textarea?.selectionStart ?? currentValue.length;
    const lineStart = currentValue.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
    const nextValue = `${currentValue.slice(0, lineStart)}${prefix}${currentValue.slice(lineStart)}`;
    onChange(language, nextValue);

    window.requestAnimationFrame(() => {
      textarea?.focus();
      textarea?.setSelectionRange(start + prefix.length, start + prefix.length);
    });
  };

  const insertLink = (language: Locale) => {
    const textarea = textAreaRefs.current[language];
    const currentValue = value[language] ?? "";
    const start = textarea?.selectionStart ?? currentValue.length;
    const end = textarea?.selectionEnd ?? currentValue.length;
    const selectedText = currentValue.slice(start, end) || "link text";
    const nextValue = `${currentValue.slice(0, start)}[${selectedText}](https://example.com)${currentValue.slice(end)}`;
    onChange(language, nextValue);

    window.requestAnimationFrame(() => {
      textarea?.focus();
      textarea?.setSelectionRange(start + 1, start + 1 + selectedText.length);
    });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {(["en", "vi"] as Locale[]).map((language) => (
        <div key={language} className="space-y-3 rounded-[1.5rem] border theme-border theme-panel-strong px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold theme-text-strong">
              {`${label} (${language.toUpperCase()})`}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[
                { type: "heading", label: language === "en" ? "Heading" : "Tiêu đề", icon: Heading2 },
                { type: "bullet", label: language === "en" ? "Bullet list" : "Danh sách chấm", icon: List },
                { type: "ordered", label: language === "en" ? "Numbered list" : "Danh sách số", icon: ListOrdered },
                { type: "quote", label: language === "en" ? "Quote" : "Trích dẫn", icon: Quote },
                { type: "bold", label: language === "en" ? "Bold" : "In đậm", icon: Bold },
                { type: "italic", label: language === "en" ? "Italic" : "In nghiêng", icon: Italic },
                { type: "link", label: language === "en" ? "Link" : "Liên kết", icon: Link2 },
              ].map((tool) => {
                const Icon = tool.icon;
                return (
                  <button
                    key={tool.label}
                    type="button"
                    title={tool.label}
                    aria-label={tool.label}
                    onClick={() => {
                      if (tool.type === "heading") applyLinePrefix(language, "## ");
                      if (tool.type === "bullet") applyLinePrefix(language, "- ");
                      if (tool.type === "ordered") applyLinePrefix(language, "1. ");
                      if (tool.type === "quote") applyLinePrefix(language, "> ");
                      if (tool.type === "bold") {
                        applyInlineFormat(language, "**", "**", language === "en" ? "bold text" : "chữ đậm");
                      }
                      if (tool.type === "italic") {
                        applyInlineFormat(language, "*", "*", language === "en" ? "italic text" : "chữ nghiêng");
                      }
                      if (tool.type === "link") insertLink(language);
                    }}
                    className="theme-button-secondary inline-flex h-9 w-9 items-center justify-center rounded-full"
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
          </div>
          <textarea
            ref={(node) => {
              textAreaRefs.current[language] = node;
            }}
            rows={8}
            value={value[language]}
            onChange={(event) => onChange(language, event.target.value)}
            className={`${fieldClassName} min-h-[220px] leading-7`}
          />
          <p className="text-xs leading-6 theme-text-soft">
            {language === "en"
              ? "Use toolbar shortcuts for headings, lists, quotes, bold, italic, and links."
              : "Dùng thanh công cụ để tạo tiêu đề, danh sách, trích dẫn, in đậm, in nghiêng và liên kết."}
          </p>
        </div>
      ))}
    </div>
  );
}

function CopySectionEditor({
  title,
  section,
  onChange,
  className,
}: {
  title: string;
  section: {
    eyebrow: LocalizedText;
    title: LocalizedText;
    description: LocalizedText;
  };
  onChange: (field: "eyebrow" | "title" | "description", locale: Locale, value: string) => void;
  className?: string;
}) {
  return (
    <Surface className={cn("space-y-5 px-5 py-5", className)}>
      <div>
        <p className="text-sm font-semibold theme-text-strong">{title}</p>
        <p className="mt-2 text-sm theme-text-soft">
          Edit the visible copy for this section in both English and Vietnamese.
        </p>
      </div>
      <LocalizedFieldEditor
        label="Eyebrow"
        rows={2}
        value={section.eyebrow}
        onChange={(locale, value) => onChange("eyebrow", locale, value)}
      />
      <LocalizedFieldEditor
        label="Title"
        rows={3}
        value={section.title}
        onChange={(locale, value) => onChange("title", locale, value)}
      />
      <LocalizedFieldEditor
        label="Description"
        rows={5}
        value={section.description}
        onChange={(locale, value) => onChange("description", locale, value)}
      />
    </Surface>
  );
}

function BlockIntro({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-sm font-semibold theme-text-strong">{title}</p>
      <p className="mt-2 text-sm leading-7 theme-text-soft">{description}</p>
    </div>
  );
}

function LocalizedListBlockEditor({
  title,
  description,
  items,
  itemLabelPrefix,
  rows = 3,
  onChange,
  onAdd,
  addLabel,
  onRemove,
  removeLabel,
  minItems = 0,
}: {
  title: string;
  description: string;
  items: LocalizedText[];
  itemLabelPrefix: string;
  rows?: number;
  onChange: (index: number, language: Locale, value: string) => void;
  onAdd?: () => void;
  addLabel?: string;
  onRemove?: (index: number) => void;
  removeLabel?: string;
  minItems?: number;
}) {
  return (
    <Surface className="space-y-5 px-5 py-5 md:px-6 md:py-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <BlockIntro title={title} description={description} />
        {onAdd ? (
          <button
            type="button"
            onClick={onAdd}
            className="theme-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
          >
            <Plus className="h-4 w-4" />
            {addLabel}
          </button>
        ) : null}
      </div>

      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={`${itemLabelPrefix}-${index}`} className="rounded-[1.5rem] border theme-border px-4 py-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold theme-text-strong">
                {itemLabelPrefix} {index + 1}
              </p>
              {onRemove ? (
                <button
                  type="button"
                  disabled={items.length <= minItems}
                  onClick={() => onRemove(index)}
                  className="theme-button-danger inline-flex h-10 w-10 items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label={removeLabel}
                  title={removeLabel}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              ) : null}
            </div>
            <LocalizedFieldEditor
              label={`${itemLabelPrefix} ${index + 1}`}
              rows={rows}
              value={item}
              onChange={(language, value) => onChange(index, language, value)}
            />
          </div>
        ))}
      </div>
    </Surface>
  );
}

function iconForPage(pageId: ContentPageId) {
  switch (pageId) {
    case "home":
      return Sparkles;
    case "construction":
      return Clock3;
    case "competition":
      return Trophy;
    case "faq":
      return CircleHelp;
    case "rules":
      return ShieldCheck;
    case "timeline":
      return Clock3;
    case "round-1-results":
      return Trophy;
    case "finalists":
      return Trophy;
    case "emerging-results":
      return Sprout;
    case "final-results":
      return Medal;
    case "news":
      return Newspaper;
    case "forum":
      return MessageSquare;
    case "sponsors":
      return LayoutDashboard;
    case "judges":
      return Users2;
    case "auth":
      return FileText;
    case "workspace":
      return Users2;
    case "organizer":
      return LayoutDashboard;
    case "contact":
      return Mail;
    case "footer":
      return LayoutDashboard;
  }
}

function iconForType(typeId: ContentTypeId) {
  switch (typeId) {
    case "hero-slides":
      return ImageIcon;
    case "home-testimonials":
      return Quote;
    case "auth-notes":
      return FileText;
    case "workspace-states":
      return LayoutDashboard;
  }
}

const contentPageMap = Object.fromEntries(
  contentPageConfigs.map((item) => [item.id, item]),
) as Record<ContentPageId, (typeof contentPageConfigs)[number]>;

const contentTypeMap = Object.fromEntries(
  contentTypeConfigs.map((item) => [item.id, item]),
) as Record<ContentTypeId, (typeof contentTypeConfigs)[number]>;

type ContentTreeChild =
  | { kind: "page"; id: ContentPageId }
  | { kind: "type"; id: ContentTypeId };

const contentPageTree: Array<{
  id: ContentPageId;
  children?: ContentTreeChild[];
}> = [
  {
    id: "home",
    children: [
      { kind: "type", id: "hero-slides" },
      { kind: "type", id: "home-testimonials" },
    ],
  },
  { id: "construction" },
  {
    id: "competition",
    children: [
      { kind: "page", id: "rules" },
      { kind: "page", id: "timeline" },
      { kind: "page", id: "round-1-results" },
      { kind: "page", id: "faq" },
      { kind: "page", id: "sponsors" },
      { kind: "page", id: "judges" },
      { kind: "page", id: "finalists" },
      { kind: "page", id: "emerging-results" },
      { kind: "page", id: "final-results" },
    ],
  },
  { id: "news" },
  { id: "forum" },
  {
    id: "auth",
    children: [{ kind: "type", id: "auth-notes" }],
  },
  {
    id: "workspace",
    children: [{ kind: "type", id: "workspace-states" }],
  },
  { id: "organizer" },
  { id: "contact" },
  { id: "footer" },
];

function getContentPageLabel(locale: Locale, pageId: ContentPageId) {
  return pickText(locale, contentPageMap[pageId].label);
}

function getContentPageDescription(locale: Locale, pageId: ContentPageId) {
  return pickText(locale, contentPageMap[pageId].description);
}

function LocalizedTextEditorCard({
  title,
  value,
  rows = 2,
  onChange,
}: {
  title: string;
  value: LocalizedText;
  rows?: number;
  onChange: (locale: Locale, value: string) => void;
}) {
  return (
    <Surface className="space-y-4 px-4 py-4">
      <p className="text-sm font-semibold theme-text-strong">{title}</p>
      <LocalizedFieldEditor label={title} rows={rows} value={value} onChange={onChange} />
    </Surface>
  );
}

function EditorTopBar({
  eyebrow,
  title,
  description,
  isDirty,
  onReset,
  onSave,
}: {
  eyebrow: string;
  title: string;
  description: string;
  isDirty: boolean;
  onReset: () => void;
  onSave: () => void;
}) {
  const { locale } = useSiteState();

  return (
    <div className="space-y-5">
      <Link
        href="/admin/content"
        className="inline-flex items-center gap-2 text-sm font-semibold theme-accent"
      >
        <ArrowLeft className="h-4 w-4" />
        {locale === "en" ? "Back to content hub" : "Quay lại trung tâm nội dung"}
      </Link>

      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <SectionHeading
          id={ADMIN_TITLE_ID}
          className="scroll-mt-32"
          eyebrow={eyebrow}
          title={title}
          description={description}
        />
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onReset}
            className="rounded-full border theme-border theme-panel px-5 py-3 text-sm font-semibold theme-text-strong"
          >
            {locale === "en" ? "Reset draft" : "Đặt lại bản nháp"}
          </button>
          <button
            type="button"
            disabled={!isDirty}
            onClick={onSave}
            className="theme-button-primary rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {locale === "en" ? "Save changes" : "Lưu thay đổi"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ContentIndexSection() {
  const { locale } = useSiteState();
  useAdminTitleScroll();

  return (
    <div className="space-y-8">
      <section className="space-y-5">
        <p
          id={ADMIN_TITLE_ID}
          className="scroll-mt-32 theme-heading text-2xl font-semibold uppercase tracking-[0.16em] theme-text-strong md:text-[1.75rem]"
        >
          {locale === "en" ? "Pages" : "Trang"}
        </p>
        <Surface className="space-y-4 px-5 py-5 md:px-6">
          {contentPageTree.map((entry) => {
            const item = contentPageMap[entry.id];
            const Icon = iconForPage(item.id);

            return (
              <div key={entry.id} className="space-y-3">
                <Link href={item.href}>
                  <div className="group flex items-start gap-4 rounded-[1.4rem] px-3 py-3 transition hover:bg-[rgba(23,114,208,0.06)]">
                    <div className="theme-brand-gradient flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-[0_16px_34px_rgba(23,114,208,0.18)]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="theme-heading text-xl font-semibold theme-text-strong">
                        {getContentPageLabel(locale, item.id)}
                      </p>
                      <p className="mt-1 text-sm leading-7 theme-text-muted">
                        {getContentPageDescription(locale, item.id)}
                      </p>
                    </div>
                  </div>
                </Link>

                {entry.children ? (
                  <div className="ml-[1.4rem] space-y-2 border-l theme-border pl-5">
                    {entry.children.map((childEntry) => {
                      const child =
                        childEntry.kind === "page"
                          ? contentPageMap[childEntry.id]
                          : contentTypeMap[childEntry.id];
                      const ChildIcon =
                        childEntry.kind === "page"
                          ? iconForPage(childEntry.id)
                          : iconForType(childEntry.id);

                      return (
                        <Link key={child.id} href={child.href}>
                          <div className="group flex items-start gap-3 rounded-[1.2rem] px-3 py-3 transition hover:bg-[rgba(23,114,208,0.05)]">
                            <div className="theme-panel-strong flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border theme-border text-[var(--brand)]">
                              <ChildIcon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-base font-semibold theme-text-strong">
                                  {childEntry.kind === "page"
                                    ? getContentPageLabel(locale, childEntry.id)
                                    : pickText(locale, child.label)}
                                </p>
                                {childEntry.kind === "type" ? (
                                  <span className="rounded-full border theme-border bg-white/70 px-2.5 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.18em] theme-text-soft dark:bg-white/8">
                                    {locale === "en" ? "Content" : "Nội dung"}
                                  </span>
                                ) : null}
                              </div>
                              <p className="mt-1 text-sm leading-6 theme-text-soft">
                                {childEntry.kind === "page"
                                  ? getContentPageDescription(locale, childEntry.id)
                                  : pickText(locale, child.description)}
                              </p>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </Surface>
      </section>

      <section className="space-y-5">
        <p className="scroll-mt-32 theme-heading text-2xl font-semibold uppercase tracking-[0.16em] theme-text-strong md:text-[1.75rem]">
          {locale === "en" ? "Types" : "Nhóm nội dung"}
        </p>
        <Surface className="space-y-3 px-5 py-5 md:px-6">
          {contentTypeConfigs.map((item) => {
            const Icon = iconForType(item.id);

            return (
              <Link key={item.id} href={item.href}>
                <div className="group flex items-start gap-3 rounded-[1.2rem] px-3 py-3 transition hover:bg-[rgba(23,114,208,0.05)]">
                  <div className="theme-panel-strong flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border theme-border text-[var(--brand)]">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-base font-semibold theme-text-strong">
                      {pickText(locale, item.label)}
                    </p>
                    <p className="mt-1 text-sm leading-6 theme-text-soft">
                      {pickText(locale, item.description)}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </Surface>
      </section>

      <section className="space-y-5">
        <p className="scroll-mt-32 theme-heading text-2xl font-semibold uppercase tracking-[0.16em] theme-text-strong md:text-[1.75rem]">
          {locale === "en" ? "Sponsors" : "Nhà tài trợ"}
        </p>
        <Surface className="space-y-3 px-5 py-5 md:px-6">
          <Link href="/admin/content/sponsors">
            <div className="group flex items-start gap-4 rounded-[1.4rem] px-3 py-3 transition hover:bg-[rgba(23,114,208,0.06)]">
              <div className="theme-brand-gradient flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-[0_16px_34px_rgba(23,114,208,0.18)]">
                <BriefcaseBusiness className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="theme-heading text-xl font-semibold theme-text-strong">
                  {locale === "en" ? "Sponsor records" : "Danh sách nhà tài trợ"}
                </p>
                <p className="mt-1 text-sm leading-7 theme-text-muted">
                  {locale === "en"
                    ? "Add, edit, or remove sponsor cards used by the sponsor page and homepage sponsor strip."
                    : "Thêm, sửa hoặc xóa các thẻ nhà tài trợ dùng cho trang nhà tài trợ và dải logo trên trang chủ."}
                </p>
              </div>
            </div>
          </Link>
        </Surface>
      </section>

      <section className="space-y-5">
        <p className="scroll-mt-32 theme-heading text-2xl font-semibold uppercase tracking-[0.16em] theme-text-strong md:text-[1.75rem]">
          {locale === "en" ? "Header" : "Header"}
        </p>
        <Surface className="space-y-3 px-5 py-5 md:px-6">
          <Link href="/admin/content/header">
            <div className="group flex items-start gap-4 rounded-[1.4rem] px-3 py-3 transition hover:bg-[rgba(23,114,208,0.06)]">
              <div className="theme-brand-gradient flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-[0_16px_34px_rgba(23,114,208,0.18)]">
                <Mail className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="theme-heading text-xl font-semibold theme-text-strong">
                  {locale === "en" ? "Top header" : "Header phía trên"}
                </p>
                <p className="mt-1 text-sm leading-7 theme-text-muted">
                  {locale === "en"
                    ? "Edit the competition slogan, contact email, phone number, and Facebook link used in the top bar."
                    : "Chỉnh sửa slogan cuộc thi, email liên hệ, số điện thoại và liên kết Facebook dùng ở thanh phía trên."}
                </p>
              </div>
            </div>
          </Link>
        </Surface>
      </section>
    </div>
  );
}

export function ContentHeaderEditor() {
  const { locale, pageContent, savePageContent } = useSiteState();
  useAdminTitleScroll();
  const [draft, setDraft] = useState<SitePageContent>(() => clonePageContent(pageContent));
  const [headerBrandImageUploadError, setHeaderBrandImageUploadError] = useState("");
  const [uploadingHeaderBrandLogoTarget, setUploadingHeaderBrandLogoTarget] = useState<"light" | "dark" | null>(null);

  useEffect(() => {
    setDraft(clonePageContent(pageContent));
  }, [pageContent]);

  const isDirty = useMemo(
    () => JSON.stringify(draft.siteHeader) !== JSON.stringify(pageContent.siteHeader),
    [draft.siteHeader, pageContent.siteHeader],
  );
  const headerBrandLightImage =
    draft.siteHeader.brandLogoLightImage || draft.siteHeader.brandLogoImage || DEFAULT_HEADER_BRAND_IMAGE;
  const headerBrandDarkImage =
    draft.siteHeader.brandLogoDarkImage || draft.siteHeader.brandLogoImage || headerBrandLightImage;
  const uploadHeaderBrandLogo = async (file: File, target: "light" | "dark") => {
    const validationError = getHeaderBrandImageValidationError(file);
    if (validationError === "type") {
      setHeaderBrandImageUploadError(
        locale === "en"
          ? "Only JPG images are allowed for the header logo."
          : "Chỉ chấp nhận ảnh JPG cho logo header.",
      );
      return;
    }

    if (validationError === "size") {
      setHeaderBrandImageUploadError(
        locale === "en"
          ? `Header logo JPG images must be ${formatFileSize(MAX_HEADER_BRAND_IMAGE_BYTES)} or smaller.`
          : `Ảnh logo header phải có dung lượng ${formatFileSize(MAX_HEADER_BRAND_IMAGE_BYTES)} trở xuống.`,
      );
      return;
    }

    const formData = new FormData();
    formData.append("imageFile", file);
    setHeaderBrandImageUploadError("");
    setUploadingHeaderBrandLogoTarget(target);

    try {
      const response = await fetch("/api/admin/content/header/brand-image", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json().catch(() => null)) as
        | { imageUrl?: string; error?: string }
        | null;

      if (!response.ok || !payload?.imageUrl) {
        throw new Error(
          payload?.error ||
            (locale === "en"
              ? "The header logo could not be uploaded."
              : "Không thể tải logo header."),
        );
      }

      setDraft((current) =>
        updateDraftContent(current, (next) => {
          if (target === "light") {
            next.siteHeader.brandLogoLightImage = payload.imageUrl!;
            next.siteHeader.brandLogoImage = payload.imageUrl!;
            return;
          }

          next.siteHeader.brandLogoDarkImage = payload.imageUrl!;
        }),
      );
    } catch (error) {
      setHeaderBrandImageUploadError(
        error instanceof Error
          ? error.message
          : locale === "en"
            ? "The header logo could not be uploaded."
            : "Không thể tải logo header.",
      );
    } finally {
      setUploadingHeaderBrandLogoTarget(null);
    }
  };

  return (
    <div className="space-y-8">
      <EditorTopBar
        eyebrow={locale === "en" ? "Admin / Content / Header" : "Admin / Nội dung / Header"}
        title={locale === "en" ? "Top header" : "Header phía trên"}
        description={
          locale === "en"
            ? "Edit the slogan and contact points shown in the top bar across the site."
            : "Chỉnh sửa slogan và các đầu mối liên hệ hiển thị ở thanh trên cùng của toàn bộ website."
        }
        isDirty={isDirty}
        onReset={() => setDraft(clonePageContent(pageContent))}
        onSave={() => {
          void savePageContent(draft, "site-header");
        }}
      />

      <Surface className="space-y-5 px-5 py-5 md:px-6 md:py-6">
        <BlockIntro
          title={locale === "en" ? "Main menu logo" : "Logo menu chính"}
          description={
            locale === "en"
              ? "Upload the image logo shown at the left of the main menu. Keep a wide logo ratio to match the current header box."
              : "Tải ảnh logo hiển thị bên trái menu chính. Nên dùng tỷ lệ ngang để khớp với khung header hiện tại."
          }
        />

        <div className="grid gap-5 xl:grid-cols-2">
          {([
            {
              target: "light" as const,
              title: locale === "en" ? "Light theme logo" : "Logo giao diện sáng",
              description:
                locale === "en"
                  ? "Shown when visitors use light mode."
                  : "Hiển thị khi người dùng dùng giao diện sáng.",
              value: headerBrandLightImage,
            },
            {
              target: "dark" as const,
              title: locale === "en" ? "Dark theme logo" : "Logo giao diện tối",
              description:
                locale === "en"
                  ? "Shown when visitors use dark mode."
                  : "Hiển thị khi người dùng dùng giao diện tối.",
              value: headerBrandDarkImage,
            },
          ]).map((logoConfig) => (
            <div key={logoConfig.target} className="space-y-4 rounded-[1.6rem] border theme-border theme-panel-subtle px-4 py-4">
              <div>
                <p className="text-sm font-semibold theme-text-strong">{logoConfig.title}</p>
                <p className="mt-1 text-xs leading-5 theme-text-soft">{logoConfig.description}</p>
              </div>

              <div
                className={cn(
                  "rounded-[1.35rem] border theme-border px-4 py-4",
                  logoConfig.target === "light" ? "bg-white" : "bg-slate-950",
                )}
              >
                <div className="relative h-[3.9rem] w-[16.5rem] max-w-full overflow-hidden rounded-[1.15rem]">
                  <Image
                    src={logoConfig.value}
                    alt="Attacker 2026"
                    fill
                    sizes="264px"
                    unoptimized={logoConfig.value.startsWith("/api/content-images/")}
                    className="object-cover"
                  />
                </div>
              </div>

              <label className="space-y-2">
                <span className="text-sm theme-text-muted">
                  {locale === "en" ? "Logo image source" : "Nguồn ảnh logo"}
                </span>
                <input
                  value={logoConfig.value}
                  onChange={(event) =>
                    setDraft((current) =>
                      updateDraftContent(current, (next) => {
                        if (logoConfig.target === "light") {
                          next.siteHeader.brandLogoLightImage = event.target.value;
                          next.siteHeader.brandLogoImage = event.target.value;
                          return;
                        }

                        next.siteHeader.brandLogoDarkImage = event.target.value;
                      }),
                    )
                  }
                  className={fieldClassName}
                />
              </label>

              <div className="flex flex-wrap gap-2">
                <label className="theme-button-primary inline-flex cursor-pointer items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold">
                  <Upload className="h-4 w-4" />
                  {uploadingHeaderBrandLogoTarget === logoConfig.target
                    ? locale === "en"
                      ? "Uploading..."
                      : "Đang tải..."
                    : locale === "en"
                      ? "Upload logo"
                      : "Tải logo"}
                  <input
                    type="file"
                    accept="image/jpeg,.jpg,.jpeg"
                    className="hidden"
                    disabled={Boolean(uploadingHeaderBrandLogoTarget)}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => {
                      const file = event.target.files?.[0];
                      event.target.value = "";
                      if (!file) {
                        return;
                      }

                      void uploadHeaderBrandLogo(file, logoConfig.target);
                    }}
                  />
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setHeaderBrandImageUploadError("");
                    setDraft((current) =>
                      updateDraftContent(current, (next) => {
                        if (logoConfig.target === "light") {
                          next.siteHeader.brandLogoLightImage = DEFAULT_HEADER_BRAND_IMAGE;
                          next.siteHeader.brandLogoImage = DEFAULT_HEADER_BRAND_IMAGE;
                          return;
                        }

                        next.siteHeader.brandLogoDarkImage = DEFAULT_HEADER_BRAND_IMAGE;
                      }),
                    );
                  }}
                  className="theme-button-secondary inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold"
                >
                  <Trash2 className="h-4 w-4" />
                  {locale === "en" ? "Use demo" : "Dùng ảnh demo"}
                </button>
              </div>
            </div>
          ))}

            <p className="text-xs leading-6 theme-text-soft xl:col-span-2">
              {locale === "en"
                ? `Accepted format: JPG only. Maximum size: ${formatFileSize(MAX_HEADER_BRAND_IMAGE_BYTES)}. After uploading, click Save changes to publish the new logo.`
                : `Chỉ chấp nhận JPG. Dung lượng tối đa: ${formatFileSize(MAX_HEADER_BRAND_IMAGE_BYTES)}. Sau khi tải ảnh, bấm Lưu thay đổi để cập nhật logo.`}
            </p>

            {headerBrandImageUploadError ? (
              <div className="rounded-[1.2rem] border border-rose-300/55 bg-rose-50/82 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-200/20 dark:bg-rose-300/10 dark:text-rose-100 xl:col-span-2">
                {headerBrandImageUploadError}
              </div>
            ) : null}
        </div>
      </Surface>

      <Surface className="space-y-5 px-5 py-5 md:px-6 md:py-6">
        <BlockIntro
          title={locale === "en" ? "Top header content" : "Nội dung header trên cùng"}
          description={
            locale === "en"
              ? "These fields control the slogan and quick contact line shown above the main navigation."
              : "Các trường này điều khiển slogan và dải liên hệ nhanh hiển thị phía trên thanh điều hướng chính."
          }
        />

        <LocalizedFieldEditor
          label={locale === "en" ? "Competition slogan" : "Slogan cuộc thi"}
          rows={2}
          value={draft.siteHeader.slogan}
          onChange={(language, value) =>
            setDraft((current) =>
              updateDraftContent(current, (next) => {
                next.siteHeader.slogan[language] = value;
              }),
            )
          }
        />

        <div className="grid gap-4 lg:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm theme-text-muted">
              {locale === "en" ? "Contact email" : "Email liên hệ"}
            </span>
            <input
              value={draft.siteHeader.email}
              onChange={(event) =>
                setDraft((current) =>
                  updateDraftContent(current, (next) => {
                    next.siteHeader.email = event.target.value;
                  }),
                )
              }
              className={fieldClassName}
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm theme-text-muted">
              {locale === "en" ? "Phone number" : "Số điện thoại"}
            </span>
            <input
              value={draft.siteHeader.phone}
              onChange={(event) =>
                setDraft((current) =>
                  updateDraftContent(current, (next) => {
                    next.siteHeader.phone = event.target.value;
                  }),
                )
              }
              className={fieldClassName}
            />
          </label>
        </div>

        <LocalizedFieldEditor
          label={locale === "en" ? "Facebook label" : "Nhãn Facebook"}
          rows={2}
          value={draft.siteHeader.facebookLabel}
          onChange={(language, value) =>
            setDraft((current) =>
              updateDraftContent(current, (next) => {
                next.siteHeader.facebookLabel[language] = value;
              }),
            )
          }
        />

        <label className="space-y-2">
          <span className="text-sm theme-text-muted">
            {locale === "en" ? "Facebook link" : "Liên kết Facebook"}
          </span>
          <input
            value={draft.siteHeader.facebookUrl}
            onChange={(event) =>
              setDraft((current) =>
                updateDraftContent(current, (next) => {
                  next.siteHeader.facebookUrl = event.target.value;
                }),
              )
            }
            className={fieldClassName}
          />
        </label>
      </Surface>
    </div>
  );
}

export function ContentPageEditor({ pageId }: { pageId: ContentPageId }) {
  const { locale, pageContent, savePageContent, timelineItems, updateTimelineItemsByAdmin } = useSiteState();
  useAdminTitleScroll();
  const [draft, setDraft] = useState<SitePageContent>(() => clonePageContent(pageContent));
  const [timelineDraft, setTimelineDraft] = useState<TimelineItem[]>(() => cloneTimelineItems(timelineItems));
  const [faqEditorTab, setFaqEditorTab] = useState<"questions" | "topics" | "page">("questions");
  const [expandedFaqItems, setExpandedFaqItems] = useState<Set<string>>(() => new Set());
  const [faqSaveMessage, setFaqSaveMessage] = useState<{ key: string; text: string } | null>(null);
  const [competitionHeroImageUploadError, setCompetitionHeroImageUploadError] = useState("");
  const [isUploadingCompetitionHeroImage, setIsUploadingCompetitionHeroImage] = useState(false);
  const [footerBrandImageUploadError, setFooterBrandImageUploadError] = useState("");
  const [isUploadingFooterBrandImage, setIsUploadingFooterBrandImage] = useState(false);
  const [pendingFaqDelete, setPendingFaqDelete] = useState<{
    type: "topic" | "question";
    index: number;
    label: string;
  } | null>(null);

  useEffect(() => {
    setDraft(clonePageContent(pageContent));
  }, [pageContent]);

  useEffect(() => {
    setTimelineDraft(cloneTimelineItems(timelineItems));
  }, [timelineItems]);

  const pageContentDirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(pageContent),
    [draft, pageContent],
  );
  const timelineDirty = useMemo(
    () => pageId === "timeline" && JSON.stringify(timelineDraft) !== JSON.stringify(timelineItems),
    [pageId, timelineDraft, timelineItems],
  );
  const isDirty = pageContentDirty || timelineDirty;

  const faqTopics = draft.rules.faqTopics;
  const firstFaqTopicId = faqTopics[0]?.id ?? "";
  const pickFaqTopicTitle = (topicId: string) => {
    const topic = faqTopics.find((item) => item.id === topicId) ?? faqTopics[0];
    return topic ? pickText(locale, topic.title) : locale === "en" ? "No topic" : "Chưa có chủ đề";
  };
  const toggleFaqItem = (key: string) => {
    setExpandedFaqItems((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };
  const saveFaqBlock = async (messageKey: string, message: string) => {
    const saved = await savePageContent(draft, `page:${pageId}`);
    if (saved) {
      setFaqSaveMessage({ key: messageKey, text: message });
    }
  };
  const confirmFaqDelete = () => {
    const target = pendingFaqDelete;
    if (!target) {
      return;
    }

    setDraft((current) =>
      updateDraftContent(current, (next) => {
        if (target.type === "topic") {
          const deletedTopic = next.rules.faqTopics[target.index];
          if (!deletedTopic || next.rules.faqTopics.length <= 1) {
            return;
          }

          const fallbackTopicId =
            next.rules.faqTopics.find((item) => item.id !== deletedTopic.id)?.id ?? "";
          next.rules.faqTopics = next.rules.faqTopics.filter((item) => item.id !== deletedTopic.id);
          next.rules.faqItems = next.rules.faqItems.map((item) =>
            item.topicId === deletedTopic.id ? { ...item, topicId: fallbackTopicId } : item,
          );
          return;
        }

        next.rules.faqItems = next.rules.faqItems.filter((_, currentIndex) => currentIndex !== target.index);
      }),
    );
    setFaqSaveMessage(null);
    setPendingFaqDelete(null);
  };
  const resetDrafts = () => {
    setDraft(clonePageContent(pageContent));
    setTimelineDraft(cloneTimelineItems(timelineItems));
  };
  const saveDrafts = async () => {
    const savedContent = pageContentDirty ? await savePageContent(draft, `page:${pageId}`) : true;
    if (!savedContent) {
      return;
    }

    if (!timelineDirty) {
      return;
    }

    const response = await fetch("/api/admin/timeline", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
      body: JSON.stringify({ timelineItems: timelineDraft }),
    });

    if (response.ok) {
      updateTimelineItemsByAdmin(cloneTimelineItems(timelineDraft));
    }
  };
  const updateTimelineItemText = (
    itemId: string,
    field: "title" | "description" | "location" | "method",
    language: Locale,
    value: string,
  ) => {
    setTimelineDraft((current) =>
      current.map((item) =>
        item.id === itemId
          ? {
              ...item,
              [field]: {
                ...item[field],
                [language]: value,
              },
            }
          : item,
      ),
    );
  };
  const updateTimelineSupportLinkLabel = (
    itemId: string,
    linkIndex: number,
    language: Locale,
    value: string,
  ) => {
    setTimelineDraft((current) =>
      current.map((item) =>
        item.id === itemId
          ? {
              ...item,
              supportLinks: (item.supportLinks ?? []).map((link, currentIndex) =>
                currentIndex === linkIndex
                  ? {
                      ...link,
                      label: {
                        ...link.label,
                        [language]: value,
                      },
                    }
                  : link,
              ),
            }
          : item,
      ),
    );
  };
  const competitionLegacyHeroImage =
    draft.competition.legacyHeroImage || draft.organizer.heroImage || DEFAULT_COMPETITION_LEGACY_IMAGE;
  const footerBrandImage = draft.footer.brandLogoImage || DEFAULT_FOOTER_BRAND_IMAGE;

  return (
    <div className="space-y-8">
      <EditorTopBar
        eyebrow={locale === "en" ? "Admin / Content / Page" : "Admin / Nội dung / Trang"}
        title={getContentPageLabel(locale, pageId)}
        description={getContentPageDescription(locale, pageId)}
        isDirty={isDirty}
        onReset={resetDrafts}
        onSave={() => {
          void saveDrafts();
        }}
      />

      <div className="grid gap-4 xl:grid-cols-1">
        {pageId === "home" ? (
          <>
            <Surface className="space-y-5 px-5 py-5 md:px-6 md:py-6">
              <BlockIntro
                title="Home / Metrics"
                description="These four cards appear directly below the homepage slider."
              />
              <div className="space-y-4">
                {draft.home.metrics.map((metric, index) => (
                  <div key={`home-metric-${index}`} className="rounded-[1.5rem] border theme-border px-4 py-4">
                    <div className="grid gap-4 md:grid-cols-[180px_minmax(0,1fr)]">
                      <label className="space-y-2">
                        <span className="text-sm theme-text-muted">Value</span>
                        <input
                          value={metric.value}
                          onChange={(event) =>
                            setDraft((current) =>
                              updateDraftContent(current, (next) => {
                                next.home.metrics[index].value = event.target.value;
                              }),
                            )
                          }
                          className={fieldClassName}
                        />
                      </label>
                      <LocalizedFieldEditor
                        label={`Metric ${index + 1} label`}
                        rows={2}
                        value={metric.label}
                        onChange={(language, value) =>
                          setDraft((current) =>
                            updateDraftContent(current, (next) => {
                              next.home.metrics[index].label[language] = value;
                            }),
                          )
                        }
                      />
                    </div>
                    <div className="mt-4">
                      <LocalizedFieldEditor
                        label={`Metric ${index + 1} note`}
                        rows={3}
                        value={metric.note}
                        onChange={(language, value) =>
                          setDraft((current) =>
                            updateDraftContent(current, (next) => {
                              next.home.metrics[index].note[language] = value;
                            }),
                          )
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Surface>

            <CopySectionEditor
              title="Home / Rewards heading"
              section={draft.home.rewards}
              onChange={(field, language, value) =>
                setDraft((current) =>
                  updateDraftContent(current, (next) => {
                    next.home.rewards[field][language] = value;
                  }),
                )
              }
            />

            <Surface className="space-y-5 px-5 py-5 md:px-6 md:py-6">
              <BlockIntro
                title="Home / Reward cards"
                description="These four cards are the main prize breakdown in the homepage rewards block."
              />
              <div className="space-y-4">
                {draft.home.rewardCards.map((reward, index) => (
                  <div key={`home-reward-${index}`} className="rounded-[1.5rem] border theme-border px-4 py-4">
                    <p className="mb-4 text-sm font-semibold theme-text-strong">Reward card {index + 1}</p>
                    <div className="space-y-4">
                      <LocalizedFieldEditor
                        label="Rank"
                        rows={2}
                        value={reward.rank}
                        onChange={(language, value) =>
                          setDraft((current) =>
                            updateDraftContent(current, (next) => {
                              next.home.rewardCards[index].rank[language] = value;
                            }),
                          )
                        }
                      />
                      <LocalizedFieldEditor
                        label="Title"
                        rows={2}
                        value={reward.title}
                        onChange={(language, value) =>
                          setDraft((current) =>
                            updateDraftContent(current, (next) => {
                              next.home.rewardCards[index].title[language] = value;
                            }),
                          )
                        }
                      />
                      <LocalizedFieldEditor
                        label="Amount"
                        rows={2}
                        value={reward.amount}
                        onChange={(language, value) =>
                          setDraft((current) =>
                            updateDraftContent(current, (next) => {
                              next.home.rewardCards[index].amount[language] = value;
                            }),
                          )
                        }
                      />
                      <LocalizedFieldEditor
                        label="Note"
                        rows={4}
                        value={reward.note}
                        onChange={(language, value) =>
                          setDraft((current) =>
                            updateDraftContent(current, (next) => {
                              next.home.rewardCards[index].note[language] = value;
                            }),
                          )
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Surface>

            <Surface className="space-y-5 px-5 py-5 md:px-6 md:py-6">
              <BlockIntro
                title="Home / Emerging team spotlight"
                description="This smaller highlight card appears on the right side of the rewards block."
              />
              <LocalizedFieldEditor
                label="Eyebrow"
                rows={2}
                value={draft.home.emergingReward.eyebrow}
                onChange={(language, value) =>
                  setDraft((current) =>
                    updateDraftContent(current, (next) => {
                      next.home.emergingReward.eyebrow[language] = value;
                    }),
                  )
                }
              />
              <LocalizedFieldEditor
                label="Title"
                rows={2}
                value={draft.home.emergingReward.title}
                onChange={(language, value) =>
                  setDraft((current) =>
                    updateDraftContent(current, (next) => {
                      next.home.emergingReward.title[language] = value;
                    }),
                  )
                }
              />
              <LocalizedFieldEditor
                label="Amount"
                rows={2}
                value={draft.home.emergingReward.amount}
                onChange={(language, value) =>
                  setDraft((current) =>
                    updateDraftContent(current, (next) => {
                      next.home.emergingReward.amount[language] = value;
                    }),
                  )
                }
              />
              <LocalizedFieldEditor
                label="Note"
                rows={4}
                value={draft.home.emergingReward.note}
                onChange={(language, value) =>
                  setDraft((current) =>
                    updateDraftContent(current, (next) => {
                      next.home.emergingReward.note[language] = value;
                    }),
                  )
                }
              />
            </Surface>

            <Surface className="space-y-5 px-5 py-5 md:px-6 md:py-6">
              <BlockIntro
                title="Home / Competition path"
                description="This is the smaller roadmap card in the rewards block, including the CTA label."
              />
              <LocalizedFieldEditor
                label="Eyebrow"
                rows={2}
                value={draft.home.competitionPath.eyebrow}
                onChange={(language, value) =>
                  setDraft((current) =>
                    updateDraftContent(current, (next) => {
                      next.home.competitionPath.eyebrow[language] = value;
                    }),
                  )
                }
              />
              <LocalizedListBlockEditor
                title="Path items"
                description="These three lines appear inside the competition path card."
                items={draft.home.competitionPath.items}
                itemLabelPrefix="Path item"
                rows={2}
                onChange={(itemIndex, language, value) =>
                  setDraft((current) =>
                    updateDraftContent(current, (next) => {
                      next.home.competitionPath.items[itemIndex][language] = value;
                    }),
                  )
                }
              />
              <LocalizedFieldEditor
                label="Supporting note"
                rows={4}
                value={draft.home.competitionPath.note}
                onChange={(language, value) =>
                  setDraft((current) =>
                    updateDraftContent(current, (next) => {
                      next.home.competitionPath.note[language] = value;
                    }),
                  )
                }
              />
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm theme-text-muted">CTA href</span>
                  <input
                    value={draft.home.competitionPath.ctaHref ?? ""}
                    onChange={(event) =>
                      setDraft((current) =>
                        updateDraftContent(current, (next) => {
                          next.home.competitionPath.ctaHref = event.target.value;
                        }),
                      )
                    }
                    className={fieldClassName}
                  />
                </label>
                <LocalizedFieldEditor
                  label="CTA label"
                  rows={2}
                  value={draft.home.competitionPath.ctaLabel ?? createBlankLocalizedText()}
                  onChange={(language, value) =>
                    setDraft((current) =>
                      updateDraftContent(current, (next) => {
                        const ctaLabel = next.home.competitionPath.ctaLabel ?? createBlankLocalizedText();
                        ctaLabel[language] = value;
                        next.home.competitionPath.ctaLabel = ctaLabel;
                      }),
                    )
                  }
                />
              </div>
            </Surface>

            <Surface className="space-y-5 px-5 py-5 md:px-6 md:py-6">
              <BlockIntro
                title="Home / Sponsors logo strip"
                description="Sponsor logos are managed from Sponsors. This block only edits the visible link label on the homepage."
              />
              <LocalizedFieldEditor
                label="Open sponsors label"
                rows={2}
                value={draft.home.sponsorsStripLinkLabel}
                onChange={(language, value) =>
                  setDraft((current) =>
                    updateDraftContent(current, (next) => {
                      next.home.sponsorsStripLinkLabel[language] = value;
                    }),
                  )
                }
              />
            </Surface>

            <CopySectionEditor
              title="Home / Testimonial section"
              section={draft.home.testimonialsSection}
              onChange={(field, language, value) =>
                setDraft((current) =>
                  updateDraftContent(current, (next) => {
                    next.home.testimonialsSection[field][language] = value;
                  }),
                )
              }
            />

            <Surface className="space-y-5 px-5 py-5 md:px-6 md:py-6">
              <BlockIntro
                title="Home / Testimonial section labels"
                description="These smaller labels appear in the testimonial section header and link."
              />
              <LocalizedFieldEditor
                label="Badge label"
                rows={2}
                value={draft.home.testimonialsBadgeLabel}
                onChange={(language, value) =>
                  setDraft((current) =>
                    updateDraftContent(current, (next) => {
                      next.home.testimonialsBadgeLabel[language] = value;
                    }),
                  )
                }
              />
              <LocalizedFieldEditor
                label="About link label"
                rows={2}
                value={draft.home.testimonialsLinkLabel}
                onChange={(language, value) =>
                  setDraft((current) =>
                    updateDraftContent(current, (next) => {
                      next.home.testimonialsLinkLabel[language] = value;
                    }),
                  )
                }
              />
            </Surface>
          </>
        ) : null}

        {pageId === "construction" ? (
          <>
            <Surface className="space-y-5 px-5 py-5 md:px-6 md:py-6">
              <BlockIntro
                title="Construction page / Countdown"
                description="Edit the full-screen pre-launch countdown page shown before the website announcement timepoint."
              />
              {([
                ["Eyebrow", draft.construction.eyebrow, (language: Locale, value: string, next: SitePageContent) => { next.construction.eyebrow[language] = value; }],
                ["Title", draft.construction.title, (language: Locale, value: string, next: SitePageContent) => { next.construction.title[language] = value; }],
                ["Description", draft.construction.description, (language: Locale, value: string, next: SitePageContent) => { next.construction.description[language] = value; }],
                ["Wait prefix", draft.construction.waitPrefix, (language: Locale, value: string, next: SitePageContent) => { next.construction.waitPrefix[language] = value; }],
                ["Countdown label", draft.construction.countdownLabel, (language: Locale, value: string, next: SitePageContent) => { next.construction.countdownLabel[language] = value; }],
              ] as const).map(([label, value, updater]) => (
                <LocalizedFieldEditor
                  key={`construction-${label}`}
                  label={label}
                  rows={label === "Description" ? 4 : 2}
                  value={value}
                  onChange={(language, nextValue) =>
                    setDraft((current) =>
                      updateDraftContent(current, (next) => {
                        updater(language, nextValue, next);
                      }),
                    )
                  }
                />
              ))}
            </Surface>

            <Surface className="space-y-5 px-5 py-5 md:px-6 md:py-6">
              <BlockIntro
                title="Construction page / Countdown units"
                description="Edit the four labels shown below the countdown numbers."
              />
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {([
                  ["Days", draft.construction.daysLabel, (language: Locale, value: string, next: SitePageContent) => { next.construction.daysLabel[language] = value; }],
                  ["Hours", draft.construction.hoursLabel, (language: Locale, value: string, next: SitePageContent) => { next.construction.hoursLabel[language] = value; }],
                  ["Minutes", draft.construction.minutesLabel, (language: Locale, value: string, next: SitePageContent) => { next.construction.minutesLabel[language] = value; }],
                  ["Seconds", draft.construction.secondsLabel, (language: Locale, value: string, next: SitePageContent) => { next.construction.secondsLabel[language] = value; }],
                ] as const).map(([label, value, updater]) => (
                  <LocalizedFieldEditor
                    key={`construction-unit-${label}`}
                    label={label}
                    rows={2}
                    value={value}
                    onChange={(language, nextValue) =>
                      setDraft((current) =>
                        updateDraftContent(current, (next) => {
                          updater(language, nextValue, next);
                        }),
                      )
                    }
                  />
                ))}
              </div>
            </Surface>

            <Surface className="space-y-5 px-5 py-5 md:px-6 md:py-6">
              <BlockIntro
                title="Construction page / Auth password popup"
                description="Edit the modal text shown when visitors open /auth before the public announcement timepoint."
              />
              {([
                ["Modal title", draft.construction.authGateTitle, (language: Locale, value: string, next: SitePageContent) => { next.construction.authGateTitle[language] = value; }],
                ["Modal description", draft.construction.authGateDescription, (language: Locale, value: string, next: SitePageContent) => { next.construction.authGateDescription[language] = value; }],
                ["Password label", draft.construction.passwordLabel, (language: Locale, value: string, next: SitePageContent) => { next.construction.passwordLabel[language] = value; }],
                ["Password placeholder", draft.construction.passwordPlaceholder, (language: Locale, value: string, next: SitePageContent) => { next.construction.passwordPlaceholder[language] = value; }],
                ["Submit label", draft.construction.passwordSubmitLabel, (language: Locale, value: string, next: SitePageContent) => { next.construction.passwordSubmitLabel[language] = value; }],
                ["Error message", draft.construction.passwordError, (language: Locale, value: string, next: SitePageContent) => { next.construction.passwordError[language] = value; }],
              ] as const).map(([label, value, updater]) => (
                <LocalizedFieldEditor
                  key={`construction-auth-${label}`}
                  label={label}
                  rows={label === "Modal description" ? 4 : 2}
                  value={value}
                  onChange={(language, nextValue) =>
                    setDraft((current) =>
                      updateDraftContent(current, (next) => {
                        updater(language, nextValue, next);
                      }),
                    )
                  }
                />
              ))}
            </Surface>
          </>
        ) : null}

        {pageId === "competition" ? (
          <>
            <CopySectionEditor
              title="Competition / Intro"
              section={draft.competition.intro}
              onChange={(field, language, value) =>
                setDraft((current) =>
                  updateDraftContent(current, (next) => {
                    next.competition.intro[field][language] = value;
                  }),
                )
              }
            />
            <Surface className="space-y-5 px-5 py-5 md:px-6 md:py-6">
              <BlockIntro
                title="Competition / Pillars"
                description="These three short lines appear inside the intro-side panel of the competition page."
              />
              <LocalizedFieldEditor
                label="Pillars title"
                rows={2}
                value={draft.competition.pillarsTitle}
                onChange={(language, value) =>
                  setDraft((current) =>
                    updateDraftContent(current, (next) => {
                      next.competition.pillarsTitle[language] = value;
                    }),
                  )
                }
              />
              <LocalizedListBlockEditor
                title="Pillar items"
                description="These are the three bullet-like labels in the competition intro aside."
                items={draft.competition.pillars}
                itemLabelPrefix="Pillar"
                rows={2}
                onChange={(itemIndex, language, value) =>
                  setDraft((current) =>
                    updateDraftContent(current, (next) => {
                      next.competition.pillars[itemIndex][language] = value;
                    }),
                  )
                }
              />
            </Surface>

            <Surface className="space-y-5 px-5 py-5 md:px-6 md:py-6">
              <BlockIntro
                title="Competition / Audience highlight cards"
                description="These three cards appear directly below the competition page intro."
              />
              <div className="space-y-4">
                {draft.competition.highlights.map((item, index) => (
                  <div key={`competition-highlight-${index}`} className="rounded-[1.5rem] border theme-border px-4 py-4">
                    <p className="mb-4 text-sm font-semibold theme-text-strong">Highlight card {index + 1}</p>
                    <LocalizedFieldEditor
                      label="Title"
                      rows={2}
                      value={item.title}
                      onChange={(language, value) =>
                        setDraft((current) =>
                          updateDraftContent(current, (next) => {
                            next.competition.highlights[index].title[language] = value;
                          }),
                        )
                      }
                    />
                    <div className="mt-4">
                      <LocalizedFieldEditor
                        label="Description"
                        rows={4}
                        value={item.description}
                        onChange={(language, value) =>
                          setDraft((current) =>
                            updateDraftContent(current, (next) => {
                              next.competition.highlights[index].description[language] = value;
                            }),
                          )
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Surface>

            <CopySectionEditor
              title="Competition / Rounds heading"
              section={draft.competition.rounds}
              onChange={(field, language, value) =>
                setDraft((current) =>
                  updateDraftContent(current, (next) => {
                    next.competition.rounds[field][language] = value;
                  }),
                )
              }
            />

            <Surface className="space-y-5 px-5 py-5 md:px-6 md:py-6">
              <BlockIntro
                title="Competition / Round cards"
                description="Each competition round card appears as one long block on the public competition page."
              />
              <div className="space-y-4">
                {draft.competition.roundCards.map((round, index) => (
                  <div key={`competition-round-${round.id}`} className="rounded-[1.5rem] border theme-border px-4 py-4">
                    <p className="mb-4 text-sm font-semibold theme-text-strong">
                      {`Round ${round.id}`}
                    </p>
                    <div className="space-y-4">
                      <LocalizedFieldEditor
                        label="Round label"
                        rows={2}
                        value={round.label}
                        onChange={(language, value) =>
                          setDraft((current) =>
                            updateDraftContent(current, (next) => {
                              next.competition.roundCards[index].label[language] = value;
                            }),
                          )
                        }
                      />
                      <LocalizedFieldEditor
                        label="Round title"
                        rows={2}
                        value={round.title}
                        onChange={(language, value) =>
                          setDraft((current) =>
                            updateDraftContent(current, (next) => {
                              next.competition.roundCards[index].title[language] = value;
                            }),
                          )
                        }
                      />
                      <LocalizedFieldEditor
                        label="Duration fallback"
                        rows={2}
                        value={round.duration}
                        onChange={(language, value) =>
                          setDraft((current) =>
                            updateDraftContent(current, (next) => {
                              next.competition.roundCards[index].duration[language] = value;
                            }),
                          )
                        }
                      />
                      <LocalizedFieldEditor
                        label="Description"
                        rows={4}
                        value={round.description}
                        onChange={(language, value) =>
                          setDraft((current) =>
                            updateDraftContent(current, (next) => {
                              next.competition.roundCards[index].description[language] = value;
                            }),
                          )
                        }
                      />
                      <LocalizedListBlockEditor
                        title="Deliverables"
                        description="These are the three deliverable cards inside the round block."
                        items={round.deliverables}
                        itemLabelPrefix="Deliverable"
                        rows={2}
                        onChange={(itemIndex, language, value) =>
                          setDraft((current) =>
                            updateDraftContent(current, (next) => {
                              next.competition.roundCards[index].deliverables[itemIndex][language] = value;
                            }),
                          )
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Surface>

            <CopySectionEditor
              title="Competition / Rewards heading"
              section={draft.competition.rewards}
              onChange={(field, language, value) =>
                setDraft((current) =>
                  updateDraftContent(current, (next) => {
                    next.competition.rewards[field][language] = value;
                  }),
                )
              }
            />

            <Surface className="space-y-5 px-5 py-5 md:px-6 md:py-6">
              <BlockIntro
                title="Competition / Reward cards"
                description="These cards explain the main final-ranking prizes."
              />
              <div className="space-y-4">
                {draft.competition.rewardCards.map((reward, index) => (
                  <div key={`competition-reward-${index}`} className="rounded-[1.5rem] border theme-border px-4 py-4">
                    <p className="mb-4 text-sm font-semibold theme-text-strong">Reward card {index + 1}</p>
                    <div className="space-y-4">
                      <LocalizedFieldEditor
                        label="Rank"
                        rows={2}
                        value={reward.rank}
                        onChange={(language, value) =>
                          setDraft((current) =>
                            updateDraftContent(current, (next) => {
                              next.competition.rewardCards[index].rank[language] = value;
                            }),
                          )
                        }
                      />
                      <LocalizedFieldEditor
                        label="Title"
                        rows={2}
                        value={reward.title}
                        onChange={(language, value) =>
                          setDraft((current) =>
                            updateDraftContent(current, (next) => {
                              next.competition.rewardCards[index].title[language] = value;
                            }),
                          )
                        }
                      />
                      <LocalizedFieldEditor
                        label="Amount"
                        rows={2}
                        value={reward.amount}
                        onChange={(language, value) =>
                          setDraft((current) =>
                            updateDraftContent(current, (next) => {
                              next.competition.rewardCards[index].amount[language] = value;
                            }),
                          )
                        }
                      />
                      <LocalizedFieldEditor
                        label="Note"
                        rows={4}
                        value={reward.note}
                        onChange={(language, value) =>
                          setDraft((current) =>
                            updateDraftContent(current, (next) => {
                              next.competition.rewardCards[index].note[language] = value;
                            }),
                          )
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Surface>

            <Surface className="space-y-5 px-5 py-5 md:px-6 md:py-6">
              <BlockIntro
                title="Competition / Emerging team spotlight"
                description="This is the smaller recognition block on the right side of the competition rewards section."
              />
              <LocalizedFieldEditor
                label="Eyebrow"
                rows={2}
                value={draft.competition.emergingReward.eyebrow}
                onChange={(language, value) =>
                  setDraft((current) =>
                    updateDraftContent(current, (next) => {
                      next.competition.emergingReward.eyebrow[language] = value;
                    }),
                  )
                }
              />
              <LocalizedFieldEditor
                label="Title"
                rows={2}
                value={draft.competition.emergingReward.title}
                onChange={(language, value) =>
                  setDraft((current) =>
                    updateDraftContent(current, (next) => {
                      next.competition.emergingReward.title[language] = value;
                    }),
                  )
                }
              />
              <LocalizedFieldEditor
                label="Amount"
                rows={2}
                value={draft.competition.emergingReward.amount}
                onChange={(language, value) =>
                  setDraft((current) =>
                    updateDraftContent(current, (next) => {
                      next.competition.emergingReward.amount[language] = value;
                    }),
                  )
                }
              />
              <LocalizedFieldEditor
                label="Note"
                rows={4}
                value={draft.competition.emergingReward.note}
                onChange={(language, value) =>
                  setDraft((current) =>
                    updateDraftContent(current, (next) => {
                      next.competition.emergingReward.note[language] = value;
                    }),
                  )
                }
              />
            </Surface>

            <Surface className="space-y-5 px-5 py-5 md:px-6 md:py-6">
              <BlockIntro
                title="Competition / Path block"
                description="This is the smaller roadmap note shown under the reward summary."
              />
              <LocalizedFieldEditor
                label="Eyebrow"
                rows={2}
                value={draft.competition.competitionPath.eyebrow}
                onChange={(language, value) =>
                  setDraft((current) =>
                    updateDraftContent(current, (next) => {
                      next.competition.competitionPath.eyebrow[language] = value;
                    }),
                  )
                }
              />
              <LocalizedListBlockEditor
                title="Path items"
                description="These three path lines appear in the competition page reward aside."
                items={draft.competition.competitionPath.items}
                itemLabelPrefix="Path item"
                rows={2}
                onChange={(itemIndex, language, value) =>
                  setDraft((current) =>
                    updateDraftContent(current, (next) => {
                      next.competition.competitionPath.items[itemIndex][language] = value;
                    }),
                  )
                }
              />
              <LocalizedFieldEditor
                label="Supporting note"
                rows={4}
                value={draft.competition.competitionPath.note}
                onChange={(language, value) =>
                  setDraft((current) =>
                    updateDraftContent(current, (next) => {
                      next.competition.competitionPath.note[language] = value;
                    }),
                  )
                }
              />
            </Surface>

            <CopySectionEditor
              title="Competition / Legacy journey heading"
              section={draft.organizer.header}
              onChange={(field, language, value) =>
                setDraft((current) =>
                  updateDraftContent(current, (next) => {
                    next.organizer.header[field][language] = value;
                  }),
                )
              }
            />

            <Surface className="space-y-5 px-5 py-5 md:px-6 md:py-6">
              <BlockIntro
                title="Competition / Legacy journey hero"
                description="These controls edit the visible badges and card text inside the Hành trình cuộc thi hero block on the competition page."
              />
              <LocalizedListBlockEditor
                title="Legacy hero badges"
                description="These badges appear below the large Hành trình cuộc thi title."
                items={draft.organizer.heroBadges}
                itemLabelPrefix="Hero badge"
                rows={2}
                onChange={(itemIndex, language, value) =>
                  setDraft((current) =>
                    updateDraftContent(current, (next) => {
                      next.organizer.heroBadges[itemIndex][language] = value;
                    }),
                  )
                }
                onAdd={() =>
                  setDraft((current) =>
                    updateDraftContent(current, (next) => {
                      next.organizer.heroBadges.push(createBlankLocalizedText());
                    }),
                  )
                }
                addLabel={locale === "en" ? "Add badge" : "Thêm badge"}
                onRemove={(itemIndex) =>
                  setDraft((current) =>
                    updateDraftContent(current, (next) => {
                      next.organizer.heroBadges = next.organizer.heroBadges.filter(
                        (_, currentIndex) => currentIndex !== itemIndex,
                      );
                    }),
                  )
                }
                removeLabel={locale === "en" ? "Remove badge" : "Xóa badge"}
                minItems={1}
              />
              <CopySectionEditor
                title="Competition / Legacy journey inner card"
                section={draft.organizer.heroCard}
                className="px-0 py-0 shadow-none"
                onChange={(field, language, value) =>
                  setDraft((current) =>
                    updateDraftContent(current, (next) => {
                      next.organizer.heroCard[field][language] = value;
                    }),
                  )
                }
              />
            </Surface>

            <Surface className="space-y-5 px-5 py-5 md:px-6 md:py-6">
              <BlockIntro
                title="Competition / Legacy journey metric boxes"
                description="These metric boxes appear directly below the Hành trình cuộc thi hero block."
              />
              <div className="space-y-4">
                {draft.organizer.metrics.map((metric, index) => (
                  <div key={`competition-legacy-metric-${index}`} className="rounded-[1.5rem] border theme-border px-4 py-4">
                    <div className="grid gap-4 md:grid-cols-[180px_minmax(0,1fr)]">
                      <label className="space-y-2">
                        <span className="text-sm theme-text-muted">Value</span>
                        <input
                          value={metric.value}
                          onChange={(event) =>
                            setDraft((current) =>
                              updateDraftContent(current, (next) => {
                                next.organizer.metrics[index].value = event.target.value;
                              }),
                            )
                          }
                          className={fieldClassName}
                        />
                      </label>
                      <LocalizedFieldEditor
                        label={`Metric ${index + 1} label`}
                        rows={2}
                        value={metric.label}
                        onChange={(language, value) =>
                          setDraft((current) =>
                            updateDraftContent(current, (next) => {
                              next.organizer.metrics[index].label[language] = value;
                            }),
                          )
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Surface>

            <CopySectionEditor
              title="Competition / Season highlights heading"
              section={draft.organizer.contentModules}
              onChange={(field, language, value) =>
                setDraft((current) =>
                  updateDraftContent(current, (next) => {
                    next.organizer.contentModules[field][language] = value;
                  }),
                )
              }
            />

            <LocalizedTextEditorCard
              title="Competition / Season highlights link label"
              value={draft.organizer.competitionLinkLabel}
              onChange={(language, value) =>
                setDraft((current) =>
                  updateDraftContent(current, (next) => {
                    next.organizer.competitionLinkLabel[language] = value;
                  }),
                )
              }
            />

            <Surface className="space-y-5 px-5 py-5 md:px-6 md:py-6">
              <BlockIntro
                title="Competition / Legacy hero background"
                description="Upload or replace the background image for the large competition legacy block shown on the public competition page."
              />

              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
                <div className="overflow-hidden rounded-[1.6rem] border theme-border bg-white/72 dark:bg-white/[0.05]">
                  <div className="relative aspect-[16/7] min-h-[220px] w-full">
                    {competitionLegacyHeroImage ? (
                      <Image
                        src={competitionLegacyHeroImage}
                        alt={locale === "en" ? "Competition legacy background preview" : "Xem trước ảnh nền Hành trình cuộc thi"}
                        fill
                        sizes="(min-width: 1280px) 760px, 100vw"
                        unoptimized={
                          competitionLegacyHeroImage.startsWith("/api/content-images/") ||
                          competitionLegacyHeroImage.startsWith("/api/hero-slide-images/")
                        }
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center px-6 text-center text-sm font-medium theme-text-soft">
                        {locale === "en" ? "No background image selected yet." : "Chưa chọn ảnh nền."}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(4,14,30,0.74),rgba(5,18,39,0.24))]" />
                    <div className="absolute bottom-5 left-5 right-5">
                      <p className="max-w-xl text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100/82">
                        {locale === "en" ? "Preview" : "Xem trước"}
                      </p>
                      <p className="mt-2 max-w-xl text-xl font-semibold leading-tight text-white md:text-2xl">
                        {pickText(locale, draft.organizer.header.title)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 rounded-[1.6rem] border theme-border theme-panel-subtle px-4 py-4">
                  <label className="space-y-2">
                    <span className="text-sm theme-text-muted">
                      {locale === "en" ? "Current image source" : "Nguồn ảnh hiện tại"}
                    </span>
                    <input
                      value={competitionLegacyHeroImage}
                      onChange={(event) =>
                        setDraft((current) =>
                          updateDraftContent(current, (next) => {
                            next.competition.legacyHeroImage = event.target.value;
                          }),
                        )
                      }
                      className={fieldClassName}
                    />
                  </label>

                  <div className="flex flex-wrap gap-2">
                    <label className="theme-button-primary inline-flex cursor-pointer items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold">
                      <Upload className="h-4 w-4" />
                      {isUploadingCompetitionHeroImage
                        ? locale === "en"
                          ? "Uploading..."
                          : "Đang tải..."
                        : locale === "en"
                          ? "Upload background"
                          : "Tải ảnh nền"}
                      <input
                        type="file"
                        accept="image/jpeg,.jpg,.jpeg"
                        className="hidden"
                        disabled={isUploadingCompetitionHeroImage}
                        onChange={async (event: ChangeEvent<HTMLInputElement>) => {
                          const file = event.target.files?.[0];
                          event.target.value = "";
                          if (!file) {
                            return;
                          }

                          const validationError = getCompetitionLegacyImageValidationError(file);
                          if (validationError === "type") {
                            setCompetitionHeroImageUploadError(
                              locale === "en"
                                ? "Only JPG images are allowed for this background."
                                : "Chỉ chấp nhận ảnh JPG cho ảnh nền này.",
                            );
                            return;
                          }

                          if (validationError === "size") {
                            setCompetitionHeroImageUploadError(
                              locale === "en"
                                ? `Background JPG images must be ${formatFileSize(MAX_CONTENT_IMAGE_FILE_BYTES)} or smaller.`
                                : `Ảnh nền phải có dung lượng ${formatFileSize(MAX_CONTENT_IMAGE_FILE_BYTES)} trở xuống.`,
                            );
                            return;
                          }

                          const formData = new FormData();
                          formData.append("imageFile", file);
                          setCompetitionHeroImageUploadError("");
                          setIsUploadingCompetitionHeroImage(true);

                          try {
                            const response = await fetch("/api/admin/content/competition/legacy-image", {
                              method: "POST",
                              body: formData,
                            });
                            const payload = (await response.json().catch(() => null)) as
                              | { imageUrl?: string; error?: string }
                              | null;

                            if (!response.ok || !payload?.imageUrl) {
                              throw new Error(
                                payload?.error ||
                                  (locale === "en"
                                    ? "The background image could not be uploaded."
                                    : "Không thể tải ảnh nền."),
                              );
                            }

                            setDraft((current) =>
                              updateDraftContent(current, (next) => {
                                next.competition.legacyHeroImage = payload.imageUrl!;
                              }),
                            );
                          } catch (error) {
                            setCompetitionHeroImageUploadError(
                              error instanceof Error
                                ? error.message
                                : locale === "en"
                                  ? "The background image could not be uploaded."
                                  : "Không thể tải ảnh nền.",
                            );
                          } finally {
                            setIsUploadingCompetitionHeroImage(false);
                          }
                        }}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        setCompetitionHeroImageUploadError("");
                        setDraft((current) =>
                          updateDraftContent(current, (next) => {
                            next.competition.legacyHeroImage = DEFAULT_COMPETITION_LEGACY_IMAGE;
                          }),
                        );
                      }}
                      className="theme-button-secondary inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold"
                    >
                      <Trash2 className="h-4 w-4" />
                      {locale === "en" ? "Use default" : "Dùng ảnh mặc định"}
                    </button>
                  </div>

                  <p className="text-xs leading-6 theme-text-soft">
                    {locale === "en"
                      ? `Accepted format: JPG only. Maximum size: ${formatFileSize(MAX_CONTENT_IMAGE_FILE_BYTES)}. After uploading, click Save content to publish the new image.`
                      : `Chỉ chấp nhận JPG. Dung lượng tối đa: ${formatFileSize(MAX_CONTENT_IMAGE_FILE_BYTES)}. Sau khi tải ảnh, bấm Lưu nội dung để cập nhật lên website.`}
                  </p>

                  {competitionHeroImageUploadError ? (
                    <div className="rounded-[1.2rem] border border-rose-300/55 bg-rose-50/82 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-200/20 dark:bg-rose-300/10 dark:text-rose-100">
                      {competitionHeroImageUploadError}
                    </div>
                  ) : null}
                </div>
              </div>
            </Surface>
          </>
        ) : null}

        {pageId === "faq" ? (
          <>
            <Surface className="space-y-5 px-5 py-5 md:px-6 md:py-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <BlockIntro
                  title="FAQ editor"
                  description="Switch between questions, topics, and the general text shown at the top of the FAQ page."
                />
                <div className="theme-panel-subtle inline-flex rounded-full border theme-border p-1">
                  {[
                    { id: "questions" as const, label: locale === "en" ? "Questions" : "Câu hỏi", icon: CircleHelp },
                    { id: "topics" as const, label: locale === "en" ? "Topics" : "Chủ đề", icon: Tags },
                    { id: "page" as const, label: locale === "en" ? "Text edit" : "Sửa nội dung", icon: FileText },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = faqEditorTab === tab.id;

                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setFaqEditorTab(tab.id)}
                        className={cn(
                          "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition",
                          isActive
                            ? "bg-[linear-gradient(135deg,#38bdf8,#2563eb)] text-white shadow-[0_14px_32px_rgba(37,99,235,0.2)]"
                            : "theme-text-soft hover:bg-white/70 hover:text-slate-950 dark:hover:bg-white/10 dark:hover:text-white",
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </Surface>

            {faqEditorTab === "page" ? (
              <>
                <CopySectionEditor
                  title="FAQ / Header"
                  section={draft.rules.faq}
                  onChange={(field, language, value) =>
                    setDraft((current) =>
                      updateDraftContent(current, (next) => {
                        next.rules.faq[field][language] = value;
                      }),
                    )
                  }
                />

                <Surface className="space-y-5 px-5 py-5 md:px-6 md:py-6">
                  <BlockIntro
                    title="FAQ / Quick answers"
                    description="These short helper lines appear in the side block above the topic-based FAQ list."
                  />
                  <LocalizedFieldEditor
                    label="Quick answers label"
                    rows={2}
                    value={draft.rules.faqQuickAnswersLabel}
                    onChange={(language, value) =>
                      setDraft((current) =>
                        updateDraftContent(current, (next) => {
                          next.rules.faqQuickAnswersLabel[language] = value;
                        }),
                      )
                    }
                  />
                  <LocalizedListBlockEditor
                    title="Quick answer items"
                    description="Edit each compact guidance line."
                    items={draft.rules.faqQuickAnswers}
                    itemLabelPrefix="Quick answer"
                    rows={2}
                    onChange={(itemIndex, language, value) =>
                      setDraft((current) =>
                        updateDraftContent(current, (next) => {
                          next.rules.faqQuickAnswers[itemIndex][language] = value;
                        }),
                      )
                    }
                  />
                </Surface>
              </>
            ) : null}

            {faqEditorTab === "topics" ? (
                <Surface className="space-y-5 px-5 py-5 md:px-6 md:py-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <BlockIntro
                      title="FAQ / Topics"
                      description="Topics work like tags. Public FAQ cards are grouped by these topics."
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setDraft((current) =>
                          updateDraftContent(current, (next) => {
                            next.rules.faqTopics.push(createFaqTopicDraft(next.rules.faqTopics.length + 1));
                          }),
                        )
                      }
                      className="theme-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
                    >
                      <Plus className="h-4 w-4" />
                      {locale === "en" ? "Add topic" : "Thêm chủ đề"}
                    </button>
                  </div>

                  <div className="space-y-4">
                    {faqTopics.map((topic, topicIndex) => (
                      <div key={topic.id} className="rounded-[1.5rem] border theme-border px-4 py-4">
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold theme-text-strong">
                              {locale === "en" ? `Topic ${topicIndex + 1}` : `Chủ đề ${topicIndex + 1}`}
                            </p>
                            <p className="mt-1 text-xs theme-text-soft">
                              {draft.rules.faqItems.filter((item) => item.topicId === topic.id).length} FAQ
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            {faqSaveMessage?.key === `faq-topic-${topic.id}` ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:border-emerald-300/20 dark:bg-emerald-300/12 dark:text-emerald-100">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                {faqSaveMessage.text}
                              </span>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => {
                                void saveFaqBlock(
                                  `faq-topic-${topic.id}`,
                                  locale === "en" ? "Topic saved" : "Đã lưu chủ đề",
                                );
                              }}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-emerald-500/25 bg-emerald-500/10 text-emerald-700 transition hover:-translate-y-0.5 hover:bg-emerald-500/15 dark:border-emerald-300/20 dark:bg-emerald-300/12 dark:text-emerald-100"
                              aria-label={locale === "en" ? "Save FAQ topic" : "Lưu chủ đề FAQ"}
                              title={locale === "en" ? "Save FAQ topic" : "Lưu chủ đề FAQ"}
                            >
                              <Save className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              disabled={faqTopics.length <= 1}
                              onClick={() =>
                                setPendingFaqDelete({
                                  type: "topic",
                                  index: topicIndex,
                                  label: pickText(locale, topic.title) || topic.id,
                                })
                              }
                              className="theme-button-danger inline-flex h-10 w-10 items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-50"
                              aria-label={locale === "en" ? "Delete FAQ topic" : "Xóa chủ đề FAQ"}
                              title={locale === "en" ? "Delete FAQ topic" : "Xóa chủ đề FAQ"}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
                          <label className="space-y-2">
                            <span className="text-sm theme-text-muted">Topic ID</span>
                            <input
                              value={topic.id}
                              readOnly
                              className={`${fieldClassName} cursor-not-allowed opacity-75`}
                            />
                          </label>
                          <LocalizedFieldEditor
                            label="Topic title"
                            rows={2}
                            value={topic.title}
                            onChange={(language, value) =>
                              setDraft((current) =>
                                updateDraftContent(current, (next) => {
                                  next.rules.faqTopics[topicIndex].title[language] = value;
                                }),
                              )
                            }
                          />
                        </div>

                        <div className="mt-4">
                          <LocalizedFieldEditor
                            label="Topic description"
                            rows={3}
                            value={topic.description}
                            onChange={(language, value) =>
                              setDraft((current) =>
                                updateDraftContent(current, (next) => {
                                  next.rules.faqTopics[topicIndex].description[language] = value;
                                }),
                              )
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Surface>
            ) : null}

            {faqEditorTab === "questions" ? (
                <Surface className="space-y-5 px-5 py-5 md:px-6 md:py-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <BlockIntro
                      title="FAQ / Questions"
                      description="Question blocks are minimized by default. Open a block to edit its topic, question, and answer."
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setDraft((current) =>
                          updateDraftContent(current, (next) => {
                            next.rules.faqItems.push(createFaqDraft(next.rules.faqItems.length + 1, firstFaqTopicId));
                          }),
                        )
                      }
                      className="theme-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
                    >
                      <Plus className="h-4 w-4" />
                      {locale === "en" ? "Add question" : "Thêm câu hỏi"}
                    </button>
                  </div>

                  <div className="space-y-3">
                    {draft.rules.faqItems.map((item, index) => {
                      const itemKey = `faq-item-${index}`;
                      const isExpanded = expandedFaqItems.has(itemKey);
                      const topicId = item.topicId || firstFaqTopicId;

                      return (
                        <div key={itemKey} className="overflow-hidden rounded-[1.5rem] border theme-border">
                          <div className="theme-panel-subtle flex flex-wrap items-center justify-between gap-3 px-4 py-4">
                            <button
                              type="button"
                              onClick={() => toggleFaqItem(itemKey)}
                              className="group flex min-w-0 flex-1 items-center gap-3 text-left"
                              aria-expanded={isExpanded}
                            >
                              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-sky-500/20 bg-sky-500/10 text-sky-700 dark:border-sky-300/20 dark:bg-sky-300/12 dark:text-sky-100">
                                <ChevronDown className={cn("h-4 w-4 transition", isExpanded ? "rotate-180" : "")} />
                              </span>
                              <span className="min-w-0">
                                <span className="block text-sm font-semibold theme-text-strong">
                                  {locale === "en" ? `Question ${index + 1}` : `Câu hỏi ${index + 1}`}
                                  <span className="theme-text-soft"> · {pickFaqTopicTitle(topicId)}</span>
                                </span>
                                <span className="mt-1 block truncate text-xs theme-text-soft">
                                  {pickText(locale, item.question)}
                                </span>
                              </span>
                            </button>
                            <div className="flex items-center gap-2">
                              <span className="inline-flex min-h-8 items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-slate-950 dark:border-emerald-300/18 dark:bg-emerald-300/12 dark:text-emerald-100">
                                {pickFaqTopicTitle(topicId)}
                              </span>
                              {faqSaveMessage?.key === itemKey ? (
                                <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-300/20 dark:bg-emerald-300/12 dark:text-emerald-100">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  {faqSaveMessage.text}
                                </span>
                              ) : null}
                              <button
                                type="button"
                                onClick={() => {
                                  void saveFaqBlock(
                                    itemKey,
                                    locale === "en" ? "Question saved" : "Đã lưu câu hỏi",
                                  );
                                }}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-emerald-500/25 bg-emerald-500/10 text-emerald-700 transition hover:-translate-y-0.5 hover:bg-emerald-500/15 dark:border-emerald-300/20 dark:bg-emerald-300/12 dark:text-emerald-100"
                                aria-label={locale === "en" ? "Save FAQ question" : "Lưu câu hỏi FAQ"}
                                title={locale === "en" ? "Save FAQ question" : "Lưu câu hỏi FAQ"}
                              >
                                <Save className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                disabled={draft.rules.faqItems.length <= 1}
                                onClick={() =>
                                  setPendingFaqDelete({
                                    type: "question",
                                    index,
                                    label: pickText(locale, item.question) || (locale === "en" ? `Question ${index + 1}` : `Câu hỏi ${index + 1}`),
                                  })
                                }
                                className="theme-button-danger inline-flex h-10 w-10 items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-50"
                                aria-label={locale === "en" ? "Delete FAQ item" : "Xóa câu hỏi FAQ"}
                                title={locale === "en" ? "Delete FAQ item" : "Xóa câu hỏi FAQ"}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          {isExpanded ? (
                            <div className="space-y-4 px-4 py-4">
                              <label className="space-y-2">
                                <span className="text-sm theme-text-muted">
                                  {locale === "en" ? "Topic" : "Chủ đề"}
                                </span>
                                <select
                                  value={topicId}
                                  onChange={(event) =>
                                    setDraft((current) =>
                                      updateDraftContent(current, (next) => {
                                        next.rules.faqItems[index].topicId = event.target.value;
                                      }),
                                    )
                                  }
                                  className={`${fieldClassName} theme-admin-select`}
                                >
                                  {faqTopics.map((topic) => (
                                    <option key={topic.id} value={topic.id}>
                                      {pickText(locale, topic.title)}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <LocalizedFieldEditor
                                label="Question"
                                rows={3}
                                value={item.question}
                                onChange={(language, value) =>
                                  setDraft((current) =>
                                    updateDraftContent(current, (next) => {
                                      next.rules.faqItems[index].question[language] = value;
                                    }),
                                  )
                                }
                              />
                              <LocalizedFieldEditor
                                label="Answer"
                                rows={5}
                                value={item.answer}
                                onChange={(language, value) =>
                                  setDraft((current) =>
                                    updateDraftContent(current, (next) => {
                                      next.rules.faqItems[index].answer[language] = value;
                                    }),
                                  )
                                }
                              />
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </Surface>
            ) : null}
          </>
        ) : null}

        {pageId === "rules" ? (
          <>
            <CopySectionEditor
              title="Rules / Header"
              section={draft.rules.header}
              onChange={(field, language, value) =>
                setDraft((current) =>
                  updateDraftContent(current, (next) => {
                    next.rules.header[field][language] = value;
                  }),
                )
              }
            />
            <Surface className="space-y-5 px-5 py-5 md:px-6 md:py-6">
              <BlockIntro
                title="Rules / Intro jump buttons"
                description="These are the shortcut buttons shown below the rules page header."
              />
              <div className="space-y-4">
                {draft.rules.introJumpItems.map((item, index) => (
                  <div key={`rules-jump-${index}`} className="rounded-[1.5rem] border theme-border px-4 py-4">
                    <p className="mb-4 text-sm font-semibold theme-text-strong">Jump button {index + 1}</p>
                    <LocalizedFieldEditor
                      label="Short label"
                      rows={2}
                      value={item.shortLabel}
                      onChange={(language, value) =>
                        setDraft((current) =>
                          updateDraftContent(current, (next) => {
                            next.rules.introJumpItems[index].shortLabel[language] = value;
                          }),
                        )
                      }
                    />
                    <div className="mt-4">
                      <LocalizedFieldEditor
                        label="Hover label"
                        rows={2}
                        value={item.hoverLabel}
                        onChange={(language, value) =>
                          setDraft((current) =>
                            updateDraftContent(current, (next) => {
                              next.rules.introJumpItems[index].hoverLabel[language] = value;
                            }),
                          )
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Surface>

            <LocalizedListBlockEditor
              title="Rules / Quick policy read"
              description="These short rules appear in the quick-read card near the page top."
              items={draft.rules.quickReadItems}
              itemLabelPrefix="Quick rule"
              rows={2}
              onChange={(itemIndex, language, value) =>
                setDraft((current) =>
                  updateDraftContent(current, (next) => {
                    next.rules.quickReadItems[itemIndex][language] = value;
                  }),
                )
              }
            />
            <Surface className="space-y-5 px-5 py-5 md:px-6 md:py-6">
              <LocalizedFieldEditor
                label="Quick read label"
                rows={2}
                value={draft.rules.quickReadLabel}
                onChange={(language, value) =>
                  setDraft((current) =>
                    updateDraftContent(current, (next) => {
                      next.rules.quickReadLabel[language] = value;
                    }),
                  )
                }
              />
            </Surface>
            <CopySectionEditor
              title="Rules / Core rules"
              section={draft.rules.coreRules}
              onChange={(field, language, value) =>
                setDraft((current) =>
                  updateDraftContent(current, (next) => {
                    next.rules.coreRules[field][language] = value;
                  }),
                )
              }
            />
            <Surface className="space-y-5 px-5 py-5 md:px-6 md:py-6">
              <BlockIntro
                title="Rules / General highlight cards"
                description="These three cards sit in the first large general-rules block."
              />
              <div className="space-y-4">
                {draft.rules.generalHighlights.map((item, index) => (
                  <div key={`rules-highlight-${index}`} className="rounded-[1.5rem] border theme-border px-4 py-4">
                    <p className="mb-4 text-sm font-semibold theme-text-strong">General highlight {index + 1}</p>
                    <LocalizedFieldEditor
                      label="Title"
                      rows={2}
                      value={item.title}
                      onChange={(language, value) =>
                        setDraft((current) =>
                          updateDraftContent(current, (next) => {
                            next.rules.generalHighlights[index].title[language] = value;
                          }),
                        )
                      }
                    />
                    <div className="mt-4">
                      <LocalizedFieldEditor
                        label="Description"
                        rows={4}
                        value={item.description}
                        onChange={(language, value) =>
                          setDraft((current) =>
                            updateDraftContent(current, (next) => {
                              next.rules.generalHighlights[index].description[language] = value;
                            }),
                          )
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Surface>

            <Surface className="space-y-5 px-5 py-5 md:px-6 md:py-6">
              <BlockIntro
                title="Rules / General policy checks"
                description="This section controls the checklist cards and the timeline link label in the general rules block."
              />
              <LocalizedFieldEditor
                label="Policy checks label"
                rows={2}
                value={draft.rules.generalPolicyChecksLabel}
                onChange={(language, value) =>
                  setDraft((current) =>
                    updateDraftContent(current, (next) => {
                      next.rules.generalPolicyChecksLabel[language] = value;
                    }),
                  )
                }
              />
              <LocalizedFieldEditor
                label="Open timeline overview label"
                rows={2}
                value={draft.rules.openTimelineOverviewLabel}
                onChange={(language, value) =>
                  setDraft((current) =>
                    updateDraftContent(current, (next) => {
                      next.rules.openTimelineOverviewLabel[language] = value;
                    }),
                  )
                }
              />
              <div className="space-y-4">
                {draft.rules.generalPolicyChecks.map((item, index) => (
                  <div key={`rules-policy-${index}`} className="rounded-[1.5rem] border theme-border px-4 py-4">
                    <p className="mb-4 text-sm font-semibold theme-text-strong">Policy card {index + 1}</p>
                    <LocalizedFieldEditor
                      label="Title"
                      rows={2}
                      value={item.title}
                      onChange={(language, value) =>
                        setDraft((current) =>
                          updateDraftContent(current, (next) => {
                            next.rules.generalPolicyChecks[index].title[language] = value;
                          }),
                        )
                      }
                    />
                    <div className="mt-4">
                      <LocalizedFieldEditor
                        label="Description"
                        rows={4}
                        value={item.description}
                        onChange={(language, value) =>
                          setDraft((current) =>
                            updateDraftContent(current, (next) => {
                              next.rules.generalPolicyChecks[index].description[language] = value;
                            }),
                          )
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Surface>

            <Surface className="space-y-5 px-5 py-5 md:px-6 md:py-6">
              <BlockIntro
                title="Rules / Shared round labels"
                description="These shared labels are reused across the three round rule blocks."
              />
              <LocalizedFieldEditor
                label="Open round on timeline label"
                rows={2}
                value={draft.rules.openRoundOnTimelineLabel}
                onChange={(language, value) =>
                  setDraft((current) =>
                    updateDraftContent(current, (next) => {
                      next.rules.openRoundOnTimelineLabel[language] = value;
                    }),
                  )
                }
              />
              <LocalizedFieldEditor
                label="Deliverable prefix"
                rows={2}
                value={draft.rules.deliverablePrefix}
                onChange={(language, value) =>
                  setDraft((current) =>
                    updateDraftContent(current, (next) => {
                      next.rules.deliverablePrefix[language] = value;
                    }),
                  )
                }
              />
              <LocalizedFieldEditor
                label="Specific round rules label"
                rows={2}
                value={draft.rules.specificRoundRulesLabel}
                onChange={(language, value) =>
                  setDraft((current) =>
                    updateDraftContent(current, (next) => {
                      next.rules.specificRoundRulesLabel[language] = value;
                    }),
                  )
                }
              />
              <LocalizedFieldEditor
                label="Round notes label"
                rows={2}
                value={draft.rules.roundNotesLabel}
                onChange={(language, value) =>
                  setDraft((current) =>
                    updateDraftContent(current, (next) => {
                      next.rules.roundNotesLabel[language] = value;
                    }),
                  )
                }
              />
            </Surface>

            <div className="space-y-5">
              {draft.rules.rounds.map((round, index) => (
                <Surface key={`rules-round-${round.id}`} className="space-y-5 px-5 py-5 md:px-6 md:py-6">
                  <BlockIntro
                    title={`Rules / Round ${round.id}`}
                    description="This full-width block controls the round-specific rules section on the public rules page."
                  />
                  <LocalizedFieldEditor
                    label="Round label"
                    rows={2}
                    value={round.label}
                    onChange={(language, value) =>
                      setDraft((current) =>
                        updateDraftContent(current, (next) => {
                          next.rules.rounds[index].label[language] = value;
                        }),
                      )
                    }
                  />
                  <LocalizedFieldEditor
                    label="Round title"
                    rows={2}
                    value={round.title}
                    onChange={(language, value) =>
                      setDraft((current) =>
                        updateDraftContent(current, (next) => {
                          next.rules.rounds[index].title[language] = value;
                        }),
                      )
                    }
                  />
                  <LocalizedFieldEditor
                    label="Duration fallback"
                    rows={2}
                    value={round.duration}
                    onChange={(language, value) =>
                      setDraft((current) =>
                        updateDraftContent(current, (next) => {
                          next.rules.rounds[index].duration[language] = value;
                        }),
                      )
                    }
                  />
                  <LocalizedFieldEditor
                    label="Focus note"
                    rows={3}
                    value={round.focus}
                    onChange={(language, value) =>
                      setDraft((current) =>
                        updateDraftContent(current, (next) => {
                          next.rules.rounds[index].focus[language] = value;
                        }),
                      )
                    }
                  />
                  <LocalizedFieldEditor
                    label="Description"
                    rows={4}
                    value={round.description}
                    onChange={(language, value) =>
                      setDraft((current) =>
                        updateDraftContent(current, (next) => {
                          next.rules.rounds[index].description[language] = value;
                        }),
                      )
                    }
                  />
                  <LocalizedListBlockEditor
                    title="Deliverables"
                    description="These cards appear inside the main content area of the round block."
                    items={round.deliverables}
                    itemLabelPrefix="Deliverable"
                    rows={2}
                    onChange={(itemIndex, language, value) =>
                      setDraft((current) =>
                        updateDraftContent(current, (next) => {
                          next.rules.rounds[index].deliverables[itemIndex][language] = value;
                        }),
                      )
                    }
                  />
                  {round.id === "01" || round.id === "02" ? (
                    <Surface className="space-y-5 px-5 py-5 md:px-6 md:py-6">
                      <BlockIntro
                        title={round.id === "01" ? "Round 1 specific rules" : "Round 2 specific rules"}
                        description={
                          round.id === "01"
                            ? "This rich text field replaces the three specific-rule cards for Round 1 on the public rules page."
                            : "This rich text field replaces the three specific-rule cards for Round 2 on the public rules page."
                        }
                      />
                      <LocalizedRichTextEditor
                        label={round.id === "01" ? "Round 1 specific rules" : "Round 2 specific rules"}
                        value={round.specificRulesRichText ?? createRichRulesFallback(round.specificRules)}
                        onChange={(language, value) =>
                          setDraft((current) =>
                            updateDraftContent(current, (next) => {
                              const targetRound = next.rules.rounds[index];
                              targetRound.specificRulesRichText =
                                targetRound.specificRulesRichText ?? createRichRulesFallback(targetRound.specificRules);
                              targetRound.specificRulesRichText[language] = value;
                            }),
                          )
                        }
                      />
                    </Surface>
                  ) : round.id === "03" ? (
                    <Surface className="space-y-5 px-5 py-5 md:px-6 md:py-6">
                      <BlockIntro
                        title="Round 3 split rules"
                        description="These rich text fields replace the specific-rule cards for Round 3 on the public rules page."
                      />
                      <LocalizedRichTextEditor
                        label="Emerging round rules"
                        value={round.round3EmergingRules ?? createBlankLocalizedText()}
                        onChange={(language, value) =>
                          setDraft((current) =>
                            updateDraftContent(current, (next) => {
                              const targetRound = next.rules.rounds[index];
                              targetRound.round3EmergingRules = targetRound.round3EmergingRules ?? createBlankLocalizedText();
                              targetRound.round3EmergingRules[language] = value;
                            }),
                          )
                        }
                      />
                      <LocalizedRichTextEditor
                        label="Final rules"
                        value={round.round3FinalRules ?? createBlankLocalizedText()}
                        onChange={(language, value) =>
                          setDraft((current) =>
                            updateDraftContent(current, (next) => {
                              const targetRound = next.rules.rounds[index];
                              targetRound.round3FinalRules = targetRound.round3FinalRules ?? createBlankLocalizedText();
                              targetRound.round3FinalRules[language] = value;
                            }),
                          )
                        }
                      />
                    </Surface>
                  ) : (
                    <LocalizedListBlockEditor
                      title="Specific round rules"
                      description="These note cards appear in the right-side specific-rule panel."
                      items={round.specificRules}
                      itemLabelPrefix="Rule"
                      rows={3}
                      onChange={(itemIndex, language, value) =>
                        setDraft((current) =>
                          updateDraftContent(current, (next) => {
                            next.rules.rounds[index].specificRules[itemIndex][language] = value;
                          }),
                        )
                      }
                    />
                  )}
                  <LocalizedListBlockEditor
                    title="Round notes"
                    description="These notes appear in the full-width note block below each round."
                    items={round.roundNotes}
                    itemLabelPrefix="Note"
                    rows={3}
                    onChange={(itemIndex, language, value) =>
                      setDraft((current) =>
                        updateDraftContent(current, (next) => {
                          next.rules.rounds[index].roundNotes[itemIndex][language] = value;
                        }),
                      )
                    }
                  />
                </Surface>
              ))}
            </div>
          </>
        ) : null}

        {pageId === "news" ? (
          <>
            <CopySectionEditor
              title="News / Featured"
              section={draft.news.featured}
              onChange={(field, language, value) =>
                setDraft((current) =>
                  updateDraftContent(current, (next) => {
                    next.news.featured[field][language] = value;
                  }),
                )
              }
            />
            <CopySectionEditor
              title="News / Latest"
              section={draft.news.latest}
              onChange={(field, language, value) =>
                setDraft((current) =>
                  updateDraftContent(current, (next) => {
                    next.news.latest[field][language] = value;
                  }),
                )
              }
            />
            <CopySectionEditor
              title="News / Related"
              section={draft.news.related}
              onChange={(field, language, value) =>
                setDraft((current) =>
                  updateDraftContent(current, (next) => {
                    next.news.related[field][language] = value;
                  }),
                )
              }
            />
          </>
        ) : null}

        {pageId === "forum" ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {[
              ["Forum / Search placeholder", draft.forum.searchPlaceholder, (language: Locale, value: string, next: SitePageContent) => { next.forum.searchPlaceholder[language] = value; }],
              ["Forum / All threads label", draft.forum.allThreadsLabel, (language: Locale, value: string, next: SitePageContent) => { next.forum.allThreadsLabel[language] = value; }],
              ["Forum / Matching threads suffix", draft.forum.matchingThreadsSuffix, (language: Locale, value: string, next: SitePageContent) => { next.forum.matchingThreadsSuffix[language] = value; }],
              ["Forum / All-categories description", draft.forum.allCategoriesDescription, (language: Locale, value: string, next: SitePageContent) => { next.forum.allCategoriesDescription[language] = value; }],
              ["Forum / Back to thread list", draft.forum.backToThreadListLabel, (language: Locale, value: string, next: SitePageContent) => { next.forum.backToThreadListLabel[language] = value; }],
              ["Forum / Last activity label", draft.forum.lastActivityLabel, (language: Locale, value: string, next: SitePageContent) => { next.forum.lastActivityLabel[language] = value; }],
              ["Forum / Closed by owner label", draft.forum.closedByOwnerLabel, (language: Locale, value: string, next: SitePageContent) => { next.forum.closedByOwnerLabel[language] = value; }],
              ["Forum / Replies suffix", draft.forum.repliesSuffix, (language: Locale, value: string, next: SitePageContent) => { next.forum.repliesSuffix[language] = value; }],
              ["Forum / Loading discussion label", draft.forum.loadingDiscussionLabel, (language: Locale, value: string, next: SitePageContent) => { next.forum.loadingDiscussionLabel[language] = value; }],
              ["Forum / Replies section label", draft.forum.repliesSectionLabel, (language: Locale, value: string, next: SitePageContent) => { next.forum.repliesSectionLabel[language] = value; }],
              ["Forum / No reply yet label", draft.forum.noReplyYetLabel, (language: Locale, value: string, next: SitePageContent) => { next.forum.noReplyYetLabel[language] = value; }],
              ["Forum / Join conversation label", draft.forum.joinConversationLabel, (language: Locale, value: string, next: SitePageContent) => { next.forum.joinConversationLabel[language] = value; }],
              ["Forum / Closed thread notice", draft.forum.closedThreadNotice, (language: Locale, value: string, next: SitePageContent) => { next.forum.closedThreadNotice[language] = value; }],
              ["Forum / Signed-in reply notice", draft.forum.signedInReplyNotice, (language: Locale, value: string, next: SitePageContent) => { next.forum.signedInReplyNotice[language] = value; }],
              ["Forum / Sign in now label", draft.forum.signInNowLabel, (language: Locale, value: string, next: SitePageContent) => { next.forum.signInNowLabel[language] = value; }],
              ["Forum / Reply placeholder", draft.forum.replyPlaceholder, (language: Locale, value: string, next: SitePageContent) => { next.forum.replyPlaceholder[language] = value; }],
              ["Forum / Post reply label", draft.forum.postReplyLabel, (language: Locale, value: string, next: SitePageContent) => { next.forum.postReplyLabel[language] = value; }],
              ["Forum / Active threads suffix", draft.forum.activeThreadsSuffix, (language: Locale, value: string, next: SitePageContent) => { next.forum.activeThreadsSuffix[language] = value; }],
              ["Forum / Sorted by recent activity", draft.forum.sortedByRecentActivityLabel, (language: Locale, value: string, next: SitePageContent) => { next.forum.sortedByRecentActivityLabel[language] = value; }],
              ["Forum / Open thread label", draft.forum.openThreadLabel, (language: Locale, value: string, next: SitePageContent) => { next.forum.openThreadLabel[language] = value; }],
              ["Forum / Sign in to participate", draft.forum.signInToParticipateLabel, (language: Locale, value: string, next: SitePageContent) => { next.forum.signInToParticipateLabel[language] = value; }],
              ["Forum / Loading threads label", draft.forum.loadingThreadsLabel, (language: Locale, value: string, next: SitePageContent) => { next.forum.loadingThreadsLabel[language] = value; }],
              ["Forum / No matching thread title", draft.forum.noMatchingThreadTitle, (language: Locale, value: string, next: SitePageContent) => { next.forum.noMatchingThreadTitle[language] = value; }],
              ["Forum / No matching thread description", draft.forum.noMatchingThreadDescription, (language: Locale, value: string, next: SitePageContent) => { next.forum.noMatchingThreadDescription[language] = value; }],
              ["Forum / New thread eyebrow", draft.forum.newThreadEyebrow, (language: Locale, value: string, next: SitePageContent) => { next.forum.newThreadEyebrow[language] = value; }],
              ["Forum / New thread title", draft.forum.newThreadTitle, (language: Locale, value: string, next: SitePageContent) => { next.forum.newThreadTitle[language] = value; }],
              ["Forum / Close dialog label", draft.forum.closeDialogLabel, (language: Locale, value: string, next: SitePageContent) => { next.forum.closeDialogLabel[language] = value; }],
              ["Forum / Thread title field label", draft.forum.threadTitleFieldLabel, (language: Locale, value: string, next: SitePageContent) => { next.forum.threadTitleFieldLabel[language] = value; }],
              ["Forum / Category field label", draft.forum.categoryFieldLabel, (language: Locale, value: string, next: SitePageContent) => { next.forum.categoryFieldLabel[language] = value; }],
              ["Forum / Roles or skills field label", draft.forum.rolesSkillsFieldLabel, (language: Locale, value: string, next: SitePageContent) => { next.forum.rolesSkillsFieldLabel[language] = value; }],
              ["Forum / Roles or skills placeholder", draft.forum.rolesSkillsPlaceholder, (language: Locale, value: string, next: SitePageContent) => { next.forum.rolesSkillsPlaceholder[language] = value; }],
              ["Forum / Short summary field label", draft.forum.shortSummaryFieldLabel, (language: Locale, value: string, next: SitePageContent) => { next.forum.shortSummaryFieldLabel[language] = value; }],
              ["Forum / Main post field label", draft.forum.mainPostFieldLabel, (language: Locale, value: string, next: SitePageContent) => { next.forum.mainPostFieldLabel[language] = value; }],
              ["Forum / Contact note field label", draft.forum.contactNoteFieldLabel, (language: Locale, value: string, next: SitePageContent) => { next.forum.contactNoteFieldLabel[language] = value; }],
              ["Forum / Contact note placeholder", draft.forum.contactNotePlaceholder, (language: Locale, value: string, next: SitePageContent) => { next.forum.contactNotePlaceholder[language] = value; }],
              ["Forum / Publish thread label", draft.forum.publishThreadLabel, (language: Locale, value: string, next: SitePageContent) => { next.forum.publishThreadLabel[language] = value; }],
              ["Forum / Clear form label", draft.forum.clearFormLabel, (language: Locale, value: string, next: SitePageContent) => { next.forum.clearFormLabel[language] = value; }],
              ["Forum / Close thread confirm title", draft.forum.closeThreadConfirmTitle, (language: Locale, value: string, next: SitePageContent) => { next.forum.closeThreadConfirmTitle[language] = value; }],
              ["Forum / Close thread confirm description", draft.forum.closeThreadConfirmDescription, (language: Locale, value: string, next: SitePageContent) => { next.forum.closeThreadConfirmDescription[language] = value; }],
              ["Forum / Cancel label", draft.forum.cancelLabel, (language: Locale, value: string, next: SitePageContent) => { next.forum.cancelLabel[language] = value; }],
              ["Forum / Close thread label", draft.forum.closeThreadLabel, (language: Locale, value: string, next: SitePageContent) => { next.forum.closeThreadLabel[language] = value; }],
              ["Forum / Looking-for-team label", draft.forum.categoryLookingForTeamLabel, (language: Locale, value: string, next: SitePageContent) => { next.forum.categoryLookingForTeamLabel[language] = value; }],
              ["Forum / Looking-for-team description", draft.forum.categoryLookingForTeamDescription, (language: Locale, value: string, next: SitePageContent) => { next.forum.categoryLookingForTeamDescription[language] = value; }],
              ["Forum / Team recruiting label", draft.forum.categoryTeamRecruitingLabel, (language: Locale, value: string, next: SitePageContent) => { next.forum.categoryTeamRecruitingLabel[language] = value; }],
              ["Forum / Team recruiting description", draft.forum.categoryTeamRecruitingDescription, (language: Locale, value: string, next: SitePageContent) => { next.forum.categoryTeamRecruitingDescription[language] = value; }],
              ["Forum / General discussion label", draft.forum.categoryGeneralDiscussionLabel, (language: Locale, value: string, next: SitePageContent) => { next.forum.categoryGeneralDiscussionLabel[language] = value; }],
              ["Forum / General discussion description", draft.forum.categoryGeneralDiscussionDescription, (language: Locale, value: string, next: SitePageContent) => { next.forum.categoryGeneralDiscussionDescription[language] = value; }],
            ].map(([title, value, updater]) => (
              <LocalizedTextEditorCard
                key={title as string}
                title={title as string}
                value={value as LocalizedText}
                onChange={(language, nextValue) =>
                  setDraft((current) =>
                    updateDraftContent(current, (next) => {
                      (updater as (language: Locale, value: string, next: SitePageContent) => void)(language, nextValue, next);
                    }),
                  )
                }
              />
            ))}
          </div>
        ) : null}

        {pageId === "sponsors" ? (
          <>
            <CopySectionEditor
              title="Sponsors / Header"
              section={draft.sponsors.header}
              onChange={(field, language, value) =>
                setDraft((current) =>
                  updateDraftContent(current, (next) => {
                    next.sponsors.header[field][language] = value;
                  }),
                )
              }
            />
            <CopySectionEditor
              title="Sponsors / Partnership"
              section={draft.sponsors.partnership}
              onChange={(field, language, value) =>
                setDraft((current) =>
                  updateDraftContent(current, (next) => {
                    next.sponsors.partnership[field][language] = value;
                  }),
                )
              }
            />
          </>
        ) : null}

        {pageId === "judges" ? (
          <>
            <CopySectionEditor
              title="Judges / Header"
              section={draft.judges.header}
              onChange={(field, language, value) =>
                setDraft((current) =>
                  updateDraftContent(current, (next) => {
                    next.judges.header[field][language] = value;
                  }),
                )
              }
            />
            <LocalizedTextEditorCard
              title="Judges / Panel size label"
              value={draft.judges.panelSizeLabel}
              onChange={(language, value) =>
                setDraft((current) =>
                  updateDraftContent(current, (next) => {
                    next.judges.panelSizeLabel[language] = value;
                  }),
                )
              }
            />
            {draft.judges.roundSections.map((section, index) => (
              <Surface key={`judge-round-section-${section.round}`} className="space-y-5 px-5 py-5 md:px-6 md:py-6">
                <BlockIntro
                  title={`Judges / ${section.round}`}
                  description="These texts appear above the judge cards for this round and in the panel-size summary card."
                />
                <LocalizedFieldEditor
                  label="Eyebrow"
                  rows={2}
                  value={section.eyebrow}
                  onChange={(language, value) =>
                    setDraft((current) =>
                      updateDraftContent(current, (next) => {
                        next.judges.roundSections[index].eyebrow[language] = value;
                      }),
                    )
                  }
                />
                <LocalizedFieldEditor
                  label="Title"
                  rows={3}
                  value={section.title}
                  onChange={(language, value) =>
                    setDraft((current) =>
                      updateDraftContent(current, (next) => {
                        next.judges.roundSections[index].title[language] = value;
                      }),
                    )
                  }
                />
                <LocalizedFieldEditor
                  label="Description"
                  rows={4}
                  value={section.description}
                  onChange={(language, value) =>
                    setDraft((current) =>
                      updateDraftContent(current, (next) => {
                        next.judges.roundSections[index].description[language] = value;
                      }),
                    )
                  }
                />
                <LocalizedFieldEditor
                  label="Panel note"
                  rows={3}
                  value={section.panelNote}
                  onChange={(language, value) =>
                    setDraft((current) =>
                      updateDraftContent(current, (next) => {
                        next.judges.roundSections[index].panelNote[language] = value;
                      }),
                    )
                  }
                />
              </Surface>
            ))}
            <CopySectionEditor
              title="Judges / Clarity"
              section={draft.judges.clarity}
              onChange={(field, language, value) =>
                setDraft((current) =>
                  updateDraftContent(current, (next) => {
                    next.judges.clarity[field][language] = value;
                  }),
                )
              }
            />
          </>
        ) : null}

        {pageId === "auth" ? (
          <CopySectionEditor
            title="Auth / Header"
            section={draft.auth.header}
            className="px-6 py-6 md:px-7 md:py-7"
            onChange={(field, language, value) =>
              setDraft((current) =>
                updateDraftContent(current, (next) => {
                  next.auth.header[field][language] = value;
                }),
              )
            }
          />
        ) : null}

        {pageId === "workspace" ? (
          <CopySectionEditor
            title="Workspace / Header"
            section={draft.workspace.header}
            onChange={(field, language, value) =>
              setDraft((current) =>
                updateDraftContent(current, (next) => {
                  next.workspace.header[field][language] = value;
                }),
              )
            }
          />
        ) : null}

        {pageId === "organizer" ? (
          <>
            <CopySectionEditor
              title="Organizer / Header"
              section={draft.organizer.header}
              onChange={(field, language, value) =>
                setDraft((current) =>
                  updateDraftContent(current, (next) => {
                    next.organizer.header[field][language] = value;
                  }),
                )
              }
            />
            <Surface className="space-y-5 px-5 py-5 md:px-6 md:py-6">
              <BlockIntro
                title="Organizer / Hero block"
                description="Edit the chips, hero card text, and the main hero image used on the organizer page."
              />
              <label className="space-y-2">
                <span className="text-sm theme-text-muted">Hero image path</span>
                <input
                  value={draft.organizer.heroImage}
                  onChange={(event) =>
                    setDraft((current) =>
                      updateDraftContent(current, (next) => {
                        next.organizer.heroImage = event.target.value;
                      }),
                    )
                  }
                  className={fieldClassName}
                />
              </label>
              <LocalizedListBlockEditor
                title="Hero chips"
                description="These chips appear below the organizer header."
                items={draft.organizer.heroBadges}
                itemLabelPrefix="Hero chip"
                rows={2}
                onChange={(itemIndex, language, value) =>
                  setDraft((current) =>
                    updateDraftContent(current, (next) => {
                      next.organizer.heroBadges[itemIndex][language] = value;
                    }),
                  )
                }
              />
              <CopySectionEditor
                title="Organizer / Hero image card"
                section={draft.organizer.heroCard}
                className="px-0 py-0 shadow-none"
                onChange={(field, language, value) =>
                  setDraft((current) =>
                    updateDraftContent(current, (next) => {
                      next.organizer.heroCard[field][language] = value;
                    }),
                  )
                }
              />
            </Surface>

            <Surface className="space-y-5 px-5 py-5 md:px-6 md:py-6">
              <BlockIntro
                title="Organizer / Metrics"
                description="These four metrics appear under the organizer hero block."
              />
              <div className="space-y-4">
                {draft.organizer.metrics.map((metric, index) => (
                  <div key={`organizer-metric-${index}`} className="rounded-[1.5rem] border theme-border px-4 py-4">
                    <div className="grid gap-4 md:grid-cols-[180px_minmax(0,1fr)]">
                      <label className="space-y-2">
                        <span className="text-sm theme-text-muted">Value</span>
                        <input
                          value={metric.value}
                          onChange={(event) =>
                            setDraft((current) =>
                              updateDraftContent(current, (next) => {
                                next.organizer.metrics[index].value = event.target.value;
                              }),
                            )
                          }
                          className={fieldClassName}
                        />
                      </label>
                      <LocalizedFieldEditor
                        label={`Metric ${index + 1} label`}
                        rows={2}
                        value={metric.label}
                        onChange={(language, value) =>
                          setDraft((current) =>
                            updateDraftContent(current, (next) => {
                              next.organizer.metrics[index].label[language] = value;
                            }),
                          )
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Surface>

            <CopySectionEditor
              title="Organizer / Season highlights"
              section={draft.organizer.contentModules}
              onChange={(field, language, value) =>
                setDraft((current) =>
                  updateDraftContent(current, (next) => {
                    next.organizer.contentModules[field][language] = value;
                  }),
                )
              }
            />

            <LocalizedTextEditorCard
              title="Organizer / Competition link label"
              value={draft.organizer.competitionLinkLabel}
              onChange={(language, value) =>
                setDraft((current) =>
                  updateDraftContent(current, (next) => {
                    next.organizer.competitionLinkLabel[language] = value;
                  }),
                )
              }
            />

            <CopySectionEditor
              title="Organizer / Photo slider heading"
              section={draft.organizer.flags}
              onChange={(field, language, value) =>
                setDraft((current) =>
                  updateDraftContent(current, (next) => {
                    next.organizer.flags[field][language] = value;
                  }),
                )
              }
            />

            <Surface className="space-y-5 px-5 py-5 md:px-6 md:py-6">
              <BlockIntro
                title="Organizer / Current frame and actions"
                description="These labels control the note card beside the photo slider and the visible action labels."
              />
              <LocalizedFieldEditor
                label="Current frame eyebrow"
                rows={2}
                value={draft.organizer.galleryCurrentFrame.eyebrow}
                onChange={(language, value) =>
                  setDraft((current) =>
                    updateDraftContent(current, (next) => {
                      next.organizer.galleryCurrentFrame.eyebrow[language] = value;
                    }),
                  )
                }
              />
              <div className="grid gap-4 xl:grid-cols-2">
                {[
                  ["Open full view label", draft.organizer.openFullViewLabel, (language: Locale, value: string, next: SitePageContent) => { next.organizer.openFullViewLabel[language] = value; }],
                  ["Previous photo label", draft.organizer.previousPhotoLabel, (language: Locale, value: string, next: SitePageContent) => { next.organizer.previousPhotoLabel[language] = value; }],
                  ["Next photo label", draft.organizer.nextPhotoLabel, (language: Locale, value: string, next: SitePageContent) => { next.organizer.nextPhotoLabel[language] = value; }],
                  ["Close gallery label", draft.organizer.closeGalleryLabel, (language: Locale, value: string, next: SitePageContent) => { next.organizer.closeGalleryLabel[language] = value; }],
                ].map(([title, value, updater]) => (
                  <LocalizedTextEditorCard
                    key={title as string}
                    title={title as string}
                    value={value as LocalizedText}
                    onChange={(language, nextValue) =>
                      setDraft((current) =>
                        updateDraftContent(current, (next) => {
                          (updater as (language: Locale, value: string, next: SitePageContent) => void)(language, nextValue, next);
                        }),
                      )
                    }
                  />
                ))}
              </div>
              <LocalizedListBlockEditor
                title="Current frame notes"
                description="These short notes appear in the side card below the current active slide."
                items={draft.organizer.galleryNotes}
                itemLabelPrefix="Note"
                rows={3}
                onChange={(itemIndex, language, value) =>
                  setDraft((current) =>
                    updateDraftContent(current, (next) => {
                      next.organizer.galleryNotes[itemIndex][language] = value;
                    }),
                  )
                }
                onAdd={() =>
                  setDraft((current) =>
                    updateDraftContent(current, (next) => {
                      next.organizer.galleryNotes.push(createBlankLocalizedText());
                    }),
                  )
                }
                addLabel={locale === "en" ? "Add note" : "Thêm ghi chú"}
                onRemove={(itemIndex) =>
                  setDraft((current) =>
                    updateDraftContent(current, (next) => {
                      next.organizer.galleryNotes = next.organizer.galleryNotes.filter(
                        (_, currentIndex) => currentIndex !== itemIndex,
                      );
                    }),
                  )
                }
                removeLabel={locale === "en" ? "Remove note" : "Xóa ghi chú"}
                minItems={1}
              />
            </Surface>

            <Surface className="space-y-5 px-5 py-5 md:px-6 md:py-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <BlockIntro
                  title="Organizer / Photo slider items"
                  description="Manage the images and text shown in the organizer photo slider."
                />
                <button
                  type="button"
                  onClick={() =>
                    setDraft((current) =>
                      updateDraftContent(current, (next) => {
                        next.organizer.gallerySlides.push(
                          createOrganizerGallerySlideDraft(next.organizer.gallerySlides.length),
                        );
                      }),
                    )
                  }
                  className="theme-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
                >
                  <Plus className="h-4 w-4" />
                  {locale === "en" ? "Add gallery image" : "Thêm ảnh slider"}
                </button>
              </div>

              <div className="space-y-4">
                {draft.organizer.gallerySlides.map((slide, index) => (
                  <Surface key={`organizer-gallery-${index}`} className="space-y-5 px-5 py-5 md:px-6 md:py-6">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-lg font-semibold theme-text-strong">
                        {locale === "en" ? `Gallery slide ${index + 1}` : `Ảnh slider ${index + 1}`}
                      </p>
                      <button
                        type="button"
                        disabled={draft.organizer.gallerySlides.length <= 1}
                        onClick={() =>
                          setDraft((current) =>
                            updateDraftContent(current, (next) => {
                              next.organizer.gallerySlides = next.organizer.gallerySlides.filter(
                                (_, currentIndex) => currentIndex !== index,
                              );
                            }),
                          )
                        }
                        className="theme-button-danger inline-flex h-10 w-10 items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label={locale === "en" ? "Delete gallery slide" : "Xóa ảnh slider"}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid gap-4 md:grid-cols-[140px_minmax(0,1fr)]">
                      <label className="space-y-2">
                        <span className="text-sm theme-text-muted">Year</span>
                        <input
                          value={slide.year}
                          onChange={(event) =>
                            setDraft((current) =>
                              updateDraftContent(current, (next) => {
                                next.organizer.gallerySlides[index].year = event.target.value;
                              }),
                            )
                          }
                          className={fieldClassName}
                        />
                      </label>
                      <label className="space-y-2">
                        <span className="text-sm theme-text-muted">Image path</span>
                        <input
                          value={slide.image}
                          onChange={(event) =>
                            setDraft((current) =>
                              updateDraftContent(current, (next) => {
                                next.organizer.gallerySlides[index].image = event.target.value;
                              }),
                            )
                          }
                          className={fieldClassName}
                        />
                      </label>
                    </div>
                    <LocalizedFieldEditor
                      label="Label"
                      rows={2}
                      value={slide.label}
                      onChange={(language, value) =>
                        setDraft((current) =>
                          updateDraftContent(current, (next) => {
                            next.organizer.gallerySlides[index].label[language] = value;
                          }),
                        )
                      }
                    />
                    <LocalizedFieldEditor
                      label="Title"
                      rows={3}
                      value={slide.title}
                      onChange={(language, value) =>
                        setDraft((current) =>
                          updateDraftContent(current, (next) => {
                            next.organizer.gallerySlides[index].title[language] = value;
                          }),
                        )
                      }
                    />
                    <LocalizedFieldEditor
                      label="Description"
                      rows={4}
                      value={slide.description}
                      onChange={(language, value) =>
                        setDraft((current) =>
                          updateDraftContent(current, (next) => {
                            next.organizer.gallerySlides[index].description[language] = value;
                          }),
                        )
                      }
                    />
                  </Surface>
                ))}
              </div>
            </Surface>
          </>
        ) : null}

        {pageId === "contact" ? (
          <>
            <Surface className="space-y-5 px-5 py-5 md:px-6 md:py-6">
              <BlockIntro
                title="Contact / Map and address"
                description="These fields control the map header, campus name, and the organizer address block. The embedded map URL stays fixed."
              />
              <LocalizedFieldEditor
                label="Map eyebrow"
                rows={2}
                value={draft.contact.mapEyebrow}
                onChange={(language, value) =>
                  setDraft((current) =>
                    updateDraftContent(current, (next) => {
                      next.contact.mapEyebrow[language] = value;
                    }),
                  )
                }
              />
              <LocalizedFieldEditor
                label="Campus name"
                rows={3}
                value={draft.contact.campusName}
                onChange={(language, value) =>
                  setDraft((current) =>
                    updateDraftContent(current, (next) => {
                      next.contact.campusName[language] = value;
                    }),
                  )
                }
              />
              <LocalizedFieldEditor
                label="Organizer address eyebrow"
                rows={2}
                value={draft.contact.organizerAddressEyebrow}
                onChange={(language, value) =>
                  setDraft((current) =>
                    updateDraftContent(current, (next) => {
                      next.contact.organizerAddressEyebrow[language] = value;
                    }),
                  )
                }
              />
              <LocalizedFieldEditor
                label="Organizer address"
                rows={4}
                value={draft.contact.organizerAddress}
                onChange={(language, value) =>
                  setDraft((current) =>
                    updateDraftContent(current, (next) => {
                      next.contact.organizerAddress[language] = value;
                    }),
                  )
                }
              />
              <LocalizedFieldEditor
                label="Organizer address note"
                rows={4}
                value={draft.contact.organizerAddressNote}
                onChange={(language, value) =>
                  setDraft((current) =>
                    updateDraftContent(current, (next) => {
                      next.contact.organizerAddressNote[language] = value;
                    }),
                  )
                }
              />
            </Surface>

            <Surface className="space-y-5 px-5 py-5 md:px-6 md:py-6">
              <BlockIntro
                title="Contact / Response rhythm and quick contacts"
                description="Edit the quick-contact labels and the values shown in the response card."
              />
              <LocalizedFieldEditor
                label="Response rhythm eyebrow"
                rows={2}
                value={draft.contact.responseRhythmEyebrow}
                onChange={(language, value) =>
                  setDraft((current) =>
                    updateDraftContent(current, (next) => {
                      next.contact.responseRhythmEyebrow[language] = value;
                    }),
                  )
                }
              />
              <LocalizedFieldEditor
                label="Response rhythm description"
                rows={4}
                value={draft.contact.responseRhythmDescription}
                onChange={(language, value) =>
                  setDraft((current) =>
                    updateDraftContent(current, (next) => {
                      next.contact.responseRhythmDescription[language] = value;
                    }),
                  )
                }
              />
              <div className="grid gap-4 xl:grid-cols-2">
                <LocalizedTextEditorCard
                  title="Contact / Official email label"
                  value={draft.contact.officialEmailLabel}
                  onChange={(language, value) =>
                    setDraft((current) =>
                      updateDraftContent(current, (next) => {
                        next.contact.officialEmailLabel[language] = value;
                      }),
                    )
                  }
                />
                <label className="space-y-2">
                  <span className="text-sm theme-text-muted">Official email value</span>
                  <input
                    value={draft.contact.officialEmailValue}
                    onChange={(event) =>
                      setDraft((current) =>
                        updateDraftContent(current, (next) => {
                          next.contact.officialEmailValue = event.target.value;
                        }),
                      )
                    }
                    className={fieldClassName}
                  />
                </label>
                <LocalizedTextEditorCard
                  title="Contact / Primary hotline label"
                  value={draft.contact.primaryHotlineLabel}
                  onChange={(language, value) =>
                    setDraft((current) =>
                      updateDraftContent(current, (next) => {
                        next.contact.primaryHotlineLabel[language] = value;
                      }),
                    )
                  }
                />
                <label className="space-y-2">
                  <span className="text-sm theme-text-muted">Primary hotline value</span>
                  <input
                    value={draft.contact.primaryHotlineValue}
                    onChange={(event) =>
                      setDraft((current) =>
                        updateDraftContent(current, (next) => {
                          next.contact.primaryHotlineValue = event.target.value;
                        }),
                      )
                    }
                    className={fieldClassName}
                  />
                </label>
                <LocalizedTextEditorCard
                  title="Contact / Support window label"
                  value={draft.contact.supportWindowLabel}
                  onChange={(language, value) =>
                    setDraft((current) =>
                      updateDraftContent(current, (next) => {
                        next.contact.supportWindowLabel[language] = value;
                      }),
                    )
                  }
                />
                <label className="space-y-2">
                  <span className="text-sm theme-text-muted">Support window value</span>
                  <input
                    value={draft.contact.supportWindowValue}
                    onChange={(event) =>
                      setDraft((current) =>
                        updateDraftContent(current, (next) => {
                          next.contact.supportWindowValue = event.target.value;
                        }),
                      )
                    }
                    className={fieldClassName}
                  />
                </label>
              </div>
            </Surface>

            <Surface className="space-y-5 px-5 py-5 md:px-6 md:py-6">
              <BlockIntro
                title="Contact / Official channels"
                description="Edit the visible labels and the Facebook URLs in the official-channels block."
              />
              <LocalizedFieldEditor
                label="Official channels eyebrow"
                rows={2}
                value={draft.contact.officialChannelsEyebrow}
                onChange={(language, value) =>
                  setDraft((current) =>
                    updateDraftContent(current, (next) => {
                      next.contact.officialChannelsEyebrow[language] = value;
                    }),
                  )
                }
              />
              <div className="grid gap-4 xl:grid-cols-2">
                <LocalizedTextEditorCard
                  title="Contact / Attacker Facebook label"
                  value={draft.contact.attackerFacebookLabel}
                  onChange={(language, value) =>
                    setDraft((current) =>
                      updateDraftContent(current, (next) => {
                        next.contact.attackerFacebookLabel[language] = value;
                      }),
                    )
                  }
                />
                <label className="space-y-2">
                  <span className="text-sm theme-text-muted">Attacker Facebook URL</span>
                  <input
                    value={draft.contact.attackerFacebookUrl}
                    onChange={(event) =>
                      setDraft((current) =>
                        updateDraftContent(current, (next) => {
                          next.contact.attackerFacebookUrl = event.target.value;
                        }),
                      )
                    }
                    className={fieldClassName}
                  />
                </label>
                <LocalizedTextEditorCard
                  title="Contact / FTC Facebook label"
                  value={draft.contact.ftcFacebookLabel}
                  onChange={(language, value) =>
                    setDraft((current) =>
                      updateDraftContent(current, (next) => {
                        next.contact.ftcFacebookLabel[language] = value;
                      }),
                    )
                  }
                />
                <label className="space-y-2">
                  <span className="text-sm theme-text-muted">FTC Facebook URL</span>
                  <input
                    value={draft.contact.ftcFacebookUrl}
                    onChange={(event) =>
                      setDraft((current) =>
                        updateDraftContent(current, (next) => {
                          next.contact.ftcFacebookUrl = event.target.value;
                        }),
                      )
                    }
                    className={fieldClassName}
                  />
                </label>
                <LocalizedTextEditorCard
                  title="Contact / Open newsroom label"
                  value={draft.contact.openNewsroomLabel}
                  onChange={(language, value) =>
                    setDraft((current) =>
                      updateDraftContent(current, (next) => {
                        next.contact.openNewsroomLabel[language] = value;
                      }),
                    )
                  }
                />
              </div>
            </Surface>

            <Surface className="space-y-5 px-5 py-5 md:px-6 md:py-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <BlockIntro
                  title="Contact / Phone contacts"
                  description="Manage the contact people listed below the map. Each card includes name, displayed phone, raw tel link, and support scope."
                />
                <button
                  type="button"
                  onClick={() =>
                    setDraft((current) =>
                      updateDraftContent(current, (next) => {
                        next.contact.phoneContacts.push(
                          createPhoneContactDraft(next.contact.phoneContacts.length),
                        );
                      }),
                    )
                  }
                  className="theme-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
                >
                  <Plus className="h-4 w-4" />
                  {locale === "en" ? "Add phone contact" : "Thêm đầu mối"}
                </button>
              </div>
              <LocalizedTextEditorCard
                title="Contact / Phone contacts eyebrow"
                value={draft.contact.phoneContactsEyebrow}
                onChange={(language, value) =>
                  setDraft((current) =>
                    updateDraftContent(current, (next) => {
                      next.contact.phoneContactsEyebrow[language] = value;
                    }),
                  )
                }
              />
              <div className="space-y-4">
                {draft.contact.phoneContacts.map((item, index) => (
                  <Surface key={`phone-contact-${index}`} className="space-y-5 px-5 py-5 md:px-6 md:py-6">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-lg font-semibold theme-text-strong">
                        {locale === "en" ? `Phone contact ${index + 1}` : `Đầu mối ${index + 1}`}
                      </p>
                      <button
                        type="button"
                        disabled={draft.contact.phoneContacts.length <= 1}
                        onClick={() =>
                          setDraft((current) =>
                            updateDraftContent(current, (next) => {
                              next.contact.phoneContacts = next.contact.phoneContacts.filter(
                                (_, currentIndex) => currentIndex !== index,
                              );
                            }),
                          )
                        }
                        className="theme-button-danger inline-flex h-10 w-10 items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label={locale === "en" ? "Delete phone contact" : "Xóa đầu mối"}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid gap-4 xl:grid-cols-3">
                      <label className="space-y-2">
                        <span className="text-sm theme-text-muted">Name</span>
                        <input
                          value={item.name}
                          onChange={(event) =>
                            setDraft((current) =>
                              updateDraftContent(current, (next) => {
                                next.contact.phoneContacts[index].name = event.target.value;
                              }),
                            )
                          }
                          className={fieldClassName}
                        />
                      </label>
                      <label className="space-y-2">
                        <span className="text-sm theme-text-muted">Display phone</span>
                        <input
                          value={item.phone}
                          onChange={(event) =>
                            setDraft((current) =>
                              updateDraftContent(current, (next) => {
                                next.contact.phoneContacts[index].phone = event.target.value;
                              }),
                            )
                          }
                          className={fieldClassName}
                        />
                      </label>
                      <label className="space-y-2">
                        <span className="text-sm theme-text-muted">Tel link value</span>
                        <input
                          value={item.tel}
                          onChange={(event) =>
                            setDraft((current) =>
                              updateDraftContent(current, (next) => {
                                next.contact.phoneContacts[index].tel = event.target.value;
                              }),
                            )
                          }
                          className={fieldClassName}
                        />
                      </label>
                    </div>
                    <LocalizedFieldEditor
                      label="Responsibility"
                      rows={3}
                      value={item.responsibility}
                      onChange={(language, value) =>
                        setDraft((current) =>
                          updateDraftContent(current, (next) => {
                            next.contact.phoneContacts[index].responsibility[language] = value;
                          }),
                        )
                      }
                    />
                  </Surface>
                ))}
              </div>
            </Surface>
          </>
        ) : null}

        {pageId === "footer" ? (
          <>
            <Surface className="space-y-5 px-5 py-5 md:px-6 md:py-6">
              <BlockIntro
                title="Footer / Brand logo and text"
                description="Edit only the brand lockup shown in the footer. Header branding stays separate."
              />
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
                <div className="rounded-[1.6rem] border theme-border theme-panel-subtle px-4 py-4">
                  <p className="text-sm font-semibold theme-text-strong">
                    {locale === "en" ? "Footer brand preview" : "Xem trước brand footer"}
                  </p>
                  <div className="mt-4 flex items-center gap-3 rounded-[1.35rem] border theme-border bg-white/82 px-4 py-4 dark:bg-white/[0.05]">
                    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl border border-white/25 shadow-[0_16px_36px_rgba(23,114,208,0.18)]">
                      <Image
                        src={footerBrandImage}
                        alt={pickText(locale, draft.footer.brandTitle)}
                        fill
                        sizes="44px"
                        unoptimized={footerBrandImage.startsWith("/api/content-images/")}
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="theme-eyebrow text-[0.72rem] font-semibold uppercase tracking-[0.34em]">
                        {pickText(locale, draft.footer.brandTitle)}
                      </p>
                      <p className="theme-heading text-sm theme-text-soft">
                        {pickText(locale, draft.footer.brandSubtitle)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 rounded-[1.6rem] border theme-border theme-panel-subtle px-4 py-4">
                  <label className="space-y-2">
                    <span className="text-sm theme-text-muted">
                      {locale === "en" ? "Current logo image source" : "Nguồn ảnh logo hiện tại"}
                    </span>
                    <input
                      value={footerBrandImage}
                      onChange={(event) =>
                        setDraft((current) =>
                          updateDraftContent(current, (next) => {
                            next.footer.brandLogoImage = event.target.value;
                          }),
                        )
                      }
                      className={fieldClassName}
                    />
                  </label>

                  <div className="flex flex-wrap gap-2">
                    <label className="theme-button-primary inline-flex cursor-pointer items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold">
                      <Upload className="h-4 w-4" />
                      {isUploadingFooterBrandImage
                        ? locale === "en"
                          ? "Uploading..."
                          : "Đang tải..."
                        : locale === "en"
                          ? "Upload logo"
                          : "Tải logo"}
                      <input
                        type="file"
                        accept="image/jpeg,.jpg,.jpeg"
                        className="hidden"
                        disabled={isUploadingFooterBrandImage}
                        onChange={async (event: ChangeEvent<HTMLInputElement>) => {
                          const file = event.target.files?.[0];
                          event.target.value = "";
                          if (!file) {
                            return;
                          }

                          const validationError = getFooterBrandImageValidationError(file);
                          if (validationError === "type") {
                            setFooterBrandImageUploadError(
                              locale === "en"
                                ? "Only JPG images are allowed for the footer logo."
                                : "Chỉ chấp nhận ảnh JPG cho logo footer.",
                            );
                            return;
                          }

                          if (validationError === "size") {
                            setFooterBrandImageUploadError(
                              locale === "en"
                                ? `Footer logo JPG images must be ${formatFileSize(MAX_FOOTER_BRAND_IMAGE_BYTES)} or smaller.`
                                : `Ảnh logo footer phải có dung lượng ${formatFileSize(MAX_FOOTER_BRAND_IMAGE_BYTES)} trở xuống.`,
                            );
                            return;
                          }

                          const formData = new FormData();
                          formData.append("imageFile", file);
                          setFooterBrandImageUploadError("");
                          setIsUploadingFooterBrandImage(true);

                          try {
                            const response = await fetch("/api/admin/content/footer/brand-image", {
                              method: "POST",
                              body: formData,
                            });
                            const payload = (await response.json().catch(() => null)) as
                              | { imageUrl?: string; error?: string }
                              | null;

                            if (!response.ok || !payload?.imageUrl) {
                              throw new Error(
                                payload?.error ||
                                  (locale === "en"
                                    ? "The footer logo could not be uploaded."
                                    : "Không thể tải logo footer."),
                              );
                            }

                            setDraft((current) =>
                              updateDraftContent(current, (next) => {
                                next.footer.brandLogoImage = payload.imageUrl!;
                              }),
                            );
                          } catch (error) {
                            setFooterBrandImageUploadError(
                              error instanceof Error
                                ? error.message
                                : locale === "en"
                                  ? "The footer logo could not be uploaded."
                                  : "Không thể tải logo footer.",
                            );
                          } finally {
                            setIsUploadingFooterBrandImage(false);
                          }
                        }}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        setFooterBrandImageUploadError("");
                        setDraft((current) =>
                          updateDraftContent(current, (next) => {
                            next.footer.brandLogoImage = DEFAULT_FOOTER_BRAND_IMAGE;
                          }),
                        );
                      }}
                      className="theme-button-secondary inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold"
                    >
                      <Trash2 className="h-4 w-4" />
                      {locale === "en" ? "Use demo" : "Dùng ảnh demo"}
                    </button>
                  </div>

                  <p className="text-xs leading-6 theme-text-soft">
                    {locale === "en"
                      ? `Accepted format: JPG only. Maximum size: ${formatFileSize(MAX_FOOTER_BRAND_IMAGE_BYTES)}. After uploading, click Save content to publish the new logo.`
                      : `Chỉ chấp nhận JPG. Dung lượng tối đa: ${formatFileSize(MAX_FOOTER_BRAND_IMAGE_BYTES)}. Sau khi tải ảnh, bấm Lưu nội dung để cập nhật logo.`}
                  </p>

                  {footerBrandImageUploadError ? (
                    <div className="rounded-[1.2rem] border border-rose-300/55 bg-rose-50/82 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-200/20 dark:bg-rose-300/10 dark:text-rose-100">
                      {footerBrandImageUploadError}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <LocalizedFieldEditor
                  label="Footer brand title"
                  rows={2}
                  value={draft.footer.brandTitle}
                  onChange={(language, value) =>
                    setDraft((current) =>
                      updateDraftContent(current, (next) => {
                        next.footer.brandTitle[language] = value;
                      }),
                    )
                  }
                />
                <LocalizedFieldEditor
                  label="Footer brand subtitle"
                  rows={2}
                  value={draft.footer.brandSubtitle}
                  onChange={(language, value) =>
                    setDraft((current) =>
                      updateDraftContent(current, (next) => {
                        next.footer.brandSubtitle[language] = value;
                      }),
                    )
                  }
                />
              </div>
            </Surface>

            <Surface className="space-y-5 px-5 py-5 md:px-6 md:py-6">
              <BlockIntro
                title="Footer / Main copy"
                description="Edit the brand description, CTA, column headings, timeline link, and copyright text shown in the global footer."
              />
              <LocalizedFieldEditor
                label="Footer description"
                rows={5}
                value={draft.footer.description}
                onChange={(language, value) =>
                  setDraft((current) =>
                    updateDraftContent(current, (next) => {
                      next.footer.description[language] = value;
                    }),
                  )
                }
              />
              <div className="grid gap-4 xl:grid-cols-2">
                {[
                  ["CTA label", draft.footer.ctaLabel, (language: Locale, value: string, next: SitePageContent) => { next.footer.ctaLabel[language] = value; }],
                  ["Navigate heading", draft.footer.navigateHeading, (language: Locale, value: string, next: SitePageContent) => { next.footer.navigateHeading[language] = value; }],
                  ["Contact heading", draft.footer.contactHeading, (language: Locale, value: string, next: SitePageContent) => { next.footer.contactHeading[language] = value; }],
                  ["Attacker Facebook label", draft.footer.attackerFacebookLabel, (language: Locale, value: string, next: SitePageContent) => { next.footer.attackerFacebookLabel[language] = value; }],
                  ["FTC Facebook label", draft.footer.ftcFacebookLabel, (language: Locale, value: string, next: SitePageContent) => { next.footer.ftcFacebookLabel[language] = value; }],
                  ["Snapshot heading", draft.footer.snapshotHeading, (language: Locale, value: string, next: SitePageContent) => { next.footer.snapshotHeading[language] = value; }],
                  ["Timeline link label", draft.footer.timelineLinkLabel, (language: Locale, value: string, next: SitePageContent) => { next.footer.timelineLinkLabel[language] = value; }],
                  ["Copyright", draft.footer.copyright, (language: Locale, value: string, next: SitePageContent) => { next.footer.copyright[language] = value; }],
                ].map(([title, value, updater]) => (
                  <LocalizedTextEditorCard
                    key={title as string}
                    title={`Footer / ${title as string}`}
                    value={value as LocalizedText}
                    onChange={(language, nextValue) =>
                      setDraft((current) =>
                        updateDraftContent(current, (next) => {
                          (updater as (language: Locale, value: string, next: SitePageContent) => void)(language, nextValue, next);
                        }),
                      )
                    }
                  />
                ))}
              </div>
            </Surface>

            <Surface className="space-y-5 px-5 py-5 md:px-6 md:py-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <BlockIntro
                  title="Footer / Competition snapshot"
                  description="These cards appear in the right column of the footer."
                />
                <button
                  type="button"
                  onClick={() =>
                    setDraft((current) =>
                      updateDraftContent(current, (next) => {
                        next.footer.snapshotItems.push({
                          label: createBlankLocalizedText(),
                          value: createBlankLocalizedText(),
                        });
                      }),
                    )
                  }
                  className="theme-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
                >
                  <Plus className="h-4 w-4" />
                  {locale === "en" ? "Add snapshot item" : "Thêm mục tóm tắt"}
                </button>
              </div>
              <div className="space-y-4">
                {draft.footer.snapshotItems.map((item, index) => (
                  <Surface key={`footer-snapshot-${index}`} className="space-y-5 px-5 py-5 md:px-6 md:py-6">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-lg font-semibold theme-text-strong">
                        {locale === "en" ? `Snapshot item ${index + 1}` : `Mục tóm tắt ${index + 1}`}
                      </p>
                      <button
                        type="button"
                        disabled={draft.footer.snapshotItems.length <= 1}
                        onClick={() =>
                          setDraft((current) =>
                            updateDraftContent(current, (next) => {
                              next.footer.snapshotItems = next.footer.snapshotItems.filter(
                                (_, currentIndex) => currentIndex !== index,
                              );
                            }),
                          )
                        }
                        className="theme-button-danger inline-flex h-10 w-10 items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label={locale === "en" ? "Delete snapshot item" : "Xóa mục tóm tắt"}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <LocalizedFieldEditor
                      label="Snapshot label"
                      rows={2}
                      value={item.label}
                      onChange={(language, value) =>
                        setDraft((current) =>
                          updateDraftContent(current, (next) => {
                            next.footer.snapshotItems[index].label[language] = value;
                          }),
                        )
                      }
                    />
                    <LocalizedFieldEditor
                      label="Snapshot value"
                      rows={3}
                      value={item.value}
                      onChange={(language, value) =>
                        setDraft((current) =>
                          updateDraftContent(current, (next) => {
                            next.footer.snapshotItems[index].value[language] = value;
                          }),
                        )
                      }
                    />
                  </Surface>
                ))}
              </div>
            </Surface>
          </>
        ) : null}

        {pageId === "timeline" ? (
          <>
            <Surface className="space-y-5 px-5 py-5 md:px-6 md:py-6">
              <BlockIntro
                title="Timeline / Diagram and shared labels"
                description="These labels appear in the top timeline diagram, card status badges, and timeline action buttons."
              />
              <div className="space-y-4">
                {[
                  ["Timeline / Diagram eyebrow", draft.timelinePage.diagramEyebrow, (language: Locale, value: string, next: SitePageContent) => { next.timelinePage.diagramEyebrow[language] = value; }],
                  ["Timeline / Diagram hint", draft.timelinePage.diagramHint, (language: Locale, value: string, next: SitePageContent) => { next.timelinePage.diagramHint[language] = value; }],
                  ["Timeline / Schedule fallback", draft.timelinePage.scheduleToBeUpdated, (language: Locale, value: string, next: SitePageContent) => { next.timelinePage.scheduleToBeUpdated[language] = value; }],
                  ["Timeline / Steps label", draft.timelinePage.stepsLabel, (language: Locale, value: string, next: SitePageContent) => { next.timelinePage.stepsLabel[language] = value; }],
                  ["Timeline / Open detail", draft.timelinePage.openDetailLabel, (language: Locale, value: string, next: SitePageContent) => { next.timelinePage.openDetailLabel[language] = value; }],
                  ["Timeline / Open rule block", draft.timelinePage.openRuleBlockLabel, (language: Locale, value: string, next: SitePageContent) => { next.timelinePage.openRuleBlockLabel[language] = value; }],
                  ["Timeline / Read result update", draft.timelinePage.readResultUpdateLabel, (language: Locale, value: string, next: SitePageContent) => { next.timelinePage.readResultUpdateLabel[language] = value; }],
                  ["Timeline / Finalist results button", draft.timelinePage.finalistResultsLabel, (language: Locale, value: string, next: SitePageContent) => { next.timelinePage.finalistResultsLabel[language] = value; }],
                  ["Timeline / Emerging results button", draft.timelinePage.emergingResultsLabel, (language: Locale, value: string, next: SitePageContent) => { next.timelinePage.emergingResultsLabel[language] = value; }],
                  ["Timeline / Round 2 closed title", draft.timelinePage.round2SubmissionClosedTitle, (language: Locale, value: string, next: SitePageContent) => { next.timelinePage.round2SubmissionClosedTitle[language] = value; }],
                  ["Timeline / Final report closed title", draft.timelinePage.finalReportClosedTitle, (language: Locale, value: string, next: SitePageContent) => { next.timelinePage.finalReportClosedTitle[language] = value; }],
                  ["Timeline / Time label", draft.timelinePage.timeLabel, (language: Locale, value: string, next: SitePageContent) => { next.timelinePage.timeLabel[language] = value; }],
                  ["Timeline / Place label", draft.timelinePage.placeLabel, (language: Locale, value: string, next: SitePageContent) => { next.timelinePage.placeLabel[language] = value; }],
                  ["Timeline / Method label", draft.timelinePage.methodLabel, (language: Locale, value: string, next: SitePageContent) => { next.timelinePage.methodLabel[language] = value; }],
                  ["Timeline / Now label", draft.timelinePage.nowLabel, (language: Locale, value: string, next: SitePageContent) => { next.timelinePage.nowLabel[language] = value; }],
                  ["Timeline / Finished label", draft.timelinePage.finishedLabel, (language: Locale, value: string, next: SitePageContent) => { next.timelinePage.finishedLabel[language] = value; }],
                  ["Timeline / Ongoing label", draft.timelinePage.ongoingLabel, (language: Locale, value: string, next: SitePageContent) => { next.timelinePage.ongoingLabel[language] = value; }],
                  ["Timeline / Starting soon label", draft.timelinePage.startingSoonLabel, (language: Locale, value: string, next: SitePageContent) => { next.timelinePage.startingSoonLabel[language] = value; }],
                  ["Timeline / Not started label", draft.timelinePage.notStartedLabel, (language: Locale, value: string, next: SitePageContent) => { next.timelinePage.notStartedLabel[language] = value; }],
                  ["Timeline / Ends in prefix", draft.timelinePage.endsInPrefix, (language: Locale, value: string, next: SitePageContent) => { next.timelinePage.endsInPrefix[language] = value; }],
                  ["Timeline / Starts in prefix", draft.timelinePage.startsInPrefix, (language: Locale, value: string, next: SitePageContent) => { next.timelinePage.startsInPrefix[language] = value; }],
                  ["Timeline / Countdown day unit", draft.timelinePage.countdownDayUnit, (language: Locale, value: string, next: SitePageContent) => { next.timelinePage.countdownDayUnit[language] = value; }],
                  ["Timeline / Create account action", draft.timelinePage.createAccountActionLabel, (language: Locale, value: string, next: SitePageContent) => { next.timelinePage.createAccountActionLabel[language] = value; }],
                  ["Timeline / Registration team lock title override", draft.timelinePage.registrationTeamLockTitle, (language: Locale, value: string, next: SitePageContent) => { next.timelinePage.registrationTeamLockTitle[language] = value; }],
                  ["Timeline / Eligibility modal eyebrow", draft.timelinePage.eligibilityCheckLabel, (language: Locale, value: string, next: SitePageContent) => { next.timelinePage.eligibilityCheckLabel[language] = value; }],
                  ["Timeline / Close eligibility modal label", draft.timelinePage.closeEligibilityMessageLabel, (language: Locale, value: string, next: SitePageContent) => { next.timelinePage.closeEligibilityMessageLabel[language] = value; }],
                  ["Timeline / Eligibility modal confirm button", draft.timelinePage.gotItLabel, (language: Locale, value: string, next: SitePageContent) => { next.timelinePage.gotItLabel[language] = value; }],
                ].map(([title, value, updater]) => (
                  <LocalizedTextEditorCard
                    key={title as string}
                    title={title as string}
                    value={value as LocalizedText}
                    onChange={(language, nextValue) =>
                      setDraft((current) =>
                        updateDraftContent(current, (next) => {
                          (updater as (language: Locale, value: string, next: SitePageContent) => void)(language, nextValue, next);
                        }),
                      )
                    }
                  />
                ))}
              </div>
            </Surface>

            <Surface className="space-y-5 px-5 py-5 md:px-6 md:py-6">
              <BlockIntro
                title="Timeline / Eligibility check messages"
                description="These messages appear in the eligibility-check modal opened from the preparation timeline step. Dynamic placeholders use {minMembers} and {currentMembers}."
              />
              <div className="space-y-4">
                {[
                  ["Sign-in required title", draft.timelinePage.eligibilitySignInTitle, (language: Locale, value: string, next: SitePageContent) => { next.timelinePage.eligibilitySignInTitle[language] = value; }],
                  ["Sign-in required description", draft.timelinePage.eligibilitySignInDescription, (language: Locale, value: string, next: SitePageContent) => { next.timelinePage.eligibilitySignInDescription[language] = value; }],
                  ["Sign-in required reason", draft.timelinePage.eligibilitySignInReason, (language: Locale, value: string, next: SitePageContent) => { next.timelinePage.eligibilitySignInReason[language] = value; }],
                  ["Wrong account role title", draft.timelinePage.eligibilityWrongRoleTitle, (language: Locale, value: string, next: SitePageContent) => { next.timelinePage.eligibilityWrongRoleTitle[language] = value; }],
                  ["Wrong account role description", draft.timelinePage.eligibilityWrongRoleDescription, (language: Locale, value: string, next: SitePageContent) => { next.timelinePage.eligibilityWrongRoleDescription[language] = value; }],
                  ["Wrong account role reason", draft.timelinePage.eligibilityWrongRoleReason, (language: Locale, value: string, next: SitePageContent) => { next.timelinePage.eligibilityWrongRoleReason[language] = value; }],
                  ["No team title", draft.timelinePage.eligibilityNoTeamTitle, (language: Locale, value: string, next: SitePageContent) => { next.timelinePage.eligibilityNoTeamTitle[language] = value; }],
                  ["No team description", draft.timelinePage.eligibilityNoTeamDescription, (language: Locale, value: string, next: SitePageContent) => { next.timelinePage.eligibilityNoTeamDescription[language] = value; }],
                  ["No team reason", draft.timelinePage.eligibilityNoTeamReason, (language: Locale, value: string, next: SitePageContent) => { next.timelinePage.eligibilityNoTeamReason[language] = value; }],
                  ["Already advanced title", draft.timelinePage.eligibilityAdvancedTitle, (language: Locale, value: string, next: SitePageContent) => { next.timelinePage.eligibilityAdvancedTitle[language] = value; }],
                  ["Already advanced description", draft.timelinePage.eligibilityAdvancedDescription, (language: Locale, value: string, next: SitePageContent) => { next.timelinePage.eligibilityAdvancedDescription[language] = value; }],
                  ["Eligible title", draft.timelinePage.eligibilityEligibleTitle, (language: Locale, value: string, next: SitePageContent) => { next.timelinePage.eligibilityEligibleTitle[language] = value; }],
                  ["Eligible description", draft.timelinePage.eligibilityEligibleDescription, (language: Locale, value: string, next: SitePageContent) => { next.timelinePage.eligibilityEligibleDescription[language] = value; }],
                  ["Minimum members met reason", draft.timelinePage.eligibilityMinMembersMetReason, (language: Locale, value: string, next: SitePageContent) => { next.timelinePage.eligibilityMinMembersMetReason[language] = value; }],
                  ["Team lock completed reason", draft.timelinePage.eligibilityTeamLockCompletedReason, (language: Locale, value: string, next: SitePageContent) => { next.timelinePage.eligibilityTeamLockCompletedReason[language] = value; }],
                  ["Round 1 available reason", draft.timelinePage.eligibilityRound1AvailableReason, (language: Locale, value: string, next: SitePageContent) => { next.timelinePage.eligibilityRound1AvailableReason[language] = value; }],
                  ["Minimum members missing reason", draft.timelinePage.eligibilityMinMembersMissingReason, (language: Locale, value: string, next: SitePageContent) => { next.timelinePage.eligibilityMinMembersMissingReason[language] = value; }],
                  ["Team lock missing reason", draft.timelinePage.eligibilityTeamLockMissingReason, (language: Locale, value: string, next: SitePageContent) => { next.timelinePage.eligibilityTeamLockMissingReason[language] = value; }],
                  ["Round 1 closed reason", draft.timelinePage.eligibilityRound1ClosedReason, (language: Locale, value: string, next: SitePageContent) => { next.timelinePage.eligibilityRound1ClosedReason[language] = value; }],
                  ["Not ready title", draft.timelinePage.eligibilityNotReadyTitle, (language: Locale, value: string, next: SitePageContent) => { next.timelinePage.eligibilityNotReadyTitle[language] = value; }],
                  ["Not ready description", draft.timelinePage.eligibilityNotReadyDescription, (language: Locale, value: string, next: SitePageContent) => { next.timelinePage.eligibilityNotReadyDescription[language] = value; }],
                  ["Round 1 unavailable fallback reason", draft.timelinePage.eligibilityRound1UnavailableReason, (language: Locale, value: string, next: SitePageContent) => { next.timelinePage.eligibilityRound1UnavailableReason[language] = value; }],
                ].map(([title, value, updater]) => (
                  <LocalizedTextEditorCard
                    key={title as string}
                    title={`Timeline / Eligibility / ${title as string}`}
                    value={value as LocalizedText}
                    rows={2}
                    onChange={(language, nextValue) =>
                      setDraft((current) =>
                        updateDraftContent(current, (next) => {
                          (updater as (language: Locale, value: string, next: SitePageContent) => void)(language, nextValue, next);
                        }),
                      )
                    }
                  />
                ))}
              </div>
            </Surface>

            <CopySectionEditor
              title="Timeline / Preparation phase"
              section={draft.timelinePage.general}
              onChange={(field, language, value) =>
                setDraft((current) =>
                  updateDraftContent(current, (next) => {
                    next.timelinePage.general[field][language] = value;
                  }),
                )
              }
            />
            <CopySectionEditor
              title="Timeline / Round 1 phase"
              section={draft.timelinePage.round1}
              onChange={(field, language, value) =>
                setDraft((current) =>
                  updateDraftContent(current, (next) => {
                    next.timelinePage.round1[field][language] = value;
                  }),
                )
              }
            />
            <CopySectionEditor
              title="Timeline / Round 2 phase"
              section={draft.timelinePage.round2}
              onChange={(field, language, value) =>
                setDraft((current) =>
                  updateDraftContent(current, (next) => {
                    next.timelinePage.round2[field][language] = value;
                  }),
                )
              }
            />
            <CopySectionEditor
              title="Timeline / Round 3 phase"
              section={draft.timelinePage.round3}
              onChange={(field, language, value) =>
                setDraft((current) =>
                  updateDraftContent(current, (next) => {
                    next.timelinePage.round3[field][language] = value;
                  }),
                )
              }
            />
            <CopySectionEditor
              title="Timeline / Round 3 presentation and awards subsection"
              section={draft.timelinePage.round3Presentation}
              onChange={(field, language, value) =>
                setDraft((current) =>
                  updateDraftContent(current, (next) => {
                    next.timelinePage.round3Presentation[field][language] = value;
                  }),
                )
              }
            />
            <Surface className="space-y-5 px-5 py-5 md:px-6 md:py-6">
              <BlockIntro
                title="Timeline / Step cards"
                description="Edit every public text on each timeline step card: title, description, place, method, and action-link labels. Dates and times stay in Admin / Timeline."
              />
              <div className="space-y-5">
                {timelineDraft.map((item) => (
                  <div key={item.id} className="space-y-4 rounded-[1.5rem] border theme-border px-4 py-4">
                    <div>
                      <p className="text-sm font-semibold theme-text-strong">
                        {pickText(locale, item.title)}
                      </p>
                      <p className="mt-1 text-xs theme-text-soft">{item.id}</p>
                    </div>
                    <LocalizedFieldEditor
                      label="Title"
                      value={item.title}
                      rows={2}
                      onChange={(language, value) => updateTimelineItemText(item.id, "title", language, value)}
                    />
                    <LocalizedFieldEditor
                      label="Description"
                      value={item.description}
                      rows={3}
                      onChange={(language, value) => updateTimelineItemText(item.id, "description", language, value)}
                    />
                    <LocalizedFieldEditor
                      label="Place"
                      value={item.location}
                      rows={2}
                      onChange={(language, value) => updateTimelineItemText(item.id, "location", language, value)}
                    />
                    <LocalizedFieldEditor
                      label="Method"
                      value={item.method}
                      rows={2}
                      onChange={(language, value) => updateTimelineItemText(item.id, "method", language, value)}
                    />
                    {(item.supportLinks ?? []).length > 0 ? (
                      <div className="space-y-3">
                        <p className="text-sm font-semibold theme-text-strong">Action link labels</p>
                        {(item.supportLinks ?? []).map((link, linkIndex) => (
                          <div key={`${item.id}-link-${linkIndex}`} className="rounded-[1.25rem] border theme-border px-3 py-3">
                            <p className="mb-3 text-xs theme-text-soft">{link.href}</p>
                            <LocalizedFieldEditor
                              label={`Action link ${linkIndex + 1}`}
                              value={link.label}
                              rows={1}
                              onChange={(language, value) =>
                                updateTimelineSupportLinkLabel(item.id, linkIndex, language, value)
                              }
                            />
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </Surface>
          </>
        ) : null}

        {pageId === "round-1-results" ? (
          <>
            <CopySectionEditor
              title="Round 1 results / Published header"
              section={draft.round1Results.releasedHeader}
              onChange={(field, language, value) =>
                setDraft((current) =>
                  updateDraftContent(current, (next) => {
                    next.round1Results.releasedHeader[field][language] = value;
                  }),
                )
              }
            />
            <CopySectionEditor
              title="Round 1 results / Waiting header"
              section={draft.round1Results.unreleasedHeader}
              onChange={(field, language, value) =>
                setDraft((current) =>
                  updateDraftContent(current, (next) => {
                    next.round1Results.unreleasedHeader[field][language] = value;
                  }),
                )
              }
            />
            <CopySectionEditor
              title="Round 1 results / Empty published state"
              section={draft.round1Results.emptyState}
              onChange={(field, language, value) =>
                setDraft((current) =>
                  updateDraftContent(current, (next) => {
                    next.round1Results.emptyState[field][language] = value;
                  }),
                )
              }
            />
            <CopySectionEditor
              title="Round 1 results / Result list intro"
              section={draft.round1Results.listHeader}
              onChange={(field, language, value) =>
                setDraft((current) =>
                  updateDraftContent(current, (next) => {
                    next.round1Results.listHeader[field][language] = value;
                  }),
                )
              }
            />
            <CopySectionEditor
              title="Round 1 results / No search match"
              section={draft.round1Results.noSearchResults}
              onChange={(field, language, value) =>
                setDraft((current) =>
                  updateDraftContent(current, (next) => {
                    next.round1Results.noSearchResults[field][language] = value;
                  }),
                )
              }
            />

            <Surface className="space-y-5 px-5 py-5 md:px-6 md:py-6">
              <BlockIntro
                title="Round 1 results / Labels and short messages"
                description="Edit every small label, button text, table label, loading text, and helper message used by the Round 1 results page."
              />
              <div className="grid gap-4 xl:grid-cols-2">
                {[
                  ["Loading message", draft.round1Results.loadingLabel, (language: Locale, value: string, next: SitePageContent) => { next.round1Results.loadingLabel[language] = value; }],
                  ["Error message", draft.round1Results.errorLabel, (language: Locale, value: string, next: SitePageContent) => { next.round1Results.errorLabel[language] = value; }],
                  ["To be announced label", draft.round1Results.toBeAnnouncedLabel, (language: Locale, value: string, next: SitePageContent) => { next.round1Results.toBeAnnouncedLabel[language] = value; }],
                  ["Announcement date label", draft.round1Results.announcementDateLabel, (language: Locale, value: string, next: SitePageContent) => { next.round1Results.announcementDateLabel[language] = value; }],
                  ["Waiting notice", draft.round1Results.waitingNotice, (language: Locale, value: string, next: SitePageContent) => { next.round1Results.waitingNotice[language] = value; }],
                  ["View timeline button", draft.round1Results.viewTimelineLabel, (language: Locale, value: string, next: SitePageContent) => { next.round1Results.viewTimelineLabel[language] = value; }],
                  ["Open news button", draft.round1Results.openNewsLabel, (language: Locale, value: string, next: SitePageContent) => { next.round1Results.openNewsLabel[language] = value; }],
                  ["Admin preview title", draft.round1Results.adminPreviewTitle, (language: Locale, value: string, next: SitePageContent) => { next.round1Results.adminPreviewTitle[language] = value; }],
                  ["Admin preview description", draft.round1Results.adminPreviewDescription, (language: Locale, value: string, next: SitePageContent) => { next.round1Results.adminPreviewDescription[language] = value; }],
                  ["Search placeholder", draft.round1Results.searchPlaceholder, (language: Locale, value: string, next: SitePageContent) => { next.round1Results.searchPlaceholder[language] = value; }],
                  ["Team column label", draft.round1Results.teamColumnLabel, (language: Locale, value: string, next: SitePageContent) => { next.round1Results.teamColumnLabel[language] = value; }],
                  ["Members column label", draft.round1Results.membersColumnLabel, (language: Locale, value: string, next: SitePageContent) => { next.round1Results.membersColumnLabel[language] = value; }],
                  ["Members suffix", draft.round1Results.membersSuffix, (language: Locale, value: string, next: SitePageContent) => { next.round1Results.membersSuffix[language] = value; }],
                  ["Leader label", draft.round1Results.leaderLabel, (language: Locale, value: string, next: SitePageContent) => { next.round1Results.leaderLabel[language] = value; }],
                  ["Missing university label", draft.round1Results.universityMissingLabel, (language: Locale, value: string, next: SitePageContent) => { next.round1Results.universityMissingLabel[language] = value; }],
                ].map(([title, value, updater]) => (
                  <LocalizedTextEditorCard
                    key={title as string}
                    title={title as string}
                    value={value as LocalizedText}
                    rows={title === "Waiting notice" || title === "Admin preview description" || title === "Error message" ? 3 : 2}
                    onChange={(language, nextValue) =>
                      setDraft((current) =>
                        updateDraftContent(current, (next) => {
                          (updater as (language: Locale, value: string, next: SitePageContent) => void)(
                            language,
                            nextValue,
                            next,
                          );
                        }),
                      )
                    }
                  />
                ))}
              </div>
            </Surface>
          </>
        ) : null}

        {pageId === "finalists" ? (
          <>
            <CopySectionEditor
              title="Finalists / Finalist teams"
              section={draft.finalists.finalistsHeader}
              onChange={(field, language, value) =>
                setDraft((current) =>
                  updateDraftContent(current, (next) => {
                    next.finalists.finalistsHeader[field][language] = value;
                  }),
                )
              }
            />
            <CopySectionEditor
              title="Finalists / Emerging teams"
              section={draft.finalists.emergingHeader}
              onChange={(field, language, value) =>
                setDraft((current) =>
                  updateDraftContent(current, (next) => {
                    next.finalists.emergingHeader[field][language] = value;
                  }),
                )
              }
            />
            <Surface className="space-y-5 px-5 py-5 md:px-6 md:py-6">
              <BlockIntro
                title="Finalists / Next steps guidance"
                description="Edit the two instruction boxes shown above the finalist and Emerging round qualifier lists."
              />
              <div className="grid gap-4 xl:grid-cols-2">
                {[
                  ["Finalist guidance title", draft.finalists.finalistGuidance.title, (language: Locale, value: string, next: SitePageContent) => { next.finalists.finalistGuidance.title[language] = value; }],
                  ["Finalist guidance email label", draft.finalists.finalistGuidance.emailLabel, (language: Locale, value: string, next: SitePageContent) => { next.finalists.finalistGuidance.emailLabel[language] = value; }],
                  ["Finalist guidance button label", draft.finalists.finalistGuidance.reportLabel, (language: Locale, value: string, next: SitePageContent) => { next.finalists.finalistGuidance.reportLabel[language] = value; }],
                  ["Emerging guidance title", draft.finalists.emergingGuidance.title, (language: Locale, value: string, next: SitePageContent) => { next.finalists.emergingGuidance.title[language] = value; }],
                  ["Emerging guidance email label", draft.finalists.emergingGuidance.emailLabel, (language: Locale, value: string, next: SitePageContent) => { next.finalists.emergingGuidance.emailLabel[language] = value; }],
                  ["Emerging guidance button label", draft.finalists.emergingGuidance.reportLabel, (language: Locale, value: string, next: SitePageContent) => { next.finalists.emergingGuidance.reportLabel[language] = value; }],
                ].map(([title, value, updater]) => (
                  <LocalizedTextEditorCard
                    key={title as string}
                    title={`Finalists / ${title as string}`}
                    value={value as LocalizedText}
                    rows={(title as string).includes("title") ? 3 : 2}
                    onChange={(language, nextValue) =>
                      setDraft((current) =>
                        updateDraftContent(current, (next) => {
                          (updater as (language: Locale, value: string, next: SitePageContent) => void)(
                            language,
                            nextValue,
                            next,
                          );
                        }),
                      )
                    }
                  />
                ))}
              </div>
            </Surface>
            <div className="grid gap-4 xl:grid-cols-2">
              <LocalizedListBlockEditor
                title="Finalists / Finalist guidance bullets"
                description="Edit the bullet list in the Next steps for finalist teams box."
                items={draft.finalists.finalistGuidance.items}
                itemLabelPrefix="Finalist bullet"
                rows={4}
                addLabel={locale === "en" ? "Add finalist bullet" : "Thêm gạch đầu dòng chung kết"}
                removeLabel={locale === "en" ? "Remove finalist bullet" : "Xóa gạch đầu dòng chung kết"}
                minItems={1}
                onAdd={() =>
                  setDraft((current) =>
                    updateDraftContent(current, (next) => {
                      next.finalists.finalistGuidance.items.push(createBlankLocalizedText());
                    }),
                  )
                }
                onRemove={(index) =>
                  setDraft((current) =>
                    updateDraftContent(current, (next) => {
                      next.finalists.finalistGuidance.items =
                        next.finalists.finalistGuidance.items.filter((_, currentIndex) => currentIndex !== index);
                    }),
                  )
                }
                onChange={(index, language, value) =>
                  setDraft((current) =>
                    updateDraftContent(current, (next) => {
                      next.finalists.finalistGuidance.items[index][language] = value;
                    }),
                  )
                }
              />
              <LocalizedListBlockEditor
                title="Finalists / Emerging guidance bullets"
                description="Edit the bullet list in the Next steps for Emerging round qualifiers box."
                items={draft.finalists.emergingGuidance.items}
                itemLabelPrefix="Emerging bullet"
                rows={4}
                addLabel={locale === "en" ? "Add Emerging bullet" : "Thêm gạch đầu dòng Ươm mầm"}
                removeLabel={locale === "en" ? "Remove Emerging bullet" : "Xóa gạch đầu dòng Ươm mầm"}
                minItems={1}
                onAdd={() =>
                  setDraft((current) =>
                    updateDraftContent(current, (next) => {
                      next.finalists.emergingGuidance.items.push(createBlankLocalizedText());
                    }),
                  )
                }
                onRemove={(index) =>
                  setDraft((current) =>
                    updateDraftContent(current, (next) => {
                      next.finalists.emergingGuidance.items =
                        next.finalists.emergingGuidance.items.filter((_, currentIndex) => currentIndex !== index);
                    }),
                  )
                }
                onChange={(index, language, value) =>
                  setDraft((current) =>
                    updateDraftContent(current, (next) => {
                      next.finalists.emergingGuidance.items[index][language] = value;
                    }),
                  )
                }
              />
            </div>
            <div className="grid gap-4 xl:grid-cols-2">
              {[
                ["Finalists / Finalist slot label", draft.finalists.finalistSlotLabel, (language: Locale, value: string, next: SitePageContent) => { next.finalists.finalistSlotLabel[language] = value; }],
                ["Finalists / Awaiting update label", draft.finalists.awaitingUpdateLabel, (language: Locale, value: string, next: SitePageContent) => { next.finalists.awaitingUpdateLabel[language] = value; }],
                ["Finalists / Finalist slot description", draft.finalists.finalistSlotDescription, (language: Locale, value: string, next: SitePageContent) => { next.finalists.finalistSlotDescription[language] = value; }],
                ["Finalists / Presentation day label", draft.finalists.presentationDayLabel, (language: Locale, value: string, next: SitePageContent) => { next.finalists.presentationDayLabel[language] = value; }],
                ["Finalists / To be announced", draft.finalists.toBeAnnouncedLabel, (language: Locale, value: string, next: SitePageContent) => { next.finalists.toBeAnnouncedLabel[language] = value; }],
                ["Finalists / Your team label", draft.finalists.yourTeamLabel, (language: Locale, value: string, next: SitePageContent) => { next.finalists.yourTeamLabel[language] = value; }],
                ["Finalists / Keyword prefix", draft.finalists.keywordPrefix, (language: Locale, value: string, next: SitePageContent) => { next.finalists.keywordPrefix[language] = value; }],
                ["Finalists / Finalist team label", draft.finalists.finalistTeamLabel, (language: Locale, value: string, next: SitePageContent) => { next.finalists.finalistTeamLabel[language] = value; }],
                ["Finalists / Members suffix", draft.finalists.membersSuffix, (language: Locale, value: string, next: SitePageContent) => { next.finalists.membersSuffix[language] = value; }],
                ["Finalists / Team leader prefix", draft.finalists.teamLeaderPrefix, (language: Locale, value: string, next: SitePageContent) => { next.finalists.teamLeaderPrefix[language] = value; }],
                ["Finalists / Leader info updating", draft.finalists.leaderInfoUpdating, (language: Locale, value: string, next: SitePageContent) => { next.finalists.leaderInfoUpdating[language] = value; }],
                ["Finalists / Team column label", draft.finalists.teamColumnLabel, (language: Locale, value: string, next: SitePageContent) => { next.finalists.teamColumnLabel[language] = value; }],
                ["Finalists / Leader column label", draft.finalists.leaderColumnLabel, (language: Locale, value: string, next: SitePageContent) => { next.finalists.leaderColumnLabel[language] = value; }],
                ["Finalists / Keyword column label", draft.finalists.keywordColumnLabel, (language: Locale, value: string, next: SitePageContent) => { next.finalists.keywordColumnLabel[language] = value; }],
                ["Finalists / Recognition column label", draft.finalists.recognitionColumnLabel, (language: Locale, value: string, next: SitePageContent) => { next.finalists.recognitionColumnLabel[language] = value; }],
                ["Finalists / Emerging Team slot label", draft.finalists.emergingTeamSlotLabel, (language: Locale, value: string, next: SitePageContent) => { next.finalists.emergingTeamSlotLabel[language] = value; }],
                ["Finalists / Awaiting official update", draft.finalists.awaitingOfficialUpdate, (language: Locale, value: string, next: SitePageContent) => { next.finalists.awaitingOfficialUpdate[language] = value; }],
                ["Finalists / Reserved label", draft.finalists.reservedLabel, (language: Locale, value: string, next: SitePageContent) => { next.finalists.reservedLabel[language] = value; }],
                ["Finalists / Emerging Team label", draft.finalists.emergingTeamLabel, (language: Locale, value: string, next: SitePageContent) => { next.finalists.emergingTeamLabel[language] = value; }],
              ].map(([title, value, updater]) => (
                <LocalizedTextEditorCard
                  key={title as string}
                  title={title as string}
                  value={value as LocalizedText}
                  onChange={(language, nextValue) =>
                    setDraft((current) =>
                      updateDraftContent(current, (next) => {
                        (updater as (language: Locale, value: string, next: SitePageContent) => void)(language, nextValue, next);
                      }),
                    )
                  }
                />
              ))}
            </div>
          </>
        ) : null}

        {pageId === "emerging-results" ? (
          <>
            <CopySectionEditor
              title="Emerging results / Header"
              section={draft.emergingResults.header}
              onChange={(field, language, value) =>
                setDraft((current) =>
                  updateDraftContent(current, (next) => {
                    next.emergingResults.header[field][language] = value;
                  }),
                )
              }
            />
            <div className="grid gap-4 xl:grid-cols-2">
              {[
                ["Emerging results / Announcement label", draft.emergingResults.announcementLabel, (language: Locale, value: string, next: SitePageContent) => { next.emergingResults.announcementLabel[language] = value; }],
                ["Emerging results / To be announced label", draft.emergingResults.toBeAnnouncedLabel, (language: Locale, value: string, next: SitePageContent) => { next.emergingResults.toBeAnnouncedLabel[language] = value; }],
                ["Emerging results / Released label", draft.emergingResults.releasedLabel, (language: Locale, value: string, next: SitePageContent) => { next.emergingResults.releasedLabel[language] = value; }],
                ["Emerging results / Pending label", draft.emergingResults.pendingLabel, (language: Locale, value: string, next: SitePageContent) => { next.emergingResults.pendingLabel[language] = value; }],
                ["Emerging results / Award teams label", draft.emergingResults.awardTeamsLabel, (language: Locale, value: string, next: SitePageContent) => { next.emergingResults.awardTeamsLabel[language] = value; }],
                ["Emerging results / Empty team card title", draft.emergingResults.emptySlotTitle, (language: Locale, value: string, next: SitePageContent) => { next.emergingResults.emptySlotTitle[language] = value; }],
                ["Emerging results / Loading card description", draft.emergingResults.loadingSlotDescription, (language: Locale, value: string, next: SitePageContent) => { next.emergingResults.loadingSlotDescription[language] = value; }],
                ["Emerging results / Pending card description", draft.emergingResults.pendingSlotDescription, (language: Locale, value: string, next: SitePageContent) => { next.emergingResults.pendingSlotDescription[language] = value; }],
                ["Emerging results / Your team label", draft.emergingResults.yourTeamLabel, (language: Locale, value: string, next: SitePageContent) => { next.emergingResults.yourTeamLabel[language] = value; }],
                ["Emerging results / Award label", draft.emergingResults.awardLabel, (language: Locale, value: string, next: SitePageContent) => { next.emergingResults.awardLabel[language] = value; }],
                ["Emerging results / Members suffix", draft.emergingResults.membersSuffix, (language: Locale, value: string, next: SitePageContent) => { next.emergingResults.membersSuffix[language] = value; }],
                ["Emerging results / Leader label", draft.emergingResults.leaderLabel, (language: Locale, value: string, next: SitePageContent) => { next.emergingResults.leaderLabel[language] = value; }],
              ].map(([title, value, updater]) => (
                <LocalizedTextEditorCard
                  key={title as string}
                  title={title as string}
                  value={value as LocalizedText}
                  onChange={(language, nextValue) =>
                    setDraft((current) =>
                      updateDraftContent(current, (next) => {
                        (updater as (language: Locale, value: string, next: SitePageContent) => void)(language, nextValue, next);
                      }),
                    )
                  }
                />
              ))}
            </div>
          </>
        ) : null}

        {pageId === "final-results" ? (
          <>
            <CopySectionEditor
              title="Final results / Champion"
              section={draft.finalResults.champion}
              onChange={(field, language, value) =>
                setDraft((current) =>
                  updateDraftContent(current, (next) => {
                    next.finalResults.champion[field][language] = value;
                  }),
                )
              }
            />
            <CopySectionEditor
              title="Final results / Runner-up"
              section={draft.finalResults.runnerUp}
              onChange={(field, language, value) =>
                setDraft((current) =>
                  updateDraftContent(current, (next) => {
                    next.finalResults.runnerUp[field][language] = value;
                  }),
                )
              }
            />
            <CopySectionEditor
              title="Final results / Third place"
              section={draft.finalResults.thirdPlace}
              onChange={(field, language, value) =>
                setDraft((current) =>
                  updateDraftContent(current, (next) => {
                    next.finalResults.thirdPlace[field][language] = value;
                  }),
                )
              }
            />
            <CopySectionEditor
              title="Final results / Fourth place"
              section={draft.finalResults.fourthPlace}
              onChange={(field, language, value) =>
                setDraft((current) =>
                  updateDraftContent(current, (next) => {
                    next.finalResults.fourthPlace[field][language] = value;
                  }),
                )
              }
            />
            <div className="grid gap-4 xl:grid-cols-2">
              {[
                ["Final results / Member slot label", draft.finalResults.memberSlotLabel, (language: Locale, value: string, next: SitePageContent) => { next.finalResults.memberSlotLabel[language] = value; }],
                ["Final results / Awaiting official team lineup", draft.finalResults.awaitingOfficialTeamLineup, (language: Locale, value: string, next: SitePageContent) => { next.finalResults.awaitingOfficialTeamLineup[language] = value; }],
                ["Final results / Result pending label", draft.finalResults.resultPendingLabel, (language: Locale, value: string, next: SitePageContent) => { next.finalResults.resultPendingLabel[language] = value; }],
                ["Final results / Your team label", draft.finalResults.yourTeamLabel, (language: Locale, value: string, next: SitePageContent) => { next.finalResults.yourTeamLabel[language] = value; }],
                ["Final results / Awaiting official announcement", draft.finalResults.awaitingOfficialAnnouncement, (language: Locale, value: string, next: SitePageContent) => { next.finalResults.awaitingOfficialAnnouncement[language] = value; }],
                ["Final results / Awaiting official announcement body", draft.finalResults.awaitingOfficialAnnouncementBody, (language: Locale, value: string, next: SitePageContent) => { next.finalResults.awaitingOfficialAnnouncementBody[language] = value; }],
                ["Final results / Keyword prefix", draft.finalResults.keywordPrefix, (language: Locale, value: string, next: SitePageContent) => { next.finalResults.keywordPrefix[language] = value; }],
                ["Final results / Leader prefix", draft.finalResults.leaderPrefix, (language: Locale, value: string, next: SitePageContent) => { next.finalResults.leaderPrefix[language] = value; }],
                ["Final results / Leader info pending", draft.finalResults.leaderInfoPending, (language: Locale, value: string, next: SitePageContent) => { next.finalResults.leaderInfoPending[language] = value; }],
                ["Final results / Team members label", draft.finalResults.teamMembersLabel, (language: Locale, value: string, next: SitePageContent) => { next.finalResults.teamMembersLabel[language] = value; }],
                ["Final results / Final standings eyebrow", draft.finalResults.finalStandingsEyebrow, (language: Locale, value: string, next: SitePageContent) => { next.finalResults.finalStandingsEyebrow[language] = value; }],
                ["Final results / Final standings title", draft.finalResults.finalStandingsTitle, (language: Locale, value: string, next: SitePageContent) => { next.finalResults.finalStandingsTitle[language] = value; }],
                ["Final results / Presentation day label", draft.finalResults.presentationDayLabel, (language: Locale, value: string, next: SitePageContent) => { next.finalResults.presentationDayLabel[language] = value; }],
                ["Final results / Presentation date text", draft.finalResults.presentationDateValue, (language: Locale, value: string, next: SitePageContent) => { next.finalResults.presentationDateValue[language] = value; }],
                ["Final results / Presentation place label", draft.finalResults.presentationPlaceLabel, (language: Locale, value: string, next: SitePageContent) => { next.finalResults.presentationPlaceLabel[language] = value; }],
                ["Final results / Presentation place text", draft.finalResults.presentationPlaceValue, (language: Locale, value: string, next: SitePageContent) => { next.finalResults.presentationPlaceValue[language] = value; }],
                ["Final results / To be announced", draft.finalResults.toBeAnnouncedLabel, (language: Locale, value: string, next: SitePageContent) => { next.finalResults.toBeAnnouncedLabel[language] = value; }],
              ].map(([title, value, updater]) => (
                <LocalizedTextEditorCard
                  key={title as string}
                  title={title as string}
                  value={value as LocalizedText}
                  onChange={(language, nextValue) =>
                    setDraft((current) =>
                      updateDraftContent(current, (next) => {
                        (updater as (language: Locale, value: string, next: SitePageContent) => void)(language, nextValue, next);
                      }),
                    )
                  }
                />
              ))}
            </div>
          </>
        ) : null}
      </div>

      {pendingFaqDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[1.8rem] border theme-border theme-panel px-6 py-6 shadow-[0_28px_90px_rgba(15,23,42,0.28)]">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-500/12 text-rose-600 dark:text-rose-200">
                <Trash2 className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-lg font-semibold theme-text-strong">
                  {pendingFaqDelete.type === "topic"
                    ? locale === "en"
                      ? "Delete this FAQ topic?"
                      : "Xóa chủ đề FAQ này?"
                    : locale === "en"
                      ? "Delete this FAQ question?"
                      : "Xóa câu hỏi FAQ này?"}
                </p>
                <p className="mt-2 text-sm leading-7 theme-text-muted">
                  {pendingFaqDelete.type === "topic"
                    ? locale === "en"
                      ? `This removes "${pendingFaqDelete.label}" from the draft and moves its questions to the next available topic.`
                      : `Thao tác này sẽ xóa "${pendingFaqDelete.label}" khỏi bản nháp và chuyển các câu hỏi sang chủ đề còn lại.`
                    : locale === "en"
                      ? `This removes "${pendingFaqDelete.label}" from the draft.`
                      : `Thao tác này sẽ xóa "${pendingFaqDelete.label}" khỏi bản nháp.`}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setPendingFaqDelete(null)}
                className="rounded-full border theme-border theme-panel px-5 py-2.5 text-sm font-semibold theme-text-strong"
              >
                {locale === "en" ? "Cancel" : "Hủy"}
              </button>
              <button
                type="button"
                onClick={confirmFaqDelete}
                className="theme-button-danger rounded-full px-5 py-2.5 text-sm font-semibold"
              >
                {locale === "en" ? "Delete" : "Xóa"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function ContentSponsorsEditor() {
  const { locale, sponsors, saveSponsorsByAdmin } = useSiteState();
  useAdminTitleScroll();
  const [draft, setDraft] = useState<SponsorProfile[]>(() => cloneSponsors(sponsors));
  const [logoUploadError, setLogoUploadError] = useState("");
  const [uploadingSponsorIndex, setUploadingSponsorIndex] = useState<number | null>(null);

  useEffect(() => {
    setDraft(cloneSponsors(sponsors));
  }, [sponsors]);

  const isDirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(sponsors),
    [draft, sponsors],
  );

  return (
    <div className="space-y-8">
      <EditorTopBar
        eyebrow={locale === "en" ? "Admin / Content / Sponsors" : "Admin / Nội dung / Nhà tài trợ"}
        title={locale === "en" ? "Sponsor records" : "Danh sách nhà tài trợ"}
        description={
          locale === "en"
            ? "Manage the sponsor cards shown on the competition sponsor page and the homepage sponsor marquee."
            : "Quản lý các thẻ nhà tài trợ hiển thị trên trang nhà tài trợ và dải logo nhà tài trợ trên trang chủ."
        }
        isDirty={isDirty}
        onReset={() => setDraft(cloneSponsors(sponsors))}
        onSave={() => saveSponsorsByAdmin(draft)}
      />

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setDraft((current) => [...current, createSponsorDraft(current.length)])}
          className="theme-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
        >
          <Plus className="h-4 w-4" />
          {locale === "en" ? "Add sponsor" : "Thêm nhà tài trợ"}
        </button>
      </div>

      <div className="grid gap-4">
        {draft.map((sponsor, index) => (
          <Surface key={`${sponsor.name || "sponsor"}-${index}`} className="space-y-5 px-5 py-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-lg font-semibold theme-text-strong">
                {locale === "en" ? `Sponsor ${index + 1}` : `Nhà tài trợ ${index + 1}`}
              </p>
              <button
                type="button"
                onClick={() =>
                  setDraft((current) => current.filter((_, currentIndex) => currentIndex !== index))
                }
                className="theme-button-danger inline-flex h-10 w-10 items-center justify-center rounded-full border"
                aria-label={locale === "en" ? "Delete sponsor" : "Xóa nhà tài trợ"}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <label className="space-y-2">
              <span className="text-sm theme-text-muted">
                {locale === "en" ? "Sponsor name" : "Tên nhà tài trợ"}
              </span>
              <input
                value={sponsor.name}
                onChange={(event) =>
                  setDraft((current) =>
                    current.map((item, currentIndex) =>
                      currentIndex === index ? { ...item, name: event.target.value } : item,
                    ),
                  )
                }
                className={fieldClassName}
              />
            </label>

            <div className="space-y-3">
              <span className="text-sm theme-text-muted">
                {locale === "en" ? "Sponsor logo" : "Logo nhà tài trợ"}
              </span>
              <div className="flex flex-col gap-4 rounded-[1.6rem] border theme-border theme-panel px-4 py-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative flex h-20 w-32 shrink-0 items-center justify-center overflow-hidden rounded-[1.25rem] border theme-border bg-white/80 p-3 dark:bg-white/[0.06]">
                    {sponsor.logoSrc ? (
                      <Image
                        src={sponsor.logoSrc}
                        alt={sponsor.name || (locale === "en" ? "Sponsor logo preview" : "Xem trước logo")}
                        fill
                        sizes="128px"
                        unoptimized
                        className="object-contain p-3"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs font-semibold theme-text-soft">
                        {locale === "en" ? "No logo" : "Chưa có logo"}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold theme-text-strong">
                      {locale === "en" ? "Upload logo image" : "Tải ảnh logo"}
                    </p>
                    <p className="text-xs leading-6 theme-text-soft">
                      {locale === "en"
                        ? "Use JPG, PNG, or WEBP. Maximum size: 2MB."
                        : "Dùng JPG, PNG hoặc WEBP. Dung lượng tối đa: 2MB."}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <label className="theme-button-secondary inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold">
                    <Upload className="h-4 w-4" />
                    {uploadingSponsorIndex === index
                      ? locale === "en"
                        ? "Uploading..."
                        : "Đang tải..."
                      : locale === "en"
                        ? "Upload logo"
                        : "Tải logo"}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={async (event: ChangeEvent<HTMLInputElement>) => {
                        const file = event.target.files?.[0];
                        event.target.value = "";
                        if (!file) {
                          return;
                        }

                        const formData = new FormData();
                        formData.set("imageFile", file);
                        setUploadingSponsorIndex(index);
                        setLogoUploadError("");

                        try {
                          const response = await fetch("/api/admin/content/sponsors/logo", {
                            method: "POST",
                            body: formData,
                          });
                          const payload = (await response.json().catch(() => null)) as { imageUrl?: string; error?: string } | null;

                          if (!response.ok || !payload?.imageUrl) {
                            setLogoUploadError(
                              payload?.error ||
                                (locale === "en"
                                  ? "Could not upload the sponsor logo."
                                  : "Không thể tải logo nhà tài trợ."),
                            );
                            return;
                          }

                          setDraft((current) =>
                            current.map((item, currentIndex) =>
                              currentIndex === index ? { ...item, logoSrc: payload.imageUrl! } : item,
                            ),
                          );
                        } catch {
                          setLogoUploadError(
                            locale === "en"
                              ? "Could not upload the sponsor logo."
                              : "Không thể tải logo nhà tài trợ.",
                          );
                        } finally {
                          setUploadingSponsorIndex((current) => (current === index ? null : current));
                        }
                      }}
                    />
                  </label>
                  {sponsor.logoSrc ? (
                    <button
                      type="button"
                      onClick={() =>
                        setDraft((current) =>
                          current.map((item, currentIndex) =>
                            currentIndex === index ? { ...item, logoSrc: "" } : item,
                          ),
                        )
                      }
                      className="theme-button-danger inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
                    >
                      <Trash2 className="h-4 w-4" />
                      {locale === "en" ? "Remove logo" : "Gỡ logo"}
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            <LocalizedFieldEditor
              label={locale === "en" ? "Tier" : "Hạng tài trợ"}
              rows={2}
              value={sponsor.tier}
              onChange={(language, value) =>
                setDraft((current) =>
                  current.map((item, currentIndex) =>
                    currentIndex === index
                      ? { ...item, tier: { ...item.tier, [language]: value } }
                      : item,
                  ),
                )
              }
            />

            <LocalizedFieldEditor
              label={locale === "en" ? "Category" : "Nhóm đồng hành"}
              rows={2}
              value={sponsor.category}
              onChange={(language, value) =>
                setDraft((current) =>
                  current.map((item, currentIndex) =>
                    currentIndex === index
                      ? { ...item, category: { ...item.category, [language]: value } }
                      : item,
                  ),
                )
              }
            />

            <LocalizedFieldEditor
              label={locale === "en" ? "Description" : "Mô tả"}
              rows={4}
              value={sponsor.description}
              onChange={(language, value) =>
                setDraft((current) =>
                  current.map((item, currentIndex) =>
                    currentIndex === index
                      ? { ...item, description: { ...item.description, [language]: value } }
                      : item,
                  ),
                )
              }
            />

            <LocalizedFieldEditor
              label={locale === "en" ? "Contribution" : "Nội dung đồng hành"}
              rows={4}
              value={sponsor.contribution}
              onChange={(language, value) =>
                setDraft((current) =>
                  current.map((item, currentIndex) =>
                    currentIndex === index
                      ? { ...item, contribution: { ...item.contribution, [language]: value } }
                      : item,
                  ),
                )
              }
            />
          </Surface>
        ))}
      </div>

      {logoUploadError ? (
        <Surface className="px-5 py-4">
          <p className="text-sm font-medium text-rose-700 dark:text-rose-200">{logoUploadError}</p>
        </Surface>
      ) : null}
    </div>
  );
}

export function ContentTypeEditor({ typeId }: { typeId: ContentTypeId }) {
  const { locale, pageContent, savePageContent } = useSiteState();
  useAdminTitleScroll();
  const [draft, setDraft] = useState<SitePageContent>(() => clonePageContent(pageContent));
  const [testimonialAvatarError, setTestimonialAvatarError] = useState("");
  const [heroSlideImageUploadError, setHeroSlideImageUploadError] = useState("");
  const [uploadingHeroSlideIndex, setUploadingHeroSlideIndex] = useState<number | null>(null);

  useEffect(() => {
    setDraft(clonePageContent(pageContent));
  }, [pageContent]);

  const isDirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(pageContent),
    [draft, pageContent],
  );

  const config = contentTypeConfigs.find((item) => item.id === typeId)!;

  return (
    <div className="space-y-8">
      <EditorTopBar
        eyebrow={locale === "en" ? "Admin / Content / Type" : "Admin / Nội dung / Loại"}
        title={pickText(locale, config.label)}
        description={pickText(locale, config.description)}
        isDirty={isDirty}
        onReset={() => setDraft(clonePageContent(pageContent))}
        onSave={() => {
          void savePageContent(draft, `type:${typeId}`);
        }}
      />

      {typeId === "hero-slides" ? (
        <Surface className="space-y-5 px-5 py-5 md:px-6 md:py-6">
          <BlockIntro
            title={locale === "en" ? "Homepage hero slides" : "Hero slides trang chủ"}
            description={
              locale === "en"
                ? "Each slide is edited as one full-width content block, including CTA labels, highlight chips, and the three summary cards shown over the image."
                : "Mỗi slide được chỉnh như một block nội dung full width, bao gồm nút CTA, các chip highlight và ba thẻ tóm tắt hiển thị trên ảnh."
            }
          />

          <div className="space-y-5">
            {draft.home.heroSlides.map((slide, index) => (
              <Surface key={slide.id} className="space-y-5 px-5 py-5 md:px-6 md:py-6">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-lg font-semibold theme-text-strong">
                    {locale === "en" ? `Slide ${index + 1}` : `Slide ${index + 1}`}
                  </p>
                  <span className="rounded-full border theme-border bg-white/70 px-3 py-1 text-xs font-medium theme-text-soft">
                    {slide.id}
                  </span>
                </div>
                <div className="space-y-3">
                  <span className="text-sm theme-text-muted">
                    {locale === "en" ? "Background image" : "Ảnh nền slide"}
                  </span>
                  <div className="overflow-hidden rounded-[1.5rem] border theme-border bg-white/70 dark:bg-white/[0.05]">
                    <div className="relative aspect-[16/7] min-h-[180px] w-full">
                      {slide.image ? (
                        <Image
                          src={slide.image}
                          alt={pickText(locale, slide.title) || (locale === "en" ? "Hero slide preview" : "Xem trước ảnh slide")}
                          fill
                          sizes="(min-width: 768px) 960px, 100vw"
                          unoptimized={slide.image.startsWith("/api/hero-slide-images/")}
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm font-medium theme-text-soft">
                          {locale === "en" ? "No image uploaded yet" : "Chưa có ảnh cho slide"}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <label className="theme-button-secondary inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold">
                      <Upload className="h-4 w-4" />
                      {uploadingHeroSlideIndex === index
                        ? locale === "en"
                          ? "Uploading..."
                          : "Đang tải..."
                        : locale === "en"
                          ? "Upload image"
                          : "Tải ảnh"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingHeroSlideIndex === index}
                        onChange={async (event: ChangeEvent<HTMLInputElement>) => {
                          const file = event.target.files?.[0];
                          event.target.value = "";
                          if (!file) {
                            return;
                          }
                          if (!file.type.startsWith("image/")) {
                            setHeroSlideImageUploadError(
                              locale === "en"
                                ? "Only image files are allowed for hero slides."
                                : "Chỉ chấp nhận tệp hình ảnh cho hero slide.",
                            );
                            return;
                          }
                          if (file.size > MAX_HERO_SLIDE_IMAGE_FILE_BYTES) {
                            setHeroSlideImageUploadError(
                              locale === "en"
                                ? `Hero slide images must be ${formatFileSize(MAX_HERO_SLIDE_IMAGE_FILE_BYTES)} or smaller.`
                                : `Ảnh hero slide phải có dung lượng ${formatFileSize(MAX_HERO_SLIDE_IMAGE_FILE_BYTES)} trở xuống.`,
                            );
                            return;
                          }

                          const formData = new FormData();
                          formData.append("imageFile", file);
                          setUploadingHeroSlideIndex(index);
                          setHeroSlideImageUploadError("");

                          try {
                            const response = await fetch("/api/admin/content/hero-slides/image", {
                              method: "POST",
                              body: formData,
                            });
                            const payload = (await response.json().catch(() => null)) as
                              | { imageUrl?: string; error?: string }
                              | null;

                            if (!response.ok || !payload?.imageUrl) {
                              throw new Error(
                                payload?.error ||
                                  (locale === "en"
                                    ? "The hero slide image could not be uploaded."
                                    : "Không thể tải ảnh hero slide."),
                              );
                            }

                            setDraft((current) =>
                              updateDraftContent(current, (next) => {
                                next.home.heroSlides[index].image = payload.imageUrl!;
                              }),
                            );
                          } catch (error) {
                            setHeroSlideImageUploadError(
                              error instanceof Error
                                ? error.message
                                : locale === "en"
                                  ? "The hero slide image could not be uploaded."
                                  : "Không thể tải ảnh hero slide.",
                            );
                          } finally {
                            setUploadingHeroSlideIndex(null);
                          }
                        }}
                      />
                    </label>
                    {slide.image ? (
                      <button
                        type="button"
                        onClick={() =>
                          setDraft((current) =>
                            updateDraftContent(current, (next) => {
                              next.home.heroSlides[index].image = "";
                            }),
                          )
                        }
                        className="theme-button-danger inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
                      >
                        <Trash2 className="h-4 w-4" />
                        {locale === "en" ? "Remove image" : "Gỡ ảnh"}
                      </button>
                    ) : null}
                  </div>
                  <p className="text-xs leading-6 theme-text-soft">
                    {locale === "en"
                      ? `Accepted formats: JPG, PNG, WEBP. Maximum size: ${formatFileSize(MAX_HERO_SLIDE_IMAGE_FILE_BYTES)}.`
                      : `Chấp nhận JPG, PNG, WEBP. Dung lượng tối đa: ${formatFileSize(MAX_HERO_SLIDE_IMAGE_FILE_BYTES)}.`}
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm theme-text-muted">
                      {locale === "en" ? "Primary CTA href" : "Liên kết CTA chính"}
                    </span>
                    <input
                      value={slide.primaryCta.href}
                      onChange={(event) =>
                        setDraft((current) =>
                          updateDraftContent(current, (next) => {
                            next.home.heroSlides[index].primaryCta.href = event.target.value;
                          }),
                        )
                      }
                      className={fieldClassName}
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm theme-text-muted">
                      {locale === "en" ? "Secondary CTA href" : "Liên kết CTA phụ"}
                    </span>
                    <input
                      value={slide.secondaryCta.href}
                      onChange={(event) =>
                        setDraft((current) =>
                          updateDraftContent(current, (next) => {
                            next.home.heroSlides[index].secondaryCta.href = event.target.value;
                          }),
                        )
                      }
                      className={fieldClassName}
                    />
                  </label>
                </div>
                <LocalizedFieldEditor
                  label="Eyebrow"
                  rows={2}
                  value={slide.eyebrow}
                  onChange={(language, value) =>
                    setDraft((current) =>
                      updateDraftContent(current, (next) => {
                        next.home.heroSlides[index].eyebrow[language] = value;
                      }),
                    )
                  }
                />
                <LocalizedFieldEditor
                  label="Title"
                  rows={4}
                  value={slide.title}
                  onChange={(language, value) =>
                    setDraft((current) =>
                      updateDraftContent(current, (next) => {
                        next.home.heroSlides[index].title[language] = value;
                      }),
                    )
                  }
                />
                <LocalizedFieldEditor
                  label="Description"
                  rows={5}
                  value={slide.description}
                  onChange={(language, value) =>
                    setDraft((current) =>
                      updateDraftContent(current, (next) => {
                        next.home.heroSlides[index].description[language] = value;
                      }),
                    )
                  }
                />
                <LocalizedFieldEditor
                  label={locale === "en" ? "Primary CTA label" : "Nhãn CTA chính"}
                  rows={2}
                  value={slide.primaryCta.label}
                  onChange={(language, value) =>
                    setDraft((current) =>
                      updateDraftContent(current, (next) => {
                        next.home.heroSlides[index].primaryCta.label[language] = value;
                      }),
                    )
                  }
                />
                <LocalizedFieldEditor
                  label={locale === "en" ? "Secondary CTA label" : "Nhãn CTA phụ"}
                  rows={2}
                  value={slide.secondaryCta.label}
                  onChange={(language, value) =>
                    setDraft((current) =>
                      updateDraftContent(current, (next) => {
                        next.home.heroSlides[index].secondaryCta.label[language] = value;
                      }),
                    )
                  }
                />
                <LocalizedListBlockEditor
                  title={locale === "en" ? "Highlight chips" : "Chip highlight"}
                  description={
                    locale === "en"
                      ? "These short chips appear between the slide description and CTA buttons."
                      : "Các chip ngắn này hiển thị giữa phần mô tả slide và nhóm nút CTA."
                  }
                  items={slide.highlights}
                  itemLabelPrefix={locale === "en" ? "Highlight" : "Highlight"}
                  rows={2}
                  onChange={(itemIndex, language, value) =>
                    setDraft((current) =>
                      updateDraftContent(current, (next) => {
                        next.home.heroSlides[index].highlights[itemIndex][language] = value;
                      }),
                    )
                  }
                />
                <Surface className="space-y-4 px-4 py-4">
                  <BlockIntro
                    title={locale === "en" ? "Overlay summary cards" : "Thẻ tóm tắt trên overlay"}
                    description={
                      locale === "en"
                        ? "These three cards sit on the right side of the homepage hero overlay."
                        : "Ba thẻ này nằm ở cột phải của phần overlay trên slider trang chủ."
                    }
                  />
                  <div className="space-y-4">
                    {slide.cards.map((card, cardIndex) => (
                      <div key={`${slide.id}-card-${cardIndex}`} className="rounded-[1.4rem] border theme-border px-4 py-4">
                        <p className="mb-4 text-sm font-semibold theme-text-strong">
                          {locale === "en" ? `Card ${cardIndex + 1}` : `Thẻ ${cardIndex + 1}`}
                        </p>
                        <div className="space-y-4">
                          <LocalizedFieldEditor
                            label={locale === "en" ? "Card label" : "Nhãn thẻ"}
                            rows={2}
                            value={card.label}
                            onChange={(language, value) =>
                              setDraft((current) =>
                                updateDraftContent(current, (next) => {
                                  next.home.heroSlides[index].cards[cardIndex].label[language] = value;
                                }),
                              )
                            }
                          />
                          <LocalizedFieldEditor
                            label={locale === "en" ? "Card value" : "Giá trị thẻ"}
                            rows={2}
                            value={card.value}
                            onChange={(language, value) =>
                              setDraft((current) =>
                                updateDraftContent(current, (next) => {
                                  next.home.heroSlides[index].cards[cardIndex].value[language] = value;
                                }),
                              )
                            }
                          />
                          <LocalizedFieldEditor
                            label={locale === "en" ? "Card note" : "Ghi chú thẻ"}
                            rows={4}
                            value={card.note}
                            onChange={(language, value) =>
                              setDraft((current) =>
                                updateDraftContent(current, (next) => {
                                  next.home.heroSlides[index].cards[cardIndex].note[language] = value;
                                }),
                              )
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Surface>
              </Surface>
            ))}
          </div>
          {heroSlideImageUploadError ? (
            <Surface className="px-5 py-4">
              <p className="text-sm font-medium text-rose-700 dark:text-rose-200">{heroSlideImageUploadError}</p>
            </Surface>
          ) : null}
        </Surface>
      ) : null}

      {typeId === "home-testimonials" ? (
        <Surface className="space-y-5 px-5 py-5 md:px-6 md:py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-lg font-semibold theme-text-strong">
                {locale === "en" ? "Homepage testimonials" : "Testimonial trang chủ"}
              </p>
              <p className="mt-2 text-sm leading-7 theme-text-muted">
                {locale === "en"
                  ? "Edit each participant voice shown on the homepage slider, or add more testimonial cards."
                  : "Chỉnh sửa từng testimonial hiển thị trong slider trang chủ hoặc thêm testimonial mới."}
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setDraft((current) =>
                  updateDraftContent(current, (next) => {
                    next.home.testimonials.push(createTestimonialDraft(next.home.testimonials.length + 1));
                  }),
                )
              }
              className="theme-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
            >
              <Plus className="h-4 w-4" />
              {locale === "en" ? "Add testimonial" : "Thêm testimonial"}
            </button>
          </div>

          <div className="grid gap-4">
            {draft.home.testimonials.map((testimonial, index) => (
              <Surface key={testimonial.id} className="space-y-4 px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border theme-border bg-white/70 dark:bg-white/[0.05]">
                      <Quote className="h-4.5 w-4.5 theme-text-strong" />
                    </span>
                    <div>
                      <p className="text-base font-semibold theme-text-strong">
                        {locale === "en" ? `Testimonial ${index + 1}` : `Testimonial ${index + 1}`}
                      </p>
                      <p className="text-xs uppercase tracking-[0.18em] theme-text-soft">{testimonial.id}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={draft.home.testimonials.length <= 1}
                    onClick={() =>
                      setDraft((current) =>
                        updateDraftContent(current, (next) => {
                          next.home.testimonials = next.home.testimonials.filter((item) => item.id !== testimonial.id);
                        }),
                      )
                    }
                    className="theme-button-danger inline-flex h-10 w-10 items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label={locale === "en" ? "Delete testimonial" : "Xóa testimonial"}
                    title={locale === "en" ? "Delete testimonial" : "Xóa testimonial"}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm theme-text-muted">
                      {locale === "en" ? "Participant name" : "Họ tên"}
                    </span>
                    <input
                      value={testimonial.name}
                      onChange={(event) =>
                        setDraft((current) =>
                          updateDraftContent(current, (next) => {
                            next.home.testimonials[index].name = event.target.value;
                          }),
                        )
                      }
                      className={fieldClassName}
                    />
                  </label>
                  <div className="space-y-3">
                    <span className="text-sm theme-text-muted">
                      {locale === "en" ? "Testimonial avatar" : "Avatar testimonial"}
                    </span>
                    <div className="flex items-center gap-3">
                      <div className="relative h-16 w-16 overflow-hidden rounded-full border theme-border bg-white/70 dark:bg-white/[0.05]">
                        {testimonial.avatarImageSrc ? (
                          <Image
                            src={testimonial.avatarImageSrc}
                            alt={testimonial.name || (locale === "en" ? "Avatar preview" : "Xem trước avatar")}
                            fill
                            sizes="64px"
                            unoptimized
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs font-semibold theme-text-soft">
                            {locale === "en" ? "No image" : "Chưa có"}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <label className="theme-button-secondary inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold">
                          <Upload className="h-4 w-4" />
                          {locale === "en" ? "Upload avatar" : "Tải avatar"}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (event: ChangeEvent<HTMLInputElement>) => {
                              const file = event.target.files?.[0];
                              event.target.value = "";
                              if (!file) {
                                return;
                              }
                              if (!file.type.startsWith("image/")) {
                                setTestimonialAvatarError(
                                  locale === "en"
                                    ? "Only image files are allowed for testimonial avatars."
                                    : "Chỉ chấp nhận tệp hình ảnh cho avatar testimonial.",
                                );
                                return;
                              }
                              if (file.size > MAX_TESTIMONIAL_AVATAR_FILE_BYTES) {
                                setTestimonialAvatarError(
                                  locale === "en"
                                    ? `Avatar images must be ${formatFileSize(MAX_TESTIMONIAL_AVATAR_FILE_BYTES)} or smaller.`
                                    : `Ảnh avatar phải có dung lượng ${formatFileSize(MAX_TESTIMONIAL_AVATAR_FILE_BYTES)} trở xuống.`,
                                );
                                return;
                              }
                              try {
                                const imageSrc = await readImageFileAsDataUrl(file);
                                setTestimonialAvatarError("");
                                setDraft((current) =>
                                  updateDraftContent(current, (next) => {
                                    next.home.testimonials[index].avatarImageSrc = imageSrc;
                                  }),
                                );
                              } catch {
                                setTestimonialAvatarError(
                                  locale === "en"
                                    ? "Could not load the testimonial avatar."
                                    : "Không thể tải ảnh avatar testimonial.",
                                );
                              }
                            }}
                          />
                        </label>
                        {testimonial.avatarImageSrc ? (
                          <button
                            type="button"
                            onClick={() =>
                              setDraft((current) =>
                                updateDraftContent(current, (next) => {
                                  next.home.testimonials[index].avatarImageSrc = "";
                                }),
                              )
                            }
                            className="theme-button-danger inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
                          >
                            <Trash2 className="h-4 w-4" />
                            {locale === "en" ? "Remove" : "Gỡ ảnh"}
                          </button>
                        ) : null}
                      </div>
                    </div>
                    <label className="space-y-2">
                      <span className="text-sm theme-text-muted">
                        {locale === "en" ? "Avatar image path" : "Đường dẫn ảnh đại diện"}
                      </span>
                      <input
                        value={testimonial.avatarImageSrc}
                        onChange={(event) =>
                          setDraft((current) =>
                            updateDraftContent(current, (next) => {
                              next.home.testimonials[index].avatarImageSrc = event.target.value;
                            }),
                          )
                        }
                        className={fieldClassName}
                      />
                    </label>
                    <p className="text-xs leading-6 theme-text-soft">
                      {locale === "en"
                        ? `Upload a testimonial avatar image or paste an image path. Maximum size ${formatFileSize(MAX_TESTIMONIAL_AVATAR_FILE_BYTES)}.`
                        : `Tải ảnh avatar testimonial hoặc dán đường dẫn ảnh. Dung lượng tối đa ${formatFileSize(MAX_TESTIMONIAL_AVATAR_FILE_BYTES)}.`}
                    </p>
                    {testimonialAvatarError ? <p className="text-xs leading-6 text-rose-500 dark:text-rose-200">{testimonialAvatarError}</p> : null}
                  </div>
                  <label className="space-y-2 md:col-span-2">
                    <span className="inline-flex items-center gap-2 text-sm theme-text-muted">
                      <Users2 className="h-4 w-4" />
                      {locale === "en" ? "University" : "Trường đại học"}
                    </span>
                    <input
                      value={testimonial.university}
                      onChange={(event) =>
                        setDraft((current) =>
                          updateDraftContent(current, (next) => {
                            next.home.testimonials[index].university = event.target.value;
                          }),
                        )
                      }
                      className={fieldClassName}
                    />
                  </label>
                </div>

                <LocalizedFieldEditor
                  label={locale === "en" ? "Competition role" : "Vai trò trong cuộc thi"}
                  rows={3}
                  value={testimonial.competitionRole}
                  onChange={(language, value) =>
                    setDraft((current) =>
                      updateDraftContent(current, (next) => {
                        next.home.testimonials[index].competitionRole[language] = value;
                      }),
                    )
                  }
                />

                <LocalizedFieldEditor
                  label={locale === "en" ? "Current employment" : "Công việc hiện tại"}
                  rows={3}
                  value={testimonial.currentEmployment ?? createBlankLocalizedText()}
                  onChange={(language, value) =>
                    setDraft((current) =>
                      updateDraftContent(current, (next) => {
                        const currentEmployment = next.home.testimonials[index].currentEmployment ?? createBlankLocalizedText();
                        currentEmployment[language] = value;
                        next.home.testimonials[index].currentEmployment = currentEmployment;
                      }),
                    )
                  }
                />

                <LocalizedFieldEditor
                  label={locale === "en" ? "Quote" : "Trích dẫn"}
                  rows={5}
                  value={testimonial.quote}
                  onChange={(language, value) =>
                    setDraft((current) =>
                      updateDraftContent(current, (next) => {
                        next.home.testimonials[index].quote[language] = value;
                      }),
                    )
                  }
                />

                <div className="rounded-[1.2rem] border theme-border bg-white/72 px-4 py-4 dark:bg-white/[0.04]">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] theme-eyebrow">
                    <BriefcaseBusiness className="h-3.5 w-3.5" />
                    {locale === "en" ? "Homepage card preview" : "Preview thẻ trang chủ"}
                  </div>
                  <p className="mt-3 text-base font-semibold theme-text-strong">
                    {testimonial.name || (locale === "en" ? "Participant name" : "Tên nhân vật")}
                  </p>
                  <p className="mt-1 text-sm theme-text-soft">
                    {pickText(locale, testimonial.competitionRole) || (locale === "en" ? "Competition role" : "Vai trò cuộc thi")}
                  </p>
                  <p className="mt-3 text-sm leading-7 theme-text-body">
                    {pickText(locale, testimonial.quote) || (locale === "en" ? "Quote preview appears here." : "Nội dung trích dẫn sẽ hiển thị tại đây.")}
                  </p>
                </div>
              </Surface>
            ))}
          </div>
        </Surface>
      ) : null}

      {typeId === "auth-notes" ? (
        <Surface className="space-y-5 px-6 py-6 md:px-7 md:py-7">
          <p className="text-lg font-semibold theme-text-strong">Auth notes</p>
          <LocalizedFieldEditor
            label="Register note"
            rows={4}
            value={draft.auth.registerNote}
            onChange={(language, value) =>
              setDraft((current) =>
                updateDraftContent(current, (next) => {
                  next.auth.registerNote[language] = value;
                }),
              )
            }
          />
          <LocalizedFieldEditor
            label="Sign-in note"
            rows={4}
            value={draft.auth.signinNote}
            onChange={(language, value) =>
              setDraft((current) =>
                updateDraftContent(current, (next) => {
                  next.auth.signinNote[language] = value;
                }),
              )
            }
          />
        </Surface>
      ) : null}

      {typeId === "workspace-states" ? (
        <Surface className="space-y-5 px-5 py-5">
          <p className="text-lg font-semibold theme-text-strong">
            {locale === "en" ? "Workspace states" : "Trạng thái workspace"}
          </p>
          <LocalizedFieldEditor
            label="No team title"
            rows={3}
            value={draft.workspace.noTeamTitle}
            onChange={(language, value) =>
              setDraft((current) =>
                updateDraftContent(current, (next) => {
                  next.workspace.noTeamTitle[language] = value;
                }),
              )
            }
          />
          <LocalizedFieldEditor
            label="No team description"
            rows={4}
            value={draft.workspace.noTeamDescription}
            onChange={(language, value) =>
              setDraft((current) =>
                updateDraftContent(current, (next) => {
                  next.workspace.noTeamDescription[language] = value;
                }),
              )
            }
          />
          <LocalizedFieldEditor
            label="Existing team description"
            rows={4}
            value={draft.workspace.teamDescription}
            onChange={(language, value) =>
              setDraft((current) =>
                updateDraftContent(current, (next) => {
                  next.workspace.teamDescription[language] = value;
                }),
              )
            }
          />
        </Surface>
      ) : null}
    </div>
  );
}
