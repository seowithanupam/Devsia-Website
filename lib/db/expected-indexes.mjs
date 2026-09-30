// The indexes the app relies on. ONE list, used by the app (creates any that are missing, at startup)
// and by scripts/db-check.mjs (reports on them, read-only). Written as .mjs so both can import it.
//
// `model` is the Mongoose model name; the collection name is worked out by Mongoose itself, so nothing here guesses it.
// `unique` indexes are REQUIRED (they stop duplicate emails, slugs and singleton documents).
// The others are for speed, and one expires old login counters.
// Creating an index never changes or deletes data. If duplicates already exist, a unique index simply cannot be built and is reported.

/** @typedef {{ model: string, keys: Record<string, 1 | -1>, unique?: boolean, expireAfterSeconds?: number }} ExpectedIndex */

/** @type {ExpectedIndex[]} */
export const EXPECTED_INDEXES = [
  { model: "User", keys: { email: 1 }, unique: true },
  { model: "Post", keys: { slug: 1 }, unique: true },
  { model: "Page", keys: { slug: 1 }, unique: true },
  { model: "Navigation", keys: { key: 1 }, unique: true },
  { model: "Settings", keys: { key: 1 }, unique: true },
  { model: "SeoTemplate", keys: { type: 1 }, unique: true },
  { model: "PropertySeoOverride", keys: { slug: 1 }, unique: true },
  { model: "LegalDocument", keys: { slug: 1 }, unique: true },
  { model: "Meta", keys: { key: 1 }, unique: true },
  { model: "LoginAttempt", keys: { key: 1 }, unique: true },
  { model: "LoginAttempt", keys: { expiresAt: 1 }, expireAfterSeconds: 0 },
  { model: "Post", keys: { status: 1, publishedAt: -1 } },
  { model: "Post", keys: { tags: 1 } },
  { model: "Lead", keys: { receivedAt: -1 } },
  { model: "AuditLog", keys: { at: -1 } },
  { model: "AuditLog", keys: { action: 1, at: -1 } },
  { model: "Media", keys: { createdAt: -1 } },
];
