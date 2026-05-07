"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft, Trash2 } from "lucide-react";

import { DEMO_ADMIN_LOGIN_ID } from "@/data/site-content";
import {
  pickAdminUserEmailVerificationLabel,
  pickAdminUserEmailVerificationTone,
} from "@/lib/admin-users";
import {
  pickTeamDisplayStatusDescription,
  pickTeamDisplayStatusLabel,
  pickTeamDisplayStatusTone,
} from "@/lib/competition";
import { formatDateLabel, getTeamForUser } from "@/lib/site";
import { ADMIN_TITLE_ID, useAdminTitleScroll } from "@/components/admin-title-scroll";
import { useSiteState } from "@/components/providers/site-state-provider";
import { GradientAvatar, SectionHeading, StatusPill, Surface } from "@/components/site-ui";
import type { CompetitionStage, TeamFinalOutcome, TeamProfile, UserProfile, UserRole } from "@/types/site";

const fieldClassName =
  "theme-placeholder w-full rounded-2xl border theme-border theme-panel px-4 py-3 text-sm theme-text-strong outline-none";

const teamFinalOutcomeOptions: Array<{ value: TeamFinalOutcome; label: { en: string; vi: string } }> = [
  { value: "champion", label: { en: "Champion", vi: "Quán quân" } },
  { value: "runner-up", label: { en: "Runner-up", vi: "Á quân" } },
  { value: "third-place", label: { en: "Third place", vi: "Quý quân" } },
  { value: "fourth-place", label: { en: "4th place", vi: "Hạng 4" } },
  { value: "emerging-team", label: { en: "Emerging Team", vi: "Đội Tiềm năng" } },
];

function NotFoundState({
  title,
  description,
  href,
  actionLabel,
}: {
  title: string;
  description: string;
  href: string;
  actionLabel: string;
}) {
  return (
    <Surface className="px-6 py-6 md:px-8 md:py-8">
      <SectionHeading
        id={ADMIN_TITLE_ID}
        className="scroll-mt-32"
        eyebrow="Admin"
        title={title}
        description={description}
      />
      <Link href={href} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold theme-accent">
        <ArrowLeft className="h-4 w-4" />
        {actionLabel}
      </Link>
    </Surface>
  );
}

