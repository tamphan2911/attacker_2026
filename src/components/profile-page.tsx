"use client";

import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Mail,
  PencilLine,
  Phone,
  School,
  Upload,
  UserRound,
  Users2,
} from "lucide-react";
import { useEffect, useState, type ChangeEvent } from "react";

import { useSiteState } from "@/components/providers/site-state-provider";
import { GradientAvatar, SectionHeading, StatusPill, Surface } from "@/components/site-ui";
import { getTeamCompetitionState, pickCompetitionStateLabel } from "@/lib/competition";
import { pickText } from "@/lib/site";

const MAX_AVATAR_FILE_BYTES = 1024 * 1024;

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

function pickRoleLabel(locale: ReturnType<typeof useSiteState>["locale"], role: ReturnType<typeof useSiteState>["currentUser"]["role"]) {
  if (locale === "en") {
    switch (role) {
      case "admin":
        return "Administrator";
      case "moderator":
        return "Moderator";
      case "judge":
        return "Judge";
      case "student":
      default:
        return "Participant";
    }
  }

  switch (role) {
    case "admin":
      return "Quản trị viên";
    case "moderator":
      return "Điều phối viên";
    case "judge":
      return "Giám khảo";
    default:
      return "Thí sinh";
  }
}

function pickProviderLabel(locale: ReturnType<typeof useSiteState>["locale"], provider: "email" | "google") {
  if (provider === "google") {
    return "Google";
  }

  return locale === "en" ? "Email" : "Email";
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
                ? `Avatar images appear in profile, workspace cards, and invitation views. Maximum size ${formatFileSize(MAX_AVATAR_FILE_BYTES)}.`
                : `Ảnh avatar xuất hiện trên hồ sơ, thẻ thành viên trong workspace và danh sách lời mời. Dung lượng tối đa ${formatFileSize(MAX_AVATAR_FILE_BYTES)}.`}
            </p>
          </div>
        </Surface>
      </section>
    </div>
  );
}

