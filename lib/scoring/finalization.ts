import { eq } from "drizzle-orm";
import { db } from "@/db";
import { siteSettings } from "@/db/schema/settings";

const RANKING_FINALIZED_KEY = "ranking_finalized";

export async function isRankingFinalized(): Promise<boolean> {
  const [row] = await db
    .select({ value: siteSettings.value })
    .from(siteSettings)
    .where(eq(siteSettings.key, RANKING_FINALIZED_KEY))
    .limit(1);
  return row?.value === "true";
}

export async function setRankingFinalized(finalized: boolean): Promise<void> {
  const value = finalized ? "true" : "false";
  const existing = await db
    .select({ key: siteSettings.key })
    .from(siteSettings)
    .where(eq(siteSettings.key, RANKING_FINALIZED_KEY))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(siteSettings)
      .set({ value, updatedAt: new Date() })
      .where(eq(siteSettings.key, RANKING_FINALIZED_KEY));
  } else {
    await db.insert(siteSettings).values({
      key: RANKING_FINALIZED_KEY,
      value,
    });
  }
}
