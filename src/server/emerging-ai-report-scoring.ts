import {
  EmergingAiReportScoringJobMode,
  EmergingAiReportScoringJobStatus,
  Round2AiReportScoringStatus,
  SubmissionRound,
  TeamSubmissionJudgeReviewSource,
  TeamSubmissionResourceSource,
  UserRole,
  type Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/db";
import { ROUND2_REPORT_FINAL_MAX_SCORE, ROUND2_REPORT_RUBRIC } from "@/lib/judge-rubrics";
import { decodeTeamReviewNote, encodeTeamReviewNote } from "@/server/judge-service";
import { ensureEmergingJudgeAssignments, readEmergingSubmissionLockState, readLatestEmergingSubmissions } from "@/server/emerging-judge-assignment";
import { readTeamSubmissionFile } from "@/server/team-submission-storage";

const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";
const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const MAX_REPORT_BYTES = 10 * 1024 * 1024;
const PDF_DATA_URL_PREFIX = "data:application/pdf;base64,";

type EmergingAiReportScoringMode = "run-all" | "retry-failed";

type EmergingCandidate = Prisma.TeamSubmissionGetPayload<{
  include: {
    judgeReviews: {
      include: {
        judgeUser: {
          select: {
            id: true;
            role: true;
          };
        };
      };
    };
    aiReportReview: true;
  };
}>;

type ServiceResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; error: string };

export type EmergingAiReportScoringJobSnapshot = {
  id: string;
  mode: EmergingAiReportScoringMode;
  status: "pending" | "running" | "completed" | "failed";
  model: string;
  totalEligible: number;
  processedCount: number;
  scoredCount: number;
  failedCount: number;
  skippedHumanCount: number;
  skippedExistingCount: number;
  lastError?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
};

export type EmergingAiReportScoringOverview = {
  emergingClosed: boolean;
  deadlineAt?: string;
  activeJob: EmergingAiReportScoringJobSnapshot | null;
  totals: {
    latestReports: number;
    humanScored: number;
    gptScored: number;
    failed: number;
    needsGptScore: number;
    gptScoringPercent: number;
  };
};

function ok<T>(data: T, status = 200): ServiceResult<T> {
  return { ok: true, status, data };
}

function fail<T>(status: number, error: string): ServiceResult<T> {
  return { ok: false, status, error };
}

function normalizeMode(mode: EmergingAiReportScoringMode) {
  return mode === "retry-failed" ? EmergingAiReportScoringJobMode.RETRY_FAILED : EmergingAiReportScoringJobMode.RUN_ALL;
}

function serializeMode(mode: EmergingAiReportScoringJobMode): EmergingAiReportScoringMode {
  return mode === EmergingAiReportScoringJobMode.RETRY_FAILED ? "retry-failed" : "run-all";
}

function serializeJob(job: {
  id: string;
  mode: EmergingAiReportScoringJobMode;
  status: EmergingAiReportScoringJobStatus;
  model: string;
  totalEligible: number;
  processedCount: number;
  scoredCount: number;
  failedCount: number;
  skippedHumanCount: number;
  skippedExistingCount: number;
  lastError: string | null;
  createdAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
}): EmergingAiReportScoringJobSnapshot {
  return {
    id: job.id,
    mode: serializeMode(job.mode),
    status: job.status.toLowerCase() as EmergingAiReportScoringJobSnapshot["status"],
    model: job.model,
    totalEligible: job.totalEligible,
    processedCount: job.processedCount,
    scoredCount: job.scoredCount,
    failedCount: job.failedCount,
    skippedHumanCount: job.skippedHumanCount,
    skippedExistingCount: job.skippedExistingCount,
    lastError: job.lastError ?? undefined,
    createdAt: job.createdAt.toISOString(),
    startedAt: job.startedAt?.toISOString(),
    completedAt: job.completedAt?.toISOString(),
  };
}

function hasHumanScoredReview(submission: EmergingCandidate) {
  return submission.judgeReviews.some(
    (review) =>
      review.judgeUser.role === UserRole.JUDGE &&
      review.source === TeamSubmissionJudgeReviewSource.HUMAN &&
      review.score != null &&
      review.scoredAt,
  );
}

