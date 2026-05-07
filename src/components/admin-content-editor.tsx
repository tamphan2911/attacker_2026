"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CircleHelp,
  Clock3,
  FileText,
  ImageIcon,
  LayoutDashboard,
  Mail,
  Medal,
  MessageSquare,
  Newspaper,
  Plus,
  Quote,
  ShieldCheck,
  Sparkles,
  Trash2,
  Trophy,
  Users2,
} from "lucide-react";

import {
  contentPageConfigs,
  contentTypeConfigs,
  type ContentPageId,
  type ContentTypeId,
} from "@/data/admin-content";
import { pickText } from "@/lib/site";
import { ADMIN_TITLE_ID, useAdminTitleScroll } from "@/components/admin-title-scroll";
import { useSiteState } from "@/components/providers/site-state-provider";
import { SectionHeading, Surface } from "@/components/site-ui";
import type { Locale, LocalizedText, SitePageContent, TestimonialItem } from "@/types/site";

function cn(...values: Array<string | undefined | false>) {
  return values.filter(Boolean).join(" ");
}

const fieldClassName =
  "theme-placeholder w-full rounded-2xl border theme-border theme-panel px-4 py-3 text-sm theme-text-strong outline-none";

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

function iconForPage(pageId: ContentPageId) {
  switch (pageId) {
    case "home":
      return Sparkles;
    case "competition":
      return Trophy;
    case "faq":
      return CircleHelp;
    case "rules":
      return ShieldCheck;
    case "timeline":
      return Clock3;
    case "finalists":
      return Trophy;
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
  {
    id: "competition",
    children: [
      { kind: "page", id: "rules" },
      { kind: "page", id: "timeline" },
      { kind: "page", id: "faq" },
      { kind: "page", id: "sponsors" },
      { kind: "page", id: "judges" },
      { kind: "page", id: "finalists" },
      { kind: "page", id: "final-results" },
    ],
  },
  { id: "news" },
  { id: "forum" },
  { id: "auth", children: [{ kind: "type", id: "auth-notes" }] },
  { id: "workspace", children: [{ kind: "type", id: "workspace-states" }] },
  { id: "organizer" },
  { id: "contact" },
];

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
            {locale === "en" ? "Reset draft" : "Dat lai ban nhap"}
          </button>
          <button
            type="button"
            disabled={!isDirty}
            onClick={onSave}
            className="theme-button-primary rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {locale === "en" ? "Save changes" : "Luu thay doi"}
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
                        {pickText(locale, item.label)}
                      </p>
                      <p className="mt-1 text-sm leading-7 theme-text-muted">
                        {pickText(locale, item.description)}
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
                                  {pickText(locale, child.label)}
                                </p>
                                {childEntry.kind === "type" ? (
                                  <span className="rounded-full border theme-border bg-white/70 px-2.5 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.18em] theme-text-soft dark:bg-white/8">
                                    {locale === "en" ? "Content" : "Nội dung"}
                                  </span>
                                ) : null}
                              </div>
                              <p className="mt-1 text-sm leading-6 theme-text-soft">
                                {pickText(locale, child.description)}
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
    </div>
  );
}

