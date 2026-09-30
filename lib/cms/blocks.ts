import {
  aboutContact,
  aboutIntro,
  aboutServices,
  aboutValues,
  associateStrip,
  associatesPage,
  enquiryCta,
  enquirePage,
  insightsPage,
  highlightsCopy,
  homeHero,
  insightsPreviewCopy,
  localitiesCopy,
  trustStrip,
  upcomingCopy,
  whyDevsia,
} from "@/lib/content/pages";
import { upcomingProjects } from "@/lib/content/upcoming";
import { cleanSingleLine, cleanString, hasErrors, isSafeHref, isSafeImageUrl, type FieldErrors } from "./validate";

/**
 * Page blocks.
 *
 * The block names come from the Handover Documentation (section 02). The handover does NOT record each
 * block's fields, so the fields below are the ones the Phase 2 design actually shows. Every default is the
 * text the public site already displays, so turning the CMS on changes nothing until someone edits it.
 *
 * This file is pure (no database, no server-only imports) so the browser editor and the server validation
 * use exactly the same field definitions.
 */

export const BLOCK_TYPES = [
  "hero",
  "trust-strip",
  "highlights",
  "upcoming-projects",
  "localities",
  "why-devsia",
  "insights",
  "enquiry-cta",
  "associate-strip",
  "about-intro",
  "company-values",
  "company-services",
  "company-contact",
  "form-intro",
  "listing-hero",
  "new-projects-hero",
  // Added after the handover list, to make text that was hard-coded editable:
  "insights-hero",
  "enquire-side-panel",
] as const;
export type BlockType = (typeof BLOCK_TYPES)[number];

export function isBlockType(value: unknown): value is BlockType {
  return typeof value === "string" && (BLOCK_TYPES as readonly string[]).includes(value);
}

export type FieldDef =
  | { kind: "text"; key: string; label: string; max?: number; required?: boolean; hint?: string }
  | { kind: "textarea"; key: string; label: string; max?: number; rows?: number; required?: boolean; hint?: string }
  /** One item per line. Stored as string[]. */
  | { kind: "lines"; key: string; label: string; maxItems?: number; hint?: string }
  /** Paragraphs separated by a blank line. Stored as string[]. */
  | { kind: "paragraphs"; key: string; label: string; maxItems?: number; hint?: string }
  | { kind: "image"; key: string; label: string; required?: boolean; hint?: string }
  | { kind: "link"; key: string; label: string; required?: boolean; hint?: string }
  | { kind: "select"; key: string; label: string; options: Array<{ value: string; label: string }>; required?: boolean }
  | { kind: "list"; key: string; label: string; itemLabel: string; fields: FieldDef[]; min?: number; max: number }
  | { kind: "group"; key: string; label: string; fields: FieldDef[] };

export type BlockData = Record<string, unknown>;

export type BlockDef = {
  type: BlockType;
  label: string;
  help: string;
  fields: FieldDef[];
  defaults: () => BlockData;
};

const text = (key: string, label: string, extra: Partial<Extract<FieldDef, { kind: "text" }>> = {}): FieldDef => ({ kind: "text", key, label, ...extra });
const area = (key: string, label: string, extra: Partial<Extract<FieldDef, { kind: "textarea" }>> = {}): FieldDef => ({ kind: "textarea", key, label, ...extra });

const labelTitleDescription = (descriptionRequired = false): FieldDef[] => [
  text("label", "Small label above the title", { max: 60 }),
  text("title", "Title", { required: true, max: 160 }),
  area("description", "Description", { max: 500, rows: 3, required: descriptionRequired }),
];

