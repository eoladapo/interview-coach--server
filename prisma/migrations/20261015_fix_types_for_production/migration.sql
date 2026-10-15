-- AlterTable: Add missing fields to skill_assessments
ALTER TABLE "skill_assessments" ALTER COLUMN "confidence" TYPE TEXT;
ALTER TABLE "skill_assessments" ADD COLUMN IF NOT EXISTS "notes" TEXT;

-- AlterTable: Add unique constraint on skill_assessments
DO $$ BEGIN
  ALTER TABLE "skill_assessments" ADD CONSTRAINT "skill_assessments_sessionId_skillId_key" UNIQUE ("session_id", "skill_id");
EXCEPTION
  WHEN duplicate_table THEN NULL;
  WHEN duplicate_object THEN NULL;
END $$;

-- AlterTable: Add missing fields to interview_reports
ALTER TABLE "interview_reports" ADD COLUMN IF NOT EXISTS "technical_score" DOUBLE PRECISION;
ALTER TABLE "interview_reports" ADD COLUMN IF NOT EXISTS "communication_score" DOUBLE PRECISION;
ALTER TABLE "interview_reports" ADD COLUMN IF NOT EXISTS "problem_solving_score" DOUBLE PRECISION;
ALTER TABLE "interview_reports" ADD COLUMN IF NOT EXISTS "detailed_feedback" TEXT;
ALTER TABLE "interview_reports" ADD COLUMN IF NOT EXISTS "summary" TEXT;
