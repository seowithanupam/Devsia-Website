import { queryProperties } from "../property-filters";
import type { Property, PropertyProvider, PropertyQuery, PropertyListResult } from "../types";
import { mockProperties } from "./properties";

/**
 * Local property provider backed by mock data. It stands in for PropDesk and follows the
 * same interface, so replacing it later does not touch any page or component.
 */
export function createMockPropertyProvider(source: Property[] = mockProperties): PropertyProvider {
  return {
    async getProperties(query: PropertyQuery): Promise<PropertyListResult> {
      return queryProperties(source, query);
    },
    async getProperty(slug: string): Promise<Property | null> {
      return source.find((p) => p.slug === slug) ?? null;
    },
  };
}
