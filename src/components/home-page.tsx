"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Award,
  CalendarRange,
  BriefcaseBusiness,
  Crown,
  GraduationCap,
  Medal,
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
} from "@/data/site-content";
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
    icon: Medal,
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
    amount: { en: "2 x 5,000,000 VND", vi: "2 x 5.000.000 VND" },
    note: {
      en: "The remaining two finalists each receive the fourth-place award.",
      vi: "Hai đội còn lại trong top 5 chung kết, mỗi đội nhận giải hạng 4.",
    },
    icon: Star,
    iconClass: "bg-[linear-gradient(135deg,#38bdf8,#14b8a6)] text-white",
    borderClass: "border-cyan-300/40",
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

const heroCardIconClasses = [
  "bg-[linear-gradient(135deg,rgba(56,189,248,0.95),rgba(14,165,233,0.95))] text-white shadow-[0_14px_32px_rgba(56,189,248,0.3)]",
  "bg-[linear-gradient(135deg,rgba(52,211,153,0.95),rgba(16,185,129,0.95))] text-slate-950 shadow-[0_14px_32px_rgba(16,185,129,0.24)]",
  "bg-[linear-gradient(135deg,rgba(251,191,36,0.98),rgba(249,115,22,0.96))] text-slate-950 shadow-[0_14px_32px_rgba(249,115,22,0.24)]",
] as const;

const testimonialQuoteClasses = [
  "text-[#7c3aed] bg-[rgba(124,58,237,0.1)]",
  "text-[#ec4899] bg-[rgba(236,72,153,0.1)]",
  "text-[#2563eb] bg-[rgba(37,99,235,0.1)]",
] as const;

