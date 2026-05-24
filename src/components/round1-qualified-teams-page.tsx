"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Clock3, Medal, Search, ShieldCheck, Trophy, Users2 } from "lucide-react";
import Link from "next/link";

import { useSiteState } from "@/components/providers/site-state-provider";
import { GradientAvatar, SectionHeading, StatusPill, Surface } from "@/components/site-ui";
import { formatDateLabel, formatDateRangeLabel } from "@/lib/site";

type QualifiedTeam = {
  rank: number;
  teamId: string;
  teamName: string;
  teamTag: string;
  track: string;
  avatarTone: string;
  avatarImageSrc?: string | null;
  memberCount: number;
  leaderName: string;
  leaderUniversity: string;
  completedMembers: number;
  scoredMembers: number;
  averageObjectiveScore: number;
  averageEssayScore: number;
  averageTotalScore: number;
  latestSubmittedAt?: string;
};

type Round1QualifiedTeamsPayload = {
  released: boolean;
  adminPreview?: boolean;
  announcementStartDate?: string;
  announcementEndDate?: string;
  qualifiedTeams: QualifiedTeam[];
  maxScores: {
    objective: number;
    essay: number;
    total: number;
  };
};

function formatScore(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.00$/, "");
}

export function Round1QualifiedTeamsPage() {
  const { locale, currentTeam } = useSiteState();
  const [payload, setPayload] = useState<Round1QualifiedTeamsPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        setIsLoading(true);
        setError("");
        const response = await fetch("/api/round-1/qualified-teams", {
          cache: "no-store",
          credentials: "same-origin",
        });

        if (!response.ok) {
          throw new Error("Could not load Round 1 qualified teams.");
        }

        const nextPayload = (await response.json()) as Round1QualifiedTeamsPayload;
        if (!cancelled) {
          setPayload(nextPayload);
        }
      } catch {
        if (!cancelled) {
          setError(
            locale === "en"
              ? "Could not load the Round 1 result announcement right now."
              : "Hiện chưa thể tải thông báo kết quả Vòng 1.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [locale]);

  const announcementLabel = useMemo(() => {
    if (!payload?.announcementStartDate) {
      return locale === "en" ? "To be announced" : "Sẽ cập nhật";
    }

    return formatDateRangeLabel(locale, payload.announcementStartDate, payload.announcementEndDate ?? payload.announcementStartDate);
  }, [locale, payload?.announcementEndDate, payload?.announcementStartDate]);

  if (isLoading) {
    return (
      <Surface className="mx-auto max-w-3xl px-6 py-10 text-center">
        <p className="text-sm theme-text-soft">
          {locale === "en" ? "Loading Round 1 announcement..." : "Đang tải thông báo Vòng 1..."}
        </p>
      </Surface>
    );
  }

  if (error || !payload) {
    return (
      <Surface className="mx-auto max-w-3xl px-6 py-10 text-center">
        <p className="text-sm leading-7 theme-text-soft">{error}</p>
      </Surface>
    );
  }

  if (!payload.released) {
    return (
      <div className="space-y-8">
        <SectionHeading
          eyebrow={locale === "en" ? "Round 1 results" : "Kết quả Vòng 1"}
          title={locale === "en" ? "The Round 1 result announcement is not live yet." : "Kết quả Vòng 1 chưa được công bố."}
          description={
            locale === "en"
              ? "The qualified-team list will appear here after the official announcement time."
              : "Danh sách đội vào Vòng 2 sẽ hiển thị tại đây sau thời điểm công bố chính thức."
          }
        />

        <Surface className="overflow-hidden px-6 py-6 md:px-8 md:py-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-4">
              <div className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.25rem] border border-sky-400/28 bg-[linear-gradient(135deg,rgba(186,230,253,0.92),rgba(191,219,254,0.72))] text-sky-800 dark:border-sky-300/20 dark:bg-sky-300/12 dark:text-sky-100">
                <Clock3 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.26em] theme-eyebrow">
                  {locale === "en" ? "Announcement date" : "Ngày công bố"}
                </p>
                <h2 className="mt-2 text-2xl font-semibold theme-text-strong">{announcementLabel}</h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 theme-text-muted">
                  {locale === "en"
                    ? "Before the announcement date, this page only shows the waiting notice so teams see the same official result release."
                    : "Trước ngày công bố, trang này chỉ hiển thị thông báo chờ để các đội nhận kết quả theo cùng một thời điểm chính thức."}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/timeline"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-sky-300/45 bg-sky-100/75 px-5 py-3 text-sm font-semibold text-sky-900 transition hover:-translate-y-0.5 hover:bg-sky-100 dark:border-sky-300/18 dark:bg-sky-300/12 dark:text-sky-100"
              >
                {locale === "en" ? "View timeline" : "Xem timeline"}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/news"
                className="inline-flex items-center justify-center gap-2 rounded-full border theme-border theme-panel px-5 py-3 text-sm font-semibold theme-text-strong"
              >
                {locale === "en" ? "Open news" : "Mở tin tức"}
              </Link>
            </div>
          </div>
        </Surface>
      </div>
    );
  }

  const qualifiedTeams = payload.qualifiedTeams;
  const topThree = qualifiedTeams.slice(0, 3);

  return (
    <div className="space-y-10 md:space-y-12">
      <SectionHeading
        eyebrow={locale === "en" ? "Round 1 results" : "Kết quả Vòng 1"}
        title={locale === "en" ? "Teams qualified for Round 2" : "Danh sách đội vào Vòng 2"}
        description={
          locale === "en"
            ? "The list is based on reviewed Round 1 team-average scores after essay scoring is completed."
            : "Danh sách được tổng hợp theo điểm trung bình đội ở Vòng 1 sau khi phần tự luận đã được chấm."
        }
      />

      {payload.adminPreview ? (
        <Surface className="border-sky-500/28 bg-[linear-gradient(135deg,rgba(224,242,254,0.92),rgba(219,234,254,0.70))] px-5 py-4 dark:border-sky-300/20 dark:bg-[linear-gradient(135deg,rgba(56,189,248,0.14),rgba(37,99,235,0.10))]">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-sky-500/24 bg-white/70 text-sky-700 dark:border-sky-200/18 dark:bg-white/10 dark:text-sky-100">
              <ShieldCheck className="h-4.5 w-4.5" />
            </span>
            <div>
              <p className="text-sm font-semibold theme-text-strong">
                {locale === "en" ? "Admin preview is enabled" : "Đang xem trước bằng quyền admin"}
              </p>
              <p className="mt-1 text-sm leading-6 theme-text-muted">
                {locale === "en"
                  ? "This Round 1 result page is visible to admin-mode accounts before the official announcement time."
                  : "Trang kết quả Vòng 1 này được mở cho tài khoản admin mode trước thời điểm công bố chính thức."}
              </p>
            </div>
          </div>
        </Surface>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Surface className="px-5 py-5">
          <ShieldCheck className="h-6 w-6 text-emerald-500" />
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.24em] theme-eyebrow">
            {locale === "en" ? "Qualified teams" : "Đội vào Vòng 2"}
          </p>
          <p className="mt-3 text-3xl font-semibold theme-text-strong">{qualifiedTeams.length}</p>
        </Surface>
        <Surface className="px-5 py-5">
          <Trophy className="h-6 w-6 text-amber-500" />
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.24em] theme-eyebrow">
            {locale === "en" ? "Announcement" : "Công bố"}
          </p>
          <p className="mt-3 text-lg font-semibold theme-text-strong">{announcementLabel}</p>
        </Surface>
        <Surface className="px-5 py-5">
          <Medal className="h-6 w-6 text-sky-500" />
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.24em] theme-eyebrow">
            {locale === "en" ? "Scoring scale" : "Thang điểm"}
          </p>
          <p className="mt-3 text-lg font-semibold theme-text-strong">{`/ ${payload.maxScores.total}`}</p>
        </Surface>
      </div>

      {qualifiedTeams.length === 0 ? (
        <Surface className="px-6 py-8 text-center">
          <Search className="mx-auto h-8 w-8 theme-text-faint" />
          <h2 className="mt-4 text-2xl font-semibold theme-text-strong">
            {locale === "en" ? "No qualified teams are published yet." : "Chưa có danh sách đội được công bố."}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 theme-text-muted">
            {locale === "en"
              ? "The announcement date has passed, but the reviewed score data is not available for public listing yet."
              : "Thời điểm công bố đã đến, nhưng dữ liệu điểm đã duyệt chưa sẵn sàng để hiển thị công khai."}
          </p>
        </Surface>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            {topThree.map((team) => (
              <Surface
                key={team.teamId}
                className={`px-5 py-5 ${currentTeam?.id === team.teamId ? "border-sky-500/35 shadow-[0_24px_56px_rgba(37,99,235,0.16)]" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <GradientAvatar
                    label={team.teamName}
                    tone={team.avatarTone}
                    imageSrc={team.avatarImageSrc ?? undefined}
                    className="h-14 w-14 rounded-[1.15rem]"
                  />
                  <StatusPill tone={team.rank <= 3 ? "warning" : "success"}>{`#${team.rank}`}</StatusPill>
                </div>
                <h3 className="mt-4 text-xl font-semibold theme-text-strong">{team.teamName}</h3>
                <p className="mt-2 text-sm theme-text-soft">{team.track}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <StatusPill>{team.teamTag}</StatusPill>
                  <StatusPill tone="success">
                    {locale === "en" ? "Round 2" : "Vòng 2"}
                  </StatusPill>
                </div>
                <p className="mt-4 text-sm leading-6 theme-text-muted">
                  {locale === "en" ? "Team average" : "Điểm trung bình"}:{" "}
                  <span className="font-semibold theme-text-strong">
                    {formatScore(team.averageTotalScore)} / {payload.maxScores.total}
                  </span>
                </p>
              </Surface>
            ))}
          </div>

          <Surface className="overflow-hidden px-0 py-0">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b theme-border bg-[rgba(244,249,255,0.9)] dark:bg-white/[0.04]">
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] theme-eyebrow">#</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] theme-eyebrow">
                      {locale === "en" ? "Team" : "Đội thi"}
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] theme-eyebrow">
                      {locale === "en" ? "Members" : "Thành viên"}
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] theme-eyebrow">
                      {locale === "en" ? "Average score" : "Điểm trung bình"}
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] theme-eyebrow">
                      {locale === "en" ? "Latest submission" : "Bài nộp gần nhất"}
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] theme-eyebrow">
                      {locale === "en" ? "Status" : "Trạng thái"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {qualifiedTeams.map((team) => (
                    <tr
                      key={team.teamId}
                      className={`border-b theme-border last:border-b-0 ${currentTeam?.id === team.teamId ? "bg-sky-400/10" : ""}`}
                    >
                      <td className="px-5 py-4 font-semibold theme-text-strong">{String(team.rank).padStart(2, "0")}</td>
                      <td className="px-5 py-4">
                        <div className="flex min-w-[15rem] items-center gap-3">
                          <GradientAvatar
                            label={team.teamName}
                            tone={team.avatarTone}
                            imageSrc={team.avatarImageSrc ?? undefined}
                            className="h-10 w-10 rounded-[0.95rem]"
                          />
                          <div>
                            <p className="font-semibold theme-text-strong">{team.teamName}</p>
                            <p className="mt-1 text-xs theme-text-soft">{`${team.teamTag} · ${team.track}`}</p>
                            <p className="mt-1 text-xs theme-text-faint">{team.leaderName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="inline-flex items-center gap-2 rounded-full border theme-border theme-panel px-3 py-1.5 font-semibold theme-text-strong">
                          <Users2 className="h-3.5 w-3.5 theme-text-soft" />
                          {team.memberCount}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold theme-text-strong">
                          {formatScore(team.averageTotalScore)} / {payload.maxScores.total}
                        </p>
                        <p className="mt-1 text-xs theme-text-soft">
                          {locale === "en" ? "Objective" : "Trắc nghiệm"} {formatScore(team.averageObjectiveScore)} ·{" "}
                          {locale === "en" ? "Essay" : "Tự luận"} {formatScore(team.averageEssayScore)}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-sm theme-text-soft">
                        {team.latestSubmittedAt ? formatDateLabel(locale, team.latestSubmittedAt) : "--"}
                      </td>
                      <td className="px-5 py-4">
                        <StatusPill tone="success">
                          {locale === "en" ? "Qualified" : "Đủ điều kiện"}
                        </StatusPill>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Surface>
        </>
      )}
    </div>
  );
}
