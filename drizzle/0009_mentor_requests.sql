CREATE TYPE "public"."mentor_request_status" AS ENUM('pending', 'assigned', 'matched', 'completed', 'cancelled');--> statement-breakpoint
CREATE TABLE "mentor_request" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"status" "mentor_request_status" DEFAULT 'pending' NOT NULL,
	"assigned_mentor_id" text,
	"accepted_mentor_id" text,
	"declined_mentor_ids" text[] DEFAULT '{}' NOT NULL,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"assigned_at" timestamp with time zone,
	"matched_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "mentor_request" ADD CONSTRAINT "mentor_request_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_request" ADD CONSTRAINT "mentor_request_assigned_mentor_id_user_id_fk" FOREIGN KEY ("assigned_mentor_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_request" ADD CONSTRAINT "mentor_request_accepted_mentor_id_user_id_fk" FOREIGN KEY ("accepted_mentor_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mentor_request_team_idx" ON "mentor_request" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "mentor_request_status_idx" ON "mentor_request" USING btree ("status");--> statement-breakpoint
CREATE INDEX "mentor_request_assigned_mentor_idx" ON "mentor_request" USING btree ("assigned_mentor_id");--> statement-breakpoint
CREATE INDEX "mentor_request_accepted_mentor_idx" ON "mentor_request" USING btree ("accepted_mentor_id");