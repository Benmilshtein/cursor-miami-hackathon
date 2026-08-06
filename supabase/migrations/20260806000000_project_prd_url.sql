-- Platform PRD submission: public link to a PDF or Markdown file.
-- Mirrors drizzle/0020_project_prd_url.sql. Idempotent.

ALTER TABLE "project" ADD COLUMN IF NOT EXISTS "prd_url" text;
ALTER TABLE "project" ADD COLUMN IF NOT EXISTS "prd_submitted_at" timestamp with time zone;
