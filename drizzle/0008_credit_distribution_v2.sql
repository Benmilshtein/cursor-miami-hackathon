CREATE TABLE "credit_audit_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"credit_pool_id" integer NOT NULL,
	"actor_user_id" text NOT NULL,
	"action" text NOT NULL,
	"details" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credit_pending_link" (
	"id" serial PRIMARY KEY NOT NULL,
	"credit_pool_id" integer NOT NULL,
	"upload_batch_id" text NOT NULL,
	"target_user_id" text NOT NULL,
	"full_url" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"participant_allocation_id" integer,
	"redemption_link_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credit_upload_batch" (
	"id" text PRIMARY KEY NOT NULL,
	"credit_pool_id" integer NOT NULL,
	"uploaded_by_user_id" text NOT NULL,
	"file_name" text,
	"raw_row_count" integer NOT NULL,
	"deduped_row_count" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "credit_pool" ADD COLUMN "distribution_type" text DEFAULT 'even' NOT NULL;--> statement-breakpoint
ALTER TABLE "credit_pool" ADD COLUMN "general_credit_url" text;--> statement-breakpoint
ALTER TABLE "credit_redemption_link" ADD COLUMN "full_url" text;--> statement-breakpoint
ALTER TABLE "credit_redemption_link" ADD COLUMN "claimed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "credit_redemption_link" ADD COLUMN "revoked_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "credit_audit_log" ADD CONSTRAINT "credit_audit_log_credit_pool_id_credit_pool_id_fk" FOREIGN KEY ("credit_pool_id") REFERENCES "public"."credit_pool"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_audit_log" ADD CONSTRAINT "credit_audit_log_actor_user_id_user_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_pending_link" ADD CONSTRAINT "credit_pending_link_credit_pool_id_credit_pool_id_fk" FOREIGN KEY ("credit_pool_id") REFERENCES "public"."credit_pool"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_pending_link" ADD CONSTRAINT "credit_pending_link_upload_batch_id_credit_upload_batch_id_fk" FOREIGN KEY ("upload_batch_id") REFERENCES "public"."credit_upload_batch"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_pending_link" ADD CONSTRAINT "credit_pending_link_target_user_id_user_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_pending_link" ADD CONSTRAINT "credit_pending_link_participant_allocation_id_participant_credit_allocation_id_fk" FOREIGN KEY ("participant_allocation_id") REFERENCES "public"."participant_credit_allocation"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_pending_link" ADD CONSTRAINT "credit_pending_link_redemption_link_id_credit_redemption_link_id_fk" FOREIGN KEY ("redemption_link_id") REFERENCES "public"."credit_redemption_link"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_upload_batch" ADD CONSTRAINT "credit_upload_batch_credit_pool_id_credit_pool_id_fk" FOREIGN KEY ("credit_pool_id") REFERENCES "public"."credit_pool"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_upload_batch" ADD CONSTRAINT "credit_upload_batch_uploaded_by_user_id_user_id_fk" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "credit_audit_log_pool_idx" ON "credit_audit_log" USING btree ("credit_pool_id");--> statement-breakpoint
CREATE INDEX "credit_audit_log_created_idx" ON "credit_audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "credit_pending_link_pool_idx" ON "credit_pending_link" USING btree ("credit_pool_id");--> statement-breakpoint
CREATE INDEX "credit_pending_link_batch_idx" ON "credit_pending_link" USING btree ("upload_batch_id");--> statement-breakpoint
CREATE INDEX "credit_pending_link_status_idx" ON "credit_pending_link" USING btree ("status");--> statement-breakpoint
CREATE INDEX "credit_pending_link_target_user_idx" ON "credit_pending_link" USING btree ("target_user_id");--> statement-breakpoint
CREATE INDEX "credit_upload_batch_pool_idx" ON "credit_upload_batch" USING btree ("credit_pool_id");--> statement-breakpoint
CREATE INDEX "credit_upload_batch_created_idx" ON "credit_upload_batch" USING btree ("created_at");--> statement-breakpoint
DELETE FROM "participant_credit_allocation" AS a
  USING "participant_credit_allocation" AS b
  WHERE a.id > b.id
    AND a.credit_pool_id = b.credit_pool_id
    AND a.user_id = b.user_id;--> statement-breakpoint
CREATE UNIQUE INDEX "participant_credit_allocation_pool_user_unique" ON "participant_credit_allocation" USING btree ("credit_pool_id","user_id");