export function AdminUserEditor({ userId }: { userId: string }) {
  const router = useRouter();
  const { locale, users, teams, updateUserByAdmin, deleteUserByAdmin } = useSiteState();
  useAdminTitleScroll();
  const user = users.find((item) => item.id === userId);
  const team = user ? getTeamForUser(user.id, teams) : undefined;
  const [draft, setDraft] = useState<UserProfile | null>(user ?? null);

  const isLocked = user?.id === DEMO_ADMIN_LOGIN_ID;
  const isDirty = useMemo(() => {
    if (!user || !draft) {
      return false;
    }

    return JSON.stringify(user) !== JSON.stringify(draft);
  }, [draft, user]);

  if (!user || !draft) {
    return (
      <NotFoundState
        title={locale === "en" ? "User record not found." : "Không tìm thấy người dùng."}
        description={
          locale === "en"
            ? "This user may have been deleted from the current backend dataset."
            : "Người dùng này có thể đã bị xóa khỏi dữ liệu backend hiện tại."
        }
        href="/admin/users"
        actionLabel={locale === "en" ? "Back to users" : "Quay lại danh sách người dùng"}
      />
    );
  }

  const handleDelete = () => {
    if (isLocked) {
      return;
    }

    const confirmed = window.confirm(
      locale === "en"
        ? `Delete ${user.name} from the admin dataset?`
        : `Xoa ${user.name} khoi bo du lieu admin?`,
    );

    if (!confirmed) {
      return;
    }

    deleteUserByAdmin(user.id);
    router.push("/admin/users");
  };

  return (
    <div className="space-y-8">
      <Link href="/admin/users" className="inline-flex items-center gap-2 text-sm font-semibold theme-accent">
        <ArrowLeft className="h-4 w-4" />
        {locale === "en" ? "Back to users" : "Quay lại danh sách người dùng"}
      </Link>

      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <SectionHeading
          id={ADMIN_TITLE_ID}
          className="scroll-mt-32"
          eyebrow={locale === "en" ? "Admin / Users / Edit" : "Admin / Nguoi dung / Chinh sua"}
          title={draft.name}
          description={
            locale === "en"
              ? "Edit the user profile fields used across the frontend prototype."
              : "Chinh sua cac truong ho so nguoi dung dang duoc su dung tren frontend prototype."
          }
        />
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setDraft(user)}
            className="theme-button-secondary rounded-full px-5 py-3 text-sm font-semibold"
          >
            {locale === "en" ? "Reset draft" : "Dat lai ban nhap"}
          </button>
          <button
            type="button"
            disabled={!isDirty || isLocked}
            onClick={() => updateUserByAdmin(user.id, draft)}
            className="theme-button-primary rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {locale === "en" ? "Save changes" : "Luu thay doi"}
          </button>
          <button
            type="button"
            disabled={isLocked}
            onClick={handleDelete}
            className="theme-button-danger inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            {locale === "en" ? "Delete user" : "Xoa nguoi dung"}
          </button>
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Surface className="px-6 py-6 md:px-8 md:py-8">
          <div className="mb-6 flex items-center gap-4 rounded-[1.5rem] border theme-border theme-panel-subtle px-4 py-4">
            <GradientAvatar
              label={draft.name}
              tone={draft.avatarTone}
              imageSrc={draft.avatarImageSrc}
              className="h-16 w-16 text-lg"
            />
            <div>
              <p className="text-sm font-semibold theme-text-strong">{draft.name}</p>
              <p className="mt-1 text-sm theme-text-soft">{draft.email}</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm theme-text-muted">
                {locale === "en" ? "Full name" : "Ho ten"}
              </span>
              <input
                value={draft.name}
                onChange={(event) => setDraft((current) => (current ? { ...current, name: event.target.value } : current))}
                className={fieldClassName}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm theme-text-muted">Email</span>
              <input
                value={draft.email}
                disabled
                readOnly
                className={`${fieldClassName} cursor-not-allowed opacity-70`}
              />
              <p className="text-xs theme-text-soft">
                {locale === "en"
                  ? "Email is fixed after the account is created."
                  : "Email được cố định sau khi tài khoản được tạo."}
              </p>
            </label>
            <label className="space-y-2">
              <span className="text-sm theme-text-muted">
                {locale === "en" ? "Student ID" : "Mã số sinh viên"}
              </span>
              <input
                value={draft.studentId}
                onChange={(event) => setDraft((current) => (current ? { ...current, studentId: event.target.value } : current))}
                className={fieldClassName}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm theme-text-muted">
                {locale === "en" ? "Phone number" : "Số điện thoại"}
              </span>
              <input
                value={draft.phoneNumber}
                onChange={(event) =>
                  setDraft((current) => (current ? { ...current, phoneNumber: event.target.value } : current))
                }
                className={fieldClassName}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm theme-text-muted">
                {locale === "en" ? "Email activation" : "Kích hoạt email"}
              </span>
              <select
                value={draft.emailVerified ? "verified" : "unverified"}
                onChange={(event) =>
                  setDraft((current) =>
                    current ? { ...current, emailVerified: event.target.value === "verified" } : current,
                  )
                }
                className={fieldClassName}
              >
                <option value="verified">
                  {locale === "en" ? "Verified" : "Đã kích hoạt"}
                </option>
                <option value="unverified">
                  {locale === "en" ? "Not verified" : "Chưa kích hoạt"}
                </option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm theme-text-muted">
                {locale === "en" ? "Role" : "Vai tro"}
              </span>
              <select
                value={draft.role}
                onChange={(event) =>
                  setDraft((current) =>
                    current ? { ...current, role: event.target.value as UserRole } : current,
                  )
                }
                className={fieldClassName}
              >
                <option value="student">student</option>
                <option value="moderator">moderator</option>
                <option value="admin">admin</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm theme-text-muted">
                {locale === "en" ? "Class year" : "Nam hoc"}
              </span>
              <input
                value={draft.classYear}
                onChange={(event) => setDraft((current) => (current ? { ...current, classYear: event.target.value } : current))}
                className={fieldClassName}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm theme-text-muted">
                {locale === "en" ? "University" : "Truong"}
              </span>
              <input
                value={draft.university}
                onChange={(event) => setDraft((current) => (current ? { ...current, university: event.target.value } : current))}
                className={fieldClassName}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm theme-text-muted">
                {locale === "en" ? "Major" : "Chuyen nganh"}
              </span>
              <input
                value={draft.major}
                onChange={(event) => setDraft((current) => (current ? { ...current, major: event.target.value } : current))}
                className={fieldClassName}
              />
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm theme-text-muted">
                {locale === "en" ? "Avatar tone" : "Avatar tone"}
              </span>
              <input
                value={draft.avatarTone}
                onChange={(event) => setDraft((current) => (current ? { ...current, avatarTone: event.target.value } : current))}
                className={fieldClassName}
              />
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm theme-text-muted">
                {locale === "en" ? "Avatar image source" : "Nguon anh avatar"}
              </span>
              <textarea
                rows={3}
                value={draft.avatarImageSrc ?? ""}
                onChange={(event) =>
                  setDraft((current) =>
                    current
                      ? {
                          ...current,
                          avatarImageSrc: event.target.value.trim() || undefined,
                        }
                      : current,
                  )
                }
                className={fieldClassName}
              />
            </label>
          </div>

          <div className="mt-6">
            <label className="space-y-2">
              <span className="text-sm theme-text-muted">
                {locale === "en" ? "Bio" : "Giới thiệu"}
              </span>
              <textarea
                rows={4}
                value={draft.bio}
                onChange={(event) => setDraft((current) => (current ? { ...current, bio: event.target.value } : current))}
                className={fieldClassName}
              />
            </label>
          </div>
        </Surface>

        <Surface className="h-fit px-6 py-6">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200/80">
            {locale === "en" ? "Record status" : "Trang thai ban ghi"}
          </p>
          <div className="mt-5 space-y-4">
            <div className="rounded-[1.5rem] border theme-border theme-panel-subtle px-4 py-4">
              <p className="text-xs uppercase tracking-[0.22em] theme-text-soft">ID</p>
              <p className="mt-2 text-sm font-semibold theme-text-strong">{user.id}</p>
            </div>
            <div className="rounded-[1.5rem] border theme-border theme-panel-subtle px-4 py-4">
              <p className="text-xs uppercase tracking-[0.22em] theme-text-soft">
                {locale === "en" ? "Student ID" : "Mã số sinh viên"}
              </p>
              <p className="mt-2 text-sm font-semibold theme-text-strong">{user.studentId || "-"}</p>
            </div>
            <div className="rounded-[1.5rem] border theme-border theme-panel-subtle px-4 py-4">
              <p className="text-xs uppercase tracking-[0.22em] theme-text-soft">
                {locale === "en" ? "Providers" : "Nha cung cap"}
              </p>
              <p className="mt-2 text-sm font-semibold theme-text-strong">{user.providers.join(", ")}</p>
            </div>
            <div className="rounded-[1.5rem] border theme-border theme-panel-subtle px-4 py-4">
              <p className="text-xs uppercase tracking-[0.22em] theme-text-soft">
                {locale === "en" ? "Email activation" : "Kích hoạt email"}
              </p>
              <div className="mt-2">
                <StatusPill tone={pickAdminUserEmailVerificationTone(draft.emailVerified ?? false)}>
                  {pickAdminUserEmailVerificationLabel(locale, draft.emailVerified ?? false)}
                </StatusPill>
              </div>
            </div>
            <div className="rounded-[1.5rem] border theme-border theme-panel-subtle px-4 py-4">
              <p className="text-xs uppercase tracking-[0.22em] theme-text-soft">
                {locale === "en" ? "Current team" : "Đội hiện tại"}
              </p>
              {team ? (
                <Link href={`/admin/teams/${team.id}`} className="mt-2 inline-flex text-sm font-semibold theme-accent">
                  {team.name}
                </Link>
              ) : (
                <p className="mt-2 text-sm theme-text-soft">-</p>
              )}
            </div>
            <div className="rounded-[1.5rem] border theme-border theme-panel-subtle px-4 py-4">
              <p className="text-xs uppercase tracking-[0.22em] theme-text-soft">
                {locale === "en" ? "Bio" : "Giới thiệu"}
              </p>
              <p className="mt-2 text-sm leading-7 theme-text-muted">{user.bio || "-"}</p>
            </div>
            <div className="rounded-[1.5rem] border theme-border theme-panel-subtle px-4 py-4">
              <p className="text-xs uppercase tracking-[0.22em] theme-text-soft">
                {locale === "en" ? "Protection" : "Bao ve"}
              </p>
              {isLocked ? (
                <p className="mt-2 text-sm theme-text-soft">
                  {locale === "en"
                    ? "This fixed admin account is locked from edits and deletion."
                    : "Tai khoan admin co dinh nay duoc khoa, khong the sua hoac xoa."}
                </p>
              ) : (
                <StatusPill tone="success">
                  {locale === "en" ? "Editable" : "Co the chinh sua"}
                </StatusPill>
              )}
            </div>
          </div>
        </Surface>
      </section>
    </div>
  );
}

