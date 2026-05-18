-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('STUDENT', 'JUDGE', 'MODERATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."MessageConversationKind" AS ENUM ('DIRECT', 'ORGANIZER');

-- CreateEnum
CREATE TYPE "public"."CompetitionStage" AS ENUM ('ROUND_1', 'ROUND_2', 'ROUND_3');

-- CreateEnum
CREATE TYPE "public"."SubmissionRound" AS ENUM ('ROUND_2', 'ROUND_3');

-- CreateEnum
CREATE TYPE "public"."TeamRound1LockStatus" AS ENUM ('OPEN', 'PENDING', 'LOCKED', 'DECLINED');

-- CreateEnum
CREATE TYPE "public"."TeamFinalOutcome" AS ENUM ('CHAMPION', 'RUNNER_UP', 'THIRD_PLACE', 'FOURTH_PLACE', 'EMERGING_TEAM');

-- CreateEnum
CREATE TYPE "public"."TeamInvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."LeadershipTransferStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."Round1TeamLockRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."Round1TestBankType" AS ENUM ('OBJECTIVE', 'ESSAY');

-- CreateEnum
CREATE TYPE "public"."Round1QuestionDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "public"."Round1QuestionType" AS ENUM ('TRUE_FALSE', 'SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'PAIRING', 'ESSAY');

-- CreateEnum
CREATE TYPE "public"."Round1BankStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."Round1AttemptStatus" AS ENUM ('IN_PROGRESS');

-- CreateEnum
CREATE TYPE "public"."TeamSubmissionResourceSource" AS ENUM ('EXTERNAL', 'UPLOAD');

-- CreateEnum
CREATE TYPE "public"."UserActionTokenType" AS ENUM ('VERIFY_EMAIL', 'RESET_PASSWORD');

-- CreateEnum
CREATE TYPE "public"."ForumThreadCategory" AS ENUM ('LOOKING_FOR_TEAM', 'TEAM_LOOKING_FOR_MEMBERS', 'GENERAL_DISCUSSION');

-- CreateEnum
CREATE TYPE "public"."ForumThreadStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "loginId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerifiedAt" TIMESTAMP(3),
    "passwordHash" TEXT,
    "name" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL DEFAULT 'STUDENT',
    "studentId" TEXT,
    "phoneNumber" TEXT,
    "university" TEXT NOT NULL DEFAULT '',
    "major" TEXT NOT NULL DEFAULT '',
    "classYear" TEXT NOT NULL DEFAULT '',
    "bio" TEXT NOT NULL DEFAULT '',
    "avatarTone" TEXT NOT NULL DEFAULT 'from-sky-500 via-cyan-400 to-emerald-400',
    "avatarImageSrc" TEXT,
    "judgeProfileId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserActionToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "type" "public"."UserActionTokenType" NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserActionToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "leaderId" TEXT NOT NULL,
    "stage" "public"."CompetitionStage" NOT NULL DEFAULT 'ROUND_1',
    "finalOutcome" "public"."TeamFinalOutcome",
    "round1LockStatus" "public"."TeamRound1LockStatus" NOT NULL DEFAULT 'OPEN',
    "round1LockProtocolId" TEXT,
    "round1LockRequestedAt" TIMESTAMP(3),
    "round1LockedAt" TIMESTAMP(3),
    "round1LockDeclinedAt" TIMESTAMP(3),
    "round1LockDeclinedByUserId" TEXT,
    "avatarTone" TEXT NOT NULL,
    "avatarImageSrc" TEXT,
    "track" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TeamMember" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TeamInvitation" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "status" "public"."TeamInvitationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "TeamInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MessageConversation" (
    "id" TEXT NOT NULL,
    "kind" "public"."MessageConversationKind" NOT NULL DEFAULT 'DIRECT',
    "requesterId" TEXT,
    "organizerReadAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MessageParticipant" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "hiddenAt" TIMESTAMP(3),
    "showOtherEmail" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DirectMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "deletedByName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DirectMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LeadershipTransferRequest" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "status" "public"."LeadershipTransferStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "LeadershipTransferRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Round1TeamLockRequest" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "status" "public"."Round1TeamLockRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "Round1TeamLockRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Round1TestBank" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "bankType" "public"."Round1TestBankType" NOT NULL,
    "status" "public"."Round1BankStatus" NOT NULL DEFAULT 'DRAFT',
    "titleEn" TEXT NOT NULL,
    "titleVi" TEXT NOT NULL,
    "descriptionEn" TEXT NOT NULL,
    "descriptionVi" TEXT NOT NULL,
    "questionPoolSize" INTEGER NOT NULL,
    "questionsPerAttempt" INTEGER NOT NULL,
    "shuffleQuestions" BOOLEAN NOT NULL DEFAULT true,
    "shuffleOptions" BOOLEAN NOT NULL DEFAULT true,
    "durationMinutes" INTEGER NOT NULL,
    "wordLimit" INTEGER,
    "publishedAt" TIMESTAMP(3),
    "questions" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Round1TestBank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Round1ExamAttempt" (
    "id" TEXT NOT NULL,
    "bankId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "public"."Round1AttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" TIMESTAMP(3) NOT NULL,
    "deadlineAt" TIMESTAMP(3) NOT NULL,
    "currentQuestionIndex" INTEGER NOT NULL DEFAULT 0,
    "questions" TEXT NOT NULL,
    "answers" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Round1ExamAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Round1Submission" (
    "id" TEXT NOT NULL,
    "bankId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rightCount" INTEGER NOT NULL,
    "wrongCount" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "objectiveScore" INTEGER NOT NULL,
    "essayScore" INTEGER,
    "totalScore" INTEGER,
    "durationMinutes" INTEGER NOT NULL,
    "answers" TEXT,

    CONSTRAINT "Round1Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TeamSubmission" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "round" "public"."SubmissionRound" NOT NULL,
    "version" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "resourceSource" "public"."TeamSubmissionResourceSource" NOT NULL,
    "resourceLabel" TEXT NOT NULL,
    "resourceUrl" TEXT,
    "resourceStorageKey" TEXT,
    "resourceMimeType" TEXT,
    "resourceSizeBytes" INTEGER,
    "submittedByUserId" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Round1JudgeReview" (
    "id" TEXT NOT NULL,
    "judgeUserId" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "score" DOUBLE PRECISION,
    "note" TEXT NOT NULL DEFAULT '',
    "scoredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Round1JudgeReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TeamSubmissionJudgeReview" (
    "id" TEXT NOT NULL,
    "judgeUserId" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "score" DOUBLE PRECISION,
    "note" TEXT NOT NULL DEFAULT '',
    "scoredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamSubmissionJudgeReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NewsPost" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "categoryEn" TEXT NOT NULL,
    "categoryVi" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "titleVi" TEXT NOT NULL,
    "excerptEn" TEXT NOT NULL,
    "excerptVi" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "readTime" TEXT NOT NULL,
    "coverLabelEn" TEXT NOT NULL,
    "coverLabelVi" TEXT NOT NULL,
    "coverImageSrc" TEXT NOT NULL,
    "coverImageAltEn" TEXT NOT NULL,
    "coverImageAltVi" TEXT NOT NULL,
    "highlights" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tags" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ForumThread" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "category" "public"."ForumThreadCategory" NOT NULL,
    "status" "public"."ForumThreadStatus" NOT NULL DEFAULT 'OPEN',
    "university" TEXT NOT NULL,
    "preferredRoles" TEXT NOT NULL DEFAULT '[]',
    "contactNote" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "editedAt" TIMESTAMP(3),
    "editedByName" TEXT,

    CONSTRAINT "ForumThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ForumReply" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "editedAt" TIMESTAMP(3),
    "editedByName" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedByName" TEXT,

    CONSTRAINT "ForumReply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CmsEntry" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CmsEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Account" (
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("provider","providerAccountId")
);

-- CreateTable
CREATE TABLE "public"."Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("identifier","token")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_loginId_key" ON "public"."User"("loginId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_studentId_key" ON "public"."User"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "User_judgeProfileId_key" ON "public"."User"("judgeProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "UserActionToken_tokenHash_key" ON "public"."UserActionToken"("tokenHash");

-- CreateIndex
CREATE INDEX "UserActionToken_userId_type_createdAt_idx" ON "public"."UserActionToken"("userId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "UserActionToken_email_type_createdAt_idx" ON "public"."UserActionToken"("email", "type", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Team_tag_key" ON "public"."Team"("tag");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_userId_key" ON "public"."TeamMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_teamId_userId_key" ON "public"."TeamMember"("teamId", "userId");

-- CreateIndex
CREATE INDEX "MessageConversation_lastMessageAt_idx" ON "public"."MessageConversation"("lastMessageAt");

-- CreateIndex
CREATE INDEX "MessageConversation_kind_requesterId_idx" ON "public"."MessageConversation"("kind", "requesterId");

-- CreateIndex
CREATE INDEX "MessageParticipant_userId_idx" ON "public"."MessageParticipant"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MessageParticipant_conversationId_userId_key" ON "public"."MessageParticipant"("conversationId", "userId");

-- CreateIndex
CREATE INDEX "DirectMessage_conversationId_createdAt_idx" ON "public"."DirectMessage"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "DirectMessage_senderId_createdAt_idx" ON "public"."DirectMessage"("senderId", "createdAt");

-- CreateIndex
CREATE INDEX "DirectMessage_deletedAt_idx" ON "public"."DirectMessage"("deletedAt");

-- CreateIndex
CREATE INDEX "Round1TeamLockRequest_teamId_protocolId_idx" ON "public"."Round1TeamLockRequest"("teamId", "protocolId");

-- CreateIndex
CREATE UNIQUE INDEX "Round1TestBank_slug_key" ON "public"."Round1TestBank"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Round1ExamAttempt_userId_key" ON "public"."Round1ExamAttempt"("userId");

-- CreateIndex
CREATE INDEX "Round1ExamAttempt_teamId_deadlineAt_idx" ON "public"."Round1ExamAttempt"("teamId", "deadlineAt");

-- CreateIndex
CREATE INDEX "Round1ExamAttempt_deadlineAt_idx" ON "public"."Round1ExamAttempt"("deadlineAt");

-- CreateIndex
CREATE INDEX "Round1Submission_teamId_submittedAt_idx" ON "public"."Round1Submission"("teamId", "submittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Round1Submission_userId_key" ON "public"."Round1Submission"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamSubmission_teamId_round_version_key" ON "public"."TeamSubmission"("teamId", "round", "version");

-- CreateIndex
CREATE INDEX "Round1JudgeReview_judgeUserId_scoredAt_idx" ON "public"."Round1JudgeReview"("judgeUserId", "scoredAt");

-- CreateIndex
CREATE UNIQUE INDEX "Round1JudgeReview_judgeUserId_submissionId_key" ON "public"."Round1JudgeReview"("judgeUserId", "submissionId");

-- CreateIndex
CREATE INDEX "TeamSubmissionJudgeReview_judgeUserId_scoredAt_idx" ON "public"."TeamSubmissionJudgeReview"("judgeUserId", "scoredAt");

-- CreateIndex
CREATE UNIQUE INDEX "TeamSubmissionJudgeReview_judgeUserId_submissionId_key" ON "public"."TeamSubmissionJudgeReview"("judgeUserId", "submissionId");

-- CreateIndex
CREATE UNIQUE INDEX "NewsPost_slug_key" ON "public"."NewsPost"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ForumThread_slug_key" ON "public"."ForumThread"("slug");

-- CreateIndex
CREATE INDEX "ForumThread_category_status_lastActivityAt_idx" ON "public"."ForumThread"("category", "status", "lastActivityAt");

-- CreateIndex
CREATE INDEX "ForumThread_authorId_createdAt_idx" ON "public"."ForumThread"("authorId", "createdAt");

-- CreateIndex
CREATE INDEX "ForumReply_threadId_createdAt_idx" ON "public"."ForumReply"("threadId", "createdAt");

-- CreateIndex
CREATE INDEX "ForumReply_authorId_createdAt_idx" ON "public"."ForumReply"("authorId", "createdAt");

-- CreateIndex
CREATE INDEX "ForumReply_deletedAt_idx" ON "public"."ForumReply"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CmsEntry_scope_key" ON "public"."CmsEntry"("scope");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "public"."Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "public"."VerificationToken"("token");

-- AddForeignKey
ALTER TABLE "public"."UserActionToken" ADD CONSTRAINT "UserActionToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Team" ADD CONSTRAINT "Team_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Team" ADD CONSTRAINT "Team_round1LockDeclinedByUserId_fkey" FOREIGN KEY ("round1LockDeclinedByUserId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeamMember" ADD CONSTRAINT "TeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeamMember" ADD CONSTRAINT "TeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeamInvitation" ADD CONSTRAINT "TeamInvitation_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeamInvitation" ADD CONSTRAINT "TeamInvitation_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeamInvitation" ADD CONSTRAINT "TeamInvitation_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MessageParticipant" ADD CONSTRAINT "MessageParticipant_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "public"."MessageConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MessageParticipant" ADD CONSTRAINT "MessageParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DirectMessage" ADD CONSTRAINT "DirectMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "public"."MessageConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DirectMessage" ADD CONSTRAINT "DirectMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeadershipTransferRequest" ADD CONSTRAINT "LeadershipTransferRequest_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeadershipTransferRequest" ADD CONSTRAINT "LeadershipTransferRequest_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeadershipTransferRequest" ADD CONSTRAINT "LeadershipTransferRequest_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Round1TeamLockRequest" ADD CONSTRAINT "Round1TeamLockRequest_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Round1TeamLockRequest" ADD CONSTRAINT "Round1TeamLockRequest_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Round1TeamLockRequest" ADD CONSTRAINT "Round1TeamLockRequest_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Round1ExamAttempt" ADD CONSTRAINT "Round1ExamAttempt_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "public"."Round1TestBank"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Round1ExamAttempt" ADD CONSTRAINT "Round1ExamAttempt_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Round1ExamAttempt" ADD CONSTRAINT "Round1ExamAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Round1Submission" ADD CONSTRAINT "Round1Submission_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "public"."Round1TestBank"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Round1Submission" ADD CONSTRAINT "Round1Submission_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Round1Submission" ADD CONSTRAINT "Round1Submission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeamSubmission" ADD CONSTRAINT "TeamSubmission_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeamSubmission" ADD CONSTRAINT "TeamSubmission_submittedByUserId_fkey" FOREIGN KEY ("submittedByUserId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Round1JudgeReview" ADD CONSTRAINT "Round1JudgeReview_judgeUserId_fkey" FOREIGN KEY ("judgeUserId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Round1JudgeReview" ADD CONSTRAINT "Round1JudgeReview_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "public"."Round1Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeamSubmissionJudgeReview" ADD CONSTRAINT "TeamSubmissionJudgeReview_judgeUserId_fkey" FOREIGN KEY ("judgeUserId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeamSubmissionJudgeReview" ADD CONSTRAINT "TeamSubmissionJudgeReview_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "public"."TeamSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ForumThread" ADD CONSTRAINT "ForumThread_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ForumReply" ADD CONSTRAINT "ForumReply_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "public"."ForumThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ForumReply" ADD CONSTRAINT "ForumReply_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

