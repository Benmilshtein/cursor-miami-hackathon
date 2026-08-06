ALTER TABLE "project" ADD COLUMN IF NOT EXISTS "prd_url" text;
ALTER TABLE "project" ADD COLUMN IF NOT EXISTS "prd_submitted_at" timestamp with time zone;
