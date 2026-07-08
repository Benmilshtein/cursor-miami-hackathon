CREATE TYPE "public"."screening_phase" AS ENUM('registration', 'screening_active', 'screening_completed');--> statement-breakpoint
CREATE TABLE "site_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
