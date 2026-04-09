"use client";

import { Crown, Medal, Sparkles, Star, Trophy, Users2 } from "lucide-react";

import { useSiteState } from "@/components/providers/site-state-provider";
import { GradientAvatar, StatusPill, Surface } from "@/components/site-ui";
import { formatDateRangeLabel, pickText } from "@/lib/site";
import type { TeamFinalOutcome, TeamProfile, UserProfile } from "@/types/site";

type FinalOutcomeMeta = {
  outcome: Exclude<TeamFinalOutcome, "emerging-team">;
  slots: number;
  eyebrow: { en: string; vi: string };
  title: { en: string; vi: string };
  note: { en: string; vi: string };
  icon: typeof Crown;
  tone: "warning" | "info" | "default" | "success";
  iconClass: string;
  shellClass: string;
  lineClass: string;
};

const MEMBER_SLOT_COUNT = 5;

const outcomeMeta: FinalOutcomeMeta[] = [
  {
    outcome: "champion",
    slots: 1,
    eyebrow: { en: "First place", vi: "Hạng nhất" },
    title: { en: "Champion", vi: "Quán quân" },
    note: {
      en: "Highest final-round score after the live defense.",
      vi: "Đội có tổng điểm cao nhất sau phần bảo vệ trực tiếp.",
    },
    icon: Crown,
    tone: "warning",
    iconClass:
      "border-amber-500/28 bg-[linear-gradient(135deg,rgba(251,191,36,0.28),rgba(245,158,11,0.2))] text-amber-800 dark:border-amber-300/20 dark:bg-amber-300/12 dark:text-amber-100",
    shellClass:
      "border-amber-500/18 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.2),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.99),rgba(255,248,235,0.97))] dark:border-amber-300/18 dark:bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.14),transparent_34%),linear-gradient(180deg,rgba(20,16,6,0.9),rgba(24,17,7,0.84))]",
    lineClass:
      "from-amber-400/0 via-amber-400/80 to-amber-400/0 dark:from-amber-300/0 dark:via-amber-300/70 dark:to-amber-300/0",
  },
  {
    outcome: "runner-up",
    slots: 1,
    eyebrow: { en: "Second place", vi: "Hạng nhì" },
    title: { en: "Runner-up", vi: "Á quân" },
    note: {
      en: "Second-highest team after the final presentation day.",
      vi: "Đội đứng thứ hai sau ngày thuyết trình chung kết.",
    },
    icon: Trophy,
    tone: "info",
    iconClass:
      "border-sky-500/28 bg-[linear-gradient(135deg,rgba(56,189,248,0.26),rgba(37,99,235,0.18))] text-sky-800 dark:border-sky-300/20 dark:bg-sky-300/12 dark:text-sky-100",
    shellClass:
      "border-sky-500/18 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.18),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.99),rgba(239,247,255,0.97))] dark:border-sky-300/18 dark:bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.14),transparent_34%),linear-gradient(180deg,rgba(8,20,38,0.9),rgba(8,22,44,0.84))]",
    lineClass:
      "from-sky-400/0 via-sky-400/80 to-sky-400/0 dark:from-sky-300/0 dark:via-sky-300/70 dark:to-sky-300/0",
  },
  {
    outcome: "third-place",
    slots: 1,
    eyebrow: { en: "Third place", vi: "Hạng ba" },
    title: { en: "Third place", vi: "Quý quân" },
    note: {
      en: "The final podium place after the last judge review.",
      vi: "Vị trí cuối cùng trên bục xếp hạng sau chấm điểm chung cuộc.",
    },
    icon: Medal,
    tone: "default",
    iconClass:
      "border-fuchsia-500/26 bg-[linear-gradient(135deg,rgba(217,70,239,0.22),rgba(168,85,247,0.18))] text-fuchsia-800 dark:border-fuchsia-300/20 dark:bg-fuchsia-300/12 dark:text-fuchsia-100",
    shellClass:
      "border-fuchsia-500/18 bg-[radial-gradient(circle_at_top_right,rgba(217,70,239,0.16),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.99),rgba(250,243,255,0.97))] dark:border-fuchsia-300/18 dark:bg-[radial-gradient(circle_at_top_right,rgba(217,70,239,0.12),transparent_34%),linear-gradient(180deg,rgba(24,11,34,0.9),rgba(21,10,31,0.84))]",
    lineClass:
      "from-fuchsia-400/0 via-fuchsia-400/80 to-fuchsia-400/0 dark:from-fuchsia-300/0 dark:via-fuchsia-300/70 dark:to-fuchsia-300/0",
  },
  {
    outcome: "fourth-place",
    slots: 2,
    eyebrow: { en: "Shared fourth place", vi: "Đồng hạng tư" },
    title: { en: "4th place teams", vi: "Hai đội hạng 4" },
    note: {
      en: "Two finalist teams close the season in shared fourth place.",
      vi: "Hai đội chung kết khép lại mùa giải với vị trí đồng hạng 4.",
    },
    icon: Star,
    tone: "success",
    iconClass:
      "border-emerald-500/26 bg-[linear-gradient(135deg,rgba(52,211,153,0.24),rgba(16,185,129,0.18))] text-emerald-800 dark:border-emerald-300/20 dark:bg-emerald-300/12 dark:text-emerald-100",
    shellClass:
      "border-emerald-500/18 bg-[radial-gradient(circle_at_top_right,rgba(52,211,153,0.16),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.99),rgba(240,251,246,0.97))] dark:border-emerald-300/18 dark:bg-[radial-gradient(circle_at_top_right,rgba(52,211,153,0.12),transparent_34%),linear-gradient(180deg,rgba(9,24,20,0.9),rgba(8,26,24,0.84))]",
    lineClass:
      "from-emerald-400/0 via-emerald-400/80 to-emerald-400/0 dark:from-emerald-300/0 dark:via-emerald-300/70 dark:to-emerald-300/0",
  },
];

