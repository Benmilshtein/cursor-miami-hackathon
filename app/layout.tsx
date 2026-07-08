import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/LanguageContext";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import { ScrollRestoration } from "@/components/ScrollRestoration";
import { SiteStructuredData } from "@/components/seo/SiteStructuredData";
import { getSiteUrl, siteConfig } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.descriptionEn,
  keywords: [
    "AI hackathon",
    "hackathon platform",
    "AI agent hackathon",
    "hackathon registration",
    "open source hackathon",
  ],
  authors: [{ name: siteConfig.name, url: siteUrl }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  formatDetection: {
    email: false,
    telephone: false,
    address: false,
  },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    alternateLocale: ["en_US"],
    url: siteUrl,
    siteName: siteConfig.name,
    title: `${siteConfig.name} — AI Hackathon`,
    description: siteConfig.descriptionEn,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} — AI Hackathon`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} — AI Hackathon`,
    description: siteConfig.descriptionEn,
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SiteStructuredData />
        <AuthProvider>
          <LanguageProvider>
            <ScrollRestoration />
            {children}
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
