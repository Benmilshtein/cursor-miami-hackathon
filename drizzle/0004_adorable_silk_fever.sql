CREATE TYPE "public"."staff_role" AS ENUM('judge', 'mentor');--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'judge';--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'mentor';--> statement-breakpoint
CREATE TABLE "staff_invite" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"role" "staff_role" NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_by_user_id" text,
	"accepted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff_member" (
	"user_id" text PRIMARY KEY NOT NULL,
	"company_name" text,
	"phone" text,
	"position" text,
	"telegram_username" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "staff_invite" ADD CONSTRAINT "staff_invite_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_member" ADD CONSTRAINT "staff_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "staff_invite_token_unique" ON "staff_invite" USING btree ("token");--> statement-breakpoint
CREATE INDEX "staff_invite_email_idx" ON "staff_invite" USING btree ("email");--> statement-breakpoint
CREATE INDEX "staff_invite_expires_at_idx" ON "staff_invite" USING btree ("expires_at");