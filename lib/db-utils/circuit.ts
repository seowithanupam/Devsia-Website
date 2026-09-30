/**
 * "Database unavailable" pause.
 *
 * After a connection attempt fails, further attempts are skipped for a short time so that every page render
 * does not wait for a fresh 5-second timeout. Public pages fall back to the built-in content at once during
 * the pause, and the next attempt after it retries. Pure so it can be tested; the wiring is in lib/db/connection.ts.
 */
export const RETRY_AFTER_MS = 15_000;

/** True while a recent failure means "do not try again yet". */
export function shouldSkipAttempt(failedAt: number | null, now: number, retryAfterMs: number = RETRY_AFTER_MS): boolean {
  return failedAt !== null && now - failedAt < retryAfterMs;
}
