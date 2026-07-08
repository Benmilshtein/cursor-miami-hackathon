CREATE TYPE "public"."team_status" AS ENUM('active', 'archived');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('participant', 'moderator', 'reviewer', 'super_admin');--> statement-breakpoint
CREATE TYPE "public"."team_member_role" AS ENUM('lead', 'member');--> statement-breakpoint
CREATE TABLE "two_factor" (
	"id" text PRIMARY KEY NOT NULL,
	"secret" text NOT NULL,
	"backup_codes" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_invite" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"code" text NOT NULL,
	"created_by_user_id" text,
	"expires_at" timestamp with time zone,
	"max_uses" integer,
	"used_count" integer DEFAULT 0 NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "team_invite_max_uses_check" CHECK ("team_invite"."max_uses" is null or "team_invite"."max_uses" > 0),
	CONSTRAINT "team_invite_used_count_check" CHECK ("team_invite"."used_count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "team_member" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"role" "team_member_role" DEFAULT 'member' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"left_at" timestamp with time zone,
	"removed_by_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "team" DROP CONSTRAINT "team_join_code_unique";--> statement-breakpoint
DROP INDEX "team_join_code_idx";--> statement-breakpoint
ALTER TABLE "team" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "team" ADD COLUMN "status" "team_status" DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "team" ADD COLUMN "member_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "team" ADD COLUMN "max_members" integer DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE "team" ADD COLUMN "created_by_user_id" text;--> statement-breakpoint
ALTER TABLE "team" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "role" "user_role" DEFAULT 'participant' NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "two_factor_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "two_factor" ADD CONSTRAINT "two_factor_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_invite" ADD CONSTRAINT "team_invite_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_invite" ADD CONSTRAINT "team_invite_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_removed_by_user_id_user_id_fk" FOREIGN KEY ("removed_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
WITH ranked_members AS (
	SELECT
		"u"."id" AS "user_id",
		"u"."team_id" AS "team_id",
		COALESCE("u"."created_at", now()) AS "joined_at",
		"u"."is_team_lead" AS "was_team_lead",
		ROW_NUMBER() OVER (
			PARTITION BY "u"."team_id"
			ORDER BY "u"."is_team_lead" DESC, "u"."created_at" ASC, "u"."id" ASC
		) AS "member_rank",
		BOOL_OR("u"."is_team_lead") OVER (PARTITION BY "u"."team_id") AS "team_has_explicit_lead"
	FROM "user" AS "u"
	WHERE "u"."team_id" IS NOT NULL
)
INSERT INTO "team_member" (
	"id",
	"team_id",
	"user_id",
	"role",
	"joined_at",
	"created_at",
	"updated_at"
)
SELECT
	'tm_' || md5("rm"."user_id" || ':' || "rm"."team_id"::text),
	"rm"."team_id",
	"rm"."user_id",
	CASE
		WHEN "rm"."team_has_explicit_lead" AND "rm"."was_team_lead" AND "rm"."member_rank" = 1
			THEN 'lead'::"team_member_role"
		WHEN NOT "rm"."team_has_explicit_lead" AND "rm"."member_rank" = 1
			THEN 'lead'::"team_member_role"
		ELSE 'member'::"team_member_role"
	END,
	"rm"."joined_at",
	now(),
	now()
FROM ranked_members AS "rm";--> statement-breakpoint
WITH team_stats AS (
	SELECT
		"tm"."team_id",
		COUNT(*)::integer AS "member_count",
		MAX(CASE WHEN "tm"."role" = 'lead' THEN "tm"."user_id" ELSE NULL END) AS "lead_user_id"
	FROM "team_member" AS "tm"
	WHERE "tm"."left_at" IS NULL
	GROUP BY "tm"."team_id"
)
UPDATE "team" AS "t"
SET
	"member_count" = COALESCE("ts"."member_count", 0),
	"created_by_user_id" = COALESCE("ts"."lead_user_id", "t"."created_by_user_id"),
	"status" = CASE
		WHEN COALESCE("ts"."member_count", 0) > 0 THEN 'active'::"team_status"
		ELSE 'archived'::"team_status"
	END,
	"archived_at" = CASE
		WHEN COALESCE("ts"."member_count", 0) > 0 THEN NULL
		ELSE COALESCE("t"."archived_at", now())
	END
FROM "team_stats" AS "ts"
WHERE "t"."id" = "ts"."team_id";--> statement-breakpoint
UPDATE "team"
SET
	"member_count" = 0,
	"status" = 'archived'::"team_status",
	"archived_at" = COALESCE("archived_at", now())
WHERE "id" NOT IN (
	SELECT DISTINCT "team_id"
	FROM "team_member"
	WHERE "left_at" IS NULL
);--> statement-breakpoint
INSERT INTO "team_invite" (
	"id",
	"team_id",
	"code",
	"created_by_user_id",
	"created_at",
	"updated_at"
)
SELECT
	'ti_' || md5("t"."id"::text || ':' || "t"."join_code"),
	"t"."id",
	"t"."join_code",
	"t"."created_by_user_id",
	now(),
	now()
FROM "team" AS "t"
WHERE "t"."join_code" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "two_factor_user_id_unique" ON "two_factor" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "two_factor_secret_idx" ON "two_factor" USING btree ("secret");--> statement-breakpoint
CREATE UNIQUE INDEX "team_invite_code_unique" ON "team_invite" USING btree ("code");--> statement-breakpoint
CREATE INDEX "team_invite_team_id_idx" ON "team_invite" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "team_invite_revoked_at_idx" ON "team_invite" USING btree ("revoked_at");--> statement-breakpoint
CREATE UNIQUE INDEX "team_member_user_active_unique" ON "team_member" USING btree ("user_id") WHERE "team_member"."left_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "team_member_team_lead_active_unique" ON "team_member" USING btree ("team_id") WHERE "team_member"."left_at" is null and "team_member"."role" = 'lead';--> statement-breakpoint
CREATE INDEX "team_member_team_active_idx" ON "team_member" USING btree ("team_id","left_at");--> statement-breakpoint
CREATE INDEX "team_member_user_idx" ON "team_member" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "team" ADD CONSTRAINT "team_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "team_join_code_unique" ON "team" USING btree ("join_code");--> statement-breakpoint
CREATE INDEX "team_status_idx" ON "team" USING btree ("status");--> statement-breakpoint
CREATE INDEX "team_created_by_user_id_idx" ON "team" USING btree ("created_by_user_id");--> statement-breakpoint
CREATE INDEX "user_team_id_idx" ON "user" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "user_role_idx" ON "user" USING btree ("role");--> statement-breakpoint
ALTER TABLE "team" ADD CONSTRAINT "team_member_count_range_check" CHECK ("team"."member_count" >= 0 and "team"."member_count" <= "team"."max_members");--> statement-breakpoint
ALTER TABLE "team" ADD CONSTRAINT "team_max_members_limit_check" CHECK ("team"."max_members" > 0 and "team"."max_members" <= 5);
