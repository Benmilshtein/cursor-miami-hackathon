CREATE TABLE "judge_score" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"judge_user_id" text NOT NULL,
	"innovation" integer DEFAULT 0 NOT NULL,
	"technical_execution" integer DEFAULT 0 NOT NULL,
	"ai_usage" integer DEFAULT 0 NOT NULL,
	"ux_ui" integer DEFAULT 0 NOT NULL,
	"business_potential" integer DEFAULT 0 NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "judge_score_innovation_range" CHECK ("judge_score"."innovation" >= 0 and "judge_score"."innovation" <= 25),
	CONSTRAINT "judge_score_technical_range" CHECK ("judge_score"."technical_execution" >= 0 and "judge_score"."technical_execution" <= 25),
	CONSTRAINT "judge_score_ai_range" CHECK ("judge_score"."ai_usage" >= 0 and "judge_score"."ai_usage" <= 20),
	CONSTRAINT "judge_score_ux_range" CHECK ("judge_score"."ux_ui" >= 0 and "judge_score"."ux_ui" <= 15),
	CONSTRAINT "judge_score_business_range" CHECK ("judge_score"."business_potential" >= 0 and "judge_score"."business_potential" <= 15)
);
--> statement-breakpoint
ALTER TABLE "judge_score" ADD CONSTRAINT "judge_score_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "judge_score" ADD CONSTRAINT "judge_score_judge_user_id_user_id_fk" FOREIGN KEY ("judge_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "judge_score_team_judge_unique" ON "judge_score" USING btree ("team_id","judge_user_id");--> statement-breakpoint
CREATE INDEX "judge_score_team_idx" ON "judge_score" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "judge_score_judge_idx" ON "judge_score" USING btree ("judge_user_id");