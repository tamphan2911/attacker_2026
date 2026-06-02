"use client";

import Image from "next/image";
import Link from "next/link";
import { CalendarRange, Mail, PhoneCall } from "lucide-react";

import { navItems } from "@/data/site-content";
import { pickText } from "@/lib/site";
import { useSiteState } from "@/components/providers/site-state-provider";

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M13.5 21v-7h2.35l.4-3h-2.75V9.19c0-.87.24-1.46 1.49-1.46H16.5V5.05c-.26-.03-1.15-.11-2.19-.11-2.17 0-3.66 1.32-3.66 3.75V11H8.2v3h2.45v7h2.85Z" />
    </svg>
  );
}

function FooterBrand({
  locale,
  logoImage,
  title,
  subtitle,
}: {
  locale: "en" | "vi";
  logoImage: string;
  title: { en: string; vi: string };
  subtitle: { en: string; vi: string };
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl border border-white/25 shadow-[0_16px_36px_rgba(23,114,208,0.18)]">
        <Image
          src={logoImage}
          alt={pickText(locale, title)}
          fill
          sizes="44px"
          unoptimized={logoImage.startsWith("/api/content-images/")}
          className="object-cover"
        />
      </div>
      <div className="min-w-0">
        <p className="theme-eyebrow text-[0.72rem] font-semibold uppercase tracking-[0.34em]">
          {pickText(locale, title)}
        </p>
        <p className="theme-heading text-sm theme-text-soft">{pickText(locale, subtitle)}</p>
      </div>
    </div>
  );
}

export function SiteFooter() {
  const { locale, pageContent } = useSiteState();
  const footer = pageContent.footer;
  const contact = pageContent.contact;
  const footerNavItems = navItems.filter((item) => item.href !== "/organizer");

  return (
    <footer className="theme-footer mt-24 border-t">
      <div className="mx-auto max-w-7xl px-4 py-14 md:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.8fr_0.75fr_1fr]">
          <div className="space-y-5">
            <FooterBrand
              locale={locale}
              logoImage={footer.brandLogoImage}
              title={footer.brandTitle}
              subtitle={footer.brandSubtitle}
            />
            <p className="max-w-xl text-sm leading-7 theme-text-muted">
              {pickText(locale, footer.description)}
            </p>
            <Link href="/competition" className="theme-button-primary inline-flex rounded-full px-5 py-2.5 text-sm font-semibold transition hover:brightness-110">
              {pickText(locale, footer.ctaLabel)}
            </Link>
          </div>

          <div>
            <p className="theme-eyebrow mb-4 text-xs font-semibold uppercase tracking-[0.3em]">
              {pickText(locale, footer.navigateHeading)}
            </p>
            <div className="space-y-3">
              {footerNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block text-sm theme-text-muted transition hover:text-[var(--text-strong)]"
                >
                  {pickText(locale, item.label)}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="theme-eyebrow mb-4 text-xs font-semibold uppercase tracking-[0.3em]">
              {pickText(locale, footer.contactHeading)}
            </p>
            <div className="space-y-3 text-sm theme-text-muted">
              <a
                className="inline-flex items-center gap-3 transition hover:text-[var(--text-strong)]"
                href={`mailto:${contact.officialEmailValue}`}
              >
                <Mail className="h-4 w-4 theme-accent" />
                <span>{contact.officialEmailValue}</span>
              </a>
              <a
                className="inline-flex items-center gap-3 transition hover:text-[var(--text-strong)]"
                href={`tel:${contact.primaryHotlineValue}`}
              >
                <PhoneCall className="h-4 w-4 theme-accent" />
                <span>{contact.primaryHotlineValue}</span>
              </a>
              <a
                className="inline-flex items-center gap-3 transition hover:text-[var(--text-strong)]"
                href={contact.attackerFacebookUrl}
                target="_blank"
                rel="noreferrer"
              >
                <FacebookIcon className="h-4 w-4 theme-accent" />
                <span>{pickText(locale, footer.attackerFacebookLabel)}</span>
              </a>
              <a
                className="inline-flex items-center gap-3 transition hover:text-[var(--text-strong)]"
                href={contact.ftcFacebookUrl}
                target="_blank"
                rel="noreferrer"
              >
                <FacebookIcon className="h-4 w-4 theme-accent" />
                <span>{pickText(locale, footer.ftcFacebookLabel)}</span>
              </a>
            </div>
          </div>

          <div>
            <p className="theme-eyebrow mb-4 text-xs font-semibold uppercase tracking-[0.3em]">
              {pickText(locale, footer.snapshotHeading)}
            </p>
            <div className="space-y-3">
              {footer.snapshotItems.map((item, index) => (
                <div
                  key={`${index}-${pickText(locale, item.label)}`}
                  className="theme-panel-subtle rounded-[1.15rem] border theme-border px-4 py-3"
                >
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] theme-eyebrow">
                    {pickText(locale, item.label)}
                  </p>
                  <p className="mt-2 text-sm leading-6 theme-text-muted">
                    {pickText(locale, item.value)}
                  </p>
                </div>
              ))}
            </div>
            <Link
              href="/competition/timeline"
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold theme-accent"
            >
              <CalendarRange className="h-4 w-4" />
              {pickText(locale, footer.timelineLinkLabel)}
            </Link>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t theme-border pt-6 text-sm theme-text-soft md:flex-row md:items-center md:justify-between">
          <p>{pickText(locale, footer.copyright)}</p>
        </div>
      </div>
    </footer>
  );
}
