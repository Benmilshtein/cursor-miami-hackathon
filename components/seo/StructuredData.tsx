import { getSiteUrl, siteConfig } from "@/lib/site";

/** Hackathon dates — update when the program is finalized. */
const EVENT_START = "2030-01-01T10:00:00Z";
const EVENT_END = "2030-01-03T22:00:00Z";

/** Example venue (replace with your real location for production). */
const VENUE_NAME_EN = "Your Venue";
const STREET_ADDRESS_EN = "123 Main Street";

/** Event JSON-LD — homepage only. */
export function StructuredData() {
  const url = getSiteUrl();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.descriptionEn,
    startDate: EVENT_START,
    endDate: EVENT_END,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: {
      "@type": "Place",
      name: VENUE_NAME_EN,
      address: {
        "@type": "PostalAddress",
        streetAddress: STREET_ADDRESS_EN,
        addressLocality: "Your City",
        addressCountry: "US",
      },
    },
    organizer: { "@id": `${url}/#organization` },
    image: `${url}/opengraph-image`,
    url,
    offers: {
      "@type": "Offer",
      url: `${url}/register`,
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
