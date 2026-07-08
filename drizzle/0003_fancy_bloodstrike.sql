CREATE TYPE "public"."screening_status" AS ENUM('draft', 'submitted', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "screening_answer" (
	"user_id" text NOT NULL,
	"question_id" integer NOT NULL,
	"selected_index" smallint NOT NULL,
	"is_correct" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "screening_answer_user_id_question_id_pk" PRIMARY KEY("user_id","question_id")
);
--> statement-breakpoint
CREATE TABLE "screening_question" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "screening_question_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"title" text NOT NULL,
	"description" text,
	"options" jsonb NOT NULL,
	"correct_index" smallint NOT NULL,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "team" ADD COLUMN "screening_status" "screening_status" DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE "team" ADD COLUMN "screening_video_url" text;--> statement-breakpoint
ALTER TABLE "team" ADD COLUMN "screening_video_storage_path" text;--> statement-breakpoint
ALTER TABLE "team" ADD COLUMN "screening_submitted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "team" ADD COLUMN "screening_rejected_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "team" ADD COLUMN "screening_rejected_reason" text;--> statement-breakpoint
ALTER TABLE "team" ADD COLUMN "screening_approved_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "team" ADD COLUMN "screening_approved_by_user_id" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "onboarding_completed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "screening_answer" ADD CONSTRAINT "screening_answer_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "screening_answer" ADD CONSTRAINT "screening_answer_question_id_screening_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."screening_question"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "screening_answer_question_idx" ON "screening_answer" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "screening_question_sort_order_idx" ON "screening_question" USING btree ("sort_order");--> statement-breakpoint
ALTER TABLE "team" ADD CONSTRAINT "team_screening_approved_by_user_id_user_id_fk" FOREIGN KEY ("screening_approved_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "team_screening_status_idx" ON "team" USING btree ("screening_status");