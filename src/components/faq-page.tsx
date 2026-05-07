"use client";

import { CircleHelp, ShieldCheck, UsersRound } from "lucide-react";

import { pickText } from "@/lib/site";
import { useSiteState } from "@/components/providers/site-state-provider";
import { SectionHeading, Surface } from "@/components/site-ui";

export function FaqPage() {
  const { locale, pageContent } = useSiteState();

  return (
    <div className="space-y-16">
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <SectionHeading
          eyebrow={pickText(locale, pageContent.rules.faq.eyebrow)}
          title={pickText(locale, pageContent.rules.faq.title)}
          description={pickText(locale, pageContent.rules.faq.description)}
        />

        <Surface className="px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200/80">
            {pickText(locale, pageContent.rules.faqQuickAnswersLabel)}
          </p>
          <div className="mt-5 space-y-3">
            {[
              {
                icon: <UsersRound className="h-4 w-4 text-cyan-300" />,
                label: pickText(locale, pageContent.rules.faqQuickAnswers[0]),
              },
              {
                icon: <ShieldCheck className="h-4 w-4 text-emerald-300" />,
                label: pickText(locale, pageContent.rules.faqQuickAnswers[1]),
              },
              {
                icon: <CircleHelp className="h-4 w-4 text-orange-300" />,
                label: pickText(locale, pageContent.rules.faqQuickAnswers[2]),
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

      <section className="grid gap-4 xl:grid-cols-2">
        {pageContent.rules.faqItems.map((item, index) => (
          <Surface key={item.question.en} className="px-6 py-6 md:px-7 md:py-7">
            <div className="inline-flex rounded-full border theme-border bg-white/70 px-3 py-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.24em] theme-eyebrow">
              {`${pickText(locale, pageContent.rules.faqQuestionPrefix)} ${index + 1}`}
            </div>
            <p className="mt-5 text-xl font-semibold theme-text-strong">
              {pickText(locale, item.question)}
            </p>
            <p className="mt-4 text-sm leading-7 theme-text-muted">
              {pickText(locale, item.answer)}
            </p>
          </Surface>
        ))}
      </section>
    </div>
  );
}
