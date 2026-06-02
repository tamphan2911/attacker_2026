import {
  Round1AiEssayScoringJobMode,
  Round1AiEssayScoringJobStatus,
  Round1AiEssayScoringStatus,
  Round1JudgeReviewSource,
  type Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/db";
import {
  ROUND1_ESSAY_MAX_SCORE,
  ROUND1_ESSAY_POINT_VALUE,
  countWords,
  pickRound1QuestionText,
} from "@/lib/round1";
import { ensureRound1JudgeAssignments } from "@/server/round1-judge-assignment";
import {
  ensureRound1SubmissionArchive,
  parseRound1SubmissionArchiveSync,
} from "@/server/round1-submission-archive";

const DEFAULT_OPENAI_MODEL = "gpt-4.1-mini";
const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";

const ROUND1_ESSAY_RUBRIC = `
Câu 41, tổng 10 điểm:
1. Xác định vấn đề và khách hàng mục tiêu, tối đa 2.0 điểm. Yếu: hiểu sai đề, không xác định được vấn đề/khách hàng. Trung bình: có nêu nhưng chung chung. Khá: tương đối rõ. Giỏi: rõ, gắn với nhóm khách hàng và bối cảnh cụ thể. Xuất sắc: xác định đúng vấn đề cốt lõi, khách hàng mục tiêu và lý do vấn đề đáng giải quyết.
2. Liên hệ thực tiễn thị trường Việt Nam, tối đa 2.0 điểm. Đánh giá mức độ vận dụng bối cảnh Việt Nam, hành vi người dùng, đặc thù thị trường và hạn chế thực tế.
3. Phân tích và giải pháp chuyên môn, tối đa 2.0 điểm. Đánh giá cấu trúc lập luận, dữ liệu/chỉ số/logic, hướng triển khai, giá trị cho người dùng, hiểu biết về mô hình kinh doanh, công nghệ và đổi mới.
4. Nhận diện rủi ro và tính khả thi, tối đa 2.0 điểm. Đánh giá khả năng nhận diện rủi ro vận hành, dữ liệu, pháp lý, bảo vệ người dùng và biện pháp kiểm soát.
5. Chất lượng trình bày, tối đa 2.0 điểm. Đánh giá sự mạch lạc, chuyên nghiệp, bố cục và lỗi diễn đạt/logic.

Câu 42, tổng 10 điểm:
1. Mô tả vấn đề và ý tưởng dự án, tối đa 2.0 điểm. Đánh giá độ rõ của vấn đề, ý tưởng, đối tượng hưởng lợi và tiềm năng phát triển ở vòng 2.
2. Tính đổi mới và sáng tạo, tối đa 1.5 điểm. Đánh giá khác biệt, cách kết hợp ý tưởng/công nghệ/cách tiếp cận mới và điểm nổi bật.
3. Tính khả thi để phát triển ở vòng 2, tối đa 1.5 điểm. Đánh giá định hướng triển khai, khả năng phát triển thành báo cáo, mô hình, bản mẫu hoặc kế hoạch phù hợp nguồn lực sinh viên.
4. Ứng dụng công nghệ, tối đa 1.5 điểm. Đánh giá vai trò và mức phù hợp của công nghệ trong giải pháp.
5. Tác động xã hội, tài chính, giáo dục hoặc kinh doanh, tối đa 1.5 điểm. Đánh giá tác động với nhóm người dùng/vấn đề thực tiễn và giá trị tạo ra.
6. Trình bày, cấu trúc và tính thuyết phục, tối đa 2.0 điểm. Đánh giá cấu trúc, mạch lạc, đúng yêu cầu 300-500 từ, tính thuyết phục và tinh thần chuyên nghiệp.
`.trim();

type ServiceSuccess<T> = {
  ok: true;
  status: number;
  data: T;
};

type ServiceFailure = {
  ok: false;
  status: number;
  error: string;
};

type ServiceResult<T> = ServiceSuccess<T> | ServiceFailure;

type Round1AiEssayScoringMode = "run-all" | "retry-failed";

type ScoredEssay = {
  questionId: string;
  score: number;
  comment: string;
};

type OpenAiEssayScoringResult = {
  essays: ScoredEssay[];
  summary: string;
};

export type Round1AiEssayScoringOverview = {
  activeJob: Round1AiEssayScoringJobSnapshot | null;
  totals: {
    assignedSubmissions: number;
    humanScored: number;
    gptScored: number;
    failed: number;
    needsGptScore: number;
    gptScoringPercent: number;
  };
};

export type Round1AiEssayScoringJobSnapshot = {
  id: string;
  mode: Round1AiEssayScoringMode;
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

function ok<T>(data: T, status = 200): ServiceSuccess<T> {
  return { ok: true, status, data };
}

function fail(status: number, error: string): ServiceFailure {
  return { ok: false, status, error };
}

function normalizeMode(mode: Round1AiEssayScoringMode) {
  return mode === "retry-failed" ? Round1AiEssayScoringJobMode.RETRY_FAILED : Round1AiEssayScoringJobMode.RUN_ALL;
}

function serializeMode(mode: Round1AiEssayScoringJobMode): Round1AiEssayScoringMode {
  return mode === Round1AiEssayScoringJobMode.RETRY_FAILED ? "retry-failed" : "run-all";
}

function serializeJob(job: {
  id: string;
  mode: Round1AiEssayScoringJobMode;
  status: Round1AiEssayScoringJobStatus;
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
}): Round1AiEssayScoringJobSnapshot {
  return {
    id: job.id,
    mode: serializeMode(job.mode),
    status: job.status.toLowerCase() as Round1AiEssayScoringJobSnapshot["status"],
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

function hasHumanScoredReview(
  judgeReviews: Array<{ source: Round1JudgeReviewSource; score: number | null; scoredAt: Date | null }>,
) {
  return judgeReviews.some(
    (review) => review.source === Round1JudgeReviewSource.HUMAN && review.score != null && review.scoredAt,
  );
}

const noHumanScoredReviewWhere = {
  none: {
    source: Round1JudgeReviewSource.HUMAN,
    score: { not: null },
    scoredAt: { not: null },
  },
} satisfies Prisma.Round1JudgeReviewListRelationFilter;

function candidateWhere(mode: Round1AiEssayScoringJobMode): Prisma.Round1SubmissionWhereInput {
  const base: Prisma.Round1SubmissionWhereInput = {
    judgeReviews: {
      some: {},
      ...noHumanScoredReviewWhere,
    },
  };

  if (mode === Round1AiEssayScoringJobMode.RETRY_FAILED) {
    return {
      ...base,
      aiEssayReview: {
        is: {
          status: Round1AiEssayScoringStatus.FAILED,
        },
      },
    };
  }

  return {
    ...base,
    aiEssayReview: {
      is: null,
    },
  };
}

async function countEligibleSubmissions(mode: Round1AiEssayScoringJobMode) {
  await ensureRound1JudgeAssignments(prisma);
  return prisma.round1Submission.count({
    where: candidateWhere(mode),
  });
}

function clampScore(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  const rounded = Math.round(parsed * 10) / 10;
  if (rounded < 0 || rounded > ROUND1_ESSAY_POINT_VALUE) {
    return null;
  }

  return rounded;
}

function extractResponseText(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  const direct = (payload as { output_text?: unknown }).output_text;
  if (typeof direct === "string") {
    return direct;
  }

  const output = (payload as { output?: unknown }).output;
  if (!Array.isArray(output)) {
    return "";
  }

  const fragments: string[] = [];
  for (const item of output) {
    const content = (item as { content?: unknown })?.content;
    if (!Array.isArray(content)) {
      continue;
    }

    for (const part of content) {
      const text = (part as { text?: unknown })?.text;
      if (typeof text === "string") {
        fragments.push(text);
      }
    }
  }

  return fragments.join("\n").trim();
}

function validateOpenAiScoringResult(raw: unknown, questionIds: string[]): OpenAiEssayScoringResult {
  if (!raw || typeof raw !== "object") {
    throw new Error("OpenAI did not return a valid scoring object.");
  }

  const essaysRaw = (raw as { essays?: unknown }).essays;
  if (!Array.isArray(essaysRaw)) {
    throw new Error("OpenAI did not return the essay score list.");
  }

  const allowedQuestionIds = new Set(questionIds);
  const essays = essaysRaw.map((entry) => {
    const questionId = String((entry as { questionId?: unknown }).questionId ?? "");
    const score = clampScore((entry as { score?: unknown }).score);
    const comment = String((entry as { comment?: unknown }).comment ?? "").trim();

    if (!allowedQuestionIds.has(questionId)) {
      throw new Error("OpenAI returned a score for an unknown essay question.");
    }

    if (score == null) {
      throw new Error(`OpenAI returned an invalid score for essay question ${questionId}.`);
    }

    if (comment.length < 20) {
      throw new Error(`OpenAI returned an essay comment that is too short for question ${questionId}.`);
    }

    return {
      questionId,
      score,
      comment: comment.slice(0, 1200),
    };
  });

  if (essays.length !== questionIds.length) {
    throw new Error("OpenAI did not return scores for every essay question.");
  }

  return {
    essays,
    summary: String((raw as { summary?: unknown }).summary ?? "").trim().slice(0, 1200),
  };
}

async function scoreEssaysWithOpenAi({
  model,
  essays,
}: {
  model: string;
  essays: Array<{
    questionId: string;
    order: number;
    prompt: string;
    answerText: string;
    wordCount: number;
  }>;
}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured on the server.");
  }

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
            "Bạn là trợ lý chấm điểm tự luận cho cuộc thi Attacker 2026.",
            "Chấm theo rubric được cung cấp, trả về JSON đúng schema.",
            "Điểm mỗi câu từ 0 đến 10, cho phép một chữ số thập phân.",
            "Nhận xét phải bằng tiếng Việt, giọng chuyên nghiệp, cụ thể, tự nhiên, tránh văn phong chung chung hoặc quá giống AI.",
            "Không phóng đại. Nếu bài thiếu ý, nêu rõ thiếu gì. Nếu bài tốt, chỉ ra điểm mạnh cụ thể.",
          ].join(" "),
        },
        {
          role: "user",
          content: JSON.stringify({
            rubric: ROUND1_ESSAY_RUBRIC,
            instruction:
              "Chấm từng câu độc lập. Comment mỗi câu nên gồm nhận xét tổng quan, điểm tốt và điểm cần cải thiện, ngắn gọn nhưng cụ thể.",
            essays,
          }),
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "round1_essay_scoring",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["essays", "summary"],
            properties: {
              essays: {
                type: "array",
                minItems: essays.length,
                maxItems: essays.length,
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["questionId", "score", "comment"],
                  properties: {
                    questionId: { type: "string" },
                    score: {
                      type: "number",
                      minimum: 0,
                      maximum: ROUND1_ESSAY_POINT_VALUE,
                      multipleOf: 0.1,
                    },
                    comment: { type: "string" },
                  },
                },
              },
              summary: { type: "string" },
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
        : "OpenAI scoring request failed.";
    throw new Error(errorMessage);
  }

  const responseText = extractResponseText(payload);
  if (!responseText) {
    throw new Error("OpenAI returned an empty scoring response.");
  }

  return validateOpenAiScoringResult(JSON.parse(responseText), essays.map((essay) => essay.questionId));
}

function buildAiJudgeNote({
  essays,
  result,
}: {
  essays: Array<{ questionId: string; order: number }>;
  result: OpenAiEssayScoringResult;
}) {
  const essayById = new Map(essays.map((essay) => [essay.questionId, essay]));
  const lines = [
    "Bản chấm gợi ý bởi GPT. Giám khảo vui lòng rà soát và có thể chỉnh sửa trước khi lưu xác nhận.",
  ];

  for (const scoredEssay of result.essays) {
    const essay = essayById.get(scoredEssay.questionId);
    lines.push("");
    lines.push(`Câu ${essay?.order ?? scoredEssay.questionId}: ${scoredEssay.score}/10`);
    lines.push(scoredEssay.comment);
  }

  if (result.summary) {
    lines.push("");
    lines.push(`Tổng nhận xét: ${result.summary}`);
  }

  return lines.join("\n").trim();
}

async function findNextCandidate(jobMode: Round1AiEssayScoringJobMode) {
  await ensureRound1JudgeAssignments(prisma);
  return prisma.round1Submission.findFirst({
    where: candidateWhere(jobMode),
    orderBy: [{ submittedAt: "desc" }, { id: "asc" }],
    include: {
      judgeReviews: {
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

async function completeJobIfNoCandidates(jobId: string, mode: Round1AiEssayScoringJobMode) {
  const remaining = await prisma.round1Submission.count({
    where: candidateWhere(mode),
  });

  if (remaining > 0) {
    return false;
  }

  await prisma.round1AiEssayScoringJob.update({
    where: { id: jobId },
    data: {
      status: Round1AiEssayScoringJobStatus.COMPLETED,
      completedAt: new Date(),
    },
  });

  return true;
}

export async function readRound1AiEssayScoringOverview(): Promise<Round1AiEssayScoringOverview> {
  const [assignedSubmissions, humanScored, gptScored, failed, activeJob] = await Promise.all([
    prisma.round1Submission.count({
      where: { judgeReviews: { some: {} } },
    }),
    prisma.round1Submission.count({
      where: {
        judgeReviews: {
          some: {
            source: Round1JudgeReviewSource.HUMAN,
            score: { not: null },
            scoredAt: { not: null },
          },
        },
      },
    }),
    prisma.round1Submission.count({
      where: {
        aiEssayReview: {
          is: { status: Round1AiEssayScoringStatus.SCORED },
        },
        judgeReviews: noHumanScoredReviewWhere,
      },
    }),
    prisma.round1Submission.count({
      where: {
        aiEssayReview: {
          is: { status: Round1AiEssayScoringStatus.FAILED },
        },
        judgeReviews: noHumanScoredReviewWhere,
      },
    }),
    prisma.round1AiEssayScoringJob.findFirst({
      where: {
        status: {
          in: [Round1AiEssayScoringJobStatus.PENDING, Round1AiEssayScoringJobStatus.RUNNING],
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const needsGptScore = await countEligibleSubmissions(Round1AiEssayScoringJobMode.RUN_ALL);
  const denominator = Math.max(0, assignedSubmissions - humanScored);
  const gptScoringPercent = denominator > 0 ? Math.round((gptScored / denominator) * 1000) / 10 : 100;

  return {
    activeJob: activeJob ? serializeJob(activeJob) : null,
    totals: {
      assignedSubmissions,
      humanScored,
      gptScored,
      failed,
      needsGptScore,
      gptScoringPercent,
    },
  };
}

export async function createRound1AiEssayScoringJob(
  mode: Round1AiEssayScoringMode,
  createdByUserId: string,
): Promise<ServiceResult<{ job: Round1AiEssayScoringJobSnapshot; overview: Round1AiEssayScoringOverview }>> {
  const activeJob = await prisma.round1AiEssayScoringJob.findFirst({
    where: {
      status: {
        in: [Round1AiEssayScoringJobStatus.PENDING, Round1AiEssayScoringJobStatus.RUNNING],
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (activeJob) {
    return ok({
      job: serializeJob(activeJob),
      overview: await readRound1AiEssayScoringOverview(),
    });
  }

  const normalizedMode = normalizeMode(mode);
  const model = process.env.OPENAI_MODEL?.trim() || DEFAULT_OPENAI_MODEL;
  const totalEligible = await countEligibleSubmissions(normalizedMode);
  const job = await prisma.round1AiEssayScoringJob.create({
    data: {
      mode: normalizedMode,
      status: totalEligible > 0 ? Round1AiEssayScoringJobStatus.PENDING : Round1AiEssayScoringJobStatus.COMPLETED,
      model,
      totalEligible,
      createdByUserId,
      completedAt: totalEligible > 0 ? null : new Date(),
    },
  });

  return ok({
    job: serializeJob(job),
    overview: await readRound1AiEssayScoringOverview(),
  }, 201);
}

export async function processNextRound1AiEssayScoringJobItem(
  jobId: string,
): Promise<ServiceResult<{ job: Round1AiEssayScoringJobSnapshot; overview: Round1AiEssayScoringOverview }>> {
  const job = await prisma.round1AiEssayScoringJob.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    return fail(404, "Round 1 GPT scoring job not found.");
  }

  if (
    job.status === Round1AiEssayScoringJobStatus.COMPLETED ||
    job.status === Round1AiEssayScoringJobStatus.FAILED
  ) {
    return ok({
      job: serializeJob(job),
      overview: await readRound1AiEssayScoringOverview(),
    });
  }

  if (!process.env.OPENAI_API_KEY) {
    const failedJob = await prisma.round1AiEssayScoringJob.update({
      where: { id: job.id },
      data: {
        status: Round1AiEssayScoringJobStatus.FAILED,
        lastError: "OPENAI_API_KEY is not configured on the server.",
        completedAt: new Date(),
      },
    });
    return fail(409, serializeJob(failedJob).lastError ?? "OpenAI API key is missing.");
  }

  await prisma.round1AiEssayScoringJob.update({
    where: { id: job.id },
    data: {
      status: Round1AiEssayScoringJobStatus.RUNNING,
      startedAt: job.startedAt ?? new Date(),
    },
  });

  const candidate = await findNextCandidate(job.mode);
  if (!candidate) {
    await completeJobIfNoCandidates(job.id, job.mode);
    const completedJob = await prisma.round1AiEssayScoringJob.findUniqueOrThrow({ where: { id: job.id } });
    return ok({
      job: serializeJob(completedJob),
      overview: await readRound1AiEssayScoringOverview(),
    });
  }

  const assignedJudgeReview = candidate.judgeReviews[0];
  if (!assignedJudgeReview) {
    const updatedJob = await prisma.round1AiEssayScoringJob.update({
      where: { id: job.id },
      data: {
        processedCount: { increment: 1 },
        failedCount: { increment: 1 },
        lastError: "Submission has no assigned Round 1 judge review.",
      },
    });
    return ok({ job: serializeJob(updatedJob), overview: await readRound1AiEssayScoringOverview() });
  }

  await prisma.round1AiEssayReview.upsert({
    where: { submissionId: candidate.id },
    create: {
      submissionId: candidate.id,
      judgeUserId: assignedJudgeReview.judgeUserId,
      model: job.model,
      status: Round1AiEssayScoringStatus.SCORING,
    },
    update: {
      judgeUserId: assignedJudgeReview.judgeUserId,
      model: job.model,
      status: Round1AiEssayScoringStatus.SCORING,
      error: null,
    },
  });

  try {
    const archive = await ensureRound1SubmissionArchive({
      id: candidate.id,
      bankId: candidate.bankId,
      answers: candidate.answers,
      rightCount: candidate.rightCount,
      essayScore: candidate.essayScore,
    });
    const essays = archive.questions
      .filter((question) => String(question.type).toLowerCase() === "essay")
      .map((question, index) => {
        const answerText = archive.answers[question.id]?.essayText?.trim() ?? "";
        return {
          questionId: question.id,
          order:
            typeof question.paperOrder === "number" && Number.isFinite(question.paperOrder)
              ? question.paperOrder
              : index + 41,
          prompt: pickRound1QuestionText(question.prompt),
          answerText,
          wordCount: countWords(answerText),
        };
      })
      .sort((left, right) => left.order - right.order);

    if (essays.length !== 2) {
      throw new Error("Submission does not have exactly two archived essay questions.");
    }

    const result = await scoreEssaysWithOpenAi({
      model: job.model,
      essays,
    });
    const questionScores = Object.fromEntries(result.essays.map((essay) => [essay.questionId, essay.score]));
    const essayScore = Math.round(
      result.essays.reduce((total, essay) => total + essay.score, 0) * 10,
    ) / 10;

    if (essayScore < 0 || essayScore > ROUND1_ESSAY_MAX_SCORE) {
      throw new Error("OpenAI returned an invalid total essay score.");
    }

    const note = buildAiJudgeNote({ essays, result });
    const scoredAt = new Date();

    await prisma.$transaction(async (tx) => {
      const lockedSubmission = await tx.round1Submission.findUnique({
        where: { id: candidate.id },
        include: {
          judgeReviews: true,
        },
      });

      if (!lockedSubmission) {
        throw new Error("Round 1 submission disappeared before GPT score could be saved.");
      }

      if (hasHumanScoredReview(lockedSubmission.judgeReviews)) {
        await tx.round1AiEssayReview.update({
          where: { submissionId: candidate.id },
          data: {
            status: Round1AiEssayScoringStatus.SKIPPED_HUMAN,
            humanOverriddenAt: scoredAt,
            error: null,
          },
        });
        await tx.round1AiEssayScoringJob.update({
          where: { id: job.id },
          data: {
            processedCount: { increment: 1 },
            skippedHumanCount: { increment: 1 },
          },
        });
        return;
      }

      const parsedArchive = parseRound1SubmissionArchiveSync(lockedSubmission.answers);
      const nextArchive = {
        ...parsedArchive,
        essayQuestionScores: {
          ...parsedArchive.essayQuestionScores,
          ...questionScores,
        },
      };
      const totalScore = Math.round((lockedSubmission.objectiveScore + essayScore) * 10) / 10;

      await tx.round1JudgeReview.update({
        where: {
          judgeUserId_submissionId: {
            judgeUserId: assignedJudgeReview.judgeUserId,
            submissionId: candidate.id,
          },
        },
        data: {
          score: essayScore,
          note,
          source: Round1JudgeReviewSource.AI,
          scoredAt,
        },
      });

      await tx.round1Submission.update({
        where: { id: candidate.id },
        data: {
          essayScore,
          totalScore,
          score: totalScore,
          answers: JSON.stringify(nextArchive),
        },
      });

      await tx.round1AiEssayReview.update({
        where: { submissionId: candidate.id },
        data: {
          judgeUserId: assignedJudgeReview.judgeUserId,
          model: job.model,
          status: Round1AiEssayScoringStatus.SCORED,
          score: essayScore,
          questionScores: JSON.stringify(questionScores),
          note,
          error: null,
          scoredAt,
        },
      });

      await tx.round1AiEssayScoringJob.update({
        where: { id: job.id },
        data: {
          processedCount: { increment: 1 },
          scoredCount: { increment: 1 },
        },
      });
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected GPT scoring error.";
    await prisma.$transaction([
      prisma.round1AiEssayReview.update({
        where: { submissionId: candidate.id },
        data: {
          status: Round1AiEssayScoringStatus.FAILED,
          error: message,
        },
      }),
      prisma.round1AiEssayScoringJob.update({
        where: { id: job.id },
        data: {
          processedCount: { increment: 1 },
          failedCount: { increment: 1 },
          lastError: message,
        },
      }),
    ]);
  }

  await completeJobIfNoCandidates(job.id, job.mode);
  const updatedJob = await prisma.round1AiEssayScoringJob.findUniqueOrThrow({ where: { id: job.id } });

  return ok({
    job: serializeJob(updatedJob),
    overview: await readRound1AiEssayScoringOverview(),
  });
}
