"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Award,
  Badge,
  BriefcaseBusiness,
  Crown,
  GraduationCap,
  Quote,
  Sparkles,
  Star,
} from "lucide-react";

import { defaultPageContent } from "@/data/site-content";
import { pickText } from "@/lib/site";
import { useSiteState } from "@/components/providers/site-state-provider";
import { Surface } from "@/components/site-ui";

const homepageRewardItems = [
  {
    rank: { en: "1st place", vi: "Hạng 1" },
    title: { en: "Champion", vi: "Quán quân" },
    amount: { en: "30,000,000 VND", vi: "30.000.000 VND" },
    note: {
      en: "Awarded to the team with the highest final-round score.",
      vi: "Trao cho đội có điểm cao nhất ở vòng chung kết.",
    },
    icon: Crown,
    iconClass: "bg-[linear-gradient(135deg,#f59e0b,#facc15)] text-slate-950",
    borderClass: "border-amber-300/50",
  },
  {
    rank: { en: "2nd place", vi: "Hạng 2" },
    title: { en: "Runner-up", vi: "Á quân" },
    amount: { en: "15,000,000 VND", vi: "15.000.000 VND" },
    note: {
      en: "Awarded to the team with the second-highest final-round score.",
      vi: "Trao cho đội có điểm cao thứ hai ở vòng chung kết.",
    },
    icon: Badge,
    iconClass: "bg-[linear-gradient(135deg,#e2e8f0,#cbd5e1)] text-slate-950",
    borderClass: "border-slate-300/60",
  },
  {
    rank: { en: "3rd place", vi: "Hạng 3" },
    title: { en: "Third place", vi: "Quý quân" },
    amount: { en: "10,000,000 VND", vi: "10.000.000 VND" },
    note: {
      en: "Awarded to the team with the third-highest final-round score.",
      vi: "Trao cho đội có điểm cao thứ ba ở vòng chung kết.",
    },
    icon: Award,
    iconClass: "bg-[linear-gradient(135deg,#fb923c,#f97316)] text-white",
    borderClass: "border-orange-300/50",
  },
  {
    rank: { en: "4th place", vi: "Hạng 4" },
    title: { en: "Two finalist teams", vi: "Hai đội đồng hạng 4" },
    amount: { en: "5,000,000 VND each team", vi: "5.000.000 VND mỗi đội" },
    note: {
      en: "The remaining two finalists each receive the fourth-place award.",
      vi: "Hai đội còn lại trong top 5 chung kết, mỗi đội nhận giải hạng 4.",
    },
    icon: Star,
    iconClass: "bg-[linear-gradient(135deg,#38bdf8,#14b8a6)] text-white",
    borderClass: "border-cyan-300/40",
  },
] as const;

const testimonialQuoteClasses = [
  "text-[#7c3aed] bg-[rgba(124,58,237,0.1)]",
  "text-[#ec4899] bg-[rgba(236,72,153,0.1)]",
  "text-[#2563eb] bg-[rgba(37,99,235,0.1)]",
] as const;

function pickRewardAmount(locale: "en" | "vi", amount: { en: string; vi: string }, index: number) {
  if (index === 3) {
    return locale === "en" ? "5,000,000 VND each team" : "5.000.000 VND mỗi đội";
  }

  return pickText(locale, amount);
}

