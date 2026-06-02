CREATE TYPE "Round1JudgeReviewSource" AS ENUM ('AI', 'HUMAN');
CREATE TYPE "Round1AiEssayScoringStatus" AS ENUM ('NOT_STARTED', 'SCORING', 'SCORED', 'FAILED', 'SKIPPED_HUMAN');
CREATE TYPE "Round1AiEssayScoringJobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');
CREATE TYPE "Round1AiEssayScoringJobMode" AS ENUM ('RUN_ALL', 'RETRY_FAILED');

ALTER TABLE "Round1Submission"
  ALTER COLUMN "score" TYPE DOUBLE PRECISION USING "score"::DOUBLE PRECISION,
  ALTER COLUMN "essayScore" TYPE DOUBLE PRECISION USING "essayScore"::DOUBLE PRECISION,
  ALTER COLUMN "totalScore" TYPE DOUBLE PRECISION USING "totalScore"::DOUBLE PRECISION;

ALTER TABLE "Round1JudgeReview"
  ADD COLUMN "source" "Round1JudgeReviewSource" NOT NULL DEFAULT 'HUMAN';

CREATE TABLE "Round1AiEssayReview" (
  "id" TEXT NOT NULL,
  "submissionId" TEXT NOT NULL,
  "judgeUserId" TEXT,
  "model" TEXT NOT NULL DEFAULT '',
  "status" "Round1AiEssayScoringStatus" NOT NULL DEFAULT 'NOT_STARTED',
  "score" DOUBLE PRECISION,
  "questionScores" TEXT NOT NULL DEFAULT '{}',
  "note" TEXT NOT NULL DEFAULT '',
  "error" TEXT,
  "scoredAt" TIMESTAMP(3),
  "humanOverriddenAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Round1AiEssayReview_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Round1AiEssayScoringJob" (
  "id" TEXT NOT NULL,
  "mode" "Round1AiEssayScoringJobMode" NOT NULL,
  "status" "Round1AiEssayScoringJobStatus" NOT NULL DEFAULT 'PENDING',
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

  CONSTRAINT "Round1AiEssayScoringJob_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Round1AiEssayReview_submissionId_key" ON "Round1AiEssayReview"("submissionId");
CREATE INDEX "Round1AiEssayReview_status_updatedAt_idx" ON "Round1AiEssayReview"("status", "updatedAt");
CREATE INDEX "Round1AiEssayScoringJob_status_createdAt_idx" ON "Round1AiEssayScoringJob"("status", "createdAt");

ALTER TABLE "Round1AiEssayReview"
  ADD CONSTRAINT "Round1AiEssayReview_submissionId_fkey"
  FOREIGN KEY ("submissionId") REFERENCES "Round1Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
