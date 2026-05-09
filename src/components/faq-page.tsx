"use client";

import { CircleHelp, ExternalLink, Mail, ShieldCheck, UsersRound } from "lucide-react";

import { pickText } from "@/lib/site";
import { useSiteState } from "@/components/providers/site-state-provider";
import { SectionHeading, Surface } from "@/components/site-ui";

const OLD_DEFAULT_FAQ_DESCRIPTIONS = new Set([
  "This matters especially for Round 1 eligibility, team-average scoring, and the rules around team switching.",
  "Điều này đặc biệt quan trọng với điều kiện vào Vòng 1, cơ chế điểm trung bình đội và các quy tắc chuyển đội.",
]);

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M13.5 21v-7h2.35l.4-3h-2.75V9.19c0-.87.24-1.46 1.49-1.46H16.5V5.05c-.26-.03-1.15-.11-2.19-.11-2.17 0-3.66 1.32-3.66 3.75V11H8.2v3h2.45v7h2.85Z" />
    </svg>
  );
}

export function FaqPage() {
  const { locale, pageContent } = useSiteState();
  const savedDescription = pickText(locale, pageContent.rules.faq.description);
  const description = OLD_DEFAULT_FAQ_DESCRIPTIONS.has(savedDescription)
    ? locale === "en"
      ? "If you have further questions, contact the organizer through the FTC Facebook page below or the official email listed here."
      : "Nếu bạn có câu hỏi khác, hãy liên hệ ban tổ chức qua Fanpage FTC bên dưới hoặc email chính thức được nêu trong khung bên dưới."
    : savedDescription;

  return (
    <div className="space-y-16">
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div className="space-y-5">
          <SectionHeading
            eyebrow={pickText(locale, pageContent.rules.faq.eyebrow)}
            title={pickText(locale, pageContent.rules.faq.title)}
            description={description}
          />

          <div className="grid gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
            <a
              href={pageContent.contact.ftcFacebookUrl}
              target="_blank"
              rel="noreferrer"
              className="theme-button-primary inline-flex h-12 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold"
            >
              <FacebookIcon className="h-4 w-4" />
              {pickText(locale, pageContent.contact.ftcFacebookLabel)}
              <ExternalLink className="h-4 w-4" />
            </a>
            <a
              href={`mailto:${pageContent.contact.officialEmailValue}`}
              className="theme-panel-subtle inline-flex min-h-12 items-center gap-3 rounded-[1rem] border theme-border px-4 text-sm font-semibold theme-text-strong transition hover:border-[var(--brand)]"
            >
              <Mail className="h-4 w-4 text-sky-500" />
              <span className="truncate">{pageContent.contact.officialEmailValue}</span>
            </a>
          </div>
        </div>

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
