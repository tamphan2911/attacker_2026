CREATE TYPE "EmergingAiReportScoringJobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');
CREATE TYPE "EmergingAiReportScoringJobMode" AS ENUM ('RUN_ALL', 'RETRY_FAILED');

CREATE TABLE "EmergingAiReportScoringJob" (
  "id" TEXT NOT NULL,
  "mode" "EmergingAiReportScoringJobMode" NOT NULL,
  "status" "EmergingAiReportScoringJobStatus" NOT NULL DEFAULT 'PENDING',
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
  CONSTRAINT "EmergingAiReportScoringJob_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EmergingAiReportScoringJob_status_createdAt_idx" ON "EmergingAiReportScoringJob"("status", "createdAt");
