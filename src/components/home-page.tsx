"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Award,
  CalendarRange,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  Crown,
  GraduationCap,
  LayoutDashboard,
  Medal,
  Newspaper,
  Quote,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Users2,
} from "lucide-react";

import {
  defaultPageContent,
  homeMetrics,
  sponsorProfiles,
  testimonialItems,
} from "@/data/site-content";
import { pickText } from "@/lib/site";
import { useSiteState } from "@/components/providers/site-state-provider";
import {
  SectionHeading,
  Surface,
} from "@/components/site-ui";

const serviceItems = [
  {
    icon: TrendingUp,
    title: {
      en: "Competition information",
      vi: "Thông tin cuộc thi",
    },
    description: {
      en: "Clear public pages for rounds, rewards, rules, and timeline.",
      vi: "Trang công khai rõ ràng cho vòng thi, giải thưởng, thể lệ và lịch trình.",
    },
  },
  {
    icon: Users2,
    title: {
      en: "Team formation logic",
      vi: "Logic tạo đội",
    },
    description: {
      en: "Students can create, invite, accept, leave, and transfer leadership within the defined rules.",
      vi: "Sinh viên có thể tạo đội, mời, chấp nhận, rời đội và chuyển đội trưởng trong đúng quy tắc.",
    },
  },
  {
    icon: ShieldCheck,
    title: {
      en: "Organizer-ready control",
      vi: "Sẵn sàng cho ban tổ chức",
    },
    description: {
      en: "The prototype already reserves space for moderation, publishing, and participant oversight.",
      vi: "Prototype đã dành sẵn không gian cho quản lý nội dung, đăng bài và theo dõi thí sinh.",
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
    rank: { en: "1st place", vi: "Hạng 1" },
    title: { en: "Champion", vi: "Quán quân" },
    amount: { en: "30,000,000 VND", vi: "30.000.000 VND" },
    note: {
      en: "Awarded to the team with the highest final-round score.",
      vi: "Trao cho đội có điểm cao nhất ở vòng chung kết.",
    },
    icon: Crown,
    iconClass: "bg-[linear-gradient(135deg,#f59e0b,#facc15)] text-slate-950",
    borderClass: "border-amber-300/24 bg-white/14",
  },
  {
    rank: { en: "2nd place", vi: "Hạng 2" },
    title: { en: "Runner-up", vi: "Á quân" },
    amount: { en: "15,000,000 VND", vi: "15.000.000 VND" },
    note: {
      en: "Awarded to the team with the second-highest final-round score.",
      vi: "Trao cho đội có điểm cao thứ hai ở vòng chung kết.",
    },
    icon: Medal,
    iconClass: "bg-[linear-gradient(135deg,#e2e8f0,#cbd5e1)] text-slate-950",
    borderClass: "border-white/14 bg-white/10",
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
    borderClass: "border-white/14 bg-white/10",
  },
  {
    rank: { en: "4th place", vi: "Hạng 4" },
    title: { en: "Two finalist teams", vi: "Hai đội đồng hạng 4" },
    amount: { en: "2 x 5,000,000 VND", vi: "2 x 5.000.000 VND" },
    note: {
      en: "The remaining two finalists each receive the fourth-place award.",
      vi: "Hai đội còn lại trong top 5 chung kết, mỗi đội nhận giải hạng 4.",
    },
    icon: Star,
    iconClass: "bg-[linear-gradient(135deg,#38bdf8,#14b8a6)] text-white",
    borderClass: "border-cyan-300/18 bg-white/10",
  },
] as const;

const homepageEmergingReward = {
  eyebrow: { en: "Side recognition", vi: "Danh hieu bo sung" },
  title: { en: "Emerging Teams", vi: "Đội tiềm năng" },
  amount: { en: "Top 10 teams", vi: "Top 10 đội" },
  note: {
    en: "Teams ranked immediately after the top 5 in Round 2 receive recognition, certificates, and sponsor-side opportunities.",
    vi: "Các đội xếp ngay sau top 5 ở Vòng 2 nhận danh hiệu, giấy chứng nhận và các cơ hội đồng hành từ đối tác.",
  },
} as const;

const heroExperienceSlides = [
  {
    eyebrow: {
      en: "General overview",
      vi: "Tổng quan cuộc thi",
    },
    title: {
      en: "National fintech challenge for student teams",
      vi: "Sân chơi fintech toàn quốc dành cho đội thi sinh viên",
    },
    description: {
      en: "Attacker 2026 brings students into a three-round journey where finance, strategy, product thinking, and presentation all matter.",
      vi: "Attacker 2026 đưa sinh viên vào hành trình ba vòng thi, nơi tư duy tài chính, chiến lược, sản phẩm và khả năng trình bày đều quan trọng.",
    },
    highlights: [
      {
        en: "Students nationwide",
        vi: "Sinh viên trên toàn quốc",
      },
      {
        en: "Teams of 3-5",
        vi: "Đội hình 3-5 người",
      },
      {
        en: "Finance + product + data",
        vi: "Tài chính + sản phẩm + dữ liệu",
      },
    ],
    primaryCta: {
      href: "/competition",
      label: {
        en: "Competition overview",
        vi: "Tổng quan cuộc thi",
      },
    },
    secondaryCta: {
      href: "/organizer",
      label: {
        en: "About Attacker",
        vi: "Giới thiệu Attacker",
      },
    },
    cards: [
      {
        icon: Users2,
        label: {
          en: "Participants",
          vi: "Đối tượng",
        },
        value: {
          en: "University students",
          vi: "Sinh viên đại học",
        },
        note: {
          en: "Built for teams who want to test ideas in fintech and innovation.",
          vi: "Dành cho các đội muốn thử sức với ý tưởng fintech và đổi mới.",
        },
      },
      {
        icon: ShieldCheck,
        label: {
          en: "Format",
          vi: "Cấu trúc",
        },
        value: {
          en: "3 competition rounds",
          vi: "3 vòng thi",
        },
        note: {
          en: "Individual qualifier, project report, and live final defense.",
          vi: "Thi cá nhân, báo cáo dự án và thuyết trình bảo vệ ở chung kết.",
        },
      },
      {
        icon: TrendingUp,
        label: {
          en: "Focus",
          vi: "Trọng tâm",
        },
        value: {
          en: "Think, build, defend",
          vi: "Tư duy, triển khai, bảo vệ",
        },
        note: {
          en: "A serious challenge for students interested in finance, data, and products.",
          vi: "Một sân chơi nghiêm túc cho sinh viên quan tâm tài chính, dữ liệu và sản phẩm.",
        },
      },
    ],
  },
  {
    eyebrow: {
      en: "Rewards snapshot",
      vi: "Tóm tắt giải thưởng",
    },
    title: {
      en: "Top 5 finalist awards with sponsor-backed benefits",
      vi: "Giải thưởng cho top 5 cùng các quyền lợi đồng hành từ nhà tài trợ",
    },
    description: {
      en: "The prize structure rewards the final ranking clearly, while sponsor gifts, scholarships, and other non-cash benefits expand the value beyond cash awards.",
      vi: "Cấu trúc giải thưởng tách bạch theo thứ hạng chung kết, đồng thời quà tặng, học bổng và quyền lợi phi tiền mặt từ nhà tài trợ giúp giá trị cuộc thi vượt ra ngoài tiền thưởng.",
    },
    highlights: [
      {
        en: "30M champion prize",
        vi: "30 triệu cho quán quân",
      },
      {
        en: "Top 10 Emerging Teams",
        vi: "Top 10 đội tiềm năng",
      },
      {
        en: "Gifts and scholarships",
        vi: "Quà tặng và học bổng",
      },
    ],
    primaryCta: {
      href: "/competition",
      label: {
        en: "View reward structure",
        vi: "Xem cơ cấu giải thưởng",
      },
    },
    secondaryCta: {
      href: "/competition/sponsors",
      label: {
        en: "Sponsor partners",
        vi: "Đối tác tài trợ",
      },
    },
    cards: [
      {
        icon: Crown,
        label: {
          en: "Champion",
          vi: "Quán quân",
        },
        value: {
          en: "30,000,000 VND",
          vi: "30.000.000 VND",
        },
        note: {
          en: "Followed by runner-up, third place, and two finalist teams sharing 4th place awards.",
          vi: "Tiếp theo là á quân, hạng 3 và hai đội đồng hạng 4 ở vòng chung kết.",
        },
      },
      {
        icon: Star,
        label: {
          en: "Emerging Teams",
          vi: "Đội tiềm năng",
        },
        value: {
          en: "Next 10 teams",
          vi: "10 đội tiếp theo",
        },
        note: {
          en: "Recognized after Round 2 with certificates and partner-side opportunities.",
          vi: "Được ghi nhận sau Vòng 2 cùng giấy chứng nhận và các cơ hội từ đối tác.",
        },
      },
      {
        icon: Award,
        label: {
          en: "Sponsor benefits",
          vi: "Quyền lợi tài trợ",
        },
        value: {
          en: "Scholarships, gifts, access",
          vi: "Học bổng, quà tặng, cơ hội",
        },
        note: {
          en: "The reward pool can include non-cash benefits in addition to prize money.",
          vi: "Quỹ giải thưởng có thể bao gồm quyền lợi phi tiền mặt bên cạnh tiền thưởng.",
        },
      },
    ],
  },
  {
    eyebrow: {
      en: "Timeline overview",
      vi: "Tổng quan lịch trình",
    },
    title: {
      en: "From May registration to a July final-round defense",
      vi: "Từ đăng ký trong tháng 5 đến bảo vệ chung kết vào tháng 7",
    },
    description: {
      en: "Attacker 2026 runs through a compact season with clear handoff points between team formation, the Round 1 test, Round 2 report submission, and the final presentation day.",
      vi: "Attacker 2026 diễn ra trong một mùa giải gọn gàng với các mốc chuyển tiếp rõ ràng giữa giai đoạn tạo đội, bài thi Vòng 1, nộp báo cáo Vòng 2 và ngày thuyết trình chung kết.",
    },
    highlights: [
      {
        en: "May registration",
        vi: "Đăng ký tháng 5",
      },
      {
        en: "Round 1 qualifier",
        vi: "Vòng loại cá nhân",
      },
      {
        en: "July final day",
        vi: "Chung kết tháng 7",
      },
    ],
    primaryCta: {
      href: "/competition/timeline",
      label: {
        en: "Full timeline",
        vi: "Xem lịch trình",
      },
    },
    secondaryCta: {
      href: "/rules#round-1-rules",
      label: {
        en: "Round rules",
        vi: "Luật theo vòng",
      },
    },
    cards: [
      {
        icon: CalendarRange,
        label: {
          en: "May 2026",
          vi: "Tháng 5/2026",
        },
        value: {
          en: "Registration and Round 1",
          vi: "Đăng ký và Vòng 1",
        },
        note: {
          en: "Teams finalize roster first, then members take the individual qualifier.",
          vi: "Đội thi chốt đội hình trước, sau đó từng thành viên làm bài thi cá nhân.",
        },
      },
      {
        icon: TrendingUp,
        label: {
          en: "June 2026",
          vi: "Tháng 6/2026",
        },
        value: {
          en: "Round 2 project reports",
          vi: "Báo cáo dự án Vòng 2",
        },
        note: {
          en: "Top 50 teams move forward to submit and defend their project direction on paper.",
          vi: "Top 50 đội bước tiếp để nộp và bảo vệ định hướng dự án qua báo cáo.",
        },
      },
      {
        icon: Medal,
        label: {
          en: "July 2026",
          vi: "Tháng 7/2026",
        },
        value: {
          en: "Live final presentation",
          vi: "Chung kết thuyết trình",
        },
        note: {
          en: "Top 5 teams present live, answer judges, and compete for the final ranking.",
          vi: "Top 5 đội thuyết trình trực tiếp, trả lời giám khảo và tranh thứ hạng cuối cùng.",
        },
      },
    ],
  },
] as const;

export function HomePage() {
  const { locale, newsPosts, pageContent } = useSiteState();
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const heroSlides =
    pageContent.home.heroSlides.length > 0
      ? pageContent.home.heroSlides
      : defaultPageContent.home.heroSlides;
  const heroDeck = heroExperienceSlides.map((item, index) => ({
    ...item,
    image: heroSlides[index % heroSlides.length]?.image ?? defaultPageContent.home.heroSlides[0].image,
  }));
  const currentHeroSlide = heroDeck[activeSlide] ?? heroDeck[0];
  const currentTestimonial = testimonialItems[activeTestimonial] ?? testimonialItems[0];
  const sponsorMarqueeItems = [...sponsorProfiles, ...sponsorProfiles];

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

  useEffect(() => {
    if (testimonialItems.length <= 1) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveTestimonial((current) => (current + 1) % testimonialItems.length);
    }, 5600);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const latestNews = newsPosts.slice(0, 3);

  return (
    <div className="space-y-24 pb-8">
      <section className="relative left-1/2 right-1/2 -mx-[50vw] w-screen overflow-hidden">
        <div className="relative min-h-[500px] md:min-h-[560px]">
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
                className="hero-pan object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,18,35,0.26),rgba(7,18,35,0.48))]" />
            </div>
          ))}

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(255,255,255,0.16),transparent_24%),linear-gradient(180deg,rgba(7,18,35,0.2)_0%,rgba(7,18,35,0.56)_62%,rgba(7,18,35,0.82)_100%)]" />

          <div className="relative z-10 mx-auto flex min-h-[500px] max-w-7xl items-center px-4 pb-14 pt-22 text-white md:min-h-[560px] md:px-8">
            <div className="grid w-full gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
              <div className="rounded-[2.25rem] border border-white/12 bg-[linear-gradient(180deg,rgba(8,20,38,0.68),rgba(8,20,38,0.5))] px-6 py-6 shadow-[0_28px_64px_rgba(7,18,35,0.26)] backdrop-blur-xl md:px-7 md:py-7">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="inline-flex items-center rounded-full border border-white/14 bg-[rgba(255,255,255,0.1)] px-3.5 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-white/80">
                    {pickText(locale, currentHeroSlide.eyebrow)}
                  </span>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-[rgba(255,255,255,0.08)] px-3 py-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-white/66">
                    <span>{String(activeSlide + 1).padStart(2, "0")}</span>
                    <span className="h-px w-4 bg-white/24" />
                    <span>{String(heroDeck.length).padStart(2, "0")}</span>
                  </div>
                </div>

                <h1 className="theme-heading mt-5 max-w-3xl text-[2.15rem] font-semibold leading-[1.04] md:text-[3.55rem]">
                  {pickText(locale, currentHeroSlide.title)}
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-white/78 md:text-[1.02rem]">
                  {pickText(locale, currentHeroSlide.description)}
                </p>

                <div className="mt-5 flex flex-wrap gap-2.5">
                  {currentHeroSlide.highlights.map((item) => (
                    <div
                      key={item.en}
                      className="rounded-full border border-white/12 bg-[rgba(255,255,255,0.1)] px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/82 shadow-[0_14px_30px_rgba(7,18,35,0.12)]"
                    >
                      {pickText(locale, item)}
                    </div>
                  ))}
                </div>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href={currentHeroSlide.primaryCta.href}
                    className="theme-button-primary inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition hover:brightness-110"
                  >
                    {pickText(locale, currentHeroSlide.primaryCta.label)}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href={currentHeroSlide.secondaryCta.href}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/16 bg-[rgba(255,255,255,0.1)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[rgba(255,255,255,0.18)]"
                  >
                    {pickText(locale, currentHeroSlide.secondaryCta.label)}
                  </Link>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                {currentHeroSlide.cards.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.label.en}
                      className="rounded-[1.65rem] border border-white/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.08))] px-4 py-4 shadow-[0_20px_44px_rgba(7,18,35,0.18)] backdrop-blur-xl"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/12 bg-[rgba(7,18,35,0.26)] text-cyan-100">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-white/58">
                            {pickText(locale, item.label)}
                          </p>
                          <p className="mt-1.5 text-base font-semibold text-white">
                            {pickText(locale, item.value)}
                          </p>
                          <p className="mt-2 text-sm leading-6 text-white/74">
                            {pickText(locale, item.note)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
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
                : "Các giải chính được tách rõ theo thứ hạng chung kết từ hạng 1 đến hạng 4, trong khi Đội tiềm năng nằm ở một block riêng nhỏ hơn sau Vòng 2."}
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
                  locale === "en" ? "Round 1 selects the top 50 teams." : "Vòng 1 chọn ra top 50 đội.",
                  locale === "en" ? "Round 2 selects the top 5 finalists." : "Vòng 2 chọn ra top 5 đội chung kết.",
                  locale === "en" ? "The next 10 teams are named Emerging Teams." : "10 đội tiếp theo được gọi tên là Đội tiềm năng.",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm text-white/78"
                  >
                    {item}
                  </div>
                ))}
              </div>
              <Link
                href="/competition"
                className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/16 bg-[rgba(7,18,35,0.28)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_14px_32px_rgba(7,18,35,0.18)] transition hover:bg-[rgba(7,18,35,0.38)] hover:text-white"
              >
                {locale === "en" ? "Open full competition page" : "Mở trang cuộc thi đầy đủ"}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="mt-4 text-sm leading-7 text-white/68">
                {locale === "en"
                  ? "In addition to cash awards, teams may also receive sponsor-supported gifts, scholarships, and other non-cash opportunities."
                  : "Bên cạnh tiền thưởng, các đội còn có thể nhận thêm quà tặng, học bổng và những quyền lợi phi tiền mặt từ nhà tài trợ."}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex justify-end">
          <Link href="/competition/sponsors" className="inline-flex items-center gap-2 text-sm font-semibold theme-accent">
            {locale === "en" ? "Open sponsors page" : "Mở trang nhà tài trợ"}
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

      <section className="relative overflow-hidden rounded-[2.4rem] border theme-border bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(240,247,255,0.92))] px-6 py-8 md:px-8 md:py-10">
        <div className="absolute -right-8 top-0 h-40 w-40 rounded-full bg-sky-200/40 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-cyan-200/36 blur-3xl" />

        <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1.04fr)_340px] xl:items-start">
          <div className="rounded-[2rem] border theme-border-strong bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(237,245,251,0.92))] p-6 shadow-[0_26px_64px_rgba(14,37,66,0.12)]">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="max-w-2xl">
                <p className="theme-eyebrow text-xs font-semibold uppercase tracking-[0.3em]">
                  {locale === "en" ? "Attacker 2025 voices" : "Góc nhìn từ Attacker 2025"}
                </p>
                <h2 className="theme-heading mt-4 text-3xl font-semibold leading-[1.08] theme-text-strong md:text-[2.8rem]">
                  {locale === "en"
                    ? "What participants carried forward after last season."
                    : "Những điều thí sinh mang theo sau mùa Attacker trước."}
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 theme-text-muted md:text-base">
                  {locale === "en"
                    ? "A more editorial testimonial stage with rotating profiles, direct quotes, and the transition from competition role to current direction."
                    : "Một khu vực testimonial giàu tính biên tập hơn, xoay vòng giữa các gương mặt, câu trích dẫn và hành trình từ vai trò tại cuộc thi đến định hướng hiện tại."}
                </p>
              </div>
              <div className="flex items-center gap-2 self-start">
                <button
                  type="button"
                  onClick={() =>
                    setActiveTestimonial((current) =>
                      (current - 1 + testimonialItems.length) % testimonialItems.length,
                    )
                  }
                  aria-label={locale === "en" ? "Previous testimonial" : "Lời chia sẻ trước"}
                  className="theme-button-secondary inline-flex h-11 w-11 items-center justify-center rounded-full"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTestimonial((current) => (current + 1) % testimonialItems.length)}
                  aria-label={locale === "en" ? "Next testimonial" : "Lời chia sẻ tiếp theo"}
                  className="theme-button-secondary inline-flex h-11 w-11 items-center justify-center rounded-full"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
              <div className="relative overflow-hidden rounded-[1.8rem] border theme-border bg-[linear-gradient(180deg,rgba(10,29,52,0.96),rgba(23,114,208,0.9))] p-4 text-white">
                <div className="relative h-[250px] overflow-hidden rounded-[1.5rem] border border-white/12">
                  <Image
                    key={currentTestimonial.name}
                    src={currentTestimonial.avatarImageSrc}
                    alt={currentTestimonial.name}
                    fill
                    sizes="220px"
                    className="object-cover transition duration-700"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(7,18,35,0.82)_100%)]" />
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <p className="theme-heading text-xl font-semibold text-white">{currentTestimonial.name}</p>
                    <p className="mt-2 text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-white/70">
                      {pickText(locale, currentTestimonial.competitionRole)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-[1.35rem] border border-white/12 bg-white/10 p-4 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white/88">
                    <GraduationCap className="h-4 w-4" />
                    <span>{currentTestimonial.university}</span>
                  </div>
                  {currentTestimonial.currentEmployment ? (
                    <div className="mt-3 flex items-start gap-2 text-sm text-white/76">
                      <BriefcaseBusiness className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{pickText(locale, currentTestimonial.currentEmployment)}</span>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="relative overflow-hidden rounded-[1.9rem] border theme-border-strong bg-white/84 p-6 shadow-[0_22px_56px_rgba(14,37,66,0.08)]">
                <div className="absolute -right-10 top-4 h-28 w-28 rounded-full bg-sky-100/70 blur-2xl" />
                <div className="absolute left-0 top-0 h-full w-1.5 bg-[linear-gradient(180deg,#1772d0,#46bbff)]" />
                <Quote className="relative h-9 w-9 theme-accent" />
                <p className="relative mt-5 text-lg leading-9 theme-text-body md:text-[1.42rem] md:leading-10">
                  &ldquo;{pickText(locale, currentTestimonial.quote)}&rdquo;
                </p>

                <div className="relative mt-8 grid gap-3 md:grid-cols-2">
                  <div className="rounded-[1.2rem] border theme-border bg-white/72 px-4 py-3">
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] theme-eyebrow">
                      {locale === "en" ? "Competition role" : "Vai trò tại cuộc thi"}
                    </p>
                    <p className="mt-2 text-sm leading-6 theme-text-body">
                      {pickText(locale, currentTestimonial.competitionRole)}
                    </p>
                  </div>
                  <div className="rounded-[1.2rem] border theme-border bg-white/72 px-4 py-3">
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] theme-eyebrow">
                      {locale === "en" ? "Current direction" : "Hướng đi hiện tại"}
                    </p>
                    <p className="mt-2 text-sm leading-6 theme-text-body">
                      {currentTestimonial.currentEmployment
                        ? pickText(locale, currentTestimonial.currentEmployment)
                        : locale === "en"
                          ? "Still developing in student-led fintech projects."
                          : "Tiếp tục phát triển qua các dự án fintech do sinh viên dẫn dắt."}
                    </p>
                  </div>
                </div>

                <div className="relative mt-6 flex gap-2">
                  {testimonialItems.map((item, index) => (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => setActiveTestimonial(index)}
                      aria-label={item.name}
                      className={`h-2.5 rounded-full transition ${
                        index === activeTestimonial ? "w-10 bg-[var(--brand)]" : "w-2.5 bg-slate-300/70"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {testimonialItems.map((item, index) => (
              <button
                key={item.name}
                type="button"
                onClick={() => setActiveTestimonial(index)}
                className={`group flex w-full cursor-pointer items-start gap-4 rounded-[1.6rem] border px-4 py-4 text-left transition duration-300 ${
                  index === activeTestimonial
                    ? "theme-border-strong bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(230,242,255,0.96))] shadow-[0_20px_46px_rgba(14,37,66,0.12)]"
                    : "theme-border bg-white/68 hover:-translate-y-0.5 hover:bg-white/86"
                }`}
              >
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[1.1rem] border theme-border">
                  <Image src={item.avatarImageSrc} alt={item.name} fill sizes="64px" className="object-cover" />
                </div>
                <div className="min-w-0">
                  <p className="theme-heading text-base font-semibold theme-text-strong">{item.name}</p>
                  <p className="mt-1 text-[0.72rem] font-semibold uppercase tracking-[0.18em] theme-eyebrow">
                    {pickText(locale, item.competitionRole)}
                  </p>
                  <p className="mt-2 text-sm theme-text-soft">{item.university}</p>
                  <p className="mt-2 text-sm leading-6 theme-text-muted">
                    &ldquo;{pickText(locale, item.quote)}&rdquo;
                  </p>
                </div>
              </button>
            ))}
            <Link href="/organizer" className="inline-flex items-center gap-2 px-1 text-sm font-semibold theme-accent">
              {locale === "en" ? "About Attacker" : "Giới thiệu Attacker"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
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
          {locale === "en" ? "About Attacker" : "Giới thiệu Attacker"}
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
            : '"Một website cuộc thi mạnh không chỉ để thông báo lịch. Nó tạo ra niềm tin vào chất lượng đề bài, nền tảng và đội ngũ phía sau."'}
        </p>
        <p className="mt-5 text-sm uppercase tracking-[0.26em] theme-text-soft">
          {locale === "en" ? "Attacker 2026 frontend concept" : "Concept frontend Attacker 2026"}
        </p>
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
                  {locale === "en" ? "Open registration preview" : "Mở preview đăng ký"}
                </Link>
                <Link
                  href="/news"
                  className="inline-flex items-center justify-center rounded-full border border-white/18 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  {locale === "en" ? "Open newsroom" : "Mở newsroom"}
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
                  : "Nhận cập nhật về đăng ký, clinic và tiến độ các vòng thi."}
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
                  {locale === "en" ? "Subscribe for updates" : "Đăng ký nhận cập nhật"}
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

      <section>
        <SectionHeading
          eyebrow={pickText(locale, pageContent.home.destinations.eyebrow)}
          title={pickText(locale, pageContent.home.destinations.title)}
          description={pickText(locale, pageContent.home.destinations.description)}
        />

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[
            {
              href: "/competition",
              label: locale === "en" ? "Competition" : "Cuoc thi",
            },
            {
              href: "/rules",
              label: locale === "en" ? "Rules" : "Thể lệ",
            },
            {
              href: "/news",
              label: locale === "en" ? "Newsroom" : "Newsroom",
            },
            {
              href: "/dashboard",
              label: locale === "en" ? "Team workspace" : "Không gian đội",
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
      </section>
    </div>
  );
}