export function AdminTeamEditor({ teamId }: { teamId: string }) {
  const router = useRouter();
  const { locale, teams, users, timelineItems, updateTeamByAdmin, deleteTeamByAdmin } = useSiteState();
  useAdminTitleScroll();
  const team = teams.find((item) => item.id === teamId);
  const [draft, setDraft] = useState<TeamProfile | null>(team ?? null);

  const isDirty = useMemo(() => {
    if (!team || !draft) {
      return false;
    }

    return JSON.stringify(team) !== JSON.stringify(draft);
  }, [draft, team]);

  if (!team || !draft) {
    return (
      <NotFoundState
        title={locale === "en" ? "Team record not found." : "Không tìm thấy đội thi."}
        description={
          locale === "en"
            ? "This team may have been deleted from the current backend dataset."
            : "Đội thi này có thể đã bị xóa khỏi dữ liệu backend hiện tại."
        }
        href="/admin/teams"
        actionLabel={locale === "en" ? "Back to teams" : "Quay lại danh sách đội"}
      />
    );
  }

  const members = draft.memberIds
    .map((memberId) => users.find((user) => user.id === memberId))
    .filter((member): member is UserProfile => Boolean(member));

  const handleDelete = () => {
    const confirmed = window.confirm(
      locale === "en"
        ? `Delete team ${team.name} from the admin dataset?`
        : `Xoa doi ${team.name} khoi bo du lieu admin?`,
    );

    if (!confirmed) {
      return;
    }

    deleteTeamByAdmin(team.id);
    router.push("/admin/teams");
  };

  return (
    <div className="space-y-8">
      <Link href="/admin/teams" className="inline-flex items-center gap-2 text-sm font-semibold theme-accent">
        <ArrowLeft className="h-4 w-4" />
        {locale === "en" ? "Back to teams" : "Quay lại danh sách đội"}
      </Link>

      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <SectionHeading
          id={ADMIN_TITLE_ID}
          className="scroll-mt-32"
          eyebrow={locale === "en" ? "Admin / Teams / Edit" : "Admin / Đội thi / Chỉnh sửa"}
          title={draft.name}
          description={
            locale === "en"
              ? "Edit the main team record fields and leadership assignment."
              : "Chỉnh sửa các trường chính của đội và phân công đội trưởng."
          }
        />
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setDraft(team)}
            className="theme-button-secondary rounded-full px-5 py-3 text-sm font-semibold"
          >
            {locale === "en" ? "Reset draft" : "Dat lai ban nhap"}
          </button>
          <button
            type="button"
            disabled={!isDirty}
            onClick={() => updateTeamByAdmin(team.id, draft)}
            className="theme-button-primary rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {locale === "en" ? "Save changes" : "Luu thay doi"}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="theme-button-danger inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
          >
            <Trash2 className="h-4 w-4" />
            {locale === "en" ? "Delete team" : "Xoa doi"}
          </button>
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Surface className="px-6 py-6 md:px-8 md:py-8">
          <div className="mb-6 flex items-center gap-4 rounded-[1.5rem] border theme-border theme-panel-subtle px-4 py-4">
            <GradientAvatar
              label={draft.name}
              tone={draft.avatarTone}
              imageSrc={draft.avatarImageSrc}
              className="h-16 w-16 text-lg"
            />
            <div>
              <p className="text-sm font-semibold theme-text-strong">{draft.name}</p>
              <p className="mt-1 text-sm theme-text-soft">{draft.tag}</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm theme-text-muted">
                {locale === "en" ? "Team name" : "Tên đội"}
              </span>
              <input
                value={draft.name}
                onChange={(event) => setDraft((current) => (current ? { ...current, name: event.target.value } : current))}
                className={fieldClassName}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm theme-text-muted">Tag</span>
              <input
                value={draft.tag}
                onChange={(event) => setDraft((current) => (current ? { ...current, tag: event.target.value } : current))}
                className={fieldClassName}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm theme-text-muted">
                {locale === "en" ? "Keyword" : "Từ khóa"}
              </span>
              <input
                value={draft.track}
                onChange={(event) => setDraft((current) => (current ? { ...current, track: event.target.value } : current))}
                className={fieldClassName}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm theme-text-muted">
                {locale === "en" ? "Leader" : "Đội trưởng"}
              </span>
              <select
                value={draft.leaderId}
                onChange={(event) => setDraft((current) => (current ? { ...current, leaderId: event.target.value } : current))}
                className={fieldClassName}
              >
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm theme-text-muted">
                {locale === "en" ? "Competition stage" : "Giai doan thi dau"}
              </span>
              <select
                value={draft.stage}
                onChange={(event) =>
                  setDraft((current) =>
                    current ? { ...current, stage: event.target.value as CompetitionStage } : current,
                  )
                }
                className={fieldClassName}
              >
                <option value="round-1">{locale === "en" ? "Round 1" : "Vòng 1"}</option>
                <option value="round-2">{locale === "en" ? "Round 2" : "Vòng 2"}</option>
                <option value="round-3">{locale === "en" ? "Round 3" : "Vòng 3"}</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm theme-text-muted">
                {locale === "en" ? "Final outcome" : "Kết quả cuối"}
              </span>
              <select
                value={draft.finalOutcome ?? ""}
                onChange={(event) =>
                  setDraft((current) =>
                    current
                      ? {
                          ...current,
                          finalOutcome: (event.target.value || undefined) as TeamFinalOutcome | undefined,
                        }
                      : current,
                  )
                }
                className={fieldClassName}
              >
                <option value="">{locale === "en" ? "No final title yet" : "Chưa có danh hiệu cuối"}</option>
                {teamFinalOutcomeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label[locale]}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm theme-text-muted">
                {locale === "en" ? "Avatar tone" : "Avatar tone"}
              </span>
              <input
                value={draft.avatarTone}
                onChange={(event) => setDraft((current) => (current ? { ...current, avatarTone: event.target.value } : current))}
                className={fieldClassName}
              />
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm theme-text-muted">
                {locale === "en" ? "Avatar image source" : "Nguon anh avatar"}
              </span>
              <textarea
                rows={3}
                value={draft.avatarImageSrc ?? ""}
                onChange={(event) =>
                  setDraft((current) =>
                    current
                      ? {
                          ...current,
                          avatarImageSrc: event.target.value.trim() || undefined,
                        }
                      : current,
                  )
                }
                className={fieldClassName}
              />
            </label>
          </div>

          <div className="mt-6">
            <label className="space-y-2">
              <span className="text-sm theme-text-muted">
                {locale === "en" ? "Team bio" : "Bio cua doi"}
              </span>
              <textarea
                rows={5}
                value={draft.bio}
                onChange={(event) =>
                  setDraft((current) =>
                    current ? { ...current, bio: event.target.value } : current,
                  )
                }
                className={fieldClassName}
              />
            </label>
          </div>
        </Surface>

        <Surface className="h-fit px-6 py-6">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200/80">
            {locale === "en" ? "Team summary" : "Tong quan doi"}
          </p>
          <div className="mt-5 space-y-4">
            <div className="rounded-[1.5rem] border theme-border theme-panel-subtle px-4 py-4">
              <p className="text-xs uppercase tracking-[0.22em] theme-text-soft">ID</p>
              <p className="mt-2 text-sm font-semibold theme-text-strong">{team.id}</p>
            </div>
            <div className="rounded-[1.5rem] border theme-border theme-panel-subtle px-4 py-4">
              <p className="text-xs uppercase tracking-[0.22em] theme-text-soft">
                {locale === "en" ? "Members" : "Thanh vien"}
              </p>
              <p className="mt-2 text-sm font-semibold theme-text-strong">{team.memberIds.length}</p>
              <div className="mt-4 space-y-2">
                {members.map((member) => (
                  <Link key={member.id} href={`/admin/users/${member.id}`} className="block text-sm theme-accent">
                    {member.name}
                  </Link>
                ))}
              </div>
            </div>
            <div className="rounded-[1.5rem] border theme-border theme-panel-subtle px-4 py-4">
              <p className="text-xs uppercase tracking-[0.22em] theme-text-soft">
                {locale === "en" ? "Competition status" : "Trang thai thi dau"}
              </p>
              <div className="mt-2">
                <StatusPill tone={pickTeamDisplayStatusTone(draft, new Date(), timelineItems)}>
                  {pickTeamDisplayStatusLabel(locale, draft, new Date(), timelineItems)}
                </StatusPill>
              </div>
              <p className="mt-3 text-sm leading-7 theme-text-muted">
                {pickTeamDisplayStatusDescription(locale, draft, new Date(), timelineItems)}
              </p>
            </div>
            <div className="rounded-[1.5rem] border theme-border theme-panel-subtle px-4 py-4">
              <p className="text-xs uppercase tracking-[0.22em] theme-text-soft">
                {locale === "en" ? "Created" : "Ngay tao"}
              </p>
              <p className="mt-2 text-sm font-semibold theme-text-strong">
                {formatDateLabel(locale, team.createdAt)}
              </p>
            </div>
          </div>
        </Surface>
      </section>
    </div>
  );
}
