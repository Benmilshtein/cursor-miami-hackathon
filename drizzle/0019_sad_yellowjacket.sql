CREATE TABLE "pitch_score" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"judge_user_id" text NOT NULL,
	"delivery" integer DEFAULT 0 NOT NULL,
	"clarity" integer DEFAULT 0 NOT NULL,
	"impact" integer DEFAULT 0 NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pitch_score_delivery_range" CHECK ("pitch_score"."delivery" >= 0 and "pitch_score"."delivery" <= 30),
	CONSTRAINT "pitch_score_clarity_range" CHECK ("pitch_score"."clarity" >= 0 and "pitch_score"."clarity" <= 30),
	CONSTRAINT "pitch_score_impact_range" CHECK ("pitch_score"."impact" >= 0 and "pitch_score"."impact" <= 40)
);
--> statement-breakpoint
ALTER TABLE "team" ADD COLUMN "is_finalist" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "pitch_score" ADD CONSTRAINT "pitch_score_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pitch_score" ADD CONSTRAINT "pitch_score_judge_user_id_user_id_fk" FOREIGN KEY ("judge_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "pitch_score_team_judge_unique" ON "pitch_score" USING btree ("team_id","judge_user_id");--> statement-breakpoint
CREATE INDEX "pitch_score_team_idx" ON "pitch_score" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "pitch_score_judge_idx" ON "pitch_score" USING btree ("judge_user_id");--> statement-breakpoint
CREATE INDEX "team_is_finalist_idx" ON "team" USING btree ("is_finalist");--> statement-breakpoint
-- Match the deny-by-default RLS policy (see supabase/migrations/20260603120000):
-- RLS on, no policies. The app reads/writes via Drizzle as the service role,
-- which bypasses RLS; this only blocks the public PostgREST Data API.
ALTER TABLE "pitch_score" ENABLE ROW LEVEL SECURITY;
