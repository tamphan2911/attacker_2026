"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowRight,
  Bell,
  ChevronDown,
  Globe2,
  LogOut,
  Mail,
  Menu,
  MessageCircle,
  MoonStar,
  PhoneCall,
  SunMedium,
  UserRound,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import { pickText } from "@/lib/site";
import type { Locale, LocalizedText } from "@/types/site";
import { useSiteState } from "@/components/providers/site-state-provider";
import { BrandMarkInner, GradientAvatar } from "@/components/site-ui";

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

function HeaderTooltip({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="group relative inline-flex">
      {children}
      <span className="theme-header-tooltip pointer-events-none absolute left-1/2 top-full z-40 mt-3 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1.5 text-[0.68rem] font-medium opacity-0 transition duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
        {label}
      </span>
    </div>
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
      { href: "/rules", label: { en: "Rules", vi: "Thể lệ" } },
      { href: "/competition/timeline", label: { en: "Timeline", vi: "Lịch trình" } },
      { href: "/competition/sponsors", label: { en: "Sponsors", vi: "Nhà tài trợ" } },
      { href: "/competition/judges", label: { en: "Judges", vi: "Giám khảo" } },
      { href: "/competition/faq", label: { en: "FAQ", vi: "FAQ" } },
    ],
  },
  { href: "/news", label: { en: "News", vi: "Tin tức" } },
  { href: "/forum", label: { en: "Forum", vi: "Diễn đàn" } },
  { href: "/dashboard", label: { en: "Team Workspace", vi: "Đội thi" } },
  { href: "/contact", label: { en: "Contact", vi: "Liên hệ" } },
];

type HeaderNotificationItem = {
  id: string;
  type: "message" | "team-invitation";
  title: string;
  description: string;
  href: string;
  createdAt: string;
  count: number;
  meta?: {
    senderName?: string;
    teamTag?: string;
    isMessageRequest?: boolean;
    isOrganizer?: boolean;
    isTeamRemoval?: boolean;
  };
};

