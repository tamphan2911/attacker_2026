"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Archive,
  CalendarClock,
  ClipboardCheck,
  ClipboardList,
  FilePenLine,
  FileQuestion,
  Files,
  FileText,
  Gauge,
  Handshake,
  Images,
  Landmark,
  LayoutDashboard,
  ListChecks,
  Mail,
  MessageCircle,
  MessageSquare,
  Newspaper,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  TableProperties,
  Trophy,
  UserCheck,
  Users,
  Users2,
  type LucideIcon,
} from "lucide-react";

import { pickText } from "@/lib/site";
import {
  getSeasonContentYears,
  getSeasonSlotDisplayYear,
} from "@/components/admin-season-content-editor";
import { useSiteState } from "@/components/providers/site-state-provider";
import { SectionHeading, Surface } from "@/components/site-ui";
import type { LocalizedText } from "@/types/site";

function cn(...values: Array<string | undefined | false>) {
  return values.filter(Boolean).join(" ");
}

type AdminNavItem = {
  href: string;
  icon: LucideIcon;
  label: LocalizedText;
  description: LocalizedText;
  adminOnly?: boolean;
  children?: Array<{ href: string; icon: LucideIcon; label: LocalizedText }>;
};

const adminNavGroups: Array<{
  label: LocalizedText;
  items: AdminNavItem[];
}> = [
  {
    label: { en: "Overview", vi: "Tổng quan" },
    items: [
      {
        href: "/admin",
        icon: LayoutDashboard,
        label: { en: "Dashboard", vi: "Bảng điều khiển" },
        description: { en: "Summary and admin entry point", vi: "Tổng hợp và điểm vào admin" },
      },
    ],
  },
  {
    label: { en: "Editorial", vi: "Nội dung" },
    items: [
      {
        href: "/admin/content",
        icon: FilePenLine,
        label: { en: "Content", vi: "Nội dung" },
        description: { en: "Page copy and reusable content", vi: "Copy trang và nội dung dùng chung" },
        children: [
          { href: "/admin/content", icon: FileText, label: { en: "Pages & types", vi: "Trang và nhóm nội dung" } },
          { href: "/admin/content/sponsors", icon: Handshake, label: { en: "Sponsors", vi: "Nhà tài trợ" } },
        ],
      },
      {
        href: "/admin/seasons",
        icon: Landmark,
        label: { en: "Seasons", vi: "Mùa thi" },
        description: { en: "Independent season archive editor", vi: "Trình chỉnh sửa mùa thi độc lập" },
        children: [
          { href: "/admin/seasons", icon: Archive, label: { en: "Season list", vi: "Danh sách mùa thi" } },
          { href: "/admin/seasons/2023", icon: CalendarClock, label: { en: "Season 2023", vi: "Mùa 2023" } },
          { href: "/admin/seasons/2024", icon: CalendarClock, label: { en: "Season 2024", vi: "Mùa 2024" } },
          { href: "/admin/seasons/2025", icon: CalendarClock, label: { en: "Season 2025", vi: "Mùa 2025" } },
          { href: "/admin/seasons/2026", icon: CalendarClock, label: { en: "Season 2026", vi: "Mùa 2026" } },
        ],
      },
      {
        href: "/admin/news",
        icon: Newspaper,
        label: { en: "News", vi: "Tin tức" },
        description: { en: "Newsroom articles", vi: "Bài viết newsroom" },
        children: [
          { href: "/admin/news", icon: ClipboardList, label: { en: "Article list", vi: "Danh sách bài viết" } },
        ],
      },
    ],
  },
  {
    label: { en: "System", vi: "Hệ thống" },
    items: [
      {
        href: "/admin/users",
        icon: Users,
        label: { en: "Users", vi: "Người dùng" },
        description: { en: "Participant records", vi: "Hồ sơ thí sinh" },
        children: [
          { href: "/admin/users", icon: Users, label: { en: "Participant list", vi: "Danh sách thí sinh" } },
          { href: "/admin/judges", icon: UserCheck, label: { en: "Judge", vi: "Giám khảo" } },
          { href: "/admin/organizer-team", icon: ShieldCheck, label: { en: "Organizer team", vi: "Ban tổ chức" } },
        ],
      },
      {
        href: "/admin/messages",
        icon: MessageCircle,
        label: { en: "Messages", vi: "Tin nhắn" },
        description: { en: "Conversation moderation", vi: "Quản lý cuộc trò chuyện" },
        children: [
          { href: "/admin/messages", icon: MessageCircle, label: { en: "Conversation list", vi: "Danh sách cuộc trò chuyện" } },
        ],
      },
      {
        href: "/admin/teams",
        icon: Users2,
        label: { en: "Teams", vi: "Đội thi" },
        description: { en: "Teams and roster status", vi: "Đội thi và trạng thái đội hình" },
        children: [
          { href: "/admin/teams", icon: Users2, label: { en: "Team list", vi: "Danh sách đội thi" } },
        ],
      },
      {
        href: "/admin/email-templates",
        icon: Mail,
        label: { en: "Email templates", vi: "Mẫu email" },
        description: { en: "Activation and password-reset email copy", vi: "Nội dung email kích hoạt và đặt lại mật khẩu" },
        adminOnly: true,
        children: [
          { href: "/admin/email-templates", icon: Mail, label: { en: "System email templates", vi: "Mẫu email hệ thống" } },
        ],
      },
      {
        href: "/admin/timeline",
        icon: CalendarClock,
        label: { en: "Timeline", vi: "Lịch trình" },
        description: { en: "Official dates for each timeline step", vi: "Ngày chính thức cho từng bước lịch trình" },
        adminOnly: true,
        children: [
          { href: "/admin/timeline", icon: CalendarClock, label: { en: "Timeline schedule", vi: "Lịch trình chính thức" } },
        ],
      },
      {
        href: "/admin/storage/images",
        icon: Images,
        label: { en: "Images", vi: "Hình ảnh" },
        description: { en: "Uploaded image storage", vi: "Storage hình ảnh đã tải lên" },
        adminOnly: true,
        children: [
          { href: "/admin/storage/images", icon: Images, label: { en: "Uploaded images", vi: "Hình ảnh đã tải lên" } },
        ],
      },
      {
        href: "/admin/storage/submission-files",
        icon: Files,
        label: { en: "PDF files", vi: "Tệp PDF" },
        description: { en: "Team submission uploads", vi: "PDF bài nộp của đội" },
        adminOnly: true,
        children: [
          { href: "/admin/storage/submission-files", icon: Files, label: { en: "Submission PDFs", vi: "PDF bài nộp" } },
        ],
      },
    ],
  },
  {
    label: { en: "Operations", vi: "Vận hành" },
    items: [
      {
        href: "/admin/round-1",
        icon: FileQuestion,
        label: { en: "Round 1", vi: "Vòng 1" },
        description: { en: "Banks, scores, and review", vi: "Ngân hàng đề, điểm số và chấm bài" },
        children: [
          { href: "/admin/round-1", icon: FileQuestion, label: { en: "Round 1 test bank", vi: "Ngân hàng đề Vòng 1" } },
          { href: "/admin/round-1/scores", icon: Trophy, label: { en: "Round 1 scores", vi: "Điểm Vòng 1" } },
          { href: "/admin/round-1/exams", icon: ClipboardCheck, label: { en: "Round 1 attempt", vi: "Lượt thi Vòng 1" } },
        ],
      },
      {
        href: "/admin/submissions",
        icon: TableProperties,
        label: { en: "Round 2", vi: "Vòng 2" },
        description: { en: "Round 2 submission review", vi: "Rà soát bài nộp Vòng 2" },
        children: [
          { href: "/admin/submissions", icon: TableProperties, label: { en: "Round 2 submissions", vi: "Bài nộp Vòng 2" } },
          { href: "/admin/submissions/scores", icon: Trophy, label: { en: "Round 2 scores", vi: "Điểm Vòng 2" } },
          { href: "/admin/submissions/gpt-scores", icon: Gauge, label: { en: "GPT scores", vi: "Điểm GPT" } },
          { href: "/admin/submissions/rubrics", icon: ListChecks, label: { en: "Rubric", vi: "Rubric" } },
          { href: "/admin/submissions/round-3", icon: FileText, label: { en: "Final/Emerging submissions", vi: "Bài nộp chung kết/Đội ươm mầm" } },
        ],
      },
      {
        href: "/admin/forum",
        icon: MessageSquare,
        label: { en: "Forum", vi: "Diễn đàn" },
        description: { en: "Thread moderation", vi: "Quản lý thảo luận" },
        children: [
          { href: "/admin/forum", icon: MessageSquare, label: { en: "Thread list", vi: "Danh sách chủ đề" } },
        ],
      },
    ],
  },
];

