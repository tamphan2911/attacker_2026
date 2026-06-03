import {
  Round2AiReportScoringJobMode,
  Round2AiReportScoringJobStatus,
  Round2AiReportScoringStatus,
  SubmissionRound,
  TeamSubmissionJudgeReviewSource,
  TeamSubmissionResourceSource,
  UserRole,
  type Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/db";
import {
  ROUND2_REPORT_FINAL_MAX_SCORE,
  ROUND2_REPORT_RUBRIC,
  type JudgeRubricCriterion,
} from "@/lib/judge-rubrics";
import { encodeTeamReviewNote } from "@/server/judge-service";
import {
  ensureRound2JudgeAssignments,
  readRound2SubmissionLockState,
} from "@/server/round2-judge-assignment";
import { readTeamSubmissionFile } from "@/server/team-submission-storage";

const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";
const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const MAX_REPORT_BYTES = 10 * 1024 * 1024;
const PDF_DATA_URL_PREFIX = "data:application/pdf;base64,";

const ROUND2_REPORT_TEMPLATE_GUIDE = `
Báo cáo Vòng 2 thường theo mẫu Attacker 2026 với các phần:
1. Thông tin cơ bản: tên dự án, đội thi, liên hệ, tổ chức, thành viên, lĩnh vực.
2. Hiện trạng dự án: ý tưởng, prototype, MVP, pilot hoặc đã triển khai.
3. Mô tả ý tưởng: mô hình kinh doanh, vấn đề, đối tượng chịu ảnh hưởng, cách giải pháp hoạt động và ý nghĩa xã hội/tài chính.
4. Tính đổi mới và độc đáo: điểm khác biệt, công nghệ, cách tiếp cận mới, tác động với thị trường tài chính/ngân hàng Việt Nam.
5. Tính khả thi: khả thi kỹ thuật/tài chính, nguồn lực, hợp tác, dữ liệu minh chứng, nguyên mẫu hoặc nghiên cứu ban đầu.
6. Mở rộng và tăng trưởng: lộ trình mở rộng, phân khúc thị trường, cơ hội phát triển.
7. Tác động: tác động kinh tế, xã hội hoặc với các bên liên quan.
8. Phần bổ sung không bắt buộc: pháp lý, marketing, dự phóng kinh doanh, rủi ro, gọi vốn, đường link sản phẩm hoặc giới thiệu sản phẩm.
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

type Round2AiReportScoringMode = "run-all" | "retry-failed";

type CriterionScore = {
  criterionId: string;
  score: number;
  rationale: string;
};

type OpenAiReportScoringResult = {
  criteria: CriterionScore[];
  comment: string;
};

export type Round2AiReportScoringJobSnapshot = {
  id: string;
  mode: Round2AiReportScoringMode;
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

export type Round2AiReportScoringOverview = {
  round2Closed: boolean;
  deadlineAt?: string;
  activeJob: Round2AiReportScoringJobSnapshot | null;
  totals: {
    latestReports: number;
    humanScored: number;
    gptScored: number;
    failed: number;
    needsGptScore: number;
    gptScoringPercent: number;
  };
};

type Round2LatestSubmission = Prisma.TeamSubmissionGetPayload<{
  include: {
    team: {
      select: {
        id: true;
        name: true;
        tag: true;
        bio: true;
        track: true;
      };
    };
    submittedByUser: {
      select: {
        name: true;
        email: true;
      };
    };
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

function ok<T>(data: T, status = 200): ServiceSuccess<T> {
  return { ok: true, status, data };
}

function fail(status: number, error: string): ServiceFailure {
  return { ok: false, status, error };
}

function normalizeMode(mode: Round2AiReportScoringMode) {
  return mode === "retry-failed" ? Round2AiReportScoringJobMode.RETRY_FAILED : Round2AiReportScoringJobMode.RUN_ALL;
}

function serializeMode(mode: Round2AiReportScoringJobMode): Round2AiReportScoringMode {
  return mode === Round2AiReportScoringJobMode.RETRY_FAILED ? "retry-failed" : "run-all";
}

function serializeJob(job: {
  id: string;
  mode: Round2AiReportScoringJobMode;
  status: Round2AiReportScoringJobStatus;
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
}): Round2AiReportScoringJobSnapshot {
  return {
    id: job.id,
    mode: serializeMode(job.mode),
    status: job.status.toLowerCase() as Round2AiReportScoringJobSnapshot["status"],
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
  judgeReviews: Array<{
    source: TeamSubmissionJudgeReviewSource;
    score: number | null;
    scoredAt: Date | null;
    judgeUser: { role: UserRole };
  }>,
) {
  return judgeReviews.some(
    (review) =>
      review.judgeUser.role === UserRole.JUDGE &&
      review.source === TeamSubmissionJudgeReviewSource.HUMAN &&
      review.score != null &&
      review.scoredAt,
  );
}

function createRubricForPrompt(rubric: JudgeRubricCriterion[]) {
  return rubric.map((criterion) => ({
    id: criterion.id,
    label: criterion.label,
    description: criterion.description,
    maxScore: criterion.maxScore,
    levels: criterion.levels,
  }));
}

function clampCriterionScore(value: unknown, maxScore: number) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  const rounded = Math.round(parsed * 10) / 10;
  if (rounded < 0 || rounded > maxScore) {
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

function validateOpenAiScoringResult(raw: unknown): OpenAiReportScoringResult {
  if (!raw || typeof raw !== "object") {
    throw new Error("OpenAI did not return a valid Round 2 scoring object.");
  }

  const criteriaRaw = (raw as { criteria?: unknown }).criteria;
  if (!Array.isArray(criteriaRaw)) {
    throw new Error("OpenAI did not return the Round 2 rubric score list.");
  }

  const rubricById = new Map(ROUND2_REPORT_RUBRIC.map((criterion) => [criterion.id, criterion]));
  const seenCriterionIds = new Set<string>();
  const criteria = criteriaRaw.map((entry) => {
    const criterionId = String((entry as { criterionId?: unknown }).criterionId ?? "");
    const criterion = rubricById.get(criterionId);
    if (!criterion) {
      throw new Error("OpenAI returned a score for an unknown Round 2 rubric criterion.");
    }

    if (seenCriterionIds.has(criterionId)) {
      throw new Error(`OpenAI returned duplicate scores for rubric criterion ${criterionId}.`);
    }
    seenCriterionIds.add(criterionId);

    const score = clampCriterionScore((entry as { score?: unknown }).score, criterion.maxScore);
    const rationale = String((entry as { rationale?: unknown }).rationale ?? "").trim();

    if (score == null) {
      throw new Error(`OpenAI returned an invalid score for rubric criterion ${criterion.label.en}.`);
    }

    if (rationale.length < 16) {
      throw new Error(`OpenAI returned a rationale that is too short for rubric criterion ${criterion.label.en}.`);
    }

    return {
      criterionId,
      score,
      rationale: rationale.slice(0, 900),
    };
  });

  if (criteria.length !== ROUND2_REPORT_RUBRIC.length) {
    throw new Error("OpenAI did not return scores for every Round 2 rubric criterion.");
  }

  const comment = String((raw as { comment?: unknown }).comment ?? "").trim();
  if (comment.length < 1200) {
    throw new Error("OpenAI returned a Round 2 comment that is too short.");
  }

  return {
    criteria,
    comment: comment.slice(0, 12000),
  };
}

async function scoreReportWithOpenAi({
  model,
  submission,
  reportBuffer,
}: {
  model: string;
  submission: Round2LatestSubmission;
  reportBuffer: Buffer;
}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured on the server.");
  }

  if (reportBuffer.byteLength > MAX_REPORT_BYTES) {
    throw new Error("The report PDF is too large for GPT scoring. Keep the report under 10MB.");
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
            "Bạn là trợ lý chấm báo cáo Vòng 2 cho cuộc thi Attacker 2026.",
            "Hãy đọc file PDF báo cáo, chấm theo rubric được cung cấp, và trả về JSON đúng schema.",
            "Điểm từng tiêu chí phải nằm trong giới hạn tối đa của chính tiêu chí đó, cho phép một chữ số thập phân.",
            "Nhận xét phải bằng tiếng Việt, cụ thể, chuyên nghiệp, tránh văn phong chung chung.",
            "Không phóng đại. Nếu báo cáo thiếu dữ liệu, nguyên mẫu, dẫn chứng hoặc kế hoạch triển khai, hãy trừ điểm rõ ràng.",
            "Khuyến khích đội có sản phẩm, prototype, MVP, pilot, demo, đường link sản phẩm, người dùng thử hoặc bằng chứng triển khai thực tế.",
            "Tuy nhiên, chỉ cộng điểm cho sản phẩm khi báo cáo có bằng chứng đủ rõ; không cộng chỉ vì đội tự nói đã có sản phẩm.",
            "Áp dụng chuẩn chấm nghiêm hơn khoảng 30% so với hiện tại: điểm mặc định phải thận trọng, không rộng tay.",
            "Điểm cao chỉ dành cho báo cáo có bằng chứng cụ thể về vấn đề, thị trường, giải pháp, mô hình triển khai, kỹ thuật, rủi ro và tác động.",
            "Báo cáo mô tả ý tưởng tốt nhưng thiếu kiểm chứng, prototype, dữ liệu hoặc kế hoạch triển khai rõ chỉ nên ở mức trung bình theo từng tiêu chí.",
            "Khi phân vân giữa hai mức điểm, chọn mức thấp hơn nếu bằng chứng trong báo cáo chưa đủ mạnh; không ép điểm thấp nếu báo cáo thật sự xuất sắc.",
          ].join(" "),
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: JSON.stringify({
                task:
                  "Chấm báo cáo Vòng 2 mới nhất của đội theo rubric. Tổng điểm không cần trả về vì hệ thống tự cộng từ từng tiêu chí.",
                team: {
                  name: submission.team.name,
                  tag: submission.team.tag,
                  track: submission.team.track,
                  bio: submission.team.bio,
                },
                submission: {
                  title: submission.title,
                  summary: submission.summary,
                  version: submission.version,
                  submittedAt: submission.submittedAt.toISOString(),
                  fileName: submission.resourceLabel,
                },
                reportTemplateGuide: ROUND2_REPORT_TEMPLATE_GUIDE,
                rubric: createRubricForPrompt(ROUND2_REPORT_RUBRIC),
                scoringGuidance: [
                  "Chấm từng tiêu chí độc lập theo nội dung thực sự có trong báo cáo.",
                  "Dùng thang điểm khó: chỉ cho từ 80% điểm tối đa của một tiêu chí trở lên khi tiêu chí đó thật sự xuất sắc và có bằng chứng rõ.",
                  "Nếu nội dung chỉ là tuyên bố chung, văn phong marketing hoặc kế hoạch chưa được kiểm chứng, không cho quá 60% điểm tối đa của tiêu chí đó.",
                  "Điểm thưởng tối đa 5 điểm chỉ dùng khi có lý do rõ ràng như prototype/MVP/pilot/demo, kiểm chứng người dùng, dữ liệu thị trường tốt, sản phẩm có link hoặc bằng chứng triển khai.",
                  "Điểm thưởng phải hiếm; nếu không có bằng chứng triển khai hoặc kiểm chứng thật, điểm thưởng nên bằng 0.",
                  "Comment phải gồm các phần: Tổng quan, Điểm mạnh, Điểm yếu/Rủi ro, Cơ hội, Thách thức, Gợi ý cải thiện, và Nhận xét theo rubric.",
                  "Trong phần Nhận xét theo rubric, nhắc ngắn từng tiêu chí và lý do điểm.",
                  "Nếu báo cáo có sản phẩm hoặc demo đáng tin cậy, hãy nêu rõ sản phẩm đó ảnh hưởng thế nào đến điểm khả thi, công nghệ và điểm thưởng.",
                  "Nếu không thấy bằng chứng sản phẩm, hãy nói rõ là chưa thấy bằng chứng sản phẩm trong báo cáo.",
                ],
              }),
            },
            {
              type: "input_file",
              filename: submission.resourceLabel || "round-2-report.pdf",
              file_data: `${PDF_DATA_URL_PREFIX}${reportBuffer.toString("base64")}`,
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "round2_report_scoring",
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
                    criterionId: {
                      type: "string",
                      enum: ROUND2_REPORT_RUBRIC.map((criterion) => criterion.id),
                    },
                    score: {
                      type: "number",
                      minimum: 0,
                      maximum: ROUND2_REPORT_FINAL_MAX_SCORE,
                      multipleOf: 0.1,
                    },
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
        : "OpenAI Round 2 scoring request failed.";
    throw new Error(errorMessage);
  }

  const responseText = extractResponseText(payload);
  if (!responseText) {
    throw new Error("OpenAI returned an empty Round 2 scoring response.");
  }

  return validateOpenAiScoringResult(JSON.parse(responseText));
}

async function readLatestRound2Submissions() {
  const { closed, deadlineAt } = await readRound2SubmissionLockState();
  if (!closed) {
    return {
      closed,
      deadlineAt,
      submissions: [] as Round2LatestSubmission[],
    };
  }

  await ensureRound2JudgeAssignments(prisma);

  const submissions = await prisma.teamSubmission.findMany({
    where: {
      round: SubmissionRound.ROUND_2,
      ...(deadlineAt ? { submittedAt: { lte: deadlineAt } } : {}),
    },
    orderBy: [{ submittedAt: "desc" }, { version: "desc" }],
    include: {
      team: {
        select: {
          id: true,
          name: true,
          tag: true,
          bio: true,
          track: true,
        },
      },
      submittedByUser: {
        select: {
          name: true,
          email: true,
        },
      },
      judgeReviews: {
        include: {
          judgeUser: {
            select: {
              id: true,
              role: true,
            },
          },
        },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      },
      aiReportReview: true,
    },
  });

  const latestByTeam = new Map<string, Round2LatestSubmission>();
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

  return {
    closed,
    deadlineAt,
    submissions: Array.from(latestByTeam.values()),
  };
}

function isEligibleSubmission(
  submission: Round2LatestSubmission,
  mode: Round2AiReportScoringJobMode,
) {
  if (hasHumanScoredReview(submission.judgeReviews)) {
    return false;
  }

  if (mode === Round2AiReportScoringJobMode.RETRY_FAILED) {
    return submission.aiReportReview?.status === Round2AiReportScoringStatus.FAILED;
  }

  return !submission.aiReportReview;
}

async function countEligibleSubmissions(mode: Round2AiReportScoringJobMode) {
  const { submissions } = await readLatestRound2Submissions();
  return submissions.filter((submission) => isEligibleSubmission(submission, mode)).length;
}

async function findNextCandidate(mode: Round2AiReportScoringJobMode) {
  const { submissions } = await readLatestRound2Submissions();
  return submissions
    .filter((submission) => isEligibleSubmission(submission, mode))
    .sort((left, right) => right.submittedAt.getTime() - left.submittedAt.getTime())[0];
}

async function completeJobIfNoCandidates(jobId: string, mode: Round2AiReportScoringJobMode) {
  const remaining = await countEligibleSubmissions(mode);
  if (remaining > 0) {
    return false;
  }

  await prisma.round2AiReportScoringJob.update({
    where: { id: jobId },
    data: {
      status: Round2AiReportScoringJobStatus.COMPLETED,
      completedAt: new Date(),
    },
  });

  return true;
}

export async function readRound2AiReportScoringOverview(): Promise<Round2AiReportScoringOverview> {
  const [{ closed: round2Closed, deadlineAt, submissions }, activeJob] = await Promise.all([
    readLatestRound2Submissions(),
    prisma.round2AiReportScoringJob.findFirst({
      where: {
        status: {
          in: [Round2AiReportScoringJobStatus.PENDING, Round2AiReportScoringJobStatus.RUNNING],
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const humanScored = submissions.filter((submission) => hasHumanScoredReview(submission.judgeReviews)).length;
  const gptScored = submissions.filter(
    (submission) =>
      !hasHumanScoredReview(submission.judgeReviews) &&
      submission.aiReportReview?.status === Round2AiReportScoringStatus.SCORED,
  ).length;
  const failed = submissions.filter(
    (submission) =>
      !hasHumanScoredReview(submission.judgeReviews) &&
      submission.aiReportReview?.status === Round2AiReportScoringStatus.FAILED,
  ).length;
  const needsGptScore = round2Closed
    ? submissions.filter((submission) => isEligibleSubmission(submission, Round2AiReportScoringJobMode.RUN_ALL)).length
    : 0;
  const denominator = Math.max(0, submissions.length - humanScored);
  const gptScoringPercent = denominator > 0 ? Math.round((gptScored / denominator) * 1000) / 10 : 100;

  return {
    round2Closed,
    deadlineAt: deadlineAt?.toISOString(),
    activeJob: activeJob ? serializeJob(activeJob) : null,
    totals: {
      latestReports: submissions.length,
      humanScored,
      gptScored,
      failed,
      needsGptScore,
      gptScoringPercent,
    },
  };
}

export async function createRound2AiReportScoringJob(
  mode: Round2AiReportScoringMode,
  createdByUserId: string,
): Promise<ServiceResult<{ job: Round2AiReportScoringJobSnapshot; overview: Round2AiReportScoringOverview }>> {
  const { closed } = await readRound2SubmissionLockState();
  if (!closed) {
    return fail(409, "Round 2 GPT report scoring opens only after the Round 2 submission deadline.");
  }

  const activeJob = await prisma.round2AiReportScoringJob.findFirst({
    where: {
      status: {
        in: [Round2AiReportScoringJobStatus.PENDING, Round2AiReportScoringJobStatus.RUNNING],
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (activeJob) {
    return ok({
      job: serializeJob(activeJob),
      overview: await readRound2AiReportScoringOverview(),
    });
  }

  const normalizedMode = normalizeMode(mode);
  const model = process.env.ROUND2_OPENAI_MODEL?.trim() || DEFAULT_OPENAI_MODEL;
  const totalEligible = await countEligibleSubmissions(normalizedMode);
  const job = await prisma.round2AiReportScoringJob.create({
    data: {
      mode: normalizedMode,
      status: totalEligible > 0 ? Round2AiReportScoringJobStatus.PENDING : Round2AiReportScoringJobStatus.COMPLETED,
      model,
      totalEligible,
      createdByUserId,
      completedAt: totalEligible > 0 ? null : new Date(),
    },
  });

  return ok(
    {
      job: serializeJob(job),
      overview: await readRound2AiReportScoringOverview(),
    },
    201,
  );
}

export async function processNextRound2AiReportScoringJobItem(
  jobId: string,
): Promise<ServiceResult<{ job: Round2AiReportScoringJobSnapshot; overview: Round2AiReportScoringOverview }>> {
  const job = await prisma.round2AiReportScoringJob.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    return fail(404, "Round 2 GPT scoring job not found.");
  }

  if (
    job.status === Round2AiReportScoringJobStatus.COMPLETED ||
    job.status === Round2AiReportScoringJobStatus.FAILED
  ) {
    return ok({
      job: serializeJob(job),
      overview: await readRound2AiReportScoringOverview(),
    });
  }

  const { closed } = await readRound2SubmissionLockState();
  if (!closed) {
    const failedJob = await prisma.round2AiReportScoringJob.update({
      where: { id: job.id },
      data: {
        status: Round2AiReportScoringJobStatus.FAILED,
        lastError: "Round 2 submission deadline is still open.",
        completedAt: new Date(),
      },
    });
    return fail(409, serializeJob(failedJob).lastError ?? "Round 2 submission deadline is still open.");
  }

  if (!process.env.OPENAI_API_KEY) {
    const failedJob = await prisma.round2AiReportScoringJob.update({
      where: { id: job.id },
      data: {
        status: Round2AiReportScoringJobStatus.FAILED,
        lastError: "OPENAI_API_KEY is not configured on the server.",
        completedAt: new Date(),
      },
    });
    return fail(409, serializeJob(failedJob).lastError ?? "OpenAI API key is missing.");
  }

  await prisma.round2AiReportScoringJob.update({
    where: { id: job.id },
    data: {
      status: Round2AiReportScoringJobStatus.RUNNING,
      startedAt: job.startedAt ?? new Date(),
    },
  });

  const candidate = await findNextCandidate(job.mode);
  if (!candidate) {
    await completeJobIfNoCandidates(job.id, job.mode);
    const completedJob = await prisma.round2AiReportScoringJob.findUniqueOrThrow({ where: { id: job.id } });
    return ok({
      job: serializeJob(completedJob),
      overview: await readRound2AiReportScoringOverview(),
    });
  }

  const assignedJudgeReviews = candidate.judgeReviews
    .filter((review) => review.judgeUser.role === UserRole.JUDGE)
    .slice(0, 2);

  await prisma.round2AiReportReview.upsert({
    where: { submissionId: candidate.id },
    create: {
      submissionId: candidate.id,
      model: job.model,
      status: Round2AiReportScoringStatus.SCORING,
    },
    update: {
      model: job.model,
      status: Round2AiReportScoringStatus.SCORING,
      error: null,
    },
  });

  try {
    if (assignedJudgeReviews.length < 2) {
      throw new Error("This latest Round 2 report does not have two assigned judge review records.");
    }

    if (
      candidate.resourceSource !== TeamSubmissionResourceSource.UPLOAD ||
      !candidate.resourceStorageKey ||
      !candidate.resourceLabel.toLowerCase().endsWith(".pdf")
    ) {
      throw new Error("Round 2 GPT scoring requires the latest report to be an uploaded PDF file.");
    }

    const reportBuffer = await readTeamSubmissionFile(candidate.resourceStorageKey);
    const result = await scoreReportWithOpenAi({
      model: job.model,
      submission: candidate,
      reportBuffer,
    });
    const rubricScores = Object.fromEntries(result.criteria.map((criterion) => [criterion.criterionId, criterion.score]));
    const rawScore = result.criteria.reduce((total, criterion) => total + criterion.score, 0);
    const totalScore = Math.min(ROUND2_REPORT_FINAL_MAX_SCORE, Math.round(rawScore * 10) / 10);
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
                select: {
                  role: true,
                },
              },
            },
          },
        },
      });

      if (!lockedSubmission) {
        throw new Error("Round 2 report disappeared before GPT score could be saved.");
      }

      if (hasHumanScoredReview(lockedSubmission.judgeReviews)) {
        await tx.round2AiReportReview.update({
          where: { submissionId: candidate.id },
          data: {
            status: Round2AiReportScoringStatus.SKIPPED_HUMAN,
            humanOverriddenAt: scoredAt,
            error: null,
          },
        });
        await tx.round2AiReportScoringJob.update({
          where: { id: job.id },
          data: {
            processedCount: { increment: 1 },
            skippedHumanCount: { increment: 1 },
          },
        });
        return;
      }

      const encodedNote = encodeTeamReviewNote(detailedComment, rubricScores);
      for (const review of assignedJudgeReviews) {
        await tx.teamSubmissionJudgeReview.update({
          where: {
            judgeUserId_submissionId: {
              judgeUserId: review.judgeUserId,
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
      }

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

      await tx.round2AiReportScoringJob.update({
        where: { id: job.id },
        data: {
          processedCount: { increment: 1 },
          scoredCount: { increment: 1 },
        },
      });
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected Round 2 GPT scoring error.";
    await prisma.$transaction([
      prisma.round2AiReportReview.update({
        where: { submissionId: candidate.id },
        data: {
          status: Round2AiReportScoringStatus.FAILED,
          error: message,
        },
      }),
      prisma.round2AiReportScoringJob.update({
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
  const updatedJob = await prisma.round2AiReportScoringJob.findUniqueOrThrow({ where: { id: job.id } });

  return ok({
    job: serializeJob(updatedJob),
    overview: await readRound2AiReportScoringOverview(),
  });
}