const cardItems = (key: string, itemLabel: string, max: number): FieldDef => ({
  kind: "list",
  key,
  label: itemLabel,
  itemLabel,
  max,
  min: 1,
  fields: [text("title", "Title", { required: true, max: 80 }), area("text", "Text", { required: true, max: 400, rows: 2 })],
});

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export const BLOCK_DEFS: Record<BlockType, BlockDef> = {
  hero: {
    type: "hero",
    label: "Hero",
    help: "Home: main banner headline and paragraph. The search box under it is built from live listings.",
    fields: [text("title", "Headline", { required: true, max: 120 }), area("paragraph", "Paragraph", { required: true, max: 500, rows: 3 })],
    defaults: () => clone(homeHero),
  },
  "trust-strip": {
    type: "trust-strip",
    label: "Trust strip",
    help: "Home: the row of credibility statements under the hero. These are unverified claims, so confirm them before launch.",
    fields: [
      {
        kind: "list",
        key: "items",
        label: "Statements",
        itemLabel: "Statement",
        min: 1,
        max: 6,
        fields: [text("value", "Headline", { required: true, max: 60 }), text("caption", "Caption", { required: true, max: 100 })],
      },
    ],
    defaults: () => ({ items: clone(trustStrip) }),
  },
  highlights: {
    type: "highlights",
    label: "Highlights",
    help: "Home: featured listings. The listings themselves come from the CRM, so only the heading text is edited here. The section stays hidden while no listing is featured.",
    fields: labelTitleDescription(),
    defaults: () => clone(highlightsCopy),
  },
  "upcoming-projects": {
    type: "upcoming-projects",
    label: "Upcoming projects",
    help: "Home: pre-launch teaser. The three projects shown by default are PLACEHOLDERS from the original design, not real projects. Replace or remove them.",
    fields: [
      ...labelTitleDescription(),
      {
        kind: "list",
        key: "projects",
        label: "Projects",
        itemLabel: "Project",
        max: 6,
        fields: [
          text("slug", "Short id (letters, numbers, dashes)", { required: true, max: 60 }),
          text("name", "Name", { required: true, max: 80 }),
          text("kind", "Kind (e.g. 3 & 4 BHK apartments)", { required: true, max: 80 }),
          text("location", "Location", { required: true, max: 80 }),
          area("description", "Description", { required: true, max: 400, rows: 3 }),
          text("status", "Status badge (e.g. Pre-launch)", { required: true, max: 40 }),
          {
            kind: "select",
            key: "statusTone",
            label: "Badge colour",
            required: true,
            options: [
              { value: "gold", label: "Gold" },
              { value: "navy", label: "Navy" },
            ],
          },
          text("priceLabel", "Price label (e.g. ₹1.35 Cr onward)", { required: true, max: 40 }),
          { kind: "image", key: "imageSrc", label: "Image", required: true, hint: "A site image path or an upload from the Media library." },
          text("imageAlt", "Image description", { required: true, max: 160 }),
        ],
      },
    ],
    defaults: () => ({
      ...clone(upcomingCopy),
      projects: upcomingProjects.map((p) => ({
        slug: p.slug,
        name: p.name,
        kind: p.kind,
        location: p.location,
        description: p.description,
        status: p.status,
        statusTone: p.statusTone,
        priceLabel: p.priceLabel,
        imageSrc: p.image.src,
        imageAlt: p.image.alt,
      })),
    }),
  },
  localities: {
    type: "localities",
    label: "Localities",
    help: "Home: locality tiles. The tiles and their counts are built from live listings, so only the heading is edited here.",
    fields: [text("label", "Small label", { max: 60 }), text("title", "Title", { required: true, max: 160 })],
    defaults: () => clone(localitiesCopy),
  },
  "why-devsia": {
    type: "why-devsia",
    label: "Why DevSia",
    help: "Home: differentiators, a customer quote and credentials. The quote and credentials are unverified placeholders from the original.",
    fields: [
      text("label", "Small label", { max: 60 }),
      text("title", "Title", { required: true, max: 160 }),
      cardItems("points", "Points", 6),
      {
        kind: "group",
        key: "quote",
        label: "Customer quote",
        fields: [
          area("text", "Quote", { required: true, max: 400, rows: 3 }),
          text("name", "Name", { required: true, max: 80 }),
          text("caption", "Caption", { max: 120 }),
        ],
      },
      {
        kind: "list",
        key: "credentials",
        label: "Credentials",
        itemLabel: "Credential",
        max: 8,
        fields: [text("label", "Label", { required: true, max: 100 }), text("value", "Value", { required: true, max: 60 })],
      },
    ],
    defaults: () => clone(whyDevsia),
  },
  insights: {
    type: "insights",
    label: "Insights",
    help: "Home: latest articles. The articles are the newest published posts, so only the heading is edited here.",
    fields: [text("label", "Small label", { max: 60 }), text("title", "Title", { required: true, max: 160 })],
    defaults: () => clone(insightsPreviewCopy),
  },
  "enquiry-cta": {
    type: "enquiry-cta",
    label: "Enquiry call to action",
    help: "Home: the enquiry banner with promises and the panel that links to the enquiry form.",
    fields: [
      text("label", "Small label", { max: 60 }),
      text("title", "Title", { required: true, max: 160 }),
      area("description", "Description", { required: true, max: 400, rows: 3 }),
      { kind: "lines", key: "promises", label: "Promises", maxItems: 6, hint: "One promise per line." },
      text("panelTitle", "Panel heading", { required: true, max: 120 }),
      text("panelButton", "Panel button text", { required: true, max: 40 }),
    ],
    defaults: () => {
      const { label, title, description, promises, panelTitle, panelButton } = enquiryCta;
      return clone({ label, title, description, promises, panelTitle, panelButton });
    },
  },
  "associate-strip": {
    type: "associate-strip",
    label: "Associate strip",
    help: "Home: the red banner that recruits brokers and channel partners.",
    fields: [text("title", "Title", { required: true, max: 120 }), area("text", "Text", { required: true, max: 300, rows: 2 }), text("button", "Button text", { required: true, max: 40 })],
    defaults: () => clone(associateStrip),
  },
  "about-intro": {
    type: "about-intro",
    label: "About intro",
    help: "About: introduction, statistics and photo. The statistics are unverified claims from the original.",
    fields: [
      text("label", "Small label", { max: 60 }),
      text("title", "Title", { required: true, max: 160 }),
      { kind: "paragraphs", key: "paragraphs", label: "Paragraphs", maxItems: 6, hint: "Separate paragraphs with a blank line." },
      {
        kind: "list",
        key: "stats",
        label: "Statistics",
        itemLabel: "Statistic",
        max: 4,
        fields: [text("value", "Figure", { required: true, max: 40 }), text("caption", "Caption", { required: true, max: 100 })],
      },
      {
        kind: "group",
        key: "image",
        label: "Photo",
        fields: [
          { kind: "image", key: "src", label: "Image", required: true, hint: "The original photo was not recovered, so this is a placeholder until a real one is uploaded." },
          text("alt", "Image description", { required: true, max: 160 }),
        ],
      },
    ],
    defaults: () => clone(aboutIntro),
  },
  "company-values": {
    type: "company-values",
    label: "Company values",
    help: "About: the four values.",
    fields: [text("label", "Small label", { max: 60 }), text("title", "Title", { required: true, max: 160 }), cardItems("items", "Values", 8)],
    defaults: () => ({ label: "Our values", title: "How we work", items: clone(aboutValues) }),
  },
  "company-services": {
    type: "company-services",
    label: "Company services",
    help: "About: the services grid.",
    fields: [text("label", "Small label", { max: 60 }), text("title", "Title", { required: true, max: 160 }), cardItems("items", "Services", 9)],
    defaults: () => clone(aboutServices),
  },
  "company-contact": {
    type: "company-contact",
    label: "Company contact",
    help: "About: the navy contact panel heading. Phone, email and address come from Settings.",
    fields: [
      text("label", "Small label", { max: 60 }),
      text("title", "Title", { required: true, max: 160 }),
      area("text", "Text", { max: 300, rows: 2 }),
      text("successTitle", "Message shown after the contact form is sent: title", { required: true, max: 80 }),
      area("successText", "Message shown after the contact form is sent: text", { required: true, max: 300, rows: 2 }),
    ],
    defaults: () => clone(aboutContact),
  },
  "form-intro": {
    type: "form-intro",
    label: "Form introduction",
    help: "Enquire and Associates: the heading above the form, and the message shown after the form is sent.",
    fields: [
      text("label", "Small label", { max: 60 }),
      text("title", "Title", { required: true, max: 160 }),
      area("intro", "Introduction", { required: true, max: 400, rows: 3 }),
      text("successTitle", "Message shown after the form is sent: title", { required: true, max: 80 }),
      area("successText", "Message shown after the form is sent: text", { required: true, max: 300, rows: 3 }),
    ],
    defaults: () => ({ label: enquirePage.breadcrumb, title: enquirePage.title, intro: enquirePage.intro, successTitle: enquirePage.success.title, successText: enquirePage.success.text }),
  },
  "listing-hero": {
    type: "listing-hero",
    label: "Listing hero",
    help: "Properties: the page heading and breadcrumb text above the listing.",
    fields: [text("title", "Heading", { required: true, max: 120 }), text("breadcrumb", "Breadcrumb end text", { required: true, max: 60 })],
    defaults: () => ({ title: "Property for sale in Jaipur", breadcrumb: "Property for sale" }),
  },
  "new-projects-hero": {
    type: "new-projects-hero",
    label: "New projects hero",
    help: "New projects: the page heading. The page itself stays hidden (404) until the CRM supplies pre-launch data.",
    fields: labelTitleDescription(),
    defaults: () => clone(upcomingCopy),
  },
  "insights-hero": {
    type: "insights-hero",
    label: "Insights heading",
    help: "Insights: the page heading and introduction, and the message shown after a reader asks for a callback from an article.",
    fields: [
      text("label", "Small label", { max: 60 }),
      text("title", "Title", { required: true, max: 160 }),
      area("intro", "Introduction", { required: true, max: 400, rows: 3 }),
      text("callbackSuccessTitle", "Article callback form, message after it is sent: title", { required: true, max: 80 }),
      area("callbackSuccessText", "Article callback form, message after it is sent: text", { required: true, max: 300, rows: 2 }),
    ],
    defaults: () => clone(insightsPage),
  },
  "enquire-side-panel": {
    type: "enquire-side-panel",
    label: "Enquire side panel",
    help: "Enquire: the box beside the form that says what happens next. Each row is a label and a value. Statements here are promises to visitors, so keep them true.",
    fields: [
      {
        kind: "list",
        key: "rows",
        label: "Rows",
        itemLabel: "Row",
        min: 1,
        max: 8,
        fields: [
          text("label", "Label", { required: true, max: 60 }),
          text("value", "Value", { required: true, max: 80 }),
          {
            kind: "select",
            key: "tone",
            label: "Style",
            required: true,
            options: [
              { value: "normal", label: "Normal" },
              { value: "ok", label: "Highlighted (green)" },
            ],
          },
        ],
      },
    ],
    defaults: () => ({ rows: enquirePage.sidePanel.map((row) => ({ label: row.label, value: row.value, tone: "tone" in row ? row.tone : "normal" })) }),
  },
};

