import type { SeoFields } from "@/lib/cms/types";

export type ArticleBlock =
  | { type: "p"; text: string }
  | { type: "h2"; id: string; text: string }
  | { type: "steps"; items: Array<{ title: string; text: string }> }
  | { type: "quote"; text: string }
  | { type: "table"; caption?: string; headers: string[]; rows: string[][] }
  | { type: "callout"; title: string; text: string }
  | { type: "ul"; items: string[] };

export type Article = {
  slug: string;
  title: string;
  excerpt: string;
  /** Display label, e.g. "Market note". */
  category: string;
  /** URL key used by the ?tag= filter, e.g. "market-note". */
  categorySlug: string;
  readMinutes: number;
  /** YYYY-MM-DD. */
  publishedAt: string;
  author: { name: string; role?: string };
  cover: { src: string; alt: string; caption?: string };
  featured: boolean;
  /** Small tags shown under the article, e.g. "Tonk Road plots". */
  tags: string[];
  body: ArticleBlock[];
  /** True when the original body text was not recovered and this is stand-in text. */
  placeholderBody: boolean;
  /** Per-article SEO saved in the CMS (title, description, canonical, Open Graph, robots). */
  seo?: SeoFields;
};

export type ArticleQuery = {
  search?: string;
  categorySlug?: string;
  page: number;
  pageSize: number;
};

export type CategoryCount = { slug: string; label: string; count: number };

export type ArticleListResult = {
  items: Article[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type UpcomingProject = {
  slug: string;
  name: string;
  /** e.g. "3 & 4 BHK apartments". */
  kind: string;
  location: string;
  description: string;
  status: string;
  statusTone: "gold" | "navy";
  priceLabel: string;
  facts?: Array<{ value: string; label: string }>;
  image: { src: string; alt: string };
};

export type LegalDocument = {
  id: string;
  navLabel: string;
  title: string;
  lastUpdated: string;
  intro: string;
  sections: Array<{ heading: string; paragraphs?: string[]; bullets?: string[] }>;
};

/** Content source for insights, legal text and pre-launch projects. Static now, MongoDB or CRM later. */
export interface ContentProvider {
  getArticles(query: ArticleQuery): Promise<ArticleListResult>;
  getArticle(slug: string): Promise<Article | null>;
  getLatestArticles(limit: number, excludeSlug?: string): Promise<Article[]>;
  getFeaturedArticle(): Promise<Article | null>;
  getCategories(): Promise<CategoryCount[]>;
  getRelatedArticles(slug: string, limit: number): Promise<Article[]>;
  getAllArticleSlugs(): Promise<string[]>;
  getLegalDocuments(): Promise<LegalDocument[]>;
  getUpcomingProjects(): Promise<UpcomingProject[]>;
}
