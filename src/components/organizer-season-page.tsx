"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BarChart3,
  Camera,
  CalendarRange,
  GraduationCap,
  Trophy,
} from "lucide-react";

import { getOrganizerSeasonHref } from "@/components/organizer-page";
import { useSiteState } from "@/components/providers/site-state-provider";
import { SectionHeading, StatusPill, Surface } from "@/components/site-ui";
import { pickText } from "@/lib/site";

type SeasonLocalizedText = { en: string; vi: string };

interface SeasonArchiveStat {
  value: string;
  label: SeasonLocalizedText;
  note: SeasonLocalizedText;
}

interface SeasonArchiveTeam {
  rank: SeasonLocalizedText;
  title: SeasonLocalizedText;
  university: SeasonLocalizedText;
  project: SeasonLocalizedText;
  note: SeasonLocalizedText;
}

interface SeasonArchive {
  stats: SeasonArchiveStat[];
  overviewTitle: SeasonLocalizedText;
  overview: SeasonLocalizedText[];
  topTeams: SeasonArchiveTeam[];
}

const seasonArchiveByYear: Record<string, SeasonArchive> = {
  "2023": {
    stats: [
      {
        value: "300+",
        label: { en: "participants", vi: "thí sinh" },
        note: { en: "early national reach", vi: "quy mô tiếp cận ban đầu" },
      },
      {
        value: "20+",
        label: { en: "campuses", vi: "trường/đơn vị" },
        note: { en: "student communities started forming", vi: "cộng đồng thí sinh bắt đầu hình thành" },
      },
      {
        value: "05",
        label: { en: "finalist teams", vi: "đội chung kết" },
        note: { en: "used for the final showcase archive", vi: "khung lưu trữ cho top 5 chung kết" },
      },
    ],
    overviewTitle: {
      en: "The foundation season built the first serious student fintech arena.",
      vi: "Mùa nền tảng đặt viên gạch đầu tiên cho một sân chơi fintech sinh viên nghiêm túc.",
    },
    overview: [
      {
        en: "The season focused on proving that students could work across finance, product reasoning, and practical delivery rather than stopping at theory.",
        vi: "Mùa thi tập trung chứng minh sinh viên có thể làm việc giao thoa giữa tài chính, tư duy sản phẩm và năng lực triển khai thực tế thay vì chỉ dừng ở lý thuyết.",
      },
      {
        en: "The finalist group became the first archive of teams that helped shape Attacker's later format.",
        vi: "Nhóm đội vào chung kết trở thành lớp dữ liệu đầu tiên giúp định hình format Attacker cho các mùa sau.",
      },
    ],
    topTeams: createGenericTopTeams("2023"),
  },
  "2024": {
    stats: [
      {
        value: "800+",
        label: { en: "participants", vi: "thí sinh" },
        note: { en: "students joined from across Vietnam", vi: "sinh viên tham gia trên toàn quốc" },
      },
      {
        value: "50",
        label: { en: "universities", vi: "trường đại học" },
        note: { en: "national university representation", vi: "độ phủ trường đại học toàn quốc" },
      },
      {
        value: "05",
        label: { en: "finalist teams", vi: "đội chung kết" },
        note: { en: "selected for the final trading showcase", vi: "được chọn vào showcase chung kết" },
      },
      {
        value: "50M",
        label: { en: "VND/team", vi: "VNĐ/đội" },
        note: { en: "live trading capital for finalists", vi: "vốn giao dịch thực chiến cho mỗi đội chung kết" },
      },
    ],
    overviewTitle: {
      en: "Algorithmic Trading made the season more concrete, measurable, and market-facing.",
      vi: "Algorithmic Trading giúp mùa thi trở nên cụ thể, đo lường được và gần thị trường hơn.",
    },
    overview: [
      {
        en: "Attacker 2024 centered on algorithmic trading, moving students from online qualifiers into a practical trading journey and a final presentation format.",
        vi: "Attacker 2024 xoay quanh chủ đề giao dịch thuật toán, đưa thí sinh từ vòng loại trực tuyến vào hành trình giao dịch thực chiến và phần trình bày chung kết.",
      },
      {
        en: "The season gave finalist teams a clearer test of data thinking, portfolio discipline, market explanation, and the ability to defend decisions in front of judges.",
        vi: "Mùa thi tạo cho các đội chung kết một bài kiểm tra rõ hơn về tư duy dữ liệu, kỷ luật danh mục, khả năng giải thích thị trường và bảo vệ quyết định trước hội đồng.",
      },
    ],
    topTeams: [
      {
        rank: { en: "1st place", vi: "Hạng 1" },
        title: { en: "Champion team", vi: "Đội quán quân" },
        university: {
          en: "University of Economics and Law, VNU-HCM",
          vi: "Trường Đại học Kinh tế - Luật, ĐHQG-HCM",
        },
        project: {
          en: "Algorithmic trading strategy and final market defense.",
          vi: "Chiến lược giao dịch thuật toán và phần bảo vệ thị trường ở chung kết.",
        },
        note: {
          en: "The champion profile should be updated with the official team name when the organizer archive is available.",
          vi: "Có thể cập nhật thêm tên đội chính thức khi BTC bổ sung hồ sơ lưu trữ.",
        },
      },
      {
        rank: { en: "2nd place", vi: "Hạng 2" },
        title: { en: "Runner-up team", vi: "Đội á quân" },
        university: { en: "University of Economics Ho Chi Minh City", vi: "Đại học Kinh tế TP. Hồ Chí Minh" },
        project: {
          en: "Trading analytics, portfolio logic, and market signal interpretation.",
          vi: "Phân tích giao dịch, logic danh mục và diễn giải tín hiệu thị trường.",
        },
        note: {
          en: "Structured as a finalist profile for the official result archive.",
          vi: "Được trình bày như hồ sơ đội chung kết để cập nhật kết quả chính thức.",
        },
      },
      {
        rank: { en: "3rd place", vi: "Hạng 3" },
        title: { en: "Third-place team", vi: "Đội quý quân" },
        university: { en: "Nha Trang University", vi: "Trường Đại học Nha Trang" },
        project: {
          en: "Data-backed trading model and final-round presentation.",
          vi: "Mô hình giao dịch dựa trên dữ liệu và phần trình bày chung kết.",
        },
        note: {
          en: "Represents the season's stronger cross-campus finalist presence.",
          vi: "Thể hiện độ phủ đội thi chung kết đến từ nhiều trường hơn.",
        },
      },
      {
        rank: { en: "Finalist", vi: "Đồng hạng 4" },
        title: { en: "Top 5 finalist", vi: "Đội top 5" },
        university: { en: "Banking University of Ho Chi Minh City", vi: "Trường Đại học Ngân hàng TP. Hồ Chí Minh" },
        project: {
          en: "Market monitoring, signal review, and trading performance discussion.",
          vi: "Theo dõi thị trường, đánh giá tín hiệu và thảo luận hiệu quả giao dịch.",
        },
        note: {
          en: "Prepared for the official finalist-team archive.",
          vi: "Sẵn sàng để thay bằng tên đội và đề tài chính thức.",
        },
      },
      {
        rank: { en: "Finalist", vi: "Đồng hạng 4" },
        title: { en: "Top 5 finalist", vi: "Đội top 5" },
        university: { en: "University of Economics and Law / partner campus", vi: "Trường Đại học Kinh tế - Luật / trường đối tác" },
        project: {
          en: "Decision-support dashboard for algorithmic trading review.",
          vi: "Dashboard hỗ trợ ra quyết định và rà soát giao dịch thuật toán.",
        },
        note: {
          en: "Use this card for the remaining finalist once the organizer confirms the archive.",
          vi: "Dùng thẻ này cho đội còn lại khi BTC xác nhận hồ sơ lưu trữ.",
        },
      },
    ],
  },
  "2025": {
    stats: [
      {
        value: "2,000+",
        label: { en: "candidates", vi: "thí sinh" },
        note: { en: "from the public season recap", vi: "theo tổng kết công khai của mùa thi" },
      },
      {
        value: "250",
        label: { en: "projects", vi: "dự án" },
        note: { en: "student solutions submitted", vi: "giải pháp sinh viên được ghi nhận" },
      },
      {
        value: "05",
        label: { en: "finalist teams", vi: "đội chung kết" },
        note: { en: "used for the final result band", vi: "nhóm đội ở dải kết quả chung kết" },
      },
    ],
    overviewTitle: {
      en: "The season expanded from competition mechanics into stronger product and impact stories.",
      vi: "Mùa thi mở rộng từ kỹ thuật thi đấu sang câu chuyện sản phẩm và tác động rõ hơn.",
    },
    overview: [
      {
        en: "The archive for 2025 should emphasize product maturity, market relevance, and why each finalist project mattered to finance users.",
        vi: "Hồ sơ mùa 2025 nên nhấn mạnh độ chín sản phẩm, mức độ liên quan với thị trường và lý do mỗi dự án chung kết có ý nghĩa với người dùng tài chính.",
      },
      {
        en: "URA-xLaw from HCMUT is the first public champion reference currently captured in the archive; the remaining finalist cards are ready for official team updates.",
        vi: "URA-xLaw từ HCMUT là dữ liệu quán quân công khai đầu tiên đang được ghi nhận; các thẻ còn lại đã sẵn sàng để cập nhật tên đội chính thức.",
      },
    ],
    topTeams: [
      {
        rank: { en: "1st place", vi: "Hạng 1" },
        title: { en: "URA-xLaw", vi: "URA-xLaw" },
        university: {
          en: "Ho Chi Minh City University of Technology, VNU-HCM",
          vi: "Trường Đại học Bách khoa, ĐHQG-HCM",
        },
        project: {
          en: "AI-powered legal Q&A platform for banking and financial institutions.",
          vi: "Nền tảng hỏi đáp pháp lý ứng dụng AI cho ngân hàng và tổ chức tài chính.",
        },
        note: {
          en: "Publicly reported champion project for Attacker 2025.",
          vi: "Dự án quán quân Attacker 2025 đã được ghi nhận công khai.",
        },
      },
      ...createGenericTopTeams("2025").slice(1),
    ],
  },
  "2026": {
    stats: [
      {
        value: "03",
        label: { en: "rounds", vi: "vòng thi" },
        note: { en: "qualifier, report, and final defense", vi: "vòng loại, báo cáo và bảo vệ chung kết" },
      },
      {
        value: "50",
        label: { en: "teams to Round 2", vi: "đội vào Vòng 2" },
        note: { en: "selected by team-average score", vi: "chọn theo điểm trung bình đội" },
      },
      {
        value: "05",
        label: { en: "finalist teams", vi: "đội chung kết" },
        note: { en: "planned top finalist band", vi: "nhóm đội chung kết dự kiến" },
      },
    ],
    overviewTitle: {
      en: "The new season page is ready to become the live archive once 2026 results are confirmed.",
      vi: "Trang mùa 2026 đã sẵn sàng trở thành hồ sơ lưu trữ khi kết quả chính thức được xác nhận.",
    },
    overview: [
      {
        en: "This archive currently describes the planned competition path and leaves the finalist cards ready for official team, university, and project details.",
        vi: "Hồ sơ hiện mô tả lộ trình cuộc thi dự kiến và chuẩn bị sẵn các thẻ để cập nhật đội, trường và dự án chính thức.",
      },
    ],
    topTeams: createGenericTopTeams("2026"),
  },
};

