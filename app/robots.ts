import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/env";

/** Public pages are crawlable; API routes, the admin panel and the dev preview are not. */
export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl().origin;
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/dev/", "/wishlist", "/admin"] }],
    sitemap: `${base}/sitemap.xml`,
  };
}