function hasGptScoredReview(submission: EmergingCandidate) {
  return submission.judgeReviews.some(
    (review) =>
      review.judgeUser.role === UserRole.JUDGE &&
      review.source === TeamSubmissionJudgeReviewSource.AI &&
      review.score != null &&
      review.scoredAt,
  );
}

function isEligibleSubmission(
  submission: EmergingCandidate,
  mode: EmergingAiReportScoringJobMode,
  retryJobCreatedAt?: Date,
) {
  if (hasHumanScoredReview(submission)) {
    return false;
  }

  if (mode === EmergingAiReportScoringJobMode.RETRY_FAILED) {
    return (
      submission.aiReportReview?.status === Round2AiReportScoringStatus.FAILED &&
      (!retryJobCreatedAt || submission.aiReportReview.updatedAt.getTime() <= retryJobCreatedAt.getTime())
    );
  }

  return !hasGptScoredReview(submission) && submission.aiReportReview?.status !== Round2AiReportScoringStatus.SCORED;
}

function extractResponseText(payload: unknown) {
  const direct = (payload as { output_text?: unknown } | null)?.output_text;
  if (typeof direct === "string") {
    return direct;
  }

  const output = (payload as { output?: unknown } | null)?.output;
  if (!Array.isArray(output)) {
    return "";
  }

  return output
    .flatMap((item) => Array.isArray((item as { content?: unknown }).content) ? (item as { content: unknown[] }).content : [])
    .flatMap((part) => typeof (part as { text?: unknown }).text === "string" ? [(part as { text: string }).text] : [])
    .join("\n")
    .trim();
}

function clampCriterionScore(value: unknown, maxScore: number) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  const rounded = Math.round(parsed * 10) / 10;
  return rounded >= 0 && rounded <= maxScore ? rounded : null;
}

function validateOpenAiScoringResult(raw: unknown) {
  if (!raw || typeof raw !== "object") {
    throw new Error("OpenAI did not return a valid Emerging scoring object.");
  }

  const criteriaRaw = (raw as { criteria?: unknown }).criteria;
  if (!Array.isArray(criteriaRaw)) {
    throw new Error("OpenAI did not return the Emerging rubric score list.");
  }

  const rubricById = new Map(ROUND2_REPORT_RUBRIC.map((criterion) => [criterion.id, criterion]));
  const seen = new Set<string>();
  const criteria = criteriaRaw.map((entry) => {
    const criterionId = String((entry as { criterionId?: unknown }).criterionId ?? "");
    const criterion = rubricById.get(criterionId);
    if (!criterion || seen.has(criterionId)) {
      throw new Error("OpenAI returned an invalid or duplicate Emerging rubric criterion.");
    }
    seen.add(criterionId);

    const score = clampCriterionScore((entry as { score?: unknown }).score, criterion.maxScore);
    const rationale = String((entry as { rationale?: unknown }).rationale ?? "").trim();
    if (score == null || rationale.length < 16) {
      throw new Error(`OpenAI returned an invalid Emerging score for ${criterion.label.en}.`);
    }

    return { criterionId, score, rationale: rationale.slice(0, 1000) };
  });

  if (criteria.length !== ROUND2_REPORT_RUBRIC.length) {
    throw new Error("OpenAI did not return scores for every Emerging rubric criterion.");
  }

  const comment = String((raw as { comment?: unknown }).comment ?? "").trim();
  if (comment.length < 600) {
    throw new Error("OpenAI returned an Emerging comment that is too short.");
  }

  return { criteria, comment: comment.slice(0, 14000) };
}

