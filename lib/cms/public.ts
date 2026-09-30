import "server-only";
import { cache } from "react";
import type { SiteSettings } from "@/lib/content/site";
import { siteSettings } from "@/lib/content/site";
import { isDatabaseConfigured } from "@/lib/env";
import { resolveBlocks, type PageSlug, type ResolvedBlock } from "@/lib/cms/blocks";
import { DEFAULT_NAVIGATION, navigationFromRecord } from "@/lib/cms/nav";
import { getNavigationRecord, getPage, getPropertySeoOverride, getSeoTemplate, getSettingsRecord } from "@/lib/cms/repo/content";
import { resolvePropertySeo, type PropertySeoToken } from "@/lib/cms/seo";
import { settingsFromRecord } from "@/lib/cms/settings";
import type { NavigationRecord, SeoFields } from "@/lib/cms/types";
import { formatPriceLabel } from "@/lib/format";
import type { Property } from "@/lib/services/types";

/**
 * What the public pages read. Every function returns the built-in Phase 2 content when the database is not
 * configured, and also when the database is configured but unreachable (the error is logged, never shown to
 * visitors). Property data is not here: it always comes from the property provider.
 */

function logFallback(what: string, error: unknown) {
  console.error(`[cms] could not load ${what}; using built-in content:`, error instanceof Error ? error.message : "unknown error");
}

export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  if (!isDatabaseConfigured()) return siteSettings;
  try {
    return settingsFromRecord(await getSettingsRecord());
  } catch (error) {
    logFallback("settings", error);
    return siteSettings;
  }
});

export const getNavigation = cache(async (): Promise<NavigationRecord> => {
  if (!isDatabaseConfigured()) return DEFAULT_NAVIGATION;
  try {
    return navigationFromRecord(await getNavigationRecord());
  } catch (error) {
    logFallback("navigation", error);
    return DEFAULT_NAVIGATION;
  }
});

const loadPage = cache(async (slug: PageSlug) => {
  if (!isDatabaseConfigured()) return null;
  try {
    return await getPage(slug);
  } catch (error) {
    logFallback(`page ${slug}`, error);
    return null;
  }
});

/** The blocks a page should render, in order, with defaults filled in. */
export async function getPageBlocks(slug: PageSlug): Promise<ResolvedBlock[]> {
  const page = await loadPage(slug);
  return resolveBlocks(slug, page?.blocks);
}

/** SEO fields saved for a page, or null. */
export async function getPageSeo(slug: PageSlug): Promise<SeoFields | null> {
  const page = await loadPage(slug);
  return page && Object.keys(page.seo).length > 0 ? page.seo : null;
}

/** Slugs of pages that search engines may index (used by the sitemap). */
export async function getIndexablePageSlugs(candidates: PageSlug[]): Promise<PageSlug[]> {
  const out: PageSlug[] = [];
  for (const slug of candidates) {
    const seo = await getPageSeo(slug);
    if (!seo?.noIndex) out.push(slug);
  }
  return out;
}

export function propertySeoTokens(property: Property): Record<PropertySeoToken, string> {
  return {
    title: property.title,
    location: property.location,
    city: property.city,
    type: property.typeLabel,
    price: formatPriceLabel(property.priceInr),
    ref: property.referenceCode,
  };
}

/** SEO for one listing: the saved override, then the property template, then the Phase 2 wording. */
export async function getPropertySeo(property: Property): Promise<SeoFields> {
  let template = null;
  let override = null;
  if (isDatabaseConfigured()) {
    try {
      [template, override] = await Promise.all([getSeoTemplate(), getPropertySeoOverride(property.slug)]);
    } catch (error) {
      logFallback("property SEO", error);
    }
  }
  return resolvePropertySeo({ template, override: override?.seo ?? null, tokens: propertySeoTokens(property) });
}
