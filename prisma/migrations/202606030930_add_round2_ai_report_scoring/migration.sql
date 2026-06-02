CREATE TYPE "TeamSubmissionJudgeReviewSource" AS ENUM ('AI', 'HUMAN');
CREATE TYPE "Round2AiReportScoringStatus" AS ENUM ('NOT_STARTED', 'SCORING', 'SCORED', 'FAILED', 'SKIPPED_HUMAN');
CREATE TYPE "Round2AiReportScoringJobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');
CREATE TYPE "Round2AiReportScoringJobMode" AS ENUM ('RUN_ALL', 'RETRY_FAILED');

ALTER TABLE "TeamSubmissionJudgeReview"
  ADD COLUMN "source" "TeamSubmissionJudgeReviewSource" NOT NULL DEFAULT 'HUMAN';

CREATE TABLE "Round2AiReportReview" (
  "id" TEXT NOT NULL,
  "submissionId" TEXT NOT NULL,
  "model" TEXT NOT NULL DEFAULT '',
  "status" "Round2AiReportScoringStatus" NOT NULL DEFAULT 'NOT_STARTED',
  "score" DOUBLE PRECISION,
  "rubricScores" TEXT NOT NULL DEFAULT '{}',
  "comment" TEXT NOT NULL DEFAULT '',
  "error" TEXT,
  "scoredAt" TIMESTAMP(3),
  "humanOverriddenAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Round2AiReportReview_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Round2AiReportScoringJob" (
  "id" TEXT NOT NULL,
  "mode" "Round2AiReportScoringJobMode" NOT NULL,
  "status" "Round2AiReportScoringJobStatus" NOT NULL DEFAULT 'PENDING',
  "model" TEXT NOT NULL DEFAULT '',
  "totalEligible" INTEGER NOT NULL DEFAULT 0,
  "processedCount" INTEGER NOT NULL DEFAULT 0,
  "scoredCount" INTEGER NOT NULL DEFAULT 0,
  "failedCount" INTEGER NOT NULL DEFAULT 0,
  "skippedHumanCount" INTEGER NOT NULL DEFAULT 0,
  "skippedExistingCount" INTEGER NOT NULL DEFAULT 0,
  "lastError" TEXT,
  "createdByUserId" TEXT,
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Round2AiReportScoringJob_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Round2AiReportReview_submissionId_key" ON "Round2AiReportReview"("submissionId");
CREATE INDEX "Round2AiReportReview_status_updatedAt_idx" ON "Round2AiReportReview"("status", "updatedAt");
CREATE INDEX "Round2AiReportScoringJob_status_createdAt_idx" ON "Round2AiReportScoringJob"("status", "createdAt");

ALTER TABLE "Round2AiReportReview"
  ADD CONSTRAINT "Round2AiReportReview_submissionId_fkey"
  FOREIGN KEY ("submissionId") REFERENCES "TeamSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
