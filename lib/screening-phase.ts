import { eq } from "drizzle-orm";
import { AppError } from "@/lib/api/http";
import { db } from "@/db";
import { siteSettings } from "@/db/schema/settings";

export type ScreeningPhase = "registration" | "screening_active" | "screening_completed";

const SCREENING_PHASE_KEY = "screening_phase";
const DEFAULT_PHASE: ScreeningPhase = "registration";

const VALID_PHASES = new Set<ScreeningPhase>([
  "registration",
  "screening_active",
  "screening_completed",
]);

export function isValidPhase(value: string): value is ScreeningPhase {
  return VALID_PHASES.has(value as ScreeningPhase);
}

export async function getScreeningPhase(): Promise<ScreeningPhase> {
  const [row] = await db
    .select({ value: siteSettings.value })
    .from(siteSettings)
    .where(eq(siteSettings.key, SCREENING_PHASE_KEY))
    .limit(1);

  const raw = row?.value ?? DEFAULT_PHASE;
  return isValidPhase(raw) ? raw : DEFAULT_PHASE;
}

/** Participants may only use screening APIs while the super admin has set the phase to screening_active. */
export async function requireParticipantScreeningOpen(): Promise<void> {
  const phase = await getScreeningPhase();
  if (phase !== "screening_active") {
    throw new AppError(
      403,
      "SCREENING_NOT_ACTIVE",
      "Screening is not open. Wait until organizers start the screening.",
    );
  }
}

export async function setScreeningPhase(phase: ScreeningPhase): Promise<void> {
  const existing = await db
    .select({ key: siteSettings.key })
    .from(siteSettings)
    .where(eq(siteSettings.key, SCREENING_PHASE_KEY))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(siteSettings)
      .set({ value: phase, updatedAt: new Date() })
      .where(eq(siteSettings.key, SCREENING_PHASE_KEY));
  } else {
    await db.insert(siteSettings).values({
      key: SCREENING_PHASE_KEY,
      value: phase,
    });
  }
}
