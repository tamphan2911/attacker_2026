"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Award,
  CirclePlay,
  Crown,
  LayoutDashboard,
  Medal,
  Newspaper,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Users2,
} from "lucide-react";

import {
  defaultPageContent,
  heroCopy,
  homeMetrics,
  sponsorProfiles,
  testimonialItems,
} from "@/data/site-content";
import { pickText } from "@/lib/site";
import type { LocalizedText } from "@/types/site";
import { useSiteState } from "@/components/providers/site-state-provider";
import {
  GradientAvatar,
  InfoKicker,
  SectionHeading,
  Surface,
} from "@/components/site-ui";

const featureCards: Array<{
  image: string;
  label: LocalizedText;
  title: LocalizedText;
  description: LocalizedText;
  href: string;
}> = [
  {
    image: "/theme-feature-1.jpg",
    label: { en: "Competition structure", vi: "Cau truc cuoc thi" },
    title: {
      en: "Rounds, rewards, and the challenge narrative in one place.",
      vi: "Vong thi, giai thuong va cau chuyen de bai trong mot trang thong nhat.",
    },
    description: {
      en: "Public-facing information is presented like a serious event launch, not a campus bulletin.",
      vi: "Thong tin cong khai duoc trinh bay nhu mot su kien chuyen nghiep, khong phai bang thong bao hoc duong.",
    },
    href: "/competition",
  },
  {
    image: "/theme-feature-2.jpg",
    label: { en: "Team workspace", vi: "Khong gian doi" },
    title: {
      en: "Students can manage invitations and membership rules directly.",
      vi: "Sinh vien co the tu quan ly loi moi va cac quy tac thanh vien.",
    },
    description: {
      en: "One user, one team at a time. Leaders stay protected until transfer is complete.",
      vi: "Moi nguoi chi o mot doi tai mot thoi diem. Doi truong duoc bao toan cho den khi chuyen giao xong.",
    },
    href: "/dashboard",
  },
  {
    image: "/theme-hero-1.jpg",
    label: { en: "Organizer preview", vi: "Preview ban to chuc" },
    title: {
      en: "News, rounds, and participant oversight already have a frontend home.",
      vi: "Tin tuc, cac vong thi va viec theo doi thi sinh da co mot giao dien rieng cho frontend.",
    },
    description: {
      en: "This reduces redesign work later when the real admin tools are connected.",
      vi: "Dieu nay giam bot cong viec thiet ke lai khi ket noi cac cong cu quan tri thuc te.",
    },
    href: "/organizer",
  },
];

const serviceItems = [
  {
    icon: TrendingUp,
    title: {
      en: "Competition information",
      vi: "Thong tin cuoc thi",
    },
    description: {
      en: "Clear public pages for rounds, rewards, rules, and timeline.",
      vi: "Trang cong khai ro rang cho vong thi, giai thuong, the le va lich trinh.",
    },
  },
  {
    icon: Users2,
    title: {
      en: "Team formation logic",
      vi: "Logic tao doi",
    },
    description: {
      en: "Students can create, invite, accept, leave, and transfer leadership within the defined rules.",
      vi: "Sinh vien co the tao doi, moi, chap nhan, roi doi va chuyen doi truong trong dung quy tac.",
    },
  },
  {
    icon: ShieldCheck,
    title: {
      en: "Organizer-ready control",
      vi: "San sang cho ban to chuc",
    },
    description: {
      en: "The prototype already reserves space for moderation, publishing, and participant oversight.",
      vi: "Prototype da danh san khong gian cho quan ly noi dung, dang bai va theo doi thi sinh.",
    },
  },
];

const platformIcons = {
  "/competition": TrendingUp,
  "/dashboard": LayoutDashboard,
  "/news": Newspaper,
  "/rules": ShieldCheck,
};

