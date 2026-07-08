-- Team-matching profile columns on public.user (collected during onboarding).
-- Mirrors drizzle/0014_amazing_madame_web.sql for the `supabase db push` pipeline.
-- Idempotent so it is safe to push repeatedly / alongside the drizzle migration.

DO $$ BEGIN
  CREATE TYPE "public"."team_preference" AS ENUM ('auto_match', 'self_form');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "experience_level" integer;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "match_number" integer;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "built_app" boolean DEFAULT false NOT NULL;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "vibe_code" boolean DEFAULT false NOT NULL;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "team_preference" "public"."team_preference";
