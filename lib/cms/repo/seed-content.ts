import "server-only";
import { articles } from "@/lib/content/articles";
import { PAGE_DEFS, PAGE_SLUGS } from "@/lib/cms/blocks";
import { serializeBody } from "@/lib/cms/body-syntax";
import { DEFAULT_LEGAL_RECORDS } from "@/lib/cms/legal";
import { DEFAULT_NAVIGATION } from "@/lib/cms/nav";
import { DEFAULT_SETTINGS_RECORD } from "@/lib/cms/settings";
import { DEFAULT_PROPERTY_SEO_TEMPLATE } from "@/lib/cms/seo";
import { writeAuditDirect } from "@/lib/cms/repo/audit";
import { LegalModel, MetaModel, NavigationModel, PageModel, PostModel, SeoTemplateModel, SettingsModel } from "@/lib/db/models";

const SEEDED_KEY = "default-content-seeded";

export type SeedReport = { pages: number; posts: number; legal: number; navigation: number; settings: number; seoTemplate: number };

/**
 * First start only: loads the Phase 2 content into MongoDB so turning the CMS on changes nothing on the
 * public site. A marker is stored afterwards, so content an editor later deletes is never re-created
 * by a restart. (The admin "Restore missing defaults" button calls restoreMissingDefaults on purpose.)
 */
export async function seedDefaultContent(): Promise<SeedReport | "already-seeded"> {
  if (await MetaModel.exists({ key: SEEDED_KEY })) return "already-seeded";
  const report = await restoreMissingDefaults();
  await MetaModel.updateOne({ key: SEEDED_KEY }, { $setOnInsert: { key: SEEDED_KEY, value: new Date().toISOString() } }, { upsert: true });
  const total = Object.values(report).reduce((sum, n) => sum + n, 0);
  if (total > 0) {
    await writeAuditDirect({ actor: null, action: "content.seed", entityType: "content", summary: "Loaded the built-in site content on first start", meta: { ...report, firstStart: true } });
  }
  return report;
}

/**
 * Inserts whatever built-in content is missing and never overwrites an edit ($setOnInsert). Used by the
 * first-start setup and by the admin "Restore missing defaults" button.
 */
export async function restoreMissingDefaults(): Promise<SeedReport> {
  const report: SeedReport = { pages: 0, posts: 0, legal: 0, navigation: 0, settings: 0, seoTemplate: 0 };

  for (const slug of PAGE_SLUGS) {
    const def = PAGE_DEFS[slug];
    const blocks = def.defaults().map((b, order) => ({ type: b.type, order, enabled: true, data: b.data }));
    const r = await PageModel.updateOne({ slug }, { $setOnInsert: { slug, title: def.title, blocks, seo: {} } }, { upsert: true });
    report.pages += r.upsertedCount;
  }

  for (const a of articles) {
    const r = await PostModel.updateOne(
      { slug: a.slug },
      {
        $setOnInsert: {
          slug: a.slug,
          title: a.title,
          excerpt: a.excerpt,
          body: serializeBody(a.body),
          category: a.category,
          categorySlug: a.categorySlug,
          tags: a.tags,
          authorName: a.author.name,
          authorRole: a.author.role ?? "",
          coverUrl: a.cover.src,
          coverAlt: a.cover.alt,
          coverCaption: a.cover.caption ?? "",
          readMinutes: a.readMinutes,
          featured: a.featured,
          placeholderBody: a.placeholderBody,
          status: "published",
          publishedAt: new Date(`${a.publishedAt}T00:00:00.000Z`),
          seo: {},
        },
      },
      { upsert: true },
    );
    report.posts += r.upsertedCount;
  }

  for (const doc of DEFAULT_LEGAL_RECORDS) {
    const r = await LegalModel.updateOne({ slug: doc.slug }, { $setOnInsert: { ...doc } }, { upsert: true });
    report.legal += r.upsertedCount;
  }

  report.navigation = (await NavigationModel.updateOne({ key: "main" }, { $setOnInsert: { key: "main", ...DEFAULT_NAVIGATION } }, { upsert: true })).upsertedCount;
  report.settings = (await SettingsModel.updateOne({ key: "main" }, { $setOnInsert: { key: "main", ...DEFAULT_SETTINGS_RECORD } }, { upsert: true })).upsertedCount;
  report.seoTemplate = (await SeoTemplateModel.updateOne({ type: "property" }, { $setOnInsert: { type: "property", ...DEFAULT_PROPERTY_SEO_TEMPLATE } }, { upsert: true })).upsertedCount;
  return report;
}
