"use client";

import Link from "next/link";
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  PencilLine,
  Upload,
  Users2,
  X,
} from "lucide-react";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";

import { useSiteState } from "@/components/providers/site-state-provider";
import { GradientAvatar, SectionHeading, Surface } from "@/components/site-ui";
import { ALLOWED_AVATAR_IMAGE_TYPES, MAX_AVATAR_IMAGE_BYTES, formatAvatarFileSize } from "@/lib/avatar-images";
import { pickRound1LockStatusLabel } from "@/lib/competition";

interface ProfileFormState {
  name: string;
  email: string;
  studentId: string;
  phoneNumber: string;
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
    phoneNumber: user.phoneNumber,
    university: user.university,
    major: user.major,
    classYear: user.classYear,
    bio: user.bio,
    avatarImageSrc: user.avatarImageSrc,
  };
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

function pickTeamUserRoleLabel(locale: ReturnType<typeof useSiteState>["locale"], isLeader: boolean) {
  if (isLeader) {
    return locale === "en" ? "Leader" : "Đội trưởng";
  }

  return locale === "en" ? "Member" : "Thành viên";
}

function AuthRequiredState({
  locale,
  title,
  description,
}: {
  locale: ReturnType<typeof useSiteState>["locale"];
  title: string;
  description: string;
}) {
  return (
    <Surface className="mx-auto max-w-3xl px-6 py-10 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200/80">
        {locale === "en" ? "Account required" : "Cần đăng nhập"}
      </p>
      <h1 className="theme-heading mt-4 text-3xl font-semibold theme-text-strong">{title}</h1>
      <p className="mx-auto mt-4 max-w-xl text-sm leading-7 theme-text-soft">{description}</p>
      <Link
        href="/auth"
        className="theme-button-primary mt-6 inline-flex rounded-[1.4rem] px-5 py-3 text-sm font-semibold"
      >
        {locale === "en" ? "Open sign in" : "Mở đăng nhập"}
      </Link>
    </Surface>
  );
}

