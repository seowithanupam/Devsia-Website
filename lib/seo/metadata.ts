import type { Metadata } from "next";
import { siteSettings } from "@/lib/content/site";
import { robotsFor } from "@/lib/cms/seo";
import type { SeoFields } from "@/lib/cms/types";

/**
 * Builds page metadata: title, description, canonical and Open Graph.
 * `path` is the route, e.g. "/properties". metadataBase (set in the root layout) turns it into an absolute URL.
 * `seo` holds the fields an editor saved in /admin/seo (or on a post). Each saved field replaces the built-in
 * wording; anything left blank keeps the built-in value, so the site looks the same until someone edits it.
 */
export function buildMetadata({
  title,
  description,
  path,
  image,
  noIndex = false,
  type = "website",
  seo,
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
  noIndex?: boolean;
  type?: "website" | "article";
  seo?: SeoFields | null;
}): Metadata {
  const finalTitle = seo?.title || title;
  const finalDescription = seo?.description || description;
  const canonical = seo?.canonical || path;
  const ogImage = seo?.ogImage || image;
  const robots = robotsFor({ ...seo, noIndex: noIndex || seo?.noIndex });

  return {
    title: finalTitle,
    description: finalDescription,
    alternates: { canonical },
    robots: robots ?? undefined,
    openGraph: {
      title: seo?.ogTitle || finalTitle,
      description: seo?.ogDescription || finalDescription,
      url: canonical,
      siteName: siteSettings.brand,
      type,
      locale: "en_IN",
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: { card: ogImage ? "summary_large_image" : "summary", title: seo?.ogTitle || finalTitle, description: seo?.ogDescription || finalDescription },
  };
}
