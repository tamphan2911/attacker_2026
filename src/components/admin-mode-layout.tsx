"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarClock,
  FilePenLine,
  FileQuestion,
  LayoutDashboard,
  Mail,
  Newspaper,
  TableProperties,
  Users,
  Users2,
} from "lucide-react";

import { pickText } from "@/lib/site";
import { useSiteState } from "@/components/providers/site-state-provider";
import { SectionHeading, Surface } from "@/components/site-ui";
import type { LocalizedText } from "@/types/site";

function cn(...values: Array<string | undefined | false>) {
  return values.filter(Boolean).join(" ");
}

type AdminNavItem = {
  href: string;
  icon: typeof LayoutDashboard;
  label: LocalizedText;
  description: LocalizedText;
  adminOnly?: boolean;
  children?: Array<{ href: string; label: LocalizedText }>;
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
          { href: "/admin/content", label: { en: "Pages & types", vi: "Trang và nhóm nội dung" } },
        ],
      },
      {
        href: "/admin/news",
        icon: Newspaper,
        label: { en: "News", vi: "Tin tức" },
        description: { en: "Newsroom articles", vi: "Bài viết newsroom" },
        children: [
          { href: "/admin/news", label: { en: "Article list", vi: "Danh sách bài viết" } },
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
          { href: "/admin/users", label: { en: "Participant list", vi: "Danh sách thí sinh" } },
          { href: "/admin/judges", label: { en: "Judge", vi: "Giám khảo" } },
          { href: "/admin/organizer-team", label: { en: "Organizer team", vi: "Ban tổ chức" } },
        ],
      },
      {
        href: "/admin/teams",
        icon: Users2,
        label: { en: "Teams", vi: "Đội thi" },
        description: { en: "Teams and roster status", vi: "Đội thi và trạng thái đội hình" },
        children: [
          { href: "/admin/teams", label: { en: "Team list", vi: "Danh sách đội thi" } },
        ],
      },
      {
        href: "/admin/email-templates",
        icon: Mail,
        label: { en: "Email templates", vi: "Mẫu email" },
        description: { en: "Activation and password-reset email copy", vi: "Nội dung email kích hoạt và đặt lại mật khẩu" },
        adminOnly: true,
        children: [
          { href: "/admin/email-templates", label: { en: "System email templates", vi: "Mẫu email hệ thống" } },
        ],
      },
      {
        href: "/admin/timeline",
        icon: CalendarClock,
        label: { en: "Timeline", vi: "Lịch trình" },
        description: { en: "Official dates for each timeline step", vi: "Ngày chính thức cho từng bước lịch trình" },
        adminOnly: true,
        children: [
          { href: "/admin/timeline", label: { en: "Timeline schedule", vi: "Lịch trình chính thức" } },
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
        description: { en: "Banks, results, and review", vi: "Ngân hàng đề, kết quả và chấm điểm" },
        children: [
          { href: "/admin/round-1", label: { en: "Round 1 test bank", vi: "Ngân hàng đề Vòng 1" } },
          { href: "/admin/round-1/exams", label: { en: "Round 1 exam", vi: "Bài thi Vòng 1" } },
        ],
      },
      {
        href: "/admin/submissions",
        icon: TableProperties,
        label: { en: "Submissions", vi: "Bài nộp" },
        description: { en: "Round 2/3 version tracking", vi: "Theo dõi phiên bản bài nộp Vòng 2/3" },
        children: [
          { href: "/admin/submissions", label: { en: "Submission list", vi: "Danh sách bài nộp" } },
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

function AccessDenied() {
  const { locale, currentUser } = useSiteState();

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow={locale === "en" ? "Admin mode" : "Admin mode"}
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
  const { locale, canAccessAdminMode, currentUser } = useSiteState();

  if (!canAccessAdminMode) {
    return <AccessDenied />;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="xl:sticky xl:top-24 xl:self-start">
        <Surface className="overflow-hidden px-4 py-4 md:px-5">
          <div className="rounded-[1.7rem] border border-white/12 bg-[linear-gradient(135deg,#0b3158_0%,#105892_52%,#1772d0_100%)] px-4 py-5 text-white shadow-[0_24px_44px_rgba(11,49,88,0.22)]">
            <p className="inline-flex items-center rounded-full border border-white/14 bg-white/12 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-white/88">
              {locale === "en" ? "Admin mode" : "Admin mode"}
            </p>
            <p className="mt-3 text-xl font-semibold text-white">
              {locale === "en" ? "Control center" : "Trung tâm điều phối"}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex min-h-8 items-center justify-center rounded-full border border-white/14 bg-white/12 px-3 py-1 text-center text-xs font-medium text-white whitespace-nowrap">
                {currentUser.role === "admin" ? "Admin" : "Moderator"}
              </span>
              <span className="inline-flex min-h-8 items-center justify-center rounded-full border border-white/14 bg-white/10 px-3 py-1 text-center text-xs font-medium text-white/92 whitespace-nowrap">
                {currentUser.name}
              </span>
            </div>
          </div>

          <div className="mt-5 space-y-5">
            {adminNavGroups.map((group) => (
              <div key={group.label.en} className="space-y-2">
                <p className="px-3 text-[0.68rem] font-semibold uppercase tracking-[0.24em] theme-text-muted">
                  {pickText(locale, group.label)}
                </p>
                <div className="space-y-1.5">
                  {group.items
                    .filter((item) => !item.adminOnly || currentUser.role === "admin")
                    .map((item) => {
                    const active =
                      isActiveRoute(pathname, item.href) ||
                      item.children?.some((child) => isActiveRoute(pathname, child.href));
                    const Icon = item.icon;

                    return (
                      <div key={item.href} className="space-y-1">
                        <Link
                          href={item.href}
                          className={cn(
                            "group flex items-start gap-3 rounded-[1.25rem] px-3 py-3 transition",
                            active
                              ? "bg-[linear-gradient(135deg,rgba(10,29,52,0.98),rgba(23,114,208,0.94))] text-white shadow-[0_18px_34px_rgba(23,114,208,0.16)]"
                              : "bg-white/36 text-[var(--text-strong)] hover:bg-[rgba(23,114,208,0.08)] hover:text-[var(--text-strong)] dark:bg-transparent",
                          )}
                        >
                          <div
                            className={cn(
                              "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border",
                              active
                                ? "border-white/14 bg-white/10 text-white"
                                : "theme-border theme-panel-strong text-[var(--brand)]",
                            )}
                          >
                            <Icon className="h-4.5 w-4.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={cn("text-sm font-semibold", active && "text-white")}>
                              {pickText(locale, item.label)}
                            </p>
                            <p className={cn("mt-1 text-xs leading-5", active ? "text-white/74" : "theme-text-muted")}>
                              {pickText(locale, item.description)}
                            </p>
                          </div>
                        </Link>

                        {item.children?.length ? (
                          <div className="ml-[3.35rem] space-y-1 border-l theme-border pl-4">
                            {item.children.map((child) => {
                              const childActive = isActiveRoute(pathname, child.href);
                              return (
                                <Link
                                  key={child.href}
                                  href={child.href}
                                  className={cn(
                                    "flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-medium transition",
                                    childActive
                                      ? "bg-[rgba(23,114,208,0.1)] text-[var(--text-strong)]"
                                      : "theme-text-body hover:bg-[rgba(23,114,208,0.06)] hover:text-[var(--text-strong)]",
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "h-1.5 w-1.5 rounded-full",
                                      childActive ? "bg-[var(--brand)]" : "bg-slate-300 dark:bg-white/28",
                                    )}
                                  />
                                  {pickText(locale, child.label)}
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

      <div className="min-w-0">{children}</div>
    </div>
  );
}
