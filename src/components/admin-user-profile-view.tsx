"use client";

import Link from "next/link";
import { ArrowLeft, Mail, PencilLine, Phone, School, UserRound, Users2 } from "lucide-react";

import { ADMIN_TITLE_ID, useAdminTitleScroll } from "@/components/admin-title-scroll";
import { useSiteState } from "@/components/providers/site-state-provider";
import { GradientAvatar, SectionHeading, StatusPill, Surface } from "@/components/site-ui";
import { getAdminUserCompetitionStatus, pickAdminUserRoleLabel } from "@/lib/admin-users";
import { getTeamForUser } from "@/lib/site";

function pickProviderLabel(
  locale: ReturnType<typeof useSiteState>["locale"],
  provider: "email" | "google",
) {
  if (provider === "google") {
    return "Google";
  }

  return locale === "en" ? "Email" : "Email";
}

function AdminUserProfileNotFound() {
  const { locale } = useSiteState();

  return (
    <Surface className="px-6 py-6 md:px-8 md:py-8">
      <SectionHeading
        id={ADMIN_TITLE_ID}
        className="scroll-mt-32"
        eyebrow={locale === "en" ? "Admin / Users / Profile" : "Admin / Người dùng / Hồ sơ"}
        title={locale === "en" ? "User record not found." : "Không tìm thấy người dùng."}
        description={
          locale === "en"
            ? "This user may have been deleted from the current backend dataset."
            : "Người dùng này có thể đã bị xóa khỏi dữ liệu backend hiện tại."
        }
      />
      <Link href="/admin/users" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold theme-accent">
        <ArrowLeft className="h-4 w-4" />
        {locale === "en" ? "Back to users" : "Quay lại danh sách người dùng"}
      </Link>
    </Surface>
  );
}