async function readRound2Baseline(submission: EmergingCandidate) {
  const round2Submission = await prisma.teamSubmission.findFirst({
    where: {
      teamId: submission.teamId,
      round: SubmissionRound.ROUND_2,
    },
    orderBy: [{ version: "desc" }, { submittedAt: "desc" }],
    include: {
      judgeReviews: {
        include: {
          judgeUser: {
            select: { role: true },
          },
        },
      },
    },
  });

  if (!round2Submission) {
    return {
      score: null as number | null,
      rubricScores: {} as Record<string, number>,
      comments: [] as string[],
    };
  }

  const scoredReviews = round2Submission.judgeReviews.filter(
    (review) => review.judgeUser.role === UserRole.JUDGE && typeof review.score === "number" && review.scoredAt,
  );
  const score = scoredReviews.length
    ? Math.round((scoredReviews.reduce((total, review) => total + (review.score ?? 0), 0) / scoredReviews.length) * 10) / 10
    : null;
  const rubricScoreBuckets = new Map<string, number[]>();
  const comments: string[] = [];
  for (const review of scoredReviews) {
    const decoded = decodeTeamReviewNote(review.note);
    if (decoded.note) {
      comments.push(decoded.note);
    }
    for (const [criterionId, criterionScore] of Object.entries(decoded.rubricScores)) {
      const bucket = rubricScoreBuckets.get(criterionId) ?? [];
      bucket.push(criterionScore);
      rubricScoreBuckets.set(criterionId, bucket);
    }
  }

  const rubricScores = Object.fromEntries(
    Array.from(rubricScoreBuckets.entries()).map(([criterionId, scores]) => [
      criterionId,
      Math.round((scores.reduce((total, value) => total + value, 0) / scores.length) * 10) / 10,
    ]),
  );

  return { score, rubricScores, comments };
}

async function scoreEmergingReportWithOpenAi({
  model,
  submission,
  reportBuffer,
}: {
  model: string;
  submission: EmergingCandidate;
  reportBuffer: Buffer;
}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured on the server.");
  }

  if (reportBuffer.byteLength > MAX_REPORT_BYTES) {
    throw new Error("The Emerging report PDF is too large for GPT scoring. Keep the report under 10MB.");
  }

  const baseline = await readRound2Baseline(submission);
  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content: [
            "Bạn là trợ lý chấm báo cáo Vòng Đội ươm mầm của Attacker 2026.",
            "Dùng cùng rubric Vòng 2, nhưng trọng tâm là mức độ cải thiện so với báo cáo Vòng 2.",
            "Nếu một tiêu chí không cải thiện rõ, giữ điểm gần bằng hoặc bằng điểm Vòng 2 của tiêu chí đó.",
            "Chỉ tăng điểm khi báo cáo mới có bằng chứng cải thiện cụ thể; không vượt quá điểm tối đa của tiêu chí.",
            "Nhận xét phải bằng tiếng Việt, cụ thể, chuyên nghiệp, tập trung vào cải thiện hoặc chưa cải thiện.",
            "Áp dụng chuẩn chấm nghiêm hơn khoảng 30% so với trước: điểm tăng phải khó hơn, chỉ khi cải thiện rõ, có ý nghĩa và có bằng chứng.",
            "Nếu cải thiện nhỏ, chỉ chỉnh hình thức, viết lại nội dung cũ hoặc chưa xử lý vấn đề từ Vòng 2, giữ nguyên điểm hoặc giảm điểm nếu chất lượng/bằng chứng yếu.",
            "Không tăng điểm chỉ vì báo cáo dài hơn hoặc trình bày đẹp hơn; khi phân vân, chọn điểm thấp hơn trừ khi có bằng chứng cải thiện mạnh.",
            "Không ép điểm thấp nếu báo cáo mới thật sự cải thiện rõ và có bằng chứng cụ thể.",
          ].join(" "),
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: JSON.stringify({
                task: "Chấm báo cáo Vòng Đội ươm mầm theo rubric, so sánh với điểm và nhận xét Vòng 2.",
                submission: {
                  title: submission.title,
                  summary: submission.summary,
                  version: submission.version,
                  submittedAt: submission.submittedAt.toISOString(),
                  fileName: submission.resourceLabel,
                },
                round2Baseline: baseline,
                rubric: ROUND2_REPORT_RUBRIC,
                scoringGuidance: [
                  "Mỗi tiêu chí cần nêu rõ: điểm Vòng 2, điểm Vòng Đội ươm mầm, và cải thiện hoặc chưa cải thiện ở đâu.",
                  "Nếu thiếu bằng chứng cải thiện, không tăng điểm chỉ vì đội nộp phiên bản mới.",
                  "Chỉ tăng hơn 10% điểm tối đa của một tiêu chí khi có cải thiện lớn, cụ thể và được chứng minh trong báo cáo mới.",
                  "Nếu báo cáo mới không xử lý nhận xét hoặc vấn đề chính từ Vòng 2, điểm tiêu chí nên bằng hoặc thấp hơn điểm Vòng 2.",
                  "Không cho điểm thưởng nếu không có bằng chứng triển khai, kiểm chứng hoặc sản phẩm mới sau Vòng 2.",
                  "Comment tổng thể cần có các phần: Tổng quan cải thiện, Cải thiện nổi bật, Điểm chưa cải thiện, Rủi ro còn lại, Gợi ý tiếp theo, Nhận xét theo rubric.",
                ],
              }),
            },
            {
              type: "input_file",
              filename: submission.resourceLabel || "emerging-report.pdf",
              file_data: `${PDF_DATA_URL_PREFIX}${reportBuffer.toString("base64")}`,
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "emerging_report_scoring",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["criteria", "comment"],
            properties: {
              criteria: {
                type: "array",
                minItems: ROUND2_REPORT_RUBRIC.length,
                maxItems: ROUND2_REPORT_RUBRIC.length,
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["criterionId", "score", "rationale"],
                  properties: {
                    criterionId: { type: "string", enum: ROUND2_REPORT_RUBRIC.map((criterion) => criterion.id) },
                    score: { type: "number", minimum: 0, maximum: ROUND2_REPORT_FINAL_MAX_SCORE, multipleOf: 0.1 },
                    rationale: { type: "string" },
                  },
                },
              },
              comment: { type: "string" },
            },
          },
        },
      },
    }),
  });

  const payload = (await response.json().catch(() => null)) as unknown;
  if (!response.ok) {
    const errorMessage =
      typeof (payload as { error?: { message?: unknown } } | null)?.error?.message === "string"
        ? String((payload as { error: { message: string } }).error.message)
        : "OpenAI Emerging scoring request failed.";
    throw new Error(errorMessage);
  }

  const responseText = extractResponseText(payload);
  if (!responseText) {
    throw new Error("OpenAI returned an empty Emerging scoring response.");
  }

  return validateOpenAiScoringResult(JSON.parse(responseText));
}

