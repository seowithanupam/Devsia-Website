import type { FacetOption, Property, PropertyFacets, PropertyListResult, PropertyQuery } from "./types";

/** TEMPORARY page size. The original's page size is UNKNOWN (the video only shows small result sets). */
export const DEFAULT_PAGE_SIZE = 12;

export const EMPTY_QUERY: PropertyQuery = {
  locations: [],
  types: [],
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
};

type Skip = "location" | "type" | "price";

/** True when the property passes every active filter, except the one named in `skip`. */
export function matchesFilters(property: Property, query: PropertyQuery, skip?: Skip): boolean {
  if (query.slugs && !query.slugs.includes(property.slug)) return false;
  if (query.featuredOnly && !property.featured) return false;
  if (skip !== "location" && query.locations.length > 0 && !query.locations.includes(property.location)) return false;
  if (skip !== "type" && query.types.length > 0 && !query.types.includes(property.typeSlug)) return false;
  if (skip !== "price") {
    if (query.minPrice !== undefined && property.priceInr < query.minPrice) return false;
    if (query.maxPrice !== undefined && property.priceInr > query.maxPrice) return false;
  }
  return true;
}

function countBy(items: Property[], keyOf: (p: Property) => { value: string; label: string }): FacetOption[] {
  const map = new Map<string, FacetOption>();
  for (const item of items) {
    const { value, label } = keyOf(item);
    const existing = map.get(value);
    if (existing) existing.count += 1;
    else map.set(value, { value, label, count: 1 });
  }
  return [...map.values()];
}

/**
 * Interconnected facets, as the handover describes: each control's options are counted
 * against every OTHER active filter, so a choice never removes itself from its own list.
 * Locations sort alphabetically (as in the video); types sort by count, then label.
 */
export function computeFacets(all: Property[], query: PropertyQuery): PropertyFacets {
  const forLocations = all.filter((p) => matchesFilters(p, query, "location"));
  const forTypes = all.filter((p) => matchesFilters(p, query, "type"));
  const forPrice = all.filter((p) => matchesFilters(p, query, "price"));

  const locations = countBy(forLocations, (p) => ({ value: p.location, label: p.location })).sort((a, b) =>
    a.label.localeCompare(b.label, "en", { sensitivity: "base" }),
  );
  const types = countBy(forTypes, (p) => ({ value: p.typeSlug, label: p.typeLabel })).sort(
    (a, b) => b.count - a.count || a.label.localeCompare(b.label, "en", { sensitivity: "base" }),
  );

  const prices = forPrice.map((p) => p.priceInr);
  const priceRange = prices.length > 0 ? { min: Math.min(...prices), max: Math.max(...prices) } : null;

  return { locations, types, priceRange };
}

/** Filters, paginates and computes facets over a complete list. Used by the mock provider. */
export function queryProperties(all: Property[], query: PropertyQuery): PropertyListResult {
  const matching = all.filter((p) => matchesFilters(p, query));
  const pageSize = Math.max(1, query.pageSize);
  const totalPages = Math.max(1, Math.ceil(matching.length / pageSize));
  const page = Math.min(Math.max(1, query.page), totalPages);
  const start = (page - 1) * pageSize;
  return {
    items: matching.slice(start, start + pageSize),
    total: matching.length,
    page,
    pageSize,
    totalPages,
    facets: computeFacets(all, query),
  };
}

type RawParams = Record<string, string | string[] | undefined>;

function toArray(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return (Array.isArray(value) ? value : [value]).map((v) => v.trim()).filter((v) => v !== "");
}

/** Parses "₹13,90,000", "1390000" or "13.9" (invalid) into rupees, or undefined. */
export function parseRupees(value: string | string[] | undefined): number | undefined {
  const first = Array.isArray(value) ? value[0] : value;
  if (!first) return undefined;
  const digits = first.replace(/[^\d]/g, "");
  if (digits === "") return undefined;
  const n = Number(digits);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Reads the listing page's URL parameters. Names match the video:
 * minPrice, maxPrice, location, type (plus page, which is my addition).
 * Repeated parameters mean several selections; that multi-select URL form is INFERRED.
 */
export function parsePropertySearchParams(params: RawParams, pageSize = DEFAULT_PAGE_SIZE): PropertyQuery {
  const pageNumber = Number(toArray(params.page)[0]);
  return {
    locations: toArray(params.location),
    types: toArray(params.type).map((t) => t.toLowerCase()),
    minPrice: parseRupees(params.minPrice),
    maxPrice: parseRupees(params.maxPrice),
    page: Number.isInteger(pageNumber) && pageNumber > 0 ? pageNumber : 1,
    pageSize,
  };
}

/** Builds a /properties URL for a query. Empty filters are omitted. */
export function buildPropertiesUrl(query: Partial<Pick<PropertyQuery, "locations" | "types" | "minPrice" | "maxPrice" | "page">>): string {
  const search = new URLSearchParams();
  for (const type of query.types ?? []) search.append("type", type);
  for (const location of query.locations ?? []) search.append("location", location);
  if (query.minPrice !== undefined) search.set("minPrice", String(query.minPrice));
  if (query.maxPrice !== undefined) search.set("maxPrice", String(query.maxPrice));
  if (query.page && query.page > 1) search.set("page", String(query.page));
  const qs = search.toString();
  return qs ? `/properties?${qs}` : "/properties";
}

/** Page numbers with ellipses, e.g. [1, "…", 4, 5, 6, "…", 12]. */
export function paginationItems(current: number, total: number): Array<number | "…"> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set<number>([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const result: Array<number | "…"> = [];
  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) result.push("…");
    result.push(page);
  });
  return result;
}

/** Budget bands used by the enquiry form. Boundaries are in rupees. */
export const BUDGET_BAND_BOUNDS = [
  { value: "under-25l", max: 2_500_000 },
  { value: "25-50l", max: 5_000_000 },
  { value: "50l-1cr", max: 10_000_000 },
  { value: "1-2cr", max: 20_000_000 },
  { value: "2cr-plus", max: Number.POSITIVE_INFINITY },
] as const;

/** The band containing a price; used to pre-select the budget on a property's enquiry form. */
export function budgetBandForPrice(priceInr: number): (typeof BUDGET_BAND_BOUNDS)[number]["value"] {
  const band = BUDGET_BAND_BOUNDS.find((b) => priceInr < b.max);
  return band ? band.value : "2cr-plus";
}