/* ------------------------------------------------------------------------------------------------ */
/* Pages                                                                                            */
/* ------------------------------------------------------------------------------------------------ */

export const PAGE_SLUGS = ["home", "about", "properties", "new-projects", "enquire", "associates", "insights", "legal"] as const;
export type PageSlug = (typeof PAGE_SLUGS)[number];

export function isPageSlug(value: unknown): value is PageSlug {
  return typeof value === "string" && (PAGE_SLUGS as readonly string[]).includes(value);
}

export type PageDef = {
  slug: PageSlug;
  title: string;
  path: string;
  /** Blocks this page may contain. Each block type appears at most once per page. */
  allowed: BlockType[];
  /** Blocks that cannot be removed or hidden, because the page would lose its heading. */
  required: BlockType[];
  /** Default blocks, in order, with their default data. */
  defaults: () => Array<{ type: BlockType; data: BlockData }>;
};

const dataOf = (type: BlockType) => BLOCK_DEFS[type].defaults();

export const PAGE_DEFS: Record<PageSlug, PageDef> = {
  home: {
    slug: "home",
    title: "Home",
    path: "/",
    allowed: ["hero", "trust-strip", "highlights", "upcoming-projects", "localities", "why-devsia", "insights", "enquiry-cta", "associate-strip"],
    required: ["hero"],
    defaults: () =>
      (["hero", "trust-strip", "highlights", "upcoming-projects", "localities", "why-devsia", "insights", "enquiry-cta", "associate-strip"] as BlockType[]).map((type) => ({
        type,
        data: dataOf(type),
      })),
  },
  about: {
    slug: "about",
    title: "About",
    path: "/about",
    allowed: ["about-intro", "company-values", "company-services", "company-contact"],
    required: ["about-intro"],
    defaults: () => (["about-intro", "company-values", "company-services", "company-contact"] as BlockType[]).map((type) => ({ type, data: dataOf(type) })),
  },
  properties: {
    slug: "properties",
    title: "Properties",
    path: "/properties",
    allowed: ["listing-hero"],
    required: ["listing-hero"],
    defaults: () => [{ type: "listing-hero", data: dataOf("listing-hero") }],
  },
  "new-projects": {
    slug: "new-projects",
    title: "New projects",
    path: "/new-projects",
    allowed: ["new-projects-hero"],
    required: ["new-projects-hero"],
    defaults: () => [{ type: "new-projects-hero", data: dataOf("new-projects-hero") }],
  },
  enquire: {
    slug: "enquire",
    title: "Enquire",
    path: "/enquire",
    allowed: ["form-intro", "enquire-side-panel"],
    required: ["form-intro", "enquire-side-panel"],
    defaults: () => [
      { type: "form-intro", data: dataOf("form-intro") },
      { type: "enquire-side-panel", data: dataOf("enquire-side-panel") },
    ],
  },
  associates: {
    slug: "associates",
    title: "Associates",
    path: "/associates",
    allowed: ["form-intro"],
    required: ["form-intro"],
    defaults: () => [
      {
        type: "form-intro",
        data: { label: "Forms", title: associatesPage.title, intro: associatesPage.intro, successTitle: associatesPage.success.title, successText: associatesPage.success.text },
      },
    ],
  },
  insights: {
    slug: "insights",
    title: "Insights",
    path: "/insights",
    allowed: ["insights-hero"],
    required: ["insights-hero"],
    defaults: () => [{ type: "insights-hero", data: dataOf("insights-hero") }],
  },
  legal: { slug: "legal", title: "Legal", path: "/legal", allowed: [], required: [], defaults: () => [] },
};