async function readCandidates() {
  await ensureEmergingJudgeAssignments(prisma);
  const result = await readLatestEmergingSubmissions(prisma);
  return {
    ...result,
    submissions: result.submissions as EmergingCandidate[],
  };
}

async function countEligibleSubmissions(mode: EmergingAiReportScoringJobMode, retryJobCreatedAt?: Date) {
  const { submissions } = await readCandidates();
  return submissions.filter((submission) => isEligibleSubmission(submission, mode, retryJobCreatedAt)).length;
}

async function findNextCandidate(mode: EmergingAiReportScoringJobMode, retryJobCreatedAt?: Date) {
  const { submissions } = await readCandidates();
  return submissions
    .filter((submission) => isEligibleSubmission(submission, mode, retryJobCreatedAt))
    .sort((left, right) => right.submittedAt.getTime() - left.submittedAt.getTime())[0];
}

async function completeJobIfNoCandidates(
  jobId: string,
  mode: EmergingAiReportScoringJobMode,
  retryJobCreatedAt?: Date,
) {
  const remaining = await countEligibleSubmissions(mode, retryJobCreatedAt);
  if (remaining > 0) {
    return false;
  }

  await prisma.emergingAiReportScoringJob.update({
    where: { id: jobId },
    data: {
      status: EmergingAiReportScoringJobStatus.COMPLETED,
      completedAt: new Date(),
    },
  });

  return true;
}