function isActiveRoute(pathname: string, href: string) {
  if (href === "/admin") {
    return pathname === "/admin";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function getActiveChildHref(
  pathname: string,
  children: Array<{ href: string; icon: LucideIcon; label: LocalizedText }> | undefined,
) {
  if (!children?.length) {
    return null;
  }

  const activeChildren = children.filter((child) => isActiveRoute(pathname, child.href));
  if (!activeChildren.length) {
    return null;
  }

  return activeChildren.sort((left, right) => right.href.length - left.href.length)[0]?.href ?? null;
}

function AccessDenied() {
  const { locale, currentUser } = useSiteState();

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow={locale === "en" ? "Admin mode" : "Chế độ admin"}
        title={
          locale === "en"
            ? "This route is restricted to admin and moderator accounts."
            : "Route này chỉ dành cho tài khoản admin và moderator."
        }
        description={
          locale === "en"
            ? currentUser.id
              ? `The current signed-in account is ${currentUser.name} (${currentUser.role}). Sign in with an admin or moderator account to open /admin.`
              : "You are not signed in. Sign in with an admin or moderator account to open /admin."
            : currentUser.id
              ? `Tài khoản đang đăng nhập hiện tại là ${currentUser.name} (${currentUser.role}). Hãy đăng nhập bằng tài khoản admin hoặc moderator để mở /admin.`
              : "Bạn chưa đăng nhập. Hãy đăng nhập bằng tài khoản admin hoặc moderator để mở /admin."
        }
      />

      <Surface className="px-6 py-6 md:px-8 md:py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-lg font-semibold theme-text-strong">
              {locale === "en" ? "Need the sign-in page?" : "Cần tới trang đăng nhập?"}
            </p>
            <p className="mt-2 text-sm leading-7 theme-text-muted">
              {locale === "en"
                ? "Use the normal sign-in page and log in with an admin or moderator account."
                : "Hãy dùng trang đăng nhập thông thường và đăng nhập bằng tài khoản admin hoặc moderator."}
            </p>
          </div>
          <Link
            href="/auth"
            className="theme-button-primary inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
          >
            {locale === "en" ? "Open sign in" : "Mở đăng nhập"}
          </Link>
        </div>
      </Surface>
    </div>
  );
}

export function AdminModeLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { locale, canAccessAdminMode, currentUser, pageContent } = useSiteState();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  if (!canAccessAdminMode) {
    return <AccessDenied />;
  }

  const navGroups = adminNavGroups.map((group) => ({
    ...group,
    items: group.items.map((item) => {
      if (item.href !== "/admin/seasons") {
        return item;
      }

      return {
        ...item,
        children: [
          { href: "/admin/seasons", icon: Archive, label: { en: "Season list", vi: "Danh sách mùa thi" } },
          ...getSeasonContentYears(pageContent).map((slotYear) => {
            const displayYear = getSeasonSlotDisplayYear(pageContent, slotYear);
            return {
              href: `/admin/seasons/${encodeURIComponent(slotYear)}`,
              icon: CalendarClock,
              label: {
                en: `Season ${displayYear}`,
                vi: `Mùa ${displayYear}`,
              },
            };
          }),
        ],
      };
    }),
  }));

  return (
    <div
      className={cn(
        "grid gap-6 transition-[grid-template-columns] duration-300 ease-out xl:grid",
        isSidebarCollapsed
          ? "xl:grid-cols-[84px_minmax(0,1fr)]"
          : "xl:grid-cols-[280px_minmax(0,1fr)]",
      )}
    >
      <aside className="xl:sticky xl:top-24 xl:self-start">
        <Surface
          className={cn(
            "overflow-visible px-3 py-3 transition-all duration-300 ease-out",
            isSidebarCollapsed ? "md:px-2" : "md:px-5",
          )}
        >
          <div
            className={cn(
              "flex items-center rounded-[1.35rem] border border-white/12 bg-[linear-gradient(135deg,#0b3158_0%,#105892_52%,#1772d0_100%)] text-white shadow-[0_24px_44px_rgba(11,49,88,0.18)] transition-all duration-300 ease-out",
              isSidebarCollapsed ? "justify-center px-2 py-2" : "justify-between gap-3 px-4 py-3",
            )}
          >
            {!isSidebarCollapsed ? (
              <p className="min-w-0 truncate text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-white/88">
                {locale === "en" ? "Admin mode" : "Chế độ admin"}
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed((current) => !current)}
              aria-label={
                isSidebarCollapsed
                  ? locale === "en"
                    ? "Expand admin sidebar"
                    : "Mở rộng thanh admin"
                  : locale === "en"
                    ? "Collapse admin sidebar"
                    : "Thu gọn thanh admin"
              }
              title={
                isSidebarCollapsed
                  ? locale === "en"
                    ? "Expand sidebar"
                    : "Mở rộng sidebar"
                  : locale === "en"
                    ? "Collapse sidebar"
                    : "Thu gọn sidebar"
              }
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/16 bg-white/12 text-white transition hover:-translate-y-0.5 hover:bg-white/20 active:translate-y-0"
            >
              {isSidebarCollapsed ? <PanelLeftOpen className="h-4.5 w-4.5" /> : <PanelLeftClose className="h-4.5 w-4.5" />}
            </button>
          </div>

          <div className={cn("space-y-5 transition-all duration-300 ease-out", isSidebarCollapsed ? "mt-3" : "mt-5")}>
            {navGroups.map((group) => (
              <div key={group.label.en} className={cn("space-y-2", isSidebarCollapsed && "flex flex-col items-center")}>
                {!isSidebarCollapsed ? (
                  <p className="px-3 text-[0.68rem] font-semibold uppercase tracking-[0.24em] theme-text-muted">
                    {pickText(locale, group.label)}
                  </p>
                ) : null}
                <div className={cn("space-y-1.5", isSidebarCollapsed && "flex w-full flex-col items-center")}>
                  {group.items
                    .filter((item) => !item.adminOnly || currentUser.role === "admin")
                    .map((item) => {
                    const activeChildHref = getActiveChildHref(pathname, item.children);
                    const active = isActiveRoute(pathname, item.href) || Boolean(activeChildHref);
                    const Icon = item.icon;

                    return (
                      <div key={item.href} className={cn("space-y-1", isSidebarCollapsed && "flex w-full flex-col items-center")}>
                        <Link
                          href={item.href}
                          title={pickText(locale, item.label)}
                          className={cn(
                            "group flex rounded-[1.25rem] transition",
                            isSidebarCollapsed
                              ? "h-12 w-12 items-center justify-center p-0"
                              : "items-start gap-3 px-3 py-3",
                            active
                              ? "bg-[linear-gradient(135deg,rgba(10,29,52,0.98),rgba(23,114,208,0.94))] text-white shadow-[0_18px_34px_rgba(23,114,208,0.16)]"
                              : "bg-white/36 text-[var(--text-strong)] hover:bg-[rgba(23,114,208,0.08)] hover:text-[var(--text-strong)] dark:bg-transparent",
                          )}
                        >
                          <div
                            className={cn(
                              "flex shrink-0 items-center justify-center rounded-2xl border transition-all duration-300",
                              isSidebarCollapsed ? "h-10 w-10" : "mt-0.5 h-10 w-10",
                              active
                                ? "border-white/14 bg-white/10 text-white"
                                : "theme-border theme-panel-strong text-[var(--brand)]",
                            )}
                          >
                            <Icon className="h-4.5 w-4.5" />
                          </div>
                          {!isSidebarCollapsed ? (
                          <div className="min-w-0 flex-1">
                            <p className={cn("text-sm font-semibold", active && "text-white")}>
                              {pickText(locale, item.label)}
                            </p>
                            <p className={cn("mt-1 text-xs leading-5", active ? "text-white/74" : "theme-text-muted")}>
                              {pickText(locale, item.description)}
                            </p>
                          </div>
                          ) : null}
                        </Link>

                        {item.children?.length ? (
                          <div
                            className={cn(
                              "space-y-1 transition-all duration-300",
                              isSidebarCollapsed
                                ? "flex flex-col items-center border-l-0 pl-0"
                                : "ml-[3.35rem] border-l theme-border pl-4",
                            )}
                          >
                            {item.children.map((child) => {
                              const childActive = activeChildHref === child.href;
                              const ChildIcon = child.icon;
                              return (
                                <Link
                                  key={child.href}
                                  href={child.href}
                                  title={pickText(locale, child.label)}
                                  className={cn(
                                    "flex items-center rounded-xl text-xs font-medium transition",
                                    isSidebarCollapsed ? "h-8 w-8 justify-center p-0" : "gap-2 px-2.5 py-2",
                                    childActive
                                      ? "bg-[rgba(23,114,208,0.1)] text-[var(--text-strong)]"
                                      : "theme-text-body hover:bg-[rgba(23,114,208,0.06)] hover:text-[var(--text-strong)]",
                                  )}
                                >
                                  {isSidebarCollapsed ? (
                                    <ChildIcon className={cn("h-3.5 w-3.5", childActive && "text-[var(--brand)]")} />
                                  ) : (
                                    <>
                                      <ChildIcon className={cn("h-3.5 w-3.5 shrink-0", childActive && "text-[var(--brand)]")} />
                                      <span className="min-w-0 truncate">{pickText(locale, child.label)}</span>
                                    </>
                                  )}
                                </Link>
                              );
                            })}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Surface>
      </aside>

      <div className="min-w-0 transition-all duration-300 ease-out">{children}</div>
    </div>
  );
}
