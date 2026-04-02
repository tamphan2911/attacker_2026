"use client";

import Image from "next/image";

import { judgeProfiles } from "@/data/site-content";
import { pickText } from "@/lib/site";
import { useSiteState } from "@/components/providers/site-state-provider";
import { SectionHeading, Surface } from "@/components/site-ui";
import type { CompetitionRoundKey, JudgeProfile, LocalizedText } from "@/types/site";

const judgeSections: Array<{
  round: CompetitionRoundKey;
  eyebrow: LocalizedText;
  title: LocalizedText;
  description: LocalizedText;
}> = [
  {
    round: "round-3",
    eyebrow: { en: "Final round judges", vi: "Giám khảo vòng chung kết" },
    title: {
      en: "The panel for live presentation, defense, and final ranking.",
      vi: "Hội đồng cho phần thuyết trình trực tiếp, hỏi đáp và xếp hạng cuối cùng.",
    },
    description: {
      en: "These judges focus on stage presence, strategic clarity, execution quality, and final competition performance.",
      vi: "Nhóm giám khảo này tập trung vào bản lĩnh trình bày, độ rõ chiến lược, chất lượng thực thi và hiệu suất thi đấu ở chặng cuối.",
    },
  },
  {
    round: "round-2",
    eyebrow: { en: "Round 2 judges", vi: "Giám khảo vòng 2" },
    title: {
      en: "The review panel for project reports and shortlist decisions.",
      vi: "Hội đồng chấm báo cáo dự án và quyết định danh sách vào chung kết.",
    },
    description: {
      en: "Round 2 judges concentrate on structure, feasibility, compliance, and the quality of project documentation.",
      vi: "Giám khảo vòng 2 tập trung vào cấu trúc, tính khả thi, tuân thủ và chất lượng hồ sơ dự án.",
    },
  },
  {
    round: "round-1",
    eyebrow: { en: "Round 1 judges", vi: "Giám khảo vòng 1" },
    title: {
      en: "The specialist layer behind the individual qualifier and scoring logic.",
      vi: "Lớp chuyên môn phía sau vòng loại cá nhân và logic chấm điểm ban đầu.",
    },
    description: {
      en: "This group shapes question-bank quality, quantitative thinking, and the academic rigor of the first checkpoint.",
      vi: "Nhóm này định hình chất lượng ngân hàng câu hỏi, tư duy định lượng và độ chặt chẽ học thuật của chốt kiểm tra đầu tiên.",
    },
  },
];

function JudgeCompactCard({ judge }: { judge: JudgeProfile }) {
  const { locale } = useSiteState();

  return (
    <Surface className="overflow-hidden px-0 py-0">
      <div className="relative h-44 overflow-hidden md:h-48">
        <Image
          src={judge.imageSrc}
          alt={judge.name}
          fill
          sizes="(min-width: 1280px) 24vw, (min-width: 768px) 33vw, 100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,18,35,0.02)_0%,rgba(7,18,35,0.14)_34%,rgba(7,18,35,0.82)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 p-4 text-white">
          <p className="theme-heading text-xl font-semibold leading-[1.08]">{judge.name}</p>
          <p className="mt-2 text-xs leading-6 text-white/74">
            {pickText(locale, judge.role)} · {judge.organization}
          </p>
        </div>
      </div>

      <div className="px-4 py-4">
        <p className="text-sm leading-7 theme-text-muted">{pickText(locale, judge.bio)}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {judge.expertise.map((item) => (
            <span
              key={item.en}
              className="theme-panel-strong rounded-full border theme-border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] theme-text-soft"
            >
              {pickText(locale, item)}
            </span>
          ))}
        </div>
      </div>
    </Surface>
  );
}

export function JudgesPage() {
  const { locale, pageContent } = useSiteState();

  return (
    <div className="space-y-16">
      <section className="space-y-6">
        <SectionHeading
          eyebrow={pickText(locale, pageContent.judges.header.eyebrow)}
          title={pickText(locale, pageContent.judges.header.title)}
          description={pickText(locale, pageContent.judges.header.description)}
        />
      </section>

      {judgeSections.map((section) => {
        const sectionJudges = judgeProfiles.filter((judge) => judge.rounds.includes(section.round));

        if (sectionJudges.length === 0) {
          return null;
        }

        return (
          <section key={section.round} className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-end">
              <SectionHeading
                eyebrow={pickText(locale, section.eyebrow)}
                title={pickText(locale, section.title)}
                description={pickText(locale, section.description)}
              />

              <Surface className="px-5 py-5">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200/80">
                  {locale === "en" ? "Panel size" : "Quy mô hội đồng"}
                </p>
                <p className="mt-4 text-3xl font-semibold theme-text-strong">{sectionJudges.length}</p>
                <p className="mt-3 text-sm leading-7 theme-text-muted">
                  {section.round === "round-3"
                    ? locale === "en"
                      ? "Final-round judges visible for the live pitch and Q&A stage."
                      : "Số giám khảo xuất hiện cho chặng pitch và hỏi đáp của vòng chung kết."
                    : section.round === "round-2"
                      ? locale === "en"
                        ? "Report-evaluation judges focused on shortlist and depth."
                        : "Số giám khảo chấm báo cáo, tập trung vào shortlist và chiều sâu dự án."
                      : locale === "en"
                        ? "Question-bank and scoring specialists for the first round."
                        : "Số chuyên gia phụ trách ngân hàng câu hỏi và logic chấm điểm của vòng đầu."}
                </p>
              </Surface>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {sectionJudges.map((judge) => (
                <JudgeCompactCard key={`${section.round}-${judge.name}`} judge={judge} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