function ProfileEditor({
  locale,
  currentUser,
  updateActiveUserProfile,
}: Pick<
  ReturnType<typeof useSiteState>,
  "locale" | "currentUser" | "updateActiveUserProfile"
>) {
  const [form, setForm] = useState<ProfileFormState>(() => createProfileFormState(currentUser));
  const [avatarError, setAvatarError] = useState("");
  const isStudentAccount = currentUser.role === "student";

  useEffect(() => {
    setForm(createProfileFormState(currentUser));
  }, [currentUser]);

  const handleAvatarUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!ALLOWED_AVATAR_IMAGE_TYPES.has(file.type)) {
      setAvatarError(
        locale === "en"
          ? "Only JPEG, PNG, WebP, or GIF images are allowed."
          : "Chỉ chấp nhận ảnh JPEG, PNG, WebP hoặc GIF.",
      );
      return;
    }

    if (file.size > MAX_AVATAR_IMAGE_BYTES) {
      setAvatarError(
        locale === "en"
          ? `Avatar images must be ${formatAvatarFileSize(MAX_AVATAR_IMAGE_BYTES)} or smaller.`
          : `Ảnh avatar phải có dung lượng ${formatAvatarFileSize(MAX_AVATAR_IMAGE_BYTES)} trở xuống.`,
      );
      return;
    }

    try {
      const imageSrc = await readImageFileAsDataUrl(file);
      setAvatarError("");
      setForm((current) => ({ ...current, avatarImageSrc: imageSrc }));
    } catch {
      // Ignore failed local previews in the current client flow.
    }
  };

  const handleSave = () => {
    updateActiveUserProfile({
      name: form.name,
      email: form.email,
      studentId: form.studentId,
      phoneNumber: form.phoneNumber,
      university: form.university,
      major: form.major,
      classYear: form.classYear,
      bio: form.bio,
      avatarImageSrc: form.avatarImageSrc,
    });
  };

  return (
    <div className="space-y-10">
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Surface className="px-6 py-6 md:px-8 md:py-8">
          <SectionHeading
            eyebrow={locale === "en" ? "Profile / Edit" : "Hồ sơ / Chỉnh sửa"}
            title={locale === "en" ? "Update your account information." : "Cập nhật thông tin tài khoản."}
            description={
              locale === "en"
                ? "Adjust the information shown across invitations, workspace cards, and the account profile."
                : "Điều chỉnh thông tin hiển thị trên lời mời, thẻ thành viên và trang hồ sơ tài khoản."
            }
          />

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm theme-text-muted">{locale === "en" ? "Full name" : "Họ và tên"}</span>
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
                autoComplete="email"
                inputMode="email"
                className="theme-placeholder w-full rounded-2xl border theme-border theme-panel px-4 py-3 text-sm theme-text-strong outline-none"
              />
            </label>

            {isStudentAccount ? (
              <label className="space-y-2">
                <span className="text-sm theme-text-muted">{locale === "en" ? "Student ID" : "Mã số sinh viên"}</span>
                <input
                  value={form.studentId}
                  onChange={(event) => setForm((current) => ({ ...current, studentId: event.target.value }))}
                  className="theme-placeholder w-full rounded-2xl border theme-border theme-panel px-4 py-3 text-sm theme-text-strong outline-none"
                />
              </label>
            ) : null}

            <label className="space-y-2">
              <span className="text-sm theme-text-muted">{locale === "en" ? "Phone number" : "Số điện thoại"}</span>
              <input
                value={form.phoneNumber}
                onChange={(event) => setForm((current) => ({ ...current, phoneNumber: event.target.value }))}
                placeholder={locale === "en" ? "Optional contact number" : "Số liên hệ không bắt buộc"}
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
              <span className="text-sm theme-text-muted">{locale === "en" ? "Class year" : "Khóa / năm học"}</span>
              <input
                value={form.classYear}
                onChange={(event) => setForm((current) => ({ ...current, classYear: event.target.value }))}
                className="theme-placeholder w-full rounded-2xl border theme-border theme-panel px-4 py-3 text-sm theme-text-strong outline-none"
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm theme-text-muted">{locale === "en" ? "Bio" : "Giới thiệu"}</span>
              <textarea
                rows={5}
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
              href="/profile"
              className="inline-flex items-center justify-center gap-2 rounded-[1.4rem] border theme-border theme-panel px-5 py-3.5 text-sm font-semibold theme-text-strong"
            >
              {locale === "en" ? "Back to profile" : "Quay lại hồ sơ"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Surface>

        <Surface className="px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200/80">
            {locale === "en" ? "Preview card" : "Thẻ xem trước"}
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
                  {(form.studentId || currentUser.studentId) &&
                    `${locale === "en" ? "Student ID" : "MSSV"} · ${form.studentId || currentUser.studentId}`}
                </p>
                <p className="mt-2 text-sm theme-text-soft">
                  {form.phoneNumber || currentUser.phoneNumber || (locale === "en" ? "No phone number yet" : "Chưa có số điện thoại")}
                </p>
                <p className="mt-2 text-sm theme-text-soft">{form.university || currentUser.university}</p>
                <p className="mt-2 text-xs theme-text-faint">{`${form.major || currentUser.major} · ${form.classYear || currentUser.classYear}`}</p>
              </div>
            </div>

            <div className="mt-4 rounded-[1.4rem] border theme-border theme-panel-subtle px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] theme-text-soft">
                {locale === "en" ? "Bio" : "Giới thiệu"}
              </p>
              <p className="mt-3 text-sm leading-7 theme-text-muted">
                {form.bio || currentUser.bio || (locale === "en" ? "No bio yet." : "Chưa có phần giới thiệu.")}
              </p>
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
                  {locale === "en" ? "Remove photo" : "Gỡ ảnh"}
                </button>
              ) : null}
            </div>

            {avatarError ? <p className="mt-3 text-xs leading-6 text-rose-300">{avatarError}</p> : null}
            <p className="mt-3 text-xs leading-6 theme-text-faint">
              {locale === "en"
                ? `Avatar images appear in profile, workspace cards, and invitation views. Maximum size ${formatAvatarFileSize(MAX_AVATAR_IMAGE_BYTES)}.`
                : `Ảnh avatar xuất hiện trên hồ sơ, thẻ thành viên trong workspace và danh sách lời mời. Dung lượng tối đa ${formatAvatarFileSize(MAX_AVATAR_IMAGE_BYTES)}.`}
            </p>
          </div>
        </Surface>
      </section>
    </div>
  );
}

