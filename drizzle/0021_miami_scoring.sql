CREATE TABLE IF NOT EXISTS "miami_score" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"judge_user_id" text NOT NULL,
	"problem_identification" integer NOT NULL,
	"product_maturity" integer NOT NULL,
	"solution_viability" integer NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "miami_score_problem_range" CHECK ("miami_score"."problem_identification" >= 0 and "miami_score"."problem_identification" <= 10),
	CONSTRAINT "miami_score_maturity_range" CHECK ("miami_score"."product_maturity" >= 0 and "miami_score"."product_maturity" <= 10),
	CONSTRAINT "miami_score_viability_range" CHECK ("miami_score"."solution_viability" >= 0 and "miami_score"."solution_viability" <= 10)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "team_disqualification" (
	"team_id" integer PRIMARY KEY NOT NULL,
	"reason" text NOT NULL,
	"disqualified_by_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "miami_score" ADD CONSTRAINT "miami_score_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "miami_score" ADD CONSTRAINT "miami_score_judge_user_id_user_id_fk" FOREIGN KEY ("judge_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_disqualification" ADD CONSTRAINT "team_disqualification_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_disqualification" ADD CONSTRAINT "team_disqualification_disqualified_by_user_id_user_id_fk" FOREIGN KEY ("disqualified_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "miami_score_team_judge_unique" ON "miami_score" USING btree ("team_id","judge_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "miami_score_team_idx" ON "miami_score" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "miami_score_judge_idx" ON "miami_score" USING btree ("judge_user_id");
