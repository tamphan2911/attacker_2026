-- Round 2 judging is assigned only after the submission window closes.
-- Clear any assignment rows created by the earlier per-upload/per-version flow.
DELETE FROM "public"."TeamSubmissionJudgeReview"
WHERE "submissionId" IN (
    SELECT "id"
    FROM "public"."TeamSubmission"
    WHERE "round" = 'ROUND_2'
);

DELETE FROM "public"."Round2TeamJudgeAssignment";