export function ProfilePage() {
  const { authStatus, isAuthenticated, locale, currentUser, currentTeam, judges } = useSiteState();

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

  const currentTeamState = currentTeam ? getTeamCompetitionState(currentTeam) : undefined;
  const currentJudgeProfile =
    currentUser.role === "judge" && currentUser.judgeProfileId
      ? judges.find((judge) => judge.id === currentUser.judgeProfileId)
      : undefined;
  const providerLabel = currentUser.providers.length
    ? currentUser.providers.map((provider) => pickProviderLabel(locale, provider)).join(" · ")
    : locale === "en"
      ? "No provider"
      : "Chưa có nhà cung cấp";

  return (
    <div className="space-y-10">
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_360px]">
        <Surface className="relative overflow-hidden px-6 py-6 md:px-8 md:py-8">
          <div className="absolute inset-x-0 top-0 h-28 bg-[linear-gradient(135deg,rgba(23,114,208,0.18),rgba(14,165,233,0.08),transparent)]" />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-start">
            <GradientAvatar
              label={currentUser.name}
              tone={currentUser.avatarTone}
              imageSrc={currentUser.avatarImageSrc}
              className="h-28 w-28 rounded-full text-3xl"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200/80">
                {locale === "en" ? "User profile" : "Hồ sơ người dùng"}
              </p>
              <h1 className="theme-heading mt-4 text-3xl font-semibold theme-text-strong md:text-[2.7rem]">
                {currentUser.name}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 theme-text-muted">
                {currentUser.bio || (locale === "en" ? "No bio has been added yet." : "Bạn chưa thêm phần giới thiệu.")}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {currentUser.role === "student" && currentUser.studentId ? (
                  <StatusPill>{`${locale === "en" ? "Student ID" : "MSSV"} · ${currentUser.studentId}`}</StatusPill>
                ) : null}
                <StatusPill>{pickRoleLabel(locale, currentUser.role)}</StatusPill>
                <StatusPill>{providerLabel}</StatusPill>
                {currentTeam && currentTeamState ? (
                  <StatusPill tone={currentTeamState === "not-eligible" ? "warning" : "success"}>
                    {pickCompetitionStateLabel(locale, currentTeamState)}
                  </StatusPill>
                ) : null}
              </div>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/profile/edit"
                  className="theme-button-primary inline-flex items-center justify-center gap-2 rounded-[1.4rem] px-5 py-3.5 text-sm font-semibold"
                >
                  <PencilLine className="h-4 w-4" />
                  {locale === "en" ? "Edit profile" : "Chỉnh sửa hồ sơ"}
                </Link>
                <Link
                  href={currentUser.role === "judge" ? "/judge-dashboard" : "/dashboard"}
                  className="inline-flex items-center justify-center gap-2 rounded-[1.4rem] border theme-border theme-panel px-5 py-3.5 text-sm font-semibold theme-text-strong"
                >
                  {currentUser.role === "judge"
                    ? locale === "en"
                      ? "Judge Dashboard"
                      : "Bảng chấm giám khảo"
                    : locale === "en"
                      ? "Open workspace"
                      : "Mở không gian đội"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </Surface>

        <Surface className="px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200/80">
            {locale === "en" ? "Quick overview" : "Tổng quan nhanh"}
          </p>
          <div className="mt-5 space-y-3">
            <div className="rounded-[1.5rem] border theme-border theme-panel px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] theme-text-soft">
                {currentUser.role === "judge"
                  ? locale === "en"
                    ? "Organization"
                    : "Đơn vị"
                  : locale === "en"
                    ? "University"
                    : "Trường"}
              </p>
              <p className="mt-3 text-sm leading-7 theme-text-body">
                {currentJudgeProfile?.organization || currentUser.university || "--"}
              </p>
            </div>
            <div className="rounded-[1.5rem] border theme-border theme-panel px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] theme-text-soft">
                {currentUser.role === "judge"
                  ? locale === "en"
                    ? "Position / rounds"
                    : "Chức vụ / vòng chấm"
                  : locale === "en"
                    ? "Major / class year"
                    : "Chuyên ngành / năm học"}
              </p>
              <p className="mt-3 text-sm leading-7 theme-text-body">
                {currentUser.role === "judge"
                  ? `${currentJudgeProfile ? pickText(locale, currentJudgeProfile.role) : currentUser.major || "--"} · ${
                      currentJudgeProfile?.rounds.length
                        ? currentJudgeProfile.rounds
                            .map((round) =>
                              round === "round-1"
                                ? locale === "en"
                                  ? "Round 1"
                                  : "Vòng 1"
                                : round === "round-2"
                                  ? locale === "en"
                                    ? "Round 2"
                                    : "Vòng 2"
                                  : locale === "en"
                                    ? "Final round"
                                    : "Chung kết",
                            )
                            .join(" · ")
                        : "--"
                    }`
                  : `${currentUser.major} · ${currentUser.classYear}`}
              </p>
            </div>
            <div className="rounded-[1.5rem] border theme-border theme-panel px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] theme-text-soft">
                {locale === "en" ? "Contact" : "Liên hệ"}
              </p>
              <p className="mt-3 text-sm leading-7 theme-text-body">{currentUser.email}</p>
              <p className="mt-2 text-sm leading-7 theme-text-soft">
                {currentUser.phoneNumber || (locale === "en" ? "No phone number yet" : "Chưa có số điện thoại")}
              </p>
            </div>
          </div>
        </Surface>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Surface className="px-6 py-6">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-sky-400" />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] theme-text-soft">
                {locale === "en" ? "Account email" : "Email tài khoản"}
              </p>
              <p className="mt-2 break-words text-sm leading-7 theme-text-body">{currentUser.email}</p>
            </div>
          </div>
        </Surface>

        <Surface className="px-6 py-6">
          <div className="flex items-center gap-3">
            <Phone className="h-5 w-5 text-sky-400" />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] theme-text-soft">
                {locale === "en" ? "Phone number" : "Số điện thoại"}
              </p>
              <p className="mt-2 break-words text-sm leading-7 theme-text-body">
                {currentUser.phoneNumber || (locale === "en" ? "No phone number yet" : "Chưa có số điện thoại")}
              </p>
            </div>
          </div>
        </Surface>

        <Surface className="px-6 py-6">
          <div className="flex items-center gap-3">
            <School className="h-5 w-5 text-sky-400" />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] theme-text-soft">
                {currentUser.role === "judge"
                  ? locale === "en"
                    ? "Judge role"
                    : "Vai trò giám khảo"
                  : locale === "en"
                    ? "Academic profile"
                    : "Hồ sơ học tập"}
              </p>
              <p className="mt-2 break-words text-sm leading-7 theme-text-body">
                {currentUser.role === "judge"
                  ? `${currentJudgeProfile ? pickText(locale, currentJudgeProfile.role) : currentUser.major} · ${currentJudgeProfile?.organization || currentUser.university}`
                  : `${currentUser.university} · ${currentUser.major}`}
              </p>
            </div>
          </div>
        </Surface>

        <Surface className="px-6 py-6">
          <div className="flex items-center gap-3">
            <UserRound className="h-5 w-5 text-sky-400" />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] theme-text-soft">
                {locale === "en" ? "Profile status" : "Trạng thái hồ sơ"}
              </p>
              <p className="mt-2 break-words text-sm leading-7 theme-text-body">{pickRoleLabel(locale, currentUser.role)}</p>
            </div>
          </div>
        </Surface>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]">
        <Surface className="px-6 py-6 md:px-8 md:py-8">
          <SectionHeading
            eyebrow={locale === "en" ? "Profile details" : "Chi tiết hồ sơ"}
            title={locale === "en" ? "Profile details" : "Chi tiết hồ sơ"}
          />

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.5rem] border theme-border theme-panel px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] theme-text-soft">
                {locale === "en" ? "Full name" : "Họ và tên"}
              </p>
              <p className="mt-3 text-sm theme-text-body">{currentUser.name}</p>
            </div>
            <div className="rounded-[1.5rem] border theme-border theme-panel px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] theme-text-soft">
                {currentUser.role === "judge"
                  ? locale === "en"
                    ? "Judge profile ID"
                    : "Mã hồ sơ giám khảo"
                  : locale === "en"
                    ? "Student ID"
                    : "Mã số sinh viên"}
              </p>
              <p className="mt-3 text-sm theme-text-body">
                {currentUser.role === "judge" ? currentUser.judgeProfileId || "--" : currentUser.studentId || "--"}
              </p>
            </div>
            <div className="rounded-[1.5rem] border theme-border theme-panel px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] theme-text-soft">
                {locale === "en" ? "Phone number" : "Số điện thoại"}
              </p>
              <p className="mt-3 text-sm theme-text-body">
                {currentUser.phoneNumber || "--"}
              </p>
            </div>
            <div className="rounded-[1.5rem] border theme-border theme-panel px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] theme-text-soft">
                {currentUser.role === "judge"
                  ? locale === "en"
                    ? "Organization"
                    : "Đơn vị"
                  : locale === "en"
                    ? "University"
                    : "Trường"}
              </p>
              <p className="mt-3 text-sm theme-text-body">{currentJudgeProfile?.organization || currentUser.university || "--"}</p>
            </div>
            <div className="rounded-[1.5rem] border theme-border theme-panel px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] theme-text-soft">
                {currentUser.role === "judge"
                  ? locale === "en"
                    ? "Assigned rounds"
                    : "Vòng phụ trách"
                  : locale === "en"
                    ? "Class year"
                    : "Khóa / năm học"}
              </p>
              <p className="mt-3 text-sm theme-text-body">
                {currentUser.role === "judge"
                  ? currentJudgeProfile?.rounds.length
                    ? currentJudgeProfile.rounds
                        .map((round) =>
                          round === "round-1"
                            ? locale === "en"
                              ? "Round 1"
                              : "Vòng 1"
                            : round === "round-2"
                              ? locale === "en"
                                ? "Round 2"
                                : "Vòng 2"
                              : locale === "en"
                                ? "Final round"
                                : "Chung kết",
                        )
                        .join(" · ")
                    : "--"
                  : currentUser.classYear}
              </p>
            </div>
          </div>
        </Surface>

        <Surface className="px-6 py-6 md:px-8 md:py-8">
          <div className="flex items-center gap-3">
            <Users2 className="h-5 w-5 text-sky-400" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] theme-text-soft">
                {currentUser.role === "judge"
                  ? locale === "en"
                    ? "Judge assignment"
                    : "Phân công giám khảo"
                  : locale === "en"
                    ? "Current team"
                    : "Đội hiện tại"}
              </p>
              <p className="mt-2 text-lg font-semibold theme-text-strong">
                {currentUser.role === "judge"
                  ? currentJudgeProfile
                    ? locale === "en"
                      ? "Assigned judging rounds"
                      : "Các vòng được phân công chấm"
                    : locale === "en"
                      ? "No linked judge profile"
                      : "Chưa có hồ sơ giám khảo liên kết"
                  : currentTeam
                    ? currentTeam.name
                    : locale === "en"
                      ? "No team yet"
                      : "Chưa tham gia đội"}
              </p>
            </div>
          </div>

          {currentUser.role === "judge" ? (
            <div className="mt-5 rounded-[1.6rem] border theme-border theme-panel px-5 py-5">
              <div className="flex flex-wrap gap-2">
                {currentJudgeProfile?.rounds.map((round) => (
                  <StatusPill key={round} tone={round === "round-1" ? "info" : round === "round-2" ? "success" : "warning"}>
                    {round === "round-1"
                      ? locale === "en"
                        ? "Round 1"
                        : "Vòng 1"
                      : round === "round-2"
                        ? locale === "en"
                          ? "Round 2"
                          : "Vòng 2"
                        : locale === "en"
                          ? "Final round"
                          : "Chung kết"}
                  </StatusPill>
                )) ?? null}
              </div>
              <p className="mt-4 text-sm leading-7 theme-text-muted">
                {locale === "en"
                  ? "Use the judge dashboard to open assigned scoring tasks, read essay responses, download team reports, and save your own judge score."
                  : "Hãy dùng bảng chấm giám khảo để mở các đầu việc được phân công, đọc phần tự luận, tải báo cáo đội thi và lưu điểm chấm riêng của chính bạn."}
              </p>

              <Link
                href="/judge-dashboard"
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold theme-accent"
              >
                {locale === "en" ? "Open judge dashboard" : "Mở bảng chấm giám khảo"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : currentTeam ? (
            <div className="mt-5 rounded-[1.6rem] border theme-border theme-panel px-5 py-5">
              <div className="flex items-start gap-4">
                <GradientAvatar
                  label={currentTeam.name}
                  tone={currentTeam.avatarTone}
                  imageSrc={currentTeam.avatarImageSrc}
                  className="h-16 w-16 rounded-full text-lg"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap gap-2">
                    <StatusPill>{currentTeam.tag}</StatusPill>
                    {currentTeamState ? (
                      <StatusPill tone={currentTeamState === "not-eligible" ? "warning" : "success"}>
                        {pickCompetitionStateLabel(locale, currentTeamState)}
                      </StatusPill>
                    ) : null}
                  </div>
                  <p className="mt-4 text-sm leading-7 theme-text-muted">{currentTeam.bio}</p>
                  <p className="mt-4 text-sm theme-text-soft">
                    {locale === "en"
                      ? `${currentTeam.memberIds.length} members currently in the roster.`
                      : `${currentTeam.memberIds.length} thành viên hiện có trong đội hình.`}
                  </p>
                </div>
              </div>

              <Link
                href="/dashboard"
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold theme-accent"
              >
                {locale === "en" ? "Open team workspace" : "Mở không gian đội"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="mt-5 rounded-[1.6rem] border theme-border theme-panel px-5 py-5">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-sky-400" />
                <p className="text-sm leading-7 theme-text-muted">
                  {locale === "en"
                    ? "You can browse the competition pages now and create or join a team when you are ready."
                    : "Bạn có thể xem các trang thông tin trước, sau đó tạo hoặc tham gia đội khi đã sẵn sàng."}
                </p>
              </div>
              <Link
                href="/dashboard"
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold theme-accent"
              >
                {locale === "en" ? "Go to team workspace" : "Đi tới không gian đội"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </Surface>
      </section>
    </div>
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