const homepageRewardItems = [
  {
    rank: { en: "1st place", vi: "Hang 1" },
    title: { en: "Champion", vi: "Quan quan" },
    amount: { en: "30,000,000 VND", vi: "30.000.000 VND" },
    note: {
      en: "Awarded to the team with the highest final-round score.",
      vi: "Trao cho doi co diem cao nhat o vong chung ket.",
    },
    icon: Crown,
    iconClass: "bg-[linear-gradient(135deg,#f59e0b,#facc15)] text-slate-950",
    borderClass: "border-amber-300/24 bg-white/14",
  },
  {
    rank: { en: "2nd place", vi: "Hang 2" },
    title: { en: "Runner-up", vi: "A quan" },
    amount: { en: "15,000,000 VND", vi: "15.000.000 VND" },
    note: {
      en: "Awarded to the team with the second-highest final-round score.",
      vi: "Trao cho doi co diem cao thu hai o vong chung ket.",
    },
    icon: Medal,
    iconClass: "bg-[linear-gradient(135deg,#e2e8f0,#cbd5e1)] text-slate-950",
    borderClass: "border-white/14 bg-white/10",
  },
  {
    rank: { en: "3rd place", vi: "Hang 3" },
    title: { en: "Third place", vi: "Quy quan" },
    amount: { en: "10,000,000 VND", vi: "10.000.000 VND" },
    note: {
      en: "Awarded to the team with the third-highest final-round score.",
      vi: "Trao cho doi co diem cao thu ba o vong chung ket.",
    },
    icon: Award,
    iconClass: "bg-[linear-gradient(135deg,#fb923c,#f97316)] text-white",
    borderClass: "border-white/14 bg-white/10",
  },
  {
    rank: { en: "4th place", vi: "Hang 4" },
    title: { en: "Two finalist teams", vi: "Hai doi dong hang 4" },
    amount: { en: "2 x 5,000,000 VND", vi: "2 x 5.000.000 VND" },
    note: {
      en: "The remaining two finalists each receive the fourth-place award.",
      vi: "Hai doi con lai trong top 5 chung ket moi doi nhan giai hang 4.",
    },
    icon: Star,
    iconClass: "bg-[linear-gradient(135deg,#38bdf8,#14b8a6)] text-white",
    borderClass: "border-cyan-300/18 bg-white/10",
  },
] as const;

const homepageEmergingReward = {
  eyebrow: { en: "Side recognition", vi: "Danh hieu bo sung" },
  title: { en: "Emerging Teams", vi: "Doi tiem nang" },
  amount: { en: "Top 10 teams", vi: "Top 10 doi" },
  note: {
    en: "Teams ranked immediately after the top 5 in Round 2 receive recognition, certificates, and sponsor-side opportunities.",
    vi: "Cac doi xep ngay sau top 5 o Vong 2 nhan danh hieu, giay chung nhan va cac co hoi dong hanh tu doi tac.",
  },
} as const;

