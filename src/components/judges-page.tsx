"use client";

import { pickText } from "@/lib/site";
import { useSiteState } from "@/components/providers/site-state-provider";
import { Surface } from "@/components/site-ui";
import type { EditableJudgeRoundSection, JudgeProfile, Locale } from "@/types/site";

function JudgeCompactCard({ judge }: { judge: JudgeProfile }) {
  const { locale } = useSiteState();

  return (
    <Surface className="overflow-hidden px-0 py-0">
      <div className="relative h-44 overflow-hidden md:h-48">
        <div
          role="img"
          aria-label={judge.name}
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${judge.imageSrc})` }}
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
    <Surface className="inline-flex w-full items-center justify-between gap-4 px-4 py-3 md:w-auto md:min-w-44">
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
      <section key={key} className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <JudgeSectionHeading eyebrow={sectionEyebrow} title={sectionTitle} />
          {showPanelSize ? (
            <PanelSizeBadge
              label={pickText(locale, pageContent.judges.panelSizeLabel)}
              count={sectionJudges.length}
            />
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
