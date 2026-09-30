import "server-only";
import { getPageBlocks } from "@/lib/cms/public";
import { blockData, type UpcomingProjectsData } from "@/lib/cms/blocks";
import { legalDocumentFromRecord } from "@/lib/cms/legal";
import { postToArticle } from "@/lib/cms/posts";
import { listLegalRecords } from "@/lib/cms/repo/content";
import { listPublicPosts } from "@/lib/cms/repo/posts";
import { createLocalContentProvider } from "./local-provider";
import type { ContentProvider, LegalDocument, UpcomingProject } from "./types";

const fallback = createLocalContentProvider();

function logFallback(what: string, error: unknown) {
  console.error(`[cms] could not load ${what}; using built-in content:`, error instanceof Error ? error.message : "unknown error");
}

/**
 * Content provider backed by MongoDB. Articles are the published posts; legal text and the upcoming-projects
 * list come from their CMS records. It reuses the same query code as the local provider, so filtering,
 * search, categories and related reading behave exactly as before. If the database cannot be reached it
 * falls back to the built-in content and logs the reason.
 */
export function createCmsContentProvider(): ContentProvider {
  async function articleProvider() {
    const posts = await listPublicPosts(new Date());
    return createLocalContentProvider(posts.map(postToArticle));
  }

  async function withArticles<T>(what: string, run: (p: ContentProvider) => Promise<T>, backup: () => Promise<T>): Promise<T> {
    try {
      return await run(await articleProvider());
    } catch (error) {
      logFallback(what, error);
      return backup();
    }
  }

  return {
    getArticles: (q) => withArticles("articles", (p) => p.getArticles(q), () => fallback.getArticles(q)),
    getArticle: (slug) => withArticles("article", (p) => p.getArticle(slug), () => fallback.getArticle(slug)),
    getLatestArticles: (limit, excludeSlug) => withArticles("latest articles", (p) => p.getLatestArticles(limit, excludeSlug), () => fallback.getLatestArticles(limit, excludeSlug)),
    getFeaturedArticle: () => withArticles("featured article", (p) => p.getFeaturedArticle(), () => fallback.getFeaturedArticle()),
    getCategories: () => withArticles("categories", (p) => p.getCategories(), () => fallback.getCategories()),
    getRelatedArticles: (slug, limit) => withArticles("related articles", (p) => p.getRelatedArticles(slug, limit), () => fallback.getRelatedArticles(slug, limit)),
    getAllArticleSlugs: () => withArticles("article slugs", (p) => p.getAllArticleSlugs(), () => fallback.getAllArticleSlugs()),

    async getLegalDocuments(): Promise<LegalDocument[]> {
      try {
        const records = await listLegalRecords();
        const docs = records.map(legalDocumentFromRecord).filter((d): d is LegalDocument => d !== null);
        return docs.length > 0 ? docs : await fallback.getLegalDocuments();
      } catch (error) {
        logFallback("legal documents", error);
        return fallback.getLegalDocuments();
      }
    },

    async getUpcomingProjects(): Promise<UpcomingProject[]> {
      try {
        const data = blockData<UpcomingProjectsData>(await getPageBlocks("home"), "upcoming-projects");
        if (!data) return [];
        return data.projects.map((p) => ({
          slug: p.slug,
          name: p.name,
          kind: p.kind,
          location: p.location,
          description: p.description,
          status: p.status,
          statusTone: p.statusTone,
          priceLabel: p.priceLabel,
          image: { src: p.imageSrc, alt: p.imageAlt },
        }));
      } catch (error) {
        logFallback("upcoming projects", error);
        return fallback.getUpcomingProjects();
      }
    },
  };
}
