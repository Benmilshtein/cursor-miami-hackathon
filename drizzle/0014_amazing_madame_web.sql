CREATE TYPE "public"."team_preference" AS ENUM('auto_match', 'self_form');--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "experience_level" integer;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "match_number" integer;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "built_app" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "vibe_code" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "team_preference" "team_preference";