export function HomePage() {
  const { locale, newsPosts, pageContent } = useSiteState();
  const [activeSlide, setActiveSlide] = useState(0);
  const heroSlides =
    pageContent.home.heroSlides.length > 0
      ? pageContent.home.heroSlides
      : defaultPageContent.home.heroSlides;
  const currentSlide = heroSlides[activeSlide % heroSlides.length];
  const sponsorMarqueeItems = [...sponsorProfiles, ...sponsorProfiles];

  useEffect(() => {
    if (heroSlides.length <= 1) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroSlides.length);
    }, 5200);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [heroSlides.length]);

  const latestNews = newsPosts.slice(0, 3);

  return (
    <div className="space-y-24 pb-8">
      <section className="relative left-1/2 right-1/2 -mx-[50vw] w-screen overflow-hidden">
        <div className="relative min-h-[560px] md:min-h-[640px]">
          {heroSlides.map((slide, index) => (
            <div
              key={slide.id}
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
                className="hero-pan object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,18,35,0.32),rgba(7,18,35,0.42))]" />
            </div>
          ))}

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_16%,rgba(255,255,255,0.18),transparent_24%),linear-gradient(180deg,rgba(7,18,35,0.18)_0%,rgba(7,18,35,0.62)_68%,rgba(7,18,35,0.84)_100%)]" />

          <div className="relative z-10 mx-auto flex min-h-[560px] max-w-7xl flex-col items-center justify-center px-4 pb-16 pt-24 text-center text-white md:min-h-[640px] md:px-8">
            <InfoKicker className="border-white/28 bg-white/14 text-white shadow-[0_18px_44px_rgba(7,18,35,0.22)] backdrop-blur-md">
              {pickText(locale, currentSlide.eyebrow)}
            </InfoKicker>
            <h1 className="theme-heading mt-8 max-w-5xl text-4xl font-semibold leading-[1.06] md:text-6xl">
              {pickText(locale, currentSlide.title)}
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-white/78 md:text-lg">
              {pickText(locale, currentSlide.description)}
            </p>

            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/competition"
                className="theme-button-primary inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold transition hover:brightness-110"
              >
                {pickText(locale, heroCopy.secondaryCta)}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/12 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/16"
              >
                {pickText(locale, heroCopy.primaryCta)}
              </Link>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/18 bg-transparent px-6 py-3.5 text-sm font-semibold text-white/86"
              >
                <CirclePlay className="h-4 w-4" />
                {locale === "en" ? "Watch preview" : "Xem preview"}
              </button>
            </div>

            <div className="mt-14 flex gap-2">
              {heroSlides.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setActiveSlide(index)}
                  aria-label={`Switch to slide ${index + 1}`}
                  className={`h-2.5 rounded-full transition ${
                    index === activeSlide ? "w-10 bg-white" : "w-2.5 bg-white/38"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden rounded-[2.4rem] border border-slate-900/40 bg-[linear-gradient(140deg,#071223_0%,#0b2744_42%,#1772d0_100%)] px-6 py-8 text-white md:px-8 md:py-10">
        <div className="absolute -left-20 top-10 h-56 w-56 rounded-full bg-cyan-300/14 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-sky-300/16 blur-3xl" />

        <div className="relative grid gap-8 xl:grid-cols-[minmax(0,1.15fr)_320px] xl:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-white/64">
              {pickText(locale, pageContent.competition.rewards.eyebrow)}
            </p>
            <h2 className="theme-heading mt-5 max-w-3xl text-3xl font-semibold leading-[1.08] md:text-[3rem]">
              {locale === "en"
                ? "A prize structure that makes the top 5 instantly clear."
                : "Cau truc giai thuong giup top 5 duoc nhin ra ngay lap tuc."}
            </h2>
            <p className="mt-5 max-w-3xl text-base leading-8 text-white/74">
              {locale === "en"
                ? "The main awards are separated by final ranking from 1st to 4th, while Emerging Teams stay in their own smaller recognition block after Round 2."
                : "Cac giai chinh duoc tach ro theo thu hang chung ket tu hang 1 den hang 4, trong khi Doi tiem nang nam o mot block rieng nho hon sau Vong 2."}
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {homepageRewardItems.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.rank.en}
                    className={`rounded-[1.8rem] border px-5 py-5 backdrop-blur-md ${item.borderClass}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${item.iconClass}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-white/62">
                          {pickText(locale, item.rank)}
                        </p>
                        <p className="mt-1 text-lg font-semibold text-white">
                          {pickText(locale, item.title)}
                        </p>
                      </div>
                    </div>
                    <p className="mt-5 text-2xl font-semibold text-white md:text-[1.8rem]">
                      {pickText(locale, item.amount)}
                    </p>
                    <p className="mt-3 text-sm leading-7 text-white/74">
                      {pickText(locale, item.note)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[2rem] border border-emerald-300/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.08))] px-5 py-6 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#34d399,#10b981)] text-slate-950">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-white/62">
                    {pickText(locale, homepageEmergingReward.eyebrow)}
                  </p>
                  <p className="mt-1 text-lg font-semibold text-white">
                    {pickText(locale, homepageEmergingReward.title)}
                  </p>
                </div>
              </div>
              <p className="mt-5 text-2xl font-semibold text-white">
                {pickText(locale, homepageEmergingReward.amount)}
              </p>
              <p className="mt-3 text-sm leading-7 text-white/74">
                {pickText(locale, homepageEmergingReward.note)}
              </p>
            </div>

            <div className="rounded-[2rem] border border-white/12 bg-white/8 px-5 py-5 backdrop-blur-md">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/64">
                {locale === "en" ? "Competition path" : "Lo trinh cuoc thi"}
              </p>
              <div className="mt-5 space-y-3">
                {[
                  locale === "en" ? "Round 1 selects the top 50 teams." : "Vong 1 chon ra top 50 doi.",
                  locale === "en" ? "Round 2 selects the top 5 finalists." : "Vong 2 chon ra top 5 doi chung ket.",
                  locale === "en" ? "The next 10 teams are named Emerging Teams." : "10 doi tiep theo duoc goi ten la Doi tiem nang.",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm text-white/78"
                  >
                    {item}
                  </div>
                ))}
              </div>
              <Link href="/competition" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-cyan-200">
                {locale === "en" ? "Open full competition page" : "Mo trang cuoc thi day du"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {featureCards.map((item) => (
          <Link key={item.href} href={item.href} className="group block">
            <div className="theme-card-shadow-soft relative min-h-[420px] overflow-hidden rounded-[2rem] border theme-border-strong">
              <Image
                src={item.image}
                alt={pickText(locale, item.title)}
                fill
                sizes="(min-width: 1024px) 33vw, 100vw"
                className="object-cover transition duration-700 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,18,35,0.06)_0%,rgba(7,18,35,0.82)_100%)]" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/64">
                  {pickText(locale, item.label)}
                </p>
                <p className="theme-heading mt-4 text-2xl font-semibold leading-[1.2]">
                  {pickText(locale, item.title)}
                </p>
                <p className="mt-3 text-sm leading-7 text-white/76">
                  {pickText(locale, item.description)}
                </p>
                <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold">
                  {locale === "en" ? "Explore" : "Kham pha"}
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </section>

      <section className="mx-auto max-w-4xl text-center">
        <p className="theme-eyebrow text-xs font-semibold uppercase tracking-[0.34em]">
          {locale === "en" ? "Why Attacker 2026" : "Vi sao Attacker 2026"}
        </p>
        <h2 className="theme-heading mt-5 text-3xl font-semibold leading-[1.15] theme-text-strong md:text-[3rem]">
          {locale === "en"
            ? "A student fintech competition should look established, useful, and easy to navigate from the first screen."
            : "Mot cuoc thi fintech sinh vien nen tao cam giac chuyen nghiep, huu ich va de dinh huong ngay tu man hinh dau tien."}
        </h2>
        <p className="mx-auto mt-5 max-w-3xl text-base leading-8 theme-text-muted md:text-lg">
          {locale === "en"
            ? "This closer-to-reference homepage uses a more classic launch-site rhythm: hero slider, large visual columns, utility content bands, latest updates, proof points, and a clearer footer structure."
            : "Trang chu duoc dieu chinh sat huong tham chieu hon, theo nhip dieu quen thuoc cua mot launch-site: hero slider, cot hinh anh lon, cac band noi dung tien ich, cap nhat moi nhat, proof points va footer ro rang hon."}
        </p>
        <Link href="/competition" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold theme-accent">
          {locale === "en" ? "Go to competition details" : "Di den chi tiet cuoc thi"}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      <section className="relative left-1/2 right-1/2 -mx-[50vw] w-screen border-y theme-border theme-section-muted">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-8">
          <div className="grid gap-6 lg:grid-cols-3">
            {serviceItems.map((item) => {
              const Icon = item.icon;

              return (
                <Surface key={item.title.en} className="px-6 py-7">
                  <div className="theme-brand-gradient flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-[0_18px_40px_rgba(23,114,208,0.2)]">
                    <Icon className="h-6 w-6" />
                  </div>
                  <p className="theme-heading mt-6 text-2xl font-semibold theme-text-strong">
                    {pickText(locale, item.title)}
                  </p>
                  <p className="mt-4 text-sm leading-7 theme-text-muted">
                    {pickText(locale, item.description)}
                  </p>
                </Surface>
              );
            })}
          </div>
        </div>
      </section>

      <section className="space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            eyebrow={pickText(locale, pageContent.home.news.eyebrow)}
            title={pickText(locale, pageContent.home.news.title)}
            description={pickText(locale, pageContent.home.news.description)}
          />
          <Link href="/news" className="inline-flex items-center gap-2 text-sm font-semibold theme-accent">
            {locale === "en" ? "View all news" : "Xem tat ca tin tuc"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {latestNews.map((post) => (
            <Link key={post.slug} href={`/news/${post.slug}`} className="group block">
              <Surface className="h-full overflow-hidden px-0 py-0">
                <div className="h-48 bg-[linear-gradient(135deg,#0a1d34,#1772d0)] px-6 py-6 text-white">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/64">
                    {pickText(locale, post.category)}
                  </p>
                  <p className="theme-heading mt-6 text-2xl font-semibold leading-[1.2]">
                    {pickText(locale, post.coverLabel)}
                  </p>
                </div>
                <div className="px-6 py-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] theme-eyebrow">
                    {post.publishedAt}
                  </p>
                  <p className="theme-heading mt-4 text-xl font-semibold theme-text-strong">
                    {pickText(locale, post.title)}
                  </p>
                  <p className="mt-3 text-sm leading-7 theme-text-muted">
                    {pickText(locale, post.excerpt)}
                  </p>
                  <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold theme-accent">
                    {locale === "en" ? "Read article" : "Doc bai viet"}
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </div>
                </div>
              </Surface>
            </Link>
          ))}
        </div>
      </section>

      <section className="theme-card-shadow-soft rounded-[2rem] border theme-border theme-panel-strong px-6 py-10 text-center md:px-12">
        <p className="theme-heading mx-auto max-w-4xl text-2xl font-semibold leading-[1.5] theme-text-strong md:text-3xl">
          {locale === "en"
            ? '"A strong competition website does not just announce dates. It creates confidence in the quality of the challenge, the platform, and the people behind it."'
            : '"Mot website cuoc thi manh khong chi de thong bao lich. No tao ra niem tin vao chat luong de bai, nen tang va doi ngu phia sau."'}
        </p>
        <p className="mt-5 text-sm uppercase tracking-[0.26em] theme-text-soft">
          {locale === "en" ? "Attacker 2026 frontend concept" : "Concept frontend Attacker 2026"}
        </p>
      </section>

      <section className="space-y-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="theme-eyebrow text-xs font-semibold uppercase tracking-[0.32em]">
              {pickText(locale, pageContent.home.sponsors.eyebrow)}
            </p>
            <p className="theme-heading mt-4 text-2xl font-semibold theme-text-strong md:text-3xl">
              {locale === "en" ? "Sponsors in motion" : "Cac nha tai tro"}
            </p>
            <p className="mt-3 text-sm leading-7 theme-text-muted">
              {locale === "en"
                ? "A compact carousel focused on sponsor marks. Full details stay on the dedicated sponsor page."
                : "Mot carousel gon nhe tap trung vao logo nha tai tro. Thong tin day du nam o trang nha tai tro rieng."}
            </p>
          </div>
          <Link href="/competition/sponsors" className="inline-flex items-center gap-2 text-sm font-semibold theme-accent">
            {locale === "en" ? "Open sponsors page" : "Mo trang nha tai tro"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <Surface className="relative overflow-hidden px-0 py-0">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-[linear-gradient(90deg,var(--shell-start),transparent)]" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-[linear-gradient(270deg,var(--shell-start),transparent)]" />
          <div className="overflow-hidden py-5">
            <div className="marquee-track flex w-max items-center gap-4 px-4 hover:[animation-play-state:paused] md:gap-5 md:px-6">
              {sponsorMarqueeItems.map((sponsor, index) => (
                <div
                  key={`${sponsor.name}-${index}`}
                  className="flex min-w-[180px] shrink-0 items-center justify-center rounded-[1.45rem] border theme-border bg-white px-5 py-4 shadow-[0_18px_38px_rgba(148,163,184,0.1)] md:min-w-[210px]"
                  aria-hidden={index >= sponsorProfiles.length}
                >
                  <Image
                    src={sponsor.logoSrc}
                    alt={sponsor.name}
                    width={180}
                    height={54}
                    className="h-10 w-auto object-contain md:h-11"
                  />
                </div>
              ))}
            </div>
          </div>
        </Surface>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {homeMetrics.map((item) => (
          <div
            key={item.value + item.label.en}
            className="rounded-[1.6rem] border theme-border bg-[rgba(255,255,255,0.76)] px-5 py-5 text-center"
          >
            <p className="theme-heading text-4xl font-semibold theme-text-strong">{item.value}</p>
            <p className="mt-3 text-sm font-medium uppercase tracking-[0.22em] theme-eyebrow">
              {pickText(locale, item.label)}
            </p>
            <p className="mt-3 text-sm leading-6 theme-text-soft">{pickText(locale, item.note)}</p>
          </div>
        ))}
      </section>

      <section className="relative left-1/2 right-1/2 -mx-[50vw] w-screen overflow-hidden bg-[linear-gradient(135deg,#0a1d34,#0b4f87,#1772d0)]">
        <div className="mx-auto max-w-7xl px-4 py-20 text-white md:px-8">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.34em] text-white/66">
                {pickText(locale, pageContent.home.cta.eyebrow)}
              </p>
              <h2 className="theme-heading mt-4 max-w-3xl text-3xl font-semibold leading-[1.1] md:text-5xl">
                {pickText(locale, pageContent.home.cta.title)}
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-8 text-white/78 md:text-lg">
                {pickText(locale, pageContent.home.cta.description)}
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/auth"
                  className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-slate-950 transition hover:brightness-95"
                >
                  {locale === "en" ? "Open registration preview" : "Mo preview dang ky"}
                </Link>
                <Link
                  href="/news"
                  className="inline-flex items-center justify-center rounded-full border border-white/18 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  {locale === "en" ? "Open newsroom" : "Mo newsroom"}
                </Link>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/14 bg-white/10 p-6 backdrop-blur-md">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/64">
                {locale === "en" ? "Newsletter style block" : "Khoi newsletter"}
              </p>
              <p className="theme-heading mt-4 text-2xl font-semibold">
                {locale === "en"
                  ? "Get updates on registration, clinics, and round progress."
                  : "Nhan cap nhat ve dang ky, clinic va tien do cac vong thi."}
              </p>
              <div className="mt-6 space-y-4">
                <input
                  placeholder={locale === "en" ? "Email address" : "Dia chi email"}
                  className="w-full rounded-full border border-white/16 bg-white/12 px-5 py-3.5 text-sm text-white outline-none placeholder:text-white/52"
                />
                <button
                  type="button"
                  className="w-full rounded-full bg-white px-5 py-3.5 text-sm font-semibold text-slate-950 transition hover:brightness-95"
                >
                  {locale === "en" ? "Subscribe for updates" : "Dang ky nhan cap nhat"}
                </button>
              </div>
              <p className="mt-4 text-sm leading-7 text-white/68">
                {locale === "en"
                  ? "At this stage this is visual only, but it gives the site the same kind of utility footer/CTA behavior as the reference."
                  : "Giai doan nay khoi nay chi mang tinh hinh anh, nhung no giup website co hanh vi footer/CTA huu ich gan voi ban tham chieu hon."}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <div>
          <SectionHeading
            eyebrow={pickText(locale, pageContent.home.destinations.eyebrow)}
            title={pickText(locale, pageContent.home.destinations.title)}
            description={pickText(locale, pageContent.home.destinations.description)}
          />

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[
              {
                href: "/competition",
                label: locale === "en" ? "Competition" : "Cuoc thi",
              },
              {
                href: "/rules",
                label: locale === "en" ? "Rules & Timeline" : "The le va lich trinh",
              },
              {
                href: "/news",
                label: locale === "en" ? "Newsroom" : "Newsroom",
              },
              {
                href: "/dashboard",
                label: locale === "en" ? "Team workspace" : "Khong gian doi",
              },
              {
                href: "/competition/judges",
                label: locale === "en" ? "Judges" : "Giam khao",
              },
              {
                href: "/competition/sponsors",
                label: locale === "en" ? "Sponsors" : "Nha tai tro",
              },
            ].map((item) => {
              const Icon = platformIcons[item.href as keyof typeof platformIcons] ?? Sparkles;

              return (
                <Link key={item.href} href={item.href}>
                  <Surface className="group px-5 py-5 transition hover:-translate-y-1 hover:bg-[var(--panel-strong)]">
                    <div className="flex items-center justify-between gap-4">
                      <div className="theme-brand-gradient flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-[0_18px_40px_rgba(23,114,208,0.2)]">
                        <Icon className="h-5 w-5" />
                      </div>
                      <ArrowRight className="h-4 w-4 theme-text-faint transition group-hover:translate-x-0.5 group-hover:text-[var(--brand)]" />
                    </div>
                    <p className="theme-heading mt-5 text-xl font-semibold theme-text-strong">
                      {item.label}
                    </p>
                  </Surface>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {testimonialItems.map((item, index) => (
            <Surface key={item.name} className="px-5 py-5">
              <GradientAvatar
                label={item.name}
                tone={
                  index === 0
                    ? "from-sky-500 via-cyan-400 to-teal-400"
                    : index === 1
                      ? "from-orange-500 via-rose-400 to-fuchsia-400"
                      : "from-indigo-500 via-blue-400 to-cyan-400"
                }
              />
              <p className="theme-heading mt-5 text-lg font-semibold theme-text-strong">{item.name}</p>
              <p className="mt-2 text-sm theme-text-soft">{pickText(locale, item.role)}</p>
              <p className="mt-4 text-sm leading-7 theme-text-muted">{pickText(locale, item.quote)}</p>
            </Surface>
          ))}
        </div>
      </section>
    </div>
  );
}