export function ContentPageEditor({ pageId }: { pageId: ContentPageId }) {
  const { locale, pageContent, savePageContent } = useSiteState();
  useAdminTitleScroll();
  const [draft, setDraft] = useState<SitePageContent>(() => clonePageContent(pageContent));

  useEffect(() => {
    setDraft(clonePageContent(pageContent));
  }, [pageContent]);

  const isDirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(pageContent),
    [draft, pageContent],
  );

  const config = contentPageConfigs.find((item) => item.id === pageId)!;

  return (
    <div className="space-y-8">
      <EditorTopBar
        eyebrow={locale === "en" ? "Admin / Content / Page" : "Admin / Noi dung / Trang"}
        title={pickText(locale, config.label)}
        description={pickText(locale, config.description)}
        isDirty={isDirty}
        onReset={() => setDraft(clonePageContent(pageContent))}
        onSave={() => savePageContent(draft)}
      />

      <div className={cn("grid gap-4", pageId === "auth" ? "xl:grid-cols-1" : "xl:grid-cols-2")}>
        {pageId === "home" ? (
          <>
            <CopySectionEditor
              title="Home / News"
              section={draft.home.news}
              onChange={(field, language, value) =>
                setDraft((current) =>
                  updateDraftContent(current, (next) => {
                    next.home.news[field][language] = value;
                  }),
                )
              }
            />
            <CopySectionEditor
              title="Home / Sponsors"
              section={draft.home.sponsors}
              onChange={(field, language, value) =>
                setDraft((current) =>
                  updateDraftContent(current, (next) => {
                    next.home.sponsors[field][language] = value;
                  }),
                )
              }
            />
            <CopySectionEditor
              title="Home / Destinations"
              section={draft.home.destinations}
              onChange={(field, language, value) =>
                setDraft((current) =>
                  updateDraftContent(current, (next) => {
                    next.home.destinations[field][language] = value;
                  }),
                )
              }
            />
            <CopySectionEditor
              title="Home / CTA"
              section={draft.home.cta}
              onChange={(field, language, value) =>
                setDraft((current) =>
                  updateDraftContent(current, (next) => {
                    next.home.cta[field][language] = value;
                  }),
                )
              }
            />
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
            <CopySectionEditor
              title="Competition / Rounds"
              section={draft.competition.rounds}
              onChange={(field, language, value) =>
                setDraft((current) =>
                  updateDraftContent(current, (next) => {
                    next.competition.rounds[field][language] = value;
                  }),
                )
              }
            />
            <CopySectionEditor
              title="Competition / Rewards"
              section={draft.competition.rewards}
              onChange={(field, language, value) =>
                setDraft((current) =>
                  updateDraftContent(current, (next) => {
                    next.competition.rewards[field][language] = value;
                  }),
                )
              }
            />
            <CopySectionEditor
              title="Competition / Mentors"
              section={draft.competition.mentors}
              onChange={(field, language, value) =>
                setDraft((current) =>
                  updateDraftContent(current, (next) => {
                    next.competition.mentors[field][language] = value;
                  }),
                )
              }
            />
          </>
        ) : null}

        {pageId === "faq" ? (
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
            <CopySectionEditor
              title="Rules / Timeline"
              section={draft.rules.timeline}
              onChange={(field, language, value) =>
                setDraft((current) =>
                  updateDraftContent(current, (next) => {
                    next.rules.timeline[field][language] = value;
                  }),
                )
              }
            />
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
            <CopySectionEditor
              title="Organizer / Content modules"
              section={draft.organizer.contentModules}
              onChange={(field, language, value) =>
                setDraft((current) =>
                  updateDraftContent(current, (next) => {
                    next.organizer.contentModules[field][language] = value;
                  }),
                )
              }
            />
            <CopySectionEditor
              title="Organizer / Flags"
              section={draft.organizer.flags}
              onChange={(field, language, value) =>
                setDraft((current) =>
                  updateDraftContent(current, (next) => {
                    next.organizer.flags[field][language] = value;
                  }),
                )
              }
            />
          </>
        ) : null}

        {pageId === "contact" ? (
          <>
            <CopySectionEditor
              title="Contact / Response rhythm"
              section={{
                eyebrow: draft.contact.responseRhythmEyebrow,
                title: createBlankLocalizedText(),
                description: draft.contact.responseRhythmDescription,
              }}
              onChange={(field, language, value) =>
                setDraft((current) =>
                  updateDraftContent(current, (next) => {
                    if (field === "eyebrow") {
                      next.contact.responseRhythmEyebrow[language] = value;
                    }
                    if (field === "description") {
                      next.contact.responseRhythmDescription[language] = value;
                    }
                  }),
                )
              }
            />
            <div className="grid gap-4 xl:grid-cols-2">
              <LocalizedTextEditorCard
                title="Contact / Map eyebrow"
                value={draft.contact.mapEyebrow}
                onChange={(language, value) =>
                  setDraft((current) =>
                    updateDraftContent(current, (next) => {
                      next.contact.mapEyebrow[language] = value;
                    }),
                  )
                }
              />
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
              <LocalizedTextEditorCard
                title="Contact / Organizer address eyebrow"
                value={draft.contact.organizerAddressEyebrow}
                onChange={(language, value) =>
                  setDraft((current) =>
                    updateDraftContent(current, (next) => {
                      next.contact.organizerAddressEyebrow[language] = value;
                    }),
                  )
                }
              />
              <LocalizedTextEditorCard
                title="Contact / Official channels eyebrow"
                value={draft.contact.officialChannelsEyebrow}
                onChange={(language, value) =>
                  setDraft((current) =>
                    updateDraftContent(current, (next) => {
                      next.contact.officialChannelsEyebrow[language] = value;
                    }),
                  )
                }
              />
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
          </>
        ) : null}

        {pageId === "timeline" ? (
          <>
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
              title="Timeline / Final round phase"
              section={draft.timelinePage.round3}
              onChange={(field, language, value) =>
                setDraft((current) =>
                  updateDraftContent(current, (next) => {
                    next.timelinePage.round3[field][language] = value;
                  }),
                )
              }
            />
            <div className="grid gap-4 xl:grid-cols-2">
              {[
                ["Timeline / Diagram eyebrow", draft.timelinePage.diagramEyebrow, (language: Locale, value: string, next: SitePageContent) => { next.timelinePage.diagramEyebrow[language] = value; }],
                ["Timeline / Diagram hint", draft.timelinePage.diagramHint, (language: Locale, value: string, next: SitePageContent) => { next.timelinePage.diagramHint[language] = value; }],
                ["Timeline / Schedule fallback", draft.timelinePage.scheduleToBeUpdated, (language: Locale, value: string, next: SitePageContent) => { next.timelinePage.scheduleToBeUpdated[language] = value; }],
                ["Timeline / Steps label", draft.timelinePage.stepsLabel, (language: Locale, value: string, next: SitePageContent) => { next.timelinePage.stepsLabel[language] = value; }],
                ["Timeline / Open detail", draft.timelinePage.openDetailLabel, (language: Locale, value: string, next: SitePageContent) => { next.timelinePage.openDetailLabel[language] = value; }],
                ["Timeline / Open rule block", draft.timelinePage.openRuleBlockLabel, (language: Locale, value: string, next: SitePageContent) => { next.timelinePage.openRuleBlockLabel[language] = value; }],
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
                ["Final results / Presentation day label", draft.finalResults.presentationDayLabel, (language: Locale, value: string, next: SitePageContent) => { next.finalResults.presentationDayLabel[language] = value; }],
                ["Final results / Presentation place label", draft.finalResults.presentationPlaceLabel, (language: Locale, value: string, next: SitePageContent) => { next.finalResults.presentationPlaceLabel[language] = value; }],
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
    </div>
  );
}

export function ContentTypeEditor({ typeId }: { typeId: ContentTypeId }) {
  const { locale, pageContent, savePageContent } = useSiteState();
  useAdminTitleScroll();
  const [draft, setDraft] = useState<SitePageContent>(() => clonePageContent(pageContent));

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
        eyebrow={locale === "en" ? "Admin / Content / Type" : "Admin / Noi dung / Loai"}
        title={pickText(locale, config.label)}
        description={pickText(locale, config.description)}
        isDirty={isDirty}
        onReset={() => setDraft(clonePageContent(pageContent))}
        onSave={() => savePageContent(draft)}
      />

      {typeId === "hero-slides" ? (
        <Surface className="space-y-5 px-5 py-5 md:px-6 md:py-6">
          <div>
            <p className="text-lg font-semibold theme-text-strong">
              {locale === "en" ? "Homepage hero slides" : "Hero slides trang chu"}
            </p>
            <p className="mt-2 text-sm leading-7 theme-text-muted">
              {locale === "en"
                ? "Manage the homepage slider separately from the rest of the Home page copy."
                : "Quan ly slider trang chu tach rieng khoi cac phan noi dung con lai cua Home."}
            </p>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            {draft.home.heroSlides.map((slide, index) => (
              <Surface key={slide.id} className="space-y-4 px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-base font-semibold theme-text-strong">
                    {locale === "en" ? `Slide ${index + 1}` : `Slide ${index + 1}`}
                  </p>
                  <span className="rounded-full border theme-border bg-white/70 px-3 py-1 text-xs font-medium theme-text-soft">
                    {slide.id}
                  </span>
                </div>
                <label className="space-y-2">
                  <span className="text-sm theme-text-muted">Image path</span>
                  <input
                    value={slide.image}
                    onChange={(event) =>
                      setDraft((current) =>
                        updateDraftContent(current, (next) => {
                          next.home.heroSlides[index].image = event.target.value;
                        }),
                      )
                    }
                    className={fieldClassName}
                  />
                </label>
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
              </Surface>
            ))}
          </div>
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

          <div className="grid gap-4 xl:grid-cols-2">
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
            {locale === "en" ? "Workspace states" : "Trang thai workspace"}
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
