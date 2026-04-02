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

export function OrganizerPage() {
  const { locale, pageContent } = useSiteState();
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  const [expandedGalleryIndex, setExpandedGalleryIndex] = useState<number | null>(null);
  const seasonStories = [
    {
      year: "2023",
      image: "/theme-feature-1.jpg",
      label: {
        en: "Early market-building phase",
        vi: "Giai đoạn xây nền tảng ban đầu",
      },
      title: {
        en: "Attacker started as a student arena for sharper fintech thinking.",
        vi: "Attacker bắt đầu như một sân chơi sinh viên cho tư duy fintech sắc nét hơn.",
      },
      body: {
        en: "The first seasons proved there was demand for a competition that sits between finance, product reasoning, and practical execution.",
        vi: "Những mùa đầu cho thấy có nhu cầu rõ ràng cho một cuộc thi nằm giữa tài chính, tư duy sản phẩm và năng lực thực thi.",
      },
      stats: [
        { en: "300+ participants", vi: "300+ thí sinh" },
        { en: "multi-campus reach", vi: "phủ nhiều trường" },
      ],
    },
    {
      year: "2024",
      image: "/theme-hero-2.jpg",
      label: {
        en: "Cross-skill teams gained momentum",
        vi: "Đội đa kỹ năng bắt đầu bùng lên",
      },
      title: {
        en: "The team format matured with stronger product, data, and strategy roles.",
        vi: "Định dạng đội thi trưởng thành hơn với vai trò sản phẩm, dữ liệu và chiến lược rõ ràng hơn.",
      },
      body: {
        en: "Participants arrived with a more complete builder mindset, not only technical strength. That gave the competition better stories, better finals, and stronger peer learning.",
        vi: "Thí sinh đến với một tư duy builder đầy đủ hơn, không chỉ là sức mạnh kỹ thuật. Điều đó tạo nên những câu chuyện hay hơn, vòng chung kết tốt hơn và khả năng học hỏi lẫn nhau mạnh hơn.",
      },
      stats: [
        { en: "top finalist showcases", vi: "các showcase chung kết" },
        { en: "industry-facing judges", vi: "giám khảo gần doanh nghiệp" },
      ],
    },
    {
      year: "2025",
      image: "/theme-hero-1.jpg",
      label: {
        en: "The competition reached a broader ecosystem",
        vi: "Cuộc thi mở rộng ra hệ sinh thái lớn hơn",
      },
      title: {
        en: "Sponsors, judges, and student communities gave Attacker a stronger public presence.",
        vi: "Nhà tài trợ, giám khảo và cộng đồng sinh viên giúp Attacker có độ hiện diện công khai mạnh hơn.",
      },
      body: {
        en: "By this point the competition already felt bigger than a campus event. It started to behave like a real launch platform for student fintech talent.",
        vi: "Đến giai đoạn này, cuộc thi đã lớn hơn một sự kiện nội bộ trong trường. Nó bắt đầu vận hành như một launch platform thực sự cho tài năng fintech sinh viên.",
      },
      stats: [
        { en: "partner visibility", vi: "độ hiện diện đối tác" },
        { en: "clearer public narrative", vi: "câu chuyện công khai rõ hơn" },
      ],
    },
    {
      year: "2026",
      image: "/theme-feature-2.jpg",
      label: {
        en: "A cleaner international-facing stage",
        vi: "Một sân chơi sạch hơn, hướng ra bên ngoài hơn",
      },
      title: {
        en: "This season reframes Attacker as a more modern competition platform.",
        vi: "Mùa này tái định vị Attacker thành một nền tảng cuộc thi hiện đại hơn.",
      },
      body: {
        en: "The bilingual website, team workspace, newsroom, and admin mode together make the competition easier to trust, easier to navigate, and easier to scale.",
        vi: "Website song ngữ, team workspace, newsroom và admin mode kết hợp lại giúp cuộc thi dễ tạo niềm tin hơn, dễ điều hướng hơn và dễ mở rộng hơn.",
      },
      stats: [
        { en: "frontend team workflow", vi: "luồng đội frontend" },
        { en: "editorial newsroom system", vi: "hệ newsroom dạng biên tập" },
      ],
    },
  ];
  const gallerySlides = [
    {
      image: "/theme-hero-2.jpg",
      year: "2023",
      label: {
        en: "Kickoff atmosphere",
        vi: "Không khí khởi động",
      },
      title: {
        en: "Students entered Attacker through an energetic campus launch format.",
        vi: "Sinh viên bước vào Attacker qua một format khởi động giàu năng lượng học đường.",
      },
      description: {
        en: "This opening moment should feel like a real competition brand reveal, not just an internal event photo.",
        vi: "Khoảnh khắc mở đầu này nên mang cảm giác ra mắt thương hiệu cuộc thi thật sự, không chỉ là một tấm hình sự kiện nội bộ.",
      },
    },
    {
      image: "/theme-hero-1.jpg",
      year: "2024",
      label: {
        en: "Final-round focus",
        vi: "Không khí vòng chung kết",
      },
      title: {
        en: "Each season pushed the event closer to a stronger, more public-facing stage.",
        vi: "Mỗi mùa thi đều đẩy sự kiện đến gần hơn với một sân khấu mạnh hơn và hướng công chúng hơn.",
      },
      description: {
        en: "Use this type of visual to show the pressure, polish, and seriousness of the finalist experience.",
        vi: "Dùng kiểu hình ảnh này để cho thấy áp lực, độ chỉn chu và sự nghiêm túc của trải nghiệm dành cho đội vào chung kết.",
      },
    },
    {
      image: "/theme-feature-1.jpg",
      year: "2025",
      label: {
        en: "Team and audience energy",
        vi: "Năng lượng đội thi và khán giả",
      },
      title: {
        en: "Attacker grew into a competition with stronger team identity and broader visibility.",
        vi: "Attacker phát triển thành một cuộc thi có bản sắc đội thi rõ hơn và độ hiện diện rộng hơn.",
      },
      description: {
        en: "This visual works well for showing community density, reactions, and the scale of participation around the event.",
        vi: "Hình ảnh này phù hợp để cho thấy mật độ cộng đồng, phản ứng tại sự kiện và quy mô tham gia xoay quanh cuộc thi.",
      },
    },
    {
      image: "/theme-feature-2.jpg",
      year: "2026",
      label: {
        en: "New-generation presentation",
        vi: "Ngôn ngữ trình bày thế hệ mới",
      },
      title: {
        en: "The 2026 direction should feel cleaner, more international, and more visual-first.",
        vi: "Định hướng 2026 nên mang cảm giác sạch hơn, quốc tế hơn và ưu tiên hình ảnh hơn.",
      },
      description: {
        en: "This is the kind of imagery that can connect the legacy of the competition with the new website direction.",
        vi: "Đây là kiểu hình ảnh có thể kết nối di sản của cuộc thi với hướng website mới.",
      },
    },
  ];
  const activeGallerySlide = gallerySlides[activeGalleryIndex];
  const expandedGallerySlide =
    expandedGalleryIndex === null ? null : gallerySlides[expandedGalleryIndex];

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveGalleryIndex((current) => (current + 1) % gallerySlides.length);
    }, 4600);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [gallerySlides.length]);

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
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-end">
        <div>
          <SectionHeading
            eyebrow={pickText(locale, pageContent.organizer.header.eyebrow)}
            title={pickText(locale, pageContent.organizer.header.title)}
            description={pickText(locale, pageContent.organizer.header.description)}
          />
          <div className="mt-8 flex flex-wrap gap-3">
            {[
              locale === "en" ? "multi-season legacy" : "di sản nhiều mùa",
              locale === "en" ? "student fintech builders" : "builder fintech sinh viên",
              locale === "en" ? "industry-linked judging" : "hội đồng gắn với doanh nghiệp",
            ].map((item) => (
              <span
                key={item}
                className="rounded-full border theme-border bg-white/72 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] theme-text-soft"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <Surface className="overflow-hidden px-0 py-0">
          <div className="relative min-h-[360px]">
            <Image
              src="/theme-hero-1.jpg"
              alt="Attacker competition atmosphere"
              fill
              sizes="(min-width: 1024px) 420px, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,18,35,0.08),rgba(7,18,35,0.18),rgba(7,18,35,0.82))]" />
            <div className="absolute inset-x-0 bottom-0 p-6 text-white md:p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/66">
                {locale === "en" ? "Attacker legacy" : "Di sản Attacker"}
              </p>
              <p className="theme-heading mt-4 text-2xl font-semibold leading-[1.15]">
                {locale === "en"
                  ? "A competition that has grown from campus energy into a stronger fintech stage."
                  : "Một cuộc thi đã đi từ năng lượng học đường đến một sân chơi fintech vững vàng hơn."}
              </p>
            </div>
          </div>
        </Surface>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: locale === "en" ? "seasons shaped" : "mùa thi đã đi qua",
            value: "04",
          },
          {
            label: locale === "en" ? "student builders reached" : "lượt builder tiếp cận",
            value: "1,200+",
          },
          {
            label: locale === "en" ? "universities & communities" : "trường và cộng đồng",
            value: "35+",
          },
          {
            label: locale === "en" ? "partners & judges engaged" : "đối tác và giám khảo đồng hành",
            value: "50+",
          },
        ].map((item) => (
          <Surface key={item.label} className="theme-card-shadow-soft px-5 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-sky-200/80">
              {item.label}
            </p>
            <p className="mt-4 text-4xl font-semibold theme-text-strong">{item.value}</p>
          </Surface>
        ))}
      </section>

      <section className="space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            eyebrow={pickText(locale, pageContent.organizer.contentModules.eyebrow)}
            title={pickText(locale, pageContent.organizer.contentModules.title)}
            description={pickText(locale, pageContent.organizer.contentModules.description)}
          />
          <Link href="/competition" className="inline-flex items-center gap-2 text-sm font-semibold theme-accent">
            {locale === "en" ? "Explore competition page" : "Mở trang cuộc thi"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          {seasonStories.map((season) => (
            <Surface key={season.year} className="overflow-hidden px-0 py-0">
              <div className="grid gap-0 lg:grid-cols-[220px_minmax(0,1fr)]">
                <div className="relative min-h-[260px] overflow-hidden">
                  <Image
                    src={season.image}
                    alt={pickText(locale, season.title)}
                    fill
                    sizes="(min-width: 1280px) 220px, 100vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,18,35,0.08),rgba(7,18,35,0.18),rgba(7,18,35,0.72))]" />
                  <div className="absolute left-4 top-4 rounded-full border border-white/14 bg-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/86 backdrop-blur-md">
                    {season.year}
                  </div>
                </div>
                <div className="px-6 py-6 md:px-7 md:py-7">
                  <p className="text-xs font-semibold uppercase tracking-[0.26em] theme-eyebrow">
                    {pickText(locale, season.label)}
                  </p>
                  <p className="theme-heading mt-4 text-2xl font-semibold leading-[1.15] theme-text-strong">
                    {pickText(locale, season.title)}
                  </p>
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

      <section className="space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            eyebrow={locale === "en" ? "Photo slider" : "Photo slider"}
            title={
              locale === "en"
                ? "A more visual season gallery for Attacker."
                : "Một thư viện mùa thi trực quan hơn cho Attacker."
            }
            description={
              locale === "en"
                ? "The slider rotates through representative moments of the competition. Click any image to open it full screen with supporting context."
                : "Slider luân chuyển qua các khoảnh khắc tiêu biểu của cuộc thi. Bấm vào bất kỳ hình nào để mở toàn màn hình cùng phần mô tả đi kèm."
            }
          />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => shiftGallery(-1)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border theme-border theme-panel text-[var(--text-strong)] transition hover:-translate-y-0.5"
              aria-label={locale === "en" ? "Previous photo" : "Ảnh trước"}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => shiftGallery(1)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border theme-border theme-panel text-[var(--text-strong)] transition hover:-translate-y-0.5"
              aria-label={locale === "en" ? "Next photo" : "Ảnh tiếp theo"}
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
                    {locale === "en" ? "Open full view" : "Mở toàn màn hình"}
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </button>

            <div className="border-t theme-border px-4 py-4 md:px-6">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {gallerySlides.map((slide, index) => (
                  <button
                    key={`${slide.year}-${slide.image}`}
                    type="button"
                    onClick={() => setActiveGalleryIndex(index)}
                    className={`overflow-hidden rounded-[1.5rem] border text-left transition ${
                      index === activeGalleryIndex
                        ? "border-sky-300/44 bg-[rgba(23,114,208,0.08)]"
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
          </Surface>

          <Surface className="px-6 py-6 md:px-7 md:py-7">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200/80">
              {locale === "en" ? "Current frame" : "Khung hình hiện tại"}
            </p>
            <p className="mt-4 theme-heading text-2xl font-semibold theme-text-strong">
              {pickText(locale, activeGallerySlide.title)}
            </p>
            <p className="mt-4 text-sm leading-7 theme-text-muted">
              {pickText(locale, activeGallerySlide.description)}
            </p>
            <div className="mt-6 space-y-3">
              {[
                locale === "en"
                  ? "Autoplay keeps the section moving without feeling static."
                  : "Autoplay giúp section chuyển động mà không tạo cảm giác tĩnh.",
                locale === "en"
                  ? "Thumbnail clicks let users jump directly to a specific season moment."
                  : "Bấm thumbnail cho phép người xem nhảy thẳng đến một khoảnh khắc cụ thể.",
                locale === "en"
                  ? "Fullscreen mode gives each image more stage and more context."
                  : "Chế độ toàn màn hình giúp mỗi hình có nhiều sân khấu và nhiều ngữ cảnh hơn.",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border theme-border bg-white/72 px-4 py-3 text-sm leading-7 theme-text-body"
                >
                  {item}
                </div>
              ))}
            </div>
          </Surface>
        </div>
      </section>

      {expandedGallerySlide ? (
        <div className="fixed inset-0 z-[80] bg-[rgba(6,12,22,0.82)] p-4 backdrop-blur-md md:p-8">
          <div className="mx-auto flex h-full max-w-6xl flex-col overflow-hidden rounded-[2rem] border border-white/12 bg-[rgba(6,12,22,0.72)] shadow-[0_30px_120px_rgba(2,8,20,0.44)]">
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
                aria-label={locale === "en" ? "Close gallery" : "Đóng thư viện"}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid flex-1 gap-0 lg:grid-cols-[minmax(0,1fr)_340px]">
              <div className="relative min-h-[420px] bg-slate-950">
                <Image
                  src={expandedGallerySlide.image}
                  alt={pickText(locale, expandedGallerySlide.title)}
                  fill
                  sizes="(min-width: 1024px) 900px, 100vw"
                  className="object-contain"
                />
                <button
                  type="button"
                  onClick={() => shiftExpandedGallery(-1)}
                  className="absolute left-4 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/14 bg-[rgba(7,18,35,0.54)] text-white transition hover:bg-[rgba(7,18,35,0.72)]"
                  aria-label={locale === "en" ? "Previous image" : "Ảnh trước"}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => shiftExpandedGallery(1)}
                  className="absolute right-4 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/14 bg-[rgba(7,18,35,0.54)] text-white transition hover:bg-[rgba(7,18,35,0.72)]"
                  aria-label={locale === "en" ? "Next image" : "Ảnh tiếp theo"}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              <div className="border-t border-white/10 px-6 py-6 text-white lg:border-l lg:border-t-0">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200">
                  {locale === "en" ? "Photo description" : "Mô tả hình ảnh"}
                </p>
                <p className="theme-heading mt-5 text-3xl font-semibold leading-[1.08]">
                  {pickText(locale, expandedGallerySlide.title)}
                </p>
                <p className="mt-5 text-sm leading-8 text-white/72">
                  {pickText(locale, expandedGallerySlide.description)}
                </p>

                <div className="mt-8 space-y-3">
                  {gallerySlides.map((slide, index) => (
                    <button
                      key={`expanded-${slide.year}-${slide.image}`}
                      type="button"
                      onClick={() => setExpandedGalleryIndex(index)}
                      className={`flex w-full items-center justify-between rounded-[1.25rem] border px-4 py-3 text-left transition ${
                        index === expandedGalleryIndex
                          ? "border-cyan-300/34 bg-white/10"
                          : "border-white/10 bg-white/[0.04] hover:bg-white/[0.08]"
                      }`}
                    >
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
                          {slide.year}
                        </p>
                        <p className="mt-2 text-sm font-semibold text-white/88">
                          {pickText(locale, slide.label)}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-white/58" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
