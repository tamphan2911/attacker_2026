"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarRange, Sparkles } from "lucide-react";

import { getOrganizerSeasonHref } from "@/components/organizer-page";
import { useSiteState } from "@/components/providers/site-state-provider";
import { SectionHeading, StatusPill, Surface } from "@/components/site-ui";
import { pickText } from "@/lib/site";

export function OrganizerSeasonRoute({ year }: { year: string }) {
  const { hasHydrated, locale, pageContent } = useSiteState();
  const decodedYear = decodeURIComponent(year);
  const seasonStories = pageContent.organizer.seasonStories;
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

  return (
    <div className="space-y-14">
      <BackToOrganizerLink locale={locale} />

      <section className="theme-card-shadow-soft relative overflow-hidden rounded-[2rem] border theme-border-strong">
        <Image
          src={story.image}
          alt={pickText(locale, story.title)}
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-[linear-gradient(118deg,rgba(3,10,24,0.9)_0%,rgba(6,18,39,0.82)_38%,rgba(7,18,35,0.58)_68%,rgba(7,18,35,0.74)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.16),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(251,146,60,0.12),transparent_30%)]" />
        <div className="relative grid gap-6 px-5 py-7 md:px-8 md:py-8 lg:grid-cols-[minmax(0,1fr)_310px] lg:items-end lg:px-10 lg:py-10">
          <div className="max-w-3xl space-y-5 text-white">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-white/16 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-white/78 backdrop-blur-md">
                {pickText(locale, pageContent.organizer.seasonBadgeLabel)} {story.year}
              </span>
              <span className="rounded-full border border-cyan-200/18 bg-cyan-200/12 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100 backdrop-blur-md">
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

          <div className="rounded-[1.7rem] border border-white/12 bg-[rgba(7,18,35,0.44)] p-5 shadow-[0_28px_60px_rgba(2,6,23,0.26)] backdrop-blur-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/64">
              {locale === "en" ? "Season details" : "Thông tin mùa thi"}
            </p>
            <div className="mt-5 space-y-4">
              <div>
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-white/42">
                  {locale === "en" ? "Season" : "Mùa"}
                </p>
                <p className="mt-2 text-sm text-white/82">{story.year}</p>
              </div>
              <div>
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-white/42">
                  {locale === "en" ? "Focus" : "Trọng tâm"}
                </p>
                <p className="mt-2 text-sm leading-7 text-white/82">{pickText(locale, story.label)}</p>
              </div>
              <div className="rounded-[1.35rem] border border-white/10 bg-white/6 px-4 py-4">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-white/42">
                  {locale === "en" ? "Highlights" : "Điểm nhấn"}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {story.stats.map((item) => (
                    <span
                      key={item.en}
                      className="rounded-full border border-white/12 bg-white/8 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-white/78"
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
          <div className="space-y-8">
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
            <p className="text-base leading-8 theme-text-body">{pickText(locale, story.body)}</p>
            <div className="grid gap-3 md:grid-cols-2">
              {story.stats.map((item) => (
                <div
                  key={item.en}
                  className="rounded-[1.5rem] border theme-border theme-panel-subtle px-4 py-4 text-sm font-semibold leading-7 theme-text-strong"
                >
                  <Sparkles className="mb-3 h-4 w-4 text-sky-500 dark:text-cyan-200" />
                  {pickText(locale, item)}
                </div>
              ))}
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
    </div>
  );
}

function BackToOrganizerLink({ locale }: { locale: "en" | "vi" }) {
  return (
    <Link href="/organizer" className="inline-flex items-center gap-2 text-sm font-semibold text-sky-600 dark:text-sky-200">
      <ArrowLeft className="h-4 w-4" />
      {locale === "en" ? "Back to organizer page" : "Quay lại trang giới thiệu"}
    </Link>
  );
}
