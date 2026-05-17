"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import {
  CircleAlert,
  Building2,
  CalendarDays,
  ChevronDown,
  CircleCheck,
  Eye,
  EyeOff,
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

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || "";
const HAS_TURNSTILE_SITE_KEY = Boolean(TURNSTILE_SITE_KEY);

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          theme?: "light" | "dark" | "auto";
          action?: string;
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        },
      ) => string;
      reset: (widgetId?: string) => void;
      remove?: (widgetId?: string) => void;
    };
  }
}

const popularVietnamUniversities: LocalizedText[] = [
  { en: "University of Economics and Law (VNU-HCM)", vi: "Đại học Kinh tế - Luật (ĐHQG TP.HCM)" },
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

const authFieldClassName =
  "theme-placeholder w-full bg-transparent text-[0.95rem] theme-text-strong outline-none placeholder:text-[0.78rem] md:placeholder:text-[0.84rem] lg:placeholder:text-[0.9rem]";

const authTextareaClassName =
  "theme-placeholder w-full rounded-2xl border theme-border theme-panel px-4 py-3.5 text-[0.95rem] theme-text-strong outline-none placeholder:text-[0.78rem] md:placeholder:text-[0.84rem] lg:placeholder:text-[0.9rem]";

function requiredFieldLabel(label: string) {
  return `${label} (*)`;
}

function createAuthMessage(en: string, vi: string): LocalizedText {
  return { en, vi };
}

type RegistrationFormState = {
  name: string;
  email: string;
  studentId: string;
  university: string;
  major: string;
  classYear: string;
  bio: string;
  password: string;
  confirmPassword: string;
};

type RegisterErrorPayload = {
  error?: string;
  issues?: {
    fieldErrors?: Record<string, string[] | undefined>;
  };
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getRegistrationFieldGuidance(field: keyof RegistrationFormState | "turnstileToken") {
  const messages: Record<string, LocalizedText> = {
    name: {
      en: "Enter your full name so organizers and team leaders can identify your profile.",
      vi: "Nhập họ tên đầy đủ để ban tổ chức và đội trưởng nhận diện hồ sơ của bạn.",
    },
    email: {
      en: "Enter a valid email address. The activation link will be sent to this inbox.",
      vi: "Nhập email hợp lệ. Liên kết kích hoạt tài khoản sẽ được gửi đến hộp thư này.",
    },
    studentId: {
      en: "Enter your student ID exactly as used by your university. It will also be your account ID.",
      vi: "Nhập mã số sinh viên đúng theo thông tin của trường. Mã này cũng sẽ là ID tài khoản của bạn.",
    },
    university: {
      en: "Choose or type your university name before creating the account.",
      vi: "Chọn hoặc nhập tên trường trước khi tạo tài khoản.",
    },
    major: {
      en: "Enter your major or program so your profile has enough academic context.",
      vi: "Nhập ngành học hoặc chương trình học để hồ sơ có đủ thông tin học thuật.",
    },
    classYear: {
      en: "Enter your current class year, for example Year 2, Year 3, or K24.",
      vi: "Nhập năm học hoặc khóa hiện tại, ví dụ Năm 2, Năm 3 hoặc K24.",
    },
    bio: {
      en: "Keep the bio to 600 characters or fewer. You can add more detail after registration.",
      vi: "Giữ phần giới thiệu trong tối đa 600 ký tự. Bạn có thể bổ sung chi tiết sau khi đăng ký.",
    },
    password: {
      en: "Create a password with at least 8 characters.",
      vi: "Tạo mật khẩu có ít nhất 8 ký tự.",
    },
    confirmPassword: {
      en: "Re-enter the same password so we can confirm it was typed correctly.",
      vi: "Nhập lại đúng mật khẩu để hệ thống xác nhận bạn đã gõ chính xác.",
    },
    turnstileToken: {
      en: "Complete the security check before creating the account.",
      vi: "Hoàn tất bước xác minh bảo mật trước khi tạo tài khoản.",
    },
  };

  return messages[field];
}

function getRegistrationInputMessage(form: RegistrationFormState) {
  const trimmedForm = {
    name: form.name.trim(),
    email: form.email.trim(),
    studentId: form.studentId.trim(),
    university: form.university.trim(),
    major: form.major.trim(),
    classYear: form.classYear.trim(),
    bio: form.bio.trim(),
  };

  if (!trimmedForm.name) {
    return getRegistrationFieldGuidance("name");
  }

  if (!trimmedForm.email || !emailPattern.test(trimmedForm.email)) {
    return getRegistrationFieldGuidance("email");
  }

  if (!trimmedForm.university) {
    return getRegistrationFieldGuidance("university");
  }

  if (!trimmedForm.major) {
    return getRegistrationFieldGuidance("major");
  }

  if (!trimmedForm.studentId) {
    return getRegistrationFieldGuidance("studentId");
  }

  if (!trimmedForm.classYear) {
    return getRegistrationFieldGuidance("classYear");
  }

  if (trimmedForm.bio.length > 600) {
    return getRegistrationFieldGuidance("bio");
  }

  if (!form.password || form.password.length < 8) {
    return getRegistrationFieldGuidance("password");
  }

  if (!form.confirmPassword) {
    return getRegistrationFieldGuidance("confirmPassword");
  }

  if (form.password !== form.confirmPassword) {
    return createAuthMessage(
      "The confirmation password must match the password exactly. Please check both fields.",
      "Mật khẩu xác nhận phải trùng hoàn toàn với mật khẩu đã nhập. Vui lòng kiểm tra lại cả hai trường.",
    );
  }

  return null;
}

function getRegistrationServerMessage(payload: RegisterErrorPayload) {
  const fieldOrder: Array<keyof RegistrationFormState | "turnstileToken"> = [
    "name",
    "email",
    "university",
    "major",
    "studentId",
    "classYear",
    "bio",
    "password",
    "turnstileToken",
  ];
  const fieldWithError = fieldOrder.find((field) => payload.issues?.fieldErrors?.[field]?.length);

  if (fieldWithError) {
    return getRegistrationFieldGuidance(fieldWithError);
  }

  if (payload.error === "EMAIL_ALREADY_REGISTERED") {
    return createAuthMessage(
      "This email is already registered. Sign in with this email or use a different email address.",
      "Email này đã được đăng ký. Hãy đăng nhập bằng email này hoặc dùng một email khác.",
    );
  }

  if (payload.error === "STUDENT_ID_ALREADY_REGISTERED") {
    return createAuthMessage(
      "This student ID is already linked to an account. Check the student ID or sign in with the existing account.",
      "Mã số sinh viên này đã gắn với một tài khoản. Hãy kiểm tra lại mã số hoặc đăng nhập bằng tài khoản đã có.",
    );
  }

  if (payload.error === "ACCOUNT_ALREADY_EXISTS") {
    return createAuthMessage(
      "An account already exists with the email or student ID you entered. Please review those two fields.",
      "Đã có tài khoản dùng email hoặc mã số sinh viên bạn vừa nhập. Vui lòng kiểm tra lại hai trường này.",
    );
  }

  if (payload.error === "Invalid registration payload.") {
    return createAuthMessage(
      "Some registration information is incomplete or invalid. Please review the required fields.",
      "Một số thông tin đăng ký còn thiếu hoặc chưa hợp lệ. Vui lòng kiểm tra lại các trường bắt buộc.",
    );
  }

  return payload.error
    ? createAuthMessage(payload.error, payload.error)
    : createAuthMessage(
        "Could not create the account. Please review the form and try again.",
        "Không thể tạo tài khoản. Vui lòng kiểm tra lại biểu mẫu và thử lại.",
      );
}

function PasswordVisibilityButton({
  visible,
  label,
  onClick,
}: {
  visible: boolean;
  label: string;
  onClick: () => void;
}) {
  const Icon = visible ? EyeOff : Eye;

  return (
    <button
      type="button"
      onClick={onClick}
      className="ml-3 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border theme-border theme-panel-subtle theme-text-soft transition hover:border-sky-400/36 hover:bg-sky-400/10 hover:text-sky-700 dark:hover:text-sky-100"
      aria-label={label}
      title={label}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

export function AuthPage() {
  const router = useRouter();
  const { authStatus, canAccessAdminMode, isAuthenticated, locale, pageContent, theme } = useSiteState();
  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [isTurnstileReady, setIsTurnstileReady] = useState(false);
  const [signinMessage, setSigninMessage] = useState<string | LocalizedText | null>(null);
  const [signinMessageTone, setSigninMessageTone] = useState<"info" | "success" | "warning" | "error">("info");
  const [signinActionHref, setSigninActionHref] = useState<string | null>(null);
  const [signinActionLabel, setSigninActionLabel] = useState<string | LocalizedText | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [isSigninPasswordVisible, setIsSigninPasswordVisible] = useState(false);
  const [isRegisterPasswordVisible, setIsRegisterPasswordVisible] = useState(false);
  const [isRegisterConfirmPasswordVisible, setIsRegisterConfirmPasswordVisible] = useState(false);
  const [registerForm, setRegisterForm] = useState<RegistrationFormState>({
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
  const turnstileContainerRef = useRef<HTMLDivElement | null>(null);
  const turnstileWidgetIdRef = useRef<string | null>(null);

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

    if (canAccessAdminMode) {
      router.replace("/admin");
      return;
    }

    void (async () => {
      const response = await fetch("/api/me", {
        cache: "no-store",
        credentials: "same-origin",
      });

      if (!response.ok) {
        router.replace("/profile");
        return;
      }

      const payload = (await response.json()) as { user?: { role?: string } | null };
      router.replace(
        payload.user?.role === "judge"
          ? "/judge-dashboard"
          : payload.user?.role === "admin" || payload.user?.role === "moderator"
            ? "/admin"
            : "/profile",
      );
    })();
  }, [canAccessAdminMode, isAuthenticated, router]);

  useEffect(() => {
    if (!isTurnstileReady || !turnstileContainerRef.current || !window.turnstile || !HAS_TURNSTILE_SITE_KEY) {
      return;
    }

    if (turnstileWidgetIdRef.current && window.turnstile.remove) {
      window.turnstile.remove(turnstileWidgetIdRef.current);
      turnstileWidgetIdRef.current = null;
    }

    turnstileContainerRef.current.innerHTML = "";

    turnstileWidgetIdRef.current = window.turnstile.render(turnstileContainerRef.current, {
      sitekey: TURNSTILE_SITE_KEY,
      theme: theme === "dark" ? "dark" : "light",
      action: mode === "register" ? "register" : "sign_in",
      callback: (token) => {
        setTurnstileToken(token);
      },
      "expired-callback": () => {
        setTurnstileToken("");
        setSigninActionHref(null);
        setSigninActionLabel(null);
        setSigninMessageTone("warning");
        const nextAction = mode === "register"
          ? createAuthMessage("creating the account", "tạo tài khoản")
          : createAuthMessage("signing in", "đăng nhập");
        setSigninMessage(
          createAuthMessage(
            `The security check expired. Please confirm it again before ${nextAction.en}.`,
            `Mã xác minh bảo mật đã hết hạn. Vui lòng xác nhận lại trước khi ${nextAction.vi}.`,
          ),
        );
      },
      "error-callback": () => {
        setTurnstileToken("");
        setSigninActionHref(null);
        setSigninActionLabel(null);
        setSigninMessageTone("error");
        setSigninMessage(
          createAuthMessage(
            "The security check could not load. Please refresh and try again.",
            "Khối xác minh bảo mật không tải được. Vui lòng tải lại trang và thử lại.",
          ),
        );
      },
    });
  }, [isTurnstileReady, mode, theme]);

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
      router.push("/profile");
      router.refresh();
      return;
    }

    const payload = (await response.json()) as { user?: { role?: string } | null };
    router.push(
      payload.user?.role === "admin" || payload.user?.role === "moderator"
        ? "/admin"
        : payload.user?.role === "judge"
          ? "/judge-dashboard"
          : "/profile",
    );
    router.refresh();
  };

  const resetTurnstileWidget = () => {
    setTurnstileToken("");
    if (turnstileWidgetIdRef.current && window.turnstile) {
      window.turnstile.reset(turnstileWidgetIdRef.current);
    }
  };

  const handleSignIn = async () => {
    if (!turnstileToken) {
      setSigninMessageTone("warning");
      setSigninMessage(
        createAuthMessage(
          "Please complete the security check before signing in.",
          "Vui lòng hoàn tất bước xác minh bảo mật trước khi đăng nhập.",
        ),
      );
      return;
    }

    setIsBusy(true);
    setSigninMessage(null);
    setSigninMessageTone("info");
    setSigninActionHref(null);
    setSigninActionLabel(null);

    const result = await signIn("credentials", {
      redirect: false,
      login: loginId.trim(),
      password,
      turnstileToken,
    });

    if (result?.error) {
      resetTurnstileWidget();
      if (result.error === "CAPTCHA_FAILED") {
        setSigninMessageTone("error");
        setSigninMessage(
          createAuthMessage(
            "Security verification failed. Please try the CAPTCHA again.",
            "Xác minh bảo mật không thành công. Vui lòng thử lại CAPTCHA.",
          ),
        );
        setIsBusy(false);
        return;
      }

      if (result.error === "EMAIL_NOT_VERIFIED") {
        setSigninActionHref(
          `/auth/check-email?intent=activation${
            loginId.includes("@") ? `&email=${encodeURIComponent(loginId.trim().toLowerCase())}` : ""
          }`,
        );
        setSigninActionLabel(
          createAuthMessage("Open activation help", "Mở hướng dẫn kích hoạt"),
        );
        setSigninMessageTone("warning");
        setSigninMessage(
          createAuthMessage(
            "This account is not active yet. Please open the activation email first.",
            "Tài khoản này chưa được kích hoạt. Vui lòng mở email kích hoạt trước.",
          ),
        );
        setIsBusy(false);
        return;
      }

      setSigninMessageTone("error");
      setSigninMessage(
        createAuthMessage(
          "Invalid credentials. Please check your account ID or password.",
          "Thông tin đăng nhập không hợp lệ. Vui lòng kiểm tra lại ID tài khoản hoặc mật khẩu.",
        ),
      );
      setIsBusy(false);
      return;
    }

    setSigninMessageTone("success");
    setSigninMessage(
      locale === "en"
        ? "Sign in successful. Redirecting..."
        : "Đăng nhập thành công. Đang chuyển hướng...",
    );
    await resolvePostAuthRedirect();
    setIsBusy(false);
  };

  const handleRegister = async () => {
    const registrationInputMessage = getRegistrationInputMessage(registerForm);
    if (registrationInputMessage) {
      setSigninMessageTone("warning");
      setSigninMessage(registrationInputMessage);
      return;
    }

    if (!HAS_TURNSTILE_SITE_KEY) {
      setSigninMessageTone("warning");
      setSigninMessage(
        createAuthMessage(
          "The registration security check is not available yet. Please contact the organizer before creating an account.",
          "Bước xác minh bảo mật cho đăng ký chưa sẵn sàng. Vui lòng liên hệ ban tổ chức trước khi tạo tài khoản.",
        ),
      );
      return;
    }

    if (!turnstileToken) {
      setSigninMessageTone("warning");
      setSigninMessage(getRegistrationFieldGuidance("turnstileToken"));
      return;
    }

    setIsBusy(true);
    setSigninMessage(null);
    setSigninMessageTone("info");
    setSigninActionHref(null);
    setSigninActionLabel(null);

    const { confirmPassword, ...registerPayload } = registerForm;
    void confirmPassword;

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
      body: JSON.stringify({ ...registerPayload, locale, turnstileToken }),
    });

    if (!response.ok) {
      try {
        const payload = (await response.json()) as RegisterErrorPayload;
        if (payload.error === "CAPTCHA_FAILED") {
          resetTurnstileWidget();
          setSigninMessageTone("error");
          setSigninMessage(
            createAuthMessage(
              "Security verification failed. Please try the CAPTCHA again.",
              "Xác minh bảo mật không thành công. Vui lòng thử lại CAPTCHA.",
            ),
          );
        } else if (payload.error === "CAPTCHA_NOT_CONFIGURED") {
          setSigninMessageTone("warning");
          setSigninMessage(
            createAuthMessage(
              "Security verification is not configured yet. Please ask the organizer to configure Cloudflare Turnstile.",
              "Xác minh bảo mật chưa được cấu hình. Vui lòng yêu cầu ban tổ chức cấu hình Cloudflare Turnstile.",
            ),
          );
        } else {
          setSigninMessageTone("error");
          setSigninMessage(getRegistrationServerMessage(payload));
        }
      } catch {
        setSigninMessageTone("error");
        setSigninMessage(
          createAuthMessage(
            "Could not create the account. Please review the form and try again.",
            "Không thể tạo tài khoản. Vui lòng kiểm tra lại biểu mẫu và thử lại.",
          ),
        );
      }
      setIsBusy(false);
      return;
    }

    const payload = (await response.json()) as {
      email?: string;
      emailDeliveryMode?: "smtp" | "log" | "error";
    };

    setIsBusy(false);
    router.push(
      `/auth/check-email?intent=activation&email=${encodeURIComponent(payload.email ?? registerForm.email.trim().toLowerCase())}&delivery=${encodeURIComponent(payload.emailDeliveryMode ?? "smtp")}`,
    );
  };

  const toggleMode = (nextMode: "signin" | "register") => {
    setMode(nextMode);
    setTurnstileToken("");
    setSigninMessage(null);
    setSigninMessageTone("info");
    setSigninActionHref(null);
    setSigninActionLabel(null);
    setIsUniversityMenuOpen(false);
    setIsSigninPasswordVisible(false);
    setIsRegisterPasswordVisible(false);
    setIsRegisterConfirmPasswordVisible(false);
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
      {HAS_TURNSTILE_SITE_KEY ? (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
          onReady={() => setIsTurnstileReady(true)}
        />
      ) : null}
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
                        className={`${authFieldClassName} min-w-0`}
                        required
                      />
                    </div>
                  </label>

                  <label className="space-y-2 xl:col-span-2">
                    <span className="text-sm theme-text-muted">{locale === "en" ? "Password" : "Mật khẩu"}</span>
                    <div className="flex items-center rounded-2xl border theme-border theme-panel px-4 py-3.5">
                      <LockKeyhole className="mr-3 h-4 w-4 theme-text-faint" />
                      <input
                        type={isSigninPasswordVisible ? "text" : "password"}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        autoComplete="current-password"
                        placeholder={locale === "en" ? "Enter password" : "Nhập mật khẩu"}
                        className={`${authFieldClassName} min-w-0`}
                        required
                      />
                      <PasswordVisibilityButton
                        visible={isSigninPasswordVisible}
                        onClick={() => setIsSigninPasswordVisible((current) => !current)}
                        label={
                          isSigninPasswordVisible
                            ? locale === "en"
                              ? "Hide password"
                              : "Ẩn mật khẩu"
                            : locale === "en"
                              ? "Show password"
                              : "Hiện mật khẩu"
                        }
                      />
                    </div>
                  </label>
                </div>

                <div className="flex justify-end">
                  <Link
                    href="/auth/reset-password"
                    className="text-sm font-medium theme-accent transition hover:opacity-80"
                  >
                    {locale === "en" ? "Forgot password?" : "Quên mật khẩu?"}
                  </Link>
                </div>

                <div className="space-y-2">
                  <p className="text-sm theme-text-muted">
                    {locale === "en" ? "Security check" : "Xác minh bảo mật"}
                  </p>
                  <div className="rounded-[1.5rem] border theme-border theme-panel px-4 py-4">
                    {HAS_TURNSTILE_SITE_KEY ? (
                      <>
                        <div ref={turnstileContainerRef} className="min-h-[70px]" />
                      </>
                    ) : (
                      <p className="text-xs leading-6 text-amber-700 dark:text-amber-200">
                        {locale === "en"
                          ? "Cloudflare Turnstile is not configured yet. Add a real site key and secret to enable sign-in."
                          : "Cloudflare Turnstile chưa được cấu hình. Hãy thêm site key và secret thật để bật đăng nhập."}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isBusy || authStatus === "loading" || !turnstileToken}
                  className="w-full rounded-[1.4rem] bg-[linear-gradient(135deg,#58c4ff,#418bca,#2d75c5)] px-5 py-3.5 text-sm font-semibold text-white"
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
              <form onSubmit={handleRegisterSubmit} className="space-y-4" noValidate>
                <div className="grid gap-4 xl:grid-cols-2">
                  <label className="space-y-2 xl:col-span-2">
	                    <span className="text-sm theme-text-muted">{requiredFieldLabel(locale === "en" ? "Full name" : "Họ tên")}</span>
                    <div className="flex items-center rounded-2xl border theme-border theme-panel px-4 py-3.5">
                      <UserRound className="mr-3 h-4 w-4 theme-text-faint" />
                      <input
                        value={registerForm.name}
                        onChange={handleRegisterFieldChange("name")}
                        placeholder={locale === "en" ? "Nguyen Van A" : "Nguyễn Văn A"}
                        className={authFieldClassName}
                        required
                      />
                    </div>
                  </label>

                  <label className="space-y-2 xl:col-span-2">
                    <span className="text-sm theme-text-muted">{requiredFieldLabel("Email")}</span>
                    <div className="flex items-center rounded-2xl border theme-border theme-panel px-4 py-3.5">
                      <Mail className="mr-3 h-4 w-4 theme-text-faint" />
                      <input
                        value={registerForm.email}
                        onChange={handleRegisterFieldChange("email")}
                        placeholder="you@example.com"
                        className={authFieldClassName}
                        required
                      />
                    </div>
                  </label>

                  <label className="space-y-2 xl:col-span-2">
	                    <span className="text-sm theme-text-muted">{requiredFieldLabel(locale === "en" ? "University" : "Trường")}</span>
                    <div ref={universityMenuRef} className="relative">
                      <div className="flex items-center rounded-2xl border theme-border theme-panel px-4 py-3.5">
                        <Building2 className="mr-3 h-4 w-4 theme-text-faint" />
                        <input
                          value={registerForm.university}
                          onChange={handleRegisterFieldChange("university")}
                          onFocus={() => setIsUniversityMenuOpen(true)}
                          placeholder={locale === "en" ? "Choose or type your university" : "Chọn hoặc nhập tên trường"}
                          className={authFieldClassName}
                          required
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
                        <div className="theme-auth-university-menu theme-panel-strong absolute left-0 right-0 top-[calc(100%+0.6rem)] z-20 rounded-[1.4rem] border theme-border p-2 shadow-[0_22px_55px_rgba(15,23,42,0.14)]">
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
	                    <span className="text-sm theme-text-muted">{requiredFieldLabel(locale === "en" ? "Major" : "Chuyên ngành")}</span>
                    <div className="flex items-center rounded-2xl border theme-border theme-panel px-4 py-3.5">
                      <Building2 className="mr-3 h-4 w-4 theme-text-faint" />
                      <input
                        value={registerForm.major}
                        onChange={handleRegisterFieldChange("major")}
                        placeholder={locale === "en" ? "Finance, Banking, Data..." : "Tài chính, Ngân hàng, Dữ liệu..."}
                        className={authFieldClassName}
                        required
                      />
                    </div>
                  </label>

                  <label className="space-y-2">
	                    <span className="text-sm theme-text-muted">{requiredFieldLabel(locale === "en" ? "Student ID" : "Mã số sinh viên")}</span>
                    <div className="flex items-center rounded-2xl border theme-border theme-panel px-4 py-3.5">
                      <UserRound className="mr-3 h-4 w-4 theme-text-faint" />
                      <input
                        value={registerForm.studentId}
                        onChange={handleRegisterFieldChange("studentId")}
                        placeholder={locale === "en" ? "Student ID" : "Mã số sinh viên"}
                        className={authFieldClassName}
                        required
                      />
                    </div>
                  </label>

                  <label className="space-y-2">
	                    <span className="text-sm theme-text-muted">{requiredFieldLabel(locale === "en" ? "Class year" : "Năm học")}</span>
                    <div className="flex items-center rounded-2xl border theme-border theme-panel px-4 py-3.5">
                      <CalendarDays className="mr-3 h-4 w-4 theme-text-faint" />
                      <input
                        value={registerForm.classYear}
                        onChange={handleRegisterFieldChange("classYear")}
                        placeholder={locale === "en" ? "Year 2..." : "Năm 2..."}
                        className={authFieldClassName}
                        required
                      />
                    </div>
                  </label>

                  <label className="space-y-2 xl:col-span-2">
                    <span className="text-sm theme-text-muted">
                      {locale === "en" ? "Bio (optional)" : "Giới thiệu (không bắt buộc)"}
                    </span>
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
	                    <span className="text-sm theme-text-muted">{requiredFieldLabel(locale === "en" ? "Password" : "Mật khẩu")}</span>
                    <div className="flex items-center rounded-2xl border theme-border theme-panel px-4 py-3.5">
                      <LockKeyhole className="mr-3 h-4 w-4 theme-text-faint" />
                      <input
                        type={isRegisterPasswordVisible ? "text" : "password"}
                        value={registerForm.password}
                        onChange={handleRegisterFieldChange("password")}
                        autoComplete="new-password"
                        placeholder={locale === "en" ? "Enter password" : "Nhập mật khẩu"}
                        className={`${authFieldClassName} min-w-0`}
                        required
                      />
                      <PasswordVisibilityButton
                        visible={isRegisterPasswordVisible}
                        onClick={() => setIsRegisterPasswordVisible((current) => !current)}
                        label={
                          isRegisterPasswordVisible
                            ? locale === "en"
                              ? "Hide password"
                              : "Ẩn mật khẩu"
                            : locale === "en"
                              ? "Show password"
                              : "Hiện mật khẩu"
                        }
                      />
                    </div>
                  </label>

                  <label className="space-y-2 xl:col-span-2">
                    <span className="text-sm theme-text-muted">
	                      {requiredFieldLabel(locale === "en" ? "Confirm password" : "Xác nhận mật khẩu")}
                    </span>
                    <div className="flex items-center rounded-2xl border theme-border theme-panel px-4 py-3.5">
                      <CircleCheck className="mr-3 h-4 w-4 theme-text-faint" />
                      <input
                        type={isRegisterConfirmPasswordVisible ? "text" : "password"}
                        value={registerForm.confirmPassword}
                        onChange={handleRegisterFieldChange("confirmPassword")}
                        autoComplete="new-password"
                        placeholder={locale === "en" ? "Re-enter password" : "Nhập lại mật khẩu"}
                        className={`${authFieldClassName} min-w-0`}
                        required
                      />
                      <PasswordVisibilityButton
                        visible={isRegisterConfirmPasswordVisible}
                        onClick={() => setIsRegisterConfirmPasswordVisible((current) => !current)}
                        label={
                          isRegisterConfirmPasswordVisible
                            ? locale === "en"
                              ? "Hide confirm password"
                              : "Ẩn xác nhận mật khẩu"
                            : locale === "en"
                              ? "Show confirm password"
                              : "Hiện xác nhận mật khẩu"
                        }
                      />
                    </div>
                  </label>
                </div>

                <div className="space-y-2">
                  <p className="text-sm theme-text-muted">
                    {requiredFieldLabel(locale === "en" ? "Security check" : "Xác minh bảo mật")}
                  </p>
                  <div className="rounded-[1.5rem] border theme-border theme-panel px-4 py-4">
                    {HAS_TURNSTILE_SITE_KEY ? (
                      <>
                        <div ref={turnstileContainerRef} className="min-h-[70px]" />
                      </>
                    ) : (
                      <p className="text-xs leading-6 text-amber-700 dark:text-amber-200">
                        {locale === "en"
                          ? "Cloudflare Turnstile is not configured yet. Add a real site key and secret to enable registration."
                          : "Cloudflare Turnstile chưa được cấu hình. Hãy thêm site key và secret thật để bật đăng ký."}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isBusy || authStatus === "loading"}
                  className="w-full rounded-[1.4rem] bg-[linear-gradient(135deg,#58c4ff,#418bca,#2d75c5)] px-5 py-3.5 text-sm font-semibold text-white"
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
              <div
                className={`space-y-3 rounded-[1.5rem] border px-4 py-4 text-left shadow-[0_12px_32px_rgba(15,23,42,0.08)] ${
                  signinMessageTone === "success"
                    ? "border-emerald-500/28 bg-[linear-gradient(135deg,rgba(16,185,129,0.14),rgba(52,211,153,0.08))] dark:border-emerald-300/18 dark:bg-emerald-300/10"
                    : signinMessageTone === "warning"
                      ? "border-amber-500/30 bg-[linear-gradient(135deg,rgba(251,191,36,0.16),rgba(245,158,11,0.08))] dark:border-amber-300/20 dark:bg-amber-300/10"
                      : signinMessageTone === "error"
                        ? "border-rose-500/28 bg-[linear-gradient(135deg,rgba(244,63,94,0.14),rgba(251,113,133,0.08))] dark:border-rose-300/20 dark:bg-rose-300/10"
                        : "border-sky-500/24 bg-[linear-gradient(135deg,rgba(56,189,248,0.14),rgba(59,130,246,0.08))] dark:border-sky-300/18 dark:bg-sky-300/10"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border ${
                      signinMessageTone === "success"
                        ? "border-emerald-500/20 bg-white/70 text-emerald-700 dark:border-emerald-300/18 dark:bg-white/5 dark:text-emerald-200"
                        : signinMessageTone === "warning"
                          ? "border-amber-500/24 bg-white/70 text-amber-700 dark:border-amber-300/18 dark:bg-white/5 dark:text-amber-200"
                          : signinMessageTone === "error"
                            ? "border-rose-500/20 bg-white/70 text-rose-700 dark:border-rose-300/18 dark:bg-white/5 dark:text-rose-200"
                            : "border-sky-500/20 bg-white/70 text-sky-700 dark:border-sky-300/18 dark:bg-white/5 dark:text-sky-200"
                    }`}
                  >
                    {signinMessageTone === "success" ? (
                      <CircleCheck className="h-4.5 w-4.5" />
                    ) : (
                      <CircleAlert className="h-4.5 w-4.5" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] theme-text-faint">
                      {signinMessageTone === "success"
                        ? locale === "en"
                          ? "Success"
                          : "Thành công"
                        : signinMessageTone === "warning"
                          ? locale === "en"
                            ? "Attention"
                            : "Lưu ý"
                          : signinMessageTone === "error"
                            ? locale === "en"
                              ? "Action needed"
                              : "Cần xử lý"
                            : locale === "en"
                              ? "Notice"
                              : "Thông báo"}
                    </p>
                    <p className="mt-2 text-sm font-medium leading-7 theme-text-strong">
                      {typeof signinMessage === "string" ? signinMessage : pickText(locale, signinMessage)}
                    </p>
                  </div>
                </div>
                {signinActionHref && signinActionLabel ? (
                  <Link
                    href={signinActionHref}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-900/10 bg-white/72 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-sky-500/28 hover:bg-white/92 active:scale-[0.98] dark:border-white/10 dark:bg-white/6 dark:text-white dark:hover:bg-white/10"
                  >
                    {typeof signinActionLabel === "string" ? signinActionLabel : pickText(locale, signinActionLabel)}
                  </Link>
                ) : null}
              </div>
            ) : null}
          </div>
        </Surface>
      </div>
    </div>
  );
}
