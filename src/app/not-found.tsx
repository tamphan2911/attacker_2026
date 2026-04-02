import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-200/80">404</p>
      <h1 className="max-w-xl text-4xl font-semibold tracking-tight theme-text-strong">
        The page you requested does not exist in this Attacker 2026 prototype.
      </h1>
      <p className="max-w-xl text-base leading-8 theme-text-muted">
        Try returning to the homepage or open the newsroom, workspace, or organizer dashboard from the main navigation.
      </p>
      <Link
        href="/"
        className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950"
      >
        Back home
      </Link>
    </div>
  );
}
