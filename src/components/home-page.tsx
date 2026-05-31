"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Award,
  Badge,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Crown,
  FileText,
  GraduationCap,
  Medal,
  MessageCircle,
  Quote,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Users2,
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

const homepageFactIcons = [Users2, ClipboardCheck, TrendingUp, Medal] as const;

const homepageJourneySteps = [
  {
    icon: ClipboardCheck,
    title: {
      en: "Round 1: individual test",
      vi: "Vòng 1: bài thi cá nhân",
    },
    description: {
      en: "Each qualified member completes the online test. Team ranking is based on the team average after scoring is complete.",
      vi: "Mỗi thành viên đủ điều kiện làm bài thi trực tuyến. Xếp hạng đội dựa trên điểm trung bình sau khi hoàn tất chấm điểm.",
    },
    meta: {
      en: "36 multiple-choice questions + 2 essays",
      vi: "36 câu trắc nghiệm + 2 câu tự luận",
    },
  },
  {
    icon: FileText,
    title: {
      en: "Round 2: project report",
      vi: "Vòng 2: báo cáo dự án",
    },
    description: {
      en: "Top teams submit a fintech idea report focused on problem fit, product logic, execution, and market relevance.",
      vi: "Các đội đi tiếp nộp báo cáo ý tưởng fintech, tập trung vào vấn đề, logic sản phẩm, khả năng triển khai và tính thị trường.",
    },
    meta: {
      en: "Top 50 teams continue",
      vi: "Top 50 đội đi tiếp",
    },
  },
  {
    icon: Medal,
    title: {
      en: "Final: live defense",
      vi: "Chung kết: bảo vệ trực tiếp",
    },
    description: {
      en: "Finalists present to judges, answer questions, and compete for the final ranking and sponsor-side opportunities.",
      vi: "Các đội chung kết thuyết trình trước giám khảo, trả lời phản biện và tranh thứ hạng cuối cùng cùng các cơ hội từ đối tác.",
    },
    meta: {
      en: "5 finalist teams",
      vi: "5 đội chung kết",
    },
  },
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
  const heroSlides =
    pageContent.home.heroSlides.length > 0
      ? pageContent.home.heroSlides
      : defaultPageContent.home.heroSlides;
  const heroDeck = heroSlides;
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
  const emergingRewardEyebrow = locale === "vi" ? "Danh hiệu bổ sung" : "Side recognition";
  const emergingRewardNote =
    locale === "vi"
      ? "Các đội xếp ngay sau top 5 ở Vòng 2 nhận danh hiệu, giấy chứng nhận và các cơ hội đồng hành từ đối tác."
      : "Teams ranked immediately after the top 5 in Round 2 receive recognition, certificates, and sponsor-side opportunities.";
  const emergingRewardOpportunityNote =
    locale === "vi"
      ? "Tùy theo chương trình đồng hành tại ngày thuyết trình chung kết, các đội nổi bật có thể nhận thêm quà tặng, học bổng, cố vấn chuyên môn, tuyển dụng hoặc cơ hội trao đổi đầu tư từ giám khảo, nhà tài trợ và khách mời."
      : "Depending on partner availability at the final presentation event, standout teams may also receive gifts, scholarships, mentorship, recruitment, or investment opportunities from judges, sponsors, and invited guests.";
  const testimonialsSection = pageContent.home.testimonialsSection;
  const testimonialsTitle =
    locale === "vi" ? "Cảm nhận từ các mùa trước" : "Voices from earlier seasons";
  const sponsorMarqueeItems = [...sponsors, ...sponsors];
  const testimonialItems = pageContent.home.testimonials;
  const testimonialMarqueeItems = [...testimonialItems, ...testimonialItems];
  const heroIntro =
    locale === "vi"
      ? "Cuộc thi ý tưởng fintech dành cho sinh viên Việt Nam, tập trung vào tư duy tài chính, sản phẩm, dữ liệu và khả năng trình bày."
      : "A student fintech idea competition in Vietnam, focused on finance, product thinking, data, and presentation quality.";
  const heroEyebrow = locale === "vi" ? "Mùa thi 2026" : "2026 season";
  const heroPrimaryCta = locale === "vi" ? "Xem hành trình cuộc thi" : "View competition journey";
  const heroSecondaryCta = locale === "vi" ? "Mở Đội thi" : "Open team workspace";
  const statusTitle = locale === "vi" ? "Thông tin mùa thi" : "Season information";
  const statusDescription =
    locale === "vi"
      ? "Theo dõi các mốc chính, danh sách đội đi tiếp và kênh hỗ trợ chính thức từ ban tổ chức."
      : "Track key dates, qualified teams, and the official organizer support channel.";
  const statusItems = [
    {
      icon: Clock3,
      href: "/competition/timeline",
      label: locale === "vi" ? "Mốc chính" : "Key dates",
      value: locale === "vi" ? "Tháng 5 - tháng 7/2026" : "May - July 2026",
    },
    {
      icon: CheckCircle2,
      href: "/competition/round-1-results",
      label: locale === "vi" ? "Đội đi tiếp" : "Qualified teams",
      value: locale === "vi" ? "Top 50 vào Vòng 2" : "Top 50 enter Round 2",
    },
    {
      icon: MessageCircle,
      href: "/messages?organizer=1",
      label: locale === "vi" ? "Hỗ trợ" : "Support",
      value: locale === "vi" ? "Nhắn ban tổ chức" : "Message organizer",
    },
  ];

  useEffect(() => {
    if (heroDeck.length <= 1) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroDeck.length);
    }, 5200);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [heroDeck.length]);

  return (
    <div className="space-y-20 pb-8">
      <section className="relative left-1/2 right-1/2 -mx-[50vw] -mt-6 w-screen overflow-hidden md:-mt-8">
        <div className="relative min-h-[600px] md:min-h-[640px]">
          {heroDeck.map((slide, index) => (
            <div
              key={`${slide.title.en}-${index}`}
              className={`absolute inset-0 transition-opacity duration-700 ${
                index === activeSlide ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
            >
              <Image
                src={slide.image}
                alt={pickText(locale, slide.title)}
                fill
                priority={index === 0}
                sizes="100vw"
                unoptimized={slide.image.startsWith("/api/hero-slide-images/")}
                className="hero-pan object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,18,35,0.16)_0%,rgba(7,18,35,0.3)_44%,rgba(7,18,35,0.74)_100%)]" />
            </div>
          ))}

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.12),transparent_22%),linear-gradient(90deg,rgba(7,18,35,0.42)_0%,rgba(7,18,35,0.16)_44%,rgba(7,18,35,0.38)_100%)]" />

          <div className="relative z-10 mx-auto flex min-h-[600px] max-w-7xl items-end px-4 pb-16 pt-28 text-white md:min-h-[640px] md:px-8 md:pb-20">
            <div className="grid w-full gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.34em] text-sky-100/80">
                  {heroEyebrow}
                </p>
                <h1 className="theme-heading mt-4 max-w-[620px] text-[3rem] font-semibold leading-[0.98] text-white [text-shadow:0_18px_44px_rgba(7,18,35,0.46)] md:text-[5rem]">
                  Attacker 2026
                </h1>
                <p className="mt-5 max-w-[610px] text-base leading-8 text-white/84 [text-shadow:0_12px_30px_rgba(7,18,35,0.36)] md:text-lg">
                  {heroIntro}
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Link
                    href="/competition#competition-journey"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-[0_22px_52px_rgba(7,18,35,0.24)]"
                  >
                    {heroPrimaryCta}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-white/12 px-5 py-3 text-sm font-semibold text-white ring-1 ring-white/22 backdrop-blur-md"
                  >
                    {heroSecondaryCta}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              <div className="theme-home-hero-status rounded-[1.8rem] px-5 py-5 backdrop-blur-xl">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-300 text-slate-950">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.26em] text-white/58">
                      {statusTitle}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-white/78">{statusDescription}</p>
                  </div>
                </div>
                <div className="mt-5 space-y-3">
                  {statusItems.map((item) => {
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        className="flex items-center gap-3 rounded-2xl bg-white/10 px-3.5 py-3 text-left ring-1 ring-white/10"
                      >
                        <Icon className="h-4 w-4 shrink-0 text-sky-200" />
                        <span className="min-w-0">
                          <span className="block text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-white/52">
                            {item.label}
                          </span>
                          <span className="block truncate text-sm font-semibold text-white">{item.value}</span>
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 gap-2">
              {heroDeck.map((slide, index) => (
                <button
                  key={`${slide.title.en}-${index}`}
                  type="button"
                  onClick={() => setActiveSlide(index)}
                  aria-label={pickText(locale, slide.title)}
                  className={`h-2.5 rounded-full transition ${
                    index === activeSlide ? "w-10 bg-white" : "w-2.5 bg-white/38"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {visibleMetricItems.length > 0 ? (
        <section className="theme-home-fact-strip -mt-8 grid gap-3 rounded-[2rem] border px-4 py-4 md:grid-cols-2 md:px-5 lg:grid-cols-4">
          {visibleMetricItems.map((item, index) => {
            const Icon = homepageFactIcons[index % homepageFactIcons.length] ?? Users2;

            return (
              <div key={item.value + item.label.en} className="flex items-center gap-4 px-2 py-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="theme-heading text-2xl font-semibold theme-text-strong">{item.value}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] theme-eyebrow">
                    {pickText(locale, item.label)}
                  </p>
                  <p className="mt-1 text-xs leading-5 theme-text-muted">{pickText(locale, item.note)}</p>
                </div>
              </div>
            );
          })}
        </section>
      ) : null}

      <section className="grid gap-5 lg:grid-cols-[0.84fr_1.16fr] lg:items-start">
        <div className="lg:sticky lg:top-28">
          <p className="theme-eyebrow text-xs font-semibold uppercase tracking-[0.32em]">
            {locale === "vi" ? "Hành trình cuộc thi" : "Competition Journey"}
          </p>
          <h2 className="theme-heading mt-4 text-3xl font-semibold leading-[1.08] theme-text-strong md:text-[2.75rem]">
            {locale === "vi" ? "Rõ từng vòng, rõ việc cần làm." : "Clear rounds, clear next steps."}
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-7 theme-text-muted">
            {locale === "vi"
              ? "Trang chủ chỉ giữ những thông tin cần quyết định nhanh: điều kiện đội, cách đi tiếp, giải thưởng và nơi nhận hỗ trợ."
              : "The homepage keeps the decision-critical information visible: team rules, progression, rewards, and support."}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/competition"
              className="theme-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
            >
              {locale === "vi" ? "Xem trang cuộc thi" : "Open competition page"}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/competition/round-1-results"
              className="theme-button-secondary inline-flex items-center gap-2 rounded-full border px-5 py-3 text-sm font-semibold"
            >
              {locale === "vi" ? "Kết quả Vòng 1" : "Round 1 results"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="grid gap-4">
          {homepageJourneySteps.map((step, index) => {
            const Icon = step.icon;

            return (
              <div key={step.title.en} className="theme-home-journey-card rounded-[1.6rem] border p-5 md:p-6">
                <div className="flex flex-col gap-5 md:flex-row md:items-start">
                  <div className="flex items-center gap-4 md:w-56 md:shrink-0">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#dff4ff,#9bdcff)] text-sky-800">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] theme-eyebrow">
                        {locale === "vi" ? `Bước ${index + 1}` : `Step ${index + 1}`}
                      </p>
                      <p className="theme-heading mt-1 text-lg font-semibold leading-6 theme-text-strong">
                        {pickText(locale, step.title)}
                      </p>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-7 theme-text-body">{pickText(locale, step.description)}</p>
                    <div className="mt-4 inline-flex rounded-full border border-sky-200/70 bg-sky-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-sky-800 dark:border-sky-300/18 dark:bg-sky-300/10 dark:text-sky-100">
                      {pickText(locale, step.meta)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

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
                    {emergingRewardEyebrow}
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
                {emergingRewardNote}
              </p>
            </div>
            <div className="theme-home-reward-aside rounded-[1.6rem] border px-5 py-5 backdrop-blur-md">
              <p className="theme-text-muted text-sm leading-7">
                {emergingRewardOpportunityNote}
              </p>
            </div>
          </div>
        </div>
      </section>

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
                  aria-hidden={index >= sponsors.length}
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
              {testimonialMarqueeItems.map((item, index) => (
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

                <p className="mt-5 flex-1 text-sm leading-7 theme-text-body">
                  &ldquo;{pickText(locale, item.quote)}&rdquo;
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <div className="theme-chip inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium">
                    <GraduationCap className="h-3.5 w-3.5" />
                    <span>{item.university}</span>
                  </div>
                  {item.currentEmployment ? (
                    <div className="theme-chip inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium">
                      <BriefcaseBusiness className="h-3.5 w-3.5" />
                      <span>{pickText(locale, item.currentEmployment)}</span>
                    </div>
                  ) : null}
                </div>
                </div>
              ))}
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
