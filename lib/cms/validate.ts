/** Small, dependency-free input checks shared by every admin form and server action. */

export type FieldErrors = Record<string, string>;

// Control characters other than tab, newline and carriage return.
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

/** Trims, removes control characters and caps the length. Non-strings become "". */
export function cleanString(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.replace(CONTROL, "").replace(/\r\n/g, "\n").trim().slice(0, max);
}

export function cleanSingleLine(value: unknown, max: number): string {
  return cleanString(value, max).replace(/\s*\n\s*/g, " ");
}

/**
 * A link is safe when it is a site path, an in-page anchor, http(s), mailto or tel. This rules out
 * javascript: and data: URLs, and protocol-relative "//host" URLs.
 */
export function isSafeHref(value: string): boolean {
  if (value === "") return false;
  if (value.startsWith("//")) return false;
  if (value.startsWith("/") || value.startsWith("#")) return !/[\s\\]/.test(value);
  return /^(https?:\/\/[^\s]+|mailto:[^\s]+|tel:\+?[\d\s-]+)$/i.test(value);
}

/** Hosts whose images may be shown through next/image: this site and the Vercel Blob public store. */
export const BLOB_HOST_SUFFIX = ".public.blob.vercel-storage.com";

/**
 * A site image is a site path ("/images/...") or an https URL on the Vercel Blob store.
 * Other hosts are refused because next/image only allows configured hosts, and arbitrary URLs are a risk.
 */
export function isSafeImageUrl(value: string): boolean {
  if (value === "") return false;
  if (value.startsWith("/")) return !value.startsWith("//") && !/[\s\\]/.test(value);
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.endsWith(BLOB_HOST_SUFFIX);
  } catch {
    return false;
  }
}

/** Open Graph images are only meta tags, so any https URL or site path is fine. */
export function isSafeOgImageUrl(value: string): boolean {
  if (value === "") return false;
  if (value.startsWith("/")) return !value.startsWith("//") && !/[\s\\]/.test(value);
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

/** A canonical URL is a site path or an absolute https URL. */
export function isSafeCanonical(value: string): boolean {
  return isSafeOgImageUrl(value);
}

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export function isValidSlug(value: string): boolean {
  return value.length >= 1 && value.length <= 120 && SLUG_PATTERN.test(value);
}

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export function isValidEmail(value: string): boolean {
  return value.length <= 254 && EMAIL_PATTERN.test(value);
}

/** Escapes text for use inside a RegExp (admin search boxes). */
export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function hasErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
