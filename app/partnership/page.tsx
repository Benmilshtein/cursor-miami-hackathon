import type { Metadata } from "next";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { getSiteUrl, siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Partnership & sponsorship",
  description:
    "Partner with our hackathon: reach AI builders, brand visibility, hackathon integration, and media coverage.",
  keywords: [
    "hackathon sponsor",
    "AI event partnership",
    "AI event sponsorship",
    "48H partners",
  ],
  alternates: { canonical: `${getSiteUrl()}/partnership` },
  openGraph: {
    title: `Partnership · ${siteConfig.name}`,
    description:
      "Sponsor and partner with our AI hackathon: audience reach, media, and brand presence.",
    url: `${getSiteUrl()}/partnership`,
  },
};
import {
  Hero,
  About,
  Support,
  Audience,
  Media,
  Benefits,
  JurySection,
  Package,
  BrandIntegration,
  Timeline,
} from "@/components/sections";

export default function Partnership() {
  return (
    <>
      <Navigation />
      <main>
        <Hero />
        <About />
        <Support />
        <Audience />
        <Media />
        <Benefits />
        <JurySection />
        <Package />
        <BrandIntegration />
        <Timeline />
      </main>
      <Footer />
    </>
  );
}
