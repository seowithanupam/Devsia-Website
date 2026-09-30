import { cleanSingleLine, hasErrors, isSafeCanonical, isSafeOgImageUrl, type FieldErrors } from "./validate";
import type { SeoFields, SeoTemplateRecord } from "./types";

/** Recommended lengths shown as hints in the editor. Longer text is allowed (search engines truncate it). */
export const SEO_TITLE_HINT = 60;
export const SEO_DESCRIPTION_HINT = 160;

const TITLE_MAX = 160;
const DESCRIPTION_MAX = 400;

const asBool = (v: unknown) => v === true || v === "on" || v === "true" || v === "1";

export type SeoValidation = { ok: true; value: SeoFields } | { ok: false; errors: FieldErrors };

/** Validates SEO fields submitted from a form (keys may be prefixed, e.g. prefix "seo."). Empty fields are dropped. */
export function validateSeoInput(input: Record<string, unknown>, prefix = ""): SeoValidation {
  const errors: FieldErrors = {};
  const get = (key: string) => input[`${prefix}${key}`];
  const value: SeoFields = {};

  const title = cleanSingleLine(get("title"), TITLE_MAX);
  if (title) value.title = title;
  const description = cleanSingleLine(get("description"), DESCRIPTION_MAX);
  if (description) value.description = description;

  const canonical = cleanSingleLine(get("canonical"), 500);
  if (canonical) {
    if (!isSafeCanonical(canonical)) errors[`${prefix}canonical`] = "Use a site path (starting with /) or a full https:// address.";
    else value.canonical = canonical;
  }

  const ogTitle = cleanSingleLine(get("ogTitle"), TITLE_MAX);
  if (ogTitle) value.ogTitle = ogTitle;
  const ogDescription = cleanSingleLine(get("ogDescription"), DESCRIPTION_MAX);
  if (ogDescription) value.ogDescription = ogDescription;

  const ogImage = cleanSingleLine(get("ogImage"), 600);
  if (ogImage) {
    if (!isSafeOgImageUrl(ogImage)) errors[`${prefix}ogImage`] = "Use a site path (starting with /) or a full https:// image address.";
    else value.ogImage = ogImage;
  }

  if (asBool(get("noIndex"))) value.noIndex = true;
  if (asBool(get("noFollow"))) value.noFollow = true;

  return hasErrors(errors) ? { ok: false, errors } : { ok: true, value };
}

/* ----------------------------- property template ----------------------------- */

/**
 * Tokens for the property SEO template. PROPOSAL: the handover says a template exists but the original token
 * names were not recovered, so these are new. They are replaced with the listing's own values.
 */
export const PROPERTY_SEO_TOKENS = ["title", "location", "city", "type", "price", "ref"] as const;
export type PropertySeoToken = (typeof PROPERTY_SEO_TOKENS)[number];

/** The template that reproduces the Phase 2 listing metadata exactly. Used until a template is saved. */
export const DEFAULT_PROPERTY_SEO_TEMPLATE: SeoTemplateRecord = {
  titleTemplate: "{title}, {location}",
  descriptionTemplate: "{type} for sale in {location}, {city}. {price}.",
  ogImage: "",
};

/** Names of the tokens used in a template that are not recognised. */
export function unknownTokens(template: string): string[] {
  const found = [...template.matchAll(/\{([^{}]*)\}/g)].map((m) => m[1]);
  return [...new Set(found.filter((name) => !(PROPERTY_SEO_TOKENS as readonly string[]).includes(name)))];
}

export function renderSeoTemplate(template: string, values: Record<PropertySeoToken, string>): string {
  return template
    .replace(/\{([a-z]+)\}/g, (whole, name: string) => ((PROPERTY_SEO_TOKENS as readonly string[]).includes(name) ? values[name as PropertySeoToken] : whole))
    .replace(/\s+/g, " ")
    .trim();
}

export type TemplateValidation = { ok: true; value: SeoTemplateRecord } | { ok: false; errors: FieldErrors };

export function validateSeoTemplateInput(input: Record<string, unknown>): TemplateValidation {
  const errors: FieldErrors = {};
  const titleTemplate = cleanSingleLine(input.titleTemplate, TITLE_MAX);
  const descriptionTemplate = cleanSingleLine(input.descriptionTemplate, DESCRIPTION_MAX);
  const ogImage = cleanSingleLine(input.ogImage, 600);

  if (!titleTemplate) errors.titleTemplate = "Enter a title template.";
  const badTitle = unknownTokens(titleTemplate);
  if (badTitle.length > 0) errors.titleTemplate = `Unknown placeholder: ${badTitle.map((t) => `{${t}}`).join(", ")}. Use ${PROPERTY_SEO_TOKENS.map((t) => `{${t}}`).join(", ")}.`;

  if (!descriptionTemplate) errors.descriptionTemplate = "Enter a description template.";
  const badDescription = unknownTokens(descriptionTemplate);
  if (badDescription.length > 0) errors.descriptionTemplate = `Unknown placeholder: ${badDescription.map((t) => `{${t}}`).join(", ")}. Use ${PROPERTY_SEO_TOKENS.map((t) => `{${t}}`).join(", ")}.`;

  if (ogImage && !isSafeOgImageUrl(ogImage)) errors.ogImage = "Use a site path (starting with /) or a full https:// image address.";

  return hasErrors(errors) ? { ok: false, errors } : { ok: true, value: { titleTemplate, descriptionTemplate, ogImage } };
}

/** Listing SEO: the per-listing override wins field by field, then the template fills the title and description. */
export function resolvePropertySeo({
  template,
  override,
  tokens,
}: {
  template: SeoTemplateRecord | null;
  override: SeoFields | null;
  tokens: Record<PropertySeoToken, string>;
}): SeoFields {
  const t = template ?? DEFAULT_PROPERTY_SEO_TEMPLATE;
  const fromTemplate: SeoFields = {
    title: renderSeoTemplate(t.titleTemplate, tokens),
    description: renderSeoTemplate(t.descriptionTemplate, tokens),
    ...(t.ogImage ? { ogImage: t.ogImage } : {}),
  };
  return { ...fromTemplate, ...(override ?? {}) };
}

/** Robots directive for metadata, or undefined when the defaults (index, follow) apply. */
export function robotsFor(seo: SeoFields | null | undefined): { index: boolean; follow: boolean } | undefined {
  if (!seo || (!seo.noIndex && !seo.noFollow)) return undefined;
  return { index: !seo.noIndex, follow: !seo.noFollow };
}
