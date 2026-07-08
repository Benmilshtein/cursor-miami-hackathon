CREATE TYPE "public"."eval_run_scope" AS ENUM('sample_only', 'full');--> statement-breakpoint
CREATE TYPE "public"."eval_run_status" AS ENUM('queued', 'running', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."eval_task_result_status" AS ENUM('success', 'timeout', 'error', 'judge_error');--> statement-breakpoint
CREATE TYPE "public"."eval_task_visibility" AS ENUM('public', 'hidden');--> statement-breakpoint
CREATE TABLE "eval_run" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"triggered_by_user_id" text,
	"status" "eval_run_status" DEFAULT 'queued' NOT NULL,
	"scope" "eval_run_scope" NOT NULL,
	"total_score" real DEFAULT 0 NOT NULL,
	"max_score" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "eval_task" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"visibility" "eval_task_visibility" NOT NULL,
	"prompt" text NOT NULL,
	"max_score" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "eval_task_result" (
	"id" text PRIMARY KEY NOT NULL,
	"run_id" text NOT NULL,
	"task_id" text NOT NULL,
	"task_slug" text NOT NULL,
	"task_version" integer NOT NULL,
	"status" "eval_task_result_status" NOT NULL,
	"output" text,
	"deterministic_score" real DEFAULT 0 NOT NULL,
	"judge_score" real DEFAULT 0 NOT NULL,
	"total_score" real DEFAULT 0 NOT NULL,
	"max_score" integer NOT NULL,
	"sub_scores" jsonb,
	"judge_notes" text,
	"latency_ms" integer,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "agent_url" text;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "agent_api_key" text;--> statement-breakpoint
ALTER TABLE "project" ADD COLUMN "agent_model" text;--> statement-breakpoint
ALTER TABLE "eval_run" ADD CONSTRAINT "eval_run_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eval_run" ADD CONSTRAINT "eval_run_triggered_by_user_id_user_id_fk" FOREIGN KEY ("triggered_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eval_task_result" ADD CONSTRAINT "eval_task_result_run_id_eval_run_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."eval_run"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eval_task_result" ADD CONSTRAINT "eval_task_result_task_id_eval_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."eval_task"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "eval_run_team_idx" ON "eval_run" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "eval_run_status_idx" ON "eval_run" USING btree ("status");--> statement-breakpoint
CREATE INDEX "eval_run_created_at_idx" ON "eval_run" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "eval_task_slug_unique" ON "eval_task" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "eval_task_visibility_idx" ON "eval_task" USING btree ("visibility");--> statement-breakpoint
CREATE UNIQUE INDEX "eval_task_result_run_task_unique" ON "eval_task_result" USING btree ("run_id","task_id");--> statement-breakpoint
CREATE INDEX "eval_task_result_run_idx" ON "eval_task_result" USING btree ("run_id");