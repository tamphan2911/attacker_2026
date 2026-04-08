"use client";

import { Award, BadgeCheck, Crown, Medal, Sparkles, Star, Trophy, Users2 } from "lucide-react";

import {
  audienceHighlights,
  roundItems,
} from "@/data/site-content";
import { pickText } from "@/lib/site";
import { useSiteState } from "@/components/providers/site-state-provider";
import { InfoKicker, PageIntro, SectionHeading, StatusPill, Surface } from "@/components/site-ui";

const competitionRewardItems = [
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

const competitionEmergingReward = {
  eyebrow: { en: "Side recognition", vi: "Danh hiệu bổ sung" },
  title: { en: "Emerging Teams", vi: "Đội tiềm năng" },
  amount: { en: "Top 10 teams", vi: "Top 10 đội" },
  note: {
    en: "Teams ranked immediately after the top 5 in Round 2 receive recognition, certificates, and sponsor-side opportunities.",
    vi: "Các đội xếp ngay sau top 5 ở Vòng 2 nhận danh hiệu, giấy chứng nhận và các cơ hội đồng hành từ đối tác.",
  },
} as const;

export function CompetitionPage() {
  const { locale, pageContent } = useSiteState();

  return (
    <div className="space-y-20">
      <PageIntro
        eyebrow={pickText(locale, pageContent.competition.intro.eyebrow)}
        title={pickText(locale, pageContent.competition.intro.title)}
        aside={
          <Surface className="px-5 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200/80">
              {locale === "en" ? "Competition pillars" : "Tru cot cuoc thi"}
            </p>
            <div className="mt-5 space-y-3">
              {[
                {
                  icon: <Sparkles className="h-4 w-4 text-cyan-300" />,
                  label: locale === "en" ? "36 objective + 2 essay questions" : "36 câu trắc nghiệm + 2 câu tự luận",
                },
                {
                  icon: <Users2 className="h-4 w-4 text-emerald-300" />,
                  label: locale === "en" ? "Team-average progression" : "Di tiep theo diem trung binh doi",
                },
                {
                  icon: <Trophy className="h-4 w-4 text-orange-300" />,
                  label: locale === "en" ? "Judge-scored final stages" : "Các vòng sau do giám khảo chấm điểm",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-3 rounded-2xl border theme-border theme-panel px-4 py-3 text-sm theme-text-body"
                >
                  {item.icon}
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </Surface>
        }
      />

      <section className="grid gap-4 lg:grid-cols-3">
        {audienceHighlights.map((item) => (
          <Surface key={item.title.en} className="px-6 py-6">
            <InfoKicker>{pickText(locale, item.title)}</InfoKicker>
            <p className="mt-4 text-sm leading-7 theme-text-muted">{pickText(locale, item.description)}</p>
          </Surface>
        ))}
      </section>

      <section className="space-y-8">
        <SectionHeading
          eyebrow={pickText(locale, pageContent.competition.rounds.eyebrow)}
          title={pickText(locale, pageContent.competition.rounds.title)}
          description={pickText(locale, pageContent.competition.rounds.description)}
        />

        <div className="space-y-6">
          {roundItems.map((item, index) => (
            <Surface key={item.id} className="overflow-hidden">
              <div className="grid gap-0 lg:grid-cols-[280px_minmax(0,1fr)]">
                <div
                  className={`px-6 py-8 ${
                    index === 0
                      ? "bg-[linear-gradient(180deg,rgba(29,78,216,0.28),rgba(7,18,35,0.2))]"
                      : index === 1
                        ? "bg-[linear-gradient(180deg,rgba(6,182,212,0.24),rgba(7,18,35,0.2))]"
                        : "bg-[linear-gradient(180deg,rgba(249,115,22,0.2),rgba(7,18,35,0.2))]"
                  }`}
                >
                  <StatusPill>{pickText(locale, item.label)}</StatusPill>
                  <p className="mt-6 text-3xl font-semibold tracking-tight theme-text-strong">
                    {pickText(locale, item.title)}
                  </p>
                  <p className="mt-3 text-sm uppercase tracking-[0.24em] theme-text-soft">
                    {pickText(locale, item.duration)}
                  </p>
                </div>
                <div className="px-6 py-8">
                  <p className="max-w-3xl text-base leading-8 theme-text-muted">
                    {pickText(locale, item.description)}
                  </p>
                  <div className="mt-6 grid gap-3 md:grid-cols-3">
                    {item.deliverables.map((deliverable) => (
                      <div
                        key={deliverable.en}
                        className="rounded-3xl border theme-border theme-panel px-4 py-4 text-sm leading-7 theme-text-body"
                      >
                        <BadgeCheck className="mb-3 h-4 w-4 text-cyan-300" />
                        {pickText(locale, deliverable)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Surface>
          ))}
        </div>
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
                ? "A reward structure that makes every result band clear."
                : "Cấu trúc giải thưởng giúp từng nhóm kết quả được nhìn rõ ngay lập tức."}
            </h2>
            <p className="theme-text-muted mt-5 max-w-3xl text-base leading-8">
              {locale === "en"
                ? "The main awards are separated by final ranking from 1st to 4th, while Emerging Teams stay in their own smaller recognition block after Round 2."
                : "Các giải chính được tách rõ theo thứ hạng chung kết từ hạng 1 đến hạng 4, trong khi Đội tiềm năng nằm ở một block riêng nhỏ hơn sau Vòng 2."}
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {competitionRewardItems.map((item) => {
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
                    {pickText(locale, competitionEmergingReward.eyebrow)}
                  </p>
                  <p className="theme-text-strong mt-1 text-lg font-semibold">
                    {pickText(locale, competitionEmergingReward.title)}
                  </p>
                </div>
              </div>
              <p className="theme-text-strong mt-5 text-2xl font-semibold">
                {pickText(locale, competitionEmergingReward.amount)}
              </p>
              <p className="theme-text-muted mt-3 text-sm leading-7">
                {pickText(locale, competitionEmergingReward.note)}
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
              <p className="theme-text-muted mt-4 text-sm leading-7">
                {locale === "en"
                  ? "In addition to cash awards, teams may also receive sponsor-supported gifts, scholarships, and other non-cash opportunities."
                  : "Bên cạnh tiền thưởng, các đội còn có thể nhận thêm quà tặng, học bổng và những quyền lợi phi tiền mặt từ nhà tài trợ."}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
