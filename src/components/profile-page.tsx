"use client";

import Link from "next/link";
import { ArrowRight, Mail, School, Upload, UserRound } from "lucide-react";
import { useState, type ChangeEvent } from "react";

import { useSiteState } from "@/components/providers/site-state-provider";
import { GradientAvatar, SectionHeading, StatusPill, Surface } from "@/components/site-ui";

const MAX_AVATAR_FILE_BYTES = 1024 * 1024;

interface ProfileFormState {
  name: string;
  email: string;
  studentId: string;
  university: string;
  major: string;
  classYear: string;
  bio: string;
  avatarImageSrc?: string;
}

function createProfileFormState(user: ReturnType<typeof useSiteState>["currentUser"]): ProfileFormState {
  return {
    name: user.name,
    email: user.email,
    studentId: user.studentId,
    university: user.university,
    major: user.major,
    classYear: user.classYear,
    bio: user.bio,
    avatarImageSrc: user.avatarImageSrc,
  };
}

function formatFileSize(bytes?: number) {
  if (!bytes) {
    return "";
  }

  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }

  return `${Math.ceil(bytes / 1024)}KB`;
}

function readImageFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Unable to read image file."));
    };
    reader.onerror = () => reject(reader.error ?? new Error("Unable to read image file."));
    reader.readAsDataURL(file);
  });
}

function ProfileEditor({
  locale,
  currentUser,
  signOutCurrentUser,
  updateActiveUserProfile,
}: Pick<
  ReturnType<typeof useSiteState>,
  "locale" | "currentUser" | "signOutCurrentUser" | "updateActiveUserProfile"
>) {
  const [form, setForm] = useState<ProfileFormState>(() => createProfileFormState(currentUser));
  const [avatarError, setAvatarError] = useState("");

  const handleAvatarUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (file.size > MAX_AVATAR_FILE_BYTES) {
      setAvatarError(
        locale === "en"
          ? `Avatar images must be ${formatFileSize(MAX_AVATAR_FILE_BYTES)} or smaller.`
          : `Ảnh avatar phải có dung lượng ${formatFileSize(MAX_AVATAR_FILE_BYTES)} trở xuống.`,
      );
      return;
    }

    try {
      const imageSrc = await readImageFileAsDataUrl(file);
      setAvatarError("");
      setForm((current) => ({ ...current, avatarImageSrc: imageSrc }));
    } catch {
      // Ignore failed local previews in the frontend-only prototype.
    }
  };

  const handleSave = () => {
    updateActiveUserProfile({
      name: form.name,
      email: form.email,
      studentId: form.studentId,
      university: form.university,
      major: form.major,
      classYear: form.classYear,
      bio: form.bio,
      avatarImageSrc: form.avatarImageSrc,
    });
  };

  return (
    <div className="space-y-12">
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Surface className="px-6 py-6 md:px-8 md:py-8">
          <SectionHeading
            eyebrow={locale === "en" ? "Profile" : "Hồ sơ"}
            title={locale === "en" ? "Edit your account information." : "Chỉnh sửa thông tin tài khoản."}
            description={
              locale === "en"
                ? "Update the public identity shown across team cards, invitations, and workspace views."
                : "Cập nhật danh tính hiển thị trên thẻ đội, lời mời và các màn hình trong workspace."
            }
          />

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm theme-text-muted">{locale === "en" ? "Full name" : "Họ tên"}</span>
              <input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                className="theme-placeholder w-full rounded-2xl border theme-border theme-panel px-4 py-3 text-sm theme-text-strong outline-none"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm theme-text-muted">Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                className="theme-placeholder w-full rounded-2xl border theme-border theme-panel px-4 py-3 text-sm theme-text-strong outline-none"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm theme-text-muted">{locale === "en" ? "Student ID" : "Mã số sinh viên"}</span>
              <input
                value={form.studentId}
                onChange={(event) => setForm((current) => ({ ...current, studentId: event.target.value }))}
                className="theme-placeholder w-full rounded-2xl border theme-border theme-panel px-4 py-3 text-sm theme-text-strong outline-none"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm theme-text-muted">{locale === "en" ? "Class year" : "Năm học"}</span>
              <input
                value={form.classYear}
                onChange={(event) => setForm((current) => ({ ...current, classYear: event.target.value }))}
                className="theme-placeholder w-full rounded-2xl border theme-border theme-panel px-4 py-3 text-sm theme-text-strong outline-none"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm theme-text-muted">{locale === "en" ? "University" : "Trường"}</span>
              <input
                value={form.university}
                onChange={(event) => setForm((current) => ({ ...current, university: event.target.value }))}
                className="theme-placeholder w-full rounded-2xl border theme-border theme-panel px-4 py-3 text-sm theme-text-strong outline-none"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm theme-text-muted">{locale === "en" ? "Major" : "Chuyên ngành"}</span>
              <input
                value={form.major}
                onChange={(event) => setForm((current) => ({ ...current, major: event.target.value }))}
                className="theme-placeholder w-full rounded-2xl border theme-border theme-panel px-4 py-3 text-sm theme-text-strong outline-none"
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm theme-text-muted">{locale === "en" ? "Bio" : "Giới thiệu"}</span>
              <textarea
                rows={4}
                value={form.bio}
                onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))}
                className="theme-placeholder w-full rounded-2xl border theme-border theme-panel px-4 py-3 text-sm theme-text-strong outline-none"
              />
            </label>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleSave}
              className="theme-button-primary rounded-[1.4rem] px-5 py-3.5 text-sm font-semibold"
            >
              {locale === "en" ? "Save profile" : "Lưu hồ sơ"}
            </button>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-[1.4rem] border theme-border theme-panel px-5 py-3.5 text-sm font-semibold theme-text-strong"
            >
              {locale === "en" ? "Back to workspace" : "Quay lại workspace"}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <button
              type="button"
              onClick={() => void signOutCurrentUser()}
              className="inline-flex items-center justify-center rounded-[1.4rem] border theme-border theme-panel px-5 py-3.5 text-sm font-semibold theme-text-strong"
            >
              {locale === "en" ? "Sign out" : "Đăng xuất"}
            </button>
          </div>
        </Surface>

        <Surface className="px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200/80">
            {locale === "en" ? "Account snapshot" : "Tổng quan tài khoản"}
          </p>
          <div className="mt-5 rounded-[1.7rem] border theme-border theme-panel px-5 py-5">
            <div className="flex items-start gap-4">
              <GradientAvatar
                label={form.name || currentUser.name}
                tone={currentUser.avatarTone}
                imageSrc={form.avatarImageSrc}
                className="h-20 w-20 rounded-full text-xl"
              />
              <div className="min-w-0 flex-1">
                <p className="text-lg font-semibold theme-text-strong">{form.name || currentUser.name}</p>
                <p className="mt-1 text-sm theme-text-soft">
                  {(form.studentId || currentUser.studentId) && `${locale === "en" ? "Student ID" : "MSSV"} · ${form.studentId || currentUser.studentId}`}
                </p>
                <p className="mt-2 text-sm theme-text-soft">{form.university || currentUser.university}</p>
                <p className="mt-2 text-xs theme-text-faint">{`${form.major || currentUser.major} · ${form.classYear || currentUser.classYear}`}</p>
              </div>
            </div>

            <div className="mt-4 rounded-[1.4rem] border theme-border theme-panel-subtle px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] theme-text-soft">
                {locale === "en" ? "Bio" : "Giới thiệu"}
              </p>
              <p className="mt-3 text-sm leading-7 theme-text-muted">{form.bio || currentUser.bio || "--"}</p>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <StatusPill>{currentUser.role}</StatusPill>
              <StatusPill>{currentUser.providers.join(" · ")}</StatusPill>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border theme-border theme-panel-subtle px-4 py-2.5 text-sm font-semibold theme-text-strong">
                <Upload className="h-4 w-4" />
                {locale === "en" ? "Upload avatar" : "Tải avatar lên"}
                <input type="file" accept="image/*" onChange={(event) => void handleAvatarUpload(event)} className="hidden" />
              </label>
              {form.avatarImageSrc ? (
                <button
                  type="button"
                  onClick={() => {
                    setAvatarError("");
                    setForm((current) => ({ ...current, avatarImageSrc: undefined }));
                  }}
                  className="rounded-2xl border theme-border theme-panel-subtle px-4 py-2.5 text-sm font-semibold theme-text-strong"
                >
                  {locale === "en" ? "Remove photo" : "Bỏ ảnh"}
                </button>
              ) : null}
            </div>

            {avatarError ? <p className="mt-3 text-xs leading-6 text-rose-300">{avatarError}</p> : null}
            <p className="mt-3 text-xs leading-6 theme-text-faint">
              {locale === "en"
                ? `Avatar images appear in workspace cards and invitation views. Maximum size ${formatFileSize(MAX_AVATAR_FILE_BYTES)}.`
                : `Ảnh avatar sẽ xuất hiện trong thẻ workspace và các màn hình lời mời. Dung lượng tối đa ${formatFileSize(MAX_AVATAR_FILE_BYTES)}.`}
            </p>
          </div>

          <div className="mt-4 rounded-[1.7rem] border theme-border theme-panel-subtle px-5 py-5">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-cyan-200" />
              <p className="text-sm theme-text-body">{form.email || currentUser.email}</p>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <UserRound className="h-4 w-4 text-cyan-200" />
              <p className="text-sm theme-text-body">
                {`${locale === "en" ? "Student ID" : "Mã số sinh viên"}: ${form.studentId || currentUser.studentId}`}
              </p>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <School className="h-4 w-4 text-cyan-200" />
              <p className="text-sm theme-text-body">{form.university || currentUser.university}</p>
            </div>
          </div>
        </Surface>
      </section>
    </div>
  );
}

