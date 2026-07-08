import type { Metadata } from "next";
import { getSiteUrl, siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Register",
  description: `Sign up for ${siteConfig.name} — join the AI hackathon, form a team, and complete screening.`,
  alternates: { canonical: `${getSiteUrl()}/register` },
  openGraph: {
    title: `Register — ${siteConfig.name}`,
    description: "Join the 4-hour AI agent speedrun.",
    url: `${getSiteUrl()}/register`,
  },
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
