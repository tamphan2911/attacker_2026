"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type ChangeEvent, type Dispatch, type SetStateAction } from "react";
import { ArrowRight, Images, Plus, Trash2, Upload } from "lucide-react";

import { pickText } from "@/lib/site";
import { Surface } from "@/components/site-ui";
import type {
  EditableOrganizerSeasonArchive,
  EditableOrganizerSeasonSlide,
  EditableOrganizerSeasonTeam,
  Locale,
  LocalizedText,
  SitePageContent,
} from "@/types/site";

const fieldClassName =
  "theme-placeholder w-full rounded-2xl border theme-border theme-panel px-4 py-3 text-sm theme-text-strong outline-none";
const MAX_SEASON_IMAGE_BYTES = 2 * 1024 * 1024;
export const seasonContentYears = ["2023", "2024", "2025", "2026"] as const;

function formatFileSize(bytes: number) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }

  return `${Math.ceil(bytes / 1024)}KB`;
}

function clonePageContent(content: SitePageContent): SitePageContent {
  return JSON.parse(JSON.stringify(content)) as SitePageContent;
}

function updateDraftContent(current: SitePageContent, recipe: (draft: SitePageContent) => void) {
  const next = clonePageContent(current);
  recipe(next);
  return next;
}

function createBlankLocalizedText(): LocalizedText {
  return { en: "", vi: "" };
}

function createSeasonStoryDraft(year: string) {
  return {
    year,
    image: "",
    label: createBlankLocalizedText(),
    title: createBlankLocalizedText(),
    body: createBlankLocalizedText(),
    stats: [createBlankLocalizedText(), createBlankLocalizedText()],
  };
}

function createSeasonArchiveTeamDraft(index: number, year = "2026"): EditableOrganizerSeasonTeam {
  const rankLabels = [
    { en: "1st place", vi: "Hạng 1" },
    { en: "2nd place", vi: "Hạng 2" },
    { en: "3rd place", vi: "Hạng 3" },
    { en: "Finalist", vi: "Đồng hạng 4" },
    { en: "Finalist", vi: "Đồng hạng 4" },
  ];

  return {
    rank: rankLabels[index] ?? { en: "Finalist", vi: "Đội chung kết" },
    name: { en: `Team ${index + 1}`, vi: `Đội ${index + 1}` },
    projectName: { en: `Attacker ${year} project`, vi: `Dự án Attacker ${year}` },
    projectDescription: createBlankLocalizedText(),
    members: [
      { name: "", university: "", major: "" },
      { name: "", university: "", major: "" },
      { name: "", university: "", major: "" },
    ],
  };
}

function createSeasonArchiveSlideDraft(index: number, year = "2026"): EditableOrganizerSeasonSlide {
  return {
    image: "",
    alt: {
      en: `Attacker ${year} season photo ${index + 1}`,
      vi: `Ảnh mùa Attacker ${year} số ${index + 1}`,
    },
  };
}

function createOrganizerSeasonArchiveDraft(year: string): EditableOrganizerSeasonArchive {
  return {
    year,
    overviewTitle: createBlankLocalizedText(),
    overview: [createBlankLocalizedText()],
    stats: [
      { value: "", label: createBlankLocalizedText() },
      { value: "", label: createBlankLocalizedText() },
      { value: "", label: createBlankLocalizedText() },
      { value: "", label: { en: "cash reward", vi: "Hiện kim" } },
    ],
    topTeams: Array.from({ length: 5 }, (_, index) => createSeasonArchiveTeamDraft(index, year)),
    photoSlides: Array.from({ length: 10 }, (_, index) => createSeasonArchiveSlideDraft(index, year)),
  };
}

function ensureSeasonDraftRecords(draft: SitePageContent, year: string) {
  if (!draft.organizer.seasonStories.some((item) => item.year === year)) {
    draft.organizer.seasonStories.push(createSeasonStoryDraft(year));
  }

  draft.organizer.seasonArchives = draft.organizer.seasonArchives ?? [];
  if (!draft.organizer.seasonArchives.some((item) => item.year === year)) {
    draft.organizer.seasonArchives.push(createOrganizerSeasonArchiveDraft(year));
  }
}

