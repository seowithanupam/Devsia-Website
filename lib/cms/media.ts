import { cleanSingleLine } from "./validate";

/**
 * Upload limits. Vercel serverless functions accept request bodies up to about 4.5 MB, so uploads through the
 * admin server action are capped just under that. Larger files need the client-upload flow (a later change).
 */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

export type SniffedImage = { contentType: "image/jpeg" | "image/png" | "image/gif" | "image/webp" | "image/avif"; ext: "jpg" | "png" | "gif" | "webp" | "avif" };

/**
 * Identifies an image from its first bytes rather than trusting the filename or the browser's claim.
 * SVG is deliberately not accepted: an SVG can carry scripts.
 */
export function sniffImageType(bytes: Uint8Array): SniffedImage | null {
  const b = bytes;
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { contentType: "image/jpeg", ext: "jpg" };
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a) {
    return { contentType: "image/png", ext: "png" };
  }
  if (b.length >= 6 && b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38 && (b[4] === 0x37 || b[4] === 0x39) && b[5] === 0x61) {
    return { contentType: "image/gif", ext: "gif" };
  }
  if (b.length >= 12 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) {
    return { contentType: "image/webp", ext: "webp" };
  }
  if (b.length >= 12 && b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70 && b[8] === 0x61 && b[9] === 0x76 && b[10] === 0x69 && b[11] === 0x66) {
    return { contentType: "image/avif", ext: "avif" };
  }
  return null;
}

/** A storage-safe name: lowercase letters, numbers, dashes; extension replaced by the sniffed one. */
export function safeFilename(original: string, ext: string): string {
  const base = cleanSingleLine(original, 120)
    .replace(/\.[a-z0-9]{1,5}$/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${base || "image"}.${ext}`;
}