export function AdminUserProfileView({ userId }: { userId: string }) {
  const { locale, users, teams } = useSiteState();
  useAdminTitleScroll();

  const user = users.find((item) => item.id === userId);
  const team = user ? getTeamForUser(user.id, teams) : undefined;

  if (!user) {
    return <AdminUserProfileNotFound />;
  }

  const competitionStatus = getAdminUserCompetitionStatus(locale, user, team);
  const providerLabel = user.providers.length
    ? user.providers.map((provider) => pickProviderLabel(locale, provider)).join(" · ")
    : locale === "en"
      ? "No provider"
      : "Chưa có phương thức";

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/admin/users" className="inline-flex items-center gap-2 text-sm font-semibold theme-accent">
          <ArrowLeft className="h-4 w-4" />
          {locale === "en" ? "Back to users" : "Quay lại danh sách người dùng"}
        </Link>
        <Link
          href={`/admin/users/${user.id}`}
          className="inline-flex items-center gap-2 rounded-full border theme-border theme-panel px-4 py-2.5 text-sm font-semibold theme-text-strong"
        >
          <PencilLine className="h-4 w-4" />
          {locale === "en" ? "Edit user" : "Chỉnh sửa người dùng"}
        </Link>
      </div>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_360px]">
        <Surface className="relative overflow-hidden px-6 py-6 md:px-8 md:py-8">
          <div className="absolute inset-x-0 top-0 h-28 bg-[linear-gradient(135deg,rgba(23,114,208,0.18),rgba(14,165,233,0.08),transparent)]" />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-start">
            <GradientAvatar
              label={user.name}
              tone={user.avatarTone}
              imageSrc={user.avatarImageSrc}
              className="h-28 w-28 rounded-full text-3xl"
            />
            <div className="min-w-0 flex-1">
              <SectionHeading
                id={ADMIN_TITLE_ID}
                className="scroll-mt-32"
                eyebrow={locale === "en" ? "Admin / Users / Profile" : "Admin / Người dùng / Hồ sơ"}
                title={user.name}
                description={
                  user.bio ||
                  (locale === "en"
                    ? "This participant has not added a bio yet."
                    : "Thí sinh này chưa thêm phần giới thiệu.")
                }
              />
              <div className="mt-5 flex flex-wrap gap-2">
                {user.studentId ? (
                  <StatusPill>{`${locale === "en" ? "Student ID" : "MSSV"} · ${user.studentId}`}</StatusPill>
                ) : null}
                <StatusPill>{pickAdminUserRoleLabel(locale, user.role)}</StatusPill>
                <StatusPill>{providerLabel}</StatusPill>
                <StatusPill tone={competitionStatus.tone}>{competitionStatus.label}</StatusPill>
                {team ? (
                  <StatusPill tone="success">{`${locale === "en" ? "Team" : "Đội"} · ${team.name}`}</StatusPill>
                ) : null}
              </div>
            </div>
          </div>
        </Surface>

        <Surface className="px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-700 dark:text-sky-200/80">
            {locale === "en" ? "Quick overview" : "Tổng quan nhanh"}
          </p>
          <div className="mt-5 space-y-3">
            <div className="rounded-[1.5rem] border theme-border theme-panel px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] theme-text-soft">
                Email
              </p>
              <p className="mt-3 text-sm leading-7 theme-text-body">{user.email}</p>
            </div>
            <div className="rounded-[1.5rem] border theme-border theme-panel px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] theme-text-soft">
                {locale === "en" ? "Phone number" : "Số điện thoại"}
              </p>
              <p className="mt-3 text-sm leading-7 theme-text-body">
                {user.phoneNumber || (locale === "en" ? "No phone number yet" : "Chưa có số điện thoại")}
              </p>
            </div>
            <div className="rounded-[1.5rem] border theme-border theme-panel px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] theme-text-soft">
                {locale === "en" ? "University" : "Trường"}
              </p>
              <p className="mt-3 text-sm leading-7 theme-text-body">{user.university}</p>
            </div>
            <div className="rounded-[1.5rem] border theme-border theme-panel px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] theme-text-soft">
                {locale === "en" ? "Current team" : "Đội hiện tại"}
              </p>
              <p className="mt-3 text-sm leading-7 theme-text-body">{team?.name ?? (locale === "en" ? "No active team" : "Chưa có đội")}</p>
            </div>
          </div>
        </Surface>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Surface className="px-6 py-6">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-sky-400" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] theme-text-soft">
                {locale === "en" ? "Account email" : "Email tài khoản"}
              </p>
              <p className="mt-2 text-sm leading-7 theme-text-body">{user.email}</p>
            </div>
          </div>
        </Surface>

        <Surface className="px-6 py-6">
          <div className="flex items-center gap-3">
            <Phone className="h-5 w-5 text-sky-400" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] theme-text-soft">
                {locale === "en" ? "Phone number" : "Số điện thoại"}
              </p>
              <p className="mt-2 text-sm leading-7 theme-text-body">
                {user.phoneNumber || (locale === "en" ? "No phone number yet" : "Chưa có số điện thoại")}
              </p>
            </div>
          </div>
        </Surface>

        <Surface className="px-6 py-6">
          <div className="flex items-center gap-3">
            <School className="h-5 w-5 text-sky-400" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] theme-text-soft">
                {locale === "en" ? "Academic profile" : "Hồ sơ học tập"}
              </p>
              <p className="mt-2 text-sm leading-7 theme-text-body">{`${user.university} · ${user.major}`}</p>
            </div>
          </div>
        </Surface>

        <Surface className="px-6 py-6">
          <div className="flex items-center gap-3">
            <UserRound className="h-5 w-5 text-sky-400" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] theme-text-soft">
                {locale === "en" ? "Competition status" : "Trạng thái thi đấu"}
              </p>
              <p className="mt-2 text-sm leading-7 theme-text-body">{competitionStatus.label}</p>
            </div>
          </div>
        </Surface>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]">
        <Surface className="px-6 py-6 md:px-8 md:py-8">
          <SectionHeading
            eyebrow={locale === "en" ? "Profile details" : "Chi tiết hồ sơ"}
            title={
              locale === "en"
                ? "What the platform currently knows about this user."
                : "Những thông tin hệ thống hiện đang ghi nhận về người dùng này."
            }
            description={
              locale === "en"
                ? "This admin view mirrors the public profile presentation, while keeping editing on a separate route."
                : "Giao diện này bám theo trang hồ sơ công khai, còn phần chỉnh sửa được giữ ở route riêng."
            }
          />

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.5rem] border theme-border theme-panel px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] theme-text-soft">
                {locale === "en" ? "Full name" : "Họ và tên"}
              </p>
              <p className="mt-3 text-sm theme-text-body">{user.name}</p>
            </div>
            <div className="rounded-[1.5rem] border theme-border theme-panel px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] theme-text-soft">
                {locale === "en" ? "Student ID" : "Mã số sinh viên"}
              </p>
              <p className="mt-3 text-sm theme-text-body">{user.studentId || "--"}</p>
            </div>
            <div className="rounded-[1.5rem] border theme-border theme-panel px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] theme-text-soft">
                {locale === "en" ? "Phone number" : "Số điện thoại"}
              </p>
              <p className="mt-3 text-sm theme-text-body">{user.phoneNumber || "--"}</p>
            </div>
            <div className="rounded-[1.5rem] border theme-border theme-panel px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] theme-text-soft">
                {locale === "en" ? "University" : "Trường"}
              </p>
              <p className="mt-3 text-sm theme-text-body">{user.university}</p>
            </div>
            <div className="rounded-[1.5rem] border theme-border theme-panel px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] theme-text-soft">
                {locale === "en" ? "Class year" : "Khóa / năm học"}
              </p>
              <p className="mt-3 text-sm theme-text-body">{user.classYear}</p>
            </div>
            <div className="rounded-[1.5rem] border theme-border theme-panel px-4 py-4 md:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] theme-text-soft">
                {locale === "en" ? "Bio" : "Giới thiệu"}
              </p>
              <p className="mt-3 text-sm leading-7 theme-text-body">
                {user.bio || (locale === "en" ? "No bio yet." : "Chưa có phần giới thiệu.")}
              </p>
            </div>
          </div>
        </Surface>

        <Surface className="px-6 py-6 md:px-8 md:py-8">
          <div className="flex items-center gap-3">
            <Users2 className="h-5 w-5 text-sky-400" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] theme-text-soft">
                {locale === "en" ? "Team context" : "Bối cảnh đội thi"}
              </p>
              <p className="mt-2 text-lg font-semibold theme-text-strong">
                {team?.name ?? (locale === "en" ? "No active team" : "Chưa có đội hoạt động")}
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <div className="rounded-[1.5rem] border theme-border theme-panel px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] theme-text-soft">
                {locale === "en" ? "Competition stage" : "Vòng thi"}
              </p>
              <p className="mt-3 text-sm leading-7 theme-text-body">{competitionStatus.label}</p>
            </div>
            <div className="rounded-[1.5rem] border theme-border theme-panel px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] theme-text-soft">
                {locale === "en" ? "Members in team" : "Số thành viên trong đội"}
              </p>
              <p className="mt-3 text-sm leading-7 theme-text-body">
                {team ? team.memberIds.length : 0}
              </p>
            </div>
            {team ? (
              <Link
                href={`/admin/teams/${team.id}`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-[1.4rem] border theme-border theme-panel px-5 py-3.5 text-sm font-semibold theme-text-strong"
              >
                {locale === "en" ? "Open team editor" : "Mở chỉnh sửa đội"}
                <PencilLine className="h-4 w-4" />
              </Link>
            ) : null}
          </div>
        </Surface>
      </section>
    </div>
  );
}
