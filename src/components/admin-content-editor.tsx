"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CircleHelp,
  FileText,
  ImageIcon,
  LayoutDashboard,
  Newspaper,
  ShieldCheck,
  Sparkles,
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
import type { Locale, LocalizedText, SitePageContent } from "@/types/site";

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
    case "news":
      return Newspaper;
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
  }
}

function iconForType(typeId: ContentTypeId) {
  switch (typeId) {
    case "hero-slides":
      return ImageIcon;
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
  { id: "home", children: [{ kind: "type", id: "hero-slides" }] },
  {
    id: "competition",
    children: [
      { kind: "page", id: "rules" },
      { kind: "page", id: "faq" },
      { kind: "page", id: "sponsors" },
      { kind: "page", id: "judges" },
    ],
  },
  { id: "news" },
  { id: "auth", children: [{ kind: "type", id: "auth-notes" }] },
  { id: "workspace", children: [{ kind: "type", id: "workspace-states" }] },
  { id: "organizer" },
];

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
