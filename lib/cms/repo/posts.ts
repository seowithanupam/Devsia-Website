import "server-only";
import { getDb } from "@/lib/db";
import { PostModel, type PostDoc } from "@/lib/db/models";
import { escapeRegex } from "@/lib/cms/validate";
import type { PostInput } from "@/lib/cms/posts";
import type { PostRecord, PostStatus, SeoFields } from "@/lib/cms/types";

const isObjectId = (id: string) => /^[a-f0-9]{24}$/i.test(id);

export function toPostRecord(doc: PostDoc): PostRecord {
  return {
    id: String(doc._id),
    slug: doc.slug,
    title: doc.title,
    excerpt: doc.excerpt,
    body: doc.body,
    category: doc.category,
    categorySlug: doc.categorySlug,
    tags: doc.tags ?? [],
    authorName: doc.authorName,
    authorRole: doc.authorRole,
    coverUrl: doc.coverUrl,
    coverAlt: doc.coverAlt,
    coverCaption: doc.coverCaption,
    readMinutes: doc.readMinutes ?? null,
    featured: doc.featured,
    placeholderBody: doc.placeholderBody,
    status: doc.status,
    publishedAt: doc.publishedAt ? doc.publishedAt.toISOString() : null,
    seo: JSON.parse(JSON.stringify(doc.seo ?? {})) as SeoFields,
    createdAt: doc.createdAt?.toISOString(),
    updatedAt: doc.updatedAt?.toISOString(),
  };
}

export async function listPosts({ q, status, page, pageSize }: { q?: string; status?: PostStatus; page: number; pageSize: number }) {
  await getDb();
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (q) {
    const rx = { $regex: escapeRegex(q), $options: "i" };
    filter.$or = [{ title: rx }, { slug: rx }, { category: rx }, { tags: rx }, { authorName: rx }];
  }
  const [total, docs] = await Promise.all([
    PostModel.countDocuments(filter),
    PostModel.find(filter).sort({ updatedAt: -1 }).skip((page - 1) * pageSize).limit(pageSize).lean<PostDoc[]>(),
  ]);
  return { total, items: docs.map(toPostRecord) };
}

export async function postCounts(): Promise<{ published: number; draft: number }> {
  await getDb();
  const [published, draft] = await Promise.all([PostModel.countDocuments({ status: "published" }), PostModel.countDocuments({ status: "draft" })]);
  return { published, draft };
}

export async function getPost(id: string): Promise<PostRecord | null> {
  await getDb();
  if (!isObjectId(id)) return null;
  const doc = await PostModel.findById(id).lean<PostDoc>();
  return doc ? toPostRecord(doc) : null;
}

export async function slugTaken(slug: string, exceptId?: string): Promise<boolean> {
  await getDb();
  const doc = await PostModel.findOne({ slug }, { _id: 1 }).lean<{ _id: unknown }>();
  return Boolean(doc && String(doc._id) !== exceptId);
}

function fieldsFrom(input: PostInput) {
  return {
    slug: input.slug,
    title: input.title,
    excerpt: input.excerpt,
    body: input.body,
    category: input.category,
    categorySlug: input.categorySlug,
    tags: input.tags,
    authorName: input.authorName,
    authorRole: input.authorRole,
    coverUrl: input.coverUrl,
    coverAlt: input.coverAlt,
    coverCaption: input.coverCaption,
    readMinutes: input.readMinutes,
    featured: input.featured,
    placeholderBody: input.placeholderBody,
    seo: input.seo,
  };
}

/** Only one article can be featured at a time. */
async function keepSingleFeatured(exceptId: string) {
  await PostModel.updateMany({ _id: { $ne: exceptId }, featured: true }, { $set: { featured: false } });
}

export async function createPost(input: PostInput, publishedAt: Date | null, status: PostStatus, actor: string): Promise<PostRecord> {
  await getDb();
  const doc = await PostModel.create({ ...fieldsFrom(input), status, publishedAt, createdBy: actor, updatedBy: actor });
  if (input.featured) await keepSingleFeatured(String(doc._id));
  return toPostRecord(doc.toObject() as PostDoc);
}

export async function updatePost(id: string, input: PostInput, patch: { status?: PostStatus; publishedAt?: Date | null }, actor: string): Promise<PostRecord | null> {
  await getDb();
  if (!isObjectId(id)) return null;
  const doc = await PostModel.findByIdAndUpdate(id, { $set: { ...fieldsFrom(input), ...patch, updatedBy: actor } }, { new: true }).lean<PostDoc>();
  if (doc && input.featured) await keepSingleFeatured(id);
  return doc ? toPostRecord(doc) : null;
}

export async function deletePost(id: string): Promise<boolean> {
  await getDb();
  if (!isObjectId(id)) return false;
  const result = await PostModel.deleteOne({ _id: id });
  return result.deletedCount === 1;
}

/** Every post that is public right now (published, publish date reached). Used by the public site. */
export async function listPublicPosts(now: Date): Promise<PostRecord[]> {
  await getDb();
  const docs = await PostModel.find({ status: "published", publishedAt: { $ne: null, $lte: now } }).sort({ publishedAt: -1 }).lean<PostDoc[]>();
  return docs.map(toPostRecord);
}
