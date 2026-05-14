"use client";

import { BriefcaseBusiness, Building2, Sparkles } from "lucide-react";

import { pickLocalizedText, pickText } from "@/lib/site";
import { useSiteState } from "@/components/providers/site-state-provider";
import { Surface } from "@/components/site-ui";
import type { EditableJudgeRoundSection, JudgeProfile, Locale } from "@/types/site";

function JudgeCompactCard({ judge }: { judge: JudgeProfile }) {
  const { locale } = useSiteState();
  const position = pickText(locale, judge.role);
  const displayPosition = position || (locale === "en" ? "Position to be updated" : "Chức vụ đang cập nhật");
  const displayOrganization =
    pickLocalizedText(locale, judge.organization) || (locale === "en" ? "Organization to be updated" : "Đơn vị đang cập nhật");

  return (
    <Surface className="group flex h-full min-h-[17.5rem] flex-col overflow-hidden rounded-[1.25rem] px-0 py-0 transition duration-300 hover:-translate-y-1 hover:border-sky-300/60 hover:shadow-[0_22px_46px_rgba(30,89,145,0.14)] dark:hover:border-sky-200/30 dark:hover:shadow-[0_22px_46px_rgba(2,8,20,0.34)]">
      <div className="relative h-32 shrink-0 overflow-hidden">
        <div
          role="img"
          aria-label={judge.name}
          className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-[1.04]"
          style={{ backgroundImage: `url(${judge.imageSrc})` }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,18,35,0.02)_0%,rgba(7,18,35,0.12)_100%)]" />
        <div className="absolute right-2.5 top-2.5 inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/24 bg-white/18 text-white shadow-[0_12px_28px_rgba(3,12,24,0.16)] backdrop-blur-md">
          <Sparkles className="h-3 w-3" aria-hidden="true" />
        </div>
      </div>

      <div className="flex min-h-[2.45rem] items-center justify-center px-3 pb-1 pt-2.5 text-center">
        <p className="theme-heading line-clamp-2 text-[0.98rem] font-semibold leading-tight theme-text-strong">
          {judge.name}
        </p>
      </div>

      <div className="grid gap-1.5 px-3 pb-3 pt-1.5">
        <div className="grid min-h-[2.85rem] grid-cols-[1.25rem_minmax(0,1fr)] items-start gap-2 rounded-[0.9rem] border border-sky-700/12 bg-sky-500/8 px-2.5 py-2 text-[0.68rem] leading-4 theme-text-muted dark:border-sky-200/14 dark:bg-sky-300/10">
          <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-sky-500/12 text-sky-700 dark:bg-sky-300/12 dark:text-sky-100">
            <BriefcaseBusiness className="h-3 w-3" aria-hidden="true" />
          </span>
          <span className="min-w-0 whitespace-normal break-words font-medium theme-text-body">
            {displayPosition}
          </span>
        </div>

        <div className="grid min-h-[2.85rem] grid-cols-[1.25rem_minmax(0,1fr)] items-start gap-2 rounded-[0.9rem] border theme-border bg-white/64 px-2.5 py-2 text-[0.68rem] leading-4 theme-text-muted dark:bg-white/[0.05]">
          <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/12 text-cyan-700 dark:bg-cyan-300/12 dark:text-cyan-100">
            <Building2 className="h-3 w-3" aria-hidden="true" />
          </span>
          <span className="min-w-0 whitespace-normal break-words font-medium theme-text-body">
            {displayOrganization}
          </span>
        </div>
      </div>
    </Surface>
  );
}

function JudgeSectionHeading({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="max-w-3xl space-y-3">
      <p className="theme-eyebrow text-xs font-semibold uppercase tracking-[0.34em]">{eyebrow}</p>
      <h2 className="theme-heading theme-text-strong text-xl font-semibold leading-tight md:text-2xl">
        {title}
      </h2>
    </div>
  );
}

function PanelSizeBadge({
  label,
  count,
}: {
  label: string;
  count: number;
}) {
  return (
    <Surface className="inline-flex w-full items-center justify-between gap-4 rounded-[1.35rem] px-4 py-3 md:w-auto md:min-w-40">
      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] theme-text-soft">{label}</p>
      <p className="theme-heading theme-text-strong text-2xl font-semibold leading-none">{count}</p>
    </Surface>
  );
}

function getMergedRoundTitle(locale: Locale) {
  return locale === "en" ? "Round 1 and Round 2 judges" : "Giám khảo Vòng 1 và Vòng 2";
}

function getMergedRoundEyebrow(locale: Locale) {
  return locale === "en" ? "Evaluation rounds" : "Các vòng đánh giá";
}

export function JudgesPage() {
  const { locale, judges, pageContent } = useSiteState();
  const sections = pageContent.judges.roundSections;
  const finalSection = sections.find((section) => section.round === "round-3");
  const earlyRoundJudges = judges.filter((judge) =>
    judge.rounds.some((round) => round === "round-1" || round === "round-2"),
  );

  const renderJudgeSection = ({
    key,
    section,
    sectionJudges,
    eyebrow,
    title,
    showPanelSize = false,
  }: {
    key: string;
    section?: EditableJudgeRoundSection;
    sectionJudges: JudgeProfile[];
    eyebrow?: string;
    title?: string;
    showPanelSize?: boolean;
  }) => {
    if (sectionJudges.length === 0) {
      return null;
    }

    const sectionEyebrow = eyebrow ?? (section ? pickText(locale, section.eyebrow) : "");
    const sectionTitle = title ?? (section ? pickText(locale, section.title) : "");

    return (
      <section key={key} className="space-y-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <JudgeSectionHeading eyebrow={sectionEyebrow} title={sectionTitle} />
          {showPanelSize ? (
            <PanelSizeBadge
              label={pickText(locale, pageContent.judges.panelSizeLabel)}
              count={sectionJudges.length}
            />
          ) : null}
        </div>

        <div className="grid items-stretch gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {sectionJudges.map((judge) => (
            <JudgeCompactCard key={judge.id} judge={judge} />
          ))}
        </div>
      </section>
    );
  };

  return (
    <div className="space-y-14">
      {finalSection
        ? renderJudgeSection({
            key: finalSection.round,
            section: finalSection,
            sectionJudges: judges.filter((judge) => judge.rounds.includes(finalSection.round)),
            showPanelSize: true,
          })
        : null}

      {renderJudgeSection({
        key: "round-1-round-2",
        sectionJudges: earlyRoundJudges,
        eyebrow: getMergedRoundEyebrow(locale),
        title: getMergedRoundTitle(locale),
      })}
    </div>
  );
}
