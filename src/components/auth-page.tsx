"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Building2,
  CalendarDays,
  ChevronDown,
  CircleCheck,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { pickText } from "@/lib/site";
import type { LocalizedText } from "@/types/site";
import { useSiteState } from "@/components/providers/site-state-provider";
import { Surface } from "@/components/site-ui";

const popularVietnamUniversities: LocalizedText[] = [
  { en: "University of Economics and Law (VNU-HCM)", vi: "Đại học Kinh tế - Luật (ĐHQG TP.HCM)" },
  { en: "University of Economics Ho Chi Minh City", vi: "Đại học Kinh tế TP.HCM" },
  { en: "Ho Chi Minh City University of Economics", vi: "Trường Đại học Kinh tế TP.HCM" },
  { en: "Foreign Trade University", vi: "Đại học Ngoại thương" },
  { en: "National Economics University", vi: "Đại học Kinh tế Quốc dân" },
  { en: "Banking University of Ho Chi Minh City", vi: "Đại học Ngân hàng TP.HCM" },
  { en: "RMIT Vietnam", vi: "RMIT Viet Nam" },
  { en: "Fulbright University Vietnam", vi: "Đại học Fulbright Việt Nam" },
  { en: "International University (VNU-HCM)", vi: "Đại học Quốc tế (ĐHQG TP.HCM)" },
  { en: "University of Information Technology (VNU-HCM)", vi: "Đại học Công nghệ Thông tin (ĐHQG TP.HCM)" },
  { en: "Ho Chi Minh City University of Technology", vi: "Đại học Bách khoa TP.HCM" },
  { en: "Posts and Telecommunications Institute of Technology", vi: "Học viện Công nghệ Bưu chính Viễn thông" },
  { en: "Vietnam National University, Hanoi", vi: "Đại học Quốc gia Hà Nội" },
  { en: "Hanoi University of Science and Technology", vi: "Đại học Bách khoa Hà Nội" },
  { en: "Academy of Finance", vi: "Học viện Tài chính" },
  { en: "National Academy of Public Administration", vi: "Học viện Hành chính Quốc gia" },
];

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M21.8 12.23c0-.69-.06-1.2-.19-1.74H12v3.2h5.64c-.11.8-.69 2.01-1.98 2.82l-.02.11 2.56 1.98.18.02c1.64-1.51 2.58-3.73 2.58-6.39Z" />
      <path d="M12 22c2.76 0 5.08-.91 6.78-2.48l-3.23-2.5c-.86.6-2.01 1.02-3.55 1.02-2.7 0-4.99-1.78-5.81-4.25l-.1.01-2.66 2.06-.03.09A10.24 10.24 0 0 0 12 22Z" />
      <path d="M6.19 13.79A6.12 6.12 0 0 1 5.86 12c0-.62.11-1.22.31-1.79l-.01-.12L3.47 8l-.09.04A10 10 0 0 0 2.3 12c0 1.45.35 2.82 1.08 4.04l2.81-2.18Z" />
      <path d="M12 5.96c1.94 0 3.25.84 4 1.54l2.92-2.85C17.07 2.93 14.76 2 12 2a10.24 10.24 0 0 0-8.62 4.95l2.78 2.16c.84-2.47 3.12-4.15 5.84-4.15Z" />
    </svg>
  );
}

const authFieldClassName =
  "theme-placeholder w-full bg-transparent text-[0.95rem] theme-text-strong outline-none placeholder:text-[0.78rem] md:placeholder:text-[0.84rem] lg:placeholder:text-[0.9rem]";

const authTextareaClassName =
  "theme-placeholder w-full rounded-2xl border theme-border theme-panel px-4 py-3.5 text-[0.95rem] theme-text-strong outline-none placeholder:text-[0.78rem] md:placeholder:text-[0.84rem] lg:placeholder:text-[0.9rem]";

