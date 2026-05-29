ALTER TYPE "public"."UserRole" ADD VALUE IF NOT EXISTS 'SUPPORTER';

ALTER TABLE "public"."User"
ADD COLUMN "supporterReferralCode" TEXT,
ADD COLUMN "referredByCode" TEXT,
ADD COLUMN "referredBySupporterId" TEXT;

CREATE UNIQUE INDEX "User_supporterReferralCode_key" ON "public"."User"("supporterReferralCode");
CREATE INDEX "User_referredBySupporterId_idx" ON "public"."User"("referredBySupporterId");
CREATE INDEX "User_referredByCode_idx" ON "public"."User"("referredByCode");

ALTER TABLE "public"."User"
ADD CONSTRAINT "User_referredBySupporterId_fkey"
FOREIGN KEY ("referredBySupporterId") REFERENCES "public"."User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