const seasonPhotoImages = [
  "/theme-hero-1.jpg",
  "/theme-hero-2.jpg",
  "/theme-feature-1.jpg",
  "/theme-feature-2.jpg",
];

function createGenericTopTeams(year: string): SeasonArchiveTeam[] {
  return [
    {
      rank: { en: "1st place", vi: "Hạng 1" },
      title: { en: "Champion archive", vi: "Hồ sơ quán quân" },
      university: { en: "Organizer archive", vi: "Hồ sơ BTC" },
      project: { en: `Top project profile for Attacker ${year}.`, vi: `Hồ sơ dự án dẫn đầu Attacker ${year}.` },
      note: { en: "Ready for official team name, university, and project detail.", vi: "Sẵn sàng cập nhật tên đội, trường và dự án chính thức." },
    },
    {
      rank: { en: "2nd place", vi: "Hạng 2" },
      title: { en: "Runner-up archive", vi: "Hồ sơ á quân" },
      university: { en: "Organizer archive", vi: "Hồ sơ BTC" },
      project: { en: `Runner-up project profile for Attacker ${year}.`, vi: `Hồ sơ dự án á quân Attacker ${year}.` },
      note: { en: "Use this card for the official second-place team.", vi: "Dùng thẻ này cho đội hạng 2 chính thức." },
    },
    {
      rank: { en: "3rd place", vi: "Hạng 3" },
      title: { en: "Third-place archive", vi: "Hồ sơ quý quân" },
      university: { en: "Organizer archive", vi: "Hồ sơ BTC" },
      project: { en: `Third-place project profile for Attacker ${year}.`, vi: `Hồ sơ dự án quý quân Attacker ${year}.` },
      note: { en: "Use this card for the official third-place team.", vi: "Dùng thẻ này cho đội hạng 3 chính thức." },
    },
    {
      rank: { en: "Finalist", vi: "Đồng hạng 4" },
      title: { en: "Top 5 finalist", vi: "Đội top 5" },
      university: { en: "Organizer archive", vi: "Hồ sơ BTC" },
      project: { en: `Finalist project profile for Attacker ${year}.`, vi: `Hồ sơ dự án chung kết Attacker ${year}.` },
      note: { en: "Prepared for the official fourth-place finalist record.", vi: "Sẵn sàng cho hồ sơ đội chung kết đồng hạng 4." },
    },
    {
      rank: { en: "Finalist", vi: "Đồng hạng 4" },
      title: { en: "Top 5 finalist", vi: "Đội top 5" },
      university: { en: "Organizer archive", vi: "Hồ sơ BTC" },
      project: { en: `Finalist project profile for Attacker ${year}.`, vi: `Hồ sơ dự án chung kết Attacker ${year}.` },
      note: { en: "Prepared for the official fourth-place finalist record.", vi: "Sẵn sàng cho hồ sơ đội chung kết đồng hạng 4." },
    },
  ];
}

