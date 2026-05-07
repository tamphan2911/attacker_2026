"use client";

import { pickText } from "@/lib/site";
import { useSiteState } from "@/components/providers/site-state-provider";
import { SectionHeading, Surface } from "@/components/site-ui";
import type { JudgeProfile } from "@/types/site";

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

export function JudgesPage() {
  const { locale, judges, pageContent } = useSiteState();
  const sections = pageContent.judges.roundSections;

  return (
    <div className="space-y-16">
      <SectionHeading
        eyebrow={pickText(locale, pageContent.judges.header.eyebrow)}
        title={pickText(locale, pageContent.judges.header.title)}
        description={pickText(locale, pageContent.judges.header.description)}
      />

      {sections.map((section) => {
        const sectionJudges = judges.filter((judge) => judge.rounds.includes(section.round));

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
                  {pickText(locale, pageContent.judges.panelSizeLabel)}
                </p>
                <p className="mt-4 text-3xl font-semibold theme-text-strong">{sectionJudges.length}</p>
                <p className="mt-3 text-sm leading-7 theme-text-muted">
                  {pickText(locale, section.panelNote)}
                </p>
              </Surface>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {sectionJudges.map((judge) => (
                <JudgeCompactCard key={judge.id} judge={judge} />
              ))}
            </div>
          </section>
        );
      })}

      <Surface className="px-6 py-6 md:px-8 md:py-8">
        <SectionHeading
          eyebrow={pickText(locale, pageContent.judges.clarity.eyebrow)}
          title={pickText(locale, pageContent.judges.clarity.title)}
          description={pickText(locale, pageContent.judges.clarity.description)}
        />
      </Surface>
    </div>
  );
}
