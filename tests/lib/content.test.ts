import { describe, expect, it } from "vitest";
import { articles } from "@/lib/content/articles";
import { categoryCounts, queryArticles, relatedArticles } from "@/lib/content/article-queries";
import { createLocalContentProvider } from "@/lib/content/local-provider";
import { legalDocuments } from "@/lib/content/legal";

describe("articles", () => {
  it("has the 8 articles and category counts shown in the video", () => {
    expect(articles).toHaveLength(8);
    expect(categoryCounts(articles).map((c) => [c.label, c.count])).toEqual([
      ["Investment", 2],
      ["Legal & RERA", 2],
      ["Market note", 1],
      ["Buyer guide", 1],
      ["Home loans", 1],
      ["Locality report", 1],
    ]);
  });
  it("lists 7 under the featured article, and searches and filters", () => {
    expect(queryArticles(articles, { page: 1, pageSize: 9 }).total).toBe(7);
    expect(queryArticles(articles, { page: 1, pageSize: 9, categorySlug: "investment" }).total).toBe(2);
    expect(queryArticles(articles, { page: 1, pageSize: 9, search: "zzzz-no-match" }).total).toBe(0);
  });
  it("finds related reading without the article itself", () => {
    const related = relatedArticles(articles, "tonk-road-rate-catches-up", 3);
    expect(related).toHaveLength(3);
    expect(related.some((a) => a.slug === "tonk-road-rate-catches-up")).toBe(false);
  });
  it("flags every article whose body was not recovered", () => {
    const real = articles.filter((a) => !a.placeholderBody);
    expect(real.map((a) => a.slug)).toEqual(["tonk-road-rate-catches-up"]);
  });
  it("gives every heading in every article a unique id for the table of contents", () => {
    for (const article of articles) {
      const ids = article.body.flatMap((b) => (b.type === "h2" ? [b.id] : []));
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});

describe("content provider", () => {
  it("returns the pieces the pages need", async () => {
    const provider = createLocalContentProvider();
    expect(await provider.getArticle("does-not-exist")).toBeNull();
    expect((await provider.getUpcomingProjects()).length).toBeGreaterThan(0);
    expect((await provider.getAllArticleSlugs()).length).toBe(8);
    expect((await provider.getLatestArticles(3)).length).toBe(3);
  });
  it("has a Privacy policy and Terms of use for the single /legal page", () => {
    expect(legalDocuments.map((d) => d.id)).toEqual(["privacy", "terms"]);
  });
});
