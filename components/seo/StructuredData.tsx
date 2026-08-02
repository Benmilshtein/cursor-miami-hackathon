import { getSiteUrl, siteConfig } from "@/lib/site";

/** Ship Night is a single evening event — update when the date is finalized. */
const EVENT_START = "2030-06-04T20:00:00Z"; // 4:00 PM EDT
const EVENT_END = "2030-06-05T04:00:00Z"; // 12:00 AM EDT

/** Venue defaults for Cursor Miami events. */
const VENUE_NAME_EN = "The DOCK, Wynwood";
const STREET_ADDRESS_EN = "Wynwood";

/** Event JSON-LD - homepage only. */
export function StructuredData() {
  const url = getSiteUrl();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: `${siteConfig.name} · ${siteConfig.tagline}`,
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
        addressLocality: siteConfig.location,
        addressRegion: "FL",
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
