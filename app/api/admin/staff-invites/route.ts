import { eq, and, isNull, gt, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { staffInvite } from "@/db/schema/auth";
import { AppError } from "@/lib/api/http";
import { jsonSuccess, parseJsonBody, toErrorResponse } from "@/lib/api/http";
import { requireSuperAdminUser } from "@/lib/auth/session";
import { sendEmail } from "@/lib/email/send";
import {
  generateStaffInviteToken,
  getStaffInviteExpiresAt,
} from "@/lib/staff/invite";

const baseUrl = () =>
  (process.env.NEXT_PUBLIC_APP_URL ??
  process.env.BETTER_AUTH_URL ??
  "http://localhost:3000").replace(/\/+$/, "");

export async function GET(request: Request) {
  try {
    await requireSuperAdminUser(request as import("next/server").NextRequest);

    const invites = await db
      .select()
      .from(staffInvite)
      .orderBy(desc(staffInvite.createdAt));

    return jsonSuccess({
      invites: invites.map((i) => ({
        id: i.id,
        email: i.email,
        role: i.role,
        expiresAt: i.expiresAt.toISOString(),
        acceptedAt: i.acceptedAt?.toISOString() ?? null,
        createdAt: i.createdAt.toISOString(),
      })),
    });
  } catch (e) {
    return toErrorResponse(e);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireSuperAdminUser(
      request as import("next/server").NextRequest,
    );

    const body = await parseJsonBody<{ email: string; role: "judge" | "mentor" }>(
      request,
    );
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const role =
      body.role === "judge" || body.role === "mentor" ? body.role : undefined;

    if (!email) {
      throw new AppError(400, "INVALID_INPUT", "email is required.");
    }
    if (!role) {
      throw new AppError(400, "INVALID_INPUT", "role must be 'judge' or 'mentor'.");
    }

    const token = generateStaffInviteToken();
    const expiresAt = getStaffInviteExpiresAt();

    const [inserted] = await db
      .insert(staffInvite)
      .values({
        email,
        role,
        token,
        expiresAt,
        createdByUserId: admin.id,
      })
      .returning();

    if (!inserted) {
      throw new AppError(500, "INSERT_FAILED", "Failed to create invite.");
    }

    const joinUrl = `${baseUrl()}/staff/join?token=${encodeURIComponent(token)}`;
    const roleEn = role === "judge" ? "Judge" : "Mentor";
    const roleDe = role === "judge" ? "Juror" : "Mentor";
    const roleEs = role === "judge" ? "Jurado" : "Mentor";
    const { ok, error } = await sendEmail({
      to: email,
      subject: `You're invited as a ${roleEn} – 48H`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px;">
          <p><strong>English</strong></p>
          <p>You have been invited to join 48H as a <strong>${roleEn}</strong>.</p>
          <p>Click the link below to set up your account (link expires in 7 days):</p>
          <p><a href="${joinUrl}">${joinUrl}</a></p>
          <p style="color: #666;">If you did not expect this email, you can ignore it.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p><strong>Deutsch</strong></p>
          <p>Sie wurden zu 48H als <strong>${roleDe}</strong> eingeladen.</p>
          <p>Nutzen Sie den folgenden Link, um Ihr Konto anzulegen (Link ist 7 Tage gültig):</p>
          <p><a href="${joinUrl}">${joinUrl}</a></p>
          <p style="color: #666;">Wenn Sie diese E-Mail nicht erwartet haben, können Sie sie ignorieren.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p><strong>Español</strong></p>
          <p>Has sido invitado a 48H como <strong>${roleEs}</strong>.</p>
          <p>Usa el enlace siguiente para crear tu cuenta (el enlace caduca a los 7 días):</p>
          <p><a href="${joinUrl}">${joinUrl}</a></p>
          <p style="color: #666;">Si no esperabas este correo, puedes ignorarlo.</p>
        </div>
      `,
    });

    if (!ok) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "EMAIL_FAILED", message: error ?? "Failed to send invite email." },
        },
        { status: 502 },
      );
    }

    return jsonSuccess({
      invite: {
        id: inserted.id,
        email: inserted.email,
        role: inserted.role,
        expiresAt: inserted.expiresAt.toISOString(),
        acceptedAt: null,
        createdAt: inserted.createdAt.toISOString(),
      },
    });
  } catch (e) {
    return toErrorResponse(e);
  }
}
