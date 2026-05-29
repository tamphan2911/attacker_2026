"use client";

import Link from "next/link";
import { ArrowRight, CircleHelp, ExternalLink, Mail, MessageCircle, ShieldCheck, Tags, UsersRound } from "lucide-react";

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

const topicPalettes = [
  {
    shell: "border-sky-500/18 bg-[linear-gradient(135deg,rgba(14,165,233,0.14),rgba(59,130,246,0.06))] dark:border-sky-300/18 dark:bg-sky-300/10",
    icon: "border-sky-500/18 bg-sky-500/12 text-sky-700 dark:border-sky-300/18 dark:bg-sky-300/12 dark:text-sky-100",
    badge: "border-sky-500/20 bg-sky-500/10 text-slate-950 dark:border-sky-300/18 dark:bg-sky-300/12 dark:text-sky-100",
  },
  {
    shell: "border-emerald-500/18 bg-[linear-gradient(135deg,rgba(16,185,129,0.13),rgba(20,184,166,0.06))] dark:border-emerald-300/18 dark:bg-emerald-300/10",
    icon: "border-emerald-500/18 bg-emerald-500/12 text-emerald-800 dark:border-emerald-300/18 dark:bg-emerald-300/12 dark:text-emerald-100",
    badge: "border-emerald-500/20 bg-emerald-500/10 text-slate-950 dark:border-emerald-300/18 dark:bg-emerald-300/12 dark:text-emerald-100",
  },
  {
    shell: "border-amber-500/20 bg-[linear-gradient(135deg,rgba(245,158,11,0.16),rgba(251,191,36,0.06))] dark:border-amber-300/18 dark:bg-amber-300/10",
    icon: "border-amber-500/20 bg-amber-500/14 text-amber-800 dark:border-amber-300/18 dark:bg-amber-300/12 dark:text-amber-100",
    badge: "border-amber-500/24 bg-amber-500/12 text-slate-950 dark:border-amber-300/18 dark:bg-amber-300/12 dark:text-amber-100",
  },
  {
    shell: "border-rose-500/18 bg-[linear-gradient(135deg,rgba(244,63,94,0.12),rgba(249,115,22,0.05))] dark:border-rose-300/18 dark:bg-rose-300/10",
    icon: "border-rose-500/18 bg-rose-500/12 text-rose-800 dark:border-rose-300/18 dark:bg-rose-300/12 dark:text-rose-100",
    badge: "border-rose-500/20 bg-rose-500/10 text-slate-950 dark:border-rose-300/18 dark:bg-rose-300/12 dark:text-rose-100",
  },
];

export function FaqPage() {
  const { locale, pageContent } = useSiteState();
  const savedDescription = pickText(locale, pageContent.rules.faq.description);
  const description = OLD_DEFAULT_FAQ_DESCRIPTIONS.has(savedDescription)
    ? locale === "en"
      ? "If you have further questions, contact the organizer through the FTC Facebook page below or the official email listed here."
      : "Nếu bạn có câu hỏi khác, hãy liên hệ ban tổ chức qua Fanpage FTC bên dưới hoặc email chính thức được nêu trong khung bên dưới."
	    : savedDescription;
  const faqTopics = pageContent.rules.faqTopics;
  const categorizedTopicIds = new Set(faqTopics.map((topic) => topic.id));
  const topicGroups = faqTopics
    .map((topic, index) => ({
      topic,
      palette: topicPalettes[index % topicPalettes.length],
      items: pageContent.rules.faqItems.filter((item) => item.topicId === topic.id),
    }))
    .filter((group) => group.items.length > 0);
  const uncategorizedItems = pageContent.rules.faqItems.filter((item) => !categorizedTopicIds.has(item.topicId));
  const allGroups =
    uncategorizedItems.length > 0
      ? [
          ...topicGroups,
          {
            topic: {
              id: "uncategorized",
              title: { en: "Other questions", vi: "Câu hỏi khác" },
              description: {
                en: "Additional questions not assigned to a specific topic yet.",
                vi: "Các câu hỏi bổ sung chưa được gắn vào một chủ đề cụ thể.",
              },
            },
            palette: topicPalettes[topicGroups.length % topicPalettes.length],
            items: uncategorizedItems,
          },
        ]
      : topicGroups;

  return (
    <div className="space-y-16">
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div className="space-y-5">
          <SectionHeading
            eyebrow={pickText(locale, pageContent.rules.faq.eyebrow)}
            title={pickText(locale, pageContent.rules.faq.title)}
            description={description}
          />

          <div className="flex flex-wrap items-center gap-3">
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
            <span
              className="theme-panel-subtle inline-flex min-h-12 w-fit max-w-full items-center gap-3 rounded-[1rem] border theme-border px-4 text-sm font-semibold theme-text-strong"
            >
              <Mail className="h-4 w-4 text-sky-500" />
              <span className="truncate">{pageContent.contact.officialEmailValue}</span>
            </span>
            <Link
              href="/messages?organizer=1"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-cyan-400/28 bg-cyan-500 px-5 text-sm font-semibold text-white shadow-[0_18px_34px_rgba(14,165,233,0.24)] transition hover:-translate-y-0.5 hover:bg-cyan-600 dark:border-cyan-200/24 dark:bg-cyan-300 dark:text-slate-950 dark:shadow-[0_18px_34px_rgba(103,232,249,0.14)] dark:hover:bg-cyan-200"
            >
              <MessageCircle className="h-4 w-4" />
              {locale === "en" ? "Message organizer" : "Nhắn ban tổ chức"}
              <ArrowRight className="h-4 w-4" />
            </Link>
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

	      <section className="space-y-6">
	        {allGroups.map((group) => (
	          <Surface key={group.topic.id} className={`overflow-hidden px-5 py-5 md:px-6 md:py-6 ${group.palette.shell}`}>
	            <div className="flex flex-col gap-4 border-b theme-border pb-5 md:flex-row md:items-start md:justify-between">
	              <div className="flex items-start gap-4">
	                <span className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${group.palette.icon}`}>
	                  <Tags className="h-5 w-5" />
	                </span>
	                <div>
	                  <p className="theme-heading text-2xl font-semibold theme-text-strong">
	                    {pickText(locale, group.topic.title)}
	                  </p>
	                  <p className="mt-2 max-w-3xl text-sm leading-7 theme-text-muted">
	                    {pickText(locale, group.topic.description)}
	                  </p>
	                </div>
	              </div>
	              <span className={`inline-flex min-h-9 items-center justify-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${group.palette.badge}`}>
	                FAQ
	              </span>
	            </div>

	            <div className="mt-5 grid gap-4 xl:grid-cols-2">
	              {group.items.map((item, index) => (
	                <div
	                  key={`${group.topic.id}-${index}-${item.question.en}`}
	                  className="rounded-[1.6rem] border theme-border theme-panel px-5 py-5"
	                >
	                  <div className={`mb-4 inline-flex rounded-full border px-3 py-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.18em] ${group.palette.badge}`}>
	                    {pickText(locale, group.topic.title)}
	                  </div>
	                  <p className="text-lg font-semibold theme-text-strong">
	                    {pickText(locale, item.question)}
	                  </p>
	                  <p className="mt-4 text-sm leading-7 theme-text-muted">
	                    {pickText(locale, item.answer)}
	                  </p>
	                </div>
	              ))}
	            </div>
	          </Surface>
	        ))}
	      </section>
    </div>
  );
}
