import { getSiteUrl, siteConfig } from "@/lib/site";

/** Sitewide JSON-LD (home and internal pages). */
export function SiteStructuredData() {
  const url = getSiteUrl();

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${url}/#website`,
        name: siteConfig.name,
        description: siteConfig.description,
        url,
        inLanguage: ["en-US", "de-DE", "es-ES"],
        publisher: { "@id": `${url}/#organization` },
      },
      {
        "@type": "Organization",
        "@id": `${url}/#organization`,
        name: siteConfig.name,
        url,
        description: siteConfig.description,
        location: siteConfig.location,
        ...(siteConfig.coOrganizer
          ? {
              co_organizer: {
                "@type": "Organization",
                name: siteConfig.coOrganizer,
              },
            }
          : {}),
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
