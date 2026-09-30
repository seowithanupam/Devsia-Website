/**
 * Domain types for the property experience.
 *
 * IMPORTANT: this is the shape the WEBSITE needs, derived from the walkthrough video.
 * It is NOT the PropDesk response shape (the vendor PDF documents no response body).
 * When the CRM is integrated, an adapter maps PropDesk records into these types, so
 * the UI does not change.
 */

export type PropertyImage = { src: string; alt: string };

export type Property = {
  id: string;
  slug: string;
  /** Shown on cards, e.g. "DS-136BBB6F". */
  referenceCode: string;
  title: string;
  /** Lowercase key used in URLs and filters, e.g. "plot". */
  typeSlug: string;
  /** Display label, e.g. "Plot". */
  typeLabel: string;
  city: string;
  /** Raw location text exactly as provided, e.g. "jhadla , Diggi road". */
  location: string;
  /** Price in rupees. */
  priceInr: number;
  /** e.g. "Fixed price". */
  priceType?: string;
  area?: { value: number; unit: string };
  /** e.g. "30X50". */
  dimensions?: string;
  dimensionsUnit?: string;
  description: string;
  amenities: string[];
  images: PropertyImage[];
  facing?: string;
  /** e.g. "For sale". */
  listingType: string;
  /** e.g. "Available". */
  status: string;
  isNewListing: boolean;
  featured: boolean;
  /** e.g. "JDA Scheme". */
  approval?: string;
  address?: string;
  roadAccess?: string;
  mapsUrl?: string;
};

export type PropertyQuery = {
  /** Selected location labels. Empty means any. */
  locations: string[];
  /** Selected type slugs. Empty means any. */
  types: string[];
  minPrice?: number;
  maxPrice?: number;
  featuredOnly?: boolean;
  /** Restrict to these slugs (used by the wishlist). */
  slugs?: string[];
  page: number;
  pageSize: number;
};

export type FacetOption = { value: string; label: string; count: number };

export type PropertyFacets = {
  locations: FacetOption[];
  types: FacetOption[];
  /** Cheapest and dearest listing among items matching the location and type filters. */
  priceRange: { min: number; max: number } | null;
};

export type PropertyListResult = {
  items: Property[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  facets: PropertyFacets;
};

/** The single integration point for property data. Mock now, PropDesk later. */
export interface PropertyProvider {
  getProperties(query: PropertyQuery): Promise<PropertyListResult>;
  /** Returns null when no listing has this slug. */
  getProperty(slug: string): Promise<Property | null>;
}
