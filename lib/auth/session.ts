import { eq } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { createClient } from "@/lib/supabase/server";
import { AppError } from "@/lib/api/http";
import { type AppUserRole } from "@/lib/teams/constants";

const configuredSuperAdmins = new Set(
  (process.env.SUPER_ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean),
);

type ProfileRow = typeof user.$inferSelect;

export type AppSessionUser = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  emailVerified: boolean;
  firstName: string | null;
  lastName: string | null;
  role: AppUserRole;
  twoFactorEnabled: boolean;
  teamId: number | null;
  isTeamLead: boolean;
  onboardingCompleted: boolean;
  teamPreference: "auto_match" | "self_form" | null;
};

function normalizeRole(role?: string | null): AppUserRole {
  switch (role) {
    case "super_admin":
    case "moderator":
    case "reviewer":
    case "judge":
    case "mentor":
      return role;
    default:
      return "participant";
  }
}

function toSessionUser(profile: ProfileRow): AppSessionUser {
  return {
    id: profile.id,
    name: profile.name ?? null,
    email: profile.email,
    image: profile.image ?? null,
    emailVerified: Boolean(profile.emailVerified),
    firstName: profile.firstName ?? null,
    lastName: profile.lastName ?? null,
    role: normalizeRole(profile.role),
    // 2FA is not used with Supabase Auth (deferred); kept for shape compatibility.
    twoFactorEnabled: false,
    teamId: typeof profile.teamId === "number" ? profile.teamId : null,
    isTeamLead: Boolean(profile.isTeamLead),
    onboardingCompleted: profile.onboardingCompletedAt != null,
    teamPreference: profile.teamPreference ?? null,
  };
}

/**
 * Promote a profile to super_admin when its email is in SUPER_ADMIN_EMAILS.
 * Mirrors the previous Better Auth behavior, now keyed off the profile row.
 */
async function syncConfiguredSuperAdmin(profile: ProfileRow): Promise<ProfileRow> {
  const normalizedEmail = profile.email.toLowerCase();
  const shouldBeSuperAdmin = configuredSuperAdmins.has(normalizedEmail);

  if (!shouldBeSuperAdmin || profile.role === "super_admin") {
    return profile;
  }

  try {
    const [updated] = await db
      .update(user)
      .set({ role: "super_admin", updatedAt: new Date() })
      .where(eq(user.id, profile.id))
      .returning();

    return updated ?? { ...profile, role: "super_admin" };
  } catch (error) {
    // Surface DB write failures (e.g. unreachable Postgres in prod) instead of
    // silently masking them with the in-memory fallback.
    console.error("syncConfiguredSuperAdmin: failed to update role", error);
    return { ...profile, role: "super_admin" };
  }
}

export async function getOptionalSessionUser(
  _request?: Request,
): Promise<AppSessionUser | null> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return null;
  }

  const [profile] = await db
    .select()
    .from(user)
    .where(eq(user.id, authUser.id))
    .limit(1);

  if (!profile) {
    // Authenticated but profile not yet provisioned (trigger lag / edge case).
    // Fall back to a minimal participant view so the request isn't a hard 401.
    return {
      id: authUser.id,
      name: (authUser.user_metadata?.name as string | undefined) ?? null,
      email: authUser.email ?? "",
      image: null,
      emailVerified: Boolean(authUser.email_confirmed_at),
      firstName: null,
      lastName: null,
      role: "participant",
      twoFactorEnabled: false,
      teamId: null,
      isTeamLead: false,
      onboardingCompleted: false,
      teamPreference: null,
    };
  }

  const synced = await syncConfiguredSuperAdmin(profile);
  return toSessionUser(synced);
}

export async function requireSessionUser(_request?: Request): Promise<AppSessionUser> {
  const sessionUser = await getOptionalSessionUser();

  if (!sessionUser) {
    throw new AppError(401, "UNAUTHORIZED", "Authentication is required.");
  }

  return sessionUser;
}

export async function requireSuperAdminUser(_request?: Request): Promise<AppSessionUser> {
  const sessionUser = await requireSessionUser();

  if (sessionUser.role !== "super_admin") {
    throw new AppError(403, "FORBIDDEN", "Super admin access is required.");
  }

  return sessionUser;
}