/** Pages that have editable blocks (the others have SEO fields only). */
export const EDITABLE_PAGE_SLUGS = PAGE_SLUGS.filter((slug) => PAGE_DEFS[slug].allowed.length > 0);

/* ------------------------------------------------------------------------------------------------ */
/* Validation                                                                                       */
/* ------------------------------------------------------------------------------------------------ */

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

function stringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string");
  if (typeof value === "string") return [value];
  return [];
}

/** Validates `input` against `fields`. Unknown keys are dropped. Errors are keyed by dotted path, e.g. "points.2.title". */
export function validateFields(fields: FieldDef[], input: unknown, path: string, errors: FieldErrors): BlockData {
  const source = isRecord(input) ? input : {};
  const out: BlockData = {};
  for (const field of fields) {
    const at = `${path}${field.key}`;
    const raw = source[field.key];
    switch (field.kind) {
      case "text": {
        const value = cleanSingleLine(raw, field.max ?? 200);
        if (field.required && value === "") errors[at] = "This is required.";
        out[field.key] = value;
        break;
      }
      case "textarea": {
        const value = cleanString(raw, field.max ?? 2000);
        if (field.required && value === "") errors[at] = "This is required.";
        out[field.key] = value;
        break;
      }
      case "lines": {
        const items = stringArray(raw).flatMap((s) => s.split("\n")).map((s) => cleanSingleLine(s, 300)).filter(Boolean);
        if (items.length > (field.maxItems ?? 12)) errors[at] = `Use at most ${field.maxItems ?? 12} lines.`;
        out[field.key] = items.slice(0, field.maxItems ?? 12);
        break;
      }
      case "paragraphs": {
        const items = stringArray(raw).map((s) => cleanString(s, 2000)).filter(Boolean);
        if (items.length > (field.maxItems ?? 8)) errors[at] = `Use at most ${field.maxItems ?? 8} paragraphs.`;
        out[field.key] = items.slice(0, field.maxItems ?? 8);
        break;
      }
      case "image": {
        const value = cleanSingleLine(raw, 600);
        if (value === "") {
          if (field.required) errors[at] = "Choose an image.";
        } else if (!isSafeImageUrl(value)) {
          errors[at] = "Use a site image path (starting with /) or an image uploaded to the Media library.";
        }
        out[field.key] = value;
        break;
      }
      case "link": {
        const value = cleanSingleLine(raw, 600);
        if (value === "") {
          if (field.required) errors[at] = "This is required.";
        } else if (!isSafeHref(value)) {
          errors[at] = "Use a site path (starting with /), a full https:// link, mailto: or tel:.";
        }
        out[field.key] = value;
        break;
      }
      case "select": {
        const value = cleanSingleLine(raw, 60);
        if (!field.options.some((o) => o.value === value)) {
          if (field.required || value !== "") errors[at] = "Choose one of the options.";
        }
        out[field.key] = value;
        break;
      }
      case "list": {
        const items = Array.isArray(raw) ? raw : [];
        if (items.length > field.max) errors[at] = `Use at most ${field.max} items.`;
        else if (field.min !== undefined && items.length < field.min) errors[at] = `Add at least ${field.min} item${field.min === 1 ? "" : "s"}.`;
        out[field.key] = items.slice(0, field.max).map((item, index) => validateFields(field.fields, item, `${at}.${index}.`, errors));
        break;
      }
      case "group": {
        out[field.key] = validateFields(field.fields, raw, `${at}.`, errors);
        break;
      }
    }
  }
  return out;
}

