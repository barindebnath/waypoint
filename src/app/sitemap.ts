import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

/**
 * The public pages only. The signed-in app (Board, Analytics, Settings) and the API are not listed.
 * No lastModified: the pages have no reliable edit date, and a wrong date misleads crawlers.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  return [
    { url: `${base}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${base}/docs`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/llms`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/signup`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
