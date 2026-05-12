"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  BookOpenText,
  Camera,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Lightbulb,
  Medal,
  Trophy,
  UserRound,
  Users2,
  X,
} from "lucide-react";

import { getOrganizerSeasonHref } from "@/components/organizer-page";
import { useSiteState } from "@/components/providers/site-state-provider";
import { SectionHeading, StatusPill, Surface } from "@/components/site-ui";
import { pickText } from "@/lib/site";
import type { EditableOrganizerSeasonArchive, EditableOrganizerSeasonStory, Locale } from "@/types/site";

function createFallbackSeasonArchive(story: EditableOrganizerSeasonStory): EditableOrganizerSeasonArchive {
  return {
    year: story.year,
    overviewTitle: story.title,
    overview: [story.body],
    stats: [
      ...story.stats.slice(0, 3).map((label, index) => ({
        value: index === 0 ? story.year : "TBD",
        label,
      })),
      { value: "TBD", label: { en: "cash reward", vi: "Hiện kim" } },
    ],
    topTeams: [],
    photoSlides: [{ image: story.image, alt: story.title }],
  };
}

const statisticStyles = [
  {
    Icon: Users2,
    className: "border-sky-300/35 bg-sky-500/12 text-sky-600 dark:text-sky-200",
  },
  {
    Icon: GraduationCap,
    className: "border-emerald-300/35 bg-emerald-500/12 text-emerald-600 dark:text-emerald-200",
  },
  {
    Icon: Trophy,
    className: "border-amber-300/40 bg-amber-500/14 text-amber-600 dark:text-amber-200",
  },
  {
    Icon: Banknote,
    className: "border-fuchsia-300/35 bg-fuchsia-500/12 text-fuchsia-600 dark:text-fuchsia-200",
  },
];

function shouldUseUnoptimizedImage(src: string) {
  return src.startsWith("/api/hero-slide-images/") || src.startsWith("data:");
}

export function OrganizerSeasonRoute({ year }: { year: string }) {
  const { hasHydrated, locale, pageContent } = useSiteState();
  const decodedYear = decodeURIComponent(year);
  const organizerContent = pageContent.organizer as typeof pageContent.organizer & {
    seasonArchives?: EditableOrganizerSeasonArchive[];
  };
  const seasonStories = organizerContent.seasonStories ?? [];
  const story = seasonStories.find((item) => item.year === decodedYear);
  const relatedStories = seasonStories.filter((item) => item.year !== decodedYear).slice(0, 3);

  if (!hasHydrated && !story) {
    return (
      <Surface className="px-6 py-6 md:px-8 md:py-8">
        <SectionHeading
          eyebrow={locale === "en" ? "Organizer" : "Ban tổ chức"}
          title={locale === "en" ? "Loading season story..." : "Đang tải câu chuyện mùa thi..."}
          description={
            locale === "en"
              ? "Waiting for the organizer content dataset to hydrate."
              : "Đang chờ dữ liệu nội dung organizer được tải xong."
          }
        />
      </Surface>
    );
  }

  if (!story) {
    return (
      <div className="space-y-8">
        <BackToOrganizerLink locale={locale} />
        <Surface className="px-6 py-6 md:px-8 md:py-8">
          <SectionHeading
            eyebrow={locale === "en" ? "Organizer" : "Ban tổ chức"}
            title={locale === "en" ? "Season story not found." : "Không tìm thấy câu chuyện mùa thi."}
            description={
              locale === "en"
                ? "The selected season may have been removed from the current organizer content."
                : "Mùa thi được chọn có thể đã bị gỡ khỏi nội dung organizer hiện tại."
            }
          />
        </Surface>
      </div>
    );
  }

  const seasonArchive =
    organizerContent.seasonArchives?.find((item) => item.year === story.year) ?? createFallbackSeasonArchive(story);

  return (
    <SeasonDetailContent
      key={story.year}
      locale={locale}
      story={story}
      seasonArchive={seasonArchive}
      seasonBadgeLabel={pageContent.organizer.seasonBadgeLabel}
      relatedStories={relatedStories}
    />
  );
}

