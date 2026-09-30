import "server-only";
import { getDb } from "@/lib/db";
import {
  LegalModel,
  NavigationModel,
  PageModel,
  PropertySeoOverrideModel,
  SeoTemplateModel,
  SettingsModel,
  type LegalDoc,
  type NavigationDoc,
  type PageDoc,
  type PropertySeoOverrideDoc,
  type SeoTemplateDoc,
  type SettingsDoc,
} from "@/lib/db/models";
import { isBlockType, type BlockData, type StoredBlock } from "@/lib/cms/blocks";
import { DEFAULT_SETTINGS_RECORD } from "@/lib/cms/settings";
import type { LegalRecord, NavigationRecord, PageRecord, PropertySeoOverrideRecord, SeoFields, SeoTemplateRecord, SettingsRecord } from "@/lib/cms/types";

const clean = <T extends object>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

/* pages ------------------------------------------------------------------------------------------- */
function toPage(doc: PageDoc): PageRecord {
  return {
    slug: doc.slug,
    title: doc.title,
    blocks: (doc.blocks ?? [])
      .filter((b) => isBlockType(b.type))
      .map((b) => ({ type: b.type as StoredBlock["type"], order: b.order ?? 0, enabled: b.enabled !== false, data: (b.data ?? {}) as BlockData })),
    seo: clean((doc.seo ?? {}) as SeoFields),
    updatedBy: doc.updatedBy,
    updatedAt: doc.updatedAt?.toISOString(),
  };
}

export async function getPage(slug: string): Promise<PageRecord | null> {
  await getDb();
  const doc = await PageModel.findOne({ slug }).lean<PageDoc>();
  return doc ? toPage(doc) : null;
}

export async function listPages(): Promise<PageRecord[]> {
  await getDb();
  return (await PageModel.find({}).lean<PageDoc[]>()).map(toPage);
}

export async function savePageBlocks(slug: string, title: string, blocks: StoredBlock[], updatedBy: string): Promise<void> {
  await getDb();
  await PageModel.updateOne({ slug }, { $set: { title, blocks, updatedBy }, $setOnInsert: { slug, seo: {} } }, { upsert: true });
}

export async function savePageSeo(slug: string, title: string, seo: SeoFields, updatedBy: string): Promise<void> {
  await getDb();
  await PageModel.updateOne({ slug }, { $set: { seo, updatedBy }, $setOnInsert: { slug, title, blocks: [] } }, { upsert: true });
}

/** Restores a page's blocks to the built-in defaults, keeping its SEO. */
export async function resetPageBlocks(slug: string, title: string, blocks: StoredBlock[], updatedBy: string): Promise<void> {
  await savePageBlocks(slug, title, blocks, updatedBy);
}

/* navigation -------------------------------------------------------------------------------------- */
/** Returns what is stored. A record saved before the header buttons were editable has no `headerButtons`; navigationFromRecord fills it in. */
export async function getNavigationRecord(): Promise<Partial<NavigationRecord> | null> {
  await getDb();
  const doc = await NavigationModel.findOne({ key: "main" }).lean<NavigationDoc>();
  if (!doc) return null;
  return clean({
    header: doc.header ?? [],
    ...(doc.headerButtons?.associateLabel && doc.headerButtons?.enquiryLabel ? { headerButtons: { associateLabel: doc.headerButtons.associateLabel, enquiryLabel: doc.headerButtons.enquiryLabel } } : {}),
    footerCompany: doc.footerCompany ?? { title: "Company", links: [] },
    legal: doc.legal ?? [],
  });
}

export async function saveNavigationRecord(value: NavigationRecord, updatedBy: string): Promise<void> {
  await getDb();
  await NavigationModel.updateOne({ key: "main" }, { $set: { ...value, updatedBy }, $setOnInsert: { key: "main" } }, { upsert: true });
}

