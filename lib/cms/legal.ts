import { legalDocuments } from "@/lib/content/legal";
import type { LegalDocument } from "@/lib/content/types";
import { parseLegalSections, serializeLegalSections } from "./body-syntax";
import type { LegalRecord } from "./types";
import { cleanSingleLine, cleanString, hasErrors, type FieldErrors } from "./validate";

export const LEGAL_SLUGS = ["privacy", "terms"] as const;
export type LegalSlug = (typeof LEGAL_SLUGS)[number];

export function isLegalSlug(value: unknown): value is LegalSlug {
  return typeof value === "string" && (LEGAL_SLUGS as readonly string[]).includes(value);
}

export function legalRecordFromDocument(doc: LegalDocument): LegalRecord {
  return {
    slug: doc.id as LegalSlug,
    navLabel: doc.navLabel,
    title: doc.title,
    lastUpdated: doc.lastUpdated,
    intro: doc.intro,
    body: serializeLegalSections(doc.sections),
  };
}

export const DEFAULT_LEGAL_RECORDS: LegalRecord[] = legalDocuments.map(legalRecordFromDocument);

export function legalDocumentFromRecord(record: LegalRecord): LegalDocument | null {
  const parsed = parseLegalSections(record.body);
  if (!parsed.ok) return null;
  return { id: record.slug, navLabel: record.navLabel, title: record.title, lastUpdated: record.lastUpdated, intro: record.intro, sections: parsed.sections };
}

export type LegalValidation = { ok: true; value: Omit<LegalRecord, "slug"> } | { ok: false; errors: FieldErrors };

export function validateLegalInput(input: Record<string, unknown>): LegalValidation {
  const errors: FieldErrors = {};
  const navLabel = cleanSingleLine(input.navLabel, 40);
  const title = cleanSingleLine(input.title, 120);
  const lastUpdated = cleanSingleLine(input.lastUpdated, 40);
  const intro = cleanString(input.intro, 3000);
  const body = cleanString(input.body, 80_000);
  if (!navLabel) errors.navLabel = "Enter the menu label.";
  if (!title) errors.title = "Enter a title.";
  if (!lastUpdated) errors.lastUpdated = "Enter the last updated date (for example 1 September 2026).";
  if (!intro) errors.intro = "Enter the introduction.";
  const parsed = parseLegalSections(body);
  if (!parsed.ok) errors.body = parsed.error;
  return hasErrors(errors) ? { ok: false, errors } : { ok: true, value: { navLabel, title, lastUpdated, intro, body } };
}