function getSeasonArchive(year: string): SeasonArchive {
  return seasonArchiveByYear[year] ?? seasonArchiveByYear["2026"];
}

function getSeasonPhotoSlides(year: string, heroImage: string) {
  return Array.from({ length: 10 }, (_, index) => {
    const image = index === 0 ? heroImage : seasonPhotoImages[(index + year.length) % seasonPhotoImages.length];
    const frame = String(index + 1).padStart(2, "0");

    return {
      image,
      label: { en: `Frame ${frame}`, vi: `Khung ${frame}` },
      title: {
        en: `Attacker ${year} archive moment`,
        vi: `Khoảnh khắc lưu trữ Attacker ${year}`,
      },
      description: {
        en: "Replace this image with the official event photo when the season archive is ready.",
        vi: "Có thể thay ảnh này bằng ảnh sự kiện chính thức khi hồ sơ mùa thi hoàn thiện.",
      },
    };
  });
}

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

  const seasonArchive = getSeasonArchive(story.year);
  const photoSlides = getSeasonPhotoSlides(story.year, story.image);

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
              {seasonArchive.stats.map((item) => (
                <div
                  key={`${item.value}-${item.label.en}`}
                  className="rounded-[1.5rem] border theme-border theme-panel-subtle px-4 py-4"
                >
                  <BarChart3 className="mb-3 h-4 w-4 text-sky-500 dark:text-cyan-200" />
                  <p className="theme-heading text-2xl font-semibold theme-text-strong">{item.value}</p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] theme-eyebrow">
                    {pickText(locale, item.label)}
                  </p>
                  <p className="mt-2 text-sm leading-6 theme-text-muted">{pickText(locale, item.note)}</p>
                </div>
              ))}
            </div>

            <div>
              <div className="flex items-center gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-200">
                  <Trophy className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] theme-eyebrow">
                    {locale === "en" ? "Top 5 teams" : "Top 5 đội thi"}
                  </p>
                  <h2 className="theme-heading mt-1 text-2xl font-semibold theme-text-strong">
                    {locale === "en" ? "Finalist profiles and project focus" : "Hồ sơ đội chung kết và trọng tâm dự án"}
                  </h2>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {seasonArchive.topTeams.map((team, index) => (
                  <div
                    key={`${team.rank.en}-${team.title.en}-${index}`}
                    className="rounded-[1.6rem] border theme-border theme-panel-subtle px-4 py-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] theme-eyebrow">
                          {pickText(locale, team.rank)}
                        </p>
                        <h3 className="theme-heading mt-2 text-lg font-semibold theme-text-strong">
                          {pickText(locale, team.title)}
                        </h3>
                      </div>
                      <Award className="h-5 w-5 shrink-0 text-amber-500 dark:text-amber-200" />
                    </div>
                    <div className="mt-4 space-y-3 text-sm leading-7">
                      <p className="flex gap-2 theme-text-body">
                        <GraduationCap className="mt-1 h-4 w-4 shrink-0 text-sky-500 dark:text-cyan-200" />
                        <span>{pickText(locale, team.university)}</span>
                      </p>
                      <p className="theme-text-strong">{pickText(locale, team.project)}</p>
                      <p className="theme-text-muted">{pickText(locale, team.note)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-600 dark:text-cyan-200">
                  <Camera className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] theme-eyebrow">
                    {locale === "en" ? "Photo slider" : "Slider hình ảnh"}
                  </p>
                  <h2 className="theme-heading mt-1 text-2xl font-semibold theme-text-strong">
                    {locale === "en" ? "Season archive frames" : "Khoảnh khắc lưu trữ mùa thi"}
                  </h2>
                </div>
              </div>

              <div className="mt-5 flex snap-x gap-4 overflow-x-auto pb-3">
                {photoSlides.map((slide, index) => (
                  <div
                    key={`${slide.title.en}-${index}`}
                    className="min-w-[260px] snap-start overflow-hidden rounded-[1.5rem] border theme-border theme-panel-subtle md:min-w-[330px]"
                  >
                    <div className="relative aspect-[4/3]">
                      <Image
                        src={slide.image}
                        alt={pickText(locale, slide.title)}
                        fill
                        sizes="330px"
                        className="object-cover"
                      />
                    </div>
                    <div className="px-4 py-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] theme-eyebrow">
                        {pickText(locale, slide.label)}
                      </p>
                      <h3 className="theme-heading mt-2 text-base font-semibold theme-text-strong">
                        {pickText(locale, slide.title)}
                      </h3>
                      <p className="mt-2 text-sm leading-6 theme-text-muted">
                        {pickText(locale, slide.description)}
                      </p>
                    </div>
                  </div>
                ))}
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
