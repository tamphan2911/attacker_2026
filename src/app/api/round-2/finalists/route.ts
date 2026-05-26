import { NextResponse } from "next/server";
import { SubmissionRound, UserRole } from "@prisma/client";

import { prisma } from "@/lib/db";
import { getTimelineItemById, isTimelineItemStarted } from "@/lib/competition";
import { readTimelineItems } from "@/server/timeline-items";

function average(values: number[]) {
  return values.reduce((total, value) => total + value, 0) / values.length;
}

export async function GET() {
  const timelineItems = await readTimelineItems();
  const resultAnnouncement = getTimelineItemById("round-2-top-5-announcement", timelineItems);
  const released = isTimelineItemStarted("round-2-top-5-announcement", timelineItems, new Date());

  if (!released) {
    return NextResponse.json(
      {
        released: false,
        announcementStartDate: resultAnnouncement?.startDate,
        finalists: [],
        emergingTeams: [],
      },
      { status: 200 },
    );
  }

  const submissions = await prisma.teamSubmission.findMany({
    where: {
      round: SubmissionRound.ROUND_2,
    },
    orderBy: [{ submittedAt: "desc" }, { version: "desc" }],
    include: {
      team: {
        include: {
          members: {
            select: { userId: true },
          },
          leader: {
            select: {
              id: true,
              name: true,
              university: true,
            },
          },
        },
      },
      judgeReviews: {
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        include: {
          judgeUser: {
            select: {
              role: true,
            },
          },
        },
      },
    },
  });

  const latestByTeam = new Map<string, (typeof submissions)[number]>();
  for (const submission of submissions) {
    const currentLatest = latestByTeam.get(submission.teamId);
    if (
      !currentLatest ||
      submission.version > currentLatest.version ||
      (submission.version === currentLatest.version &&
        submission.submittedAt.getTime() > currentLatest.submittedAt.getTime())
    ) {
      latestByTeam.set(submission.teamId, submission);
    }
  }

  const rankedTeams = Array.from(latestByTeam.values())
    .map((submission) => {
      const judgeScores = submission.judgeReviews
        .filter(
          (review) =>
            review.judgeUser.role === UserRole.JUDGE &&
            typeof review.score === "number" &&
            Boolean(review.scoredAt),
        )
        .slice(0, 2)
        .map((review) => review.score as number);

      if (judgeScores.length < 2) {
        return null;
      }

      return {
        id: submission.team.id,
        name: submission.team.name,
        tag: submission.team.tag,
        leaderId: submission.team.leaderId,
        leaderName: submission.team.leader.name,
        leaderUniversity: submission.team.leader.university,
        memberCount: submission.team.members.length,
        avatarTone: submission.team.avatarTone,
        avatarImageSrc: submission.team.avatarImageSrc ?? undefined,
        track: submission.team.track,
        averageScore: average(judgeScores),
        submittedAt: submission.submittedAt.toISOString(),
      };
    })
    .filter((team): team is NonNullable<typeof team> => Boolean(team))
    .sort((left, right) => {
      if (left.averageScore !== right.averageScore) {
        return right.averageScore - left.averageScore;
      }

      return right.submittedAt.localeCompare(left.submittedAt);
    });

  return NextResponse.json(
    {
      released: true,
      announcementStartDate: resultAnnouncement?.startDate,
      finalists: rankedTeams.slice(0, 5),
      emergingTeams: rankedTeams.slice(5, 15),
    },
    { status: 200 },
  );
}
