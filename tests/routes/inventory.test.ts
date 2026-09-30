import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { companyLinks, legalLinks, primaryNav } from "@/lib/content/site";

const root = process.cwd();

/** Page files for the routes required by the handover (Phase 2 inventory). */
const REQUIRED_PAGES = [
  "app/(public)/page.tsx",
  "app/(public)/properties/page.tsx",
  "app/(public)/properties/[slug]/page.tsx",
  "app/(public)/new-projects/page.tsx",
  "app/(public)/insights/page.tsx",
  "app/(public)/insights/[slug]/page.tsx",
  "app/(public)/enquire/page.tsx",
  "app/(public)/associates/page.tsx",
  "app/(public)/about/page.tsx",
  "app/(public)/legal/page.tsx",
  "app/(public)/wishlist/page.tsx",
  "app/sitemap.ts",
  "app/robots.ts",
];

function pageExistsFor(href: string): boolean {
  const path = href.split("#")[0].split("?")[0];
  const file = path === "/" ? "app/(public)/page.tsx" : `app/(public)${path}/page.tsx`;
  return existsSync(join(root, file));
}

describe("route inventory", () => {
  it.each(REQUIRED_PAGES)("has %s", (file) => {
    expect(existsSync(join(root, file))).toBe(true);
  });

  it("points every header, footer and legal link at a real page", () => {
    for (const link of [...primaryNav, ...companyLinks, ...legalLinks]) {
      expect(pageExistsFor(link.href), `${link.label} -> ${link.href}`).toBe(true);
    }
  });

  it("has the API routes the handover lists", () => {
    for (const file of ["leads", "associates", "properties", "hello"]) {
      expect(existsSync(join(root, `app/api/v1/${file}/route.ts`))).toBe(true);
    }
  });
});
