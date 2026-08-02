/**
 * Canonical site URL for metadata, sitemap, and JSON-LD.
 * Set NEXT_PUBLIC_SITE_URL in production (e.g. https://your-domain.example).
 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, "")}`;
  }
  return "http://localhost:3000";
}

/**
 * Event branding for Cursor Miami Ship Night.
 * Credit distribution and admin portal logic are intentionally untouched.
 */
export const siteConfig = {
  name: "Cursor Miami Ship Night",
  shortName: "Ship Night",
  tagline: "Show up. Build. Ship.",
  /** Primary description for metadata (English). */
  description:
    "Miami's open AI ship night for every level. No degree, no team, no idea required. Doors at 4pm; demos by 10:30. Show up, pair up, and ship something real.",
  descriptionEn:
    "Miami's open AI ship night for every level. No degree, no team, no idea required. Doors at 4pm; demos by 10:30. Show up, pair up, and ship something real.",
  locale: "en_US",
  location: "Miami",
  coOrganizer: undefined as string | undefined,
  twitterHandle: undefined as string | undefined,
} as const;
