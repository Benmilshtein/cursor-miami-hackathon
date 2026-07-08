import type { Metadata } from "next";
import { Navigation } from "@/components/Navigation";
import { StructuredData } from "@/components/seo/StructuredData";
import { getSiteUrl, siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: `${siteConfig.name} · ${siteConfig.tagline}`,
  description: siteConfig.descriptionEn,
  alternates: { canonical: getSiteUrl() + "/" },
  openGraph: {
    url: getSiteUrl(),
    title: `${siteConfig.name} · AI Hackathon`,
    description: siteConfig.descriptionEn,
  },
};
import { NoiseOverlay } from "@/components/ui";
import { Footer } from "@/components/Footer";
import { TrackProvider } from "@/lib/TrackContext";
import {
  SponsorsSection,
  ParticipantHero,
  TracksSection,
  TeamBuilding,
  SelectionProcess,
  HackathonSchedule,
  EvaluationCriteria,
  Requirements,
  TechStack,
} from "@/components/participant";

export default function Home() {
  return (
    <>
      <StructuredData />
      <NoiseOverlay />
      <Navigation variant="participant" />
      <main>
        <ParticipantHero />
        <SponsorsSection />
        <TracksSection />
        {/* <TeamBuilding /> */}
        {/* <SelectionProcess /> */}
        <HackathonSchedule />
        <TrackProvider>
          <EvaluationCriteria />
          <Requirements />
        </TrackProvider>
        <TechStack />
      </main>
      <Footer />
    </>
  );
}
