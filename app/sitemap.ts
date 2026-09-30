import type { MetadataRoute } from "next";
import { getContentProvider } from "@/lib/content";
import { NEW_PROJECTS_LIVE } from "@/lib/config/features";
import { getIndexablePageSlugs } from "@/lib/cms/public";
import type { PageSlug } from "@/lib/cms/blocks";
import { getSiteUrl } from "@/lib/env";
import { getPropertyProvider } from "@/lib/services";
import { EMPTY_QUERY } from "@/lib/services/property-filters";

export const dynamic = "force-dynamic";

/** Static routes, then every listing and article. /wishlist is left out (private, noindex); /new-projects only when live. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl().origin;
  // Pages an editor marked "noindex" in /admin/seo are left out.
  const candidates: Array<[PageSlug, string]> = [["home", "/"], ["properties", "/properties"], ["insights", "/insights"], ["enquire", "/enquire"], ["associates", "/associates"], ["about", "/about"], ["legal", "/legal"]];
  if (NEW_PROJECTS_LIVE) candidates.push(["new-projects", "/new-projects"]);
  const allowed = new Set(await getIndexablePageSlugs(candidates.map(([slug]) => slug)));
  const paths = candidates.filter(([slug]) => allowed.has(slug)).map(([, path]) => path);

  const properties = await getPropertyProvider().getProperties({ ...EMPTY_QUERY, pageSize: 1000 });
  // Articles an editor marked "noindex" (in the article's SEO settings) are left out, like noindex pages.
  const articles = await getContentProvider().getArticles({ page: 1, pageSize: 5000 });
  const slugs = articles.items.filter((article) => !article.seo?.noIndex).map((article) => article.slug);

  return [
    ...paths.map((path) => ({ url: `${base}${path === "/" ? "" : path}` })),
    ...properties.items.map((p) => ({ url: `${base}/properties/${p.slug}` })),
    ...slugs.map((slug) => ({ url: `${base}/insights/${slug}` })),
  ];
}
