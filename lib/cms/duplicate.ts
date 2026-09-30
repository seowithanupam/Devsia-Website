/**
 * Turns a MongoDB duplicate-key error (code 11000) into a message an editor can act on.
 * The admin forms already check for duplicates first; this covers the rare case of two people saving at the same moment,
 * and a unique index catching something the checks missed.
 */
export type DuplicateKey = { field: string; message: string };

const MESSAGES: Record<string, string> = {
  email: "An account with that email already exists.",
  slug: "Another item already uses that web address (slug). Choose a different one.",
};

export function describeDuplicateKey(error: unknown): DuplicateKey | null {
  if (typeof error !== "object" || error === null) return null;
  const e = error as { code?: unknown; keyPattern?: unknown; message?: unknown };
  if (e.code !== 11000) return null;

  let field = "";
  if (typeof e.keyPattern === "object" && e.keyPattern !== null) field = Object.keys(e.keyPattern)[0] ?? "";
  if (!field && typeof e.message === "string") field = /index:\s+([A-Za-z0-9]+)_[-1]/.exec(e.message)?.[1] ?? "";

  return { field, message: MESSAGES[field] ?? "That value is already in use. Choose a different one." };
}