export type BlockValidation = { ok: true; data: BlockData } | { ok: false; errors: FieldErrors };

export function validateBlockData(type: BlockType, input: unknown): BlockValidation {
  const errors: FieldErrors = {};
  const data = validateFields(BLOCK_DEFS[type].fields, input, "", errors);
  return hasErrors(errors) ? { ok: false, errors } : { ok: true, data };
}

/** What the editor submits for a page: blocks in display order. */
export type BlockInput = { type: string; enabled?: boolean; data?: unknown };
export type StoredBlock = { type: BlockType; order: number; enabled: boolean; data: BlockData };

export type PageBlocksValidation = { ok: true; blocks: StoredBlock[] } | { ok: false; errors: FieldErrors };

/** Validates a whole page: allowed types, no duplicates, required blocks present and visible, every field valid. */
export function validatePageBlocks(slug: PageSlug, input: unknown): PageBlocksValidation {
  const def = PAGE_DEFS[slug];
  const errors: FieldErrors = {};
  if (!Array.isArray(input)) return { ok: false, errors: { _form: "The block list is missing." } };
  if (input.length > 30) return { ok: false, errors: { _form: "Too many blocks." } };

  const seen = new Set<string>();
  const blocks: StoredBlock[] = [];
  input.forEach((raw, index) => {
    const item = isRecord(raw) ? raw : {};
    const type = item.type;
    if (!isBlockType(type) || !def.allowed.includes(type)) {
      errors[`blocks.${index}`] = "This block is not allowed on this page.";
      return;
    }
    if (seen.has(type)) {
      errors[`blocks.${index}`] = "Each block can appear only once on a page.";
      return;
    }
    seen.add(type);
    const enabled = item.enabled !== false;
    if (!enabled && def.required.includes(type)) errors[`blocks.${index}`] = "This block is required and cannot be hidden.";
    const blockErrors: FieldErrors = {};
    const data = validateFields(BLOCK_DEFS[type].fields, item.data, "", blockErrors);
    for (const [key, message] of Object.entries(blockErrors)) errors[`blocks.${index}.${key}`] = message;
    blocks.push({ type, order: index, enabled, data });
  });
  for (const type of def.required) {
    if (!seen.has(type)) errors._form = `The ${BLOCK_DEFS[type].label} block is required.`;
  }
  return hasErrors(errors) ? { ok: false, errors } : { ok: true, blocks };
}

