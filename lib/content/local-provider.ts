import { articles as defaultArticles } from "./articles";
import { categoryCounts, queryArticles, relatedArticles, sortByDateDesc } from "./article-queries";
import { legalDocuments } from "./legal";
import type { Article, ContentProvider } from "./types";
import { upcomingProjects } from "./upcoming";

/**
 * Content provider backed by local files. It has the shape a MongoDB-backed provider will
 * have, so the pages do not change when the CMS arrives (Phase for the admin CMS).
 */
export function createLocalContentProvider(source: Article[] = defaultArticles): ContentProvider {
  return {
    async getArticles(query) {
      return queryArticles(source, query);
    },
    async getArticle(slug) {
      return source.find((a) => a.slug === slug) ?? null;
    },
    async getLatestArticles(limit, excludeSlug) {
      return sortByDateDesc(source)
        .filter((a) => a.slug !== excludeSlug)
        .slice(0, limit);
    },
    async getFeaturedArticle() {
      return source.find((a) => a.featured) ?? null;
    },
    async getCategories() {
      return categoryCounts(source);
    },
    async getRelatedArticles(slug, limit) {
      return relatedArticles(source, slug, limit);
    },
    async getAllArticleSlugs() {
      return source.map((a) => a.slug);
    },
    async getLegalDocuments() {
      return legalDocuments;
    },
    async getUpcomingProjects() {
      return upcomingProjects;
    },
  };
}