export function findSeasonRecordIndex(records: Array<{ year: string }>, slotYear: string) {
  const directIndex = records.findIndex((item) => item.year === slotYear);

  if (directIndex >= 0) {
    return directIndex;
  }

  const slotIndex = seasonContentYears.findIndex((item) => item === slotYear);
  return slotIndex >= 0 && slotIndex < records.length ? slotIndex : -1;
}

export function getSeasonSlotDisplayYear(content: SitePageContent, slotYear: string) {
  const storyIndex = findSeasonRecordIndex(content.organizer.seasonStories, slotYear);
  return content.organizer.seasonStories[storyIndex]?.year ?? slotYear;
}

function unoptimizedImage(src: string) {
  return src.startsWith("/api/hero-slide-images/") || src.startsWith("data:");
}

function BlockIntro({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <p className="text-sm font-semibold theme-text-strong">{title}</p>
      <p className="mt-2 text-sm leading-7 theme-text-soft">{description}</p>
    </div>
  );
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
      {(["en", "vi"] as Locale[]).map((language) => (
        <label key={language} className="space-y-2">
          <span className="text-sm theme-text-muted">{`${label} (${language.toUpperCase()})`}</span>
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

function LocalizedListEditor({
  title,
  items,
  itemLabel,
  rows,
  onChange,
  onAdd,
  onRemove,
  minItems = 1,
}: {
  title: string;
  items: LocalizedText[];
  itemLabel: string;
  rows: number;
  onChange: (itemIndex: number, locale: Locale, value: string) => void;
  onAdd: () => void;
  onRemove: (itemIndex: number) => void;
  minItems?: number;
}) {
  return (
    <div className="space-y-4 rounded-[1.25rem] border theme-border px-4 py-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm font-semibold theme-text-strong">{title}</p>
        <button
          type="button"
          onClick={onAdd}
          className="theme-button-secondary inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold"
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </button>
      </div>
      {items.map((item, index) => (
        <div key={`${itemLabel}-${index}`} className="space-y-3 rounded-2xl border theme-border theme-panel-subtle px-3 py-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] theme-eyebrow">
              {itemLabel} {index + 1}
            </p>
            <button
              type="button"
              disabled={items.length <= minItems}
              onClick={() => onRemove(index)}
              className="theme-button-danger inline-flex h-8 w-8 items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Remove item"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <LocalizedFieldEditor
            label={itemLabel}
            rows={rows}
            value={item}
            onChange={(language, value) => onChange(index, language, value)}
          />
        </div>
      ))}
    </div>
  );
}

export function SeasonLinksContentEditor({ locale, draft }: { locale: Locale; draft: SitePageContent }) {
  return (
    <Surface className="space-y-5 px-5 py-5 md:px-6 md:py-6">
      <BlockIntro
        title="Seasons"
        description="Open one season editor to update the public detail page, including text, top teams, statistics, and slider images."
      />
      <div className="grid gap-3 md:grid-cols-2">
        {seasonContentYears.map((slotYear) => {
          const displayYear = getSeasonSlotDisplayYear(draft, slotYear);

          return (
          <Link key={slotYear} href={`/admin/content/pages/season-${slotYear}`} className="block">
            <div className="group rounded-[1.35rem] border theme-border theme-panel-subtle px-4 py-4 transition hover:border-sky-300/40 hover:bg-[rgba(23,114,208,0.06)]">
              <div className="flex items-center gap-3">
                <span className="theme-brand-gradient flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-[0_16px_34px_rgba(23,114,208,0.18)]">
                  <Images className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold theme-text-strong">
                    {locale === "en" ? `Season ${displayYear}` : `Mùa ${displayYear}`}
                  </p>
                  <p className="mt-1 text-xs leading-5 theme-text-muted">
                    {locale === "en"
                      ? "Edit archive text, top team profiles, stats, and slider photos."
                      : "Chỉnh nội dung lưu trữ, top đội, thống kê và ảnh slider."}
                  </p>
                </div>
              </div>
            </div>
          </Link>
          );
        })}
      </div>
    </Surface>
  );
}

export function SeasonArchiveContentEditor({
  locale,
  draft,
  setDraft,
  year,
}: {
  locale: Locale;
  draft: SitePageContent;
  setDraft: Dispatch<SetStateAction<SitePageContent>>;
  year: string;
}) {
  const [imageUploadError, setImageUploadError] = useState("");
  const [uploadingImageKey, setUploadingImageKey] = useState<string | null>(null);
  const storyIndex = findSeasonRecordIndex(draft.organizer.seasonStories, year);
  const seasonArchives = draft.organizer.seasonArchives ?? [];
  const archiveIndex = findSeasonRecordIndex(seasonArchives, year);

  useEffect(() => {
    if (storyIndex >= 0 && archiveIndex >= 0) {
      return;
    }

    setDraft((current) =>
      updateDraftContent(current, (next) => {
        ensureSeasonDraftRecords(next, year);
      }),
    );
  }, [archiveIndex, setDraft, storyIndex, year]);

  const uploadSeasonImage = async (
    file: File,
    key: string,
    applyImageUrl: (next: SitePageContent, imageUrl: string) => void,
  ) => {
    if (!file.type.startsWith("image/")) {
      setImageUploadError(locale === "en" ? "Only image files are allowed." : "Chỉ chấp nhận tệp hình ảnh.");
      return;
    }
    if (file.size > MAX_SEASON_IMAGE_BYTES) {
      setImageUploadError(
        locale === "en"
          ? `Images must be ${formatFileSize(MAX_SEASON_IMAGE_BYTES)} or smaller.`
          : `Ảnh phải có dung lượng ${formatFileSize(MAX_SEASON_IMAGE_BYTES)} trở xuống.`,
      );
      return;
    }

    const formData = new FormData();
    formData.append("imageFile", file);
    setUploadingImageKey(key);
    setImageUploadError("");

    try {
      const response = await fetch("/api/admin/content/hero-slides/image", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json().catch(() => null)) as { imageUrl?: string; error?: string } | null;

      if (!response.ok || !payload?.imageUrl) {
        throw new Error(
          payload?.error || (locale === "en" ? "The image could not be uploaded." : "Không thể tải ảnh."),
        );
      }

      setDraft((current) =>
        updateDraftContent(current, (next) => {
          applyImageUrl(next, payload.imageUrl!);
        }),
      );
    } catch (error) {
      setImageUploadError(
        error instanceof Error
          ? error.message
          : locale === "en"
            ? "The image could not be uploaded."
            : "Không thể tải ảnh.",
      );
    } finally {
      setUploadingImageKey(null);
    }
  };

  if (storyIndex < 0 || archiveIndex < 0) {
    return (
      <Surface className="space-y-5 px-5 py-5 md:px-6 md:py-6">
        <BlockIntro
          title={`Season ${year}`}
          description={
            locale === "en"
              ? "Preparing editable fields for this season. The editor will open automatically."
              : "Đang chuẩn bị các trường chỉnh sửa cho mùa thi này. Trình chỉnh sửa sẽ tự mở."
          }
        />
      </Surface>
    );
  }

  const story = draft.organizer.seasonStories[storyIndex];
  const archive = draft.organizer.seasonArchives[archiveIndex];
  const publicSeasonYear = story.year.trim() || year;

  return (
    <>
      <Surface className="space-y-5 px-5 py-5 md:px-6 md:py-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <BlockIntro
            title={`Season ${publicSeasonYear} / Public page`}
            description="Edit every public text block and upload every image used by this season page."
          />
          <Link
            href={`/organizer/seasons/${encodeURIComponent(publicSeasonYear)}`}
            className="theme-button-secondary inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold"
          >
            {locale === "en" ? "Open live page" : "Mở trang mùa thi"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {imageUploadError ? (
          <p className="rounded-2xl border border-rose-300/35 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-600 dark:text-rose-200">
            {imageUploadError}
          </p>
        ) : null}
      </Surface>

      <Surface className="space-y-5 px-5 py-5 md:px-6 md:py-6">
        <BlockIntro
          title="Hero and season card"
          description="These fields control the top hero and the season card on the organizer page."
        />
        <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
          <div className="space-y-3">
            <div className="overflow-hidden rounded-[1.35rem] border theme-border theme-panel-subtle">
              <div className="relative aspect-[4/3]">
                {story.image ? (
                  <Image
                    src={story.image}
                    alt={pickText(locale, story.title)}
                    fill
                    sizes="260px"
                    unoptimized={unoptimizedImage(story.image)}
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm theme-text-soft">
                    {locale === "en" ? "No image" : "Chưa có ảnh"}
                  </div>
                )}
              </div>
            </div>
            <label className="theme-button-secondary inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold">
              <Upload className="h-4 w-4" />
              {uploadingImageKey === "hero"
                ? locale === "en"
                  ? "Uploading..."
                  : "Đang tải..."
                : locale === "en"
                  ? "Upload hero image"
                  : "Tải ảnh hero"}
              <input
                type="file"
                accept="image/*"
                disabled={uploadingImageKey === "hero"}
                className="hidden"
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (!file) return;
                  void uploadSeasonImage(file, "hero", (next, imageUrl) => {
                    const nextStoryIndex = findSeasonRecordIndex(next.organizer.seasonStories, year);
                    if (nextStoryIndex >= 0) next.organizer.seasonStories[nextStoryIndex].image = imageUrl;
                  });
                }}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm theme-text-muted">Hero image path</span>
              <input
                value={story.image}
                onChange={(event) =>
                  setDraft((current) =>
                    updateDraftContent(current, (next) => {
                      next.organizer.seasonStories[storyIndex].image = event.target.value;
                    }),
                  )
                }
                className={fieldClassName}
              />
            </label>
          </div>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-[160px_minmax(0,1fr)]">
              <label className="space-y-2">
                <span className="text-sm theme-text-muted">Year</span>
                <input
                  value={story.year}
                  onChange={(event) => {
                    const nextYear = event.target.value;
                    setDraft((current) =>
                      updateDraftContent(current, (next) => {
                        const nextStoryIndex = findSeasonRecordIndex(next.organizer.seasonStories, year);
                        const nextArchiveIndex = findSeasonRecordIndex(next.organizer.seasonArchives ?? [], year);

                        if (nextStoryIndex >= 0) {
                          next.organizer.seasonStories[nextStoryIndex].year = nextYear;
                        }

                        if (nextArchiveIndex >= 0) {
                          next.organizer.seasonArchives[nextArchiveIndex].year = nextYear;
                        }
                      }),
                    );
                  }}
                  className={fieldClassName}
                />
              </label>
              <LocalizedFieldEditor
                label="Season focus label"
                rows={2}
                value={story.label}
                onChange={(language, value) =>
                  setDraft((current) =>
                    updateDraftContent(current, (next) => {
                      next.organizer.seasonStories[storyIndex].label[language] = value;
                    }),
                  )
                }
              />
            </div>
            <LocalizedFieldEditor
              label="Hero title"
              rows={3}
              value={story.title}
              onChange={(language, value) =>
                setDraft((current) =>
                  updateDraftContent(current, (next) => {
                    next.organizer.seasonStories[storyIndex].title[language] = value;
                  }),
                )
              }
            />
            <LocalizedFieldEditor
              label="Hero body"
              rows={4}
              value={story.body}
              onChange={(language, value) =>
                setDraft((current) =>
                  updateDraftContent(current, (next) => {
                    next.organizer.seasonStories[storyIndex].body[language] = value;
                  }),
                )
              }
            />
            <LocalizedListEditor
              title="Season card chips"
              items={story.stats}
              itemLabel="Chip"
              rows={2}
              onChange={(itemIndex, language, value) =>
                setDraft((current) =>
                  updateDraftContent(current, (next) => {
                    next.organizer.seasonStories[storyIndex].stats[itemIndex][language] = value;
                  }),
                )
              }
              onAdd={() =>
                setDraft((current) =>
                  updateDraftContent(current, (next) => {
                    next.organizer.seasonStories[storyIndex].stats.push(createBlankLocalizedText());
                  }),
                )
              }
              onRemove={(itemIndex) =>
                setDraft((current) =>
                  updateDraftContent(current, (next) => {
                    next.organizer.seasonStories[storyIndex].stats = next.organizer.seasonStories[
                      storyIndex
                    ].stats.filter((_, currentIndex) => currentIndex !== itemIndex);
                  }),
                )
              }
            />
          </div>
        </div>
      </Surface>

      <Surface className="space-y-5 px-5 py-5 md:px-6 md:py-6">
        <BlockIntro
          title="Archive story and statistics"
          description="Edit the main content and the centered statistic cards on the season detail page."
        />
        <LocalizedFieldEditor
          label="Archive overview title"
          rows={3}
          value={archive.overviewTitle}
          onChange={(language, value) =>
            setDraft((current) =>
              updateDraftContent(current, (next) => {
                next.organizer.seasonArchives[archiveIndex].overviewTitle[language] = value;
              }),
            )
          }
        />
        <LocalizedListEditor
          title="Overview paragraphs"
          items={archive.overview}
          itemLabel="Paragraph"
          rows={4}
          onChange={(itemIndex, language, value) =>
            setDraft((current) =>
              updateDraftContent(current, (next) => {
                next.organizer.seasonArchives[archiveIndex].overview[itemIndex][language] = value;
              }),
            )
          }
          onAdd={() =>
            setDraft((current) =>
              updateDraftContent(current, (next) => {
                next.organizer.seasonArchives[archiveIndex].overview.push(createBlankLocalizedText());
              }),
            )
          }
          onRemove={(itemIndex) =>
            setDraft((current) =>
              updateDraftContent(current, (next) => {
                next.organizer.seasonArchives[archiveIndex].overview = next.organizer.seasonArchives[
                  archiveIndex
                ].overview.filter((_, currentIndex) => currentIndex !== itemIndex);
              }),
            )
          }
        />
        <div className="grid gap-3 md:grid-cols-2">
          {archive.stats.map((stat, statIndex) => (
            <div key={`season-stat-${statIndex}`} className="rounded-[1.25rem] border theme-border px-4 py-4">
              <div className="grid gap-4 md:grid-cols-[140px_minmax(0,1fr)]">
                <label className="space-y-2">
                  <span className="text-sm theme-text-muted">Value</span>
                  <input
                    value={stat.value}
                    onChange={(event) =>
                      setDraft((current) =>
                        updateDraftContent(current, (next) => {
                          next.organizer.seasonArchives[archiveIndex].stats[statIndex].value = event.target.value;
                        }),
                      )
                    }
                    className={fieldClassName}
                  />
                </label>
                <LocalizedFieldEditor
                  label={`Stat ${statIndex + 1} label`}
                  rows={2}
                  value={stat.label}
                  onChange={(language, value) =>
                    setDraft((current) =>
                      updateDraftContent(current, (next) => {
                        next.organizer.seasonArchives[archiveIndex].stats[statIndex].label[language] = value;
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
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <BlockIntro title="Top 5 teams" description="Each team becomes one full-width block on the public page." />
          <button
            type="button"
            onClick={() =>
              setDraft((current) =>
                updateDraftContent(current, (next) => {
                  next.organizer.seasonArchives[archiveIndex].topTeams.push(
                    createSeasonArchiveTeamDraft(next.organizer.seasonArchives[archiveIndex].topTeams.length, year),
                  );
                }),
              )
            }
            className="theme-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
          >
            <Plus className="h-4 w-4" />
            {locale === "en" ? "Add team" : "Thêm đội"}
          </button>
        </div>
        <div className="space-y-4">
          {archive.topTeams.map((team, teamIndex) => (
            <Surface key={`season-team-${teamIndex}`} className="space-y-4 px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold theme-text-strong">
                  {locale === "en" ? `Team block ${teamIndex + 1}` : `Đội ${teamIndex + 1}`}
                </p>
                <button
                  type="button"
                  disabled={archive.topTeams.length <= 1}
                  onClick={() =>
                    setDraft((current) =>
                      updateDraftContent(current, (next) => {
                        next.organizer.seasonArchives[archiveIndex].topTeams = next.organizer.seasonArchives[
                          archiveIndex
                        ].topTeams.filter((_, currentIndex) => currentIndex !== teamIndex);
                      }),
                    )
                  }
                  className="theme-button-danger inline-flex h-9 w-9 items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label={locale === "en" ? "Delete team" : "Xóa đội"}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <LocalizedFieldEditor
                  label="Rank"
                  rows={2}
                  value={team.rank}
                  onChange={(language, value) =>
                    setDraft((current) =>
                      updateDraftContent(current, (next) => {
                        next.organizer.seasonArchives[archiveIndex].topTeams[teamIndex].rank[language] = value;
                      }),
                    )
                  }
                />
                <LocalizedFieldEditor
                  label="Team name"
                  rows={2}
                  value={team.name}
                  onChange={(language, value) =>
                    setDraft((current) =>
                      updateDraftContent(current, (next) => {
                        next.organizer.seasonArchives[archiveIndex].topTeams[teamIndex].name[language] = value;
                      }),
                    )
                  }
                />
              </div>
              <LocalizedFieldEditor
                label="Project name"
                rows={2}
                value={team.projectName}
                onChange={(language, value) =>
                  setDraft((current) =>
                    updateDraftContent(current, (next) => {
                      next.organizer.seasonArchives[archiveIndex].topTeams[teamIndex].projectName[language] = value;
                    }),
                  )
                }
              />
              <LocalizedFieldEditor
                label="Project description"
                rows={3}
                value={team.projectDescription}
                onChange={(language, value) =>
                  setDraft((current) =>
                    updateDraftContent(current, (next) => {
                      next.organizer.seasonArchives[archiveIndex].topTeams[teamIndex].projectDescription[language] = value;
                    }),
                  )
                }
              />
              <div className="space-y-3 rounded-[1.25rem] border theme-border px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold theme-text-strong">
                    {locale === "en" ? "Members" : "Thành viên"}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setDraft((current) =>
                        updateDraftContent(current, (next) => {
                          next.organizer.seasonArchives[archiveIndex].topTeams[teamIndex].members.push({
                            name: "",
                            university: "",
                            major: "",
                          });
                        }),
                      )
                    }
                    className="theme-button-secondary inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {locale === "en" ? "Add member" : "Thêm thành viên"}
                  </button>
                </div>
                <div className="space-y-2">
                  {team.members.map((member, memberIndex) => (
                    <div
                      key={`team-${teamIndex}-member-${memberIndex}`}
                      className="grid gap-3 rounded-2xl border theme-border theme-panel-subtle px-3 py-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_40px]"
                    >
                      {(["name", "university", "major"] as const).map((field) => (
                        <label key={field} className="space-y-2">
                          <span className="text-xs capitalize theme-text-muted">{field}</span>
                          <input
                            value={member[field]}
                            onChange={(event) =>
                              setDraft((current) =>
                                updateDraftContent(current, (next) => {
                                  next.organizer.seasonArchives[archiveIndex].topTeams[teamIndex].members[
                                    memberIndex
                                  ][field] = event.target.value;
                                }),
                              )
                            }
                            className={fieldClassName}
                          />
                        </label>
                      ))}
                      <button
                        type="button"
                        disabled={team.members.length <= 1}
                        onClick={() =>
                          setDraft((current) =>
                            updateDraftContent(current, (next) => {
                              next.organizer.seasonArchives[archiveIndex].topTeams[teamIndex].members =
                                next.organizer.seasonArchives[archiveIndex].topTeams[teamIndex].members.filter(
                                  (_, currentIndex) => currentIndex !== memberIndex,
                                );
                            }),
                          )
                        }
                        className="theme-button-danger mt-6 inline-flex h-10 w-10 items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label={locale === "en" ? "Delete member" : "Xóa thành viên"}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </Surface>
          ))}
        </div>
      </Surface>

      <Surface className="space-y-5 px-5 py-5 md:px-6 md:py-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <BlockIntro
            title="Season photo slider"
            description="Upload and manage images used by the image-only slider at the bottom of the public page."
          />
          <button
            type="button"
            onClick={() =>
              setDraft((current) =>
                updateDraftContent(current, (next) => {
                  next.organizer.seasonArchives[archiveIndex].photoSlides.push(
                    createSeasonArchiveSlideDraft(next.organizer.seasonArchives[archiveIndex].photoSlides.length, year),
                  );
                }),
              )
            }
            className="theme-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
          >
            <Plus className="h-4 w-4" />
            {locale === "en" ? "Add photo" : "Thêm ảnh"}
          </button>
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          {archive.photoSlides.map((slide, slideIndex) => (
            <div key={`season-slide-${slideIndex}`} className="rounded-[1.35rem] border theme-border px-4 py-4">
              <div className="grid gap-4 md:grid-cols-[180px_minmax(0,1fr)]">
                <div className="space-y-3">
                  <div className="overflow-hidden rounded-2xl border theme-border theme-panel-subtle">
                    <div className="relative aspect-[4/3]">
                      {slide.image ? (
                        <Image
                          src={slide.image}
                          alt={pickText(locale, slide.alt)}
                          fill
                          sizes="180px"
                          unoptimized={unoptimizedImage(slide.image)}
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs theme-text-soft">
                          {locale === "en" ? "No image" : "Chưa có ảnh"}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <label className="theme-button-secondary inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold">
                      <Upload className="h-3.5 w-3.5" />
                      {uploadingImageKey === `slide-${slideIndex}`
                        ? locale === "en"
                          ? "Uploading..."
                          : "Đang tải..."
                        : locale === "en"
                          ? "Upload"
                          : "Tải ảnh"}
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploadingImageKey === `slide-${slideIndex}`}
                        className="hidden"
                        onChange={(event: ChangeEvent<HTMLInputElement>) => {
                          const file = event.target.files?.[0];
                          event.target.value = "";
                          if (!file) return;
                          void uploadSeasonImage(file, `slide-${slideIndex}`, (next, imageUrl) => {
                            const nextArchiveIndex = findSeasonRecordIndex(next.organizer.seasonArchives, year);
                            if (nextArchiveIndex >= 0) {
                              next.organizer.seasonArchives[nextArchiveIndex].photoSlides[slideIndex].image =
                                imageUrl;
                            }
                          });
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      disabled={archive.photoSlides.length <= 1}
                      onClick={() =>
                        setDraft((current) =>
                          updateDraftContent(current, (next) => {
                            next.organizer.seasonArchives[archiveIndex].photoSlides = next.organizer.seasonArchives[
                              archiveIndex
                            ].photoSlides.filter((_, currentIndex) => currentIndex !== slideIndex);
                          }),
                        )
                      }
                      className="theme-button-danger inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {locale === "en" ? "Delete" : "Xóa"}
                    </button>
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="space-y-2">
                    <span className="text-sm theme-text-muted">Image path</span>
                    <input
                      value={slide.image}
                      onChange={(event) =>
                        setDraft((current) =>
                          updateDraftContent(current, (next) => {
                            next.organizer.seasonArchives[archiveIndex].photoSlides[slideIndex].image =
                              event.target.value;
                          }),
                        )
                      }
                      className={fieldClassName}
                    />
                  </label>
                  <LocalizedFieldEditor
                    label="Alt text"
                    rows={2}
                    value={slide.alt}
                    onChange={(language, value) =>
                      setDraft((current) =>
                        updateDraftContent(current, (next) => {
                          next.organizer.seasonArchives[archiveIndex].photoSlides[slideIndex].alt[language] = value;
                        }),
                      )
                    }
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Surface>
    </>
  );
}
