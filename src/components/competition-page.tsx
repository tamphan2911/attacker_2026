"use client";

import { ArrowRight, Award, BadgeCheck, Crown, Medal, Sparkles, Trophy, Users2 } from "lucide-react";
import Link from "next/link";

import {
  audienceHighlights,
  rewardItems,
  roundItems,
} from "@/data/site-content";
import { pickText } from "@/lib/site";
import { useSiteState } from "@/components/providers/site-state-provider";
import { InfoKicker, PageIntro, SectionHeading, StatusPill, Surface } from "@/components/site-ui";

export function CompetitionPage() {
  const { locale, pageContent } = useSiteState();

  return (
    <div className="space-y-20">
      <PageIntro
        eyebrow={pickText(locale, pageContent.competition.intro.eyebrow)}
        title={pickText(locale, pageContent.competition.intro.title)}
        description={pickText(locale, pageContent.competition.intro.description)}
        aside={
          <Surface className="px-5 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200/80">
              {locale === "en" ? "Competition pillars" : "Tru cot cuoc thi"}
            </p>
            <div className="mt-5 space-y-3">
              {[
                {
                  icon: <Sparkles className="h-4 w-4 text-cyan-300" />,
                  label: locale === "en" ? "36 objective + 2 essay questions" : "36 câu khách quan + 2 câu tự luận",
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

      <section className="space-y-8">
        <SectionHeading
          eyebrow={locale === "en" ? "Advancement logic" : "Logic di tiep"}
          title={
            locale === "en"
              ? "The progression thresholds are now explicit."
              : "Cac nguong di tiep gio da duoc neu ro."
          }
          description={
            locale === "en"
              ? "This makes the structure easier to understand for both students and organizers before backend scoring is built."
              : "Dieu nay giup sinh vien va ban to chuc de hieu cau truc hon truoc khi he thong cham diem backend duoc xay."
          }
        />
        <div className="grid gap-4 xl:grid-cols-3">
          {[
            {
              title: locale === "en" ? "Round 1 access" : "Quyền vào Vòng 1",
              body:
                locale === "en"
                  ? "A user must already belong to a team of at least 3 members before taking the individual Round 1 paper."
                  : "Người dùng phải thuộc một đội có ít nhất 3 thành viên trước khi vào bài thi cá nhân của Vòng 1.",
            },
            {
              title: locale === "en" ? "Top 50 teams" : "Top 50 doi",
              body:
                locale === "en"
                  ? "Round 1 is taken individually with 36 objective questions and 2 essay prompts, but the team average score decides which 50 teams move to Round 2."
                  : "Vòng 1 được làm theo từng cá nhân với 36 câu khách quan và 2 câu tự luận, nhưng điểm trung bình đội sẽ quyết định 50 đội nào vào Vòng 2.",
            },
            {
              title: locale === "en" ? "Top 5 + Top 10" : "Top 5 + Top 10",
              body:
                locale === "en"
                  ? "Round 2 sends the top 5 teams to the final and recognizes the next 10 teams as Emerging Teams."
                  : "Vòng 2 đưa top 5 đội vào chung kết và ghi nhận 10 đội tiếp theo là Đội tiềm năng.",
            },
          ].map((item, index) => (
            <Surface key={item.title} className="px-6 py-6">
              <StatusPill tone={index === 1 ? "success" : index === 2 ? "warning" : "default"}>
                {locale === "en" ? `Step ${index + 1}` : `Buoc ${index + 1}`}
              </StatusPill>
              <p className="mt-5 text-xl font-semibold theme-text-strong">{item.title}</p>
              <p className="mt-4 text-sm leading-7 theme-text-muted">{item.body}</p>
            </Surface>
          ))}
        </div>
      </section>

      <section className="space-y-8">
        <SectionHeading
          eyebrow={pickText(locale, pageContent.competition.rewards.eyebrow)}
          title={pickText(locale, pageContent.competition.rewards.title)}
          description={pickText(locale, pageContent.competition.rewards.description)}
        />
        <div className="grid gap-4 xl:grid-cols-4">
          {rewardItems.map((item, index) => {
            const config =
              index === 0
                ? {
                    icon: <Crown className="h-6 w-6 text-amber-300" />,
                    accent: "bg-[linear-gradient(135deg,#0a1d34,#1772d0)] text-white",
                    labelTone: "text-white/70",
                    noteTone: "text-white/78",
                    amountTone: "text-white",
                    className: "xl:col-span-2",
                  }
                : index === 1
                  ? {
                      icon: <Medal className="h-6 w-6 theme-accent" />,
                      accent: "theme-panel-strong",
                      labelTone: "theme-eyebrow",
                      noteTone: "theme-text-muted",
                      amountTone: "theme-text-strong",
                      className: "",
                    }
                  : index === 2
                    ? {
                        icon: <Award className="h-6 w-6 text-orange-400" />,
                        accent: "theme-panel-strong",
                        labelTone: "theme-eyebrow",
                        noteTone: "theme-text-muted",
                        amountTone: "theme-text-strong",
                        className: "",
                      }
                    : {
                        icon: <Sparkles className="h-6 w-6 text-emerald-400" />,
                        accent: "theme-panel-strong",
                        labelTone: "theme-eyebrow",
                        noteTone: "theme-text-muted",
                        amountTone: "theme-text-strong",
                        className: "",
                      };

            return (
              <Surface key={item.title.en} className={`${config.className} overflow-hidden px-6 py-6`}>
                <div className={`rounded-[1.75rem] border theme-border px-5 py-5 ${config.accent}`}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="rounded-2xl border border-white/12 bg-white/10 p-3 backdrop-blur-md">
                      {config.icon}
                    </div>
                    <span className={`text-xs font-semibold uppercase tracking-[0.26em] ${config.labelTone}`}>
                      {pickText(locale, item.title)}
                    </span>
                  </div>
                  <p className={`mt-6 text-3xl font-semibold ${config.amountTone}`}>
                    {pickText(locale, item.amount)}
                  </p>
                  <p className={`mt-4 text-sm leading-7 ${config.noteTone}`}>
                    {pickText(locale, item.note)}
                  </p>
                </div>
              </Surface>
            );
          })}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Surface className="px-6 py-6 md:px-8 md:py-8">
          <SectionHeading
            eyebrow={pickText(locale, pageContent.competition.mentors.eyebrow)}
            title={pickText(locale, pageContent.competition.mentors.title)}
            description={pickText(locale, pageContent.competition.mentors.description)}
          />
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              {
                title: locale === "en" ? "Quant & Trading" : "Quant va Giao dich",
                body:
                  locale === "en"
                    ? "Market structure, strategy testing, and risk framing."
                    : "Cau truc thi truong, kiem thu chien luoc va khung rui ro.",
              },
              {
                title: locale === "en" ? "Product & UX" : "San pham va UX",
                body:
                  locale === "en"
                    ? "User pain points, product logic, and usability storytelling."
                    : "Nỗi đau người dùng, logic sản phẩm và cách kể chuyện về trải nghiệm.",
              },
              {
                title: locale === "en" ? "Venture & Growth" : "Dau tu va Tang truong",
                body:
                  locale === "en"
                    ? "Go-to-market, scaling assumptions, and investment readiness."
                    : "Chien luoc go-to-market, gia dinh tang truong va su san sang tiep can dau tu.",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-3xl border theme-border theme-panel px-4 py-4">
                <p className="text-lg font-semibold theme-text-strong">{item.title}</p>
                <p className="mt-3 text-sm leading-7 theme-text-muted">{item.body}</p>
              </div>
            ))}
          </div>
        </Surface>

        <Surface className="h-fit px-6 py-6">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200/80">
            {locale === "en" ? "Next route" : "Route tiep theo"}
          </p>
          <p className="mt-4 text-2xl font-semibold theme-text-strong">
            {locale === "en" ? "Review the rules and timeline." : "Xem thể lệ và lịch trình."}
          </p>
          <p className="mt-4 text-sm leading-7 theme-text-muted">
            {locale === "en"
              ? "The companion page clarifies team eligibility, deadlines, and FAQ logic before the registration flow."
              : "Trang đi kèm làm rõ điều kiện đội thi, hạn chót và FAQ trước khi người dùng vào quy trình đăng ký."}
          </p>
          <Link
            href="/rules"
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-cyan-200"
          >
            {locale === "en" ? "Open rules page" : "Mở trang thể lệ"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Surface>
      </section>
    </div>
  );
}
