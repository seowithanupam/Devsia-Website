import type { Article, ArticleListResult, ArticleQuery, CategoryCount } from "./types";

/** TEMPORARY page size. The original's is UNKNOWN (the video shows 7 articles on one page). */
export const ARTICLES_PAGE_SIZE = 9;

/** Newest first. */
export function sortByDateDesc(items: Article[]): Article[] {
  return [...items].sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : a.publishedAt > b.publishedAt ? -1 : 0));
}

/** Case-insensitive match on title, excerpt, category and tags. */
export function matchesSearch(article: Article, search: string): boolean {
  const needle = search.trim().toLowerCase();
  if (needle === "") return true;
  const haystack = [article.title, article.excerpt, article.category, ...article.tags].join(" ").toLowerCase();
  return haystack.includes(needle);
}

/**
 * Category chips: count descending, ties in order of first appearance among newest-first
 * articles. With the video's 8 articles this gives Investment 2, Legal & RERA 2, Market
 * note 1, Buyer guide 1, Home loans 1, Locality report 1, exactly as shown.
 */
export function categoryCounts(all: Article[]): CategoryCount[] {
  const map = new Map<string, CategoryCount>();
  for (const article of sortByDateDesc(all)) {
    const existing = map.get(article.categorySlug);
    if (existing) existing.count += 1;
    else map.set(article.categorySlug, { slug: article.categorySlug, label: article.category, count: 1 });
  }
  return [...map.values()]
    .map((c, index) => ({ c, index }))
    .sort((a, b) => b.c.count - a.c.count || a.index - b.index)
    .map(({ c }) => c);
}

/**
 * The grid shows every match. When no search or category is active, the featured article
 * is shown separately above the grid, so it is left out of the grid (the video shows
 * "All articles (8)" but "Showing 1–7 of 7 articles").
 */
export function queryArticles(all: Article[], query: ArticleQuery): ArticleListResult {
  const filtering = Boolean(query.search?.trim()) || Boolean(query.categorySlug);
  let matching = sortByDateDesc(all);
  if (query.categorySlug) matching = matching.filter((a) => a.categorySlug === query.categorySlug);
  if (query.search) matching = matching.filter((a) => matchesSearch(a, query.search as string));
  if (!filtering) matching = matching.filter((a) => !a.featured);

  const pageSize = Math.max(1, query.pageSize);
  const totalPages = Math.max(1, Math.ceil(matching.length / pageSize));
  const page = Math.min(Math.max(1, query.page), totalPages);
  const start = (page - 1) * pageSize;
  return { items: matching.slice(start, start + pageSize), total: matching.length, page, pageSize, totalPages };
}

/** Related reading: same category first, then newest, never the article itself. */
export function relatedArticles(all: Article[], slug: string, limit: number): Article[] {
  const current = all.find((a) => a.slug === slug);
  const others = sortByDateDesc(all).filter((a) => a.slug !== slug);
  const same = others.filter((a) => current && a.categorySlug === current.categorySlug);
  const rest = others.filter((a) => !same.includes(a));
  return [...same, ...rest].slice(0, limit);
}
