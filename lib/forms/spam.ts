/**
 * Spam protection, as the handover describes it: a hidden honeypot field and a minimum
 * fill time. A submission that fails either check is silently discarded (the visitor is
 * still shown success). Per-IP rate limits and duplicate-phone detection are also in the
 * handover; they are NOT built yet.
 *
 * The honeypot field name and the minimum fill time are UNKNOWN (never recorded).
 * The values here are TEMPORARY and can be changed in one place.
 */
export const HONEYPOT_FIELD = "website_url";
export const MIN_FILL_TIME_MS = 3000;
/** Anything older than this is treated as a stale form and rejected as suspicious. */
export const MAX_FORM_AGE_MS = 24 * 60 * 60 * 1000;

export type SpamCheckInput = {
  honeypot?: unknown;
  formStartedAt?: unknown;
  now: number;
};

export type SpamVerdict = { suspicious: false } | { suspicious: true; reason: "honeypot" | "too-fast" | "missing-timestamp" };

export function checkSpam({ honeypot, formStartedAt, now }: SpamCheckInput): SpamVerdict {
  if (typeof honeypot === "string" && honeypot.trim() !== "") return { suspicious: true, reason: "honeypot" };
  if (typeof formStartedAt !== "number" || !Number.isFinite(formStartedAt)) {
    return { suspicious: true, reason: "missing-timestamp" };
  }
  const elapsed = now - formStartedAt;
  if (elapsed < MIN_FILL_TIME_MS || elapsed > MAX_FORM_AGE_MS) return { suspicious: true, reason: "too-fast" };
  return { suspicious: false };
}