/* settings ---------------------------------------------------------------------------------------- */
export async function getSettingsRecord(): Promise<Partial<SettingsRecord> | null> {
  await getDb();
  const doc = await SettingsModel.findOne({ key: "main" }).lean<SettingsDoc>();
  if (!doc) return null;
  const out: Partial<SettingsRecord> = {};
  for (const key of Object.keys(DEFAULT_SETTINGS_RECORD) as Array<keyof SettingsRecord>) {
    const value = doc[key];
    if (typeof value === "string") out[key] = value;
  }
  return out;
}

export async function saveSettingsRecord(value: SettingsRecord, updatedBy: string): Promise<void> {
  await getDb();
  await SettingsModel.updateOne({ key: "main" }, { $set: { ...value, updatedBy }, $setOnInsert: { key: "main" } }, { upsert: true });
}

/* SEO --------------------------------------------------------------------------------------------- */
export async function getSeoTemplate(type = "property"): Promise<SeoTemplateRecord | null> {
  await getDb();
  const doc = await SeoTemplateModel.findOne({ type }).lean<SeoTemplateDoc>();
  return doc ? { titleTemplate: doc.titleTemplate, descriptionTemplate: doc.descriptionTemplate, ogImage: doc.ogImage ?? "" } : null;
}

export async function saveSeoTemplate(value: SeoTemplateRecord, updatedBy: string, type = "property"): Promise<void> {
  await getDb();
  await SeoTemplateModel.updateOne({ type }, { $set: { ...value, updatedBy }, $setOnInsert: { type } }, { upsert: true });
}

function toOverride(doc: PropertySeoOverrideDoc): PropertySeoOverrideRecord {
  return { slug: doc.slug, seo: clean((doc.seo ?? {}) as SeoFields), updatedBy: doc.updatedBy, updatedAt: doc.updatedAt?.toISOString() };
}

export async function getPropertySeoOverride(slug: string): Promise<PropertySeoOverrideRecord | null> {
  await getDb();
  const doc = await PropertySeoOverrideModel.findOne({ slug }).lean<PropertySeoOverrideDoc>();
  return doc ? toOverride(doc) : null;
}

export async function listPropertySeoOverrides(): Promise<PropertySeoOverrideRecord[]> {
  await getDb();
  return (await PropertySeoOverrideModel.find({}).lean<PropertySeoOverrideDoc[]>()).map(toOverride);
}

export async function savePropertySeoOverride(slug: string, seo: SeoFields, updatedBy: string): Promise<void> {
  await getDb();
  await PropertySeoOverrideModel.updateOne({ slug }, { $set: { seo, updatedBy }, $setOnInsert: { slug } }, { upsert: true });
}

export async function deletePropertySeoOverride(slug: string): Promise<void> {
  await getDb();
  await PropertySeoOverrideModel.deleteOne({ slug });
}

/* legal ------------------------------------------------------------------------------------------- */
function toLegal(doc: LegalDoc): LegalRecord {
  return { slug: doc.slug as LegalRecord["slug"], navLabel: doc.navLabel, title: doc.title, lastUpdated: doc.lastUpdated, intro: doc.intro, body: doc.body };
}

export async function listLegalRecords(): Promise<LegalRecord[]> {
  await getDb();
  const docs = await LegalModel.find({}).lean<LegalDoc[]>();
  // Privacy first, then terms, as on the public page.
  return docs.map(toLegal).sort((a, b) => (a.slug === "privacy" ? -1 : b.slug === "privacy" ? 1 : 0));
}

export async function getLegalRecord(slug: string): Promise<LegalRecord | null> {
  await getDb();
  const doc = await LegalModel.findOne({ slug }).lean<LegalDoc>();
  return doc ? toLegal(doc) : null;
}

export async function saveLegalRecord(slug: string, value: Omit<LegalRecord, "slug">, updatedBy: string): Promise<void> {
  await getDb();
  await LegalModel.updateOne({ slug }, { $set: { ...value, updatedBy }, $setOnInsert: { slug } }, { upsert: true });
}