export function HomePage() {
  const { locale, pageContent } = useSiteState();
  const [activeSlide, setActiveSlide] = useState(0);
  const [protectionWarning, setProtectionWarning] = useState<string | null>(null);
  const [isCaptureShieldVisible, setIsCaptureShieldVisible] = useState(false);
  const protectionWarningTimeoutRef = useRef<number | null>(null);
  const captureShieldTimeoutRef = useRef<number | null>(null);
  const heroSlides =
    pageContent.home.heroSlides.length > 0
      ? pageContent.home.heroSlides
      : defaultPageContent.home.heroSlides;
  const heroDeck = heroExperienceSlides.map((item, index) => ({
    ...item,
    image: heroSlides[index % heroSlides.length]?.image ?? defaultPageContent.home.heroSlides[0].image,
  }));
  const currentHeroSlide = heroDeck[activeSlide] ?? heroDeck[0];
  const sponsorMarqueeItems = [...sponsorProfiles, ...sponsorProfiles];
  const testimonialItems = pageContent.home.testimonials;
  const testimonialMarqueeItems = [...testimonialItems, ...testimonialItems];

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
    return () => {
      if (protectionWarningTimeoutRef.current) {
        window.clearTimeout(protectionWarningTimeoutRef.current);
      }

      if (captureShieldTimeoutRef.current) {
        window.clearTimeout(captureShieldTimeoutRef.current);
      }
    };
  }, []);

  const showProtectionNotice = useCallback(
    (type: "capture" | "interaction") => {
      const message =
        type === "capture"
          ? locale === "en"
            ? "Screenshot and print shortcuts are restricted on the homepage."
            : "Phím tắt chụp màn hình và in nội dung bị hạn chế trên trang chủ."
          : locale === "en"
            ? "Text selection, right click, and copy shortcuts are disabled on the homepage."
            : "Chọn văn bản, nhấp chuột phải và các phím tắt sao chép đã bị tắt trên trang chủ.";

      setProtectionWarning(message);

      if (protectionWarningTimeoutRef.current) {
        window.clearTimeout(protectionWarningTimeoutRef.current);
      }

      protectionWarningTimeoutRef.current = window.setTimeout(() => {
        setProtectionWarning(null);
        protectionWarningTimeoutRef.current = null;
      }, 3200);

      if (type === "capture") {
        setIsCaptureShieldVisible(true);

        if (captureShieldTimeoutRef.current) {
          window.clearTimeout(captureShieldTimeoutRef.current);
        }

        captureShieldTimeoutRef.current = window.setTimeout(() => {
          setIsCaptureShieldVisible(false);
          captureShieldTimeoutRef.current = null;
        }, 1400);
      }
    },
    [locale],
  );

  useEffect(() => {
    document.documentElement.classList.add("theme-homepage-locked");
    document.body.classList.add("theme-homepage-locked");

    const blockEvent = (event: Event) => {
      event.preventDefault();
    };

    const blockInteractiveEvent = (event: Event) => {
      event.preventDefault();
      showProtectionNotice("interaction");
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const isCommandModifier = event.ctrlKey || event.metaKey;
      const isWindowsPrintScreen = key === "printscreen";
      const isMacScreenshotShortcut =
        event.metaKey && event.shiftKey && (key === "3" || key === "4" || key === "5");
      const isPrintShortcut = isCommandModifier && key === "p";

      if (isWindowsPrintScreen || isMacScreenshotShortcut || isPrintShortcut) {
        event.preventDefault();
        showProtectionNotice("capture");
        return;
      }

      if (!isCommandModifier) {
        return;
      }

      if (key === "a" || key === "c" || key === "v" || key === "x" || key === "s" || key === "u") {
        event.preventDefault();
        showProtectionNotice("interaction");
      }
    };

    const handleBeforePrint = (event: Event) => {
      event.preventDefault();
      showProtectionNotice("capture");
    };

    document.addEventListener("copy", blockInteractiveEvent);
    document.addEventListener("cut", blockInteractiveEvent);
    document.addEventListener("paste", blockInteractiveEvent);
    document.addEventListener("contextmenu", blockInteractiveEvent);
    document.addEventListener("selectstart", blockEvent);
    document.addEventListener("dragstart", blockEvent);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("beforeprint", handleBeforePrint);

    return () => {
      document.documentElement.classList.remove("theme-homepage-locked");
      document.body.classList.remove("theme-homepage-locked");
      document.removeEventListener("copy", blockInteractiveEvent);
      document.removeEventListener("cut", blockInteractiveEvent);
      document.removeEventListener("paste", blockInteractiveEvent);
      document.removeEventListener("contextmenu", blockInteractiveEvent);
      document.removeEventListener("selectstart", blockEvent);
      document.removeEventListener("dragstart", blockEvent);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("beforeprint", handleBeforePrint);
    };
  }, [showProtectionNotice]);

  return (
    <>
      {isCaptureShieldVisible ? (
        <div className="pointer-events-none fixed inset-0 z-[90] bg-[rgba(7,18,35,0.82)] backdrop-blur-md">
          <div className="flex h-full items-center justify-center px-4">
            <div className="rounded-[1.9rem] border border-white/12 bg-[rgba(7,18,35,0.86)] px-6 py-5 text-center text-white shadow-[0_24px_54px_rgba(2,8,20,0.34)]">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/68">
                {locale === "en" ? "Protected homepage" : "Trang chủ được bảo vệ"}
              </p>
              <p className="mt-3 text-base font-semibold">
                {locale === "en"
                  ? "Capture action blocked"
                  : "Hành động chụp nội dung đã bị chặn"}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {protectionWarning ? (
        <div className="pointer-events-none fixed bottom-5 right-5 z-[91] max-w-sm rounded-[1.4rem] border border-amber-700/24 bg-[linear-gradient(135deg,rgba(255,249,219,0.98),rgba(255,237,213,0.96))] px-4 py-3.5 text-sm leading-7 text-amber-950 shadow-[0_18px_44px_rgba(122,74,12,0.16)] dark:border-amber-300/22 dark:bg-[linear-gradient(135deg,rgba(120,53,15,0.42),rgba(113,63,18,0.34))] dark:text-amber-100">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4.5 w-4.5 shrink-0" />
            <p>{protectionWarning}</p>
          </div>
        </div>
      ) : null}

      <div className="theme-homepage-protected space-y-24 pb-8">
      <section className="relative left-1/2 right-1/2 -mx-[50vw] -mt-6 w-screen overflow-hidden md:-mt-8">
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
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,18,35,0.16),rgba(7,18,35,0.38))]" />
            </div>
          ))}

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_9%,rgba(255,255,255,0.14),transparent_22%),linear-gradient(180deg,rgba(7,18,35,0.14)_0%,rgba(7,18,35,0.44)_62%,rgba(7,18,35,0.72)_100%)]" />

          <div className="relative z-10 mx-auto flex min-h-[500px] max-w-7xl items-center px-4 pb-14 pt-20 text-white md:min-h-[560px] md:px-8 md:pt-22">
            <div className="grid w-full gap-4 lg:grid-cols-[minmax(0,0.92fr)_296px] lg:items-end">
              <div className="max-w-3xl md:pr-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="inline-flex items-center rounded-full border border-white/12 bg-[rgba(255,255,255,0.08)] px-3 py-1.5 text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-white/82">
                    {pickText(locale, currentHeroSlide.eyebrow)}
                  </span>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[rgba(255,255,255,0.07)] px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/70">
                    <span>{String(activeSlide + 1).padStart(2, "0")}</span>
                    <span className="h-px w-4 bg-white/24" />
                    <span>{String(heroDeck.length).padStart(2, "0")}</span>
                  </div>
                </div>

                <h1 className="theme-heading mt-4 max-w-3xl text-[1.7rem] font-semibold leading-[1.04] text-white [text-shadow:0_14px_34px_rgba(7,18,35,0.38)] md:text-[2.78rem]">
                  {pickText(locale, currentHeroSlide.title)}
                </h1>
                <p className="mt-3.5 max-w-2xl text-[0.9rem] leading-7 text-white/80 [text-shadow:0_10px_24px_rgba(7,18,35,0.32)] md:text-[0.95rem]">
                  {pickText(locale, currentHeroSlide.description)}
                </p>

                <div className="mt-4.5 flex flex-wrap gap-2">
                  {currentHeroSlide.highlights.map((item) => (
                    <div
                      key={item.en}
                      className="rounded-full border border-white/10 bg-[rgba(255,255,255,0.06)] px-3 py-1.5 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-white/86 shadow-[0_10px_22px_rgba(7,18,35,0.1)] backdrop-blur-sm"
                    >
                      {pickText(locale, item)}
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href={currentHeroSlide.primaryCta.href}
                    className="theme-button-primary inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-[0.92rem] font-semibold transition hover:brightness-110"
                  >
                    {pickText(locale, currentHeroSlide.primaryCta.label)}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href={currentHeroSlide.secondaryCta.href}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/12 bg-[rgba(255,255,255,0.08)] px-5 py-3 text-[0.92rem] font-semibold text-white transition hover:bg-[rgba(255,255,255,0.16)]"
                  >
                    {pickText(locale, currentHeroSlide.secondaryCta.label)}
                  </Link>
                </div>
              </div>

              <div className="grid gap-2.5 sm:grid-cols-3 lg:grid-cols-1">
                {currentHeroSlide.cards.map((item, index) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.label.en}
                      className="rounded-[1.45rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] px-3.5 py-3 shadow-[0_14px_30px_rgba(7,18,35,0.12)] backdrop-blur-md"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem] border border-white/12 ${heroCardIconClasses[index % heroCardIconClasses.length]}`}
                        >
                          <Icon className="h-4.5 w-4.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-white/60">
                            {pickText(locale, item.label)}
                          </p>
                          <p className="mt-1 text-[0.9rem] font-semibold text-white">
                            {pickText(locale, item.value)}
                          </p>
                          <p className="mt-1.5 text-[0.78rem] leading-5.5 text-white/76">
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
        {homeMetrics.map((item) => {
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

      <section className="theme-home-rewards-shell relative overflow-hidden rounded-[2.4rem] border px-6 py-8 md:px-8 md:py-10">
        <div className="absolute -left-20 top-10 h-56 w-56 rounded-full bg-cyan-300/14 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-sky-300/16 blur-3xl" />

        <div className="relative grid gap-8 xl:grid-cols-[minmax(0,1.15fr)_320px] xl:items-start">
          <div>
            <p className="theme-eyebrow text-xs font-semibold uppercase tracking-[0.34em]">
              {pickText(locale, pageContent.competition.rewards.eyebrow)}
            </p>
            <h2 className="theme-heading mt-5 max-w-3xl text-3xl font-semibold leading-[1.08] theme-text-strong md:text-[3rem]">
              {locale === "en"
                ? "A prize structure that makes the top 5 instantly clear."
                : "Cấu trúc giải thưởng giúp top 5 được nhìn ra ngay lập tức."}
            </h2>
            <p className="theme-text-muted mt-5 max-w-3xl text-base leading-8">
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
                    className={`theme-home-reward-card rounded-[1.8rem] border px-5 py-5 backdrop-blur-md ${item.borderClass}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${item.iconClass}`}>
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
                      {pickText(locale, item.amount)}
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
                    {pickText(locale, homepageEmergingReward.eyebrow)}
                  </p>
                  <p className="theme-text-strong mt-1 text-lg font-semibold">
                    {pickText(locale, homepageEmergingReward.title)}
                  </p>
                </div>
              </div>
              <p className="theme-text-strong mt-5 text-2xl font-semibold">
                {pickText(locale, homepageEmergingReward.amount)}
              </p>
              <p className="theme-text-muted mt-3 text-sm leading-7">
                {pickText(locale, homepageEmergingReward.note)}
              </p>
            </div>

            <div className="theme-home-reward-aside rounded-[2rem] border px-5 py-5 backdrop-blur-md">
              <p className="theme-eyebrow text-xs font-semibold uppercase tracking-[0.28em]">
                {locale === "en" ? "Competition path" : "Lộ trình cuộc thi"}
              </p>
              <div className="mt-5 space-y-3">
                {[
                  locale === "en" ? "Round 1 selects the top 50 teams." : "Vòng 1 chọn ra top 50 đội.",
                  locale === "en" ? "Round 2 selects the top 5 finalists." : "Vòng 2 chọn ra top 5 đội chung kết.",
                  locale === "en" ? "The next 10 teams are named Emerging Teams." : "10 đội tiếp theo được gọi tên là Đội tiềm năng.",
                ].map((item) => (
                  <div
                    key={item}
                    className="theme-home-path-item theme-text-body rounded-2xl border px-4 py-3 text-sm"
                  >
                    {item}
                  </div>
                ))}
              </div>
              <Link
                href="/competition"
                className="theme-button-secondary mt-6 inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold"
              >
                {locale === "en" ? "Open full competition page" : "Mở trang cuộc thi đầy đủ"}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="theme-text-muted mt-4 text-sm leading-7">
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
          <div className="overflow-hidden py-6 md:py-7">
            <div className="marquee-track flex w-max items-center gap-5 px-4 hover:[animation-play-state:paused] md:gap-6 md:px-6">
              {sponsorMarqueeItems.map((sponsor, index) => (
                <div
                  key={`${sponsor.name}-${index}`}
                  className="flex min-h-[108px] min-w-[210px] shrink-0 items-center justify-center rounded-[2rem] border theme-border bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,249,255,0.94))] px-6 py-5 shadow-[0_22px_44px_rgba(148,163,184,0.12)] md:min-h-[122px] md:min-w-[248px] md:px-7 md:py-6"
                  aria-hidden={index >= sponsorProfiles.length}
                >
                  <Image
                    src={sponsor.logoSrc}
                    alt={sponsor.name}
                    width={196}
                    height={72}
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
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <p className="text-center text-xs font-semibold uppercase tracking-[0.3em] theme-eyebrow md:text-left">
                {locale === "en" ? "Testimonial" : "Cảm nhận"}
              </p>
              <h2 className="theme-heading mt-3 text-center text-3xl font-semibold leading-[1.08] theme-text-strong md:text-left md:text-[2.75rem]">
                {locale === "en"
                  ? "What Attacker 2025 participants think about the journey"
                  : "Những gì thí sinh Attacker 2025 cảm nhận sau hành trình cuộc thi"}
              </h2>
              <p className="mt-3 text-center text-sm leading-7 theme-text-muted md:text-left md:text-base">
                {locale === "en"
                  ? "A sliding collection of short voices from finalists, champions, and emerging teams across last season."
                  : "Một cụm trích dẫn dạng slider, tổng hợp cảm nhận ngắn từ các đội chung kết, quán quân và đội tiềm năng của mùa trước."}
              </p>
            </div>
            <div className="rounded-full border theme-border bg-white/70 px-4 py-2 text-center text-[0.72rem] font-semibold uppercase tracking-[0.18em] theme-text-soft dark:bg-white/[0.05]">
              {locale === "en" ? "Auto-sliding voices" : "Trích dẫn tự động"}
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
            <Link href="/organizer" className="inline-flex items-center justify-center gap-2 text-sm font-semibold theme-accent md:justify-end">
              {locale === "en" ? "About Attacker" : "Giới thiệu Attacker"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
      ) : null}

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
      </div>
    </>
  );
}
