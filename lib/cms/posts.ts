import { PLACEHOLDER_BODY_NOTE } from "@/lib/content/articles";
import type { Article } from "@/lib/content/types";
import { slugify } from "@/lib/format";
import { parseBody } from "./body-syntax";
import { validateSeoInput } from "./seo";
import type { PostRecord, SeoFields } from "./types";
import { cleanSingleLine, cleanString, hasErrors, isSafeImageUrl, isValidSlug, type FieldErrors } from "./validate";

export const PLACEHOLDER_COVER = {
  src: "/mock/editorial-placeholder.svg",
  alt: "Placeholder photo",
  caption: "Placeholder photography — client imagery to replace.",
};

export function estimateReadMinutes(body: string): number {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.min(120, Math.max(1, Math.round(words / 200)));
}

/** "2026-08-24" from a Date or ISO string. */
export function isoDay(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toISOString().slice(0, 10);
}

/** Maps a stored post to the shape the public Insights pages already render. */
export function postToArticle(post: PostRecord): Article {
  const publishedAt = isoDay(post.publishedAt ?? post.createdAt ?? new Date(0));
  return {
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    category: post.category,
    categorySlug: post.categorySlug,
    readMinutes: post.readMinutes ?? estimateReadMinutes(post.body),
    publishedAt,
    author: { name: post.authorName, ...(post.authorRole ? { role: post.authorRole } : {}) },
    cover: post.coverUrl
      ? { src: post.coverUrl, alt: post.coverAlt || post.title, ...(post.coverCaption ? { caption: post.coverCaption } : {}) }
      : { ...PLACEHOLDER_COVER },
    featured: post.featured,
    tags: post.tags,
    body: parseBody(post.body),
    placeholderBody: post.placeholderBody,
    seo: post.seo,
  };
}

export { PLACEHOLDER_BODY_NOTE };

/** A post is public when published and its publish date has arrived. */
export function isPubliclyVisible(post: Pick<PostRecord, "status" | "publishedAt">, now: Date): boolean {
  return post.status === "published" && post.publishedAt !== null && new Date(post.publishedAt).getTime() <= now.getTime();
}

export type PostInput = {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  category: string;
  categorySlug: string;
  tags: string[];
  authorName: string;
  authorRole: string;
  coverUrl: string;
  coverAlt: string;
  coverCaption: string;
  readMinutes: number | null;
  featured: boolean;
  placeholderBody: boolean;
  /** YYYY-MM-DD or "". */
  publishedDate: string;
  seo: SeoFields;
};

export type PostValidation = { ok: true; value: PostInput } | { ok: false; errors: FieldErrors };

const asBool = (v: unknown) => v === true || v === "on" || v === "true" || v === "1";

export function validatePostInput(input: Record<string, unknown>): PostValidation {
  const errors: FieldErrors = {};

  const title = cleanSingleLine(input.title, 160);
  if (!title) errors.title = "Enter a title.";

  let slug = cleanSingleLine(input.slug, 120).toLowerCase();
  if (!slug) slug = slugify(title).slice(0, 120);
  if (!isValidSlug(slug)) errors.slug = "Use lowercase letters, numbers and single dashes (for example: tonk-road-rates).";

  const excerpt = cleanString(input.excerpt, 500);
  if (!excerpt) errors.excerpt = "Enter a short summary.";

  const body = cleanString(input.body, 60_000);
  if (!body) errors.body = "Write the article text.";

  const category = cleanSingleLine(input.category, 60);
  if (!category) errors.category = "Enter a category.";
  const categorySlug = slugify(category);
  if (category && !categorySlug) errors.category = "The category needs letters or numbers.";

  const tags = cleanSingleLine(input.tags, 400)
    .split(",")
    .map((t) => t.trim().slice(0, 40))
    .filter(Boolean);
  if (tags.length > 8) errors.tags = "Use at most 8 tags.";

  const authorName = cleanSingleLine(input.authorName, 80);
  if (!authorName) errors.authorName = "Enter the author's name.";
  const authorRole = cleanSingleLine(input.authorRole, 120);

  const coverUrl = cleanSingleLine(input.coverUrl, 600);
  const coverAlt = cleanSingleLine(input.coverAlt, 160);
  const coverCaption = cleanSingleLine(input.coverCaption, 200);
  if (coverUrl && !isSafeImageUrl(coverUrl)) errors.coverUrl = "Use a site image path (starting with /) or an image uploaded to the Media library.";
  if (coverUrl && !coverAlt) errors.coverAlt = "Describe the image for people who cannot see it.";

  const readRaw = cleanSingleLine(input.readMinutes, 6);
  let readMinutes: number | null = null;
  if (readRaw) {
    const n = Number(readRaw);
    if (!Number.isInteger(n) || n < 1 || n > 120) errors.readMinutes = "Enter whole minutes between 1 and 120, or leave blank.";
    else readMinutes = n;
  }

  const publishedDate = cleanSingleLine(input.publishedDate, 10);
  if (publishedDate && (!/^\d{4}-\d{2}-\d{2}$/.test(publishedDate) || Number.isNaN(new Date(publishedDate).getTime()))) {
    errors.publishedDate = "Use the date format YYYY-MM-DD.";
  }

  const seo = validateSeoInput(input, "seo.");
  if (!seo.ok) Object.assign(errors, seo.errors);

  if (hasErrors(errors) || !seo.ok) return { ok: false, errors };
  return {
    ok: true,
    value: {
      title,
      slug,
      excerpt,
      body,
      category,
      categorySlug,
      tags,
      authorName,
      authorRole,
      coverUrl,
      coverAlt,
      coverCaption,
      readMinutes,
      featured: asBool(input.featured),
      placeholderBody: asBool(input.placeholderBody),
      publishedDate,
      seo: seo.value,
    },
  };
}
