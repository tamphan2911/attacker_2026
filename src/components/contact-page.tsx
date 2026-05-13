"use client";

import Link from "next/link";
import {
  Clock3,
  ExternalLink,
  Mail,
  MapPin,
  MessageCircle,
  PhoneCall,
} from "lucide-react";

import {
  contactLocation,
} from "@/data/site-content";
import { pickText } from "@/lib/site";
import { useSiteState } from "@/components/providers/site-state-provider";
import { Surface } from "@/components/site-ui";

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M13.5 21v-7h2.35l.4-3h-2.75V9.19c0-.87.24-1.46 1.49-1.46H16.5V5.05c-.26-.03-1.15-.11-2.19-.11-2.17 0-3.66 1.32-3.66 3.75V11H8.2v3h2.45v7h2.85Z" />
    </svg>
  );
}

export function ContactPage() {
  const { locale, pageContent } = useSiteState();

  return (
    <div className="space-y-12">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px] xl:items-start">
        <Surface className="overflow-hidden px-0 py-0">
          <div className="border-b theme-border px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] theme-eyebrow">
              {pickText(locale, pageContent.contact.mapEyebrow)}
            </p>
            <p className="mt-3 text-2xl font-semibold theme-text-strong">
              {pickText(locale, pageContent.contact.campusName)}
            </p>
          </div>
          <div className="h-[360px] w-full">
            <iframe
              title={pickText(locale, pageContent.contact.campusName)}
              src={contactLocation.mapEmbedUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-full w-full border-0"
            />
          </div>
          <div className="border-t theme-border px-6 py-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] theme-eyebrow">
              {pickText(locale, pageContent.contact.phoneContactsEyebrow)}
            </p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {pageContent.contact.phoneContacts.map((item) => (
                <div
                  key={item.name}
                  className="theme-panel-subtle rounded-[1.35rem] border theme-border px-4 py-4"
                >
                  <p className="text-sm font-semibold theme-text-strong">{item.name}</p>
                  <a
                    href={`tel:${item.tel}`}
                    className="mt-3 inline-flex items-center gap-2 text-sm font-medium theme-accent"
                  >
                    <PhoneCall className="h-4 w-4" />
                    {item.phone}
                  </a>
                  <p className="mt-3 text-sm leading-7 theme-text-body">
                    {pickText(locale, item.responsibility)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Surface>

        <div className="space-y-4">
          <Surface className="px-6 py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[rgba(23,114,208,0.12)]">
                <Clock3 className="h-5 w-5 text-sky-500" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] theme-text-soft">
                  {pickText(locale, pageContent.contact.responseRhythmEyebrow)}
                </p>
                <p className="mt-1 text-sm leading-7 theme-text-body">
                  {pickText(locale, pageContent.contact.responseRhythmDescription)}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {[
                {
                  icon: <MessageCircle className="h-4 w-4 text-cyan-300" />,
                  label: locale === "en" ? "Support message" : "Tin nhắn hỗ trợ",
                  value:
                    locale === "en"
                      ? "Message the competition organizer for direct support."
                      : "Nhắn trực tiếp cho ban tổ chức để được hỗ trợ.",
                  href: "/messages?organizer=1",
                  internal: true,
                },
                {
                  icon: <Mail className="h-4 w-4 text-sky-400" />,
                  label: pickText(locale, pageContent.contact.officialEmailLabel),
                  value: pageContent.contact.officialEmailValue,
                  href: `mailto:${pageContent.contact.officialEmailValue}`,
                  internal: false,
                },
                {
                  icon: <PhoneCall className="h-4 w-4 text-sky-400" />,
                  label: pickText(locale, pageContent.contact.primaryHotlineLabel),
                  value: pageContent.contact.primaryHotlineValue,
                  href: `tel:${pageContent.contact.primaryHotlineValue}`,
                  internal: false,
                },
                {
                  icon: <Clock3 className="h-4 w-4 text-sky-400" />,
                  label: pickText(locale, pageContent.contact.supportWindowLabel),
                  value: pageContent.contact.supportWindowValue,
                  internal: false,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="theme-panel-subtle flex items-start gap-3 rounded-[1.3rem] border theme-border px-4 py-4"
                >
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[rgba(23,114,208,0.12)]">
                    {item.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] theme-text-soft">
                      {item.label}
                    </p>
                    {item.href ? (
                      item.internal ? (
                        <Link
                          href={item.href}
                          className="mt-2 inline-flex items-center gap-2 text-sm font-semibold leading-7 theme-accent transition hover:text-[var(--brand)]"
                        >
                          {item.value}
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      ) : (
                        <a
                          href={item.href}
                          className="mt-2 block break-all text-sm font-medium leading-7 theme-text-strong transition hover:text-[var(--brand)]"
                        >
                          {item.value}
                        </a>
                      )
                    ) : (
                      <p className="mt-2 text-sm leading-7 theme-text-body">{item.value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Surface>

          <Surface className="px-6 py-6">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[rgba(23,114,208,0.12)]">
                <MapPin className="h-5 w-5 text-sky-500" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] theme-text-soft">
                  {pickText(locale, pageContent.contact.organizerAddressEyebrow)}
                </p>
                <p className="mt-3 text-lg font-semibold leading-8 theme-text-strong">
                  {pickText(locale, pageContent.contact.organizerAddress)}
                </p>
                <p className="mt-4 text-sm leading-7 theme-text-muted">
                  {pickText(locale, pageContent.contact.organizerAddressNote)}
                </p>
              </div>
            </div>
          </Surface>

          <Surface className="px-6 py-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] theme-text-soft">
              {pickText(locale, pageContent.contact.officialChannelsEyebrow)}
            </p>
            <div className="mt-4 space-y-3 text-sm">
              <a
                href={`mailto:${pageContent.contact.officialEmailValue}`}
                className="flex items-center justify-between gap-4 rounded-[1rem] border theme-border theme-panel-subtle px-4 py-3 transition hover:border-[var(--brand)]"
              >
                <span className="inline-flex items-center gap-3 theme-text-body">
                  <Mail className="h-4 w-4 text-sky-400" />
                  {pageContent.contact.officialEmailValue}
                </span>
                <ExternalLink className="h-4 w-4 theme-text-soft" />
              </a>
              <a
                href={pageContent.contact.attackerFacebookUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between gap-4 rounded-[1rem] border theme-border theme-panel-subtle px-4 py-3 transition hover:border-[var(--brand)]"
              >
                <span className="inline-flex items-center gap-3 theme-text-body">
                  <FacebookIcon className="h-4 w-4 text-sky-400" />
                  {pickText(locale, pageContent.contact.attackerFacebookLabel)}
                </span>
                <ExternalLink className="h-4 w-4 theme-text-soft" />
              </a>
              <a
                href={pageContent.contact.ftcFacebookUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between gap-4 rounded-[1rem] border theme-border theme-panel-subtle px-4 py-3 transition hover:border-[var(--brand)]"
              >
                <span className="inline-flex items-center gap-3 theme-text-body">
                  <FacebookIcon className="h-4 w-4 text-sky-400" />
                  {pickText(locale, pageContent.contact.ftcFacebookLabel)}
                </span>
                <ExternalLink className="h-4 w-4 theme-text-soft" />
              </a>
            </div>
            <Link
              href="/news"
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold theme-accent"
            >
              {pickText(locale, pageContent.contact.openNewsroomLabel)}
              <ExternalLink className="h-4 w-4" />
            </Link>
          </Surface>
        </div>
      </section>

    </div>
  );
}
