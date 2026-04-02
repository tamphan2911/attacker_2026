"use client";

import Link from "next/link";

import { contactInfo, navItems } from "@/data/site-content";
import { pickText } from "@/lib/site";
import { useSiteState } from "@/components/providers/site-state-provider";
import { BrandMark } from "@/components/site-ui";

export function SiteFooter() {
  const { locale } = useSiteState();

  return (
    <footer className="theme-footer mt-24 border-t">
      <div className="mx-auto max-w-7xl px-4 py-14 md:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.8fr_0.75fr_1fr]">
          <div className="space-y-5">
            <BrandMark />
            <p className="max-w-xl text-sm leading-7 theme-text-muted">
              {locale === "en"
                ? "Attacker 2026 is being refined into a bilingual student fintech platform with clearer information bands, stronger team workflows, and a more established launch-site rhythm."
                : "Attacker 2026 đang được tinh chỉnh thành một nền tảng fintech sinh viên song ngữ với các lớp thông tin rõ ràng hơn, luồng đội thi mạch lạc hơn và nhịp điệu launch-site trưởng thành hơn."}
            </p>
            <Link href="/competition" className="theme-button-primary inline-flex rounded-full px-5 py-2.5 text-sm font-semibold transition hover:brightness-110">
              {locale === "en" ? "Explore the competition" : "Khám phá cuộc thi"}
            </Link>
          </div>

          <div>
            <p className="theme-eyebrow mb-4 text-xs font-semibold uppercase tracking-[0.3em]">
              {locale === "en" ? "Navigate" : "Điều hướng"}
            </p>
            <div className="space-y-3">
              {navItems.map((item) => (
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
              {locale === "en" ? "Contact" : "Liên hệ"}
            </p>
            <div className="space-y-3 text-sm theme-text-muted">
              <a className="block transition hover:text-[var(--text-strong)]" href={`mailto:${contactInfo.email}`}>
                {contactInfo.email}
              </a>
              <a className="block transition hover:text-[var(--text-strong)]" href={`tel:${contactInfo.phone}`}>
                {contactInfo.phone}
              </a>
              <a className="block transition hover:text-[var(--text-strong)]" href={contactInfo.facebook} target="_blank" rel="noreferrer">
                Facebook community
              </a>
            </div>
          </div>

          <div>
            <p className="theme-eyebrow mb-4 text-xs font-semibold uppercase tracking-[0.3em]">
              {locale === "en" ? "Newsletter" : "Bản tin email"}
            </p>
            <p className="text-sm leading-7 theme-text-muted">
              {locale === "en"
                ? "Get deadlines, clinic updates, and competition news in one cleaner channel."
                : "Nhận hạn đăng ký, cập nhật clinic và tin tức cuộc thi trong một kênh gọn gàng hơn."}
            </p>
            <div className="mt-5 space-y-3">
              <input
                placeholder={locale === "en" ? "Email address" : "Địa chỉ email"}
                className="theme-field w-full rounded-full border px-4 py-3 text-sm outline-none"
              />
              <button
                type="button"
                className="theme-button-primary w-full rounded-full px-5 py-3 text-sm font-semibold transition hover:brightness-110"
              >
                {locale === "en" ? "Subscribe" : "Đăng ký"}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t theme-border pt-6 text-sm theme-text-soft md:flex-row md:items-center md:justify-between">
          <p>{locale === "en" ? "Frontend concept for review and refinement." : "Concept frontend để review và tinh chỉnh tiếp."}</p>
          <p>(c) 2026 Attacker Fintech Challenge</p>
        </div>
      </div>
    </footer>
  );
}
