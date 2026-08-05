-- Replace peer-to-peer voting with active judging.
-- Mirrors drizzle/0017_ambiguous_blob.sql + drizzle/0018_tan_skaar.sql for the
-- `supabase db push` pipeline. Idempotent so it is safe to push repeatedly /
-- alongside the drizzle migrations.

-- 1. Drop peer voting: the crowd "Launch Credit" expo is gone, judges score
--    teams directly instead.
DROP TABLE IF EXISTS "peer_vote" CASCADE;
DROP INDEX IF EXISTS "team_voting_group_idx";
ALTER TABLE "team" DROP COLUMN IF EXISTS "voting_group";
DROP TYPE IF EXISTS "public"."voting_group";

-- 2. When a team first published a public app URL. Drives the "within the first
--    hour" half of the step-1 requirements check; later edits do not reset it.
ALTER TABLE "project" ADD COLUMN IF NOT EXISTS "app_url_submitted_at" timestamp with time zone;

-- 3. Step 1 of judging: cached result of the automated GitHub requirements
--    check (PRD + .cursorrules committed and public app URL submitted, all
--    within the first hour). A flag for judges, never a disqualification.
CREATE TABLE IF NOT EXISTS "repo_check" (
  "team_id" integer PRIMARY KEY NOT NULL,
  "has_prd" boolean DEFAULT false NOT NULL,
  "has_cursor_rules" boolean DEFAULT false NOT NULL,
  "has_app_url" boolean DEFAULT false NOT NULL,
  "on_time" boolean DEFAULT false NOT NULL,
  "details" text,
  "checked_at" timestamp with time zone DEFAULT now() NOT NULL
);

DO $$ BEGIN
  ALTER TABLE "repo_check" ADD CONSTRAINT "repo_check_team_id_team_id_fk"
    FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Match the deny-by-default RLS policy (see 20260603120000): RLS on, no
-- policies. The app reads/writes via Drizzle as the service role, which
-- bypasses RLS; this only blocks the public PostgREST Data API.
ALTER TABLE "repo_check" ENABLE ROW LEVEL SECURITY;