export function ProfilePage() {
  const { authStatus, isAuthenticated, locale, currentUser, signOutCurrentUser, updateActiveUserProfile } = useSiteState();

  if (authStatus === "loading") {
    return (
      <Surface className="mx-auto max-w-3xl px-6 py-10 text-center">
        <p className="text-sm theme-text-soft">{locale === "en" ? "Loading account..." : "Đang tải tài khoản..."}</p>
      </Surface>
    );
  }

  if (!isAuthenticated) {
    return (
      <Surface className="mx-auto max-w-3xl px-6 py-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200/80">
          {locale === "en" ? "Account required" : "Cần đăng nhập"}
        </p>
        <h1 className="theme-heading mt-4 text-3xl font-semibold theme-text-strong">
          {locale === "en" ? "Sign in to edit your profile." : "Đăng nhập để chỉnh sửa hồ sơ."}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 theme-text-soft">
          {locale === "en"
            ? "Profile editing is now connected to the backend account system."
            : "Phần chỉnh sửa hồ sơ hiện đã được kết nối với hệ thống tài khoản backend."}
        </p>
        <Link
          href="/auth"
          className="theme-button-primary mt-6 inline-flex rounded-[1.4rem] px-5 py-3 text-sm font-semibold"
        >
          {locale === "en" ? "Open sign in" : "Mở đăng nhập"}
        </Link>
      </Surface>
    );
  }

  return (
    <ProfileEditor
      key={currentUser.id}
      locale={locale}
      currentUser={currentUser}
      signOutCurrentUser={signOutCurrentUser}
      updateActiveUserProfile={updateActiveUserProfile}
    />
  );
}