export function HomePage() {
  const { locale, pageContent, sponsors } = useSiteState();
  const [activeSlide, setActiveSlide] = useState(0);
  const [expandedTestimonials, setExpandedTestimonials] = useState<Set<string>>(() => new Set());
  const heroSlides =
    pageContent.home.heroSlides.length > 0
      ? pageContent.home.heroSlides
      : defaultPageContent.home.heroSlides;
  const heroDeck = heroSlides.map((slide, index) =>
    index === 0
      ? {
          ...slide,
          secondaryCta: {
            ...slide.secondaryCta,
            href: "/competition#competition-journey",
          },
        }
      : slide,
  );
  const metricItems =
    pageContent.home.metrics.length > 0 ? pageContent.home.metrics : defaultPageContent.home.metrics;
  const visibleMetricItems = metricItems.filter((item) => {
    const metricText = [
      item.value,
      item.label.en,
      item.label.vi,
      item.note.en,
      item.note.vi,
    ]
      .join(" ")
      .toLowerCase();

    return !(metricText.includes("2026") && metricText.includes("momentum"));
  });
  const rewardCards =
    pageContent.home.rewardCards.length > 0 ? pageContent.home.rewardCards : defaultPageContent.home.rewardCards;
  const rewardSection = pageContent.home.rewards;
  const rewardSectionTitle = locale === "vi" ? "Cơ cấu giải thưởng" : "Prize structure";
  const emergingReward = pageContent.home.emergingReward;
  const testimonialsSection = pageContent.home.testimonialsSection;
  const testimonialsTitle =
    locale === "vi" ? "Cảm nhận từ các mùa trước" : "Voices from earlier seasons";
  const visibleSponsors = sponsors.filter((sponsor) => !sponsor.hidden);
  const sponsorMarqueeItems = [...visibleSponsors, ...visibleSponsors];
  const testimonialItems = pageContent.home.testimonials;
  const testimonialMarqueeItems = [...testimonialItems, ...testimonialItems];

  const toggleTestimonial = (key: string) => {
    setExpandedTestimonials((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  useEffect(() => {
    if (heroDeck.length <= 1) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroDeck.length);
    }, 7000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [heroDeck.length]);

  return (
    <div className="space-y-24 pb-8">
      <section className="relative left-1/2 hidden w-screen max-w-[1600px] -translate-x-1/2 overflow-hidden md:block md:-mt-8">
        <div className="relative aspect-[16/7] w-full bg-slate-950">
          {heroDeck.map((slide, index) => (
            <div
              key={`${slide.title.en}-${index}`}
              className={`absolute inset-0 transition-[opacity,filter] duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                index === activeSlide
                  ? "opacity-100 blur-0"
                  : "pointer-events-none opacity-0 blur-md"
              }`}
            >
              <Image
                src={slide.image}
                alt={pickText(locale, slide.title)}
                fill
                priority={index === 0}
                sizes="(min-width: 1600px) 1600px, 100vw"
                unoptimized={slide.image.startsWith("/api/hero-slide-images/")}
                className="object-contain"
              />
            </div>
          ))}

          <div className="pointer-events-none absolute inset-x-0 bottom-6 z-10 flex justify-center">
            <div className="pointer-events-auto flex gap-2 rounded-full border border-white/20 bg-slate-950/34 px-3 py-2 shadow-[0_14px_42px_rgba(2,6,23,0.24)] backdrop-blur-md">
              {heroDeck.map((slide, index) => (
                <button
                  key={`${slide.title.en}-${index}`}
                  type="button"
                  onClick={() => setActiveSlide(index)}
                  aria-label={pickText(locale, slide.title)}
                  className={`h-2.5 rounded-full transition ${
                    index === activeSlide ? "w-10 bg-white" : "w-2.5 bg-white/42 hover:bg-white/70"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {visibleMetricItems.length > 0 ? (
      <section className="grid gap-4 max-md:!mt-0 md:grid-cols-2 xl:grid-cols-4">
        {visibleMetricItems.map((item) => {
          return (
          <div
            key={item.value + item.label.en}
            className="theme-home-metric-card rounded-[1.7rem] border px-5 py-5 text-center"
          >
            <p className="theme-heading text-4xl font-semibold theme-text-strong">{item.value}</p>
            <p className="mt-3 text-sm font-medium uppercase tracking-[0.22em] theme-eyebrow">
              {pickText(locale, item.label)}
            </p>
            <p className="mt-3 text-sm leading-6 theme-text-soft">{pickText(locale, item.note)}</p>
          </div>
          );
        })}
      </section>
      ) : null}

      <section className="theme-home-rewards-shell relative overflow-hidden rounded-[2.4rem] border px-6 py-8 md:px-8 md:py-10">
        <div className="absolute -left-20 top-10 h-56 w-56 rounded-full bg-cyan-300/14 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-sky-300/16 blur-3xl" />

        <div className="relative grid gap-8 xl:grid-cols-[minmax(0,1.15fr)_320px] xl:items-start">
          <div>
            <p className="theme-eyebrow text-xs font-semibold uppercase tracking-[0.34em]">
              {pickText(locale, rewardSection.eyebrow)}
            </p>
            <h2 className="theme-heading mt-5 max-w-3xl text-3xl font-semibold leading-[1.08] theme-text-strong md:text-[3rem]">
              {rewardSectionTitle}
            </h2>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {rewardCards.map((item, index) => {
                const rewardStyle = homepageRewardItems[index] ?? homepageRewardItems[0];
                const Icon = rewardStyle.icon;

                return (
                  <div
                    key={item.rank.en}
                    className={`theme-home-reward-card rounded-[1.8rem] border px-5 py-5 backdrop-blur-md ${rewardStyle.borderClass}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${rewardStyle.iconClass}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="theme-text-soft text-[0.72rem] font-semibold uppercase tracking-[0.24em]">
                          {pickText(locale, item.rank)}
                        </p>
                        <p className="theme-text-strong mt-1 text-lg font-semibold">
                          {pickText(locale, item.title)}
                        </p>
                      </div>
                    </div>
                    <p className="theme-text-strong mt-5 text-2xl font-semibold md:text-[1.8rem]">
                      {pickRewardAmount(locale, item.amount, index)}
                    </p>
                    <p className="theme-text-muted mt-3 text-sm leading-7">
                      {pickText(locale, item.note)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <div className="theme-home-reward-aside rounded-[2rem] border px-5 py-6 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#34d399,#10b981)] text-slate-950">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="theme-text-soft text-[0.72rem] font-semibold uppercase tracking-[0.24em]">
                    {pickText(locale, emergingReward.eyebrow)}
                  </p>
                  <p className="theme-text-strong mt-1 text-lg font-semibold">
                    {pickText(locale, emergingReward.title)}
                  </p>
                </div>
              </div>
              <p className="theme-text-strong mt-5 text-2xl font-semibold">
                {pickText(locale, emergingReward.amount)}
              </p>
              <p className="theme-text-muted mt-3 text-sm leading-7">
                {pickText(locale, emergingReward.note)}
              </p>
            </div>
            <div className="theme-home-reward-aside rounded-[1.6rem] border px-5 py-5 backdrop-blur-md">
              <p className="theme-text-muted text-sm leading-7">
                {pickText(locale, pageContent.home.emergingRewardOpportunityNote)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {visibleSponsors.length > 0 ? (
      <section className="space-y-5">
        <div className="flex justify-end">
          <Link href="/competition/sponsors" className="inline-flex items-center gap-2 text-sm font-semibold theme-accent">
            {pickText(locale, pageContent.home.sponsorsStripLinkLabel)}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <Surface className="relative overflow-hidden px-0 py-0">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-[linear-gradient(90deg,var(--shell-start),transparent)]" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-[linear-gradient(270deg,var(--shell-start),transparent)]" />
          <div className="overflow-hidden py-6 md:py-7">
            <div className="marquee-track flex w-max items-center gap-5 px-4 hover:[animation-play-state:paused] md:gap-6 md:px-6">
              {sponsorMarqueeItems.map((sponsor, index) => (
                <div
                  key={`${sponsor.name}-${index}`}
                  className="flex min-h-[108px] min-w-[210px] shrink-0 items-center justify-center rounded-[2rem] border theme-border bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,249,255,0.94))] px-6 py-5 shadow-[0_22px_44px_rgba(148,163,184,0.12)] md:min-h-[122px] md:min-w-[248px] md:px-7 md:py-6"
                  aria-hidden={index >= visibleSponsors.length}
                >
                  <Image
                    src={sponsor.logoSrc}
                    alt={sponsor.name}
                    width={196}
                    height={72}
                    unoptimized={sponsor.logoSrc.startsWith("/api/sponsor-images/")}
                    className="h-14 w-auto max-w-full object-contain md:h-16"
                  />
                </div>
              ))}
            </div>
          </div>
        </Surface>
      </section>
      ) : null}

      {testimonialItems.length > 0 ? (
      <section className="theme-home-testimonials-shell relative overflow-hidden rounded-[2.4rem] border px-6 py-8 md:px-8 md:py-10">
        <div className="absolute -right-8 top-0 h-40 w-40 rounded-full bg-sky-200/40 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-cyan-200/36 blur-3xl" />

        <div className="relative space-y-7">
          <div>
            <div className="max-w-3xl">
              <p className="text-center text-xs font-semibold uppercase tracking-[0.3em] theme-eyebrow md:text-left">
                {pickText(locale, testimonialsSection.eyebrow)}
              </p>
              <h2 className="theme-heading mt-3 text-center text-3xl font-semibold leading-[1.08] theme-text-strong md:text-left md:text-[2.4rem]">
                {testimonialsTitle}
              </h2>
            </div>
          </div>

          <div className="overflow-hidden py-1">
            <div className="marquee-track flex w-max items-stretch gap-5 px-1 hover:[animation-play-state:paused]">
              {testimonialMarqueeItems.map((item, index) => {
                const currentEmploymentText = item.currentEmployment
                  ? pickText(locale, item.currentEmployment).trim()
                  : "";
                const sourceIndex = index % testimonialItems.length;
                const testimonialKey = `${item.name}-${sourceIndex}`;
                const quoteText = pickText(locale, item.quote);
                const isLongQuote = quoteText.length > 220;
                const isExpanded = expandedTestimonials.has(testimonialKey);

                return (
                  <div
                    key={`${item.name}-${index}`}
                    className="theme-home-testimonial-card relative flex min-h-[248px] w-[320px] shrink-0 flex-col rounded-[1.8rem] border p-5 text-left md:w-[352px]"
                    aria-hidden={index >= testimonialItems.length}
                  >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border theme-border">
                      <Image src={item.avatarImageSrc} alt={item.name} fill sizes="56px" className="object-cover" />
                    </div>
                    <div className="min-w-0">
                      <p className="theme-heading truncate text-base font-semibold theme-text-strong">{item.name}</p>
                      <p className="mt-1 text-[0.72rem] font-semibold uppercase tracking-[0.18em] theme-text-soft">
                        {pickText(locale, item.competitionRole)}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${testimonialQuoteClasses[index % testimonialQuoteClasses.length]}`}
                  >
                    <Quote className="h-5 w-5" />
                  </div>
                </div>

                <div className="mt-5 flex-1">
                  <p className={`text-sm leading-7 theme-text-body ${!isExpanded ? "line-clamp-4" : ""}`}>
                    &ldquo;{quoteText}&rdquo;
                  </p>
                  {isLongQuote ? (
                    <button
                      type="button"
                      onClick={() => toggleTestimonial(testimonialKey)}
                      className="mt-3 inline-flex text-sm font-semibold theme-accent"
                    >
                      {isExpanded
                        ? locale === "en"
                          ? "Show less"
                          : "Thu gọn"
                        : locale === "en"
                          ? "See more"
                          : "Xem thêm"}
                    </button>
                  ) : null}
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <div className="theme-chip inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium">
                    <GraduationCap className="h-3.5 w-3.5" />
                    <span>{item.university}</span>
                  </div>
                  {currentEmploymentText ? (
                    <div className="theme-chip inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium">
                      <BriefcaseBusiness className="h-3.5 w-3.5" />
                      <span>{currentEmploymentText}</span>
                    </div>
                  ) : null}
                </div>
                </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end">
            <Link href="/competition#competition-journey" className="inline-flex items-center justify-center gap-2 text-sm font-semibold theme-accent md:justify-end">
              {pickText(locale, pageContent.home.testimonialsLinkLabel)}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
      ) : null}

    </div>
  );
}
