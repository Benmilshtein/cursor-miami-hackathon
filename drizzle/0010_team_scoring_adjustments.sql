ALTER TABLE "team" ADD COLUMN "judge_count_override" integer;--> statement-breakpoint
ALTER TABLE "team" ADD COLUMN "late_submission_penalty_points" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "team" ADD CONSTRAINT "team_judge_count_override_check" CHECK ("team"."judge_count_override" is null or ("team"."judge_count_override" >= 1 and "team"."judge_count_override" <= 100));--> statement-breakpoint
ALTER TABLE "team" ADD CONSTRAINT "team_late_penalty_range_check" CHECK ("team"."late_submission_penalty_points" >= 0 and "team"."late_submission_penalty_points" <= 100);