"use client";

import Link from "next/link";
import {
  Clock3,
  ExternalLink,
  Mail,
  MapPin,
  PhoneCall,
} from "lucide-react";

import {
  contactDeskContacts,
  contactInfo,
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
  const { locale } = useSiteState();

  return (
    <div className="space-y-12">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px] xl:items-start">
        <Surface className="overflow-hidden px-0 py-0">
          <div className="border-b theme-border px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] theme-eyebrow">
              {locale === "en" ? "Contact" : "Liên hệ"}
            </p>
            <p className="mt-3 text-2xl font-semibold theme-text-strong">
              {pickText(locale, contactLocation.campusName)}
            </p>
          </div>
          <div className="h-[360px] w-full">
            <iframe
              title={pickText(locale, contactLocation.campusName)}
              src={contactLocation.mapEmbedUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-full w-full border-0"
            />
          </div>
          <div className="border-t theme-border px-6 py-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] theme-eyebrow">
              {locale === "en" ? "Phone contacts" : "Đầu mối điện thoại"}
            </p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {contactDeskContacts.map((item) => (
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
                  {locale === "en" ? "Response rhythm" : "Nhịp phản hồi"}
                </p>
                <p className="mt-1 text-sm leading-7 theme-text-body">
                  {locale === "en"
                    ? "Support channels stay open 24/7 for registration, team, and technical coordination."
                    : "Các kênh hỗ trợ luôn mở 24/7 cho nhu cầu đăng ký, đội thi và phối hợp kỹ thuật."}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {[
                {
                  icon: <Mail className="h-4 w-4 text-sky-400" />,
                  label: locale === "en" ? "Official email" : "Email chính thức",
                  value: contactInfo.email,
                  href: `mailto:${contactInfo.email}`,
                },
                {
                  icon: <PhoneCall className="h-4 w-4 text-sky-400" />,
                  label: locale === "en" ? "Primary hotline" : "Hotline chính",
                  value: contactInfo.phone,
                  href: `tel:${contactInfo.phone}`,
                },
                {
                  icon: <Clock3 className="h-4 w-4 text-sky-400" />,
                  label: locale === "en" ? "Support window" : "Khung giờ hỗ trợ",
                  value: "24/7",
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
                      <a
                        href={item.href}
                        className="mt-2 block break-all text-sm font-medium leading-7 theme-text-strong transition hover:text-[var(--brand)]"
                      >
                        {item.value}
                      </a>
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
                  {locale === "en" ? "Organizer address" : "Địa chỉ ban tổ chức"}
                </p>
                <p className="mt-3 text-lg font-semibold leading-8 theme-text-strong">
                  {pickText(locale, contactLocation.address)}
                </p>
                <p className="mt-4 text-sm leading-7 theme-text-muted">
                  {pickText(locale, contactLocation.note)}
                </p>
              </div>
            </div>
          </Surface>

          <Surface className="px-6 py-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] theme-text-soft">
              {locale === "en" ? "Official channels" : "Kênh chính thức"}
            </p>
            <div className="mt-4 space-y-3 text-sm">
              <a
                href={`mailto:${contactInfo.email}`}
                className="flex items-center justify-between gap-4 rounded-[1rem] border theme-border theme-panel-subtle px-4 py-3 transition hover:border-[var(--brand)]"
              >
                <span className="inline-flex items-center gap-3 theme-text-body">
                  <Mail className="h-4 w-4 text-sky-400" />
                  {contactInfo.email}
                </span>
                <ExternalLink className="h-4 w-4 theme-text-soft" />
              </a>
              <a
                href={contactInfo.attackerFacebook}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between gap-4 rounded-[1rem] border theme-border theme-panel-subtle px-4 py-3 transition hover:border-[var(--brand)]"
              >
                <span className="inline-flex items-center gap-3 theme-text-body">
                  <FacebookIcon className="h-4 w-4 text-sky-400" />
                  {locale === "en" ? "Attacker facebook page" : "Fanpage Attacker"}
                </span>
                <ExternalLink className="h-4 w-4 theme-text-soft" />
              </a>
              <a
                href={contactInfo.ftcFacebook}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between gap-4 rounded-[1rem] border theme-border theme-panel-subtle px-4 py-3 transition hover:border-[var(--brand)]"
              >
                <span className="inline-flex items-center gap-3 theme-text-body">
                  <FacebookIcon className="h-4 w-4 text-sky-400" />
                  {locale === "en" ? "FTC facebook page" : "Fanpage FTC"}
                </span>
                <ExternalLink className="h-4 w-4 theme-text-soft" />
              </a>
            </div>
            <Link
              href="/news"
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold theme-accent"
            >
              {locale === "en" ? "Open newsroom" : "Mở trang tin tức"}
              <ExternalLink className="h-4 w-4" />
            </Link>
          </Surface>
        </div>
      </section>

    </div>
  );
}