function SeasonDetailContent({
  locale,
  story,
  seasonArchive,
  seasonBadgeLabel,
  relatedStories,
}: {
  locale: Locale;
  story: EditableOrganizerSeasonStory;
  seasonArchive: EditableOrganizerSeasonArchive;
  seasonBadgeLabel: { en: string; vi: string };
  relatedStories: EditableOrganizerSeasonStory[];
}) {
  const photoSlides = useMemo(() => {
    const slides = (seasonArchive.photoSlides ?? [])
      .filter((slide) => slide.image.trim())
      .map((slide) => ({
        image: slide.image,
        alt: slide.alt,
      }));

    return slides.length ? slides : [{ image: story.image, alt: story.title }];
  }, [seasonArchive.photoSlides, story.image, story.title]);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [isPhotoLightboxOpen, setIsPhotoLightboxOpen] = useState(false);
  const safeActivePhotoIndex = activePhotoIndex % photoSlides.length;
  const activePhoto = photoSlides[safeActivePhotoIndex] ?? photoSlides[0];
  const shiftPhoto = (direction: number) => {
    setActivePhotoIndex((current) => (current + direction + photoSlides.length) % photoSlides.length);
  };

  useEffect(() => {
    if (!isPhotoLightboxOpen) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsPhotoLightboxOpen(false);
        return;
      }

      if (event.key === "ArrowLeft") {
        setActivePhotoIndex((current) => (current - 1 + photoSlides.length) % photoSlides.length);
      }

      if (event.key === "ArrowRight") {
        setActivePhotoIndex((current) => (current + 1) % photoSlides.length);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isPhotoLightboxOpen, photoSlides.length]);

  return (
    <div className="space-y-14">
      <BackToOrganizerLink locale={locale} />

      <section className="theme-card-shadow-soft relative overflow-hidden rounded-[2rem] border theme-border-strong">
        <Image
          src={story.image}
          alt={pickText(locale, story.title)}
          fill
          sizes="100vw"
          unoptimized={shouldUseUnoptimizedImage(story.image)}
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-[linear-gradient(118deg,rgba(3,10,24,0.9)_0%,rgba(6,18,39,0.82)_38%,rgba(7,18,35,0.58)_68%,rgba(7,18,35,0.74)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.16),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(251,146,60,0.12),transparent_30%)]" />
        <div className="relative grid gap-6 px-5 py-7 md:px-8 md:py-8 lg:grid-cols-[minmax(0,1fr)_310px] lg:items-end lg:px-10 lg:py-10">
          <div className="max-w-3xl space-y-5 text-white">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-white/16 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-white/78 backdrop-blur-md">
                {pickText(locale, seasonBadgeLabel)} {story.year}
              </span>
              <span className="rounded-full border border-white/16 bg-slate-950/44 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/88 backdrop-blur-md">
                {pickText(locale, story.label)}
              </span>
            </div>
            <h1 className="theme-heading text-3xl font-semibold tracking-tight text-white md:text-[3.1rem] md:leading-[1.04]">
              {pickText(locale, story.title)}
            </h1>
            <p className="max-w-2xl text-base leading-8 text-white/78 md:text-[1.05rem]">
              {pickText(locale, story.body)}
            </p>
          </div>

          <div className="rounded-[1.7rem] border border-white/14 bg-slate-950/72 p-5 shadow-[0_28px_60px_rgba(2,6,23,0.3)] backdrop-blur-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/82">
              {locale === "en" ? "Season details" : "Thông tin mùa thi"}
            </p>
            <div className="mt-5 space-y-4">
              <div>
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-white/64">
                  {locale === "en" ? "Season" : "Mùa"}
                </p>
                <p className="mt-2 text-sm font-semibold text-white">{story.year}</p>
              </div>
              <div>
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-white/64">
                  {locale === "en" ? "Focus" : "Trọng tâm"}
                </p>
                <p className="mt-2 text-sm font-semibold leading-7 text-white/90">{pickText(locale, story.label)}</p>
              </div>
              <div className="rounded-[1.35rem] border border-white/10 bg-white/6 px-4 py-4">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-white/64">
                  {locale === "en" ? "Highlights" : "Điểm nhấn"}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {story.stats.map((item) => (
                    <span
                      key={item.en}
                      className="rounded-full border border-white/16 bg-white/12 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-white/90"
                    >
                      {pickText(locale, item)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Surface className="px-6 py-6 md:px-8 md:py-8">
          <div className="space-y-9">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-500/18 bg-sky-500/10 text-sky-600 dark:text-sky-200">
                <CalendarRange className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] theme-eyebrow">
                  {locale === "en" ? "Season story" : "Câu chuyện mùa thi"}
                </p>
                <p className="mt-1 text-lg font-semibold theme-text-strong">{story.year}</p>
              </div>
            </div>
            <div>
              <h2 className="theme-heading text-2xl font-semibold theme-text-strong md:text-3xl">
                {pickText(locale, seasonArchive.overviewTitle)}
              </h2>
              <div className="mt-4 space-y-3">
                {seasonArchive.overview.map((paragraph) => (
                  <p key={paragraph.en} className="text-base leading-8 theme-text-body">
                    {pickText(locale, paragraph)}
                  </p>
                ))}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {seasonArchive.stats.map((item, index) => {
                const style = statisticStyles[index % statisticStyles.length];
                const Icon = style.Icon;

                return (
                  <div
                    key={`${item.value}-${item.label.en}`}
                    className="rounded-[1.45rem] border theme-border theme-panel-subtle px-4 py-5 text-center shadow-[0_18px_46px_rgba(15,23,42,0.06)]"
                  >
                    <span
                      className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border ${style.className}`}
                    >
                      <Icon className="h-6 w-6" />
                    </span>
                    <p className="theme-heading mt-4 text-3xl font-semibold theme-text-strong">{item.value}</p>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] theme-eyebrow">
                      {pickText(locale, item.label)}
                    </p>
                  </div>
                );
              })}
            </div>

            <div>
              <div className="flex items-center gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-200">
                  <Trophy className="h-5 w-5" />
                </span>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] theme-eyebrow">
                  {locale === "en" ? "Top 5 teams" : "Top 5 đội thi"}
                </p>
              </div>

              <div className="mt-5 space-y-4">
                {seasonArchive.topTeams.length ? (
                  seasonArchive.topTeams.map((team, index) => (
                    <div
                      key={`${team.name.en}-${team.rank.en}-${index}`}
                      className="rounded-[1.5rem] border theme-border theme-panel-subtle px-4 py-4 shadow-[0_18px_46px_rgba(15,23,42,0.05)]"
                    >
                      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.72fr)] lg:items-start">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/32 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-amber-700 dark:text-amber-200">
                              <Medal className="h-3.5 w-3.5" />
                              {pickText(locale, team.rank)}
                            </span>
                            <span className="inline-flex items-center gap-2 rounded-full border theme-border bg-white/60 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] theme-text-strong dark:bg-white/6">
                              <Users2 className="h-3.5 w-3.5 text-sky-500 dark:text-cyan-200" />
                              {pickText(locale, team.name)}
                            </span>
                          </div>
                          <div className="flex gap-3">
                            <span className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/26 bg-cyan-500/10 text-cyan-600 dark:text-cyan-200">
                              <Lightbulb className="h-4 w-4" />
                            </span>
                            <div>
                              <p className="theme-heading text-lg font-semibold theme-text-strong">
                                {pickText(locale, team.projectName)}
                              </p>
                              <p className="mt-2 text-sm leading-7 theme-text-body">
                                {pickText(locale, team.projectDescription)}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-[1.25rem] border theme-border bg-white/58 px-3 py-3 dark:bg-white/5">
                          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] theme-eyebrow">
                            <BookOpenText className="h-4 w-4" />
                            {locale === "en" ? "Members" : "Thành viên"}
                          </div>
                          <div className="space-y-2">
                            {(team.members ?? []).map((member) => (
                              <div
                                key={`${member.name}-${member.major}`}
                                className="grid gap-2 rounded-2xl border theme-border bg-white/72 px-3 py-2 text-sm dark:bg-slate-950/20"
                              >
                                <p className="inline-flex items-center gap-2 font-semibold theme-text-strong">
                                  <UserRound className="h-4 w-4 text-sky-500 dark:text-cyan-200" />
                                  {member.name}
                                </p>
                                <p className="pl-6 text-xs leading-5 theme-text-muted">
                                  {member.university} · {member.major}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[1.5rem] border theme-border theme-panel-subtle px-5 py-5 text-sm theme-text-muted">
                    {locale === "en"
                      ? "Top team records are ready to be added from the admin season editor."
                      : "Hồ sơ đội top đầu đã sẵn sàng để cập nhật trong trang quản trị mùa thi."}
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-600 dark:text-cyan-200">
                  <Camera className="h-5 w-5" />
                </span>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] theme-eyebrow">
                  {locale === "en" ? "Featured images" : "Hình ảnh nổi bật"}
                </p>
              </div>

              <div className="mt-5 overflow-hidden rounded-[1.7rem] border theme-border theme-panel-subtle">
                <div className="relative aspect-[16/9] min-h-[260px]">
                  <Image
                    key={`${activePhoto.image}-${safeActivePhotoIndex}`}
                    src={activePhoto.image}
                    alt={pickText(locale, activePhoto.alt)}
                    fill
                    sizes="(min-width: 1024px) 880px, 100vw"
                    unoptimized={shouldUseUnoptimizedImage(activePhoto.image)}
                    className="season-gallery-image object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/44 to-transparent" />
                  <button
                    type="button"
                    onClick={() => setIsPhotoLightboxOpen(true)}
                    className="absolute inset-0 z-10 cursor-zoom-in"
                    aria-label={locale === "en" ? "Open featured image viewer" : "Mở trình xem hình ảnh nổi bật"}
                  >
                    <span className="sr-only">
                      {locale === "en" ? "Open featured image viewer" : "Mở trình xem hình ảnh nổi bật"}
                    </span>
                  </button>
                  {photoSlides.length > 1 ? (
                    <>
                      <button
                        type="button"
                        onClick={() => shiftPhoto(-1)}
                        className="absolute left-4 top-1/2 z-20 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/28 bg-slate-950/46 text-white shadow-[0_18px_34px_rgba(2,6,23,0.26)] backdrop-blur-md transition duration-300 hover:-translate-x-0.5 hover:bg-slate-950/64"
                        aria-label={locale === "en" ? "Previous photo" : "Ảnh trước"}
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => shiftPhoto(1)}
                        className="absolute right-4 top-1/2 z-20 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/28 bg-slate-950/46 text-white shadow-[0_18px_34px_rgba(2,6,23,0.26)] backdrop-blur-md transition duration-300 hover:translate-x-0.5 hover:bg-slate-950/64"
                        aria-label={locale === "en" ? "Next photo" : "Ảnh tiếp theo"}
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                      <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
                        {photoSlides.map((slide, index) => (
                          <button
                            key={`${slide.image}-${index}`}
                            type="button"
                            onClick={() => setActivePhotoIndex(index)}
                            className={`h-2.5 rounded-full transition-all ${
                              index === safeActivePhotoIndex ? "w-8 bg-white" : "w-2.5 bg-white/52 hover:bg-white/78"
                            }`}
                            aria-label={
                              locale === "en" ? `Open photo ${index + 1}` : `Mở ảnh ${index + 1}`
                            }
                          />
                        ))}
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </Surface>

        <Surface className="h-fit px-6 py-6">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-600 dark:text-sky-200/80">
            {locale === "en" ? "Other seasons" : "Mùa khác"}
          </p>
          <div className="mt-5 space-y-4">
            {relatedStories.map((item) => (
              <Link key={item.year} href={getOrganizerSeasonHref(item.year)} className="block">
                <div className="rounded-[1.7rem] border theme-border theme-panel px-4 py-4 transition hover:border-sky-300/28 hover:bg-[var(--panel-strong)]">
                  <StatusPill>{item.year}</StatusPill>
                  <p className="mt-4 text-base font-semibold leading-7 theme-text-strong">
                    {pickText(locale, item.title)}
                  </p>
                  <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-sky-600 dark:text-cyan-200">
                    {locale === "en" ? "Open season" : "Mở mùa thi"}
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Surface>
      </section>

      {isPhotoLightboxOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={locale === "en" ? "Featured images viewer" : "Trình xem hình ảnh nổi bật"}
          className="season-gallery-lightbox fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/92 px-4 py-5 text-white backdrop-blur-xl sm:px-6"
          onClick={() => setIsPhotoLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setIsPhotoLightboxOpen(false);
            }}
            className="absolute right-4 top-4 z-30 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/18 bg-white/10 text-white shadow-[0_18px_40px_rgba(2,6,23,0.36)] backdrop-blur-md transition duration-300 hover:bg-white/18 sm:right-6 sm:top-6"
            aria-label={locale === "en" ? "Close image viewer" : "Đóng trình xem ảnh"}
          >
            <X className="h-5 w-5" />
          </button>

          <div
            className="relative flex h-full w-full max-w-7xl items-center justify-center"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative h-[78vh] max-h-[820px] w-full overflow-hidden rounded-[1.7rem] border border-white/14 bg-black/28 shadow-[0_30px_90px_rgba(0,0,0,0.42)]">
              <Image
                key={`lightbox-${activePhoto.image}-${safeActivePhotoIndex}`}
                src={activePhoto.image}
                alt={pickText(locale, activePhoto.alt)}
                fill
                sizes="100vw"
                unoptimized={shouldUseUnoptimizedImage(activePhoto.image)}
                className="season-gallery-image object-contain"
                priority
              />
            </div>

            {photoSlides.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={() => shiftPhoto(-1)}
                  className="absolute left-0 top-1/2 z-20 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white shadow-[0_20px_44px_rgba(0,0,0,0.34)] backdrop-blur-md transition duration-300 hover:-translate-x-0.5 hover:bg-white/18 sm:left-4"
                  aria-label={locale === "en" ? "Previous photo" : "Ảnh trước"}
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={() => shiftPhoto(1)}
                  className="absolute right-0 top-1/2 z-20 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white shadow-[0_20px_44px_rgba(0,0,0,0.34)] backdrop-blur-md transition duration-300 hover:translate-x-0.5 hover:bg-white/18 sm:right-4"
                  aria-label={locale === "en" ? "Next photo" : "Ảnh tiếp theo"}
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            ) : null}

            <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 rounded-full border border-white/14 bg-slate-950/46 px-4 py-2 text-xs font-semibold text-white/86 shadow-[0_18px_42px_rgba(0,0,0,0.32)] backdrop-blur-md">
              <span>{safeActivePhotoIndex + 1}</span>
              <span className="h-1 w-1 rounded-full bg-white/42" />
              <span>{photoSlides.length}</span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function BackToOrganizerLink({ locale }: { locale: Locale }) {
  return (
    <Link href="/organizer" className="inline-flex items-center gap-2 text-sm font-semibold text-sky-600 dark:text-sky-200">
      <ArrowLeft className="h-4 w-4" />
      {locale === "en" ? "Back to organizer page" : "Quay lại trang giới thiệu"}
    </Link>
  );
}