export type ResolvedBlock = { type: BlockType; data: BlockData };

/**
 * The blocks a public page should render. With no stored page the defaults are used. Stored data is layered
 * over the block's defaults so a field added later never shows as blank. Hidden blocks are dropped, and a
 * required block that is somehow missing is restored at the top.
 */
export function resolveBlocks(slug: PageSlug, stored: StoredBlock[] | null | undefined): ResolvedBlock[] {
  const def = PAGE_DEFS[slug];
  if (!stored || stored.length === 0) return def.defaults().map(({ type, data }) => ({ type, data }));
  const defaultsByType = new Map(def.defaults().map((b) => [b.type, b.data]));
  const resolved: ResolvedBlock[] = [...stored]
    .sort((a, b) => a.order - b.order)
    .filter((b) => isBlockType(b.type) && def.allowed.includes(b.type) && b.enabled !== false)
    .map((b) => ({ type: b.type, data: { ...(defaultsByType.get(b.type) ?? BLOCK_DEFS[b.type].defaults()), ...(isRecord(b.data) ? b.data : {}) } }));
  for (const type of [...def.required].reverse()) {
    if (!resolved.some((b) => b.type === type)) resolved.unshift({ type, data: defaultsByType.get(type) ?? BLOCK_DEFS[type].defaults() });
  }
  return resolved;
}

