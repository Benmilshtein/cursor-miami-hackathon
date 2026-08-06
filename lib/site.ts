/**
 * Canonical site URL for metadata, sitemap, and JSON-LD.
 * Set NEXT_PUBLIC_SITE_URL in production (e.g. https://your-domain.example).
 */

/** Ensure an absolute URL has a scheme so `new URL(...)` / metadataBase never throw. */
function normalizeAbsoluteUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/$/, "");
  if (!trimmed) return trimmed;
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed.replace(/^\/\//, "")}`;
}

export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) {
    return normalizeAbsoluteUrl(explicit);
  }
  if (process.env.VERCEL_URL) {
    return normalizeAbsoluteUrl(
      `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, "")}`,
    );
  }
  return "http://localhost:3000";
}

/**
 * Event branding - edit these values to make the platform yours.
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
