CREATE TYPE "public"."voting_group" AS ENUM('A', 'B');--> statement-breakpoint
CREATE TABLE "peer_vote" (
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
--> statement-breakpoint
ALTER TABLE "team" ADD COLUMN "voting_group" "voting_group";--> statement-breakpoint
ALTER TABLE "peer_vote" ADD CONSTRAINT "peer_vote_voter_user_id_user_id_fk" FOREIGN KEY ("voter_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "peer_vote" ADD CONSTRAINT "peer_vote_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "peer_vote_voter_team_unique" ON "peer_vote" USING btree ("voter_user_id","team_id");--> statement-breakpoint
CREATE INDEX "peer_vote_team_idx" ON "peer_vote" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "peer_vote_voter_round_idx" ON "peer_vote" USING btree ("voter_user_id","round");--> statement-breakpoint
CREATE INDEX "peer_vote_round_idx" ON "peer_vote" USING btree ("round");--> statement-breakpoint
CREATE INDEX "team_voting_group_idx" ON "team" USING btree ("voting_group");