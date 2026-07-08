-- Peer-voting expo: Group A/B split + "Launch Credit" allocations.
-- Mirrors drizzle/0015_groovy_onslaught.sql for the `supabase db push` pipeline.
-- Idempotent so it is safe to push repeatedly / alongside the drizzle migration.

-- Voting group enum + nullable column on team (null = unassigned).
DO $$ BEGIN
  CREATE TYPE "public"."voting_group" AS ENUM ('A', 'B');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "team" ADD COLUMN IF NOT EXISTS "voting_group" "public"."voting_group";

CREATE INDEX IF NOT EXISTS "team_voting_group_idx" ON "team" USING btree ("voting_group");

-- Credit allocations. 3-credit-per-voter budget is enforced in the service layer
-- (it spans rows); only per-row range + round are DB checks.
CREATE TABLE IF NOT EXISTS "peer_vote" (
  "id" text PRIMARY KEY NOT NULL,
  "voter_user_id" text NOT NULL,
  "team_id" integer NOT NULL,
  "credits" integer NOT NULL,
  "round" integer NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "peer_vote_credits_range" CHECK ("peer_vote"."credits" >= 1 and "peer_vote"."credits" <= 3),
  CONSTRAINT "peer_vote_round_range" CHECK ("peer_vote"."round" = 1 or "peer_vote"."round" = 2)
);

DO $$ BEGIN
  ALTER TABLE "peer_vote" ADD CONSTRAINT "peer_vote_voter_user_id_user_id_fk"
    FOREIGN KEY ("voter_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "peer_vote" ADD CONSTRAINT "peer_vote_team_id_team_id_fk"
    FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "peer_vote_voter_team_unique" ON "peer_vote" USING btree ("voter_user_id","team_id");
CREATE INDEX IF NOT EXISTS "peer_vote_team_idx" ON "peer_vote" USING btree ("team_id");
CREATE INDEX IF NOT EXISTS "peer_vote_voter_round_idx" ON "peer_vote" USING btree ("voter_user_id","round");
CREATE INDEX IF NOT EXISTS "peer_vote_round_idx" ON "peer_vote" USING btree ("round");

-- Match the deny-by-default RLS policy (see 20260603120000): RLS on, no policies.
-- The app reads/writes peer_vote via Drizzle as the service role, which bypasses
-- RLS; this only blocks the public PostgREST Data API.
ALTER TABLE "peer_vote" ENABLE ROW LEVEL SECURITY;
