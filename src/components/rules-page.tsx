"use client";

import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Flag,
  MapPin,
  Medal,
  Route,
  ShieldAlert,
  UsersRound,
} from "lucide-react";

import {
  TEAM_MAX_MEMBERS,
  TEAM_MIN_MEMBERS,
  ruleItems,
  timelineItems,
} from "@/data/site-content";
import { formatDateLabel, pickText } from "@/lib/site";
import { useSiteState } from "@/components/providers/site-state-provider";
import { SectionHeading, Surface } from "@/components/site-ui";

export function RulesPage() {
  const { locale, pageContent } = useSiteState();

  const ruleIcons = [UsersRound, ShieldAlert, BadgeCheck, Medal];
  const ruleSummaries = [
    {
      en: "Each student can belong to only one team at a time.",
      vi: "Mỗi sinh viên chỉ có thể thuộc một đội tại một thời điểm.",
    },
    {
      en: "A team leader must transfer authority before leaving the team.",
      vi: "Đội trưởng phải chuyển quyền trước khi rời đội.",
    },
    {
      en: `Only teams with ${TEAM_MIN_MEMBERS} to ${TEAM_MAX_MEMBERS} members qualify for Round 1.`,
      vi: `Chỉ các đội có từ ${TEAM_MIN_MEMBERS} đến ${TEAM_MAX_MEMBERS} thành viên mới đủ điều kiện vào Vòng 1.`,
    },
    {
      en: "Progression depends on team results, not on isolated individual performance alone.",
      vi: "Việc đi tiếp phụ thuộc vào kết quả của đội, không chỉ vào từng cá nhân riêng lẻ.",
    },
  ];

  return (
    <div className="space-y-20">
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <SectionHeading
          eyebrow={pickText(locale, pageContent.rules.header.eyebrow)}
          title={pickText(locale, pageContent.rules.header.title)}
          description={pickText(locale, pageContent.rules.header.description)}
        />
        <Surface className="px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200/80">
            {locale === "en" ? "Eligibility snapshot" : "Tom tat dieu kien"}
          </p>
          <div className="mt-6 space-y-3">
            {[
              {
                icon: <UsersRound className="h-4 w-4 text-cyan-300" />,
                label:
                  locale === "en"
                    ? `${TEAM_MIN_MEMBERS}-${TEAM_MAX_MEMBERS} members per team for Round 1`
                    : `${TEAM_MIN_MEMBERS}-${TEAM_MAX_MEMBERS} thanh vien moi doi de vao Vong 1`,
              },
              {
                icon: <ShieldAlert className="h-4 w-4 text-amber-300" />,
                label:
                  locale === "en"
                    ? "Leader must transfer before leaving"
                    : "Đội trưởng phải chuyển quyền trước khi rời đội",
              },
              {
                icon: <CalendarDays className="h-4 w-4 text-emerald-300" />,
                label:
                  locale === "en"
                    ? "Round 1 ranks teams by average member score"
                    : "Vòng 1 xếp hạng đội theo điểm trung bình thành viên",
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
      </section>

      <section className="overflow-hidden rounded-[2.2rem] border border-slate-900/40 bg-[linear-gradient(140deg,#071223_0%,#0b2744_42%,#12528d_100%)] px-6 py-8 text-white md:px-8 md:py-10">
        <div className="space-y-8">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.34em] text-white/64">
                {pickText(locale, pageContent.rules.coreRules.eyebrow)}
              </p>
              <h2 className="theme-heading mt-5 max-w-2xl text-3xl font-semibold leading-[1.08] md:text-[3rem]">
                {pickText(locale, pageContent.rules.coreRules.title)}
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-8 text-white/74">
                {pickText(locale, pageContent.rules.coreRules.description)}
              </p>
            </div>

            <div className="rounded-[1.9rem] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.06))] px-5 py-5 shadow-[0_24px_55px_rgba(2,6,23,0.22)] backdrop-blur-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/58">
                {locale === "en" ? "What matters most" : "Điểm mấu chốt"}
              </p>
              <div className="mt-5 space-y-3">
                {[
                  locale === "en" ? "One student belongs to one team only." : "Mỗi sinh viên chỉ thuộc một đội duy nhất.",
                  locale === "en" ? "Round 1 eligibility starts from 3 members." : "Điều kiện vào Vòng 1 bắt đầu từ 3 thành viên.",
                  locale === "en" ? "Progression is ranked at team level." : "Việc đi tiếp được xếp theo kết quả cấp đội.",
                ].map((text) => (
                  <div
                    key={text}
                    className="rounded-2xl border border-white/10 bg-white/[0.08] px-4 py-3 text-sm leading-7 text-white/82"
                  >
                    {text}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {ruleItems.map((item, index) => {
              const Icon = ruleIcons[index] ?? Flag;

              return (
                <div
                  key={item.title.en}
                  className="relative flex min-h-[230px] flex-col overflow-hidden rounded-[1.8rem] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.05))] px-5 py-5 shadow-[0_22px_50px_rgba(2,6,23,0.18)] backdrop-blur-md"
                >
                  <div className="absolute inset-x-5 top-0 h-px bg-[linear-gradient(90deg,rgba(255,255,255,0),rgba(125,211,252,0.9),rgba(255,255,255,0))]" />
                  <div className="flex items-center justify-between gap-4">
                    <div className="inline-flex rounded-2xl border border-white/12 bg-white/12 p-3 shadow-[0_12px_30px_rgba(7,18,35,0.2)]">
                      <Icon className="h-5 w-5 text-cyan-200" />
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/[0.08] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-white/58">
                      {locale === "en" ? "Priority" : "Ưu tiên"}
                    </span>
                  </div>
                  <div className="mt-5">
                    <p className="text-lg font-semibold leading-7 text-white">{pickText(locale, item.title)}</p>
                    <p className="mt-4 text-sm leading-7 text-white/74">
                      {pickText(locale, ruleSummaries[index] ?? item.description)}
                    </p>
                  </div>
                  <div className="mt-auto pt-5">
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-cyan-200/78">
                      {locale === "en" ? "Rule focus" : "Trọng tâm"}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-white/62">
                      {pickText(locale, item.description)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-[2rem] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.05))] px-5 py-6 shadow-[0_24px_55px_rgba(2,6,23,0.16)] backdrop-blur-md md:px-6 md:py-7">
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex rounded-2xl border border-white/12 bg-white/12 p-3 shadow-[0_12px_30px_rgba(7,18,35,0.18)]">
                <Route className="h-5 w-5 text-cyan-200" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/60">
                  {locale === "en" ? "Detailed rules" : "Chi tiết thể lệ"}
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {locale === "en"
                    ? "Full rule explanations for participants."
                    : "Phần giải thích đầy đủ cho các quy tắc tham gia."}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4">
              {ruleItems.map((item, index) => {
                const Icon = ruleIcons[index] ?? Flag;

                return (
                  <div
                    key={`${item.title.en}-detail`}
                    className="rounded-[1.6rem] border border-white/10 bg-white/[0.06] px-4 py-4 shadow-[0_18px_36px_rgba(7,18,35,0.12)]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="inline-flex rounded-2xl border border-white/12 bg-white/12 p-2.5">
                        <Icon className="h-4.5 w-4.5 text-cyan-200" />
                      </div>
                      <p className="text-lg font-semibold text-white">{pickText(locale, item.title)}</p>
                    </div>
                    <p className="mt-4 text-sm leading-8 text-white/74">{pickText(locale, item.description)}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-8">
        <div className="rounded-[2.2rem] border theme-border bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(241,248,255,0.98))] px-6 py-8 md:px-8 md:py-10">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.34em] theme-eyebrow">
              {pickText(locale, pageContent.rules.timeline.eyebrow)}
            </p>
            <h2 className="theme-heading mt-5 text-3xl font-semibold leading-[1.08] theme-text-strong md:text-[3rem]">
              {pickText(locale, pageContent.rules.timeline.title)}
            </h2>
            <p className="mt-5 text-base leading-8 theme-text-muted">
              {pickText(locale, pageContent.rules.timeline.description)}
            </p>
          </div>

          <div className="relative mt-10">
            <div className="absolute left-[27px] top-2 bottom-2 hidden w-px bg-[linear-gradient(180deg,rgba(23,114,208,0.18),rgba(23,114,208,0.7),rgba(23,114,208,0.12))] md:block" />
            <div className="space-y-5">
              {timelineItems.map((item, index) => {
                const isHighlight = index === 2 || index === 4 || index === 6;

                return (
                  <div
                    key={item.startDate + item.endDate + item.title.en}
                    className="relative grid gap-4 md:grid-cols-[80px_minmax(0,1fr)] md:gap-6"
                  >
                    <div className="relative hidden md:block">
                      <div
                        className={`absolute left-0 top-5 flex h-14 w-14 items-center justify-center rounded-full border text-sm font-semibold ${
                          isHighlight
                            ? "border-sky-400/24 bg-[linear-gradient(135deg,#0a1d34,#1772d0)] text-white shadow-[0_18px_40px_rgba(23,114,208,0.22)]"
                            : "border-slate-200 bg-white text-[var(--brand)] shadow-[0_12px_30px_rgba(148,163,184,0.14)]"
                        }`}
                      >
                        {index + 1}
                      </div>
                    </div>

                    <div
                      className={`rounded-[1.85rem] border px-5 py-5 md:px-6 md:py-6 ${
                        isHighlight
                          ? "border-sky-300/20 bg-[linear-gradient(135deg,rgba(10,29,52,0.98),rgba(23,114,208,0.92))] text-white shadow-[0_22px_55px_rgba(15,23,42,0.18)]"
                          : "theme-border theme-panel shadow-[0_18px_45px_rgba(148,163,184,0.12)]"
                      }`}
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="inline-flex items-center gap-2 rounded-full border border-current/10 bg-white/8 px-3 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.22em]">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {locale === "en" ? `Step ${index + 1}` : `Buoc ${index + 1}`}
                          </div>
                          <p className={`mt-4 text-2xl font-semibold ${isHighlight ? "text-white" : "theme-text-strong"}`}>
                            {pickText(locale, item.title)}
                          </p>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-3">
                          <div
                            className={`rounded-2xl border px-3 py-3 text-sm ${
                              isHighlight
                                ? "border-white/12 bg-white/10 text-white/82"
                                : "theme-border bg-white/70 theme-text-soft"
                            }`}
                          >
                            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em]">
                              {locale === "en" ? "Begin" : "Bat dau"}
                            </p>
                            <p className={`mt-2 font-medium ${isHighlight ? "text-white" : "theme-text-strong"}`}>
                              {formatDateLabel(locale, item.startDate)}
                            </p>
                          </div>
                          <div
                            className={`rounded-2xl border px-3 py-3 text-sm ${
                              isHighlight
                                ? "border-white/12 bg-white/10 text-white/82"
                                : "theme-border bg-white/70 theme-text-soft"
                            }`}
                          >
                            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em]">
                              {locale === "en" ? "End" : "Ket thuc"}
                            </p>
                            <p className={`mt-2 font-medium ${isHighlight ? "text-white" : "theme-text-strong"}`}>
                              {formatDateLabel(locale, item.endDate)}
                            </p>
                          </div>
                          <div
                            className={`rounded-2xl border px-3 py-3 text-sm ${
                              isHighlight
                                ? "border-white/12 bg-white/10 text-white/82"
                                : "theme-border bg-white/70 theme-text-soft"
                            }`}
                          >
                            <div className="flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.22em]">
                              <MapPin className="h-3.5 w-3.5" />
                              <span>{locale === "en" ? "Location" : "Địa điểm"}</span>
                            </div>
                            <p className={`mt-2 font-medium leading-6 ${isHighlight ? "text-white" : "theme-text-strong"}`}>
                              {pickText(locale, item.location)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <p className={`mt-4 text-sm leading-7 ${isHighlight ? "text-white/76" : "theme-text-muted"}`}>
                        {pickText(locale, item.description)}
                      </p>
                      {item.supportLinks?.length ? (
                        <div className="mt-5 flex flex-wrap gap-3">
                          {item.supportLinks.map((link) => (
                            <Link
                              key={link.href + link.label.en}
                              href={link.href}
                              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition ${
                                isHighlight
                                  ? "border-white/14 bg-white/10 text-white hover:bg-white/16"
                                  : "theme-border theme-panel text-[var(--text-strong)] hover:bg-[rgba(23,114,208,0.06)]"
                              }`}
                            >
                              {pickText(locale, link.label)}
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