function formatNotificationTime(locale: Locale, value: string) {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "vi-VN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function NotificationMenu({
  isLoggedIn,
  locale,
}: {
  isLoggedIn: boolean;
  locale: Locale;
}) {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [items, setItems] = useState<HeaderNotificationItem[]>([]);

  const refreshNotifications = useCallback(async () => {
    if (!isLoggedIn) {
      setUnreadCount(0);
      setItems([]);
      return;
    }

    const response = await fetch("/api/notifications", {
      cache: "no-store",
      credentials: "same-origin",
    });

    if (!response.ok) {
      return;
    }

    const payload = (await response.json()) as {
      unreadCount: number;
      items: HeaderNotificationItem[];
    };
    setUnreadCount(payload.unreadCount);
    setItems(payload.items);
  }, [isLoggedIn]);

  useEffect(() => {
    queueMicrotask(() => {
      void refreshNotifications();
    });
  }, [refreshNotifications]);

  useEffect(() => {
    if (!isLoggedIn) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void refreshNotifications();
    }, 10000);
    const handleRefresh = () => void refreshNotifications();

    window.addEventListener("focus", handleRefresh);
    window.addEventListener("attacker-notifications-refresh", handleRefresh);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleRefresh);
      window.removeEventListener("attacker-notifications-refresh", handleRefresh);
    };
  }, [isLoggedIn, refreshNotifications]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  if (!isLoggedIn) {
    return null;
  }

  const handleButtonClick = () => {
    if (unreadCount <= 0) {
      router.push("/messages");
      return;
    }

    setIsOpen((current) => !current);
  };

  const getItemDescription = (item: HeaderNotificationItem) => {
    if (item.type === "team-invitation") {
      return locale === "en"
        ? `${item.meta?.senderName ?? "A team leader"} invited you to join ${item.title}.`
        : `${item.meta?.senderName ?? "Một đội trưởng"} đã mời bạn vào đội ${item.title}.`;
    }

    if (item.meta?.isTeamRemoval) {
      const lines = item.description.split("\n").map((line) => line.trim()).filter(Boolean);
      const localizedLines = locale === "en" ? lines.slice(1, 3) : lines.slice(4, 6);
      return localizedLines.length > 0 ? localizedLines.join(" ") : item.description;
    }

    if (item.meta?.isMessageRequest) {
      return locale === "en"
        ? `First message request: ${item.description}`
        : `Yêu cầu nhắn tin đầu tiên: ${item.description}`;
    }

    if (item.meta?.isOrganizer) {
      return locale === "en"
        ? `Organizer support message: ${item.description}`
        : `Tin nhắn hỗ trợ từ ban tổ chức: ${item.description}`;
    }

    return item.description;
  };

  const getItemTitle = (item: HeaderNotificationItem) => {
    if (item.type === "message" && item.meta?.isTeamRemoval) {
      return locale === "en" ? "Team removal notice" : "Thông báo rời đội";
    }

    if (item.type === "message" && item.meta?.isMessageRequest) {
      return locale === "en"
        ? `Message request from ${item.meta?.senderName ?? item.title}`
        : `Yêu cầu nhắn tin từ ${item.meta?.senderName ?? item.title}`;
    }

    if (item.type === "message" && item.meta?.isOrganizer) {
      return locale === "en"
        ? `Organizer support · ${item.meta?.senderName ?? item.title}`
        : `Hỗ trợ ban tổ chức · ${item.meta?.senderName ?? item.title}`;
    }

    return item.title;
  };

  const getItemBadgeLabel = (item: HeaderNotificationItem) => {
    if (item.type === "message") {
      if (item.meta?.isTeamRemoval) {
        return locale === "en" ? "Team update" : "Cập nhật đội";
      }

      if (item.meta?.isMessageRequest) {
        return locale === "en" ? "Message request" : "Yêu cầu nhắn tin";
      }

      return locale === "en" ? `${item.count} unread` : `${item.count} chưa đọc`;
    }

    return locale === "en" ? "Invite" : "Lời mời";
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={handleButtonClick}
        className="theme-panel-strong theme-text-strong relative inline-flex h-10 w-10 items-center justify-center rounded-full border transition hover:-translate-y-0.5"
        aria-label={locale === "en" ? "Open notifications" : "Mở thông báo"}
        aria-haspopup={unreadCount > 0 ? "menu" : undefined}
        aria-expanded={unreadCount > 0 ? isOpen : undefined}
      >
        <Bell className="h-4 w-4 theme-accent" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1.5 -top-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-white bg-[linear-gradient(135deg,#fb7185,#f97316)] px-1 text-[0.65rem] font-bold leading-none text-white shadow-[0_12px_24px_rgba(249,115,22,0.34)]">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen && unreadCount > 0 ? (
        <div
          role="menu"
          className="theme-card-shadow-soft theme-profile-menu absolute right-0 top-full z-50 mt-3 w-[23rem] max-w-[calc(100vw-1rem)] overflow-hidden rounded-[1.6rem] border p-2 backdrop-blur-2xl"
        >
          <div className="px-3 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] theme-eyebrow">
              {locale === "en" ? "Notifications" : "Thông báo"}
            </p>
          </div>
          <div className="max-h-[22rem] overflow-y-auto">
            {items.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                role="menuitem"
                onClick={() => setIsOpen(false)}
                className={cn(
                  "grid gap-1 rounded-[1.1rem] border px-3 py-3 transition hover:bg-[rgba(23,114,208,0.08)] dark:hover:bg-[rgba(88,196,255,0.12)]",
                  item.meta?.isTeamRemoval
                    ? "border-rose-300/36 bg-rose-400/10"
                    : item.meta?.isMessageRequest
                    ? "border-amber-300/34 bg-amber-400/10"
                    : item.meta?.isOrganizer
                      ? "border-cyan-300/28 bg-cyan-400/10"
                      : "border-transparent",
                )}
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="truncate text-sm font-semibold theme-text-strong">{getItemTitle(item)}</span>
                  <span
                    className={cn(
                      "shrink-0 rounded-full border px-2 py-0.5 text-[0.65rem] font-semibold",
                      item.meta?.isTeamRemoval
                        ? "border-rose-400/42 bg-[linear-gradient(135deg,rgba(251,113,133,0.24),rgba(244,63,94,0.18))] text-rose-900 dark:text-rose-100"
                        : item.meta?.isMessageRequest
                        ? "border-amber-400/45 bg-[linear-gradient(135deg,rgba(251,191,36,0.28),rgba(249,115,22,0.18))] text-amber-950 dark:text-amber-100"
                        : item.meta?.isOrganizer
                          ? "border-cyan-300/34 bg-cyan-400/14 text-cyan-800 dark:text-cyan-100"
                          : "theme-border bg-white/50 theme-text-soft dark:bg-white/6",
                    )}
                  >
                    {getItemBadgeLabel(item)}
                  </span>
                </span>
                <span className="line-clamp-2 text-xs leading-5 theme-text-muted">{getItemDescription(item)}</span>
                <span className="text-[0.68rem] font-medium theme-text-faint">
                  {formatNotificationTime(locale, item.createdAt)}
                </span>
              </Link>
            ))}
          </div>
          <Link
            href="/messages"
            onClick={() => setIsOpen(false)}
            className="mt-2 flex items-center justify-center gap-2 rounded-[1.1rem] border theme-border theme-panel-subtle px-3 py-3 text-sm font-semibold theme-text-strong transition hover:border-sky-300/28"
          >
            {locale === "en" ? "Open message center" : "Mở trung tâm tin nhắn"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : null}
    </div>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const { locale, pageContent, theme, currentUser, setLocale, setTheme, signOutCurrentUser } = useSiteState();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [openDesktopDropdownHref, setOpenDesktopDropdownHref] = useState<string | null>(null);
  const [openMobileDropdownHref, setOpenMobileDropdownHref] = useState<string | null>(null);
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

  const topbarSlogan = pageContent.siteHeader.slogan;
  const topbarEmail = pageContent.siteHeader.email.trim();
  const topbarPhone = pageContent.siteHeader.phone.trim();
  const topbarFacebookLabel = pickText(locale, pageContent.siteHeader.facebookLabel);
  const topbarFacebookUrl = pageContent.siteHeader.facebookUrl.trim();
  const topbarSupportLabel = locale === "en" ? "Support message" : "Nhắn hỗ trợ";

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

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const topbarContactWrapClass =
    "inline-flex items-center overflow-hidden rounded-full border border-white/18 bg-slate-950/24 shadow-[0_12px_30px_rgba(2,8,20,0.18)] ring-1 ring-white/10 backdrop-blur-md dark:border-white/12 dark:bg-[rgba(255,255,255,0.09)] dark:shadow-[0_12px_30px_rgba(2,8,20,0.16)]";
  const topbarContactLinkClass =
    "topbar-contact-link inline-flex h-8 items-center gap-2 bg-white/[0.08] px-3 text-[0.68rem] font-semibold text-white transition hover:bg-white/[0.16] hover:text-white md:text-[0.7rem]";
  const topbarContactIconClass = "topbar-contact-icon h-3.5 w-3.5 text-white";
  const topbarContactDividerClass = "h-4 w-px bg-white/20";

  return (
    <header className="sticky top-0 z-50">
      <div className="theme-topbar">
        <div className="mx-auto max-w-7xl px-4 py-2 md:px-8">
          <div className="flex items-center justify-between gap-4 overflow-hidden lg:flex-nowrap">
            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="truncate text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-white/92 md:text-[0.72rem] md:tracking-[0.24em]">
                {pickText(locale, topbarSlogan)}
              </p>
            </div>

            <div className="hidden shrink-0 items-center md:flex">
              <div className={topbarContactWrapClass}>
                <Link
                  className={topbarContactLinkClass}
                  href="/messages?organizer=1"
                  aria-label={topbarSupportLabel}
                >
                  <MessageCircle className={topbarContactIconClass} />
                  <span>{topbarSupportLabel}</span>
                </Link>
                <span className={topbarContactDividerClass} />
                <a
                  className={topbarContactLinkClass}
                  href={`mailto:${topbarEmail}`}
                  aria-label={topbarEmail}
                >
                  <Mail className={topbarContactIconClass} />
                  <span>{topbarEmail}</span>
                </a>
                <span className={topbarContactDividerClass} />
                <a
                  className={topbarContactLinkClass}
                  href={`tel:${topbarPhone}`}
                >
                  <PhoneCall className={topbarContactIconClass} />
                  <span>{topbarPhone}</span>
                </a>
                <span className={cn("hidden xl:block", topbarContactDividerClass)} />
                <a
                  className={cn("hidden xl:inline-flex", topbarContactLinkClass)}
                  href={topbarFacebookUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={topbarFacebookLabel}
                >
                  <FacebookIcon className={topbarContactIconClass} />
                  <span>{topbarFacebookLabel}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="theme-navbar relative border-b backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-8">
          <Link href="/" className="group min-w-0 shrink-0" onClick={() => setIsOpen(false)}>
            <span className="sm:hidden">
              <BrandMarkInner showText={false} showIcon variant="header" />
            </span>
            <span className="hidden sm:block">
              <BrandMarkInner showText showIcon={false} variant="header" />
            </span>
          </Link>

          <nav className="hidden items-center gap-7 lg:flex">
            {primaryNavItems.map((item) => {
              const isActive =
                isActiveRoute(item.href) ||
                item.children?.some((child) => isActiveRoute(child.href));
              const isDesktopDropdownOpen = openDesktopDropdownHref === item.href;

              return (
                <div
                  key={item.href}
                  className={cn(
                    "group relative py-2.5 text-sm font-medium transition",
                    isActive
                      ? "text-[var(--text-strong)]"
                      : "theme-text-muted hover:text-[var(--text-strong)]",
                  )}
                  onMouseEnter={() => {
                    if (item.children) {
                      setOpenDesktopDropdownHref(item.href);
                    }
                  }}
                  onMouseLeave={() => {
                    if (item.children) {
                      setOpenDesktopDropdownHref((current) => (current === item.href ? null : current));
                    }
                  }}
                  onFocusCapture={() => {
                    if (item.children) {
                      setOpenDesktopDropdownHref(item.href);
                    }
                  }}
                  onBlurCapture={(event) => {
                    if (item.children && !event.currentTarget.contains(event.relatedTarget as Node | null)) {
                      setOpenDesktopDropdownHref((current) => (current === item.href ? null : current));
                    }
                  }}
                >
                  <span
                    className={cn(
                      "pointer-events-none absolute inset-y-0 -inset-x-3 rounded-full transition duration-200",
                      isActive
                        ? "bg-[rgba(23,114,208,0.1)]"
                        : "bg-[rgba(23,114,208,0.08)] opacity-0 group-hover:opacity-100 group-focus-within:opacity-100",
                    )}
                  />
                  <Link
                    href={item.href}
                    onClick={() => setOpenDesktopDropdownHref(null)}
                    className="relative z-10 inline-flex items-center gap-1.5"
                  >
                    <span>{pickText(locale, item.label)}</span>
                    {item.children ? (
                      <ChevronDown
                        className={cn(
                          "h-3.5 w-3.5 transition",
                          isDesktopDropdownOpen ? "translate-y-0.5" : "group-hover:translate-y-0.5 group-focus-within:translate-y-0.5",
                        )}
                      />
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
                    <div
                      className={cn(
                        "absolute left-1/2 top-full z-30 w-56 -translate-x-1/2 pt-3 transition duration-200",
                        isDesktopDropdownOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
                      )}
                    >
                      <div className="theme-card-shadow-soft theme-nav-dropdown rounded-[1.5rem] border theme-border p-2 backdrop-blur-xl">
                        {item.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => setOpenDesktopDropdownHref(null)}
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
            <NotificationMenu isLoggedIn={isLoggedIn} locale={locale} />
            <HeaderTooltip
              label={
                theme === "dark"
                  ? locale === "en"
                    ? "Switch to light mode"
                    : "Chuyển sang chế độ sáng"
                  : locale === "en"
                    ? "Switch to dark mode"
                    : "Chuyển sang chế độ tối"
              }
            >
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
            </HeaderTooltip>
            <HeaderTooltip
              label={
                locale === "en"
                  ? "Switch to Vietnamese"
                  : "Chuyển sang tiếng Anh"
              }
            >
              <button
                type="button"
                onClick={toggleLocale}
                className="theme-panel-strong theme-text-strong inline-flex items-center gap-2 rounded-full border px-3.5 py-2.5 text-sm font-medium transition hover:-translate-y-0.5"
              >
                <Globe2 className="h-4 w-4 theme-accent" />
                <span>{locale === "en" ? "VI" : "EN"}</span>
                {isPending ? <span className="theme-text-soft text-xs">...</span> : null}
              </button>
            </HeaderTooltip>
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
                    className="theme-card-shadow-soft theme-profile-menu absolute right-0 top-full z-40 mt-3 w-[20rem] max-w-[calc(100vw-1rem)] rounded-[1.6rem] border p-3 backdrop-blur-2xl"
                  >
                    <div className="theme-profile-summary rounded-[1.2rem] border px-4 py-4">
                      <div className="flex items-center gap-3">
                        <GradientAvatar
                          label={currentUser.name}
                          tone={currentUser.avatarTone}
                          imageSrc={currentUser.avatarImageSrc}
                          className="h-11 w-11 rounded-full text-xs"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold leading-5 theme-text-strong">{currentUser.name}</p>
                          <p className="mt-1 break-all text-xs leading-5 theme-text-soft">{currentUser.email}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 grid gap-1.5">
                      <Link
                        href="/profile"
                        role="menuitem"
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="inline-flex items-center gap-3 rounded-[1rem] px-4 py-3 text-sm font-medium theme-text-body transition hover:bg-[rgba(23,114,208,0.08)] hover:text-[var(--text-strong)] dark:hover:bg-[rgba(88,196,255,0.12)]"
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
                        className="inline-flex items-center gap-3 rounded-[1rem] px-4 py-3 text-left text-sm font-medium theme-text-body transition hover:bg-[rgba(23,114,208,0.08)] hover:text-[var(--text-strong)] dark:hover:bg-[rgba(88,196,255,0.12)]"
                      >
                        <LogOut className="h-4 w-4 text-sky-400" />
                        <span>{locale === "en" ? "Log out" : "Đăng xuất"}</span>
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <Link
                href="/auth"
                className="theme-button-primary inline-flex min-w-[9.75rem] items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold whitespace-nowrap transition hover:brightness-110"
              >
                {locale === "en" ? "Log in" : "Đăng nhập"}
              </Link>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setIsOpen((current) => !current);
              setOpenMobileDropdownHref(null);
              setIsProfileMenuOpen(false);
            }}
            className={cn(
              "theme-panel-strong theme-text-strong inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border transition lg:hidden",
              isOpen ? "shadow-[0_16px_36px_rgba(23,114,208,0.18)]" : "hover:-translate-y-0.5",
            )}
            aria-label={locale === "en" ? "Toggle navigation" : "Mở menu điều hướng"}
            aria-expanded={isOpen}
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {isOpen ? (
          <div className="absolute left-0 right-0 top-full z-40 min-h-[calc(100dvh-7.25rem)] border-t theme-border bg-[rgba(239,247,255,0.94)] px-3 py-3 shadow-[0_28px_70px_rgba(13,37,66,0.18)] backdrop-blur-2xl dark:bg-[rgba(7,18,35,0.94)] lg:hidden">
            <div className="mx-auto max-h-[calc(100dvh-7.25rem)] max-w-md overflow-y-auto overscroll-contain pr-1">
              <div className="grid gap-2 pb-3">
                {primaryNavItems.map((item) => {
                  const isActive =
                    isActiveRoute(item.href) ||
                    item.children?.some((child) => isActiveRoute(child.href));
                  const isDropdownOpen = openMobileDropdownHref === item.href;
                  const itemLabel = pickText(locale, item.label);

                  if (item.children) {
                    return (
                      <div key={item.href} className="theme-panel-strong rounded-[1.25rem] border p-1.5">
                        <div className="flex items-stretch gap-1.5">
                          <Link
                            href={item.href}
                            onClick={() => setIsOpen(false)}
                            className={cn(
                              "flex min-h-12 flex-1 items-center rounded-[1rem] px-4 text-sm font-semibold transition",
                              isActive
                                ? "theme-button-primary"
                                : "theme-text-strong hover:bg-[rgba(23,114,208,0.08)]",
                            )}
                          >
                            {itemLabel}
                          </Link>
                          <button
                            type="button"
                            onClick={() =>
                              setOpenMobileDropdownHref((current) =>
                                current === item.href ? null : item.href,
                              )
                            }
                            className="theme-panel-subtle inline-flex min-h-12 w-12 shrink-0 items-center justify-center rounded-[1rem] border theme-border transition hover:bg-[rgba(23,114,208,0.08)]"
                            aria-label={
                              locale === "en"
                                ? `Toggle ${itemLabel} links`
                                : `Mở liên kết ${itemLabel}`
                            }
                            aria-expanded={isDropdownOpen}
                          >
                            <ChevronDown className={cn("h-4 w-4 transition duration-200", isDropdownOpen && "rotate-180")} />
                          </button>
                        </div>

                        <div
                          className={cn(
                            "grid transition-all duration-300 ease-out",
                            isDropdownOpen ? "mt-1.5 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                          )}
                        >
                          <div className="overflow-hidden">
                            <div className="grid gap-1 border-t theme-border px-1.5 pt-1.5">
                              {item.children.map((child) => (
                                <Link
                                  key={child.href}
                                  href={child.href}
                                  onClick={() => setIsOpen(false)}
                                  className={cn(
                                    "flex min-h-11 items-center justify-between rounded-[0.95rem] px-3.5 text-sm font-medium transition",
                                    isActiveChildRoute(child.href)
                                      ? "bg-[rgba(23,114,208,0.1)] text-[var(--text-strong)]"
                                      : "theme-text-muted hover:bg-[rgba(23,114,208,0.07)] hover:text-[var(--text-strong)]",
                                  )}
                                >
                                  <span>{pickText(locale, child.label)}</span>
                                  <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                                </Link>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "theme-panel-strong flex min-h-13 items-center justify-between rounded-[1.25rem] border px-4 text-sm font-semibold transition",
                        isActive
                          ? "theme-button-primary"
                          : "theme-text-strong hover:-translate-y-0.5 hover:bg-[rgba(23,114,208,0.08)]",
                      )}
                    >
                      <span>{itemLabel}</span>
                      <ArrowRight className="h-4 w-4 shrink-0" />
                    </Link>
                  );
                })}
              </div>

              <div className="grid gap-2 border-t theme-border pt-3">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="theme-panel-strong theme-text-strong inline-flex min-h-12 items-center justify-center gap-2 rounded-[1.1rem] border px-3 text-sm font-semibold"
                  >
                    {theme === "dark" ? (
                      <SunMedium className="h-4 w-4 text-amber-300" />
                    ) : (
                      <MoonStar className="h-4 w-4 theme-accent" />
                    )}
                    <span>
                      {theme === "dark"
                        ? locale === "en"
                          ? "Light"
                          : "Sáng"
                        : locale === "en"
                          ? "Dark"
                          : "Tối"}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={toggleLocale}
                    className="theme-panel-strong theme-text-strong inline-flex min-h-12 items-center justify-center gap-2 rounded-[1.1rem] border px-3 text-sm font-semibold"
                  >
                    <Globe2 className="h-4 w-4 theme-accent" />
                    <span>{locale === "en" ? "VI" : "EN"}</span>
                    {isPending ? <span className="theme-text-soft text-xs">...</span> : null}
                  </button>
                </div>

                {isLoggedIn ? (
                  <div className="grid gap-2">
                    <Link
                      href="/messages"
                      onClick={() => setIsOpen(false)}
                      className="theme-panel-strong theme-text-strong inline-flex min-h-12 items-center justify-center gap-2 rounded-[1.1rem] border px-4 text-center text-sm font-semibold"
                    >
                      <Bell className="h-4 w-4 theme-accent" />
                      <span>{locale === "en" ? "Messages" : "Tin nhắn"}</span>
                    </Link>
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href="/profile"
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          "inline-flex min-h-12 items-center justify-center gap-2 rounded-[1.1rem] border px-3 text-center text-sm font-semibold",
                          isProfileRoute ? "theme-button-primary" : "theme-panel-strong theme-text-strong",
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
                        className="theme-panel-strong theme-text-strong inline-flex min-h-12 items-center justify-center gap-2 rounded-[1.1rem] border px-3 text-center text-sm font-semibold"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>{locale === "en" ? "Log out" : "Đăng xuất"}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <Link
                    href="/auth"
                    onClick={() => setIsOpen(false)}
                    className="theme-button-primary inline-flex min-h-12 items-center justify-center rounded-[1.1rem] px-4 text-center text-sm font-semibold"
                  >
                    {locale === "en" ? "Log in" : "Đăng nhập"}
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