export async function readEmergingAiReportScoringOverview(): Promise<EmergingAiReportScoringOverview> {
  const [{ closed: emergingClosed, deadlineAt, submissions }, activeJob] = await Promise.all([
    readCandidates(),
    prisma.emergingAiReportScoringJob.findFirst({
      where: {
        status: {
          in: [EmergingAiReportScoringJobStatus.PENDING, EmergingAiReportScoringJobStatus.RUNNING],
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const humanScored = submissions.filter(hasHumanScoredReview).length;
  const gptScored = submissions.filter((submission) => !hasHumanScoredReview(submission) && hasGptScoredReview(submission)).length;
  const failed = submissions.filter(
    (submission) => !hasHumanScoredReview(submission) && submission.aiReportReview?.status === Round2AiReportScoringStatus.FAILED,
  ).length;
  const needsGptScore = emergingClosed
    ? submissions.filter((submission) => isEligibleSubmission(submission, EmergingAiReportScoringJobMode.RUN_ALL)).length
    : 0;
  const denominator = Math.max(0, submissions.length - humanScored);

  return {
    emergingClosed,
    deadlineAt: deadlineAt?.toISOString(),
    activeJob: activeJob ? serializeJob(activeJob) : null,
    totals: {
      latestReports: submissions.length,
      humanScored,
      gptScored,
      failed,
      needsGptScore,
      gptScoringPercent: denominator > 0 ? Math.round((gptScored / denominator) * 1000) / 10 : 100,
    },
  };
}

export async function createEmergingAiReportScoringJob(
  mode: EmergingAiReportScoringMode,
  createdByUserId: string,
): Promise<ServiceResult<{ job: EmergingAiReportScoringJobSnapshot; overview: EmergingAiReportScoringOverview }>> {
  const { closed } = await readEmergingSubmissionLockState();
  if (!closed) {
    return fail(409, "Emerging GPT report scoring opens only after the Emerging submission deadline.");
  }

  const activeJob = await prisma.emergingAiReportScoringJob.findFirst({
    where: {
      status: {
        in: [EmergingAiReportScoringJobStatus.PENDING, EmergingAiReportScoringJobStatus.RUNNING],
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (activeJob) {
    return ok({
      job: serializeJob(activeJob),
      overview: await readEmergingAiReportScoringOverview(),
    });
  }

  const normalizedMode = normalizeMode(mode);
  const model = process.env.EMERGING_OPENAI_MODEL?.trim() || process.env.ROUND2_OPENAI_MODEL?.trim() || DEFAULT_OPENAI_MODEL;
  const totalEligible = await countEligibleSubmissions(normalizedMode);
  const job = await prisma.emergingAiReportScoringJob.create({
    data: {
      mode: normalizedMode,
      status: totalEligible > 0 ? EmergingAiReportScoringJobStatus.PENDING : EmergingAiReportScoringJobStatus.COMPLETED,
      model,
      totalEligible,
      createdByUserId,
      completedAt: totalEligible > 0 ? null : new Date(),
    },
  });

  return ok({ job: serializeJob(job), overview: await readEmergingAiReportScoringOverview() }, 201);
}

export async function processNextEmergingAiReportScoringJobItem(
  jobId: string,
): Promise<ServiceResult<{ job: EmergingAiReportScoringJobSnapshot; overview: EmergingAiReportScoringOverview }>> {
  const job = await prisma.emergingAiReportScoringJob.findUnique({ where: { id: jobId } });
  if (!job) {
    return fail(404, "Emerging GPT scoring job not found.");
  }

  if (job.status === EmergingAiReportScoringJobStatus.COMPLETED || job.status === EmergingAiReportScoringJobStatus.FAILED) {
    return ok({ job: serializeJob(job), overview: await readEmergingAiReportScoringOverview() });
  }

  if (!process.env.OPENAI_API_KEY) {
    const failedJob = await prisma.emergingAiReportScoringJob.update({
      where: { id: job.id },
      data: { status: EmergingAiReportScoringJobStatus.FAILED, lastError: "OPENAI_API_KEY is not configured on the server.", completedAt: new Date() },
    });
    return fail(409, serializeJob(failedJob).lastError ?? "OpenAI API key is missing.");
  }

  await prisma.emergingAiReportScoringJob.update({
    where: { id: job.id },
    data: { status: EmergingAiReportScoringJobStatus.RUNNING, startedAt: job.startedAt ?? new Date() },
  });

  const retryJobCreatedAt = job.mode === EmergingAiReportScoringJobMode.RETRY_FAILED ? job.createdAt : undefined;
  const candidate = await findNextCandidate(job.mode, retryJobCreatedAt);
  if (!candidate) {
    await completeJobIfNoCandidates(job.id, job.mode, retryJobCreatedAt);
    const completedJob = await prisma.emergingAiReportScoringJob.findUniqueOrThrow({ where: { id: job.id } });
    return ok({ job: serializeJob(completedJob), overview: await readEmergingAiReportScoringOverview() });
  }

  const assignedReview = candidate.judgeReviews.find((review) => review.judgeUser.role === UserRole.JUDGE);
  await prisma.round2AiReportReview.upsert({
    where: { submissionId: candidate.id },
    create: { submissionId: candidate.id, model: job.model, status: Round2AiReportScoringStatus.SCORING },
    update: { model: job.model, status: Round2AiReportScoringStatus.SCORING, error: null },
  });

  try {
    if (!assignedReview) {
      throw new Error("This latest Emerging report does not have an assigned judge review record.");
    }

    if (candidate.resourceSource !== TeamSubmissionResourceSource.UPLOAD || !candidate.resourceStorageKey || !candidate.resourceLabel.toLowerCase().endsWith(".pdf")) {
      throw new Error("Emerging GPT scoring requires the latest report to be an uploaded PDF file.");
    }

    const reportBuffer = await readTeamSubmissionFile(candidate.resourceStorageKey);
    const result = await scoreEmergingReportWithOpenAi({ model: job.model, submission: candidate, reportBuffer });
    const rubricScores = Object.fromEntries(result.criteria.map((criterion) => [criterion.criterionId, criterion.score]));
    const totalScore = Math.min(
      ROUND2_REPORT_FINAL_MAX_SCORE,
      Math.round(result.criteria.reduce((total, criterion) => total + criterion.score, 0) * 10) / 10,
    );
    const detailedComment = [
      result.comment,
      "",
      "Nhận xét theo rubric:",
      ...result.criteria.map((criterion) => {
        const rubric = ROUND2_REPORT_RUBRIC.find((item) => item.id === criterion.criterionId);
        const label = rubric?.label.vi || rubric?.label.en || criterion.criterionId;
        return `- ${label}: ${criterion.score}/${rubric?.maxScore ?? ""}. ${criterion.rationale}`;
      }),
    ].join("\n");
    const scoredAt = new Date();

    await prisma.$transaction(async (tx) => {
      const lockedSubmission = await tx.teamSubmission.findUnique({
        where: { id: candidate.id },
        include: {
          judgeReviews: {
            include: {
              judgeUser: {
                select: { role: true },
              },
            },
          },
        },
      });
      if (!lockedSubmission) {
        throw new Error("Emerging report disappeared before GPT score could be saved.");
      }
      if (lockedSubmission.judgeReviews.some((review) => review.judgeUser.role === UserRole.JUDGE && review.source === TeamSubmissionJudgeReviewSource.HUMAN && review.score != null && review.scoredAt)) {
        await tx.round2AiReportReview.update({
          where: { submissionId: candidate.id },
          data: { status: Round2AiReportScoringStatus.SKIPPED_HUMAN, humanOverriddenAt: scoredAt, error: null },
        });
        await tx.emergingAiReportScoringJob.update({
          where: { id: job.id },
          data: { processedCount: { increment: 1 }, skippedHumanCount: { increment: 1 } },
        });
        return;
      }

      const encodedNote = encodeTeamReviewNote(detailedComment, rubricScores);
      await tx.teamSubmissionJudgeReview.update({
        where: {
          judgeUserId_submissionId: {
            judgeUserId: assignedReview.judgeUserId,
            submissionId: candidate.id,
          },
        },
        data: {
          score: totalScore,
          note: encodedNote,
          source: TeamSubmissionJudgeReviewSource.AI,
          scoredAt,
        },
      });
      await tx.round2AiReportReview.update({
        where: { submissionId: candidate.id },
        data: {
          model: job.model,
          status: Round2AiReportScoringStatus.SCORED,
          score: totalScore,
          rubricScores: JSON.stringify(rubricScores),
          comment: detailedComment,
          error: null,
          scoredAt,
        },
      });
      await tx.team.update({
        where: { id: candidate.teamId },
        data: { finalScore: totalScore, finalScoreUpdatedAt: scoredAt },
      });
      await tx.emergingAiReportScoringJob.update({
        where: { id: job.id },
        data: { processedCount: { increment: 1 }, scoredCount: { increment: 1 } },
      });
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected Emerging GPT scoring error.";
    await prisma.$transaction([
      prisma.round2AiReportReview.update({
        where: { submissionId: candidate.id },
        data: { status: Round2AiReportScoringStatus.FAILED, error: message },
      }),
      prisma.emergingAiReportScoringJob.update({
        where: { id: job.id },
        data: { processedCount: { increment: 1 }, failedCount: { increment: 1 }, lastError: message },
      }),
    ]);
  }

  await completeJobIfNoCandidates(job.id, job.mode, retryJobCreatedAt);
  const updatedJob = await prisma.emergingAiReportScoringJob.findUniqueOrThrow({ where: { id: job.id } });
  return ok({ job: serializeJob(updatedJob), overview: await readEmergingAiReportScoringOverview() });
}
