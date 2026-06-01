"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

import { pickText } from "@/lib/site";
import { useSiteState } from "@/components/providers/site-state-provider";
import { SectionHeading, Surface } from "@/components/site-ui";

export function getOrganizerSeasonHref(year: string) {
  return `/organizer/seasons/${encodeURIComponent(year)}`;
}

type OrganizerContentProps = {
  showGallery?: boolean;
  showSeasonIntroCopy?: boolean;
  heroImageOverride?: string;
};

export function OrganizerPage() {
  return <OrganizerContent />;
}

export function OrganizerContent({
  showGallery = true,
  showSeasonIntroCopy = true,
  heroImageOverride,
}: OrganizerContentProps = {}) {
  const { locale, pageContent } = useSiteState();
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  const [expandedGalleryIndex, setExpandedGalleryIndex] = useState<number | null>(null);
  const organizerContent = pageContent.organizer;
  const heroImage = heroImageOverride || organizerContent.heroImage;
  const seasonStories = organizerContent.seasonStories;
  const gallerySlides = organizerContent.gallerySlides;
  const activeGallerySlide = gallerySlides[activeGalleryIndex];
  const expandedGallerySlide =
    expandedGalleryIndex === null ? null : gallerySlides[expandedGalleryIndex];

  useEffect(() => {
    if (expandedGalleryIndex === null) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setExpandedGalleryIndex(null);
        return;
      }

      if (event.key === "ArrowLeft") {
        setExpandedGalleryIndex((current) =>
          current === null ? 0 : (current - 1 + gallerySlides.length) % gallerySlides.length,
        );
        return;
      }

      if (event.key === "ArrowRight") {
        setExpandedGalleryIndex((current) =>
          current === null ? 0 : (current + 1) % gallerySlides.length,
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [expandedGalleryIndex, gallerySlides.length]);

  const shiftGallery = (direction: -1 | 1) => {
    setActiveGalleryIndex((current) => (current + direction + gallerySlides.length) % gallerySlides.length);
  };

  const shiftExpandedGallery = (direction: -1 | 1) => {
    setExpandedGalleryIndex((current) =>
      current === null ? 0 : (current + direction + gallerySlides.length) % gallerySlides.length,
    );
  };

  return (
    <div className="space-y-16">
      <section className="theme-card-shadow-soft relative min-h-[520px] overflow-hidden rounded-[2.4rem] border theme-border-strong">
        <Image
          src={heroImage}
          alt={pickText(locale, organizerContent.heroCard.title)}
          fill
          sizes="100vw"
          className="object-cover"
          unoptimized={
            heroImage.startsWith("/api/content-images/") ||
            heroImage.startsWith("/api/hero-slide-images/")
          }
          priority
        />
        <div className="absolute inset-0 bg-[linear-gradient(106deg,rgba(4,14,30,0.86)_0%,rgba(5,18,39,0.66)_45%,rgba(5,18,39,0.28)_72%,rgba(5,18,39,0.42)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.24),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(251,146,60,0.16),transparent_30%)]" />
        <div className="relative flex min-h-[520px] items-end px-5 py-8 md:px-9 md:py-10 lg:px-12">
          <div className="max-w-4xl text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-cyan-100/80">
              {pickText(locale, pageContent.organizer.header.eyebrow)}
            </p>
            <h1 className="theme-heading mt-5 max-w-4xl text-3xl font-semibold tracking-tight text-white md:text-[3.4rem] md:leading-[1.02]">
              {pickText(locale, pageContent.organizer.header.title)}
            </h1>
            <p className="mt-5 max-w-3xl text-sm leading-7 text-white/78 md:text-base md:leading-8">
              {pickText(locale, pageContent.organizer.header.description)}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              {organizerContent.heroBadges.map((item) => (
                <span
                  key={item.en}
                  className="rounded-full border border-white/16 bg-white/12 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/88 shadow-[0_14px_34px_rgba(2,8,20,0.18)] backdrop-blur-md"
                >
                  {pickText(locale, item)}
                </span>
              ))}
            </div>
            <div className="mt-8 max-w-2xl rounded-[1.8rem] border border-white/14 bg-[rgba(7,18,35,0.38)] px-5 py-5 shadow-[0_24px_70px_rgba(2,8,20,0.24)] backdrop-blur-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100/72">
                {pickText(locale, organizerContent.heroCard.eyebrow)}
              </p>
              <p className="theme-heading mt-3 text-xl font-semibold leading-[1.2] text-white md:text-2xl">
                {pickText(locale, organizerContent.heroCard.title)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {organizerContent.metrics.map((item) => (
          <Surface key={`${item.value}-${item.label.en}`} className="theme-card-shadow-soft px-5 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-sky-200/80">
              {pickText(locale, item.label)}
            </p>
            <p className="mt-4 text-4xl font-semibold theme-text-strong">{item.value}</p>
          </Surface>
        ))}
      </section>

      <section className="space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          {showSeasonIntroCopy ? (
            <SectionHeading
              eyebrow={pickText(locale, pageContent.organizer.contentModules.eyebrow)}
              title={pickText(locale, pageContent.organizer.contentModules.title)}
              description={pickText(locale, pageContent.organizer.contentModules.description)}
            />
          ) : (
            <p className="theme-eyebrow text-xs font-semibold uppercase tracking-[0.34em]">
              {pickText(locale, pageContent.organizer.contentModules.eyebrow)}
            </p>
          )}
          <Link href="/competition" className="inline-flex items-center gap-2 text-sm font-semibold theme-accent">
            {pickText(locale, organizerContent.competitionLinkLabel)}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          {seasonStories.map((season) => (
            <Surface key={season.year} className="overflow-hidden px-0 py-0">
              <div className="grid gap-0 lg:min-h-[336px] lg:grid-cols-[220px_minmax(0,1fr)] lg:items-stretch">
                <div className="relative min-h-[260px] overflow-hidden lg:h-full lg:min-h-full">
                  <Link
                    href={getOrganizerSeasonHref(season.year)}
                    aria-label={pickText(locale, season.title)}
                    className="group absolute inset-0"
                  >
                    <Image
                      src={season.image}
                      alt={pickText(locale, season.title)}
                      fill
                      sizes="(min-width: 1280px) 220px, 100vw"
                      className="object-cover object-center transition duration-500 group-hover:scale-[1.04]"
                    />
                  </Link>
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(7,18,35,0.08),rgba(7,18,35,0.24),rgba(7,18,35,0.84))]" />
                  <div className="absolute left-4 top-4 rounded-[1.4rem] border border-white/18 bg-[rgba(6,20,38,0.78)] px-4 py-3 text-white shadow-[0_18px_44px_rgba(2,8,20,0.38)] backdrop-blur-md">
                    <p className="text-[0.58rem] font-semibold uppercase tracking-[0.3em] text-cyan-100/76">
                      {pickText(locale, organizerContent.seasonBadgeLabel)}
                    </p>
                    <p className="mt-1 text-[1.7rem] font-semibold leading-none tracking-[-0.06em] text-white [text-shadow:0_6px_18px_rgba(2,8,20,0.44)]">
                      {season.year}
                    </p>
                  </div>
                </div>
                <div className="flex h-full flex-col justify-between px-6 py-6 md:px-7 md:py-7">
                  <p className="text-xs font-semibold uppercase tracking-[0.26em] theme-eyebrow">
                    {pickText(locale, season.label)}
                  </p>
                  <Link
                    href={getOrganizerSeasonHref(season.year)}
                    className="theme-heading mt-4 block text-2xl font-semibold leading-[1.15] theme-text-strong transition hover:text-[var(--brand)]"
                  >
                    {pickText(locale, season.title)}
                  </Link>
                  <p className="mt-4 text-sm leading-7 theme-text-muted">
                    {pickText(locale, season.body)}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {season.stats.map((item) => (
                      <span
                        key={item.en}
                        className="rounded-full border theme-border bg-white/72 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] theme-text-soft"
                      >
                        {pickText(locale, item)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Surface>
          ))}
        </div>
      </section>

      {showGallery ? (
      <section className="space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.34em] theme-eyebrow">
              {pickText(locale, organizerContent.flags.eyebrow)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => shiftGallery(-1)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border theme-border theme-panel text-[var(--text-strong)] transition hover:-translate-y-0.5"
              aria-label={pickText(locale, organizerContent.previousPhotoLabel)}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => shiftGallery(1)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border theme-border theme-panel text-[var(--text-strong)] transition hover:-translate-y-0.5"
              aria-label={pickText(locale, organizerContent.nextPhotoLabel)}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_330px]">
          <Surface className="overflow-hidden px-0 py-0">
            <button
              type="button"
              onClick={() => setExpandedGalleryIndex(activeGalleryIndex)}
              className="group relative block w-full text-left"
            >
              <div className="relative min-h-[420px] md:min-h-[520px]">
                <Image
                  src={activeGallerySlide.image}
                  alt={pickText(locale, activeGallerySlide.title)}
                  fill
                  sizes="(min-width: 1280px) 900px, 100vw"
                  className="object-cover transition duration-500 group-hover:scale-[1.02]"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,18,35,0.08),rgba(7,18,35,0.18),rgba(7,18,35,0.82))]" />
                <div className="absolute inset-x-0 bottom-0 p-6 text-white md:p-8">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full border border-white/18 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-white/92 backdrop-blur-md">
                      {activeGallerySlide.year}
                    </span>
                    <span className="rounded-full border border-white/12 bg-white/8 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-white/72 backdrop-blur-md">
                      {pickText(locale, activeGallerySlide.label)}
                    </span>
                  </div>
                  <p className="theme-heading mt-5 max-w-3xl text-3xl font-semibold leading-[1.08] md:text-[2.6rem]">
                    {pickText(locale, activeGallerySlide.title)}
                  </p>
                  <p className="mt-4 max-w-3xl text-sm leading-7 text-white/78 md:text-base">
                    {pickText(locale, activeGallerySlide.description)}
                  </p>
                  <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-cyan-200">
                    {pickText(locale, organizerContent.openFullViewLabel)}
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </button>

            <div className="relative border-t theme-border px-4 py-4 md:px-6">
              <div className="pointer-events-none absolute inset-y-0 left-4 z-10 hidden w-10 bg-[linear-gradient(90deg,var(--shell-start),transparent)] md:block" />
              <div className="pointer-events-none absolute inset-y-0 right-4 z-10 hidden w-10 bg-[linear-gradient(270deg,var(--shell-start),transparent)] md:block" />
              <div className="overflow-x-auto scroll-smooth px-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                <div className="flex w-max gap-3">
                {gallerySlides.map((slide, index) => (
                  <button
                    key={`${slide.year}-${slide.image}`}
                    type="button"
                    onClick={() => setActiveGalleryIndex(index)}
                    aria-current={index === activeGalleryIndex}
                    className={`w-[220px] shrink-0 overflow-hidden rounded-[1.5rem] border text-left transition md:w-[240px] ${
                      index === activeGalleryIndex
                        ? "border-sky-300/44 bg-[rgba(23,114,208,0.08)] shadow-[0_18px_42px_rgba(23,114,208,0.12)]"
                        : "theme-border theme-panel-subtle hover:bg-[var(--panel)]"
                    }`}
                  >
                    <div className="relative h-28">
                      <Image
                        src={slide.image}
                        alt={pickText(locale, slide.title)}
                        fill
                        sizes="(min-width: 1280px) 200px, 50vw"
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,18,35,0.02),rgba(7,18,35,0.12),rgba(7,18,35,0.54))]" />
                      <span className="absolute left-3 top-3 rounded-full border border-white/14 bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/90 backdrop-blur-sm">
                        {slide.year}
                      </span>
                    </div>
                    <div className="px-4 py-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] theme-eyebrow">
                        {pickText(locale, slide.label)}
                      </p>
                      <p className="mt-3 text-sm font-semibold leading-6 theme-text-strong">
                        {pickText(locale, slide.title)}
                      </p>
                    </div>
                  </button>
                ))}
                </div>
              </div>
            </div>
          </Surface>

          <Surface className="px-6 py-6 md:px-7 md:py-7">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200/80">
              {pickText(locale, organizerContent.galleryCurrentFrame.eyebrow)}
            </p>
            <p className="mt-4 theme-heading text-2xl font-semibold theme-text-strong">
              {pickText(locale, activeGallerySlide.title)}
            </p>
            <p className="mt-4 text-sm leading-7 theme-text-muted">
              {pickText(locale, activeGallerySlide.description)}
            </p>
            <div className="mt-6 space-y-3">
              {organizerContent.galleryNotes.map((item) => (
                <div
                  key={item.en}
                  className="rounded-2xl border theme-border bg-white/72 px-4 py-3 text-sm leading-7 theme-text-body"
                >
                  {pickText(locale, item)}
                </div>
              ))}
            </div>
          </Surface>
        </div>
      </section>
      ) : null}

      {showGallery && expandedGallerySlide ? (
        <div className="fixed inset-0 z-[80] bg-[rgba(6,12,22,0.82)] p-4 backdrop-blur-md md:p-8">
          <div className="mx-auto flex h-full max-w-7xl flex-col overflow-hidden rounded-[2rem] border border-white/12 bg-[rgba(6,12,22,0.72)] shadow-[0_30px_120px_rgba(2,8,20,0.44)]">
            <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4 md:px-6">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">
                  {expandedGallerySlide.year} · {pickText(locale, expandedGallerySlide.label)}
                </p>
                <p className="mt-2 truncate text-sm text-white/72">
                  {pickText(locale, expandedGallerySlide.title)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setExpandedGalleryIndex(null)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/14 bg-white/8 text-white transition hover:bg-white/12"
                aria-label={pickText(locale, organizerContent.closeGalleryLabel)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative flex-1 bg-slate-950">
              <Image
                src={expandedGallerySlide.image}
                alt={pickText(locale, expandedGallerySlide.title)}
                fill
                sizes="100vw"
                className="object-contain"
              />
              <button
                type="button"
                onClick={() => shiftExpandedGallery(-1)}
                className="absolute left-4 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/14 bg-[rgba(7,18,35,0.54)] text-white transition hover:bg-[rgba(7,18,35,0.72)]"
                aria-label={pickText(locale, organizerContent.previousPhotoLabel)}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => shiftExpandedGallery(1)}
                className="absolute right-4 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/14 bg-[rgba(7,18,35,0.54)] text-white transition hover:bg-[rgba(7,18,35,0.72)]"
                aria-label={pickText(locale, organizerContent.nextPhotoLabel)}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
