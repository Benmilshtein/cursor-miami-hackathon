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
 * Event branding — edit these values to make the platform yours.
 * Everything here is placeholder template copy.
 */
export const siteConfig = {
  name: "48H Hackathon",
  shortName: "48H",
  tagline: "Build. Ship. Celebrate.",
  /** Primary description for metadata (English). */
  description:
    "A beginner-friendly hackathon for building with AI. No degree, no team, no idea required. Show up, pair up, and ship something real.",
  descriptionEn:
    "A beginner-friendly hackathon for building with AI. No degree, no team, no idea required. Show up, pair up, and ship something real.",
  locale: "en_US",
  location: "Your City",
  coOrganizer: undefined as string | undefined,
  twitterHandle: undefined as string | undefined,
} as const;
