import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

/**
 * Public pages can be crawled. The signed-in app and the API cannot.
 * This only asks crawlers to stay out: the app pages and the API also need a session or a token.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/board", "/analytics", "/settings", "/dashboard", "/api/"],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
