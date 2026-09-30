import { companyLinks, legalLinks, primaryNav } from "@/lib/content/site";
import type { NavigationRecord, NavLinkRecord } from "./types";
import { cleanSingleLine, hasErrors, isSafeHref, type FieldErrors } from "./validate";

export const NAV_LIMITS = { header: 8, footer: 10, legal: 6 } as const;

/**
 * Navigation defaults are the links the Phase 2 header and footer already show.
 * The footer's "Properties" and "Localities" columns are NOT stored here: they mirror the live listings
 * (as in the original video), so only the company column and the bottom legal links are editable.
 */
export const DEFAULT_NAVIGATION: NavigationRecord = {
  header: primaryNav.map((l) => ({ ...l })),
  headerButtons: { associateLabel: "Become an associate", enquiryLabel: "Post your enquiry" },
  footerCompany: { title: "Company", links: companyLinks.map((l) => ({ ...l })) },
  legal: legalLinks.map((l) => ({ ...l })),
};

export function navigationFromRecord(record: Partial<NavigationRecord> | null | undefined): NavigationRecord {
  if (!record) return DEFAULT_NAVIGATION;
  return {
    header: record.header && record.header.length > 0 ? record.header : DEFAULT_NAVIGATION.header,
    // Saved before the header buttons were editable: fall back to the built-in labels.
    headerButtons: record.headerButtons && record.headerButtons.associateLabel && record.headerButtons.enquiryLabel ? record.headerButtons : DEFAULT_NAVIGATION.headerButtons,
    footerCompany: record.footerCompany && record.footerCompany.links.length > 0 ? record.footerCompany : DEFAULT_NAVIGATION.footerCompany,
    legal: record.legal && record.legal.length > 0 ? record.legal : DEFAULT_NAVIGATION.legal,
  };
}

function validateLinks(input: unknown, path: string, max: number, errors: FieldErrors): NavLinkRecord[] {
  const items = Array.isArray(input) ? input : [];
  if (items.length === 0) errors[path] = "Add at least one link.";
  if (items.length > max) errors[path] = `Use at most ${max} links.`;
  return items.slice(0, max).map((raw, index) => {
    const item = typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {};
    const label = cleanSingleLine(item.label, 40);
    const href = cleanSingleLine(item.href, 500);
    if (!label) errors[`${path}.${index}.label`] = "Enter the link text.";
    if (!href) errors[`${path}.${index}.href`] = "Enter where the link goes.";
    else if (!isSafeHref(href)) errors[`${path}.${index}.href`] = "Use a site path (starting with /), a full https:// link, mailto: or tel:.";
    return { label, href };
  });
}

export type NavValidation = { ok: true; value: NavigationRecord } | { ok: false; errors: FieldErrors };

export function validateNavigationInput(input: unknown): NavValidation {
  const errors: FieldErrors = {};
  const raw = typeof input === "object" && input !== null ? (input as Record<string, unknown>) : {};
  const footer = typeof raw.footerCompany === "object" && raw.footerCompany !== null ? (raw.footerCompany as Record<string, unknown>) : {};
  const title = cleanSingleLine(footer.title, 40);
  if (!title) errors["footerCompany.title"] = "Enter a column heading.";
  const buttons = typeof raw.headerButtons === "object" && raw.headerButtons !== null ? (raw.headerButtons as Record<string, unknown>) : {};
  const associateLabel = cleanSingleLine(buttons.associateLabel, 40);
  const enquiryLabel = cleanSingleLine(buttons.enquiryLabel, 40);
  if (!associateLabel) errors["headerButtons.associateLabel"] = "Enter the button text.";
  if (!enquiryLabel) errors["headerButtons.enquiryLabel"] = "Enter the button text.";
  const value: NavigationRecord = {
    header: validateLinks(raw.header, "header", NAV_LIMITS.header, errors),
    headerButtons: { associateLabel, enquiryLabel },
    footerCompany: { title, links: validateLinks(footer.links, "footerCompany.links", NAV_LIMITS.footer, errors) },
    legal: validateLinks(raw.legal, "legal", NAV_LIMITS.legal, errors),
  };
  return hasErrors(errors) ? { ok: false, errors } : { ok: true, value };
}
