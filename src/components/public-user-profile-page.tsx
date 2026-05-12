"use client";

import Link from "next/link";
import { ArrowLeft, BookOpen, MessageCircle, MessageSquareText, School, UserRound } from "lucide-react";

import { useSiteState } from "@/components/providers/site-state-provider";
import { GradientAvatar, StatusPill, Surface } from "@/components/site-ui";
import { pickAdminUserRoleLabel } from "@/lib/admin-users";
import type { PublicUserProfile } from "@/types/site";

export function PublicUserProfilePage({ profile }: { profile: PublicUserProfile }) {
  const { currentUser, locale } = useSiteState();
  const academicLine = [profile.major, profile.classYear].filter(Boolean).join(" · ");
  const canMessageProfile = currentUser?.id !== profile.id;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-3">
        <Link href="/forum" className="inline-flex items-center gap-2 text-sm font-semibold theme-accent">
          <ArrowLeft className="h-4 w-4" />
          {locale === "en" ? "Back to forum" : "Quay lại forum"}
        </Link>
      </div>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.12fr)_340px]">
        <Surface className="relative overflow-hidden px-6 py-6 md:px-8 md:py-8">
          <div className="absolute inset-x-0 top-0 h-28 bg-[linear-gradient(135deg,rgba(23,114,208,0.18),rgba(14,165,233,0.08),transparent)]" />
          {canMessageProfile ? (
            <div className="group absolute right-5 top-5 z-10 inline-flex">
              <Link
                href={`/messages?recipient=${encodeURIComponent(profile.id)}&source=profile`}
                aria-label={locale === "en" ? "Send private message" : "Gửi tin nhắn riêng"}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-sky-300/30 bg-white/82 text-sky-600 shadow-[0_16px_34px_rgba(14,165,233,0.18)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white dark:border-sky-200/18 dark:bg-white/10 dark:text-sky-200 dark:hover:bg-white/16"
              >
                <MessageCircle className="h-5 w-5" />
              </Link>
              <span className="pointer-events-none absolute right-0 top-full mt-3 whitespace-nowrap rounded-full bg-slate-950 px-3 py-1.5 text-[0.68rem] font-semibold text-white opacity-0 shadow-[0_14px_30px_rgba(15,23,42,0.2)] transition group-hover:translate-y-0.5 group-hover:opacity-100 group-focus-within:translate-y-0.5 group-focus-within:opacity-100 dark:bg-white dark:text-slate-950">
                {locale === "en" ? "Send private message" : "Gửi tin nhắn riêng"}
              </span>
            </div>
          ) : null}
          <div className="relative flex flex-col gap-6 md:flex-row md:items-start">
            <GradientAvatar
              label={profile.name}
              tone={profile.avatarTone}
              imageSrc={profile.avatarImageSrc}
              className="h-28 w-28 rounded-full text-3xl"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-700 dark:text-sky-200/80">
                {locale === "en" ? "Public profile" : "Hồ sơ công khai"}
              </p>
              <h1 className="theme-heading mt-4 text-3xl font-semibold theme-text-strong md:text-[2.7rem]">
                {profile.name}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 theme-text-muted">
                {profile.bio ||
                  (locale === "en"
                    ? "This participant has not added a bio yet."
                    : "Thí sinh này chưa thêm phần giới thiệu.")}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <StatusPill>{pickAdminUserRoleLabel(locale, profile.role)}</StatusPill>
                <StatusPill tone="info">{profile.university}</StatusPill>
                {academicLine ? <StatusPill tone="success">{academicLine}</StatusPill> : null}
              </div>
            </div>
          </div>
        </Surface>

        <Surface className="px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-700 dark:text-sky-200/80">
            {locale === "en" ? "Overview" : "Tổng quan"}
          </p>
          <div className="mt-5 space-y-3">
            <div className="rounded-[1.5rem] border theme-border theme-panel px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] theme-text-soft">
                {locale === "en" ? "University" : "Trường"}
              </p>
              <p className="mt-3 text-sm leading-7 theme-text-body">{profile.university}</p>
            </div>
            <div className="rounded-[1.5rem] border theme-border theme-panel px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] theme-text-soft">
                {locale === "en" ? "Major / class year" : "Chuyên ngành / năm học"}
              </p>
              <p className="mt-3 text-sm leading-7 theme-text-body">
                {academicLine || (locale === "en" ? "Not shared yet" : "Chưa cập nhật")}
              </p>
            </div>
            <div className="rounded-[1.5rem] border theme-border theme-panel px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] theme-text-soft">
                {locale === "en" ? "Forum contact" : "Liên hệ qua forum"}
              </p>
              <p className="mt-3 text-sm leading-7 theme-text-body">
                {locale === "en"
                  ? "Private contact details stay hidden. Connect through thread replies in the forum."
                  : "Thông tin liên hệ riêng được ẩn. Hãy kết nối qua phần phản hồi trong forum."}
              </p>
            </div>
          </div>
        </Surface>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Surface className="px-6 py-6">
          <div className="flex items-start gap-3">
            <UserRound className="mt-1 h-5 w-5 text-sky-500" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] theme-text-soft">
                {locale === "en" ? "Participation role" : "Vai trò tham gia"}
              </p>
              <p className="mt-2 text-sm leading-7 theme-text-body">
                {pickAdminUserRoleLabel(locale, profile.role)}
              </p>
            </div>
          </div>
        </Surface>

        <Surface className="px-6 py-6">
          <div className="flex items-start gap-3">
            <School className="mt-1 h-5 w-5 text-emerald-500" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] theme-text-soft">
                {locale === "en" ? "University" : "Trường"}
              </p>
              <p className="mt-2 text-sm leading-7 theme-text-body">{profile.university}</p>
            </div>
          </div>
        </Surface>

        <Surface className="px-6 py-6">
          <div className="flex items-start gap-3">
            <BookOpen className="mt-1 h-5 w-5 text-amber-500" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] theme-text-soft">
                {locale === "en" ? "Academic focus" : "Định hướng học tập"}
              </p>
              <p className="mt-2 text-sm leading-7 theme-text-body">
                {academicLine || (locale === "en" ? "Not shared yet" : "Chưa cập nhật")}
              </p>
            </div>
          </div>
        </Surface>
      </section>

      <Surface className="px-6 py-6 md:px-8 md:py-8">
        <div className="flex items-start gap-3">
          <MessageSquareText className="mt-1 h-5 w-5 text-fuchsia-500" />
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] theme-text-soft">
              {locale === "en" ? "About this participant" : "Giới thiệu"}
            </p>
            <p className="mt-3 text-sm leading-8 theme-text-body">
              {profile.bio ||
                (locale === "en"
                  ? "This participant has not added a personal introduction yet."
                  : "Thí sinh này chưa thêm phần giới thiệu cá nhân.")}
            </p>
          </div>
        </div>
      </Surface>
    </div>
  );
}
