-- CreateTable
CREATE TABLE "public"."Round2TeamJudgeAssignment" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "judgeUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Round2TeamJudgeAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Round2TeamJudgeAssignment_teamId_judgeUserId_key" ON "public"."Round2TeamJudgeAssignment"("teamId", "judgeUserId");

-- CreateIndex
CREATE INDEX "Round2TeamJudgeAssignment_judgeUserId_idx" ON "public"."Round2TeamJudgeAssignment"("judgeUserId");

-- AddForeignKey
ALTER TABLE "public"."Round2TeamJudgeAssignment" ADD CONSTRAINT "Round2TeamJudgeAssignment_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Round2TeamJudgeAssignment" ADD CONSTRAINT "Round2TeamJudgeAssignment_judgeUserId_fkey" FOREIGN KEY ("judgeUserId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
