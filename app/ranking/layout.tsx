import type { Metadata } from "next";
import { getSiteUrl, siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Team ranking",
  description: `Public team ranking for ${siteConfig.name}: jury scores across innovation, engineering, AI, UX/UI, and business potential.`,
  alternates: { canonical: `${getSiteUrl()}/ranking` },
  openGraph: {
    title: `Team ranking · ${siteConfig.name}`,
    description: "Results and scores from the AI hackathon.",
    url: `${getSiteUrl()}/ranking`,
  },
};

export default function RankingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