/** Finds one block's data on a page, or null. */
export function blockData<T = BlockData>(blocks: ResolvedBlock[], type: BlockType): T | null {
  const found = blocks.find((b) => b.type === type);
  return found ? (found.data as T) : null;
}

/* ---- Typed shapes the public components receive (validated data always has these keys) ---- */
export type HeroData = { title: string; paragraph: string };
export type TrustStripData = { items: Array<{ value: string; caption: string }> };
export type CopyData = { label?: string; title: string; description?: string };
export type UpcomingProjectsData = CopyData & {
  projects: Array<{ slug: string; name: string; kind: string; location: string; description: string; status: string; statusTone: "gold" | "navy"; priceLabel: string; imageSrc: string; imageAlt: string }>;
};
export type WhyDevsiaData = {
  label?: string;
  title: string;
  points: Array<{ title: string; text: string }>;
  quote: { text: string; name: string; caption?: string };
  credentials: Array<{ label: string; value: string }>;
};
export type EnquiryCtaData = { label?: string; title: string; description: string; promises: string[]; panelTitle: string; panelButton: string };
export type AssociateStripData = { title: string; text: string; button: string };
export type AboutIntroData = {
  label?: string;
  title: string;
  paragraphs: string[];
  stats: Array<{ value: string; caption: string }>;
  image: { src: string; alt: string };
};
export type CardsData = { label?: string; title: string; items: Array<{ title: string; text: string }> };
export type ContactCopyData = { label?: string; title: string; text?: string; successTitle: string; successText: string };
export type FormIntroData = { label?: string; title: string; intro: string; successTitle: string; successText: string };
export type InsightsHeroData = { label?: string; title: string; intro: string; callbackSuccessTitle: string; callbackSuccessText: string };
export type EnquirySidePanelData = { rows: Array<{ label: string; value: string; tone: "normal" | "ok" }> };
export type ListingHeroData = { title: string; breadcrumb: string };
