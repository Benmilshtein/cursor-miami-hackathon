import { eq, and, isNull, gt } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { staffInvite, staffMember, user } from "@/db/schema/auth";
import { AppError, parseJsonBody, toErrorResponse } from "@/lib/api/http";
import { createAdminClient } from "@/lib/supabase/admin";

type Body = {
  token: string;
  password: string;
  name: string;
  companyName?: string;
  phone?: string;
  position?: string;
  telegramUsername?: string;
};

export async function POST(request: Request) {
  try {
    const body = await parseJsonBody<Body>(request);
    const token = typeof body.token === "string" ? body.token.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const companyName =
      typeof body.companyName === "string" ? body.companyName.trim() : null;
    const phone = typeof body.phone === "string" ? body.phone.trim() : null;
    const position =
      typeof body.position === "string" ? body.position.trim() : null;
    const telegramUsername =
      typeof body.telegramUsername === "string"
        ? body.telegramUsername.trim()
        : null;

    if (!token) {
      throw new AppError(400, "MISSING_TOKEN", "Token is required.");
    }
    if (!password || password.length < 8) {
      throw new AppError(
        400,
        "INVALID_PASSWORD",
        "Password must be at least 8 characters.",
      );
    }
    if (!name) {
      throw new AppError(400, "INVALID_INPUT", "Name is required.");
    }

    const [inv] = await db
      .select()
      .from(staffInvite)
      .where(
        and(
          eq(staffInvite.token, token),
          isNull(staffInvite.acceptedAt),
          gt(staffInvite.expiresAt, new Date()),
        ),
      )
      .limit(1);

    if (!inv) {
      throw new AppError(404, "INVALID_OR_EXPIRED", "Invite link is invalid or has expired.");
    }

    const email = inv.email.toLowerCase();

    const [existingUser] = await db
      .select({ id: user.id, role: user.role })
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (existingUser && existingUser.role !== inv.role) {
      throw new AppError(
        400,
        "EMAIL_TAKEN",
        "This email is already registered with a different role.",
      );
    }

    const supabaseAdmin = createAdminClient();
    let resolvedUserId: string;

    if (existingUser) {
      // Update the Supabase auth user's password; keep the existing profile.
      resolvedUserId = existingUser.id;
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        resolvedUserId,
        { password, email_confirm: true },
      );
      if (updateError) {
        throw new AppError(400, "AUTH_UPDATE_FAILED", updateError.message);
      }
    } else {
      // Create the Supabase auth user; the on_auth_user_created trigger
      // provisions the public.user profile row (role defaults to participant).
      const { data: created, error: createError } =
        await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { name: name || email },
        });
      if (createError || !created.user) {
        throw new AppError(400, "AUTH_CREATE_FAILED", createError?.message ?? "Could not create account.");
      }
      resolvedUserId = created.user.id;
    }

    await db.transaction(async (tx) => {
      // Ensure the profile reflects the invited staff role + name.
      await tx
        .update(user)
        .set({ role: inv.role, name: name || email, updatedAt: new Date() })
        .where(eq(user.id, resolvedUserId));

      await tx
        .insert(staffMember)
        .values({
          userId: resolvedUserId,
          companyName,
          phone,
          position,
          telegramUsername,
        })
        .onConflictDoUpdate({
          target: staffMember.userId,
          set: {
            companyName,
            phone,
            position,
            telegramUsername,
            updatedAt: new Date(),
          },
        });

      await tx
        .update(staffInvite)
        .set({ acceptedAt: new Date() })
        .where(eq(staffInvite.id, inv.id));
    });

    // Return the email so the client can sign in with the password it already has.
    return NextResponse.json(
      { success: true, data: { userId: resolvedUserId, role: inv.role, email } },
      { status: 200 },
    );
  } catch (e) {
    return toErrorResponse(e);
  }
}
