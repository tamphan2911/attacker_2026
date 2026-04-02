"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  Globe2,
  LogOut,
  Mail,
  Menu,
  MoonStar,
  PhoneCall,
  Sparkles,
  SunMedium,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";

import { contactInfo } from "@/data/site-content";
import { pickText } from "@/lib/site";
import type { LocalizedText } from "@/types/site";
import { useSiteState } from "@/components/providers/site-state-provider";
import { BrandMark, GradientAvatar } from "@/components/site-ui";

function cn(...values: Array<string | undefined | false>) {
  return values.filter(Boolean).join(" ");
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M13.5 21v-7h2.35l.4-3h-2.75V9.19c0-.87.24-1.46 1.49-1.46H16.5V5.05c-.26-.03-1.15-.11-2.19-.11-2.17 0-3.66 1.32-3.66 3.75V11H8.2v3h2.45v7h2.85Z" />
    </svg>
  );
}

const primaryNavItems: Array<{
  href: string;
  label: LocalizedText;
  children?: Array<{ href: string; label: LocalizedText }>;
}> = [
  { href: "/", label: { en: "Home", vi: "Trang chủ" } },
  {
    href: "/competition",
    label: { en: "Competition", vi: "Cuộc thi" },
    children: [
      { href: "/competition", label: { en: "Overview", vi: "Tổng quan" } },
      { href: "/rules", label: { en: "Rules & Timeline", vi: "Thể lệ và Lịch trình" } },
      { href: "/competition/faq", label: { en: "FAQ", vi: "FAQ" } },
      { href: "/competition/sponsors", label: { en: "Sponsors", vi: "Nhà tài trợ" } },
      { href: "/competition/judges", label: { en: "Judges", vi: "Giám khảo" } },
    ],
  },
  { href: "/news", label: { en: "News", vi: "Tin tức" } },
  { href: "/dashboard", label: { en: "Team Workspace", vi: "Không gian đội" } },
  { href: "/organizer", label: { en: "Organizer", vi: "Ban tổ chức" } },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { locale, theme, currentUser, setLocale, setTheme, signOutCurrentUser } = useSiteState();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const isLoggedIn = Boolean(currentUser?.id);
  const isProfileRoute = pathname.startsWith("/profile");

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  const toggleLocale = () => {
    const nextLocale = locale === "en" ? "vi" : "en";
    startTransition(() => {
      setLocale(nextLocale);
    });
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const chromeLabel = {
    en: "Attacker 2026",
    vi: "Attacker 2026",
  };

  const topbarStatus = {
    en: "Frontend preview live",
    vi: "Frontend preview đang mở",
  };

  const isActiveRoute = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const isActiveChildRoute = (href: string) => {
    if (href === "/competition") {
      return pathname === href;
    }

    return isActiveRoute(href);
  };

  return (
    <header className="sticky top-0 z-50">
      <div className="theme-topbar">
        <div className="mx-auto max-w-7xl px-4 py-2.5 md:px-8">
          <div className="flex items-center justify-between gap-4 lg:flex-nowrap">
            <div className="flex min-w-0 items-center gap-2.5 overflow-hidden text-white">
              <div className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/12 bg-white/10 px-3.5 py-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-white/92 backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-cyan-200" />
                <span>{pickText(locale, chromeLabel)}</span>
              </div>
              <div className="hidden shrink-0 items-center gap-2 rounded-full border border-emerald-300/18 bg-emerald-300/12 px-3 py-1.5 text-[0.68rem] font-medium uppercase tracking-[0.18em] text-emerald-50 xl:inline-flex">
                <span className="h-2 w-2 rounded-full bg-emerald-300" />
                <span>{pickText(locale, topbarStatus)}</span>
              </div>
            </div>

            <div className="hidden shrink-0 items-center gap-2 md:flex">
              <a
                className="inline-flex h-9 items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3.5 text-[0.72rem] font-medium text-white/84 transition hover:bg-white/14 hover:text-white"
                href={`mailto:${contactInfo.email}`}
                aria-label={contactInfo.email}
              >
                <Mail className="h-3.5 w-3.5 text-cyan-200" />
                <span>{contactInfo.email}</span>
              </a>
              <a
                className="inline-flex h-9 items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3.5 text-[0.72rem] font-medium text-white/84 transition hover:bg-white/14 hover:text-white"
                href={`tel:${contactInfo.phone}`}
              >
                <PhoneCall className="h-3.5 w-3.5 text-cyan-200" />
                <span>{contactInfo.phone}</span>
              </a>
              <a
                className="inline-flex h-9 items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3.5 text-[0.72rem] font-medium text-white/84 transition hover:bg-white/14 hover:text-white"
                href={contactInfo.facebook}
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
              >
                <FacebookIcon className="h-3.5 w-3.5 text-cyan-200" />
                <span>Facebook</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="theme-navbar border-b backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-8">
          <Link href="/" className="shrink-0" onClick={() => setIsOpen(false)}>
            <BrandMark showText={false} />
          </Link>

          <nav className="hidden items-center gap-7 lg:flex">
            {primaryNavItems.map((item) => {
              const isActive =
                isActiveRoute(item.href) ||
                item.children?.some((child) => isActiveRoute(child.href));

              return (
                <div
                  key={item.href}
                  className={cn(
                    "group relative py-2.5 text-sm font-medium transition",
                    isActive
                      ? "text-[var(--text-strong)]"
                      : "theme-text-muted hover:text-[var(--text-strong)]",
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none absolute inset-y-0 -inset-x-3 rounded-full transition duration-200",
                      isActive
                        ? "bg-[rgba(23,114,208,0.1)]"
                        : "bg-[rgba(23,114,208,0.08)] opacity-0 group-hover:opacity-100 group-focus-within:opacity-100",
                    )}
                  />
                  <Link href={item.href} className="relative z-10 inline-flex items-center gap-1.5">
                    <span>{pickText(locale, item.label)}</span>
                    {item.children ? (
                      <ChevronDown className="h-3.5 w-3.5 transition group-hover:translate-y-0.5 group-focus-within:translate-y-0.5" />
                    ) : null}
                  </Link>
                  <span
                    className={cn(
                      "pointer-events-none absolute bottom-0 left-1/2 h-[2px] -translate-x-1/2 rounded-full bg-[var(--brand)] transition-all duration-200",
                      isActive
                        ? "w-full"
                        : "w-0 group-hover:w-full group-focus-within:w-full",
                    )}
                  />

                  {item.children ? (
                    <div className="pointer-events-none absolute left-1/2 top-full z-30 w-56 -translate-x-1/2 pt-3 opacity-0 transition duration-200 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
                      <div className="theme-card-shadow-soft theme-panel-strong rounded-[1.5rem] border theme-border p-2 backdrop-blur-xl">
                        {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                              "block rounded-[1rem] px-4 py-3 text-sm transition",
                              isActiveChildRoute(child.href)
                                ? "bg-[rgba(23,114,208,0.08)] text-[var(--text-strong)]"
                                : "theme-text-body hover:bg-[rgba(23,114,208,0.06)] hover:text-[var(--text-strong)]",
                            )}
                        >
                            {pickText(locale, child.label)}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <button
              type="button"
              onClick={toggleTheme}
              className="theme-panel-strong theme-text-strong inline-flex h-10 w-10 items-center justify-center rounded-full border transition hover:-translate-y-0.5"
              aria-label="Toggle color theme"
            >
              {theme === "dark" ? (
                <SunMedium className="h-4 w-4 text-amber-300" />
              ) : (
                <MoonStar className="h-4 w-4 theme-accent" />
              )}
            </button>
            <button
              type="button"
              onClick={toggleLocale}
              className="theme-panel-strong theme-text-strong inline-flex items-center gap-2 rounded-full border px-3.5 py-2.5 text-sm font-medium transition hover:-translate-y-0.5"
            >
              <Globe2 className="h-4 w-4 theme-accent" />
              <span>{locale === "en" ? "VI" : "EN"}</span>
              {isPending ? <span className="theme-text-soft text-xs">...</span> : null}
            </button>
            {isLoggedIn ? (
              <div ref={profileMenuRef} className="relative">
                <button
                  type="button"
                  aria-label={locale === "en" ? "Open profile menu" : "Mở menu hồ sơ"}
                  aria-haspopup="menu"
                  aria-expanded={isProfileMenuOpen}
                  onClick={() => setIsProfileMenuOpen((current) => !current)}
                  className={cn(
                    "inline-flex items-center justify-center rounded-full p-0.5 transition hover:-translate-y-0.5",
                    isProfileRoute || isProfileMenuOpen
                      ? "bg-[linear-gradient(135deg,rgba(23,114,208,0.92),rgba(14,165,233,0.86))] shadow-[0_12px_32px_rgba(14,165,233,0.24)]"
                      : "border border-white/10 bg-white/20 hover:border-sky-300/26 hover:bg-white/28",
                  )}
                >
                  <GradientAvatar
                    label={currentUser.name}
                    tone={currentUser.avatarTone}
                    imageSrc={currentUser.avatarImageSrc}
                    className="h-10 w-10 rounded-full border border-white/65 bg-slate-900 text-xs"
                  />
                </button>

                {isProfileMenuOpen ? (
                  <div
                    role="menu"
                    className="theme-card-shadow-soft theme-panel-strong absolute right-0 top-full z-40 mt-3 w-64 rounded-[1.6rem] border theme-border p-2 backdrop-blur-xl"
                  >
                    <div className="rounded-[1.2rem] border theme-border bg-[rgba(255,255,255,0.46)] px-4 py-4 dark:bg-[rgba(8,15,30,0.54)]">
                      <div className="flex items-center gap-3">
                        <GradientAvatar
                          label={currentUser.name}
                          tone={currentUser.avatarTone}
                          imageSrc={currentUser.avatarImageSrc}
                          className="h-11 w-11 rounded-full text-xs"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold theme-text-strong">{currentUser.name}</p>
                          <p className="truncate text-xs theme-text-soft">{currentUser.email}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 grid gap-1">
                      <Link
                        href="/profile"
                        role="menuitem"
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="inline-flex items-center gap-3 rounded-[1rem] px-4 py-3 text-sm font-medium theme-text-body transition hover:bg-[rgba(23,114,208,0.08)] hover:text-[var(--text-strong)]"
                      >
                        <UserRound className="h-4 w-4 text-sky-400" />
                        <span>{locale === "en" ? "Profile" : "Hồ sơ"}</span>
                      </Link>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          void signOutCurrentUser();
                        }}
                        className="inline-flex items-center gap-3 rounded-[1rem] px-4 py-3 text-left text-sm font-medium theme-text-body transition hover:bg-[rgba(23,114,208,0.08)] hover:text-[var(--text-strong)]"
                      >
                        <LogOut className="h-4 w-4 text-sky-400" />
                        <span>{locale === "en" ? "Log out" : "Đăng xuất"}</span>
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <Link href="/auth" className="theme-button-primary rounded-full px-5 py-2.5 text-sm font-semibold transition hover:brightness-110">
                {locale === "en" ? "Join today" : "Tham gia ngay"}
              </Link>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsOpen((current) => !current)}
            className="theme-panel-strong theme-text-strong inline-flex h-12 w-12 items-center justify-center rounded-2xl border lg:hidden"
            aria-label="Toggle navigation"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {isOpen ? (
          <div className="border-t theme-border px-4 py-4 lg:hidden">
            <div className="mx-auto flex max-w-7xl flex-col gap-3">
              {primaryNavItems.map((item) => (
                <div key={item.href} className="space-y-2">
                  <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "rounded-2xl px-4 py-3 text-sm font-medium transition",
                    isActiveRoute(item.href)
                      ? "theme-button-primary"
                      : "theme-panel-strong theme-text-body border",
                  )}
                >
                  {pickText(locale, item.label)}
                  </Link>
                  {item.children ? (
                    <div className="grid gap-2 pl-3">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => setIsOpen(false)}
                          className="rounded-2xl border theme-border px-4 py-2.5 text-sm theme-text-muted"
                        >
                          {pickText(locale, child.label)}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
              <div className={cn("grid gap-3 pt-2", isLoggedIn ? "sm:grid-cols-4" : "sm:grid-cols-3")}>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="theme-panel-strong theme-text-strong rounded-2xl border px-4 py-3 text-sm font-medium"
                >
              {theme === "dark"
                    ? locale === "en"
                      ? "Light mode"
                      : "Chế độ sáng"
                    : locale === "en"
                      ? "Dark mode"
                      : "Chế độ tối"}
                </button>
                <button
                  type="button"
                  onClick={toggleLocale}
                  className="theme-panel-strong theme-text-strong rounded-2xl border px-4 py-3 text-sm font-medium"
                >
                  {locale === "en" ? "Chuyển sang Tiếng Việt" : "Switch to English"}
                </button>
                {isLoggedIn ? (
                  <>
                    <Link
                      href="/profile"
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "inline-flex items-center justify-center gap-3 rounded-2xl border px-4 py-3 text-center text-sm font-semibold",
                        isProfileRoute
                          ? "theme-button-primary"
                          : "theme-panel-strong theme-text-strong",
                      )}
                    >
                      <GradientAvatar
                        label={currentUser.name}
                        tone={currentUser.avatarTone}
                        imageSrc={currentUser.avatarImageSrc}
                        className="h-7 w-7 rounded-full text-[10px]"
                      />
                      <span>{locale === "en" ? "Profile" : "Hồ sơ"}</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        void signOutCurrentUser();
                      }}
                      className="theme-panel-strong theme-text-strong inline-flex items-center justify-center gap-3 rounded-2xl border px-4 py-3 text-center text-sm font-semibold"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>{locale === "en" ? "Log out" : "Đăng xuất"}</span>
                    </button>
                  </>
                ) : (
                  <Link
                    href="/auth"
                    onClick={() => setIsOpen(false)}
                    className="theme-button-primary rounded-2xl px-4 py-3 text-center text-sm font-semibold"
                  >
                    {locale === "en" ? "Open Auth" : "Mở Auth"}
                  </Link>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
