import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const lastModified = new Date();

  const publicPaths = [
    { path: "", changeFrequency: "weekly" as const, priority: 1 },
    { path: "/partnership", changeFrequency: "monthly" as const, priority: 0.9 },
    { path: "/ranking", changeFrequency: "daily" as const, priority: 0.85 },
    { path: "/register", changeFrequency: "monthly" as const, priority: 0.8 },
  ];

  return publicPaths.map(({ path, changeFrequency, priority }) => ({
    url: `${base}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