function ChangePasswordDialog({
  locale,
  isOpen,
  onClose,
  onSaved,
}: {
  locale: ReturnType<typeof useSiteState>["locale"];
  isOpen: boolean;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const resetForm = () => {
    setNewPassword("");
    setConfirmPassword("");
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setError("");
    setIsSaving(false);
  };

  const handleClose = () => {
    if (isSaving) {
      return;
    }

    resetForm();
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!newPassword || !confirmPassword) {
      setError(locale === "en" ? "Both password fields are required." : "Vui lòng nhập đầy đủ hai trường mật khẩu.");
      return;
    }

    if (newPassword.length < 8) {
      setError(locale === "en" ? "Password must be at least 8 characters." : "Mật khẩu cần có ít nhất 8 ký tự.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(locale === "en" ? "Password confirmation does not match." : "Mật khẩu xác nhận chưa khớp.");
      return;
    }

    setIsSaving(true);
    setError("");

    const response = await fetch("/api/me/password", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
      body: JSON.stringify({
        password: newPassword,
        confirmPassword,
      }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(payload?.error || (locale === "en" ? "Could not change password." : "Không thể đổi mật khẩu."));
      setIsSaving(false);
      return;
    }

    setIsSaving(false);
    resetForm();
    onClose();
    onSaved(locale === "en" ? "Password changed successfully." : "Mật khẩu đã được thay đổi thành công.");
  };

  const renderPasswordInput = ({
    label,
    value,
    onChange,
    isVisible,
    onToggle,
    autoComplete,
  }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    isVisible: boolean;
    onToggle: () => void;
    autoComplete: string;
  }) => (
    <label className="block space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.2em] theme-text-soft">{label}</span>
      <span className="relative block">
        <input
          type={isVisible ? "text" : "password"}
          required
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          className="theme-placeholder h-12 w-full rounded-2xl border theme-border theme-panel px-4 pr-12 text-sm font-semibold theme-text-strong outline-none transition focus:border-sky-400/60"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border theme-border theme-panel-subtle theme-text-soft transition hover:scale-105"
          aria-label={isVisible ? (locale === "en" ? "Hide password" : "Ẩn mật khẩu") : locale === "en" ? "Show password" : "Hiện mật khẩu"}
        >
          {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </span>
    </label>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
        onClick={handleClose}
        aria-label={locale === "en" ? "Close change password window" : "Đóng cửa sổ đổi mật khẩu"}
        disabled={isSaving}
      />
      <form
        onSubmit={(event) => void handleSubmit(event)}
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-password-title"
        className="relative w-full max-w-md overflow-hidden rounded-[2rem] border theme-border theme-panel px-5 py-5 shadow-[0_28px_90px_rgba(15,23,42,0.28)] transition duration-200"
      >
        <div className="absolute inset-x-0 top-0 h-28 bg-[linear-gradient(135deg,rgba(14,165,233,0.18),rgba(23,114,208,0.08),transparent)]" />
        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="theme-button-primary inline-flex h-11 w-11 items-center justify-center rounded-2xl p-0">
                <KeyRound className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] theme-eyebrow">
                  {locale === "en" ? "Account security" : "Bảo mật tài khoản"}
                </p>
                <h2 id="change-password-title" className="mt-1 text-2xl font-semibold theme-text-strong">
                  {locale === "en" ? "Change password" : "Đổi mật khẩu"}
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              disabled={isSaving}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border theme-border theme-panel-subtle theme-text-soft transition hover:-translate-y-0.5"
              aria-label={locale === "en" ? "Close" : "Đóng"}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-6 space-y-4">
            {renderPasswordInput({
              label: locale === "en" ? "New password (*)" : "Mật khẩu mới (*)",
              value: newPassword,
              onChange: setNewPassword,
              isVisible: showNewPassword,
              onToggle: () => setShowNewPassword((current) => !current),
              autoComplete: "new-password",
            })}
            {renderPasswordInput({
              label: locale === "en" ? "Confirm new password (*)" : "Xác nhận mật khẩu mới (*)",
              value: confirmPassword,
              onChange: setConfirmPassword,
              isVisible: showConfirmPassword,
              onToggle: () => setShowConfirmPassword((current) => !current),
              autoComplete: "new-password",
            })}
          </div>

          {error ? (
            <p className="mt-4 rounded-2xl border border-rose-400/24 bg-rose-500/10 px-4 py-3 text-sm leading-6 text-rose-700 dark:text-rose-100">
              {error}
            </p>
          ) : null}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSaving}
              className="inline-flex items-center justify-center rounded-[1.35rem] border theme-border theme-panel px-5 py-3 text-sm font-semibold theme-text-strong"
            >
              {locale === "en" ? "Cancel" : "Hủy"}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="theme-button-primary inline-flex items-center justify-center gap-2 rounded-[1.35rem] px-5 py-3 text-sm font-semibold disabled:opacity-60"
            >
              {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              {isSaving
                ? locale === "en"
                  ? "Saving..."
                  : "Đang lưu..."
                : locale === "en"
                  ? "Save password"
                  : "Lưu mật khẩu"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export function ProfilePage() {
  const { authStatus, isAuthenticated, locale, currentUser, currentTeam, updateActiveUserProfile } = useSiteState();
  const [avatarError, setAvatarError] = useState("");
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [passwordSuccessMessage, setPasswordSuccessMessage] = useState("");

  useEffect(() => {
    if (!passwordSuccessMessage) {
      return;
    }

    const timeout = window.setTimeout(() => setPasswordSuccessMessage(""), 5200);
    return () => window.clearTimeout(timeout);
  }, [passwordSuccessMessage]);

  const handleProfileAvatarUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!ALLOWED_AVATAR_IMAGE_TYPES.has(file.type)) {
      setAvatarError(
        locale === "en"
          ? "Only JPEG, PNG, WebP, or GIF images are allowed."
          : "Chỉ chấp nhận ảnh JPEG, PNG, WebP hoặc GIF.",
      );
      return;
    }

    if (file.size > MAX_AVATAR_IMAGE_BYTES) {
      setAvatarError(
        locale === "en"
          ? `Avatar images must be ${formatAvatarFileSize(MAX_AVATAR_IMAGE_BYTES)} or smaller.`
          : `Ảnh avatar phải có dung lượng ${formatAvatarFileSize(MAX_AVATAR_IMAGE_BYTES)} trở xuống.`,
      );
      return;
    }

    try {
      const imageSrc = await readImageFileAsDataUrl(file);
      setAvatarError("");
      updateActiveUserProfile({ avatarImageSrc: imageSrc });
    } catch {
      setAvatarError(locale === "en" ? "Could not read this image file." : "Không thể đọc tệp ảnh này.");
    }
  };

  if (authStatus === "loading") {
    return (
      <Surface className="mx-auto max-w-3xl px-6 py-10 text-center">
        <p className="text-sm theme-text-soft">{locale === "en" ? "Loading account..." : "Đang tải tài khoản..."}</p>
      </Surface>
    );
  }

  if (!isAuthenticated) {
    return (
      <AuthRequiredState
        locale={locale}
        title={locale === "en" ? "Sign in to view your profile." : "Đăng nhập để xem hồ sơ cá nhân."}
        description={
          locale === "en"
            ? "Your profile page now acts as the account overview for personal, academic, and team information."
            : "Trang hồ sơ hiện là nơi tổng hợp thông tin cá nhân, học thuật và trạng thái đội thi của bạn."
        }
      />
    );
  }

  const isTeamLeader = Boolean(currentTeam && currentTeam.leaderId === currentUser.id);
  const primaryActionHref =
    currentUser.role === "judge"
      ? "/judge-dashboard"
      : currentUser.role === "admin" || currentUser.role === "moderator"
        ? "/admin"
        : "/dashboard";
  const primaryActionLabel =
    currentUser.role === "judge"
      ? locale === "en"
        ? "Judge Dashboard"
        : "Bảng chấm giám khảo"
      : currentUser.role === "admin" || currentUser.role === "moderator"
        ? locale === "en"
          ? "Admin mode"
          : "Chế độ admin"
        : locale === "en"
          ? "Open workspace"
          : "Mở không gian đội";
  const universityDisplay = currentUser.university || (locale === "en" ? "No university yet" : "Chưa có trường");
  const majorClassYearDisplay =
    [currentUser.major, currentUser.classYear].filter(Boolean).join(" · ") ||
    (locale === "en" ? "No major or class year yet" : "Chưa có ngành học hoặc khóa");
  const emailDisplay = currentUser.email || (locale === "en" ? "No email yet" : "Chưa có email");
  const phoneDisplay =
    currentUser.phoneNumber || (locale === "en" ? "No phone number yet" : "Chưa có số điện thoại");

  return (
    <>
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <Surface className="relative overflow-hidden px-6 py-7 md:px-8 md:py-9">
        <div className="absolute inset-x-0 top-0 h-40 bg-[linear-gradient(135deg,rgba(23,114,208,0.2),rgba(14,165,233,0.08),transparent)]" />
        <div className="relative flex flex-col gap-7 md:flex-row md:items-start">
          <div className="relative w-fit shrink-0">
            <GradientAvatar
              label={currentUser.name}
              tone={currentUser.avatarTone}
              imageSrc={currentUser.avatarImageSrc}
              className="h-32 w-32 rounded-full text-3xl md:h-36 md:w-36"
            />
            <label
              className="theme-button-primary absolute -bottom-1 -right-1 inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/40 p-0 shadow-[0_16px_34px_rgba(14,165,233,0.28)] transition hover:-translate-y-0.5 active:translate-y-0"
              aria-label={locale === "en" ? "Upload or edit avatar" : "Tải lên hoặc đổi avatar"}
              title={locale === "en" ? "Upload or edit avatar" : "Tải lên hoặc đổi avatar"}
            >
              <Camera className="h-4 w-4" />
              <input type="file" accept="image/*" onChange={(event) => void handleProfileAvatarUpload(event)} className="hidden" />
            </label>
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-sky-600 dark:text-sky-200/80">
              {locale === "en" ? "User profile" : "Hồ sơ người dùng"}
            </p>
            <h1 className="theme-heading mt-5 text-4xl font-semibold theme-text-strong md:text-[3.35rem] md:leading-[1.04]">
              {currentUser.name}
            </h1>
            <p className="mt-5 max-w-3xl text-sm leading-8 theme-text-muted md:text-base">
              {currentUser.bio || (locale === "en" ? "No bio has been added yet." : "Bạn chưa thêm phần giới thiệu.")}
            </p>

            {avatarError ? (
              <p className="mt-5 rounded-2xl border border-rose-400/24 bg-rose-500/10 px-4 py-3 text-sm leading-6 text-rose-700 dark:text-rose-100">
                {avatarError}
              </p>
            ) : null}

            {passwordSuccessMessage ? (
              <div className="mt-5 flex items-center gap-3 rounded-2xl border border-emerald-500/24 bg-emerald-500/10 px-4 py-3 text-sm font-semibold leading-6 text-emerald-700 dark:text-emerald-100">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <span>{passwordSuccessMessage}</span>
              </div>
            ) : null}

            {currentTeam ? (
              <div className="mt-7 rounded-[1.45rem] border theme-border theme-panel-subtle px-4 py-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-sky-500/18 bg-sky-500/10 text-sky-600 dark:text-sky-200">
                      <Users2 className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] theme-eyebrow">
                        {locale === "en" ? "Team information" : "Thông tin đội"}
                      </p>
                      <p className="mt-1 text-sm font-semibold theme-text-strong">{currentTeam.name}</p>
                    </div>
                  </div>
                  <p className="text-xs font-semibold theme-text-soft">
                    {pickTeamUserRoleLabel(locale, isTeamLeader)}
                  </p>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  <div className="rounded-2xl border theme-border bg-white/65 px-3 py-3 dark:bg-white/[0.04]">
                    <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] theme-text-soft">
                      {locale === "en" ? "Team status" : "Trạng thái đội"}
                    </p>
                    <p className="mt-1.5 text-xs font-semibold theme-text-strong">
                      {pickRound1LockStatusLabel(locale, currentTeam.round1LockStatus)}
                    </p>
                  </div>
                  <div className="rounded-2xl border theme-border bg-white/65 px-3 py-3 dark:bg-white/[0.04]">
                    <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] theme-text-soft">
                      {locale === "en" ? "Members" : "Số thành viên"}
                    </p>
                    <p className="mt-1.5 text-xs font-semibold theme-text-strong">
                      {locale === "en" ? `${currentTeam.memberIds.length} members` : `${currentTeam.memberIds.length} thành viên`}
                    </p>
                  </div>
                  <div className="rounded-2xl border theme-border bg-white/65 px-3 py-3 dark:bg-white/[0.04]">
                    <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] theme-text-soft">
                      {locale === "en" ? "Team tag" : "Mã đội"}
                    </p>
                    <p className="mt-1.5 text-xs font-semibold theme-text-strong">{currentTeam.tag}</p>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/profile/edit"
                className="theme-button-primary inline-flex items-center justify-center gap-2 rounded-[1.5rem] px-5 py-3.5 text-sm font-semibold"
              >
                <PencilLine className="h-4 w-4" />
                {locale === "en" ? "Edit profile" : "Chỉnh sửa hồ sơ"}
              </Link>
              <button
                type="button"
                onClick={() => setIsPasswordDialogOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-[1.5rem] border theme-border theme-panel px-5 py-3.5 text-sm font-semibold theme-text-strong transition hover:-translate-y-0.5"
              >
                <KeyRound className="h-4 w-4" />
                {locale === "en" ? "Change password" : "Đổi mật khẩu"}
              </button>
              <Link
                href={primaryActionHref}
                className="inline-flex items-center justify-center gap-2 rounded-[1.5rem] border theme-border theme-panel px-5 py-3.5 text-sm font-semibold theme-text-strong"
              >
                {primaryActionLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </Surface>

      <Surface className="relative overflow-hidden px-5 py-6 md:px-6 md:py-7">
        <div className="absolute inset-x-0 top-0 h-32 bg-[linear-gradient(135deg,rgba(14,165,233,0.12),rgba(23,114,208,0.08),transparent)]" />
        <div className="relative">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-sky-600 dark:text-sky-200/80">
            {locale === "en" ? "Quick overview" : "Tổng quan nhanh"}
          </p>
          <div className="mt-5 space-y-3">
            <div className="rounded-[1.55rem] border theme-border theme-panel-subtle px-4 py-4">
              <p className="text-[0.66rem] font-semibold uppercase tracking-[0.24em] theme-text-soft">
                {locale === "en" ? "University" : "Trường"}
              </p>
              <p className="mt-3 text-sm font-semibold leading-6 theme-text-strong">{universityDisplay}</p>
            </div>

            <div className="rounded-[1.55rem] border theme-border theme-panel-subtle px-4 py-4">
              <p className="text-[0.66rem] font-semibold uppercase tracking-[0.24em] theme-text-soft">
                {locale === "en" ? "Major / class year" : "Ngành / khóa"}
              </p>
              <p className="mt-3 text-sm font-semibold leading-6 theme-text-strong">{majorClassYearDisplay}</p>
            </div>

            <div className="rounded-[1.55rem] border theme-border theme-panel-subtle px-4 py-4">
              <p className="text-[0.66rem] font-semibold uppercase tracking-[0.24em] theme-text-soft">
                {locale === "en" ? "Contact" : "Liên hệ"}
              </p>
              <p className="mt-3 break-words text-sm font-semibold leading-6 theme-text-strong">{emailDisplay}</p>
              <p className="mt-2 text-sm leading-6 theme-text-muted">{phoneDisplay}</p>
            </div>
          </div>
        </div>
      </Surface>
      </section>
      <ChangePasswordDialog
        locale={locale}
        isOpen={isPasswordDialogOpen}
        onClose={() => setIsPasswordDialogOpen(false)}
        onSaved={setPasswordSuccessMessage}
      />
    </>
  );
}

export function ProfileEditPage() {
  const { authStatus, isAuthenticated, locale, currentUser, updateActiveUserProfile } = useSiteState();

  if (authStatus === "loading") {
    return (
      <Surface className="mx-auto max-w-3xl px-6 py-10 text-center">
        <p className="text-sm theme-text-soft">{locale === "en" ? "Loading account..." : "Đang tải tài khoản..."}</p>
      </Surface>
    );
  }

  if (!isAuthenticated) {
    return (
      <AuthRequiredState
        locale={locale}
        title={locale === "en" ? "Sign in to edit your profile." : "Đăng nhập để chỉnh sửa hồ sơ."}
        description={
          locale === "en"
            ? "Profile editing is tied directly to the backend account system."
            : "Chỉnh sửa hồ sơ hiện được gắn trực tiếp với hệ thống tài khoản backend."
        }
      />
    );
  }

  return (
    <ProfileEditor
      key={currentUser.id}
      locale={locale}
      currentUser={currentUser}
      updateActiveUserProfile={updateActiveUserProfile}
    />
  );
}
