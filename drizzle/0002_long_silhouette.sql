CREATE TABLE "credit_redemption_link" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_allocation_id" integer,
	"participant_allocation_id" integer,
	"short_code" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "credit_pool" ADD COLUMN "created_by_user_id" text;--> statement-breakpoint
ALTER TABLE "credit_pool" ADD COLUMN "distributed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "credit_pool" ADD COLUMN "distributed_by_user_id" text;--> statement-breakpoint
ALTER TABLE "partner" ADD COLUMN "redeem_base_url" text;--> statement-breakpoint
ALTER TABLE "credit_redemption_link" ADD CONSTRAINT "credit_redemption_link_team_allocation_id_team_credit_allocation_id_fk" FOREIGN KEY ("team_allocation_id") REFERENCES "public"."team_credit_allocation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_redemption_link" ADD CONSTRAINT "credit_redemption_link_participant_allocation_id_participant_credit_allocation_id_fk" FOREIGN KEY ("participant_allocation_id") REFERENCES "public"."participant_credit_allocation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "credit_redemption_link_short_code_unique" ON "credit_redemption_link" USING btree ("short_code");--> statement-breakpoint
CREATE INDEX "credit_redemption_link_team_alloc_idx" ON "credit_redemption_link" USING btree ("team_allocation_id");--> statement-breakpoint
CREATE INDEX "credit_redemption_link_participant_alloc_idx" ON "credit_redemption_link" USING btree ("participant_allocation_id");--> statement-breakpoint
ALTER TABLE "credit_pool" ADD CONSTRAINT "credit_pool_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_pool" ADD CONSTRAINT "credit_pool_distributed_by_user_id_user_id_fk" FOREIGN KEY ("distributed_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "credit_pool_created_by_idx" ON "credit_pool" USING btree ("created_by_user_id");