export function AuthPage() {
  const router = useRouter();
  const { authStatus, canAccessAdminMode, isAuthenticated, locale, pageContent } = useSiteState();
  const [mode, setMode] = useState<"signin" | "register">("register");
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [signinMessage, setSigninMessage] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    studentId: "",
    university: "",
    major: "",
    classYear: "",
    bio: "",
    password: "",
    confirmPassword: "",
  });
  const [isUniversityMenuOpen, setIsUniversityMenuOpen] = useState(false);
  const universityMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!universityMenuRef.current?.contains(event.target as Node)) {
        setIsUniversityMenuOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    router.replace(canAccessAdminMode ? "/admin" : "/dashboard");
  }, [canAccessAdminMode, isAuthenticated, router]);

  const handleRegisterFieldChange =
    (field: keyof typeof registerForm) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const nextValue = event.target.value;
      setRegisterForm((current) => ({ ...current, [field]: nextValue }));

      if (field === "university") {
        setIsUniversityMenuOpen(true);
      }
    };

  const filteredUniversities = popularVietnamUniversities.filter((entry) => {
    const keyword = normalizeSearch(registerForm.university);

    if (!keyword) {
      return true;
    }

    return `${entry.en} ${entry.vi}`.toLowerCase().includes(keyword);
  });

  const pickedUniversityMatches = popularVietnamUniversities.some((entry) => {
    const keyword = normalizeSearch(registerForm.university);

    if (!keyword) {
      return false;
    }

    return normalizeSearch(entry.en) === keyword || normalizeSearch(entry.vi) === keyword;
  });

  const modeHelperText = {
    signin: {
      en: "Sign in with your email or account ID to continue into the workspace.",
      vi: "Đăng nhập bằng email hoặc ID tài khoản để tiếp tục vào workspace.",
    },
    register: {
      en: "Create your student profile first, then move to team formation and Round 1.",
      vi: "Tạo hồ sơ sinh viên trước, sau đó chuyển sang lập đội và Vòng 1.",
    },
  };

  const resolvePostAuthRedirect = async () => {
    const response = await fetch("/api/me", {
      cache: "no-store",
      credentials: "same-origin",
    });

    if (!response.ok) {
      router.push("/dashboard");
      router.refresh();
      return;
    }

    const payload = (await response.json()) as { user?: { role?: string } | null };
    router.push(payload.user?.role === "admin" || payload.user?.role === "moderator" ? "/admin" : "/dashboard");
    router.refresh();
  };

  const handleSignIn = async () => {
    setIsBusy(true);
    setSigninMessage(null);

    const result = await signIn("credentials", {
      redirect: false,
      login: loginId.trim(),
      password,
    });

    if (result?.error) {
      setSigninMessage(
        locale === "en"
          ? "Invalid credentials. Please check your account ID or password."
          : "Thông tin đăng nhập không hợp lệ. Vui lòng kiểm tra lại ID tài khoản hoặc mật khẩu.",
      );
      setIsBusy(false);
      return;
    }

    setSigninMessage(
      locale === "en"
        ? "Sign in successful. Redirecting..."
        : "Đăng nhập thành công. Đang chuyển hướng...",
    );
    await resolvePostAuthRedirect();
    setIsBusy(false);
  };

  const handleRegister = async () => {
    if (registerForm.password !== registerForm.confirmPassword) {
      setSigninMessage(
        locale === "en"
          ? "Password confirmation does not match."
          : "Xác nhận mật khẩu không khớp.",
      );
      return;
    }

    setIsBusy(true);
    setSigninMessage(null);

    const { confirmPassword, ...registerPayload } = registerForm;
    void confirmPassword;

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
      body: JSON.stringify(registerPayload),
    });

    if (!response.ok) {
      try {
        const payload = (await response.json()) as { error?: string };
        setSigninMessage(payload.error || (locale === "en" ? "Could not create the account." : "Không thể tạo tài khoản."));
      } catch {
        setSigninMessage(locale === "en" ? "Could not create the account." : "Không thể tạo tài khoản.");
      }
      setIsBusy(false);
      return;
    }

    const result = await signIn("credentials", {
      redirect: false,
      login: registerForm.email.trim().toLowerCase(),
      password: registerForm.password,
    });

    if (result?.error) {
      setSigninMessage(
        locale === "en"
          ? "Account created, but automatic sign-in failed. Please sign in manually."
          : "Tạo tài khoản thành công nhưng đăng nhập tự động thất bại. Vui lòng đăng nhập thủ công.",
      );
      setMode("signin");
      setLoginId(registerForm.email.trim().toLowerCase());
      setPassword("");
      setIsBusy(false);
      return;
    }

    setSigninMessage(
      locale === "en"
        ? "Account created successfully. Redirecting..."
        : "Tạo tài khoản thành công. Đang chuyển hướng...",
    );
    await resolvePostAuthRedirect();
    setIsBusy(false);
  };

  const toggleMode = (nextMode: "signin" | "register") => {
    setMode(nextMode);
    setSigninMessage(null);
    setIsUniversityMenuOpen(false);
  };

  const applyUniversityValue = (value: string) => {
    setRegisterForm((current) => ({ ...current, university: value }));
    setIsUniversityMenuOpen(false);
  };

  const handleSignInSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isBusy || authStatus === "loading") {
      return;
    }

    void handleSignIn();
  };

  const handleRegisterSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isBusy || authStatus === "loading") {
      return;
    }

    void handleRegister();
  };

  return (
    <div className="space-y-8">
      <div className="mx-auto max-w-3xl">
        <Surface className="px-6 py-6 md:px-8 md:py-8 xl:px-10 xl:py-10">
          <div className="mb-6 space-y-3 text-center">
            <p className="theme-eyebrow text-xs font-semibold uppercase tracking-[0.3em]">
              {pickText(locale, pageContent.auth.header.eyebrow)}
            </p>
            <h1 className="theme-heading text-3xl font-semibold theme-text-strong">
              {pickText(locale, pageContent.auth.header.title)}
            </h1>
            <p className="mx-auto max-w-2xl text-sm leading-7 theme-text-soft">
              {pickText(locale, modeHelperText[mode])}
            </p>
          </div>

          <div className="relative grid grid-cols-2 rounded-[1.6rem] border theme-border theme-panel p-1.5">
            <span
              className={`pointer-events-none absolute bottom-1.5 left-1.5 top-1.5 w-[calc(50%-0.375rem)] rounded-[1.2rem] bg-[linear-gradient(135deg,#58c4ff,#418bca,#2d75c5)] shadow-[0_18px_40px_rgba(45,117,197,0.24)] transition-transform duration-300 ${
                mode === "register" ? "translate-x-full" : "translate-x-0"
              }`}
            />
            {[
              {
                id: "signin",
                label: locale === "en" ? "Sign in" : "Đăng nhập",
                icon: ShieldCheck,
              },
              {
                id: "register",
                label: locale === "en" ? "Register" : "Đăng ký",
                icon: UserRound,
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleMode(item.id as "signin" | "register")}
                  className={`relative z-10 inline-flex items-center justify-center gap-2 rounded-[1.2rem] px-4 py-3 text-sm font-semibold transition ${
                    mode === item.id ? "text-white" : "theme-text-muted"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="mt-6 space-y-4">
            <button
              type="button"
              onClick={() => void signIn("google", { callbackUrl: "/dashboard" })}
              className="flex w-full items-center justify-center gap-3 rounded-[1.4rem] border border-[#d93025]/25 bg-[linear-gradient(135deg,#f25f54,#ea4335,#d93025)] px-4 py-3.5 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(217,48,37,0.18)] transition hover:brightness-105"
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-white text-[#ea4335] shadow-sm">
                <GoogleMark />
              </span>
              {locale === "en" ? "Continue with Google" : "Tiep tuc voi Google"}
            </button>

            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.26em] theme-text-faint">
              <span className="h-px flex-1 bg-[var(--line)]" />
              {locale === "en" ? "or" : "hoac"}
              <span className="h-px flex-1 bg-[var(--line)]" />
            </div>

            {mode === "signin" ? (
              <form onSubmit={handleSignInSubmit} className="space-y-4">
                <div className="grid gap-4 xl:grid-cols-2">
                  <label className="space-y-2 xl:col-span-2">
                    <span className="text-sm theme-text-muted">
                      {locale === "en" ? "Email or account ID" : "Email hoặc ID tài khoản"}
                    </span>
                    <div className="flex items-center rounded-2xl border theme-border theme-panel px-4 py-3.5">
                      <ShieldCheck className="mr-3 h-4 w-4 theme-text-faint" />
                      <input
                        value={loginId}
                        onChange={(event) => setLoginId(event.target.value)}
                        autoCapitalize="none"
                        autoCorrect="off"
                        autoComplete="username"
                        placeholder={locale === "en" ? "Email or account ID" : "Email hoặc ID tài khoản"}
                        className={authFieldClassName}
                      />
                    </div>
                  </label>

                  <label className="space-y-2 xl:col-span-2">
                    <span className="text-sm theme-text-muted">{locale === "en" ? "Password" : "Mật khẩu"}</span>
                    <div className="flex items-center rounded-2xl border theme-border theme-panel px-4 py-3.5">
                      <LockKeyhole className="mr-3 h-4 w-4 theme-text-faint" />
                      <input
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder={locale === "en" ? "Enter password" : "Nhập mật khẩu"}
                        className={authFieldClassName}
                      />
                    </div>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isBusy || authStatus === "loading"}
                  className="w-full rounded-[1.4rem] bg-[linear-gradient(135deg,#58c4ff,#418bca,#2d75c5)] px-5 py-3.5 text-sm font-semibold text-slate-950"
                >
                  {isBusy
                    ? locale === "en"
                      ? "Processing..."
                      : "Đang xử lý..."
                    : locale === "en"
                      ? "Sign in"
                      : "Đăng nhập"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="grid gap-4 xl:grid-cols-2">
                  <label className="space-y-2 xl:col-span-2">
                    <span className="text-sm theme-text-muted">{locale === "en" ? "Full name" : "Họ tên"}</span>
                    <div className="flex items-center rounded-2xl border theme-border theme-panel px-4 py-3.5">
                      <UserRound className="mr-3 h-4 w-4 theme-text-faint" />
                      <input
                        value={registerForm.name}
                        onChange={handleRegisterFieldChange("name")}
                        placeholder={locale === "en" ? "Nguyen Van A" : "Nguyễn Văn A"}
                        className={authFieldClassName}
                      />
                    </div>
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm theme-text-muted">Email</span>
                    <div className="flex items-center rounded-2xl border theme-border theme-panel px-4 py-3.5">
                      <Mail className="mr-3 h-4 w-4 theme-text-faint" />
                      <input
                        value={registerForm.email}
                        onChange={handleRegisterFieldChange("email")}
                        placeholder="you@example.com"
                        className={authFieldClassName}
                      />
                    </div>
                  </label>

                  <label className="space-y-2 xl:col-span-2">
                    <span className="text-sm theme-text-muted">{locale === "en" ? "University" : "Trường"}</span>
                    <div ref={universityMenuRef} className="relative">
                      <div className="flex items-center rounded-2xl border theme-border theme-panel px-4 py-3.5">
                        <Building2 className="mr-3 h-4 w-4 theme-text-faint" />
                        <input
                          value={registerForm.university}
                          onChange={handleRegisterFieldChange("university")}
                          onFocus={() => setIsUniversityMenuOpen(true)}
                          placeholder={locale === "en" ? "Choose or type your university" : "Chọn hoặc nhập tên trường"}
                          className={authFieldClassName}
                        />
                        <button
                          type="button"
                          onClick={() => setIsUniversityMenuOpen((current) => !current)}
                          className="theme-panel-subtle theme-text-soft ml-3 inline-flex h-7 w-7 items-center justify-center rounded-full border theme-border transition hover:bg-[var(--panel-strong)]"
                          aria-label={locale === "en" ? "Toggle university list" : "Mở danh sách trường"}
                        >
                          <ChevronDown
                            className={`h-4 w-4 transition-transform ${
                              isUniversityMenuOpen ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                      </div>

                      {isUniversityMenuOpen ? (
                        <div className="theme-panel-strong absolute left-0 right-0 top-[calc(100%+0.6rem)] z-20 rounded-[1.4rem] border theme-border p-2 shadow-[0_22px_55px_rgba(15,23,42,0.14)]">
                          <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
                            {filteredUniversities.slice(0, 8).map((entry) => {
                              const label = pickText(locale, entry);

                              return (
                                <button
                                  key={entry.en}
                                  type="button"
                                  onMouseDown={(event) => event.preventDefault()}
                                  onClick={() => applyUniversityValue(label)}
                                  className="flex w-full items-center justify-between rounded-[1rem] px-3 py-3 text-left text-sm transition hover:bg-[rgba(23,114,208,0.06)]"
                                >
                                  <span className="theme-text-strong">{label}</span>
                                  <span className="text-[11px] uppercase tracking-[0.22em] theme-text-faint">
                                    {locale === "en" ? "Pick" : "Chọn"}
                                  </span>
                                </button>
                              );
                            })}

                            {registerForm.university.trim() && !pickedUniversityMatches ? (
                              <button
                                type="button"
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => applyUniversityValue(registerForm.university.trim())}
                                className="flex w-full items-center justify-between rounded-[1rem] border border-dashed theme-border px-3 py-3 text-left text-sm transition hover:bg-[rgba(23,114,208,0.05)]"
                              >
                                <span className="theme-text-strong">{registerForm.university.trim()}</span>
                                <span className="text-[11px] uppercase tracking-[0.22em] theme-text-faint">
                                  {locale === "en" ? "Use custom" : "Dùng tên này"}
                                </span>
                              </button>
                            ) : null}
                          </div>
                          <p className="px-3 pb-1 pt-3 text-xs leading-6 theme-text-faint">
                            {locale === "en"
                              ? "Type to narrow the list. If your school is not listed, keep your own text and continue."
                              : "Gõ để thu hẹp danh sách. Nếu trường của bạn không có sẵn, bạn vẫn có thể giữ tên trường tự nhập."}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm theme-text-muted">{locale === "en" ? "Major" : "Chuyên ngành"}</span>
                    <div className="flex items-center rounded-2xl border theme-border theme-panel px-4 py-3.5">
                      <Building2 className="mr-3 h-4 w-4 theme-text-faint" />
                      <input
                        value={registerForm.major}
                        onChange={handleRegisterFieldChange("major")}
                        placeholder={locale === "en" ? "Finance, Banking, Data..." : "Tài chính, Ngân hàng, Dữ liệu..."}
                        className={authFieldClassName}
                      />
                    </div>
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm theme-text-muted">{locale === "en" ? "Student ID" : "Mã số sinh viên"}</span>
                    <div className="flex items-center rounded-2xl border theme-border theme-panel px-4 py-3.5">
                      <UserRound className="mr-3 h-4 w-4 theme-text-faint" />
                      <input
                        value={registerForm.studentId}
                        onChange={handleRegisterFieldChange("studentId")}
                        placeholder={locale === "en" ? "Student ID" : "Mã số sinh viên"}
                        className={authFieldClassName}
                      />
                    </div>
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm theme-text-muted">{locale === "en" ? "Class year" : "Năm học"}</span>
                    <div className="flex items-center rounded-2xl border theme-border theme-panel px-4 py-3.5">
                      <CalendarDays className="mr-3 h-4 w-4 theme-text-faint" />
                      <input
                        value={registerForm.classYear}
                        onChange={handleRegisterFieldChange("classYear")}
                        placeholder={locale === "en" ? "K24, 2026..." : "K24, 2026..."}
                        className={authFieldClassName}
                      />
                    </div>
                  </label>

                  <label className="space-y-2 xl:col-span-2">
                    <span className="text-sm theme-text-muted">{locale === "en" ? "Bio" : "Giới thiệu"}</span>
                    <textarea
                      rows={4}
                      value={registerForm.bio}
                      onChange={(event) =>
                        setRegisterForm((current) => ({ ...current, bio: event.target.value }))
                      }
                      placeholder={locale === "en" ? "A short student bio" : "Giới thiệu ngắn về bản thân"}
                      className={authTextareaClassName}
                    />
                  </label>

                  <label className="space-y-2 xl:col-span-2">
                    <span className="text-sm theme-text-muted">{locale === "en" ? "Password" : "Mật khẩu"}</span>
                    <div className="flex items-center rounded-2xl border theme-border theme-panel px-4 py-3.5">
                      <LockKeyhole className="mr-3 h-4 w-4 theme-text-faint" />
                      <input
                        type="password"
                        value={registerForm.password}
                        onChange={handleRegisterFieldChange("password")}
                        placeholder={locale === "en" ? "Enter password" : "Nhập mật khẩu"}
                        className={authFieldClassName}
                      />
                    </div>
                  </label>

                  <label className="space-y-2 xl:col-span-2">
                    <span className="text-sm theme-text-muted">
                      {locale === "en" ? "Confirm password" : "Xác nhận mật khẩu"}
                    </span>
                    <div className="flex items-center rounded-2xl border theme-border theme-panel px-4 py-3.5">
                      <CircleCheck className="mr-3 h-4 w-4 theme-text-faint" />
                      <input
                        type="password"
                        value={registerForm.confirmPassword}
                        onChange={handleRegisterFieldChange("confirmPassword")}
                        placeholder={locale === "en" ? "Re-enter password" : "Nhập lại mật khẩu"}
                        className={authFieldClassName}
                      />
                    </div>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isBusy || authStatus === "loading"}
                  className="w-full rounded-[1.4rem] bg-[linear-gradient(135deg,#58c4ff,#418bca,#2d75c5)] px-5 py-3.5 text-sm font-semibold text-slate-950"
                >
                  {isBusy
                    ? locale === "en"
                      ? "Processing..."
                      : "Đang xử lý..."
                    : locale === "en"
                      ? "Create account"
                      : "Tạo tài khoản"}
                </button>
              </form>
            )}

            {signinMessage ? (
              <p className="text-center text-sm theme-text-soft">{signinMessage}</p>
            ) : null}

            <p className="text-center text-sm theme-text-soft">
              {mode === "register"
                ? pickText(locale, pageContent.auth.registerNote)
                : pickText(locale, pageContent.auth.signinNote)}
            </p>
          </div>
        </Surface>
      </div>
    </div>
  );
}
