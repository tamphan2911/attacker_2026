import type { ReactNode } from "react";

import { initials } from "@/lib/site";

function cn(...values: Array<string | undefined | false>) {
  return values.filter(Boolean).join(" ");
}

export function BrandMark({ showText = true }: { showText?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="theme-brand-gradient theme-card-shadow-soft relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-white/25 text-lg font-black text-white">
        <span className="relative z-10">A</span>
        <span className="absolute inset-1 rounded-[1rem] border border-white/20" />
      </div>
      <div className={showText ? "hidden sm:block" : "hidden"}>
        <p className="theme-eyebrow text-[0.72rem] font-semibold uppercase tracking-[0.34em]">
          Attacker 2026
        </p>
        <p className="theme-heading text-sm theme-text-soft">student fintech challenge</p>
      </div>
    </div>
  );
}

export function Surface({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("theme-panel theme-card-shadow rounded-[2rem] border backdrop-blur-xl", className)}>
      {children}
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  id,
  className,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  id?: string;
  className?: string;
}) {
  return (
    <div
      id={id}
      className={cn(
        "max-w-3xl space-y-4",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      <p className="theme-eyebrow text-xs font-semibold uppercase tracking-[0.34em]">{eyebrow}</p>
      <h2 className="theme-heading theme-text-strong text-3xl font-semibold tracking-tight md:text-[2.85rem] md:leading-[1.06]">
        {title}
      </h2>
      {description ? <p className="theme-text-muted text-base leading-8 md:text-lg">{description}</p> : null}
    </div>
  );
}

export function PageIntro({
  eyebrow,
  title,
  description,
  aside,
}: {
  eyebrow: string;
  title: string;
  description: string;
  aside?: ReactNode;
}) {
  return (
    <section className="theme-page-intro theme-card-shadow-soft relative overflow-hidden rounded-[2rem] border px-5 py-7 md:px-8 md:py-8 lg:px-10 lg:py-9">
      <div className="absolute -top-24 right-0 h-64 w-64 rounded-full bg-[var(--page-intro-glow)] blur-3xl" />
      <div className="absolute bottom-0 left-10 h-44 w-44 rounded-full bg-[var(--page-intro-glow-alt)] blur-3xl" />
      <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end">
        <SectionHeading eyebrow={eyebrow} title={title} description={description} />
        {aside ? <div>{aside}</div> : null}
      </div>
    </section>
  );
}

export function GradientAvatar({
  label,
  tone,
  imageSrc,
  className,
}: {
  label: string;
  tone: string;
  imageSrc?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "theme-card-shadow-soft relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br text-sm font-semibold text-white",
        tone,
        className,
      )}
    >
      {imageSrc ? (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${imageSrc})` }}
        />
      ) : null}
      <span className={cn("relative z-10", imageSrc && "hidden")}>{initials(label)}</span>
    </div>
  );
}

export function InfoKicker({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "theme-kicker inline-flex items-center rounded-full border px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.28em]",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StatusPill({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "success" | "warning" | "info";
}) {
  return (
    <span
      className={cn(
        "inline-flex min-h-8 items-center justify-center rounded-full border px-3 py-1 text-center text-xs font-medium whitespace-nowrap",
        tone === "default" && "theme-chip",
        tone === "info" &&
          "border-sky-500/24 bg-sky-500/12 text-sky-800 dark:border-sky-300/22 dark:bg-sky-300/14 dark:text-sky-100",
        tone === "success" &&
          "border-emerald-500/24 bg-emerald-500/12 text-emerald-800 dark:border-emerald-300/22 dark:bg-emerald-300/12 dark:text-emerald-100",
        tone === "warning" &&
          "border-amber-500/26 bg-amber-500/14 text-amber-800 dark:border-amber-300/22 dark:bg-amber-300/12 dark:text-amber-100",
      )}
    >
      {children}
    </span>
  );
}
