import { z } from "zod";

import { isRound1ResultAnnouncementReleased } from "@/lib/competition";
import { getCurrentDbUser } from "@/server/auth-helpers";
import { unauthorizedResponse } from "@/server/route-utils";
import { serializeRound1Submission } from "@/server/site-serializers";
import { readTimelineItems } from "@/server/timeline-items";
import {
  getRound1ExamState,
  saveRound1AttemptProgress,
  startRound1Attempt,
} from "@/server/team-service";

const round1AttemptProgressSchema = z.object({
  currentQuestionIndex: z.number().int().min(0),
  answers: z
    .record(
      z.string(),
      z.object({
        selectedOptionIds: z.array(z.string()).optional(),
        pairingMatches: z.record(z.string(), z.string()).optional(),
        essayText: z.string().optional(),
      }),
    )
    .default({}),
});

async function shouldRevealRound1EssayAndTotalScores() {
  return isRound1ResultAnnouncementReleased(await readTimelineItems(), new Date());
}

export async function GET() {
  const user = await getCurrentDbUser();
  if (!user) {
    return unauthorizedResponse();
  }

  const result = await getRound1ExamState(user.id);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json(
    {
      attempt: result.data.attempt,
      submission: result.data.submission
        ? serializeRound1Submission(result.data.submission, {
            revealEssayAndTotalScores: await shouldRevealRound1EssayAndTotalScores(),
          })
        : null,
      autoSubmitted: Boolean(result.data.autoSubmitted),
    },
    { status: result.status },
  );
}

export async function POST() {
  const user = await getCurrentDbUser();
  if (!user) {
    return unauthorizedResponse();
  }

  const result = await startRound1Attempt(user.id);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json(
    {
      attempt: result.data.attempt,
      submission: result.data.submission
        ? serializeRound1Submission(result.data.submission, {
            revealEssayAndTotalScores: await shouldRevealRound1EssayAndTotalScores(),
          })
        : null,
      autoSubmitted: Boolean(result.data.autoSubmitted),
    },
    { status: result.status },
  );
}

export async function PATCH(request: Request) {
  const user = await getCurrentDbUser();
  if (!user) {
    return unauthorizedResponse();
  }

  const payload = round1AttemptProgressSchema.safeParse(await request.json().catch(() => null));
  if (!payload.success) {
    return Response.json(
      { error: "Invalid Round 1 attempt progress payload.", issues: payload.error.flatten() },
      { status: 400 },
    );
  }

  const result = await saveRound1AttemptProgress(user.id, payload.data);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json(
    {
      attempt: result.data.attempt,
      submission: result.data.submission
        ? serializeRound1Submission(result.data.submission, {
            revealEssayAndTotalScores: await shouldRevealRound1EssayAndTotalScores(),
          })
        : null,
      autoSubmitted: Boolean(result.data.autoSubmitted),
    },
    { status: result.status },
  );
}
