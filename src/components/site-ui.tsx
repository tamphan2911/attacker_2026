import type { ReactNode } from "react";

import { initials } from "@/lib/site";

function cn(...values: Array<string | undefined | false>) {
  return values.filter(Boolean).join(" ");
}

export function BrandMark({ showText = true }: { showText?: boolean }) {
  return <BrandMarkInner showText={showText} variant="default" />;
}

export function BrandMarkInner({
  showText = true,
  variant = "default",
}: {
  showText?: boolean;
  variant?: "default" | "header";
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="theme-brand-gradient theme-card-shadow-soft relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-white/25 text-lg font-black text-white">
        <span className="relative z-10">A</span>
        <span className="absolute inset-1 rounded-[1rem] border border-white/20" />
      </div>
      {showText ? (
        <div className="hidden min-w-0 sm:block">
          {variant === "header" ? (
            <div className="theme-card-shadow-soft relative overflow-hidden rounded-[1.15rem] border border-[rgba(23,114,208,0.18)] bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(233,245,255,0.97)_58%,rgba(255,244,221,0.96))] px-3.5 py-2.5 shadow-[0_18px_36px_rgba(16,38,66,0.1)] transition duration-300 group-hover:-translate-y-0.5 group-hover:shadow-[0_22px_42px_rgba(16,38,66,0.14)] dark:border-[rgba(88,196,255,0.2)] dark:bg-[linear-gradient(135deg,rgba(12,26,47,0.98),rgba(15,39,72,0.96)_58%,rgba(46,28,9,0.9))] dark:shadow-[0_18px_38px_rgba(2,8,20,0.3)] dark:group-hover:shadow-[0_22px_44px_rgba(2,8,20,0.34)]">
              <span className="absolute inset-y-2 left-2 w-1 rounded-full bg-[linear-gradient(180deg,#2563eb,#0ea5e9_55%,#f59e0b)]" />
              <span className="absolute -right-5 -top-6 h-16 w-16 rounded-full bg-[radial-gradient(circle,rgba(14,165,233,0.22),rgba(14,165,233,0))] dark:bg-[radial-gradient(circle,rgba(125,211,252,0.24),rgba(125,211,252,0))]" />
              <span className="absolute bottom-0 left-10 h-8 w-24 rounded-full bg-[radial-gradient(circle,rgba(245,158,11,0.16),rgba(245,158,11,0))] dark:bg-[radial-gradient(circle,rgba(251,191,36,0.2),rgba(251,191,36,0))]" />
              <div className="relative flex items-center gap-2 pl-3">
                <p className="theme-heading text-[1.03rem] font-semibold uppercase tracking-[0.18em] text-slate-950 dark:text-white">
                  <span className="bg-[linear-gradient(135deg,#0f2f5f,#1772d0_52%,#0891b2)] bg-clip-text text-transparent dark:bg-[linear-gradient(135deg,#ecfeff,#7dd3fc_56%,#fde68a)]">
                    Attacker
                  </span>
                </p>
                <span className="inline-flex items-center rounded-full border border-sky-500/18 bg-[linear-gradient(135deg,#1772d0,#0ea5e9)] px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-white shadow-[0_10px_24px_rgba(23,114,208,0.22)] dark:border-sky-200/18 dark:bg-[linear-gradient(135deg,#38bdf8,#2563eb)] dark:shadow-[0_10px_26px_rgba(56,189,248,0.18)]">
                  2026
                </span>
              </div>
            </div>
          ) : (
            <div>
              <p className="theme-eyebrow text-[0.72rem] font-semibold uppercase tracking-[0.34em]">
                Attacker 2026
              </p>
              <p className="theme-heading text-sm theme-text-soft">student fintech challenge</p>
            </div>
          )}
        </div>
      ) : null}
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
  description?: string;
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
          "border-sky-700/28 bg-[linear-gradient(135deg,rgba(56,189,248,0.26),rgba(37,99,235,0.16))] text-slate-950 shadow-[0_10px_24px_rgba(56,189,248,0.08)] dark:border-sky-300/22 dark:bg-sky-300/14 dark:text-sky-100 dark:shadow-none",
        tone === "success" &&
          "border-emerald-700/28 bg-[linear-gradient(135deg,rgba(52,211,153,0.24),rgba(16,185,129,0.16))] text-slate-950 shadow-[0_10px_24px_rgba(16,185,129,0.08)] dark:border-emerald-300/22 dark:bg-emerald-300/12 dark:text-emerald-100 dark:shadow-none",
        tone === "warning" &&
          "border-amber-700/30 bg-[linear-gradient(135deg,rgba(251,191,36,0.3),rgba(245,158,11,0.18))] text-slate-950 shadow-[0_10px_24px_rgba(245,158,11,0.08)] dark:border-amber-300/22 dark:bg-amber-300/12 dark:text-amber-100 dark:shadow-none",
      )}
    >
      {children}
    </span>
  );
}
