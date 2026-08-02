CREATE TABLE "repo_check" (
	"team_id" integer PRIMARY KEY NOT NULL,
	"has_prd" boolean DEFAULT false NOT NULL,
	"has_cursor_rules" boolean DEFAULT false NOT NULL,
	"has_app_url" boolean DEFAULT false NOT NULL,
	"on_time" boolean DEFAULT false NOT NULL,
	"details" text,
	"checked_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "repo_check" ADD CONSTRAINT "repo_check_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
-- Match the deny-by-default RLS policy (see supabase/migrations/20260603120000):
-- RLS on, no policies. The app reads/writes via Drizzle as the service role,
-- which bypasses RLS; this only blocks the public PostgREST Data API.
ALTER TABLE "repo_check" ENABLE ROW LEVEL SECURITY;
