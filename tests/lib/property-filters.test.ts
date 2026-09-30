import { describe, expect, it } from "vitest";
import { mockProperties } from "@/lib/services/mock/properties";
import {
  EMPTY_QUERY,
  budgetBandForPrice,
  buildPropertiesUrl,
  computeFacets,
  paginationItems,
  parsePropertySearchParams,
  queryProperties,
} from "@/lib/services/property-filters";

describe("facets (match the walkthrough video)", () => {
  it("counts types and locations across all listings", () => {
    const facets = computeFacets(mockProperties, EMPTY_QUERY);
    expect(facets.types.map((t) => [t.label, t.count])).toEqual([
      ["Plot", 5],
      ["Farmhouse", 3],
    ]);
    expect(facets.locations.map((l) => [l.label, l.count])).toEqual([
      ["Ajmer Road", 3],
      ["Bhilwada Mega Highway", 2],
      ["Diggi Road", 2],
      ["jhadla , Diggi road", 1],
    ]);
    expect(facets.priceRange).toEqual({ min: 1_390_000, max: 9_520_000 });
  });

  it("narrows locations when a type is chosen", () => {
    const facets = computeFacets(mockProperties, { ...EMPTY_QUERY, types: ["plot"] });
    expect(facets.locations.map((l) => l.label)).not.toContain("Ajmer Road");
  });

  it("filters by type and location and keeps the chosen location listed", () => {
    const result = queryProperties(mockProperties, { ...EMPTY_QUERY, types: ["plot"], locations: ["Bhilwada Mega Highway"] });
    expect(result.total).toBe(2);
    expect(result.facets.locations.some((l) => l.label === "Bhilwada Mega Highway")).toBe(true);
  });

  it("filters by budget and paginates", () => {
    const result = queryProperties(mockProperties, { ...EMPTY_QUERY, minPrice: 3_000_000, maxPrice: 5_000_000, pageSize: 2 });
    expect(result.items.every((p) => p.priceInr >= 3_000_000 && p.priceInr <= 5_000_000)).toBe(true);
    expect(result.items.length).toBeLessThanOrEqual(2);
    expect(result.totalPages).toBe(Math.max(1, Math.ceil(result.total / 2)));
  });

  it("restricts to slugs for the wishlist", () => {
    const slug = mockProperties[0].slug;
    expect(queryProperties(mockProperties, { ...EMPTY_QUERY, slugs: [slug] }).items.map((p) => p.slug)).toEqual([slug]);
    expect(queryProperties(mockProperties, { ...EMPTY_QUERY, slugs: ["nope"] }).total).toBe(0);
  });
});

describe("URL parameters", () => {
  it("parses the video's parameter names and ignores blanks", () => {
    const query = parsePropertySearchParams({ location: "Diggi Road", type: "Plot", minPrice: "", maxPrice: "₹35,00,000" });
    expect(query.locations).toEqual(["Diggi Road"]);
    expect(query.types).toEqual(["plot"]);
    expect(query.minPrice).toBeUndefined();
    expect(query.maxPrice).toBe(3_500_000);
  });

  it("falls back to page 1 for bad page numbers", () => {
    expect(parsePropertySearchParams({ page: "-3" }).page).toBe(1);
    expect(parsePropertySearchParams({ page: "abc" }).page).toBe(1);
    expect(parsePropertySearchParams({ page: "3" }).page).toBe(3);
  });

  it("builds URLs and omits empty filters", () => {
    expect(buildPropertiesUrl({})).toBe("/properties");
    expect(buildPropertiesUrl({ types: ["plot"], locations: ["Bhilwada Mega Highway"], maxPrice: 3_500_000 })).toBe(
      "/properties?type=plot&location=Bhilwada+Mega+Highway&maxPrice=3500000",
    );
    expect(buildPropertiesUrl({ page: 1 })).toBe("/properties");
    expect(buildPropertiesUrl({ page: 2 })).toBe("/properties?page=2");
  });
});

describe("pagination and budget bands", () => {
  it("shows every page for short lists and ellipses for long ones", () => {
    expect(paginationItems(1, 3)).toEqual([1, 2, 3]);
    expect(paginationItems(6, 12)).toEqual([1, "…", 5, 6, 7, "…", 12]);
  });

  it("maps prices to enquiry budget bands", () => {
    expect(budgetBandForPrice(1_390_000)).toBe("under-25l");
    expect(budgetBandForPrice(4_433_000)).toBe("25-50l");
    expect(budgetBandForPrice(99_000_000)).toBe("2cr-plus");
  });
});