function getLeader(team: TeamProfile, users: UserProfile[]) {
  return users.find((user) => user.id === team.leaderId);
}

function getTeamMembers(team: TeamProfile, users: UserProfile[]) {
  return team.memberIds
    .map((memberId) => users.find((user) => user.id === memberId))
    .filter((member): member is UserProfile => Boolean(member))
    .slice(0, MEMBER_SLOT_COUNT);
}

function getTeamsForOutcome(teams: TeamProfile[], outcome: TeamFinalOutcome, slots: number) {
  return [...teams]
    .filter((team) => team.finalOutcome === outcome)
    .sort((left, right) => {
      if (left.createdAt !== right.createdAt) {
        return left.createdAt.localeCompare(right.createdAt);
      }

      return left.name.localeCompare(right.name);
    })
    .slice(0, slots);
}

function MemberCard({
  member,
  index,
  locale,
}: {
  member: UserProfile | null;
  index: number;
  locale: "en" | "vi";
}) {
  if (!member) {
    return (
      <div className="rounded-[1.15rem] border border-dashed border-slate-300/70 bg-white/60 px-3 py-3 dark:border-white/12 dark:bg-white/[0.04]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[0.95rem] border border-slate-300/70 bg-white/80 text-xs font-semibold text-slate-500 dark:border-white/12 dark:bg-white/[0.06] dark:text-slate-300">
            {String(index + 1).padStart(2, "0")}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold theme-text-strong">
              {locale === "en" ? `Member slot ${index + 1}` : `Vị trí thành viên ${index + 1}`}
            </p>
            <p className="mt-1 text-xs theme-text-soft">
              {locale === "en" ? "Awaiting official team lineup" : "Chờ cập nhật đội hình chính thức"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[1.15rem] border theme-border bg-white/68 px-3 py-3 dark:bg-white/[0.04]">
      <div className="flex items-center gap-3">
        <GradientAvatar
          label={member.name}
          tone={member.avatarTone}
          imageSrc={member.avatarImageSrc}
          className="h-10 w-10 rounded-[0.95rem]"
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold theme-text-strong">{member.name}</p>
          <p className="mt-1 truncate text-xs theme-text-soft">{member.university}</p>
        </div>
      </div>
    </div>
  );
}

function PlaceCard({
  meta,
  team,
  users,
  locale,
  isCurrentTeam,
  featured = false,
}: {
  meta: FinalOutcomeMeta;
  team: TeamProfile | null;
  users: UserProfile[];
  locale: "en" | "vi";
  isCurrentTeam: boolean;
  featured?: boolean;
}) {
  const Icon = meta.icon;
  const leader = team ? getLeader(team, users) : undefined;
  const teamMembers = team ? getTeamMembers(team, users) : [];
  const memberSlots = Array.from({ length: MEMBER_SLOT_COUNT }, (_, index) => teamMembers[index] ?? null);

  return (
    <div
      className={`relative overflow-hidden rounded-[2rem] border px-5 py-5 shadow-[0_20px_46px_rgba(14,37,66,0.1)] dark:shadow-none md:px-6 md:py-6 ${
        meta.shellClass
      } ${featured ? "lg:px-7 lg:py-7" : ""} ${isCurrentTeam ? "ring-1 ring-sky-500/28 dark:ring-sky-300/22" : ""}`}
    >
      <div className={`absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,var(--tw-gradient-stops))] ${meta.lineClass}`} />

      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <span className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[1rem] border ${meta.iconClass}`}>
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] theme-eyebrow">
                  {pickText(locale, meta.eyebrow)}
                </p>
                <h2 className={`theme-heading font-semibold theme-text-strong ${featured ? "text-[2rem]" : "text-[1.5rem]"}`}>
                  {pickText(locale, meta.title)}
                </h2>
              </div>
            </div>
            <p className="mt-4 text-sm leading-7 theme-text-muted">{pickText(locale, meta.note)}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <StatusPill tone={meta.tone}>
              {team ? `#${team.tag}` : locale === "en" ? "Result pending" : "Chờ công bố"}
            </StatusPill>
            {isCurrentTeam ? <StatusPill tone="info">{locale === "en" ? "Your team" : "Đội của bạn"}</StatusPill> : null}
          </div>
        </div>

        <div className="rounded-[1.5rem] border theme-border bg-white/62 px-4 py-4 dark:bg-white/[0.04]">
          <div className="flex items-start gap-4">
            <GradientAvatar
              label={team?.name ?? pickText(locale, meta.title)}
              tone={team?.avatarTone ?? "from-slate-500 via-slate-400 to-slate-300"}
              imageSrc={team?.avatarImageSrc}
              className={`${featured ? "h-16 w-16 rounded-[1.15rem]" : "h-14 w-14 rounded-[1.05rem]"}`}
            />
            <div className="min-w-0">
              <h3 className={`theme-heading font-semibold theme-text-strong ${featured ? "text-[1.7rem]" : "text-[1.3rem]"}`}>
                {team ? team.name : locale === "en" ? "Awaiting official announcement" : "Đang chờ công bố chính thức"}
              </h3>
              <p className="mt-2 text-sm leading-7 theme-text-body">
                {team
                  ? team.track
                  : locale === "en"
                    ? "This place will be replaced by the official team as soon as the final decision is published."
                    : "Vị trí này sẽ được thay bằng đội chính thức ngay khi kết quả cuối cùng được công bố."}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <StatusPill tone={meta.tone}>{pickText(locale, meta.title)}</StatusPill>
                <StatusPill>
                  {leader?.name
                    ? `${locale === "en" ? "Leader" : "Đội trưởng"} · ${leader.name}`
                    : locale === "en"
                      ? "Leader info pending"
                      : "Chờ cập nhật đội trưởng"}
                </StatusPill>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2">
            <Users2 className="h-4 w-4 theme-accent" />
            <p className="text-xs font-semibold uppercase tracking-[0.22em] theme-eyebrow">
              {locale === "en" ? "Team members" : "Thành viên đội"}
            </p>
          </div>
          <div className={`grid gap-3 ${featured ? "md:grid-cols-2 xl:grid-cols-5" : "md:grid-cols-2 xl:grid-cols-5"}`}>
            {memberSlots.map((member, index) => (
              <MemberCard
                key={member?.id ?? `${meta.outcome}-member-${index}`}
                member={member}
                index={index}
                locale={locale}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function FinalResultsPage() {
  const { locale, teams, users, currentTeam, timelineItems } = useSiteState();
  const finalPresentationItem = timelineItems.find((item) => item.id === "round-3-final-presentation");

  const championMeta = outcomeMeta.find((meta) => meta.outcome === "champion")!;
  const runnerUpMeta = outcomeMeta.find((meta) => meta.outcome === "runner-up")!;
  const thirdPlaceMeta = outcomeMeta.find((meta) => meta.outcome === "third-place")!;
  const fourthPlaceMeta = outcomeMeta.find((meta) => meta.outcome === "fourth-place")!;

  const championTeam = getTeamsForOutcome(teams, "champion", 1)[0] ?? null;
  const runnerUpTeam = getTeamsForOutcome(teams, "runner-up", 1)[0] ?? null;
  const thirdPlaceTeam = getTeamsForOutcome(teams, "third-place", 1)[0] ?? null;
  const fourthPlaceTeams = Array.from(
    { length: fourthPlaceMeta.slots },
    (_, index) => getTeamsForOutcome(teams, "fourth-place", fourthPlaceMeta.slots)[index] ?? null,
  );

  return (
    <div className="space-y-8 md:space-y-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] theme-eyebrow">
            {locale === "en" ? "Final standings" : "Xếp hạng chung cuộc"}
          </p>
        </div>
        <Surface className="rounded-[1.3rem] px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-[0.95rem] border border-sky-500/18 bg-[linear-gradient(135deg,rgba(56,189,248,0.2),rgba(37,99,235,0.14))] text-sky-700 dark:border-sky-300/18 dark:bg-sky-300/12 dark:text-sky-100">
              <Sparkles className="h-4.5 w-4.5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] theme-eyebrow">
                {locale === "en" ? "Presentation day" : "Ngày thuyết trình"}
              </p>
              <p className="mt-1 text-sm font-semibold theme-text-strong">
                {finalPresentationItem
                  ? formatDateRangeLabel(locale, finalPresentationItem.startDate, finalPresentationItem.endDate)
                  : locale === "en"
                    ? "To be announced"
                    : "Sẽ cập nhật"}
              </p>
            </div>
          </div>
        </Surface>
      </div>

      <div className="space-y-5">
        <PlaceCard
          meta={championMeta}
          team={championTeam}
          users={users}
          locale={locale}
          isCurrentTeam={currentTeam?.id === championTeam?.id}
          featured
        />

        <div className={`mx-auto h-px max-w-5xl bg-[linear-gradient(90deg,var(--tw-gradient-stops))] ${runnerUpMeta.lineClass}`} />

        <PlaceCard
          meta={runnerUpMeta}
          team={runnerUpTeam}
          users={users}
          locale={locale}
          isCurrentTeam={currentTeam?.id === runnerUpTeam?.id}
        />

        <div className={`mx-auto h-px max-w-5xl bg-[linear-gradient(90deg,var(--tw-gradient-stops))] ${thirdPlaceMeta.lineClass}`} />

        <PlaceCard
          meta={thirdPlaceMeta}
          team={thirdPlaceTeam}
          users={users}
          locale={locale}
          isCurrentTeam={currentTeam?.id === thirdPlaceTeam?.id}
        />

        <div className={`mx-auto h-px max-w-5xl bg-[linear-gradient(90deg,var(--tw-gradient-stops))] ${fourthPlaceMeta.lineClass}`} />

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className={`inline-flex h-11 w-11 items-center justify-center rounded-[1rem] border ${fourthPlaceMeta.iconClass}`}>
              <fourthPlaceMeta.icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] theme-eyebrow">
                {pickText(locale, fourthPlaceMeta.eyebrow)}
              </p>
              <p className="theme-heading text-2xl font-semibold theme-text-strong">
                {pickText(locale, fourthPlaceMeta.title)}
              </p>
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            {fourthPlaceTeams.map((team, index) => (
              <PlaceCard
                key={team?.id ?? `fourth-place-slot-${index}`}
                meta={fourthPlaceMeta}
                team={team}
                users={users}
                locale={locale}
                isCurrentTeam={currentTeam?.id === team?.id}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
