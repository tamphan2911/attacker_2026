"use client";

import { LockKeyhole, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { pickText } from "@/lib/site";
import type { Locale, SitePageContent } from "@/types/site";

export const CONSTRUCTION_ACCESS_COOKIE = "attacker_construction_access";
const CONSTRUCTION_PASSWORD = "Tamdeptrai";

function formatLaunchDate(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getRemainingParts(targetAt: string) {
  const remainingMs = Math.max(0, new Date(targetAt).getTime() - Date.now());
  const totalSeconds = Math.floor(remainingMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds };
}

function CountdownBlock({
  content,
  locale,
  targetAt,
}: {
  content: SitePageContent["construction"];
  locale: Locale;
  targetAt: string;
}) {
  const [remaining, setRemaining] = useState(() => getRemainingParts(targetAt));
  const parts = useMemo(
    () => [
      { value: remaining.days, label: pickText(locale, content.daysLabel) },
      { value: remaining.hours, label: pickText(locale, content.hoursLabel) },
      { value: remaining.minutes, label: pickText(locale, content.minutesLabel) },
      { value: remaining.seconds, label: pickText(locale, content.secondsLabel) },
    ],
    [content.daysLabel, content.hoursLabel, content.minutesLabel, content.secondsLabel, locale, remaining],
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRemaining(getRemainingParts(targetAt));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [targetAt]);

  return (
    <div className="mx-auto grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-4">
      {parts.map((part) => (
        <div
          key={part.label}
          className="rounded-[1.5rem] border border-sky-300/18 bg-white/[0.07] px-4 py-5 shadow-[0_24px_70px_rgba(2,6,23,0.28)] backdrop-blur-xl"
        >
          <p className="font-mono text-4xl font-semibold tracking-normal text-white md:text-6xl">
            {String(part.value).padStart(2, "0")}
          </p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.22em] text-sky-100/74">
            {part.label}
          </p>
        </div>
      ))}
    </div>
  );
}

export function ConstructionPage({
  content,
  targetAt,
  locale = "vi",
}: {
  content: SitePageContent["construction"];
  targetAt: string;
  locale?: Locale;
}) {
  return (
    <div className="fixed inset-0 z-[200] flex min-h-screen items-center justify-center overflow-y-auto bg-[#06111f] px-5 py-12 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(56,189,248,0.26),transparent_28%),radial-gradient(circle_at_12%_82%,rgba(34,197,94,0.13),transparent_24%),linear-gradient(180deg,rgba(15,23,42,0.2),rgba(2,6,23,0.82))]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(148,163,184,0.28) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.28) 1px, transparent 1px)",
          backgroundSize: "88px 88px",
        }}
      />

      <section className="relative mx-auto w-full max-w-5xl text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-sky-200/28 bg-white/[0.12] px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-100 shadow-[0_20px_60px_rgba(14,165,233,0.18)] backdrop-blur-xl">
          <Sparkles className="h-4 w-4 text-sky-200" />
          {pickText(locale, content.eyebrow)}
        </div>

        <h1 className="mx-auto mt-7 max-w-4xl text-4xl font-semibold leading-tight tracking-normal text-white md:text-6xl">
          {pickText(locale, content.title)}
        </h1>
        <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-slate-200 md:text-lg">
          {pickText(locale, content.description)}
        </p>

        <div className="mt-9">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-sky-100/74">
            {pickText(locale, content.countdownLabel)}
          </p>
          <CountdownBlock content={content} locale={locale} targetAt={targetAt} />
        </div>

        <p className="mx-auto mt-7 max-w-2xl text-sm leading-7 text-slate-200">
          {pickText(locale, content.waitPrefix)}{" "}
          <span className="font-semibold text-white">{formatLaunchDate(targetAt, locale)}</span>
        </p>
      </section>
    </div>
  );
}

export function ConstructionAuthGate({
  content,
  targetAt,
  locale = "vi",
}: {
  content: SitePageContent["construction"];
  targetAt: string;
  locale?: Locale;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    if (password === CONSTRUCTION_PASSWORD) {
      document.cookie = `${CONSTRUCTION_ACCESS_COOKIE}=1; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
      window.location.href = "/auth";
      return;
    }

    setError(pickText(locale, content.passwordError));
  };

  return (
    <div className="fixed inset-0 z-[200] flex min-h-screen items-center justify-center overflow-y-auto bg-[#06111f] px-5 py-12 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(56,189,248,0.24),transparent_30%),linear-gradient(180deg,rgba(15,23,42,0.12),rgba(2,6,23,0.86))]" />
      <div className="relative w-full max-w-lg rounded-[2rem] border border-white/14 bg-white/[0.08] p-6 shadow-[0_34px_100px_rgba(2,6,23,0.46)] backdrop-blur-2xl md:p-8">
        <div className="flex items-start gap-4">
          <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-sky-300/30 bg-sky-300/16 text-sky-100">
            <LockKeyhole className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-100">
              {pickText(locale, content.eyebrow)}
            </p>
            <h1 className="mt-3 text-2xl font-semibold text-white">
              {pickText(locale, content.authGateTitle)}
            </h1>
            <p className="mt-3 text-sm leading-7 text-slate-200">
              {pickText(locale, content.authGateDescription)}
            </p>
          </div>
        </div>

        <label className="mt-7 block space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
            {pickText(locale, content.passwordLabel)}
          </span>
          <input
            type="password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setError("");
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                submit();
              }
            }}
            placeholder={pickText(locale, content.passwordPlaceholder)}
            className="h-12 w-full rounded-2xl border border-white/14 bg-white/[0.08] px-4 text-sm font-semibold text-white outline-none placeholder:text-slate-400 focus:border-sky-300/50"
          />
        </label>

        {error ? (
          <div className="mt-4 rounded-2xl border border-amber-300/24 bg-amber-300/12 px-4 py-3 text-sm font-medium text-amber-100">
            {error}
          </div>
        ) : null}

        <button
          type="button"
          onClick={submit}
          className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-sky-300 px-5 py-3 text-sm font-semibold text-slate-950 shadow-[0_22px_60px_rgba(56,189,248,0.22)] transition hover:bg-sky-200"
        >
          {pickText(locale, content.passwordSubmitLabel)}
        </button>

        <p className="mt-5 text-center text-xs leading-6 text-slate-200">
          {pickText(locale, content.waitPrefix)}{" "}
          <span className="font-semibold text-white">{formatLaunchDate(targetAt, locale)}</span>
        </p>
      </div>
    </div>
  );
}
