"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle2, LockKeyhole, Mail, RotateCcw, ShieldCheck, TriangleAlert } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useSiteState } from "@/components/providers/site-state-provider";
import { SectionHeading, Surface } from "@/components/site-ui";

function AuthFlowShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <Surface className="px-6 py-7 md:px-8 md:py-9">
        <SectionHeading eyebrow={eyebrow} title={title} description={description} />
        <div className="mt-8">{children}</div>
      </Surface>
    </div>
  );
}

function fieldClassName() {
  return "theme-placeholder w-full rounded-2xl border theme-border theme-panel px-4 py-3 text-sm theme-text-strong outline-none";
}

export function AuthCheckEmailPage() {
  const { locale } = useSiteState();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState("");

  const intent = searchParams.get("intent") === "reset" ? "reset" : "activation";
  const deliveryMode = searchParams.get("delivery");

  const headline =
    intent === "activation"
      ? locale === "en"
        ? "Check your inbox to activate the account."
        : "Hãy kiểm tra hộp thư để kích hoạt tài khoản."
      : locale === "en"
        ? "Check your inbox for the reset link."
        : "Hãy kiểm tra hộp thư để nhận liên kết đặt lại mật khẩu.";

  const description =
    intent === "activation"
      ? locale === "en"
        ? "We sent an activation email to the registered address. The account stays inactive until the activation link is opened."
        : "Chúng tôi đã gửi email kích hoạt tới địa chỉ đã đăng ký. Tài khoản sẽ vẫn ở trạng thái chưa hoạt động cho đến khi liên kết kích hoạt được mở."
      : locale === "en"
        ? "If the email exists in the system, a secure password-reset link has been sent."
        : "Nếu email tồn tại trong hệ thống, một liên kết đặt lại mật khẩu an toàn đã được gửi đi.";

  const deliveryNote =
    deliveryMode === "log"
      ? locale === "en"
        ? "Outgoing email is not configured yet, so this environment only logs the email on the server."
        : "Hệ thống gửi email đi chưa được cấu hình, nên môi trường này hiện chỉ ghi email vào log phía máy chủ."
      : deliveryMode === "error"
        ? locale === "en"
          ? "The account was created, but the system could not deliver the email. Check the SMTP configuration and use the resend action below."
          : "Tài khoản đã được tạo, nhưng hệ thống chưa gửi được email. Hãy kiểm tra cấu hình SMTP rồi dùng nút gửi lại bên dưới."
      : "";

  const handleResend = async () => {
    setIsBusy(true);
    setMessage("");

    const response = await fetch("/api/auth/resend-activation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
      body: JSON.stringify({ email, locale }),
    });

    if (!response.ok) {
      setMessage(
        locale === "en"
          ? "Could not resend the activation email right now."
          : "Hiện chưa thể gửi lại email kích hoạt.",
      );
      setIsBusy(false);
      return;
    }

    const payload = (await response.json()) as { emailDeliveryMode?: string };
    setMessage(
      payload.emailDeliveryMode === "log"
        ? locale === "en"
          ? "Activation email was regenerated, but outgoing email is not configured yet in this environment."
          : "Email kích hoạt đã được tạo lại, nhưng môi trường này vẫn chưa cấu hình hệ thống gửi email."
        : payload.emailDeliveryMode === "error"
          ? locale === "en"
            ? "The activation email was regenerated, but delivery still failed. Please re-check SMTP and try again."
            : "Email kích hoạt đã được tạo lại, nhưng việc gửi vẫn thất bại. Vui lòng kiểm tra lại SMTP rồi thử lại."
        : locale === "en"
          ? "Activation email sent again."
          : "Đã gửi lại email kích hoạt.",
    );
    setIsBusy(false);
  };

  return (
    <AuthFlowShell
      eyebrow={intent === "activation" ? (locale === "en" ? "Account activation" : "Kích hoạt tài khoản") : locale === "en" ? "Password reset" : "Đặt lại mật khẩu"}
      title={headline}
      description={description}
    >
      <div className="space-y-5">
        <div className="rounded-[1.7rem] border theme-border bg-white/74 px-5 py-5 dark:bg-white/[0.05]">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-sky-500/18 bg-sky-500/10">
              <Mail className="h-4.5 w-4.5 text-sky-600 dark:text-sky-200" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold theme-text-strong">
                {locale === "en" ? "Destination email" : "Email nhận"}
              </p>
              <p className="mt-2 break-all text-sm leading-7 theme-text-body">
                {email || (locale === "en" ? "Enter the email below if you need to resend." : "Hãy nhập email bên dưới nếu bạn cần gửi lại.")}
              </p>
              {deliveryNote ? <p className="mt-3 text-sm leading-7 text-amber-600 dark:text-amber-200">{deliveryNote}</p> : null}
            </div>
          </div>
        </div>

        {intent === "activation" ? (
          <Surface className="space-y-4 px-5 py-5">
            <div>
              <p className="text-sm font-semibold theme-text-strong">
                {locale === "en" ? "Need another activation email?" : "Cần gửi lại email kích hoạt?"}
              </p>
              <p className="mt-2 text-sm leading-7 theme-text-soft">
                {locale === "en"
                  ? "Enter the account email and request a fresh activation link."
                  : "Nhập email tài khoản để yêu cầu một liên kết kích hoạt mới."}
              </p>
            </div>

            <div className="flex flex-col gap-3 md:flex-row">
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className={fieldClassName()}
              />
              <button
                type="button"
                disabled={!email.trim() || isBusy}
                onClick={() => void handleResend()}
                className="theme-button-primary inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RotateCcw className="h-4 w-4" />
                {isBusy
                  ? locale === "en"
                    ? "Sending..."
                    : "Đang gửi..."
                  : locale === "en"
                    ? "Resend activation"
                    : "Gửi lại kích hoạt"}
              </button>
            </div>
          </Surface>
        ) : null}

        {message ? (
          <Surface className="px-5 py-4">
            <p className="text-sm theme-text-body">{message}</p>
          </Surface>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Link
            href="/auth"
            className="theme-button-secondary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
          >
            {locale === "en" ? "Back to sign in" : "Quay lại đăng nhập"}
          </Link>
          {intent === "reset" ? (
            <Link
              href="/auth/reset-password"
              className="inline-flex items-center gap-2 rounded-full border border-sky-500/22 bg-sky-500/[0.08] px-5 py-3 text-sm font-semibold text-sky-700 transition hover:border-sky-500/34 hover:bg-sky-500/[0.12] active:scale-[0.98] dark:text-sky-100"
            >
              {locale === "en" ? "Request another reset link" : "Yêu cầu liên kết mới"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : null}
        </div>
      </div>
    </AuthFlowShell>
  );
}

export function AuthActivatePage() {
  const { locale } = useSiteState();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"pending" | "success" | "expired" | "invalid">("pending");

  useEffect(() => {
    if (!token) {
      return;
    }

    let cancelled = false;
    void (async () => {
      const response = await fetch("/api/auth/activate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({ token }),
      });

      if (cancelled) {
        return;
      }

      if (response.ok) {
        setStatus("success");
        return;
      }

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setStatus(payload?.error === "expired" ? "expired" : "invalid");
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const statusCopy = {
    pending: {
      title: locale === "en" ? "Activating your account..." : "Đang kích hoạt tài khoản...",
      description:
        locale === "en"
          ? "Please wait while we confirm your email address."
          : "Vui lòng đợi trong khi hệ thống xác nhận địa chỉ email của bạn.",
      icon: <Mail className="h-5 w-5 text-sky-600 dark:text-sky-200" />,
    },
    success: {
      title: locale === "en" ? "Your account is active now." : "Tài khoản của bạn đã được kích hoạt.",
      description:
        locale === "en"
          ? "You can sign in immediately and continue into the competition workspace."
          : "Bạn có thể đăng nhập ngay và tiếp tục vào không gian cuộc thi.",
      icon: <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-200" />,
    },
    expired: {
      title: locale === "en" ? "This activation link has expired." : "Liên kết kích hoạt này đã hết hạn.",
      description:
        locale === "en"
          ? "Request a new activation email from the sign-in flow or the check-email page."
          : "Hãy yêu cầu email kích hoạt mới từ luồng đăng nhập hoặc trang kiểm tra hộp thư.",
      icon: <TriangleAlert className="h-5 w-5 text-amber-600 dark:text-amber-200" />,
    },
    invalid: {
      title: locale === "en" ? "This activation link is invalid." : "Liên kết kích hoạt này không hợp lệ.",
      description:
        locale === "en"
          ? "Open a fresh activation email and try again."
          : "Hãy mở một email kích hoạt mới và thử lại.",
      icon: <TriangleAlert className="h-5 w-5 text-amber-600 dark:text-amber-200" />,
    },
  } as const;

  const current = statusCopy[token ? status : "invalid"];

  return (
    <AuthFlowShell
      eyebrow={locale === "en" ? "Account activation" : "Kích hoạt tài khoản"}
      title={current.title}
      description={current.description}
    >
      <div className="space-y-5">
        <Surface className="px-5 py-5">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-900/8 bg-slate-950/[0.03] dark:border-white/10 dark:bg-white/[0.05]">
              {current.icon}
            </span>
            <div>
              <p className="text-sm font-semibold theme-text-strong">
                {(token ? status : "invalid") === "success"
                  ? locale === "en"
                    ? "Activation completed"
                    : "Kích hoạt hoàn tất"
                  : locale === "en"
                    ? "Activation status"
                    : "Trạng thái kích hoạt"}
              </p>
              <p className="mt-2 text-sm leading-7 theme-text-soft">{current.description}</p>
            </div>
          </div>
        </Surface>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/auth"
            className="theme-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
          >
            {locale === "en" ? "Open sign in" : "Mở đăng nhập"}
            <ArrowRight className="h-4 w-4" />
          </Link>
          {status !== "success" ? (
            <Link
              href="/auth/check-email?intent=activation"
              className="theme-button-secondary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
            >
              {locale === "en" ? "Open check-email page" : "Mở trang kiểm tra email"}
            </Link>
          ) : null}
        </div>
      </div>
    </AuthFlowShell>
  );
}

export function PasswordResetRequestPage() {
  const { locale } = useSiteState();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsBusy(true);
    setMessage("");

    const response = await fetch("/api/auth/request-password-reset", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
      body: JSON.stringify({ email, locale }),
    });

    if (!response.ok) {
      setMessage(
        locale === "en"
          ? "Could not process the password-reset request right now."
          : "Hiện chưa thể xử lý yêu cầu đặt lại mật khẩu.",
      );
      setIsBusy(false);
      return;
    }

    const payload = (await response.json()) as { emailDeliveryMode?: string };
    router.push(
      `/auth/check-email?intent=reset&email=${encodeURIComponent(email.trim())}&delivery=${encodeURIComponent(payload.emailDeliveryMode || "smtp")}`,
    );
  };

  return (
    <AuthFlowShell
      eyebrow={locale === "en" ? "Password reset" : "Đặt lại mật khẩu"}
      title={locale === "en" ? "Request a secure reset link." : "Yêu cầu liên kết đặt lại an toàn."}
      description={
        locale === "en"
          ? "Enter the account email. If it exists and is already verified, we will send a time-limited reset link."
          : "Nhập email tài khoản. Nếu email tồn tại và đã được xác thực, hệ thống sẽ gửi một liên kết đặt lại có thời hạn."
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <label className="space-y-2">
          <span className="text-sm theme-text-muted">Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className={fieldClassName()}
            required
          />
        </label>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={isBusy}
            className="theme-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Mail className="h-4 w-4" />
            {isBusy
              ? locale === "en"
                ? "Sending..."
                : "Đang gửi..."
              : locale === "en"
                ? "Send reset link"
                : "Gửi liên kết đặt lại"}
          </button>
          <Link
            href="/auth"
            className="theme-button-secondary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
          >
            {locale === "en" ? "Back to sign in" : "Quay lại đăng nhập"}
          </Link>
        </div>

        {message ? <p className="text-sm theme-text-soft">{message}</p> : null}
      </form>
    </AuthFlowShell>
  );
}

export function PasswordResetConfirmPage() {
  const { locale } = useSiteState();
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token") ?? "", [searchParams]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "expired" | "invalid">("idle");
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      setStatus("invalid");
      return;
    }

    if (password !== confirmPassword) {
      setMessage(
        locale === "en"
          ? "Password confirmation does not match."
          : "Xác nhận mật khẩu không khớp.",
      );
      return;
    }

    setIsBusy(true);
    setMessage("");

    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
      body: JSON.stringify({ token, password }),
    });

    if (response.ok) {
      setStatus("success");
      setIsBusy(false);
      return;
    }

    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    setStatus(payload?.error === "expired" ? "expired" : "invalid");
    setIsBusy(false);
  };

  return (
    <AuthFlowShell
      eyebrow={locale === "en" ? "Password reset" : "Đặt lại mật khẩu"}
      title={
        status === "success"
          ? locale === "en"
            ? "Your password has been updated."
            : "Mật khẩu của bạn đã được cập nhật."
          : locale === "en"
            ? "Set a new password."
            : "Đặt mật khẩu mới."
      }
      description={
        status === "success"
          ? locale === "en"
            ? "Use the new password the next time you sign in."
            : "Hãy dùng mật khẩu mới này trong lần đăng nhập kế tiếp."
          : locale === "en"
            ? "Use a strong password with at least 8 characters. This page works only with a valid reset link."
            : "Hãy dùng mật khẩu mạnh với ít nhất 8 ký tự. Trang này chỉ hoạt động với liên kết đặt lại hợp lệ."
      }
    >
      <div className="space-y-5">
        {(status === "expired" || status === "invalid") ? (
          <Surface className="px-5 py-5">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-amber-500/18 bg-amber-500/10">
                <TriangleAlert className="h-4.5 w-4.5 text-amber-600 dark:text-amber-200" />
              </span>
              <div>
                <p className="text-sm font-semibold theme-text-strong">
                  {status === "expired"
                    ? locale === "en"
                      ? "This reset link has expired."
                      : "Liên kết đặt lại này đã hết hạn."
                    : locale === "en"
                      ? "This reset link is invalid."
                      : "Liên kết đặt lại này không hợp lệ."}
                </p>
                <p className="mt-2 text-sm leading-7 theme-text-soft">
                  {locale === "en"
                    ? "Request a fresh password-reset email and open the newest link."
                    : "Hãy yêu cầu một email đặt lại mật khẩu mới và mở liên kết mới nhất."}
                </p>
              </div>
            </div>
          </Surface>
        ) : null}

        {status !== "success" ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="space-y-2">
              <span className="text-sm theme-text-muted">{locale === "en" ? "New password" : "Mật khẩu mới"}</span>
              <div className="flex items-center rounded-2xl border theme-border theme-panel px-4 py-3.5">
                <LockKeyhole className="mr-3 h-4 w-4 theme-text-faint" />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="theme-placeholder w-full bg-transparent text-sm theme-text-strong outline-none"
                  required
                />
              </div>
            </label>

            <label className="space-y-2">
              <span className="text-sm theme-text-muted">
                {locale === "en" ? "Confirm password" : "Xác nhận mật khẩu"}
              </span>
              <div className="flex items-center rounded-2xl border theme-border theme-panel px-4 py-3.5">
                <ShieldCheck className="mr-3 h-4 w-4 theme-text-faint" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="theme-placeholder w-full bg-transparent text-sm theme-text-strong outline-none"
                  required
                />
              </div>
            </label>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={isBusy}
                className="theme-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              >
                <LockKeyhole className="h-4 w-4" />
                {isBusy
                  ? locale === "en"
                    ? "Updating..."
                    : "Đang cập nhật..."
                  : locale === "en"
                    ? "Save new password"
                    : "Lưu mật khẩu mới"}
              </button>
              <Link
                href="/auth/reset-password"
                className="theme-button-secondary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
              >
                {locale === "en" ? "Request a new link" : "Yêu cầu liên kết mới"}
              </Link>
            </div>
          </form>
        ) : (
          <div className="flex flex-wrap gap-3">
            <Link
              href="/auth"
              className="theme-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
            >
              {locale === "en" ? "Back to sign in" : "Quay lại đăng nhập"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {message ? <p className="text-sm theme-text-soft">{message}</p> : null}
      </div>
    </AuthFlowShell>
  );
}
