ALTER TABLE "peer_vote" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "peer_vote" CASCADE;--> statement-breakpoint
DROP INDEX "team_voting_group_idx";--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "app_url_submitted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "team" DROP COLUMN "voting_group";--> statement-breakpoint
DROP TYPE "public"."voting_group";